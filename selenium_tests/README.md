# Selenium tests (pytest)

Run Selenium-based tests with pytest. These are lightweight skeleton tests that open a browser and verify a page loads.

Setup (recommended in a virtualenv):

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -r selenium_tests/requirements.txt
```

Run tests:

```bash
pytest -q selenium_tests/tests
```

To run headful browser (not headless):

```bash
HEADLESS=0 pytest -q selenium_tests/tests
```
