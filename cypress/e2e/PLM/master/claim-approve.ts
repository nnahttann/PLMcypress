import { TaskListHeader, FinalAction, CoreTaskCallback, ApproveFunction } from './config';
import { searchInTableWithPagination, scrollAndWait, loginAndWaitReady } from './helpers';
import { getStandardProjectName } from './project-manager';

const TIMEOUT = {
    SHORT: 15000,
    MEDIUM: 60000,
    LONG: 120000,
    NAV: 180000,
} as const;

const LOADER_SELECTOR = '.loading-curtain, .spinner, [class*="loading"]:visible';

const stripLabel = (raw: string): string => raw.replace(/(\s*\w+\s*)/g, '').replace(/\s+/g, ' ').trim();

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

const normalizeRole = (role?: string): string =>
    String(role ?? '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

const PROJECT_TASK_ROLES = new Set<string>([
    'MKT',
    'CKS',
    'TSCENTER',
]);

export const isProjectTaskRole = (role?: string): boolean =>
    PROJECT_TASK_ROLES.has(normalizeRole(role));

export const buildRoleSearchKeywords = (
    projectName?: string,
    role?: string,
    poName?: string
): string[] => {
    const projectCode = String(Cypress.env('currentProjectCode') ?? '').trim();
    const currentProjectName = String(Cypress.env('currentProjectName') ?? '').trim();
    const allProjectCodes: string[] = (Cypress.env('allProjectCodes') as string[]) ?? [];
    const allPoNames: string[] = (Cypress.env('allPoNames') as string[]) ?? [];

    const projectMode = isProjectTaskRole(role);

    // ทุก role ใช้ project code ก่อนเสมอ
    const projectCodes = [projectCode, ...allProjectCodes].filter(Boolean);

    const poNames = projectMode
        ? []
        : (poName ? [poName, ...allPoNames] : allPoNames);

    const keywords = [
        ...projectCodes,
        currentProjectName,
        projectName,
        ...(projectMode ? [] : [poName]),
        ...poNames,
    ];

    return [
        ...new Set(
            keywords
                .map((k) => String(k ?? '').trim())
                .filter(Boolean)
        ),
    ];
};

const getTableContainer = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.contains('h3', headerText).parent().find('table') as unknown as Cypress.Chainable<JQuery<HTMLElement>>;
};

const getSectionContainer = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.contains('h3', headerText).parent() as unknown as Cypress.Chainable<JQuery<HTMLElement>>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ✅ แก้ไข waitForKeywordInToDo: เพิ่ม initial wait + retry ก่อน reload
// ─────────────────────────────────────────────────────────────────────────────
const waitForKeywordInToDo = (
    keywordInput: string | string[],
    maxAttempts = 8   // ✅ เพิ่มจาก 3 → 8 (รอได้ 8 วินาทีก่อน reload)
): void => {
    const keywords = [
        ...new Set(
            (Array.isArray(keywordInput) ? keywordInput : [keywordInput])
                .map((k) => String(k ?? '').trim())
                .filter(Boolean)
        ),
    ];
    if (keywords.length === 0) {
        cy.log('⚠️ waitForKeywordInToDo: ไม่มี keyword ให้รอ — ข้าม');
        return;
    }
    cy.log(`⏳ รอให้ [${keywords.join(', ')}] โผล่ใน To Do List...`);

    // ✅ FIX: รอให้ตารางมีเวลา re-render หลัง claim ก่อนเริ่มตรวจ
    cy.wait(3000, { log: false });

    let reloaded = false;
    const check = (attemptsLeft: number): void => {
        cy.get('body', { log: false }).then(($body) => {
            const $todoTable = $body
                .find('h3:contains("To Do List")')
                .parent()
                .find('table');
            const tableText = ($todoTable.find('tbody tr').text() || '')
                .replace(/\s+/g, ' ')
                .trim();
            const isFetching = tableText.includes('Fetching data');
            const matched = keywords.find((k) => tableText.includes(k));

            if (!isFetching && matched) {
                cy.log(`✅ พบ "${matched}" ใน To Do List แล้ว`);
                cy.wait(2000, { log: false });
                return;
            }

            if (attemptsLeft <= 0) {
                throw new Error(
                    `❌ ไม่พบ [${keywords.join(', ')}] ใน To Do List หลัง Claim`
                );
            }

            // ✅ FIX: reload เฉพาะเมื่อพยายามครบ 6 รอบแล้วเท่านั้น (เดิมทำรอบที่ 2)
            if (!reloaded && attemptsLeft <= 2) {
                reloaded = true;
                cy.log('🔄 ยังไม่พบใน To Do List หลังรอหลายรอบ — reload แล้วรอใหม่');
                cy.reload();
                waitForLoadingState();
                cy.wait(3000, { log: false }); // ✅ รอหลัง reload ด้วย
            }

            cy.wait(1000, { log: false }).then(() => check(attemptsLeft - 1));
        });
    };
    check(maxAttempts);
};


// ─────────────────────────────────────────────────────────────────────────────
// ✅ แก้ไข approveProject: เพิ่ม wait + บังคับใช้ specific match
// ─────────────────────────────────────────────────────────────────────────────
export const approveProject = (projectName: string): void => {
    const keywords = buildSearchKeywords(projectName);
    const normalizeSpaces = (t: string): string => String(t ?? '').replace(/\s+/g, ' ').trim();
    const specific = normalizeSpaces(projectName);

    const rowMatchesAnyKeyword = ($row: JQuery<HTMLElement>): boolean => {
        const rowText = $row.text();
        return keywords.some(k => rowText.includes(k));
    };

    const rowMatchesSpecific = ($row: JQuery<HTMLElement>): boolean =>
        !!specific && normalizeSpaces($row.text()).includes(specific);

    // ✅ FIX: รอ 2 วินาทีให้ตาราง render เสร็จก่อน query
    cy.wait(2000);

    getTableContainer('To Do List').find('tbody tr', { timeout: TIMEOUT.NAV }).should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
        const found = $rows.toArray().some((row) => rowMatchesAnyKeyword(Cypress.$(row)));
        expect(found, `Expected To Do List to contain one of [${keywords.join(', ')}]`).to.be.true;
    }).then(($rows) => {
        // ✅ FIX: ตรวจสอบเฉพาะจากแถวที่ "ไม่ใช่" header/empty
        const dataRows = $rows.toArray().filter((row) => {
            const text = Cypress.$(row).text().trim();
            return text.length > 10 && !text.includes('No data') && !text.includes('Fetching');
        });

        const useSpecific = dataRows.some((row) => rowMatchesSpecific(Cypress.$(row)));
        const rowMatches = useSpecific ? rowMatchesSpecific : rowMatchesAnyKeyword;

        cy.log(useSpecific
            ? `🎯 [approveProject] เจอแถวที่ตรงชื่อ "${specific}" — คลิกเฉพาะแถวนี้`
            : `⚠️ [approveProject] ไม่เจอแถวที่ตรงชื่อ "${specific}" — fallback ใช้ keyword ทั้งหมด`);

        const row = dataRows.find((el) => rowMatches(Cypress.$(el)));
        if (!row) throw new Error('Row not found in To Do List');

        const matchedKeyword = useSpecific
            ? specific
            : (keywords.find(k => Cypress.$(row).text().includes(k)) || projectName);

        searchInTableWithPagination('To Do List', matchedKeyword, () => {
            getTableContainer('To Do List')
                .find('tbody tr.cursor-point')
                .filter((_i, el) => rowMatches(Cypress.$(el)))
                .first().as('approveRow');
            cy.get('@approveRow').should('be.visible').click();
        }, {
            waitAfterNext: 2000,
            filterCallback: ($row) => rowMatches($row)
        });
    });
};

