import React from 'react';

/*
  Simple presentational component for assistant answers and citations.
  Defensive: handles missing props gracefully.
  - evidenceFound === false shows a soft caution note (only when it matters,
    not on every successful answer — avoids noise for the common case)
  - isError renders a visually distinct error state
*/

export default function AnswerCard({ answer = '', sources = [], evidenceFound = false, isError = false }) {
  if (isError) {
    return (
      <div
        role="article"
        aria-label="Assistant error"
        className="rounded-2xl rounded-tl-sm border border-[#C1443C]/30 bg-[#C1443C]/5 px-4 py-3 text-sm text-[#C1443C]"
      >
        {answer || 'Something went wrong.'}
      </div>
    );
  }

  return (
    <div
      role="article"
      aria-label="Assistant answer"
      className="rounded-2xl rounded-tl-sm border border-[#E4DFD3] bg-white px-5 py-4"
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1F2A24]">
        {answer || <em className="text-[#1F2A24]/50">No answer provided.</em>}
      </p>

      {!evidenceFound && (
        <p className="mt-3 text-xs text-[#D98E04]">
          I couldn't find this in our policy documents — treat this answer with caution.
        </p>
      )}

      {Array.isArray(sources) && sources.length > 0 && (
        <div className="mt-4 border-t border-dashed border-[#E4DFD3] pt-3">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[#1F2A24]/40">
            Sources
          </div>
          <ul className="flex flex-col gap-1">
            {sources.map((s, idx) => {
              const label = typeof s === 'string' ? s : JSON.stringify(s);
              const isUrl = typeof s === 'string' && s.startsWith('http');
              return (
                <li key={idx} className="flex items-baseline gap-2 font-mono text-xs text-[#1F2A24]/70">
                  <span className="text-[#D98E04]">[{String(idx + 1).padStart(2, '0')}]</span>
                  {isUrl ? (
                    <a
                      href={s}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-[#1F2A24] underline decoration-[#E4DFD3] underline-offset-2 hover:text-[#D98E04]"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="truncate">{label}</span>
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