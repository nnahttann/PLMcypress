import { createFullPageApprovalFlow } from './baseFlows';
import { scrollAndWait, selectRandomOption, clickYesIfExists } from '../helpers/uiHelpers';
import { FinalAction } from '../helpers/types';

// ========================================
// SPAD APPROVAL FUNCTIONS
// ========================================

/**
 * Core SPAD approval logic
 * Handles both complex and non-complex approvals
 */
const _approveSPADLogic = (projectName: string, isComplex: boolean): void => {
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;
      const random2DigitCode = Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').type(random5DigitCode.toString());
      cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').type(random2DigitCode.toString());

      scrollAndWait();
      cy.contains('button', buttonText, { timeout: 3000000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

/**
 * Approve SPAD Supervisor role (complex)
 */
export const approveProjectSPADSup = (projectName: string): void => {
  _approveSPADLogic(projectName, true);
};

/**
 * Approve SPAD Supervisor role with CGMD Plugin (non-complex)
 */
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => {
  _approveSPADLogic(projectName, false);
};

/**
 * Generic SPAD approval with optional complexity flag
 */
export const approveProjectSPAD = (projectName: string, isComplex: boolean = true): void => {
  _approveSPADLogic(projectName, isComplex);
};

// ========================================
// SPAD DOER APPROVAL FUNCTIONS
// ========================================

/**
 * Core SPAD DOER approval logic
 */
const _approveSPADDOERLogic = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      if (isMainFlow) {
        cy.wait(10000);
        const rnd = () => Math.floor(Math.random() * 90000) + 10000;
        cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input').type('PT' + rnd());
        cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + rnd());
        cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input').type('PST' + rnd());
      }
      cy.get('label:contains("Gprs type")').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });
      cy.wait(1500);
      cy.get('label:contains("Template")').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });

      scrollAndWait();
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

/**
 * Approve SPAD DOER role (non-main flow)
 */
export const approveProjectSPADDOER = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, false);
};

/**
 * Approve SPAD DOER role (main flow)
 */
export const approveProjectSPADDOERMain = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, true);
};

// ========================================
// SPAD TESTER APPROVAL FUNCTIONS
// ========================================

/**
 * Core SPAD Tester approval logic
 */
const _approveSPADTesterLogic = (projectName: string, isMainFlow: boolean): void => {
  const logoutStrategy = isMainFlow ? 'StopAfterCore' : 'AlertAndLogout';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      if (isMainFlow) {
        cy.wait(3500);
        scrollAndWait();

        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
            throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
          }
        });

        cy.on('window:confirm', () => true);
        cy.contains('button', 'Send PlugIN', { timeout: 3000000 }).should('be.visible').click();
        clickYesIfExists(10000, 'first');
        cy.wait(80000);

        cy.contains('button', 'Refresh Status', { timeout: 3000000 }).should('be.visible').click();
        scrollAndWait();
        cy.removeAllListeners('window:alert');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
        clickYesIfExists(10000, 'last');
      } else {
        scrollAndWait();
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
      }
    },
    logoutStrategy as FinalAction
  );
};

/**
 * Approve SPAD Tester role (non-main flow)
 */
export const approveProjectSPADTester = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, false);
};

/**
 * Approve SPAD Tester role (main flow)
 */
export const approveProjectSPADTesterMain = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, true);
};

// ========================================
// SPAD DEPLOY APPROVAL FUNCTIONS
// ========================================

/**
 * Approve SPAD Deploy role
 * Promotes to ACTM
 */
export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To ACTM', { timeout: 3000000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};
