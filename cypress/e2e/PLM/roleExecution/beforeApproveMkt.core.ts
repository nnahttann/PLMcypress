// ========================
// BEFORE APPROVE MKT
// ========================

import { ClaimProject, approveProject } from '../projectWorkflows/projectManagement';
import { getStandardProjectName } from '../projectWorkflows/projectNameManagement';

export const beforeapproveMKT = (): void => {

  const poName = `PO-${Math.floor(Math.random() * 900 + 100)}`;
  const projectName = `Project-${['A', 'B', 'Test', 'Demo'][Math.floor(Math.random() * 4)]}`;
  const useThai = Math.random() < 0.5;

  const casualEN = [
    'file for {po}', '{project} doc', 'attachment for {po}',
    'contract draft for {po} (pls check)',
    'updated specs for {project} - v2',
  ];
  const casualTH = [
    'ไฟล์สำหรับ {po}', 'เอกสาร {project}',
    'ร่างสัญญา {po} (ช่วยดู)',
    'สเปคอัปเดต {project} - v2',
    'สำรองไว้ก่อน',
  ];

  let descTemplate = useThai
    ? casualEN[Math.floor(Math.random() * casualEN.length)]
    : casualTH[Math.floor(Math.random() * casualTH.length)];

  let attachmentDesc = descTemplate.replace('{po}', poName).replace('{project}', projectName);
  if (Math.random() < 0.3) attachmentDesc += ' (draft)';
  if (Math.random() < 0.2) attachmentDesc += ' - updated';

  const MAX_LEN = 120;
  if (attachmentDesc.length > MAX_LEN) attachmentDesc = attachmentDesc.substring(0, MAX_LEN - 3) + '...';

  cy.log(`📎 Attachment Description: ${attachmentDesc}`);
  cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
    .should('be.visible')
    .focus()
    .type(attachmentDesc, { delay: 50 });

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get(':nth-child(3) > :nth-child(1) > .btn').click();
  cy.contains('.row', 'Approve memo')
    .find('input[type="checkbox"]')
    .check({ force: true });

  cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');
  cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
    .contains('Submit')
    .click();

  cy.wait('@postRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@submitApprove', { timeout: 180000 }).its('response.statusCode').should('eq', 200);

  // ===== 🔄 3. NAVIGATION & PROJECT WORKFLOW =====
  cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

  // cy.wait(7000); // ⚠️ Hard wait ไม่แนะนำ ใช้ cy.get('...').should('exist') แทนถ้าเป็นไปได้
  const finalProjectName = getStandardProjectName();
  cy.log(`✅ Project ใช้สำหรับ Claim: ${finalProjectName}`);

  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  // ===== 📥 4. FINAL CHECK & SCROLL =====
  cy.wait('@postRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);

  cy.scrollTo('bottom');
  // cy.wait(1500); // ⚠️ แทนที่ด้วย assertion ของ element ที่โผล่มาหลัง scroll จะเสถียรกว่า

  cy.url({ timeout: 120000 }).should('include', '/mkt/mktchecker');
  cy.get('button.btn.btn-xs.btn-primary').should('be.visible').click();
  cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

  // ===== 🚪 5. LOGOUT =====
  cy.contains('button', 'Logout').should('be.visible').click();
};
