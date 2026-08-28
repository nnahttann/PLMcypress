// ⚠️ ASSUMPTION: ไฟล์นี้วางอยู่ที่ PLM/_Reject/reject-flows.ts (1 ชั้นจาก PLM/)
// ถ้าวางที่อื่น ต้องปรับ '../master/...' ให้ตรงตำแหน่งจริง
import {
    cgccbs, cgccbspass, cgtcbs, cgtcbspass, cgcirb, cgcirbpass, cgtirb, cgtirbpass,
    spadsup, spadsuppass, spaddoer, spaddoerpass, spadtest, spadtestpass, spaddp, spaddppass,
    csisp, csisppass, aafsp, aafsppass, ssbsp, ssbsppass, cpcsp, cpcsppass,
    rom, rompass, ckseasyapp, ckseasyapppass, tscenter, tscenterpass,
} from '../master/config';
import { ClaimProject, approveProject, assignTeamTask} from '../master/claim-approve';
import { getStandardProjectName } from '../master/project-manager';
import { loginAndWaitReady } from '../master/helpers';
import {
    approveProjectCGMDPRE, approveProjectCGMDtesterPRE,
    approveProjectSPADSup, approveProjectSPADDOER, approveProjectSPADTester, approveProjectSPADdeploy,
    approveProjectCGMD, approveProjectCGMDtester,
} from '../master/approval-flows';
import { standardCksPoEnhancementFlow } from '../master/cks-role';
import type { GetProjectNameFn } from '../master/config';

const TIMEOUT = {
    SHORT: 15_000,
    MEDIUM: 60_000,
    NAV: 180_000,
} as const;

export const rejectRole = (roleLabel: string): void => {
    const noteText = `reject by ${roleLabel}`;

    cy.get('textarea[formcontrolname="noteDetail"]', { timeout: TIMEOUT.SHORT })
        .should('be.visible')
        .clear({ force: true })
        .type(noteText, { delay: 30 })
        .trigger('input', { bubbles: true, force: true })
        .trigger('change', { bubbles: true, force: true })
        .blur({ force: true });

    cy.contains('button', 'Add', { timeout: TIMEOUT.SHORT })
        .should('not.be.disabled')
        .click({ force: true });

    cy.wait(1000);

    cy.contains('button', 'Reject', { timeout: TIMEOUT.SHORT })
        .should('be.visible')
        .and('not.be.disabled')
        .click({ force: true });

    cy.log(`🚫 Rejected — role: "${roleLabel}", note: "${noteText}"`);
};

// ========================
// ========================
export const navigateAndReject = (
    user: any,
    pass: any,
    roleLabel: string,
    claimOptions?: { claimBy?: 'project' | 'po'; specificPoName?: string }
): void => {
    loginAndWaitReady(user, pass);
    const finalProjectName = Cypress.env('currentPoName') || getStandardProjectName();
    cy.log(`➡️ [Navigate-Then-Reject:${roleLabel}] "${finalProjectName}"`);

    ClaimProject(finalProjectName, claimOptions ?? { claimBy: 'po' });
    approveProject(finalProjectName); // แค่เดินเข้าหน้า approve เฉยๆ ยังไม่กด approve
    rejectRole(roleLabel);
};

// ========================
// RESUME HELPERS (สำหรับ role ที่ approveFn navigate เองในตัว เช่น SPAD/CGMD)
// ========================
const resumeSameLevel = (
    user: string,
    pass: string,
    approveFn: (projectName: string, opts?: any) => void,
    roleLabelForLog: string
): void => {
    loginAndWaitReady(user, pass);
    const finalProjectName = Cypress.env('currentPoName') || getStandardProjectName();
    cy.log(`🔁 [Resume-SameLevel:${roleLabelForLog}] "${finalProjectName}" ไม่ต้อง claim/assign ใหม่`);

    approveFn(finalProjectName, { searchBy: 'po' });
};

// ========================
// ========================
export const rejectSpadtestToSpaddoer = (): void => {
    navigateAndReject(spadtest, spadtestpass, 'Spadtest', { claimBy: 'po' });
    resumeSameLevel(spaddoer, spaddoerpass, approveProjectSPADDOER as any, 'Spaddoer');
};

export const rejectSpaddoerToCKS = (
    getProjectNameFn: GetProjectNameFn = getStandardProjectName,
    customSteps: () => void = () => { /* no-op */ },
    beforeApprove: () => void = () => { /* no-op */ }
): void => {
    navigateAndReject(spaddoer, spaddoerpass, 'Spaddoer', { claimBy: 'po' });
    cy.log('🔁 [Resume-CrossLevel:CKS] เรียก standardCksPoEnhancementFlow (เหมือน flow approve ปกติทุกขั้นตอน)');
    standardCksPoEnhancementFlow(getProjectNameFn, customSteps, beforeApprove);
};

