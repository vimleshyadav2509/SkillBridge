import React, { useState, useEffect } from "react";
import { executeChallengeCode } from "../services/pyodideRunner";

export default function CodeEditor({ challenge, onAssessmentComplete }) {
  const [code, setCode] = useState(challenge?.starter_code || "");
  const [activeTab, setActiveTab] = useState("tests"); // 'tests' | 'output'
  const [isRunning, setIsRunning] = useState(false);
  const [testRun, setTestRun] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Sync starter code when challenge changes
  useEffect(() => {
    if (challenge?.starter_code) {
      setCode(challenge.starter_code);
      setTestRun(null);
      setHasSubmitted(false);
    }
  }, [challenge]);

  const handleReset = () => {
    if (challenge?.starter_code) {
      setCode(challenge.starter_code);
      setTestRun(null);
    }
  };

  const handleLoadSolution = () => {
    if (challenge?.solution_code) {
      setCode(challenge.solution_code);
    }
  };

  const handleRunCode = async () => {
    if (!challenge) return;
    setIsRunning(true);
    try {
      const result = await executeChallengeCode(code, challenge);
      setTestRun(result);
      setActiveTab("tests");
    } catch (err) {
      setTestRun({
        total: 1,
        passed: 0,
        failed: 1,
        score_pct: 0,
        results: [{ name: "Execution Exception", passed: false, error: err.message }],
        error: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitAssessment = () => {
    if (!testRun) return;
    setHasSubmitted(true);
    if (onAssessmentComplete) {
      onAssessmentComplete({
        challenge,
        testRun,
      });
    }
  };

  if (!challenge) {
    return (
      <div className="editor-empty-state">
        <p>No active coding challenge selected. Run gap analysis to generate one.</p>
      </div>
    );
  }

  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 16) }, (_, i) => i + 1);

  return (
    <div className="gfg-challenge-container">
      {/* =========================================================
          CHALLENGE HEADER BAR
      ========================================================= */}
      <div className="challenge-meta-header">
        <div className="meta-left">
          <span className="gfg-badge">GFG-STYLE CHALLENGE</span>
          <span className={`difficulty-pill ${challenge.difficulty?.toLowerCase().replace(/[^a-z]/g, "")}`}>
            {challenge.difficulty}
          </span>
          <span className="skill-tag">Skill: {challenge.skill_gap}</span>
        </div>
        <div className="meta-right">
          <span className="time-limit-badge">⏱ {challenge.time_limit_sec || 5}s Sandbox Timeout</span>
        </div>
      </div>

      <h2 className="challenge-main-title">{challenge.title}</h2>

      {/* WHY AM I BEING TESTED ON THIS? (Phase 30 / Phase 32 explainable AI) */}
      {challenge.why_tested && (
        <div className="why-tested-banner">
          <div className="why-tested-icon">💡</div>
          <div className="why-tested-body">
            <strong>Why am I being tested on this?</strong>
            <p>{challenge.why_tested}</p>
          </div>
        </div>
      )}

      {/* =========================================================
          2-COLUMN LAYOUT: PROBLEM STATEMENT & CODE WORKSPACE
      ========================================================= */}
      <div className="challenge-workspace-grid">
        {/* LEFT COLUMN: PROBLEM DESCRIPTION */}
        <div className="problem-description-panel">
          <div className="panel-tab-title">
            <span>📋 Problem Statement</span>
          </div>

          <div className="problem-content-scroll">
            <div className="statement-text">
              {challenge.problem_statement?.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {challenge.input_format && (
              <div className="spec-section">
                <h4>Input Format:</h4>
                <code>{challenge.input_format}</code>
              </div>
            )}

            {challenge.output_format && (
              <div className="spec-section">
                <h4>Output Format:</h4>
                <code>{challenge.output_format}</code>
              </div>
            )}

            {challenge.constraints?.length > 0 && (
              <div className="spec-section">
                <h4>Constraints:</h4>
                <ul className="constraints-list">
                  {challenge.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {challenge.examples?.map((ex, idx) => (
              <div className="example-block" key={idx}>
                <div className="example-header">Example {idx + 1}</div>
                <div className="example-body">
                  <div><strong>Input:</strong> <code>{ex.input}</code></div>
                  <div><strong>Output:</strong> <code>{ex.output}</code></div>
                  {ex.explanation && (
                    <div className="example-expl"><em>Explanation:</em> {ex.explanation}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: CODE EDITOR & RUNNER */}
        <div className="code-editor-panel">
          {/* EDITOR CONTROLS BAR */}
          <div className="editor-control-bar">
            <div className="lang-indicator">
              <span className="lang-dot"></span>
              <span>Python 3.11 (Pyodide WebAssembly)</span>
            </div>

            <div className="editor-btn-group">
              <button
                className="btn-editor-tool"
                onClick={handleLoadSolution}
                title="Loads the verified reference solution (ideal for instant judge evaluation)"
              >
                ⚡ Load Solution
              </button>
              <button className="btn-editor-tool" onClick={handleReset} title="Reset code to starter skeleton">
                ↺ Reset
              </button>
              <button
                className="btn-run-code"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <span className="spinner-small"></span> Running Tests...
                  </>
                ) : (
                  <>▶ Run Tests</>
                )}
              </button>
            </div>
          </div>

          {/* CODE WORKSPACE WITH LINE NUMBERS */}
          <div className="editor-workspace">
            <div className="line-numbers-gutter">
              {lineNumbers.map((num) => (
                <div key={num} className="line-num">
                  {num}
                </div>
              ))}
            </div>
            <textarea
              className="code-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              rows={16}
            ></textarea>
          </div>

          {/* TEST RESULTS & CONSOLE AREA */}
          <div className="editor-output-container">
            <div className="output-header-bar">
              <div className="output-tabs">
                <button
                  className={`out-tab ${activeTab === "tests" ? "active" : ""}`}
                  onClick={() => setActiveTab("tests")}
                >
                  Test Results {testRun && `(${testRun.passed}/${testRun.total})`}
                </button>
                <button
                  className={`out-tab ${activeTab === "output" ? "active" : ""}`}
                  onClick={() => setActiveTab("output")}
                >
                  Terminal Output
                </button>
              </div>

              {testRun && (
                <div className="output-meta">
                  <span className={`eval-score-pill ${testRun.score_pct >= 80 ? "pill-emerald" : "pill-amber"}`}>
                    Score: {testRun.score_pct}%
                  </span>
                  <span className="exec-time-pill">⚡ {testRun.duration_ms}ms</span>
                </div>
              )}
            </div>

            <div className="output-body">
              {isRunning && (
                <div className="running-notice">
                  <span className="spinner-medium"></span>
                  <p>Executing your function in safe in-browser sandbox against visible & hidden test cases...</p>
                </div>
              )}

              {!isRunning && !testRun && (
                <div className="output-idle">
                  <p>Click <strong>▶ Run Tests</strong> to execute your code against test cases.</p>
                  <p className="hint-text">Judges can click <strong>⚡ Load Solution</strong> for instant 100% verification.</p>
                </div>
              )}

              {!isRunning && testRun && activeTab === "tests" && (
                <div className="test-cases-list">
                  {testRun.error && (
                    <div className="test-error-banner">
                      <strong>⚠️ Execution Notice:</strong> {testRun.error}
                    </div>
                  )}

                  {testRun.results?.map((tc, idx) => (
                    <div className={`test-result-card ${tc.passed ? "passed" : "failed"}`} key={idx}>
                      <div className="test-card-header">
                        <span className="test-badge">{tc.passed ? "✓ Passed" : "✕ Failed"}</span>
                        <span className="test-name">{tc.name}</span>
                        {tc.isHidden && <span className="hidden-pill">Hidden Test Case</span>}
                      </div>

                      <div className="test-card-details">
                        {!tc.isHidden ? (
                          <>
                            <div className="io-row">
                              <span className="io-label">Call:</span>
                              <code>{tc.call}</code>
                            </div>
                            <div className="io-row">
                              <span className="io-label">Expected:</span>
                              <code>{tc.expected}</code>
                            </div>
                            <div className="io-row">
                              <span className="io-label">Actual:</span>
                              <code className={tc.passed ? "code-pass" : "code-fail"}>{tc.actual}</code>
                            </div>
                          </>
                        ) : (
                          <div className="hidden-eval-note">
                            {tc.passed
                              ? "✓ Verified against strict boundary & performance constraints."
                              : "✕ Failed hidden boundary verification."}
                          </div>
                        )}
                        {tc.error && (
                          <div className="test-case-error">
                            <span>Error: {tc.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* SUBMIT ACTION BAR */}
                  <div className="submit-assessment-bar">
                    <div className="submit-info">
                      <span>
                        Result: <strong>{testRun.passed} / {testRun.total} Passed ({testRun.score_pct}%)</strong>
                      </span>
                    </div>
                    <button
                      className="btn-submit-assessment"
                      onClick={handleSubmitAssessment}
                      disabled={hasSubmitted}
                    >
                      {hasSubmitted ? "✓ Submitted - Updating..." : "🚀 Submit Assessment & Close the Loop →"}
                    </button>
                  </div>
                </div>
              )}

              {!isRunning && testRun && activeTab === "output" && (
                <div className="console-log-view">
                  <pre className="terminal-pre">
                    {testRun.stdout ? testRun.stdout : "No standard output (print statements) produced."}
                    {"\n\n--- Engine Diagnostics ---"}
                    {"\nExecution Engine: " + testRun.execution_type}
                    {"\nTotal Runtime: " + testRun.duration_ms + "ms"}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
