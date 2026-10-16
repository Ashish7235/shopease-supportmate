# ShopEase SupportMate

A citation-aware customer support assistant for e-commerce, built with a Retrieval-Augmented Generation (RAG) pipeline. Every answer is grounded in ShopEase's actual policy documents and shows exactly which source it came from — no hallucinated policy claims.

Built as a portfolio project to demonstrate end-to-end RAG system design: document ingestion, vector retrieval, grounded generation, classification, rule-based escalation, and a full-stack UI on top of it.

## Features

- **Grounded, cited answers** — responses are generated only from retrieved policy document chunks, with source citations shown alongside every answer
- **Automatic question classification** — each question is tagged with a category (returns, shipping, cancellations, warranty, payments, account, general chat, other) and a priority (low/medium/high) via a dedicated LLM classification call
- **Rule-based escalation** — questions matching certain conditions (e.g. no evidence found, high-priority issues) are flagged for human follow-up
- **Support ticket creation** — when a question is escalated, users can file a support ticket directly from the chat, stored in MongoDB
- **General chat handling** — greetings and meta-questions ("hi", "who are you") are classified separately and answered directly, instead of being incorrectly treated as failed policy lookups
- **Citation-aware UI** — a React chat interface that visually distinguishes the answer, its sources, classification badges, and escalation state

## Tech Stack

**Backend**
- FastAPI — REST API (`/ask`, `/tickets`)
- LangChain — RAG orchestration
- ChromaDB — vector store for policy document chunks
- `sentence-transformers/all-MiniLM-L6-v2` — embedding model
- Groq API (`llama-3.3-70b-versatile`) — answer generation and question classification
- MongoDB + Motor (async driver) — support ticket storage
- Pydantic — request/response schema validation

**Frontend**
- React + Vite
- Tailwind CSS

## How It Works

1. Policy documents (`docs/*.md`) are loaded, chunked, and embedded into ChromaDB.
2. When a user asks a question, it's first classified by category and priority via a dedicated LLM call — this is a separate call from answer generation, keeping the two responsibilities independent and easier to debug.
3. If the question is `general_chat` (greeting, small talk, meta question), a canned friendly response is returned immediately — no retrieval needed.
4. Otherwise, the question is embedded and the most relevant document chunks are retrieved from ChromaDB via similarity search.
5. Retrieved chunks are passed to the LLM along with the question, and an answer is generated strictly from that context, with citations to the source chunks.
6. A rule-based escalation check runs on the result (e.g. no evidence found, high priority) — if triggered, the UI shows an escalation banner and lets the user file a support ticket, which is saved to MongoDB.

## Project Structure

```
CustomerSupportAI/
├── docs/                          # Source policy documents (RAG knowledge base)
├── module1_load_docs.py           # Document loading
├── module2_chunking.py            # Text chunking
├── module3_embeddings.py          # Embedding generation
├── module4_chroma_storage.py      # ChromaDB storage
├── module5_retrieval.py           # Similarity-based retrieval
├── module6_generate_answer.py     # Grounded answer generation
├── module7_fallback_test.py       # Fallback / no-evidence-found handling
├── classification.py              # Question classification (category + priority)
├── escalation.py                  # Rule-based escalation logic
├── database.py                    # MongoDB connection (Motor)
├── schemas.py                     # Pydantic request/response models
├── main.py                        # FastAPI app (/ask, /tickets endpoints)
├── interactive_cli.py             # CLI tool for testing the RAG pipeline directly
└── supportmate-frontend/          # React + Vite frontend
    └── src/
        ├── components/
        │   ├── ChatWindow.jsx     # Chat state, message list, input
        │   ├── AnswerCard.jsx     # Answer + citations display
        │   └── StatusBadges.jsx   # Category/priority badges, escalation banner
        └── services/
            └── askApi.js          # API client (askQuestion, createTicket)
```

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)
- A [Groq API key](https://console.groq.com)

### Backend

```bash
# from the project root
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=mongodb://localhost:27017
```

Run the backend:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd supportmate-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint    | Description                                      |
|--------|-------------|---------------------------------------------------|
| POST   | `/ask`      | Submit a question, get a cited answer + classification |
| POST   | `/tickets`  | Create a support ticket for an escalated question |

## Roadmap

- [x] Core RAG pipeline (load, chunk, embed, store, retrieve, generate)
- [x] FastAPI layer with classification and escalation
- [x] React frontend with citations and status badges
- [x] MongoDB-backed support ticket creation
- [x] `general_chat` classification for greetings/meta questions
- [ ] Docker containerization (backend + frontend via docker-compose)

## License

This project is for educational and portfolio purposes.
