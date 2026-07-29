from tavily import TavilyClient
from config import TAVILY_API_KEY
from tenacity import retry, stop_after_attempt, wait_exponential

client = TavilyClient(api_key=TAVILY_API_KEY)

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def search_web(query: str, max_results: int = 5) -> list[dict]:
    """
    Returns list of {title, url, snippet, content}. 'content' is Tavily's
    already-extracted page text — often good enough to skip fetch_page().
    Never raises to the caller if all retries fail — returns empty list instead.
    """
    try:
        response = client.search(query=query, max_results=max_results, include_raw_content=False)
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "snippet": r.get("content", "")[:300],
                "content": r.get("content", ""),  # usable directly, no separate fetch needed
            }
            for r in response.get("results", [])
            if r.get("url")
        ]
    except Exception as e:
        print(f"[search_web] Failed for query '{query}': {e}")
        return []

if __name__ == "__main__":
    results = search_web("open-source LLM releases 2026", max_results=3)
    for r in results:
        print(r["title"], "->", r["url"])
        print(f"  content preview: {r['content'][:150]}...\n")