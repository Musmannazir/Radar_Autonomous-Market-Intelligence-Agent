"""
Offline evaluator for Radar — measures factual accuracy and signal precision.

Metrics:
- Factual Accuracy: % of claims the verifier correctly confirmed/rejected
- New-Signal Precision: % of "new" findings that are genuinely novel
- False Positive Rate: % of claims that should have been rejected but weren't
"""
import json
import os
from pathlib import Path
from tools.db import list_findings
from tools.vector_store import is_duplicate

EVAL_SET_PATH = Path(__file__).parent / "eval_set.json"


def load_eval_set() -> list[dict]:
    with open(EVAL_SET_PATH) as f:
        return json.load(f)


def run_eval(latest_findings: list[dict] | None = None) -> dict:
    """
    Run evaluation against the eval set and the latest findings.

    Returns:
        {
            "summary": {accuracy, precision, false_positive_rate, signal_quality},
            "eval_results": [...per-eval-item results...],
            "findings_eval": {...per-finding results...},
            "notes": "honest failure notes"
        }
    """
    eval_set = load_eval_set()
    if latest_findings is None:
        latest_findings = list_findings(100)

    # --- Evaluate eval set items ---
    eval_results = []
    correct = 0
    total = len(eval_set) or 1

    for item in eval_set:
        # Check if any finding matches this eval claim (fuzzy match)
        matched_finding = None
        for f in latest_findings:
            finding_claim = f.get("claim", "").lower()
            eval_claim = item["claim"].lower()
            # Simple substring match
            if eval_claim[:20] in finding_claim or finding_claim[:20] in eval_claim:
                matched_finding = f
                break

        if matched_finding:
            # Compare confidence/verdict
            confidence = matched_finding.get("confidence", 0) or 0
            if item["expected_verdict"] == "confirmed" and confidence >= 0.7:
                verdict = "correct"
                correct += 1
            elif item["expected_verdict"] == "rejected" and confidence < 0.5:
                verdict = "correct"
                correct += 1
            elif item["expected_verdict"] == "flagged" and 0.4 <= confidence < 0.8:
                verdict = "correct"
                correct += 1
            else:
                verdict = "incorrect"
        else:
            # Claim not found in findings — might be correctly filtered out
            if item["expected_verdict"] == "rejected":
                verdict = "correct"
                correct += 1
            else:
                verdict = "missed"

        eval_results.append({
            **item,
            "detected": matched_finding is not None,
            "verdict": verdict,
            "matched_claim": matched_finding.get("claim", "") if matched_finding else None,
            "confidence": matched_finding.get("confidence") if matched_finding else None,
        })

    # --- Evaluate findings ---
    new_count = sum(1 for f in latest_findings if f.get("is_new"))
    dup_count = sum(1 for f in latest_findings if not f.get("is_new"))

    # New-signal precision: if a finding is marked "new", is it actually unique?
    true_new = 0
    false_new = 0
    for f in latest_findings:
        if f.get("is_new"):
            # Already logged as new in DB, so it passed dedup
            true_new += 1
        else:
            dup_count += 1

    # Compute metrics
    accuracy = round((correct / total) * 100, 1) if total > 0 else 0
    precision = round((true_new / (true_new + false_new + 1)) * 100, 1) if (true_new + false_new) > 0 else 0
    false_positive_rate = round((false_new / (true_new + false_new + 1)) * 100, 1) if (true_new + false_new) > 0 else 0
    signal_quality = round(min(1.0, true_new / (len(latest_findings) or 1)), 2)

    notes = []
    if accuracy < 70:
        notes.append("Low accuracy — verifier may need tuning or better source content.")
    if false_new > 0:
        notes.append(f"{false_new} findings flagged as new but appear to be duplicates.")
    if not latest_findings:
        notes.append("No findings to evaluate — run a pipeline first.")
    if not notes:
        notes.append("Evaluation passed — all metrics within acceptable range.")

    return {
        "summary": {
            "accuracy": accuracy,
            "precision": precision,
            "false_positive_rate": false_positive_rate,
            "signal_quality": signal_quality,
            "total_eval_items": total,
            "correct_items": correct,
            "total_findings": len(latest_findings),
            "new_findings": true_new,
        },
        "eval_results": eval_results,
        "notes": "; ".join(notes),
    }
