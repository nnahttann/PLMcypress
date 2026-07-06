"""Test scaffold for cypress/e2e/PLM/master/product-specs.ts"""
def test_product_specs_smoke(driver):
    driver.get("https://example.com")
    assert "Example Domain" in driver.title
