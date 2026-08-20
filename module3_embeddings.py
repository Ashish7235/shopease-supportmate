"""
Module 3: Embeddings
----------------------
Goal: Convert text chunks into vectors (lists of numbers) that capture
meaning, so we can later compare a user's question to our policy chunks
by MEANING rather than by exact keyword match.

We use a local, free, open-source embedding model (all-MiniLM-L6-v2) via
HuggingFace — no API key, no cost, runs on CPU.
"""

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
import numpy as np

# --- Steps 1 & 2: Load + Chunk (same as Modules 1 & 2) ---
loader = DirectoryLoader(
    "docs", glob="*.md", loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"},
)
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=75,
    separators=["\n## ", "\n\n", "\n", ". ", " ", ""],
)
chunks = splitter.split_documents(documents)

# --- Step 3: Load the embedding model ---
# This downloads the model the first time you run it (~80MB), then caches
# it locally — subsequent runs are fast and fully offline.
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# --- Step 4: Embed a couple of chunks to SEE what a vector looks like ---
sample_chunk = chunks[0].page_content
sample_vector = embedding_model.embed_query(sample_chunk)

print(f"Sample chunk text:\n{sample_chunk[:120]}...\n")
print(f"Vector length (dimensions): {len(sample_vector)}")
print(f"First 8 numbers of the vector: {sample_vector[:8]}\n")

# --- Step 5: Prove the core idea — similar meaning = close vectors ---
# We embed two DIFFERENT sentences and compare cosine similarity:
#   A) semantically close to something in our KB (damaged item, no shared
#      words with the doc's exact phrasing)
#   B) unrelated (about weather)
query_close = "my package showed up broken, what do I do"
query_far = "what's the weather like tomorrow"

# Find the actual "damaged-on-arrival" chunk from warranty doc for comparison
target_chunk = next(
    c for c in chunks if "Damaged-on-Arrival" in c.page_content
)

vec_target = np.array(embedding_model.embed_query(target_chunk.page_content))
vec_close = np.array(embedding_model.embed_query(query_close))
vec_far = np.array(embedding_model.embed_query(query_far))

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

sim_close = cosine_similarity(vec_target, vec_close)
sim_far = cosine_similarity(vec_target, vec_far)

print("=" * 60)
print("Target chunk (Damaged-on-Arrival section):")
print(target_chunk.page_content[:150], "...\n")
print(f'Similarity to "{query_close}": {sim_close:.4f}')
print(f'Similarity to "{query_far}": {sim_far:.4f}')
print("\nNotice: no shared words between the query and the chunk text,")
print("yet the semantically related query scores much higher similarity.")