import { TaskListHeader, FinalAction, CoreTaskCallback, ApproveFunction } from './config';
import { searchInTableWithPagination, scrollAndWait, loginAndWaitReady } from './helpers';
import { getStandardProjectName } from './project-manager';

// ========================
// TIMEOUT CONSTANTS
// ========================
const TIMEOUT = {
    SHORT: 15_000,
    MEDIUM: 60_000,
    LONG: 120_000,
    NAV: 180_000,
} as const;

// ========================
// SHARED UTILS
// ========================
const stripLabel = (raw: string): string =>
    raw.replace(/\(\s*\w+\s*\)/g, '').replace(/\s+/g, ' ').trim();


// ========================
// SMART WAIT HELPERS
// ========================
const waitForTableReady = (headerText: string, timeoutMs = TIMEOUT.NAV): Cypress.Chainable => {
    return cy
        .get(`h3:contains("${headerText}")`, { timeout: timeoutMs })
        .parent()
        .find('tbody tr', { timeout: timeoutMs })
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            expect($rows.length).to.be.greaterThan(0);
        });
};

const retryFindRowInTable = (
    headerText: string,
    keyword: string,
    maxAttempts = 5,
    attempt = 1
): Cypress.Chainable<boolean> => {
    cy.log(`🔄 [${attempt}/${maxAttempts}] Finding "${keyword}" in "${headerText}"`);

    return waitForTableReady(headerText).then(($rows) => {
        const found = $rows.toArray().some((row: HTMLElement) => rowMatchesKeyword(row, keyword));

        if (found) {
            cy.log(`✅ Found "${keyword}" on attempt ${attempt}`);
            return cy.wrap<boolean>(true);
        }

        if (attempt >= maxAttempts) {
            cy.log(`❌ "${keyword}" not found after ${maxAttempts} attempts`);
            return cy.wrap<boolean>(false);
        }

        cy.wait(3000);
        return retryFindRowInTable(headerText, keyword, maxAttempts, attempt + 1);
    });
};

// ========================
// TABLE HELPERS
// ========================
export const projectExistsInTable = (headerText: string, keyword: string): Cypress.Chainable<boolean> => {
    return retryFindRowInTable(headerText, keyword);
};

// ========================
// KEYWORD RESOLUTION (Project Code -> Project Name -> PO Name)
// ========================
const buildSearchKeywords = (...extra: (string | undefined)[]): string[] => {
    const projectCode = (Cypress.env('currentProjectCode') as string) || '';
    const currentProjectName = (Cypress.env('currentProjectName') as string) || '';
    const all = [projectCode, currentProjectName, ...extra.filter(Boolean)] as string[];
    return [...new Set(all.map((k) => k.trim()).filter(Boolean))];
};

interface RowKeywordMatch {
    found: boolean;
    matchedKeyword: string;
}

const findRowInTableByKeywords = (
    headerText: string,
    keywords: string[],
    maxAttemptsPerKeyword = 3
): Cypress.Chainable<RowKeywordMatch> => {
    const tryAt = (idx: number): Cypress.Chainable<RowKeywordMatch> => {
        if (idx >= keywords.length) {
            return cy.wrap<RowKeywordMatch>({ found: false, matchedKeyword: '' }, { log: false });
        }
        const keyword = keywords[idx];
        cy.log(`🔎 [${idx + 1}/${keywords.length}] ลองหาด้วย keyword: "${keyword}"`);
        return retryFindRowInTable(headerText, keyword, maxAttemptsPerKeyword).then((found) => {
            if (found) {
                cy.log(`✅ เจอด้วย keyword: "${keyword}"`);
                return cy.wrap<RowKeywordMatch>({ found: true, matchedKeyword: keyword }, { log: false });
            }
            cy.log(`⚠️ ไม่เจอด้วย "${keyword}"`);
            return tryAt(idx + 1);
        });
    };
    return tryAt(0);
};

