"""
Scheduler — runs Radar on a daily schedule by calling the FastAPI API.

Unlike the old CLI-based scheduler (which blocked on input() approval),
this posts to the running API server. Runs go to "awaiting_approval"
status and wait for the user to approve via the frontend when they open it.

Usage:
    1. Start the API server: uvicorn api:app --reload --port 8000
    2. Start the scheduler:  python scheduler.py
"""
import sys
import requests
from apscheduler.schedulers.blocking import BlockingScheduler

API_BASE = "http://localhost:8000"


def run_radar():
    """POST to the API to start a run for each active watchlist item."""
    print("[Scheduler] Starting Radar run...")

    # Fetch active watchlists
    try:
        resp = requests.get(f"{API_BASE}/watchlists", timeout=10)
        resp.raise_for_status()
        watchlists = resp.json().get("watchlists", [])
    except Exception as e:
        print(f"[Scheduler] Failed to fetch watchlists: {e}")
        return

    active = [w for w in watchlists if w.get("active", True)]
    if not active:
        print("[Scheduler] No active watchlist items.")
        return

    for item in active:
        topic = item.get("topic", "")
        item_id = item.get("id")
        if not topic:
            continue
        try:
            resp = requests.post(
                f"{API_BASE}/watchlists/{item_id}/run",
                json={"topic": topic},
                timeout=10,
            )
            resp.raise_for_status()
            run_id = resp.json().get("run_id", "?")
            print(f"[Scheduler] Started run {run_id} for '{topic}' — awaiting approval.")
        except Exception as e:
            print(f"[Scheduler] Failed to start run for '{topic}': {e}")

    print(f"[Scheduler] All {len(active)} runs queued. Approve via the frontend.")


scheduler = BlockingScheduler()
scheduler.add_job(run_radar, "cron", hour=8, minute=0)  # Daily at 8:00 AM

if __name__ == "__main__":
    print("Radar scheduler started. Waiting for next scheduled run (daily 8:00 AM)...")
    print("Make sure the API server is running: uvicorn api:app --port 8000")
    print("Press Ctrl+C to stop.")
    try:
        scheduler.start()
    except KeyboardInterrupt:
        print("Scheduler stopped.")
