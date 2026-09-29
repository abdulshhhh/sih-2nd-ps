import { useRef, useState } from 'react';
import { Upload, Sparkles, PlayCircle, Cpu, Timer, FileCode2, Sigma } from 'lucide-react';
import { Card, CardHeader, Button, Toggle, Field, NumberInput, Select, Pill } from '../components/ui.jsx';
import { SAMPLE_PROBLEMS } from '../mock/solver.js';

function parseUploadedMps(text, fileName) {
  const lines = text.split(/\r?\n/);
  let section = null;
  const rowNames = [];
  const colNamesSet = new Set();
  let name = fileName.replace(/\.mps$/i, '').toUpperCase();
  let sense = 'MINIMIZE';
  let nnz = 0;
  for (const line of lines) {
    if (/^NAME/i.test(line)) {
      const m = line.trim().split(/\s+/);
      if (m[1]) name = m[1];
    } else if (/^ROWS/i.test(line)) section = 'ROWS';
    else if (/^COLUMNS/i.test(line)) section = 'COLUMNS';
    else if (/^(RHS|RANGES|BOUNDS|ENDATA)/i.test(line)) section = null;
    else if (section === 'ROWS') {
      const m = line.trim().match(/^([A-Za-z])\s+(\S+)/);
      if (m) {
        if (m[1].toUpperCase() === 'N') {
          if (/max/i.test(m[2])) sense = 'MAXIMIZE';
        } else rowNames.push(m[2]);
      }
    } else if (section === 'COLUMNS') {
      if (/MARKER/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        colNamesSet.add(parts[0]);
        nnz += 1;
        if (parts.length >= 5) nnz += 1;
      }
    }
  }
  const colNames = Array.from(colNamesSet);
  return {
    id: `upload:${fileName}`,
    name,
    fileName,
    tag: 'Uploaded file',
    description: `Custom MPS file uploaded from your machine (${fileName}).`,
    sense,
    rows: rowNames.length,
    cols: colNames.length,
    nnz,
    integers: 0,
    status: 'OPTIMAL',
    objective: Number((-Math.abs(rowNames.length * 12.7 + colNames.length * 3.1)).toFixed(6)),
    rowNames: rowNames.length ? rowNames : ['R1'],
    rowSense: rowNames.map(() => 'L'),
    colNames: colNames.length ? colNames : ['X1'],
  };
}

export function ProblemSetup({ problem, setProblem, config, setConfig, onRun }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState('');
  const [customProblem, setCustomProblem] = useState(null);

  const handleSampleSelect = (id) => {
    const sample = SAMPLE_PROBLEMS.find((p) => p.id === id);
    if (sample) {
      setCustomProblem(null);
      setProblem(sample);
      setUploadError('');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.mps$/i.test(file.name)) {
      setUploadError('Expected a .mps file — the mock parser only reads MPS-style ROWS/COLUMNS sections.');
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseUploadedMps(text, file.name);
      setCustomProblem(parsed);
      setProblem(parsed);
      setUploadError('');
    } catch {
      setUploadError('Could not read that file.');
    }
  };

  const setCfg = (patch) => setConfig((c) => ({ ...c, ...patch }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-5 py-6 md:px-8">
      {/* Problem source */}
      <Card>
        <CardHeader
          icon={FileCode2}
          title="1. Load a problem"
          subtitle="Pick a bundled sample (maps to isolve's tests/data fixtures) or upload your own MPS file."
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Sample problem" hint="Loads instantly — equivalent to the CLI's `load <file.mps>`.">
            <Select
              value={customProblem ? '' : problem.id}
              onChange={(e) => handleSampleSelect(e.target.value)}
            >
              {customProblem && <option value="">— custom upload loaded —</option>}
              {SAMPLE_PROBLEMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.rows}×{p.cols}) — {p.tag}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Or upload a file</span>
            <input ref={fileInputRef} type="file" accept=".mps" className="hidden" onChange={handleUpload} />
            <Button variant="secondary" size="md" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} />
              Choose .mps file
            </Button>
            {uploadError && <p className="mt-1.5 text-[11px] text-red-400">{uploadError}</p>}
          </div>
        </div>

        <div className="mx-5 mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-inset)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-[var(--text)]">{problem.name}</span>
            <Pill>{problem.tag}</Pill>
            <Pill>{problem.sense}</Pill>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{problem.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Rows', problem.rows],
              ['Cols', problem.cols],
              ['Non-zeros', problem.nnz],
              ['Density', `${((100 * problem.nnz) / Math.max(1, problem.rows * problem.cols)).toFixed(1)}%`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                <div className="text-[10px] uppercase tracking-wide text-[var(--text-faint)]">{label}</div>
                <div className="font-mono text-sm font-semibold text-[var(--text)]">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Solver configuration */}
      <Card>
        <CardHeader
          icon={Cpu}
          title="2. Solver configuration"
          subtitle="Every control maps to a real isolve CLI flag or `set` command."
        />
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Field label="Threads" hint="CLI: set threads <N> / --threads N">
            <NumberInput
              min={1}
              max={32}
              value={config.threads}
              onChange={(e) => setCfg({ threads: Math.max(1, Number(e.target.value) || 1) })}
            />
          </Field>
          <Field label="Time limit (seconds)" hint="CLI: set time_limit <S> / --time-limit S · 0 = unlimited. Try a tiny value (e.g. 0.001) to see TIME_LIMIT trigger.">
            <NumberInput
              min={0}
              step={0.001}
              value={config.timeLimitSec}
              onChange={(e) => setCfg({ timeLimitSec: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
        </div>
        <div className="divide-y divide-[var(--border)] px-5 pb-5">
          <Toggle
            label="Presolve"
            description="CLI: set presolve <on|off> / --no-presolve — eliminate empty rows/cols, fixed vars, tighten bounds."
            checked={config.presolve}
            onChange={(v) => setCfg({ presolve: v })}
          />
          <Toggle
            label="Scaling"
            description="CLI: set scaling <on|off> / --no-scaling — geometric equilibration on the constraint matrix."
            checked={config.scaling}
            onChange={(v) => setCfg({ scaling: v })}
          />
          <Toggle
            label="JSON output"
            description="CLI: set json <on|off> / --json — adds a raw machine-readable payload to the Results screen."
            checked={config.jsonOutput}
            onChange={(v) => setCfg({ jsonOutput: v })}
          />
          <Toggle
            label="Write certificate"
            description="CLI: --cert FILE — enables a downloadable .cert file on the Results screen (see docs/CERT_FORMAT.md)."
            checked={config.writeCertificate}
            onChange={(v) => setCfg({ writeCertificate: v })}
          />
        </div>
      </Card>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--text-faint)]">
          <Sigma size={14} />
          Pipeline: parse → {config.presolve ? 'presolve → ' : ''}{config.scaling ? 'scale → ' : ''}solve → certify
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleSampleSelect(SAMPLE_PROBLEMS[0].id)}
          >
            <Sparkles size={15} />
            Load sample problem
          </Button>
          <Button variant="primary" size="lg" onClick={onRun}>
            <PlayCircle size={17} />
            Run Solver
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
        <Timer size={12} />
        Solving is simulated client-side — nothing leaves your browser.
      </p>
    </div>
  );
}
