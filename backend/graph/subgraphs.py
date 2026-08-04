"""
Subgraphs — each pipeline agent wrapped as a LangGraph subgraph.
The parent graph (supervisor.py) invokes these subgraphs sequentially.
"""
from langgraph.graph import StateGraph, END
from graph.state import AgentState, Finding


# ---------------------------------------------------------------------------
# Planner subgraph
# ---------------------------------------------------------------------------
def _planner_node(state: AgentState) -> dict:
    from agents.planner import plan_research
    from tools.run_events import append_run_event
    run_id = state.get("run_id", "")
    append_run_event(run_id, "planner", "running", f'Planning for: {state["watchlist_item"]}')
    questions = plan_research(state["watchlist_item"])
    append_run_event(run_id, "planner", "completed", f"Generated {len(questions)} research questions.", questions)
    return {"sub_questions": questions}


def build_planner_graph():
    g = StateGraph(AgentState)
    g.add_node("planner", _planner_node)
    g.set_entry_point("planner")
    g.add_edge("planner", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Researcher subgraph (one per question — invoked via Send by the parent)
# ---------------------------------------------------------------------------
class ResearcherState(dict):
    """Minimal state for a single researcher invocation."""
    run_id: str
    question: str
    raw_findings: list


def _researcher_node(state: dict) -> dict:
    from agents.researcher import research_question
    from tools.run_events import append_run_event
    question = state["question"]
    run_id = state.get("run_id", "")
    append_run_event(run_id, "researcher", "running", f"Researching: {question}")
    findings = research_question(question, run_id=run_id)
    append_run_event(
        run_id, "researcher", "completed",
        f"Found {len(findings)} claims.",
        {"question": question, "findings_count": len(findings)},
    )
    return {"raw_findings": findings}


def build_researcher_graph():
    g = StateGraph(dict)
    g.add_node("researcher", _researcher_node)
    g.set_entry_point("researcher")
    g.add_edge("researcher", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Verifier subgraph
# ---------------------------------------------------------------------------
def _verifier_node(state: AgentState) -> dict:
    from agents.verifier import verify_findings
    from tools.run_events import append_run_event
    from config import MAX_LLM_CALLS_PER_RUN
    run_id = state.get("run_id", "")
    findings = state["raw_findings"]
    if len(findings) > MAX_LLM_CALLS_PER_RUN * 3:
        findings = findings[: MAX_LLM_CALLS_PER_RUN * 3]
    append_run_event(run_id, "verifier", "running", f"Verifying {len(findings)} raw findings.")
    verified, errors = verify_findings(findings)
    append_run_event(
        run_id, "verifier", "completed",
        f"{len(verified)} verified, {len(errors)} errors.",
        {"verified_count": len(verified), "errors": errors},
    )
    return {"verified_findings": verified, "errors": errors}


def build_verifier_graph():
    g = StateGraph(AgentState)
    g.add_node("verifier", _verifier_node)
    g.set_entry_point("verifier")
    g.add_edge("verifier", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Dedup subgraph
# ---------------------------------------------------------------------------
def _dedup_node(state: AgentState) -> dict:
    from tools.vector_store import filter_new_findings
    from tools.run_events import append_run_event
    run_id = state.get("run_id", "")
    append_run_event(run_id, "dedup", "running", f"Dedup on {len(state['verified_findings'])} findings.")
    new_findings = filter_new_findings(state["verified_findings"], run_id)
    append_run_event(run_id, "dedup", "completed", f"{len(new_findings)} findings are new.")
    return {"new_findings": new_findings}


def build_dedup_graph():
    g = StateGraph(AgentState)
    g.add_node("dedup", _dedup_node)
    g.set_entry_point("dedup")
    g.add_edge("dedup", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Writer subgraph
# ---------------------------------------------------------------------------
def _writer_node(state: AgentState) -> dict:
    from agents.writer import write_briefing
    from tools.run_events import append_run_event
    from tools.run_events import record_cost
    run_id = state.get("run_id", "")
    append_run_event(run_id, "writer", "running", f"Writing briefing from {len(state['new_findings'])} findings.")
    briefing = write_briefing(state["watchlist_item"], state["new_findings"])
    record_cost(run_id, llm_calls=1)
    append_run_event(run_id, "writer", "completed", "Briefing draft composed.", {"preview": briefing[:500]})
    return {"briefing_draft": briefing}


def build_writer_graph():
    g = StateGraph(AgentState)
    g.add_node("writer", _writer_node)
    g.set_entry_point("writer")
    g.add_edge("writer", END)
    return g.compile()


# ---------------------------------------------------------------------------
# Deliverer subgraph
# ---------------------------------------------------------------------------
def _deliverer_node(state: AgentState) -> dict:
    from agents.deliverer import send_briefing_email
    from tools.run_events import append_run_event
    from langgraph.types import interrupt
    run_id = state.get("run_id", "")
    briefing = state["briefing_draft"]

    if not state["new_findings"]:
        append_run_event(run_id, "deliverer", "completed", "No new findings; skipping delivery.")
        return {"approval_status": "skipped_no_news"}

    append_run_event(run_id, "deliverer", "waiting_approval", "Briefing ready for human approval.")
    decision = interrupt({
        "briefing_draft": briefing,
        "message": "Review the briefing. Approve, edit, or reject.",
    })

    action = decision.get("action", "reject")
    if action == "approve":
        final_content = briefing
    elif action == "edit":
        final_content = decision.get("content", briefing)
    else:
        append_run_event(run_id, "deliverer", "completed", "Briefing rejected by human.")
        return {"approval_status": "rejected"}

    sent = send_briefing_email(subject=f"Radar Briefing: {state['watchlist_item']}", body=final_content)
    append_run_event(run_id, "deliverer", "completed", "Briefing delivered." if sent else "Send failed.")
    return {"approval_status": "approved" if sent else "send_failed"}


def build_deliverer_graph():
    g = StateGraph(AgentState)
    g.add_node("deliverer", _deliverer_node)
    g.set_entry_point("deliverer")
    g.add_edge("deliverer", END)
    return g.compile()
