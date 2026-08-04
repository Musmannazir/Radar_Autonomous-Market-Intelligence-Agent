# Engineering Log — Radar

This document records the hardest failures encountered during development and exactly how each was fixed. The three most impactful failures are featured first.

---

## 🔴 The Three Hardest Failures

### 1. Rate-Limit Errors Silently Became False-Passes (Anti-Hallucination Break)

**What went wrong:** The Verifier's exception handler defaulted failed verifications to `verdict="flagged"`, meaning a claim that errored out (e.g., Groq 429 rate limit) was treated identically to a claim the model reviewed and found uncertain.

**Why it happened:** The error handling was written for the "happy path" — if the LLM call fails, default to "flagged" so the pipeline doesn't crash. But "flagged" means "reviewed but uncertain," not "failed to review." This silently violated the anti-hallucination guarantee: an unverified claim is not the same as a flagged-but-checked one.

**How it was fixed:** Introduced a distinct `"error"` verdict that is excluded from `verified_findings` (fail-closed). Also batched claims per source (one LLM call per unique URL instead of one per claim) to cut verification calls by ~4-5x, reducing the chance of hitting rate limits in the first place.

**Lesson:** In safety-critical agent systems, error handling must be as carefully designed as the happy path. A "fail-safe" default can actually be "fail-dangerous" if it lets unverified data through.

---

### 2. ChromaDB Distance Metric Mismatch (Dedup Broken)

**What went wrong:** Dedup appeared to work (similarity=1.000 for all claims), but was actually broken — unrelated claims were being marked as duplicates because the similarity metric was wrong.

**Why it happened:** Assumed Chroma's `collection.query()` returned cosine distance. In reality, Chroma defaults to **squared L2 distance** unless the collection is explicitly created with `metadata={"hnsw:space": "cosine"}`. Converting squared L2 to similarity (`1 - distance`) gave nonsensical results.

**How it was fixed:** Verified via a standalone embedding sanity check (`tools/debug_embed.py`) before assuming the embedding model was broken. Created the ChromaDB collection with explicit `hnsw:space: cosine` and recalibrated the dedup threshold to 0.75 based on real reworded-claim similarity measurements (0.788).

**Lesson:** Always verify your vector store's distance metric with known test cases. A wrong metric silently corrupts every downstream decision.

---

### 3. Hallucinated Source URLs (The Researcher Lied About Where It Got Information)

**What went wrong:** The LLM extracting claims sometimes returned fabricated URLs (e.g., `https://www.example.com`) or invented domain names instead of the actual source URL, even when the real URL was in the prompt context.

**Why it happened:** LLMs are trained to be "helpful" and will often generate plausible-looking URLs when asked to cite sources. The model was echoing what it thought a URL should look like, not recalling the actual URL from the input.

**How it was fixed:** Stopped trusting the model to echo URLs back. The `source_url` is now attached **programmatically** from the search result object in code — the LLM never generates URLs. Each finding carries the exact URL from the web search, not from the LLM's imagination.

**Lesson:** Never let an LLM generate structural metadata (URLs, IDs, dates) from memory. Always extract those from the data pipeline and attach them in code.

---

## Additional Failures

### 4. Confidence Score Ignored — Only Verdict String Checked

A claim with `verdict="flagged"` and `confidence=0.0` passed through to the final briefing as a stated fact, because `verify_findings` only checked the verdict label, not the numeric confidence. Fixed by enforcing a `MIN_CONFIDENCE = 0.5` threshold regardless of verdict — this is what actually implements "low-confidence items are flagged, not stated."

### 5. Batched JSON Unreliable on Small Local Models

~30% of batched multi-claim verification calls failed to parse as valid JSON on `llama3.2:3b`. Fixed with a multi-strategy JSON parser (trailing commas, preamble extraction, inner-quote escaping) and a per-claim fallback retry on batch parse failure.

### 6. Confirmed vs Flagged Claims Rendered Identically

The Writer presented confirmed (`>=0.7`) and flagged (`0.5-0.69`) claims with the same confidence and tone. Fixed by splitting findings into explicitly-labeled sections ("Confirmed Facts" vs "Unconfirmed / Needs Review") so readers can immediately tell which claims deserve more scrutiny.

### 7. Verifier Running Sequentially (Performance)

45 findings across ~15 sources verified one-by-one, taking 3-5 minutes. Fixed by parallelizing with `ThreadPoolExecutor` (4 workers) and eliminating double-fetch (researcher content forwarded to verifier via `source_content` field).

### 8. Dashboard Displayed Wrong Agent as "Busy"

`stream_mode="updates"` only fires when a node **completes**, so during the slow verifier phase the frontend showed "Researcher Busy" (the last completed node). Fixed by deriving the active step from run events, which log "running" the moment a node starts.

---

## Known Limitations

1. **Approval channel** — The CLI demo uses `input()` for approval, which blocks unattended runs. The API-based scheduler posts runs to "awaiting_approval" status for the user to approve via the frontend when available.

2. **Search quality** — DuckDuckGo provides basic snippets. Adding Tavily improves extracted content quality but requires an API key.

3. **LLM quality on local models** — `llama3.2:3b` has ~30% JSON parse failure rate on structured output. Groq's `llama-3.3-70b-versatile` is much more reliable but has a daily free-tier limit.
