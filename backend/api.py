import json
import uuid
import threading
import traceback
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from langgraph.types import Command
from graph.supervisor import build_graph
import config
from tools.db import (
    create_run,
    add_watchlist_item,
    update_run_status,
    get_recent_briefings,
    get_briefing_detail,
    log_briefing,
    list_watchlists,
    get_watchlist,
    set_watchlist_active,
    delete_watchlist_item,
    get_database_counts,
    get_run_rows,
    list_findings,
    ensure_schema,
    get_connection,
    save_rejection_reason,
)
from tools.run_events import get_run_events

# AI-related keywords for topic validation
AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'llm', 'large language model', 'neural', 'gpt', 'claude', 'gemini', 'llama',
    'transformer', 'generative', 'neural network', 'nlp', 'natural language',
    'computer vision', 'cv', 'robotics', 'autonomous agent', 'ai agent',
    'open source llm', 'ai jobs', 'ai research', 'ai innovation',
    'mlops', 'mle', 'ml engineer', 'data science'
]


def is_ai_related(topic: str) -> bool:
    """Check if a topic is AI-related using keyword matching."""
    lower_topic = topic.lower()
    return any(keyword in lower_topic for keyword in AI_KEYWORDS)


ensure_schema()

active_runs: dict[str, dict] = {}
runs_lock = threading.Lock()

# Canonical pipeline order — used to render step-by-step progress on the frontend.
PIPELINE_ORDER = ["planner", "researcher", "verifier", "dedup", "writer", "deliverer"]

AGENT_FLEET_TEMPLATE = [
    {
        "id": "planner",
        "name": "Planner Agent",
        "description": "Breaks topics into executable research questions.",
        "icon": "account_tree",
        "colorClass": "text-blue-400",
        "borderColor": "border-blue-500/30",
        "bgLight": "bg-blue-500/10",
        "model": "Ollama - llama3.2:3b",
    },
    {
        "id": "researcher",
        "name": "Research Agent",
        "description": "Fetches and extracts live source material.",
        "icon": "radar",
        "colorClass": "text-purple-400",
        "borderColor": "border-purple-500/30",
        "bgLight": "bg-purple-500/10",
        "model": "Ollama - llama3.2:3b",
    },
    {
        "id": "verifier",
        "name": "Verifier Agent",
        "description": "Checks every claim against source text.",
        "icon": "verified",
        "colorClass": "text-emerald-400",
        "borderColor": "border-emerald-500/30",
        "bgLight": "bg-emerald-500/10",
        "model": "Groq - llama-3.3-70b-versatile",
    },
    {
        "id": "writer",
        "name": "Writer Agent",
        "description": "Compiles the briefing draft.",
        "icon": "edit_note",
        "colorClass": "text-amber-400",
        "borderColor": "border-amber-500/30",
        "bgLight": "bg-amber-500/10",
        "model": "Ollama - llama3.2:3b",
    },
    {
        "id": "deliverer",
        "name": "Deliverer Agent",
        "description": "Handles approval and email delivery.",
        "icon": "send",
        "colorClass": "text-cyan-400",
        "borderColor": "border-cyan-500/30",
        "bgLight": "bg-cyan-500/10",
        "model": "Rule Engine",
    },
]

AGENT_FLEET_METRICS: dict[str, dict] = {
    role["id"]: {"success_count": 0, "failure_count": 0, "last_execution": None} for role in AGENT_FLEET_TEMPLATE
}

# Cached LLM for the Ask-Radar-AI briefing query. Kept at module level so the
# Ollama model stays warm between requests — a fresh ChatOllama per request
# would force a full model reload (~2GB) on every question.
_query_llm = None


def get_query_llm():
    """Return a cached LLM for briefing Q&A. Uses the fast hosted provider when
    configured (Groq), otherwise the local Ollama model."""
    global _query_llm
    if _query_llm is None:
        if config.VERIFIER_PROVIDER == "groq" and config.GROQ_API_KEY:
            from langchain_groq import ChatGroq
            _query_llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=config.GROQ_API_KEY, temperature=0)
        else:
            from langchain_ollama import ChatOllama
            _query_llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return _query_llm


