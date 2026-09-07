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
            cy.get('mat-option').filter(':visible').then($options => {
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
    const deadline = Date.now() + timeout;
    const pollIntervalMs = 300;
    const poll = (): void => {
        cy.get('body').then(($body) => {
            const $yesBtns = $body.find(
                '.modal:visible button:contains("Yes"), .mat-dialog-container:visible button:contains("Yes"), button:contains("Yes")'
            );

            if ($yesBtns.length > 0) {
                cy.wrap($yesBtns).eq(position === 'first' ? 0 : -1).should('be.visible').click({ force: true });
                return;
            }

            if (Date.now() < deadline) {
                cy.wait(pollIntervalMs);
                poll();
            } else {
                cy.log(`ℹ️ No "Yes" button found in DOM after polling ${timeout}ms, skipping click.`);
            }
        });
    };

    poll();
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

    cy.wait('@getErrorCodes', { timeout: 30000 }).then((interception) => {
        const statusCode = interception.response?.statusCode ?? 0;
        expect(statusCode, 'plm-error-code API response status').to.be.oneOf([200, 304]);
    });
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

    const resetAndSearch = (): void => {
        cy.get('h3')
            .contains(sectionHeader, { timeout: 10000 })
            .parent()
            .find('.pagination li')
            .then(($items) => {
                const $firstBtn = $items.filter((_, li) => {
                    return Cypress.$(li).text().trim() === 'First' && !Cypress.$(li).hasClass('disabled');
                });
                if ($firstBtn.length > 0) {
                    cy.log(`⏮️ Reset pagination ไปยังหน้าแรกสำหรับ "${sectionHeader}" ก่อนเริ่มค้นหา`);
                    cy.wrap($firstBtn.first()).find('a').click();
                    
                    cy.get('h3')
                        .contains(sectionHeader)
                        .parent()
                        .find('tbody tr', { timeout: 10000 })
                        .should(($rows) => {
                            expect($rows.text()).not.to.contain('Fetching data');
                        });
                    cy.wait(500);
                }
            })
            .then(() => {
                searchPage();
            });
    };

    const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
        return cy.get('h3')
            .contains(sectionHeader, { timeout: 10000 })
            .parent()
            .find('tbody tr', { timeout: 10000 })
            .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
            })
            .then(($rows) => {
                cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

                let found = false;
                let matchingIndex = -1;

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
                    rowCallback(Cypress.$($rows[matchingIndex]), matchingIndex);
                }

                return cy.wrap(found);
            });
    };

    const clickNextAndWait = (): Cypress.Chainable<boolean> => {
        return cy.get('h3')
            .contains(sectionHeader, { timeout: 10000 })
            .parent()
            .then(($section) => {
                const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

                if ($nextBtn.length > 0) {
                    cy.log(`➡️ ${sectionHeader} - Going to next page...`);

                    // ✅ FIX: ใช้ cy.wrap() ครอบ jQuery object ก่อนเรียก .invoke() และระบุ type ให้ firstRowTextBefore
                    return cy.wrap($section.find('tbody tr').first())
                        .invoke('text')
                        .then((firstRowTextBefore: string) => {
                            cy.wrap($nextBtn).click();

                            return cy.get('h3')
                                .contains(sectionHeader, { timeout: 10000 })
                                .parent()
                                .find('tbody tr')
                                .should(($rows) => {
                                    expect($rows.first().text().trim()).not.to.equal(firstRowTextBefore.trim());
                                    expect($rows.text()).not.to.contain('Fetching data');
                                })
                                .then(() => {
                                    cy.wait(waitAfterNext);
                                    return cy.wrap(true);
                                });
                        });
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

    resetAndSearch();
};
const normalizeText = (text: string) => {
    return text.replace(/\s+/g, ' ').trim();
};

const getVisibleEnabledButtonByText = (label: string) => {
    return Cypress.$('button')
        .filter((_, el) => {
            const text = normalizeText(Cypress.$(el).text());
            return text.includes(label);
        })
        .filter((_, el) => {
            const $el = Cypress.$(el);

            return (
                $el.is(':visible') &&
                !$el.prop('disabled') &&
                $el.attr('aria-disabled') !== 'true'
            );
        });
};

export const waitForVisibleEnabledButton = (
    label: string,
    timeout = 120000,
    interval = 500
): Cypress.Chainable<boolean> => {
    const startedAt = Date.now();

    const check = (): Cypress.Chainable<boolean> => {
        const $btn = getVisibleEnabledButtonByText(label);

        if ($btn.length > 0) {
            return cy.wrap(true, { log: false });
        }

        if (Date.now() - startedAt >= timeout) {
            return cy.wrap(false, { log: false });
        }

        return cy.wait(interval, { log: false }).then(check);
    };

    return check();
}

export const waitForLoadingOverlayHidden = (timeout = 120000) => {
    cy.document({ timeout }).its('readyState').should('eq', 'complete');

    cy.get('body', { timeout }).should(($body) => {
        /**
         * ถ้าระบบมี loading selector เฉพาะ ให้แก้ตรงนี้ให้ตรงของจริง
         * เช่น .loading, .spinner, [class*="loading"]
         */
        const loadingSelectors = [
            '.loading',
            '.spinner',
            '[class*="loading"]',
            '[class*="spinner"]',
            '.ngx-spinner-overlay',
            '.MuiBackdrop-root',
        ];

        const hasVisibleLoading = loadingSelectors.some((selector) => {
            return $body.find(selector).filter(':visible').length > 0;
        });

        expect(hasVisibleLoading, 'loading overlay should be hidden').to.be.false;
    });
};