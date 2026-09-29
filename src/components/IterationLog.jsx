import { useEffect, useRef } from 'react';
import clsx from 'clsx';

const LEVEL_STYLES = {
  ok: 'text-emerald-400',
  info: 'text-cyan-400',
  warn: 'text-amber-400',
  err: 'text-red-400',
  dim: 'text-[var(--text-faint)]',
  meta: 'text-violet-400',
};

export function IterationLog({ lines, live = false, className, minHeight = 280 }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (live && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, live]);

  return (
    <div
      ref={scrollRef}
      className={clsx(
        'thin-scroll overflow-y-auto rounded-xl border border-[var(--border)] bg-[#0a0b0f] p-4 font-mono text-[12.5px] leading-relaxed',
        className
      )}
      style={{ minHeight }}
    >
      {lines.length === 0 && (
        <div className="text-[var(--text-faint)]">Waiting to start…</div>
      )}
      {lines.map((line, i) => (
        <div key={i} className={clsx('animate-fade-in-up whitespace-pre-wrap', LEVEL_STYLES[line.level] || 'text-slate-300')}>
          {line.text}
        </div>
      ))}
      {live && (
        <span className="mt-1 inline-block h-3.5 w-2 animate-blink bg-cyan-400 align-middle" />
      )}
    </div>
  );
}
