from typing import TypedDict, List, Optional
import operator
from typing import Annotated

class Finding(TypedDict):
    claim: str
    source_url: str
    confidence: Optional[float]
    is_new: Optional[bool]
    source_content: Optional[str]  # cached page text from researcher (avoids re-fetch in verifier)

class AgentState(TypedDict):
    run_id: str
    watchlist_item: str
    sub_questions: List[str]
    raw_findings: Annotated[List[Finding], operator.add]  # accumulates from parallel researchers
    verified_findings: List[Finding]
    new_findings: List[Finding]
    briefing_draft: str
    approval_status: str  # "pending" | "approved" | "edited" | "rejected"
    errors: Annotated[List[str], operator.add]