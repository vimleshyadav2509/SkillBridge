export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: "online",
    service: "SkillBridge API",
    version: "2.0.0",
    tagline: "From Resume to Job-Ready.",
    hackathon: "Career Catalyst Club × GeeksforGeeks [CC-GFG-12]"
  });
}
