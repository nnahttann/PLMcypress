// ========================
// COPY DEDUCT FAIL
// ========================
export const CopyDeductFail = (): void => {
  const mainTabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game'];

  const processTab = (index: number): void => {
    if (index >= mainTabs.length) {
      cy.log('🎉 All tabs processed successfully.');
      return;
    }

    const tabName = mainTabs[index];
    cy.log(`\n🔄 Processing [${index + 1}/${mainTabs.length}]: "${tabName}"`);

    cy.wait(1000);

    // ✅ 1. หา Main Tab แบบ jQuery (ไม่ใช้ cy.get() ที่ retry จนเทสพัง)
    cy.get('body').then(($body) => {
      const $mainTab = $body.find('.scrollmenu .nav a').filter(function () {
        return Cypress.$(this).text().trim() === tabName;
      });

      if ($mainTab.length === 0) {
        cy.log(`⚠️ Main tab "${tabName}" not found. Skipping...`);
        processTab(index + 1);
        return;
      }

      cy.wrap($mainTab.first()).click({ force: true });
      cy.wait(2000);

      // ✅ 2. หา Sub-tab "Deduct Fail"
      cy.get('body').then(($b) => {
        const $deductFail = $b.find('.nav-tabs a:visible').filter(function () {
          return Cypress.$(this).text().trim() === 'Deduct Fail';
        });

        if ($deductFail.length === 0) {
          cy.log(`⚠️ Sub-tab "Deduct Fail" not found for "${tabName}". Skipping...`);
          processTab(index + 1);
          return;
        }

        cy.wrap($deductFail.first()).click({ force: true });
        cy.wait(2000);

        // ✅ 3. หาปุ่ม "Copy From Deduct Success" ใน active pane
        cy.get('body').then(($bb) => {
          const $copyBtn = $bb.find('.tab-pane.active button:visible, .tab-pane.active a.btn:visible').filter(function () {
            return Cypress.$(this).text().trim() === 'Copy From Deduct Success';
          });

          if ($copyBtn.length === 0) {
            cy.log(`⚠️ Button "Copy From Deduct Success" not found for "${tabName}". Skipping...`);
          } else {
            cy.wrap($copyBtn.first()).click({ force: true });
            cy.log(`✅ Clicked Copy for "${tabName}"`);
          }

          cy.wait(500);
          processTab(index + 1); // ✅ เรียกถัดไปเสมอ ไม่ว่าจะสำเร็จหรือข้าม
        });
      });
    });
  };

  processTab(0);
};
