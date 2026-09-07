import { useState, useEffect, useRef } from "react";
import "./App.css";
import CodeEditor from "./components/CodeEditor";
import SkillGapExplorer from "./components/SkillGapExplorer";
import AssessmentDashboard from "./components/AssessmentDashboard";
import RoadmapSprint from "./components/RoadmapSprint";

// Centralized API Base URL Configuration with safe production fallback
const getApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  // If an external production URL is configured, use it
  if (envUrl && !envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/+$/, "");
  }
  // In production browser environments (e.g. Vercel), always use same-origin to prevent mixed content/localhost failures
  if (
    typeof window !== "undefined" &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return window.location.origin;
  }
  // Local development fallback
  return envUrl || "http://127.0.0.1:8000";
};

const API_BASE_URL = getApiBaseUrl();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// =====================================================================
// CIRCULAR PROGRESS GAUGE COMPONENT
// =====================================================================
function CircularProgress({ score = 0, size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (val) => {
    if (val >= 80) return "#10b981"; // Emerald
    if (val >= 60) return "#6366f1"; // Indigo
    if (val >= 40) return "#f59e0b"; // Amber
    return "#f43f5e"; // Rose
  };

  const strokeColor = getColor(score);

  return (
    <div className="circular-progress-wrapper" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="circular-progress-svg">
        <circle
          className="circular-progress-bg"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="circular-progress-bar"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: "stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease" }}
        />
      </svg>
      <div className="circular-progress-content">
        <span className="circular-score-val" style={{ color: strokeColor }}>
          {score}
        </span>
        <span className="circular-score-denom">/100</span>
      </div>
    </div>
  );
}

