// ========================
// PO ENHANCEMENT FUNCTIONS
// ========================

import { Module, GetProjectNameFn } from '../types/types-index';
import { getTomorrowDateString } from '../utils/utils-index';

const registerPoEnhancementIntercepts = (): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
  cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');
};

const handleProductNameTrim = (): void => {
  cy.get('input[formcontrolname="productName"]').each(($input) => {
    cy.wrap($input)
      .siblings('small')
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return;

        const currentCounter = parseInt(match[1], 10);
        const maxLen = parseInt(match[2], 10);

        cy.wrap($input).invoke('val').then((currentVal) => {
          const valStr = (currentVal || '').toString();
          let newVal = valStr.trimEnd();

          if (currentCounter > maxLen || valStr.length > maxLen) {
            newVal = newVal.substring(0, maxLen);
          }

          if (newVal !== valStr) {
            cy.log(`✏️ แก้ไข PO Name: "${valStr}" -> "${newVal}" (Max: ${maxLen})`);
            cy.wrap($input).clear().type(newVal).blur();
          }
        });
      });
  });
};

const handlePoDetailRoute = (customStepsCallback: () => void): void => {
  cy.wait('@getPoEnhDetail', { timeout: 30000 });
  cy.wait('@getCheckGenPoEnh', { timeout: 30000 });
  cy.wait('@getCheckSffEnh', { timeout: 30000 });

  handleProductNameTrim();
  cy.wait(800);
  customStepsCallback();
};

const handleAdditionalRoute = (customStepsCallback: () => void): void => {
  cy.log('ℹ️ Landed on mass-enh-additional route — skipping PO detail waits');
  cy.wait(800);
  customStepsCallback();
};

const enhanceSinglePO = (
  index: number,
  actualCount: number,
  projectPageUrl: string,
  customStepsCallback: () => void,
): void => {
  cy.log(`📦 [${index + 1}/${actualCount}] Starting Enhance PO loop`);

  registerPoEnhancementIntercepts();

  cy.get('button.btn-sample')
    .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
    .eq(index)
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

  cy.url()
    .should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
    .then((url) => {
      if (url.includes('mass-enh-product-offering-detail')) {
        handlePoDetailRoute(customStepsCallback);
      } else {
        handleAdditionalRoute(customStepsCallback);
      }

      backToCksDoer();

      if (index < actualCount - 1) {
        cy.log(`🔙 Done PO ${index + 1}. Navigating back to project page...`);
        cy.url().should('include', '/new-flow/home/newcks/cks-doer');
        cy.wait(3000);
      }
    });
};

export const standardCksPoEnhancementFlow = (
  getProjectNameFn: GetProjectNameFn,
  customStepsCallback: () => void,
  beforeApproveCallback: () => void = () => { },
  overrideProjectName?: string
): void => {
  const projectName = overrideProjectName || getProjectNameFn();
  const poCount: number = Cypress.env('poCount') ?? 1;
  const actualCount = Math.max(poCount, 1);

  cy.log(`🚀 Starting CKS PO Enhancement Flow for: ${projectName}`);
  cy.log(`📊 Total POs to enhance: ${actualCount}`);

  cy.visit('/#/new-flow/home/newcks/cks-doer');
  cy.get('app-cks-doer', { timeout: 30000 }).should('be.visible');

  cy.contains('td', projectName, { timeout: 30000 })
    .closest('tr')
    .find('span')
    .contains('Approve')
    .click();

  cy.url({ timeout: 30000 }).should('include', '/new-flow/project-home/cks-doer');
  cy.wait(2000);

  beforeApproveCallback();

  for (let i = 0; i < actualCount; i++) {
    enhanceSinglePO(i, actualCount, window.location.href, customStepsCallback);
  }

  cy.log(`✅ All ${actualCount} PO(s) enhanced successfully`);
};

export const backToCksDoer = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Back")').length > 0) {
      cy.contains('button', 'Back').click();
      cy.wait(800);
    }
  });
};

export const beforeapproveCKS = (): void => {
  cy.log('Executing beforeapproveCKS...');
};

export const beforeapproveCKSontop = (): void => {
  beforeapproveCKS();
};

export const afterCKSPOST = (Module?: string): void => {
  cy.log(`afterCKSPOST called with Module: ${Module}`);
};

export const afterMKTontopPOST = (): void => _afterMKTontopCommon('POST');
export const afterMKTontopENTER = (): void => _afterMKTontopCommon('ENTER');
export const afterMKTontopMUSIC = (): void => _afterMKTontopCommon('MUSIC');

const _afterMKTontopCommon = (module: string): void => {
  cy.log(`_afterMKTontopCommon called with module: ${module}`);
};

const afterCKSCommon = (Module: string): void => {
  cy.log(`afterCKSCommon called with Module: ${Module}`);
};

export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
  cy.log(`afterMKTothersubgroup: PoSubGroup=${PoSubGroup}, Module=${Module}`);
};

export const afterMKTMAINPOST = (): void => {
  cy.log('afterMKTMAINPOST called');
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;

export const afterCKSCommonPRE = (Module: string): void => {
  cy.log(`afterCKSCommonPRE called with Module: ${Module}`);
};

export const afterCKSPREPlugin = (Module: string): void => {
  cy.log(`afterCKSPREPlugin called with Module: ${Module}`);
};

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  cy.log('afterMKTMainPRE_FullSpadFlow called');
};

export const afterMKTMainPRE_NotComplex = (): void => {
  cy.log('afterMKTMainPRE_NotComplex called');
};

export const afterMKTOntop_NotComplex = (): void => {
  cy.log('afterMKTOntop_NotComplex called');
};

const _runOntop = (afterFn: (module: string) => void, module: string): void => {
  afterFn(module);
};

export const afterMKTontopPRE = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _runOntop(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _runOntop(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');
export const afterMKTontopPREUsage = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREUsageEnter = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREUsageMusic = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');
