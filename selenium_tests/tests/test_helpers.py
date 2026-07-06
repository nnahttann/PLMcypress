"""Test scaffold for cypress/e2e/PLM/master/helpers.ts"""
def test_helpers_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
