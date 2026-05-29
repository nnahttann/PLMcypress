// ========================
// AFTER MKT FUNCTIONS
// ========================

import { executeCKSRole } from './cksRoleExecution.core';
import { afterCKSPOST } from './afterCksPost.core';
import { 
  checkAndFillContentType, checkAndUpdatePriority,
  checkAndUpdateVerticalAppPriority
} from '../helpers/uiHelpers';
import { smsCKSPOST } from '../contentGeneration/smsCks.core';
import { Tariff } from '../productFeatures/tariff.core';

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

