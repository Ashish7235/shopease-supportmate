"""
Phase 2 - Module 3: Question Classification
-------------------------------------------------
Goal: Automatically tag each incoming question with:
  - category: which support area it belongs to
  - priority: how urgent it is

This uses a SEPARATE, focused LLM call (not the same call that generates
the answer) - keeping classification and answer-generation as distinct
responsibilities makes each easier to test, debug, and improve
independently. This is a real software design principle (separation of
concerns), not just a RAG-specific idea.
"""

import os
import json
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Fixed, closed set of categories - NOT free text. Constraining the model
# to pick from a known list (rather than "describe the category") is what
# makes the output reliably usable by code afterward (e.g. for routing
# logic, dashboards, filtering).
CATEGORIES = [
    "returns_refunds",
    "shipping_delivery",
    "cancellations",
    "warranty_damaged",
    "payments",
    "account",
    "general_chat",
    "other",
]

PRIORITIES = ["low", "medium", "high"]

classification_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    groq_api_key=GROQ_API_KEY,
)


def classify_question(question: str) -> dict:
    """
    Returns: {"category": str, "priority": str}

    NOTE on reliability: LLMs don't guarantee perfectly formatted JSON
    output. We ask for JSON explicitly and parse it defensively - if
    parsing fails, we fall back to safe defaults rather than crashing
    the whole API request. This kind of defensive handling is worth
    mentioning in interviews as a real production concern.
    """
    prompt = f"""Classify the following customer support question.

QUESTION: {question}

Respond with ONLY a JSON object in exactly this format, no other text:
{{"category": "one_of_{CATEGORIES}", "priority": "one_of_{PRIORITIES}"}}

Category guide:
- returns_refunds: returning items, getting money back
- shipping_delivery: delivery timing, tracking, address changes
- cancellations: cancelling an order
- warranty_damaged: warranty claims, damaged/defective products
- payments: payment methods, billing, charges
- account: login, account settings, passwords
- general_chat: general inquiries, information requests
- other: anything not covered above

Priority guide:
- high: damaged/defective products, payment/fraud issues, urgent time-sensitive problems
- medium: standard requests like returns, cancellations, shipping delays
- low: general questions, informational requests

Respond with ONLY the JSON object."""

    response = classification_llm.invoke(prompt)
    raw = response.content.strip()

    try:
        result = json.loads(raw)
        # Defensive validation: even if JSON parses, make sure the VALUES
        # are actually from our allowed lists - an LLM could technically
        # invent a category we didn't ask for.
        if result.get("category") not in CATEGORIES:
            result["category"] = "other"
        if result.get("priority") not in PRIORITIES:
            result["priority"] = "low"
        return result
    except json.JSONDecodeError:
        # If the model didn't return valid JSON at all, fail safe instead
        # of crashing the request.
        return {"category": "other", "priority": "low"}


# --- Test it ---
if __name__ == "__main__":
    test_questions = [
        "My package showed up broken, what should I do?",
        "Can I cancel my order after it's already shipped?",
        "How do I reset my account password?",
        "What's the best pizza topping?",
    ]

    for q in test_questions:
        result = classify_question(q)
        print(f"Q: {q}")
        print(f"  -> category={result['category']}, priority={result['priority']}\n")