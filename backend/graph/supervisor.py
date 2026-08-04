"""
Supervisor — orchestrates the pipeline by deciding which subgraph to invoke next.

The supervisor observes the current AgentState and determines the next step.
This is a rule-based supervisor (deterministic flow), but the architecture
allows swapping in an LLM-based supervisor for more dynamic routing.
"""
from graph.state import AgentState
from graph.subgraphs import (
    build_planner_graph,
    build_researcher_graph,
    build_verifier_graph,
    build_dedup_graph,
    build_writer_graph,
    build_deliverer_graph,
)


def supervisor_node(state: AgentState) -> dict:
    """
    Rule-based supervisor: observes the state and returns the next step.
    The pipeline is: planner → researcher(s) → verifier → dedup → writer → deliverer
    """
    if not state.get("sub_questions"):
        return {"next": "planner"}
    elif not state.get("verified_findings"):
        if state.get("raw_findings"):
            return {"next": "verifier"}
        return {"next": "researcher"}
    elif not state.get("new_findings"):
        return {"next": "dedup"}
    elif not state.get("briefing_draft"):
        return {"next": "writer"}
    elif state.get("approval_status") == "pending":
        return {"next": "deliverer"}
    else:
        return {"next": "__end__"}


def route_after_supervisor(state: AgentState) -> str:
    """Conditional edge: returns the next step name from the supervisor's output."""
    return state.get("next", "__end__")


def route_to_researchers(state: AgentState):
    """Fan-out: send each sub-question to a parallel researcher."""
    from langgraph.types import Send
    return [
        Send("researcher", {"run_id": state["run_id"], "question": q})
        for q in state.get("sub_questions", [])
    ]


# ---------------------------------------------------------------------------
# Build the compiled graph
# ---------------------------------------------------------------------------
_graph_cache = None
_checkpointer_cache = None


def build_graph():
    """
    Build and compile the full pipeline graph with supervisor orchestration.
    Returns (compiled_graph, checkpointer_context_manager).
    """
    global _graph_cache, _checkpointer_cache
    if _graph_cache is not None:
        return _graph_cache, _checkpointer_cache

    from langgraph.graph import StateGraph, END
    from langgraph.checkpoint.sqlite import SqliteSaver

    checkpointer_cm = SqliteSaver.from_conn_string("db/checkpoints.sqlite")
    checkpointer = checkpointer_cm.__enter__()

    # Compile subgraphs
    planner_app = build_planner_graph()
    researcher_app = build_researcher_graph()
    verifier_app = build_verifier_graph()
    dedup_app = build_dedup_graph()
    writer_app = build_writer_graph()
    deliverer_app = build_deliverer_graph()

    # Build the parent graph
    builder = StateGraph(AgentState)

    # Add subgraph nodes
    builder.add_node("planner", planner_app)
    builder.add_node("researcher", researcher_app)
    builder.add_node("verifier", verifier_app)
    builder.add_node("dedup", dedup_app)
    builder.add_node("writer", writer_app)
    builder.add_node("deliverer", deliverer_app)
    builder.add_node("supervisor", supervisor_node)

    # Entry → supervisor
    builder.set_entry_point("supervisor")
    builder.add_conditional_edges("supervisor", route_after_supervisor, {
        "planner": "planner",
        "researcher": "researcher",
        "verifier": "verifier",
        "dedup": "dedup",
        "writer": "writer",
        "deliverer": "deliverer",
        "__end__": END,
    })

    # After planner → fan-out to parallel researchers
    builder.add_conditional_edges("planner", route_to_researchers, ["researcher"])

    # After researcher(s) → back to supervisor
    builder.add_edge("researcher", "supervisor")

    # After verifier → back to supervisor
    builder.add_edge("verifier", "supervisor")

    # After dedup → back to supervisor
    builder.add_edge("dedup", "supervisor")

    # After writer → back to supervisor
    builder.add_edge("writer", "supervisor")

    # After deliverer → end
    builder.add_edge("deliverer", END)

    compiled = builder.compile(checkpointer=checkpointer)
    _graph_cache = compiled
    _checkpointer_cache = checkpointer_cm
    return compiled, checkpointer_cm
