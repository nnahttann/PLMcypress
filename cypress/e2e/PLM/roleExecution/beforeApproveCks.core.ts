// ========================
// BEFORE APPROVE CKS
// ========================

import { standardBeforeApproveCKS } from '../approvalFlows/cksApprovals';
import { ClaimProject, approveProject } from '../projectWorkflows/projectManagement';
import { getStandardProjectName } from '../helpers/config.core';
import { approveProjectCGMD, approveProjectCGMDtester } from '../approvalFlows/cgmdApprovals.core';
import { approveProjectACTM, approveProjectOPER } from '../approvalFlows/simpleApprovals.core';

// Re-export approval functions for use in other modules
export { approveProjectCGMD, approveProjectCGMDtester, approveProjectACTM, approveProjectOPER };

export const beforeapproveCKS = (): void => {
  standardBeforeApproveCKS();
};

export const beforeapproveCKSontop = (): void => {
  standardBeforeApproveCKS();
};

