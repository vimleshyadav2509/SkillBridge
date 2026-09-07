import React, { useState } from "react";

export default function RoadmapSprint({ roadmap, targetSkills = [] }) {
  const [completedDays, setCompletedDays] = useState({});

  if (!roadmap) {
    return (
      <div className="empty-roadmap-notice">
        <p>Run your employability gap analysis to generate a tailored 7-Day Sprint.</p>
      </div>
    );
  }

  const toggleDay = (day) => {
    setCompletedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const nextSteps = roadmap.next_steps || [];
  const sprintPlan = roadmap.sprint_plan || [];
  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPct = Math.round((completedCount / (sprintPlan.length || 1)) * 100);

  return (
    <div className="roadmap-container">
      {/* SECTION HEADER */}
      <div className="section-header text-left">
        <span className="section-badge badge-indigo">PERSONALIZED ACTION PLAN</span>
        <h2 className="section-title">Your 7-Day Sprint to Job-Ready</h2>
        <p className="section-desc">
          Actionable, day-by-day roadmap tailored to eliminate your specific detected skill gaps before technical interviews.
        </p>
        {targetSkills && targetSkills.length > 0 && (
          <div className="target-skills-strip" style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>Target Focus Gaps:</span>
            {targetSkills.map((sk, idx) => (
              <span key={idx} className="tag-pill tag-rose" style={{ fontSize: "11px", padding: "3px 10px" }}>
                🎯 {sk}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* NEXT 3 STEPS CARDS (Phase 19) */}
      <div className="next-steps-grid">
        {nextSteps.map((step) => (
          <div className="step-card" key={step.step}>
            <div className="step-number-badge">Step {step.step}</div>
            <h4 className="step-title">{step.title}</h4>
            <p className="step-action">{step.action}</p>
            <div className="step-impact-pill">
              <strong>Impact:</strong> {step.impact}
            </div>
          </div>
        ))}
      </div>

      {/* 7-DAY SPRINT CHECKLIST */}
      <div className="sprint-checklist-card">
        <div className="sprint-card-header">
          <div>
            <h3 className="sprint-card-title">📅 7-Day Technical Sprint</h3>
            <p className="sprint-card-subtitle">
              Interactive preparation schedule to bridge missing competencies.
            </p>
          </div>
          <div className="sprint-progress-pill">
            <span className="sprint-prog-text">
              {completedCount} of {sprintPlan.length} Days Completed ({progressPct}%)
            </span>
            <div className="sprint-mini-track">
              <div
                className="sprint-mini-fill"
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="sprint-days-list">
          {sprintPlan.map((item, idx) => {
            const isDone = Boolean(completedDays[item.day]);
            return (
              <div
                className={`sprint-day-row ${isDone ? "completed" : ""}`}
                key={idx}
                onClick={() => toggleDay(item.day)}
              >
                <div className="day-checkbox">
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                  />
                </div>
                <div className="day-name-col">
                  <span className="day-tag">{item.day}</span>
                </div>
                <div className="day-info-col">
                  <div className="day-topic">{item.topic}</div>
                  <div className="day-task">{item.task}</div>
                </div>
                <div className="day-status-pill">
                  {isDone ? "✓ Done" : "Incomplete"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CAREER CATALYST × GFG HACKATHON SEAL */}
      <div className="hackathon-proof-banner">
        <div className="proof-icon">🚀</div>
        <div className="proof-content">
          <strong>SkillBridge Employability Engine [CC-GFG-12]</strong>
          <p>Built for Career Catalyst Club × GeeksforGeeks 4-Hour Software Hackathon.</p>
        </div>
      </div>
    </div>
  );
}
