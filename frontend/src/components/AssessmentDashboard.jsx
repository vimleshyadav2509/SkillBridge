import React from "react";

export default function AssessmentDashboard({ evaluation, onNavigateToRoadmap, onRetakeAssessment }) {
  if (!evaluation) return null;

  const progress = evaluation.progress || {};
  const previousReadiness = progress.previous_readiness || 0;
  const updatedReadiness = progress.updated_readiness || 0;
  const scoreDelta = progress.score_delta || 0;
  const challengeScore = progress.challenge_score_pct || 0;
  const testsPassed = progress.tests_passed || 0;
  const totalTests = progress.total_tests || 0;
  const skillTested = progress.skill_tested || "Target Skill";

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluation, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SkillBridge_Assessment_Report_${skillTested.replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="assessment-dashboard-container">
      {/* HEADER BANNER */}
      <div className="eval-hero-banner">
        <div className="banner-badge-group">
          <span className="section-badge badge-emerald">ASSESSMENT COMPLETE</span>
          <span className="eval-status-pill">{progress.performance_status || "Evaluation Passed"}</span>
        </div>
        <h2 className="eval-hero-title">
          Skill Verification: <span className="gradient-text-emerald">{skillTested}</span>
        </h2>
        <p className="eval-hero-desc">
          You executed real code against rigorous test cases inside the Pyodide WebAssembly sandbox. Here is your verified employability progress update.
        </p>
      </div>

      {/* 3-CARD HIGHLIGHT METRICS */}
      <div className="eval-metrics-row">
        {/* TEST PERFORMANCE CARD */}
        <div className="eval-metric-card">
          <span className="metric-supertitle">CODING CHALLENGE SCORE</span>
          <div className="metric-huge-val">
            {challengeScore}
            <span className="denom">%</span>
          </div>
          <div className="metric-subtext">
            <strong>{testsPassed} of {totalTests}</strong> test cases passed
          </div>
          <div className="eval-progress-bar">
            <div
              className="eval-progress-fill"
              style={{
                width: `${challengeScore}%`,
                background: challengeScore >= 80 ? "#10b981" : "#f59e0b",
              }}
            ></div>
          </div>
        </div>

        {/* CLOSED-LOOP READINESS COMPARISON (Phase 18 Differentiator) */}
        <div className="eval-metric-card highlight-card">
          <span className="metric-supertitle">SKILLBRIDGE ESTIMATED READINESS</span>
          <div className="readiness-comparison-row">
            <div className="readiness-item prev">
              <span className="readiness-num">{previousReadiness}%</span>
              <span className="readiness-lbl">Pre-Assessment</span>
            </div>
            <div className="readiness-arrow">➔</div>
            <div className="readiness-item next">
              <span className="readiness-num highlight-emerald">{updatedReadiness}%</span>
              <span className="readiness-lbl">Post-Assessment</span>
            </div>
          </div>
          <div className="score-delta-badge">
            ▲ +{scoreDelta}% Readiness Confidence Gain
          </div>
          <p className="eval-disclaimer">
            {progress.disclaimer || "SkillBridge Estimated Progress reflects benchmark test completion."}
          </p>
        </div>

        {/* SKILL PROFILE UPGRADE */}
        <div className="eval-metric-card">
          <span className="metric-supertitle">SKILL STATUS UPGRADE</span>
          <div className="skill-upgrade-box">
            <div className="upgrade-row">
              <span className="upgrade-lbl">Before:</span>
              <span className="badge-pill badge-red">✕ Missing / Low Confidence</span>
            </div>
            <div className="upgrade-row">
              <span className="upgrade-lbl">After:</span>
              <span className="badge-pill badge-emerald">✓ {progress.new_confidence_level || "Demonstrated"}</span>
            </div>
          </div>
          <div className="verified-seal">
            <span className="seal-icon">🛡️</span>
            <span>Verified via In-Browser Code Execution</span>
          </div>
        </div>
      </div>

      {/* FEEDBACK & WHAT NEEDS IMPROVEMENT (Phase 17) */}
      <div className="eval-details-grid">
        <div className="feedback-card">
          <div className="fb-header">
            <span className="fb-icon">🌟</span>
            <h4>Performance Summary</h4>
          </div>
          <p className="fb-body">{progress.feedback_summary}</p>
        </div>

        <div className="feedback-card">
          <div className="fb-header">
            <span className="fb-icon">🎯</span>
            <h4>Next Practical Milestone</h4>
          </div>
          <p className="fb-body">
            Build a deployable microservice incorporating <strong>{skillTested}</strong> with authentication and query caching to showcase as a portfolio proof on your resume.
          </p>
        </div>
      </div>

      {/* REPORT EXPORT & ROADMAP ACTIONS */}
      <div className="eval-actions-bar">
        <div className="export-btn-group">
          <button className="btn-secondary-sm" onClick={handlePrintReport}>
            🖨️ Print SkillBridge Report
          </button>
          <button className="btn-secondary-sm" onClick={handleDownloadJSON}>
            📥 Export Audit JSON
          </button>
          <button className="btn-secondary-sm" onClick={onRetakeAssessment}>
            🔄 Try Another Challenge
          </button>
        </div>

        <button className="btn-primary" onClick={onNavigateToRoadmap}>
          View My 7-Day Improvement Roadmap →
        </button>
      </div>
    </div>
  );
}