// ========================
// APPROVAL FLOW BASE FUNCTIONS
// ========================
export const createFullPageApprovalFlow = (
    projectName: string,
    taskListHeader: TaskListHeader,
    expectedUrl: string,
    coreTaskCallback: CoreTaskCallback,
    finalAction: FinalAction,
    options?: { alreadyOnPage?: boolean }
): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

    if (!options?.alreadyOnPage) {
        // projectName ตรงนี้จริงๆ อาจเป็น poName ที่ loopApproveAllPOs ส่งเข้ามา
        const keywords = buildSearchKeywords(projectName);
        findRowInTableByKeywords(taskListHeader, keywords).then(({ found, matchedKeyword }) => {
            if (!found) {
                throw new Error(`❌ ไม่เจอแถวที่ตรงกับ [${keywords.join(', ')}] ใน "${taskListHeader}"`);
            }

            cy.get('h3').contains(taskListHeader).parent().within(() => {
                cy.contains('tbody tr', matchedKeyword, { timeout: TIMEOUT.NAV })
                    .should('be.visible')
                    .as('approveRowTarget');
            });
        });

        cy.get('@approveRowTarget')
            .find('span')
            .contains('Approve')
            .click();
    } else {
        cy.log(`⏭️ Already on approval page — skipping To Do List click`);
    }

    cy.url({ timeout: TIMEOUT.NAV }).should('include', expectedUrl);

    cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: TIMEOUT.LONG })
        .then((interceptions) => {
            interceptions.forEach((interception) => {
                expect(interception.response).to.exist;
                expect(interception.response!.statusCode).to.eq(200);
            });
        });

    coreTaskCallback();

    switch (finalAction) {
        case 'AlertAndLogout':
        case 'ComplexLogout':
            cy.url({ timeout: TIMEOUT.LONG }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout').should('be.visible').click();
            break;
        case 'StopAfterCore':
            cy.log('Core task finished. Stopping as requested.');
            break;
    }
};

export const createSimplePageApprovalFlow = (
    projectName: string,
    taskListHeader: TaskListHeader,
    expectedUrl: string,
    coreTaskCallback: CoreTaskCallback,
    finalAction: FinalAction = 'AlertAndLogout'
): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

    cy.get('h3').contains(taskListHeader).parent().within(() => {
        cy.contains('tbody tr', projectName, { timeout: TIMEOUT.NAV })
            .should('be.visible')
            .within(() => {
                cy.get('span').contains('Approve').click();
            });
    });

    cy.url({ timeout: TIMEOUT.LONG }).should('include', expectedUrl);
    coreTaskCallback();

    switch (finalAction) {
        case 'AlertAndLogout':
        case 'ComplexLogout':
            cy.url({ timeout: TIMEOUT.LONG }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout').click();
            break;
        case 'StopAfterCore':
            cy.log('Core task finished. Stopping as requested.');
            break;
    }
};

