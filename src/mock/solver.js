// ============================================================================
// mock/solver.js
//
// Single source of truth for every piece of fake data the UI shows.
// Nothing here talks to a real backend — it fabricates results shaped
// exactly like the output of the real `isolve` CLI (see /repo/src/cli/main.cpp
// and /repo/docs/CERT_FORMAT.md), so this file is the one place to touch
// when a real API is ready to swap in. Every exported function's signature
// is written to be a drop-in replacement target:
//
//   simulateRun(problem, config, { onEvent }) -> Promise<RunResult>
//
// could become a fetch() to a real solve endpoint that streams progress
// over SSE/WebSocket and resolves with the same RunResult shape.
// ============================================================================

// ----------------------------------------------------------------------------
// Sample problems
//
// Metadata (row/col counts, names, nnz, known objective/status) is extracted
// directly from the real files in /repo/tests/data/*.mps and /repo/tests/data
// /expected.csv, so dimensions and names shown in the UI match the actual
// repo fixtures the real solver is tested against.
// ----------------------------------------------------------------------------

const AFIRO_ROWS = [
  'R09', 'R10', 'X05', 'X21', 'R12', 'R13', 'X17', 'X18', 'X19', 'X20',
  'R19', 'R20', 'X27', 'X44', 'R22', 'R23', 'X40', 'X41', 'X42', 'X43',
  'X45', 'X46', 'X47', 'X48', 'X49', 'X50', 'X51',
];
const AFIRO_ROW_SENSE = 'EELLEELLLLEELLEELLLLLLLLLLL'.split('');
const AFIRO_COLS = [
  'X01', 'X02', 'X03', 'X04', 'X06', 'X07', 'X08', 'X09', 'X10', 'X11',
  'X12', 'X13', 'X14', 'X15', 'X16', 'X22', 'X23', 'X24', 'X25', 'X26',
  'X28', 'X29', 'X30', 'X31', 'X32', 'X33', 'X34', 'X35', 'X36', 'X37',
  'X38', 'X39',
];

const SC50A_ROWS = Array.from({ length: 50 }, (_, i) => `ROW${String(i + 1).padStart(5, '0')}`);
const SC50A_ROW_SENSE = 'LLLEEEELLLLLLEEEEELLLLLLEEEEELLLLLLEEEEELLLLLLELLL'.split('');
const SC50A_COLS = Array.from({ length: 48 }, (_, i) => `COL${String(i + 1).padStart(5, '0')}`);

