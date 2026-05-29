// ========================
// CKS ROLE EXECUTION
// ========================

import type { GetProjectNameFn } from '../helpers/types.core';
import { getStandardProjectName, getOntopProjectName, getOntopExtraProjectName, getOntopOnetimeProjectName } from '../projectWorkflows/projectNameManagement.core';
import { standardCksPoEnhancementFlow } from './cksPoEnhancement.core';
import { beforeapproveCKS, beforeapproveCKSontop } from './beforeApproveCks.core';

export const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop' | 'ontopextra' | 'ontoponetime',
  approvalType: 'main' | 'ontop' | 'ontopextra' | 'ontoponetime',
  customSteps: () => void
): void => {
  it('CKS role', () => {
    // ===== HARDCODE สำหรับทดสอบ =====
    // const HARDCODE_PROJECT_NAME = 'MOB PRE usage main 1905 1352';
    // const getProjectName: GetProjectNameFn = () => HARDCODE_PROJECT_NAME;
    // ================================

    const getProjectName: GetProjectNameFn = 
      projectNameStrategy === 'standard' ? getStandardProjectName :
      projectNameStrategy === 'ontopextra' ? getOntopExtraProjectName :
      projectNameStrategy === 'ontoponetime' ? getOntopOnetimeProjectName :
      getOntopProjectName;

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