export const rejectCKSToMKT = (
    cksUser: any,
    cksPass: any,
    mktUser: any,
    mktPass: any,
    mktApproveFn: (p: string, o?: any) => void,
    cksResumeGetProjectNameFn: GetProjectNameFn = getStandardProjectName,
    cksResumeCustomSteps: () => void = () => { /* no-op */ },
    cksResumeBeforeApprove: () => void = () => { /* no-op */ }
): void => {
    navigateAndReject(cksUser, cksPass, 'CKS', { claimBy: 'project' });

    loginAndWaitReady(mktUser, mktPass);
    const finalProjectName = Cypress.env('currentPoName') || getStandardProjectName();
    cy.log(`🔁 [Resume-SameLevel:MKT] "${finalProjectName}" ไม่ต้อง claim/assign ใหม่`);
    approveProject(finalProjectName);
    mktApproveFn(finalProjectName, { searchBy: 'po' });

    // ✅ ต่อ flow ไปข้างหน้าทันที เพราะลำดับปกติคือ MKT -> CKS เสมอ
    cy.log('🔁 [Continue-Forward] MKT approved กลับแล้ว -> เข้า CKS ต่อทันที (flow ปกติ MKT >> CKS)');
    standardCksPoEnhancementFlow(cksResumeGetProjectNameFn, cksResumeCustomSteps, cksResumeBeforeApprove);
};

export const rejectCgmdTesterToCgmdConfig = (): void => {
    navigateAndReject(cgtcbs, cgtcbspass, 'CGMD Tester', { claimBy: 'po' });
    resumeSameLevel(cgccbs, cgccbspass, approveProjectCGMDPRE as any, 'CGMD Config');
};

export const rejectCgmdConfigToCKS = (
    getProjectNameFn: GetProjectNameFn = getStandardProjectName,
    customSteps: () => void = () => { /* no-op */ },
    beforeApprove: () => void = () => { /* no-op */ }
): void => {
    navigateAndReject(cgccbs, cgccbspass, 'CGMD Config', { claimBy: 'po' });
    cy.log('🔁 [Resume-CrossLevel:CKS] เรียก standardCksPoEnhancementFlow (เหมือน flow approve ปกติทุกขั้นตอน)');
    standardCksPoEnhancementFlow(getProjectNameFn, customSteps, beforeApprove);
};

const SUPPORT_ROLE_CREDENTIALS: Record<'csisp' | 'aafsp' | 'ssbsp' | 'cpcsp', [any, any]> = {
    csisp: [csisp, csisppass],
    aafsp: [aafsp, aafsppass],
    ssbsp: [ssbsp, ssbsppass],
    cpcsp: [cpcsp, cpcsppass],
};

export const rejectSupportRoleToTSCenter = (
    supportRoleLabel: 'csisp' | 'aafsp' | 'ssbsp' | 'cpcsp'
): void => {
    const [supportUser, supportPass] = SUPPORT_ROLE_CREDENTIALS[supportRoleLabel];
    navigateAndReject(supportUser, supportPass, supportRoleLabel, { claimBy: 'project' });

    loginAndWaitReady(tscenter, tscenterpass);
    const finalProjectName = Cypress.env('currentPoName') || getStandardProjectName();
    cy.log(`🔁 [Resume-CrossLevel:TSCenter] "${finalProjectName}" ต้อง claim ใหม่ (from ${supportRoleLabel})`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: TIMEOUT.MEDIUM }).should('include', '/zenon/ts-center');
    cy.wait(500);
    cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');
    cy.scrollTo('bottom');
    cy.wait(500);
    cy.contains('button', 'Approve').should('be.visible').click({ force: true });
    cy.url({ timeout: TIMEOUT.SHORT * 2 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
};

export const rejectRomToCgmdConfig = (
    romOrEasyAppLabel: 'ROM' | 'Easy App ROM',
    cgmdConfigType: 'IRB' | 'CBS'
): void => {
    if (romOrEasyAppLabel === 'ROM') {
        navigateAndReject(rom, rompass, 'ROM', { claimBy: 'project' });
    } else {
        navigateAndReject(ckseasyapp, ckseasyapppass, 'Easy App ROM', { claimBy: 'project' });
    }

    if (cgmdConfigType === 'IRB') {
        resumeSameLevel(cgcirb, cgcirbpass, approveProjectCGMD as any, `CGMD Config IRB (from ${romOrEasyAppLabel})`);
    } else {
        resumeSameLevel(cgccbs, cgccbspass, approveProjectCGMDPRE as any, `CGMD Config CBS (from ${romOrEasyAppLabel})`);
    }
};