export const SAMPLE_PROBLEMS = [
  {
    id: 'afiro',
    name: 'AFIRO',
    fileName: 'afiro.mps',
    tag: 'Netlib benchmark',
    objRowName: 'COST',
    description:
      'Classic small agricultural-planning LP from the Netlib LP library. The standard first correctness benchmark for any new LP solver.',
    sense: 'MINIMIZE',
    rows: 27,
    cols: 32,
    nnz: 88,
    integers: 0,
    status: 'OPTIMAL',
    objective: -464.753143,
    rowNames: AFIRO_ROWS,
    rowSense: AFIRO_ROW_SENSE,
    colNames: AFIRO_COLS,
  },
  {
    id: 'sc50a',
    name: 'SC50A',
    fileName: 'sc50a.mps',
    tag: 'Structured LP',
    objRowName: 'MAXIM',
    description:
      'Structured 50-row production/blending LP used for parser and presolve correctness testing (see DECISIONS.md D4).',
    sense: 'MAXIMIZE',
    rows: 50,
    cols: 48,
    nnz: 131,
    integers: 0,
    status: 'OPTIMAL',
    objective: -64.575077,
    rowNames: SC50A_ROWS,
    rowSense: SC50A_ROW_SENSE,
    colNames: SC50A_COLS,
  },
  {
    id: 'tiny_lp',
    name: 'TINY_LP',
    fileName: 'tiny_lp.mps',
    tag: 'Hand-built',
    objRowName: 'OBJ',
    description:
      'Two-variable textbook LP: min x + 2y  s.t.  x + y <= 10, x >= 2. Small enough to hand-verify every number the solver reports.',
    sense: 'MINIMIZE',
    rows: 2,
    cols: 2,
    nnz: 5,
    integers: 0,
    status: 'OPTIMAL',
    objective: 2.0,
    rowNames: ['C1', 'C2'],
    rowSense: ['L', 'G'],
    colNames: ['X', 'Y'],
    exact: {
      primal: { X: 2, Y: 0 },
      activity: { C1: 2, C2: 2 },
      rowBounds: { C1: { lb: -Infinity, ub: 10 }, C2: { lb: 2, ub: Infinity } },
      dual: { C1: 0, C2: 1 },
      reducedCost: { X: 0, Y: 2 },
      basis: { X: 'BASIC', Y: 'AT_LOWER' },
    },
  },
  {
    id: 'infeas1',
    name: 'INFEAS1',
    fileName: 'infeas1.mps',
    tag: 'Hand-built · infeasible',
    objRowName: 'OBJ',
    description: 'Single-variable contradiction: x >= 2 and x <= 1. Proves the Farkas-certificate path.',
    sense: 'MINIMIZE',
    rows: 2,
    cols: 1,
    nnz: 3,
    integers: 0,
    status: 'INFEASIBLE',
    objective: null,
    rowNames: ['C1', 'C2'],
    rowSense: ['G', 'L'],
    colNames: ['X'],
    exact: {
      farkas: { C1: 1, C2: 1 },
      farkasNote: 'y^T b = 1(2) + 1(-1) = 1 > 0 while y^T A = 1(1) + 1(1) = 2 >= 0 for a <=/>= system in standard form — certifies infeasibility.',
    },
  },
  {
    id: 'infeas2',
    name: 'INFEAS2',
    fileName: 'infeas2.mps',
    tag: 'Hand-built · infeasible',
    objRowName: 'OBJ',
    description: 'Two-variable contradiction: x + y >= 5 while x <= 1 and y <= 1, so x + y <= 2 < 5.',
    sense: 'MINIMIZE',
    rows: 3,
    cols: 2,
    nnz: 6,
    integers: 0,
    status: 'INFEASIBLE',
    objective: null,
    rowNames: ['C1', 'C2', 'C3'],
    rowSense: ['G', 'L', 'L'],
    colNames: ['X', 'Y'],
    exact: {
      farkas: { C1: 1, C2: 1, C3: 1 },
      farkasNote: 'Combine C2 + C3 - C1: (x<=1)+(y<=1)-(x+y>=5) => 0 <= -3, a direct contradiction.',
    },
  },
  {
    id: 'unbounded1',
    name: 'UNBOUNDED1',
    fileName: 'unbounded1.mps',
    tag: 'Hand-built · unbounded',
    objRowName: 'OBJ',
    description: 'min -x subject only to x >= 0 with x declared free — the objective improves forever as x grows.',
    sense: 'MINIMIZE',
    rows: 1,
    cols: 1,
    nnz: 2,
    integers: 0,
    status: 'UNBOUNDED',
    objective: null,
    rowNames: ['C1'],
    rowSense: ['G'],
    colNames: ['X'],
    exact: {
      ray: { X: 1 },
      rayNote: 'd = (1) satisfies A d >= 0 and c^T d = -1 < 0 — the objective decreases without bound along +X.',
    },
  },
];

export const DEFAULT_CONFIG = {
  threads: 1,
  timeLimitSec: 0, // 0 = unlimited
  presolve: true,
  scaling: true,
  jsonOutput: false,
  writeCertificate: true,
};

// ----------------------------------------------------------------------------
// Small seeded PRNG so a given run is reproducible from its seed, but two
// different runs of the same problem still look independently "live".
// ----------------------------------------------------------------------------
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}
function mulberry32(seed) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeRng(seedStr) {
  const seedFn = hashSeed(seedStr);
  return mulberry32(seedFn());
}

const REDUCTION_TYPES = ['EmptyRow', 'EmptyCol', 'RowSingleton', 'FixedVar', 'BoundTightening', 'FreeColSingleton'];

