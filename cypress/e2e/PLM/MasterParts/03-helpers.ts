// ========================
// HELPER FUNCTIONS
// ========================
import { Module, MKTpre, MKTpre1, MKTpost, MKTpost1, enter, enterpass, music, musicpass } from './01-types-and-constants';

export const getCredentials = (module: Module): { user: string, pass: string } => {
  const credMap: Record<Module, { user: string, pass: string }> = {
    'POST': { user: MKTpost, pass: MKTpost1 },
    'PRE': { user: MKTpre, pass: MKTpre1 },
    'ENTER': { user: enter, pass: enterpass },
    'MUSIC': { user: music, pass: musicpass }
  };
  return credMap[module] || credMap['POST'];
};

export const getTimeSuffix = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${day}${month} ${hours}${minutes}`;
};

export const getTruncatedName = (baseName: string, suffix: string, maxLength: number): string => {
  let finalName = `${baseName} ${suffix}`;
  if (finalName.length > maxLength) {
    const allowedLength = maxLength - suffix.length - 1;
    const trimmedPrefix = baseName.substring(0, allowedLength).trim();
    finalName = `${trimmedPrefix} ${suffix}`;
  }
  return finalName;
};

export const selectRandomOption = (labelName: string): void => {
  cy.contains('label', labelName).parent().next('div').find('mat-select').click();
  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
};

export const handleAddToUSMP = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Add to USMP")').length > 0) {
      cy.log('🟢 Found Add to USMP button, clicking...');
      cy.contains('button', 'Add to USMP').click();
      cy.wait(3500);

      cy.get('body').then(($b) => {
        if ($b.find('.modal.fade.in').length > 0) {
          cy.log('📦 Bootstrap modal detected');
          cy.get('.modal.fade.in')
            .first()
            .should('be.visible')
            .within(() => {
              cy.contains('button', /Close|OK|ปิด/i).click();
            });
        } else if ($b.find('.mat-dialog-container').length > 0) {
          cy.log('📦 Angular dialog detected');
          cy.get('.mat-dialog-container')
            .first()
            .should('be.visible')
            .within(() => {
              cy.contains('button', /Close|OK|ปิด/i).click();
            });
        } else {
          cy.log('⚠️ ไม่พบ modal/dialog — ข้ามการปิด');
        }
      });

      cy.wait(2000);
    } else {
      cy.log('⚪ Add to USMP button not found, skipping...');
    }
  });
};

export const scrollAndWait = (ms: number = 4000): void => {
  cy.scrollTo('bottom');
  cy.wait(ms);
};

export const clickYesIfExists = (timeout: number = 10000, position: 'first' | 'last' = 'last'): void => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Yes")').length > 0) {
      cy.get('button').contains('Yes', { timeout }).eq(position === 'first' ? 0 : -1).click();
    }
  });
};

export const clickButtonIfExists = (buttonText: string, timeout: number = 10000): void => {
  cy.get('body').then(($body) => {
    if ($body.find(`button:contains("${buttonText}")`).length > 0) {
      cy.contains('button', buttonText, { timeout }).click();
    }
  });
};

export const getRandomPhone = (): string => {
  return `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
};
