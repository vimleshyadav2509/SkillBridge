# SKILLBRIDGE ⚡
### AI Employability Gap Analyzer & Custom Coding Assessment Engine

> **Tagline:** *"From Resume to Job-Ready."*  
> **Core Value Proposition:** *"Don't just tell students what skills they're missing. Prove what they need to improve through personalized coding assessment."*

**Career Catalyst Club × GeeksforGeeks 4-Hour Software Hackathon**  
**Official Problem Statement:** `[CC-GFG-12]` SkillBridge: Employability Gap Analyzer & Custom Coding Assessment Engine

---

## 📌 Problem & Solution

Traditional ATS checkers and job matchers merely tell students which keywords their resume is missing. This creates two critical problems:
1. Keyword stuffing without verified skill competency.
2. Students are left without actionable, evaluated coding practice tailored to real job requirements.

**SkillBridge** solves this by establishing a closed-loop pipeline:
1. Compares **Candidate Resume** against **Target Job Description**.
2. Normalizes tech skills into canonical industry standards.
3. Separates **Required** vs **Preferred** competencies.
4. Computes an explainable **5-Factor Job Readiness Score** (40% Technical Skills, 20% Core Requirements, 20% Experience & Projects, 10% DevOps & Tooling, 10% Education).
5. Prioritizes skill gaps using: $\text{Impact} \times \text{Importance} \times \text{Gap Depth} \times \text{Confidence}$.
6. Generates a competitive-programming inspired, **original GFG-style coding challenge** testing the student's highest-priority gap.
7. Executes Python code **100% client-side in the browser via Pyodide WebAssembly** with timeout protection and test case assertions (no untrusted code execution on the backend server!).
8. **Closes the loop**: upgrades the student's skill confidence status and recalculates their updated SkillBridge readiness score.
9. Delivers a practical **7-Day Technical Sprint** and exportable/printable **SkillBridge Report**.

---

## ⚡ 1-Click Demo for Judges (60–90 Seconds)

Judges do not need to prepare or upload files:
1. Open the application.
2. Click **`⚡ 1-Click Demo`** (in the top right navigation or hero section).
3. The engine instantly loads the official CC-GFG-12 scenario:
   - **Candidate:** Computer Science student with Python, SQL, HTML, CSS, and basic JavaScript.
   - **Target Job:** Software Developer Intern requiring Python, modern JavaScript, React, REST APIs, SQL, Git, and DSA.
4. The dashboard displays:
   - **Readiness Score:** `38%`
   - **Critical Gap Detected:** `REST API`
5. Click **`⚡ Test Your Biggest Skill Gap (REST API) →`**.
6. The in-browser GFG-style editor opens:
   - Click **`⚡ Load Solution`** (or write code).
   - Click **`▶ Run Tests`** to execute in Pyodide WebAssembly.
   - All 5 visible and hidden test cases pass (`100%`).
7. Click **`🚀 Submit Assessment & Close the Loop →`**.
8. View the **Closed-Loop Result**:
   - Readiness score increases from `38%` to `48%` (+10% gain).
   - Skill status upgraded to `Demonstrated Competency`.
9. Click **`View My 7-Day Improvement Roadmap →`** to view the personalized day-by-day action plan.

---

## 🏗️ Architecture & Technology Stack

```
[ RESUME (PDF/Text) + JOB DESCRIPTION ]
                  │
                  ▼
   [ SkillBridge Engine (FastAPI) ]
   ├── Resume Parser (Education, Experience, Projects, Skills)
   ├── JD Intelligence (Required vs Preferred Skills)
   ├── Skill Normalization (100+ canonical mappings)
   ├── 5-Factor Explainable Readiness Model
   └── Gap Prioritizer (Impact × Importance × Gap × Confidence)
                  │
                  ▼
   [ Personalized GFG-Style Challenge ]
   ├── Curated Challenge Bank + Schema Validator
   └── Visible & Hidden Test Cases with Time Limits
                  │
                  ▼
   [ Client-Side Safe Sandbox (React 19) ]
   ├── Pyodide WebAssembly (Python 3.11 in Browser)
   ├── Timeout Protection & Exception Trapping
   └── Structured Assertion Runner
                  │
                  ▼
   [ Closed-Loop Progress & 7-Day Roadmap ]
   ├── Readiness Score Update (+Δ%)
   ├── Skill Confidence Upgrade
   └── Printable / Exportable Audit Report
```

