from langchain_ollama import ChatOllama

llm = ChatOllama(model="llama3.2:3b", temperature=0)
WRITER_PROMPT = """You are writing a concise briefing for a team tracking: "{topic}"

Below are NEW, verified findings since the last briefing. Write a short briefing with:
- A 1-2 sentence overview
- Bullet points per finding, each with a brief "why it matters" note
- Each bullet MUST end with its source URL in parentheses

Findings:
{findings_text}

Do not invent anything beyond what's given. Keep it tight and professional. No markdown fences.
"""

def write_briefing(topic: str, new_findings: list[dict]) -> str:
    if not new_findings:
        return f"No new developments for '{topic}' since the last briefing."

    findings_text = "\n".join(
        f"- {f['claim']} (confidence: {f.get('confidence', 'n/a')}) [source: {f['source_url']}]"
        for f in new_findings
    )
    prompt = WRITER_PROMPT.format(topic=topic, findings_text=findings_text)
    response = llm.invoke(prompt)
    return response.content.strip()

if __name__ == "__main__":
    test_findings = [
        {"claim": "GLM 5.1 is a 744B-parameter MoE open-source LLM with a 200K token context",
         "source_url": "https://www.datacamp.com/blog/top-open-source-llms", "confidence": 0.9},
        {"claim": "Ollama provides a user-friendly platform for running LLMs locally",
         "source_url": "https://modelroost.com/ollama/alternatives", "confidence": 0.85},
    ]
    briefing = write_briefing("Open-source LLM releases and AI tooling", test_findings)
    print(briefing)