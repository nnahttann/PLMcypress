"""Test scaffold for cypress/e2e/PLM/master/sms-wording.ts"""
def test_sms_wording_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