// ========================
// ROLE HELPERS
// ========================
function assignTaskViaTracking(
    projectName: string,
    assignee: string,
    billingSystem: string = ''
): void {
    cy.url().then((currentUrl) => {
        if (currentUrl.includes('/new-report/home/tracking')) {
            cy.log('⏭️ Already on tracking page — skip Menu navigation');
        } else {
            cy.intercept('GET', '**/PLMSpringBoot/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

            cy.contains('span', 'Menu', { timeout: TIMEOUT.LONG }).click();

            cy.get('a[href="#/new-report/home/tracking"]', { timeout: TIMEOUT.LONG })
                .should('be.visible')
                .click();

            cy.wait('@loadTracking', { timeout: TIMEOUT.NAV })
                .its('response.statusCode')
                .should('eq', 200);

            cy.url({ timeout: TIMEOUT.LONG }).should('include', '/new-report/home/tracking');
        }
    });

    cy.get('table.table.table-condensed', { timeout: TIMEOUT.NAV }).should('be.visible');
    cy.get('table.table.table-condensed tbody tr', { timeout: TIMEOUT.NAV })
        .first().find('td').first().should('not.be.empty');
    cy.contains('table.table.table-condensed tbody td', 'PLM', { timeout: TIMEOUT.NAV }).should('be.visible');

    assignTeamTask(projectName, assignee, billingSystem);
}

// ========================
// NAVIGATE TO WORKSPACE
// ========================
export type NavRole = 'SPAD' | 'CGMD' | 'ACTM' | 'OPER' | 'APO';
const AUTO_REDIRECT_ROLES: readonly NavRole[] = ['SPAD', 'ACTM', 'OPER', 'APO'];

const EXPECTED_HEADER: Record<NavRole, TaskListHeader> = {
    SPAD: 'To Do List',
    CGMD: 'To Do List',
    ACTM: 'Unassigned Task',
    OPER: 'Unassigned Task',
    APO: 'Unassigned Task',
};
export const navigateToWorkspace = (options?: { role?: NavRole }): void => {
    const role: NavRole = options?.role ?? 'CGMD';
    const isAutoRedirect = AUTO_REDIRECT_ROLES.includes(role);

    if (isAutoRedirect) {
        cy.log(`🎯 [${role}] รอ auto-redirect เข้า workspace-home (ไม่ click Menu, ไม่ intercept loadTracking)`);
        cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
    } else {
        // ใช้ .should() แทน .then() เพื่อให้ Cypress poll จนกว่า URL จะนิ่ง/commit จริง
        // กัน race condition ตอน full page reload (เช่นตอน Logout ทำให้เกิด hard navigation)
        cy.url({ timeout: TIMEOUT.LONG }).should(
            (currentUrl) =>
                currentUrl.includes('/login') || currentUrl.includes('/workspace-home/workspace'),
        );

        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) {
                // ไม่ควรเกิดขึ้นแล้วหลังแก้ double-loop bug ใน performApprovalRole —
                // ถ้าเห็น error นี้อีก แปลว่ามี call site อื่นเรียก navigateToWorkspace()
                // หลัง Logout ไปแล้วโดยไม่ตั้งใจ ต้องตามหาแล้วเอาออก ไม่ใช่ silently re-login
                throw new Error(
                    `❌ [${role}] navigateToWorkspace() ถูกเรียกตอนอยู่หน้า /login — ` +
                    `แสดงว่ามี call site เรียกซ้ำหลัง Logout ไปแล้ว ต้องหาต้นเหตุแล้วแก้ ไม่ควร re-login ปิดไว้ตรงนี้`
                );
            } else if (currentUrl.includes('/workspace-home/workspace')) {
                cy.log(`⏭️ [${role}] Already on workspace-home — skip Menu click`);
            } else {
                cy.log(`🎯 [${role}] Click Menu -> workspace-home (รอ URL + table ready แทน network intercept)`);
                cy.contains('span', 'Menu', { timeout: TIMEOUT.LONG }).click();
                cy.get('a[href="#/workspace-home/workspace"]', { timeout: TIMEOUT.LONG }).click();
                cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
            }
        });
    }

    waitForTableReady(EXPECTED_HEADER[role], TIMEOUT.NAV);
};

const performApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: {
        searchBy?: 'project' | 'po';
        assignee?: string;
        billingSystem?: string;
        role?: NavRole;
    }
): void => {
    loginAndWaitReady(user, pass);

    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const searchBy = options?.searchBy ?? 'po';
    const navRole: NavRole = options?.role ?? 'CGMD';
    const taskHeader: TaskListHeader = EXPECTED_HEADER[navRole];

    cy.log(`📋 Project: ${projectNamePONAME}`);
    cy.log(`🔁 Total PO to process: ${poCount}`);
    cy.log(`🔍 Search mode: ${searchBy}`);
    cy.log(`🎭 Nav role: ${navRole}`);
    cy.log(`📑 Task list header: "${taskHeader}"`);

    // ✅ FIX: ฟังก์ชันดึง keyword ที่ถูกต้อง — ใช้ allPoNames[index] เสมอ
    const getKeyword = (index: number): string => {
        if (searchBy === 'project') {
            return projectNamePONAME;
        }
        // ใช้ allPoNames[index] ถ้ามี, ไม่อย่างนั้นใช้ fallback
        const poName = allPoNames[index];
        if (poName) {
            cy.log(`🔑 getKeyword(${index}): allPoNames[${index}] = "${poName}"`);
            return poName;
        }
        const fallback = `${projectNamePONAME}_PO${index + 1}`;
        cy.log(`⚠️ getKeyword(${index}): allPoNames[${index}] ไม่มีค่า — ใช้ fallback "${fallback}"`);
        return fallback;
    };

    // ================================================
    // PHASE 2: Approve (เรียกหลัง assign ครบแล้ว)
    // ================================================
    const approveAllPOs = (): void => {
        cy.log(`📦 Starting approval — approveFunction จะจัดการครบทุก PO (${poCount}) เอง`);

        waitForTableReady(taskHeader, TIMEOUT.NAV);

        const keyword = getKeyword(0);

        searchInTableWithPagination(
            taskHeader,
            keyword,
            () => {
                cy.get(`h3:contains("${taskHeader}")`)
                    .parent()
                    .find('tbody tr.cursor-point')
                    .filter((_i, el) => Cypress.$(el).text().includes(keyword))
                    .first()
                    .as('targetRow');
            },
            {
                waitAfterNext: 2000,
                filterCallback: ($row) => {
                    const rowText = $row.text().trim();
                    return rowText.includes(keyword) && !rowText.includes('Fetching data');
                }
            }
        );

        cy.get('@targetRow').should('be.visible').click();
        cy.log(`✅ [1/${poCount}] Entered PO approval page`);

        // ✅ เรียกครั้งเดียว — approveFunction (ผ่าน loopApproveAllPOs) จัดการ PO ที่เหลือทั้งหมดเอง
        // ไม่ต้องส่ง finalAction เข้าไป เพราะ loopApproveAllPOs คำนวณเองจาก isLast ภายใน
        approveFunction(projectNamePONAME, {
            alreadyOnPage: true,
            role: navRole,
        } as any);

        cy.log('✅ All POs approved — flow complete');
    };

    // ================================================
    // PHASE 1: Assign ทุก PO (ไม่ใช่แค่ PO เดียว)
    // ================================================
    const assignNextPO = (index: number): void => {
        // ✅ FIX: ใช้ poCount แทน ASSIGN_PO_LIMIT
        if (index >= poCount) {
            cy.log(`✅ Assign เสร็จแล้ว ${poCount} PO — กลับไป workspace เพื่อเริ่ม approve`);
            navigateToWorkspace({ role: navRole });
            approveAllPOs();
            return;
        }

        const currentUniqueKeyword = getKeyword(index);
        cy.log(`🧩 [Assign ${index + 1}/${poCount}] "${currentUniqueKeyword}"`);

        assignTaskViaTracking(projectNamePONAME, options!.assignee!, currentUniqueKeyword);

        cy.wait(2000);
        assignNextPO(index + 1);
    };

    // ================================================
    // ENTRY POINT
    // ================================================
    if (options?.assignee) {
        assignNextPO(0);
    } else {
        approveAllPOs();
    }
};