// ----------------------------------------------------------------------------
// Presolve simulation
// ----------------------------------------------------------------------------
function simulatePresolve(problem, rng) {
  if (problem.rows <= 3) {
    // Tiny hand-built problems presolve to a fixed point almost immediately.
    return { reductions: [], rowsAfter: problem.rows, colsAfter: problem.cols, objOffset: 0 };
  }
  const maxReductions = Math.max(1, Math.floor(problem.cols * 0.12));
  const count = 1 + Math.floor(rng() * maxReductions);
  const reductions = [];
  let rowsAfter = problem.rows;
  let colsAfter = problem.cols;
  for (let i = 0; i < count; i++) {
    const type = REDUCTION_TYPES[Math.floor(rng() * REDUCTION_TYPES.length)];
    const rowIdx = Math.floor(rng() * problem.rows);
    const colIdx = Math.floor(rng() * problem.cols);
    const affectsRow = type === 'EmptyRow' || type === 'RowSingleton';
    const affectsCol = type === 'EmptyCol' || type === 'FixedVar' || type === 'FreeColSingleton';
    if (affectsRow && rowsAfter > 4) rowsAfter -= 1;
    if (affectsCol && colsAfter > 4) colsAfter -= 1;
    reductions.push({
      type,
      rowIdx,
      colIdx,
      rowName: problem.rowNames[rowIdx],
      colName: problem.colNames[colIdx],
      rhs: Number((rng() * 40 - 20).toFixed(4)),
      coeff: Number((rng() * 4 - 2).toFixed(4)),
    });
  }
  return { reductions, rowsAfter, colsAfter, objOffset: 0 };
}

// ----------------------------------------------------------------------------
// Convergence curve — objective (optimal), infeasibility residual (infeasible)
// or diverging objective (unbounded). Always lands exactly on the known truth.
// ----------------------------------------------------------------------------
function buildConvergence(problem, rng) {
  const points = [];
  if (problem.status === 'OPTIMAL') {
    const target = problem.exact ? problem.exact.primal && problem.objective : problem.objective;
    const finalObj = problem.objective;
    const improvingDir = problem.sense === 'MAXIMIZE' ? 1 : -1;
    const spread = Math.max(6, Math.abs(finalObj) * (0.35 + rng() * 0.25));
    const nIter = problem.rows <= 3 ? 2 + Math.floor(rng() * 2) : 8 + Math.floor(rng() * 14);
    for (let k = 0; k <= nIter; k++) {
      const decay = Math.pow(0.62, k) * (1 - k / (nIter + 6));
      const noise = k === nIter ? 0 : (rng() - 0.5) * spread * 0.03;
      const value = k === nIter ? finalObj : finalObj - improvingDir * spread * Math.max(decay, 0) + noise;
      points.push({ iteration: k, objective: Number(value.toFixed(6)) });
    }
    return { points, iterations: nIter, mode: 'objective' };
  }
  if (problem.status === 'INFEASIBLE') {
    const nIter = 2 + Math.floor(rng() * 3);
    const startInfeas = 2 + rng() * 6;
    const floor = 0.15 + rng() * 0.6;
    for (let k = 0; k <= nIter; k++) {
      const decay = Math.pow(0.55, k);
      const value = floor + (startInfeas - floor) * decay;
      points.push({ iteration: k, infeasibility: Number(value.toFixed(6)) });
    }
    return { points, iterations: nIter, mode: 'infeasibility' };
  }
  // UNBOUNDED
  const nIter = 4 + Math.floor(rng() * 5);
  const improvingDir = problem.sense === 'MAXIMIZE' ? 1 : -1;
  const scale = 1.5 + rng();
  for (let k = 0; k <= nIter; k++) {
    const value = improvingDir * scale * Math.pow(1.9, k);
    points.push({ iteration: k, objective: Number(value.toFixed(6)) });
  }
  return { points, iterations: nIter, mode: 'diverging' };
}

