# Radar Autonomous Market Intelligence Agent

Radar is a full-stack autonomous market intelligence platform that plans research, gathers live sources, verifies claims, drafts briefings, and tracks agent activity in a real-time dashboard.

The backend runs a LangGraph pipeline with persistent SQLite state, while the frontend provides an operational command center for watchlists, research runs, approvals, evaluations, and the agent fleet.

## Highlights

- Autonomous multi-agent pipeline: planner, researcher, verifier, dedup, writer, and deliverer.
- Live dashboard with current run state, agent fleet status, node logs, and approval workflow.
- Watchlist-driven execution for recurring intelligence topics.
- Persistent SQLite storage for runs, findings, watchlists, and briefings.
- Real-time frontend polling against the FastAPI backend.

## Architecture

- Backend: FastAPI + LangGraph + SQLite
- Research stack: Ollama, Groq, Tavily, DDGS, BeautifulSoup, Trafilatura
- Frontend: React + Vite + TypeScript
- Runtime ports:
	- Backend API: `http://localhost:8000`
	- Frontend app: `http://localhost:3000`

## Repository Layout

```text
backend/
	api.py              FastAPI application and dashboard endpoints
	main.py             LangGraph pipeline definition
	agents/             Planner, researcher, verifier, writer, deliverer nodes
	tools/              Database, search, vector store, and logging helpers
	db/                 SQLite databases and schema
frontend/
	src/                React application, views, and API client
	server.ts           Frontend dev server entrypoint
```

## Prerequisites

- Python 3.13+
- Node.js 18+
- Ollama installed and running locally for planner/research/writer steps
- Optional: Groq API key for verifier steps
- Optional: Gmail credentials for briefing delivery

## Environment Variables

Create a `.env` file in `backend/` with the values you need:

```env
VERIFIER_PROVIDER=ollama
GROQ_API_KEY=
TAVILY_API_KEY=
GMAIL_ADDRESS=
GMAIL_APP_PASSWORD=
```

Notes:

- `VERIFIER_PROVIDER` can be `ollama` or `groq`.
- If you use Groq, set `GROQ_API_KEY`.
- If you want briefing email delivery, set `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD`.

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Run the backend API:

```bash
uvicorn api:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

The frontend dev server starts on port `3000` and expects the backend at `http://localhost:8000` by default.

## How It Works

1. Add a watchlist or launch an ad-hoc research run.
2. The backend starts a LangGraph workflow.
3. Planner generates research questions.
4. Researcher gathers source material.
5. Verifier checks claims against source text.
6. Dedup filters already-seen findings.
7. Writer drafts the briefing.
8. Deliverer pauses for approval and can send the briefing by email.

The frontend polls the backend for live run status, node logs, approvals, fleet state, and summary metrics.

## Useful Endpoints

- `GET /health`
- `GET /dashboard/metrics`
- `GET /dashboard/evaluations`
- `GET /dashboard/settings`
- `GET /watchlists`
- `POST /watchlists`
- `POST /watchlists/{id}/run`
- `GET /runs`
- `GET /runs/{run_id}`
- `GET /approvals/pending`

## Development Notes

- The dashboard is driven by backend state; metrics update as runs progress.
- Research run logs are stored in memory for the active session and exposed through the metrics payload.
- SQLite databases and checkpoint files live under `backend/db/`.

## Troubleshooting

- If the frontend shows no live data, confirm the backend is running on port `8000`.
- If research steps fail early, check that Ollama is running and reachable.
- If verification fails with a Groq error, switch `VERIFIER_PROVIDER` back to `ollama` or provide a valid `GROQ_API_KEY`.

