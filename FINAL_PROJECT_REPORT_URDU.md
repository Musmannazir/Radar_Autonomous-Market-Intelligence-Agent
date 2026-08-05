# 📋 RADAR - Autonomous Market Intelligence Agent
## Complete Project Report (Roman Urdu)

---

## 🎯 **PROJECT KYA HAI? (Overview)**

**RADAR** ek **Autonomous Market Intelligence System** hai jo **AI agents** use karke **market research**, **competitive intelligence**, aur **technology tracking** automatically karta hai. Ye system **LangGraph** framework par build hua hai jo **multi-agent pipeline** chalaata hai.

**Simple words mein:** Ye ek **AI-powered research team** hai jo 24/7 kaam karta hai - web search karta hai, information extract karta hai, verify karta hai, aur professional briefings bana ke deta hai.

---

## 🏗️ **SYSTEM ARCHITECTURE (Poora Structure)**

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + TypeScript)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │Overview  │ │ Watchlist│ │  Runs    │ │ Agents   │ │Briefing│ │
│  │  View    │ │  View    │ │  View    │ │  View    │ │  View  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Memory   │ │Evaluations│ │Settings  │ │ Approval │ │ SignIn │ │
│  │  View    │ │  View    │ │  View    │ │ Interface│ │  View  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    HTTP/REST API + WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              LANGGRAPH SUPERVISOR GRAPH                  │   │
│  │  Planner → Researcher → Verifier → Dedup → Writer → Deliverer │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  SQLite  │ │ ChromaDB │ │  Tools   │ │  Eval    │ │ Config │ │
│  │  (Meta)  │ │(Vectors) │ │(Search)  │ │ System   │ │        │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 **AGENTS KA DETAIL (Har Agent Ka Kaam)**

### **1. PLANNER AGENT** 🧠
- **Model:** Ollama - llama3.2:3b
- **Kaam:** User ka topic le ke **research questions** bana ta hai
- **Output:** Sub-questions list jo researcher ko di jati hain
- **Example:** "LLM Agent Frameworks" → 5-10 specific questions bana deta hai

### **2. RESEARCHER AGENT** 🔍
- **Model:** Ollama - llama3.2:3b  
- **Kaam:** Parallel web search + content extraction
- **Tools:** Tavily/SerpAPI se search, webpage scraping
- **Output:** Raw findings with source URLs

### **3. VERIFIER AGENT** ✅
- **Model:** Groq - llama-3.3-70b-versatile (bada model for accuracy)
- **Kaam:** Har claim ko source text se **independently verify** karta hai
- **Output:** Verified claims with confidence scores (0-100%)

### **4. DEDUP AGENT** 🔄
- **Kaam:** ChromaDB mein check karta hai ke ye findings **pehle se to nahi hain**
- **Vector similarity** use karta hai
- **Output:** New findings only (is_new = 1)

### **5. WRITER AGENT** ✍️
- **Model:** Ollama - llama3.2:3b
- **Kaam:** Verified findings se **professional briefing draft** likhta hai
- **Format:** Executive summary, key findings, verified claims, citations

### **6. DELIVERER AGENT** 📧
- **Model:** Rule Engine (no LLM)
- **Kaam:** Human approval wait karta hai, phir email bhejta hai
- **Human-in-the-loop** checkpoint

---

## 📥 **INPUT SYSTEM (System Kya Input Leta Hai)**

### **1. Watchlist Topics (Primary Input)**
```json
{
  "name": "LLM Agent Frameworks",
  "category": "AI_RESEARCH",           // AI_RESEARCH | OPEN_SOURCE_LLMS | AI_JOBS | AI_INNOVATION | OTHER
  "frequency": "Daily",                 // Real-time | Daily | Weekly | Monthly
  "priority": "HIGH",                   // HIGH | MED | LOW
  "description": "Track LangChain, AutoGen, CrewAI, LlamaIndex releases",
  "icon": "psychology"
}
```

### **2. Ad-hoc Research Topics**
- User manually koi topic de sakta hai "Run Research" modal se
- Watchlist ke bina bhi chal sakta hai

### **3. Human Approval Decisions**
- **Approve** → Briefing send ho jati hai email se
- **Reject** → Writer ko feedback de ke revise karwata hai
- **Edit** → User khud briefing modify kar ke send karta hai

---

## ⚙️ **BACKEND PROCESSING FLOW (Step by Step)**

```
USER ACTION: "Add Watchlist" ya "Run Research"
                    │
                    ▼
┌────────────────────────────────────────┐
│  FASTAPI ENDPOINT: /watchlists POST    │
│  - AI Topic Validation (NEW!)          │
│  - "Can't search - Out of Domain"      │
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│  CREATE RUN: /runs POST                │
│  - UUID generate karta hai             │
│  - Thread start karta hai              │
│  - Status: "queued"                    │
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│  LANGGRAPH PIPELINE (Background)       │
│                                        │
│  1. PLANNER: Topic → Sub-questions    │
│  2. RESEARCHER: Questions → Raw data  │
│  3. VERIFIER: Claims → Verified facts │
│  4. DEDUP: Check ChromaDB for duplicates│
│  5. WRITER: Verified facts → Briefing │
│  6. DELIVERER: Wait for human approval│
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│  APPROVAL INTERFACE                    │
│  - User review karta hai               │
│  - Approve/Reject/Edit                 │
│  - Decision backend bhejta hai         │
└────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────┐
│  FINAL DELIVERY                        │
│  - Email send (Gmail SMTP)             │
│  - Briefing database mein save         │
│  - Vector embeddings ChromaDB mein     │
└────────────────────────────────────────┘
```

