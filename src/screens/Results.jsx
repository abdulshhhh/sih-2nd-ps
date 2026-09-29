import { useMemo, useState } from 'react';
import {
  Download,
  RotateCcw,
  FilePlus2,
  Clock,
  Layers,
  Cpu,
  Hash,
  Copy,
  Check,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, Stat, Pill } from '../components/ui.jsx';
import { ConvergenceChart } from '../components/ConvergenceChart.jsx';
import { SolutionTable } from '../components/SolutionTable.jsx';
import { buildCertificateText, buildJsonOutput } from '../mock/solver.js';

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtMs(ms) {
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  return `${ms.toFixed(1)}ms`;
}

export function Results({ result, onRunAnother, onRerun }) {
  const [copied, setCopied] = useState(false);
  const jsonText = useMemo(() => JSON.stringify(buildJsonOutput(result), null, 2), [result]);

  if (!result) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center text-sm text-[var(--text-faint)]">
        No run selected yet. Head to Problem Setup and hit “Run Solver”.
      </div>
    );
  }

  const mode = result.status === 'INFEASIBLE' ? 'infeasibility' : result.status === 'UNBOUNDED' ? 'diverging' : 'objective';
  const target = result.status === 'OPTIMAL' || result.status === 'TIME_LIMIT' ? result.problem && result.objective : null;

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-6 md:px-8">
      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-semibold text-[var(--text)]">{result.problem.name}</span>
            <StatusBadge status={result.status} />
            <Pill>Tier {result.certTier}</Pill>
            {result.isBestBound && <Pill className="border-amber-500/25 text-amber-500">best bound only</Pill>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onRerun}>
              <RotateCcw size={14} />
              Re-run
            </Button>
            <Button variant="secondary" size="sm" onClick={onRunAnother}>
              <FilePlus2 size={14} />
              New problem
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat
            label="Objective"
            value={result.objective !== null ? result.objective.toFixed(6) : '—'}
            accent
          />
          <Stat label="Iterations" value={result.convergence.iterations} />
          <Stat label="Total runtime" value={fmtMs(result.timings.totalMs)} />
          <Stat label="Solve time" value={fmtMs(result.timings.solveMs)} />
          <Stat label="Threads" value={result.config.threads} />
          <Stat
            label="Presolve"
            value={result.presolve.enabled ? `${result.presolve.reductions.length} reductions` : 'off'}
          />
        </div>
      </Card>

      {/* Status-specific narrative */}
      {result.status === 'INFEASIBLE' && (
        <Card className="border-red-500/20 bg-red-500/[0.04] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <h3 className="text-sm font-semibold text-red-400">Infeasible — Farkas certificate found</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{result.farkasNote}</p>
              {result.farkas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.farkas.map((f) => (
                    <Pill key={f.name}>
                      y[{f.name}] = {f.value}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      {result.status === 'UNBOUNDED' && (
        <Card className="border-amber-500/20 bg-amber-500/[0.04] p-5">
          <div className="flex items-start gap-3">
            <TrendingDown size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-amber-500">Unbounded — primal ray found</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{result.rayNote}</p>
              {result.ray.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.ray.map((r) => (
                    <Pill key={r.name}>
                      d[{r.name}] = {r.value}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      {result.status === 'TIME_LIMIT' && (
        <Card className="border-amber-500/20 bg-amber-500/[0.04] p-5">
          <div className="flex items-start gap-3">
            <Clock size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-amber-500">Time limit reached</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Stopped after {result.config.timeLimitSec}s with no certified optimum — the value above is the best bound
                found so far, not a proof of optimality.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Convergence" subtitle="Final trajectory for this run" />
          <div className="px-3 pb-4 pt-1">
            <ConvergenceChart points={result.convergence.points} mode={mode} target={target} height={230} />
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Pipeline breakdown"
            subtitle={`${result.presolve.before.rows}×${result.presolve.before.cols} → ${result.presolve.after.rows}×${result.presolve.after.cols} after presolve`}
          />
          <div className="grid grid-cols-2 gap-3 p-5 pt-3 sm:grid-cols-4">
            <Stat label="Parse" value={fmtMs(result.timings.parseMs)} />
            <Stat label="Presolve" value={result.presolve.enabled ? fmtMs(result.timings.presolveMs) : 'off'} />
            <Stat label="Scaling" value={result.scaling.enabled ? fmtMs(result.timings.scalingMs) : 'off'} />
            <Stat label="Simplex" value={fmtMs(result.timings.solveMs)} />
          </div>
          {result.presolve.reductions.length > 0 && (
            <div className="thin-scroll max-h-40 overflow-auto border-t border-[var(--border)] px-5 py-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--text-faint)]">
                <Layers size={12} />
                Reduction log
              </div>
              <ul className="space-y-1 font-mono text-xs text-[var(--text-muted)]">
                {result.presolve.reductions.map((r, i) => (
                  <li key={i}>
                    #{i + 1} {r.type.padEnd(16, ' ')} row={r.rowName} col={r.colName} rhs={r.rhs}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {/* Solution table */}
      <Card>
        <CardHeader
          icon={Hash}
          title="Solution"
          subtitle={
            result.status === 'OPTIMAL'
              ? 'Primal values, reduced costs and basis status per variable; activity and duals per constraint.'
              : 'No primal solution — see certificate above for the proof.'
          }
        />
        <SolutionTable variables={result.variables} constraints={result.constraints} />
      </Card>

      {/* Certificate + JSON export */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Cpu size={15} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">Certificate export</h3>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">
            Plain-text certificate following <code className="font-mono">docs/CERT_FORMAT.md</code> — primal/dual
            solution, reduced costs, basis status and (for infeasible/unbounded) the Farkas or primal ray.
          </p>
          {result.config.writeCertificate ? (
            <Button
              className="mt-3"
              variant="secondary"
              size="sm"
              onClick={() => download(`${result.problem.name.toLowerCase()}.cert`, buildCertificateText(result))}
            >
              <Download size={14} />
              Download {result.problem.name.toLowerCase()}.cert
            </Button>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-faint)]">
              Enable “Write certificate” in Problem Setup to export this run.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash size={15} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--text)]">Raw JSON output</h3>
            </div>
            {result.config.jsonOutput && (
              <Button variant="ghost" size="sm" onClick={handleCopyJson}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>
          {result.config.jsonOutput ? (
            <pre className="thin-scroll mt-3 max-h-56 overflow-auto rounded-lg bg-[#0a0b0f] p-3 font-mono text-[11px] leading-relaxed text-cyan-300">
              {jsonText}
            </pre>
          ) : (
            <p className="mt-3 text-xs text-[var(--text-faint)]">
              Enable “JSON output” in Problem Setup — mirrors the CLI's <code className="font-mono">--json</code> payload.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
