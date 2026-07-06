"""Test scaffold for cypress/e2e/PLM/master/project-creation.ts"""
def test_project_creation_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
