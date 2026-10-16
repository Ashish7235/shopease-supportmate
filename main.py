"""
ShopEase SupportMate - FastAPI Backend Entrypoint
------------------------------------------------------------
Main API server handling user questions via RAG (Retrieval-Augmented Generation)
and storing support escalation tickets in MongoDB.
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from module6_generate_answer import generate_answer, retrieve_relevant_chunks
from classification import classify_question
from escalation import check_escalation
from schemas import AskRequest, AskResponse, TicketCreate, Ticket
from database import tickets_collection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("supportmate")

app = FastAPI(
    title="ShopEase SupportMate API",
    description="Citation-aware e-commerce support RAG backend",
    version="1.0.0",
)

# CORS Configuration
# Include localhost and 127.0.0.1 origins for default Vite ports (5173, 5174) and React ports (3000).
# Prevents "Failed to fetch" browser CORS errors during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """
    Health-check endpoint.
    Used by frontend to verify backend availability and server readiness.
    """
    return {
        "status": "online",
        "message": "ShopEase SupportMate API is running and ready to process questions.",
    }


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    """
    Main question-answering endpoint.
    1. Classifies user intent (greetings vs policy question).
    2. Runs vector search retrieval if necessary.
    3. Generates LLM response with cited evidence.
    4. Evaluates whether human escalation is required.
    """
    logger.info(f"Received question: {request.question!r}")

    try:
        classification = classify_question(request.question)
    except Exception as e:
        logger.error(f"Classification failed for {request.question!r}: {e}")
        raise HTTPException(
            status_code=503,
            detail="SupportMate is temporarily unable to process your question. Please try again shortly.",
        )

    # Fast-path for greetings & general chat (skips vector search & LLM generation)
    if classification["category"] == "general_chat":
        logger.info("Answered | category=general_chat (skipped retrieval/generation)")
        return AskResponse(
            question=request.question,
            answer="Hey there! I'm ShopEase SupportMate 👋 I can help answer questions about our return policy, shipping timelines, order cancellations, and warranty claims. What can I help you with today?",
            sources_used=[],
            evidence_found=True,
            category="general_chat",
            priority="low",
            escalate=False,
            escalation_reason=None,
        )

    try:
        chunks = retrieve_relevant_chunks(request.question)
        answer = generate_answer(request.question)
    except Exception as e:
        logger.error(f"Failed to process question {request.question!r}: {e}")
        raise HTTPException(
            status_code=503,
            detail="SupportMate is temporarily unable to process your question. Please try again shortly.",
        )

    evidence_found = len(chunks) > 0
    escalation = check_escalation(
        evidence_found=evidence_found,
        category=classification["category"],
        priority=classification["priority"],
    )

    logger.info(
        f"Answered | category={classification['category']} "
        f"priority={classification['priority']} "
        f"evidence_found={evidence_found} escalate={escalation['escalate']}"
    )

    return AskResponse(
        question=request.question,
        answer=answer,
        sources_used=[c["source"] for c in chunks],
        evidence_found=evidence_found,
        category=classification["category"],
        priority=classification["priority"],
        escalate=escalation["escalate"],
        escalation_reason=escalation["reason"],
    )


@app.post("/tickets")
async def create_ticket(ticket_data: TicketCreate):
    """
    Support ticket creation endpoint.
    Persists escalated conversations into MongoDB.
    """
    try:
        ticket = Ticket(**ticket_data.dict())
        result = await tickets_collection.insert_one(ticket.dict())
        return {"ticket_id": str(result.inserted_id), "status": "created"}
    except Exception as e:
        logger.error(f"Failed to create ticket: {e}")
        raise HTTPException(status_code=500, detail="Could not create ticket. Please try again.")