import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

const MODE_META = {
  objective: { color: '#22d3ee', label: 'Objective value', dataKey: 'objective' },
  infeasibility: { color: '#f87171', label: 'Infeasibility residual', dataKey: 'infeasibility' },
  diverging: { color: '#fbbf24', label: 'Objective (diverging)', dataKey: 'objective' },
};

function CustomTooltip({ active, payload, label, dataKey, unit }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-lg">
      <div className="text-[var(--text-faint)]">Iteration {label}</div>
      <div className="mt-0.5 font-mono font-semibold text-[var(--text)]">
        {payload[0].value?.toFixed(6)}
        {unit}
      </div>
    </div>
  );
}

export function ConvergenceChart({ points, mode = 'objective', target = null, height = 240 }) {
  const meta = MODE_META[mode] || MODE_META.objective;
  const hasData = points && points.length > 0;

  return (
    <div style={{ width: '100%', height }}>
      {!hasData ? (
        <div className="flex h-full items-center justify-center text-xs text-[var(--text-faint)]">
          Waiting for solver iterations…
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="iteration"
              tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              label={{ value: 'Iteration', position: 'insideBottom', offset: -2, fill: 'var(--text-faint)', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              width={64}
              tickFormatter={(v) => (Math.abs(v) >= 1000 ? v.toExponential(1) : v.toFixed(1))}
            />
            <Tooltip content={<CustomTooltip dataKey={meta.dataKey} />} />
            {target !== null && Number.isFinite(target) && (
              <ReferenceLine
                y={target}
                stroke="#a78bfa"
                strokeDasharray="4 4"
                label={{ value: `optimal ${target.toFixed(3)}`, position: 'insideTopRight', fill: '#a78bfa', fontSize: 11 }}
              />
            )}
            <Line
              type="monotone"
              dataKey={meta.dataKey}
              stroke={meta.color}
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: meta.color, strokeWidth: 0 }}
              activeDot={{ r: 4.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
