import React, { useState } from 'react';
import { createTicket } from '../services/askApi';

/*
  Renders category/priority badges and (when escalate === true) shows a "Contact Support" button.
  Clicking "Contact Support" calls createTicket(...) and shows inline confirmation/error state.
*/

const CATEGORY_LABELS = {
  returns_refunds: 'Returns & Refunds',
  shipping_delivery: 'Shipping & Delivery',
  cancellations: 'Cancellations',
  warranty_damaged: 'Warranty & Damage',
  payments: 'Payments',
  account: 'Account',
  general_chat: 'General',
  other: 'Other',
};

const PRIORITY_STYLES = {
  low: 'bg-[#4C7A5E]/10 text-[#4C7A5E]',
  medium: 'bg-[#D98E04]/10 text-[#D98E04]',
  high: 'bg-[#C1443C]/10 text-[#C1443C]',
};

export default function StatusBadges({
  category = null,
  priority = null,
  escalate = false,
  escalation_reason = null,
  question = '',
  answer = '',
  sources_used = [],
}) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState(null);

  const handleContactSupport = async () => {
    setCreating(true);
    setError(null);
    try {
      // Build ticket payload expected by backend
      const payload = {
        question: question ?? '',
        answer: answer ?? '',
        sources_used: Array.isArray(sources_used) ? sources_used : [],
        category: category ?? '',
        priority: priority ?? '',
        escalation_reason: escalation_reason ?? '',
      };

      await createTicket(payload);
      setCreated(true);
    } catch (err) {
      console.error('createTicket error', err);
      setError('Could not create a ticket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {(category || priority) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {category && (
            <span className="rounded-full bg-[#1F2A24]/5 px-2.5 py-1 text-xs font-medium text-[#1F2A24]/70">
              {CATEGORY_LABELS[category] ?? category}
            </span>
          )}
          {priority && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                PRIORITY_STYLES[priority] ?? 'bg-[#1F2A24]/5 text-[#1F2A24]/70'
              }`}
            >
              {priority[0].toUpperCase() + priority.slice(1)} priority
            </span>
          )}
        </div>
      )}

      {escalate && (
        <div className="flex flex-col gap-2 rounded-xl border border-[#C1443C]/25 bg-[#C1443C]/5 px-4 py-3">
          <div className="flex gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="mt-0.5 flex-shrink-0 text-[#C1443C]"
            >
              <path d="M8 1.5 15 14H1L8 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <path d="M8 6.5v3.2M8 11.8v.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <div className="text-sm text-[#8A332C]">
              <p className="font-medium">This looks like something a person should handle.</p>
              {escalation_reason && <p className="mt-0.5 text-[#8A332C]/80">{escalation_reason}</p>}
            </div>
          </div>

          {!created ? (
            <button
              className="self-start rounded-lg bg-[#C1443C] px-3.5 py-1.5 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:enabled:bg-[#A93B34] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1443C] focus-visible:ring-offset-2"
              onClick={handleContactSupport}
              disabled={creating}
              aria-disabled={creating}
            >
              {creating ? 'Creating ticket…' : 'Contact Support'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 self-start rounded-lg bg-[#4C7A5E]/10 px-3 py-1.5 text-xs font-medium text-[#4C7A5E]">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8.5 6.5 12 13 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Ticket created — our team will follow up by email.
            </div>
          )}

          {error && (
            <div className="text-xs font-medium text-[#C1443C]" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}