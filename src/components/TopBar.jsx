import { Moon, Sun, FlaskConical } from 'lucide-react';
import { Button } from './ui.jsx';

const TITLES = {
  setup: { title: 'Problem Setup', subtitle: 'Configure the model and solver options, then run.' },
  run: { title: 'Run Solver', subtitle: 'Live pipeline: parse → presolve → scale → simplex → certify.' },
  results: { title: 'Results', subtitle: 'Solution, certification, and downloadable certificate.' },
  history: { title: 'History', subtitle: 'Past mock runs, stored locally in this browser.' },
};

export function TopBar({ view, theme, onToggleTheme }) {
  const copy = TITLES[view] || TITLES.setup;
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 px-5 py-4 backdrop-blur md:px-8">
      <div>
        <h1 className="text-base font-semibold text-[var(--text)] md:text-lg">{copy.title}</h1>
        <p className="mt-0.5 text-xs text-[var(--text-muted)] md:text-sm">{copy.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-500 sm:flex">
          <FlaskConical size={13} />
          Simulated engine — demo data
        </span>
        <Button variant="secondary" size="sm" onClick={onToggleTheme} aria-label="Toggle color theme">
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </Button>
      </div>
    </header>
  );
}
