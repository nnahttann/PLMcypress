import {
    Module, cgccbs, cgccbspass, cgtcbs, cgtcbspass, spadsup, spadsuppass, spaddoer, spaddoerpass, spadtest, spadtestpass, spaddp, spaddppass, actm, actmpass, apo, apopass, oper, operpass, cgcirb, cgcirbpass, cgtirb, cgtirbpass, sasff, sasffpass, tscenter, tscenterpass, csisp, csisppass, aafsp, aafsppass, e2etest, e2etestpass, csidp, csidppass, aafdp, aafdppass, e2edp, e2edppass, music, musicpass,
    ssbsp, ssbsppass, ssbdp, ssbdppass,
    cpcsp, cpcsppass, cpcdp, cpcdppass, rom, rompass,
    ckseasyapp, ckseasyapppass,
    aqss, aqsspass
} from './config';
import { executeCKSRole, getTomorrowDateString, standardCksPoEnhancementFlow } from './cks-role';
import { ClaimProject, approveProject, performRoleTaskWithAssignment, performSimpleApprovalRole, performSimpleClaimAndApprovalRole, projectExistsInTable } from './claim-approve';
import { getStandardProjectName, getOntopProjectName } from './project-manager';
import { approveProjectCGMD, approveProjectCGMDPRE, approveProjectCGMDtester, approveProjectCGMDtesterPRE, approveProjectCGMDtesterPREPlugin, approveProjectCGMDPREMainNotComplex, approveProjectSPADSup, approveProjectSPADSupCGMDPlugin, approveProjectSPADDOER, approveProjectSPADTester, approveProjectSPADdeploy, approveProjectACTM, approveProjectAPO, approveProjectOPER } from './approval-flows';
import { checkAndUpdatePriority, checkAndUpdateVerticalAppPriority, CopyDeductFail, checkAndFillContentType } from './priority-updaters';
import { Tariff, dropdownRecurringCKSMain, dropdownRecurringCKS, unregister, addauto5gCKS, diyflagCKS, Topup, RomID, runMassEnhConfigurationIfPresent } from './dropdowns-randomizers';
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

const runPoSequence = <T>(items: T[], action: (item: T, index: number) => void): void => {
    const step = (i: number): void => {
        if (i >= items.length) return;
        cy.then(() => {
            action(items[i], i);
        }).then(() => {
            step(i + 1);
        });
    };
    step(0);
};

const promoteToActmRole = (roleUser: any, rolePass: any, roleLabel: string): void => {
    loginAndWaitReady(roleUser, rolePass);

    const finalProjectName = Cypress.env('currentPoName') || getStandardProjectName();
    cy.log(`Project ใช้สำหรับ Claim (${roleLabel}): ${finalProjectName}`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.get('body', { timeout: 300000 }).should(($body) => {
        const hasPromote = $body.find('button:contains("Promote to ACTM")').length > 0;
        const hasApprove = $body.find('button:contains("Approve")').length > 0;
        expect(hasPromote || hasApprove, 'Promote to ACTM or Approve button should exist').to.be.true;
    });

    cy.get('body').then(($body) => {
        if ($body.find('button:contains("Promote to ACTM")').length > 0) {
            cy.contains('button', 'Promote to ACTM', { timeout: 20000 })
                .should('be.visible')
                .click({ force: true });
        } else {
            cy.contains('button', 'Approve', { timeout: 20000 })
                .should('be.visible')
                .click({ force: true });
        }
    });

    cy.url({ timeout: 300000 }).should('include', '/#/workspace-home/workspace');

    // ✅ FIX: รอให้ Logout เสร็จสมบูรณ์และกลับไปที่หน้า Login ก่อนจบฟังก์ชัน ป้องกัน Session Leak
    cy.contains('button', 'Logout').should('be.visible').click();
    cy.url({ timeout: 30000 }).should('include', '/login');
};

// ✅ ROM / Easy App ROM: เช็ค Env แบบยืดหยุ่น + Debug Log
const checkEnvFlag = (key: string): boolean => {
    const val = Cypress.env(key);
    const isTrue = val === true || String(val).toLowerCase() === 'true';
    console.log(`🔍 [ENV CHECK] ${key} = ${JSON.stringify(val)} → ${isTrue}`);
    return isTrue;
};

const shouldRunRomRole = (): boolean => checkEnvFlag('hasRom') || checkEnvFlag('hasEasyAppRom');
const shouldRunEasyAppRomRole = (): boolean => checkEnvFlag('hasEasyAppRom');
const shouldRunAqssAfterOper = (): boolean => checkEnvFlag('hasRom') || checkEnvFlag('hasEasyAppRom');
const shouldRunAqssAfterCgmd = (): boolean =>
    !shouldRunAqssAfterOper() && (checkEnvFlag('hasUssdDirect') || checkEnvFlag('hasUssdInteractive'));
const shouldRunAqssRole = (): boolean => shouldRunAqssAfterOper() || shouldRunAqssAfterCgmd();

const insertRomEasyAppRomRole = (ordered: TestEntry[]): TestEntry[] => {
    const result = [...ordered];
    const cgmdConfigIdx = result.findIndex(t => t.name.includes('CGMD Config'));
    const insertAt = cgmdConfigIdx === -1 ? 0 : cgmdConfigIdx + 1;

    const newEntries: TestEntry[] = [
        {
            name: 'ROM role (all POs)',
            group: 'OTHER',
            fn: () => {
                if (!shouldRunRomRole()) {
                    cy.log('⏭️ ข้าม ROM role — เงื่อนไข hasRom/hasEasyAppRom ไม่ตรงตอน runtime');
                    return;
                }
                const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
                if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) {
                    cy.log(`⏭️ ข้าม ROM role — ไม่พบชื่อ PO ที่ถูกต้อง`);
                    return;
                }

                runPoSequence(allPoNames, (activePoName, idx) => {
                    const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';
                    cy.log(`🚀 Running ROM role for: ${activePoName} ${poLabel}`);
                    Cypress.env('currentPoName', activePoName);
                    promoteToActmRole(rom, rompass, 'ROM');
                });
            },
        },
        {
            name: 'Easy App ROM role (all POs)',
            group: 'OTHER',
            fn: () => {
                if (!shouldRunEasyAppRomRole()) {
                    cy.log('⏭️ ข้าม Easy App ROM role — เงื่อนไข hasEasyAppRom ไม่ตรงตอน runtime');
                    return;
                }

                const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
                if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) {
                    cy.log(`⏭️ ข้าม Easy App ROM role — ไม่พบชื่อ PO ที่ถูกต้อง`);
                    return;
                }

                runPoSequence(allPoNames, (activePoName, idx) => {
                    const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';
                    cy.log(`🚀 Running Easy App ROM role for: ${activePoName} ${poLabel}`);
                    Cypress.env('currentPoName', activePoName);
                    promoteToActmRole(ckseasyapp, ckseasyapppass, 'Easy App ROM');
                });
            },
        }
    ];

    result.splice(insertAt, 0, ...newEntries);
    console.log(`✅ [SUCCESS] Inserted ROM/Easy App ROM test entries at index ${insertAt}`);
    return result;
};

