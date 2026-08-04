from langchain_ollama import ChatOllama

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm
WRITER_PROMPT = """You are writing a concise briefing for a team tracking: "{topic}"

Below are NEW, verified findings since the last briefing, split into two groups.

HIGH-CONFIDENCE findings (confidence >= 0.7) — present these as established facts:
{confirmed_text}

LOWER-CONFIDENCE findings (confidence 0.5-0.69) — present these under a clearly
labeled "Unconfirmed / needs review" section, explicitly noting they are uncertain:
{flagged_text}

For each finding: a brief "why it matters" note, and end with its source URL in parentheses.
Do not invent anything beyond what's given. Keep it tight and professional. No markdown fences.
"""

def write_briefing(topic: str, new_findings: list[dict]) -> str:
    if not new_findings:
        return f"No new developments for '{topic}' since the last briefing."

    confirmed = [f for f in new_findings if f.get("confidence", 0) >= 0.7]
    flagged = [f for f in new_findings if f.get("confidence", 0) < 0.7]

    def fmt(findings):
        return "\n".join(
            f"- {f['claim']} (confidence: {f.get('confidence', 'n/a')}) [source: {f['source_url']}]"
            for f in findings
        ) or "(none)"

    prompt = WRITER_PROMPT.format(
        topic=topic,
        confirmed_text=fmt(confirmed),
        flagged_text=fmt(flagged),
    )
    response = get_llm().invoke(prompt)
    return response.content.strip()