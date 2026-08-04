import os
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


class BackendImportTests(unittest.TestCase):
    def test_api_imports_without_groq_key(self):
        os.environ.pop("GROQ_API_KEY", None)
        os.chdir(ROOT)

        for name in ["api", "agents.verifier", "agents.planner", "agents.researcher", "agents.writer"]:
            sys.modules.pop(name, None)

        import api

        self.assertTrue(hasattr(api, "app"))


if __name__ == "__main__":
    unittest.main()
