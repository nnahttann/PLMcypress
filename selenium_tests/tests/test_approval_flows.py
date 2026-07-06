"""Test scaffold for cypress/e2e/PLM/master/approval-flows.ts"""
def test_approval_flows_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
