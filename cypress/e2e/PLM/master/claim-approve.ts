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

const LOADER_SELECTOR = '.loading-curtain, .spinner, [class*="loading"]:visible';

// ========================
// SHARED UTILS
// ========================
const stripLabel = (raw: string): string =>
    raw.replace(/\(\s*\w+\s*\)/g, '').replace(/\s+/g, ' ').trim();

const rowMatchesKeyword = (row: HTMLElement, keyword: string): boolean => {
    const $row = Cypress.$(row);
    const codeText = $row.find('td').first().text().trim();
    if (codeText === keyword) return true;

    const tdText = stripLabel($row.find('td[colspan="2"]').text());
    if (tdText === keyword || tdText.startsWith(keyword + '_') || tdText.startsWith(keyword + ' ')) return true;

    return $row.text().includes(keyword);
};

const waitForLoadingState = (): void => {
    cy.get('body').then(($body) => {
        const hasActiveLoader = $body.find(LOADER_SELECTOR).length > 0;
        if (hasActiveLoader) {
            cy.get(LOADER_SELECTOR, { timeout: TIMEOUT.MEDIUM }).should('not.exist');
        } else {
            cy.wait(500);
        }
    });
};

const getTableContainer = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.contains('h3', headerText).parent().find('table') as unknown as Cypress.Chainable<JQuery<HTMLElement>>;
};

const getSectionContainer = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.contains('h3', headerText).parent() as unknown as Cypress.Chainable<JQuery<HTMLElement>>;
};

const waitForKeywordInToDo = (keyword: string): void => {
    getTableContainer('To Do List')
        .find('tbody tr', { timeout: TIMEOUT.NAV })
        .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
            expect($rows.text()).to.include(keyword);
        });
};

// ========================
// INTERCEPT HELPER
// ========================
export const registerApprovalPageIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');
};

// ========================
// SMART WAIT HELPERS
// ========================
const waitForTableReady = (headerText: string, timeoutMs: number = TIMEOUT.NAV): Cypress.Chainable => {
    getTableContainer(headerText).then(($container) => {
        if ($container.find(LOADER_SELECTOR).length > 0) {
            cy.wrap($container).find(LOADER_SELECTOR, { timeout: timeoutMs }).should('not.exist');
        }
    });

    return getTableContainer(headerText)
        .find('tbody tr', { timeout: timeoutMs })
        .should(($rows) => {
            const text = $rows.text();
            expect(text).not.to.contain('Fetching data');
            const isEmptyState = /no data|ไม่พบข้อมูล|empty/i.test(text);
            if (!isEmptyState) {
                expect($rows.length, `Expected rows in "${headerText}" unless it's empty`).to.be.greaterThan(0);
            }
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
        cy.wait(Math.min(800 * attempt, 4000));
        waitForLoadingState();
        return retryFindRowInTable(headerText, keyword, maxAttempts, attempt + 1);
    });
};

