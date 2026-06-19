import { TaskListHeader, FinalAction, CoreTaskCallback, ApproveFunction } from './config';
import { searchInTableWithPagination, scrollAndWait, loginAndWaitReady } from './helpers';
import { getStandardProjectName } from './project-manager';

// ========================
// CLAIM PROJECT
// ========================

export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po' }): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const claimBy = options?.claimBy ?? 'po';

    cy.log(`🔁 Total PO to Claim: ${poCount}`);
    cy.log(`🔑 Claim mode: ${claimBy}`);

    const MAX_PAGES = 3;

    const waitForUnassignedReady = (): Cypress.Chainable => {
        return cy
            .get('h3:contains("Unassigned Task")', { timeout: 15000 })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
                expect($rows.length).to.be.greaterThan(0);
            });
    };

    const claimOnce = (keyword: string): void => {
        const searchAndClaimOnce = (currentPage: number = 1): void => {
            if (currentPage > MAX_PAGES) {
                cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
                return;
            }

            cy.log(`🔍 [Claim-Project] Page ${currentPage} keyword: "${keyword}"`);

            waitForUnassignedReady().then(($rows) => {
                let found = false;
                let foundRowIndex = -1;

                $rows.each((index: number, row: HTMLElement) => {
                    if (found) return;
                    const rowText = Cypress.$(row).text().trim();
                    if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
                        found = true;
                        foundRowIndex = index;
                    }
                });

                if (found) {
                    cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}`);

                    cy.get('h3:contains("Unassigned Task")')
                        .parent()
                        .find('tbody tr')
                        .eq(foundRowIndex)
                        .find('button.claim-top')
                        .click({ force: true });

                    cy.log(`✅ Claimed project (once)`);

                    cy.get('h3:contains("To Do List")', { timeout: 30000 })
                        .parent()
                        .find('tbody tr')
                        .should(($todoRows) => {
                            expect($todoRows.text()).not.to.contain('Fetching data');
                            expect($todoRows.text()).to.include(keyword);
                        });

                    cy.log(`✅ Confirmed in To Do List`);

                } else {
                    cy.get('body').then(($body) => {
                        const $section = $body.find('h3:contains("Unassigned Task")').parent();
                        const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                        if ($nextBtn.length > 0) {
                            cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
                            const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
                            cy.wrap($nextBtn).click();

                            cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
                                .parent()
                                .find('tbody tr')
                                .should(($r) => {
                                    expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                                    expect($r.text()).not.to.contain('Fetching data');
                                });

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

        waitForUnassignedReady().then(($rows) => {
            let found = false;
            let foundRowIndex = -1;

            $rows.each((index: number, row: HTMLElement) => {
                if (found) return;
                const rowText = Cypress.$(row).text().trim();
                if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
                    found = true;
                    foundRowIndex = index;
                }
            });

            if (found) {
                cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}, keyword: "${keyword}"`);

                cy.get('h3:contains("Unassigned Task")')
                    .parent()
                    .find('tbody tr')
                    .eq(foundRowIndex)
                    .find('button.claim-top')
                    .click({ force: true });

                cy.log(`✅ Claimed 1 PO`);

                cy.get('h3:contains("To Do List")', { timeout: 30000 })
                    .parent()
                    .find('tbody tr')
                    .should(($todoRows) => {
                        expect($todoRows.text()).not.to.contain('Fetching data');
                        expect($todoRows.text()).to.include(keyword);
                    });

                cy.log(`✅ PO confirmed in To Do List`);
                claimByPO(remainingPOs - 1, poIndex + 1, 1);

            } else {
                cy.get('body').then(($body) => {
                    const $section = $body.find('h3:contains("Unassigned Task")').parent();
                    const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                    if ($nextBtn.length > 0) {
                        cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
                        const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
                        cy.wrap($nextBtn).click();

                        cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
                            .parent()
                            .find('tbody tr')
                            .should(($r) => {
                                expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                                expect($r.text()).not.to.contain('Fetching data');
                            });

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
    searchInTableWithPagination(
        'To Do List',
        projectName,
        (_$row, _index) => {
            cy.get('h3:contains("To Do List")')
                .parent()
                .contains('td[colspan="2"]', projectName)
                .closest('tr.cursor-point')
                .as('approveRow');

            cy.get('@approveRow').should('be.visible');
            cy.get('@approveRow').click();

            cy.log(`✅ Successfully entered approval page: ${projectName}`);
        },
        {
            waitAfterNext: 2000,
            filterCallback: ($row) => {
                const rowText = $row.text().trim();
                return rowText.includes(projectName) && !rowText.includes('Fetching data');
            }
        }
    );
};

// ========================
// ASSIGN TEAM TASK
// ========================

export function assignTeamTask(
    taskIdentifier: string,
    assignee: string,
    uniqueKeyword: string = ''
): void {
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    cy.get('h3').contains('Team Task').should('be.visible');
    cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);

    const partialIdentifier = taskIdentifier.split('_')[0];
    cy.log(`🔍 Searching for: "${partialIdentifier}" keyword: "${uniqueKeyword}"`);

    if (!partialIdentifier) {
        throw new Error(`❌ taskIdentifier is empty — cannot search`);
    }

    const findAndAssignOnCurrentPage = (): void => {
        cy.get('tbody tr').then(($rows) => {
            const matchedRow = $rows.filter((_, el) => {
                const $el = Cypress.$(el);
                const projectCode = $el.find('td:nth-child(1) div').text().trim();
                const productName = $el.find('td:nth-child(2) div').text().trim();

                const hasProject =
                    productName.includes(partialIdentifier) ||
                    projectCode.includes(partialIdentifier);

                const hasKeyword = uniqueKeyword
                    ? $el
                        .find('td')
                        .toArray()
                        .some((td) => Cypress.$(td).text().trim().includes(uniqueKeyword))
                    : true;

                return hasProject && hasKeyword;
            });

            if (matchedRow.length > 0) {
                const productNameText = Cypress.$(matchedRow[0])
                    .find('td:nth-child(2) div')
                    .text()
                    .trim();
                cy.log(`✅ Found row — Product: "${productNameText}"`);

                const $row = matchedRow.first();
                cy.wrap($row).scrollIntoView().should('be.visible');

                cy.wrap($row)
                    .find('select.form-control.input-sm')
                    .as('assigneeDropdown')
                    .scrollIntoView()
                    .focus()
                    .trigger('mousedown', { force: true })
                    .wait(1000);

                cy.get('@assigneeDropdown')
                    .find(`option`)
                    .should('have.length.greaterThan', 1);

                cy.get('@assigneeDropdown').then(($select) => {
                    $select.val(assignee);
                    $select[0].dispatchEvent(new Event('change', { bubbles: true }));
                });

                cy.get('@assigneeDropdown').should('have.value', assignee);
                cy.log(`✅ Selected assignee: "${assignee}"`);

                cy.on('window:alert', (text) => {
                    cy.log(`🔔 Alert: "${text}"`);
                    expect(text).to.include('success');
                });

                cy.wrap($row)
                    .find('button.btn-info')
                    .filter((_, el) => {
                        const txt = Cypress.$(el).text().trim();
                        return txt === 'Set' || txt === 'Reassign';
                    })
                    .first()
                    .should('not.be.disabled')
                    .click({ force: true });

                cy.wait('@getRequest', { timeout: 30000 })
                    .its('response.statusCode')
                    .should('eq', 200);
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
                        cy.wrap(nextItem.first()).find('a').click();
                        cy.wait('@getRequest', { timeout: 30000 })
                            .its('response.statusCode')
                            .should('eq', 200);
                        findAndAssignOnCurrentPage();
                    } else {
                        throw new Error(
                            `❌ "${partialIdentifier}" (keyword: "${uniqueKeyword}") not found on any page`
                        );
                    }
                });
            }
        });
    };

    findAndAssignOnCurrentPage();
}

