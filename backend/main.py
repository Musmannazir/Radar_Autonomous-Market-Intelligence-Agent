import uuid
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.types import Send, interrupt, Command
from graph.state import AgentState
from agents.planner import plan_research
from agents.researcher import research_question
from agents.verifier import verify_findings
from agents.writer import write_briefing
from agents.deliverer import send_briefing_email
from tools.vector_store import filter_new_findings
from tools.run_events import append_run_event
from config import MAX_LLM_CALLS_PER_RUN


def planner_node(state: AgentState) -> dict:
    print("Planner running for:", state["watchlist_item"])
    append_run_event(state["run_id"], "planner", "running", f'Planner running for: {state["watchlist_item"]}')
    questions = plan_research(state["watchlist_item"])
    print("Sub-questions:", questions)
    append_run_event(
        state["run_id"],
        "planner",
        "completed",
        f"Generated {len(questions)} research questions.",
        questions,
    )
    return {"sub_questions": questions}


def route_to_researchers(state: AgentState):
    return [Send("researcher", {"run_id": state["run_id"], "question": q}) for q in state["sub_questions"]]


def researcher_node(state: dict) -> dict:
    question = state["question"]
    print(f"Researcher running for: {question}")
    append_run_event(state["run_id"], "researcher", "running", f"Researcher running for: {question}")
    findings = research_question(question)
    print(f"  -> found {len(findings)} claims")
    append_run_event(
        state["run_id"],
        "researcher",
        "completed",
        f"Found {len(findings)} claims for question.",
        {
            "question": question,
            "findings_count": len(findings),
            "sample_claims": [f["claim"] for f in findings[:3]],
        },
    )
    return {"raw_findings": findings}


def verifier_node(state: AgentState) -> dict:
    findings = state["raw_findings"]
    if len(findings) > MAX_LLM_CALLS_PER_RUN * 3:
        print(f"[BUDGET] Capping findings from {len(findings)} to stay within budget")
        findings = findings[: MAX_LLM_CALLS_PER_RUN * 3]

    print(f"\nVerifier running on {len(findings)} raw findings...")
    append_run_event(
        state["run_id"],
        "verifier",
        "running",
        f"Verifier running on {len(findings)} raw findings.",
        {"raw_findings_count": len(findings)},
    )
    verified, errors = verify_findings(findings)
    print(f"  -> {len(verified)} passed verification, {len(errors)} unverifiable (excluded)")
    append_run_event(
        state["run_id"],
        "verifier",
        "completed",
        f"{len(verified)} findings verified, {len(errors)} unverifiable.",
        {
            "verified_count": len(verified),
            "errors": errors,
        },
    )
    return {"verified_findings": verified, "errors": errors}


def dedup_node(state: AgentState) -> dict:
    print(f"\nDedup running on {len(state['verified_findings'])} verified findings...")
    append_run_event(
        state["run_id"],
        "dedup",
        "running",
        f"Dedup running on {len(state['verified_findings'])} verified findings.",
        {"verified_findings_count": len(state["verified_findings"])}
    )
    new_findings = filter_new_findings(state["verified_findings"], state["run_id"])
    print(f"  -> {len(new_findings)} are genuinely new")
    append_run_event(
        state["run_id"],
        "dedup",
        "completed",
        f"{len(new_findings)} findings marked as new.",
        {
            "new_findings_count": len(new_findings),
        },
    )
    return {"new_findings": new_findings}


def writer_node(state: AgentState) -> dict:
    print(f"\nWriter composing briefing from {len(state['new_findings'])} new findings...")
    append_run_event(
        state["run_id"],
        "writer",
        "running",
        f"Writer composing briefing from {len(state['new_findings'])} new findings.",
        {"new_findings_count": len(state["new_findings"])}
    )
    briefing = write_briefing(state["watchlist_item"], state["new_findings"])
    append_run_event(
        state["run_id"],
        "writer",
        "completed",
        "Briefing draft composed.",
        {"briefing_preview": briefing[:500]},
    )
    return {"briefing_draft": briefing}


