import { login, loginAndWaitReady } from '../helpers/auth';
import { cks, ckspass, cgcirb, cgcirbpass, cgtirb, cgtirbpass, actm, actmpass, oper, operpass } from '../helpers/config';
import { ClaimProject, approveProject } from '../projectWorkflows/projectManagement';
import { getStandardProjectName, getOntopProjectName } from '../projectWorkflows/projectNameManagement';
import { checkAndFillContentType, checkAndUpdatePriority, checkAndUpdateVerticalAppPriority } from '../helpers/uiHelpers';
import { smsCKSPOST } from '../contentGeneration/smsMms';
import { performRoleTaskWithAssignment, performSimpleApprovalRole } from './roleHelpers';
import { approveProjectCGMD, approveProjectCGMDtester } from './cgmdApprovals';
import { approveProjectACTM, approveProjectOPER } from './simpleApprovals';
import { GetProjectNameFn, EnhanceStepsCallback } from '../helpers/types';

// ========================================
// CKS APPROVAL HELPERS
// ========================================

/**
 * Helper to select random recurring dropdown option
 */
const selectRandomDropdownRecurring = (): void => {
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';
    if ($body.find(selector).length > 0) {
      cy.get(selector).find('option').not('[value="0: null"]').then(($options) => {
        if ($options.length > 0) {
          const randomIndex = Math.floor(Math.random() * $options.length);
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
          cy.get(selector).select(valueToSelect, { force: true });
        }
      });
    }
  });
};

export const dropdownRecurringCKS = (): void => {
  selectRandomDropdownRecurring();
};

export const dropdownRecurringCKSMain = (): void => {
  cy.get('.mat-select-value').eq(1).click({ force: true });
  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });
    cy.get('.mat-select-value').eq(1).should('contain.text', selectedText);
  });
};

export const dropdownRecurringPreMainCKS = (): void => {
  selectRandomDropdownRecurring();
};

export const unregister = (): void => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('UnRegister (Hold)')) {
      cy.contains('label', 'UnRegister (Hold)')
        .closest('.form-group')
        .find('input[type="radio"]')
        .then(($radios) => {
          const randomIndex = Math.floor(Math.random() * $radios.length);
          cy.wrap($radios[randomIndex]).check({ force: true });
        });
    }
  });
};

export const addauto5gCKS = (): void => {
  const values = ['1: Y', '2: X', '3: N'];
  const randomValue = values[Math.floor(Math.random() * values.length)];
  const selector = 'select[formcontrolname="autoAddService5g"]';

  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      cy.get(selector).select(randomValue, { force: true });
    }
  });
};

export const diyflagCKS = (): void => {
  const isDiyYes = Math.random() < 0.5;
  const diyLabelToClick = isDiyYes ? 'Yes' : 'No';

  cy.get('input[formcontrolname="diyFlag"]').parent('label').contains(diyLabelToClick).click({ force: true });

  if (!isDiyYes) return;

  const isValidityYes = Math.random() < 0.5;
  const validityLabelToClick = isValidityYes ? 'Yes' : 'No';
  cy.get('input[formcontrolname="diyValidityFlag"]').parent('label').contains(validityLabelToClick).click({ force: true });
};

// ========================================
// CKS CORE FLOWS
// ========================================

/**
 * Generic execution wrapper for CKS role
 */
export const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
): void => {
  const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard'
    ? getStandardProjectName
    : getOntopProjectName;

  standardCksPoEnhancementFlow(getProjectName, () => {
    customSteps();
    if (approvalType === 'main') {
      beforeapproveCKS();
    } else {
      beforeapproveCKSontop();
    }
  });
};

/**
 * Standard PO Enhancement Flow used by CKS
 */
export const standardCksPoEnhancementFlow = (
  getProjectNameFn: GetProjectNameFn,
  enhanceStepsCallback: EnhanceStepsCallback
): void => {
  login(cks, ckspass);

  cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

  cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
  
  const finalProjectName: string = getProjectNameFn();
  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

  cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

  cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
  cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');

  cy.get('button.btn-sample').contains('Enhance PO').scrollIntoView({ ensureScrollable: false }).should('be.visible').click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/).then((url) => {
    if (url.includes('mass-enh-product-offering-detail')) {
      cy.wait(['@getPoEnhDetail', '@getCheckGenPoEnh', '@getCheckSffEnh'], { timeout: 60000 });
    }
  });

  cy.wait(3500);
  enhanceStepsCallback();
};

export const standardBeforeApproveCKS = (): void => {
  cy.contains('button', 'Back').should('be.visible').and('not.be.disabled').click();
  cy.contains('button', 'Yes').should('be.visible').click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 60000 }).should('include', '/new-flow/home/newcks/cks-doer');
  cy.wait(2000);

  cy.contains('label', 'Fast Lane :').parent().next().find('input[type="checkbox"]').check();
  cy.get('.row.col-md-11').find('input[type="checkbox"]').check();
  cy.wait(['@getRequest'], { timeout: 100000 });

  const now = new Date();
  now.setDate(now.getDate() + 1);
  const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  cy.get('input[aria-label="Date input field"]').eq(1).type(formattedDate);

  cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');
  cy.contains('button', 'Approve').click();
  cy.wait('@submitApprove', { timeout: 3000000 }).its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(7000);

  const finalProjectName = getStandardProjectName();
  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');
  cy.scrollTo('bottom');
  cy.wait(3500);

  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');

  cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click();

  cy.wait(['@promoteChecker', '@assignCgmd'], { timeout: 60000 });

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(1500);
  cy.contains('button', 'Logout').should('be.visible').click();
};

export const beforeapproveCKS = (): void => {
  standardBeforeApproveCKS();
};

export const beforeapproveCKSontop = (): void => {
  standardBeforeApproveCKS();
};

export const afterCKSPOST = (Module?: string): void => {
  performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB');
  performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB');
  performSimpleApprovalRole(actm, actmpass, approveProjectACTM);
  performSimpleApprovalRole(oper, operpass, approveProjectOPER);
};

export const CKSroleRJ = (): void => {
  login(cks, ckspass);
  // Implementation for Reject flow can be added here
};
