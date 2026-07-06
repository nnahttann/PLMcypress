"""Test scaffold for cypress/e2e/PLM/master/project-manager.ts"""
def test_project_manager_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