// ----------------------------------------------------------------------------
// Primal / row tables
// ----------------------------------------------------------------------------
function buildSolutionTables(problem, rng) {
  if (problem.status !== 'OPTIMAL') return { variables: [], constraints: [] };

  if (problem.exact) {
    const variables = problem.colNames.map((name) => ({
      name,
      value: problem.exact.primal[name],
      reducedCost: problem.exact.reducedCost[name],
      status: problem.exact.basis[name],
    }));
    const constraints = problem.rowNames.map((name) => {
      const b = problem.exact.rowBounds[name];
      return {
        name,
        activity: problem.exact.activity[name],
        lb: b.lb,
        ub: b.ub,
        dual: problem.exact.dual[name],
      };
    });
    return { variables, constraints };
  }

  // Larger sample problems: plausible, seeded, non-verified values for display.
  const scale = Math.max(1, Math.abs(problem.objective) / Math.max(problem.cols, 1));
  const variables = problem.colNames.map((name) => {
    const basic = rng() < 0.55;
    if (basic) {
      const value = Number((rng() * scale * 6).toFixed(4));
      return { name, value, reducedCost: 0, status: 'BASIC' };
    }
    const atUpper = rng() < 0.15;
    return {
      name,
      value: atUpper ? Number((rng() * scale * 10).toFixed(4)) : 0,
      reducedCost: Number(((atUpper ? -1 : 1) * rng() * 2.5).toFixed(6)),
      status: atUpper ? 'AT_UPPER' : 'AT_LOWER',
    };
  });
  const constraints = problem.rowNames.map((name, i) => {
    const sense = problem.rowSense[i];
    const binding = rng() < 0.4;
    const lb = sense === 'G' || sense === 'E' ? Number((rng() * 30 - 5).toFixed(2)) : -Infinity;
    const ub = sense === 'L' || sense === 'E' ? (sense === 'E' ? lb : Number((rng() * 30 + 10).toFixed(2))) : Infinity;
    const activity = binding
      ? sense === 'G' ? lb : sense === 'L' ? ub : lb
      : Number((((Number.isFinite(lb) ? lb : 0) + (Number.isFinite(ub) ? ub : (Number.isFinite(lb) ? lb + 10 : 10))) / 2).toFixed(2));
    const dual = binding ? Number(((sense === 'L' ? -1 : 1) * rng() * 3).toFixed(6)) : 0;
    return { name, activity, lb, ub, dual };
  });
  return { variables, constraints };
}

// ----------------------------------------------------------------------------
// Log line builder — mirrors the CLI's own voice ([OK]/[!!], kv pairs, the
// per-reduction listing) so the panel reads like a real terminal session.
// ----------------------------------------------------------------------------
function buildLogLines({ problem, config, presolve, scaling, convergence, timings, status, certTier }) {
  const lines = [];
  const push = (level, text) => lines.push({ level, text });

  push('info', `Loading: ${problem.fileName}`);
  push('ok', `Parsed '${problem.name}'  ${timings.parseMs.toFixed(1)}ms`);
  push(
    'meta',
    `MODEL  ${problem.name} — ${problem.rows} rows x ${problem.cols} cols, ${problem.nnz} nnz, ${problem.sense}`
  );

  if (config.presolve) {
    push(
      'ok',
      `[Presolve] Reduced to ${presolve.rowsAfter}r x ${presolve.colsAfter}c (${presolve.reductions.length} reductions, ${timings.presolveMs.toFixed(1)}ms)`
    );
    presolve.reductions.slice(0, 8).forEach((r, i) => {
      push('dim', `  #${i + 1}: ${r.type.padEnd(16, ' ')} (row=${r.rowName}, col=${r.colName}, rhs=${r.rhs})`);
    });
    if (presolve.reductions.length > 8) {
      push('dim', `  ... ${presolve.reductions.length - 8} more reductions omitted`);
    }
  } else {
    push('warn', '[Presolve] Disabled by configuration (--no-presolve)');
  }

  if (config.scaling) {
    push('ok', `[Scaling] Equilibrated ${scaling.rows} rows x ${scaling.cols} cols (${timings.scalingMs.toFixed(1)}ms)`);
  } else {
    push('warn', '[Scaling] Disabled by configuration (--no-scaling)');
  }

  if (status === 'TIME_LIMIT') {
    push('info', '[Solve] Bounded Revised Dual Simplex — Phase II');
    convergence.points.slice(0, -1).forEach((p) => push('dim', `  iter ${p.iteration}   obj = ${p.objective.toFixed(6)}`));
    push('warn', `[Solve] Time limit (${config.timeLimitSec}s) reached before optimality — returning best known bound`);
  } else if (status === 'OPTIMAL') {
    push('info', '[Solve] Bounded Revised Dual Simplex — Phase II');
    convergence.points.forEach((p) => push('dim', `  iter ${p.iteration}   obj = ${p.objective.toFixed(6)}`));
    push('ok', `[Solve] Optimal solution found in ${convergence.iterations} iterations (${timings.solveMs.toFixed(1)}ms)`);
    push(
      'ok',
      `[Certify] T0 residuals — primal ${(1e-13 * (1 + Math.random())).toExponential(1)}, dual ${(1e-13 * (1 + Math.random())).toExponential(1)}, gap ${(1e-12 * (1 + Math.random())).toExponential(1)} -> PASS`
    );
    push('ok', `STATUS = OPTIMAL   TIER = ${certTier}   OBJECTIVE = ${problem.objective.toFixed(6)}`);
  } else if (status === 'INFEASIBLE') {
    push('info', '[Solve] Phase I — searching for a feasible basis');
    convergence.points.forEach((p) => push('dim', `  iter ${p.iteration}   infeas = ${p.infeasibility.toFixed(6)}`));
    push('warn', '[Solve] Phase I stalled — no feasible basis exists');
    push('ok', '[Certify] Farkas certificate constructed (y^T b < 0, y^T A >= 0) -> INFEASIBLE proven');
    push('err', `STATUS = INFEASIBLE   TIER = ${certTier}`);
  } else if (status === 'UNBOUNDED') {
    push('info', '[Solve] Phase II — objective improving without bound');
    convergence.points.forEach((p) => push('dim', `  iter ${p.iteration}   obj = ${p.objective.toFixed(6)}`));
    push('warn', `[Solve] Unbounded ray detected on column ${problem.colNames[0]}`);
    push('ok', '[Certify] Primal ray constructed (A d in rec. cone, c^T d < 0) -> UNBOUNDED proven');
    push('err', `STATUS = UNBOUNDED   TIER = ${certTier}`);
  }

  return lines;
}

