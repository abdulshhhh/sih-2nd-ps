import { useCallback, useState } from 'react';
import { Sidebar } from './components/Sidebar.jsx';
import { TopBar } from './components/TopBar.jsx';
import { MobileNav } from './components/MobileNav.jsx';
import { ProblemSetup } from './screens/ProblemSetup.jsx';
import { SolverRun } from './screens/SolverRun.jsx';
import { Results } from './screens/Results.jsx';
import { History } from './screens/History.jsx';
import { useTheme } from './hooks/useTheme.js';
import { SAMPLE_PROBLEMS, DEFAULT_CONFIG, loadHistory, saveHistoryEntry, clearHistory } from './mock/solver.js';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState('setup');
  const [problem, setProblem] = useState(SAMPLE_PROBLEMS[0]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [currentResult, setCurrentResult] = useState(null);
  const [history, setHistory] = useState(() => loadHistory());
  const [runKey, setRunKey] = useState(0);

  const handleRun = useCallback(() => {
    setRunKey((k) => k + 1);
    setView('run');
  }, []);

  const handleRunComplete = useCallback((result) => {
    setCurrentResult(result);
    setHistory(saveHistoryEntry(result));
    setView('results');
  }, []);

  const handleCancelRun = useCallback(() => {
    setView('setup');
  }, []);

  const handleSelectHistory = useCallback((run) => {
    setCurrentResult(run);
    setProblem((prev) => SAMPLE_PROBLEMS.find((p) => p.id === run.problem.id) || prev);
    setConfig(run.config);
    setView('results');
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory(clearHistory());
  }, []);

  const handleRerun = useCallback(() => {
    setRunKey((k) => k + 1);
    setView('run');
  }, []);

  const navigate = (target) => {
    if (target === 'run' && !problem) return;
    if (target === 'results' && !currentResult) return;
    setView(target);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <Sidebar
        view={view}
        onNavigate={navigate}
        runDisabled={false}
        resultsDisabled={!currentResult}
        historyCount={history.length}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar view={view} theme={theme} onToggleTheme={toggleTheme} />
        <main className="thin-scroll flex-1 overflow-y-auto">
          {view === 'setup' && (
            <ProblemSetup
              problem={problem}
              setProblem={setProblem}
              config={config}
              setConfig={setConfig}
              onRun={handleRun}
            />
          )}
          {view === 'run' && (
            <SolverRun
              key={runKey}
              problem={problem}
              config={config}
              onComplete={handleRunComplete}
              onCancel={handleCancelRun}
            />
          )}
          {view === 'results' && (
            <Results result={currentResult} onRunAnother={() => setView('setup')} onRerun={handleRerun} />
          )}
          {view === 'history' && (
            <History history={history} onSelect={handleSelectHistory} onClear={handleClearHistory} />
          )}
        </main>
        <MobileNav view={view} onNavigate={navigate} runDisabled={false} resultsDisabled={!currentResult} />
      </div>
    </div>
  );
}