export const performRoleTaskWithAssignment = (
    user: string,
    pass: string,
    assignee: string,
    approveFunction: ApproveFunction,
    billingSystem: string = '',
    options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    performApprovalRole(user, pass, approveFunction, {
        assignee,
        billingSystem,
        searchBy: options?.searchBy,
        role: options?.role,
    });
};

export const performSimpleApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    performApprovalRole(user, pass, approveFunction, {
        searchBy: options?.searchBy,
        role: options?.role,
    });
};

export const performSimpleClaimAndApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    loginAndWaitReady(user, pass);

    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const searchBy = options?.searchBy ?? 'po';

    ClaimProject(projectNamePONAME);

    let firstKeyword: string =
        searchBy === 'project'
            ? projectNamePONAME
            : allPoNames[0] ?? `${projectNamePONAME}_PO1`;

    if (searchBy === 'po' && firstKeyword.includes('_')) {
        firstKeyword = firstKeyword.split('_')[0].trim();
    }

    cy.log(`📦 [1/${poCount}] Searching by "${searchBy}": "${firstKeyword}"`);
    waitForTableReady('To Do List', TIMEOUT.NAV);

    searchInTableWithPagination(
        'To Do List',
        firstKeyword,
        () => {
            cy.get('h3:contains("To Do List")')
                .parent()
                .find('tbody tr.cursor-point')
                .filter((_i, el) => Cypress.$(el).text().includes(firstKeyword))
                .first()
                .as('targetRow');
        },
        {
            waitAfterNext: 2000,
            filterCallback: ($row) => {
                const rowText = $row.text().trim();
                return rowText.includes(firstKeyword) && !rowText.includes('Fetching data');
            },
        }
    );

    cy.get('@targetRow', { timeout: TIMEOUT.SHORT }).should('be.visible').click();
    cy.log(`✅ [1/${poCount}] Entered PO approval page`);

    approveFunction(projectNamePONAME, { alreadyOnPage: true, role: options?.role } as any);
};

// ========================
// ASSIGN TEAM TASK
// ========================

export const registerAssignAlertListener = (): void => {
    cy.on('window:alert', (text) => {
        cy.log(`🔔 Alert: "${text}"`);
        expect(text).to.include('success');
    });
};