---

## 🧠 **EMBEDDINGS & VECTOR STORE (ChromaDB)**

### **Kya Hota Hai Embeddings?**
Embeddings = **Text ka numerical representation** (vector) jo semantic meaning capture karta hai.

### **ChromaDB Mein Kya Store Hota Hai?**

```python
# Har finding ka vector banta hai:
{
    "id": "finding_123",
    "embedding": [0.1, -0.3, 0.7, ...],  # 384/768 dimensions
    "metadata": {
        "claim": "OpenAI released GPT-4o with 128k context",
        "source_url": "https://openai.com/gpt-4o",
        "confidence": 95,
        "run_id": "run_abc123",
        "topic": "LLM Releases",
        "is_new": 1
    }
}
```

### **Dedup Process (Duplicate Detection):**
```
New Finding → Embedding Generate → ChromaDB Query (similarity > 0.85?)
                    │
            ┌───────┴───────┐
            ▼               ▼
       EXISTING         NEW FINDING
       (Skip/Update)    (Store + is_new=1)
```

### **Vector Store Configuration:**
- **Collection:** `radar_findings`
- **Embedding Model:** sentence-transformers (all-MiniLM-L6-v2) ya OpenAI embeddings
- **Distance Metric:** Cosine similarity
- **Threshold:** ~0.85 for duplicate detection

---

## 💾 **DATABASE SCHEMA (SQLite)**

### **Tables:**

```sql
-- Watchlists
CREATE TABLE watchlist_items (
    id INTEGER PRIMARY KEY,
    topic TEXT NOT NULL,
    category TEXT,
    frequency TEXT,
    priority TEXT,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Research Runs
CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,
    item_id INTEGER,
    status TEXT,           -- queued, running, awaiting_approval, approved, rejected, failed
    current_step TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    briefing_draft TEXT,
    approval_status TEXT,
    error TEXT
);

-- Briefings (Final approved)
CREATE TABLE briefings (
    id INTEGER PRIMARY KEY,
    run_id TEXT UNIQUE,
    content TEXT,
    sent_at TIMESTAMP,
    topic TEXT
);

-- Findings (Verified claims)
CREATE TABLE findings (
    id INTEGER PRIMARY KEY,
    run_id TEXT,
    claim TEXT,
    source_url TEXT,
    confidence REAL,
    is_new INTEGER,        -- 1 = new, 0 = already known
    created_at TIMESTAMP
);

-- Run Events (For live progress UI)
CREATE TABLE run_events (
    id INTEGER PRIMARY KEY,
    run_id TEXT,
    step TEXT,
    status TEXT,           -- running, completed, failed
    timestamp TEXT,
    message TEXT,
    details TEXT
);
```

---

## 🎨 **FRONTEND VIEWS DETAIL**

### **1. OVERVIEW VIEW** 📊
- **System metrics:** Active agents, CPU, memory, scraper rate
- **Agent fleet status:** Real-time pipeline visualization
- **Recent runs:** Live progress bars
- **Quick actions:** Run research, add watchlist

### **2. WATCHLIST VIEW** 📋
- **Table:** Topic, Category, Status, Frequency, Findings, Last Run
- **Add Modal:** Topic name, category dropdown, frequency, priority, description
- **AI Validation (NEW):** "Can't search - Out of Domain" for non-AI topics
- **Actions:** Run now, Pause/Resume, Delete

### **3. RUNS VIEW** 🏃
- **All runs history** with status
- **Live pipeline progress** per run
- **Click for detail** → Briefing view

### **4. AGENTS VIEW** 🤖
- **6 agents** ka real-time status
- **Pipeline position:** Queued → Running → Done
- **Metrics:** Success rate, last execution, queue position
- **Node logs:** Har agent ka detailed output

### **5. BRIEFINGS VIEW** 📄
- **Left:** Filterable list (ALL, AI_RESEARCH, etc.)
- **Right:** Selected briefing detail
  - Executive Summary
  - Key Findings (3 cards)
  - Verified Claims Table (claim, source, confidence, status)
  - Market Impact
  - Citations
- **Ask Radar AI:** Chat with briefing content

### **6. MEMORY VIEW** 🧠
- **ChromaDB stats:** Vector nodes, new nodes
- **Knowledge base** visualization

### **7. EVALUATIONS VIEW** 📈
- **Accuracy, Precision, False Positive Rate, Signal Quality**
- **Per-finding evaluation** with PASS/FAIL/WARN

