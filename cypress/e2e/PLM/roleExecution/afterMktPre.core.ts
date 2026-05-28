// ========================
// AFTER MKT PRE FUNCTIONS
// ========================

import { executeCKSRole } from './cksRoleExecution.core';
import { performRoleTaskWithAssignment, performSimpleClaimAndApprovalRole, performSimpleApprovalRole } from '../approvalFlows/roleHelpers.core';
import { 
  cgccbs, cgccbspass, cgtcbs, cgtcbspass, 
  spadsup, spadsuppass, spaddoer, spaddoerpass,
  spadtest, spadtestpass, spaddp, spaddppass,
  actm, actmpass, apo, apopass 
} from '../helpers/config';
import { 
  approveProjectCGMDPRE, approveProjectCGMDtesterPRE,
  approveProjectSPADSup, approveProjectSPADDOER,
  approveProjectSPADTester, approveProjectSPADdeploy,
  approveProjectACTM, approveProjectAPO 
} from './beforeApproveMkt.core';
import { smsCKSPRE } from '../contentGeneration/smsCks.core';
import { checkAndFillContentType, checkAndUpdatePriority, checkAndUpdateVerticalAppPriority } from '../helpers/uiHelpers';
import { CopyDeductFail } from '../productFeatures/copyDeductFail.core';

type FlowPattern = 'CGMD_FIRST' | 'SPAD_FIRST' | 'INTERLEAVED' | 'RANDOM';

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ✅ สุ่ม Pattern ครั้งเดียวตอนเริ่มไฟล์ (ปลอดภัยกับ Cypress)
const FLOW_PATTERN: FlowPattern = (() => {
  try {
    const env = (globalThis as any).Cypress?.env?.('FLOW_PATTERN');
    if (env && ['CGMD_FIRST', 'SPAD_FIRST', 'INTERLEAVED', 'RANDOM'].includes(env)) {
      return env as FlowPattern;
    }
  } catch { }
  const opts: FlowPattern[] = ['CGMD_FIRST', 'SPAD_FIRST', 'INTERLEAVED', 'RANDOM'];
  return opts[Math.floor(Math.random() * opts.length)];
})();


