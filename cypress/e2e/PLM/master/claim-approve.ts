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

const rowMatchesKeyword = (row: HTMLElement, keyword: string): boolean => {
    const tdText = stripLabel(Cypress.$(row).find('td[colspan="2"]').text());
    return (
        tdText === keyword ||
        tdText.startsWith(keyword + '_') ||
        tdText.startsWith(keyword + ' ')
    );
};

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
            return cy.wrap(true);
        }

        if (attempt >= maxAttempts) {
            cy.log(`❌ "${keyword}" not found after ${maxAttempts} attempts`);
            return cy.wrap(false);
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
// CLAIM PROJECT
// ========================
export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po'; specificPoName?: string }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const claimBy = options?.claimBy ?? 'po';

    cy.log(`🔁 Total PO to Claim: ${poCount}`);
    cy.log(`🔑 Claim mode: ${claimBy}`);

    const MAX_PAGES = 3;

    const waitForKeywordInToDo = (keyword: string): void => {
        cy.get('h3:contains("To Do List")', { timeout: TIMEOUT.NAV })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
                expect($rows.text()).to.include(keyword);
            });
    };

    const claimOnce = (keyword: string): void => {
        const searchAndClaimOnce = (currentPage: number = 1): void => {
            if (currentPage > MAX_PAGES) {
                cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
                return;
            }

            cy.log(`🔍 [Claim-Project] Page ${currentPage} keyword: "${keyword}"`);

            retryFindRowInTable('Unassigned Task', keyword).then((found) => {
                if (found) {
                    cy.get('h3:contains("Unassigned Task")')
                        .parent()
                        .find('tbody tr')
                        .then(($rows) => {
                            const foundRowIndex = $rows.toArray()
                                .findIndex((row) => rowMatchesKeyword(row, keyword));

                            cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}`);

                            cy.intercept('POST', '**/claim**').as('claimApi');

                            cy.get('h3:contains("Unassigned Task")')
                                .parent()
                                .find('tbody tr')
                                .eq(foundRowIndex)
                                .find('button.claim-top')
                                .click({ force: true });

                            cy.log(`✅ Claimed project (once)`);
                            waitForKeywordInToDo(keyword);
                            cy.log(`✅ Confirmed in To Do List`);
                        });
                } else {
                    cy.get('body').then(($body) => {
                        const $section = $body.find('h3:contains("Unassigned Task")').parent();
                        const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                        if ($nextBtn.length > 0) {
                            cy.log(`➡️ Page ${currentPage} - Not found, going next...`);

                            cy.intercept('GET', '**/getTodoList/**').as('nextPage');
                            cy.wrap($nextBtn).click();
                            cy.wait('@nextPage', { timeout: TIMEOUT.NAV });

                            searchAndClaimOnce(currentPage + 1);
                        } else {
                            cy.log(`📋 No more pages, "${keyword}" not found`);
                        }
                    });
                }
            });
        };

        searchAndClaimOnce();
    };

    const claimByPO = (remainingPOs: number, poIndex: number = 0, currentPage: number = 1): void => {
        if (remainingPOs <= 0) {
            cy.log('✅ All POs claimed and moved to To Do List');
            return;
        }

        if (currentPage > MAX_PAGES) {
            cy.log(`⚠️ Checked ${MAX_PAGES} pages, checking To Do List...`);
            return;
        }

        const keyword = allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`;
        cy.log(`🔍 [Claim-PO] Page ${currentPage} (Remaining: ${remainingPOs}) keyword: "${keyword}"`);

        retryFindRowInTable('Unassigned Task', keyword).then((found) => {
            if (found) {
                cy.get('h3:contains("Unassigned Task")')
                    .parent()
                    .find('tbody tr')
                    .then(($rows) => {
                        const foundRowIndex = $rows.toArray()
                            .findIndex((row) => rowMatchesKeyword(row, keyword));

                        cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}, keyword: "${keyword}"`);

                        cy.intercept('POST', '**/claim**').as('claimApi');

                        cy.get('h3:contains("Unassigned Task")')
                            .parent()
                            .find('tbody tr')
                            .eq(foundRowIndex)
                            .find('button.claim-top')
                            .click({ force: true });

                        cy.log(`✅ Claimed 1 PO`);
                        waitForKeywordInToDo(keyword);
                        cy.log(`✅ PO confirmed in To Do List`);

                        claimByPO(remainingPOs - 1, poIndex + 1, 1);
                    });
            } else {
                cy.get('body').then(($body) => {
                    const $section = $body.find('h3:contains("Unassigned Task")').parent();
                    const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                    if ($nextBtn.length > 0) {
                        cy.log(`➡️ Page ${currentPage} - Not found, going next...`);

                        cy.intercept('GET', '**/getTodoList/**').as('nextPage');
                        cy.wrap($nextBtn).click();
                        cy.wait('@nextPage', { timeout: TIMEOUT.NAV });

                        claimByPO(remainingPOs, poIndex, currentPage + 1);
                    } else {
                        cy.log(`📋 No more pages, "${keyword}" not found`);
                    }
                });
            }
        });
    };

    if (claimBy === 'project') {
        claimOnce(projectName);
    } else {
        claimByPO(poCount);
    }
};

// ========================
// APPROVE PROJECT
// ========================
export const approveProject = (projectName: string): void => {
    cy.log(`⏳ Waiting for "${projectName}" to appear in To Do List...`);

    const matchesKeyword = (tdText: string, keyword: string): boolean =>
        tdText === keyword ||
        tdText.startsWith(keyword + '_') ||
        tdText.startsWith(keyword + ' ');

    cy.get('h3:contains("To Do List")', { timeout: TIMEOUT.NAV })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            const found = $rows.toArray().some((row) => {
                const tdText = stripLabel(Cypress.$(row).find('td[colspan="2"]').text());
                return matchesKeyword(tdText, projectName);
            });
            expect(found, `Expected To Do List to contain "${projectName}"`).to.be.true;
        });

    cy.log(`✅ "${projectName}" found in To Do List, proceeding to search...`);

    searchInTableWithPagination(
        'To Do List',
        projectName,
        (_$row, _index) => {
            cy.get('h3:contains("To Do List")')
                .parent()
                .find('tbody tr.cursor-point')
                .filter((_i, el) => {
                    const tdText = stripLabel(Cypress.$(el).find('td[colspan="2"]').text());
                    return matchesKeyword(tdText, projectName);
                })
                .first()
                .as('approveRow');

            cy.get('@approveRow').should('be.visible');
            cy.get('@approveRow').click();

            cy.log(`✅ Successfully entered approval page: ${projectName}`);
        },
        {
            waitAfterNext: 2000,
            filterCallback: ($row) => {
                const tdText = stripLabel($row.find('td[colspan="2"]').text());
                return matchesKeyword(tdText, projectName);
            }
        }
    );
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
        retryFindRowInTable(taskListHeader, projectName).then((found) => {
            if (!found) {
                throw new Error(`❌ "${projectName}" not found in "${taskListHeader}" after retries`);
            }

            cy.get('h3').contains(taskListHeader).parent().within(() => {
                cy.contains('tbody tr', projectName, { timeout: TIMEOUT.NAV })
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
    APO:  'Unassigned Task',
};

export const navigateToWorkspace = (options?: { role?: NavRole }): void => {
    const role: NavRole = options?.role ?? 'CGMD';
    const isAutoRedirect = AUTO_REDIRECT_ROLES.includes(role);

    if (isAutoRedirect) {
        cy.log(`🎯 [${role}] รอ auto-redirect เข้า workspace-home (ไม่ click Menu, ไม่ intercept loadTracking)`);
        cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
    } else {
        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/workspace-home/workspace')) {
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

// ✅ FIX: ลบ ASSIGN_PO_LIMIT ออก — ให้ assign ทุก PO ตาม poCount จริง
// เดิม: const ASSIGN_PO_LIMIT = 1; → ทำให้ assign แค่ PO เดียว แต่ approve พยายามหาทุก PO → fail
// ใหม่: ใช้ poCount ตรงๆ → assign ครบทุก PO → approve ได้ครบ

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
        cy.log(`📦 Starting approval loop for ${poCount} PO(s)`);

        for (let i = 0; i < poCount; i++) {
            const keyword = getKeyword(i);
            const isLast = i === poCount - 1;
            const finalAction: FinalAction = isLast ? 'AlertAndLogout' : 'StopAfterCore';

            cy.log(`🔄 PO ${i + 1}/${poCount}: "${keyword}" — finalAction: ${finalAction}`);

            waitForTableReady(taskHeader, TIMEOUT.NAV);

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

            cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
            cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
            cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

            cy.get('@targetRow').should('be.visible').click();
            cy.log(`✅ [${i + 1}/${poCount}] Entered PO approval page`);

            approveFunction(projectNamePONAME, { 
                alreadyOnPage: true, 
                role: navRole,
                finalAction 
            } as any);

            // ถ้าไม่ใช่ PO สุดท้าย ต้องกลับไป workspace เพื่อ approve PO ถัดไป
            if (!isLast) {
                cy.log(`🔙 Going back to workspace for next PO...`);
                navigateToWorkspace({ role: navRole });
            }
        }

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

export function assignTeamTask(
    taskIdentifier: string,
    assignee: string,
    uniqueKeyword: string = ''
): void {
    cy.get('h3').contains('Team Task', { timeout: TIMEOUT.NAV })
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

    const findAndAssignOnCurrentPage = (): void => {
        cy.get('tbody tr').then(($rows) => {
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

                cy.get('h3').contains('Team Task', { timeout: TIMEOUT.NAV })
                    .parent()
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
                cy.get('ul.pagination li').then(($items) => {
                    const nextItem = $items.filter((_, li) => {
                        return (
                            Cypress.$(li).text().trim() === 'Next' &&
                            !Cypress.$(li).hasClass('disabled')
                        );
                    });

                    if (nextItem.length > 0) {
                        cy.log(`➡️ Not found on this page — going next`);

                        // ✅ FIX: นำ cy.intercept และ cy.wait('@getRequest') ออก
                        // เปลี่ยนมารอ DOM settle แทน เพราะ Next page อาจไม่ได้ยิง API
                        cy.wrap(nextItem.first()).find('a').click();
                        
                        cy.wait(500);
                        cy.get('h3').contains('Team Task', { timeout: TIMEOUT.NAV })
                            .parent()
                            .find('tbody tr', { timeout: TIMEOUT.NAV })
                            .should(($rows) => {
                                expect($rows.text()).not.to.contain('Fetching data');
                                expect($rows.length).to.be.greaterThan(0);
                            });

                        findAndAssignOnCurrentPage();
                    } else {
                        throw new Error(`❌ "${searchKeyword}" not found on any page`);
                    }
                });
            }
        });
    };

    findAndAssignOnCurrentPage();
}

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