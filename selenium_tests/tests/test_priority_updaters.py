"""Test scaffold for cypress/e2e/PLM/master/priority-updaters.ts"""
def test_priority_updaters_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
