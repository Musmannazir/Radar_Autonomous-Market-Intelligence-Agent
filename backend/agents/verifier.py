import json
from collections import defaultdict
from config import GROQ_API_KEY, VERIFIER_PROVIDER
from tools.reader import fetch_page


def _get_llm():
    if VERIFIER_PROVIDER == "groq":
        if not GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured")
        from langchain_groq import ChatGroq
        return ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=GROQ_API_KEY, temperature=0)

    from langchain_ollama import ChatOllama
    return ChatOllama(model="llama3.2:3b", temperature=0)


llm = None


def get_llm():
    global llm
    if llm is None:
        llm = _get_llm()
    return llm

BATCH_VERIFY_PROMPT = """You are a strict fact-checker. You will be shown several CLAIMS that were \
supposedly extracted from the SOURCE TEXT below. For EACH claim, judge whether the source text \
actually supports it — do not use outside knowledge.

SOURCE TEXT (may be long/noisy):
{source_text}

CLAIMS (numbered):
{claims_list}

Respond with ONLY a JSON array, one object per claim, in the same order, no markdown fences:
[{{"index": 0, "verdict": "confirmed" | "flagged" | "rejected", "confidence": 0.0-1.0, "reason": "one sentence"}}, ...]
"""

def verify_single(claim: str, source_text: str, source_url: str) -> dict:
    """Fallback: verify one claim at a time when batch parsing fails."""
    prompt = BATCH_VERIFY_PROMPT.format(source_text=source_text, claims_list=f"0. {claim}")
    try:
        response = get_llm().invoke(prompt)
        text = response.content.strip().replace("```json", "").replace("```", "").strip()
        results = json.loads(text)
        r = results[0]
        return {
            "claim": claim, "source_url": source_url,
            "confidence": float(r.get("confidence", 0.0)),
            "verdict": r.get("verdict", "flagged"),
            "reason": r.get("reason", ""),
        }
    except Exception as e:
        return {"claim": claim, "source_url": source_url, "confidence": 0.0,
                 "verdict": "error", "reason": f"Individual retry also failed: {e}"}

def verify_batch(claims: list[str], source_url: str) -> list[dict]:
    page = fetch_page(source_url)
    if not page["success"] or not page["content"]:
        return [{"claim": c, "source_url": source_url, "confidence": 0.0,
                  "verdict": "rejected", "reason": "Source unreachable or empty on re-fetch"}
                for c in claims]

    claims_list = "\n".join(f"{i}. {c}" for i, c in enumerate(claims))
    prompt = BATCH_VERIFY_PROMPT.format(source_text=page["content"][:3000], claims_list=claims_list)

    try:
        response = llm.invoke(prompt)
        text = response.content.strip().replace("```json", "").replace("```", "").strip()
        results = json.loads(text)
        output = []
        for r in results:
            idx = r.get("index")
            if idx is None or idx >= len(claims):
                continue
            output.append({
                "claim": claims[idx], "source_url": source_url,
                "confidence": float(r.get("confidence", 0.0)),
                "verdict": r.get("verdict", "flagged"),
                "reason": r.get("reason", ""),
            })
        return output
    except Exception as e:
        print(f"[verify_batch] Batch parse failed for {source_url}, retrying individually: {e}")
        # Fallback: retry each claim one at a time instead of dropping the whole batch
        return [verify_single(c, page["content"][:3000], source_url) for c in claims]

MIN_CONFIDENCE = 0.5  # below this, treat as unverifiable even if verdict says "flagged"

def verify_findings(findings: list[dict]) -> tuple[list[dict], list[str]]:
    by_source = defaultdict(list)
    for f in findings:
        by_source[f["source_url"]].append(f["claim"])

    verified = []
    errors = []
    for source_url, claims in by_source.items():
        results = verify_batch(claims, source_url)
        for r in results:
            if r["verdict"] == "confirmed" and r["confidence"] >= MIN_CONFIDENCE:
                verified.append({
                    "claim": r["claim"], "source_url": r["source_url"],
                    "confidence": r["confidence"], "is_new": None,
                })
            elif r["verdict"] == "flagged" and r["confidence"] >= MIN_CONFIDENCE:
                verified.append({
                    "claim": r["claim"], "source_url": r["source_url"],
                    "confidence": r["confidence"], "is_new": None,
                })
            elif r["verdict"] == "error":
                errors.append(r["reason"])
                print(f"[UNVERIFIED - excluded] '{r['claim'][:60]}...' — {r['reason']}")
            else:
                print(f"[REJECTED] '{r['claim'][:60]}...' — confidence={r['confidence']:.2f}, {r.get('reason','')}")

    return verified, errors

if __name__ == "__main__":
    test_findings = [
        {"claim": "Hugging Face hosts over 400,000 models with 84% open source",
         "source_url": "https://hakia.com/tech-insights/open-source-ai-ecosystem/"},
        {"claim": "Open source models like Llama 3.1 and Mistral now rival GPT-4 performance",
         "source_url": "https://hakia.com/tech-insights/open-source-ai-ecosystem/"},
        {"claim": "Hugging Face was founded in 1995 and is based in Antarctica",
         "source_url": "https://hakia.com/tech-insights/open-source-ai-ecosystem/"},
    ]
    verified, errors = verify_findings(test_findings)
    print(f"\n-> {len(verified)} verified, {len(errors)} errors")
    for v in verified:
        print(f"- {v['claim']} (confidence={v['confidence']})")