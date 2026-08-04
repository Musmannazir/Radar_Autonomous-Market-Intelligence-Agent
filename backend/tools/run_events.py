from __future__ import annotations

import threading
from datetime import datetime


_run_events: dict[str, list[dict]] = {}
_run_events_lock = threading.Lock()


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
