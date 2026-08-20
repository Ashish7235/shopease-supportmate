"""
Module 5: Query & Retrieval
------------------------------
Goal: Turn the one-off similarity search from Module 4 into a reusable
function that:
  1. Embeds a user's question
  2. Searches the ALREADY-STORED Chroma vector store (no re-embedding of
     the whole KB - that only happens once, in Module 4)
  3. Filters out weak matches using a distance threshold
  4. Returns clean, structured results ready for Module 6 (answer generation)

This is the first module that handles a LIVE user question instead of
just building the knowledge base.
"""

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# --- Load the EXISTING vector store built in Module 4 ---
# We do NOT reload/rechunk/reembed documents here. That work is already
# done and saved on disk at ./chroma_db/. We just connect to it.
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = Chroma(
    persist_directory="chroma_db",
    embedding_function=embedding_model,
    collection_name="shopease_policies",
)

# DISTANCE_THRESHOLD: Chroma's default distance metric here is such that
# LOWER = more similar. Anything above this threshold is treated as "too
# unrelated to trust." This number isn't magic - it's something you tune
# by testing real queries against your KB and observing the scores (we'll
# do exactly that below).
DISTANCE_THRESHOLD = 1.2


def retrieve_relevant_chunks(query: str, k: int = 3):
    """
    Given a user's question, return the top-k most relevant chunks from
    the knowledge base, filtered to only those below DISTANCE_THRESHOLD.

    Returns a list of dicts: [{"text": ..., "source": ..., "distance": ...}, ...]
    An EMPTY list means "no sufficiently relevant evidence found" - this
    is the signal Module 7 will use to trigger the refusal fallback.
    """
    results = vectorstore.similarity_search_with_score(query, k=k)

    relevant = []
    for doc, distance in results:
        if distance <= DISTANCE_THRESHOLD:
            relevant.append({
                "text": doc.page_content,
                "source": doc.metadata["source"],
                "distance": distance,
            })
    return relevant


# --- Test the function with a few different queries ---
if __name__ == "__main__":
    test_queries = [
        "my package showed up broken, what do I do",       # should match well
        "can I cancel my order after it's already shipped", # should match well
        "what's the best pizza topping",                    # should match nothing
    ]

    for q in test_queries:
        print("=" * 60)
        print(f'Query: "{q}"')
        chunks = retrieve_relevant_chunks(q)

        if not chunks:
            print("→ No relevant evidence found (would trigger refusal fallback).")
        else:
            for c in chunks:
                print(f"  [{c['source']}] distance={c['distance']:.4f}")
                print(f"  {c['text'][:120]}...")
        print()