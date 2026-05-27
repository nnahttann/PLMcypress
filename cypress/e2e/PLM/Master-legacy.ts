// ============================================================================================
// MASTER-LEGACY - RE-EXPORTS FROM MODULARIZED STRUCTURE
// ============================================================================================
// This file maintains backward compatibility by re-exporting functions from the new
// modularized structure. DO NOT add new logic here - only re-exports.
// ============================================================================================

// ========================================
// CONFIG & TYPES (from helpers)
// ========================================
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

// ========================================
// HELPER FUNCTIONS (from helpers)
// ========================================
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

export {
  login,
  loginAndWaitReady
} from './helpers/auth';

export {
  searchInTableWithPagination
} from './helpers/pagination';

export { ProjectManager } from './helpers/projectManager';

// ========================================
// PROJECT WORKFLOWS
// ========================================
export {
  ClaimProject,
  approveProject,
  assignTeamTask
} from './projectWorkflows/projectManagement';

export {
  registerProjectName,
  getProjectNameByIndex,
  runForAllProjects,
  getStandardProjectName,
  getOntopProjectName
} from './projectWorkflows/projectNameManagement';

// ========================================
// APPROVAL FLOWS
// ========================================
export {
  createFullPageApprovalFlow,
  createSimplePageApprovalFlow
} from './approvalFlows/baseFlows';

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

export {
  approveProjectACTM,
  approveProjectOPER,
  approveProjectAPO
} from './approvalFlows/simpleApprovals';

// ========================================
// ROLE EXECUTION FUNCTIONS
// ========================================
export {
  performSimpleClaimAndApprovalRole
} from './approvalFlows/roleHelpers';

export {
  afterCKSCommonPRE,
  afterCKSPREPlugin,
  afterMKTOntop_NotComplex,
  afterMKTMainPRE_FullSpadFlow,
  afterMKTMainPRE_NotComplex
} from './roleExecution/afterMktPre';

export {
  afterMKTMAINPOST,
  afterMKTMainUsagePOST
} from './roleExecution/afterMktFunctions';

export {
  afterCKSPOST
} from './roleExecution/afterCksPost';

export {
  afterMKTothersubgroup
} from './roleExecution/afterMktOtherSubgroup';

export {
  CKSroleRJ
} from './roleExecution/rejectNote';

export {
  performMusicRoles
} from './roleExecution/musicRoles';

// ========================================
// ADDITIONAL ROLE EXECUTION EXPORTS
// ========================================
export * from './roleExecution';