// =====================================================================
// MAIN SKILLBRIDGE APPLICATION
// =====================================================================
export default function App() {
  // Navigation & View State
  const [navTab, setNavTab] = useState("dashboard"); // 'dashboard' | 'analyze' | 'gaps' | 'assessment' | 'roadmap' | 'about'
  const [backendStatus, setBackendStatus] = useState("connecting"); // 'online' | 'offline' | 'connecting'

  // Input & Upload State
  const [resumeText, setResumeText] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobRole, setJobRole] = useState("Software Developer Intern");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Analysis & Engine Results
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatusText, setAnalysisStatusText] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [gapAnalysis, setGapAnalysis] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [assessmentEvaluation, setAssessmentEvaluation] = useState(null);

  const fileInputRef = useRef(null);

  // ===================================================================
  // HEALTH CHECK (with robust JSON and fallback verification)
  // ===================================================================
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        let res = await fetch(`${API_BASE_URL}/health`, { method: "GET" }).catch(() => null);
        if (!res || !res.ok || res.headers.get("content-type")?.includes("text/html")) {
          res = await fetch(`${API_BASE_URL}/api/health`, { method: "GET" }).catch(() => null);
        }
        if (res && res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const data = await res.json().catch(() => null);
            if (data && (data.status === "online" || data.service)) {
              if (isMounted) setBackendStatus("online");
              return;
            }
          }
        }
        if (isMounted) setBackendStatus("offline");
      } catch {
        if (isMounted) setBackendStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ===================================================================
  // 1-CLICK HACKATHON DEMO LOADER (Phase 20 / Phase 36)
  // ===================================================================
  const handleLoadDemo = async () => {
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisStatusText("Loading official CC-GFG-12 candidate & job profile...");

    try {
      // Fetch demo data from API or fall back to local constants
      let demo = null;
      try {
        const res = await fetch(`${API_BASE_URL}/api/demo-data`);
        if (res.ok) demo = await res.json();
      } catch (e) {
        console.warn("Using offline demo data:", e);
      }

      if (!demo) {
        demo = {
          candidate_name: "Rohan Sharma",
          resume_text: `ROHAN SHARMA
Email: rohan.sharma.dev@example.com | Phone: +91 98765 43210
GitHub: github.com/rohansharma-dev

PROFESSIONAL SUMMARY
Motivated CS undergraduate with hands-on proficiency in Python, SQL, and web foundations. Built academic data management tools.

TECHNICAL SKILLS
Languages: Python, SQL, JavaScript (Basics), HTML5, CSS3
Databases: MySQL, SQLite
Concepts: OOP, DBMS, Basic Data Structures

KEY PROJECTS
Student Records Portal | Python | SQLite | HTML5 | CSS3
• Implemented relational schema managing 1,200+ student grade entries with CRUD operations.

Inventory Stock Tracker | Python | MySQL
• Created CLI database management system tracking stock levels. Applied SQL queries to summarize restocking.

EDUCATION
B.Tech in Computer Science and Engineering (2022 - 2026)`,
          job_description: `Position: Software Developer Intern (Backend & Full-Stack)
Company: Nexus Cloud Technologies

REQUIRED SKILLS & QUALIFICATIONS:
• Strong programming fundamentals in Python and modern JavaScript.
• Hands-on experience designing and integrating REST APIs (HTTP methods, status codes, query pagination).
• Working knowledge of React for frontend component integration.
• Proficiency with relational databases and writing clean SQL queries.
• Understanding of Core CS, DSA (Data Structures & Algorithms), and computational complexity.
• Experience using Git and GitHub for collaborative version control.

PREFERRED QUALIFICATIONS:
• Familiarity with Docker containerization or CI/CD pipelines.
• Exposure to FastAPI or Express backend frameworks.`,
          job_role: "Software Developer Intern",
        };
      }

      setResumeText(demo.resume_text);
      setResumeFileName("Rohan_Sharma_Resume.pdf");
      setJobDescription(demo.job_description);
      setJobRole(demo.job_role);

      // Execute full gap analysis immediately
      setAnalysisStatusText("Mapping skills against job requirements...");
      const gapRes = await fetch(`${API_BASE_URL}/api/analyze-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: demo.resume_text,
          job_description: demo.job_description,
          job_role: demo.job_role,
        }),
      });

      if (!gapRes.ok) {
        const errData = await gapRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Gap analysis failed");
      }

      const result = await gapRes.json();
      setGapAnalysis(result.gap_analysis);
      setActiveChallenge(result.personalized_challenge);
      setRoadmap(result.roadmap);
      setAssessmentEvaluation(null); // Fresh assessment state
      setNavTab("dashboard");
    } catch (err) {
      console.error("Demo load error:", err);
      setAnalysisError(err.message || "Failed to load demo scenario.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatusText("");
    }
  };

  // ===================================================================
  // MANUAL GAP ANALYSIS
  // ===================================================================
  const handleRunGapAnalysis = async () => {
    if (!resumeText.trim()) {
      setAnalysisError("Please upload or paste a resume first.");
      setNavTab("analyze");
      return;
    }
    if (!jobDescription.trim()) {
      setAnalysisError("Please paste a target job description.");
      setNavTab("analyze");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisStatusText("Parsing resume & job competencies...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
          job_role: jobRole,
          resume_structured: resumeData || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Employability gap analysis failed.");
      }

      const data = await response.json();
      setGapAnalysis(data.gap_analysis);
      setActiveChallenge(data.personalized_challenge);
      setRoadmap(data.roadmap);
      setAssessmentEvaluation(null);
      setNavTab("dashboard");
    } catch (err) {
      console.error("Gap analysis error:", err);
      setAnalysisError(err.message || "An unexpected error occurred during gap analysis.");
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatusText("");
    }
  };

  // ===================================================================
  // PDF RESUME UPLOAD HANDLER
  // ===================================================================
  const handleResumeFileUpload = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Resume file size must be less than 10 MB.");
      return;
    }

    setUploadError("");
    setIsUploading(true);
    setResumeFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to process PDF resume.");
      }

      setResumeText(data.extracted_text || "");
      setResumeData(data);
    } catch (err) {
      console.error("PDF upload error:", err);
      setUploadError(err.message || "Error reading PDF file. Try pasting the resume text directly.");
    } finally {
      setIsUploading(false);
    }
  };

  // ===================================================================
  // SKILL SELECTION FOR CODING ASSESSMENT
  // ===================================================================
  const handleSelectSkillToTest = async (skillName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/generate-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill: skillName }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveChallenge(data.challenge);
      }
    } catch (e) {
      console.warn("Could not fetch challenge from API, keeping current challenge:", e);
    }
    setNavTab("assessment");
  };

  // ===================================================================
  // CLOSE THE LOOP EVALUATION HANDLER (Phase 18)
  // ===================================================================
  const handleAssessmentComplete = async ({ challenge, testRun }) => {
    try {
      const initialScore = gapAnalysis?.readiness_score || 40;
      const res = await fetch(`${API_BASE_URL}/api/evaluate-assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initial_readiness: initialScore,
          challenge_data: challenge,
          test_results: testRun,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssessmentEvaluation(data);
      }
    } catch (err) {
      console.error("Assessment evaluation error:", err);
    }
  };

  const readinessScore = assessmentEvaluation
    ? assessmentEvaluation.progress?.updated_readiness
    : gapAnalysis?.readiness_score || 0;

  const criticalGaps = gapAnalysis?.critical_gaps || [];
  const topCriticalGap = criticalGaps[0] || "REST API";

  return (
    <div className="app-shell">
      {/* =========================================================
          TOP NAVIGATION BAR
      ========================================================= */}
      <header className="glass-header">
        <div className="header-container">
          <div className="header-brand" onClick={() => setNavTab("dashboard")}>
            <div className="brand-badge-icon">⚡</div>
            <div className="brand-text">
              <span className="brand-title">SkillBridge</span>
              <span className="brand-sub">CC × GFG Hackathon</span>
            </div>
          </div>

          <nav className="header-nav">
            <button
              className={`nav-btn ${navTab === "dashboard" ? "active" : ""}`}
              onClick={() => setNavTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-btn ${navTab === "analyze" ? "active" : ""}`}
              onClick={() => setNavTab("analyze")}
            >
              Analyze
            </button>
            <button
              className={`nav-btn ${navTab === "gaps" ? "active" : ""}`}
              onClick={() => setNavTab("gaps")}
              disabled={!gapAnalysis}
            >
              Skill Gaps {gapAnalysis && `(${gapAnalysis.prioritized_gaps?.length || 0})`}
            </button>
            <button
              className={`nav-btn ${navTab === "assessment" ? "active" : ""}`}
              onClick={() => setNavTab("assessment")}
              disabled={!activeChallenge}
            >
              Assessment {activeChallenge && `(Live Code)`}
            </button>
            <button
              className={`nav-btn ${navTab === "roadmap" ? "active" : ""}`}
              onClick={() => setNavTab("roadmap")}
              disabled={!roadmap}
            >
              Roadmap
            </button>
          </nav>

          <div className="header-actions">
            <button className="btn-demo-trigger" onClick={handleLoadDemo} title="1-Click Judge Experience">
              ⚡ 1-Click Demo
            </button>
            <div className={`status-indicator ${backendStatus}`}>
              <span className="status-dot"></span>
              <span className="status-label">
                {backendStatus === "online" ? "FastAPI Online" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          PROCESSING / LOADING OVERLAY (Phase 24)
      ========================================================= */}
      {isAnalyzing && (
        <div className="analysis-overlay">
          <div className="overlay-card">
            <div className="pulse-loader"></div>
            <h3>Analyzing Employability Gap</h3>
            <p className="overlay-status-text">{analysisStatusText || "Comparing skills..."}</p>
            <div className="overlay-steps">
              <span>✓ Resume Extraction</span>
              <span>✓ JD Competency Analysis</span>
              <span>⚡ Generating Coding Challenge</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MAIN APPLICATION CONTENT
      ========================================================= */}
      <main className="main-content-area">
        {/* =========================================================
            TAB 1: DASHBOARD
        ========================================================= */}
        {navTab === "dashboard" && (
          <div className="view-container">
            {/* HERO INTRODUCTION */}
            <div className="hero-compact">
              <div className="hero-text-col">
                <div className="hero-pill-tag">
                  <span className="hero-pill-pulse"></span>
                  <span>AI-POWERED CAREER INTELLIGENCE • [CC-GFG-12]</span>
                </div>

                <h1 className="hero-heading">
                  Turn Your Skill Gaps Into <span className="gradient-text">Proof of Competency.</span>
                </h1>
                <p className="hero-lead">
                  SkillBridge analyzes your resume against real job requirements, identifies your highest-impact skill gaps, and gives you a personalized coding assessment to prove what you can do.
                </p>

                <div className="hero-actions-row">
                  <button className="btn-primary" onClick={() => setNavTab("analyze")}>
                    Analyze My Readiness →
                  </button>
                  <button className="btn-secondary" onClick={handleLoadDemo}>
                    ⚡ Try 1-Click Demo
                  </button>
                </div>
              </div>

              {/* LIVE READINESS PREVIEW GAUGE */}
              <div className="hero-gauge-col">
                <div className="glass-gauge-card">
                  <div className="gauge-card-header">
                    <span className="card-label">JOB READINESS ESTIMATE</span>
                    <span className={`status-pill-small ${readinessScore >= 70 ? "green" : readinessScore >= 40 ? "amber" : "rose"}`}>
                      {readinessScore >= 70 ? "Interview Ready" : readinessScore >= 40 ? "Gaps Identified" : "Awaiting Scan"}
                    </span>
                  </div>

                  <div className="gauge-center">
                    <CircularProgress score={readinessScore} size={170} strokeWidth={14} />
                  </div>

                  <div className="gauge-footer-metrics">
                    <div className="gf-metric">
                      <span className="gfm-val">{gapAnalysis ? gapAnalysis.matched_skills?.length : "--"}</span>
                      <span className="gfm-lbl">Matched</span>
                    </div>
                    <div className="gf-divider"></div>
                    <div className="gf-metric">
                      <span className="gfm-val">{gapAnalysis ? gapAnalysis.prioritized_gaps?.length : "--"}</span>
                      <span className="gfm-lbl">Gaps</span>
                    </div>
                    <div className="gf-divider"></div>
                    <div className="gf-metric">
                      <span className="gfm-val">{gapAnalysis ? `${gapAnalysis.match_percentage}%` : "--"}</span>
                      <span className="gfm-lbl">Alignment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REFINED WORKFLOW PIPELINE VISUALIZATION */}
            <div className="workflow-stepper-container">
              <div className="workflow-stepper-label">SYSTEM WORKFLOW PIPELINE</div>
              <div className="workflow-stepper">
                <div className="step-node active">
                  <span className="step-num">01</span>
                  <div className="step-text-wrap">
                    <span className="step-txt">Resume Profile</span>
                    <span className="step-sub">PDF / Text</span>
                  </div>
                </div>
                <div className="step-connector active"></div>
                <div className={`step-node ${gapAnalysis ? "active" : ""}`}>
                  <span className="step-num">02</span>
                  <div className="step-text-wrap">
                    <span className="step-txt">Skill Intelligence</span>
                    <span className="step-sub">5-Factor Model</span>
                  </div>
                </div>
                <div className="step-connector active"></div>
                <div className={`step-node ${gapAnalysis ? "active" : ""}`}>
                  <span className="step-num">03</span>
                  <div className="step-text-wrap">
                    <span className="step-txt">Critical Gap</span>
                    <span className="step-sub">Ranked Priority</span>
                  </div>
                </div>
                <div className="step-connector active"></div>
                <div className={`step-node ${activeChallenge ? "active" : ""}`}>
                  <span className="step-num">04</span>
                  <div className="step-text-wrap">
                    <span className="step-txt">Prove Competency</span>
                    <span className="step-sub">Pyodide Sandbox</span>
                  </div>
                </div>
                <div className="step-connector active"></div>
                <div className={`step-node ${assessmentEvaluation ? "active" : ""}`}>
                  <span className="step-num">05</span>
                  <div className="step-text-wrap">
                    <span className="step-txt">Job-Ready</span>
                    <span className="step-sub">Closed-Loop & Roadmap</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CLOSED-LOOP ACHIEVEMENT BANNER (IF ASSESSMENT COMPLETED) */}
            {assessmentEvaluation && (
              <div className="closed-loop-dashboard-banner">
                <div className="cldb-left">
                  <span className="cldb-badge">✓ DEMONSTRATED COMPETENCY</span>
                  <h3>
                    Verified Ability: <span className="highlight-emerald">{assessmentEvaluation.progress?.skill_tested}</span>
                  </h3>
                  <p>
                    Practical competency proved through in-browser code execution. Job readiness score recalculated.
                  </p>
                </div>
                <div className="cldb-center">
                  <div className="cldb-score-box">
                    <div className="cldb-score-item">
                      <span className="cldb-score-lbl">BEFORE</span>
                      <span className="cldb-score-val">{assessmentEvaluation.progress?.previous_readiness}%</span>
                    </div>
                    <div className="cldb-score-arrow">➔</div>
                    <div className="cldb-score-item">
                      <span className="cldb-score-lbl">AFTER</span>
                      <span className="cldb-score-val highlight-emerald">{assessmentEvaluation.progress?.updated_readiness}%</span>
                    </div>
                  </div>
                  <div className="cldb-gain-pill">
                    ▲ +{assessmentEvaluation.progress?.score_delta}% Verified Readiness
                  </div>
                </div>
                <div className="cldb-right">
                  <button className="btn-primary" onClick={() => setNavTab("roadmap")}>
                    Continue to 7-Day Roadmap →
                  </button>
                </div>
              </div>
            )}

            {/* DASHBOARD AUDIT CARDS IF ANALYSIS COMPLETED */}
            {gapAnalysis ? (
              <div className="audit-dashboard-grid">
                {/* 5-FACTOR EXPLAINABLE READINESS BREAKDOWN */}
                <div className="audit-card factor-breakdown-card">
                  <div className="card-head">
                    <div>
                      <span className="card-pretitle">5-FACTOR EVALUATION</span>
                      <h4>Explainable Readiness Model</h4>
                    </div>
                    <span className="weight-total">100% Weight</span>
                  </div>

                  <div className="factors-list">
                    {Object.entries(gapAnalysis.score_breakdown || {}).map(([key, item]) => (
                      <div className="factor-row" key={key}>
                        <div className="factor-info-row">
                          <span className="factor-title">
                            {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <span className="factor-pts">
                            {item.score} / {item.max} pts ({item.weight})
                          </span>
                        </div>
                        <div className="factor-track">
                          <div
                            className="factor-fill"
                            style={{
                              width: `${(item.score / item.max) * 100}%`,
                              background: item.score >= item.max * 0.7 ? "#10b981" : "#6366f1",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CRITICAL GAP HIGHLIGHT & ASSESSMENT LAUNCH */}
                <div className="audit-card assessment-cta-card">
                  <span className="section-badge badge-rose">YOUR HIGHEST-IMPACT GAP</span>
                  <h3 className="cta-skill-title">{topCriticalGap}</h3>
                  <div className="gap-impact-strip">
                    <span className="impact-pill-high">HIGH IMPACT</span>
                    <span className="impact-meta-txt">Required Core Competency</span>
                  </div>
                  <p className="cta-skill-desc">
                    {gapAnalysis.prioritized_gaps?.[0]?.reason ||
                      "Listed as an essential requirement in target JD. Proving proficiency here immediately upgrades your interview readiness."}
                  </p>

                  <div className="cta-action-box">
                    <button
                      className="btn-primary btn-large btn-full"
                      onClick={() => setNavTab("assessment")}
                    >
                      ⚡ Test Your Biggest Skill Gap ({topCriticalGap}) →
                    </button>
                    <button
                      className="btn-secondary btn-full"
                      onClick={() => setNavTab("gaps")}
                    >
                      Explore All Prioritized Gaps ({gapAnalysis.prioritized_gaps?.length})
                    </button>
                  </div>
                </div>

                {/* STRONG AREAS VS MISSING */}
                <div className="audit-card col-span-2">
                  <div className="split-grid-2">
                    <div>
                      <h4 className="subhead-green">✓ Matched Skills ({gapAnalysis.matched_skills?.length})</h4>
                      <p className="section-micro-desc">Verified competencies present in your candidate profile</p>
                      <div className="tag-cloud">
                        {gapAnalysis.matched_skills?.map((s, i) => (
                          <span className="tag-pill tag-green" key={i}>
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="subhead-rose">✕ Missing & Target Gaps ({gapAnalysis.missing_skills?.length})</h4>
                      <p className="section-micro-desc">Competencies requested in target role requiring practice</p>
                      <div className="tag-cloud">
                        {gapAnalysis.missing_skills?.map((s, i) => (
                          <span className="tag-pill tag-rose" key={i}>
                            ✕ {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* EMPTY STATE CALLOUT */
              <div className="dashboard-cta-banner">
                <div className="cta-banner-content">
                  <div className="cta-banner-badge">STARTUP READY WORKSPACE</div>
                  <h3>Ready to analyze your employability gap?</h3>
                  <p>Upload your resume and paste the target job description to get started, or test the verified demo immediately.</p>
                  <div className="banner-buttons">
                    <button className="btn-primary" onClick={() => setNavTab("analyze")}>
                      Analyze My Readiness →
                    </button>
                    <button className="btn-secondary" onClick={handleLoadDemo}>
                      ⚡ Try 1-Click Demo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: ANALYZE (DUAL INPUT EXPERIENCE - Phase 4)
        ========================================================= */}
        {navTab === "analyze" && (
          <div className="view-container">
            <div className="section-header">
              <span className="section-badge">INPUT STUDIO</span>
              <h2 className="section-title">Analyze Resume vs Job Requirements</h2>
              <p className="section-desc">
                Provide your candidate resume (PDF or text) and the target job description to run our deep skill gap analysis.
              </p>
            </div>

            {/* PROGRESS STEP STRIP */}
            <div className="input-progress-steps">
              <div className={`input-step-item ${resumeText ? "filled" : "active"}`}>
                <span className="step-badge">STEP 01</span>
                <span className="step-title">Candidate Profile</span>
              </div>
              <div className="input-step-arrow">➔</div>
              <div className={`input-step-item ${jobDescription ? "filled" : resumeText ? "active" : ""}`}>
                <span className="step-badge">STEP 02</span>
                <span className="step-title">Target Role</span>
              </div>
              <div className="input-step-arrow">➔</div>
              <div className={`input-step-item ${resumeText && jobDescription ? "active" : ""}`}>
                <span className="step-badge">STEP 03</span>
                <span className="step-title">Analyze Readiness</span>
              </div>
            </div>

            <div className="demo-notice-strip">
              <span>Judges can click to test the full pipeline in 1 click:</span>
              <button className="btn-demo-pill" onClick={handleLoadDemo}>
                ⚡ Load CC-GFG-12 Demo Data
              </button>
            </div>

            {analysisError && (
              <div className="alert-error margin-bottom-md">
                <span>⚠️ {analysisError}</span>
              </div>
            )}

            <div className="dual-input-grid">
              {/* RESUME INPUT COLUMN */}
              <div className="input-card">
                <div className="input-card-header">
                  <div className="card-num-badge">STEP 01</div>
                  <div>
                    <h3>Candidate Profile</h3>
                    <p className="card-sub-hint">Upload PDF or paste extracted resume text</p>
                  </div>
                </div>

                {/* DROPZONE */}
                <div
                  className={`mini-dropzone ${isDragging ? "active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleResumeFileUpload(file);
                  }}
                >
                  <div className="dropzone-text">
                    <span className="drop-icon">{isUploading ? "⏳" : "📄"}</span>
                    <span>{isUploading ? "Extracting text from PDF..." : "Drag & drop PDF resume or"}</span>
                    {!isUploading && (
                      <label className="browse-label">
                        browse
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleResumeFileUpload(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                  {resumeFileName && (
                    <div className="file-badge">
                      <span>📎 {resumeFileName}</span>
                    </div>
                  )}
                  {uploadError && <div className="upload-err">⚠️ {uploadError}</div>}
                </div>

                <div className="or-divider">
                  <span>OR PASTE RESUME TEXT</span>
                </div>

                <textarea
                  className="input-textarea"
                  rows={8}
                  placeholder="Paste raw resume text here (Skills, Projects, Education, Work History)..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                ></textarea>
              </div>

              {/* JOB DESCRIPTION INPUT COLUMN */}
              <div className="input-card">
                <div className="input-card-header">
                  <div className="card-num-badge">STEP 02</div>
                  <div>
                    <h3>Target Role</h3>
                    <p className="card-sub-hint">Define role expectations & required skills</p>
                  </div>
                </div>

                <div className="job-role-field">
                  <label className="field-lbl">Target Role Title</label>
                  <input
                    type="text"
                    className="role-input"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Software Developer Intern, Backend Engineer"
                  />
                </div>

                <textarea
                  className="input-textarea jd-textarea"
                  rows={13}
                  placeholder="Paste target job requirements and qualifications here (e.g. Required: Python, REST APIs, React, SQL, Git, DSA)..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="analyze-action-bar">
              <div className="action-step-header">
                <span className="card-num-badge">STEP 03</span>
                <span className="action-step-txt">Ready to compute your 5-factor explainable score and critical gaps</span>
              </div>
              <button
                className="btn-primary btn-large btn-full btn-cta-glow"
                onClick={handleRunGapAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner-small"></span> Processing Employability Gaps...
                  </>
                ) : (
                  "Analyze My Readiness →"
                )}
              </button>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: SKILL GAPS EXPLORER (Phase 9 & 10)
        ========================================================= */}
        {navTab === "gaps" && (
          <div className="view-container">
            <SkillGapExplorer
              gapAnalysis={gapAnalysis}
              onSelectSkillToTest={handleSelectSkillToTest}
            />
          </div>
        )}

        {/* =========================================================
            TAB 4: CODING ASSESSMENT (Phase 11, 14, 15, 17, 18)
        ========================================================= */}
        {navTab === "assessment" && (
          <div className="view-container">
            {assessmentEvaluation ? (
              <AssessmentDashboard
                evaluation={assessmentEvaluation}
                onNavigateToRoadmap={() => setNavTab("roadmap")}
                onRetakeAssessment={() => setAssessmentEvaluation(null)}
              />
            ) : (
              <CodeEditor
                challenge={activeChallenge}
                initialReadiness={gapAnalysis?.readiness_score || 40}
                onAssessmentComplete={handleAssessmentComplete}
              />
            )}
          </div>
        )}

        {/* =========================================================
            TAB 5: ROADMAP & 7-DAY SPRINT (Phase 19)
        ========================================================= */}
        {navTab === "roadmap" && (
          <div className="view-container">
            <RoadmapSprint roadmap={roadmap} targetSkills={criticalGaps} />
          </div>
        )}
      </main>

      {/* =========================================================
          APPLICATION FOOTER
      ========================================================= */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <div className="footer-logo">⚡ SkillBridge</div>
            <p className="footer-sub">AI Employability Gap Analyzer & Custom Coding Assessment Engine.</p>
          </div>
          <div className="footer-right">
            <span>Career Catalyst Club × GeeksforGeeks 4-Hour Software Hackathon</span>
            <span className="footer-team">Problem [CC-GFG-12] • Team SkillBridge</span>
          </div>
        </div>
      </footer>
    </div>
  );
}