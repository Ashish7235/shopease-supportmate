import React, { useState, useRef, useEffect } from 'react';
import AnswerCard from './AnswerCard';
import StatusBadges from './StatusBadges';
import { askQuestion, checkHealth } from '../services/askApi';

/*
  ChatWindow Component
  -------------------------------------------------------------
  Main SupportMate interface managing:
  - Backend health monitoring (online / connecting / offline indicator)
  - Message state (user bubbles, assistant answers, error fallbacks)
  - In-flight loading feedback & quick suggestion prompt chips
  - Actionable retry handling for failed connection attempts
*/

const SUGGESTED_PROMPTS = [
  { label: '📦 Return Policy', question: 'What is your 30-day return policy?' },
  { label: '🚚 Shipping Times', question: 'How long does standard shipping take?' },
  { label: '❌ Cancel Order', question: 'Can I cancel an order after placing it?' },
  { label: '🛡️ Warranty Claims', question: 'How do I file a warranty claim for damaged goods?' },
];

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('connecting'); // 'online' | 'connecting' | 'offline'
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Monitor server connection health on mount and periodically
  const runHealthCheck = async () => {
    const isReady = await checkHealth();
    setServerStatus(isReady ? 'online' : 'offline');
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 8000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to latest message on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Handles sending a question to the backend.
   * Supports retrying a specific failed message by passing optional `retryQuestion` and `retryMsgId`.
   */
  const handleSend = async (questionToSend = null, retryMsgId = null) => {
    const question = (questionToSend || input).trim();
    if (!question || isLoading) return;

    // If retrying, remove the previous error message first
    if (retryMsgId) {
      setMessages((prev) => prev.filter((m) => m.id !== retryMsgId));
    } else {
      // Append user's question bubble
      const userMsg = {
        id: Date.now() + '-u',
        role: 'user',
        question,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((m) => [...m, userMsg]);
      setInput('');
    }

    setIsLoading(true);
    setServerStatus('online');

    try {
      const resp = await askQuestion({ question });
      
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
        isError: false,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch (err) {
      console.error('[ChatWindow] askQuestion failed:', err);
      setServerStatus('offline');

      const errorMsg = {
        id: Date.now() + '-a-err',
        role: 'assistant',
        question,
        answer: "Could not establish connection to SupportMate backend. The server might be warming up or offline.",
        sources_used: [],
        evidence_found: false,
        category: null,
        priority: null,
        escalate: false,
        escalation_reason: null,
        isError: true,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#FAF8F3] text-[#1F2A24] font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E4DFD3] bg-white/95 px-4 py-3.5 backdrop-blur-xs sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F2A24] font-serif text-lg font-bold text-[#FAF8F3] shadow-2xs">
            S
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-[#1F2A24] sm:text-lg">
              ShopEase SupportMate
            </h1>
            <p className="text-xs text-[#1F2A24]/60">
              Citation-aware policy assistant
            </p>
          </div>
        </div>

        {/* Live Backend Connection Indicator */}
        <div className="flex items-center gap-2">
          {serverStatus === 'online' && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#4C7A5E]/20 bg-[#4C7A5E]/10 px-2.5 py-1 text-xs font-medium text-[#2D4F3B]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4C7A5E] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4C7A5E]" />
              </span>
              <span className="hidden sm:inline">Server Online</span>
            </div>
          )}

          {serverStatus === 'connecting' && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D98E04]/20 bg-[#D98E04]/10 px-2.5 py-1 text-xs font-medium text-[#8C5B03]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#D98E04]" />
              <span>Connecting...</span>
            </div>
          )}

          {serverStatus === 'offline' && (
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C1443C]/30 bg-[#C1443C]/10 px-2.5 py-1 text-xs font-medium text-[#962A23]">
                <span className="h-2 w-2 rounded-full bg-[#C1443C]" />
                <span>Offline</span>
              </span>
              <button
                onClick={runHealthCheck}
                className="text-xs font-medium text-[#D98E04] underline decoration-[#D98E04]/40 underline-offset-2 hover:text-[#1F2A24]"
                title="Re-check server availability"
              >
                Re-check
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          
          {/* Welcome / Empty State */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E4DFD3] bg-white/70 p-6 sm:p-10 text-center shadow-2xs">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F2A24]/5 text-[#1F2A24]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
                </svg>
              </div>

              <div>
                <h2 className="font-serif text-lg font-bold text-[#1F2A24]">
                  How can I help with your ShopEase order?
                </h2>
                <p className="mt-1 max-w-md text-xs sm:text-sm text-[#1F2A24]/70 leading-relaxed">
                  I search official ShopEase policy documents to answer your questions accurately, complete with source citations and policy evidence links.
                </p>
              </div>

              {/* Quick Prompt Suggestion Chips */}
              <div className="w-full pt-2">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#1F2A24]/50">
                  Popular Questions
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip.question)}
                      className="rounded-xl border border-[#E4DFD3] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2A24] shadow-2xs transition hover:border-[#D98E04] hover:bg-[#FAF8F3] hover:text-[#D98E04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D98E04]"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((msg) => (
            <div className="flex flex-col gap-2 transition-all" key={msg.id}>
              {msg.role === 'user' && (
                <div className="flex flex-col items-end">
                  <div
                    className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#1F2A24] px-4 py-3 text-sm text-[#FAF8F3] shadow-2xs leading-relaxed"
                    data-testid="user-bubble"
                  >
                    {msg.question}
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-[#1F2A24]/40 px-1">
                    {msg.created_at}
                  </span>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="flex max-w-[95%] flex-col gap-2.5 sm:max-w-[90%]" data-testid="assistant-block">
                  <AnswerCard
                    answer={msg.answer}
                    sources={msg.sources_used}
                    evidenceFound={msg.evidence_found}
                    isError={msg.isError}
                    onRetry={() => handleSend(msg.question, msg.id)}
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

          {/* In-flight Request Loading Feedback */}
          {isLoading && (
            <div className="flex max-w-[90%] items-center gap-3 rounded-2xl rounded-tl-xs border border-[#E4DFD3] bg-white px-4 py-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#D98E04] [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#D98E04] [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#D98E04]" />
              </div>
              <span className="font-mono text-xs text-[#1F2A24]/60">
                Searching policy documents & checking citations...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="sticky bottom-0 z-10 border-t border-[#E4DFD3] bg-white px-4 py-3.5 sm:px-8">
        <div className="mx-auto flex max-w-2xl items-end gap-2.5">
          <textarea
            ref={inputRef}
            aria-label="Ask a support question"
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about returns, shipping, cancellations, or warranties..."
            className="flex-1 resize-none rounded-xl border border-[#E4DFD3] bg-[#FAF8F3] px-4 py-3 text-sm text-[#1F2A24] placeholder:text-[#1F2A24]/40 focus:border-[#D98E04] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D98E04]/20 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Send question"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#1F2A24] text-[#FAF8F3] shadow-2xs transition hover:bg-[#1F2A24]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D98E04] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}