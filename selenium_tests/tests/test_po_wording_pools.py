"""Test scaffold for cypress/e2e/PLM/Approve/po-wording-pools.ts"""
def test_po_wording_pools_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
