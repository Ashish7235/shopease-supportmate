import React from 'react';

/*
  AnswerCard Component
  -------------------------------------------------------------
  Renders the SupportMate assistant's response, source citations, evidence indicators,
  and connection error fallback with actionable retry.

  Receipt/Packing-slip theme: Clean white card, crisp borders (#E4DFD3),
  dark ink typography (#1F2A24), amber highlights (#D98E04), and monospace citations.
*/

export default function AnswerCard({
  answer = '',
  sources = [],
  evidenceFound = false,
  isError = false,
  onRetry = null,
}) {
  // Error state - Server unreachable or failed to fetch
  if (isError) {
    return (
      <div
        role="alert"
        aria-label="Server connection error"
        className="rounded-2xl rounded-tl-xs border border-[#C1443C]/40 bg-[#C1443C]/5 p-4 sm:p-5 shadow-xs transition-all"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#C1443C]/10 text-[#C1443C]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#962A23]">Connection Failure</h4>
            <p className="mt-1 text-sm text-[#8A332C]">
              {answer || "Could not reach the SupportMate server. The backend may be starting up or offline."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#C1443C] px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-[#A93B34] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C1443C] focus-visible:ring-offset-1 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Retry Question
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="article"
      aria-label="Assistant answer card"
      className="rounded-2xl rounded-tl-xs border border-[#E4DFD3] bg-white p-4 sm:p-5 shadow-xs transition-all"
    >
      {/* Header Badge Row */}
      <div className="mb-3 flex items-center justify-between border-b border-[#E4DFD3]/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-xs bg-[#1F2A24] font-serif text-[10px] font-bold text-[#FAF8F3]">
            S
          </div>
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#1F2A24]/70">
            SupportMate Assistant
          </span>
        </div>

        {evidenceFound ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#4C7A5E]/10 px-2 py-0.5 font-mono text-[10px] font-medium text-[#2D4F3B]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Policy Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#D98E04]/15 px-2 py-0.5 font-mono text-[10px] font-medium text-[#8C5B03]">
            Unverified
          </span>
        )}
      </div>

      {/* Answer Body */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1F2A24]">
        {answer || <em className="text-[#1F2A24]/50">No response details provided.</em>}
      </p>

      {/* Unverified Policy Caution Note */}
      {!evidenceFound && (
        <div className="mt-3.5 flex items-start gap-2 rounded-lg border border-[#D98E04]/30 bg-[#D98E04]/10 p-2.5 text-xs text-[#8C5B03]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span>
            <strong>Caution:</strong> No direct matching clause was found in official policy docs. Please verify before proceeding.
          </span>
        </div>
      )}

      {/* Cited Sources Section */}
      {Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-4 border-t border-dashed border-[#E4DFD3] pt-3">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1F2A24]/50">
            <span>Cited Policy Documents ({sources.length})</span>
            <span>RAG Verified</span>
          </div>

          <ul className="flex flex-col gap-1.5">
            {sources.map((src, idx) => {
              const label = typeof src === 'string' ? src : JSON.stringify(src);
              const isUrl = typeof src === 'string' && src.startsWith('http');
              return (
                <li
                  key={idx}
                  className="flex items-center gap-2 rounded-md bg-[#FAF8F3] px-2.5 py-1.5 font-mono text-xs text-[#1F2A24]/80 transition hover:bg-[#FAF8F3]/80 border border-[#E4DFD3]/50"
                >
                  <span className="font-semibold text-[#D98E04]">
                    [{String(idx + 1).padStart(2, '0')}]
                  </span>
                  {isUrl ? (
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate underline decoration-[#D98E04]/40 underline-offset-2 hover:text-[#D98E04]"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="flex-1 truncate font-medium">{label}</span>
                  )}
                  {isUrl && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-[#1F2A24]/40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}