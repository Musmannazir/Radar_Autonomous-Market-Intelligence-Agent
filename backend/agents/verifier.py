import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
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


def _parse_json_array(text: str) -> list:
    """Try parsing JSON array with multiple fallback strategies for common LLM issues."""
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    # Strategy 1: direct parse
    try:
        result = json.loads(text)
        if isinstance(result, list):
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 2: find the JSON array in the text (LLM sometimes adds preamble/postamble)
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, list):
                return result
        except (json.JSONDecodeError, ValueError):
            pass

    # Strategy 3: fix common issues — trailing commas, newlines inside strings
    cleaned = re.sub(r',\s*([}\]])', r'\1', text)
    cleaned = cleaned.replace('\n', ' ')
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    # Strategy 4: extract individual objects via regex, fixing unescaped quotes
    # Handles the case where LLM puts "inner" quotes inside a "reason" string
    objs = re.findall(r'\{[^{}]*"index"\s*:\s*\d+[^{}]*\}', text)
    if objs:
        results = []
        for obj_str in objs:
            # Fix: in each object, find all "key": "value" pairs and escape
            # unescaped quotes inside the value
            fixed = obj_str
            # Replace "key": "val with "inner" quotes" patterns
            # by matching key-value pairs and cleaning their values
            fixed = re.sub(
                r'("(?:verdict|reason|index|confidence)")\s*:\s*("(?:[^"]*"(?:[^"]*"[^"]*)*?")")',
                lambda m: m.group(0),  # already quoted — leave alone
                fixed
            )
            # More aggressive: for "reason" fields, extract everything between
            # the first quote after "reason": and the last quote before }
            reason_match = re.search(r'"reason"\s*:\s*"(.+)"\s*}', fixed)
            if reason_match:
                reason_val = reason_match.group(1)
                # Clean: replace inner unescaped quotes
                reason_val = reason_val.replace('"', '\\"')
                fixed = fixed[:reason_match.start(1)] + reason_val + fixed[reason_match.end(1):]
            try:
                parsed = json.loads(fixed)
                if isinstance(parsed, dict) and "index" in parsed:
                    results.append(parsed)
            except (json.JSONDecodeError, ValueError):
                continue
        if results:
            return results

    return []


BATCH_VERIFY_PROMPT = """You are a strict fact-checker. You will be shown several CLAIMS that were \
supposedly extracted from the SOURCE TEXT below. For EACH claim, judge whether the source text \
actually supports it — do not use outside knowledge.

SOURCE TEXT (may be long/noisy):
{source_text}

CLAIMS (numbered):
{claims_list}

Respond with ONLY a JSON array, one object per claim, in the same order, no markdown fences:
[{{"index": 0, "verdict": "confirmed" | "flagged" | "rejected", "confidence": 0.0-1.0, "reason": "one sentence"}}]"""


def verify_single(claim: str, source_text: str, source_url: str) -> dict:
    """Fallback: verify one claim at a time when batch parsing fails."""
    prompt = BATCH_VERIFY_PROMPT.format(source_text=source_text, claims_list=f"0. {claim}")
    try:
        response = get_llm().invoke(prompt)
        text = response.content.strip()
        results = _parse_json_array(text)
        if results:
            r = results[0]
            return {
                "claim": claim, "source_url": source_url,
                "confidence": float(r.get("confidence", 0.0)),
                "verdict": r.get("verdict", "flagged"),
                "reason": r.get("reason", ""),
            }
    except Exception as e:
        pass
    return {"claim": claim, "source_url": source_url, "confidence": 0.0,
             "verdict": "error", "reason": "Verification failed"}


def verify_batch(claims: list[str], source_url: str, cached_content: str = None) -> list[dict]:
    # Use cached content from researcher if available, otherwise fetch
    if cached_content and len(cached_content.strip()) > 100:
        page_content = cached_content
        page_success = True
    else:
        page = fetch_page(source_url)
        page_content = page.get("content", "")
        page_success = page.get("success", False)

    if not page_success or not page_content or len(page_content.strip()) < 100:
        return [{"claim": c, "source_url": source_url, "confidence": 0.0,
                  "verdict": "rejected", "reason": "Source unreachable or empty"}
                for c in claims]

    claims_list = "\n".join(f"{i}. {c}" for i, c in enumerate(claims))
    prompt = BATCH_VERIFY_PROMPT.format(source_text=page_content[:3000], claims_list=claims_list)

    try:
        response = get_llm().invoke(prompt)
        text = response.content.strip()
        results = _parse_json_array(text)

        if results:
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
        print(f"[verify_batch] Batch failed for {source_url}: {e}")

    # Fallback: retry each claim individually
    print(f"[verify_batch] Retrying {len(claims)} claims individually for {source_url}")
    return [verify_single(c, page_content[:3000], source_url) for c in claims]


MIN_CONFIDENCE = 0.5


def _verify_source(source_url: str, claims: list[str], cached_content: str = None) -> tuple[list[dict], list[str]]:
    """Verify all claims from a single source. Returns (verified, errors)."""
    results = verify_batch(claims, source_url, cached_content=cached_content)
    verified = []
    errors = []
    for r in results:
        if r["verdict"] in ("confirmed", "flagged") and r["confidence"] >= MIN_CONFIDENCE:
            verified.append({
                "claim": r["claim"], "source_url": r["source_url"],
                "confidence": r["confidence"], "is_new": None,
            })
        elif r["verdict"] == "error":
            errors.append(r["reason"])
        else:
            print(f"[REJECTED] '{r['claim'][:60]}...' — confidence={r['confidence']:.2f}, {r.get('reason', '')}")
    return verified, errors


def verify_findings(findings: list[dict]) -> tuple[list[dict], list[str]]:
    # Group claims by source and collect cached content
    by_source: dict[str, tuple[list[str], str]] = {}
    for f in findings:
        url = f["source_url"]
        if url not in by_source:
            by_source[url] = ([], f.get("source_content", ""))
        by_source[url][0].append(f["claim"])

    verified = []
    errors = []

    # Parallel verification across sources
    with ThreadPoolExecutor(max_workers=min(4, len(by_source) or 1)) as executor:
        futures = {
            executor.submit(_verify_source, url, claims, content): url
            for url, (claims, content) in by_source.items()
        }
        for future in as_completed(futures):
            url = futures[future]
            try:
                v, e = future.result()
                verified.extend(v)
                errors.extend(e)
            except Exception as ex:
                print(f"[verify_findings] Source {url} failed: {ex}")
                errors.append(f"Source verification failed: {url}")

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