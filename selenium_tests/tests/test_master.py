"""Test scaffold for cypress/e2e/PLM/Master.ts"""
def test_master_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
