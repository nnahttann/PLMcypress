"""Test scaffold for cypress/e2e/PLM/master/human-touch-point.ts"""
def test_human_touch_point_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