const declareTest = (name: string, fn: () => void): void => {
  it(name, () => {
    cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running: ${name}`);
    fn();
  });
};

const declareStandardRoleTests = (): void => {
  const tests: Array<{ name: string; group: 'CGMD' | 'SPAD' | 'OTHER'; fn: () => void }> = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS') },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS') },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup) },
    { name: 'Spaddoer role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER) },
    { name: 'Spadtester role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester) },
    { name: 'Spaddeploy role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy) },
    { name: 'ACTM role', group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM) },
    { name: 'APO role', group: 'OTHER', fn: () => performSimpleApprovalRole(apo, apopass, approveProjectAPO) },
  ];

  // ✅ จัดลำดับตาม Pattern
  let ordered: typeof tests = [];
  const cgmd = tests.filter(t => t.group === 'CGMD');
  const spad = tests.filter(t => t.group === 'SPAD');
  const other = tests.filter(t => t.group === 'OTHER');

  switch (FLOW_PATTERN) {
    case 'CGMD_FIRST':
      ordered = [...cgmd, ...spad, ...other];
      break;
    case 'SPAD_FIRST':
      ordered = [...spad, ...cgmd, ...other];
      break;
    case 'INTERLEAVED': {
      const res: typeof tests = [];
      const s = [...spad], c = [...cgmd];
      if (s.length) res.push(s.shift()!);
      while (c.length) res.push(c.shift()!);
      while (s.length) res.push(s.shift()!);
      ordered = [...res, ...other];
      break;
    }
    case 'RANDOM':
      ordered = shuffleArray([...tests]);
      break;
    default:
      ordered = tests;
  }
  ordered.forEach(t => declareTest(t.name, t.fn));
};
const declarePluginRoleTests = (): void => {
  const tests: Array<{ name: string; group: 'CGMD' | 'SPAD' | 'OTHER'; fn: () => void }> = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS') },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS') },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin) },
    { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN') },
    { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN') },
  ];

  let ordered: typeof tests = [];
  const cgmd = tests.filter(t => t.group === 'CGMD');
  const spad = tests.filter(t => t.group === 'SPAD');

  switch (FLOW_PATTERN) {
    case 'CGMD_FIRST':
      ordered = [...cgmd, ...spad];
      break;
    case 'SPAD_FIRST':
      ordered = [...spad, ...cgmd];
      break;
    case 'INTERLEAVED': {
      const res: typeof tests = [];
      const s = [...spad], c = [...cgmd];
      if (s.length) res.push(s.shift()!);
      while (c.length) res.push(c.shift()!);
      while (s.length) res.push(s.shift()!);
      ordered = res;
      break;
    }
    case 'RANDOM':
      ordered = shuffleArray([...tests]);
      break;
    default:
      ordered = tests;
  }

  ordered.forEach(t => declareTest(t.name, t.fn));
};

export const afterCKSCommonPRE_Internal = (): void => {
  declareStandardRoleTests();
};

export const afterCKSCommonPRE = (Module: string): void => {
  afterCKSCommonPRE_Internal();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

export const afterCKSPREPlugin = (Module: string): void => {
  declarePluginRoleTests();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

export const afterMKTOntop_NotComplex = (): void => {
  executeCKSRole('standard', 'ontop', () => {
    addauto5gCKS(); dropdownRecurringCKS(); diyflagCKS(); unregister();
    addauto5gCKS(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
  });
  declarePluginRoleTests();
};

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
    CopyDeductFail();
  });
  declareStandardRoleTests();
};

export const afterMKTMainPRE_NotComplex = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
  });
  declarePluginRoleTests();
};

// ========================
// ONTOP PRE FUNCTIONS (from Master-legacy)
// ========================

const _afterMKTontopPREWithModule = (
  afterFn: (module: string) => void,
  module: string
): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPRE);
  afterFn(module);
};

const stepsOntopPRE = (): void => {
  cy.wait(15000);
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  checkAndFillContentType();
  checkAndUpdatePriority();
  checkAndUpdateVerticalAppPriority();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

export const afterMKTontopPRE = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'MUSIC');

export const afterMKTontopPREUsage = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('PRE');
};

export const afterMKTontopPREUsageEnter = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('Enter');
};

export const afterMKTontopPREUsageMusic = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('MUSIC');
};

const stepsOntopPREUsage = (): void => {
  cy.wait(15000);
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  checkAndFillContentType();
  checkAndUpdatePriority();
  checkAndUpdateVerticalAppPriority();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

// =======================

const selectRandomDropdownRecurring = (): void => {
  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.wrap($options[randomIndex]).click({ force: true });
    cy.get('.mat-select-value').should('contain.text', selectedText);
  });

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);
  });
};
export const Randomdropdown = () => {
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="ontopConditionGroup"]';
    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          cy.get(selector).select(validOptions[randomIndex]);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="billPeriod"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const selectedValue = validOptions[randomIndex];

          cy.log(`Randomly selected Bill Period: ${selectedValue}`);

          // สั่ง Select ค่าที่สุ่มได้
          cy.get(selector).select(selectedValue);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });
  cy.get('body').then(($body) => {
    const tabSelector = 'a:contains("Money / Validity")';

    if ($body.find(tabSelector).length > 0) {
      cy.get(tabSelector).click();

      // คลิกปุ่ม +
      cy.get('button .glyphicon-plus').parent().click();

      // --- 1. Main Balance ---
      const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
      cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());

      // --- 2. Validity Main Balance & Unit ---
      cy.get('input[formcontrolname="validityFirstPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validityFirstPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement เพื่อเรียกใช้ .value ได้
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 3. Reward Balance ---
      const randomBalance2 = Math.floor(Math.random() * 500) + 50;
      cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());

      // --- 4. Validity Reward Balance & Unit ---
      cy.get('input[formcontrolname="validitySecondPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validitySecondPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 5. Usage Types (Dual List Box) ---
      cy.get('select[formcontrolname="availableListBox"]').then($select => {
        const options = $select.find('option');
        if (options.length > 0) {
          const randomIndex = Math.floor(Math.random() * options.length);
          // แก้ไข: Cast เป็น HTMLOptionElement
          const val = (options[randomIndex] as HTMLOptionElement).value;

          cy.get('select[formcontrolname="availableListBox"]').select(val);
          cy.get('button.str').click(); // ปุ่มเลื่อนไปขวา
        }
      });

      // --- 6. Description ---
      const randomDesc = `AutoTest_${Math.random().toString(36).substring(7)}`;
      cy.get('textarea[formcontrolname="balanceDescription"]').type(randomDesc);

      // --- กด Add ---
      cy.get('button').contains('Add').click();

    } else {
      cy.log('Skipped: Tab Money / Validity not found');
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .then($options => {
          const validOptions = [...$options]
            .map(o => (o as HTMLOptionElement).value)
            .filter(val => val !== '0: null');
          if (validOptions.length > 0) {
            const randomIndex = Math.floor(Math.random() * validOptions.length);
            cy.get(selector).select(validOptions[randomIndex]);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="recurringFeeDeduction"]';
    const $element = $body.find(selector);
    if ($element.length > 0 && $element.is(':visible')) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then(($options) => {
          const randomIndex = Math.floor(Math.random() * $options.length);
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
          cy.get(selector).select(valueToSelect);
        });
    } else {
      cy.log(`Skipped: ${selector} is not visible or not found`);
    }
  });
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="earlyRenewOfferingFlag"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="poType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });


  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;

            cy.get(selector).select(valueToSelect, { force: true });
          }
        });
    }
  });

}

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
