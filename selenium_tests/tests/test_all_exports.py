import os
import re
import pytest


def _sanitize(s: str) -> str:
    return re.sub(r"[^0-9a-zA-Z_]+", "_", s)


def _collect_ts_exports(root_dir: str):
    exports = []
    pattern = re.compile(r"export\s+(?:const|function|class|let|async\s+function)\s+([A-Za-z0-9_$]+)")
    for dirpath, _, filenames in os.walk(root_dir):
        for fn in filenames:
            if fn.endswith('.ts'):
                path = os.path.join(dirpath, fn)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        text = f.read()
                except Exception:
                    continue
                for m in pattern.finditer(text):
                    exports.append((os.path.relpath(path, root_dir), m.group(1)))
    return exports


# locate project cypress/e2e folder relative to this file
HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
TS_ROOT = os.path.join(REPO_ROOT, 'cypress', 'e2e')

_exports = []
if os.path.isdir(TS_ROOT):
    _exports = _collect_ts_exports(TS_ROOT)


def _make_test(file_rel: str, name: str):
    def test_func():
        pytest.skip(f"Placeholder test for exported symbol '{name}' in '{file_rel}' — implement UI/selector steps")

    test_name = f"test_{_sanitize(file_rel)}_{name}"
    test_func.__name__ = test_name
    globals()[test_name] = test_func


for _file, _name in _exports:
    _make_test(_file, _name)

# If no exports found, provide a tiny sanity test so pytest discovers the file
if not _exports:
    def test_no_exports_found():
        assert True
