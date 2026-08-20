"""
Module 4: ChromaDB Storage
-----------------------------
Goal: Store every chunk's embedding vector + original text + metadata
(source file) into ChromaDB, persisted to disk. This means we only embed
the knowledge base ONCE (right now), and every future run just loads the
existing vector store instead of recomputing embeddings.

We use Chroma's persistent client, pointing at a local folder
("chroma_db/"). That folder becomes your actual vector database.
"""

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

# --- Steps 1 & 2: Load + Chunk (same as before) ---
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

# --- Step 3: Embedding model (same as Module 3) ---
embedding_model = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# --- Step 4: Store chunks in ChromaDB, persisted to a local folder ---
# Chroma.from_documents does 3 things in one call:
#   1. Runs embedding_model on every chunk's text
#   2. Stores the resulting vector + chunk text + metadata (source file)
#   3. Writes everything to disk at persist_directory, so it survives
#      after this script ends
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embedding_model,
    persist_directory="chroma_db",
    collection_name="shopease_policies",
)

print(f"Stored {len(chunks)} chunks in ChromaDB at ./chroma_db/\n")

# --- Step 5: Prove it works — run a real similarity search ---
# This does NOT re-embed the whole KB. It embeds ONLY the query, then
# searches the already-stored vectors for the closest matches.
test_query = "my package showed up broken, what do I do"
results = vectorstore.similarity_search_with_score(test_query, k=3)

print(f'Top 3 matches for: "{test_query}"\n')
for i, (doc, score) in enumerate(results):
    print("=" * 60)
    print(f"Match {i+1} | source: {doc.metadata['source']} | distance: {score:.4f}")
    print(doc.page_content[:200], "...")
    print()

print("Note: 'distance' here is Chroma's default (lower = more similar,")
print("unlike the cosine similarity in Module 3 where higher = more similar.")
print("Different libraries use different conventions — always check the docs.)")