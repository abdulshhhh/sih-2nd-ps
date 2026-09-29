import { useState } from 'react';
import clsx from 'clsx';

const fmtFixed = (v, d = 4) => {
  if (v === Infinity) return '+∞';
  if (v === -Infinity) return '-∞';
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return v.toFixed(d);
};

const STATUS_COLORS = {
  BASIC: 'text-cyan-400',
  AT_LOWER: 'text-[var(--text-faint)]',
  AT_UPPER: 'text-violet-400',
  FIXED: 'text-amber-400',
};

export function SolutionTable({ variables, constraints }) {
  const [tab, setTab] = useState('variables');
  const rows = tab === 'variables' ? variables : constraints;

  return (
    <div>
      <div className="flex gap-1 border-b border-[var(--border)] px-1">
        {[
          { id: 'variables', label: `Variables (${variables.length})` },
          { id: 'constraints', label: `Constraints (${constraints.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-3 py-2.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-b-2 border-[var(--accent)] text-[var(--text)]'
                : 'border-b-2 border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="thin-scroll max-h-96 overflow-auto">
        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[var(--text-faint)]">
            No solution to display for this run status.
          </div>
        ) : tab === 'variables' ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--bg-elevated)] text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
              <tr>
                <th className="px-5 py-2.5 font-medium">Variable</th>
                <th className="px-5 py-2.5 font-medium">Value</th>
                <th className="px-5 py-2.5 font-medium">Reduced cost</th>
                <th className="px-5 py-2.5 font-medium">Basis status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.name} className="border-t border-[var(--border)] hover:bg-[var(--bg-inset)]">
                  <td className="px-5 py-2 font-mono text-[var(--text)]">{v.name}</td>
                  <td className="px-5 py-2 font-mono text-[var(--text)]">{fmtFixed(v.value)}</td>
                  <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{fmtFixed(v.reducedCost, 6)}</td>
                  <td className={clsx('px-5 py-2 font-mono text-xs', STATUS_COLORS[v.status])}>{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[var(--bg-elevated)] text-[11px] uppercase tracking-wide text-[var(--text-faint)]">
              <tr>
                <th className="px-5 py-2.5 font-medium">Row</th>
                <th className="px-5 py-2.5 font-medium">Activity</th>
                <th className="px-5 py-2.5 font-medium">Lower</th>
                <th className="px-5 py-2.5 font-medium">Upper</th>
                <th className="px-5 py-2.5 font-medium">Dual (shadow price)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.name} className="border-t border-[var(--border)] hover:bg-[var(--bg-inset)]">
                  <td className="px-5 py-2 font-mono text-[var(--text)]">{c.name}</td>
                  <td className="px-5 py-2 font-mono text-[var(--text)]">{fmtFixed(c.activity)}</td>
                  <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{fmtFixed(c.lb)}</td>
                  <td className="px-5 py-2 font-mono text-[var(--text-muted)]">{fmtFixed(c.ub)}</td>
                  <td
                    className={clsx(
                      'px-5 py-2 font-mono',
                      c.dual !== 0 ? 'text-violet-400' : 'text-[var(--text-faint)]'
                    )}
                  >
                    {fmtFixed(c.dual, 6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
