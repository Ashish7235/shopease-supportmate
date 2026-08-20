"""
Module 7: Insufficient Evidence Fallback - Stress Test
-----------------------------------------------------------
Goal: The refusal logic already exists inside generate_answer() (Module 6):
if retrieve_relevant_chunks() returns an empty list, we skip the LLM and
return a fixed refusal message.

This module doesn't add new pipeline logic - it PROVES that logic holds up
under harder, more realistic test cases than an obviously irrelevant
question like "best pizza topping."

The real risk we're testing for: PLAUSIBLE-SOUNDING questions that are
related to e-commerce/support in general, but NOT covered by our 4 docs
specifically (returns, shipping, cancellations, warranty). A weak system
might retrieve a loosely-related chunk and confidently answer something
made up. A well-grounded system should refuse.
"""

from module6_generate_answer import generate_answer, retrieve_relevant_chunks

# Categories of test questions:
#   - CLEARLY OUT OF SCOPE: nothing e-commerce related at all (sanity check)
#   - PLAUSIBLE BUT UNCOVERED: sounds like support content, but our docs
#     genuinely don't cover it (payments, account/login, loyalty points)
#   - ACTUALLY COVERED: sanity check that we're not being too strict now
test_cases = [
    # (question, expected_behavior)
    ("What's the best pizza topping?", "REFUSE - clearly unrelated"),
    ("How do I reset my account password?", "REFUSE - not in our docs at all"),
    ("Do you offer loyalty points or a rewards program?", "REFUSE - not in our docs"),
    ("Can I pay using a credit card EMI option?", "REFUSE - payments not covered"),
    ("What is your warranty period for electronics?", "ANSWER - genuinely covered"),
    ("How long do I have to report a damaged item?", "ANSWER - genuinely covered"),
]

print("PHASE 1 - MODULE 7: INSUFFICIENT EVIDENCE FALLBACK STRESS TEST\n")

for question, expected in test_cases:
    print("=" * 70)
    print(f"Q: {question}")
    print(f"Expected: {expected}")

    chunks = retrieve_relevant_chunks(question)
    if not chunks:
        print("Retrieval: 0 relevant chunks found -> refusal triggered (no LLM call)")
    else:
        print(f"Retrieval: {len(chunks)} chunk(s) found, best distance="
              f"{min(c['distance'] for c in chunks):.4f}")

    answer = generate_answer(question)
    print(f"A: {answer}\n")