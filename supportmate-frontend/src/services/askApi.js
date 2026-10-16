/*
  API Helper Service for ShopEase SupportMate Frontend
  -------------------------------------------------------------
  Handles network requests to the FastAPI backend, health check polling,
  and exponential retry-with-backoff during backend cold-starts.
*/

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

/**
  Checks if the backend API is online and responding.
  Uses a 3-second timeout signal to avoid hanging the UI.
  @returns {Promise<boolean>}
*/
export async function checkHealth() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${API_BASE}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    clearTimeout(timeoutId);
    return false;
  }
}

/**
  Sends a question to the backend /ask endpoint.
  Includes exponential backoff retries to handle temporary connection failures
  (e.g., when the backend is loading heavy PyTorch/embedding models on startup).
*/
export async function askQuestion(payload, maxRetries = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxRetries) {
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => 'No response body');
        throw new Error(`Server returned HTTP ${res.status}: ${text}`);
      }

      return await res.json();
    } catch (err) {
      lastError = err;
      attempt++;

      // If retries remain, wait before trying again (1s, 2s, 3s)
      if (attempt < maxRetries) {
        const delayMs = attempt * 1000;
        console.warn(`[askApi] Connection attempt ${attempt} failed. Retrying in ${delayMs}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Failed to connect to backend after multiple attempts');
}

/**
  Files a support escalation ticket to the backend /tickets endpoint.
*/
export async function createTicket(ticket) {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticket),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'No response body');
    throw new Error(`createTicket failed with HTTP ${res.status}: ${text}`);
  }

  return res.json();
}