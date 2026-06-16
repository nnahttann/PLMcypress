// ========================
// MASTER.TS - REFACTORED VERSION
// Re-exports all functions from modular files
// Original file backed up at: Master_backup_original.ts (7108 lines)
// ========================

// Re-export types
export * from './Master/types';

// Re-export config (credentials, date utilities, constants)
export * from './Master/config';

// Re-export utility functions
export * from './Master/utils';

// Re-export core functions (ProjectManager, Login, Pagination)
export * from './Master/core';

// Re-export action functions (Claim, Approve, Assign)
export * from './Master/actions';

// Re-export approval functions (SPAD, CGMD, ACTM, OPER, etc.)
export * from './Master/approvals';

// Re-export PO enhancement functions
export * from './Master/po-enhancement';

// Re-export product configuration functions
export * from './Master/product-config';

// Re-export project setup functions
export * from './Master/project-setup';