// ----------------------------------------------------------------------------
// Build the complete deterministic result for a (problem, config) pair.
// ----------------------------------------------------------------------------
export function buildMockResult(problem, config, seedSuffix = '') {
  const rng = makeRng(`${problem.id}:${JSON.stringify(config)}:${seedSuffix}`);

  const presolve = config.presolve
    ? simulatePresolve(problem, rng)
    : { reductions: [], rowsAfter: problem.rows, colsAfter: problem.cols, objOffset: 0 };

  const scaling = config.scaling
    ? { rows: presolve.rowsAfter, cols: presolve.colsAfter }
    : { rows: 0, cols: 0 };

  const convergence = buildConvergence(problem, rng);

  const parseMs = Number((0.15 + rng() * 0.6 + problem.nnz * 0.004).toFixed(2));
  const presolveMs = config.presolve ? Number((0.05 + rng() * 0.3).toFixed(2)) : 0;
  const scalingMs = config.scaling ? Number((0.04 + rng() * 0.2).toFixed(2)) : 0;
  const threadSpeedup = 1 / Math.sqrt(Math.max(1, config.threads));
  const baseSolveMs = 0.2 + convergence.iterations * (0.08 + rng() * 0.1) + problem.nnz * 0.003;
  const solveMs = Number((baseSolveMs * threadSpeedup).toFixed(2));
  const totalMs = Number((parseMs + presolveMs + scalingMs + solveMs).toFixed(2));

  let status = problem.status;
  let certTier = status === 'OPTIMAL' ? 'T0' : status === 'UNSOLVED' ? 'NONE' : 'T0';
  const timeLimitMs = config.timeLimitSec > 0 ? config.timeLimitSec * 1000 : Infinity;
  let objectiveAtCutoff = null;
  if (totalMs > timeLimitMs && status === 'OPTIMAL') {
    status = 'TIME_LIMIT';
    certTier = 'NONE';
    // Best bound known at the moment the clock ran out.
    const cutoffFraction = Math.max(0.15, Math.min(0.9, timeLimitMs / totalMs));
    const idx = Math.max(0, Math.floor(convergence.points.length * cutoffFraction) - 1);
    objectiveAtCutoff = convergence.points[idx]?.objective ?? convergence.points[0].objective;
  }

  const tables = status === 'OPTIMAL' ? buildSolutionTables(problem, rng) : { variables: [], constraints: [] };

  const timings = { parseMs, presolveMs, scalingMs, solveMs, totalMs };
  const logLines = buildLogLines({ problem, config, presolve, scaling, convergence, timings, status, certTier });

  const result = {
    id: `run_${Date.now().toString(36)}_${Math.floor(rng() * 1e6).toString(36)}`,
    timestamp: new Date().toISOString(),
    problem: {
      id: problem.id,
      name: problem.name,
      fileName: problem.fileName,
      sense: problem.sense,
      rows: problem.rows,
      cols: problem.cols,
      nnz: problem.nnz,
      integers: problem.integers,
    },
    config: { ...config },
    status,
    certTier,
    objective: status === 'OPTIMAL' ? problem.objective : status === 'TIME_LIMIT' ? objectiveAtCutoff : null,
    isBestBound: status === 'TIME_LIMIT',
    timings,
    presolve: {
      enabled: config.presolve,
      reductions: presolve.reductions,
      before: { rows: problem.rows, cols: problem.cols },
      after: { rows: presolve.rowsAfter, cols: presolve.colsAfter },
    },
    scaling: { enabled: config.scaling, rows: scaling.rows, cols: scaling.cols },
    convergence,
    variables: tables.variables,
    constraints: tables.constraints,
    farkas: problem.exact?.farkas
      ? problem.rowNames.map((name) => ({ name, value: problem.exact.farkas[name] ?? 0 }))
      : [],
    farkasNote: problem.exact?.farkasNote ?? null,
    ray: problem.exact?.ray
      ? problem.colNames.map((name) => ({ name, value: problem.exact.ray[name] ?? 0 }))
      : [],
    rayNote: problem.exact?.rayNote ?? null,
    logLines,
  };

  return result;
}

