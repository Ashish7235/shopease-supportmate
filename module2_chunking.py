"""
Module 2: Chunking
--------------------
Goal: Split each loaded Document into smaller overlapping chunks so that
embeddings capture focused, specific meaning instead of a blurry average
of an entire policy document.

We use RecursiveCharacterTextSplitter, which is markdown/structure-aware:
it tries to split on paragraph breaks first, then sentences, then words —
only falling back to a hard character cut as a last resort. This matters
because it avoids slicing a sentence in half whenever a cleaner break
(like a paragraph or heading boundary) is available nearby.
"""

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- Step 1: Load (same as Module 1) ---
loader = DirectoryLoader(
    "docs",
    glob="*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"},
)
documents = loader.load()

# --- Step 2: Chunk ---
# chunk_size=500: each chunk targets ~500 characters (not tokens — character
#   count is simpler to reason about while learning; we can switch to
#   token-based sizing later once you're comfortable with the concept).
# chunk_overlap=75: each chunk repeats the last ~75 characters of the
#   previous chunk, so facts near a boundary aren't stranded in one half.
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=75,
    separators=["\n## ", "\n\n", "\n", ". ", " ", ""],  # tried in this order
)

chunks = splitter.split_documents(documents)

print(f"{len(documents)} documents were split into {len(chunks)} chunks.\n")

# --- Inspect a few chunks so you can SEE what happened to your real text ---
for i, chunk in enumerate(chunks):
    print("=" * 60)
    print(f"Chunk {i} | source: {chunk.metadata['source']} | length: {len(chunk.page_content)}")
    print(chunk.page_content)
    print()