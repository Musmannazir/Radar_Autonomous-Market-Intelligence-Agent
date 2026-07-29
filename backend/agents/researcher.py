import json
from tools.search import search_web
from tools.reader import fetch_page
from langchain_ollama import ChatOllama

llm = ChatOllama(model="llama3.2:3b", temperature=0)

EXTRACT_PROMPT = """You are extracting factual claims from a webpage's text, relevant to this question:
"{question}"

Page content (may be noisy):
{content}

Return ONLY a JSON array of claim strings (no URLs, no objects — just strings), like:
["claim one", "claim two"]

Only include claims explicitly supported by the text above. If nothing relevant, return [].
No markdown fences, no preamble.
"""

def research_question(question: str, max_results: int = 3) -> list[dict]:
    findings = []
    results = search_web(question, max_results=max_results)

    for r in results:
        content = r.get("content", "")
        if not content or len(content.strip()) < 100:
            continue  # skip thin/empty results, same spirit as before

        prompt = EXTRACT_PROMPT.format(
            question=question,
            content=content[:3000],
        )
        try:
            response = llm.invoke(prompt)
            text = response.content.strip().replace("```json", "").replace("```", "").strip()
            claims = json.loads(text)
            if isinstance(claims, list):
                for claim_text in claims:
                    if isinstance(claim_text, str) and claim_text.strip():
                        findings.append({
                            "claim": claim_text.strip(),
                            "source_url": r["url"],
                            "confidence": None,
                            "is_new": None,
                        })
        except Exception as e:
            print(f"[research_question] Extraction failed for {r['url']}: {e}")
            continue

    return findings

if __name__ == "__main__":
    results = research_question("What is the latest open-source LLM release and its impact on natural language processing?")
    for f in results:
        print(f"- {f['claim']}\n  ({f['source_url']})")