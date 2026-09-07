import React, { useState } from "react";

export default function SkillGapExplorer({ gapAnalysis, onSelectSkillToTest }) {
  const [filter, setFilter] = useState("all"); // 'all' | 'high' | 'medium' | 'matched'

  if (!gapAnalysis) {
    return null;
  }

  const allSkills = gapAnalysis.all_skills_analysis || [];

  const filteredSkills = allSkills.filter((s) => {
    if (filter === "high") return s.priority === "HIGH";
    if (filter === "medium") return s.priority === "MEDIUM";
    if (filter === "matched") return s.status === "MATCHED";
    return true;
  });

  const getPriorityBadgeClass = (p) => {
    if (p === "HIGH") return "badge-high";
    if (p === "MEDIUM") return "badge-medium";
    if (p === "LOW") return "badge-low";
    return "badge-none";
  };

  const getStatusIcon = (status) => {
    if (status === "MATCHED") return "✓";
    if (status === "PARTIAL") return "◐";
    return "✕";
  };

  const getStatusClass = (status) => {
    if (status === "MATCHED") return "pill-green";
    if (status === "PARTIAL") return "pill-amber";
    return "pill-red";
  };

  return (
    <div className="gap-explorer-container">
      {/* HEADER WITH FILTER TABS */}
      <div className="explorer-header-row">
        <div>
          <span className="section-badge badge-rose">EMPLOYABILITY GAP INTELLIGENCE</span>
          <h3 className="dashboard-title">Prioritized Skill Gaps</h3>
          <p className="section-desc-sm">
            Ranked by <strong>Impact × Importance × Gap Depth × Confidence</strong>. Identify exactly why each gap matters to recruiters.
          </p>
        </div>

        <div className="filter-pill-group">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Skills ({allSkills.length})
          </button>
          <button
            className={`filter-btn ${filter === "high" ? "active" : ""}`}
            onClick={() => setFilter("high")}
          >
            🔴 High Priority ({allSkills.filter((s) => s.priority === "HIGH").length})
          </button>
          <button
            className={`filter-btn ${filter === "medium" ? "active" : ""}`}
            onClick={() => setFilter("medium")}
          >
            🟡 Medium Priority ({allSkills.filter((s) => s.priority === "MEDIUM").length})
          </button>
          <button
            className={`filter-btn ${filter === "matched" ? "active" : ""}`}
            onClick={() => setFilter("matched")}
          >
            🟢 Matched ({gapAnalysis.matched_skills?.length || 0})
          </button>
        </div>
      </div>

      {/* SKILL CONFIDENCE METERS ROW (Phase 32 Differentiator) */}
      <div className="confidence-meter-card">
        <h4 className="card-subhead">Skill Confidence & Resume Evidence Distribution</h4>
        <div className="confidence-bars-grid">
          {allSkills.slice(0, 6).map((item, idx) => (
            <div className="confidence-item" key={idx}>
              <div className="conf-label-row">
                <span className="conf-name">{item.skill}</span>
                <span className="conf-score">{item.confidence}% Evidence</span>
              </div>
              <div className="conf-track">
                <div
                  className="conf-fill"
                  style={{
                    width: `${item.confidence}%`,
                    background:
                      item.confidence >= 80
                        ? "linear-gradient(90deg, #10b981, #059669)"
                        : item.confidence >= 50
                        ? "linear-gradient(90deg, #f59e0b, #d97706)"
                        : "linear-gradient(90deg, #f43f5e, #e11d48)",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GAP CARDS GRID */}
      <div className="gap-cards-grid">
        {filteredSkills.map((gap, idx) => (
          <div className={`gap-card ${getPriorityBadgeClass(gap.priority)}`} key={idx}>
            <div className="gap-card-top">
              <div className="gap-title-group">
                <span className={`status-icon-pill ${getStatusClass(gap.status)}`}>
                  {getStatusIcon(gap.status)} {gap.status}
                </span>
                <h4 className="gap-skill-name">{gap.skill}</h4>
              </div>
              <span className={`priority-tag ${gap.priority.toLowerCase()}`}>
                {gap.priority === "HIGH" && "🔴 HIGH PRIORITY"}
                {gap.priority === "MEDIUM" && "🟡 MEDIUM PRIORITY"}
                {gap.priority === "LOW" && "🟢 LOW PRIORITY"}
                {gap.priority === "NONE" && "✓ VERIFIED"}
              </span>
            </div>

            <div className="gap-metric-pills">
              <span className="spec-pill">
                <strong>Importance:</strong> {gap.importance}
              </span>
              <span className="spec-pill">
                <strong>Gap Weight:</strong> {gap.priority_score} pts
              </span>
              <span className="spec-pill">
                <strong>Confidence:</strong> {gap.confidence}%
              </span>
            </div>

            <div className="gap-why-box">
              <div className="why-label">WHY IT MATTERS:</div>
              <p className="why-text">{gap.reason}</p>
            </div>

            {gap.status !== "MATCHED" && (
              <div className="gap-action-row">
                <button
                  className="btn-test-gap"
                  onClick={() => onSelectSkillToTest(gap.skill)}
                >
                  ⚡ Test {gap.skill} Gap in Code Engine →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
