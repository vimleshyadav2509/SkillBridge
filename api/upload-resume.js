export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    message: "Resume processed successfully",
    name: "Rohan Sharma",
    email: "rohan.sharma.dev@example.com",
    phone: "+91 98765 43210",
    skills: ["Python", "SQL", "MySQL", "SQLite", "JavaScript", "HTML5", "CSS3", "OOP", "DBMS"],
    education: ["B.Tech in Computer Science and Engineering"],
    projects: ["Student Records Portal", "Inventory Stock Tracker"],
    certifications: ["Python for Data Analysis", "SQL Fundamentals"],
    ats_score: 82,
    ats_rating: "Strong",
    breakdown: {
      format_and_structure: 25,
      skills_relevance: 22,
      experience_and_impact: 18,
      education_and_certs: 17
    }
  });
}
