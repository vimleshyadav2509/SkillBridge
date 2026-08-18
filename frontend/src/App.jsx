import { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Sample resume data for instant testing
const SAMPLE_RESUME = {
  filename: "Sample_Software_Engineer_Resume.pdf",
  name: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "+1 (555) 234-5678",
  skills: [
    "Python", "FastAPI", "React", "TypeScript", "Node.js", 
    "Docker", "AWS", "PostgreSQL", "Git", "REST API", 
    "Tailwind CSS", "MongoDB", "CI/CD", "DSA"
  ],
  education: [
    "B.Tech in Computer Science - Tech University (2020 - 2024)",
    "Senior Secondary High School - Science Stream (2020)"
  ],
  projects: [
    {
      title: "AI-Powered Resume Analyzer",
      technologies: ["Python", "FastAPI", "React", "Tailwind CSS", "PyPDF2"]
    },
    {
      title: "Real-time E-Commerce Analytics Dashboard",
      technologies: ["TypeScript", "Node.js", "MongoDB", "Docker", "Redis"]
    }
  ],
  certifications: [
    "AWS Certified Developer - Associate",
    "Meta Front-End Developer Professional Certificate"
  ],
  experience: [
    "Software Developer Intern at TechCorp Inc. (Jun 2023 - Dec 2023) - Built scalable REST APIs using FastAPI and React",
    "Open Source Contributor - Contributed to Python web framework documentation and bug fixes"
  ],
  extracted_text: `ALEX RIVERA
Email: alex.rivera@example.com | Phone: +1 (555) 234-5678
LinkedIn: linkedin.com/in/alexrivera | GitHub: github.com/alexrivera

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 2+ years of hands-on experience building full-stack web applications, scalable REST APIs, and microservices using Python, FastAPI, React, and AWS.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL, C++
Frameworks: FastAPI, React, Next.js, Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Tools & DevOps: Docker, AWS, Git, GitHub Actions, CI/CD, Postman, VS Code

WORK EXPERIENCE
Software Developer Intern - TechCorp Inc. (June 2023 - December 2023)
• Architected 15+ backend API endpoints using FastAPI and Pydantic, improving response times by 35%.
• Integrated React components with Redux state management for high-traffic dashboard.

KEY PROJECTS
AI-Powered Resume Analyzer | Python | FastAPI | React | Tailwind CSS | PyPDF2
• Built full-stack ATS engine extracting skills, education, and job match percentages.

Real-time E-Commerce Analytics Dashboard | TypeScript | Node.js | MongoDB | Docker | Redis
• Microservices system handling 50k daily active users.

EDUCATION
B.Tech in Computer Science and Engineering - Tech University (2020 - 2024)

CERTIFICATIONS & TRAINING
• AWS Certified Developer - Associate
• Meta Front-End Developer Professional Certificate`,
  ats_score: 88,
  score_breakdown: {
    contact_information: 15,
    professional_summary: 10,
    technical_skills: 20,
    education: 15,
    projects: 15,
    certifications: 5,
    experience: 8,
    resume_content: 10
  },
  suggestions: [
    "Excellent ATS compatibility. Your resume has a strong structure and keyword coverage.",
    "Add more quantifiable metrics (e.g., %, $ saved, latency reduced) to project descriptions.",
    "Consider highlighting team leadership or mentorship experience."
  ]
};

function CircularProgress({ score = 0, size = 160, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (val) => {
    if (val >= 85) return "#10b981"; // Emerald
    if (val >= 70) return "#6366f1"; // Indigo
    if (val >= 50) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
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
          style={{ transition: "stroke-dashoffset 1s ease-in-out, stroke 0.5s ease" }}
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

export default function App() {
  // =========================================================
  // STATE MANAGEMENT
  // =========================================================

  const [backendStatus, setBackendStatus] = useState("connecting"); // 'online' | 'offline' | 'connecting'
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'profile' | 'skills' | 'suggestions' | 'raw'

  const [jobDescription, setJobDescription] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [copiedSkills, setCopiedSkills] = useState(false);

  const fileInputRef = useRef(null);

  // =========================================================
  // BACKEND HEALTH CHECK & RESTORE STATE
  // =========================================================

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" }).catch(() => null);
        if (res && res.ok) {
          setBackendStatus("online");
        } else {
          // Fallback check to root
          const rootRes = await fetch(`${API_BASE_URL}/`, { method: "GET" }).catch(() => null);
          setBackendStatus(rootRes && rootRes.ok ? "online" : "offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s

    // Restore saved resume from localStorage on mount
    try {
      const saved = localStorage.getItem("resumeiq_resume_result");
      if (saved) {
        setResumeResult(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not restore saved session:", e);
    }

    return () => clearInterval(interval);
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getScoreStatus = (score) => {
    if (score >= 85) return "Excellent Compatibility";
    if (score >= 70) return "Good Compatibility";
    if (score >= 50) return "Needs Optimization";
    return "Low Compatibility";
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 85) return "badge-emerald";
    if (score >= 70) return "badge-indigo";
    if (score >= 50) return "badge-amber";
    return "badge-red";
  };

  const parseResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return { detail: text || "Unexpected server response." };
  };

  const validateFile = (file) => {
    if (!file) return "Please choose a PDF resume file.";
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "Only PDF resume files are supported (.pdf).";
    if (file.size > MAX_FILE_SIZE) return "File size must be less than 10 MB.";
    if (file.size === 0) return "Selected PDF file is empty.";
    return "";
  };

  // =========================================================
  // FILE SELECTION & UPLOAD
  // =========================================================

  const handleFileSelection = (file) => {
    setUploadError("");
    const err = validateFile(file);
    if (err) {
      setSelectedFile(null);
      setUploadError(err);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleResumeUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a PDF resume first.");
      return;
    }

    const err = validateFile(selectedFile);
    if (err) {
      setUploadError(err);
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Failed to upload and parse resume.");
      }

      setResumeResult(data);
      if (data?.extracted_text) {
        localStorage.setItem("resumeiq_resume_text", data.extracted_text);
      }
      localStorage.setItem("resumeiq_resume_result", JSON.stringify(data));

      // Auto scroll to results dashboard
      setTimeout(() => {
        document.getElementById("analysis-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (error) {
      console.error("Resume upload error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setUploadError(`Unable to connect to backend server (${API_BASE_URL}). Please verify backend is running.`);
      } else {
        setUploadError(error.message || "An unexpected error occurred during resume analysis.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleLoadSample = () => {
    setSelectedFile({ name: SAMPLE_RESUME.filename });
    setResumeResult(SAMPLE_RESUME);
    setUploadError("");
    localStorage.setItem("resumeiq_resume_text", SAMPLE_RESUME.extracted_text);
    localStorage.setItem("resumeiq_resume_result", JSON.stringify(SAMPLE_RESUME));
    setTimeout(() => {
      document.getElementById("analysis-dashboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handleResetResume = () => {
    setSelectedFile(null);
    setResumeResult(null);
    setUploadError("");
    setJobResult(null);
    localStorage.removeItem("resumeiq_resume_text");
    localStorage.removeItem("resumeiq_resume_result");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // =========================================================
  // JOB MATCH HANDLER
  // =========================================================

  const handleJobMatch = async () => {
    setMatchError("");
    setJobResult(null);
    const cleanJd = jobDescription.trim();

    if (!cleanJd) {
      setMatchError("Please paste a job description to analyze compatibility.");
      return;
    }
    if (cleanJd.length < 25) {
      setMatchError("Job description is too short. Please paste full details.");
      return;
    }

    const resumeText = resumeResult?.extracted_text || localStorage.getItem("resumeiq_resume_text");
    if (!resumeText) {
      setMatchError("Please upload & analyze your resume first before matching a job.");
      return;
    }

    setIsMatching(true);

    try {
      const response = await fetch(`${API_BASE_URL}/match-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: cleanJd,
        }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || "Job matching failed.");
      }

      setJobResult(data);

      setTimeout(() => {
        document.getElementById("job-match-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (error) {
      console.error("Job match error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setMatchError("Unable to connect to backend server. Make sure FastAPI server is running.");
      } else {
        setMatchError(error.message || "Job matching encountered an error.");
      }
    } finally {
      setIsMatching(false);
    }
  };

  const handleCopySkills = () => {
    if (resumeResult?.skills) {
      navigator.clipboard.writeText(resumeResult.skills.join(", "));
      setCopiedSkills(true);
      setTimeout(() => setCopiedSkills(false), 2000);
    }
  };

  // Extract dynamic fields safely
  const atsScore = Number(resumeResult?.ats_score) || 0;
  const skills = Array.isArray(resumeResult?.skills) ? resumeResult.skills : [];
  const projects = Array.isArray(resumeResult?.projects) ? resumeResult.projects : [];
  const education = Array.isArray(resumeResult?.education) ? resumeResult.education : [];
  const certifications = Array.isArray(resumeResult?.certifications) ? resumeResult.certifications : [];
  const suggestions = Array.isArray(resumeResult?.suggestions) ? resumeResult.suggestions : [];
  const experience = Array.isArray(resumeResult?.experience) ? resumeResult.experience : [];
  const scoreBreakdown = resumeResult?.score_breakdown || {};

  const jobMatchData = jobResult?.result || {};
  const matchedKeywords = Array.isArray(jobMatchData?.matched_keywords) ? jobMatchData.matched_keywords : [];
  const missingKeywords = Array.isArray(jobMatchData?.missing_keywords) ? jobMatchData.missing_keywords : [];
  const recommendations = Array.isArray(jobMatchData?.recommendations) ? jobMatchData.recommendations : [];
  const keywordMatch = Number(jobMatchData?.keyword_match_percentage) || 0;
  const jobMatchScore = Number(jobMatchData?.job_match_score) || 0;

  return (
    <div className="app-container">
      {/* =========================================================
          NAVBAR
      ========================================================= */}
      <nav className="glass-navbar">
        <div className="nav-brand">
          <div className="logo-icon">⚡</div>
          <div className="logo-text">
            Resume<span className="logo-highlight">IQ</span>
          </div>
        </div>

        <div className="nav-center">
          <a href="#analyzer" className="nav-link">Resume Analyzer</a>
          <a href="#matcher" className="nav-link">Job Matcher</a>
          <a href="#features" className="nav-link">Features</a>
        </div>

        <div className="nav-right">
          <div className={`status-pill ${backendStatus}`}>
            <span className="status-dot"></span>
            <span className="status-label">
              {backendStatus === "online" && "Backend Connected"}
              {backendStatus === "connecting" && "Connecting Backend..."}
              {backendStatus === "offline" && "Backend Offline"}
            </span>
          </div>
        </div>
      </nav>

      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="hero-section">
        <div className="hero-background-glow"></div>
        <div className="hero-grid">
          <div className="hero-left">
            <div className="hero-tag">
              <span className="sparkle-icon">✨</span> AI-POWERED ATS RESUME ENGINE
            </div>
            <h1 className="hero-title">
              Craft a Resume That <br />
              <span className="gradient-text">Beats the ATS.</span>
            </h1>
            <p className="hero-subtitle">
              Instant PDF parsing, AI keyword extraction, score breakdown, and tailored job description matching designed to land you top interviews.
            </p>
            <div className="hero-actions">
              <button
                className="btn-primary"
                onClick={() => document.getElementById("analyzer")?.scrollIntoView({ behavior: "smooth" })}
              >
                Analyze Your Resume →
              </button>
              <button className="btn-secondary" onClick={handleLoadSample}>
                ⚡ Try Sample Resume
              </button>
            </div>
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="hero-stat-num">99.4%</span>
                <span className="hero-stat-label">Parsing Accuracy</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-num">35+</span>
                <span className="hero-stat-label">Tech Skills Indexed</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat-item">
                <span className="hero-stat-num">&lt; 1s</span>
                <span className="hero-stat-label">Instant Feedback</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="glass-hero-card">
              <div className="card-header-bar">
                <span className="card-title-sm">LIVE ATS PREVIEW</span>
                <span className={`badge-pill ${resumeResult ? getScoreBadgeClass(atsScore) : "badge-gray"}`}>
                  {resumeResult ? getScoreStatus(atsScore) : "Awaiting PDF"}
                </span>
              </div>

              <div className="gauge-container">
                <CircularProgress score={resumeResult ? atsScore : 0} size={170} strokeWidth={14} />
              </div>

              <div className="hero-card-metrics">
                <div className="metric-box">
                  <span className="metric-val">{resumeResult ? skills.length : "--"}</span>
                  <span className="metric-lbl">Skills Found</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{resumeResult ? projects.length : "--"}</span>
                  <span className="metric-lbl">Projects</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{resumeResult ? education.length : "--"}</span>
                  <span className="metric-lbl">Degrees</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          ANALYZER SECTION
      ========================================================= */}
      <section className="section-container" id="analyzer">
        <div className="section-header">
          <span className="section-badge">ATS ANALYZER</span>
          <h2 className="section-title">Upload & Scan Your Resume</h2>
          <p className="section-desc">Select your PDF resume to extract contact details, technical skills, projects, and receive an instant ATS compatibility score.</p>
        </div>

        <div className={`dropzone-card ${isDragging ? "drag-active" : ""}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="dropzone-icon">📄</div>
          <h3 className="dropzone-title">Upload PDF Resume</h3>
          <p className="dropzone-sub">Drag and drop your file here, or click to browse</p>

          <label className="file-input-label">
            Choose PDF File
            <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileChange} />
          </label>

          <p className="file-format-hint">Supports PDF files up to 10 MB</p>

          {selectedFile && (
            <div className="file-selected-badge">
              <span className="file-icon">📎</span>
              <span className="file-name">{selectedFile.name}</span>
            </div>
          )}

          {uploadError && (
            <div className="alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{uploadError}</span>
            </div>
          )}

          <div className="dropzone-button-group">
            <button className="btn-primary" onClick={handleResumeUpload} disabled={isUploading || !selectedFile}>
              {isUploading ? "Scanning Resume..." : "Upload & Analyze Resume →"}
            </button>
            <button className="btn-secondary" onClick={handleLoadSample}>
              ⚡ Use Sample Resume
            </button>
            {selectedFile && !isUploading && (
              <button className="btn-text" onClick={handleResetResume}>
                Clear File
              </button>
            )}
          </div>
        </div>

        {/* =========================================================
            ANALYSIS DASHBOARD (TABBED)
        ========================================================= */}
        {resumeResult && (
          <div className="dashboard-wrapper" id="analysis-dashboard">
            <div className="dashboard-header">
              <div>
                <span className="section-badge">ANALYSIS COMPLETED</span>
                <h3 className="dashboard-title">ATS Resume Audit Report</h3>
              </div>
              <div className="dashboard-actions">
                <button className="btn-secondary-sm" onClick={handleCopySkills}>
                  {copiedSkills ? "✓ Copied!" : "📋 Copy Skills"}
                </button>
                <button className="btn-secondary-sm" onClick={handleResetResume}>
                  🔄 Reset
                </button>
              </div>
            </div>

            {/* TAB NAVIGATOR */}
            <div className="tab-bar">
              <button className={`tab-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                📊 Overview & Score
              </button>
              <button className={`tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
                👤 Candidate Profile
              </button>
              <button className={`tab-btn ${activeTab === "skills" ? "active" : ""}`} onClick={() => setActiveTab("skills")}>
                💡 Skills & Stack ({skills.length})
              </button>
              <button className={`tab-btn ${activeTab === "suggestions" ? "active" : ""}`} onClick={() => setActiveTab("suggestions")}>
                🎯 ATS Fixes ({suggestions.length})
              </button>
              <button className={`tab-btn ${activeTab === "raw" ? "active" : ""}`} onClick={() => setActiveTab("raw")}>
                🔍 Extracted Text
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="tab-pane grid-2col">
                <div className="pane-card flex-center-card">
                  <h4>Overall ATS Score</h4>
                  <CircularProgress score={atsScore} size={180} strokeWidth={14} />
                  <div className={`status-badge-lg ${getScoreBadgeClass(atsScore)}`}>
                    {getScoreStatus(atsScore)}
                  </div>
                  <p className="score-summary-text">
                    Your resume has passed basic formatting checks. Check category metrics to maximize keyword coverage.
                  </p>
                </div>

                <div className="pane-card">
                  <h4>ATS Category Breakdown</h4>
                  <div className="breakdown-list">
                    {Object.entries(scoreBreakdown).map(([category, score]) => (
                      <div className="breakdown-row" key={category}>
                        <div className="breakdown-label-row">
                          <span className="cat-name">
                            {category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                          <span className="cat-score">{score} pts</span>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min((score / 20) * 100, 100)}%`,
                              background: score >= 15 ? "#10b981" : score >= 8 ? "#6366f1" : "#f59e0b",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === "profile" && (
              <div className="tab-pane grid-2col">
                <div className="pane-card">
                  <h4>Contact Details</h4>
                  <div className="info-list">
                    <div className="info-item">
                      <span className="info-label">Candidate Name:</span>
                      <span className="info-val">{resumeResult.name || "Not Detected"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email Address:</span>
                      <span className="info-val">{resumeResult.email || "Not Detected"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone Number:</span>
                      <span className="info-val">{resumeResult.phone || "Not Detected"}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Filename:</span>
                      <span className="info-val">{resumeResult.filename || "Uploaded PDF"}</span>
                    </div>
                  </div>
                </div>

                <div className="pane-card">
                  <h4>Education History</h4>
                  {education.length > 0 ? (
                    <ul className="styled-list">
                      {education.map((edu, idx) => (
                        <li key={idx}>🎓 {edu}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-text">No education records extracted.</p>
                  )}
                </div>

                <div className="pane-card col-span-2">
                  <h4>Key Projects ({projects.length})</h4>
                  {projects.length > 0 ? (
                    <div className="projects-grid">
                      {projects.map((proj, idx) => (
                        <div className="project-card" key={idx}>
                          <h5 className="proj-title">🚀 {proj.title || "Project"}</h5>
                          {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                            <div className="proj-tech-tags">
                              {proj.technologies.map((tech, tIdx) => (
                                <span className="tech-badge" key={tIdx}>
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-text">No project headers found in resume.</p>
                  )}
                </div>

                <div className="pane-card col-span-2">
                  <h4>Certifications & Experience</h4>
                  <div className="grid-2col">
                    <div>
                      <h5 className="sub-heading">Certifications ({certifications.length})</h5>
                      {certifications.length > 0 ? (
                        <ul className="styled-list">
                          {certifications.map((c, i) => (
                            <li key={i}>📜 {c}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">No certifications found.</p>
                      )}
                    </div>
                    <div>
                      <h5 className="sub-heading">Experience Timeline ({experience.length})</h5>
                      {experience.length > 0 ? (
                        <ul className="styled-list">
                          {experience.map((exp, i) => (
                            <li key={i}>💼 {typeof exp === "string" ? exp : exp.details || JSON.stringify(exp)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="empty-text">No work history headers detected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SKILLS */}
            {activeTab === "skills" && (
              <div className="tab-pane pane-card">
                <div className="skills-header">
                  <h4>Extracted Technical Stack</h4>
                  <button className="btn-secondary-sm" onClick={handleCopySkills}>
                    {copiedSkills ? "✓ Copied!" : "📋 Copy All Skills"}
                  </button>
                </div>
                {skills.length > 0 ? (
                  <div className="skills-tag-cloud">
                    {skills.map((skill, idx) => (
                      <span className="skill-pill" key={idx}>
                        <span className="skill-pill-dot"></span>
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No technical skills detected.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT: SUGGESTIONS */}
            {activeTab === "suggestions" && (
              <div className="tab-pane pane-card">
                <h4>ATS Optimization Recommendations</h4>
                {suggestions.length > 0 ? (
                  <div className="suggestions-list">
                    {suggestions.map((sug, idx) => (
                      <div className="suggestion-item" key={idx}>
                        <span className="sug-icon">{idx === 0 ? "🌟" : "💡"}</span>
                        <div className="sug-text">{sug}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No specific suggestions generated.</p>
                )}
              </div>
            )}

            {/* TAB CONTENT: RAW TEXT */}
            {activeTab === "raw" && (
              <div className="tab-pane pane-card">
                <h4>Extracted Resume Text</h4>
                <textarea className="raw-text-box" readOnly value={resumeResult.extracted_text || ""} rows={14}></textarea>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================
          JOB MATCHER SECTION
      ========================================================= */}
      <section className="section-container section-dark" id="matcher">
        <div className="section-header">
          <span className="section-badge badge-indigo">JOB MATCHER STUDIO</span>
          <h2 className="section-title">Match Resume Against Job Description</h2>
          <p className="section-desc">Paste a job posting below to run an instant keyword gap analysis, uncover missing skills, and calculate job match percentage.</p>
        </div>

        <div className="matcher-box-card">
          <label className="input-label">Job Description</label>
          <textarea
            className="matcher-textarea"
            placeholder="Paste target job description here (e.g., Required Skills: Python, React, AWS, Docker, REST APIs...)..."
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          ></textarea>

          <div className="textarea-footer">
            <span className="char-count">{jobDescription.length} characters</span>
            {matchError && <span className="inline-error">⚠️ {matchError}</span>}
          </div>

          <button className="btn-primary btn-full" onClick={handleJobMatch} disabled={isMatching}>
            {isMatching ? "Analyzing Job Match..." : "Run Job Match Analysis →"}
          </button>
        </div>

        {/* JOB MATCH RESULTS */}
        {jobResult && (
          <div className="dashboard-wrapper margin-top-lg" id="job-match-results">
            <div className="dashboard-header">
              <div>
                <span className="section-badge badge-emerald">MATCH COMPLETE</span>
                <h3 className="dashboard-title">Job Compatibility Report</h3>
              </div>
            </div>

            <div className="grid-2col">
              <div className="pane-card flex-center-card">
                <h4>Keyword Match Rate</h4>
                <CircularProgress score={keywordMatch} size={160} strokeWidth={12} />
                <div className={`status-badge-lg ${getScoreBadgeClass(keywordMatch)}`}>
                  {keywordMatch}% Match Rate
                </div>
              </div>

              <div className="pane-card">
                <h4>Overall Match Score</h4>
                <div className="match-score-big">{jobMatchScore}/100</div>
                <p className="score-summary-text">
                  This score reflects the ratio of required job skills already present in your uploaded resume.
                </p>
              </div>

              <div className="pane-card">
                <h4>Matched Keywords ({matchedKeywords.length})</h4>
                {matchedKeywords.length > 0 ? (
                  <div className="skills-tag-cloud">
                    {matchedKeywords.map((kw, i) => (
                      <span className="skill-pill pill-green" key={i}>
                        ✓ {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No direct keyword matches found.</p>
                )}
              </div>

              <div className="pane-card">
                <h4>Missing Keywords ({missingKeywords.length})</h4>
                {missingKeywords.length > 0 ? (
                  <div className="skills-tag-cloud">
                    {missingKeywords.map((kw, i) => (
                      <span className="skill-pill pill-red" key={i}>
                        + {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">🎉 No missing keywords! Excellent alignment.</p>
                )}
              </div>

              <div className="pane-card col-span-2">
                <h4>Tailored Recommendations</h4>
                {recommendations.length > 0 ? (
                  <div className="suggestions-list">
                    {recommendations.map((rec, i) => (
                      <div className="suggestion-item" key={i}>
                        <span className="sug-icon">🎯</span>
                        <div className="sug-text">{rec}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">No recommendations available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          FEATURES GRID
      ========================================================= */}
      <section className="section-container" id="features">
        <div className="section-header">
          <span className="section-badge">WHY RESUME IQ</span>
          <h2 className="section-title">Built for Modern Job Seekers</h2>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h4 className="feature-title">Instant PDF Parser</h4>
            <p className="feature-desc">Extract text, contact details, education, and experience from any standard PDF resume in milliseconds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h4 className="feature-title">Keyword Gap Analysis</h4>
            <p className="feature-desc">Compare your resume directly against real job postings to spot missing tech keywords before recruiters do.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4 className="feature-title">Smart Score Breakdown</h4>
            <p className="feature-desc">Get an 8-point structural ATS audit scoring contact info, projects, skills, education, and overall content density.</p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo-icon">⚡</div>
            <div className="logo-text">
              Resume<span className="logo-highlight">IQ</span>
            </div>
          </div>
          <p className="footer-tagline">AI-Powered Resume Analysis & Job Match Intelligence.</p>
          <p className="footer-copy">© 2026 ResumeIQ. Built with React & FastAPI.</p>
        </div>
      </footer>
    </div>
  );
}