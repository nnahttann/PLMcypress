"""Test scaffold for cypress/e2e/PLM/Approve/Rom, Easy App Rom/Rom, Easy App Rom.cy.ts"""
def test_rom_easy_app_rom_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
