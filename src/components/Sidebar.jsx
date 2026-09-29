import clsx from 'clsx';
import { SlidersHorizontal, PlayCircle, BarChart3, History, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'setup', label: 'Problem Setup', icon: SlidersHorizontal },
  { id: 'run', label: 'Run Solver', icon: PlayCircle },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
];

export function Sidebar({ view, onNavigate, runDisabled, resultsDisabled, historyCount }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)] md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-600/20">
          <Zap size={18} />
        </span>
        <div>
          <div className="text-sm font-bold tracking-tight text-[var(--text)]">isolve</div>
          <div className="text-[11px] text-[var(--text-faint)]">Optimization Console</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const disabled =
            (item.id === 'run' && runDisabled) || (item.id === 'results' && resultsDisabled);
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-gradient-to-r from-violet-600/15 to-cyan-500/15 text-[var(--text)] ring-1 ring-inset ring-violet-500/20'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text)]',
                disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent'
              )}
            >
              <Icon size={16} className={active ? 'text-[var(--accent)]' : ''} />
              {item.label}
              {item.id === 'history' && historyCount > 0 && (
                <span className="ml-auto rounded-full bg-[var(--bg-inset)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-faint)]">
                  {historyCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-inset)] p-3">
        <div className="text-[11px] font-semibold text-[var(--text)]">isolve engine</div>
        <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-faint)]">
          C++17 · LP/MILP · zero dependencies. Bounded Revised Dual Simplex core is mid-build
          (Milestone 3) — this console runs on simulated results shaped like its real output.
        </p>
      </div>
    </aside>
  );
}
