// ========================
// BARREL RE-EXPORT FILE
// ========================

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
    getTimeSuffix,
} from './master/config';
export type { Module, PriceType, ProductClass, TaskListHeader, FinalAction, CoreTaskCallback, ApproveFunction, GetProjectNameFn, ProjectBasicOptions } from './master/config';

// Project Manager
export {
    registerProjectName,
    getProjectNameByIndex,
    runForAllProjects,
    getStandardProjectName,
    getOntopProjectName,
} from './master/project-manager';

export {
    selectRandomOption,
    handleAddToUSMP,
    scrollAndWait,
    clickYesIfExists,
    getRandomPhone,
    login,
    loginAndWaitReady,
    searchInTableWithPagination,
} from './master/helpers';

// Claim & Approve
export {
    ClaimProject,
    approveProject,
    assignTeamTask,
    createFullPageApprovalFlow,
    createSimplePageApprovalFlow,
    navigateToWorkspace,
    performSimpleApprovalRole,
    performSimpleClaimAndApprovalRole,
} from './master/claim-approve';

// Approval Flows
export {
    approveProjectSPADSup,
    approveProjectSPADSupCGMDPlugin,
    approveProjectSPAD,
    approveProjectSPADDOER,
    approveProjectSPADDOERMain,
    approveProjectSPADTester,
    approveProjectSPADTesterMain,
    approveProjectSPADdeploy,
    approveProjectCGMD,
    approveProjectCGMDPRE,
    approveProjectCGMDPREMainNotComplex,
    approveProjectCGMDPREPlugin,
    approveProjectCGMDPREMain,
    approveProjectCGMDtester,
    approveProjectCGMDtesterPRE,
    approveProjectCGMDtesterPREPlugin,
    approveProjectACTM,
    approveProjectOPER,
    approveProjectTSCenter,
    approveProjectAPO,
} from './master/approval-flows';

// CKS Flows
export {
    executeCKSRole,
    standardCksPoEnhancementFlow,
    getTomorrowDateString,
    afterCKSCommon,
} from './master/cks-role';

// MKT Flows
export {
    beforeapproveCKS,
    beforeapproveCKSontop,
    afterCKSPOST,
    performMusicRoles,
    afterMKTontopPOST,
    afterMKTontopENTER,
    afterMKTontopMUSIC,
    afterMKTothersubgroup,
    afterMKTMAINPOST,
    afterMKTMainUsagePOST,
    afterCKSCommonPRE,
    afterCKSPREPlugin,
    afterMKTMainPRE_FullSpadFlow,
    afterMKTMainPRE_NotComplex,
    afterMKTOntop_NotComplex,
    afterMKTontopPRE,
    afterMKTontopPREENTER,
    afterMKTontopPREPlugin,
    afterMKTontopPREENTERPlugin,
    afterMKTontopPREMusicPlugin,
    afterMKTontopPREMUSIC,
    afterMKTontopPREUsage,
    afterMKTontopPREUsageEnter,
    afterMKTontopPREUsageMusic,
    beforeapproveMKT,
} from './master/flows';

// Project Creation
export {
    ProjectBasicInformationComplete,
    ProjectBasicInformationCompleteOtherPOSub,
    backBacicInfo,
    addFile,
    ProjectBasicInformationCompleteModify
} from './master/project-creation';

// Product Specs
export {
    RandomProductSpecification,
    Voice,
    Mms,
    Sms,
    WiFi,
    VerticalApp,
    CloudGame,
    EntertainmentPartnership,
    AIIPCamera,
    Karaoke,
    MusicStreaming,
    VRBT,
    InternetRandom,
} from './master/product-specs';

// Dropdowns & Randomizers
export {
    dropdownRecurringCKS,
    dropdownRecurringCKSMain,
    dropdownRecurringPreMainCKS,
    unregister,
    addauto5gCKS,
    diyflagCKS,
    Tariff,
    PriceExcluding,
    selectTargetGroup,
    dropdownPromotionGroup,
    targetgroup,
    RetryPattern,
} from './master/dropdowns-randomizers';

// SMS Wording
export {
    smsWording,
    smsWordingPRE,
    smsCKSPRE,
    smsCKSPOST,
} from './master/sms-wording';

// Priority Updaters
export {
    checkAndUpdatePriority,
    CopyDeductFail,
    checkAndFillContentType,
    checkAndUpdateVerticalAppPriority,
} from './master/priority-updaters';

// Human Touch Point
export {
    RandomHumanTouchPoint,
} from './master/human-touch-point';

// Re-export from po-wording-pools (used by external files)
export {
    createPOWordingPools,
    RandomRemark,
    RandomProjectDescription,
} from './Approve/po-wording-pools';

export * from './master/reject_flow';

export {
    performRoleTaskWithAssignment,
} from './master/claim-approve';

// Modify Section
export {
    selectModifySections,
    fillSelectedModifySections,
    fillProductDefinitionSection,
    fillSmsWordingSection,
} from './master/modify';