export const assignAllPOsThenNavigate = (
    projectName: string,
    assignee: string,
    options?: { role?: NavRole }
): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const navRole: NavRole = options?.role ?? 'CGMD';

    // ✅ FIX: ใช้ poCount แทน ASSIGN_PO_LIMIT
    cy.log(`🔁 Total PO: ${poCount} — จะ assign ทุก PO`);

    const assignNextPO = (index: number): void => {
        if (index >= poCount) {
            cy.log('✅ Assign ทุก PO เสร็จแล้ว — เรียก navigateToWorkspace()');
            navigateToWorkspace({ role: navRole });
            return;
        }

        const currentUniqueKeyword = allPoNames[index] ?? `${projectName}_PO${index + 1}`;
        cy.log(`🧩 [Assign ${index + 1}/${poCount}] "${currentUniqueKeyword}"`);

        assignTaskViaTracking(projectName, assignee, currentUniqueKeyword);

        assignNextPO(index + 1);
    };

    assignNextPO(0);
};
// ========================
// APPROVE PROJECT (Project Code -> Project Name -> PO Name fallback)
// ========================
export const approveProject = (projectName: string): void => {
    const keywords = buildSearchKeywords(projectName);
    cy.log(`⏳ Waiting for one of [${keywords.join(', ')}] to appear in To Do List...`);

    const matchesAnyKeyword = (tdText: string): string | null =>
        keywords.find((k) => tdText === k || tdText.startsWith(k + '_') || tdText.startsWith(k + ' ')) ?? null;

    cy.get('h3:contains("To Do List")', { timeout: TIMEOUT.NAV })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            const found = $rows.toArray().some((row) =>
                matchesAnyKeyword(stripLabel(Cypress.$(row).find('td[colspan="2"]').text())) !== null
            );
            expect(found, `Expected To Do List to contain one of [${keywords.join(', ')}]`).to.be.true;
        })
        .then(($rows) => {
            const row = $rows.toArray().find((el) =>
                matchesAnyKeyword(stripLabel(Cypress.$(el).find('td[colspan="2"]').text())) !== null
            );
            const tdText = row ? stripLabel(Cypress.$(row).find('td[colspan="2"]').text()) : '';
            const matchedKeyword = matchesAnyKeyword(tdText) || projectName;

            cy.log(`✅ Matched keyword: "${matchedKeyword}" — proceeding to search...`);

            searchInTableWithPagination(
                'To Do List',
                matchedKeyword,
                (_$row, _index) => {
                    cy.get('h3:contains("To Do List")')
                        .parent()
                        .find('tbody tr.cursor-point')
                        .filter((_i, el) =>
                            matchesAnyKeyword(stripLabel(Cypress.$(el).find('td[colspan="2"]').text())) !== null
                        )
                        .first()
                        .as('approveRow');

                    cy.get('@approveRow').should('be.visible');
                    cy.get('@approveRow').click();
                    cy.log(`✅ Successfully entered approval page: ${matchedKeyword}`);
                },
                {
                    waitAfterNext: 2000,
                    filterCallback: ($row) =>
                        matchesAnyKeyword(stripLabel($row.find('td[colspan="2"]').text())) !== null
                }
            );
        });
};
export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po'; specificPoName?: string }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const claimBy = options?.claimBy ?? 'po';
    const MAX_PAGES = 3;
    const MAX_RELOAD_ATTEMPTS = 6;   // ✅ ADD: รอข้อมูลมาถึง backend สูงสุด 6 รอบ (~30s รวม wait)
    const RELOAD_WAIT_MS = 5000;     // ✅ ADD: เว้นก่อน reload แต่ละรอบ

    cy.log(`🔁 Total PO to Claim: ${poCount}`);
    cy.log(`🔑 Claim mode: ${claimBy}`);

    const waitForKeywordInToDo = (keyword: string): void => {
        cy.get('h3:contains("To Do List")', { timeout: TIMEOUT.NAV })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
                expect($rows.text()).to.include(keyword);
            });
    };

    const searchAndClaimWithKeyword = (keyword: string, currentPage: number = 1): Cypress.Chainable<boolean> => {
        if (currentPage > MAX_PAGES) {
            cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
            return cy.wrap<boolean>(false, { log: false });
        }
        cy.log(`🔍 [Claim] Page ${currentPage} keyword: "${keyword}"`);

        return retryFindRowInTable('Unassigned Task', keyword).then((found) => {
            if (found) {
                return cy.get('h3:contains("Unassigned Task")')
                    .parent()
                    .find('tbody tr')
                    .then(($rows) => {
                        const foundRowIndex = $rows.toArray().findIndex((row) => rowMatchesKeyword(row, keyword));
                        cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}, keyword: "${keyword}"`);

                        cy.intercept('POST', '**/claim**').as('claimApi');
                        cy.get('h3:contains("Unassigned Task")')
                            .parent()
                            .find('tbody tr')
                            .eq(foundRowIndex)
                            .find('button.claim-top')
                            .click({ force: true });

                        cy.log(`✅ Claimed`);
                        waitForKeywordInToDo(keyword);
                        cy.log(`✅ Confirmed in To Do List`);

                        return cy.wrap<boolean>(true, { log: false });
                    });
            }
            return cy.get('body').then(($body) => {
                const $section = $body.find('h3:contains("Unassigned Task")').parent();
                const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                if ($nextBtn.length > 0) {
                    cy.log(`➡️ Page ${currentPage} - Not found, going next...`);

                    cy.wrap($nextBtn).click();

                    cy.wait(1000);
                    cy.get('h3:contains("Unassigned Task")', { timeout: TIMEOUT.NAV })
                        .parent()
                        .find('tbody tr', { timeout: TIMEOUT.NAV })
                        .should(($rows) => {
                            expect($rows.text()).not.to.contain('Fetching data');
                            expect($rows.length).to.be.greaterThan(0);
                        });

                    return searchAndClaimWithKeyword(keyword, currentPage + 1);
                }
                cy.log(`📋 No more pages, "${keyword}" not found`);
                return cy.wrap<boolean>(false, { log: false });
            });
        });
    };

    const claimWithFallback = (keywords: string[], idx: number = 0, reloadAttempt: number = 0): Cypress.Chainable<null> => {
        if (idx >= keywords.length) {
            // ✅ ADD: ครบทุก keyword + ทุกหน้าแล้วยังไม่เจอ — เป็นไปได้ว่าข้อมูลยังไม่มาถึง
            // backend (พึ่งกด Approve/Assign มาสดๆ) ลอง reload หน้าแล้วค้นหาใหม่ทั้งชุด keyword
            if (reloadAttempt < MAX_RELOAD_ATTEMPTS) {
                cy.log(`⏳ ยังไม่เจอ [${keywords.join(', ')}] — รอข้อมูลมา (reload ${reloadAttempt + 1}/${MAX_RELOAD_ATTEMPTS})`);
                cy.wait(RELOAD_WAIT_MS);
                cy.reload();
                cy.get('.loading-curtain', { timeout: 60000 }).should('not.exist');
                waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                return claimWithFallback(keywords, 0, reloadAttempt + 1);
            }
            throw new Error(`❌ ไม่เจอแถวที่ตรงกับ keyword ใดๆ เลยแม้ reload ${MAX_RELOAD_ATTEMPTS} ครั้ง: [${keywords.join(', ')}]`);
        }
        const keyword = keywords[idx];
        cy.log(`🔑 [Claim] ลองด้วย keyword ${idx + 1}/${keywords.length}: "${keyword}"`);
        return searchAndClaimWithKeyword(keyword).then(
            (success): Cypress.Chainable<null> => {
                if (!success) {
                    cy.log(`⚠️ ไม่เจอด้วย "${keyword}" — ลอง keyword ถัดไป`);
                    return claimWithFallback(keywords, idx + 1, reloadAttempt);
                }
                return cy.wrap<null>(null, { log: false });
            }
        );
    };

    const claimByPO = (remainingPOs: number, poIndex: number = 0): void => {
        if (remainingPOs <= 0) {
            cy.log('✅ All POs claimed and moved to To Do List');
            return;
        }
        const poName = allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`;
        const keywords = buildSearchKeywords(projectName, poName);
        cy.log(`🔁 [Claim-PO ${poIndex + 1}] keywords (Code -> Project -> PO): [${keywords.join(', ')}]`);

        claimWithFallback(keywords).then(() => {
            claimByPO(remainingPOs - 1, poIndex + 1);
        });
    };

    if (claimBy === 'project') {
        claimWithFallback(buildSearchKeywords(projectName));
    } else {
        claimByPO(poCount);
    }
};

const rowMatchesKeyword = (row: HTMLElement, keyword: string): boolean => {
    const $row = Cypress.$(row);

    const codeText = $row.find('td').first().text().trim();
    if (codeText === keyword) {
        return true;
    }

    // Project Name column (td[colspan="2"], e.g. "MOB POST OT MAIN PRJ 0814 1138")
    const tdText = stripLabel($row.find('td[colspan="2"]').text());
    return (
        tdText === keyword ||
        tdText.startsWith(keyword + '_') ||
        tdText.startsWith(keyword + ' ')
    );
};
// ========================
// ASSIGN TEAM TASK
// ========================

const TEAM_TASK_RELOAD_ATTEMPTS = 5;
const TEAM_TASK_RELOAD_WAIT_MS = 50000;

const reloadAndWaitForTeamTaskTable = (): void => {
    cy.reload();

    cy.url({ timeout: TIMEOUT.NAV }).should((url) => {
        expect(url, '❌ Reload แล้วหลุดไปหน้า /login — session อาจหมดอายุระหว่างรอ').not.to.include('/login');
    });

    cy.get('h3', { timeout: TIMEOUT.NAV })
        .contains('Team Task')
        .parent()
        .find('tbody tr', { timeout: TIMEOUT.NAV })
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            expect($rows.length).to.be.greaterThan(0);
        });
};

export function assignTeamTask(
    taskIdentifier: string,
    assignee: string,
    uniqueKeyword: string = ''
): void {
    cy.get('h3', { timeout: TIMEOUT.NAV })
        .contains('Team Task')
        .should('be.visible')
        .parent()
        .find('tbody tr', { timeout: TIMEOUT.NAV })
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            expect($rows.length).to.be.greaterThan(0);
        });

    const searchKeyword = uniqueKeyword
        ? uniqueKeyword.trim()
        : taskIdentifier.split('_')[0].trim();

    cy.log(`🔍 assignTeamTask — searchKeyword: "${searchKeyword}"`);

    if (!searchKeyword) {
        throw new Error(`❌ searchKeyword is empty — cannot search`);
    }

    const findAndAssignOnCurrentPage = (reloadAttempt: number = 0): void => {
        // ✅ FIX: scope ทุกอย่างไว้ใต้ Team Task section เดียว กัน pagination
        // ไปชนกับ ul.pagination ของ "Tracking Task" table ที่อยู่ถัดลงไปในหน้าเดียวกัน
        cy.get('h3', { timeout: TIMEOUT.NAV })
            .contains('Team Task')
            .parent()
            .as('teamTaskSection');

        cy.get('@teamTaskSection').find('tbody tr').then(($rows) => {
            const matchedRow = $rows.filter((_, el) => {
                const productName = Cypress.$(el).find('td:nth-child(2) div').text().trim();
                return productName.includes(searchKeyword);
            });

            if (matchedRow.length > 0) {
                const productNameText = Cypress.$(matchedRow[0])
                    .find('td:nth-child(2) div')
                    .text()
                    .trim();
                cy.log(`✅ Found row — Product: "${productNameText}"`);

                const $row = matchedRow.first();
                cy.wrap($row).scrollIntoView().should('be.visible');

                cy.intercept('GET', '/PLMSpringBoot/api/**').as('assigneeLoad');

                cy.wrap($row)
                    .find('select.form-control.input-sm')
                    .as('assigneeDropdown')
                    .scrollIntoView()
                    .trigger('click');

                cy.wait('@assigneeLoad', { timeout: TIMEOUT.NAV })
                    .its('response.statusCode')
                    .should('eq', 200);

                cy.get('@assigneeDropdown')
                    .find('option')
                    .should('have.length.greaterThan', 1);

                cy.get('@assigneeDropdown')
                    .select(assignee, { force: true })
                    .trigger('change')
                    .trigger('input');

                cy.get('@assigneeDropdown').should('have.value', assignee);
                cy.log(`✅ Selected assignee: "${assignee}"`);

                cy.wrap($row)
                    .find('button.btn-info')
                    .filter((_, el) => {
                        const txt = Cypress.$(el).text().trim();
                        return txt === 'Set' || txt === 'Reassign';
                    })
                    .first()
                    .should('not.be.disabled', { timeout: TIMEOUT.SHORT });

                cy.intercept('GET', '/PLMSpringBoot/api/**').as('afterSet');

                let assignAlertText: string | null = null;
                cy.once('window:alert', (text) => {
                    assignAlertText = text;
                });

                cy.wrap($row)
                    .find('button.btn-info')
                    .filter((_, el) => {
                        const txt = Cypress.$(el).text().trim();
                        return txt === 'Set' || txt === 'Reassign';
                    })
                    .first()
                    .click({ force: true });

                cy.wait('@afterSet', { timeout: TIMEOUT.NAV })
                    .its('response.statusCode')
                    .should('eq', 200);

                cy.wrap(null).should(() => {
                    expect(assignAlertText, `expected an alert after Set/Reassign click for "${searchKeyword}"`).to.not.be.null;
                    expect(String(assignAlertText).toLowerCase(), `alert text should indicate success: "${assignAlertText}"`).to.include('success');
                });

                cy.get('@teamTaskSection')
                    .find('tbody', { timeout: TIMEOUT.NAV })
                    .should(($tbody) => {
                        const row = $tbody.find('tr').toArray().find((el) =>
                            Cypress.$(el).find('td:nth-child(2) div').text().trim().includes(searchKeyword)
                        );
                        expect(row, `row for "${searchKeyword}" should still be present in Team Task`).to.exist;

                        const rowText = Cypress.$(row as HTMLElement).text();
                        expect(rowText, `row for "${searchKeyword}" should now show assignee "${assignee}"`).to.include(assignee);
                    });

                cy.log('✅ assignTeamTask complete');

            } else {
                // ✅ FIX: ถ้ายังอยู่หน้า 1 และไม่เจอ — PO ใหม่มักโผล่หน้า 1 ก่อน (sort by recency)
                // ระบบช้า/ยัง sync ไม่ทัน จึงควร reload+รอ ก่อนรีบกด Next ไปหน้าอื่น
                cy.get('@teamTaskSection').find('ul.pagination li.active').then(($active) => {
                    const isFirstPage = $active.length === 0 || $active.text().trim() === '1';

                    if (isFirstPage && reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                        cy.log(`⏳ ไม่เจอ "${searchKeyword}" บนหน้า 1 — อาจยัง sync ไม่ทัน รอแล้ว reload (${reloadAttempt + 1}/${TEAM_TASK_RELOAD_ATTEMPTS})`);
                        cy.wait(TEAM_TASK_RELOAD_WAIT_MS);
                        reloadAndWaitForTeamTaskTable();
                        findAndAssignOnCurrentPage(reloadAttempt + 1);
                        return;
                    }

                    // ✅ FIX: scope pagination lookup ใต้ @teamTaskSection เท่านั้น
                    // (เดิม cy.get('ul.pagination li') ดึงจากทั้งหน้า ปนกับ Tracking Task table ด้านล่าง)
                    cy.get('@teamTaskSection').find('ul.pagination li').then(($items) => {
                        const nextItem = $items.filter((_, li) => {
                            return (
                                Cypress.$(li).text().trim() === 'Next' &&
                                !Cypress.$(li).hasClass('disabled')
                            );
                        });

                        if (nextItem.length > 0) {
                            cy.log(`➡️ Not found on this page — going next`);

                            cy.wrap(nextItem.first()).find('a').click();

                            cy.wait(500);
                            cy.get('h3', { timeout: TIMEOUT.NAV })
                                .contains('Team Task')
                                .parent()
                                .find('tbody tr', { timeout: TIMEOUT.NAV })
                                .should(($rows) => {
                                    expect($rows.text()).not.to.contain('Fetching data');
                                    expect($rows.length).to.be.greaterThan(0);
                                });

                            findAndAssignOnCurrentPage(0); // reset reload counter บนหน้าใหม่
                        } else if (reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                            // ✅ ADD: เดินครบทุกหน้าแล้วก็ยังไม่เจอ — วนกลับ First page แล้ว reload รอบใหม่
                            cy.log(`🔄 เดินครบทุกหน้าแล้วไม่เจอ "${searchKeyword}" — วนกลับ First page แล้ว reload (${reloadAttempt + 1}/${TEAM_TASK_RELOAD_ATTEMPTS})`);
                            cy.get('@teamTaskSection').contains('a', 'First').click();
                            cy.wait(TEAM_TASK_RELOAD_WAIT_MS);
                            reloadAndWaitForTeamTaskTable();
                            findAndAssignOnCurrentPage(reloadAttempt + 1);
                        } else {
                            throw new Error(`❌ "${searchKeyword}" not found on any page after ${TEAM_TASK_RELOAD_ATTEMPTS} reload attempts`);
                        }
                    });
                });
            }
        });
    };

    findAndAssignOnCurrentPage();
}