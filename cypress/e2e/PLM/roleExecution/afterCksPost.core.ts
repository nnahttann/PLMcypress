// ========================
// AFTER CKS POST
// ========================

import { performRoleTaskWithAssignment, performSimpleApprovalRole } from '../approvalFlows/roleHelpers.core';
import { 
  cgcirb, cgcirbpass, cgtirb, cgtirbpass,
  actm, actmpass, oper, operpass 
} from '../helpers/config';
import { approveProjectCGMD, approveProjectCGMDtester, approveProjectACTM, approveProjectOPER } from './beforeApproveCks.core';

export const afterCKSPOST = (Module?: string): void => {
  it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
  it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
};

