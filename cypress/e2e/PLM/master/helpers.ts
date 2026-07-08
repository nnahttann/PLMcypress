import { Module } from './config';

// ========================
// HELPER FUNCTIONS
// ========================

export const selectRandomOption = (labelName: string): void => {
    cy.contains('label', labelName).parent().next('div').find('mat-select').click();
    cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
    });
};

export const handleAddToUSMP = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('button:contains("Add to USMP")').length > 0) {
            cy.log('🟢 Found Add to USMP button, clicking...');
            cy.contains('button', 'Add to USMP').click();

            // ⏳ Don't inspect DOM synchronously right after click.
            // Give Angular time to render the modal, then assert on it.
            cy.get('body', { timeout: 10000 }).then(($b) => {
                const hasBootstrapModal = $b.find('.modal.fade.in').length > 0;
                const hasAngularDialog = $b.find('.mat-dialog-container').length > 0;

                if (hasBootstrapModal || hasAngularDialog) {
                    const selector = hasBootstrapModal ? '.modal.fade.in' : '.mat-dialog-container';
                    cy.log(hasBootstrapModal ? '📦 Bootstrap modal detected' : '📦 Angular dialog detected');

                    // Wait for it to actually be visible (handles animation delay)
                    cy.get(selector, { timeout: 10000 })
                        .last() // in case a stale modal is still in DOM, grab the most recent
                        .should('be.visible')
                        .within(() => {
                            cy.contains('button', /Close|OK|ปิด/i, { timeout: 10000 })
                                .should('be.visible')
                                .click();
                        });

                    // Confirm it actually closed, to catch silent failures
                    cy.get(selector, { timeout: 10000 }).should('not.exist');
                } else {
                    cy.log('⚠️ ไม่พบ modal/dialog ทันที — รอเช็คอีกครั้ง...');

                    // Fallback: give it one more chance with cy.get's built-in retry,
                    // in case the modal appeared slightly after our first check.
                    cy.get('body').then(($b2) => {
                        if ($b2.find('.modal.fade.in, .mat-dialog-container').length > 0) {
                            cy.log('📦 Modal appeared on second check');
                            cy.get('.modal.fade.in, .mat-dialog-container')
                                .last()
                                .should('be.visible')
                                .within(() => {
                                    cy.contains('button', /Close|OK|ปิด/i).click();
                                });
                        } else {
                            cy.log('⚪ ยืนยันว่าไม่มี modal/dialog — ข้ามการปิด');
                        }
                    });
                }
            });
        } else {
            cy.log('⚪ Add to USMP button not found, skipping...');
        }
    });
};

export const scrollAndWait = (ms: number = 2000): void => {
    cy.scrollTo('bottom');
    cy.wait(ms);
};

export const clickYesIfExists = (timeout: number = 10000, position: 'first' | 'last' = 'last'): void => {
    cy.get('body').then(($body) => {
        if ($body.find('button:contains("Yes")').length > 0) {
            cy.get('button').contains('Yes', { timeout }).eq(position === 'first' ? 0 : -1).click();
        }
    });
};

export const clickButtonIfExists = (buttonText: string, timeout: number = 10000): void => {
    cy.get('body').then(($body) => {
        if ($body.find(`button:contains("${buttonText}")`).length > 0) {
            cy.contains('button', buttonText, { timeout }).click();
        }
    });
};

export const getRandomPhone = (): string => {
    return `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
};

// ========================
// LOGIN FUNCTIONS
// ========================

export const login = (username: string, password: string): void => {
    cy.get('app-login', { timeout: 60000 }).should('be.visible');
    cy.get('form', { timeout: 30000 }).should('be.visible');

    cy.get('input[name="userId"]', { timeout: 30000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .clear()
        .type(username, { delay: 50 });

    cy.get('input[name="pwd"]')
        .should('be.visible')
        .clear()
        .type(password, { delay: 50 });

    cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

    cy.get('button[name="login"], button[type="submit"]')
        .contains('Login')
        .should('be.visible')
        .click();

    cy.wait('@getErrorCodes', { timeout: 30000 })
        .its('response.statusCode')
        .should('eq', 200);
};

export const loginAndWaitReady = (username: string, password: string): void => {
    login(username, password);
//     cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
//     cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
};

// ========================
// PAGINATION HELPER
// ========================

export const searchInTableWithPagination = (
    sectionHeader: string,
    searchText: string,
    rowCallback: ($row: JQuery<HTMLElement>, index: number) => void,
    options: {
        waitAfterNext?: number;
        filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
    } = {}
): void => {
    const { waitAfterNext = 4000, filterCallback } = options;

    const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
        return cy.get('h3').contains(sectionHeader, { timeout: 100000 })
            .parent()
            .find('tbody tr')
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
            })
            .then(($rows) => {
                cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

                let found = false;
                let matchingIndex = -1;

                $rows.each((index: number, row: HTMLElement) => {
                    if (found) return;

                    const $row = Cypress.$(row);
                    const rowText = $row.text().trim();

                    const matches = filterCallback
                        ? filterCallback($row, index)
                        : rowText.includes(searchText);

                    if (matches) {
                        matchingIndex = index;
                        found = true;
                        cy.log(`✅ Found match at row ${index}`);
                    }
                });

                if (found && matchingIndex >= 0) {
                    rowCallback(Cypress.$(), matchingIndex);
                }

                return cy.wrap(found);
            });
    };

    const clickNextAndWait = (): Cypress.Chainable<boolean> => {
        return cy.get('body').then(($body) => {
            const $section = $body.find(`h3:contains("${sectionHeader}")`).parent();
            const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

            if ($nextBtn.length > 0) {
                cy.log(`➡️ ${sectionHeader} - Going to next page...`);

                const firstRowTextBefore = $section.find('tbody tr').first().text().trim();

                cy.wrap($nextBtn).click();

                cy.get('h3').contains(sectionHeader, { timeout: 100000 })
                    .parent()
                    .find('tbody tr')
                    .should(($rows) => {
                        expect($rows.first().text().trim()).not.to.equal(firstRowTextBefore);
                        expect($rows.text()).not.to.contain('Fetching data');
                    });

                cy.wait(waitAfterNext);
                return cy.wrap(true);
            }
            return cy.wrap(false);
        });
    };

    const searchPage = (pageNum: number = 1): void => {
        cy.log(`🔍 Searching page ${pageNum}...`);

        searchInCurrentPage().then((found) => {
            if (found) {
                cy.log(`✅ Found on page ${pageNum}!`);
                return;
            }

            clickNextAndWait().then((hasNext) => {
                if (hasNext) {
                    searchPage(pageNum + 1);
                } else {
                    cy.log(`❌ "${searchText}" not found after ${pageNum} page(s)`);
                }
            });
        });
    };

    searchPage();
};
