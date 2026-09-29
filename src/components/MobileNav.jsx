import clsx from 'clsx';
import { SlidersHorizontal, PlayCircle, BarChart3, History } from 'lucide-react';

const ITEMS = [
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal },
  { id: 'run', label: 'Run', icon: PlayCircle },
  { id: 'results', label: 'Results', icon: BarChart3 },
  { id: 'history', label: 'History', icon: History },
];

export function MobileNav({ view, onNavigate, runDisabled, resultsDisabled }) {
  return (
    <nav className="flex shrink-0 items-stretch border-t border-[var(--border)] bg-[var(--bg-elevated)] md:hidden">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const disabled = (item.id === 'run' && runDisabled) || (item.id === 'results' && resultsDisabled);
        const active = view === item.id;
        return (
          <button
            key={item.id}
            disabled={disabled}
            onClick={() => onNavigate(item.id)}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              active ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]',
              disabled && 'opacity-40'
            )}
          >
            <Icon size={17} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
