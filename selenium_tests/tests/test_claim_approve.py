"""Test scaffold for cypress/e2e/PLM/master/claim-approve.ts"""
def test_claim_approve_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
