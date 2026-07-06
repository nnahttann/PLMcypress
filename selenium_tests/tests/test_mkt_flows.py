"""Test scaffold for cypress/e2e/PLM/master/mkt-flows.ts"""
def test_mkt_flows_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
