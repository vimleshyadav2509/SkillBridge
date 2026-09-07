import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from skillbridge_engine import CHALLENGE_BANK

for k, chal in CHALLENGE_BANK.items():
    g = {}
    exec(chal["solution_code"], g)
    all_tests = chal["sample_test_cases"] + chal["hidden_test_cases"]
    for t in all_tests:
        r = eval(t["call"], g)
        e = eval(t["expected"])
        assert r == e, f"Mismatch in {k} - {t['name']}: {r} vs {e}"
    print(f"Challenge {k}: {len(all_tests)} tests ALL PASSED!")
print("ALL CHALLENGES AND TEST CASES VERIFIED SUCCESSFULLY!")
