// ========================
// WiFi
// ========================

export const WiFi = (): void => {
  // ═══════════════════════════════════════════════════════
  // 🔧 CONFIG & SELECTORS
  // ═══════════════════════════════════════════════════════
  const COMPONENT = 'app-mass-mkt-wifi'
  const HEADING_SELECTOR = '.panel-heading.cursor-point'
  const PANEL_BODY = '.panel.panel-default'
  const WIFI_USAGE_TYPES = ['Volume-based', 'Time-based']
  const WIFI_QUOTA_TYPES = ['Unlimited Data (Fixed Speed)', 'Unlimited Data (Throttling Speed)']

  // 🎯 Resilient tab selector - supports Bootstrap + Angular Material
  const TAB_SELECTOR = 'a.nav-link, .nav-item a, mat-tab-label, [role="tab"], button.mat-tab-label, .mat-tab-label'

  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const waitForComponentReady = (componentSelector: string, timeout = 30000): void => {
    cy.log(`⏳ Waiting for ${componentSelector} to be fully loaded...`)

    // ✅ FIX 1: ไม่ return $el เพราะ downstream ไม่ได้ใช้ค่านี้
    cy.get(componentSelector, { timeout })
      .should('exist')
      .and('be.visible')
      .then(($el) => {
        cy.log(`✅ Component loaded: ${$el.length} element(s)`)
      })

    // ✅ FIX 2: แยก chain ออกมาชัดเจน ไม่ปนกัน
    cy.get('body', { timeout: 10000 })
      .should('not.have.class', 'loading')
      .and('not.contain.text', 'Loading...')
      .and('not.contain.text', 'Loading')
  }
  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: findTabByName (Resilient Tab Finder)
  // ═══════════════════════════════════════════════════════
  const findTabByName = (tabName: string, scope: Cypress.Chainable = cy.get(COMPONENT)): Cypress.Chainable => {
    cy.log(`🔍 Searching for tab: "${tabName}"`)

    return scope
      .find(TAB_SELECTOR, { timeout: 15000 })
      .filter((_, el) => {
        const text = Cypress.$(el).text().trim()
        return text === tabName || text.includes(tabName)
      })
      .should('be.visible')
      .first()
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: expandPanelIfNeeded
  // ═══════════════════════════════════════════════════════
  const expandPanelIfNeeded = (): void => {
    cy.log('🔓 Ensuring WiFi panel is expanded...')

    cy.get(COMPONENT, { timeout: 15000 })
      .should('exist')
      .find(HEADING_SELECTOR, { timeout: 10000 })
      .should('be.visible')
      .then(($heading) => {
        const $chevronDown = $heading.find('.glyphicon-chevron-down')
        const $chevronUp = $heading.find('.glyphicon-chevron-up')

        if ($chevronDown.length > 0 && $chevronUp.length === 0) {
          cy.log('📥 Panel is collapsed → clicking to expand')
          cy.wrap($heading).click({ force: true })
          cy.wait(800)
        } else {
          cy.log('📤 Panel already expanded ✓')
        }
      })

    // Ensure inner form panel is visible (remove hidden attribute if present)
    cy.get(COMPONENT).within(() => {
      cy.get(PANEL_BODY, { timeout: 10000 })
        .should('exist')
        .then(($panel) => {
          if ($panel.attr('hidden') !== undefined) {
            cy.log('🔧 Removing "hidden" attribute from form panel')
            cy.wrap($panel).invoke('removeAttr', 'hidden')
            cy.wait(300)
          }
        })
    })

    cy.wait(400)
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: fillWifiDetailForm
  // ═══════════════════════════════════════════════════════
  const fillWifiDetailForm = (tabIdx: number, tabName: string): void => {
    cy.log(`🚀 [WiFi – ${tabName}] Starting form fill...`)

    const usageType = rand(WIFI_USAGE_TYPES)
    const quotaType = rand(WIFI_QUOTA_TYPES)

    cy.log(`🎲 Usage Type → ${usageType} | Quota Type → ${quotaType}`)

    // Click Add button with flexible selector
    cy.log(`➕ Clicking Add button (index: ${tabIdx})`)
    cy.get(COMPONENT)
      .find('button.btn-primary.btn-xs[style*="width:60px"], button.btn-primary.btn-xs', { timeout: 12000 })
      .eq(tabIdx)
      .should('be.visible')
      .click({ force: true })
    cy.wait(600)

    // Select Usage Type
    cy.log(`📋 Selecting Usage Type: ${usageType}`)
    cy.get(COMPONENT)
      .find('select[formcontrolname="wiFiUsageType"], select[name*="usage"], select.ng-pristine', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .select(usageType, { force: true })
    cy.wait(400)

    // Select Quota Type
    cy.log(`📋 Selecting Quota Type: ${quotaType}`)
    cy.get(COMPONENT)
      .find('select[formcontrolname="wiFiQuotaType"], select[name*="quota"]', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .select(quotaType, { force: true })
    cy.wait(400)

    // Handle Angular Material mat-select
    cy.log(`🎯 Opening mat-select dropdown`)
    cy.get(COMPONENT)
      .find('mat-select .mat-select-trigger, mat-select, .mat-select-trigger', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .click({ force: true })
    cy.wait(800)

    // Select random enabled option from dropdown
    cy.get('body')
      .find('mat-option, .mat-option, [role="option"]', { timeout: 12000 })
      .should('have.length.greaterThan', 0)
      .then(($opts) => {
        const available = $opts
          .toArray()
          .filter((el: Element) => {
            const disabled = el.getAttribute('aria-disabled') === 'true'
              || el.getAttribute('disabled') !== null
              || Cypress.$(el).hasClass('mat-option-disabled')
            return !disabled
          })

        if (available.length === 0) {
          cy.log(`⚠️ No enabled options found → closing dropdown`)
          cy.get('body').type('{esc}', { force: true })
          return
        }

        const picked = available[Math.floor(Math.random() * available.length)]
        const optionText = Cypress.$(picked).text().trim()
        cy.log(`🎲 Selected WiFi value → ${optionText}`)
        cy.wrap(picked).click({ force: true })
      })
    cy.wait(500)

    // Click Save/Add button
    cy.log(`💾 Clicking Add button to save`)
    cy.get(COMPONENT)
      .find('.panel-body, .mat-tab-body-active, form', { timeout: 10000 })
      .eq(tabIdx)
      .find('button.btn-primary, button[type="submit"]')
      .contains(/Add|Save|บันทึก|เพิ่ม/i)
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    // Verify success message or table update
    cy.log(`✅ Form filled - verifying update...`)
    cy.get('body', { timeout: 8000 })
      .should('not.contain.text', 'Error')
      .and('not.contain.text', 'Failed')

    cy.log(`✨ [WiFi – ${tabName}] Form completed successfully`)
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: verifyTabHasData
  // ═══════════════════════════════════════════════════════
  const verifyTabHasData = (tabName: string): void => {
    cy.log(`🔎 Verifying data in tab: ${tabName}`)

    // Try to find and click the tab first
    cy.get(COMPONENT)
      .find(TAB_SELECTOR, { timeout: 10000 })
      .filter((_, el) => {
        const text = Cypress.$(el).text().trim()
        return text === tabName || text.includes(tabName)
      })
      .first()
      .click({ force: true })
    cy.wait(400)

    // Check table has actual data (not "No data to display")
    cy.get(COMPONENT)
      .find('table.table tbody, tbody', { timeout: 8000 })
      .first()
      .should(($tbody) => {
        const text = $tbody.text().trim()
        expect(text).not.to.match(/No data|ไม่พบข้อมูล|empty/i)
      })
  }

  // ═══════════════════════════════════════════════════════
  // 🚀 MAIN TEST FLOW
  // ═══════════════════════════════════════════════════════

  // ── STEP 1: Navigate to WiFi Component ─────────────────
  cy.log('📶 [WiFi] 🎯 Navigating to WiFi component...')

  cy.get('a.nav-link, a[routerlinkactive], .nav-tabs a, button.nav-link', { timeout: 20000 })
    .contains('WiFi')
    .should('be.visible')
    .click({ force: true })

  waitForComponentReady(COMPONENT, 35000)

  // ── STEP 2: Expand Panel & Prepare UI ──────────────────
  expandPanelIfNeeded()

  // ── STEP 3: Locate & Click "Deduct Success" (Adaptive) ───
  cy.log('📶 [WiFi] 🔍 Locating "Deduct Success" section...')

  // ✅ ใช้ cy.contains() ซึ่งมี Retry + Timeout ในตัว
  // ลองค้นหาใน Component ก่อน ถ้าไม่เจอให้ค้นหาทั้งหน้า
  cy.get(COMPONENT, { timeout: 20000 })
    .should('exist')
    .then(($comp) => {
      const html = $comp.html()
      const isInComponent = html.includes('Deduct Success') ||
        html.includes('deduct-success') ||
        html.includes('DeductSuccess')

      if (isInComponent) {
        cy.log('📍 Found within component scope → clicking')
        cy.get(COMPONENT).contains('Deduct Success', { timeout: 10000 })
          .should('be.visible')
          .click({ force: true })
      } else {
        cy.log('🌍 Not in component → searching globally')
        cy.contains('Deduct Success', { timeout: 15000 })
          .should('be.visible')
          .click({ force: true })
      }
    })
  cy.wait(500)
  // ── STEP 4: Process "Deduct Success" Tab (Mandatory) ───
  cy.log('📶 [WiFi] ▶️ Processing Tab: Deduct Success')

  findTabByName('Deduct Success', cy.get(COMPONENT))
    .click({ force: true })
  cy.wait(500)

  fillWifiDetailForm(0, 'Deduct Success')

  // ── STEP 5: Process "Deduct Fail" Tab (Optional) ───────
  cy.log('📶 [WiFi] 🔍 Checking for optional tab: Deduct Fail')

  cy.get(COMPONENT).then(($component) => {
    const html = $component.html()
    const hasDeductFail = html.includes('Deduct Fail')

    if (hasDeductFail) {
      cy.log('📶 [WiFi] 🔀 Deduct Fail tab found → processing...')

      // Use retry logic in case tab isn't immediately clickable
      cy.get(COMPONENT, { timeout: 15000 })
        .find(TAB_SELECTOR)
        .filter((_, el) => {
          const text = Cypress.$(el).text().trim()
          return text === 'Deduct Fail' || text.includes('Deduct Fail')
        })
        .first()
        .should('be.visible')
        .click({ force: true })
      cy.wait(600)

      fillWifiDetailForm(1, 'Deduct Fail')
    } else {
      cy.log('📶 [WiFi] ⏭️ Deduct Fail tab not present → skipping (expected)')
    }
  })

  // ── STEP 6: Final Verification ─────────────────────────
  cy.log('📶 [WiFi] 🏁 Running final verification...')

  // Verify Deduct Success has data
  verifyTabHasData('Deduct Success')

  // Verify Deduct Fail if it exists
  cy.get(COMPONENT).then(($component) => {
    if ($component.html().includes('Deduct Fail')) {
      verifyTabHasData('Deduct Fail')
    }
  })

  // ── STEP 7: Success Logging ────────────────────────────
  cy.log('📶 [WiFi] 🎉 All WiFi test steps completed successfully! ✨')

  // Optional: Take screenshot for evidence
  // cy.get(COMPONENT).screenshot('wifi-test-completed', { capture: 'viewport' })
}
