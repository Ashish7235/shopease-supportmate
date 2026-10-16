import React, { useState } from 'react';
import { createTicket } from '../services/askApi';

/*
  StatusBadges Component
  -------------------------------------------------------------
  Renders classification tags (category + priority level) and an escalation block
  allowing users to file a human support ticket when AI confidence is low or policy calls for human assistance.
*/

const CATEGORY_LABELS = {
  returns_refunds: 'Returns & Refunds',
  shipping_delivery: 'Shipping & Delivery',
  cancellations: 'Cancellations',
  warranty_damaged: 'Warranty & Damage',
  payments: 'Payments',
  account: 'Account & Security',
  general_chat: 'General Chat',
  other: 'Other Support',
};

const PRIORITY_STYLES = {
  low: 'bg-[#4C7A5E]/10 text-[#2D4F3B] border-[#4C7A5E]/25',
  medium: 'bg-[#D98E04]/10 text-[#8C5B03] border-[#D98E04]/25',
  high: 'bg-[#C1443C]/10 text-[#962A23] border-[#C1443C]/25',
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
  const [ticketId, setTicketId] = useState(null);
  const [error, setError] = useState(null);

  const handleContactSupport = async () => {
    setCreating(true);
    setError(null);
    try {
      const payload = {
        question: question ?? '',
        answer: answer ?? '',
        sources_used: Array.isArray(sources_used) ? sources_used : [],
        category: category ?? '',
        priority: priority ?? '',
        escalation_reason: escalation_reason ?? '',
      };

      const res = await createTicket(payload);
      setTicketId(res.ticket_id || 'CONFIRMED');
      setCreated(true);
    } catch (err) {
      console.error('createTicket error', err);
      setError('Could not create ticket. Check connection and try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Category & Priority Badge Row */}
      {(category || priority) && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          {category && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#E4DFD3] bg-white px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#1F2A24]/80 shadow-2xs">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1F2A24]/50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              {CATEGORY_LABELS[category] ?? category}
            </span>
          )}

          {priority && (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium capitalize shadow-2xs ${
                PRIORITY_STYLES[priority] ?? 'bg-[#1F2A24]/5 text-[#1F2A24]/70 border-[#E4DFD3]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${
                priority === 'high' ? 'bg-[#C1443C]' : priority === 'medium' ? 'bg-[#D98E04]' : 'bg-[#4C7A5E]'
              }`} />
              {priority} priority
            </span>
          )}
        </div>
      )}

      {/* Human Escalation Action Card */}
      {escalate && (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#C1443C]/30 bg-gradient-to-br from-[#C1443C]/5 to-transparent p-4 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#C1443C]/10 text-[#C1443C]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-[#8A332C]">Human Support Escalation Recommended</h5>
              <p className="mt-0.5 text-xs text-[#8A332C]/80">
                {escalation_reason || 'This issue may require direct review by a human support representative.'}
              </p>
            </div>
          </div>

          {!created ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleContactSupport}
                disabled={creating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#C1443C] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#A93B34] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1443C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Filing support ticket...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    File Support Ticket
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-[#4C7A5E]/15 px-3 py-2 text-xs font-medium text-[#2D4F3B] border border-[#4C7A5E]/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#2D4F3B]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>
                Ticket Created <strong>({ticketId})</strong> — Support team notified via email.
              </span>
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-[#C1443C]" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}