const keywordExistsInTableWithPagination = (
    headerText: TaskListHeader,
    keyword: string,
    maxPages = 3
): Cypress.Chainable<boolean> => {
    return resetPaginationToFirst(headerText).then(() => {
        const checkPage = (page: number): Cypress.Chainable<boolean> => {
            if (page > maxPages) {
                return cy.wrap<boolean>(false, { log: false });
            }

            return waitForTableReady(headerText, TIMEOUT.NAV).then(() => {
                return getTableContainer(headerText)
                    .find('tbody tr')
                    .then(($rows) => {
                        const found = $rows
                            .toArray()
                            .some((row) => rowMatchesKeyword(row, keyword));

                        if (found) {
                            cy.log(`✅ พบ "${keyword}" ใน ${headerText} หน้า ${page}`);
                            return cy.wrap<boolean>(true, { log: false });
                        }

                        return getPaginationNextLi(headerText).then(($nextLi) => {
                            const isDisabled =
                                $nextLi.length === 0 || $nextLi.hasClass('disabled');

                            if (isDisabled) {
                                return cy.wrap<boolean>(false, { log: false });
                            }

                            return cy.wrap($nextLi)
                                .find('a')
                                .click()
                                .then(() => cy.wait(500))
                                .then(() => waitForTableReady(headerText, TIMEOUT.NAV))
                                .then(() => checkPage(page + 1));
                        });
                    });
            });
        };

        return checkPage(1);
    }) as unknown as Cypress.Chainable<boolean>;
};

const findFirstExistingKeyword = (
    headerText: TaskListHeader,
    keywords: string[],
    maxPages = 3
): Cypress.Chainable<string> => {
    const uniqueKeywords = [
        ...new Set(
            keywords
                .map((k) => String(k ?? '').trim())
                .filter(Boolean)
        ),
    ];

    const tryAt = (idx: number): Cypress.Chainable<string> => {
        if (idx >= uniqueKeywords.length) {
            return cy.wrap('', { log: false });
        }

        const keyword = uniqueKeywords[idx];

        cy.log(`🔎 [findFirstExistingKeyword] ลองหา "${keyword}" ใน ${headerText}`);

        return keywordExistsInTableWithPagination(headerText, keyword, maxPages).then(
            (found) => {
                if (found) {
                    cy.log(`✅ ใช้ keyword จริง: "${keyword}"`);
                    return cy.wrap(keyword, { log: false });
                }

                cy.log(`⚠️ ไม่พบ "${keyword}" — ลอง keyword ถัดไป`);
                return tryAt(idx + 1);
            }
        );
    };

    return tryAt(0);
};

const clickRowByKeywords = (
    headerText: TaskListHeader,
    keywords: string[],
    onRow: ($row: JQuery<HTMLElement>) => void,
    processedRowTexts?: Set<string>
): void => {
    findFirstExistingKeyword(headerText, keywords).then((keyword) => {
        if (!keyword) {
            throw new Error(
                `❌ ไม่พบแถวจาก keywords: [${keywords.join(', ')}] ใน ${headerText}`
            );
        }

        searchInTableWithPagination(
            headerText,
            keyword,
            ($row: JQuery<HTMLElement>) => {
                onRow($row);
            },
            {
                waitAfterNext: 2000,
                filterCallback: ($row: JQuery<HTMLElement>) => {
                    const rowText = $row.text().trim();

                    const matches = keywords.some((k) => rowText.includes(k));

                    const notProcessed = processedRowTexts
                        ? !processedRowTexts.has(rowText)
                        : true;

                    return (
                        matches &&
                        !rowText.includes('Fetching data') &&
                        notProcessed
                    );
                },
            }
        );
    });
};

export const registerApprovalPageIntercepts = (): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');
};

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
            expect(text, 'ตารางต้องไม่อยู่ในสถานะ Fetching data').not.to.contain('Fetching data');
            const isEmptyState = /no data|ไม่พบข้อมูล|empty/i.test(text);
            if (!isEmptyState) {
                const hasRealData = $rows.toArray().some(tr => {
                    const rowText = Cypress.$(tr).text().trim();
                    return rowText.length > 5 &&
                        !rowText.includes('No data to display') &&
                        !rowText.includes('Fetching');
                });
                expect($rows.length, `Expected rows in "${headerText}" unless it's empty`).to.be.greaterThan(0);
                expect(hasRealData, `ตาราง "${headerText}" ควรมีแถวข้อมูลที่ Render เสร็จแล้ว`).to.be.true;
            }
        })
        .then(() => { cy.wait(500, { log: false }); });
};

