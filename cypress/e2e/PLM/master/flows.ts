import { Module, cgccbs, cgccbspass, cgtcbs, cgtcbspass, spadsup, spadsuppass, spaddoer, spaddoerpass, spadtest, spadtestpass, spaddp, spaddppass, actm, actmpass, apo, apopass, oper, operpass, cgcirb, cgcirbpass, cgtirb, cgtirbpass, sasff, sasffpass, tscenter, tscenterpass, csisp, csisppass, aafsp, aafsppass, e2etest, e2etestpass, csidp, csidppass, aafdp, aafdppass, e2edp, e2edppass, music, musicpass, ssbsp, ssbsppass, ssbdp, ssbdppass, cpcsp, cpcsppass, cpcdp, cpcdppass, rom, rompass, ckseasyapp, ckseasyapppass, aqss, aqsspass } from './config';
import { executeCKSRole, getTomorrowDateString, standardCksPoEnhancementFlow } from './cks-role';
import { ClaimProject, approveProject, performRoleTaskWithAssignment, performSimpleApprovalRole, performSimpleClaimAndApprovalRole, projectExistsInTable, buildSearchKeywords, countRowsByProjectCode } from './claim-approve';
import { getStandardProjectName, getOntopProjectName } from './project-manager';
import { approveProjectCGMD, approveProjectCGMDPRE, approveProjectCGMDtester, approveProjectCGMDtesterPRE, approveProjectCGMDtesterPREPlugin, approveProjectCGMDPREMainNotComplex, approveProjectSPADSup, approveProjectSPADSupCGMDPlugin, approveProjectSPADDOER, approveProjectSPADTester, approveProjectSPADdeploy, approveProjectACTM, approveProjectAPO, approveProjectOPER } from './approval-flows';
import { checkAndUpdatePriority, checkAndUpdateVerticalAppPriority, CopyDeductFail, checkAndFillContentType } from './priority-updaters';
import { Tariff, dropdownRecurringCKSMain, dropdownRecurringCKS, unregister, addauto5gCKS, diyflagCKS, Topup, RomID, runMassEnhConfigurationIfPresent } from './dropdowns-randomizers';
import { loginAndWaitReady } from './helpers';
import { smsCKSPOST, smsCKSPRE } from './sms-wording';

type FlowPattern = 'CGMD_FIRST' | 'SPAD_FIRST' | 'INTERLEAVED' | 'CGMD_SPAD_ALTERNATE_C' | 'CGMD_SPAD_ALTERNATE_S' | 'RANDOM';
const LOADER_SELECTOR = '.loading-curtain, .spinner, [class*="loading"]:visible';
const waitForLoadingState = (): void => {
    cy.get('body').then(($body) => {
        const hasActiveLoader = $body.find(LOADER_SELECTOR).length > 0;
        if (hasActiveLoader) {
            cy.get(LOADER_SELECTOR, { timeout: 50000 }).should('not.exist');
        }
        else {
            cy.wait(500);
        }
    });
};
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

type TestEntry = {
    name: string;
    group: 'CGMD' | 'SPAD' | 'OTHER';
    fn: () => void;
};

const SPAD_ORDER = ['Spadsup', 'Spaddoer', 'Spadtester', 'Spaddeploy'];
const CGMD_ORDER = ['Config', 'Tester'];

