"""Test scaffold for cypress/e2e/PLM/master/dropdowns-randomizers.ts"""
def test_dropdowns_randomizers_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
