import { History as HistoryIcon, Trash2, ChevronRight, Inbox } from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, Pill } from '../components/ui.jsx';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function History({ history, onSelect, onClear }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-6 md:px-8">
      <Card>
        <CardHeader
          icon={HistoryIcon}
          title="Run history"
          subtitle="Stored in this browser's localStorage — clears if you clear site data."
          action={
            history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <Trash2 size={13} />
                Clear all
              </Button>
            )
          }
        />

        {history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <Inbox size={28} className="text-[var(--text-faint)]" />
            <p className="text-sm text-[var(--text-muted)]">No runs yet.</p>
            <p className="text-xs text-[var(--text-faint)]">Solve a problem to see it appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {history.map((run) => (
              <li key={run.id}>
                <button
                  onClick={() => onSelect(run)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-[var(--bg-inset)]"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="w-24 shrink-0 font-mono text-sm font-semibold text-[var(--text)]">
                      {run.problem.name}
                    </span>
                    <StatusBadge status={run.status} />
                    <span className="hidden text-xs text-[var(--text-faint)] sm:inline">
                      {run.problem.rows}×{run.problem.cols}
                    </span>
                    <Pill className="hidden md:inline-flex">{run.config.threads} thr</Pill>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="hidden font-mono text-sm text-[var(--text-muted)] sm:inline">
                      {run.objective !== null ? run.objective.toFixed(4) : '—'}
                    </span>
                    <span className="hidden text-xs text-[var(--text-faint)] md:inline">
                      {run.convergence.iterations} iter
                    </span>
                    <span className="w-16 shrink-0 text-right text-xs text-[var(--text-faint)]">
                      {timeAgo(run.timestamp)}
                    </span>
                    <ChevronRight size={16} className="text-[var(--text-faint)]" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
