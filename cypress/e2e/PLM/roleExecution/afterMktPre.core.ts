// ========================
// AFTER MKT PRE CORE FUNCTIONS
// ========================

import { performRoleTaskWithAssignment, performSimpleApprovalRole, performSimpleClaimAndApprovalRole } from '../approvalFlows/roleHelpers.core';
import {
  cgccbs, cgccbspass, cgtcbs, cgtcbspass,
  spadsup, spadsuppass, spaddoer, spaddoerpass,
  spadtest, spadtestpass, spaddp, spaddppass,
  actm, actmpass, apo, apopass
} from '../helpers/config.core';
import { approveProjectCGMDPRE, approveProjectCGMDtesterPRE, approveProjectCGMDPREMainNotComplex, approveProjectCGMDtesterPREPlugin } from '../approvalFlows/cgmdApprovals.core';
import { approveProjectSPADSup, approveProjectSPADDOER, approveProjectSPADTester, approveProjectSPADdeploy, approveProjectSPADSupCGMDPlugin } from '../approvalFlows/spadApprovals.core';
import { approveProjectACTM, approveProjectAPO } from '../approvalFlows/simpleApprovals.core';
import { performMusicRoles } from './musicRoles.core';
import { executeCKSRole, addauto5gCKS, diyflagCKS, unregister, dropdownRecurringCKS, dropdownRecurringCKSMain } from '../approvalFlows/cksApprovals';
import { checkAndFillContentType, checkAndUpdatePriority, checkAndUpdateVerticalAppPriority } from '../helpers/uiHelpers';
import { smsCKSPRE } from '../contentGeneration/smsCks.core';
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
  
  cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Starting role execution sequence with ${ordered.length} roles`);
  
  // รันทีละตัวแบบ Sequential ด้วย recursion
  const runNextRole = (index: number): void => {
    if (index >= ordered.length) {
      cy.log(`✅ [FLOW:${FLOW_PATTERN}] All roles completed`);
      return;
    }
    
    const currentTest = ordered[index];
    cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running role ${index + 1}/${ordered.length}: ${currentTest.name}`);
    
    // เรียก fn() แล้วรอให้เสร็จก่อนค่อยไปตัวถัดไป
    currentTest.fn();
    
    cy.log(`✅ [FLOW:${FLOW_PATTERN}] Completed: ${currentTest.name}`);
    
    // ใช้ cy.then() เพื่อรอให้ทุกอย่างใน fn() เสร็จก่อน แล้วค่อยเรียกตัวถัดไป
    cy.then(() => {
      runNextRole(index + 1);
    });
  };
  
  runNextRole(0);

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

  cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Starting plugin role execution sequence with ${ordered.length} roles`);
  
  // รันทีละตัวแบบ Sequential ด้วย recursion
  const runNextPluginRole = (index: number): void => {
    if (index >= ordered.length) {
      cy.log(`✅ [FLOW:${FLOW_PATTERN}] All plugin roles completed`);
      return;
    }
    
    const currentTest = ordered[index];
    cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running plugin role ${index + 1}/${ordered.length}: ${currentTest.name}`);
    
    currentTest.fn();
    
    cy.log(`✅ [FLOW:${FLOW_PATTERN}] Completed plugin role: ${currentTest.name}`);
    
    cy.then(() => {
      runNextPluginRole(index + 1);
    });
  };
  
  runNextPluginRole(0);

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

// ========================
// AFTER MKT ONTOP PRE FUNCTIONS
// ========================

export const afterMKTontopPRE = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'MUSIC');

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

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
    CopyDeductFail();
  });
};

export const afterMKTMainPRE_NotComplex = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
  });
  declarePluginRoleTests();
};
