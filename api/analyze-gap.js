export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const body = req.body || {};
  const resumeText = body.resume_text || "";
  const jdText = body.job_description || "";
  const jobRole = body.job_role || "Software Developer Intern";

  // Standard CC-GFG-12 Skills Catalog
  const recognizedSkills = [
    "Python", "SQL", "JavaScript", "React", "REST API", "Docker", "Git", "DSA", 
    "Machine Learning", "FastAPI", "Node.js", "Express", "HTML5", "CSS3", "MySQL", "PostgreSQL"
  ];

  const lowerResume = resumeText.toLowerCase();
  const lowerJd = jdText.toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];

  // Match skills
  recognizedSkills.forEach(skill => {
    const sLower = skill.toLowerCase();
    const inResume = lowerResume.includes(sLower);
    const inJd = lowerJd.includes(sLower);

    if (inResume && inJd) {
      matchedSkills.push(skill);
    } else if (!inResume && inJd) {
      missingSkills.push(skill);
    } else if (inResume) {
      matchedSkills.push(skill);
    }
  });

  // Top critical gap
  const prioritizedGaps = missingSkills.length > 0 ? missingSkills : ["REST API"];
  const topCriticalGap = prioritizedGaps[0] || "REST API";

  // Deterministic 5-factor scoring
  const techScore = Math.min(40, Math.round((matchedSkills.length / Math.max(1, matchedSkills.length + missingSkills.length)) * 40));
  const coreScore = lowerResume.includes("rest") || lowerResume.includes("api") ? 15 : 10;
  const expScore = lowerResume.includes("project") || lowerResume.includes("portal") ? 15 : 10;
  const toolScore = lowerResume.includes("git") ? 8 : 4;
  const eduScore = lowerResume.includes("b.tech") || lowerResume.includes("degree") ? 10 : 6;
  const readinessScore = Math.min(100, techScore + coreScore + expScore + toolScore + eduScore);

  const challenge = {
    skill: topCriticalGap,
    title: `Build a ${topCriticalGap} Query Filter & Pagination Engine`,
    difficulty: "Medium",
    duration_minutes: 20,
    tags: [topCriticalGap, "Algorithms", "Backend"],
    problem_statement: `Implement a robust ${topCriticalGap} query parsing and execution routine. The system must process an incoming data collection, filter by key-value criteria, and return deterministic paginated records.`,
    initial_code: `def filter_and_paginate(items, filter_key=None, filter_val=None, page=1, page_size=2):
    """
    Filters a list of dicts by key-value and returns paginated result with metadata.
    """
    # Filter by key and val
    filtered = items
    if filter_key and filter_val is not None:
        filtered = [x for x in items if x.get(filter_key) == filter_val]
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "total_count": len(filtered),
        "page": page,
        "page_size": page_size,
        "items": filtered[start:end]
    }
`,
    test_cases: [
      { input: "3 items, filter status=active, page 1, size 2", expected: "2 active items returned with total_count=2" },
      { input: "Empty items list", expected: "total_count=0, empty items list" },
      { input: "No filter applied, page 2, size 2", expected: "items at index 2..3 returned" }
    ]
  };

  const roadmap = {
    target_role: jobRole,
    total_days: 7,
    sprints: [
      { day: "Day 1-2", skill: topCriticalGap, focus: `Master ${topCriticalGap} core contracts, HTTP pagination, and error patterns.` },
      { day: "Day 3-4", skill: prioritizedGaps[1] || "React", focus: "State management, hook lifecycle, and component API integration." },
      { day: "Day 5-6", skill: prioritizedGaps[2] || "DSA", focus: "Data structures, logarithmic search, and sliding window optimization." },
      { day: "Day 7", skill: "Portfolio Integration", focus: "Deploy full-stack project with documentation and automated tests." }
    ]
  };

  return res.status(200).json({
    status: "success",
    job_role: jobRole,
    resume_profile: {
      name: "Rohan Sharma",
      skills: matchedSkills,
      ats_score: 82
    },
    gap_analysis: {
      readiness_score: readinessScore,
      matched_skills: matchedSkills,
      missing_skills: missingSkills,
      prioritized_gaps: prioritizedGaps,
      critical_gap: topCriticalGap,
      score_breakdown: {
        technical_skills: techScore,
        core_requirements: coreScore,
        experience_and_projects: expScore,
        tooling_and_devops: toolScore,
        education_and_background: eduScore
      }
    },
    personalized_challenge: challenge,
    roadmap: roadmap
  });
}
