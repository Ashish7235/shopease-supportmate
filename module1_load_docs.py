"""
Module 1: Document Loading
---------------------------
Goal: Read every .md file in docs/ and turn each one into a LangChain
Document object — text + metadata (which file it came from).

This is the foundation for citations later: if we lose the "source"
metadata here, we can never recover which policy an answer came from.
"""

from langchain_community.document_loaders import DirectoryLoader, TextLoader

# DirectoryLoader walks a folder and applies TextLoader to every file
# matching the glob pattern. TextLoader just reads raw file content —
# it doesn't understand markdown structure yet (that's fine for now;
# we handle structure-aware splitting in Module 2: chunking).
loader = DirectoryLoader(
    "docs",
    glob="*.md",
    loader_cls=TextLoader,
    loader_kwargs={"encoding": "utf-8"},  # avoids errors on the ₹ symbol
)

documents = loader.load()

# --- Inspect what we got ---
print(f"Loaded {len(documents)} documents.\n")

for doc in documents:
    print("=" * 60)
    print(f"Source: {doc.metadata['source']}")
    print(f"Character count: {len(doc.page_content)}")
    print(f"First 150 chars:\n{doc.page_content[:150]}...")
    print()