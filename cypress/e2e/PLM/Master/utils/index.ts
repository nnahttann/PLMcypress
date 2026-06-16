// ========================
// UTILITY FUNCTIONS
// ========================

import { Module } from '../types';
import { MKTpre, MKTpre1, MKTpost, MKTpost1, enter, enterpass, music, musicpass } from '../config';

export const getCredentials = (module: Module): { user: string, pass: string } => {
  const credMap: Record<Module, { user: string, pass: string }> = {
    'POST': { user: MKTpost, pass: MKTpost1 },
    'PRE': { user: MKTpre, pass: MKTpre1 },
    'ENTER': { user: enter, pass: enterpass },
    'MUSIC': { user: music, pass: musicpass }
  };
  return credMap[module] || credMap['POST'];
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
      cy.wait(800);

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

      cy.wait(500);
    } else {
      cy.log('⚪ Add to USMP button not found, skipping...');
    }
  });
};

export const scrollAndWait = (ms: number = 2000): void => {
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

export const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, Math.min(count, arr.length));
};

export const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export const cleanEnglishText = (str: string): string => {
  return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

export const cleanThaiText = (str: string): string => {
  return str.replace(/[^ก-๙0-9\s]/g, '').trim();
};

export const limit = (str: string, maxLen: number): string => {
  return str.length > maxLen ? str.substring(0, maxLen).trim() : str;
};

export const limitAndCleanEN = (str: string, maxLen: number): string => {
  return limit(cleanEnglishText(str), maxLen);
};

export const limitAndCleanTH = (str: string, maxLen: number): string => {
  return limit(cleanThaiText(str), maxLen);
};

export const getAbbreviation = (word: string | undefined): string => {
  if (!word) return '';
  const abbreviations: Record<string, string> = {
    'Artificial Intelligence': 'AI',
    'Internet of Things': 'IoT',
    'Virtual Reality': 'VR',
    'Augmented Reality': 'AR',
    'Cloud Computing': 'Cloud',
    'Big Data': 'Data',
    'Machine Learning': 'ML',
    'Deep Learning': 'DL',
    'Blockchain': 'Chain'
  };
  return abbreviations[word] || word.substring(0, 3).toUpperCase();
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
  const separator = ' ';
  const maxBaseLength = maxLength - identifier.length - separator.length;
  const trimmedBase = baseName.length > maxBaseLength 
    ? baseName.substring(0, maxBaseLength).trim() 
    : baseName.trim();
  return `${trimmedBase}${separator}${identifier}`;
};