const buildAqssEntries = (labelSuffix: string, guard: () => boolean): TestEntry[] => {
    // ✅ FIX: สร้าง entry เดียวที่วนลูป allPoNames ตอนรันจริง แทนการสร้างหลาย entry ตอนโหลด spec
    return [{
        name: `AQSS role (${labelSuffix}, all POs)`,
        group: 'OTHER',
        fn: () => {
            if (!guard()) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — เงื่อนไขไม่ตรงตอน runtime`);
                return;
            }

            const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
            if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — ไม่พบชื่อ PO ที่ถูกต้อง`);
                return;
            }

            runPoSequence(allPoNames, (activePoName, idx) => {
                const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';
                cy.log(`🚀 Running AQSS role (${labelSuffix}) for: ${activePoName} ${poLabel}`);
                Cypress.env('currentPoName', activePoName);
                promoteToActmRole(aqss, aqsspass, 'AQSS');
            });
        }
    }];
};

const insertAqssRole = (ordered: TestEntry[]): TestEntry[] => {
    let result = [...ordered];

    const cgmdConfigIdx = result.findIndex(t => t.name.includes('CGMD Config'));
    const cgmdInsertAt = cgmdConfigIdx === -1 ? 0 : cgmdConfigIdx + 1;
    const afterCgmdEntries = buildAqssEntries('after CGMD Config', shouldRunAqssAfterCgmd);
    result.splice(cgmdInsertAt, 0, ...afterCgmdEntries);

    const afterOperEntries = buildAqssEntries('after OPER/APO', shouldRunAqssAfterOper);
    result = [...result, ...afterOperEntries];

    console.log(`✅ [SUCCESS] Inserted AQSS entries`);
    return result;
};

