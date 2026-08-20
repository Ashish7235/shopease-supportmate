"""
Interactive CLI - Phase 1 Manual Testing
--------------------------------------------
Goal: Let YOU type real questions and see the RAG pipeline respond live,
instead of only running my pre-written test questions.

This reuses everything already built - no new pipeline logic here, just
a simple loop so you can manually test and explore your own project.
"""

from module6_generate_answer import generate_answer, retrieve_relevant_chunks

print("=" * 60)
print("ShopEase SupportMate - Phase 1 CLI (type 'exit' to quit)")
print("=" * 60)

while True:
    question = input("\nYour question: ").strip()

    if question.lower() in ("exit", "quit"):
        print("Goodbye!")
        break

    if not question:
        continue

    # Show retrieval info too, so you can SEE what evidence was found,
    # not just the final answer - useful for debugging weird responses.
    chunks = retrieve_relevant_chunks(question)
    if chunks:
        print(f"\n[Retrieved {len(chunks)} chunk(s), best distance="
              f"{min(c['distance'] for c in chunks):.4f}]")
    else:
        print("\n[No relevant chunks found - refusal will trigger]")

    answer = generate_answer(question)
    print(f"\nAnswer: {answer}")