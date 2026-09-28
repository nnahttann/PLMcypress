import { Module } from './config';
export const selectRandomOption = (labelName: string, timeout = 60000): void => {
    const startedAt = Date.now();
    const checkAndOpen = (): void => {
        cy.contains('label', labelName)
            .parent()
            .next('div')
            .find('mat-select')
            .then($sel => {
            if ($sel.length === 0) {
                if (Date.now() - startedAt >= timeout) {
                    throw new Error(`❌ mat-select for ${labelName} not found within timeout`);
                }
                cy.wait(500, { log: false }).then(checkAndOpen);
                return;
            }
            const $el = $sel.first();
            const isVisible = $el.is(':visible');
            const isDisabled = $el.prop('disabled') || $el.attr('aria-disabled') === 'true';
            if (!isVisible || isDisabled) {
                if (Date.now() - startedAt >= timeout) {
                    cy.log(`⚠️ mat-select for ${labelName} not ready — dumping outer HTML`);
                    cy.contains('label', labelName).parent().next('div').then($c => cy.log($c.html()));
                    throw new Error(`❌ mat-select for ${labelName} not ready within timeout`);
                }
                cy.wait(500, { log: false }).then(checkAndOpen);
                return;
            }
            cy.wrap($el).click({ force: true }).then(() => {
                cy.get('mat-option').filter(':visible').then($options => {
                    const randomIndex = Math.floor(Math.random() * $options.length);
                    cy.wrap($options[randomIndex]).click({ force: true });
                });
            });
        });
    };
    checkAndOpen();
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
        }
        else {
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
            const $yesBtns = $body.find('.modal:visible button:contains("Yes"), .mat-dialog-container:visible button:contains("Yes"), button:contains("Yes")');
            if ($yesBtns.length > 0) {
                cy.wrap($yesBtns).eq(position === 'first' ? 0 : -1).should('be.visible').click({ force: true });
                return;
            }
            if (Date.now() < deadline) {
                cy.wait(pollIntervalMs);
                poll();
            }
            else {
                cy.log(`ℹ️ No "Yes" button found in DOM after polling ${timeout}ms, skipping click.`);
            }
        });
    };
    poll();
};
export const clickVisibleButtonBySelector = (selector: string, timeout: number = 30000): void => {
    const startedAt = Date.now();
    const tryClick = (): void => {
        cy.get('body').then(($body) => {
            const hasLoading = $body
                .find('.loading-curtain, .spinner, [class*="loading"], [class*="spinner"], .ngx-spinner-overlay, .MuiBackdrop-root')
                .filter(':visible')
                .length > 0;

            if (hasLoading) {
                if (Date.now() - startedAt < timeout) {
                    cy.wait(250, { log: false }).then(tryClick);
                    return;
                }
                throw new Error(`โหลดหน้า/overlay ยังไม่หายก่อน selector: ${selector}`);
            }

            const $match = $body
                .find(selector)
                .filter(':visible')
                .filter((_, el) => !Cypress.$(el).is(':disabled'))
                .first();

            if ($match.length > 0) {
                cy.wrap($match).scrollIntoView().click({ force: true });
                return;
            }

            if (Date.now() - startedAt < timeout) {
                cy.wait(250, { log: false }).then(tryClick);
                return;
            }

            throw new Error(`ไม่เจอปุ่มที่ตรง selector: ${selector} หลังรอครบ ${timeout}ms`);
        });
    };
    tryClick();
};
export const getRandomPhone = (): string => {
    return `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
};
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
export const searchInTableWithPagination = (sectionHeader: string, searchText: string, rowCallback: ($row: JQuery<HTMLElement>, index: number) => void, options: {
    waitAfterNext?: number;
    filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
} = {}): void => {
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
                }
                else {
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
        return ($el.is(':visible') &&
            !$el.prop('disabled') &&
            $el.attr('aria-disabled') !== 'true');
    });
};
export const waitForVisibleEnabledButton = (label: string, timeout = 120000, interval = 500): Cypress.Chainable<boolean> => {
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
};
export const waitForVisibleEnabledInputByLabel = (label: string, timeout = 120000, interval = 500): Cypress.Chainable<boolean> => {
    const startedAt = Date.now();
    const check = (): Cypress.Chainable<boolean> => {
        const $label = Cypress.$('label').filter((_, el) => normalizeText(Cypress.$(el).text()).includes(label));
        if ($label.length > 0) {
            const $input = $label.closest('.col-md-4').find('input');
            if ($input.length > 0) {
                const $el = $input.first();
                const isVisible = $el.is(':visible');
                const isDisabled = $el.prop('disabled') || $el.attr('aria-disabled') === 'true';
                if (isVisible && !isDisabled) {
                    return cy.wrap(true, { log: false });
                }
            }
        }
        if (Date.now() - startedAt >= timeout) {
            return cy.wrap(false, { log: false });
        }
        return cy.wait(interval, { log: false }).then(check);
    };
    return check();
};
export const waitForLoadingOverlayHidden = (timeout = 120000) => {
    cy.document({ timeout }).its('readyState').should('eq', 'complete');
    cy.get('body', { timeout }).should(($body) => {
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

export const selectRandomFromSelect = (selector: string, timeout = 60000): Cypress.Chainable<boolean> => {
    const startedAt = Date.now();
    const check = (): Cypress.Chainable<boolean> => {
        return cy.get(selector, { timeout })
            .should('be.visible')
            .and('not.be.disabled')
            .find('option:not([disabled])')
            .then(($opts) => {
            const arr = Array.from($opts as any) as HTMLOptionElement[];
            if (arr.length === 0) {
                if (Date.now() - startedAt < timeout) {
                    return cy.wait(500, { log: false }).then(check);
                }
                throw new Error(`❌ ${selector} has no enabled options within timeout`);
            }
            const randomOpt = arr[Math.floor(Math.random() * arr.length)];
            const chosen = String(randomOpt.value ?? randomOpt.textContent ?? '').trim();
            if (!chosen) {
                const dump = arr.map((o) => `value="${o.value}" text="${String(o.textContent || '').trim()}"`).join(' | ');
                throw new Error(`❌ selectRandomFromSelect: resolved empty value/text for ${selector}. Available: ${dump}`);
            }
            cy.log(`Selecting random option '${chosen}' for ${selector}`);
            return cy.get(selector).select(chosen, { force: true }).then(() => {
                // verify selection has non-empty value; if not, try fallback by finding option and setting val directly
                return cy.get(selector).find('option:selected').then($sel => {
                    const val = $sel.val();
                    if (val === undefined || val === null || String(val).trim() === '') {
                        // fallback: find matching option and set its value
                        const opts = arr;
                        const normalize = (s: string) => (s || '').trim().replace(/\s+/g, ' ');
                        const idx = opts.findIndex(o => normalize(String(o.textContent || '')) === normalize(chosen) || String(o.value || '') === chosen || normalize(String(o.textContent || '')).includes(normalize(chosen)));
                        const opt = opts[idx >= 0 ? idx : 0];
                        const val2 = String(opt.value ?? opt.textContent ?? '').trim();
                        if (!val2) {
                            const dump = opts.map((o) => `value="${o.value}" text="${String(o.textContent || '').trim()}"`).join(' | ');
                            throw new Error(`❌ selectRandomFromSelect fallback: no usable value/text for ${selector}. Available: ${dump}`);
                        }
                        cy.log(`Fallback: setting ${selector} value -> '${val2}'`);
                        return cy.get(selector).then($s => {
                            const el = $s[0] as HTMLSelectElement | undefined;
                            if (!el) {
                                throw new Error(`❌ selectRandomFromSelect fallback: could not access element ${selector}`);
                            }
                            // try setting value directly
                            try {
                                (el as any).value = val2;
                            }
                            catch (_e) {
                                // ignore
                            }
                            // set selectedIndex for stronger effect
                            const opts = Array.from(el.options || []) as HTMLOptionElement[];
                            const idx2 = opts.findIndex(o => (o.value || '').toString() === val2 || (o.textContent || '').trim() === val2 || (o.textContent || '').trim().includes(val2));
                            const useIdx = idx2 >= 0 ? idx2 : 0;
                            if (el.options && el.options.length > useIdx) {
                                el.selectedIndex = useIdx;
                                el.options[useIdx].selected = true;
                            }
                            // dispatch events so frameworks (Angular) pick up changes
                            el.dispatchEvent(new Event('focus', { bubbles: true }));
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                            el.dispatchEvent(new Event('change', { bubbles: true }));
                            el.dispatchEvent(new Event('blur', { bubbles: true }));

                            // wait a bit and verify the selected option has a value
                            return cy.wait(250, { log: false }).then(() => {
                                return cy.get(selector).find('option:selected').then($sel2 => {
                                    const valAfter = $sel2.val();
                                    if (valAfter === undefined || valAfter === null || String(valAfter).trim() === '') {
                                        // dump options and outerHTML for debugging
                                        const dump = opts.map((o) => `value="${o.value}" text="${String(o.textContent || '').trim()}"`).join(' | ');
                                        // log outerHTML for the select
                                        cy.get(selector).then($full => cy.log($full.prop('outerHTML')));
                                        throw new Error(`❌ selectRandomFromSelect fallback failed to set value for ${selector}. Tried '${val2}'. Available: ${dump}`);
                                    }
                                    return cy.wrap(true);
                                });
                            });
                        });
                    }
                    return cy.wrap(true);
                });
            });
        });
    };
    return check();
};