const declareRoleTests = (
    tests: TestEntry[],
    opts?: { poLabel?: string; beforeEach?: () => void; musicModule?: string }
): void => {
    const poLabel = opts?.poLabel ?? '';
    const beforeEachFn = opts?.beforeEach;

    const byGroup = (g: TestEntry['group']) => tests.filter(t => t.group === g);
    const cgmd = sortCgmd(byGroup('CGMD'));
    const spad = sortSpad(byGroup('SPAD'));
    const other = byGroup('OTHER');

    const spadsup = spad.find(t => t.name.includes('Spadsup'));
    const spaddoer = spad.find(t => t.name.includes('Spaddoer'));
    const spadRest = sortSpad(spad.filter(t => !t.name.includes('Spadsup') && !t.name.includes('Spaddoer')));
    const cgmdConfig = cgmd.find(t => t.name.includes('Config'));
    const cgmdTester = cgmd.find(t => t.name.includes('Tester'));
    const cgmdRest = sortCgmd(cgmd.filter(t => !t.name.includes('Config') && !t.name.includes('Tester')));

    let ordered: TestEntry[];

    switch (FLOW_PATTERN) {
        case 'CGMD_FIRST': ordered = [...cgmd, ...spad, ...other]; break;
        case 'SPAD_FIRST': ordered = [...spad, ...cgmd, ...other]; break;
        case 'INTERLEAVED': {
            const s = [...spad]; const c = [...cgmd]; const interleaved: TestEntry[] = [];
            if (s.length) interleaved.push(s.shift()!);
            interleaved.push(...c); interleaved.push(...s);
            ordered = [...interleaved, ...other]; break;
        }
        case 'CGMD_SPAD_ALTERNATE_C':
            ordered = [...(cgmdConfig ? [cgmdConfig] : []), ...(spadsup ? [spadsup] : []), ...(cgmdTester ? [cgmdTester] : []), ...(spaddoer ? [spaddoer] : []), ...cgmdRest, ...spadRest, ...other]; break;
        case 'CGMD_SPAD_ALTERNATE_S':
            ordered = [...(spadsup ? [spadsup] : []), ...(cgmdConfig ? [cgmdConfig] : []), ...(spaddoer ? [spaddoer] : []), ...(cgmdTester ? [cgmdTester] : []), ...cgmdRest, ...spadRest, ...other]; break;
        case 'RANDOM': {
            const mixed = shuffleArray([...cgmd, ...spad]);
            const spadPositions = mixed.map((t, i) => ({ t, i })).filter(({ t }) => t.group === 'SPAD').map(({ i }) => i);
            const spadSorted = sortSpad(mixed.filter(t => t.group === 'SPAD'));
            spadPositions.forEach((pos, idx) => { mixed[pos] = spadSorted[idx]; });
            const cgmdPositions = mixed.map((t, i) => ({ t, i })).filter(({ t }) => t.group === 'CGMD').map(({ i }) => i);
            const ci = cgmdPositions.find(i => mixed[i].name.includes('Config'));
            const ti = cgmdPositions.find(i => mixed[i].name.includes('Tester'));
            if (ci !== undefined && ti !== undefined && ti < ci) { [mixed[ci], mixed[ti]] = [mixed[ti], mixed[ci]]; }
            ordered = [...mixed, ...other]; break;
        }
        default: ordered = [...cgmd, ...spad, ...other];
    }

    ordered = insertRomEasyAppRomRole(ordered);
    ordered = insertAqssRole(ordered);

    const musicFn = opts?.musicModule !== undefined ? buildMusicInsertFn(opts.musicModule) : null;
    let musicInsertPos = -1;
    if (musicFn) {
        const cgmdConfigIdx = ordered.findIndex(t => t.name.includes('CGMD Config'));
        const minPos = cgmdConfigIdx === -1 ? 0 : cgmdConfigIdx + 1;
        musicInsertPos = minPos + Math.floor(Math.random() * (ordered.length - minPos + 1));
        console.log(`🎵 [Music] จะแทรก Music/TSCENTER block ที่ index ${musicInsertPos}`);
    }

    ordered.forEach((t, idx) => {
        if (musicFn && idx === musicInsertPos) musicFn();
        const testName = poLabel ? `${t.name} ${poLabel}` : t.name;
        declareTest(testName, () => {
            if (beforeEachFn) beforeEachFn();
            t.fn();
        });
    });
    if (musicFn && musicInsertPos === ordered.length) musicFn();
};

const declarePluginTests = (
    tests: TestEntry[],
    opts?: { poLabel?: string; beforeEach?: () => void; musicModule?: string }
): void => {
    const poLabel = opts?.poLabel ?? '';
    const beforeEachFn = opts?.beforeEach;

    const baseCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && !t.name.includes('Plugin')));
    const spads = sortSpad(tests.filter(t => t.group === 'SPAD'));
    const pluginCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && t.name.includes('Plugin')));

    let ordered: TestEntry[] = [...baseCgmd, ...spads, ...pluginCgmd];
    ordered = insertRomEasyAppRomRole(ordered);
    ordered = insertAqssRole(ordered);

    console.log(`🔌 [PLUGIN FLOW] order: ${ordered.map(t => t.name).join(' → ')}`);

    const musicFn = opts?.musicModule !== undefined ? buildMusicInsertFn(opts.musicModule) : null;
    let musicInsertPos = -1;
    if (musicFn) {
        const cgmdConfigIdx = ordered.findIndex(t => t.name.includes('CGMD Config'));
        const minPos = cgmdConfigIdx === -1 ? 0 : cgmdConfigIdx + 1;
        musicInsertPos = minPos + Math.floor(Math.random() * (ordered.length - minPos + 1));
    }

    ordered.forEach((t, idx) => {
        if (musicFn && idx === musicInsertPos) musicFn();
        const testName = poLabel ? `${t.name} ${poLabel}` : t.name;
        declareTest(testName, () => {
            if (beforeEachFn) beforeEachFn();
            t.fn();
        });
    });
    if (musicFn && musicInsertPos === ordered.length) musicFn();
};

// Test definitions
const STANDARD_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spaddoer role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spadtester role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spaddeploy role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'ACTM role', group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM' }) },
    { name: 'APO role', group: 'OTHER', fn: () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po', role: 'APO' }) },
];

const PLUGIN_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN', { searchBy: 'po' }) },
    { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN', { searchBy: 'po' }) },
];

