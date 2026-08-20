import React from 'react';

/*
  AnswerCard — improved visual hierarchy and accessibility.
  - Palette: deep indigo text, teal accents, warm amber for cautions.
  - Answer body is the primary visual element; sources are smaller, monospace-styled and separated.
  - Error state uses an assertive role and a distinct visual language (soft red but not alarming).
*/

export default function AnswerCard({ answer = '', sources = [], evidenceFound = true, isError = false }) {
  if (isError) {
    return (
      <article
        role="status"
        aria-live="assertive"
        aria-label="Assistant error"
        className="rounded-2xl border border-red-300/40 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <div className="flex items-start gap-3">
          <svg className="h-5 w-5 flex-shrink-0 text-red-700" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.29 3.86 1.82 18.14A1.5 1.5 0 0 0 3.1 20h17.8a1.5 1.5 0 0 0 1.28-1.86L13.71 3.86a1.5 1.5 0 0 0-2.42 0z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="font-medium">{answer || 'Sorry — something went wrong.'}</div>
            <div className="mt-1 text-xs text-red-700/80">This looks like a connection or server error. Try again, or contact support.</div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      role="article"
      aria-label="Assistant answer"
      className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
    >
      {/* Answer */}
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
        {answer ? (
          <p className="text-[15px] leading-6">{answer}</p>
        ) : (
          <em className="text-slate-500">No answer provided.</em>
        )}
      </div>

      {/* Evidence caution */}
      {!evidenceFound && (
        <div className="mt-3 flex items-start gap-2 text-sm">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 9v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-amber-700/90 text-sm">
            I couldn't find this information in our policy docs — treat this answer as guidance, not policy.
          </div>
        </div>
      )}

      {/* Sources */}
      {Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-4 border-t pt-3">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wide text-slate-500">Sources</div>
          <ul className="flex flex-col gap-2">
            {sources.map((s, idx) => {
              const label = typeof s === 'string' ? s : JSON.stringify(s);
              const isUrl = typeof s === 'string' && s.startsWith('http');
              return (
                <li key={idx} className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="font-mono text-xs text-slate-400">[{String(idx + 1).padStart(2,'0')}]</span>
                  {isUrl ? (
                    <a
                      href={s}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate underline decoration-slate-100 underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="truncate font-mono text-xs text-slate-600">{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}
