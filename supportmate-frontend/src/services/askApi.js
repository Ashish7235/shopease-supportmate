/*
  API helper for the frontend.
  - askQuestion(payload): POST /ask
  - createTicket(ticket): POST /tickets
*/

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function askQuestion(payload) {
  const res = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'No body');
    throw new Error(`askQuestion failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function createTicket(ticket) {
  // ticket should be: { question, answer, sources_used, category, priority, escalation_reason }
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'No body');
    throw new Error(`createTicket failed: ${res.status} ${text}`);
  }
  return res.json();
}