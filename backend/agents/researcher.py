import json
import re
from tools.search import search_web
from tools.run_events import record_cost
from config import MAX_SEARCH_CALLS_PER_RUN
from langchain_ollama import ChatOllama

# Module-level search budget shared across parallel researchers in a run.
_searches_used = 0


def _can_search() -> bool:
    global _searches_used
    if _searches_used < MAX_SEARCH_CALLS_PER_RUN:
        _searches_used += 1
        return True
    return False

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm


def _parse_json_array(text: str) -> list:
    """Try parsing JSON array with fallback strategies for common LLM issues."""
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

    # Strategy 2: extract JSON array from text
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group(0))
            if isinstance(result, list):
                return result
        except (json.JSONDecodeError, ValueError):
            pass

    # Strategy 3: fix trailing commas
    cleaned = re.sub(r',\s*([}\]])', r'\1', text)
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
    except (json.JSONDecodeError, ValueError):
        pass

    return []


EXTRACT_PROMPT = """You are the Research Extraction Agent for Radar, an autonomous AI Market Intelligence system.

Your task is to extract ONLY factual claims from a webpage that directly answer the research question.

RESEARCH QUESTION

"{question}"

WEBPAGE CONTENT

{content}

DOMAIN

Radar tracks only Artificial Intelligence news and developments.

Relevant topics include:

- LLMs
- Generative AI
- Deep Learning
- Machine Learning
- AI Agents
- Open-source AI
- AI Startups
- Foundation Models
- AI APIs
- AI Research
- AI Infrastructure
- GPUs
- AI Jobs
- AI Regulations
- AI Products
- Robotics AI
- Computer Vision
- Speech AI
- Multimodal AI

INSTRUCTIONS

Extract ONLY claims that are explicitly stated in the webpage.

Never:

- infer
- summarize
- speculate
- predict
- combine multiple statements
- rewrite facts beyond their meaning

Ignore:

- advertisements
- navigation text
- author biographies
- cookie banners
- unrelated company information
- opinions
- marketing language
- tutorials

Prefer factual claims about:

• New AI model releases
• Open-source model releases
• Research paper announcements
• GitHub repositories
• Hugging Face releases
• Funding rounds
• Partnerships
• Acquisitions
• AI startups
• API updates
• Pricing updates
• Benchmark improvements
• Performance metrics
• Enterprise deployments
• AI regulations
• Copyright cases
• GPU announcements
• Inference infrastructure
• AI hiring
• Security incidents

Every claim must:

- be directly supported by the webpage
- be self-contained
- include company/model names whenever available
- preserve dates, numbers, percentages, prices, versions and funding amounts
- be a single sentence
- be under 35 words whenever possible

Remove duplicate or nearly identical claims.

If nothing relevant exists, return:

[]

OUTPUT

Return ONLY a valid JSON array of strings.

Example:

[
"OpenAI released GPT-5 on July 15, 2026.",
"Meta released Llama 4 under an open-source license.",
"NVIDIA announced new Blackwell GPU availability."
]

No markdown.

No explanations.

No numbering.

No URLs.

When uncertain, DO NOT include the claim.
"""


def research_question(question: str, max_results: int = 3, run_id: str = "") -> list[dict]:
    findings = []
    if not _can_search():
        print(f"[research_question] Search budget exhausted — skipping '{question}'")
        return findings
    results = search_web(question, max_results=max_results)
    record_cost(run_id, search_calls=1)

    for r in results:
        content = r.get("content", "")
        if not content or len(content.strip()) < 100:
            continue

        prompt = EXTRACT_PROMPT.format(
            question=question,
            content=content[:3000],
        )
        try:
            response = get_llm().invoke(prompt)
            record_cost(run_id, llm_calls=1)
            text = response.content.strip()
            claims = _parse_json_array(text)
            if isinstance(claims, list):
                for claim_text in claims:
                    if isinstance(claim_text, str) and claim_text.strip():
                        findings.append({
                            "claim": claim_text.strip(),
                            "source_url": r["url"],
                            "confidence": None,
                            "is_new": None,
                            "source_content": content[:3000],
                        })
        except Exception as e:
            print(f"[research_question] Extraction failed for {r['url']}: {e}")
            continue

    return findings
