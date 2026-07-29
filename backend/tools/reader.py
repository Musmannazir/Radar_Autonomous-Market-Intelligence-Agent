import requests
import trafilatura
from bs4 import BeautifulSoup
from datetime import datetime, timezone

HEADERS = {"User-Agent": "Mozilla/5.0 (Radar research bot)"}

def fetch_page(url: str, timeout: int = 10) -> dict:
    """
    Always returns {content, source_url, fetched_at, success}.
    Never raises — dead links, timeouts, paywalls all degrade gracefully.
    """
    result = {
        "content": None,
        "source_url": url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "success": False,
    }

    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        resp.raise_for_status()
    except Exception as e:
        print(f"[fetch_page] Request failed for {url}: {e}")
        return result

    html = resp.text

    # Try trafilatura first — best at stripping ads/boilerplate
    extracted = trafilatura.extract(html)
    if extracted and len(extracted.strip()) > 100:
        result["content"] = extracted.strip()
        result["success"] = True
        return result

    # Fallback: BeautifulSoup basic text extraction
    try:
        soup = BeautifulSoup(html, "html.parser")
        text = " ".join(soup.stripped_strings)
        if text and len(text.strip()) > 100:
            result["content"] = text.strip()[:5000]  # cap length
            result["success"] = True
            return result
    except Exception as e:
        print(f"[fetch_page] BeautifulSoup fallback failed for {url}: {e}")

    # Both failed — likely paywall, junk page, or too little content
    print(f"[fetch_page] No usable content extracted from {url}")
    return result

if __name__ == "__main__":
    test_urls = [
        "https://www.bbc.com/news",
        "https://this-domain-does-not-exist-xyz123.com",
        "https://httpstat.us/404",
    ]
    for url in test_urls:
        r = fetch_page(url)
        print(f"{url} -> success={r['success']}, content_len={len(r['content'] or '')}")