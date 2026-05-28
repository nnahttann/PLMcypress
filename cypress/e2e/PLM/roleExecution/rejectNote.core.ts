// ========================
// TYPE REJECT NOTE BY ROLE
// ========================

import { login } from '../helpers/auth';
import { cks, ckspass, getStandardProjectName } from '../helpers/config';
import { ClaimProject, approveProject } from '../projectWorkflows/projectManagement';

export const typeRejectNoteByRole = (role: string): void => {
  const message = `reject from ${role}`;

  cy.get('textarea[formcontrolname="noteDetail"]')
    .should('be.visible')
    .type(message);

  cy.contains('button', 'Add')
    .should('not.be.disabled')
    .click();

  cy.get('button.btn-danger')
    .contains('Reject')
    .should('not.be.disabled')
    .click();
};

// ========================
// CKS ROLE RJ
// ========================

export const CKSroleRJ = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);

    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

    typeRejectNoteByRole('cks');
  });
};
