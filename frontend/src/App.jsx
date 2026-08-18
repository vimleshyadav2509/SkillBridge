import { useRef, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function App() {
  // =========================================================
  // RESUME ANALYZER STATE
  // =========================================================

  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeResult, setResumeResult] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // =========================================================
  // JOB MATCHER STATE
  // =========================================================

  const [jobDescription, setJobDescription] = useState("");
  const [jobResult, setJobResult] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState("");

  // =========================================================
  // FILE INPUT REF
  // =========================================================

  const fileInputRef = useRef(null);

  // =========================================================
  // SCORE HELPERS
  // =========================================================

  const getScoreStatus = (score) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Needs Improvement";
    return "Needs Work";
  };

  const getScoreClass = (score) => {
    if (score >= 85) return "excellent";
    if (score >= 70) return "good";
    if (score >= 50) return "average";
    return "poor";
  };

  // =========================================================
  // SAFE JSON RESPONSE HANDLER
  // =========================================================

  const parseResponse = async (response) => {
    const contentType =
      response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return await response.json();
    }

    const text = await response.text();

    return {
      detail:
        text || "Unexpected response from server.",
    };
  };

  // =========================================================
  // VALIDATE PDF
  // =========================================================

  const validateFile = (file) => {
    if (!file) {
      return "Please select a resume PDF.";
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return "Only PDF resume files are supported.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 10 MB.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    return "";
  };

  // =========================================================
  // SELECT FILE
  // =========================================================

  const handleFileSelection = (file) => {
    setUploadError("");
    setResumeResult(null);

    const error = validateFile(file);

    if (error) {
      setSelectedFile(null);
      setUploadError(error);
      return;
    }

    setSelectedFile(file);
  };

  // =========================================================
  // FILE INPUT CHANGE
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFileSelection(file);
    }
  };

  // =========================================================
  // DRAG EVENTS
  // =========================================================

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFileSelection(file);
    }
  };

  // =========================================================
  // UPLOAD + ANALYZE RESUME
  // =========================================================

  const handleResumeUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please choose a PDF resume first.");
      return;
    }

    const validationError = validateFile(selectedFile);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setResumeResult(null);

    try {
      const formData = new FormData();

      /*
       * IMPORTANT:
       * Your FastAPI endpoint should accept:
       *
       * file: UploadFile = File(...)
       *
       * Therefore the field name is "file".
       */
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/upload-resume`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          "Resume upload failed.";

        throw new Error(
          typeof message === "string"
            ? message
            : "Resume upload failed."
        );
      }

      // Save complete API response
      setResumeResult(data);

      // Save extracted text for Job Matcher
      if (data?.extracted_text) {
        localStorage.setItem(
          "resumeiq_resume_text",
          data.extracted_text
        );
      }

      // Save complete result for persistence
      localStorage.setItem(
        "resumeiq_resume_result",
        JSON.stringify(data)
      );

      // Scroll to result
      setTimeout(() => {
        document
          .getElementById("analysis-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error(
        "Resume upload error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        setUploadError(
          "Unable to connect to ResumeIQ backend. Make sure FastAPI is running on http://127.0.0.1:8000."
        );
      } else {
        setUploadError(
          error.message ||
            "Something went wrong while analyzing the resume."
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  // =========================================================
  // RESET RESUME
  // =========================================================

  const handleResetResume = () => {
    setSelectedFile(null);
    setResumeResult(null);
    setUploadError("");

    localStorage.removeItem(
      "resumeiq_resume_text"
    );

    localStorage.removeItem(
      "resumeiq_resume_result"
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================================================
  // JOB MATCHER
  // =========================================================

  const handleJobMatch = async () => {
    setMatchError("");
    setJobResult(null);

    const cleanJobDescription =
      jobDescription.trim();

    if (!cleanJobDescription) {
      setMatchError(
        "Please paste a job description before analyzing."
      );
      return;
    }

    if (cleanJobDescription.length < 30) {
      setMatchError(
        "Please enter a more complete job description."
      );
      return;
    }

    /*
     * First use current uploaded resume.
     * If page was refreshed, use localStorage.
     */
    let resumeText =
      resumeResult?.extracted_text ||
      localStorage.getItem(
        "resumeiq_resume_text"
      );

    if (!resumeText) {
      setMatchError(
        "Please upload and analyze your resume first."
      );
      return;
    }

    setIsMatching(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/match-job`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description:
              cleanJobDescription,
          }),
        }
      );

      const data = await parseResponse(response);

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.message ||
          "Job matching failed.";

        throw new Error(
          typeof message === "string"
            ? message
            : "Job matching failed."
        );
      }

      setJobResult(data);

      setTimeout(() => {
        document
          .getElementById("job-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error(
        "Job matching error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message.includes("fetch")
      ) {
        setMatchError(
          "Unable to connect to ResumeIQ backend. Make sure FastAPI is running."
        );
      } else {
        setMatchError(
          error.message ||
            "Something went wrong while matching the job."
        );
      }
    } finally {
      setIsMatching(false);
    }
  };

  // =========================================================
  // LOAD SAVED RESULT AFTER REFRESH
  // =========================================================

  const loadSavedResult = () => {
    try {
      const saved =
        localStorage.getItem(
          "resumeiq_resume_result"
        );

      if (saved) {
        const parsed = JSON.parse(saved);
        setResumeResult(parsed);
      }
    } catch (error) {
      console.error(
        "Could not restore saved resume result:",
        error
      );
    }
  };

  // Restore previous result once when component loads.
  if (
    resumeResult === null &&
    typeof window !== "undefined"
  ) {
    const saved =
      localStorage.getItem(
        "resumeiq_resume_result"
      );

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed) {
          setTimeout(() => {
            loadSavedResult();
          }, 0);
        }
      } catch {
        localStorage.removeItem(
          "resumeiq_resume_result"
        );
      }
    }
  }

  // =========================================================
  // DYNAMIC VALUES
  // =========================================================

  const atsScore =
    Number(resumeResult?.ats_score) || 0;

  const skills =
    Array.isArray(resumeResult?.skills)
      ? resumeResult.skills
      : [];

  const projects =
    Array.isArray(resumeResult?.projects)
      ? resumeResult.projects
      : [];

  const education =
    Array.isArray(resumeResult?.education)
      ? resumeResult.education
      : [];

  const certifications =
    Array.isArray(
      resumeResult?.certifications
    )
      ? resumeResult.certifications
      : [];

  const suggestions =
    Array.isArray(
      resumeResult?.suggestions
    )
      ? resumeResult.suggestions
      : [];

  const experience =
    Array.isArray(resumeResult?.experience)
      ? resumeResult.experience
      : [];

  const scoreBreakdown =
    resumeResult?.score_breakdown || {};

  const jobMatch =
    jobResult?.result || {};

  const matchedKeywords =
    Array.isArray(
      jobMatch?.matched_keywords
    )
      ? jobMatch.matched_keywords
      : [];

  const missingKeywords =
    Array.isArray(
      jobMatch?.missing_keywords
    )
      ? jobMatch.missing_keywords
      : [];

  const recommendations =
    Array.isArray(
      jobMatch?.recommendations
    )
      ? jobMatch.recommendations
      : [];

  const keywordMatch =
    Number(
      jobMatch?.keyword_match_percentage
    ) || 0;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app">
      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav className="navbar">
        <div className="logo">
          Resume<span>IQ</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>

          <a href="#analyzer">
            Analyzer
          </a>

          <a href="#matcher">
            Job Matcher
          </a>
        </div>
      </nav>

      <main>
        {/* ===================================================
            HERO
        =================================================== */}

        <section
          className="hero"
          id="home"
        >
          <div className="hero-content">
            <p className="badge">
              AI-POWERED RESUME ANALYZER
            </p>

            <h1>
              Build a Resume That
              <span> Gets Noticed.</span>
            </h1>

            <p className="hero-description">
              Analyze your resume with ATS
              intelligence, discover missing
              skills, and match your resume with
              real job descriptions.
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("analyzer")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                Analyze My Resume →
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  document
                    .getElementById("matcher")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    })
                }
              >
                Match a Job
              </button>
            </div>
          </div>

          {/* =================================================
              DYNAMIC ATS CARD
          ================================================= */}

          <div className="hero-card">
            <div className="score-label">
              ATS SCORE
            </div>

            <div
              className={`score ${
                resumeResult
                  ? getScoreClass(atsScore)
                  : ""
              }`}
            >
              {resumeResult
                ? atsScore
                : "--"}
            </div>

            <div className="score-status">
              {resumeResult
                ? getScoreStatus(atsScore)
                : "Upload Resume"}
            </div>

            <div className="score-line">
              <span>
                Resume Quality
              </span>

              <strong>
                {resumeResult
                  ? `${atsScore}%`
                  : "--"}
              </strong>
            </div>

            <div className="progress">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    resumeResult
                      ? atsScore
                      : 0
                  }%`,
                }}
              ></div>
            </div>

            <div className="mini-stats">
              <div>
                <strong>
                  {resumeResult
                    ? skills.length
                    : "--"}
                </strong>

                <span>
                  Skills
                </span>
              </div>

              <div>
                <strong>
                  {resumeResult
                    ? projects.length
                    : "--"}
                </strong>

                <span>
                  Projects
                </span>
              </div>

              <div>
                <strong>
                  {resumeResult
                    ? "100%"
                    : "--"}
                </strong>

                <span>
                  Parsing
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            ANALYZER SECTION
        =================================================== */}

        <section
          className="analyzer-section"
          id="analyzer"
        >
          <div className="section-heading">
            <p className="section-label">
              RESUME ANALYZER
            </p>

            <h2>
              Analyze Your Resume
            </h2>

            <p>
              Upload your PDF resume and get
              a detailed ATS analysis.
            </p>
          </div>

          <div
            className={`upload-card ${
              isDragging
                ? "drag-active"
                : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="upload-icon">
              📄
            </div>

            <h3>
              Upload your resume
            </h3>

            <p>
              PDF files only • Maximum 10 MB
            </p>

            <label className="upload-button">
              Choose Resume

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
              />
            </label>

            <p className="upload-note">
              Or drag and drop your PDF here.
            </p>

            {/* Selected file */}

            {selectedFile && (
              <div className="selected-file">
                <strong>
                  Selected Resume:
                </strong>{" "}
                {selectedFile.name}
              </div>
            )}

            {/* Upload error */}

            {uploadError && (
              <div className="error-message">
                {uploadError}
              </div>
            )}

            {/* Analyze button */}

            <button
              className="primary-button"
              onClick={
                handleResumeUpload
              }
              disabled={
                isUploading ||
                !selectedFile
              }
            >
              {isUploading
                ? "Analyzing Resume..."
                : "Upload & Analyze →"}
            </button>

            {/* Reset */}

            {selectedFile &&
              !isUploading && (
                <button
                  className="secondary-button"
                  onClick={
                    handleResetResume
                  }
                >
                  Choose Another Resume
                </button>
              )}

            <p className="upload-note">
              Your resume is processed by
              the ResumeIQ backend.
            </p>
          </div>

          {/* =================================================
              ANALYSIS RESULT
          ================================================= */}

          {resumeResult && (
            <section
              className="analysis-result"
              id="analysis-result"
            >
              <div className="section-heading">
                <p className="section-label">
                  ANALYSIS COMPLETE
                </p>

                <h2>
                  Your Resume Analysis
                </h2>

                <p>
                  ResumeIQ has analyzed your
                  resume and generated the
                  following ATS insights.
                </p>
              </div>

              {/* =============================================
                  ATS SCORE
              ============================================= */}

              <div className="result-card">
                <div className="score-label">
                  ATS SCORE
                </div>

                <div
                  className={`score ${getScoreClass(
                    atsScore
                  )}`}
                >
                  {atsScore}
                </div>

                <div className="score-status">
                  {getScoreStatus(
                    atsScore
                  )}
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${atsScore}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* =============================================
                  CONTACT INFORMATION
              ============================================= */}

              <div className="result-card">
                <h3>
                  Candidate Information
                </h3>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {resumeResult.name ||
                    "Not detected"}
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {resumeResult.email ||
                    "Not detected"}
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{" "}
                  {resumeResult.phone ||
                    "Not detected"}
                </p>

                <p>
                  <strong>
                    Resume:
                  </strong>{" "}
                  {resumeResult.filename ||
                    selectedFile?.name ||
                    "Uploaded PDF"}
                </p>
              </div>

              {/* =============================================
                  SCORE BREAKDOWN
              ============================================= */}

              <div className="result-card">
                <h3>
                  ATS Score Breakdown
                </h3>

                {Object.entries(
                  scoreBreakdown
                ).map(
                  ([category, score]) => (
                    <div
                      className="score-breakdown-item"
                      key={category}
                    >
                      <div className="score-line">
                        <span>
                          {category
                            .replace(
                              /_/g,
                              " "
                            )
                            .replace(
                              /\b\w/g,
                              (letter) =>
                                letter.toUpperCase()
                            )}
                        </span>

                        <strong>
                          {score}
                        </strong>
                      </div>

                      <div className="progress">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(
                              Number(score) ||
                                0,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* =============================================
                  SKILLS
              ============================================= */}

              <div className="result-card">
                <h3>
                  Technical Skills (
                  {skills.length})
                </h3>

                {skills.length > 0 ? (
                  <div className="skills-list">
                    {skills.map(
                      (skill, index) => (
                        <span
                          className="skill-tag"
                          key={`${skill}-${index}`}
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p>
                    No technical skills
                    detected.
                  </p>
                )}
              </div>

              {/* =============================================
                  PROJECTS
              ============================================= */}

              <div className="result-card">
                <h3>
                  Projects (
                  {projects.length})
                </h3>

                {projects.length > 0 ? (
                  projects.map(
                    (project, index) => (
                      <div
                        className="project-item"
                        key={`${project.title}-${index}`}
                      >
                        <h4>
                          {project.title ||
                            "Untitled Project"}
                        </h4>

                        {Array.isArray(
                          project.technologies
                        ) &&
                          project
                            .technologies
                            .length >
                            0 && (
                            <p>
                              <strong>
                                Technologies:
                              </strong>{" "}
                              {project.technologies.join(
                                " • "
                              )}
                            </p>
                          )}
                      </div>
                    )
                  )
                ) : (
                  <p>
                    No projects detected.
                  </p>
                )}
              </div>

              {/* =============================================
                  EDUCATION
              ============================================= */}

              <div className="result-card">
                <h3>
                  Education
                </h3>

                {education.length >
                0 ? (
                  <ul>
                    {education.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No education details
                    detected.
                  </p>
                )}
              </div>

              {/* =============================================
                  CERTIFICATIONS
              ============================================= */}

              <div className="result-card">
                <h3>
                  Certifications &
                  Training
                </h3>

                {certifications.length >
                0 ? (
                  <ul>
                    {certifications.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No certifications
                    detected.
                  </p>
                )}
              </div>

              {/* =============================================
                  EXPERIENCE
              ============================================= */}

              <div className="result-card">
                <h3>
                  Experience
                </h3>

                {experience.length >
                0 ? (
                  <ul>
                    {experience.map(
                      (
                        item,
                        index
                      ) => (
                        <li
                          key={`${item}-${index}`}
                        >
                          {typeof item ===
                          "string"
                            ? item
                            : JSON.stringify(
                                item
                              )}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No professional
                    experience detected.
                  </p>
                )}
              </div>

              {/* =============================================
                  SUGGESTIONS
              ============================================= */}

              <div className="result-card">
                <h3>
                  Resume Suggestions
                </h3>

                {suggestions.length >
                0 ? (
                  <ul>
                    {suggestions.map(
                      (
                        suggestion,
                        index
                      ) => (
                        <li
                          key={`${suggestion}-${index}`}
                        >
                          {suggestion}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No additional
                    suggestions.
                  </p>
                )}
              </div>

              {/* =============================================
                  EXTRACTED TEXT
              ============================================= */}

              <details className="result-card">
                <summary>
                  View Extracted Resume Text
                </summary>

                <div className="extracted-text">
                  {resumeResult.extracted_text ||
                    "No extracted text available."}
                </div>
              </details>
            </section>
          )}
        </section>

        {/* ===================================================
            JOB MATCHER
        =================================================== */}

        <section
          className="matcher-section"
          id="matcher"
        >
          <div className="section-heading">
            <p className="section-label">
              JOB MATCHER
            </p>

            <h2>
              Match Your Resume With a Job
            </h2>

            <p>
              Compare your resume against a
              job description and discover
              missing skills.
            </p>
          </div>

          <div className="matcher-card">
            <label>
              Job Description
            </label>

            <textarea
              placeholder="Paste the complete job description here..."
              rows="12"
              value={jobDescription}
              onChange={(event) =>
                setJobDescription(
                  event.target.value
                )
              }
            ></textarea>

            <div className="character-count">
              {jobDescription.length} characters
            </div>

            {matchError && (
              <div className="error-message">
                {matchError}
              </div>
            )}

            <button
              className="primary-button"
              onClick={handleJobMatch}
              disabled={isMatching}
            >
              {isMatching
                ? "Analyzing Match..."
                : "Analyze Job Match →"}
            </button>
          </div>

          {/* =================================================
              JOB MATCH RESULT
          ================================================= */}

          {jobResult && (
            <section
              className="job-result"
              id="job-result"
            >
              <div className="section-heading">
                <p className="section-label">
                  MATCH COMPLETE
                </p>

                <h2>
                  Job Compatibility
                </h2>

                <p>
                  ResumeIQ compared your
                  resume against the
                  provided job description.
                </p>
              </div>

              {/* MATCH SCORE */}

              <div className="result-card">
                <div className="score-label">
                  KEYWORD MATCH
                </div>

                <div
                  className={`score ${getScoreClass(
                    keywordMatch
                  )}`}
                >
                  {keywordMatch}%
                </div>

                <div className="score-status">
                  {getScoreStatus(
                    keywordMatch
                  )}
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${keywordMatch}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* MATCHED KEYWORDS */}

              <div className="result-card">
                <h3>
                  Matched Keywords (
                  {matchedKeywords.length})
                </h3>

                {matchedKeywords.length >
                0 ? (
                  <div className="skills-list">
                    {matchedKeywords.map(
                      (
                        keyword,
                        index
                      ) => (
                        <span
                          className="skill-tag"
                          key={`${keyword}-${index}`}
                        >
                          ✓ {keyword}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p>
                    No matched keywords
                    found.
                  </p>
                )}
              </div>

              {/* MISSING KEYWORDS */}

              <div className="result-card">
                <h3>
                  Missing Keywords (
                  {missingKeywords.length})
                </h3>

                {missingKeywords.length >
                0 ? (
                  <div className="skills-list">
                    {missingKeywords.map(
                      (
                        keyword,
                        index
                      ) => (
                        <span
                          className="skill-tag missing-keyword"
                          key={`${keyword}-${index}`}
                        >
                          {keyword}
                        </span>
                      )
                    )}
                  </div>
                ) : (
                  <p>
                    Excellent! No missing
                    keywords detected.
                  </p>
                )}
              </div>

              {/* RECOMMENDATIONS */}

              <div className="result-card">
                <h3>
                  Recommendations
                </h3>

                {recommendations.length >
                0 ? (
                  <ul>
                    {recommendations.map(
                      (
                        recommendation,
                        index
                      ) => (
                        <li
                          key={`${recommendation}-${index}`}
                        >
                          {recommendation}
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p>
                    No additional
                    recommendations.
                  </p>
                )}
              </div>
            </section>
          )}
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer>
        <div className="logo">
          Resume<span>IQ</span>
        </div>

        <p>
          AI-powered resume analysis and
          job matching.
        </p>

        <p className="copyright">
          © 2026 ResumeIQ. All rights
          reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;