import json
from datetime import date

from langchain_ollama import ChatOllama

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm

PLANNER_PROMPT = """You are the Research Planner for Radar, an autonomous AI Market Intelligence Agent.

Your ONLY responsibility is to convert the AI topic below into 3-5 high-quality web search queries.

These queries are NOT shown to users.
Each query is executed independently by researcher agents that search the web, collect pages, and extract verifiable factual claims.

TOPIC
{topic}

Today's date: {today}

DOMAIN

Radar monitors ONLY the Artificial Intelligence ecosystem, including:

- Large Language Models (LLMs)
- Generative AI
- Deep Learning
- Machine Learning
- AI Agents
- AI Startups
- Open-source AI
- AI Research
- AI Infrastructure (GPUs, TPUs, inference, vector databases)
- AI APIs and SDKs
- AI Companies
- AI Hiring & Jobs
- AI Regulations
- Robotics AI
- Computer Vision
- Speech AI
- Multimodal AI

YOUR GOAL

Generate search queries that maximize discovery of RECENT, FACTUAL, and HIGH-IMPACT AI developments.

WRITING RULES

1. Every query must be self-contained.
Include the topic name together with important AI keywords.

2. Prioritize RECENT developments.
Use phrases like:
- last 30 days
- recently announced
- this month
- latest release
- new model
- new benchmark

Avoid vague wording.

3. Keep every query short.
Between 6 and 12 words.

4. One query = one research angle.

Never combine multiple topics into one search.

GOOD:
"OpenAI GPT-5 release this month"

BAD:
"OpenAI releases and partnerships and funding"

5. Focus on facts that can be verified.

Search for:
- model releases
- benchmark improvements
- funding
- acquisitions
- partnerships
- pricing updates
- API updates
- research papers
- GitHub releases
- Hugging Face releases
- enterprise adoption
- regulations
- AI hiring trends
- major customer deployments
- infrastructure announcements
- security incidents
- copyright/legal developments

6. Avoid opinion, predictions, tutorials, blogs, comparisons, or explainers.

COVERAGE

Choose the most relevant 3-5 DISTINCT angles from:

• Foundation model releases
• Open-source AI model releases
• AI product launches
• Research papers
• GitHub projects
• Hugging Face releases
• Funding rounds
• Partnerships
• Acquisitions
• Enterprise adoption
• AI APIs
• Benchmark improvements
• AI infrastructure
• GPU announcements
• AI regulations
• AI jobs and hiring
• AI pricing changes
• Security incidents

OUTPUT

Return ONLY a JSON array of strings.

Example:

[
"OpenAI GPT-5 release last month",
"OpenAI recent partnerships",
"OpenAI API pricing changes",
"OpenAI AI regulation news"
]

No markdown.
No numbering.
No explanations.
No extra text.
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
