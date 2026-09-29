import clsx from 'clsx';

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-inset)] text-[var(--accent)]">
            <Icon size={16} />
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-500 hover:to-cyan-500 shadow-sm shadow-violet-600/20',
    secondary: 'bg-[var(--bg-inset)] text-[var(--text)] hover:brightness-110 border border-[var(--border)]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-inset)]',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm text-[var(--text)]">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-gradient-to-r from-violet-600 to-cyan-600' : 'bg-[var(--bg-inset)] border border-[var(--border)]'
        )}
      >
        <span
          className={clsx(
            'inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
          )}
        />
      </span>
    </label>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[var(--text-faint)]">{hint}</span>}
    </label>
  );
}

export function NumberInput({ className, ...rest }) {
  return (
    <input
      type="number"
      className={clsx(
        'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]',
        className
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }) {
  return (
    <select
      className={clsx(
        'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-inset)] px-3 py-2 text-sm text-[var(--text)] outline-none transition-colors focus:border-[var(--accent)]',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

const STATUS_STYLES = {
  OPTIMAL: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  INFEASIBLE: 'bg-red-500/10 text-red-500 border-red-500/20',
  UNBOUNDED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  TIME_LIMIT: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  UNSOLVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RUNNING: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
        STATUS_STYLES[status] || STATUS_STYLES.UNSOLVED,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace('_', ' ')}
    </span>
  );
}

export function Pill({ children, className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]',
        className
      )}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-inset)] px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">{label}</div>
      <div className={clsx('mt-1 font-mono text-lg font-semibold', accent ? 'text-[var(--accent-2)]' : 'text-[var(--text)]')}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}
