// ============================================================================================
// PLM TEST HELPERS - CENTRALIZED EXPORTS FROM MODULARIZED STRUCTURE
// ============================================================================================
// This file serves as the main entry point with centralized exports from organized modules.
// All logic is preserved - only organization has changed for maintainability.
//
// Module Organization:
// - helpers/          → Configuration, types, auth, project management, utilities, pagination
// - projectWorkflows/ → Project claiming, assignment, name management
// - approvalFlows/    → Base flows, SPAD approvals
// ============================================================================================

// ========================================
// HELPERS MODULE EXPORTS
// ========================================

// Configuration and Credentials
export {
  urlsit,
  MKTpre, MKTpre1, MKTpost, MKTpost1,
  cks, ckspass,
  cgcirb, cgcirbpass,
  cgccbs, cgccbspass,
  cgtcbs, cgtcbspass,
  cgtirb, cgtirbpass,
  actm, actmpass,
  oper, operpass,
  spadsup, spadsuppass,
  spaddoer, spaddoerpass,
  spadtest, spadtestpass,
  spaddp, spaddppass,
  apo, apopass,
  enter, enterpass,
  music, musicpass,
  tscenter, tscenterpass,
  aafsp, aafsppass,
  csisp, csisppass,
  e2etest, e2etestpass,
  aafdp, aafdppass,
  csidp, csidppass,
  e2edp, e2edppass,
  sasff, sasffpass,
  now,
  formattedDateMain,
  formattedDateOntop,
  setFormattedDateMain,
  setFormattedDateOntop,
  getDateFormattingInfo
} from './helpers/config';

// Types and Interfaces
export type {
  Module,
  PriceType,
  ProductClass,
  ProductClass1,
  TaskListHeader,
  FinalAction,
  CoreTaskCallback,
  ApproveFunction,
  GetProjectNameFn,
  EnhanceStepsCallback,
  ProjectBasicOptions
} from './helpers/types';

// Project Manager
export { ProjectManager, projectManager } from './helpers/projectManager';

// Utilities (credentials, string manipulation, UI helpers, random data)
export {
  getCredentials,
  getTimeSuffix,
  getTruncatedName,
  selectRandomOption,
  handleAddToUSMP,
  scrollAndWait,
  clickYesIfExists,
  clickButtonIfExists,
  getRandomPhone,
  generateAccessNumber
} from './helpers/utils';

// Authentication
export {
  login,
  loginAndWaitReady
} from './helpers/auth';

// Pagination
export {
  searchInTableWithPagination
} from './helpers/pagination';

// ========================================
// PROJECT WORKFLOWS MODULE EXPORTS
// ========================================

// Project Management (claim, approve, assign)
export {
  ClaimProject,
  approveProject,
  assignTeamTask
} from './projectWorkflows/projectManagement';

// Project Name Management
export {
  registerProjectName,
  getProjectNameByIndex,
  runForAllProjects,
  getStandardProjectName,
  getOntopProjectName
} from './projectWorkflows/projectNameManagement';

// ========================================
// APPROVAL FLOWS MODULE EXPORTS
// ========================================

// Base Approval Flows
export {
  createFullPageApprovalFlow,
  createSimplePageApprovalFlow
} from './approvalFlows/baseFlows';

// SPAD Approval Functions
export {
  approveProjectSPADSup,
  approveProjectSPADSupCGMDPlugin,
  approveProjectSPAD,
  approveProjectSPADDOER,
  approveProjectSPADDOERMain,
  approveProjectSPADTester,
  approveProjectSPADTesterMain,
  approveProjectSPADdeploy
} from './approvalFlows/spadApprovals';

// CGMD Approval Functions
export {
  approveProjectCGMD,
  approveProjectCGMDPRE,
  approveProjectCGMDPREMainNotComplex,
  approveProjectCGMDPREPlugin,
  approveProjectCGMDPREMain,
  approveProjectCGMDtester,
  approveProjectCGMDtesterPRE,
  approveProjectCGMDtesterPREPlugin
} from './approvalFlows/cgmdApprovals';

// Simple Approval Functions
export {
  approveProjectACTM,
  approveProjectOPER,
  approveProjectAPO
} from './approvalFlows/simpleApprovals';

// ========================================
// LEGACY ROLE EXECUTION EXPORTS
// ========================================
// Export functions from Master-legacy that orchestrate full role flows
export {
  afterCKSCommonPRE,
  afterCKSPREPlugin,
  afterMKTOntop_NotComplex,
  afterMKTMainPRE_FullSpadFlow,
  afterMKTMainPRE_NotComplex,
  afterMKTMAINPOST,
  afterMKTMainUsagePOST,
  afterCKSPOST,
  afterMKTothersubgroup,
  CKSroleRJ,
  performMusicRoles,
  performSimpleClaimAndApprovalRole
} from './Master-legacy';

// ============================================================================================
// REMAINING LEGACY CODE - STILL BEING REFACTORED
// ============================================================================================
// Functions below are still being extracted to dedicated modules.
// These are re-exports from Master-legacy.ts until they are properly modularized.
// ============================================================================================

// Import remaining unextracted content from the legacy file
// This ensures backward compatibility while refactoring continues
import * as LegacyCode from './Master-legacy';

export * from './Master-legacy';