// ========================
// AFTER MKT ONTOP FUNCTIONS POST
// ========================
export const afterMKTontopPOST = (): void => _afterMKTontopCommon('POST');
export const afterMKTontopENTER = (): void => _afterMKTontopCommon('ENTER');
export const afterMKTontopMUSIC = (): void => _afterMKTontopCommon('MUSIC');

const _afterMKTontopCommon = (module: string): void => {
    executeCKSRole('ontop', () => {
        RomID();
        runMassEnhConfigurationIfPresent({ brandCount: 2, productGroupCount: 2, productPackageCount: 1, classAttributeCount: 5 });
        checkAndFillContentType();
        checkAndUpdatePriority();
        checkAndUpdateVerticalAppPriority();
        smsCKSPOST();
    });
    afterCKSCommon(module);
};

const afterCKSCommon = (Module: string): void => {
    afterCKSPOST(Module, { enableMusicInsert: true });
};

// ========================
// AFTER MKT FUNCTIONS
// ========================
export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
    const getPoNamesToProcess = (): string[] => {
        const allPoNames = Cypress.env('allPoNames') as string[] | undefined;
        if (allPoNames && allPoNames.length > 0) return allPoNames;
        const single = Cypress.env('poName') as string | undefined;
        return single ? [single] : [''];
    };

    const setCurrentPo = (poName: string): void => {
        Cypress.env('poName', poName);
        Cypress.env('currentPoName', poName);
    };

    const registerSasffTest = (): void => {
        if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
            it('SASFF role (all POs)', () => {
                const poNames = getPoNamesToProcess();
                cy.log(`🔁 SASFF: Total PO to process: ${poNames.length}`);

                // ✅ FIX: forEach เดิม set env + เรียก cy command (loginAndWaitReady/ClaimProject/...) แบบ
                // synchronous ทำให้ currentPoName ของทุก PO ถูกเขียนทับเหลือแค่ตัวสุดท้ายก่อน cy command
                // จะรันจริง — ใช้ runPoSequence ให้ set env "ตอนคิวถึงจริง" ของ PO นั้นๆ แทน
                runPoSequence(poNames, (poName, idx) => {
                    const poLabel = poNames.length > 1 ? `[PO ${idx + 1}/${poNames.length}]` : '';
                    if (!poName) cy.log(`⚠️ WARNING: poName ว่างเปล่าที่ index ${idx} ${poLabel}`);

                    setCurrentPo(poName);
                    loginAndWaitReady(sasff, sasffpass);

                    cy.log(`Project ใช้สำหรับ Claim (PO mode) ${poLabel}: ${poName}`);
                    ClaimProject(poName, { specificPoName: poName });
                    approveProject(poName);

                    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
                    cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
                    cy.wait(500);
                    cy.scrollTo('bottom');
                    cy.wait(500);
                    cy.contains('button', 'Promote').should('be.visible').click({ force: true });
                    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
                    cy.contains('button', 'Logout').should('be.visible').click();
                    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX: รอให้ logout สมบูรณ์
                });
            });
        }
    };

    const runAqssIfNeeded = (poName: string, guard: () => boolean, labelSuffix: string): void => {
        if (!guard()) {
            cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — เงื่อนไขไม่ตรงตอน runtime`);
            return;
        }
        if (!poName || poName === 'Default_PO' || poName.startsWith('PO_')) {
            cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — ไม่พบชื่อ PO ที่ถูกต้อง (ค่าปัจจุบัน: ${poName})`);
            return;
        }
        setCurrentPo(poName);
        cy.log(`🚀 [afterMKTothersubgroup] Running AQSS role (${labelSuffix}) for: ${poName}`);
        promoteToActmRole(aqss, aqsspass, 'AQSS');
    };

    // ✅ FIX: เดิม runRoleForAllPos ใช้ poNames.forEach(...) แล้วเรียก setCurrentPo + action() ข้างใน
    // ซึ่งมีปัญหาเดียวกับด้านบน (env ถูกตั้งค่าล่วงหน้าทั้งหมดก่อน cy command จะรันจริง) เปลี่ยนมาใช้
    // runPoSequence เพื่อให้แต่ละ PO ได้ context ของตัวเองตอน cy command ที่เกี่ยวข้องรันจริง
    const runRoleForAllPos = (
        label: string,
        getPoNames: () => string[],
        action: (poName: string, idx: number, poLabel: string) => void
    ): void => {
        it(label, () => {
            const poNames = getPoNames();
            cy.log(`🔁 ${label}: Total PO to process: ${poNames.length}`);
            runPoSequence(poNames, (poName, idx) => {
                const poLabel = poNames.length > 1 ? `[PO ${idx + 1}/${poNames.length}]` : '';
                if (!poName) cy.log(`⚠️ WARNING: poName ว่างเปล่าที่ index ${idx} ${poLabel}`);
                setCurrentPo(poName);
                action(poName, idx, poLabel);
            });
        });
    };

    if (Module === 'POST') {
        executeCKSRole('standard', () => { }, () => {
            it('CGMD Config IRB role (all POs)', () => { performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'); });
            runRoleForAllPos('AQSS role (after CGMD Config, all POs)', getPoNamesToProcess, (poName, idx, poLabel) => { runAqssIfNeeded(poName, shouldRunAqssAfterCgmd, `after CGMD Config ${poLabel}`); });
            it('CGMD Tester IRB role (all POs)', () => { performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'); });
            registerSasffTest();
            it('ACTM role (all POs)', () => { performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM' }); });
            it('OPER role (all POs)', () => { performSimpleApprovalRole(oper, operpass, approveProjectOPER, { searchBy: 'po', role: 'OPER' }); });
            runRoleForAllPos('AQSS role (after OPER/APO, all POs)', getPoNamesToProcess, (poName, idx, poLabel) => { runAqssIfNeeded(poName, shouldRunAqssAfterOper, `after OPER/APO ${poLabel}`); });
        });
    } else if (Module === 'PRE') {
        executeCKSRole('standard', () => { }, () => {
            it('CGMD Config cbs role (all POs)', () => { performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }); });
            runRoleForAllPos('AQSS role (after CGMD Config, all POs)', getPoNamesToProcess, (poName, idx, poLabel) => { runAqssIfNeeded(poName, shouldRunAqssAfterCgmd, `after CGMD Config ${poLabel}`); });
            it('CGMD Tester CBS role (all POs)', () => { performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }); });
            registerSasffTest();
            it('Spadsup role (all POs)', () => { performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po', role: 'SPAD' }); });
            it('Spaddoer role (all POs)', () => { performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po', role: 'SPAD' }); });
            it('Spadtester role (all POs)', () => { performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po', role: 'SPAD' }); });
            it('Spaddeploy role (all POs)', () => { performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po', role: 'SPAD' }); });
            it('ACTM role (all POs)', () => { performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM' }); });
            it('APO role (all POs)', () => { performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po', role: 'APO' }); });
            runRoleForAllPos('AQSS role (after OPER/APO, all POs)', getPoNamesToProcess, (poName, idx, poLabel) => { runAqssIfNeeded(poName, shouldRunAqssAfterOper, `after OPER/APO ${poLabel}`); });
        });
    }
};

export const afterMKTMAINPOST = (): void => {
    executeCKSRole('standard', () => {
        RomID();
        checkAndFillContentType();
        checkAndUpdatePriority();
        checkAndUpdateVerticalAppPriority();
        smsCKSPOST();
        Tariff();
    }, () => afterCKSPOST(undefined, { enableMusicInsert: true }));
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;
export const afterCKSCommonPRE = (Module: string): void => { declareRoleTests(STANDARD_TESTS, { musicModule: Module }); };
export const afterCKSPREPlugin = (Module: string): void => { declarePluginTests(PLUGIN_TESTS, { musicModule: Module }); };

const stepsCKSMain = (): void => {
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    Topup();
    RomID();
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
};

const stepsOntopPRE = (): void => {
    cy.wait(5000);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    RomID();
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

export const afterMKTOntop_NotComplex = (): void => {
    executeCKSRole('standard', stepsOntopNotComplex, () => declarePluginTests(PLUGIN_TESTS, { musicModule: 'PRE' }));
};

const shouldCopyDeductFailEnhancement = (): boolean => {
    const module = Cypress.env('currentModule');
    const priceType = Cypress.env('currentPriceType');
    const productClass = Cypress.env('currentProductClass');
    const result = module === 'PRE' && priceType === 'recurring' && productClass === 'main';
    cy.log(`🔎 [shouldCopyDeductFailEnhancement] module="${module}", priceType="${priceType}", productClass="${productClass}" → ${result}`);
    return result;
};

const runCopyDeductFailIfNeeded = (): void => {
    if (shouldCopyDeductFailEnhancement()) {
        CopyDeductFail('enhancement');
    } else {
        cy.log('⚠️ ข้าม CopyDeductFail("enhancement") — เงื่อนไขไม่ตรง (ต้องเป็น Module=PRE, PriceType=recurring, ProductClass=main)');
    }
};

export const afterMKTMainPRE_FullSpadFlow = (): void => {
    executeCKSRole('standard', () => { stepsCKSMain(); runCopyDeductFailIfNeeded(); }, () => declareRoleTests(STANDARD_TESTS, { musicModule: 'PRE' }));
};

export const afterMKTMainPRE_NotComplex = (): void => {
    executeCKSRole('standard', () => { stepsCKSMain(); runCopyDeductFailIfNeeded(); }, () => declarePluginTests(PLUGIN_TESTS, { musicModule: 'PRE' }));
};

const _runOntop = (afterFn: (module: string) => void, module: string): void => {
    executeCKSRole('ontop', stepsOntopPRE, () => afterFn(module));
};

export const afterMKTontopPRE = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREPlugin = (): void => _runOntop(afterCKSPREPlugin, 'PRE');
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
        'File description for this offering', 'Attached file for product team review',
        'File description updated for this PO', 'Supporting file for internal reference',
        'File description submitted for team review', 'Updated file attached for consideration',
        'File pending sign-off and confirmation', 'File description included for this submission'
    ];
    const semiTH = [
        'คำอธิบายไฟล์สำหรับข้อเสนอนี้', 'ไฟล์แนบสำหรับทีมผลิตภัณฑ์',
        'อัปเดตคำอธิบายไฟล์สำหรับ PO นี้', 'ไฟล์ประกอบสำหรับอ้างอิงภายใน',
        'คำอธิบายไฟล์ส่งให้ทีมตรวจสอบ', 'แนบไฟล์ที่อัปเดตแล้วเพื่อประกอบการพิจารณา',
        'ไฟล์รอการลงนามและยืนยัน', 'คำอธิบายไฟล์สำหรับการส่งมอบนี้'
    ];

    const useThai = Math.random() < 0.5;
    const pool = useThai ? semiTH : semiEN;
    let attachmentDesc = pool[Math.floor(Math.random() * pool.length)];

    const MAX_LEN = 120;
    if (attachmentDesc.length > MAX_LEN) {
        attachmentDesc = attachmentDesc.substring(0, MAX_LEN - 3) + '...';
    }

    cy.log(`📎 Attachment Description: ${attachmentDesc}`);

    // 1. กรอกข้อมูล Description
    cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
        .should('be.visible')
        .focus()
        .type('{selectall}{backspace}')
        .type(attachmentDesc, { delay: 30 })
        .trigger('input', { bubbles: true, force: true })
        .trigger('change', { bubbles: true, force: true })
        .blur({ force: true });

    // 2. ตั้ง Intercept สำหรับ Debug และรอ API
    cy.intercept({ method: 'POST', url: '**' }, (req) => {
        console.log(`🌐 POST seen: ${req.url}`);
    }).as('anyPost');

    cy.intercept({ method: 'PUT', url: '**' }, (req) => {
        console.log(`🌐 PUT seen: ${req.url}`);
    }).as('anyPut');

    cy.intercept('POST', /upload/i).as('fileUpload');
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // 3. กดปุ่ม Upload
    cy.contains('button', 'Upload', { timeout: 10000 })
        .should('be.visible')
        .and('not.be.disabled')
        .click({ force: true });

    cy.wait('@fileUpload', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    // 4. ตรวจสอบ Attachment History
    cy.contains('h4', 'Attachment History')
        .closest('.panel')
        .find('table tbody')
        .should('not.contain.text', 'No data to display.');

    // 5. ติ๊ก Approve memo
    cy.contains('.row', 'Approve memo').find('input[type="checkbox"]').check({ force: true });

    // 6. ตั้ง Intercept รอไว้ "ก่อน" กด Submit
    cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');

    // 7. กดปุ่ม Submit
    cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
        .contains('Submit')
        .should('not.be.disabled', { timeout: 15000 })
        .click({ force: true });


    cy.wait('@submitApprove', { timeout: 60000 }).then((interception) => {
        const statusCode = interception.response?.statusCode;
        const body = interception.response?.body;

        cy.log(`📩 submitApprove response status: ${statusCode}`);

        // เช็ค business-level error ใน body (ปรับ field ให้ตรงกับ schema จริงของ API นี้)
        const bodyIndicatesError =
            body && (body.success === false || body.error || body.errorCode || body.errorMessage);

        if (bodyIndicatesError) {
            throw new Error(`❌ submitApprove responded 200 but body indicates failure: ${JSON.stringify(body)}`);
        }

        expect(statusCode, 'submitApprove HTTP status').to.eq(200);
    });

    cy.get('body').then($body => {
        const $modal = $body.find('.modal-title.text-danger:contains("Validate Result")');

        if ($modal.length > 0) {
            const errors = $modal.closest('.modal')
                .find('.alert-danger, .text-danger')
                .toArray()
                .map(el => Cypress.$(el).text().trim())
                .filter(text => text.length > 0)
                .join(' | ');

            cy.get('.modal-footer .btn-danger').contains('Close').click({ force: true });
            throw new Error(`❌ Approve blocked by Validate Result modal: ${errors || 'No specific error message found'}`);
        }
    });

    cy.get('.modal-title.text-danger:contains("Validate Result")', { timeout: 3000 })
        .should('not.exist');

    cy.wait('@postRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

    // 8. ตรวจสอบการเปลี่ยนหน้าและดำเนินการต่อ
    cy.url({ timeout: 120000000 }).should('include', '/#/workspace-home/workspace');

    const finalProjectName = getStandardProjectName();
    cy.log(`✅ Project ใช้สำหรับ Claim: ${finalProjectName}`);

    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);

    cy.wait('@postRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    cy.scrollTo('bottom');
    cy.url({ timeout: 120000000 }).should('include', '/mkt/mktchecker');
    cy.get('button.btn.btn-xs.btn-primary').should('be.visible').click();
    cy.url({ timeout: 120000000 }).should('include', '/#/workspace-home/workspace');
};

// ========================
// BEFORE APPROVE CKS
// ========================
export const beforeapproveCKS = (): void => { executeCKSRole('standard', () => { }); };
export const beforeapproveCKSontop = (): void => { executeCKSRole('ontop', () => { }); };

// ========================
// AFTER CKS POST
// ========================
export const afterCKSPOST = (Module?: string, opts?: { enableMusicInsert?: boolean }): void => {
    const enableMusicInsert = opts?.enableMusicInsert ?? false;

    it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB', { searchBy: 'po' }));

    const restSteps: (() => void)[] = [];

    restSteps.push(() => {
        it('AQSS role (after CGMD Config)', () => {
            if (!shouldRunAqssAfterCgmd()) { cy.log('⏭️ ข้าม AQSS role (after CGMD Config)'); return; }
            const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
            if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) { cy.log('⏭️ ข้าม AQSS role — ไม่พบชื่อ PO ที่ถูกต้อง'); return; }

            runPoSequence(allPoNames, (activePoName, idx) => {
                const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';
                cy.log(`🚀 [afterCKSPOST] Running AQSS role for: ${activePoName} ${poLabel}`);
                Cypress.env('currentPoName', activePoName);
                promoteToActmRole(aqss, aqsspass, 'AQSS');
            });
        });
    });

    restSteps.push(() => {
        it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB', { searchBy: 'po' }));
    });

    // ✅ FIX: รวม ROM และ Easy App ROM เป็น it() เดียวที่วนลูป allPoNames ตอนรันจริง ผ่าน runPoSequence
    // แทน forEach ธรรมดา เพื่อไม่ให้ currentPoName ถูกเขียนทับล่วงหน้าเหลือแค่ PO ตัวสุดท้าย
    restSteps.push(() => {
        it('ROM & Easy App ROM roles (all POs)', () => {
            const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
            if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) { cy.log('⏭️ ข้าม ROM/Easy App ROM role — ไม่พบชื่อ PO ที่ถูกต้อง'); return; }

            runPoSequence(allPoNames, (activePoName, idx) => {
                const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';

                if (shouldRunRomRole()) {
                    cy.log(`🚀 Running ROM role for: ${activePoName} ${poLabel}`);
                    Cypress.env('currentPoName', activePoName);
                    promoteToActmRole(rom, rompass, 'ROM');
                }
                if (shouldRunEasyAppRomRole()) {
                    cy.log(`🚀 Running Easy App ROM role for: ${activePoName} ${poLabel}`);
                    Cypress.env('currentPoName', activePoName);
                    promoteToActmRole(ckseasyapp, ckseasyapppass, 'Easy App ROM');
                }
            });
        });
    });

    restSteps.push(() => { it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM' })); });
    restSteps.push(() => { it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER, { searchBy: 'po', role: 'OPER' })); });

    restSteps.push(() => {
        it('AQSS role (after OPER/APO)', () => {
            if (!shouldRunAqssAfterOper()) { cy.log('⏭️ ข้าม AQSS role (after OPER/APO)'); return; }
            const allPoNames = (Cypress.env('allPoNames') as string[]) || [Cypress.env('currentPoName')];
            if (!allPoNames || allPoNames.length === 0 || allPoNames[0]?.startsWith('PO_')) { cy.log('⏭️ ข้าม AQSS role — ไม่พบชื่อ PO ที่ถูกต้อง'); return; }

            runPoSequence(allPoNames, (activePoName, idx) => {
                const poLabel = allPoNames.length > 1 ? `[PO ${idx + 1}/${allPoNames.length}]` : '';
                cy.log(`🚀 [afterCKSPOST] Running AQSS role (after OPER/APO) for: ${activePoName} ${poLabel}`);
                Cypress.env('currentPoName', activePoName);
                promoteToActmRole(aqss, aqsspass, 'AQSS');
            });
        });
    });

    if (enableMusicInsert) {
        const musicFn = buildMusicInsertFn(Module);
        if (musicFn) {
            const insertPos = Math.floor(Math.random() * (restSteps.length + 1));
            console.log(`🎵 [afterCKSPOST] จะแทรก Music/TSCENTER block ที่ index ${insertPos}`);
            restSteps.splice(insertPos, 0, musicFn);
        }
    }

    restSteps.forEach(step => step());
};

// ========================
// MUSIC ROLES
// ========================
const shouldRunMusicFullChain = (Module?: string): boolean => Module === 'MUSIC' || checkEnvFlag('hasYoutubePremium');
const shouldRunTscenterOnly = (): boolean => checkEnvFlag('hasCloudGame');

const buildMusicInsertFn = (Module?: string): (() => void) | null => {
    if (shouldRunMusicFullChain(Module)) {
        return () => { console.log('🎬 [Dispatcher] Running FULL performMusicRoles() chain'); performMusicRoles(); };
    }
    if (shouldRunTscenterOnly()) {
        return () => { console.log('☁️ [Dispatcher] Running TSCENTER role only'); performTscenterRoleOnly(); };
    }
    return null;
};

export const runMusicOrTscenterIfNeeded = (Module?: string): void => {
    const fn = buildMusicInsertFn(Module);
    if (fn) fn();
};

const runTscenterCore = (): void => {
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
    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
};

const runSupportRoleCore = (roleUser: any, rolePass: any, urlPart: string, btnText: string): void => {
    loginAndWaitReady(roleUser, rolePass);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    let checkUrl = '';
    if (urlPart === 'csisp' || urlPart === 'csidp') checkUrl = '/zenon/csi-support';
    else if (urlPart === 'aafsp' || urlPart === 'aafdp') checkUrl = '/zenon/aaf-support';
    else if (urlPart === 'ssbsp' || urlPart === 'ssbdp') checkUrl = '/zenon/ssb-support';
    else if (urlPart === 'cpcsp' || urlPart === 'cpcdp') checkUrl = '/zenon/cpc-support';
    else checkUrl = urlPart;

    projectExistsInTable('Unassigned Task', finalProjectName).then((projectFound) => {
        if (!projectFound) {
            cy.log(`⚠️ ไม่พบ Project "${finalProjectName}" สำหรับ role ${urlPart} — ข้ามไปทำ role ถัดไป`);
            cy.get('body').then(($b2) => {
                if ($b2.find('button:contains("Logout")').length > 0) {
                    cy.contains('button', 'Logout').click({ force: true });
                    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
                }
            });
            return;
        }

        ClaimProject(finalProjectName, { claimBy: 'project' });
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

        cy.url({ timeout: 60000 }).should('include', checkUrl);
        cy.wait(500);
        cy.scrollTo('bottom');
        cy.wait(500);
        cy.contains('button', btnText).should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
        cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
    });
};

const runE2eTestCore = (): void => {
    loginAndWaitReady(e2etest, e2etestpass);
    const finalProjectName = getStandardProjectName();
    cy.log('🎯 Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName, { claimBy: 'project' });
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
    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
};

const runMktRoleCore = (): void => {
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
    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
};

const runE2eDpCore = (): void => {
    loginAndWaitReady(e2edp, e2edppass);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName, { claimBy: 'project' });
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
    cy.wait(500);
    cy.scrollTo('bottom');
    cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
    cy.url({ timeout: 30000 }).should('include', '/login'); // ✅ FIX
};

const runFullMusicChainCore = (): void => {
    runTscenterCore();
    runSupportRoleCore(csisp, csisppass, 'csisp', 'Promote To E2E Tester');
    runSupportRoleCore(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester');
    runSupportRoleCore(ssbsp, ssbsppass, 'ssbsp', 'Promote To E2E Tester');
    runSupportRoleCore(cpcsp, cpcsppass, 'cpcsp', 'Promote To E2E Tester');
    runE2eTestCore();
    runMktRoleCore();
    runSupportRoleCore(csidp, csidppass, 'csidp', 'Promote To E2E Deploy');
    runSupportRoleCore(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy');
    runSupportRoleCore(ssbdp, ssbdppass, 'ssbdpp', 'Promote To E2E Deploy');
    runSupportRoleCore(cpcdp, cpcdppass, 'cpcdp', 'Promote To E2E Deploy');
    runE2eDpCore();
};

export const performTscenterRoleOnly = (): void => { it('TSCENTER role', () => runTscenterCore()); };

export const performMusicRoles = (): void => {
    it('TSCENTER role', () => runTscenterCore());
    it('csisp role', () => runSupportRoleCore(csisp, csisppass, 'csisp', 'Promote To E2E Tester'));
    it('aafsp role', () => runSupportRoleCore(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester'));
    it('ssbsp role', () => runSupportRoleCore(ssbsp, ssbsppass, 'ssbsp', 'Promote To E2E Tester'));
    it('cpcsp role', () => runSupportRoleCore(cpcsp, cpcsppass, 'cpcsp', 'Promote To E2E Tester'));
    it('e2etest role', () => runE2eTestCore());
    it('MKT role', () => runMktRoleCore());
    it('csidp role', () => runSupportRoleCore(csidp, csidppass, 'csidp', 'Promote To E2E Deploy'));
    it('aafdp role', () => runSupportRoleCore(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy'));
    it('ssbdp role', () => runSupportRoleCore(ssbdp, ssbdppass, 'ssbdpp', 'Promote To E2E Deploy'));
    it('cpcdp role', () => runSupportRoleCore(cpcdp, cpcdppass, 'cpcdp', 'Promote To E2E Deploy'));
    it('e2edp role', () => runE2eDpCore());
};

export const runMusicOrTscenterRuntimeChecked = (Module?: string): void => {
    it('Music/TSCENTER role (runtime-checked)', () => {
        // ✅ FIX: ใช้ checkEnvFlag() แทน `=== true` ตรงๆ ด้วยเหตุผลเดียวกับด้านบน
        const hasYoutubePremium = checkEnvFlag('hasYoutubePremium');
        const hasCloudGame = checkEnvFlag('hasCloudGame');

        cy.log(`🔍 [Music/TSCENTER runtime check] Module="${Module}" hasYoutubePremium=${hasYoutubePremium} hasCloudGame=${hasCloudGame}`);

        if (Module === 'MUSIC' || hasYoutubePremium) {
            cy.log('🎬 [Dispatcher] Running FULL music chain (runtime)');
            runFullMusicChainCore();
        } else if (hasCloudGame) {
            cy.log('☁️ [Dispatcher] Running TSCENTER only (Cloud Game, runtime)');
            runTscenterCore();
        } else {
            cy.log('⏭️ ข้าม Music/TSCENTER role — ไม่เข้าเงื่อนไขตอน runtime');
        }
    });
};