// ========================
// APPROVAL FUNCTIONS
// SPAD, CGMD, ACTM, OPER, etc.
// ========================

import { TaskListHeader, CoreTaskCallback, FinalAction } from '../types';
import { scrollAndWait, clickYesIfExists, selectRandomOption } from '../utils';

// Helper for approval flows
const createFullPageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback,
  finalAction: FinalAction
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.get('tbody tr').then(($rows) => {
      $rows.each((index, row) => {
        const text = Cypress.$(row).text().trim();
        cy.log(`Row ${index}: ${text.substring(0, 100)}`);
        if (text.includes(projectName)) {
          cy.log(`✅✅✅ MATCH at row ${index}`);
        }
      });
    });
    cy.contains('tbody tr', projectName, { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 30000 }).should('include', expectedUrl);

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 30000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response).to.exist;
        expect(interception.response!.statusCode).to.eq(200);
      });
    });

  coreTaskCallback();

  switch (finalAction) {
    case 'AlertAndLogout':
    case 'ComplexLogout':
      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      break;
    case 'StopAfterCore':
      cy.log('Core task finished. Stopping as requested.');
      break;
  }
};

const createSimplePageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 30000 }).should('include', expectedUrl);
  coreTaskCallback();
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
  cy.contains('button', 'Logout').click();
};

const pollUntilSPADDeployReady = (maxAttempts = 24, intervalMs = 5000): void => {
  const attempt = (remaining: number): void => {
    cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
    cy.wait(intervalMs);

    cy.contains('button', 'Refresh Status', { timeout: 10000 })
      .should('be.visible')
      .click();
    scrollAndWait();

    cy.get('body').then(($body) => {
      const $btn = $body.find('button').filter((_, el) => {
        const $el = Cypress.$(el);
        return (
          $el.text().trim().includes('Promote to SPAD Deploy') &&
          $el.closest('[hidden]').length === 0 &&
          $el.is(':visible') &&
          !$el.is(':disabled')
        );
      });

      if ($btn.length > 0) {
        cy.log('✅ Promote to SPAD Deploy button is ready');
      } else if (remaining > 0) {
        attempt(remaining - 1);
      } else {
        throw new Error('❌ Promote to SPAD Deploy button never became available after max attempts');
      }
    });
  };

  attempt(maxAttempts);
};

// SPAD Sup
const _approveSPADSup = (projectName: string, isComplex: boolean): void => {
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      cy.then(() => {
        const rnd5 = Math.floor(Math.random() * 90000) + 10000;
        const rnd2 = Math.floor(Math.random() * 90) + 10;

        cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').clear().type(rnd5.toString());
        cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').clear().type(rnd2.toString());
      });

      scrollAndWait();
      cy.contains('button', buttonText, { timeout: 30000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

export const approveProjectSPADSup = (projectName: string): void => _approveSPADSup(projectName, true);
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => _approveSPADSup(projectName, false);
export const approveProjectSPAD = (projectName: string, isComplex = true): void => _approveSPADSup(projectName, isComplex);

// SPAD Doer
const _approveSPADDoer = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      if (isMainFlow) {
        cy.wait(800);

        const fillRandom = (labelText: string, prefix: string) => {
          cy.get(`label:contains("${labelText}")`)
            .parent()
            .next('div')
            .find('input')
            .then(($input) => {
              const rnd = Math.floor(Math.random() * 90000) + 10000;
              cy.wrap($input).clear().type(`${prefix}${rnd}`);
            });
        };

        fillRandom('PACKAGE_TYPE', 'PT');
        fillRandom('PACKAGE_ID (PP ID)', 'PP');
        fillRandom('PACKAGE_SUB_TYPE', 'PST');
      }

      selectRandomOption('Gprs type');
      cy.wait(800);
      selectRandomOption('Template');

      scrollAndWait();
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 30000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectSPADDOER = (projectName: string): void => _approveSPADDoer(projectName, false);
export const approveProjectSPADDOERMain = (projectName: string): void => _approveSPADDoer(projectName, true);

// SPAD Tester
const _approveSPADTester = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      if (isMainFlow) {
        cy.wait(800);
        scrollAndWait();

        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
            throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
          }
        });

        cy.on('window:confirm', () => true);

        cy.contains('button', 'Send PlugIN', { timeout: 30000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });

        clickYesIfExists(10000, 'first');

        pollUntilSPADDeployReady();
        cy.removeAllListeners('window:alert');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 30000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });

        clickYesIfExists(10000, 'last');
      } else {
        scrollAndWait();
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 30000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });
      }
    },
    isMainFlow ? 'StopAfterCore' : 'AlertAndLogout'
  );
};

export const approveProjectSPADTester = (projectName: string): void => _approveSPADTester(projectName, false);
export const approveProjectSPADTesterMain = (projectName: string): void => _approveSPADTester(projectName, true);

// SPAD Deploy
export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To ACTM', { timeout: 30000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

// CGMD
export const approveProjectCGMD = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To SPAD Sup', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

export const approveProjectCGMDPRE = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-pre',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To CGMD', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

export const approveProjectCGMDPREMainNotComplex = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-pre',
    () => {
      cy.contains('label', 'Remark').closest('.col-md-4').find('textarea').type('PRE Main Not Complex');
      scrollAndWait();
      cy.contains('button', 'Promote To CGMD', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

export const approveProjectCGMDPREPlugin = approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREMain = approveProjectCGMDPREMainNotComplex;

export const approveProjectCGMDtester = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To ACTM', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

export const approveProjectCGMDtesterPRE = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester-pre',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To CGMD Tester', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

export const approveProjectCGMDtesterPREPlugin = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester-pre',
    () => {
      cy.contains('label', 'Remark').closest('.col-md-4').find('textarea').type('PRE Plugin');
      scrollAndWait();
      cy.contains('button', 'Promote To CGMD Tester', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

// ACTM
export const approveProjectACTM = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-tester',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To OPER', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

// OPER
export const approveProjectOPER = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/oper/oper-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To TSCenter', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

// TSCenter
export const approveProjectTSCenter = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/tscenter/tscenter-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To APO', { timeout: 30000 }).should('be.visible').click();
    }
  );
};

// APO
export const approveProjectAPO = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'To Do List',
    '/apo/apo-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Complete', { timeout: 30000 }).should('be.visible').click();
    }
  );
};