### Technologies Used:
- **Backend:** Python 3, FastAPI, Uvicorn, PyPDF2, Pydantic
- **Frontend:** React 19, Vite, Vanilla Modern CSS (high-contrast dark developer aesthetic)
- **Code Execution:** Pyodide (Python compiled to WebAssembly) for safe, client-side execution
- **Typography:** Fira Code, Outfit, Inter (Google Fonts)

---

## 🚀 Running Locally

### Prerequisites:
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend API (FastAPI)
```bash
# In the root repository directory:
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The API will start at `http://127.0.0.1:8000`.  
Health check: `http://127.0.0.1:8000/health`.

### 2. Start the Frontend (React + Vite)
```bash
# In a new terminal, navigate to frontend/:
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173` in your browser.

### 3. Environment Variables
Both frontend and backend come with `.env.example` templates:
* **Frontend (`frontend/.env.example`):**
  ```bash
  # Local development:
  VITE_API_BASE_URL=http://127.0.0.1:8000
  # Production on Vercel:
  # VITE_API_BASE_URL=https://skillbridge-api.onrender.com
  ```
* **Backend (`.env.example`):**
  ```bash
  PORT=8000
  ```

---

## ☁️ Deployment Architecture

SkillBridge is architected for zero-configuration, independent cloud deployment:
* **Backend (Render / Cloud PaaS):**
  - Managed via `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
  - CORS middleware enabled for cross-origin frontend requests
  - Automatic `PORT` binding
* **Frontend (Vercel):**
  - Managed via `vercel.json` with SPA route rewrites and security headers
  - Injects `VITE_API_BASE_URL` at build time to communicate with the deployed backend API
  - Zero hardcoded localhost dependencies in production bundles

---

## 🔒 Security & Code Safety Practices

- **Zero Untrusted Backend Execution:** Candidate code is executed strictly in the user's browser sandbox via Pyodide WebAssembly. The backend server never runs arbitrary code.
- **Timeout Protection:** In-browser execution limits runs to 5 seconds to prevent infinite loops.
- **Input Validation:** PDF uploads are validated by MIME type, file extension, and capped at 10 MB.
- **Environment Isolation:** No hardcoded API secrets or keys in frontend code.

---

## 🏆 Official Hackathon Requirements Checklist ([CC-GFG-12])

- [x] **Resume vs JD Comparator:** Comprehensive extraction and gap identification.
- [x] **Skill Normalization:** Automatic canonical mapping (e.g. `JS` $\rightarrow$ `JavaScript`, `ReactJS` $\rightarrow$ `React`, `Postgres` $\rightarrow$ `PostgreSQL`).
- [x] **Required vs Preferred Skills:** Distinct scoring weights based on JD importance.
- [x] **5-Factor Explainable Readiness Score:** Transparent model labeled *"SkillBridge Readiness Estimate"*.
- [x] **Prioritized Gaps with "Why It Matters":** Clear rationale for each detected gap.
- [x] **Personalized Coding Assessment:** Original GFG-style problem statement dynamically selected for the candidate's top gap.
- [x] **In-Browser Code Editor:** Line numbers, dark theme, starter code, run/reset controls.
- [x] **Live In-Browser Code Execution:** Safe Pyodide WebAssembly execution evaluating visible and hidden test cases.
- [x] **Close the Loop:** Readiness score updates post-assessment with demonstrated competence upgrades.
- [x] **7-Day Technical Sprint:** Day-by-day actionable checklist.
- [x] **1-Click Hackathon Demo Mode:** Evaluates the complete workflow in 60–90 seconds without manual file preparation.
- [x] **Downloadable / Printable Report:** Print-friendly view and JSON export.

---

## 👥 Authors & Attribution
Built for the **Career Catalyst Club × GeeksforGeeks 4-Hour Software Hackathon**.  
Problem Statement: `[CC-GFG-12] SkillBridge`.
