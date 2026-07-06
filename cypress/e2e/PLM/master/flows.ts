import { Module, cgccbs, cgccbspass, cgtcbs, cgtcbspass, spadsup, spadsuppass, spaddoer, spaddoerpass, spadtest, spadtestpass, spaddp, spaddppass, actm, actmpass, apo, apopass, oper, operpass, cgcirb, cgcirbpass, cgtirb, cgtirbpass, sasff, sasffpass, tscenter, tscenterpass, csisp, csisppass, aafsp, aafsppass, e2etest, e2etestpass, csidp, csidppass, aafdp, aafdppass, e2edp, e2edppass, music, musicpass } from './config';
import { executeCKSRole, getTomorrowDateString } from './cks-role';
import { ClaimProject, approveProject, performRoleTaskWithAssignment, performSimpleApprovalRole, performSimpleClaimAndApprovalRole } from './claim-approve';
import { getStandardProjectName } from './project-manager';
import { approveProjectCGMD, approveProjectCGMDPRE, approveProjectCGMDtester, approveProjectCGMDtesterPRE, approveProjectCGMDtesterPREPlugin, approveProjectCGMDPREMainNotComplex, approveProjectSPADSup, approveProjectSPADSupCGMDPlugin, approveProjectSPADDOER, approveProjectSPADTester, approveProjectSPADdeploy, approveProjectACTM, approveProjectAPO, approveProjectOPER } from './approval-flows';
import { checkAndUpdatePriority, checkAndUpdateVerticalAppPriority, CopyDeductFail, checkAndFillContentType } from './priority-updaters';
import { Tariff, dropdownRecurringCKSMain, dropdownRecurringCKS, unregister, addauto5gCKS, diyflagCKS,Topup } from './dropdowns-randomizers';
import { loginAndWaitReady } from './helpers';
import { smsCKSPOST, smsCKSPRE } from './sms-wording';

// ========================
// TYPE DEFINITIONS
// ========================
type FlowPattern = 'CGMD_FIRST' | 'SPAD_FIRST' | 'INTERLEAVED' | 'CGMD_SPAD_ALTERNATE_C' | 'CGMD_SPAD_ALTERNATE_S' | 'RANDOM';

const shuffleArray = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const FLOW_PATTERN: FlowPattern = (() => {
    const env = (globalThis as any).Cypress?.env?.('FLOW_PATTERN');
    const valid: FlowPattern[] = [
        'CGMD_FIRST',
        'SPAD_FIRST',
        'INTERLEAVED',
        'CGMD_SPAD_ALTERNATE_C',
        'CGMD_SPAD_ALTERNATE_S',
        'RANDOM',
    ];
    return valid.includes(env) ? (env as FlowPattern) : valid[Math.floor(Math.random() * valid.length)];
})();

