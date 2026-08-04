from __future__ import annotations

import threading
from datetime import datetime


_run_events: dict[str, list[dict]] = {}
_run_events_lock = threading.Lock()

# Per-run cost counters (LLM calls, search calls)
_run_costs: dict[str, dict] = {}
_run_costs_lock = threading.Lock()


def append_run_event(
    run_id: str,
    step: str,
    status: str,
    message: str | None = None,
    details: object | None = None,
) -> dict:
    event = {
        "step": step,
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if message is not None:
        event["message"] = message
    if details is not None:
        event["details"] = details

    with _run_events_lock:
        _run_events.setdefault(run_id, []).append(event)

    return event


def get_run_events(run_id: str) -> list[dict]:
    with _run_events_lock:
        return list(_run_events.get(run_id, []))


def record_cost(run_id: str, llm_calls: int = 0, search_calls: int = 0):
    """Record resource usage for a run."""
    with _run_costs_lock:
        costs = _run_costs.setdefault(run_id, {"llm_calls": 0, "search_calls": 0})
        costs["llm_calls"] += llm_calls
        costs["search_calls"] += search_calls


def get_run_costs(run_id: str) -> dict:
    with _run_costs_lock:
        return dict(_run_costs.get(run_id, {"llm_calls": 0, "search_calls": 0}))
