export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    candidate_name: "Rohan Sharma",
    resume_text: `ROHAN SHARMA
Email: rohan.sharma.dev@example.com | Phone: +91 98765 43210
Location: Bengaluru, India | GitHub: github.com/rohan-sharma-dev | LinkedIn: linkedin.com/in/rohansharma-dev

PROFESSIONAL SUMMARY
Aspiring Full-Stack Software Engineer with foundational proficiency in Python, MySQL, and Modern JavaScript. Passionate about designing robust backend pipelines, automated data aggregators, and clean responsive web interfaces.

TECHNICAL SKILLS
Languages: Python, SQL, JavaScript (Basics), HTML5, CSS3
Databases: MySQL, SQLite
Concepts: OOP, DBMS, Basic Data Structures

KEY PROJECTS
Student Records Portal | Python | SQLite | HTML5 | CSS3
• Implemented relational schema managing 1,200+ student grade entries with CRUD operations.
• Designed parameterized SQL queries preventing syntax anomalies and reducing query latency by 25%.

Inventory Stock Tracker | Python | MySQL
• Created CLI database management system tracking 400+ distinct warehouse SKU stock levels.
• Applied SQL aggregation queries to summarize restocking triggers.

EDUCATION
B.Tech in Computer Science and Engineering (2022 - 2026)
Visvesvaraya Technological University | CGPA: 8.4/10.0`,
    job_description: `Position: Software Developer Intern (Backend & Full-Stack)
Company: Nexus Cloud Technologies
Location: Bengaluru / Remote

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
    target_gaps: ["REST API", "React", "DSA"],
    expected_critical_gap: "REST API",
    baseline_score: 59
  });
}
