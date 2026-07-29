## Failure 1: Hallucinated source URLs
While extracting claims, the LLM sometimes returned "https://www.example.com" or
null instead of the real source URL, even though the actual URL was in the prompt.
Fix: stopped trusting the model to echo the URL back — attach source_url
programmatically from the page we actually fetched, in code, not via the LLM.

## Failure 2: Hallucinated claim caught by independent Verifier
Hand-injected a false claim ("Hugging Face founded in 1995, based in Antarctica")
against a real source about Hugging Face. The Verifier independently re-fetched
the source and correctly rejected the claim, explaining the source didn't support
it. This confirms the anti-hallucination layer works — the Verifier doesn't
just trust the Researcher's extraction.

## Failure 3: Chroma distance metric mismatch
Assumed Chroma's collection.query() returned cosine distance and converted with
1 - distance, giving similarity=1.000 for completely unrelated claims. Root cause:
Chroma defaults to squared L2 distance unless the collection is explicitly created
with metadata={"hnsw:space": "cosine"}. Verified via a standalone embedding sanity
check (manual cosine similarity) before assuming the embedding model itself was
broken. Recalibrated dedup threshold to 0.75 based on real reworded-claim similarity (0.788).

## Failure 4: Rate limit silently downgraded to false-pass
Verifier's exception handler originally defaulted failed verifications to
verdict="flagged", meaning a claim that errored out (e.g. Groq 429 rate limit)
was treated identically to a claim the model reviewed and found uncertain.
This silently violated the anti-hallucination guarantee — an unverified claim
is not the same as a flagged-but-checked one. Fixed by introducing a distinct
"error" verdict that is excluded from verified_findings (fail-closed), and by
batching claims per source (one LLM call per unique source URL instead of one
per claim) to cut verification calls by ~4-5x and avoid hitting the daily
token limit in the first place.

## Failure 5: Dev-time testing exhausted Groq's daily quota before production runs
Repeated manual testing during development consumed the entire 100k token/day
Groq free tier before the actual pipeline could complete even one full run.
Fixed by making the Verifier's LLM provider configurable (VERIFIER_PROVIDER
env var) — Ollama for unlimited local development/testing, Groq reserved for
final higher-quality verification passes when quota is available. This is a
genuine cost-control decision, not just a workaround.

## Failure 6: Confidence score ignored, only verdict string checked
A claim verdict of "flagged" with confidence=0.0 passed through to the final
briefing as a stated fact, because verify_findings only checked the verdict
label, not the numeric confidence. This meant "flagged but essentially
unsupported" was treated the same as "flagged, probably true." Fixed by
enforcing a MIN_CONFIDENCE threshold (0.5) regardless of verdict label —
this is what actually implements "low-confidence items are flagged, not
stated" from the project requirements, rather than just checking a string.

## Failure 7: Batched JSON output unreliable on small local models
~30% of batched multi-claim verification calls failed to parse as valid JSON
on llama3.2:3b (works fine on Groq's 70B). Fixed with a fallback: on batch
parse failure, retry each claim individually instead of dropping the whole
batch — recovers partial signal instead of failing closed on everything.