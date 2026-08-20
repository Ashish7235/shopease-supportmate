import React, { useState, useRef, useEffect } from 'react';
import AnswerCard from './AnswerCard';
import StatusBadges from './StatusBadges';
import { askQuestion } from '../services/askApi';

/*
  ChatWindow is responsible for:
  - sending user questions to the backend
  - keeping a messages list (each message has a role: 'user'|'assistant' and payload)
  - rendering user bubbles and assistant AnswerCard(s)
  - loading state while waiting on the backend, and auto-scrolling to the latest message
*/

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    const userMsg = {
      id: Date.now() + '-u',
      role: 'user',
      question,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const resp = await askQuestion({ question });
      // resp expected shape (from backend): { question, answer, sources_used, evidence_found, category, priority, escalate, escalation_reason }
      const assistantMsg = {
        id: Date.now() + '-a',
        role: 'assistant',
        question: resp.question ?? question,
        answer: resp.answer ?? '',
        sources_used: resp.sources_used ?? [],
        evidence_found: !!resp.evidence_found,
        category: resp.category ?? null,
        priority: resp.priority ?? null,
        escalate: !!resp.escalate,
        escalation_reason: resp.escalation_reason ?? null,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      // Distinct error state, not just plain text, so users can tell
      // "the bot didn't know" apart from "the server is unreachable"
      const errorMsg = {
        id: Date.now() + '-a-err',
        role: 'assistant',
        question,
        answer: "Sorry, I couldn't reach the server. Please try again in a moment.",
        sources_used: [],
        evidence_found: false,
        category: null,
        priority: null,
        escalate: false,
        escalation_reason: null,
        isError: true,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m, errorMsg]);
      console.error('askQuestion error', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#FAF8F3]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[#E4DFD3] bg-white px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1F2A24] font-serif text-lg font-semibold text-[#FAF8F3]">
          S
        </div>
        <div>
          <h1 className="font-serif text-lg font-semibold text-[#1F2A24]">ShopEase SupportMate</h1>
          <p className="text-xs text-[#1F2A24]/60">Answers backed by our policy docs, always cited</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[#E4DFD3] bg-white/60 px-6 py-10 text-center">
              <p className="font-serif text-base text-[#1F2A24]">Ask me anything about your order</p>
              <p className="max-w-sm text-sm text-[#1F2A24]/60">
                Returns, shipping, cancellations, warranty claims — I'll answer from ShopEase policy and
                show you exactly where it came from.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div className="flex flex-col gap-2" key={msg.id}>
              {msg.role === 'user' && (
                <div
                  className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#1F2A24] px-4 py-2.5 text-sm text-[#FAF8F3]"
                  data-testid="user-bubble"
                >
                  {msg.question}
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex max-w-[92%] flex-col gap-2" data-testid="assistant-block">
                  <AnswerCard
                    answer={msg.answer}
                    sources={msg.sources_used}
                    evidenceFound={msg.evidence_found}
                    isError={msg.isError}
                  />

                  {!msg.isError && (msg.category || msg.priority || msg.escalate) && (
                    <StatusBadges
                      category={msg.category}
                      priority={msg.priority}
                      escalate={msg.escalate}
                      escalation_reason={msg.escalation_reason}
                      question={msg.question}
                      answer={msg.answer}
                      sources_used={msg.sources_used}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex max-w-[92%] items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[#E4DFD3] bg-white px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F2A24]/40 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F2A24]/40 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1F2A24]/40" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[#E4DFD3] bg-white px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={inputRef}
            aria-label="Ask a question"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about returns, shipping, cancellations..."
            className="flex-1 resize-none rounded-xl border border-[#E4DFD3] bg-[#FAF8F3] px-4 py-2.5 text-sm text-[#1F2A24] placeholder:text-[#1F2A24]/40 focus:border-[#D98E04] focus:outline-none focus:ring-1 focus:ring-[#D98E04]"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send question"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1F2A24] text-[#FAF8F3] transition disabled:cursor-not-allowed disabled:opacity-30 hover:enabled:bg-[#1F2A24]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D98E04] focus-visible:ring-offset-2"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8h11.5M8.5 2.5L14 8l-5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}