import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleDashed, LoaderCircle, XCircle, ArrowRight, Ban } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader, Button, Pill, StatusBadge, Stat } from '../components/ui.jsx';
import { IterationLog } from '../components/IterationLog.jsx';
import { ConvergenceChart } from '../components/ConvergenceChart.jsx';
import { simulateRun } from '../mock/solver.js';

const STAGE_LABELS = {
  parse: 'Parse MPS',
  presolve: 'Presolve',
  scaling: 'Scaling',
  solve: 'Simplex solve',
  certify: 'Certify',
};
const ALL_STAGES = ['parse', 'presolve', 'scaling', 'solve', 'certify'];

export function SolverRun({ problem, config, onComplete, onCancel }) {
  const [logLines, setLogLines] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeStage, setActiveStage] = useState('parse');
  const [completedStages, setCompletedStages] = useState([]);
  const [phase, setPhase] = useState('running'); // running | done | cancelled
  const [finalResult, setFinalResult] = useState(null);

  const abortRef = useRef(null);
  const autoNavTimer = useRef(null);

  useEffect(() => {
    // Reset so that if this effect runs twice back-to-back (React StrictMode's
    // dev-only mount -> cleanup -> remount cycle aborts the first run before it
    // can produce anything useful), the second, real run starts from a clean
    // slate instead of appending to a stray leftover line from the first.
    setLogLines([]);
    setChartPoints([]);
    setOverallProgress(0);
    setActiveStage('parse');
    setCompletedStages([]);
    setPhase('running');
    setFinalResult(null);

    const controller = new AbortController();
    abortRef.current = controller;

    simulateRun(problem, config, {
      signal: controller.signal,
      onEvent: (evt) => {
        if (evt.type === 'stage-start') {
          setActiveStage(evt.stage);
        } else if (evt.type === 'log') {
          setLogLines((prev) => [...prev, evt.line]);
        } else if (evt.type === 'iteration') {
          setChartPoints((prev) => [...prev, evt.point]);
        } else if (evt.type === 'progress') {
          setOverallProgress(evt.overallProgress);
        } else if (evt.type === 'stage-end') {
          setCompletedStages((prev) => [...prev, evt.stage]);
        } else if (evt.type === 'complete') {
          setFinalResult(evt.result);
          setPhase('done');
          setOverallProgress(1);
          autoNavTimer.current = setTimeout(() => onComplete(evt.result), 1500);
        }
      },
    }).catch((err) => {
      if (err?.message !== 'cancelled') {
        // eslint-disable-next-line no-console
        console.error('isolve mock run failed:', err);
      }
    });

    return () => {
      controller.abort();
      if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    abortRef.current?.abort();
    if (autoNavTimer.current) clearTimeout(autoNavTimer.current);
    setPhase('cancelled');
    onCancel();
  };

  const stages = ALL_STAGES.filter((s) => {
    if (s === 'presolve') return config.presolve;
    if (s === 'scaling') return config.scaling;
    return true;
  });

  const mode = problem.status === 'INFEASIBLE' ? 'infeasibility' : problem.status === 'UNBOUNDED' ? 'diverging' : 'objective';
  const target = problem.status === 'OPTIMAL' ? problem.objective : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-5 py-6 md:px-8">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-[var(--text)]">{problem.name}</span>
            <Pill>{problem.rows}×{problem.cols}</Pill>
            <Pill>{config.threads} thread{config.threads > 1 ? 's' : ''}</Pill>
            {phase === 'running' && <StatusBadge status="RUNNING" />}
            {phase === 'done' && <StatusBadge status={finalResult.status} />}
          </div>
          {phase === 'running' ? (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <Ban size={14} />
              Cancel
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onComplete(finalResult)}>
              View Results
              <ArrowRight size={14} />
            </Button>
          )}
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-inset)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-[width] duration-150 ease-linear"
              style={{ width: `${Math.round(overallProgress * 100)}%` }}
            />
          </div>
        </div>

        {/* Stage stepper */}
        <div className="mt-4 flex flex-wrap gap-2">
          {stages.map((s) => {
            const isDone = completedStages.includes(s);
            const isActive = activeStage === s && !isDone;
            return (
              <div
                key={s}
                className={clsx(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
                  isDone
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500'
                    : isActive
                      ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-500'
                      : 'border-[var(--border)] bg-[var(--bg-inset)] text-[var(--text-faint)]'
                )}
              >
                {isDone ? (
                  <CheckCircle2 size={13} />
                ) : isActive ? (
                  <LoaderCircle size={13} className="animate-spin" />
                ) : (
                  <CircleDashed size={13} />
                )}
                {STAGE_LABELS[s]}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Live pipeline log" subtitle="Streaming output — same shape as the interactive CLI session." />
          <div className="p-5 pt-4">
            <IterationLog lines={logLines} live={phase === 'running'} minHeight={360} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Convergence" subtitle={mode === 'objective' ? 'Objective per iteration' : mode === 'infeasibility' ? 'Infeasibility residual' : 'Objective diverging'} />
          <div className="px-3 pb-2 pt-1">
            <ConvergenceChart points={chartPoints} mode={mode} target={target} height={220} />
          </div>
          <div className="grid grid-cols-2 gap-3 p-5 pt-2">
            <Stat label="Iterations" value={chartPoints.length} />
            <Stat
              label={mode === 'infeasibility' ? 'Infeasibility' : 'Best objective'}
              value={
                chartPoints.length
                  ? (chartPoints[chartPoints.length - 1].objective ?? chartPoints[chartPoints.length - 1].infeasibility).toFixed(4)
                  : '—'
              }
              accent
            />
          </div>
        </Card>
      </div>

      {phase === 'done' && (
        <Card className="flex items-center justify-between gap-4 border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-500">
            {finalResult.status === 'OPTIMAL' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            Solve complete — opening results…
          </div>
          <Button variant="primary" size="sm" onClick={() => onComplete(finalResult)}>
            View Results
            <ArrowRight size={14} />
          </Button>
        </Card>
      )}
    </div>
  );
}
