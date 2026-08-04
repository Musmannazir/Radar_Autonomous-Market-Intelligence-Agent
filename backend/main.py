"""
CLI entry point — runs a demo pipeline run with interactive approval.

The actual graph definition lives in graph/supervisor.py and graph/subgraphs.py.
This file exists for local testing and as the `python main.py` demo path.
"""
import uuid
from langgraph.types import Command
from graph.supervisor import build_graph


def main():
    app, _ = build_graph()
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
    if state_snapshot.next:
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
        print("\nFinal status:", result.get("approval_status"))

    print("\n" + "=" * 60)
    print("FINAL BRIEFING:")
    print("=" * 60)
    print(result.get("briefing_draft", "(none)"))


if __name__ == "__main__":
    main()