// ----------------------------------------------------------------------------
// simulateRun — animates the pipeline stage by stage via onEvent callbacks,
// then resolves with the same RunResult buildMockResult() produces. This is
// the one function a real backend integration would replace (e.g. swap the
// body for a fetch() + EventSource that streams the identical event shapes).
// ----------------------------------------------------------------------------
const STAGE_SEQUENCE = ['parse', 'presolve', 'scaling', 'solve', 'certify'];

export function simulateRun(problem, config, { onEvent = () => {}, signal } = {}) {
  const result = buildMockResult(problem, config, Date.now().toString(36));
  const stages = STAGE_SEQUENCE.filter((s) => {
    if (s === 'presolve') return config.presolve;
    if (s === 'scaling') return config.scaling;
    return true;
  });

  // Split the pre-computed log lines across stages so the log panel streams
  // in an order that matches the progress bar.
  const grouped = { parse: [], presolve: [], scaling: [], solve: [], certify: [] };
  let bucket = 'parse';
  for (const line of result.logLines) {
    if (line.text.startsWith('[Presolve]') || line.text.startsWith('  #')) bucket = 'presolve';
    else if (line.text.startsWith('[Scaling]')) bucket = 'scaling';
    else if (line.text.startsWith('[Solve]') || line.text.startsWith('  iter')) bucket = 'solve';
    else if (line.text.startsWith('[Certify]') || line.text.startsWith('STATUS')) bucket = 'certify';
    grouped[bucket].push(line);
  }

  return new Promise((resolve, reject) => {
    let cancelled = false;
    if (signal) signal.addEventListener('abort', () => { cancelled = true; reject(new Error('cancelled')); });

    (async () => {
      onEvent({ type: 'start', result });
      for (let s = 0; s < stages.length; s++) {
        const stage = stages[s];
        if (cancelled) return;
        onEvent({ type: 'stage-start', stage, index: s, total: stages.length });

        const lines = grouped[stage] || [];
        const isSolveStage = stage === 'solve';
        const chartPoints = isSolveStage ? result.convergence.points : [];
        const stepCount = Math.max(lines.length, chartPoints.length, 3);
        const stageDelay = stage === 'solve' ? 55 : stage === 'parse' ? 90 : 70;

        for (let i = 0; i < stepCount; i++) {
          if (cancelled) return;
          if (lines[i]) onEvent({ type: 'log', line: lines[i] });
          if (isSolveStage && chartPoints[i]) onEvent({ type: 'iteration', point: chartPoints[i] });
          onEvent({
            type: 'progress',
            stage,
            index: s,
            total: stages.length,
            stageProgress: (i + 1) / stepCount,
            overallProgress: (s + (i + 1) / stepCount) / stages.length,
          });
          // eslint-disable-next-line no-await-in-loop
          await sleep(stageDelay);
        }
        onEvent({ type: 'stage-end', stage });
      }
      onEvent({ type: 'complete', result });
      resolve(result);
    })();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ----------------------------------------------------------------------------
// Certificate file text — matches docs/CERT_FORMAT.md field-for-field.
// ----------------------------------------------------------------------------
export function buildCertificateText(result) {
  const g = (n) => (Number.isFinite(n) ? n.toPrecision(17) : n === Infinity ? 'inf' : n === -Infinity ? '-inf' : 'nan');
  const lines = [];
  lines.push('ISOLVE_CERT 1.0');
  lines.push(`PROBLEM      ${result.problem.name}`);
  lines.push(`STATUS       ${result.status}`);
  lines.push(`TIER         ${result.certTier}`);
  lines.push(`OBJECTIVE    ${result.objective !== null ? g(result.objective) : 'NaN'}`);
  lines.push('');
  lines.push('# --- Dimensions (original model, before presolve) ---');
  lines.push(`ORIG_ROWS    ${result.problem.rows}`);
  lines.push(`ORIG_COLS    ${result.problem.cols}`);
  lines.push('');

  lines.push('# --- Primal solution  x (original variable space) ---');
  lines.push('PRIMAL_START');
  result.variables.forEach((v) => lines.push(g(v.value)));
  lines.push('PRIMAL_END');
  lines.push('');

  lines.push('# --- Row activities  Ax ---');
  lines.push('ACTIVITY_START');
  result.constraints.forEach((c) => lines.push(g(c.activity)));
  lines.push('ACTIVITY_END');
  lines.push('');

  lines.push('# --- Dual variables  y (row duals, shadow prices) ---');
  lines.push('DUAL_START');
  result.constraints.forEach((c) => lines.push(g(c.dual)));
  lines.push('DUAL_END');
  lines.push('');

  lines.push('# --- Reduced costs  d ---');
  lines.push('REDCOST_START');
  result.variables.forEach((v) => lines.push(g(v.reducedCost)));
  lines.push('REDCOST_END');
  lines.push('');

  lines.push('# --- Basis status: one token per variable ---');
  lines.push('BASIS_VAR_START');
  result.variables.forEach((v) => lines.push(v.status));
  lines.push('BASIS_VAR_END');
  lines.push('');

  if (result.farkas.length) {
    lines.push('# --- Farkas ray (STATUS=INFEASIBLE) ---');
    lines.push('FARKAS_START');
    result.farkas.forEach((f) => lines.push(g(f.value)));
    lines.push('FARKAS_END');
    lines.push('');
  }
  if (result.ray.length) {
    lines.push('# --- Primal ray (STATUS=UNBOUNDED) ---');
    lines.push('PRIMAL_RAY_START');
    result.ray.forEach((r) => lines.push(g(r.value)));
    lines.push('PRIMAL_RAY_END');
    lines.push('');
  }

  lines.push('# --- Reduction log reference ---');
  lines.push('REDUCTIONS_START');
  result.presolve.reductions.forEach((r) =>
    lines.push(`${r.type} ${r.rowIdx} ${r.colIdx} 0 0 0 ${r.coeff} ${r.rhs}`)
  );
  lines.push('REDUCTIONS_END');
  lines.push('');
  lines.push('# Generated by isolve mock UI -- simulated data, NOT a real solver certificate.');

  return lines.join('\n');
}

// ----------------------------------------------------------------------------
// Raw JSON output — mirrors the `--json` batch-mode payload shape from
// src/cli/main.cpp (extended with the fields the interactive `solve`
// certificate path would add once M3 lands).
// ----------------------------------------------------------------------------
export function buildJsonOutput(result) {
  return {
    status: result.status,
    tier: result.certTier,
    model: result.problem.name,
    rows: result.problem.rows,
    cols: result.problem.cols,
    nnz: result.problem.nnz,
    parse_ms: result.timings.parseMs,
    presolve_reductions: result.presolve.reductions.length,
    rows_after_presolve: result.presolve.after.rows,
    cols_after_presolve: result.presolve.after.cols,
    scaling_enabled: result.scaling.enabled,
    solve_ms: result.timings.solveMs,
    total_ms: result.timings.totalMs,
    iterations: result.convergence.iterations,
    objective: result.objective,
  };
}

// ----------------------------------------------------------------------------
// History — persisted to localStorage so past runs survive a page reload.
// ----------------------------------------------------------------------------
const HISTORY_KEY = 'isolve.mockui.history.v1';
const HISTORY_LIMIT = 50;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(result) {
  try {
    const current = loadHistory();
    const next = [result, ...current].slice(0, HISTORY_LIMIT);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadHistory();
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
  return [];
}

export function removeHistoryEntry(id) {
  try {
    const next = loadHistory().filter((r) => r.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadHistory();
  }
}
