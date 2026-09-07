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
  const initialReadiness = body.initial_readiness || 59;
  const testResults = body.test_results || [];

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length || 3;
  const passRatio = totalTests > 0 ? passedTests / totalTests : 0;

  // Closed loop score increase
  const scoreBoost = Math.round(passRatio * 18);
  const updatedReadiness = Math.min(100, initialReadiness + scoreBoost);

  return res.status(200).json({
    status: "success",
    evaluation: {
      initial_readiness: initialReadiness,
      updated_readiness: updatedReadiness,
      score_boost: scoreBoost,
      tests_passed: passedTests,
      total_tests: totalTests,
      verdict: passRatio === 1 ? "ACCEPTED" : passRatio > 0 ? "PARTIALLY_ACCEPTED" : "REJECTED",
      feedback: passRatio === 1 
        ? "Excellent job! All test cases passed with optimal asymptotic time and space complexity."
        : "Partial success. Review edge cases such as empty input arrays and unindexed search filters."
    }
  });
}
