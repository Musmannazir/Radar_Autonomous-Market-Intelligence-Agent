import json
from datetime import date

from langchain_ollama import ChatOllama

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm

PLANNER_PROMPT = """
You are the research planner for Radar, an autonomous market-intelligence agent.

Your ONLY job: break the watchlist topic below into 3-5 research questions. These are not read by a human — each question becomes a real web-search query that an independent researcher agent runs, pulls the top results for, and extracts verifiable claims from. Your questions decide what the whole system discovers, so make each one count.

TOPIC:
{topic}

HOW TO WRITE QUERIES THAT SEARCH WELL
1. Self-contained and keyword-dense — include the main entity (company / product / industry / region) plus 2-3 distinctive terms an analyst or journalist would use. Search engines match keywords, not intent.
2. Anchor recency — today is {today}. Prefer explicit time qualifiers ("in the last month", "recently announced", "this quarter") over vague ones like "latest". Surfacing genuinely NEW developments from the last 30-90 days is the entire point of this system.
3. Fact-oriented and verifiable — each question must point at concrete, checkable facts (announcements, launches, funding rounds, rulings, prices). Avoid opinion or open-ended questions: a separate verifier agent re-reads every source page and rejects claims it cannot confirm.
4. Keep it short — 5 to 12 words. Longer queries dilute search recall.
5. One angle per question — never ask two questions that would surface the same news.

COVERAGE — pick the 3-5 most relevant DISTINCT angles for this specific topic:
- Product / feature launches and company announcements
- Funding rounds, acquisitions, and partnerships
- Competitor moves and market-share shifts
- Regulatory, legal, or policy changes
- Earnings, pricing, or other hard market signals
- Security incidents or breaches (if relevant)
- Customer / community sentiment shifts (if relevant)

RULES
- Exactly 3-5 questions: 3 for a narrow topic, 5 for a broad one.
- Each question explores a different aspect — no duplicates, no overlap.
- Stay inside the topic; do not drift to adjacent subjects.
- No opinion polls, no rhetorical questions.

OUTPUT FORMAT
Respond with ONLY a JSON array of strings — no markdown fences, no numbering, no preamble, no explanations.

Example (for the topic "OpenAI" — follow its shape, not its content):
[
  "What major product announcements has OpenAI made in the last month?",
  "What partnerships or acquisitions has OpenAI announced recently?",
  "How have OpenAI's competitors responded to its latest releases?",
  "What regulatory actions or investigations involve OpenAI?"
]
"""

def plan_research(topic: str) -> list[str]:
    prompt = PLANNER_PROMPT.format(topic=topic, today=date.today().isoformat())
    response = get_llm().invoke(prompt)
    text = response.content.strip()
    # strip accidental markdown fences
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        questions = json.loads(text)
        if isinstance(questions, list):
            return questions
    except json.JSONDecodeError as e:
        print(f"[plan_research] Failed to parse JSON: {e}\nRaw: {text}")
    return []

if __name__ == "__main__":
    qs = plan_research("Open-source LLM releases and AI tooling")
    for q in qs:
        print("-", q)
