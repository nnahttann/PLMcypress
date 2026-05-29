// ========================================
// ROLE EXECUTION - CENTRALIZED EXPORTS
// ========================================

export * from './afterCksPost.core';
export * from './afterMktFunctions.core';
export * from './afterMktOtherSubgroup.core';
export * from './afterMktPre.core';
export * from './beforeApproveCks.core';
export * from './beforeApproveMkt.core';
export * from './cksPoEnhancement.core';
export * from './cksRoleExecution.core';
export * from '../productFeatures/diyFlagCks.core';
export * from './musicRoles.core';
export * from './rejectNote.core';
export * from './unregister.core';

// Import from approvalFlows for role helpers
export { performSimpleClaimAndApprovalRole } from '../approvalFlows/roleHelpers.core';
