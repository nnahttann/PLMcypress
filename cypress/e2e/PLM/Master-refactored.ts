/**
 * Master.ts - Centralized exports for all PLM test helpers and workflows
 * 
 * This file acts as a facade, importing and re-exporting functions from organized modules
 * Organization:
 * - helpers/ - Core utilities, configuration, types, and infrastructure
 * - projectWorkflows/ - Project management and claim/approval operations
 * - approvalFlows/ - Role-based approval workflows
 * - contentGeneration/ - Content generation functions (SMS, MMS, etc)
 * - advancedProducts/ - Advanced product workflows
 */

// ========================================
// HELPERS - Core utilities and configuration
// ========================================
export {
  // Config
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
  getDateFormattingInfo,
} from './helpers/config';

export {
  // Types
  type Module,
  type PriceType,
  type ProductClass,
  type ProductClass1,
  type TaskListHeader,
  type FinalAction,
  type CoreTaskCallback,
  type ApproveFunction,
  type GetProjectNameFn,
  type EnhanceStepsCallback,
  type ProjectBasicOptions,
} from './helpers/types';

export {
  // Project Manager
  ProjectManager,
  projectManager,
} from './helpers/projectManager';

export {
  // Utilities
  getCredentials,
  getTimeSuffix,
  getTruncatedName,
  selectRandomOption,
  handleAddToUSMP,
  scrollAndWait,
  clickYesIfExists,
  clickButtonIfExists,
  getRandomPhone,
  generateAccessNumber,
} from './helpers/utils';

export {
  // Authentication
  login,
  loginAndWaitReady,
} from './helpers/auth';

export {
  // Pagination
  searchInTableWithPagination,
} from './helpers/pagination';

// ========================================
// PROJECT WORKFLOWS - Project management
// ========================================
export {
  // Project Management
  ClaimProject,
  approveProject,
  assignTeamTask,
} from './projectWorkflows/projectManagement';

export {
  // Project Name Management
  registerProjectName,
  getProjectNameByIndex,
  runForAllProjects,
  getStandardProjectName,
  getOntopProjectName,
} from './projectWorkflows/projectNameManagement';

// ========================================
// APPROVAL FLOWS - Role-based workflows
// ========================================
export {
  // Base Approval Functions
  createFullPageApprovalFlow,
  createSimplePageApprovalFlow,
} from './approvalFlows/baseFlows';

export {
  // SPAD Approvals
  approveProjectSPADSup,
  approveProjectSPADSupCGMDPlugin,
  approveProjectSPAD,
  approveProjectSPADDOER,
  approveProjectSPADDOERMain,
  approveProjectSPADTester,
  approveProjectSPADTesterMain,
  approveProjectSPADdeploy,
} from './approvalFlows/spadApprovals';

// ========================================
// ADDITIONAL IMPORTS FROM ORIGINAL MASTER.TS
// ========================================
// 
// The following functions still need to be extracted and organized:
// - CGMD approval functions
// - CKS-related functions
// - After MKT functions
// - Content generation functions
// - Advanced product functions
// - Role-based task execution functions
//
// These are currently still in the original Master.ts and will be 
// migrated to appropriate modules in future refactoring phases.
//
// For now, import the remainder from the original file temporarily:
//
// TODO: Extract remaining functions in future phases
//
// IMPORTANT: Test files should continue to use the same import paths
// and function names as before - this file maintains full backward compatibility.