const declareTest = (name: string, fn: () => void): void => {
    it(name, () => {
        cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running: ${name}`);
        fn();
    });
};

type TestEntry = { name: string; group: 'CGMD' | 'SPAD' | 'OTHER'; fn: () => void };

const SPAD_ORDER = ['Spadsup', 'Spaddoer', 'Spadtester', 'Spaddeploy'];
const CGMD_ORDER = ['Config', 'Tester'];

const sortSpad = (arr: TestEntry[]): TestEntry[] =>
    [...arr].sort((a, b) => {
        const ai = SPAD_ORDER.findIndex(k => a.name.includes(k));
        const bi = SPAD_ORDER.findIndex(k => b.name.includes(k));
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

const sortCgmd = (arr: TestEntry[]): TestEntry[] => {
    const isPlugin = (name: string) => name.includes('Plugin');

    const groups = new Map<boolean, TestEntry[]>();
    const order: boolean[] = [];

    arr.forEach(t => {
        const key = isPlugin(t.name);
        if (!groups.has(key)) {
            groups.set(key, []);
            order.push(key);
        }
        groups.get(key)!.push(t);
    });

    const result: TestEntry[] = [];
    order.forEach(key => {
        const group = [...groups.get(key)!].sort((a, b) => {
            const ai = CGMD_ORDER.findIndex(k => a.name.includes(k));
            const bi = CGMD_ORDER.findIndex(k => b.name.includes(k));
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });
        result.push(...group);
    });

    return result;
};
// ─────────────────────────────────────────────
// Standard flow — randomisable
// ─────────────────────────────────────────────
const declareRoleTests = (tests: TestEntry[]): void => {
    const byGroup = (g: TestEntry['group']) => tests.filter(t => t.group === g);
    const cgmd = sortCgmd(byGroup('CGMD'));
    const spad = sortSpad(byGroup('SPAD'));
    const other = byGroup('OTHER');

    const spadsup = spad.find(t => t.name.includes('Spadsup'));
    const spaddoer = spad.find(t => t.name.includes('Spaddoer'));
    const spadRest = sortSpad(spad.filter(t =>
        !t.name.includes('Spadsup') && !t.name.includes('Spaddoer')
    ));
    const cgmdConfig = cgmd.find(t => t.name.includes('Config'));
    const cgmdTester = cgmd.find(t => t.name.includes('Tester'));
    const cgmdRest = sortCgmd(cgmd.filter(t =>
        !t.name.includes('Config') && !t.name.includes('Tester')
    ));

    let ordered: TestEntry[];

    switch (FLOW_PATTERN) {
        case 'CGMD_FIRST':
            ordered = [...cgmd, ...spad, ...other];
            break;

        case 'SPAD_FIRST':
            ordered = [...spad, ...cgmd, ...other];
            break;

        case 'INTERLEAVED': {
            const s = [...spad];
            const c = [...cgmd];
            const interleaved: TestEntry[] = [];
            if (s.length) interleaved.push(s.shift()!); // Spadsup first
            interleaved.push(...c);
            interleaved.push(...s); // Spaddoer, Spadtester, Spaddeploy
            ordered = [...interleaved, ...other];
            break;
        }

        case 'CGMD_SPAD_ALTERNATE_C':
            ordered = [
                ...(cgmdConfig ? [cgmdConfig] : []),
                ...(spadsup ? [spadsup] : []),
                ...(cgmdTester ? [cgmdTester] : []),
                ...(spaddoer ? [spaddoer] : []),
                ...cgmdRest,
                ...spadRest,
                ...other,
            ];
            break;

        case 'CGMD_SPAD_ALTERNATE_S':
            ordered = [
                ...(spadsup ? [spadsup] : []),
                ...(cgmdConfig ? [cgmdConfig] : []),
                ...(spaddoer ? [spaddoer] : []),
                ...(cgmdTester ? [cgmdTester] : []),
                ...cgmdRest,
                ...spadRest,
                ...other,
            ];
            break;

        case 'RANDOM': {
            const mixed = shuffleArray([...cgmd, ...spad]);
            // lock Spadsup before Spaddoer
            const si = mixed.findIndex(t => t.name.includes('Spadsup'));
            const di = mixed.findIndex(t => t.name.includes('Spaddoer'));
            if (si !== -1 && di !== -1 && di < si) {
                [mixed[si], mixed[di]] = [mixed[di], mixed[si]];
            }
            // lock Config before Tester
            const ci = mixed.findIndex(t => t.name.includes('Config'));
            const ti = mixed.findIndex(t => t.name.includes('Tester'));
            if (ci !== -1 && ti !== -1 && ti < ci) {
                [mixed[ci], mixed[ti]] = [mixed[ti], mixed[ci]];
            }
            ordered = [...mixed, ...other];
            break;
        }

        default:
            ordered = [...cgmd, ...spad, ...other];
    }

    ordered.forEach(t => declareTest(t.name, t.fn));
};

const declarePluginTests = (tests: TestEntry[]): void => {
    const baseCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && !t.name.includes('Plugin')));
    const spads = sortSpad(tests.filter(t => t.group === 'SPAD'));
    const pluginCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && t.name.includes('Plugin')));
    const other = tests.filter(t => t.group === 'OTHER');

    const ordered: TestEntry[] = [
        ...baseCgmd, 
        ...spads,      
        ...pluginCgmd, 
        ...other,
    ];

    cy.log(`🔌 [PLUGIN FLOW] order: ${ordered.map(t => t.name).join(' → ')}`);
    ordered.forEach(t => declareTest(t.name, t.fn));
};

// ─────────────────────────────────────────────
// Test definitions
// ─────────────────────────────────────────────
const STANDARD_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'Spaddoer role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'Spadtester role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'Spaddeploy role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'ACTM role', group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'APO role', group: 'OTHER', fn: () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po' ,role: 'SPAD'}) },
];

const PLUGIN_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS',{ searchBy: 'po' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS',{ searchBy: 'po' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin, { searchBy: 'po',role: 'SPAD'}) },
    { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN',{ searchBy: 'po',role: 'SPAD'}) },
    { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN',{ searchBy: 'po',role: 'SPAD'}) },
];

// ========================
// AFTER MKT ONTOP FUNCTIONS POST
// ========================

export const afterMKTontopPOST = (): void => _afterMKTontopCommon('POST');
export const afterMKTontopENTER = (): void => _afterMKTontopCommon('ENTER');
export const afterMKTontopMUSIC = (): void => _afterMKTontopCommon('MUSIC');


const _afterMKTontopCommon = (module: string): void => {
    executeCKSRole('ontop', () => {
        checkAndFillContentType();
        checkAndUpdatePriority();
        checkAndUpdateVerticalAppPriority();
        smsCKSPOST();
    });

    afterCKSCommon(module);
};
const afterCKSCommon = (Module: string): void => {
    afterCKSPOST();
    if (Module === 'MUSIC') {
        performMusicRoles();
    }
};

// ========================
// AFTER MKT FUNCTIONS
// ========================
export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
    const sasffTest = (): void => {
        if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
            it('SASFF role', () => {
                loginAndWaitReady(sasff, sasffpass);
                const finalProjectName = getStandardProjectName();
                cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
                ClaimProject(finalProjectName);
                approveProject(finalProjectName);
                cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
                cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
                cy.wait(500);
                cy.scrollTo('bottom');
                cy.wait(500);
                cy.contains('button', 'Promote').should('be.visible').click({ force: true });
                cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
                cy.contains('button', 'Logout').should('be.visible').click();
            });
        }
    };

    if (Module === 'POST') {
        executeCKSRole(
            'standard',
            () => { },
            () => {
                it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
                it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
                sasffTest();
                it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
                it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
            }
        );

    } else if (Module === 'PRE') {
        executeCKSRole(
            'standard',
            () => { },
            () => {
                it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }));
                it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }));
                sasffTest();
                it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po', role: 'SPAD' }));
                it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po', role: 'SPAD' }));
                it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po', role: 'SPAD' }));
                it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po', role: 'SPAD' }));
                it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'SPAD' }));
                it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po', role: 'SPAD' }));
            }
        );
    }
};

export const afterMKTMAINPOST = (): void => {
    executeCKSRole(
        'standard',
        () => {
            checkAndFillContentType();
            checkAndUpdatePriority();
            checkAndUpdateVerticalAppPriority();
            smsCKSPOST();
            Tariff();
        },
        () => afterCKSPOST()
    );
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;
// ─────────────────────────────────────────────
// CKS-level exports
// ─────────────────────────────────────────────

export const afterCKSCommonPRE = (Module: string): void => {
    declareRoleTests(STANDARD_TESTS);
    if (Module === 'MUSIC') performMusicRoles();
};

export const afterCKSPREPlugin = (Module: string): void => {
    declareRoleTests(PLUGIN_TESTS);
    if (Module === 'MUSIC') performMusicRoles();
};

// ─────────────────────────────────────────────
// Shared CKS step blocks PRE
// ─────────────────────────────────────────────

const stepsCKSMain = (): void => {
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    Topup();
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
};

const stepsOntopPRE = (): void => {
    cy.wait(5000);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
    cy.scrollTo('bottom');
    smsCKSPRE();
};

const stepsOntopNotComplex = (): void => {
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
};

// ─────────────────────────────────────────────
// MKT Main exports
// ─────────────────────────────────────────────

export const afterMKTMainPRE_FullSpadFlow = (): void => {
    executeCKSRole(
        'standard',
        () => { stepsCKSMain(); CopyDeductFail('enhancement'); },
        () => declareRoleTests(STANDARD_TESTS)
    );
};

export const afterMKTMainPRE_NotComplex = (): void => {
    executeCKSRole(
        'standard',
        () => { stepsCKSMain(); CopyDeductFail('enhancement'); },
        () => declareRoleTests(PLUGIN_TESTS)
    );
};

export const afterMKTOntop_NotComplex = (): void => {
    executeCKSRole(
        'standard',
        stepsOntopNotComplex,
        () => declareRoleTests(PLUGIN_TESTS)
    );
};


// ─────────────────────────────────────────────
// MKT Ontop exports
// ─────────────────────────────────────────────

const _runOntop = (afterFn: (module: string) => void, module: string): void => {
    executeCKSRole(
        'ontop',
        stepsOntopPRE,
        () => afterFn(module)
    );
};

export const afterMKTontopPRE = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _runOntop(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _runOntop(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');
export const afterMKTontopPREUsage = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREUsageEnter = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREUsageMusic = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');

// ========================
// BEFORE APPROVE MKT
// ========================

export const beforeapproveMKT = (): void => {

    const semiEN = [
        'File description for this offering',
        'Attached file for product team review',
        'File description updated for this PO',
        'Supporting file for internal reference',
        'File description submitted for team review',
        'Updated file attached for consideration',
        'File pending sign-off and confirmation',
        'File description included for this submission',
    ];

    const semiTH = [
        'คำอธิบายไฟล์สำหรับข้อเสนอนี้',
        'ไฟล์แนบสำหรับทีมผลิตภัณฑ์',
        'อัปเดตคำอธิบายไฟล์สำหรับ PO นี้',
        'ไฟล์ประกอบสำหรับอ้างอิงภายใน',
        'คำอธิบายไฟล์ส่งให้ทีมตรวจสอบ',
        'แนบไฟล์ที่อัปเดตแล้วเพื่อประกอบการพิจารณา',
        'ไฟล์รอการลงนามและยืนยัน',
        'คำอธิบายไฟล์สำหรับการส่งมอบนี้',
    ];

    const useThai = Math.random() < 0.5;
    const pool = useThai ? semiTH : semiEN;
    let attachmentDesc = pool[Math.floor(Math.random() * pool.length)];

    const MAX_LEN = 120;
    if (attachmentDesc.length > MAX_LEN) attachmentDesc = attachmentDesc.substring(0, MAX_LEN - 3) + '...';

    cy.log(`📎 Attachment Description: ${attachmentDesc}`);
    cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
        .should('be.visible')
        .focus()
        .clear({ force: true })
        .type(attachmentDesc, { delay: 30 })
        .trigger('input', { bubbles: true, force: true })
        .trigger('change', { bubbles: true, force: true })
        .blur({ force: true });

    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    cy.get(':nth-child(3) > :nth-child(1) > .btn').click();
    cy.contains('.row', 'Approve memo')
        .find('input[type="checkbox"]')
        .check({ force: true });

    cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');
    cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
        .contains('Submit')
        .click();

    cy.wait('@postRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@submitApprove', { timeout: 120000 }).its('response.statusCode').should('eq', 200);

    // ===== 🔄 3. NAVIGATION & PROJECT WORKFLOW =====
    cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

    // cy.wait(3000); // ⚠️ Hard wait ไม่แนะนำ ใช้ cy.get('...').should('exist') แทนถ้าเป็นไปได้
    const finalProjectName = getStandardProjectName();
    cy.log(`✅ Project ใช้สำหรับ Claim: ${finalProjectName}`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    // ===== 📥 4. FINAL CHECK & SCROLL =====
    cy.wait('@postRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    cy.scrollTo('bottom');
    // cy.wait(500); // ⚠️ แทนที่ด้วย assertion ของ element ที่โผล่มาหลัง scroll จะเสถียรกว่า

    cy.url({ timeout: 120000 }).should('include', '/mkt/mktchecker');
    cy.get('button.btn.btn-xs.btn-primary').should('be.visible').click();
    cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

    // ===== 🚪 5. LOGOUT =====
    cy.contains('button', 'Logout').should('be.visible').click();
};

// ========================
// BEFORE APPROVE CKS (moved from cks-role)
// ========================

export const beforeapproveCKS = (): void => standardBeforeApproveCKS();
export const beforeapproveCKSontop = (): void => standardBeforeApproveCKS();

const standardBeforeApproveCKS = (): void => {
    // backToCksDoer();

    cy.contains('label', 'Fast Lane :').parent().next().find('input[type="checkbox"]').check();
    cy.get('.row.col-md-11').find('input[type="checkbox"]').check();

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.wait(['@getRequest'], { timeout: 30000 });

    cy.get('input[aria-label="Date input field"]').eq(1).type(getTomorrowDateString());

    cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');
    cy.contains('button', 'Approve').click();
    cy.wait('@submitApprove', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    cy.url({ timeout: 60000 }).should('include', '/#/workspace-home/workspace');
    cy.wait(3000);

    const finalProjectName = getStandardProjectName();
    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.url({ timeout: 60000 }).should('include', '/#/new-flow/home/newcks/cks-checker');
    cy.get('body', { timeout: 60000 }).should('be.visible');
    cy.scrollTo('bottom');
    cy.wait(500);

    cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
    cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');

    cy.contains('button', 'Approve To CGMD', { timeout: 60000 }).should('be.visible').click();

    cy.wait('@promoteChecker', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@assignCgmd', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    cy.url({ timeout: 60000 }).should('include', '/#/workspace-home/workspace');
    cy.wait(500);
    cy.contains('button', 'Logout').should('be.visible').click();
};

// ========================
// AFTER CKS POST (moved from cks-role)
// ========================

export const afterCKSPOST = (Module?: string): void => {
    it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
    it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
    it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
    it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
};

// ========================
// MUSIC ROLES (moved from cks-role)
// ========================

export const performMusicRoles = (): void => {
    it('TSCENTER role', () => {
        loginAndWaitReady(tscenter, tscenterpass);

        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName, { claimBy: 'project' });
        approveProject(finalProjectName);

        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
        cy.wait(500);
        cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');

        cy.scrollTo('bottom');
        cy.wait(500);
        cy.contains('button', 'Approve').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
    });

    const performSupportRole = (roleUser: any, rolePass: any, urlPart: string, btnText: string) => {
        it(`${urlPart} role`, () => {
            loginAndWaitReady(roleUser, rolePass);
            const finalProjectName = getStandardProjectName();
            cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
            ClaimProject(finalProjectName);
            approveProject(finalProjectName);
            cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

            let checkUrl = '';
            if (urlPart === 'csisp') checkUrl = '/zenon/csi-support';
            else if (urlPart === 'aafsp') checkUrl = '/zenon/aaf-support';
            else if (urlPart === 'csidp') checkUrl = '/zenon/csi-support';
            else if (urlPart === 'aafdp') checkUrl = '/zenon/aaf-support';
            else checkUrl = urlPart;

            cy.url({ timeout: 60000 }).should('include', checkUrl);
            cy.wait(500);
            cy.scrollTo('bottom');
            cy.wait(500);
            cy.contains('button', btnText).should('be.visible').click({ force: true });
            cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout').should('be.visible').click();
        });
    };

    performSupportRole(csisp, csisppass, 'csisp', 'Promote To E2E Tester');
    performSupportRole(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester');

    it('e2etest role', () => {
        loginAndWaitReady(e2etest, e2etestpass);
        const finalProjectName = getStandardProjectName();
        cy.log('🎯 Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
        cy.wait(500);
        cy.scrollTo('bottom');
        cy.wait(500);

        cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
        cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
            cy.get('input[type="file"][id="files"]').selectFile(
                { contents: Cypress.Buffer.from(fileContent, 'binary'), fileName: 'file.pdf', mimeType: 'application/pdf' },
                { force: true }
            );
        });
        cy.intercept('POST', '**/upload**').as('fileUpload');
        cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
    });

    it('MKT role', () => {
        loginAndWaitReady(music, musicpass);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
        cy.wait(500);
        cy.scrollTo('bottom');
        cy.wait(500);
        cy.contains('button', 'Approve').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
    });

    performSupportRole(csidp, csidppass, 'csidp', 'Promote To E2E Deploy');
    performSupportRole(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy');

    it('e2edp role', () => {
        loginAndWaitReady(e2edp, e2edppass);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
        cy.wait(500);
        cy.scrollTo('bottom');
        cy.wait(500);
        cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
    });
};
