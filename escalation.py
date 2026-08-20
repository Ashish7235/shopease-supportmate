"""
Phase 2 - Module 4: Escalation Logic
------------------------------------------
Goal: Decide whether a question should be escalated to a human support
agent, based on signals we ALREADY have from retrieval and classification
- no new AI calls needed here, this is plain rule-based logic on top of
existing data.

Escalation triggers (any ONE of these is enough):
  1. No relevant evidence was found (bot can't answer confidently at all)
  2. Priority is "high" (urgent/sensitive issues deserve human eyes)
  3. Category is inherently sensitive (payments - fraud/billing risk)

Keeping this as simple rule-based logic (not another LLM call) is a
deliberate choice: escalation decisions should be predictable and
auditable, not subject to LLM variability. This is worth mentioning in
interviews - not every decision in an AI system needs to BE AI.
"""

# Categories where we escalate regardless of confidence, because getting
# it wrong has real consequences (financial/security related).
ALWAYS_ESCALATE_CATEGORIES = {"payments"}


def check_escalation(evidence_found: bool, category: str, priority: str) -> dict:
    """
    Returns: {"escalate": bool, "reason": str or None}
    """
    if not evidence_found:
        return {
            "escalate": True,
            "reason": "No relevant policy information found for this question.",
        }

    if category in ALWAYS_ESCALATE_CATEGORIES:
        return {
            "escalate": True,
            "reason": f"Category '{category}' requires human review regardless of confidence.",
        }

    if priority == "high":
        return {
            "escalate": True,
            "reason": "Question classified as high priority.",
        }

    return {"escalate": False, "reason": None}


# --- Test it with a few realistic combinations ---
if __name__ == "__main__":
    test_cases = [
        {"evidence_found": True, "category": "returns_refunds", "priority": "medium"},
        {"evidence_found": False, "category": "other", "priority": "low"},
        {"evidence_found": True, "category": "payments", "priority": "low"},
        {"evidence_found": True, "category": "warranty_damaged", "priority": "high"},
    ]

    for case in test_cases:
        result = check_escalation(**case)
        print(f"Input: {case}")
        print(f"  -> {result}\n")