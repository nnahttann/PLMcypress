import { createSimplePageApprovalFlow } from './baseFlows';
import { scrollAndWait } from '../helpers/uiHelpers';

// ========================================
// SIMPLE APPROVAL FUNCTIONS
// (Single-page approvals without complex logic)
// ========================================

/**
 * Approve ACTM role
 */
export const approveProjectACTM = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To OPER', { timeout: 3000000 }).should('be.visible').click();
    }
  );
};

/**
 * Approve OPER role
 */
export const approveProjectOPER = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/oper/oper-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To APO', { timeout: 3000000 }).should('be.visible').click();
    }
  );
};

/**
 * Approve APO role
 */
export const approveProjectAPO = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/apo/apo-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Approve', { timeout: 3000000 }).should('be.visible').click();
    }
  );
};
