"""Test scaffold for cypress/e2e/PLM/master/config.ts"""
def test_config_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