def _warm_up_query_llm():
    """Pre-load the local LLM in the background so the first briefing query
    doesn't pay the 90s+ model-load cost. Non-fatal if it fails."""
    try:
        get_query_llm().invoke("Reply with exactly: ready")
        print("[Radar] Briefing Q&A LLM warmed up.")
    except Exception as e:
        print(f"[Radar] Briefing Q&A LLM warm-up failed (non-fatal): {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=_warm_up_query_llm, daemon=True).start()
    yield

app = FastAPI(title="Radar API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartRunRequest(BaseModel):
    topic: str | None = None
    watchlist_item_id: int | None = None


class WatchlistRunRequest(BaseModel):
    topic: str | None = None


class WatchlistCreateRequest(BaseModel):
    name: str
    category: str | None = None
    frequency: str | None = None
    priority: str | None = None
    description: str | None = None
    icon: str | None = None


class WatchlistUpdateRequest(BaseModel):
    active: bool


class ApprovalRequest(BaseModel):
    action: str
    content: str | None = None


class BriefingQueryRequest(BaseModel):
    question: str


def _run_graph(run_id: str, topic: str):
    app_graph, checkpointer_cm = build_graph()
    config = {"configurable": {"thread_id": run_id}}
    with runs_lock:
        active_runs[run_id]["status"] = "running"
        active_runs[run_id]["current_step"] = "planner"
        active_runs[run_id].setdefault("events", []).append(
            {"step": "planner", "status": "running", "timestamp": datetime.utcnow().isoformat()}
        )
    update_run_status(run_id, "running")

    initial_state = {
        "run_id": run_id,
        "watchlist_item": topic,
        "sub_questions": [],
        "raw_findings": [],
        "verified_findings": [],
        "new_findings": [],
        "briefing_draft": "",
        "approval_status": "pending",
        "errors": [],
    }

    try:
        # stream_mode="updates" yields one dict per node as it finishes —
        # this is what lets the frontend show live per-agent progress
        # instead of a single opaque "running" spinner.
        for update in app_graph.stream(initial_state, config, stream_mode="updates"):
            for node_name in update.keys():
                with runs_lock:
                    active_runs[run_id]["current_step"] = node_name
                    active_runs[run_id].setdefault("events", []).append(
                        {"step": node_name, "status": "completed", "timestamp": datetime.utcnow().isoformat()}
                    )
                if node_name in AGENT_FLEET_METRICS:
                    AGENT_FLEET_METRICS[node_name]["success_count"] += 1
                    AGENT_FLEET_METRICS[node_name]["last_execution"] = datetime.utcnow().isoformat()

        state_snapshot = app_graph.get_state(config)
        with runs_lock:
            if state_snapshot.next:
                active_runs[run_id]["status"] = "awaiting_approval"
                active_runs[run_id]["current_step"] = "deliverer"
                active_runs[run_id]["briefing_draft"] = state_snapshot.tasks[0].interrupts[0].value.get(
                    "briefing_draft", ""
                )
                update_run_status(run_id, "awaiting_approval")
            else:
                final_values = state_snapshot.values
                status = final_values.get("approval_status", "completed")
                active_runs[run_id]["status"] = status
                active_runs[run_id]["briefing_draft"] = final_values.get("briefing_draft", "")
                update_run_status(run_id, status)
    except Exception as e:
        traceback.print_exc()
        with runs_lock:
            active_runs[run_id]["status"] = "failed"
            active_runs[run_id]["error"] = str(e)
        update_run_status(run_id, "failed")
    finally:
        _ = checkpointer_cm


def _resume_graph(run_id: str, decision: dict):
    app_graph, checkpointer_cm = build_graph()
    config = {"configurable": {"thread_id": run_id}}
    with runs_lock:
        active_runs[run_id]["current_step"] = "deliverer"
        active_runs[run_id].setdefault("events", []).append(
            {"step": "deliverer", "status": "running", "timestamp": datetime.utcnow().isoformat()}
        )
    try:
        for update in app_graph.stream(Command(resume=decision), config, stream_mode="updates"):
            for node_name in update.keys():
                with runs_lock:
                    active_runs[run_id]["current_step"] = node_name
                    active_runs[run_id].setdefault("events", []).append(
                        {"step": node_name, "status": "completed", "timestamp": datetime.utcnow().isoformat()}
                    )
                if node_name in AGENT_FLEET_METRICS:
                    AGENT_FLEET_METRICS[node_name]["success_count"] += 1
                    AGENT_FLEET_METRICS[node_name]["last_execution"] = datetime.utcnow().isoformat()

        state_snapshot = app_graph.get_state(config)
        final_values = state_snapshot.values
        status = final_values.get("approval_status", "completed")
        with runs_lock:
            active_runs[run_id]["status"] = status
            active_runs[run_id]["briefing_draft"] = final_values.get("briefing_draft", "")
        update_run_status(run_id, status)
        if status == "approved":
            log_briefing(run_id, final_values.get("briefing_draft", ""), sent=True)
    except Exception as e:
        traceback.print_exc()
        with runs_lock:
            active_runs[run_id]["status"] = "failed"
            active_runs[run_id]["error"] = str(e)
            failing_step = active_runs[run_id].get("current_step")
        if failing_step in AGENT_FLEET_METRICS:
            AGENT_FLEET_METRICS[failing_step]["failure_count"] += 1
            AGENT_FLEET_METRICS[failing_step]["last_execution"] = datetime.utcnow().isoformat()
        update_run_status(run_id, "failed")
    finally:
        _ = checkpointer_cm


@app.post("/runs")
def start_run(req: StartRunRequest):
    run_id = str(uuid.uuid4())
    if req.watchlist_item_id is not None:
        item_id = req.watchlist_item_id
        watchlist = get_watchlist(item_id)
        if not watchlist:
            raise HTTPException(status_code=404, detail="Watchlist not found")
        topic = req.topic or watchlist["topic"]
    elif req.topic:
        item_id = add_watchlist_item(req.topic)
        topic = req.topic
    else:
        raise HTTPException(status_code=400, detail="topic or watchlist_item_id is required")

    create_run(run_id, item_id)

    with runs_lock:
        active_runs[run_id] = {
            "topic": topic,
            "watchlist_item_id": item_id,
            "status": "queued",
            "current_step": None,
            "started_at": datetime.utcnow().isoformat(),
            "events": [],
        }

    thread = threading.Thread(target=_run_graph, args=(run_id, topic), daemon=True)
    thread.start()

    return {"run_id": run_id, "status": "queued"}


@app.post("/watchlists/{item_id}/run")
def run_watchlist(item_id: int, req: WatchlistRunRequest | None = None):
    watchlist = get_watchlist(item_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    payload = StartRunRequest(topic=req.topic if req else None, watchlist_item_id=item_id)
    return start_run(payload)


@app.post("/watchlists")
def create_watchlist(req: WatchlistCreateRequest):
    # Validate that topic is AI-related
    if not is_ai_related(req.name):
        raise HTTPException(status_code=400, detail="Can't search - Out of Domain")

    item_id = add_watchlist_item(
        req.name,
        category=req.category,
        frequency=req.frequency,
        priority=req.priority,
        description=req.description,
        icon=req.icon,
    )
    return {"id": item_id, "name": req.name}


@app.get("/watchlists")
def list_all_watchlists():
    return {"watchlists": list_watchlists()}


@app.patch("/watchlists/{item_id}")
def update_watchlist(item_id: int, req: WatchlistUpdateRequest):
    watchlist = get_watchlist(item_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    set_watchlist_active(item_id, req.active)
    return {"id": item_id, "active": req.active}


@app.delete("/watchlists/{item_id}")
def remove_watchlist(item_id: int):
    watchlist = get_watchlist(item_id)
    if not watchlist:
        raise HTTPException(status_code=404, detail="Watchlist not found")
    delete_watchlist_item(item_id)
    return {"id": item_id, "deleted": True}


@app.get("/runs/{run_id}")
def get_run(run_id: str):
    with runs_lock:
        run = active_runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return {"run_id": run_id, **run}


@app.get("/runs")
def list_runs(limit: int = 50):
    return {"runs": get_run_rows(limit)}


@app.get("/approvals/pending")
def list_pending_approvals():
    with runs_lock:
        pending = [
            {"run_id": rid, "topic": r["topic"], "briefing_draft": r.get("briefing_draft", "")}
            for rid, r in active_runs.items()
            if r["status"] == "awaiting_approval"
        ]
    return {"pending": pending}


@app.get("/dashboard/metrics")
def dashboard_metrics():
    counts = get_database_counts()
    runs = get_run_rows(20)
    watchlists = list_watchlists()
    briefings = get_recent_briefings(10)
    findings = list_findings(20)

    active_agents = 0
    busy_agents = 0
    agent_statuses = []
    fleet_snapshot = []
    latest_active = None
    with runs_lock:
        for run_id, run in active_runs.items():
            status = run.get("status", "queued")
            if status in {"running", "queued", "processing_approval", "awaiting_approval"}:
                active_agents += 1
            if status == "running":
                busy_agents += 1
            agent_statuses.append(
                {
                    "run_id": run_id,
                    "topic": run.get("topic", ""),
                    "status": status,
                    "current_step": run.get("current_step"),
                    "started_at": run.get("started_at"),
                    "briefing_draft": run.get("briefing_draft", ""),
                    "error": run.get("error", ""),
                }
            )

            if status in {"running", "queued", "processing_approval", "awaiting_approval"}:
                if not latest_active or (run.get("started_at", "") > latest_active.get("started_at", "")):
                    latest_active = {"run_id": run_id, **run}

    if not agent_statuses:
        agent_statuses = []

    current_run_events = get_run_events(latest_active["run_id"]) if latest_active else []

    # No active run (e.g. the last run just finished) — fall back to the most
    # recent run so the UI can still inspect per-node logs after completion.
    if not current_run_events and active_runs:
        with runs_lock:
            most_recent_run = None
            for rid, run in active_runs.items():
                if most_recent_run is None or (run.get("started_at", "") or "") > (most_recent_run.get("started_at", "") or ""):
                    most_recent_run = {**run, "run_id": rid}
        if most_recent_run:
            current_run_events = get_run_events(most_recent_run["run_id"])

    # Derive the active step from run events, which log "running" the moment a
    # node STARTS (stream_mode="updates" only fires on node completion, so it
    # lags a whole node behind during slow steps like the verifier).
    active_step = latest_active.get("current_step") if latest_active else None
    for ev in reversed(current_run_events):
        if ev.get("status") == "running":
            active_step = ev.get("step")
            break
    active_index = PIPELINE_ORDER.index(active_step) if active_step in PIPELINE_ORDER else -1

    for index, role in enumerate(AGENT_FLEET_TEMPLATE):
        metrics = AGENT_FLEET_METRICS[role["id"]]
        if latest_active:
            if active_step == role["id"]:
                status = "Busy"
                pipeline_state = "running"
                queue_position = None
            elif latest_active.get("status") == "awaiting_approval" and role["id"] == "deliverer":
                status = "Awaiting Approval"
                pipeline_state = "waiting_approval"
                queue_position = None
            elif active_index >= 0 and index > active_index:
                status = "Queued"
                pipeline_state = "queued"
                queue_position = index - active_index
            elif active_index >= 0 and index <= active_index:
                status = "Online"
                pipeline_state = "completed"
                queue_position = None
            else:
                status = "Offline"
                pipeline_state = "idle"
                queue_position = None
        else:
            status = "Online" if metrics["last_execution"] else "Offline"
            pipeline_state = "idle"
            queue_position = None

        attempts = metrics["success_count"] + metrics["failure_count"]
        success_rate = round((metrics["success_count"] / attempts) * 100, 1) if attempts else 0.0
        last_execution = metrics["last_execution"] or (latest_active.get("started_at") if latest_active else None)

        fleet_snapshot.append(
            {
                **role,
                "status": status,
                "lastExecution": last_execution,
                "successRate": success_rate,
                "runTopic": latest_active.get("topic") if latest_active else None,
                "runId": latest_active.get("run_id") if latest_active else None,
                "pipelineState": pipeline_state,
                "queuePosition": queue_position,
            }
        )

    return {
        "watchlists": watchlists,
        "runs": runs,
        "briefings": briefings,
        "findings": findings,
        "counts": counts,
        "agent_statuses": agent_statuses,
        "active_agents": active_agents,
        "busy_agents": busy_agents,
        "agent_fleet": fleet_snapshot,
        "current_run": latest_active,
        "current_run_events": current_run_events,
        "memory": {
            "vector_nodes": counts["findings"],
            "new_nodes": counts["new_findings"],
        },
        "system": {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
        },
    }


@app.get("/dashboard/evaluations")
def dashboard_evaluations():
    from eval.evaluator import run_eval
    result = run_eval()
    return result


@app.get("/dashboard/settings")
def dashboard_settings():
    counts = get_database_counts()
    return {
        "system": {
            "database": "sqlite",
            "watchlists": counts["watchlists"],
            "runs": counts["runs"],
            "briefings": counts["briefings"],
        }
    }


@app.get("/approvals/history")
def get_approval_history(limit: int = 50):
    """Get history of approved/rejected runs with their briefings."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT
            r.id as run_id,
            r.status,
            r.started_at,
            r.completed_at,
            w.topic as watchlist_topic,
            b.content as briefing_content,
            b.sent_at
        FROM runs r
        LEFT JOIN watchlist w ON w.id = r.item_id
        LEFT JOIN briefings b ON b.run_id = r.id
        WHERE r.status IN ('approved', 'rejected')
        ORDER BY COALESCE(r.completed_at, r.started_at) DESC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()

    return {
        "history": [
            {
                "run_id": row["run_id"],
                "status": row["status"],
                "started_at": row["started_at"],
                "completed_at": row["completed_at"],
                "topic": row["watchlist_topic"],
                "briefing_content": row["briefing_content"],
                "sent_at": row["sent_at"],
            }
            for row in rows
        ]
    }


@app.post("/approvals/{run_id}")
def submit_approval(run_id: str, req: ApprovalRequest):
    with runs_lock:
        run = active_runs.get(run_id)
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")
        if run["status"] != "awaiting_approval":
            raise HTTPException(status_code=400, detail=f"Run is not awaiting approval (status: {run['status']})")

    decision = {"action": req.action}
    if req.action == "edit":
        decision["content"] = req.content or ""
    elif req.action == "reject":
        decision["reason"] = req.content or ""
        # Persist the feedback so the Writer agent can learn from it next time
        save_rejection_reason(run_id, req.content or "")

    with runs_lock:
        active_runs[run_id]["status"] = "processing_approval"

    thread = threading.Thread(target=_resume_graph, args=(run_id, decision), daemon=True)
    thread.start()

    return {"run_id": run_id, "status": "processing_approval"}


@app.get("/briefings")
def list_briefings(limit: int = 20):
    return {"briefings": get_recent_briefings(limit)}


@app.get("/briefings/{run_id}")
def get_briefing(run_id: str):
    detail = get_briefing_detail(run_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return detail


@app.post("/briefings/{run_id}/query")
def query_briefing(run_id: str, req: BriefingQueryRequest):
    """
    Answer a question about a briefing, streaming tokens back as SSE.

    Uses a cached LLM (stays warm between requests). Prompts are truncated to
    keep context within the model's window and speed up prefill.
    """
    detail = get_briefing_detail(run_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Briefing not found")

    # Truncate to keep prompt inside the model's context window (~4096 tokens)
    briefing_content = (detail["content"] or "")[:6000]
    findings_text = "\n".join(
        f"- {f['claim']} (confidence: {f.get('confidence') or 'n/a'}, source: {f['source_url']})"
        for f in detail["findings"][:20]
    )
    topic = detail.get("topic", "unknown topic")

    prompt = (
        f'You are Radar AI, an intelligence analyst assistant. A user is asking a question '
        f'about a briefing on "{topic}".\n\n'
        f'BRIEFING CONTENT:\n{briefing_content}\n\n'
        f'VERIFIED FINDINGS (claims with sources and confidence scores):\n{findings_text}\n\n'
        f'Answer the user\'s question based ONLY on the briefing content and findings above. '
        f'Be concise and specific. If the answer is not in the briefing content or findings, say so. '
        f'Do not invent information.\n\n'
        f'USER QUESTION: {req.question}'
    )

    llm = get_query_llm()

    def _token_stream():
        try:
            buffer: list[str] = []
            for chunk in llm.stream(prompt):
                if chunk.content:
                    buffer.append(chunk.content)
                    # Flush every 5 chunks or on sentence/line boundaries to
                    # reduce HTTP frame overhead while keeping a smooth feel.
                    if len(buffer) >= 5 or any(c in chunk.content for c in '.!?\n:'):
                        yield f"data: {json.dumps({'text': ''.join(buffer)})}\n\n"
                        buffer = []
            if buffer:
                yield f"data: {json.dumps({'text': ''.join(buffer)})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(_token_stream(), media_type="text/event-stream")


@app.get("/health")
def health():
    return {"status": "ok"}