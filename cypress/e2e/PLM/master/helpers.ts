import { Module } from './config';

// ========================
// HELPER FUNCTIONS
// ========================

export const selectRandomOption = (labelName: string): void => {
    cy.contains('label', labelName)
        .parent()
        .next('div')
        .find('mat-select')
        .click()
        .then(() => {
            cy.get('mat-option').then($options => {
                const randomIndex = Math.floor(Math.random() * $options.length);
                cy.wrap($options[randomIndex]).click({ force: true });
            });
        });
};

export const handleAddToUSMP = (): void => {
    cy.get('body').then(($body) => {
        if ($body.find('button:contains("Add to USMP")').length > 0) {
            cy.log('🟢 Found Add to USMP button, clicking...');
            cy.contains('button', 'Add to USMP').click();
            cy.wait(5000);
            
            // Single combined selector query instead of multiple checks
            cy.get('.modal.fade.in, .mat-dialog-container', { timeout: 10000 })
                .last()
                .should('be.visible')
                .within(() => {
                    cy.contains('button', /Close|OK|ปิด/i, { timeout: 10000 })
                        .should('be.visible')
                        .click();
                })
                .then(() => {
                    cy.get('.modal.fade.in, .mat-dialog-container', { timeout: 10000 }).should('not.exist');
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
            cy.get('button')
                .contains('Yes', { timeout })
                .then(($btn) => {
                    cy.wrap($btn).eq(position === 'first' ? 0 : -1).click();
                });
        }
    });
};

export const getRandomPhone = (): string => {
    return `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
};

// ========================
// LOGIN FUNCTIONS
// ========================

export const login = (username: string | undefined, password: string | undefined): void => {
    const safeUsername = String(username ?? '').trim();
    const safePassword = String(password ?? '').trim();

    if (!safeUsername || !safePassword) {
        cy.log('⚠️ Login credentials missing; typing empty values to avoid Cypress type() failures.');
    }

    cy.get('app-login', { timeout: 60000 }).should('be.visible');
    cy.get('form', { timeout: 30000 }).should('be.visible');

    cy.get('input[name="userId"]', { timeout: 30000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .clear({ force: true })
        .type(safeUsername, { delay: 0, force: true });

    cy.get('input[name="pwd"]', { timeout: 30000 })
        .should('exist')
        .should('be.visible')
        .should('not.be.disabled')
        .clear({ force: true })
        .type(safePassword, { delay: 0, force: true });

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
    const { waitAfterNext = 2000, filterCallback } = options;

    const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
        return cy.get('h3')
            .contains(sectionHeader, { timeout: 100000 })
            .parent()
            .find('tbody tr', { timeout: 10000 })
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
            })
            .then(($rows) => {
                cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

                let found = false;
                let matchingIndex = -1;

                // Early exit loop for performance
                for (let index = 0; index < $rows.length && !found; index++) {
                    const $row = Cypress.$($rows[index]);
                    const rowText = $row.text().trim();

                    const matches = filterCallback
                        ? filterCallback($row, index)
                        : rowText.includes(searchText);

                    if (matches) {
                        matchingIndex = index;
                        found = true;
                        cy.log(`✅ Found match at row ${index}`);
                    }
                }

                if (found && matchingIndex >= 0) {
                    rowCallback(Cypress.$(), matchingIndex);
                }

                return cy.wrap(found);
            });
    };

    const clickNextAndWait = (): Cypress.Chainable<boolean> => {
        return cy.get('h3')
            .contains(sectionHeader, { timeout: 100000 })
            .parent()
            .then(($section) => {
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
