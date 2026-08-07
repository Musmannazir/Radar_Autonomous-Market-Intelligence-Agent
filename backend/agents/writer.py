from langchain_ollama import ChatOllama

llm = None


def get_llm():
    global llm
    if llm is None:
        llm = ChatOllama(model="llama3.2:3b", temperature=0)
    return llm

WRITER_PROMPT = """You are the Report Writer for Radar, an autonomous AI Market Intelligence system.

Your ONLY responsibility is to transform verified AI findings into a concise, professional market intelligence briefing.

You MUST use ONLY the information provided below.

====================================================
TOPIC
====================================================

{topic}

====================================================
CONFIRMED FINDINGS
(Confidence >= 0.70)
====================================================

{confirmed_text}

====================================================
UNCONFIRMED FINDINGS
(Confidence 0.50 - 0.69)
====================================================

{flagged_text}

====================================================
REVIEWER FEEDBACK
====================================================

{feedback_section}

====================================================
GOAL
====================================================

Write a professional AI market intelligence briefing suitable for executives, engineers, researchers and product managers.

The briefing should be readable in under two minutes.

====================================================
RULES
====================================================

1. Use ONLY the supplied findings.

2. Never:
- invent facts
- speculate
- use outside knowledge
- exaggerate findings
- merge unrelated findings

3. Preserve exactly:
- company names
- model names
- version numbers
- API names
- benchmark names
- funding amounts
- prices
- dates
- organizations
- repository names

4. Do NOT mention confidence scores.

5. Separate findings into:

• Confirmed Developments

• Unconfirmed / Needs Review

6. Every finding must include:

• Finding

• Why it matters (maximum 2 sentences)

• Source URL

7. Avoid repeating similar findings.

If two findings describe the same event,
combine them into one concise point without changing the facts.

8. Use a neutral analyst tone.

Avoid:
- hype
- opinions
- marketing language
- speculation

9. If reviewer feedback exists,
apply it naturally.

10. If there are no confirmed findings,
state:

"No confirmed developments were identified."

11. If there are no unconfirmed findings,
omit that section completely.

12. If there are no findings at all,
return exactly:

No new verified developments were identified.

====================================================
OUTPUT FORMAT
====================================================

Radar AI Market Intelligence Brief

Topic: {topic}

Date: Today's briefing

--------------------------------------------------

Executive Summary

Write exactly 2–3 sentences summarizing:

• the biggest developments

• overall AI trend

• companies or technologies receiving the most attention

Do not repeat the detailed findings.

--------------------------------------------------

Confirmed Developments

For each finding use this format:

### Finding

<claim>

Why it matters

<one or two concise sentences>

Source

<URL>

--------------------------------------------------

Unconfirmed / Needs Review

Include only if unconfirmed findings exist.

For each finding use:

### Finding

<claim>

Why it matters

<one short sentence>

Source

<URL>

--------------------------------------------------

Overall Assessment

Write one short paragraph (3–5 sentences) summarizing:

• overall market direction

• major AI trends

• notable companies

• technologies worth monitoring

Base this ONLY on the supplied findings.

--------------------------------------------------

Generated automatically by Radar
Autonomous AI Market Intelligence Agent

====================================================

Return ONLY the completed briefing.

No markdown fences.

No explanations.

No confidence scores."""

def write_briefing(topic: str, new_findings: list[dict], past_rejection_feedback: list[str] | None = None) -> str:
    if not new_findings:
        return f"No new developments for '{topic}' since the last briefing."

    confirmed = [f for f in new_findings if f.get("confidence", 0) >= 0.7]
    flagged = [f for f in new_findings if f.get("confidence", 0) < 0.7]

    def fmt(findings):
        return "\n".join(
            f"- {f['claim']} (confidence: {f.get('confidence', 'n/a')}) [source: {f['source_url']}]"
            for f in findings
        ) or "(none)"

    # Build the human feedback section so the writer learns from past rejections.
    feedback_section = ""
    if past_rejection_feedback:
        feedback_lines = "\n".join(f"- \"{fb}\"" for fb in past_rejection_feedback[:3])
        feedback_section = (
            "\n\nIMPORTANT — PAST HUMAN FEEDBACK (learn from these to avoid repeating mistakes):\n"
            f"{feedback_lines}\n"
            "Apply this feedback when shaping the briefing above."
        )

    prompt = WRITER_PROMPT.format(
        topic=topic,
        confirmed_text=fmt(confirmed),
        flagged_text=fmt(flagged),
        feedback_section=feedback_section,
    )
    response = get_llm().invoke(prompt)
    return response.content.strip()
