"""
Offline evaluator for Radar — measures factual accuracy and signal precision.

Metrics:
- Factual Accuracy: % of eval-set claims the pipeline handled correctly
- Verifier Precision (F1): of eval items the verifier would confirm, the % that were correct
- False Positive Rate: % of "should be rejected" items the verifier wrongly confirmed
- Signal Quality Index: fraction of latest findings that are high-confidence new signals
"""
import json
import os
from pathlib import Path
from tools.db import list_findings
from tools.vector_store import is_duplicate

EVAL_SET_PATH = Path(__file__).parent / "eval_set.json"

# Thresholds derived from the verifier's MIN_CONFIDENCE (0.5)
CONFIRMED_THRESHOLD = 0.7   # confidence >= 0.7 → confirmed
FLAGGED_LOW = 0.4           # confidence in [0.4, 0.7) → flagged/needs review


def load_eval_set() -> list[dict]:
    with open(EVAL_SET_PATH) as f:
        return json.load(f)


def run_eval(latest_findings: list[dict] | None = None) -> dict:
    """
    Run evaluation against the eval set and the latest findings.

    Returns:
        {
            "summary": {accuracy, precision, false_positive_rate, signal_quality, ...},
            "eval_results": [...per-eval-item results...],
            "findings": latest_findings,
            "notes": "honest failure notes"
        }
    """
    eval_set = load_eval_set()
    if latest_findings is None:
        latest_findings = list_findings(100)

    # --- Evaluate eval set items using confusion matrix ---
    eval_results = []
    correct = 0
    tp = fp = tn = fn = 0          # confusion matrix
    total = len(eval_set) or 1

    for item in eval_set:
        # Fuzzy match: check if any finding's claim overlaps with this eval claim
        matched_finding = None
        for f in latest_findings:
            finding_claim = f.get("claim", "").lower()
            eval_claim = item["claim"].lower()
            if eval_claim[:20] in finding_claim or finding_claim[:20] in eval_claim:
                matched_finding = f
                break

        if matched_finding:
            confidence = matched_finding.get("confidence", 0) or 0
            expected = item["expected_verdict"]

            if expected == "confirmed" and confidence >= CONFIRMED_THRESHOLD:
                verdict = "correct"
                correct += 1
                tp += 1
            elif expected == "flagged" and FLAGGED_LOW <= confidence < CONFIRMED_THRESHOLD:
                verdict = "correct"
                correct += 1
                tp += 1
            elif expected == "rejected" and confidence >= 0.5:
                # Hallucination slipped through — false positive
                verdict = "false_positive"
                fp += 1
            elif expected == "rejected":
                # Detected but low confidence → verifier correctly skeptical
                verdict = "correct"
                correct += 1
                tn += 1
            else:
                # Wrong confidence band or missed threshold
                verdict = "incorrect"
                fn += 1
        else:
            # Claim not found in findings
            if item["expected_verdict"] == "rejected":
                verdict = "correct"
                correct += 1
                tn += 1
            else:
                verdict = "missed"
                fn += 1

        eval_results.append({
            **item,
            "detected": matched_finding is not None,
            "verdict": verdict,
            "matched_claim": matched_finding.get("claim", "") if matched_finding else None,
            "confidence": matched_finding.get("confidence") if matched_finding else None,
        })

    # --- Confusion-matrix metrics (all real) ---
    accuracy = round((correct / total) * 100, 1) if total > 0 else 0
    precision = round((tp / (tp + fp)) * 100, 1) if (tp + fp) > 0 else 0.0
    false_positive_rate = round((fp / (fp + tn)) * 100, 1) if (fp + tn) > 0 else 0.0

    # --- Signal Quality: fraction of latest findings that are high-confidence new signals ---
    new_count = sum(1 for f in latest_findings if f.get("is_new"))
    high_conf_new = sum(
        1 for f in latest_findings
        if f.get("is_new") and (f.get("confidence") or 0) >= CONFIRMED_THRESHOLD
    )
    signal_quality = round(high_conf_new / (len(latest_findings) or 1), 2)

    # --- Honest notes ---
    notes = []
    if accuracy < 50:
        notes.append(
            f"Accuracy {accuracy}% — most eval-set claims were not detected in recent findings "
            "(pipeline topics may not overlap with ground-truth test cases)."
        )
    if (tp + fp) == 0:
        notes.append(
            "No eval-set claims detected in recent findings — verifier precision is undefined "
            "(TP=0, FP=0). Run the pipeline on topics matching the eval suite to populate this metric."
        )
    if fp > 0:
        notes.append(f"False positive: {fp} hallucination(s) slipped through the verifier (confidence >= 0.5).")
    if new_count == 0:
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
            "new_findings": new_count,
            "high_confidence_new_findings": high_conf_new,
        },
        "eval_results": eval_results,
        "findings": latest_findings,
        "notes": "; ".join(notes),
    }
