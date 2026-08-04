import json
from langchain_ollama import ChatOllama

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm

PLANNER_PROMPT = """You are a research planner. Given a topic, break it into 3-5 specific, \
searchable research questions that would surface recent, concrete news or developments.

Topic: {topic}

Respond with ONLY a JSON array of strings, no preamble, no markdown fences. Example:
["question 1", "question 2", "question 3"]
"""

def plan_research(topic: str) -> list[str]:
    prompt = PLANNER_PROMPT.format(topic=topic)
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