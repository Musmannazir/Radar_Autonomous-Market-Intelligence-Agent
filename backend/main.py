import uuid
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Send
from graph.state import AgentState
from agents.planner import plan_research
from agents.researcher import research_question
from agents.verifier import verify_findings
from agents.writer import write_briefing
from tools.vector_store import filter_new_findings
from config import MAX_LLM_CALLS_PER_RUN


def planner_node(state: AgentState) -> dict:
    print("Planner running for:", state["watchlist_item"])
    questions = plan_research(state["watchlist_item"])
    print("Sub-questions:", questions)
    return {"sub_questions": questions}

def route_to_researchers(state: AgentState):
    return [Send("researcher", {"question": q}) for q in state["sub_questions"]]

def researcher_node(state: dict) -> dict:
    question = state["question"]
    print(f"Researcher running for: {question}")
    findings = research_question(question)
    print(f"  -> found {len(findings)} claims")
    return {"raw_findings": findings}


def verifier_node(state: AgentState) -> dict:
    findings = state["raw_findings"]
    # Cap total findings verified per run as a cost guard
    if len(findings) > MAX_LLM_CALLS_PER_RUN * 3:  # rough claims-per-source estimate
        print(f"[BUDGET] Capping findings from {len(findings)} to stay within budget")
        findings = findings[: MAX_LLM_CALLS_PER_RUN * 3]

    print(f"\nVerifier running on {len(findings)} raw findings...")
    verified, errors = verify_findings(findings)
    print(f"  -> {len(verified)} passed verification, {len(errors)} unverifiable (excluded)")
    return {"verified_findings": verified, "errors": errors}

def dedup_node(state: AgentState) -> dict:
    print(f"\nDedup running on {len(state['verified_findings'])} verified findings...")
    new_findings = filter_new_findings(state["verified_findings"], state["run_id"])
    print(f"  -> {len(new_findings)} are genuinely new")
    return {"new_findings": new_findings}

def writer_node(state: AgentState) -> dict:
    print(f"\nWriter composing briefing from {len(state['new_findings'])} new findings...")
    briefing = write_briefing(state["watchlist_item"], state["new_findings"])
    return {"briefing_draft": briefing}

builder = StateGraph(AgentState)
builder.add_node("planner", planner_node)
builder.add_node("researcher", researcher_node)
builder.add_node("verifier", verifier_node)
builder.add_node("dedup", dedup_node)
builder.add_node("writer", writer_node)

builder.set_entry_point("planner")
builder.add_conditional_edges("planner", route_to_researchers, ["researcher"])
builder.add_edge("researcher", "verifier")
builder.add_edge("verifier", "dedup")
builder.add_edge("dedup", "writer")
builder.add_edge("writer", END)

with SqliteSaver.from_conn_string("db/checkpoints.sqlite") as checkpointer:
    app = builder.compile(checkpointer=checkpointer)

    if __name__ == "__main__":
        run_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": run_id}}
        print("Run ID:", run_id)

        existing_state = app.get_state(config)
        if existing_state.values:
            print("Resuming from checkpoint...")
            result = app.invoke(None, config)
        else:
            print("Starting fresh run...")
            initial_state = {
                "run_id": run_id,
                "watchlist_item": "Open-source LLM releases and AI tooling",
                "sub_questions": [],
                "raw_findings": [],
                "verified_findings": [],
                "new_findings": [],
                "briefing_draft": "",
                "approval_status": "pending",
                "errors": [],
            }
            result = app.invoke(initial_state, config)

        print("\n" + "=" * 60)
        print("FINAL BRIEFING:")
        print("=" * 60)
        print(result["briefing_draft"])