def deliverer_node(state: AgentState) -> dict:
    briefing = state["briefing_draft"]

    if not state["new_findings"]:
        print("No new findings — skipping approval/delivery.")
        append_run_event(state["run_id"], "deliverer", "completed", "No new findings; skipping delivery.")
        return {"approval_status": "skipped_no_news"}

    # Pause here; execution resumes when main.py calls app.invoke(Command(resume=...), config)
    append_run_event(state["run_id"], "deliverer", "waiting_approval", "Briefing ready for human approval.")
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
        print("Delivery rejected by human.")
        append_run_event(state["run_id"], "deliverer", "completed", "Briefing rejected by human.")
        return {"approval_status": "rejected"}

    sent = send_briefing_email(
        subject=f"Radar Briefing: {state['watchlist_item']}",
        body=final_content,
    )
    append_run_event(
        state["run_id"],
        "deliverer",
        "completed",
        "Briefing delivered." if sent else "Briefing send failed.",
        {"sent": sent},
    )
    return {"approval_status": "approved" if sent else "send_failed"}


builder = StateGraph(AgentState)
builder.add_node("planner", planner_node)
builder.add_node("researcher", researcher_node)
builder.add_node("verifier", verifier_node)
builder.add_node("dedup", dedup_node)
builder.add_node("writer", writer_node)
builder.add_node("deliverer", deliverer_node)

builder.set_entry_point("planner")
builder.add_conditional_edges("planner", route_to_researchers, ["researcher"])
builder.add_edge("researcher", "verifier")
builder.add_edge("verifier", "dedup")
builder.add_edge("dedup", "writer")
builder.add_edge("writer", "deliverer")
builder.add_edge("deliverer", END)


_CHECKPOINTER_CONTEXTS = []

def build_app():
    checkpointer_cm = SqliteSaver.from_conn_string("db/checkpoints.sqlite")
    checkpointer = checkpointer_cm.__enter__()
    _CHECKPOINTER_CONTEXTS.append(checkpointer_cm)
    return builder.compile(checkpointer=checkpointer), checkpointer_cm


app, _CHECKPOINTER_CM = build_app()

if __name__ == "__main__":
    run_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": run_id}}
    print("Run ID:", run_id)

    initial_state = {
        "run_id": run_id,
        "watchlist_item": "New AI agent frameworks and MCP tooling releases",
        "sub_questions": [],
        "raw_findings": [],
        "verified_findings": [],
        "new_findings": [],
        "briefing_draft": "",
        "approval_status": "pending",
        "errors": [],
    }

    result = app.invoke(initial_state, config)

    # Check if the graph paused at the interrupt (waiting for human approval)
    state_snapshot = app.get_state(config)
    if state_snapshot.next:  # graph has a pending node -> we're paused at interrupt()
        interrupt_payload = state_snapshot.tasks[0].interrupts[0].value
        print("\n" + "=" * 60)
        print("BRIEFING AWAITING APPROVAL:")
        print("=" * 60)
        print(interrupt_payload["briefing_draft"])

        print("\nApprove and send? (y = approve / e = edit / anything else = reject):")
        choice = input("> ").strip().lower()

        if choice == "y":
            decision = {"action": "approve"}
        elif choice == "e":
            new_content = input("Enter edited content:\n> ")
            decision = {"action": "edit", "content": new_content}
        else:
            decision = {"action": "reject"}

        result = app.invoke(Command(resume=decision), config)
        print("\nFinal status:", result.get("approval_status"))
    else:
        # No interrupt was hit (e.g. no new findings, deliverer skipped itself)
        print("\nFinal status:", result.get("approval_status"))

    print("\n" + "=" * 60)
    print("FINAL BRIEFING:")
    print("=" * 60)
    print(result.get("briefing_draft", "(none)"))