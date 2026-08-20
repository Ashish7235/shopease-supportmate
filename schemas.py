"""
Phase 2 - Schemas
----------------------
Defines the exact SHAPE of data going in and out of our API endpoints,
using Pydantic. FastAPI uses these to:
  1. Validate incoming requests automatically (reject bad data early)
  2. Auto-generate accurate API documentation (/docs)
  3. Give US autocomplete/type-checking while writing endpoint code

Kept in a separate file (not main.py) because as the project grows,
schemas are reused across multiple endpoints - separating them avoids
main.py becoming cluttered with unrelated concerns.
"""

from pydantic import BaseModel, Field
from typing import Optional


class AskRequest(BaseModel):
    """
    Defines what a valid incoming request to /ask must look like.

    Field(...) with constraints means: this field is REQUIRED, and must
    meet the given rules. If someone sends a request missing 'question',
    or an empty string, FastAPI rejects it automatically - our endpoint
    code never even runs on invalid input.
    """
    question: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="The customer's support question",
        examples=["My package showed up broken, what should I do?"],
    )


class AskResponse(BaseModel):
    """
    Defines exactly what /ask will return. Having this as an explicit
    model (instead of a raw dict) means the API documentation always
    accurately reflects the real response shape, and if we add fields
    later (category, priority - Module 3), there's one place to update.
    """
    question: str
    answer: str
    sources_used: list[str]
    evidence_found: bool
    category: str
    priority: str
    escalate: bool
    escalation_reason: Optional[str] = None

from datetime import datetime, timezone

class TicketCreate(BaseModel):
    question: str
    answer: str
    sources_used: list[str]
    category: str
    priority: str
    escalation_reason: str

class Ticket(TicketCreate):
    status: str = "open"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))