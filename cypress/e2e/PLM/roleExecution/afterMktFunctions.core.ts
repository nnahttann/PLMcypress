// ========================
// AFTER MKT FUNCTIONS
// ========================

import { executeCKSRole } from './cksRoleExecution.core';
import { afterCKSPOST } from './afterCksPost.core';
import { 
  checkAndFillContentType, checkAndUpdatePriority,
  checkAndUpdateVerticalAppPriority, smsCKSPOST, Tariff 
} from '../projectWorkflows/postSubmission.core';

export const afterMKTMAINPOST = (): void => {
  executeCKSRole('standard', 'main', () => {
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
    smsCKSPOST();
    Tariff();
  });
  afterCKSPOST();
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;

