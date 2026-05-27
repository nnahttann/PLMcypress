// ========================
// CKS ROLE EXECUTION
// ========================

import type { GetProjectNameFn } from '../types';
import { getStandardProjectName, getOntopProjectName } from '../helpers/config';
import { standardCksPoEnhancementFlow } from './cksPoEnhancement.core';
import { beforeapproveCKS, beforeapproveCKSontop } from './beforeApproveCks.core';

const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
): void => {
  it('CKS role', () => {
    // ===== HARDCODE สำหรับทดสอบ =====
    // const HARDCODE_PROJECT_NAME = 'MOB PRE usage main 1905 1352';
    // const getProjectName: GetProjectNameFn = () => HARDCODE_PROJECT_NAME;
    // ================================

    const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard'
      ? getStandardProjectName
      : getOntopProjectName;

    standardCksPoEnhancementFlow(getProjectName, () => {
      customSteps();

      if (approvalType === 'main') {
        beforeapproveCKS();
      } else {
        beforeapproveCKSontop();
      }
    });
  });
};

