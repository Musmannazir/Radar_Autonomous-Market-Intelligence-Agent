from config import TAVILY_API_KEY

# Search providers — DuckDuckGo is free and keyless; Tavily is a paid fallback.
_tavily_client = None
if TAVILY_API_KEY:
    try:
        from tavily import TavilyClient
        _tavily_client = TavilyClient(api_key=TAVILY_API_KEY)
    except Exception:
        pass

from tenacity import retry, stop_after_attempt, wait_exponential


def _search_ddgs(query: str, max_results: int = 5) -> list[dict]:
    """DuckDuckGo search — free, no API key required."""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "snippet": r.get("body", "")[:300],
                "content": r.get("body", ""),
            }
            for r in results
            if r.get("href")
        ]
    except Exception as e:
        print(f"[search_ddgs] Failed for '{query}': {e}")
        return []


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _search_tavily(query: str, max_results: int = 5) -> list[dict]:
    """Tavily search — requires API key, better extracted content."""
    response = _tavily_client.search(query=query, max_results=max_results, include_raw_content=False)
    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", "")[:300],
            "content": r.get("content", ""),
        }
        for r in response.get("results", [])
        if r.get("url")
    ]


def search_web(query: str, max_results: int = 5) -> list[dict]:
    """
    Returns list of {title, url, snippet, content}.
    Tries DuckDuckGo first (free, no key). Falls back to Tavily if configured.
    Never raises to the caller — returns empty list on failure.
    """
    # Try DuckDuckGo first
    results = _search_ddgs(query, max_results)
    if results:
        return results

    # Fall back to Tavily if configured
    if _tavily_client:
        try:
            return _search_tavily(query, max_results)
        except Exception as e:
            print(f"[search_tavily] Failed for '{query}': {e}")

    return []