export const projectExistsInTable = (headerText: string, keyword: string): Cypress.Chainable<boolean> => {
    return retryFindRowInTable(headerText, keyword);
};

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

    if (!options?.alreadyOnPage) {
        registerApprovalPageIntercepts();
        const keywords = buildSearchKeywords(projectName);
        findRowInTableByKeywords(taskListHeader, keywords).then(({ found, matchedKeyword }) => {
            if (!found) {
                throw new Error(`❌ ไม่เจอแถวที่ตรงกับ [${keywords.join(', ')}] ใน "${taskListHeader}"`);
            }
            getTableContainer(taskListHeader).within(() => {
                cy.contains('tbody tr', matchedKeyword, { timeout: TIMEOUT.NAV }).should('be.visible').as('approveRowTarget');
            });
        });

        cy.get('@approveRowTarget').find('span').contains('Approve').should('not.be.disabled').click();
    } else {
        cy.log(`⏭️ Already on approval page — skipping To Do List click`);
    }

    cy.url({ timeout: TIMEOUT.NAV }).should('include', expectedUrl);
    cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: TIMEOUT.LONG }).then((interceptions) => {
        interceptions.forEach((interception) => {
            expect(interception.response).to.exist;
            expect([200, 304], `Status code for ${interception.request.url}`).to.include(interception.response!.statusCode);
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

    getTableContainer(taskListHeader).within(() => {
        cy.contains('tbody tr', projectName, { timeout: TIMEOUT.NAV })
            .should('be.visible')
            .within(() => {
                cy.get('span').contains('Approve').should('not.be.disabled').click();
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
function assignTaskViaTracking(projectName: string, assignee: string, billingSystem: string = ''): void {
    cy.url().then((currentUrl) => {
        if (currentUrl.includes('/new-report/home/tracking')) {
            cy.log('⏭️ Already on tracking page — skip Menu navigation');
        } else {
            cy.intercept('GET', '**/PLMSpringBoot/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
            cy.contains('span', 'Menu', { timeout: TIMEOUT.LONG }).click();
            cy.get('a[href="#/new-report/home/tracking"]', { timeout: TIMEOUT.LONG }).should('be.visible').click();
            cy.wait('@loadTracking', { timeout: TIMEOUT.NAV }).its('response.statusCode').should('be.oneOf', [200, 304]);
            cy.url({ timeout: TIMEOUT.LONG }).should('include', '/new-report/home/tracking');
        }
    });

    cy.get('table.table.table-condensed', { timeout: TIMEOUT.NAV }).should('be.visible');
    cy.get('table.table.table-condensed tbody tr', { timeout: TIMEOUT.NAV }).first().find('td').first().should('not.be.empty');
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
        cy.log(`🎯 [${role}] รอ auto-redirect เข้า workspace-home`);
        cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
    } else {
        cy.url({ timeout: TIMEOUT.LONG }).should((currentUrl) =>
            currentUrl.includes('/login') || currentUrl.includes('/workspace-home/workspace')
        );

        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) {
                throw new Error(`❌ [${role}] navigateToWorkspace() ถูกเรียกตอนอยู่หน้า /login`);
            } else if (currentUrl.includes('/workspace-home/workspace')) {
                cy.log(`⏭️ [${role}] Already on workspace-home — skip Menu click`);
            } else {
                cy.log(`🎯 [${role}] Click Menu -> workspace-home`);
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
    options?: { searchBy?: 'project' | 'po'; assignee?: string; billingSystem?: string; role?: NavRole }
): void => {
    loginAndWaitReady(user, pass);

    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const searchBy = options?.searchBy ?? 'po';
    const navRole: NavRole = options?.role ?? 'CGMD';
    const taskHeader: TaskListHeader = EXPECTED_HEADER[navRole];

    cy.log(`📋 Project: ${projectNamePONAME} | 🔁 Total PO: ${poCount} | 🔍 Search: ${searchBy} | 🎭 Role: ${navRole}`);

    const getKeyword = (index: number): string => {
        if (searchBy === 'project') return projectNamePONAME;
        const poName = allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;
        return poName.includes('_') ? poName.split('_')[0].trim() : poName;
    };

    const processedRowTexts = new Set<string>();

    const approveAllPOs = (): void => {
        const approveNextPO = (index: number): void => {
            if (index >= poCount) {
                cy.log(`✅ Approve เสร็จแล้ว ${poCount} PO — flow complete`);
                return;
            }
            const keyword = getKeyword(index);
            cy.log(`🔑 [Approve ${index + 1}/${poCount}] keyword: "${keyword}"`);

            cy.url().then((currentUrl) => {
                if (currentUrl.includes('/login')) {
                    loginAndWaitReady(user, pass);
                    navigateToWorkspace({ role: navRole });
                } else if (!currentUrl.includes('/workspace-home/workspace')) {
                    navigateToWorkspace({ role: navRole });
                }

                waitForTableReady(taskHeader, TIMEOUT.NAV);

                searchInTableWithPagination(
                    taskHeader,
                    keyword,
                    ($row) => {
                        processedRowTexts.add($row.text().trim());
                        registerApprovalPageIntercepts();
                        cy.wrap($row).should('be.visible').click();
                        approveFunction(projectNamePONAME, { alreadyOnPage: true, role: navRole } as any);
                    },
                    {
                        waitAfterNext: 2000,
                        filterCallback: ($row) => {
                            const rowText = $row.text().trim();
                            return rowText.includes(keyword) && !rowText.includes('Fetching data') && !processedRowTexts.has(rowText);
                        }
                    }
                );

                cy.then(() => {
                    waitForTableReady(taskHeader, TIMEOUT.NAV);
                    cy.wait(500);
                    approveNextPO(index + 1);
                });
            });
        };
        approveNextPO(0);
    };

    const assignNextPO = (index: number): void => {
        if (index >= poCount) {
            navigateToWorkspace({ role: navRole });
            approveAllPOs();
            return;
        }
        assignTaskViaTracking(projectNamePONAME, options!.assignee!, getKeyword(index));
        cy.wait(2000);
        assignNextPO(index + 1);
    };

    if (options?.assignee) {
        assignNextPO(0);
    } else {
        approveAllPOs();
    }
};

export const performRoleTaskWithAssignment = (
    user: string, pass: string, assignee: string, approveFunction: ApproveFunction,
    billingSystem: string = '', options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    performApprovalRole(user, pass, approveFunction, { assignee, billingSystem, searchBy: options?.searchBy, role: options?.role });
};

export const performSimpleApprovalRole = (
    user: string, pass: string, approveFunction: ApproveFunction, options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    performApprovalRole(user, pass, approveFunction, { searchBy: options?.searchBy, role: options?.role });
};

export const performSimpleClaimAndApprovalRole = (
    user: string, pass: string, approveFunction: ApproveFunction, options?: { searchBy?: 'project' | 'po'; role?: NavRole }
): void => {
    loginAndWaitReady(user, pass);
    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    
    ClaimProject(projectNamePONAME, { claimBy: 'project' });

    const processedRowTexts = new Set<string>();
    const currentProjectCode = (Cypress.env('currentProjectCode') as string) || '';

    const approveAllPOsSimple = (index: number, effectivePoCount: number): void => {
        if (index >= effectivePoCount) {
            cy.log(`✅ Approve เสร็จแล้ว ${effectivePoCount} PO — flow complete`);
            return;
        }
        const keyword = currentProjectCode || projectNamePONAME;
        cy.log(`🔑 [Approve ${index + 1}/${effectivePoCount}] keyword: "${keyword}"`);

        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) loginAndWaitReady(user, pass);
            waitForTableReady('To Do List', TIMEOUT.NAV);

            searchInTableWithPagination(
                'To Do List', keyword,
                ($row) => {
                    processedRowTexts.add($row.text().trim());
                    registerApprovalPageIntercepts();
                    cy.wrap($row).should('be.visible').click();
                    approveFunction(projectNamePONAME, { alreadyOnPage: true, role: options?.role } as any);
                },
                {
                    waitAfterNext: 2000,
                    filterCallback: ($row) => {
                        const rowText = $row.text().trim();
                        return rowText.includes(keyword) && !rowText.includes('Fetching data') && !processedRowTexts.has(rowText);
                    },
                }
            );

            cy.then(() => {
                waitForTableReady('To Do List', TIMEOUT.NAV);
                cy.wait(500);
                approveAllPOsSimple(index + 1, effectivePoCount);
            });
        });
    };

    countRowsByProjectCode('To Do List', currentProjectCode).then((actualCount) => {
        const effectivePoCount = actualCount > 0 ? actualCount : poCount;
        approveAllPOsSimple(0, effectivePoCount);
    });
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

export const assignAllPOsThenNavigate = (projectName: string, assignee: string, options?: { role?: NavRole }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const navRole: NavRole = options?.role ?? 'CGMD';

    const assignNextPO = (index: number): void => {
        if (index >= poCount) {
            navigateToWorkspace({ role: navRole });
            return;
        }
        const currentUniqueKeyword = allPoNames[index] ?? `${projectName}_PO${index + 1}`;
        assignTaskViaTracking(projectName, assignee, currentUniqueKeyword);
        assignNextPO(index + 1);
    };
    assignNextPO(0);
};

// ========================
// APPROVE PROJECT
// ========================
export const approveProject = (projectName: string): void => {
    const keywords = buildSearchKeywords(projectName);
    const matchesAnyKeyword = (tdText: string): string | null =>
        keywords.find((k) => tdText === k || tdText.startsWith(k + '_') || tdText.startsWith(k + ' ')) ?? null;

    getTableContainer('To Do List').find('tbody tr', { timeout: TIMEOUT.NAV }).should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
        const found = $rows.toArray().some((row) => matchesAnyKeyword(stripLabel(Cypress.$(row).find('td[colspan="2"]').text())) !== null);
        expect(found, `Expected To Do List to contain one of [${keywords.join(', ')}]`).to.be.true;
    }).then(($rows) => {
        const row = $rows.toArray().find((el) => matchesAnyKeyword(stripLabel(Cypress.$(el).find('td[colspan="2"]').text())) !== null);
        const tdText = row ? stripLabel(Cypress.$(row).find('td[colspan="2"]').text()) : '';
        const matchedKeyword = matchesAnyKeyword(tdText) || projectName;

        searchInTableWithPagination(
            'To Do List', matchedKeyword,
            () => {
                getTableContainer('To Do List')
                    .find('tbody tr.cursor-point')
                    .filter((_i, el) => matchesAnyKeyword(stripLabel(Cypress.$(el).find('td[colspan="2"]').text())) !== null)
                    .first().as('approveRow');
                cy.get('@approveRow').should('be.visible').click();
            },
            {
                waitAfterNext: 2000,
                filterCallback: ($row) => matchesAnyKeyword(stripLabel($row.find('td[colspan="2"]').text())) !== null
            }
        );
    });
};

// ========================
// TEAM TASK ASSIGNMENT
// ========================
const TEAM_TASK_RELOAD_ATTEMPTS = 5;
const TEAM_TASK_ASSIGN_LOOP_LIMIT = 20;

const reloadAndWaitForTeamTaskTable = (): void => {
    waitForLoadingState();
    cy.reload();
    cy.url({ timeout: TIMEOUT.NAV }).should((url) => {
        expect(url, '❌ Reload แล้วหลุดไปหน้า /login').not.to.include('/login');
    });
    waitForLoadingState();
    waitForTableReady('Team Task', TIMEOUT.NAV);
};

export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {
    waitForTableReady('Team Task', TIMEOUT.NAV);
    const searchKeyword = uniqueKeyword ? uniqueKeyword.trim() : taskIdentifier.split('_')[0].trim();
    if (!searchKeyword) throw new Error(`❌ searchKeyword is empty — cannot search`);

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('assigneeLoad');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('afterSet');

    const findAndAssignOnCurrentPage = (reloadAttempt: number = 0, assignLoopCount: number = 0): void => {
        if (assignLoopCount > TEAM_TASK_ASSIGN_LOOP_LIMIT) throw new Error(`❌ assignTeamTask: วน assign เกิน ${TEAM_TASK_ASSIGN_LOOP_LIMIT} รอบ`);

        getSectionContainer('Team Task').as('teamTaskSection');
        cy.get('@teamTaskSection').find('tbody tr').then(($rows) => {
            const allMatchedRows = $rows.filter((_, el) => Cypress.$(el).find('td:nth-child(2) div').text().trim().includes(searchKeyword));

            if (allMatchedRows.length === 0) {
                cy.get('@teamTaskSection').find('ul.pagination li.active').then(($active) => {
                    const isFirstPage = $active.length === 0 || $active.text().trim() === '1';
                    if (isFirstPage && reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                        reloadAndWaitForTeamTaskTable();
                        findAndAssignOnCurrentPage(reloadAttempt + 1, 0);
                        return;
                    }
                    cy.get('@teamTaskSection').find('ul.pagination li').then(($items) => {
                        const nextItem = $items.filter((_, li) => Cypress.$(li).text().trim() === 'Next' && !Cypress.$(li).hasClass('disabled'));
                        if (nextItem.length > 0) {
                            cy.wrap(nextItem.first()).find('a').click();
                            cy.wait(500);
                            waitForTableReady('Team Task', TIMEOUT.NAV);
                            findAndAssignOnCurrentPage(0, 0);
                        } else if (reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                            cy.get('@teamTaskSection').contains('a', 'First').click();
                            reloadAndWaitForTeamTaskTable();
                            findAndAssignOnCurrentPage(reloadAttempt + 1, 0);
                        } else {
                            throw new Error(`❌ "${searchKeyword}" not found on any page after ${TEAM_TASK_RELOAD_ATTEMPTS} reload attempts`);
                        }
                    });
                });
                return;
            }

            const unassignedRows = allMatchedRows.filter((_, el) => {
                const selectedOptionText = Cypress.$(el).find('select option:selected').text().trim();
                return selectedOptionText === 'Please Select' || selectedOptionText === '';
            });

            if (unassignedRows.length === 0) return;

            const $row = Cypress.$(unassignedRows[0]);
            const productNameText = $row.find('td:nth-child(2) div').text().trim();

            cy.wrap($row).scrollIntoView().should('be.visible');
            cy.wrap($row).find('select.form-control.input-sm').as('assigneeDropdown').scrollIntoView().trigger('click');
            
            cy.wait('@assigneeLoad', { timeout: TIMEOUT.NAV }).its('response.statusCode').should('be.oneOf', [200, 304]);
            cy.get('@assigneeDropdown').find('option').should('have.length.greaterThan', 1);
            cy.get('@assigneeDropdown').select(assignee, { force: true }).trigger('change').trigger('input');
            cy.get('@assigneeDropdown').should('have.value', assignee);

            let assignAlertText: string | null = null;
            cy.once('window:alert', (text) => { assignAlertText = text; });

            cy.wrap($row)
                .find('button.btn-info')
                .filter((_, el) => {
                    const txt = Cypress.$(el).text().trim();
                    return txt === 'Set' || txt === 'Reassign';
                })
                .first()
                .should('not.be.disabled', { timeout: TIMEOUT.SHORT })
                .then(($btn) => {
                    return cy.get('body').then(($body) => {
                        const overlays = $body.find('.loading-curtain, [class*="overlay"], [class*="loading"]');
                        if (overlays.length > 0) {
                            return cy.wrap(overlays).should('not.exist');
                        }
                    }).then(() => {
                        return cy.wrap($btn).click();
                    });
                });

            cy.wait('@afterSet', { timeout: TIMEOUT.NAV }).its('response.statusCode').should('be.oneOf', [200, 304]);
            cy.wrap(null).should(() => {
                expect(assignAlertText).to.not.be.null;
                expect(String(assignAlertText).toLowerCase()).to.include('success');
            });

            findAndAssignOnCurrentPage(reloadAttempt, assignLoopCount + 1);
        });
    };
    findAndAssignOnCurrentPage();
}

// ========================
// PROJECT CODE ROW COUNTING / VERIFICATION
// ========================

// ✅ FIX: เพิ่ม Type Assertion เพื่อแก้ปัญหา TypeScript Strict Mode
const resetPaginationToFirst = (headerText: string): Cypress.Chainable<void> => {
    return getSectionContainer(headerText).find('ul.pagination li').then(($items) => {
        const $firstBtn = $items.filter((_, li) => {
            return Cypress.$(li).text().trim() === 'First' && !Cypress.$(li).hasClass('disabled');
        });

        if ($firstBtn.length > 0) {
            cy.log(`⏮️ Reset pagination ไปยังหน้าแรกสำหรับ "${headerText}"`);
            return cy.wrap($firstBtn.first())
                .find('a')
                .click()
                .then(() => cy.wait(500))
                .then(() => waitForTableReady(headerText, TIMEOUT.SHORT));
        } else {
            cy.log(`ℹ️ อยู่หน้าแรกอยู่แล้ว หรือปุ่ม First ถูก disable สำหรับ "${headerText}"`);
            return cy.wrap(null);
        }
    }) as unknown as Cypress.Chainable<void>;
};

// ============================================================
// GENERIC PAGINATION WALKER (Fully Chainable & Safe)
// ============================================================
const PAGINATION_WALK_MAX_PAGES = 5;

const getPaginationNextLi = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return getSectionContainer(headerText)
        .find('ul.pagination li')
        .filter((_, li) => Cypress.$(li).text().trim() === 'Next');
};

const processAllPagesInTable = (
    headerText: string,
    rowAction: ($row: JQuery<HTMLElement>) => void,
    maxPages = PAGINATION_WALK_MAX_PAGES
): Cypress.Chainable<void> => {
    const walk = (pageCount: number): Cypress.Chainable<void> => {
        if (pageCount > maxPages) {
            cy.log(`⚠️ processAllPagesInTable("${headerText}"): เกิน maxPages (${maxPages}) — หยุดวน`);
            return cy.wrap(null) as unknown as Cypress.Chainable<void>;
        }

        return getTableContainer(headerText)
            .find('tbody tr', { timeout: TIMEOUT.NAV })
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
            })
            .then(($rows) => {
                $rows.each((_, row) => {
                    rowAction(Cypress.$(row));
                });
            })
            .then(() => getPaginationNextLi(headerText))
            .then(($nextLi) => {
                const isDisabled = $nextLi.length === 0 || $nextLi.hasClass('disabled');

                if (isDisabled) {
                    cy.log(`✅ processAllPagesInTable("${headerText}"): ถึงหน้าสุดท้ายแล้ว (หน้า ${pageCount})`);
                    return cy.wrap(null) as unknown as Cypress.Chainable<void>;
                }

                return getTableContainer(headerText)
                    .find('tbody tr')
                    .first()
                    .invoke('text')
                    .then((firstRowTextBefore) => {
                        cy.wrap($nextLi).find('a').click();

                        return getTableContainer(headerText)
                            .find('tbody tr', { timeout: TIMEOUT.NAV })
                            .should(($rows) => {
                                expect($rows.text()).not.to.contain('Fetching data');
                            })
                            .then(() => {
                                return getTableContainer(headerText)
                                    .find('tbody tr')
                                    .first()
                                    .invoke('text')
                                    .should((firstRowTextAfter) => {
                                        expect(firstRowTextAfter, 'Row text should change after pagination').not.to.eq(firstRowTextBefore);
                                    })
                                    .then(() => {
                                        return walk(pageCount + 1) as unknown as Cypress.Chainable<void>;
                                    });
                            });
                    });
            }) as unknown as Cypress.Chainable<void>;
    };

    return walk(1) as unknown as Cypress.Chainable<void>;
};

// ============================================================
// COLLECT ALL TO DO PROJECT CODES
// ============================================================
export const collectAllToDoProjectCodes = (): Cypress.Chainable<string[]> => {
    const projectCodes: string[] = [];

    return waitForTableReady('To Do List', TIMEOUT.NAV).then(() => {
        return processAllPagesInTable('To Do List', ($row) => {
            const code = $row.find('td').eq(0).text().trim();
            if (code) projectCodes.push(code);
        }).then(() => {
            cy.log(`📋 Collected ${projectCodes.length} PO code(s) from To Do List`);
            return cy.wrap(projectCodes);
        });
    }) as unknown as Cypress.Chainable<string[]>;
};

// ========================
// PROJECT CODE ROW COUNTING
// ========================
export const countRowsByProjectCode = (
    headerText: TaskListHeader,
    keyword: string,
    maxPages = 3
): Cypress.Chainable<number> => {
    let count = 0;

    return resetPaginationToFirst(headerText).then(() => {
        return getTableContainer(headerText)
            .find('tbody tr')
            .then(($rows) => {
                const isEmpty =
                    $rows.length === 0 ||
                    ($rows.length === 1 && /no data/i.test($rows.text()));

                if (isEmpty) {
                    cy.log(`📊 [${headerText}] ไม่มีแถวเลย (table ว่าง) — count = 0`);
                    return cy.wrap(0);
                }

                return processAllPagesInTable(
                    headerText,
                    ($row) => {
                        if (rowMatchesKeyword($row[0], keyword)) {
                            count++;
                        }
                    },
                    maxPages
                ).then(() => {
                    cy.log(`📊 [${headerText}] Keyword "${keyword}" — พบ ${count} แถว`);
                    return resetPaginationToFirst(headerText).then(() => {
                        return cy.wrap(count);
                    });
                });
            });
    }) as unknown as Cypress.Chainable<number>;
};

// ========================
// CLAIM PROJECT
// ========================
export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po'; specificPoName?: string }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const claimBy = options?.claimBy ?? 'po';
    const MAX_PAGES = 3;
    const MAX_RELOAD_ATTEMPTS = 6;
    const RELOAD_WAIT_MS = 1000;
    const CLAIM_PAGE1_RELOAD_ATTEMPTS = 3;

    cy.log(`🔁 Total PO to Claim: ${poCount} | 🔑 Claim mode: ${claimBy}`);

    const searchAndClaimWithKeyword = (keyword: string, currentPage: number = 1, page1ReloadAttempt: number = 0): Cypress.Chainable<boolean> => {
        if (currentPage > MAX_PAGES) {
            cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
            return cy.wrap<boolean>(false, { log: false });
        }
        cy.log(`🔍 [Claim] Page ${currentPage} keyword: "${keyword}"`);

        return retryFindRowInTable('Unassigned Task', keyword).then((found) => {
            if (found) {
                return getTableContainer('Unassigned Task').find('tbody tr').then(($rows) => {
                    const foundRowIndex = $rows.toArray().findIndex((row) => rowMatchesKeyword(row, keyword));
                    return getTableContainer('Unassigned Task')
                        .find('tbody tr')
                        .eq(foundRowIndex)
                        .find('button.claim-top')
                        .should('be.visible')
                        .and('not.be.disabled')
                        .click()
                        .then(() => {
                            waitForKeywordInToDo(keyword);
                            return cy.wrap<boolean>(true, { log: false });
                        });
                });
            }

            if (currentPage === 1 && page1ReloadAttempt < CLAIM_PAGE1_RELOAD_ATTEMPTS) {
                waitForLoadingState();
                cy.reload();
                waitForLoadingState();
                waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                return searchAndClaimWithKeyword(keyword, 1, page1ReloadAttempt + 1);
            }

            return getSectionContainer('Unassigned Task').find('ul.pagination li').then(($items) => {
                const $nextBtn = $items.filter((_, li) => Cypress.$(li).text().trim() === 'Next' && !Cypress.$(li).hasClass('disabled'));
                if ($nextBtn.length > 0) {
                    cy.wrap($nextBtn.first()).find('a').click();
                    cy.wait(500);
                    waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                    return searchAndClaimWithKeyword(keyword, currentPage + 1, page1ReloadAttempt);
                }
                return cy.wrap<boolean>(false, { log: false });
            });
        });
    };

    const claimWithFallback = (keywords: string[], idx: number = 0, reloadAttempt: number = 0): Cypress.Chainable<null> => {
        if (idx >= keywords.length) {
            if (reloadAttempt < MAX_RELOAD_ATTEMPTS) {
                waitForLoadingState();
                cy.wait(RELOAD_WAIT_MS);
                cy.reload();
                waitForLoadingState();
                waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                return claimWithFallback(keywords, 0, reloadAttempt + 1);
            }
            throw new Error(`❌ ไม่เจอแถวที่ตรงกับ keyword ใดๆ เลยแม้ reload ${MAX_RELOAD_ATTEMPTS} ครั้ง: [${keywords.join(', ')}]`);
        }
        return searchAndClaimWithKeyword(keywords[idx]).then((success): Cypress.Chainable<null> => {
            if (!success) return claimWithFallback(keywords, idx + 1, reloadAttempt);
            return cy.wrap<null>(null, { log: false });
        });
    };

    const claimByPO = (remainingPOs: number, poIndex: number = 0): void => {
        if (remainingPOs <= 0) {
            cy.log('✅ All POs claimed and moved to To Do List');
            return;
        }
        const poName = allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`;
        claimWithFallback(buildSearchKeywords(projectName, poName)).then(() => {
            claimByPO(remainingPOs - 1, poIndex + 1);
        });
    };

    const claimAllByProjectCode = (keywords: string[]): void => {
        const keyword = keywords[0];
        getTableContainer('Unassigned Task').within(() => {
            cy.get('tbody tr', { timeout: TIMEOUT.NAV }).should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
                expect($rows.length, 'ตารางควรมีข้อมูลอย่างน้อย 1 แถวก่อนเริ่มค้นหา').to.be.greaterThan(0);
            });
        });

        const claimAllMatchingOnCurrentPage = (claimedSoFar: number = 0): Cypress.Chainable<number> => {
            return getTableContainer('Unassigned Task').then(($table) => {
                const $matchingRows = $table.find('tbody tr').filter((_, el) => rowMatchesKeyword(el, keyword));
                if ($matchingRows.length === 0) {
                    return cy.wrap(claimedSoFar);
                }

                return getTableContainer('Unassigned Task')
                    .find('tbody tr')
                    .filter((_, el) => rowMatchesKeyword(el, keyword))
                    .eq(0)
                    .find('button.claim-top')
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click()
                    .then(() => {
                        return getTableContainer('Unassigned Task')
                            .find('tbody tr', { timeout: TIMEOUT.NAV })
                            .should(($rows) => {
                                expect(
                                    $rows.toArray().filter((el) => rowMatchesKeyword(el, keyword)).length,
                                    'จำนวนแถวที่ match ควรลดลงหลัง claim'
                                ).to.be.lessThan($matchingRows.length);
                            })
                            .then(() => {
                                return claimAllMatchingOnCurrentPage(claimedSoFar + 1);
                            });
                    });
            });
        };

        claimAllMatchingOnCurrentPage(0).then((claimedCount) => {
            if (claimedCount > 0) {
                waitForKeywordInToDo(keyword);
            }
        });
    };

    if (claimBy === 'project') {
        claimAllByProjectCode(buildSearchKeywords(projectName));
    } else {
        claimByPO(poCount);
    }
};