const retryFindRowInTable = (headerText: string, keyword: string, maxAttempts = 3, attempt = 1): Cypress.Chainable<boolean> => {
    cy.log(`🔄 [${attempt}/${maxAttempts}] Finding "${keyword}" in "${headerText}"`);
    return waitForTableReady(headerText).then(() => {
        return getTableContainer(headerText).find('tbody tr').then(($rows) => {
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
    });
};

export const projectExistsInTable = (
    headerText: string,
    keyword: string,
    options?: { reloadAttempts?: number }
): Cypress.Chainable<boolean> => {
    const maxReload = options?.reloadAttempts ?? 3;
    const attempt = (reloadCount: number): Cypress.Chainable<boolean> => {
        return retryFindRowInTable(headerText, keyword).then((found) => {
            if (found) return cy.wrap<boolean>(true, { log: false });
            if (reloadCount >= maxReload) return cy.wrap<boolean>(false, { log: false });
            cy.log(`🔄 [projectExistsInTable] ไม่พบ "${keyword}" ใน "${headerText}" — reload ${reloadCount + 1}/${maxReload}`);
            waitForLoadingState();
            cy.reload();
            waitForLoadingState();
            waitForTableReady(headerText, TIMEOUT.NAV);
            return attempt(reloadCount + 1);
        });
    };
    return attempt(0);
};

export const buildSearchKeywords = (...extra: (string | undefined)[]): string[] => {
    const projectCode = String(Cypress.env('currentProjectCode') ?? '').trim();
    const currentProjectName = String(Cypress.env('currentProjectName') ?? '').trim();
    const allProjectCodes: string[] = (Cypress.env('allProjectCodes') as string[]) ?? [];

    const all = [
        projectCode,
        ...allProjectCodes,
        currentProjectName,
        ...extra.filter(Boolean),
    ];

    return [
        ...new Set(
            all
                .map((k) => String(k ?? '').trim())
                .filter(Boolean)
        ),
    ];
};

interface RowKeywordMatch { found: boolean; matchedKeyword: string; }

const findRowInTableByKeywords = (headerText: string, keywords: string[], maxAttemptsPerKeyword = 3): Cypress.Chainable<RowKeywordMatch> => {
    const tryAt = (idx: number): Cypress.Chainable<RowKeywordMatch> => {
        if (idx >= keywords.length) return cy.wrap<RowKeywordMatch>({ found: false, matchedKeyword: '' }, { log: false });
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

export const createFullPageApprovalFlow = (projectName: string, taskListHeader: TaskListHeader, expectedUrl: string, coreTaskCallback: CoreTaskCallback, finalAction: FinalAction, options?: { alreadyOnPage?: boolean }): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    if (!options?.alreadyOnPage) {
        registerApprovalPageIntercepts();
        const keywords = buildSearchKeywords(projectName);
        findRowInTableByKeywords(taskListHeader, keywords).then(({ found, matchedKeyword }) => {
            if (!found) throw new Error(`❌ ไม่เจอแถวที่ตรงกับ [${keywords.join(', ')}] ใน "${taskListHeader}"`);
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

export const createSimplePageApprovalFlow = (projectName: string, taskListHeader: TaskListHeader, expectedUrl: string, coreTaskCallback: CoreTaskCallback, finalAction: FinalAction = 'AlertAndLogout'): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    getTableContainer(taskListHeader).within(() => {
        cy.contains('tbody tr', projectName, { timeout: TIMEOUT.NAV })
            .should('be.visible')
            .within(() => { cy.get('span').contains('Approve').should('not.be.disabled').click(); });
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

function assignTaskViaTracking(projectName: string, assignee: string, billingSystem: string = ''): void {
    cy.url().then((currentUrl) => {
        if (currentUrl.includes('/new-report/home/tracking')) {
            cy.log('⏭️ Already on tracking page — skip Menu navigation');
        } else {
            cy.intercept('GET', '/PLMSpringBoot/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
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

export type NavRole = 'SPAD' | 'CGMD' | 'ACTM' | 'OPER' | 'APO';
const AUTO_REDIRECT_ROLES: readonly NavRole[] = ['SPAD', 'ACTM', 'OPER', 'APO'];
const EXPECTED_HEADER: Record<NavRole, TaskListHeader> = {
    SPAD: 'To Do List', CGMD: 'To Do List', ACTM: 'Unassigned Task', OPER: 'Unassigned Task', APO: 'Unassigned Task',
};

export const navigateToWorkspace = (options?: { role?: NavRole }): void => {
    const role: NavRole = options?.role ?? 'CGMD';
    const isAutoRedirect = AUTO_REDIRECT_ROLES.includes(role);
    if (isAutoRedirect) {
        cy.log(`🎯 [${role}] ตรวจสอบว่า auto-redirect ไป workspace-home หรือกลับหน้า list เอง`);
        cy.url({ timeout: TIMEOUT.LONG }).then((currentUrl) => {
            if (currentUrl.includes('/workspace-home/workspace')) {
                cy.log(`✅ [${role}] auto-redirect สำเร็จ`);
            } else if (currentUrl.includes('/login')) {
                throw new Error(`❌ [${role}] navigateToWorkspace() ถูกเรียกตอนอยู่หน้า /login`);
            } else {
                cy.log(`⚠️ [${role}] ไม่ auto-redirect — คลิก Menu เอง`);
                cy.contains('span', 'Menu', { timeout: TIMEOUT.LONG }).click();
                cy.get('a[href="#/workspace-home/workspace"]', { timeout: TIMEOUT.LONG }).click();
                cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
            }
        });
    } else {
        cy.url({ timeout: TIMEOUT.LONG }).should((currentUrl) => currentUrl.includes('/login') || currentUrl.includes('/workspace-home/workspace'));
        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) throw new Error(`❌ [${role}] navigateToWorkspace() ถูกเรียกตอนอยู่หน้า /login`);
            else if (currentUrl.includes('/workspace-home/workspace')) cy.log(`⏭️ [${role}] Already on workspace-home`);
            else {
                cy.log(`🎯 [${role}] Click Menu -> workspace-home`);
                cy.contains('span', 'Menu', { timeout: TIMEOUT.LONG }).click();
                cy.get('a[href="#/workspace-home/workspace"]', { timeout: TIMEOUT.LONG }).click();
                cy.url({ timeout: TIMEOUT.LONG }).should('include', '/workspace-home/workspace');
            }
        });
    }
    waitForTableReady(EXPECTED_HEADER[role], TIMEOUT.NAV);
};

const performApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction, options?: {
    searchBy?: 'project' | 'po'; assignee?: string; billingSystem?: string; role?: NavRole | string; approveFunctionHandlesAllPOs?: boolean;
}): void => {
    loginAndWaitReady(user, pass);
    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];

    const role = String(options?.role ?? '');
    const projectMode = isProjectTaskRole(role);

    const searchBy = options?.searchBy ?? (projectMode ? 'project' : 'po');
    const navRole: NavRole = (options?.role as NavRole) ?? 'CGMD';
    const taskHeader: TaskListHeader = EXPECTED_HEADER[navRole] || 'To Do List';

    // ✅ แก้ไข: คืนค่า default เป็น true เพราะ approveFunction ส่วนใหญ่ (เช่น loopApproveAllPOs) วนลูปจัดการ PO เองอยู่แล้ว
    const approveFunctionHandlesAllPOs = options?.approveFunctionHandlesAllPOs ?? true;

    cy.log(`📋 Project: ${projectNamePONAME} | 🔁 Total PO: ${poCount} | 🔍 Search: ${searchBy} | 🎭 Role: ${navRole} | 🧭 handlesAllPOs: ${approveFunctionHandlesAllPOs}`);

    const processedRowTexts = new Set<string>();

    const approveOnceLettingFunctionHandleAllPOs = (): void => {
        const keywords = buildRoleSearchKeywords(projectNamePONAME, role);
        cy.log(`🔑 [Approve] keywords: [${keywords.join(', ')}] — approveFunction จะจัดการ PO ทั้งหมด (${poCount}) เอง`);
        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) { loginAndWaitReady(user, pass); navigateToWorkspace({ role: navRole }); }
            else if (!currentUrl.includes('/workspace-home/workspace')) navigateToWorkspace({ role: navRole });
            waitForTableReady(taskHeader, TIMEOUT.NAV);

            clickRowByKeywords(taskHeader, keywords, ($row) => {
                registerApprovalPageIntercepts();
                cy.wrap($row).should('be.visible').click();
                approveFunction(projectNamePONAME, { alreadyOnPage: true, role: navRole } as any);
            });

            cy.log(`🏁 approveFunction จัดการครบ ${poCount} PO และ Logout ให้แล้ว`);
        });
    };

    const approveAllPOsLegacyLoop = (): void => {
        const approveNextPO = (index: number): void => {
            if (index >= poCount) { cy.log(`✅ Approve เสร็จแล้ว ${poCount} PO`); return; }
            const isLastPO = index === poCount - 1;
            const poName = allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;
            const keywords = buildRoleSearchKeywords(projectNamePONAME, role, poName);

            cy.log(`🔑 [Approve ${index + 1}/${poCount}] keywords: [${keywords.join(', ')}]`);
            cy.url().then((currentUrl) => {
                if (currentUrl.includes('/login')) { loginAndWaitReady(user, pass); navigateToWorkspace({ role: navRole }); }
                else if (!currentUrl.includes('/workspace-home/workspace')) navigateToWorkspace({ role: navRole });
                waitForTableReady(taskHeader, TIMEOUT.NAV);

                clickRowByKeywords(taskHeader, keywords, ($row) => {
                    processedRowTexts.add($row.text().trim());
                    registerApprovalPageIntercepts();
                    cy.wrap($row).should('be.visible').click();
                    approveFunction(projectNamePONAME, { alreadyOnPage: true, role: navRole } as any);
                }, processedRowTexts);

                if (isLastPO) { cy.log(`🏁 Last PO handled`); return; }
                cy.then(() => { waitForTableReady(taskHeader, TIMEOUT.NAV); cy.wait(500); approveNextPO(index + 1); });
            });
        };
        approveNextPO(0);
    };

    const approveAllPOs = (): void => { if (approveFunctionHandlesAllPOs) approveOnceLettingFunctionHandleAllPOs(); else approveAllPOsLegacyLoop(); };

    const assignNextPO = (index: number): void => {
        if (index >= poCount) { navigateToWorkspace({ role: navRole }); approveAllPOs(); return; }
        const poName = allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;
        assignTaskViaTracking(projectNamePONAME, options!.assignee!, poName);
        cy.wait(2000);
        assignNextPO(index + 1);
    };

    if (options?.assignee) assignNextPO(0); else approveAllPOs();
};

export const performRoleTaskWithAssignment = (user: string, pass: string, assignee: string, approveFunction: ApproveFunction, billingSystem: string = '', options?: { searchBy?: 'project' | 'po'; role?: NavRole | string; approveFunctionHandlesAllPOs?: boolean; }): void => {
    performApprovalRole(user, pass, approveFunction, { assignee, billingSystem, searchBy: options?.searchBy, role: options?.role, approveFunctionHandlesAllPOs: options?.approveFunctionHandlesAllPOs });
};

export const performSimpleApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction, options?: { searchBy?: 'project' | 'po'; role?: NavRole | string; approveFunctionHandlesAllPOs?: boolean; }): void => {
    performApprovalRole(user, pass, approveFunction, { searchBy: options?.searchBy, role: options?.role, approveFunctionHandlesAllPOs: options?.approveFunctionHandlesAllPOs });
};

export const performSimpleClaimAndApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction, options?: { searchBy?: 'project' | 'po'; role?: NavRole | string; approveFunctionHandlesAllPOs?: boolean; }): void => {
    loginAndWaitReady(user, pass);
    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];

    const role = String(options?.role ?? '');
    const projectMode = isProjectTaskRole(role);

    // ✅ แก้ไข: คืนค่า default เป็น true เช่นกัน
    const approveFunctionHandlesAllPOs = options?.approveFunctionHandlesAllPOs ?? true;

    ClaimProject(projectNamePONAME, {
        claimBy: projectMode ? 'project' : (options?.searchBy === 'project' ? 'project' : 'po'),
        role
    });

    const processedRowTexts = new Set<string>();

    if (approveFunctionHandlesAllPOs) {
        const keywords = buildRoleSearchKeywords(projectNamePONAME, role);
        cy.log(`🔑 [Approve] project mode/keywords: [${keywords.join(', ')}] — approveFunction จะจัดการ PO ทั้งหมด (${poCount}) เอง`);
        cy.url().then((currentUrl) => {
            if (currentUrl.includes('/login')) loginAndWaitReady(user, pass);
            waitForTableReady('To Do List', TIMEOUT.NAV);

            clickRowByKeywords('To Do List', keywords, ($row) => {
                registerApprovalPageIntercepts();
                cy.wrap($row).should('be.visible').click();
                approveFunction(projectNamePONAME, { alreadyOnPage: true, role: options?.role } as any);
            });

            cy.log(`🏁 approveFunction จัดการครบ ${poCount} PO และ Logout ให้แล้ว`);
        });
    } else {
        const approveNextPO = (index: number): void => {
            if (index >= poCount) { cy.log(`✅ Approve เสร็จแล้ว ${poCount} PO`); return; }
            const isLastPO = index === poCount - 1;
            const poName = allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;
            const poKeywords = buildRoleSearchKeywords(projectNamePONAME, role, poName);

            cy.log(`🔑 [Approve ${index + 1}/${poCount}] keywords: [${poKeywords.join(', ')}]`);
            cy.url().then((currentUrl) => {
                if (currentUrl.includes('/login')) loginAndWaitReady(user, pass);
                waitForTableReady('To Do List', TIMEOUT.NAV);

                clickRowByKeywords('To Do List', poKeywords, ($row) => {
                    processedRowTexts.add($row.text().trim());
                    registerApprovalPageIntercepts();
                    cy.wrap($row).should('be.visible').click();
                    approveFunction(projectNamePONAME, { alreadyOnPage: true, role: options?.role } as any);
                }, processedRowTexts);

                if (isLastPO) return;
                cy.then(() => { waitForTableReady('To Do List', TIMEOUT.NAV); cy.wait(500); approveNextPO(index + 1); });
            });
        };
        approveNextPO(0);
    }
};

/**
 * Login -> Claim จาก Unassigned Task -> รอให้งานโผล่ใน To Do List -> Logout
 * ❌ ไม่ approve ต่อ (ใช้กับ role ที่ต้องการแค่ claim เช่น ROM, CKS Easy App ROM)
 */
export const performClaimOnlyRole = (user: string, pass: string, options?: {
    label?: string;
    role?: NavRole | string;
    claimBy?: 'project' | 'po';
    logout?: boolean;
}): void => {
    const label = options?.label ?? String(options?.role ?? 'Claim');
    const role = String(options?.role ?? '');

    cy.log(`🚀 [${label}] Claim only — ไม่ approve`);
    loginAndWaitReady(user, pass);

    ClaimProject(getStandardProjectName(), {
        claimBy: options?.claimBy ?? 'project',
        role,
    });

    if (options?.logout !== false) {
        cy.contains('button', 'Logout', { timeout: TIMEOUT.LONG }).should('be.visible').click();
        cy.url({ timeout: TIMEOUT.LONG }).should('include', '/login');
    }
    cy.log(`✅ [${label}] claim เสร็จแล้ว (ไม่ approve) และ Logout แล้ว`);
};

export const registerAssignAlertListener = (): void => {
    cy.on('window:alert', (text) => { cy.log(`🔔 Alert: "${text}"`); expect(text).to.include('success'); });
};

export const assignAllPOsThenNavigate = (projectName: string, assignee: string, options?: { role?: NavRole; }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const navRole: NavRole = options?.role ?? 'CGMD';
    const assignNextPO = (index: number): void => {
        if (index >= poCount) { navigateToWorkspace({ role: navRole }); return; }
        const currentUniqueKeyword = allPoNames[index] ?? `${projectName}_PO${index + 1}`;
        assignTaskViaTracking(projectName, assignee, currentUniqueKeyword);
        assignNextPO(index + 1);
    };
    assignNextPO(0);
};

const TEAM_TASK_RELOAD_ATTEMPTS = 3;
const TEAM_TASK_ASSIGN_LOOP_LIMIT = 3;
const TEAM_TASK_MAX_PAGES = 3;

const normalizeTeamTaskText = (text: string): string => text.replace(/\s+/g, ' ').trim();
const rowMatchesTeamTaskKeyword = (el: HTMLElement, keyword: string): boolean => {
    const $row = Cypress.$(el);
    const codeText = normalizeTeamTaskText($row.find('td').eq(0).text());
    const nameText = normalizeTeamTaskText($row.find('td:nth-child(2) div').text());
    const normalizedKeyword = normalizeTeamTaskText(keyword);
    if (codeText === normalizedKeyword) return true;
    if (nameText.includes(normalizedKeyword)) return true;
    const tokens = normalizedKeyword.split(/\s+/).filter(t => t.length > 2);
    if (tokens.length === 0) return false;

    const rowTokens = new Set(nameText.split(/\s+/));
    const matchCount = tokens.filter(t => rowTokens.has(t)).length;
    const matchRatio = matchCount / tokens.length;

    // ต้อง match อย่างน้อย 70% ของ tokens
    return matchRatio >= 0.7;
};
const reloadAndWaitForTeamTaskTable = (): void => {
    waitForLoadingState();
    cy.reload();
    cy.url({ timeout: TIMEOUT.NAV }).should((url) => { expect(url, '❌ Reload แล้วหลุดไปหน้า /login').not.to.include('/login'); });
    waitForLoadingState();
    waitForTableReady('Team Task', TIMEOUT.NAV);
};

export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {
    waitForTableReady('Team Task', TIMEOUT.NAV);

    const projectCode = (Cypress.env('currentProjectCode') as string) || '';
    const primaryKeyword = uniqueKeyword ? uniqueKeyword.trim() : taskIdentifier.split(' ')[0].trim();

    if (!primaryKeyword && !projectCode) {
        throw new Error(`❌ searchKeyword is empty`);
    }

    // ✅ FIX 4: projectCode มาก่อนเสมอ เพราะ exact match และเสถียรกว่า
    // ตามด้วยชื่อ PO เป็น secondary filter (เผื่อมีหลาย PO ภายใต้ code เดียวกัน)
    const searchKeywords = [
        ...new Set(
            [projectCode, primaryKeyword].filter(Boolean)
        ),
    ];

    cy.log(`🔎 [assignTeamTask] keywords to try: ${JSON.stringify(searchKeywords)}`);

    // ✅ FIX: เดิมใช้ cy.intercept('GET', '/PLMSpringBoot/api/') ซึ่ง match เฉพาะ path นี้เป๊ะๆ
    // ทำให้ cy.wait('@assigneeLoad') รอจน timeout (No request ever occurred)
    // เปลี่ยนไปพึ่ง retrying assertion (จำนวน option / alert success) แทน ไม่ผูกกับ URL ของ API

    const assignAtRow = ($row: JQuery<HTMLElement>, searchKeyword: string, keywordIdx: number, assignLoopCount: number): void => {
        const productNameText = $row.find('td:nth-child(2) div').text().trim();

        cy.wrap($row).scrollIntoView().should('be.visible');
        cy.wrap($row).find('select.form-control.input-sm').as('assigneeDropdown').scrollIntoView()
            .trigger('mousedown').trigger('click');

        // รอให้ option ของ assignee โหลดเสร็จ (retry จนกว่าจะมี option มากกว่า "Please Select")
        cy.get('@assigneeDropdown').find('option', { timeout: TIMEOUT.LONG }).should('have.length.greaterThan', 1);
        cy.get('@assigneeDropdown').select(assignee, { force: true }).trigger('change').trigger('input');
        cy.get('@assigneeDropdown').should('have.value', assignee);

        let assignAlertText: string | null = null;
        cy.once('window:alert', (text) => { assignAlertText = text; });

        cy.wrap($row).find('button.btn-info', { timeout: TIMEOUT.SHORT }).filter((_, el) => {
            const txt = Cypress.$(el).text().trim();
            return txt === 'Set' || txt === 'Reassign';
        }).first().should('not.be.disabled').then(($btn) => {
            return cy.get('body').then(($body) => {
                const overlays = $body.find('.loading-curtain, [class*="overlay"], [class*="loading"]');
                if (overlays.length > 0) return cy.wrap(overlays).should('not.exist');
                return cy.wrap(null);
            }).then(() => cy.wrap($btn).click());
        });

        cy.wrap(null, { timeout: TIMEOUT.LONG, log: false }).should(() => {
            expect(assignAlertText).to.not.be.null;
            expect(String(assignAlertText).toLowerCase()).to.include('success');
        });

        cy.log(`✅ [assignTeamTask] assigned "${productNameText}" via keyword "${searchKeyword}"`);
        findAndAssignOnCurrentPage(keywordIdx, 0, 0, assignLoopCount + 1);
    };

    const findAndAssignOnCurrentPage = (
        keywordIdx: number,
        reloadAttempt: number = 0,
        pagesWalked: number = 0,
        assignLoopCount: number = 0
    ): void => {
        if (assignLoopCount > TEAM_TASK_ASSIGN_LOOP_LIMIT) {
            throw new Error(`❌ assignTeamTask: วน assign เกิน ${TEAM_TASK_ASSIGN_LOOP_LIMIT} รอบ`);
        }

        if (keywordIdx >= searchKeywords.length) {
            throw new Error(`❌ assignTeamTask: ไม่เจอแถวที่ตรงกับ keyword ใดๆ เลย`);
        }

        // ✅ FIX 5: Reset pagination กลับไปหน้า 1 ก่อนสลับ keyword ใหม่
        if (pagesWalked > TEAM_TASK_MAX_PAGES) {
            cy.log(`⚠️ เกิน ${TEAM_TASK_MAX_PAGES} หน้า — ลอง keyword ถัดไป`);
            resetPaginationToFirst('Team Task').then(() => {
                findAndAssignOnCurrentPage(keywordIdx + 1, 0, 0, assignLoopCount);
            });
            return;
        }

        const searchKeyword = searchKeywords[keywordIdx];
        getSectionContainer('Team Task').as('teamTaskSection');

        cy.get('@teamTaskSection').find('tbody tr').then(($rows) => {
            const allMatchedRows = $rows.filter((_, el) => rowMatchesTeamTaskKeyword(el, searchKeyword));

            if (allMatchedRows.length === 0) {
                cy.get('@teamTaskSection').find('ul.pagination li.active').then(($active) => {
                    const isFirstPage = $active.length === 0 || $active.text().trim() === '1';

                    if (isFirstPage && reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                        reloadAndWaitForTeamTaskTable();
                        findAndAssignOnCurrentPage(keywordIdx, reloadAttempt + 1, pagesWalked, assignLoopCount);
                        return;
                    }

                    cy.get('@teamTaskSection').find('ul.pagination li').then(($items) => {
                        const nextItem = $items.filter((_, li) => Cypress.$(li).text().trim() === 'Next' && !Cypress.$(li).hasClass('disabled'));

                        if (nextItem.length > 0) {
                            cy.wrap(nextItem.first()).find('a').click();
                            cy.wait(500);
                            waitForTableReady('Team Task', TIMEOUT.NAV);
                            findAndAssignOnCurrentPage(keywordIdx, 0, pagesWalked + 1, assignLoopCount);
                        } else if (reloadAttempt < TEAM_TASK_RELOAD_ATTEMPTS) {
                            cy.get('@teamTaskSection').contains('a', 'First').click();
                            reloadAndWaitForTeamTaskTable();
                            findAndAssignOnCurrentPage(keywordIdx, reloadAttempt + 1, pagesWalked, assignLoopCount);
                        } else {
                            cy.log(`⚠️ ไม่พบหลัง reload ${TEAM_TASK_RELOAD_ATTEMPTS} ครั้ง`);
                            findAndAssignOnCurrentPage(keywordIdx + 1, 0, 0, assignLoopCount);
                        }
                    });
                });
                return;
            }

            const unassignedRows = allMatchedRows.filter((_, el) => {
                const selectedOptionText = Cypress.$(el).find('select option:selected').text().trim();
                return selectedOptionText === 'Please Select' || selectedOptionText === '';
            });

            if (unassignedRows.length === 0) {
                cy.log(`ℹ️ เจอแถวแต่ทุกแถว assign ไปแล้ว`);
                return;
            }

            assignAtRow(Cypress.$(unassignedRows[0]), searchKeyword, keywordIdx, assignLoopCount);
        });
    };

    findAndAssignOnCurrentPage(0);
}

const resetPaginationToFirst = (headerText: string): Cypress.Chainable<void> => {
    return getSectionContainer(headerText).find('ul.pagination li').then(($items) => {
        const $firstBtn = $items.filter((_, li) => Cypress.$(li).text().trim() === 'First' && !Cypress.$(li).hasClass('disabled'));
        if ($firstBtn.length > 0) {
            cy.log(`⏮️ Reset pagination ไปยังหน้าแรกสำหรับ "${headerText}"`);
            return cy.wrap($firstBtn.first()).find('a').click().then(() => cy.wait(500)).then(() => waitForTableReady(headerText, TIMEOUT.SHORT));
        }
        cy.log(`ℹ️ อยู่หน้าแรกอยู่แล้ว`);
        return cy.wrap(null);
    }) as unknown as Cypress.Chainable<void>;
};

const PAGINATION_WALK_MAX_PAGES = 10;

const getPaginationNextLi = (headerText: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return getSectionContainer(headerText).find('ul.pagination li').filter((_, li) => Cypress.$(li).text().trim() === 'Next');
};

const processAllPagesInTable = (headerText: string, rowAction: ($row: JQuery<HTMLElement>) => void, maxPages = PAGINATION_WALK_MAX_PAGES): Cypress.Chainable<void> => {
    const walk = (pageCount: number): Cypress.Chainable<void> => {
        if (pageCount > maxPages) { cy.log(`⚠️ เกิน maxPages (${maxPages})`); return cy.wrap(null) as unknown as Cypress.Chainable<void>; }
        return waitForTableReady(headerText, TIMEOUT.NAV).then(() => {
            return getTableContainer(headerText).find('tbody tr').then(($rows) => { $rows.each((_, row) => { rowAction(Cypress.$(row)); }); });
        }).then(() => getPaginationNextLi(headerText)).then(($nextLi) => {
            const isDisabled = $nextLi.length === 0 || $nextLi.hasClass('disabled');
            if (isDisabled) { cy.log(`✅ ถึงหน้าสุดท้ายแล้ว (หน้า ${pageCount})`); return cy.wrap(null) as unknown as Cypress.Chainable<void>; }
            return getTableContainer(headerText).find('tbody tr').first().invoke('text').then((firstRowTextBefore) => {
                cy.wrap($nextLi).find('a').click();
                return waitForTableReady(headerText, TIMEOUT.NAV).then(() => {
                    return getTableContainer(headerText).find('tbody tr').first().invoke('text').should((firstRowTextAfter) => {
                        expect(firstRowTextAfter, 'Row text should change after pagination').not.to.eq(firstRowTextBefore);
                    }).then(() => walk(pageCount + 1) as unknown as Cypress.Chainable<void>);
                });
            });
        }) as unknown as Cypress.Chainable<void>;
    };
    return walk(1) as unknown as Cypress.Chainable<void>;
};

export const collectAllToDoProjectCodes = (): Cypress.Chainable<string[]> => {
    const projectCodes: string[] = [];
    return waitForTableReady('To Do List', TIMEOUT.NAV).then(() => {
        return processAllPagesInTable('To Do List', ($row) => { const code = $row.find('td').eq(0).text().trim(); if (code) projectCodes.push(code); }).then(() => {
            cy.log(`📋 Collected ${projectCodes.length} PO code(s) from To Do List`);
            return cy.wrap(projectCodes);
        });
    }) as unknown as Cypress.Chainable<string[]>;
};

export const countRowsByProjectCode = (headerText: TaskListHeader, keyword: string, maxPages = 10): Cypress.Chainable<number> => {
    let count = 0;
    const countOnCurrentPageAndProceed = (currentPage: number): Cypress.Chainable<number> => {
        if (currentPage > maxPages) return cy.wrap(count);
        return waitForTableReady(headerText, TIMEOUT.NAV).then(() => {
            return getTableContainer(headerText).find('tbody tr').then(($rows) => {
                let matchOnThisPage = 0;
                $rows.each((_, row) => { if (rowMatchesKeyword(row, keyword)) { count++; matchOnThisPage++; } });
                cy.log(`📊 [${headerText}] Page ${currentPage}: พบ ${matchOnThisPage} แถว (รวมสะสม: ${count})`);
                if (matchOnThisPage === 0) { cy.log(`⏹️ หยุดค้นหาหน้าถัดไป`); return cy.wrap(count); }
                return getPaginationNextLi(headerText).then(($nextLi) => {
                    const isDisabled = $nextLi.length === 0 || $nextLi.hasClass('disabled');
                    if (isDisabled) return cy.wrap(count);
                    return cy.wrap($nextLi).find('a').click().then(() => waitForTableReady(headerText, TIMEOUT.NAV).then(() => countOnCurrentPageAndProceed(currentPage + 1)));
                });
            });
        });
    };
    return resetPaginationToFirst(headerText).then(() => {
        return getTableContainer(headerText).find('tbody tr').then(($rows) => {
            const isEmpty = $rows.length === 0 || ($rows.length === 1 && /no data/i.test($rows.text()));
            if (isEmpty) { cy.log(`📊 ไม่มีแถวเลย`); return cy.wrap(0); }
            return countOnCurrentPageAndProceed(1).then((finalCount) => {
                cy.log(`📊 พบรวมทั้งสิ้น ${finalCount} แถว`);
                return resetPaginationToFirst(headerText).then(() => cy.wrap(finalCount));
            });
        });
    }) as unknown as Cypress.Chainable<number>;
};

export const ClaimProject = (
    projectName: string,
    options?: {
        claimBy?: 'project' | 'po';
        specificPoName?: string;
        allProjectCodes?: string[];
        role?: string;
    }
): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const claimBy = options?.claimBy ?? 'po';
    const resolvedPoNames: string[] = [];
    const seen = new Set<string>();
    const duplicated = new Set<string>();

    for (let i = 0; i < poCount; i++) {
        const name = (allPoNames[i] ?? `${projectName}_PO${i + 1}`).trim();
        if (!name) throw new Error(`❌ PO name ที่ index ${i} ว่างเปล่า`);
        if (seen.has(name)) duplicated.add(name);
        seen.add(name);
        resolvedPoNames.push(name);
    }

    if (duplicated.size > 0) throw new Error(`❌ allPoNames ซ้ำกัน: [${[...duplicated].join(', ')}]`);

    const MAX_PAGES = 3;
    const MAX_RELOAD_ATTEMPTS = 6;
    const RELOAD_WAIT_MS = 1000;
    const CLAIM_PAGE1_RELOAD_ATTEMPTS = 3;

    cy.log(`🔁 Total PO to Claim: ${poCount} | 🔑 Claim mode: ${claimBy}${options?.specificPoName ? ` | 🎯 Specific PO: ${options.specificPoName}` : ''}`);

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
                    return getTableContainer('Unassigned Task').find('tbody tr').eq(foundRowIndex).find('button.claim-top').should('be.visible').and('not.be.disabled').click().then(() => {
                        const waitKeywords = buildRoleSearchKeywords(projectName, options?.role, keyword);
                        waitForKeywordInToDo(waitKeywords);
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
            throw new Error(`❌ ไม่เจอแถวที่ตรงกับ keyword ใดๆ เลย: [${keywords.join(', ')}]`);
        }

        return searchAndClaimWithKeyword(keywords[idx]).then((success): Cypress.Chainable<null> => {
            if (!success) return claimWithFallback(keywords, idx + 1, reloadAttempt);
            return cy.wrap<null>(null, { log: false });
        });
    };

    const claimByPO = (remainingPOs: number, poIndex: number = 0): void => {
        if (remainingPOs <= 0) {
            cy.log('✅ All POs claimed');
            return;
        }
        const poName = resolvedPoNames[poIndex];
        const keywords = buildRoleSearchKeywords(projectName, options?.role, poName);
        claimWithFallback(keywords).then(() => claimByPO(remainingPOs - 1, poIndex + 1));
    };

    const claimSpecificPO = (poName: string): void => {
        const keywords = buildRoleSearchKeywords(projectName, options?.role, poName);
        claimWithFallback(keywords).then(() => cy.log(`✅ Claimed specific PO: ${poName}`));
    };

    const claimAllByProjectCode = (keywords: string[]): void => {
        if (keywords.length === 0) throw new Error('❌ claimAllByProjectCode: ไม่มี keyword');

        const CLAIM_PROJECT_MAX_PAGES = 10;
        const CLAIM_PROJECT_LOOP_LIMIT = 80;

        const claimAllMatchingOnCurrentPage = (keyword: string, claimedSoFar: number = 0): Cypress.Chainable<number> => {
            return getTableContainer('Unassigned Task').then(($table) => {
                const $matchingRows = $table.find('tbody tr').filter((_, el) => rowMatchesKeyword(el, keyword));
                if ($matchingRows.length === 0) return cy.wrap(claimedSoFar);

                return getTableContainer('Unassigned Task').find('tbody tr').filter((_, el) => rowMatchesKeyword(el, keyword)).eq(0).find('button.claim-top').should('be.visible').and('not.be.disabled').click().then(() => {
                    return getTableContainer('Unassigned Task').find('tbody tr', { timeout: TIMEOUT.NAV }).should(($rows) => {
                        expect($rows.toArray().filter((el) => rowMatchesKeyword(el, keyword)).length).to.be.lessThan($matchingRows.length);
                    }).then(() => claimAllMatchingOnCurrentPage(keyword, claimedSoFar + 1));
                });
            });
        };

        const claimKeywordAtIndex = (kwIdx: number, totalClaimedAll: number): void => {
            if (kwIdx >= keywords.length) {
                finishClaimAll(totalClaimedAll);
                return;
            }

            const keyword = keywords[kwIdx];
            cy.log(`🔑 [claimAllByProjectCode] keyword ${kwIdx + 1}/${keywords.length}: "${keyword}"`);

            const claimWithPagination = (currentPage: number, page1Reload: number, totalClaimedThisKw: number, loopCount: number): void => {
                if (loopCount > CLAIM_PROJECT_LOOP_LIMIT || currentPage > CLAIM_PROJECT_MAX_PAGES) {
                    claimKeywordAtIndex(kwIdx + 1, totalClaimedAll + totalClaimedThisKw);
                    return;
                }

                claimAllMatchingOnCurrentPage(keyword, 0).then((claimedOnThisPage) => {
                    const newTotal = totalClaimedThisKw + claimedOnThisPage;

                    if (claimedOnThisPage > 0) {
                        cy.log(`✅ [claim] page ${currentPage}: "${keyword}" claimed ${claimedOnThisPage} (รวม ${newTotal})`);
                        claimWithPagination(currentPage, page1Reload, newTotal, loopCount + 1);
                        return;
                    }

                    // ✅ แก้ไข: ถ้า keyword นี้ claim สำเร็จไปแล้วอย่างน้อย 1 รายการ ถือว่าจบสำหรับ keyword นี้
                    // (project code ปกติมีรายการเดียว) — ข้ามไป keyword ถัดไปทันที ไม่ต้อง reload/เดิน pagination เพิ่ม
                    if (newTotal > 0) {
                        cy.log(`✅ [claimAllByProjectCode] "${keyword}" claimed ครบแล้ว (${newTotal} รายการ) — ข้ามไป keyword ถัดไปโดยไม่ reload/เดิน pagination เพิ่ม`);
                        claimKeywordAtIndex(kwIdx + 1, totalClaimedAll + newTotal);
                        return;
                    }

                    if (currentPage === 1 && page1Reload < CLAIM_PAGE1_RELOAD_ATTEMPTS) {
                        waitForLoadingState();
                        cy.reload();
                        waitForLoadingState();
                        waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                        claimWithPagination(1, page1Reload + 1, newTotal, loopCount + 1);
                        return;
                    }

                    getSectionContainer('Unassigned Task').find('ul.pagination li').then(($items) => {
                        const $nextBtn = $items.filter((_, li) => Cypress.$(li).text().trim() === 'Next' && !Cypress.$(li).hasClass('disabled'));
                        if ($nextBtn.length > 0) {
                            cy.wrap($nextBtn.first()).find('a').click();
                            cy.wait(500);
                            waitForTableReady('Unassigned Task', TIMEOUT.NAV);
                            claimWithPagination(currentPage + 1, page1Reload, newTotal, loopCount + 1);
                        } else {
                            cy.log(`⚠️ ไม่พบ "${keyword}" ในหน้าใดเลย — ข้ามไป keyword ถัดไป`);
                            claimKeywordAtIndex(kwIdx + 1, totalClaimedAll + newTotal);
                        }
                    });
                });
            };

            claimWithPagination(1, 0, 0, 0);
        };

        const finishClaimAll = (claimedCount: number): void => {
            resetPaginationToFirst('Unassigned Task').then(() => {
                if (claimedCount > 0) {
                    cy.log(`✅ [claimAllByProjectCode] claimed รวม ${claimedCount} รายการ (${keywords.length} keywords)`);
                    waitForKeywordInToDo(keywords);
                } else {
                    cy.log(`ℹ️ [claimAllByProjectCode] ไม่พบแถวให้ claim`);
                }
            });
        };

        waitForTableReady('Unassigned Task', TIMEOUT.NAV);
        claimKeywordAtIndex(0, 0);
    };

    if (claimBy === 'project' || isProjectTaskRole(options?.role)) {
        const codes = options?.allProjectCodes ?? [];
        const currentProjectCode = (Cypress.env('currentProjectCode') as string) || '';
        const allProjectCodesEnv: string[] = Cypress.env('allProjectCodes') as string[] || [];

        const allCodes = [...new Set([...allProjectCodesEnv, currentProjectCode, ...codes])].filter(Boolean);

        if (allCodes.length > 0) {
            cy.log(`🔑 Claiming by project codes only: [${allCodes.join(', ')}]`);
            claimAllByProjectCode(allCodes);
        } else {
            const keywords = buildRoleSearchKeywords(projectName, options?.role);
            cy.log(`⚠️ No project codes found, falling back to keywords: [${keywords.join(', ')}]`);
            claimAllByProjectCode(keywords);
        }
    } else if (options?.specificPoName) {
        claimSpecificPO(options.specificPoName);
    } else {
        claimByPO(poCount);
    }
};