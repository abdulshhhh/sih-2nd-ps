# isolve — mock UI

A frontend demo for the [isolve](../) LP/MILP solver engine. It looks and behaves like a
finished optimization SaaS product — problem setup, a live solver run with progress and a
convergence chart, a results dashboard, and run history — but **there is no backend**. Every
number on screen is generated in the browser by [`src/mock/solver.js`](src/mock/solver.js).

This exists because the real solver's simplex core is still mid-build (see the repo's
`DECISIONS.md` — Milestone 3, Bounded Revised Dual Simplex). Running `solve` on the actual CLI
today returns `UNSOLVED`. This UI fakes the *finished* pipeline's output so the product
experience can be designed and demoed before the core lands.

## Running it

```bash
cd ui
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). No environment variables, no
API keys, no database — it's a static SPA.

```bash
npm run build      # production bundle -> dist/
npm run preview    # serve that bundle locally
npm run lint        # oxlint
```

## How the screens map to the CLI

The real CLI lives at [`../src/cli/main.cpp`](../src/cli/main.cpp). Every control in this UI
corresponds to a real flag or interactive command from that file.

| UI element | CLI equivalent |
|---|---|
| Sample problem dropdown | `load <file.mps>` — the six options are the exact fixtures in `../tests/data/*.mps` |
| "Choose .mps file" upload | `load <file.mps>` for an arbitrary file (a lightweight client-side parser reads `ROWS`/`COLUMNS` to size the model) |
| Threads field | `set threads <N>` / `--threads N` |
| Time limit field | `set time_limit <S>` / `--time-limit S` (0 = unlimited). Set it below the run's total time to see a `TIME_LIMIT` result. |
| Presolve toggle | `set presolve <on\|off>` / `--no-presolve` |
| Scaling toggle | `set scaling <on\|off>` / `--no-scaling` |
| JSON output toggle | `set json <on\|off>` / `--json` — adds a raw JSON payload panel to Results, shaped like the CLI's `--json` output |
| Write certificate toggle | `--cert FILE` — enables a downloadable `.cert` file on Results |
| Run Solver → pipeline stepper | the `solve` command's internal stages: parse → presolve → scale → simplex → certify |
| Live log panel | the CLI's own colored console output (`[OK]`, `[!!]`, the presolve reduction list, `iter N obj = …`) reproduced as styled text |
| Results → Solution table | the certificate's `PRIMAL_*`, `REDCOST_*`, `BASIS_VAR_*` sections (Variables tab) and `ACTIVITY_*`/`DUAL_*` sections (Constraints tab) |
| Results → Certificate download | the full certificate format from [`../docs/CERT_FORMAT.md`](../docs/CERT_FORMAT.md) |
| History | not a CLI feature — a convenience for this demo, persisted to `localStorage` |

## Where the mock logic lives

Everything fake is in **one file**, [`src/mock/solver.js`](src/mock/solver.js), so it's the
single place to touch when a real backend is ready:

- `SAMPLE_PROBLEMS` — the six bundled problems, with real row/column names and dimensions
  extracted from `../tests/data/*.mps`, and known status/objective from
  `../tests/data/expected.csv` (three end in `OPTIMAL`, two in `INFEASIBLE`, one in
  `UNBOUNDED`, so all three certificate shapes are demonstrable).
- `buildMockResult(problem, config)` — deterministically fabricates a full run result: presolve
  reductions, a convergence curve that always lands on the known objective (or plateaus/diverges
  for infeasible/unbounded), a primal/dual solution table, and a CLI-style log transcript. Seeded
  by problem + config, so numbers are stable for a given configuration but vary slightly between
  runs, the way real solver timings would.
- `simulateRun(problem, config, { onEvent })` — replays that result as a timed sequence of
  events (`stage-start`, `log`, `iteration`, `progress`, `complete`). **This is the function a
  real integration would replace** — swap its body for a `fetch`/`EventSource`/WebSocket call
  that streams the same event shapes from a real solve endpoint, and the rest of the UI needs no
  changes.
- `buildCertificateText(result)` — renders the `.cert` file, field-for-field matching
  `docs/CERT_FORMAT.md`.
- `buildJsonOutput(result)` — the `--json` batch-mode payload shape.
- `loadHistory` / `saveHistoryEntry` / `clearHistory` — `localStorage`-backed run history.

## Project layout

```
ui/
  src/
    mock/solver.js        # all fake data + the swap point for a real API
    screens/               # ProblemSetup, SolverRun, Results, History
    components/            # Sidebar, TopBar, charts, log panel, table, shared UI primitives
    hooks/useTheme.js       # dark/light toggle, persisted to localStorage
```

## Notes

- Nothing here reads or writes the actual C++ solver — this folder is intentionally isolated
  from `../src`, `../include`, etc.
- A small amber "Simulated engine — demo data" badge stays visible in the top bar so the mock
  nature of the results is never misrepresented as real solver output.
