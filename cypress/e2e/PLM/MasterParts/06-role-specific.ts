export const registerProjectName = (name: string, index: number = 0): void => {
  projectManager.register(name, index);
};

export const getProjectNameByIndex = (index: number = 0): string => {
  return projectManager.get(index);
};

export const runForAllProjects = (callback: (projectName: string) => void): void => {
  projectManager.runForAll((name) => callback(name));
};

export const getStandardProjectName = (): string => {
  return projectManager.get(projectManager.getCurrentIndex());
};

export const getOntopProjectName = (): string => formattedDateOntop as string;

// ========================
// SPAD APPROVAL FUNCTIONS
// ========================

const pollUntilSPADDeployReady = (maxAttempts = 24, intervalMs = 5000): void => {
  const attempt = (remaining: number): void => {
    cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
    cy.wait(intervalMs);

    cy.contains('button', 'Refresh Status', { timeout: 15000 })
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

// ─────────────────────────────────────────────
// SPAD Sup — Approve as complex / non-complex
// ─────────────────────────────────────────────
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
      cy.contains('button', buttonText, { timeout: 3000000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