// ========================
// APPROVAL FLOW BASE FUNCTIONS
// ========================

export const createFullPageApprovalFlow = (
    projectName: string,
    taskListHeader: TaskListHeader,
    expectedUrl: string,
    coreTaskCallback: CoreTaskCallback,
    finalAction: FinalAction
): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

    cy.get('h3').contains(taskListHeader).parent().within(() => {
        cy.get('tbody tr').then(($rows) => {
            $rows.each((index, row) => {
                const text = Cypress.$(row).text().trim();
                cy.log(`Row ${index}: ${text.substring(0, 100)}`);
                if (text.includes(projectName)) {
                    cy.log(`✅✅✅ MATCH at row ${index}`);
                }
            });
        });
        cy.contains('tbody tr', projectName, { timeout: 30000 })
            .should('be.visible')
            .within(() => {
                cy.get('span').contains('Approve').click();
            });
    });

    cy.url({ timeout: 600000 }).should('include', expectedUrl);

    cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
        .then((interceptions) => {
            interceptions.forEach((interception) => {
                expect(interception.response).to.exist;
                expect(interception.response!.statusCode).to.eq(200);
            });
        });

    coreTaskCallback();

    switch (finalAction) {
        case 'AlertAndLogout':
            cy.url({ timeout: 60000 }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout').click();
            break;
        case 'ComplexLogout':
            cy.url({ timeout: 60000 }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout').click();
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
    coreTaskCallback: CoreTaskCallback
): void => {
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

    cy.get('h3').contains(taskListHeader).parent().within(() => {
        cy.contains('tbody tr', projectName, { timeout: 30000 })
            .should('be.visible')
            .within(() => {
                cy.get('span').contains('Approve').click();
            });
    });

    cy.url({ timeout: 60000 }).should('include', expectedUrl);
    coreTaskCallback();
    cy.url({ timeout: 60000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').click();
};

// ========================
// ROLE HELPERS
// ========================

const assignTaskViaTracking = (projectName: string, assignee: string, billingSystem: string = ''): void => {
    cy.contains('span', 'Menu', { timeout: 30000 }).click();
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
    cy.get('a[href="#/new-report/home/tracking"]').click();
    cy.url({ timeout: 60000 }).should('include', '/new-report/home/tracking', { timeout: 30000 });

    cy.get('table.table.table-condensed', { timeout: 200000 }).should('be.visible');
    cy.get('table.table.table-condensed tbody tr', { timeout: 200000 })
        .first().find('td').first().should('not.be.empty');
    cy.contains('table.table.table-condensed tbody td', 'PLM', { timeout: 200000 }).should('be.visible');

    assignTeamTask(projectName, assignee, billingSystem);
};

export const navigateToWorkspace = (): void => {
    cy.contains('span', 'Menu', { timeout: 30000 }).click();
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
    cy.get('a[href="#/workspace-home/workspace"]').click();
    cy.url().should('include', '/workspace-home/workspace', { timeout: 60000 });
};

const performApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: {
        searchBy?: 'project' | 'po';
        assignee?: string;
        billingSystem?: string;
    }
): void => {
    loginAndWaitReady(user, pass);

    if (options?.assignee) {
        cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
        cy.wait(['@getRequest'], { timeout: 30000 }).its('response.statusCode').should('eq', 200);
    }

    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const searchBy = options?.searchBy ?? 'po';

    cy.log(`📋 Project: ${projectNamePONAME}`);
    cy.log(`🔁 Total PO to process: ${poCount}`);
    cy.log(`🔍 Search mode: ${searchBy}`);

    const approveNextPO = (index: number): void => {
        if (index >= poCount) {
            cy.log('✅ All POs approved');
            return;
        }

        const currentUniqueKeyword: string =
            searchBy === 'project'
                ? projectNamePONAME
                : allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;

        cy.log(`📦 [${index + 1}/${poCount}] Processing: "${currentUniqueKeyword}"`);

        if (options?.assignee) {
            assignTaskViaTracking(projectNamePONAME, options.assignee, currentUniqueKeyword);
            navigateToWorkspace();
            cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
        } else {
            cy.get('h3:contains("To Do List")', { timeout: 15000 })
                .parent()
                .find('tbody tr')
                .should(($rows) => {
                    expect($rows.text()).not.to.contain('Fetching data');
                });

            searchInTableWithPagination(
                'To Do List',
                currentUniqueKeyword,
                () => {
                    cy.get('h3:contains("To Do List")')
                        .parent()
                        .find('tbody tr.cursor-point')
                        .filter((_i, el) => Cypress.$(el).text().includes(currentUniqueKeyword))
                        .first()
                        .as('targetRow');

                    cy.get('@targetRow').should('be.visible').click();
                    cy.log(`✅ [${index + 1}/${poCount}] Entered PO approval page`);
                },
                {
                    waitAfterNext: 2000,
                    filterCallback: ($row) => {
                        const rowText = $row.text().trim();
                        return rowText.includes(currentUniqueKeyword) && !rowText.includes('Fetching data');
                    }
                }
            );
        }

        approveFunction(projectNamePONAME);

        if (index < poCount - 1) {
            if (options?.assignee) cy.wait(2000);
            navigateToWorkspace();

            cy.get('h3:contains("To Do List")', { timeout: 15000 })
                .parent()
                .find('tbody tr')
                .should(($rows) => {
                    expect($rows.text()).not.to.contain('Fetching data');
                    expect($rows.length).to.be.greaterThan(0);
                });

            approveNextPO(index + 1);
        }
    };

    approveNextPO(0);
};

export const performRoleTaskWithAssignment = (
    user: string,
    pass: string,
    assignee: string,
    approveFunction: ApproveFunction,
    billingSystem: string = '',
    options?: { searchBy?: 'project' | 'po' }
): void => {
    performApprovalRole(user, pass, approveFunction, {
        assignee,
        billingSystem,
        searchBy: options?.searchBy,
    });
};

export const performSimpleApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: { searchBy?: 'project' | 'po' }
): void => {
    performApprovalRole(user, pass, approveFunction, {
        searchBy: options?.searchBy,
    });
};

export const performSimpleClaimAndApprovalRole = (
    user: string,
    pass: string,
    approveFunction: ApproveFunction,
    options?: {
        searchBy?: 'project' | 'po'; // default: 'po'
    }
): void => {
    loginAndWaitReady(user, pass);


    const projectNamePONAME: string = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const searchBy = options?.searchBy ?? 'po';
    cy.log(`🔑 allPoNames raw: ${JSON.stringify(allPoNames)}`);
    cy.log(`🔑 allPoNames[0]: "${allPoNames[0]}"`);
    cy.log(`🔑 poCount: ${poCount}`);
    cy.log(`🔑 projectName: ${projectNamePONAME}`);
    cy.log(`📋 Project: ${projectNamePONAME}`);
    cy.log(`🔁 Total PO to process: ${poCount}`);
    cy.log(`🔍 Search mode: ${searchBy}`);

    ClaimProject(projectNamePONAME);

    const approveNextPO = (index: number): void => {
        if (index >= poCount) {
            cy.log('✅ All POs approved');
            return;
        }
        let currentUniqueKeyword: string =
            searchBy === 'project'
                ? projectNamePONAME
                : allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;

        if (searchBy === 'po' && currentUniqueKeyword.includes('_')) {
            currentUniqueKeyword = currentUniqueKeyword.split('_')[0].trim();
            cy.log(`✂️ Cleaned keyword: "${currentUniqueKeyword}"`);
        }

        cy.log(`📦 [${index + 1}/${poCount}] Searching by "${searchBy}": "${currentUniqueKeyword}"`);

        cy.get('h3:contains("To Do List")', { timeout: 15000 })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
            });

        searchInTableWithPagination(
            'To Do List',
            currentUniqueKeyword,
            ($row) => {
                cy.get('h3:contains("To Do List")')
                    .parent()
                    .find('tbody tr.cursor-point')
                    .filter((_i, el) => Cypress.$(el).text().includes(currentUniqueKeyword))
                    .first()
                    .as('targetRow');

                cy.get('@targetRow').should('be.visible').click();
                cy.log(`✅ [${index + 1}/${poCount}] Entered PO approval page`);
            },
            {
                waitAfterNext: 2000,
                filterCallback: ($row) => {
                    const rowText = $row.text().trim();
                    return rowText.includes(currentUniqueKeyword) && !rowText.includes('Fetching data');
                }
            }
        );

        approveFunction(projectNamePONAME);

        if (index < poCount - 1) {
            navigateToWorkspace();

            cy.get('h3:contains("To Do List")', { timeout: 15000 })
                .parent()
                .find('tbody tr')
                .should(($rows) => {
                    expect($rows.text()).not.to.contain('Fetching data');
                    expect($rows.length).to.be.greaterThan(0);
                });

            approveNextPO(index + 1);
        }
    };

    approveNextPO(0);
};