const sortSpad = (arr: TestEntry[]): TestEntry[] => [...arr].sort((a, b) => {
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
    const allProjectCodes: string[] = (Cypress.env('allProjectCodes') as string[]) ?? [];
    const poCount: number = Cypress.env('poCount') ?? 1;

    cy.log(`🔁 [${roleLabel}] Project: ${finalProjectName} | Total PO (env): ${poCount} | codes: [${allProjectCodes.join(', ')}]`);

    const logoutIfPresent = (): void => {
        cy.get('body').then(($body) => {
            if ($body.find('button:contains("Logout")').length > 0) {
                cy.contains('button', 'Logout').should('be.visible').click();
                cy.url({ timeout: 30000 }).should('include', '/login');
            }
        });
    };

    const clickPromoteOrApprove = (): void => {
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
    };

    // ✅ FIX 1: Helper คลิกแถวแรกที่ตรงกับ keyword (แถวที่ approve แล้วจะหายไป)
    const clickFirstMatchingRow = (keyword: string): Cypress.Chainable<boolean> => {
        return cy.get('body').then(($body) => {
            const $todoHeader = $body.find('h3:contains("To Do List")');
            if ($todoHeader.length === 0) {
                cy.log(`⚠️ [${roleLabel}] ไม่พบ h3 "To Do List" — ข้าม`);
                return cy.wrap(false);
            }

            const $table = $todoHeader.parent().find('table');
            const $rows = $table.find('tbody tr').filter((_, el) => {
                const text = Cypress.$(el).text();
                return text.includes(keyword) &&
                    !text.includes('Fetching data') &&
                    !text.includes('No data to display');
            });

            if ($rows.length === 0) {
                cy.log(`⚠️ [${roleLabel}] ไม่พบแถวที่ตรงกับ "${keyword}" ใน To Do List`);
                return cy.wrap(false);
            }

            // ✅ คลิกแถวแรกเสมอ เพราะแถวที่ approve แล้วจะหายไปจากตาราง
            cy.log(`🎯 [${roleLabel}] คลิกแถวแรกของ "${keyword}" (เหลือ ${$rows.length} แถว)`);
            cy.wrap($rows.eq(0)).should('be.visible').click({ force: true });
            return cy.wrap(true);
        });
    };

    const processAt = (poIndex: number, effectiveCount: number): void => {
        if (poIndex >= effectiveCount) {
            cy.log(`✅ [${roleLabel}] ครบ ${effectiveCount} PO — logout`);
            logoutIfPresent();
            return;
        }

        cy.log(`🔄 [${roleLabel}] PO ${poIndex + 1}/${effectiveCount}`);

        // ✅ FIX 2: ใช้ project codes + project name แทนการเดาชื่อ PO จาก allPoNames
        const keywords: string[] = [
            ...allProjectCodes,
            ...buildSearchKeywords(finalProjectName),
        ].filter((v, i, a) => a.indexOf(v) === i);

        const tryKeyword = (idx: number): void => {
            if (idx >= keywords.length) {
                cy.log(`⏭️ [${roleLabel}] ไม่พบ keyword ใดๆ ใน To Do List [${keywords.join(', ')}] — ข้าม PO นี้`);
                cy.then(() => processAt(poIndex + 1, effectiveCount));
                return;
            }

            const keyword = keywords[idx];

            projectExistsInTable('To Do List', keyword).then((existsInToDo) => {
                if (!existsInToDo) {
                    cy.log(`⚠️ [${roleLabel}] ไม่พบ "${keyword}" ใน To Do List — ลอง keyword ถัดไป`);
                    cy.then(() => tryKeyword(idx + 1));
                    return;
                }

                clickFirstMatchingRow(keyword).then((clicked) => {
                    if (!clicked) {
                        cy.log(`⚠️ [${roleLabel}] ไม่พบ "${keyword}" ในตอนนี้ — ลอง keyword ถัดไป`);
                        cy.then(() => tryKeyword(idx + 1));
                        return;
                    }

                    clickPromoteOrApprove();
                    cy.wait(2000);
                    cy.then(() => processAt(poIndex + 1, effectiveCount));
                });
            });
        };

        tryKeyword(0);
    };

    ClaimProject(finalProjectName, {
        claimBy: 'project',
        role: 'ACTM',
        allProjectCodes,
    });

    cy.log(`⏳ [${roleLabel}] รอให้ To Do List พร้อมหลัง claim...`);
    cy.wait(4000);

    // ✅ FIX 3: นับจำนวนแถวจริงใน To Do List แทนการใช้ poCount จาก env
    if (allProjectCodes.length > 0) {
        const countAllCodes = (idx: number, accumulated: number): void => {
            if (idx >= allProjectCodes.length) {
                const effectiveCount = accumulated > 0 ? accumulated : poCount;
                cy.log(`🔢 [${roleLabel}] แถวจริงรวมจากทุก code: ${accumulated} (env poCount: ${poCount}) → ใช้ ${effectiveCount}`);

                if (effectiveCount === 0) {
                    cy.log(`⚠️ [${roleLabel}] ไม่พบแถวใน To Do List เลย — ข้าม approve loop`);
                    logoutIfPresent();
                    return;
                }

                processAt(0, effectiveCount);
                return;
            }

            cy.then(() => countRowsByProjectCode('To Do List', allProjectCodes[idx])).then((count) => {
                countAllCodes(idx + 1, accumulated + count);
            });
        };

        countAllCodes(0, 0);
    } else {
        const primaryKeyword = buildSearchKeywords(finalProjectName)[0] ?? finalProjectName;
        cy.then(() => countRowsByProjectCode('To Do List', primaryKeyword)).then((actualCount) => {
            const effectiveCount = actualCount > 0 ? actualCount : poCount;
            cy.log(`🔢 [${roleLabel}] แถวจริงใน To Do List สำหรับ "${primaryKeyword}": ${actualCount} → ใช้ ${effectiveCount}`);

            if (effectiveCount === 0) {
                logoutIfPresent();
                return;
            }

            processAt(0, effectiveCount);
        });
    }
};

export const afterCKSPOST = (Module?: string, opts?: {
    enableMusicInsert?: boolean;
}): void => {
    const enableMusicInsert = opts?.enableMusicInsert ?? false;

    it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB', { searchBy: 'po', role: 'CGMD' }));

    const restSteps: (() => void)[] = [];

    restSteps.push(() => {
        it('AQSS role (after CGMD Config)', () => {
            if (!shouldRunAqssAfterCgmd()) {
                cy.log('⏭️ ข้าม AQSS role (after CGMD Config)');
                return;
            }
            if (!hasValidPoNames()) {
                cy.log('⏭️ ข้าม AQSS role — ไม่พบชื่อ PO ที่ถูกต้อง');
                return;
            }
            cy.log('🚀 [afterCKSPOST] Running AQSS role (after CGMD Config)');
            promoteToActmRole(aqss, aqsspass, 'AQSS');
        });
    });

    restSteps.push(() => {
        it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB', { searchBy: 'po', role: 'CGMD' }));
    });

    // ✅ FIX: แยก ROM role เป็น it() ของตัวเอง
    restSteps.push(() => {
        it('ROM role', () => {
            if (!shouldRunRomRole()) {
                cy.log('⏭️ ข้าม ROM role — เงื่อนไข hasRom/hasEasyAppRom ไม่ตรง');
                return;
            }
            if (!hasValidPoNames()) {
                cy.log('⏭️ ข้าม ROM role — ไม่พบชื่อ PO ที่ถูกต้อง');
                return;
            }
            cy.log('🚀 [afterCKSPOST] Running ROM role');
            promoteToActmRole(rom, rompass, 'ROM');
        });
    });

    // ✅ FIX: แยก Easy App ROM role เป็น it() ของตัวเอง
    restSteps.push(() => {
        it('Easy App ROM role', () => {
            if (!shouldRunEasyAppRomRole()) {
                cy.log('⏭️ ข้าม Easy App ROM role — เงื่อนไข hasEasyAppRom ไม่ตรง');
                return;
            }
            if (!hasValidPoNames()) {
                cy.log('⏭️ ข้าม Easy App ROM role — ไม่พบชื่อ PO ที่ถูกต้อง');
                return;
            }
            cy.log('🚀 [afterCKSPOST] Running Easy App ROM role');
            promoteToActmRole(ckseasyapp, ckseasyapppass, 'Easy App ROM');
        });
    });

    restSteps.push(() => { it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM', approveFunctionHandlesAllPOs: true })); });
    restSteps.push(() => { it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER, { searchBy: 'po', role: 'OPER', approveFunctionHandlesAllPOs: true })); });

    restSteps.push(() => {
        it('AQSS role (after OPER/APO)', () => {
            if (!shouldRunAqssAfterOper()) {
                cy.log('⏭️ ข้าม AQSS role (after OPER/APO)');
                return;
            }
            if (!hasValidPoNames()) {
                cy.log('⏭️ ข้าม AQSS role — ไม่พบชื่อ PO ที่ถูกต้อง');
                return;
            }
            cy.log('🚀 [afterCKSPOST] Running AQSS role (after OPER/APO)');
            promoteToActmRole(aqss, aqsspass, 'AQSS');
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

const checkEnvFlag = (key: string): boolean => {
    const val = Cypress.env(key);
    const isTrue = val === true || String(val).toLowerCase() === 'true';
    console.log(`🔍 [ENV CHECK] ${key} = ${JSON.stringify(val)} → ${isTrue}`);
    return isTrue;
};

const shouldRunRomRole = (): boolean => checkEnvFlag('hasRom') || checkEnvFlag('hasEasyAppRom');
const shouldRunEasyAppRomRole = (): boolean => checkEnvFlag('hasEasyAppRom');
const shouldRunAqssAfterOper = (): boolean => checkEnvFlag('hasRom') || checkEnvFlag('hasEasyAppRom');
const shouldRunAqssAfterCgmd = (): boolean => !shouldRunAqssAfterOper() && (checkEnvFlag('hasUssdDirect') || checkEnvFlag('hasUssdInteractive'));
const shouldRunAqssRole = (): boolean => shouldRunAqssAfterOper() || shouldRunAqssAfterCgmd();

const hasValidPoNames = (): boolean => {
    const allPoNames = (Cypress.env('allPoNames') as string[]) || [];
    return allPoNames.length > 0 && !allPoNames[0]?.startsWith('PO_');
};

const insertRomEasyAppRomRole = (ordered: TestEntry[]): TestEntry[] => {
    const result = [...ordered];
    const cgmdConfigIdx = result.findIndex(t => t.name.includes('CGMD Config'));
    const insertAt = cgmdConfigIdx === -1 ? 0 : cgmdConfigIdx + 1;
    const newEntries: TestEntry[] = [
        {
            name: 'ROM role',
            group: 'OTHER',
            fn: () => {
                if (!shouldRunRomRole()) {
                    cy.log('⏭️ ข้าม ROM role — เงื่อนไข hasRom/hasEasyAppRom ไม่ตรงตอน runtime');
                    return;
                }
                if (!hasValidPoNames()) {
                    cy.log('⏭️ ข้าม ROM role — ไม่พบชื่อ PO ที่ถูกต้อง');
                    return;
                }
                promoteToActmRole(rom, rompass, 'ROM');
            },
        },
        {
            name: 'Easy App ROM role',
            group: 'OTHER',
            fn: () => {
                if (!shouldRunEasyAppRomRole()) {
                    cy.log('⏭️ ข้าม Easy App ROM role — เงื่อนไข hasEasyAppRom ไม่ตรงตอน runtime');
                    return;
                }
                if (!hasValidPoNames()) {
                    cy.log('⏭️ ข้าม Easy App ROM role — ไม่พบชื่อ PO ที่ถูกต้อง');
                    return;
                }
                promoteToActmRole(ckseasyapp, ckseasyapppass, 'Easy App ROM');
            },
        }
    ];
    result.splice(insertAt, 0, ...newEntries);
    console.log(`✅ [SUCCESS] Inserted ROM/Easy App ROM test entries at index ${insertAt}`);
    return result;
};

const buildAqssEntries = (labelSuffix: string, guard: () => boolean): TestEntry[] => {
    return [{
        name: `AQSS role (${labelSuffix})`,
        group: 'OTHER',
        fn: () => {
            if (!guard()) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — เงื่อนไขไม่ตรงตอน runtime`);
                return;
            }
            if (!hasValidPoNames()) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — ไม่พบชื่อ PO ที่ถูกต้อง`);
                return;
            }
            cy.log(`🚀 Running AQSS role (${labelSuffix})`);
            promoteToActmRole(aqss, aqsspass, 'AQSS');
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

const declareRoleTests = (tests: TestEntry[], opts?: {
    poLabel?: string;
    beforeEach?: () => void;
    musicModule?: string;
}): void => {
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
            if (s.length) interleaved.push(s.shift()!);
            interleaved.push(...c);
            interleaved.push(...s);
            ordered = [...interleaved, ...other];
            break;
        }
        case 'CGMD_SPAD_ALTERNATE_C':
            ordered = [...(cgmdConfig ? [cgmdConfig] : []), ...(spadsup ? [spadsup] : []), ...(cgmdTester ? [cgmdTester] : []), ...(spaddoer ? [spaddoer] : []), ...cgmdRest, ...spadRest, ...other];
            break;
        case 'CGMD_SPAD_ALTERNATE_S':
            ordered = [...(spadsup ? [spadsup] : []), ...(cgmdConfig ? [cgmdConfig] : []), ...(spaddoer ? [spaddoer] : []), ...(cgmdTester ? [cgmdTester] : []), ...cgmdRest, ...spadRest, ...other];
            break;
        case 'RANDOM': {
            const mixed = shuffleArray([...cgmd, ...spad]);
            const spadPositions = mixed.map((t, i) => ({ t, i })).filter(({ t }) => t.group === 'SPAD').map(({ i }) => i);
            const spadSorted = sortSpad(mixed.filter(t => t.group === 'SPAD'));
            spadPositions.forEach((pos, idx) => { mixed[pos] = spadSorted[idx]; });
            const cgmdPositions = mixed.map((t, i) => ({ t, i })).filter(({ t }) => t.group === 'CGMD').map(({ i }) => i);
            const ci = cgmdPositions.find(i => mixed[i].name.includes('Config'));
            const ti = cgmdPositions.find(i => mixed[i].name.includes('Tester'));
            if (ci !== undefined && ti !== undefined && ti < ci) {
                [mixed[ci], mixed[ti]] = [mixed[ti], mixed[ci]];
            }
            ordered = [...mixed, ...other];
            break;
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

const declarePluginTests = (tests: TestEntry[], opts?: {
    poLabel?: string;
    beforeEach?: () => void;
    musicModule?: string;
}): void => {
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

const STANDARD_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spaddoer role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spadtester role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'Spaddeploy role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'ACTM role', group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM', approveFunctionHandlesAllPOs: true }) },
    { name: 'APO role', group: 'OTHER', fn: () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po', role: 'APO', approveFunctionHandlesAllPOs: true }) },
];

const PLUGIN_TESTS: TestEntry[] = [
    { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }) },
    { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }) },
    { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin, { searchBy: 'po', role: 'SPAD' }) },
    { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN', { searchBy: 'po', role: 'CGMD' }) },
    { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN', { searchBy: 'po', role: 'CGMD' }) },
];

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

const getSkipApprovalRoles = (): string[] => {
    const skip = Cypress.env('skipApprovalRoles');
    if (!skip) return [];
    try {
        if (Array.isArray(skip)) return skip.map(s => String(s).toUpperCase());
        if (typeof skip === 'string') return skip.split(',').map(s => s.trim().toUpperCase());
    } catch (e) { /* ignore */ }
    return [];
};

const isRoleSkipped = (roleKey: string): boolean => getSkipApprovalRoles().includes(roleKey.toUpperCase());

export const afterMKTothersubgroup = (
    PoSubGroup: 'AccountFee' | 'CashBack' | 'GroupPoFee' | 'OrderFee' | 'Service' | 'Other',
    Module: 'POST' | 'PRE' | 'ENTER' | 'MUSIC'
): void => {
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
        if (isRoleSkipped('SASFF')) {
            cy.log('⏭️ Skipping SASFF tests per skipApprovalRoles flag');
            return;
        }
        if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
            it('SASFF role (all POs)', () => {
                const poNames = getPoNamesToProcess();
                cy.log(`🔁 SASFF: Total PO to process: ${poNames.length}`);
                runPoSequence(poNames, (poName, idx) => {
                    const poLabel = poNames.length > 1 ? `[PO ${idx + 1}/${poNames.length}]` : '';
                    if (!poName) cy.log(`⚠️ WARNING: poName ว่างเปล่าที่ index ${idx} ${poLabel}`);
                    setCurrentPo(poName);
                    loginAndWaitReady(sasff, sasffpass);
                    cy.log(`Project ใช้สำหรับ Claim (PO mode) ${poLabel}: ${poName}`);
                    ClaimProject(poName, { specificPoName: poName, role: 'SASFF' });
                    approveProject(poName);
                    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
                    cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
                    cy.wait(500);
                    cy.scrollTo('bottom');
                    cy.wait(500);
                    cy.contains('button', 'Promote').should('be.visible').click({ force: true });
                    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
                    cy.contains('button', 'Logout').should('be.visible').click();
                    cy.url({ timeout: 30000 }).should('include', '/login');
                });
            });
        }
    };

    const runAqssRoleOnce = (guard: () => boolean, labelSuffix: string): void => {
        it(`AQSS role (${labelSuffix})`, () => {
            if (!guard()) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — เงื่อนไขไม่ตรงตอน runtime`);
                return;
            }
            const poNames = getPoNamesToProcess();
            if (!poNames || poNames.length === 0 || poNames[0] === '' || poNames[0]?.startsWith('PO_')) {
                cy.log(`⏭️ ข้าม AQSS role (${labelSuffix}) — ไม่พบชื่อ PO ที่ถูกต้อง`);
                return;
            }
            cy.log(`🚀 [afterMKTothersubgroup] Running AQSS role (${labelSuffix})`);
            promoteToActmRole(aqss, aqsspass, 'AQSS');
        });
    };

    const runRoleForAllPos = (label: string, getPoNames: () => string[], action: (poName: string, idx: number, poLabel: string) => void): void => {
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
            it('CGMD Config IRB role (all POs)', () => { performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB', { searchBy: 'po', role: 'CGMD' }); });
            runAqssRoleOnce(shouldRunAqssAfterCgmd, 'after CGMD Config');
            it('CGMD Tester IRB role (all POs)', () => { performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB', { searchBy: 'po', role: 'CGMD' }); });
            registerSasffTest();
            it('ACTM role (all POs)', () => {
                if (isRoleSkipped('ACTM')) {
                    cy.log('⏭️ Skipping ACTM role per skipApprovalRoles flag (Modify flow)');
                    return;
                }
                performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM', approveFunctionHandlesAllPOs: true });
            });
            it('OPER role (all POs)', () => {
                if (isRoleSkipped('OPER')) {
                    cy.log('⏭️ Skipping OPER role per skipApprovalRoles flag (Modify flow)');
                    return;
                }
                performSimpleApprovalRole(oper, operpass, approveProjectOPER, { searchBy: 'po', role: 'OPER', approveFunctionHandlesAllPOs: true });
            });
            runAqssRoleOnce(shouldRunAqssAfterOper, 'after OPER/APO');
        });
    } else if (Module === 'PRE' || Module === 'ENTER' || Module === 'MUSIC') {
        executeCKSRole('standard', () => { }, () => {
            it('CGMD Config cbs role (all POs)', () => { performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }); });
            runAqssRoleOnce(shouldRunAqssAfterCgmd, 'after CGMD Config');
            it('CGMD Tester CBS role (all POs)', () => { performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po', role: 'CGMD' }); });
            registerSasffTest();
            it('Spadsup role (all POs)', () => { performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po', role: 'SPAD' }); });
            it('Spaddoer role (all POs)', () => { performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po', role: 'SPAD' }); });
            it('Spadtester role (all POs)', () => { performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po', role: 'SPAD' }); });
            it('Spaddeploy role (all POs)', () => { performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po', role: 'SPAD' }); });
            it('ACTM role (all POs)', () => {
                if (isRoleSkipped('ACTM')) {
                    cy.log('⏭️ Skipping ACTM role per skipApprovalRoles flag (Modify flow)');
                    return;
                }
                performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po', role: 'ACTM', approveFunctionHandlesAllPOs: true });
            });
            it('APO role (all POs)', () => {
                if (isRoleSkipped('APO')) {
                    cy.log('⏭️ Skipping APO role per skipApprovalRoles flag (Modify flow)');
                    return;
                }
                performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po', role: 'APO', approveFunctionHandlesAllPOs: true });
            });
            runAqssRoleOnce(shouldRunAqssAfterOper, 'after OPER/APO');
            runMusicOrTscenterRuntimeChecked(Module === 'ENTER' ? undefined : Module);
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

// ✅ Helper กลาง: ข้อความ Description แบบสุ่ม TH/EN สำหรับ attachment
const ATTACHMENT_DESC_POOL_EN = [
    'File description for this offering',
    'Attached file for product team review',
    'File description updated for this PO',
    'Supporting file for internal reference',
    'File description submitted for team review',
    'Updated file attached for consideration',
    'File pending sign-off and confirmation',
    'File description included for this submission'
];
const ATTACHMENT_DESC_POOL_TH = [
    'คำอธิบายไฟล์สำหรับข้อเสนอนี้',
    'ไฟล์แนบสำหรับทีมผลิตภัณฑ์',
    'อัปเดตคำอธิบายไฟล์สำหรับ PO นี้',
    'ไฟล์ประกอบสำหรับอ้างอิงภายใน',
    'คำอธิบายไฟล์ส่งให้ทีมตรวจสอบ',
    'แนบไฟล์ที่อัปเดตแล้วเพื่อประกอบการพิจารณา',
    'ไฟล์รอการลงนามและยืนยัน',
    'คำอธิบายไฟล์สำหรับการส่งมอบนี้'
];

const getRandomAttachmentDescription = (maxLen = 120): string => {
    const useThai = Math.random() < 0.5;
    const pool = useThai ? ATTACHMENT_DESC_POOL_TH : ATTACHMENT_DESC_POOL_EN;
    let desc = pool[Math.floor(Math.random() * pool.length)];
    if (desc.length > maxLen) {
        desc = desc.substring(0, maxLen - 3) + '...';
    }
    return desc;
};

// ✅ Helper กลาง: กรอก Description + กด Upload + รอ response + verify Attachment History
// ⚠️ ต้อง cy.intercept('POST', /upload/i).as('fileUpload') และ selectFile ให้เสร็จก่อนเรียกฟังก์ชันนี้
const fillDescriptionAndUpload = (opts?: { skipVerifyHistory?: boolean }): void => {
    const attachmentDesc = getRandomAttachmentDescription();
    cy.log(`📎 Attachment Description: ${attachmentDesc}`);

    cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
        .should('be.visible')
        .focus()
        .clear({ force: true })
        .type(attachmentDesc, { delay: 30 })
        .trigger('input', { bubbles: true })
        .trigger('change', { bubbles: true })
        .blur();

    cy.contains('button', 'Upload', { timeout: 10000 })
        .scrollIntoView()
        .should('be.visible')
        .and('be.enabled')
        .click();

    cy.wait('@fileUpload', { timeout: 60000 })
        .its('response.statusCode')
        .should('eq', 200);

    if (!opts?.skipVerifyHistory) {
        cy.contains('h4', 'Attachment History')
            .closest('.panel')
            .find('table tbody')
            .should('not.contain.text', 'No data to display.');
    }
};

export const beforeapproveMKT = (): void => {
    const VALIDATE_MODAL_SELECTOR = '.modal:visible .modal-title:contains("Validate Result")';
    const getValidateErrors = ($modal: JQuery<HTMLElement>): string => {
        return $modal
            .find('.alert-danger, .text-danger, .modal-body')
            .toArray()
            .map((el) => Cypress.$(el).text().replace(/\s+/g, ' ').trim())
            .filter((text) => text.length > 0)
            .join(' | ');
    };
    let submitResponseReceived = false;
    const failIfValidateModal = (timeoutMs: number): void => {
        const startedAt = Date.now();
        const poll = (): void => {
            cy.get('body').then(($body) => {
                const $modalTitle = $body.find(VALIDATE_MODAL_SELECTOR);
                if ($modalTitle.length > 0) {
                    const $modal = $modalTitle.closest('.modal');
                    const errors = getValidateErrors($modal);
                    throw new Error(
                        `❌ Approve blocked by Validate Result modal: ${errors || 'No specific error message found'}`
                    );
                }
                const shouldContinuePolling = !submitResponseReceived && Date.now() - startedAt < timeoutMs;
                if (shouldContinuePolling) {
                    cy.wait(250);
                    poll();
                }
            });
        };
        poll();
    };

    cy.intercept('POST', '**/api-mkt/promoteFromMktDoer', (req) => {
        req.continue((res) => {
            submitResponseReceived = true;
        });
    }).as('submitApprove');
    cy.intercept('POST', /upload/i).as('fileUpload');

    // ✅ ใช้ helper กลาง — กรอก description + กด Upload + verify
    fillDescriptionAndUpload();

    cy.contains('.row', 'Approve memo')
        .find('input[type="checkbox"]')
        .should('be.visible')
        .check();

    cy.contains('button', 'Submit', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')
        .and('be.enabled')
        .click();

    failIfValidateModal(30000);

    cy.wait('@submitApprove', { timeout: 60000 }).then((interception) => {
        const statusCode = interception.response?.statusCode;
        const body: any = interception.response?.body;
        cy.log(`📩 submitApprove response status: ${statusCode}`);
        cy.log(`📩 submitApprove body: ${JSON.stringify(body)}`);
        const message = body && typeof body.message === 'string' ? body.message.toLowerCase() : '';
        const bodyIndicatesError = Boolean(
            body &&
            (body.success === false ||
                body.status === 'FAIL' ||
                body.error ||
                body.errorCode ||
                body.errorMessage ||
                message.includes('validate') ||
                message.includes('error'))
        );
        if (bodyIndicatesError) {
            throw new Error(`❌ submitApprove responded 200 but body indicates failure: ${JSON.stringify(body)}`);
        }
        expect(statusCode, 'submitApprove HTTP status').to.eq(200);
    });

    failIfValidateModal(5000);
    cy.url({ timeout: 120000 }).should((url) => {
        const validUrls = [
            '/#/workspace-home/workspace',
            '/zenon/csi-support',
            '/zenon/ssb-support',
            '/zenon/cpc-support',
            '/zenon/aaf-support',
            '/zenon/ts-center',
            '/zenon/e2e-tester',
            '/owner-zenon'
        ];
        const matched = validUrls.some(u => url.includes(u));
        expect(matched, `Expected URL to include one of [${validUrls.join(', ')}]`).to.be.true;
    });

    const finalProjectName = getStandardProjectName();
    cy.log(`✅ Project ใช้สำหรับ Claim: ${finalProjectName}`);
    // ✅ เพิ่ม role: 'MKT' เพื่อให้ใช้ Project Mode
    ClaimProject(finalProjectName, { claimBy: 'project', role: 'MKT' });
    approveProject(finalProjectName);
    cy.url({ timeout: 120000 }).should('include', '/mkt/mktchecker');
    cy.get('button.btn.btn-xs.btn-primary')
        .should('be.visible')
        .and('be.enabled')
        .click();
    cy.url({ timeout: 120000 }).should((url) => {
        const validUrls = [
            '/#/workspace-home/workspace',
            '/zenon/csi-support',
            '/zenon/ssb-support',
            '/zenon/cpc-support',
            '/zenon/aaf-support',
            '/zenon/ts-center',
            '/zenon/e2e-tester',
            '/owner-zenon'
        ];
        const matched = validUrls.some(u => url.includes(u));
        expect(matched, `Expected URL to include one of [${validUrls.join(', ')}]`).to.be.true;
    });
};

export const beforeapproveCKS = (): void => { executeCKSRole('standard', () => { }); };
export const beforeapproveCKSontop = (): void => { executeCKSRole('ontop', () => { }); };

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

type CoreRoleOptions = {
    expectedUrl: string | string[];
    approveButtonText: string;
    shouldClaim?: boolean;
    claimBy?: 'project' | 'po';
    beforeApproveClick?: (poName: string, poIndex: number) => void;
    role?: string;
};

const runCoreRoleForAllPOs = (
    roleUser: any,
    rolePass: any,
    roleLabel: string,
    options: CoreRoleOptions,
): void => {
    const {
        expectedUrl,
        approveButtonText,
        shouldClaim = true,
        claimBy = 'project',
        beforeApproveClick,
        role,
    } = options;

    loginAndWaitReady(roleUser, rolePass);

    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const allProjectCodes: string[] = (Cypress.env('allProjectCodes') as string[]) ?? [];
    const finalProjectName = getStandardProjectName();

    cy.log(`🔁 [${roleLabel}] Project: ${finalProjectName} | Total PO (env): ${poCount} | claimBy: ${claimBy} | role: ${role ?? 'N/A'} | codes: [${allProjectCodes.join(', ')}]`);

    const getPoKeyword = (index: number): string => {
        const poName = allPoNames[index] ?? `${finalProjectName}_PO${index + 1}`;
        return poName.includes('_') ? poName.split('_')[0].trim() : poName;
    };

    const logoutIfPresent = (): void => {
        cy.get('body').then(($body) => {
            if ($body.find('button:contains("Logout")').length > 0) {
                cy.contains('button', 'Logout').should('be.visible').click({ force: true });
                cy.url({ timeout: 30000 }).should('include', '/login');
            }
        });
    };

    // ✅ FIX 1: Helper พาตัวทดสอบกลับไปที่หน้า To Do List หากหลุดไปหน้าอื่น
    const ensureOnToDoListPage = (): void => {
        cy.get('body').then(($body) => {
            const hasToDoHeader = $body.find('h3:contains("To Do List")').length > 0;
            if (!hasToDoHeader) {
                cy.log(`⚠️ [${roleLabel}] ไม่พบ "To Do List" ในหน้านี้ — กลับไปที่หน้า workspace`);
                cy.url().then((currentUrl) => {
                    if (!currentUrl.includes('/workspace-home/workspace')) {
                        cy.contains('span', 'Menu', { timeout: 30000 }).click();
                        cy.get('a[href="#/workspace-home/workspace"]', { timeout: 30000 }).click();
                        cy.url({ timeout: 30000 }).should('include', '/workspace-home/workspace');
                    }
                });
            }
        });
    };

    // ✅ FIX 2: Set เก็บแถวที่เคยคลิกแล้ว ป้องกันคลิกซ้ำ
    const processedRowTexts = new Set<string>();

    // ✅ FIX 3: คลิกแถวแรกที่ตรงกับ keyword โดยไม่คลิกซ้ำ
    const clickFirstMatchingRow = (keyword: string): Cypress.Chainable<boolean> => {
        ensureOnToDoListPage();

        return cy.get('body').then(($body) => {
            const $todoHeader = $body.find('h3:contains("To Do List")');
            if ($todoHeader.length === 0) {
                cy.log(`⚠️ [${roleLabel}] ไม่พบ h3 "To Do List" — ข้าม`);
                return cy.wrap(false);
            }

            const $table = $todoHeader.parent().find('table');
            const $rows = $table.find('tbody tr').filter((_, el) => {
                const text = Cypress.$(el).text();
                return text.includes(keyword) &&
                    !text.includes('Fetching data') &&
                    !text.includes('No data to display');
            });

            // ✅ กรองแถวที่เคยถูกคลิกไปแล้ว
            const unprocessedRows = $rows.filter(
                (_, el) => !processedRowTexts.has(Cypress.$(el).text().trim())
            );

            if (unprocessedRows.length === 0) {
                cy.log(`⚠️ [${roleLabel}] ไม่พบแถวที่ไม่เคยถูกคลิกของ "${keyword}"`);
                return cy.wrap(false);
            }

            const $targetRow = unprocessedRows.eq(0);
            processedRowTexts.add($targetRow.text().trim());

            cy.log(`🎯 [${roleLabel}] คลิกแถวของ "${keyword}" (เหลือ ${unprocessedRows.length} แถวที่ไม่เคยคลิก)`);
            cy.wrap($targetRow).should('be.visible').click();
            return cy.wrap(true);
        });
    };

    const processAt = (poIndex: number, effectiveCount: number): void => {
        if (poIndex >= effectiveCount) {
            cy.log(`✅ [${roleLabel}] ครบ ${effectiveCount} PO — logout`);
            logoutIfPresent();
            return;
        }

        cy.log(`🔄 [${roleLabel}] PO ${poIndex + 1}/${effectiveCount}`);

        const keywords: string[] = claimBy === 'project'
            ? [...allProjectCodes, ...buildSearchKeywords(finalProjectName)].filter((v, i, a) => a.indexOf(v) === i)
            : [getPoKeyword(poIndex)];

        const tryKeyword = (idx: number): void => {
            if (idx >= keywords.length) {
                cy.log(`⏭️ [${roleLabel}] ไม่พบ keyword ใดๆ ใน To Do List [${keywords.join(', ')}] — ข้าม PO นี้`);
                cy.then(() => processAt(poIndex + 1, effectiveCount));
                return;
            }

            const keyword = keywords[idx];

            // ✅ ใช้ clickFirstMatchingRow แทน approveProject
            clickFirstMatchingRow(keyword).then((clicked) => {
                if (!clicked) {
                    cy.log(`⚠️ [${roleLabel}] ไม่พบ "${keyword}" ใน To Do List — ลอง keyword ถัดไป`);
                    cy.then(() => tryKeyword(idx + 1));
                    return;
                }

                cy.url({ timeout: 300000 }).should((url) => {
                    if (Array.isArray(expectedUrl)) {
                        const matched = expectedUrl.some(u => url.includes(u));
                        expect(matched, `Expected URL to include one of [${expectedUrl.join(', ')}]`).to.be.true;
                    } else {
                        expect(url).to.include(expectedUrl);
                    }
                });

                cy.wait(500);

                if (beforeApproveClick) {
                    beforeApproveClick(keyword, poIndex);
                }

                cy.scrollTo('bottom');
                cy.wait(500);

                cy.on('window:confirm', () => true);
                cy.contains('button', approveButtonText, { timeout: 120000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });

                cy.get('body').then(($body) => {
                    if ($body.find('button:contains("Yes")').filter(':visible').length > 0) {
                        cy.contains('button', 'Yes').should('be.visible').click({ force: true });
                    }
                });

                cy.url({ timeout: 120000 }).should((url) => {
                    const validUrls = [
                        '/#/workspace-home/workspace',
                        '/zenon/csi-support',
                        '/zenon/ssb-support',
                        '/zenon/cpc-support',
                        '/zenon/aaf-support',
                        '/zenon/ts-center',
                        '/zenon/e2e-tester',
                        '/owner-zenon'
                    ];
                    const matched = validUrls.some(u => url.includes(u));
                    expect(matched, `Expected URL to include one of [${validUrls.join(', ')}]`).to.be.true;
                });

                cy.then(() => processAt(poIndex + 1, effectiveCount));
            });
        };

        tryKeyword(0);
    };

    if (shouldClaim) {
        if (claimBy === 'project' && allProjectCodes.length > 0) {
            ClaimProject(finalProjectName, { claimBy: 'project', allProjectCodes, role });
        } else {
            ClaimProject(finalProjectName, { claimBy, role });
        }
    }

    // นับจำนวนแถวจริงใน To Do List
    if (claimBy === 'project') {
        const countAllCodes = (idx: number, accumulated: number): void => {
            if (idx >= allProjectCodes.length) {
                const effectiveCount = accumulated > 0 ? accumulated : poCount;
                cy.log(`🔢 [${roleLabel}] แถวจริงรวมจากทุก code: ${accumulated} (env poCount: ${poCount}) → ใช้ ${effectiveCount}`);
                if (effectiveCount === 0) {
                    cy.log(`⚠️ [${roleLabel}] ไม่พบแถวใน To Do List เลย — ข้าม approve loop`);
                    logoutIfPresent();
                    return;
                }
                cy.then(() => processAt(0, effectiveCount));
                return;
            }
            cy.then(() => countRowsByProjectCode('To Do List', allProjectCodes[idx])).then((count) => {
                countAllCodes(idx + 1, accumulated + count);
            });
        };

        if (allProjectCodes.length > 0) {
            countAllCodes(0, 0);
        } else {
            const primaryKeyword = buildSearchKeywords(finalProjectName)[0] ?? finalProjectName;
            cy.then(() => countRowsByProjectCode('To Do List', primaryKeyword)).then((actualCount) => {
                const effectiveCount = actualCount > 0 ? actualCount : poCount;
                cy.log(`🔢 [${roleLabel}] แถวจริงใน To Do List สำหรับ "${primaryKeyword}": ${actualCount} → ใช้ ${effectiveCount}`);
                if (effectiveCount === 0) {
                    logoutIfPresent();
                    return;
                }
                cy.then(() => processAt(0, effectiveCount));
            });
        }
    } else {
        cy.then(() => processAt(0, poCount));
    }
};

const runSupportRoleCore = (roleUser: any, rolePass: any, urlPart: string, btnText: string, role?: string): void => {
    let checkUrl = '';
    waitForLoadingState();
    if (urlPart === 'csisp' || urlPart === 'csidp') checkUrl = '/zenon/csi-support';
    else if (urlPart === 'aafsp' || urlPart === 'aafdp') checkUrl = '/zenon/aaf-support';
    else if (urlPart === 'ssbsp' || urlPart === 'ssbdp') checkUrl = '/zenon/ssb-support';
    else if (urlPart === 'cpcsp' || urlPart === 'cpcdp') checkUrl = '/zenon/cpc-support';
    else checkUrl = urlPart;

    runCoreRoleForAllPOs(roleUser, rolePass, urlPart, {
        expectedUrl: checkUrl,
        approveButtonText: btnText,
        claimBy: 'project',
        role, // ✅ ส่ง role เข้าไป
    });
};

const runE2eTestCore = (): void => {
    runCoreRoleForAllPOs(e2etest, e2etestpass, 'e2etest', {
        expectedUrl: '/zenon/e2e-tester',
        approveButtonText: 'Approve to MKT Doer',
        claimBy: 'project',
        role: 'E2ETEST', // ✅ เพิ่ม role
        beforeApproveClick: () => {
            cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
            cy.intercept('POST', /upload/i).as('fileUpload');

            cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
                cy.get('input[type="file"][id="files"]').selectFile({
                    contents: Cypress.Buffer.from(fileContent, 'binary'),
                    fileName: 'file.pdf',
                    mimeType: 'application/pdf',
                }, { force: true });
            });

            fillDescriptionAndUpload();
        },
    });
};

const runMktRoleCore = (): void => {
    runCoreRoleForAllPOs(music, musicpass, 'MKT', {
        expectedUrl: '/owner-zenon',
        approveButtonText: 'Approve',
        shouldClaim: false,
        claimBy: 'project',
        role: 'MKT', // ✅ เพิ่ม role: 'MKT' เพื่อให้ใช้ Project Mode
    });
};

const runTscenterCore = (): void => {
    runCoreRoleForAllPOs(tscenter, tscenterpass, 'TSCENTER', {
        expectedUrl: [
            '/zenon/ts-center',
            '/zenon/csi-support',
            '/zenon/ssb-support',
            '/zenon/cpc-support',
            '/zenon/aaf-support',
            '/zenon/e2e-tester',
            '/workspace-home/workspace'
        ],
        approveButtonText: 'Approve',
        claimBy: 'project',
        role: 'TSCENTER',
        beforeApproveClick: () => {
            cy.contains('h2', 'TS Center', { timeout: 60000 }).should('be.visible');
            const maxAttempts = 30;
            const attempt = (n: number): void => {
                cy.get('body').then(($body) => {
                    if ($body.find('select[formcontrolname="olympus"]').length > 0) {
                        const olympusValue = Math.random() < 0.5 ? 'Yes' : 'No';
                        cy.log(`🎲 [TSCENTER] สุ่มเลือก Olympus Flag: "${olympusValue}"`);

                        cy.get('select[formcontrolname="olympus"]')
                            .should('be.visible')
                            .select(olympusValue)
                            .should('have.value', olympusValue)
                            .should('not.have.class', 'ng-invalid')
                            .and('have.class', 'ng-valid');
                        return;
                    }

                    if (n >= maxAttempts) {
                        cy.log('ℹ️ ไม่พบ select olympus หลังรอครบ 30 วิ — ข้าม');
                        return;
                    }
                    cy.wait(1000, { log: false }).then(() => attempt(n + 1));
                });
            };
            attempt(0);
        },
    });
};

const runE2eDpCore = (): void => {
    runCoreRoleForAllPOs(e2edp, e2edppass, 'e2edp', {
        expectedUrl: '/zenon/e2e-tester',
        approveButtonText: 'Approve to Pre Go live',
        claimBy: 'project',
        role: 'E2EDP', // ✅ เพิ่ม role
    });
};

const runFullMusicChainCore = (): void => {
    runTscenterCore();
    runSupportRoleCore(csisp, csisppass, 'csisp', 'Promote To E2E Tester', 'CSISP');
    runSupportRoleCore(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester', 'AAFSP');
    runSupportRoleCore(ssbsp, ssbsppass, 'ssbsp', 'Promote To E2E Tester', 'SSBSP');
    runSupportRoleCore(cpcsp, cpcsppass, 'cpcsp', 'Promote To E2E Tester', 'CPCSP');
    runE2eTestCore();
    runMktRoleCore();
    runSupportRoleCore(csidp, csidppass, 'csidp', 'Promote To E2E Deploy', 'CSIDP');
    runSupportRoleCore(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy', 'AA FDP');
    runSupportRoleCore(ssbdp, ssbdppass, 'ssbdp', 'Promote To E2E Deploy', 'SSBDP');
    runSupportRoleCore(cpcdp, cpcdppass, 'cpcdp', 'Promote To E2E Deploy', 'CPCDP');
    runE2eDpCore();
};

export const performTscenterRoleOnly = (): void => { it('TSCENTER role', () => runTscenterCore()); };

export const performMusicRoles = (): void => {
    it('TSCENTER role', () => runTscenterCore());
    it('csisp role', () => runSupportRoleCore(csisp, csisppass, 'csisp', 'Promote To E2E Tester', 'CSISP'));
    it('aafsp role', () => runSupportRoleCore(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester', 'AAFSP'));
    it('ssbsp role', () => runSupportRoleCore(ssbsp, ssbsppass, 'ssbsp', 'Promote To E2E Tester', 'SSBSP'));
    it('cpcsp role', () => runSupportRoleCore(cpcsp, cpcsppass, 'cpcsp', 'Promote To E2E Tester', 'CPCSP'));
    it('e2etest role', () => runE2eTestCore());
    it('MKT role', () => runMktRoleCore());
    it('csidp role', () => runSupportRoleCore(csidp, csidppass, 'csidp', 'Promote To E2E Deploy', 'CSIDP'));
    it('aafdp role', () => runSupportRoleCore(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy', 'AA FDP'));
    it('ssbdp role', () => runSupportRoleCore(ssbdp, ssbdppass, 'ssbdp', 'Promote To E2E Deploy', 'SSBDP'));
    it('cpcdp role', () => runSupportRoleCore(cpcdp, cpcdppass, 'cpcdp', 'Promote To E2E Deploy', 'CPCDP'));
    it('e2edp role', () => runE2eDpCore());
};

export const runMusicOrTscenterRuntimeChecked = (Module?: string): void => {
    it('Music/TSCENTER role (runtime-checked)', () => {
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