"""
Phase 2 - Module 1: FastAPI Setup + Basic /ask Endpoint
------------------------------------------------------------
Goal: Expose the existing generate_answer() function (from Module 6) as
an HTTP endpoint, so any client (React, Postman, curl) can send a
question and get a JSON response back.
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

app = FastAPI(title="ShopEase SupportMate API")

# CORS must be added right after app creation, before any routes are hit.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health-check route."""
    return {"status": "ShopEase SupportMate API is running"}


@app.post("/ask", response_model=AskResponse)
def ask(request: AskRequest):
    """
    Main endpoint. Classifies the question first - if it's general_chat
    (greetings, small talk, meta questions about the bot), skip the
    expensive retrieval + generation calls entirely and return a canned
    friendly reply. Otherwise, run the full RAG pipeline as before.
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

    # Skip retrieval/generation entirely for greetings and meta-questions.
    if classification["category"] == "general_chat":
        logger.info("Answered | category=general_chat (skipped retrieval/generation)")
        return AskResponse(
            question=request.question,
            answer="Hey! I'm ShopEase SupportMate 👋 I can help with questions about returns, refunds, shipping, cancellations, and warranty. What can I help you with?",
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
    try:
        ticket = Ticket(**ticket_data.dict())
        result = await tickets_collection.insert_one(ticket.dict())
        return {"ticket_id": str(result.inserted_id), "status": "created"}
    except Exception as e:
        logger.error(f"Failed to create ticket: {e}")
        raise HTTPException(status_code=500, detail="Could not create ticket. Please try again.")