"""Test scaffold for cypress/e2e/PLM/master/cks-role.ts"""
def test_cks_role_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