### **8. APPROVAL INTERFACE** ✅
- **Human-in-the-loop checkpoint**
- **Briefing draft** review
- **Actions:** Approve & Send, Reject (with feedback), Edit
- **Status banners:** ✓ APPROVED & SENT / ✗ REJECTED
- **Polling** for backend confirmation

### **9. SETTINGS VIEW** ⚙️
- **API Keys management**
- **System stats:** Database counts
- **Configuration**

---

## 🔧 **TOOLS & EXTERNAL SERVICES**

### **Search & Extraction:**
- **Tavily API** - Web search
- **SerpAPI** - Google search results
- **Firecrawl / Jina AI** - Webpage content extraction

### **LLM Providers:**
- **Ollama (Local):** llama3.2:3b - Planner, Researcher, Writer
- **Groq (Cloud):** llama-3.3-70b-versatile - Verifier (accuracy ke liye)

### **Vector Database:**
- **ChromaDB** - Local vector store for embeddings

### **Email Delivery:**
- **Gmail SMTP** - Briefing delivery

### **Monitoring:**
- **LangSmith** (optional) - Agent tracing

---

## 🚀 **DEPLOYMENT & RUNNING**

### **Backend Start:**
```bash
cd backend
pip install -r requirements.txt
python api.py
# Runs on http://localhost:8000
```

### **Frontend Start:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### **Environment Variables (.env):**
```env
# Backend
TAVILY_API_KEY=tvly-xxx
SERPAPI_KEY=xxx
GROQ_API_KEY=gsk_xxx
OPENAI_API_KEY=sk-xxx
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxx
CHROMA_PERSIST_DIR=./db/chroma

# Frontend
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🔐 **NEW FEATURES (Latest Updates)**

### **1. AI Topic Validation (Watchlist)**
- **Frontend:** Real-time check in modal
- **Backend:** 400 error if non-AI topic
- **Keywords:** 28 AI-related terms (ai, ml, llm, neural, gpt, claude, transformer, etc.)
- **Error:** "Can't search - Out of Domain"

### **2. Enhanced Approval Interface**
- **Status banners** during pending state
- **Terminal screens** with "Check for More Approvals" button
- **Clear visual feedback** for Approved/Rejected

### **3. Real-time Pipeline Progress**
- **WebSocket-like polling** (2.5s interval)
- **Per-node status** in UI
- **Live logs** from run_events table

---

## 📊 **DATA FLOW SUMMARY**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   USER      │────▶│  WATCHLIST  │────▶│  SCHEDULER  │
│  INPUT      │     │  TOPIC      │     │  (Cron)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  EMAIL      │◀────│  APPROVAL   │◀────│  LANGGRAPH  │
│  DELIVERY   │     │  INTERFACE  │     │  PIPELINE   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
            ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
            │   SQLITE    │            │  CHROMADB   │            │  RUN EVENTS │
            │  (Metadata) │            │  (Vectors)  │            │  (Progress) │
            └─────────────┘            └─────────────┘            └─────────────┘
```

---

## 🎯 **USE CASES (Kahan Use Hota Hai)**

1. **Competitive Intelligence** - Competitors ke naye products track karna
2. **Technology Scouting** - Naye AI models, frameworks dhoondna
3. **Market Research** - Industry trends, funding news
4. **Patent Monitoring** - IP landscape track karna
5. **Talent/Job Market** - AI jobs, hiring trends
6. **Open Source Tracking** - GitHub repos, releases, stars

---

## 🔮 **FUTURE ENHANCEMENTS**

- [ ] **Multi-language support** (Urdu/Hindi briefings)
- [ ] **Slack/Discord integration** for alerts
- [ ] **Advanced scheduling** (cron expressions)
- [ ] **Custom agent personas** per domain
- [ ] **RAG-powered Q&A** on historical briefings
- [ ] **Export formats** (PDF, Notion, Confluence)
- [ ] **Team collaboration** (comments, assignments)

---

## 📝 **SUMMARY (TL;DR)**

**RADAR = Autonomous AI Research Team**

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS |
| **Backend** | FastAPI, Python 3.11+, LangGraph |
| **Agents** | 6 specialized agents (Planner→Deliverer) |
| **LLMs** | Ollama (local) + Groq (cloud) |
| **Vector DB** | ChromaDB (embeddings + dedup) |
| **SQL DB** | SQLite (metadata + runs + briefings) |
| **Search** | Tavily/SerpAPI + Firecrawl |
| **Email** | Gmail SMTP |
| **Real-time** | 2.5s polling + run_events table |

**Input:** Watchlist topics ya ad-hoc research queries  
**Process:** 6-agent pipeline with human approval  
**Output:** Verified, cited, deduplicated intelligence briefings via email  

**Ye system 24/7 chal ke market intelligence automatically collect, verify, aur deliver karta hai bina human intervention ke (sirf approval ke alawa).**

---

*Report Generated: 2026-08-05*  
*Project: RADAR Autonomous Market Intelligence Agent*  
*Language: Roman Urdu for Team Understanding*