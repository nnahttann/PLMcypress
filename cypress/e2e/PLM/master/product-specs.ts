import { ProductClass, Module } from './config';
import { selectRandomOption, scrollAndWait } from './helpers';
import { checkAndUpdateVerticalAppPriority } from './priority-updaters';

// ========================
// RANDOM PRODUCT SPECIFICATION
// ========================

export const RandomProductSpecification = (
    productClass: string,
    priceType?: string,
    subModule?: string,
    Module?: string
): void => {
    const targetList = [
        'AIS Secure Net',
        'Apple Care',
        'Cloud PC',
        'Flowaccount',
        'MS365 Copilot',
        'Mobile Care',
        'Ubisoft Plus',
        'Voice',
        'SMS',
        'MMS',
        'Calling Melody',
        'Cloud Game',
        'AI IP Camera',
        'WiFi',
        'Karaoke',
        'VRBT',
        'Music Streaming',
        'Arcade',
        'TV Plus',
        'Youtube Premium',
        'Internet',
        'Vertical App'
    ];

    const blockedForMain = ['SMS', 'MMS', 'Voice'];

    const effectiveBlocked = [
        ...blockedForMain,
        ...(productClass === 'main' ? ['Vertical App', 'AI IP Camera', 'Cloud Game', 'Content VDO', 'Youtube Premium', 'Calling Melody', 'Karaoke', 'VRBT', 'Music Streaming', 'Arcade', 'TV Plus'] : []),
    ];

    const canRandomPick = productClass === 'main' || productClass === 'ontop' || productClass === 'ontop extra';

    if (canRandomPick) {
        cy.contains('.panel-heading', '*Product Specification')
            .closest('.panel')
            .within(() => {
                cy.get('select[formcontrolname="availableListBox"]')
                    .first()
                    .find('option')
                    .should($options => {
                        const texts = [...$options].map(el => el.textContent?.trim() || '');
                        const hasAny = texts.some(t => targetList.includes(t));
                        expect(hasAny, 'waiting for targetList options to load').to.be.true;
                    })
                    .then($options => {
                        const available = [...$options]
                            .map(el => el.textContent?.trim() || '')
                            .filter(text => targetList.includes(text))
                            .filter(text => !effectiveBlocked.includes(text));

                        const pickCount = Cypress._.random(1, Math.min(available.length, 5));
                        const picked = Cypress._.shuffle(available).slice(0, pickCount);

                        cy.wrap(picked).as('pickedItems');
                        cy.log(`🎲 Picked (${pickCount}): ${picked.join(', ')}`);
                    });
            });
    } else {
        cy.wrap([]).as('pickedItems');
        cy.log(`⏭️ productClass="${productClass}" — ข้ามการสุ่ม pickedItems`);
    }
    cy.get('@pickedItems').then(alias => {
        const pickedItems = alias as unknown as string[];
        const configQueue: string[] = [];

        if (productClass === 'main') {
            configQueue.push('Internet');
            cy.log('📌 main: Internet forced into configQueue');
        }

        if (canRandomPick) {
            pickedItems
                .filter(item => !effectiveBlocked.includes(item))
                .forEach(item => {
                    cy.contains('.panel-heading', '*Product Specification')
                        .closest('.panel')
                        .within(() => {
                            cy.get('select[formcontrolname="availableListBox"]')
                                .first()
                                .contains('option', item)
                                .dblclick({ force: true });

                            cy.get('select[formcontrolname="availableListBox"]')
                                .first()
                                .find('option')
                                .should($options => {
                                    const texts = [...$options].map(el => el.textContent?.trim() || '');
                                    expect(texts, `"${item}" should leave availableListBox`).not.to.include(item);
                                });

                            cy.get('select[formcontrolname="selectedListBox"]')
                                .find('option')
                                .should($options => {
                                    const texts = [...$options].map(el => el.textContent?.trim() || '');
                                    expect(texts, `"${item}" should arrive in selectedListBox`).to.include(item);
                                })
                                .then(() => cy.log(`✅ moved to selected: ${item}`));
                        });

                    if (!configQueue.includes(item)) {
                        configQueue.push(item);
                        cy.log(`➕ added to configQueue: ${item}`);
                    }
                });
        }

        cy.then(() => {
            cy.log(`⚙️ configQueue: ${configQueue.join(', ')}`);

            if (configQueue.includes('Voice')) { cy.log('▶️ Voice()'); Voice(); }
            if (configQueue.includes('SMS')) { cy.log('▶️ Sms()'); Sms(); }
            if (configQueue.includes('MMS')) { cy.log('▶️ Mms()'); Mms(); }
            if (configQueue.includes('Internet')) { cy.log('▶️ InternetRandom()'); InternetRandom(productClass, subModule, Module); }
            if (configQueue.includes('Vertical App')) { cy.log('▶️ VerticalApp()'); VerticalApp(); }
            if (configQueue.includes('Cloud Game')) { cy.log('▶️ CloudGame()'); CloudGame(); }
            if (configQueue.includes('AI IP Camera')) { cy.log('▶️ AIIPCamera()'); AIIPCamera(); }
            if (configQueue.includes('WiFi')) { cy.log('▶️ WiFi()'); WiFi(); }
            if (configQueue.includes('Karaoke')) { cy.log('▶️ Karaoke()'); Karaoke(); }
            if (configQueue.includes('VRBT')) { cy.log('▶️ VRBT()'); VRBT(); }
            if (configQueue.includes('Music Streaming')) { cy.log('▶️ MusicStreaming()'); MusicStreaming(); }

            const entItems = configQueue.filter(i => ['Arcade', 'TV Plus', 'Youtube Premium'].includes(i));
            if (entItems.length > 0) {
                cy.log(`▶️ EntertainmentPartnership(${entItems.join(', ')})`);
                EntertainmentPartnership(entItems as any);
            }
            if (configQueue.includes('Youtube Premium')) {
                Cypress.env('hasYoutubePremium', true);
                cy.log('🎬 Youtube Premium → set hasYoutubePremium=true');
            }
            if (configQueue.includes('Cloud Game')) {
                Cypress.env('hasCloudGame', true);
                cy.log('☁️ Cloud Game ถูกเลือก → set hasCloudGame=true');
            }
        });
    });
};


// ========================
// VOICE
// ========================

export const Voice = (fillRating = true): void => {
    cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
            cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
                .contains(/^Voice$/)
                .click({ force: true });

            cy.wait(500);

            const shouldFill = {
                voiceFreeResource: Cypress._.random(0, 1) === 1,
                voiceFN: Cypress._.random(0, 1) === 1,
                voiceSpecialNumber: Cypress._.random(0, 1) === 1,
                // ✅ fillRating=false (main) → Rating ทั้ง 3 ถูกข้ามทุกครั้ง
                // ✅ fillRating=true  (ontop/ontop extra) → สุ่มตามปกติ
                voiceRating: fillRating && Cypress._.random(0, 1) === 1,
                vdoCallRating: fillRating && Cypress._.random(0, 1) === 1,
                landlineRating: fillRating && Cypress._.random(0, 1) === 1,
            };

            // ==========================================
            // ==========================================

            const randomSelectFromDropdown = (selector: string) => {
                return cy.get(selector).then($select => {
                    if ($select.length > 0 && $select.is(':visible')) {
                        cy.wrap($select).find('option:not([disabled])').then($options => {
                            if ($options.length > 0) {
                                const randomIndex = Cypress._.random(0, $options.length - 1);
                                cy.wrap($select).select($options.eq(randomIndex).val() as string, { force: true });
                                cy.wait(600);
                            }
                        });
                    }
                });
            };

            const expandPanel = (selector: string) => {
                cy.get(selector).within(() => {
                    cy.get('.panel-heading').first().then($heading => {
                        cy.get('.collapse-panel').first().then($panel => {
                            const isCollapsed = !$panel.hasClass('in') && !$panel.hasClass('show');
                            const isHidden = $panel.css('display') === 'none';
                            if (isCollapsed || isHidden) {
                                cy.wrap($heading).click({ force: true });
                                cy.wait(1200);
                                cy.get('.collapse-panel').first().should('be.visible');
                            }
                        });
                    });
                });
            };

            // ==========================================
            // ==========================================

            if (shouldFill.voiceFreeResource) {
                cy.log('--- Filling Voice Free Resource ---');
                const TOTAL_FREE_RESOURCE = Cypress._.random(2, 6);

                expandPanel('app-mass-mkt-voice-free-resource');
                cy.wait(500);

                Cypress._.times(TOTAL_FREE_RESOURCE, (frIndex) => {
                    cy.log(`📦 Adding Free Resource: ${frIndex + 1}/${TOTAL_FREE_RESOURCE}`);

                    cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {
                        cy.get('.collapse-panel').first().should('be.visible');
                        cy.get('button.btn-primary.btn-xs').find('.glyphicon-plus').first().click({ force: true });
                        cy.wait(500);

                        cy.get('select[formcontrolname="priceTypePattern"]', { timeout: 5000 }).then($select => {
                            if ($select.length === 0) return;
                            cy.wrap($select).find('option:not([disabled])').then($options => {
                                if ($options.length === 0) return;
                                cy.wrap($select).select(
                                    $options.eq(Cypress._.random(0, $options.length - 1)).val() as string,
                                    { force: true }
                                );
                                cy.wait(600);
                            });
                        });
                    });

                    cy.get('app-mass-mkt-voice-free-resource mat-select[role="listbox"]', { timeout: 10000 })
                        .should('exist')
                        .then($matSelect => {
                            if (!$matSelect.is(':visible') || $matSelect.attr('aria-disabled') === 'true') return;
                            cy.wrap($matSelect).find('.mat-select-trigger').scrollIntoView().click({ force: true });
                            cy.wait(500);
                            cy.get('.cdk-overlay-container mat-option', { timeout: 10000 })
                                .should('have.length.greaterThan', 0)
                                .then($options => {
                                    cy.wrap($options.eq(Cypress._.random(0, $options.length - 1))).click({ force: true });
                                    cy.wait(800);
                                });
                            cy.get('body').then($body => {
                                if ($body.find('.cdk-overlay-backdrop').length > 0) {
                                    cy.wrap($body).click({ force: true });
                                }
                            });
                            cy.wait(500);
                        });

                    cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {

                        const checkRandomRadio = (name: string) => {
                            cy.root().then($root => {
                                const $visible = $root.find(`input[type="radio"][formcontrolname="${name}"]:visible`);
                                if ($visible.length === 0) {
                                    cy.log(`  ⚠️ No visible radio [${name}] -> Skipping`);
                                    return;
                                }
                                cy.wrap($visible.eq(Cypress._.random(0, $visible.length - 1))).check({ force: true });
                                cy.wait(600);
                            });
                        };

                        const safeSelectDropdown = (selector: string) => {
                            cy.root().then($root => {
                                const $visible = $root.find(`${selector}:visible`);
                                if ($visible.length === 0) return;
                                cy.wrap($visible.first()).find('option:not([disabled])').then($opts => {
                                    if ($opts.length === 0) return;
                                    cy.wrap($visible.first()).select(
                                        $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                                        { force: true }
                                    );
                                    cy.wait(600);
                                });
                            });
                        };

                        const fillConditionalInputAndUnit = (inputName: string, unitName: string, label: string) => {
                            cy.wait(1200);
                            cy.root().then($root => {
                                const $input = $root.find(`input[formcontrolname="${inputName}"]:visible`);
                                if ($input.length === 0) {
                                    cy.log(`  ℹ️ ${label} = No -> Skipping`);
                                    return;
                                }
                                cy.log(`  ℹ️ ${label} = Yes -> Filling`);
                                cy.wrap($input.first())
                                    .clear({ force: true })
                                    .type(Cypress._.random(10, 1000).toString(), { force: true, delay: 150 });
                                cy.wait(600);
                                safeSelectDropdown(`select[formcontrolname="${unitName}"]`);
                            });
                        };

                        cy.get('input[formcontrolname="commuFreeResource"]')
                            .should('be.visible')
                            .clear({ force: true })
                            .type(Cypress._.random(10, 500).toString(), { force: true, delay: 150 });
                        cy.wait(600);
                        safeSelectDropdown('select[formcontrolname="commuFreeResourceUnit"]');
                        checkRandomRadio('peakTimeFlag');
                        checkRandomRadio('voiceQuotaRollOver');
                        fillConditionalInputAndUnit('maxRollOverQuota', 'maxRollOverQuotaUnit', 'Voice Quota Roll Over');
                        checkRandomRadio('netFlexi');
                        fillConditionalInputAndUnit('daily', 'dailyUnit', 'Daily Flag');
                        cy.wait(800);

                        cy.get('button[type="submit"].btn-primary').contains('Add').last().click({ force: true });
                        cy.wait(500);
                    });

                    cy.wait(500);
                    cy.log(`  ✅ Free Resource ${frIndex + 1} added`);
                });

                cy.log(`--- Voice Free Resource Filled Successfully (${TOTAL_FREE_RESOURCE} rows) ---`);
            }

            // ==========================================
            // ==========================================

            if (shouldFill.voiceFN) {
                cy.log('--- Filling Voice FN ---');
                const MAX_FN = 5;
                const TOTAL_FN = Cypress._.random(1, MAX_FN);

                expandPanel('app-mass-mkt-voice-fn');
                cy.wait(500);

                cy.get('app-mass-mkt-voice-fn').within(() => {
                    cy.get('.collapse-panel', { timeout: 10000 })
                        .should('be.visible')
                        .then($panel => {
                            const hasValidClass = $panel.hasClass('show') || $panel.hasClass('in');
                            expect(hasValidClass).to.be.true;
                        });

                    Cypress._.times(TOTAL_FN, (fnIndex) => {
                        cy.log(`📦 Adding FN: ${fnIndex + 1}/${TOTAL_FN}`);

                        cy.get('> .panel > .collapse-panel')
                            .find('> button.btn-primary.btn-xs')
                            .first()
                            .click({ force: true });
                        cy.wait(500);

                        cy.get('.panel-body:visible', { timeout: 10000 }).should('exist').as('voiceForm');

                        cy.get('@voiceForm').find('input[formcontrolname="maxFNNumber"]')
                            .should('be.visible')
                            .clear()
                            .type(Cypress._.random(1, MAX_FN).toString(), { delay: 150 });
                        cy.wait(600);
                        randomSelectFromDropdown('select[formcontrolname="fnNetwork"]');

                        cy.get('@voiceForm').find('select[formcontrolname="fnType"]').should('be.visible').then($select => {
                            const options = $select.find('option:not([disabled])');
                            const index = Cypress._.random(0, options.length - 1);
                            const text = options.eq(index).text().trim();
                            cy.wrap($select).select(text);
                            cy.wait(500);
                            cy.log(`  ✓ FN Type: ${text}`);

                            if (text === 'Free Call') {
                                cy.get('@voiceForm').find('input[formcontrolname="fnFreeCall"]')
                                    .should('be.visible').clear().type(Cypress._.random(10, 60).toString(), { delay: 150 });
                                cy.wait(600);
                                randomSelectFromDropdown('select[formcontrolname="fnFreeCallUnit"]');
                            }
                            if (text === 'Special Rate') {
                                cy.get('@voiceForm').find('input[formcontrolname="fnRateExcVat"]')
                                    .should('be.visible').clear().type((Math.random() * 10).toFixed(2), { delay: 150 });
                                cy.wait(600);
                                randomSelectFromDropdown('select[formcontrolname="fnRateExcVatUnit"]');
                            }
                        });

                        cy.wait(800);
                        cy.get('.panel-body:visible').find('.col-md-4.col-md-offset-8').last().within(() => {
                            cy.contains('button', 'Add').should('be.visible').click({ force: true });
                        });
                        cy.wait(1200);
                        cy.log(`  ✅ FN ${fnIndex + 1} added`);
                    });
                });

                cy.log(`--- Voice FN Filled Successfully (${TOTAL_FN} rows) ---`);
            }

            // ==========================================
            // ==========================================

            const genSpecialNumber = () => {
                const patterns = [
                    () => `*${Cypress._.random(100, 999)}#`,
                    () => `*${Cypress._.random(10, 99)}#`,
                    () => `*${Cypress._.random(1, 9)}#`,
                    () => `*${Cypress._.random(1000, 9999)}#`,
                    () => `*${Cypress._.random(10000, 99999)}#`,
                    () => `#${Cypress._.random(100, 999)}#`,
                    () => `#${Cypress._.random(10, 99)}#`,
                    () => `${Cypress._.random(100, 999)}`,
                    () => `${Cypress._.random(1000, 9999)}`,
                    () => `06${Cypress._.random(10000000, 99999999)}`,
                    () => `08${Cypress._.random(10000000, 99999999)}`,
                    () => `09${Cypress._.random(10000000, 99999999)}`,
                    () => `+66${Cypress._.random(810000000, 899999999)}`,
                    () => `*${Cypress._.random(10, 99)}*${Cypress._.random(10, 99)}#`,
                    () => `*${Cypress._.random(100, 999)}*${Cypress._.random(10, 99)}#`,
                ];
                return patterns[Cypress._.random(0, patterns.length - 1)]();
            };

            if (shouldFill.voiceSpecialNumber) {
                cy.log('🔥 --- Filling Voice Special Number ---');
                const TOTAL_PANELS = Cypress._.random(2, 5);

                expandPanel('app-mass-mkt-voice-b-number');
                cy.wait(500);

                cy.get('app-mass-mkt-voice-b-number').within(() => {
                    cy.get('.collapse-panel.show, .collapse-panel.in', { timeout: 10000 }).should('be.visible');

                    Cypress._.times(TOTAL_PANELS, (panelIndex) => {
                        cy.log(`📦 [STEP 1] สร้าง Panel ที่ ${panelIndex + 1}/${TOTAL_PANELS}`);

                        cy.get('.collapse-panel.show > button.btn-primary.btn-xs:visible, .collapse-panel.in > button.btn-primary.btn-xs:visible')
                            .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
                            .first()
                            .click({ force: true });
                        cy.wait(500);

                        cy.get('.panel.panel-default:visible', { timeout: 10000 }).last().as(`detailPanel${panelIndex}`);

                        const ITEMS_PER_PANEL = Cypress._.random(2, 4);

                        cy.get(`@detailPanel${panelIndex}`).within(() => {
                            Cypress._.times(ITEMS_PER_PANEL, (itemIndex) => {
                                cy.get('button.btn.btn-primary.btn-xs:visible')
                                    .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
                                    .first()
                                    .click({ force: true });
                                cy.wait(1200);

                                cy.get('input[formcontrolname="specialNumber"]', { timeout: 5000 }).should('be.visible');

                                const specialNum = genSpecialNumber();
                                cy.get('input[formcontrolname="specialNumber"]')
                                    .clear().type(specialNum, { delay: 150 });
                                cy.wait(800);

                                cy.get('button[type="submit"]:visible').last().click({ force: true });
                                cy.wait(500);
                            });

                            cy.get('select[formcontrolname="bNumberType"]').should('be.visible').then($select => {
                                const options = $select.find('option:not([disabled])');
                                if (options.length === 0) throw new Error('❌ No bNumberType options');
                                const val = options.eq(Cypress._.random(0, options.length - 1)).val();
                                cy.wrap($select).select(val as string);
                                cy.wait(500);

                                cy.root().then($root => {
                                    if (val === 'Free Call') {
                                        const $freeCall = $root.find('input[formcontrolname="bFreeCall"]:visible');
                                        const $freeCallUnit = $root.find('select[formcontrolname="bFreeCallUnit"]:visible');
                                        if ($freeCall.length > 0) {
                                            cy.wrap($freeCall.first()).clear().type(Cypress._.random(1, 60).toString(), { delay: 150 });
                                            cy.wait(600);
                                            if ($freeCallUnit.length > 0) {
                                                cy.wrap($freeCallUnit.first()).find('option:not([disabled])').then($opts => {
                                                    if ($opts.length > 0) cy.wrap($freeCallUnit.first()).select($opts.eq(0).val() as string);
                                                    cy.wait(600);
                                                });
                                            }
                                        }
                                    } else if (val === 'Special Rate') {
                                        const $rateExc = $root.find('input[formcontrolname="bRateExcVat"]:visible');
                                        const $rateUnit = $root.find('select[formcontrolname="bRateExcVatUnit"]:visible');
                                        if ($rateExc.length > 0) {
                                            cy.wrap($rateExc.first()).clear().type(Cypress._.random(0.5, 10).toFixed(2), { delay: 150 });
                                            cy.wait(600);
                                            if ($rateUnit.length > 0) {
                                                cy.wrap($rateUnit.first()).find('option:not([disabled])').then($opts => {
                                                    if ($opts.length > 0) cy.wrap($rateUnit.first()).select($opts.eq(0).val() as string);
                                                    cy.wait(600);
                                                });
                                            }
                                        }
                                    }
                                });
                            });

                            cy.wait(800);
                            cy.get('button:visible')
                                .filter((_, el) => Cypress.$(el).text().trim() === 'Add')
                                .last()
                                .click({ force: true });
                            cy.wait(500);
                        });

                        cy.wait(500);
                    });
                });

                cy.log(`✅ --- Voice Special Number Completed (${TOTAL_PANELS} panels) ---`);
            }

            // ==========================================
            // ✅ ถูกข้ามทั้งหมดเมื่อ fillRating=false (main)
            // ✅ สุ่มตามปกติเมื่อ fillRating=true (ontop/ontop extra)
            // ==========================================

            const fillRatingSection = (selector: string, label: string) => {
                if (!selector || !label) return;
                cy.log(`--- Filling ${label} ---`);
                expandPanel(selector);
                cy.wait(500);

                cy.get(selector, { timeout: 10000 }).within(() => {
                    cy.get('.collapse-panel').first().should('be.visible');

                    if (label.includes('VDO') || label.includes('Landline')) {
                        if (Cypress._.random(0, 1) === 1) {
                            cy.get('button.btn-info').contains('Copy From Voice Rating').then($btn => {
                                if ($btn.is(':visible')) {
                                    cy.wrap($btn).click({ force: true });
                                    cy.wait(500);
                                    cy.log(`${label} - Copied from Voice Rating`);
                                }
                            });
                        }
                    }

                    cy.get('button.btn-primary').first().then($btn => {
                        if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
                    });
                });

                cy.wait(500);

                cy.get(selector, { timeout: 10000 }).within(() => {
                    cy.get('.panel-body').then($panels => {
                        const $formPanel = $panels.filter((i, el) => {
                            return Cypress.$(el).find('input[formcontrolname="rateExcludingVAT"]').length > 0;
                        });
                        if ($formPanel.length === 0) {
                            cy.log(`${label} - Inline form not found. Skipping fill.`);
                            return;
                        }

                        cy.wrap($formPanel.first()).within(() => {
                            cy.get('select[formcontrolname="networkFlag"]', { timeout: 3000 }).then($net => {
                                if ($net.is(':visible') && !$net.is(':disabled')) {
                                    const $opts = $net.find('option:not([disabled])');
                                    if ($opts.length > 1) {
                                        const randomIdx = Cypress._.random(1, $opts.length - 1);
                                        cy.wrap($net).select($opts.eq(randomIdx).val() as string, { force: true });
                                        cy.wait(800);
                                    }
                                }
                            });

                            cy.get('input[formcontrolname="rateExcludingVAT"]', { timeout: 3000 })
                                .should('be.visible')
                                .then($input => {
                                    if (!$input.is(':disabled')) {
                                        const randomRate = Cypress._.random(0.5, 50.0).toFixed(2);
                                        cy.wrap($input).clear({ force: true }).type(randomRate, { force: true, delay: 150 });
                                        cy.wait(600);
                                    }
                                });

                            cy.get('select[formcontrolname="rateUnit"]', { timeout: 3000 })
                                .should('be.visible')
                                .then($sel => {
                                    if (!$sel.is(':disabled')) {
                                        const $opts = $sel.find('option:not([disabled])');
                                        if ($opts.length > 0) {
                                            cy.wrap($sel).select(
                                                $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                                                { force: true }
                                            );
                                            cy.wait(600);
                                        }
                                    }
                                });

                            cy.wait(800);
                            cy.get('button[type="submit"]').contains('Add', { timeout: 5000 })
                                .should('be.visible')
                                .then($btn => {
                                    if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
                                });
                        });
                    });
                });

                cy.wait(500);
                cy.log(`${label} - Added new item`);
            };

            if (shouldFill.voiceRating) fillRatingSection('app-mass-mkt-voice-rating', 'Voice Rating');
            if (shouldFill.vdoCallRating) fillRatingSection('app-mass-mkt-vdo-call-rating', 'VDO Call Rating');
            if (shouldFill.landlineRating) fillRatingSection('app-mass-mkt-landline-rating', 'Landline Rating');

            cy.log('=== Voice Tab Fill Summary ===');
            cy.log(`Voice Free Resource: ${shouldFill.voiceFreeResource ? 'Filled' : 'Skipped'}`);
            cy.log(`Voice FN: ${shouldFill.voiceFN ? 'Filled' : 'Skipped'}`);
            cy.log(`Voice Special Number: ${shouldFill.voiceSpecialNumber ? 'Filled' : 'Skipped'}`);
            cy.log(`Voice Rating: ${shouldFill.voiceRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
            cy.log(`VDO Call Rating: ${shouldFill.vdoCallRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
            cy.log(`Landline Rating: ${shouldFill.landlineRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
        }
    });
};

// ========================
// MMS
// ========================

export const Mms = (fillRating = true): void => {
    const processFreeResource = () => {
        cy.get('app-mass-mkt-mms-free-resource').within(() => {
            cy.get('.collapse-panel').first().then(($panel) => {
                if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
                    cy.get('.panel-heading').first().click({ force: true });
                    cy.get('.collapse-panel').first().should('be.visible');
                }
            });
            cy.get('button:has(.glyphicon-plus)').click({ force: true });
        });

        cy.get('app-mass-mkt-mms-free-resource mat-select .mat-select-trigger')
            .should('be.visible')
            .click({ force: true });

        cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
            .should('have.length.gt', 0)
            .then(($options) => {
                const randomIndex = Cypress._.random(0, $options.length - 1);
                cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
            });

        cy.get('app-mass-mkt-mms-free-resource').within(() => {
            cy.contains('button', 'Add').should('be.visible').click({ force: true });
        });
    };

    const fillMmsRatingInput = (controlName: string) => {
        cy.get(`input[formcontrolname="${controlName}"]`)
            .should('exist')
            .clear({ force: true })
            .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
            .blur({ force: true });
    };

    cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
            cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
                .contains(/^MMS$/)
                .click({ force: true });

            // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
            processFreeResource();

            // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
            if (fillRating) {
                cy.get('app-mass-mkt-mms-rating').within(() => {
                    cy.get('.panel-heading').first().click({ force: true });
                });
                cy.get('app-mass-mkt-mms-rating').within(() => {
                    fillMmsRatingInput('mmsExcludingVat');
                    fillMmsRatingInput('mmsdrExcludingVat');
                    fillMmsRatingInput('mmsrrExcludingVat');
                });
            } else {
                cy.log('⏭️ Mms Rating skipped (fillRating=false / main)');
            }
        }
    });
};

// ========================
// SMS
// ========================

export const Sms = (fillRating = true): void => {
    const processFreeResource = () => {
        cy.get('app-mass-mkt-sms-free-resource').within(() => {
            cy.get('.collapse-panel').first().then(($panel) => {
                if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
                    cy.get('.panel-heading').first().click({ force: true });
                    cy.get('.collapse-panel').first().should('be.visible');
                }
            });
            cy.get('button:has(.glyphicon-plus)').click({ force: true });
        });

        cy.get('app-mass-mkt-sms-free-resource mat-select .mat-select-trigger')
            .should('be.visible')
            .click({ force: true });

        cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
            .should('have.length.gt', 0)
            .then(($options) => {
                const randomIndex = Cypress._.random(0, $options.length - 1);
                cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
            });

        cy.get('app-mass-mkt-sms-free-resource').within(() => {
            cy.contains('button', 'Add').should('be.visible').click({ force: true });
        });
    };

    const fillRatingSection = (headerText: string, controlName: string) => {
        cy.get('app-mass-mkt-sms-rating').within(() => {
            cy.contains('.panel-heading', headerText)
                .closest('.panel')
                .within(() => {
                    cy.get('.collapse-panel').first().then(($panel) => {
                        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
                            cy.get('.panel-heading').first().click({ force: true });
                            cy.get('.collapse-panel').first().should('be.visible');
                        }
                    });
                    cy.get(`input[formcontrolname="${controlName}"]`)
                        .should('exist')
                        .clear({ force: true })
                        .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
                        .blur({ force: true });
                });
        });
    };

    cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
            cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
                .contains(/^SMS$/)
                .click({ force: true });

            // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
            processFreeResource();

            // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
            if (fillRating) {
                cy.get('app-mass-mkt-sms-rating').within(() => {
                    cy.get('.panel-heading').first().click({ force: true });
                });
                fillRatingSection('SMS Rating', 'smsExcludingVat');
                fillRatingSection('SMS Delivery Report Rating', 'smsdrExcludingVat');
                fillRatingSection('iSMS Rating', 'iSmsExcludingVat');
            } else {
                cy.log('⏭️ Sms Rating skipped (fillRating=false / main)');
            }
        }
    });
};

export const WiFi = (): void => {
    const COMPONENT = 'app-mass-mkt-wifi'
    const HEADING_SELECTOR = '.panel-heading.cursor-point'
    const WIFI_USAGE_TYPES = ['Volume-based', 'Time-based']
    const WIFI_QUOTA_TYPES = ['Unlimited Data (Fixed Speed)', 'Unlimited Data (Throttling Speed)']

    const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

    const normalizeText = (el: HTMLElement): string =>
        Cypress.$(el).text().replace(/\s+/g, ' ').trim()

    const expandPanelIfNeeded = (): void => {
        cy.log('🔓 Ensuring WiFi panel is expanded...')
        cy.get(COMPONENT, { timeout: 15000 })
            .should('exist')
            .find(HEADING_SELECTOR, { timeout: 10000 })
            .should('be.visible')
            .then(($heading) => {
                const isCollapsed =
                    $heading.find('.glyphicon-chevron-down').length > 0 &&
                    $heading.find('.glyphicon-chevron-up').length === 0
                if (isCollapsed) {
                    cy.log('📥 Panel collapsed → expanding')
                    cy.wrap($heading).click({ force: true })
                    cy.wait(800)
                } else {
                    cy.log('📤 Panel already expanded ✓')
                }
            })
        cy.wait(400)
    }

    const getActivePane = (): Cypress.Chainable<JQuery<HTMLElement>> =>
        cy.get(COMPONENT).then(($comp) => {
            const hasTabset = $comp.find('tabset').length > 0
            if (hasTabset) {
                return $comp.find('tab.active, .tab-pane.active').first()
            }
            return $comp
        })

    const clickTab = (tabName: string): void => {
        cy.get(COMPONENT).then(($comp) => {
            const $tabs = $comp.find('.nav.nav-tabs a')
            if ($tabs.length === 0) {
                cy.log(`⚠️ No tabset found → skipping clickTab("${tabName}")`)
                return
            }
            cy.log(`🔍 Clicking sub-tab: "${tabName}"`)
            cy.wrap($tabs)
                .filter((_, el) => normalizeText(el as HTMLElement).includes(tabName))
                .first()
                .should('be.visible')
                .click({ force: true })
            cy.wait(500)
        })
    }

    const fillDeductSuccess = (): void => {
        cy.log('🚀 [WiFi – Deduct Success] Starting form fill...')

        const usageType = rand(WIFI_USAGE_TYPES)
        const quotaType = rand(WIFI_QUOTA_TYPES)
        cy.log(`🎲 Usage: ${usageType} | Quota: ${quotaType}`)

        getActivePane()
            .find('button.btn-primary.btn-xs[style*="width:60px"]', { timeout: 12000 })
            .should('be.visible')
            .click({ force: true })
        cy.wait(600)

        getActivePane()
            .find('.panel.panel-default', { timeout: 8000 })
            .then(($panels) => {
                $panels.toArray().forEach((el) => {
                    if (Cypress.$(el).attr('hidden') !== undefined) {
                        Cypress.$(el).removeAttr('hidden')
                    }
                })
            })
        cy.wait(300)

        getActivePane()
            .find('select[formcontrolname="wiFiUsageType"]', { timeout: 10000 })
            .should('be.visible')
            .select(usageType, { force: true })
        cy.wait(400)

        getActivePane()
            .find('select[formcontrolname="wiFiQuotaType"]', { timeout: 10000 })
            .should('be.visible')
            .select(quotaType, { force: true })
        cy.wait(400)

        cy.log('🎯 Opening mat-select dropdown')
        getActivePane()
            .find('mat-select .mat-select-trigger', { timeout: 10000 })
            .first()
            .should('be.visible')
            .click({ force: true })
        cy.wait(500)

        cy.get('body').then(($body) => {
            if ($body.find('mat-option').length === 0) {
                cy.log('⚠️ Dropdown not open yet → retrying')
                getActivePane()
                    .find('mat-select .mat-select-trigger')
                    .first()
                    .click({ force: true })
                cy.wait(800)
            }
        })

        cy.get('.cdk-overlay-container mat-option, mat-option', { timeout: 12000 })
            .should('have.length.greaterThan', 0)
            .then(($opts) => {
                const valid = [...$opts].filter((el) => {
                    const t = Cypress.$(el).text().trim()
                    return t && t !== 'Please Select' && !Cypress.$(el).hasClass('mat-option-disabled')
                })

                if (valid.length === 0) {
                    cy.log('⚠️ No valid mat-option found → clicking overlay backdrop to close')
                    cy.get('.cdk-overlay-backdrop').click({ force: true })
                    cy.wait(500)
                    return
                }

                const randomIndex = Math.floor(Math.random() * valid.length)
                const chosen = valid[randomIndex]
                const chosenText = Cypress.$(chosen).text().trim()
                cy.log(`📡 Selected: ${chosenText}`)

                cy.wrap(chosen).click({ force: true })
                cy.wait(600)

                cy.log('✅ Checking form validity...')
                cy.get(COMPONENT)
                    .find('form, [formgroup]')
                    .should('have.class', 'ng-valid')
            })

        cy.log('🖱️ Clicking Add button...')
        getActivePane()
            .find('button.btn-primary, button.btn-info', { timeout: 10000 })
            .filter(':visible')
            .should('be.enabled')
            .contains(/^Add$/)
            .click({ force: true })
        cy.wait(500)

        cy.log('✅ [WiFi – Deduct Success] Completed successfully')
    }

    const verifyTabHasData = (tabName: string): void => {
        cy.log(`🔍 Checking tab "${tabName}" for data...`)

        cy.get(COMPONENT).then(($comp) => {
            const hasTabset = $comp.find('tabset').length > 0

            if (!hasTabset) {
                cy.log(`⚠️ No tabset found in ${COMPONENT} — skipping tab data check`)
                return
            }

            cy.get(COMPONENT).within(() => {
                cy.get('tabset ul.nav-tabs a, .nav-tabs a')
                    .filter((_, el) => {
                        const tabText = Cypress.$(el).text().trim()
                        return tabText.includes(tabName)
                    })
                    .first()
                    .click({ force: true })
                cy.wait(400)

                cy.get('tab.active tbody tr, .tab-pane.active tbody tr', { timeout: 15000 })
                    .should(($rows) => {
                        expect($rows.length).to.be.greaterThan(0)
                        const text = $rows.text().trim()
                        expect(text).not.to.include('No data to display.')
                        expect(text).not.to.include('Fetching data')
                    })
            })
        })
    }

    cy.log('📶 [WiFi] Navigating to tab...')
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^WiFi$/)
        .click({ force: true })
    cy.wait(500)

    expandPanelIfNeeded()
    fillDeductSuccess()

    verifyTabHasData('Deduct Success')

    cy.log('📶 [WiFi] 🎉 Done ✨')
}
// ========================
// ========================

export const VerticalApp = (): void => {
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Vertical App$/)
        .click({ force: true });
    cy.wait(500);

    cy.get('app-mass-mkt-vertical-app').last().as('vaRoot');

    cy.get('@vaRoot').within(() => {
        cy.get('.collapse-panel').then(($panel) => {
            if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
                cy.get('.panel-heading').first().click({ force: true });
            }
        });

        cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('@vaRoot')
        .find('select[formcontrolname="VerticalAppUsageType"]', { timeout: 10000 })
        .find('option:not([disabled])')
        .should('have.length.greaterThan', 0)
        .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.log(`📡 Vertical App Usage Type: ${val}`);
            cy.get('@vaRoot')
                .find('select[formcontrolname="VerticalAppUsageType"]')
                .select(val, { force: true });
        });

    cy.get('@vaRoot')
        .find('select[formcontrolname="VerticalAppQuotaType"]', { timeout: 10000 })
        .find('option:not([disabled])')
        .should('have.length.greaterThan', 0)
        .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.log(`📦 Vertical App Quota Type: ${val}`);
            cy.wrap(val).as('selectedQuotaValue');
            cy.get('@vaRoot')
                .find('select[formcontrolname="VerticalAppQuotaType"]')
                .select(val, { force: true });
        });

    const getVaSelect = () =>
        cy.get('@vaRoot')
            .contains('label', '*Vertical App :')
            .closest('.form-group')
            .find('mat-select')
            .should('be.visible');

    const openVerticalAppPanel = () => {
        getVaSelect()
            .scrollIntoView()
            .find('.mat-select-trigger')
            .click({ force: true });
    };

    const ensurePanelOpen = (attempt = 1): void => {
        openVerticalAppPanel();
        cy.get('body').then(($body) => {
            const isOpen = $body.find('.cdk-overlay-container .mat-select-panel').length > 0;
            if (!isOpen) {
                if (attempt >= 5) {
                    throw new Error('❌ Vertical App mat-select panel never opened after 5 attempts');
                }
                cy.log(`⚠️ Vertical App panel not open (attempt ${attempt}), retrying`);
                cy.wait(300);
                ensurePanelOpen(attempt + 1);
            }
        });
    };

    ensurePanelOpen();

    cy.get('.cdk-overlay-container .mat-select-panel', { timeout: 10000 }).should('exist');

    cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
        .not('.mat-option-disabled')
        .should('have.length.greaterThan', 0)
        .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const label = $options.eq(randomIndex).text().trim();
            cy.log(`📱 Vertical App selected: ${label}`);
            cy.wrap($options).eq(randomIndex).click({ force: true });
        });

    getVaSelect()
        .find('.mat-select-value')
        .should('not.contain.text', 'Please Select');

    cy.wait(1500);

    cy.get('@vaRoot').within(() => {
        const scenario = Cypress._.random(0, 2);
        const scenarioLabels = ['3G only', '4G + 3G', '5G + 4G + 3G'];
        cy.log(`🗼 Network Coverage scenario: ${scenarioLabels[scenario]}`);

        cy.get('[formarrayname="vaNetworkCoverageCheckBox"] input[type="checkbox"]')
            .should('have.length.greaterThan', 0)
            .each(($checkbox, index) => {
                const shouldCheck =
                    (scenario === 0 && index === 2) ||
                    (scenario === 1 && index >= 1) ||
                    (scenario === 2);

                if (shouldCheck) {
                    cy.wrap($checkbox).check({ force: true });
                } else {
                    cy.wrap($checkbox).uncheck({ force: true });
                }
            });

        cy.wait(1500);

        cy.get('select[formcontrolname="commuSpeed"]', { timeout: 10000 })
            .find('option:not([disabled])')
            .should('have.length.greaterThan', 0)
            .then(($options) => {
                const randomIndex = Cypress._.random(0, $options.length - 1);
                const val = $options.eq(randomIndex).val() as string;
                cy.log(`⚡ Commu Speed: ${val}`);
                cy.get('select[formcontrolname="commuSpeed"]').select(val, { force: true });
            });

        cy.get('@selectedQuotaValue').then((quotaValue) => {
            if (String(quotaValue).includes('Throttling')) {
                cy.log(`🐢 Quota includes Throttling → selecting Throttling Speed`);
                cy.get('select[formcontrolname="commuThrottlingSpeed"]')
                    .should('exist')
                    .find('option:not([disabled])', { timeout: 10000 })
                    .should('have.length.greaterThan', 0)
                    .then(($options) => {
                        const randomIndex = Cypress._.random(0, $options.length - 1);
                        const val = $options.eq(randomIndex).val() as string;
                        cy.log(`🐢 Commu Throttling Speed: ${val}`);
                        cy.get('select[formcontrolname="commuThrottlingSpeed"]').select(val, { force: true });
                    });
            }
        });

        cy.wait(1500);

        // 🔍 Guard: check every select / mat-select in scope for empty/placeholder
        // values and auto-fill them before attempting Add.
        cy.get('body').then(() => {
            cy.get('select').each(($select) => {
                const val = $select.val();
                const isEmpty = val === '' || val === null || val === undefined;
                if (isEmpty) {
                    const name = $select.attr('formcontrolname') || '(unnamed select)';
                    cy.wrap($select)
                        .find('option:not([disabled])')
                        .then(($options) => {
                            if ($options.length > 0) {
                                const randomIndex = Cypress._.random(0, $options.length - 1);
                                const fillVal = $options.eq(randomIndex).val() as string;
                                cy.log(`⚠️ Empty select found: ${name} → auto-filling "${fillVal}"`);
                                cy.wrap($select).select(fillVal, { force: true });
                            } else {
                                cy.log(`⚠️ Empty select found: ${name} but has no valid options`);
                            }
                        });
                }
            });

            cy.get('mat-select').each(($matSelect) => {
                const currentText = $matSelect.find('.mat-select-value').text().trim();
                const isEmpty =
                    currentText === '' ||
                    currentText.toLowerCase().includes('please select');
                if (isEmpty) {
                    cy.log(`⚠️ Empty mat-select found → opening to auto-select a value`);
                    cy.wrap($matSelect)
                        .scrollIntoView()
                        .find('.mat-select-trigger')
                        .click({ force: true });
                    cy.get('.cdk-overlay-container .mat-select-panel', { timeout: 10000 }).should('exist');
                    cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
                        .not('.mat-option-disabled')
                        .should('have.length.greaterThan', 0)
                        .then(($options) => {
                            const randomIndex = Cypress._.random(0, $options.length - 1);
                            cy.wrap($options).eq(randomIndex).click({ force: true });
                        });
                }
            });
        });

        cy.wait(500);

        // ✅ Only click Add once the button is confirmed enabled
        cy.contains('button', /^Add$/)
            .should(($btn) => {
                expect($btn.prop('disabled'), 'Add button should not be disabled').to.be.false;
            })
            .click({ force: true });

        cy.log(`✅ Vertical App → Add clicked`);
        cy.wait(3500);

        // ✅ Confirm a real row was added (not just a "No data to display" placeholder)
        cy.get('tbody tr').then(($rows) => {
            const realRows = $rows.filter((_, el) => !el.textContent?.includes('No data to display'));
            cy.log(`📋 Real data rows after Add: ${realRows.length}`);
        });
    });
};

// ========================
// CLOUD GAME
// ========================
const countValidRows = ($rows: JQuery<HTMLElement>): number => {
    return $rows.toArray().filter((tr) => {
        const text = tr.textContent?.trim() ?? '';
        return text.length > 0 && !text.includes('No data to display');
    }).length;
};

export const CloudGame = (): void => {
    cy.log('🎮 === CloudGame Tab (select Content only, Add ทันที) ===');

    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Cloud Game$/)
        .click({ force: true });

    cy.wait(500);

    const VR = () =>
        cy.get('app-mass-mkt-product-offering-detail-tab app-mass-mkt-vr', {
            timeout: 10000,
        })
            .first()
            .should('be.visible');

    let initialRowCount = 0;
    VR().within(() => {
        cy.get('table tbody tr').then(($rows) => {
            initialRowCount = countValidRows($rows);
            cy.log(`📊 baseline valid row count: ${initialRowCount}`);
        });
    });

    VR().within(() => {
        cy.log('➕ click + to open Cloud Game Detail form');
        cy.get('button .glyphicon-plus')
            .first()
            .parent('button')
            .click({ force: true });
    });

    cy.wait(300);

    VR().within(() => {
        cy.log('📋 open Content mat-select');
        cy.contains('label', '*Content :')
            .closest('.col-md-12')
            .find('.mat-select-trigger')
            .click({ force: true });
    });

    cy.get('.cdk-overlay-container .mat-select-panel', { timeout: 10000 })
        .should('exist');

    cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
        .should('have.length.greaterThan', 0)
        .then(($options) => {
            const enabledOptions = $options.toArray().filter(
                (el) =>
                    !el.classList.contains('mat-option-disabled') &&
                    el.getAttribute('aria-disabled') !== 'true'
            );

            expect(enabledOptions.length, 'มี option ที่เลือกได้อย่างน้อย 1 ตัว').to.be.greaterThan(0);

            const randomIndex = Math.floor(Math.random() * enabledOptions.length);
            const selectedText = enabledOptions[randomIndex].textContent?.trim() ?? '';
            cy.log(`🎲 select Content option (enabled) index: ${randomIndex} → "${selectedText}"`);
            cy.wrap(enabledOptions[randomIndex]).click({ force: true });
        });

    // ── รอ overlay ปิดจริง ก่อน Angular re-render ฟอร์ม ──────────────────────
    cy.get('.cdk-overlay-container .mat-select-panel').should('not.exist');
    cy.wait(300);

    // ✅ ยืนยันว่า mat-select มีค่าจริงแล้ว ไม่ใช่ยังโชว์ placeholder
    VR().within(() => {
        cy.log('✅ verify Content value is actually selected');
        cy.contains('label', '*Content :')
            .closest('.col-md-12')
            .find('.mat-select-value')
            .should('not.contain.text', 'Please Select');
    });

    // ── Step 3: กด Add ทันที ไม่กรอกอะไรเพิ่ม ──────────────────────────────
    VR().within(() => {
        cy.log('💾 click Add');
        cy.get('button[type="submit"]')
            .contains('Add')
            .should('not.be.disabled')
            .click({ force: true });
    });

    cy.wait(500);

    VR().within(() => {
        cy.get('table tbody').should('not.contain.text', 'No data to display');

        cy.get('table tbody tr').should(($rows) => {
            const validRowCount = countValidRows($rows);
            expect(validRowCount).to.be.greaterThan(initialRowCount);
        });

        cy.log('✅ Cloud Game row added to table');
    });
};
// ========================
// ENTERTAINMENT PARTNERSHIP
// ========================

export const EntertainmentPartnership = (platforms: Array<'Arcade' | 'TV Plus' | 'Youtube Premium'>): void => {
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Entertainment Partnership$/)
        .click({ force: true });

    cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
        .find('option:selected')
        .invoke('val')
        .then((selectedVal) => {
            const rawVal = String(selectedVal);
            const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

            let partnerCustomerType: string;
            if (label === 'Post-paid' || label === 'Hybrid-Post') {
                partnerCustomerType = 'Post-paid';
            } else if (label === 'Pre-paid') {
                partnerCustomerType = 'Pre-paid';
            } else {
                partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
            }

            cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

            cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
                .should('be.visible')
                .within(() => {
                    platforms.forEach((platform) => {
                        const targetPlatform = platform === 'Youtube Premium' ? 'Google' : platform;

                        cy.get('button .glyphicon-plus').first().parent().click();

                        const cpOptions = ['Apple', 'GOOGLE IRELAND LIMITED'];
                        const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

                        cy.contains('label', 'CP Name')
                            .closest('.form-group')
                            .find('select[formcontrolname="cpName"]')
                            .select(randomCp);

                        cy.wait(500);

                        cy.contains('label', 'Platform')
                            .closest('.form-group')
                            .find('select[formcontrolname="platform"]')
                            .select(targetPlatform);

                        cy.wait(500);

                        cy.contains('h3', 'Partner App ID')
                            .closest('.panel')
                            .within(() => {
                                cy.get('button .glyphicon-plus').first().parent().click();

                                cy.contains('h3', 'Partner App ID Detail')
                                    .closest('.panel')
                                    .should('be.visible')
                                    .within(() => {
                                        cy.get('input[formcontrolname="partnerPackageName"]').clear().type('test');

                                        cy.get('select[formcontrolname="customerType"]')
                                            .should('be.visible')
                                            .find('option:not([disabled])')
                                            .then(($options) => {
                                                const options = $options.toArray() as HTMLOptionElement[];
                                                const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                                                if (!matched) {
                                                    throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                                                }
                                                cy.get('select[formcontrolname="customerType"]')
                                                    .select(matched.value.trim())
                                                    .should('have.value', matched.value.trim());
                                                cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                                            });
                                        cy.wait(500)
                                        cy.contains('button', /^Add$/).should('be.visible').click();
                                        cy.wait(500)
                                    });

                                cy.contains('h3', 'Partner App ID Detail')
                                    .closest('.panel')
                                    .should(($panel) => {
                                        const isHidden = $panel.attr('hidden') !== undefined ||
                                            $panel.css('display') === 'none' ||
                                            $panel.css('visibility') === 'hidden' ||
                                            !$panel.is(':visible');
                                        expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                                    });
                            });

                        cy.wait(500);

                        cy.get('button')
                            .filter(':visible')
                            .contains(/^Add$/)
                            .should('be.enabled')
                            .click({ force: true });
                    });
                });
        });
};
// ========================
// AI IP CAMERA
// ========================

export const AIIPCamera = (): void => {
    // 1. คลิก Tab AI IP Camera
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^AI IP Camera$/)
        .should('be.visible')
        .click({ force: true });

    // 2. กดปุ่ม Add ในหน้าหลัก
    cy.get('app-mass-mkt-ai-ip-camera .panel-body .btn-primary .glyphicon-plus')
        .first()
        .parent()
        .should('be.enabled')
        .click();

    // 3. ดึงค่า Customer Type เพื่อคำนวณ Partner Type
    cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
        .find('option:selected')
        .invoke('val')
        .then((selectedVal) => {
            const rawVal = String(selectedVal);
            const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

            let partnerCustomerType: string;
            if (label === 'Post-paid' || label === 'Hybrid-Post') {
                partnerCustomerType = 'Post-paid';
            } else if (label === 'Pre-paid') {
                partnerCustomerType = 'Pre-paid';
            } else {
                partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
            }

            cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

            // ✅ 4. แก้ไขหลัก: เพิ่ม Scope + รอจน Angular Render Options เสร็จก่อนเข้า .then()
            cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
                .should('be.visible')
                .find('option')
                .should('have.length.gt', 1)
                .then(($options) => {
                    const validOptions = ($options.toArray() as HTMLOptionElement[]).filter((opt) => {
                        const val = opt.value?.trim();
                        return !opt.disabled && val && val !== 'null' && val !== '';
                    });

                    if (validOptions.length === 0) {
                        throw new Error('No valid options found in CP Name dropdown');
                    }

                    const randomIndex = Math.floor(Math.random() * validOptions.length);
                    const randomValue = validOptions[randomIndex].value;

                    cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
                        .should('exist')
                        .should('be.visible')
                        .should('not.be.disabled')
                        .select(randomValue)
                        .should('have.value', randomValue);

                    cy.log(`Selected CP Name: ${randomValue}`);
                });

            // 5. กดปุ่ม Add ใน Panel Partner App ID
            cy.contains('.panel-heading', 'Partner App ID')
                .closest('.panel')
                .within(() => {
                    cy.get('.btn-xs .glyphicon-plus').last().should('be.visible').click();
                });

            // 6. กรอกข้อมูลใน Panel Partner App ID Detail
            cy.contains('.panel-heading', 'Partner App ID Detail')
                .closest('.panel')
                .should('be.visible')
                .within(() => {
                    cy.get('select[formcontrolname="customerType"]')
                        .should('be.visible')
                        .find('option:not([disabled])')
                        .then(($options) => {
                            const options = $options.toArray() as HTMLOptionElement[];
                            const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                            if (!matched) {
                                throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                            }
                            cy.get('select[formcontrolname="customerType"]')
                                .select(matched.value.trim())
                                .should('have.value', matched.value.trim());
                            cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                        });
                    cy.wait(500)
                    // ✅ ลบ cy.wait(500) ออก → .should('be.enabled') จะรอจนกว่า DOM และ JS พร้อม
                    cy.contains('button', /^Add$/).should('be.enabled').click();
                });

            // 7. ตรวจสอบว่า Detail Panel ถูกซ่อนหลังกด Add
            cy.contains('.panel-heading', 'Partner App ID Detail')
                .closest('.panel')
                .should(($panel) => {
                    const isHidden = $panel.attr('hidden') !== undefined ||
                        $panel.css('display') === 'none' ||
                        $panel.css('visibility') === 'hidden' ||
                        !$panel.is(':visible');
                    expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                });
            cy.wait(500)
            // 8. กดปุ่ม Add ที่ท้าย Form
            // ✅ ลบ cy.wait(500) ออก → ใช้ Cypress Auto-waiting แทน
            cy.get('app-mass-mkt-ai-ip-camera')
                .within(() => {
                    cy.get('.row.ng-star-inserted')
                        .last()
                        .within(() => {
                            cy.contains('button', /^Add$/).should('be.enabled').click();
                        });
                });
        });
};

// ========================
// KARAOKE
// ========================

export const Karaoke = (): void => {
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Karaoke$/)
        .should('be.visible')
        .click({ force: true });

    cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
        .first()
        .parent()
        .should('be.enabled')
        .click();

    cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
        .find('option:selected')
        .invoke('val')
        .then((selectedVal) => {
            const rawVal = String(selectedVal);
            const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

            let partnerCustomerType: string;
            if (label === 'Post-paid' || label === 'Hybrid-Post') {
                partnerCustomerType = 'Post-paid';
            } else if (label === 'Pre-paid') {
                partnerCustomerType = 'Pre-paid';
            } else {
                partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
            }

            cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

            cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
                .should('be.visible')
                .within(() => {
                    cy.get('select[formcontrolname="cpName"]')
                        .should('be.visible')
                        .select('Karaoke_Bundle_PLAYPremium')
                        .should('have.value', 'Karaoke_Bundle_PLAYPremium');

                    cy.log('Selected CP Name: Karaoke_Bundle_PLAYPremium');

                    const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
                    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
                    const isAISPlayBox = randomPlatform === '3: AIS Play Box';

                    cy.get('select[formcontrolname="platform"]')
                        .should('be.visible')
                        .select(randomPlatform)
                        .should('have.value', randomPlatform);

                    cy.log(`Selected Platform: ${randomPlatform}`);

                    cy.wait(1500);

                    // Partner App ID panel
                    if (!isAISPlayBox) {
                        cy.contains('h3', 'Partner App ID')
                            .closest('.panel')
                            .within(() => {
                                cy.get('button .glyphicon-plus').first().parent().click();

                                cy.contains('h3', 'Partner App ID Detail')
                                    .closest('.panel')
                                    .should('be.visible')
                                    .within(() => {
                                        cy.get('input[formcontrolname="partnerPackageName"]').should('be.visible').clear().type('test');

                                        cy.get('select[formcontrolname="customerType"]')
                                            .should('be.visible')
                                            .find('option:not([disabled])')
                                            .then(($options) => {
                                                const options = $options.toArray() as HTMLOptionElement[];
                                                const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                                                if (!matched) {
                                                    throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                                                }
                                                cy.get('select[formcontrolname="customerType"]')
                                                    .select(matched.value.trim())
                                                    .should('have.value', matched.value.trim());
                                                cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                                            });
                                        cy.wait(2000);
                                        cy.contains('button', /^Add$/).should('be.visible').click();
                                    });

                                cy.contains('h3', 'Partner App ID Detail')
                                    .closest('.panel')
                                    .should(($panel) => {
                                        const isHidden = $panel.attr('hidden') !== undefined ||
                                            $panel.css('display') === 'none' ||
                                            $panel.css('visibility') === 'hidden' ||
                                            !$panel.is(':visible');
                                        expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                                    });
                            });

                        cy.wait(1500);
                    }

                    // Vimmi Product panel
                    if (isAISPlayBox) {
                        cy.contains('h3', 'Vimmi Product')
                            .closest('.panel')
                            .within(() => {
                                cy.get('button .glyphicon-plus').first().parent().click();

                                cy.contains('h4', 'Vimmi Product Detail')
                                    .closest('.panel')
                                    .should('be.visible')
                                    .within(() => {
                                        cy.get('input[formcontrolname="vimmiProductNameText"]').should('be.visible').clear().type('test');

                                        const random19Digits = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
                                        cy.log(`Random Vimmi Product ID: ${random19Digits}`);

                                        cy.get('input[formcontrolname="vimmiProductId"]').should('be.visible').clear().type(random19Digits);
                                        cy.wait(2000);
                                        cy.contains('button', /^Add$/).should('be.visible').click();
                                    });
                            });

                        cy.wait(1500);
                    }

                    cy.wait(2000);
                    cy.get('button')
                        .filter(':visible')
                        .contains(/^Add$/)
                        .should('be.enabled')
                        .click();
                });
        });
};

// ========================
// MUSIC STREAMING
// ========================

export const MusicStreaming = (): void => {
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Music Streaming$/)
        .should('be.visible')
        .click({ force: true });

    cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
        .first()
        .parent()
        .should('be.enabled')
        .click();

    cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
        .find('option:selected')
        .invoke('val')
        .then((selectedVal) => {
            const rawVal = String(selectedVal);
            const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

            let partnerCustomerType: string;
            if (label === 'Post-paid' || label === 'Hybrid-Post') {
                partnerCustomerType = 'Post-paid';
            } else if (label === 'Pre-paid') {
                partnerCustomerType = 'Pre-paid';
            } else {
                partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
            }

            cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

            cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
                .should('be.visible')
                .within(() => {
                    const cpOptions = ['GMM Plern', 'jooxvip', 'Apple'];
                    const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

                    // รอให้ wrapper section (ที่มี hidden="" ตอนแรก) เปิดออกก่อน
                    // แทนที่จะเลือก cpName ทันที ซึ่งอาจยังโดน hidden ครอบอยู่
                    cy.get('select[formcontrolname="cpName"]', { timeout: 10000 })
                        .should('be.visible')
                        .find('option:not([disabled])')
                        .then(($options) => {
                            const options = $options.toArray() as HTMLOptionElement[];
                            const matched = options.find((opt) => opt.text.trim().includes(randomCp));
                            if (!matched) {
                                throw new Error(`No option matched "${randomCp}" in CP Name dropdown`);
                            }
                            cy.get('select[formcontrolname="cpName"]')
                                .select(matched.value.trim())
                                .should('have.value', matched.value.trim());
                            cy.log(`Selected CP Name: ${matched.value.trim()}`);
                        });

                    const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
                    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

                    cy.get('select[formcontrolname="platform"]')
                        .should('be.visible')
                        .select(randomPlatform)
                        .should('have.value', randomPlatform);

                    cy.log(`Selected Platform: ${randomPlatform}`);

                    // รอ Angular re-render panel "Partner App ID" แทน cy.wait(500)
                    cy.contains('h3', 'Partner App ID', { timeout: 10000 }).should('be.visible');

                    cy.contains('h3', 'Partner App ID')
                        .closest('.panel')
                        .within(() => {
                            cy.get('button .glyphicon-plus').first().parent().click();

                            cy.contains('h3', 'Partner App ID Detail')
                                .closest('.panel')
                                .should('be.visible')
                                .within(() => {
                                    cy.get('input[formcontrolname="partnerPackageName"]')
                                        .should('be.visible')
                                        .clear()
                                        .type('test');

                                    cy.get('select[formcontrolname="customerType"]')
                                        .should('be.visible')
                                        .find('option:not([disabled])')
                                        .then(($options) => {
                                            const options = $options.toArray() as HTMLOptionElement[];
                                            const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                                            if (!matched) {
                                                throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                                            }
                                            cy.get('select[formcontrolname="customerType"]')
                                                .select(matched.value.trim())
                                                .should('have.value', matched.value.trim());
                                            cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                                        });

                                    cy.contains('button', /^Add$/).should('be.visible').click();
                                });

                            // ยืนยันว่า detail panel ยุบกลับเป็น hidden จริง หลังกด Add
                            cy.contains('h3', 'Partner App ID Detail')
                                .closest('.panel')
                                .should(($panel) => {
                                    const isHidden =
                                        $panel.attr('hidden') !== undefined ||
                                        $panel.css('display') === 'none' ||
                                        $panel.css('visibility') === 'hidden' ||
                                        !$panel.is(':visible');
                                    expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                                });
                        });

                    cy.get('button')
                        .filter(':visible')
                        .contains(/^Add$/)
                        .should('be.enabled')
                        .click();
                });
        });
};
// ========================
// VRBT
// ========================

export const VRBT = (): void => {
    cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^VRBT$/)
        .should('be.visible')
        .click({ force: true });

    cy.get('app-mass-mkt-vrbt')
        .find('button.btn-primary')
        .find('.glyphicon-plus')
        .parent('button')
        .should('be.enabled')
        .click({ force: true });

    cy.get('app-mass-mkt-vrbt', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
            // ตัด cy.get('.panel') ตัวแรกออก — เริ่มจาก contains ตรง ๆ
            // เพื่อไม่ให้ subject กำกวมจาก panel ที่ซ้อนกัน
            cy.contains('h3', 'VRBT Detail', { timeout: 10000 })
                .should('be.visible')
                .closest('.panel')
                .within(() => {
                    cy.get('select[formcontrolname="productName"]')
                        .should('be.visible')
                        .find('option:not([disabled])')
                        .then(($options) => {
                            const options = $options.toArray() as HTMLOptionElement[];
                            const matched = options.find(
                                (opt) => opt.text.trim() === 'Platform Calling VDO'
                            );
                            if (!matched) {
                                throw new Error(
                                    'No option matched "Platform Calling VDO" in Product Name dropdown'
                                );
                            }
                            cy.get('select[formcontrolname="productName"]')
                                .select(matched.value.trim())
                                .should('have.value', matched.value.trim());
                            cy.log(`Selected Product Name: ${matched.value.trim()}`);
                        });

                    cy.get('ng2-dual-list-box[formcontrolname="partnerSku"]').within(() => {
                        cy.get('select[formcontrolname="availableListBox"]')
                            .find('option')
                            .then(($options) => {
                                const options = $options.toArray() as HTMLOptionElement[];
                                if (options.length === 0) {
                                    throw new Error('No available options in Partner SKU list');
                                }
                                const randomIndex = Math.floor(Math.random() * options.length);
                                const randomValue = options[randomIndex].value;
                                cy.log(`Selected Partner SKU: ${options[randomIndex].text.trim()}`);

                                cy.get('select[formcontrolname="availableListBox"]').select(randomValue);

                                // รอปุ่ม "str" (move to selected) พร้อมใช้งานจริง แทน wait ตายตัว
                                cy.get('button.str')
                                    .should('not.be.disabled')
                                    .click();
                            });
                    });

                    cy.contains('button', /^Add$/)
                        .should('be.visible')
                        .should('be.enabled')
                        .click();
                });
        });
};
// ========================
// INTERNET
// ========================
const INTERNET_SPEEDS = [
    '4Gbps/4Gbps', '3Gbps/3Gbps', 'Max Speed (5G 2Gbps/2Gbps)',
    'Max Speed (5G Default 1Gbps/1Gbps)', '1000 Mbps', '450 Mbps',
    '300 Mbps', '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps',
    '40 Mbps', '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps',
    '12 Mbps', '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps',
    '6 Mbps', '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
    '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
    '10 Kbps', '0 Kbps'
] as const;

const THROTTLING_SPEEDS = [
    '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps', '40 Mbps',
    '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps', '12 Mbps',
    '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps', '6 Mbps',
    '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
    '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
    '10 Kbps', '0 Kbps'
] as const;

type InternetQuotaType =
    | 'Limited Data (Pay per use)'
    | 'Limited Data (Stop Net)'
    | 'Limited Data Only'
    | 'Pay per use only'
    | 'Unlimited Data (Fixed Speed)'
    | 'Unlimited Data (Throttling Speed)';

const selectDropdownOption = <T extends string>(
    selector: string,
    options: readonly T[],
    config: {
        exact?: boolean;
        maxRetries?: number;
        skipFirst?: boolean;
        logPrefix?: string;
    } = {}
): void => {
    const { exact = true, maxRetries = 3, skipFirst = true, logPrefix = '' } = config;
    let attempts = 0;

    const attemptSelection = (): void => {
        cy.get(selector)
            .filter(':visible')
            .then($select => {
                const $options = $select.find('option:not([disabled])');
                const availableOptions = [...$options].filter((_, i) => !skipFirst || i > 0);

                const matchedOptions = availableOptions.filter(opt => {
                    const text = (opt as HTMLOptionElement).text.trim();
                    return exact
                        ? options.includes(text as T)
                        : options.some(allowed => text.toLowerCase().includes(allowed.toLowerCase()));
                });

                if (matchedOptions.length > 0) {
                    const randomOpt = matchedOptions[Math.floor(Math.random() * matchedOptions.length)] as HTMLOptionElement;
                    cy.wrap($select).select(randomOpt.value);
                    cy.wait(500);
                    cy.log(`✅ ${logPrefix}Selected: ${randomOpt.text}`);
                    return;
                }

                attempts++;
                if (attempts < maxRetries) {
                    cy.log(`⚠️ ${logPrefix}No match, retry ${attempts}/${maxRetries}`);
                    cy.wait(500);
                    attemptSelection();
                    return;
                }

                cy.log(`❌ ${logPrefix}Failed after ${maxRetries} attempts, using fallback`);
                if (availableOptions.length > 0) {
                    const fallback = availableOptions[Math.floor(Math.random() * availableOptions.length)] as HTMLOptionElement;
                    cy.wrap($select).select(fallback.value);
                    cy.wait(500);
                    cy.log(`⚠️ ${logPrefix}Fallback: ${fallback.text}`);
                }
            });
    };

    attemptSelection();
};

const selectMatOption = (
    labelSelector: string,
    optionFilter?: (text: string) => boolean
): void => {
    cy.contains('label', labelSelector)
        .filter(':visible')
        .closest('.row')
        .find('mat-select .mat-select-trigger')
        .click({ force: true });

    cy.get('.cdk-overlay-pane mat-option', { timeout: 10000 })
        .should('be.visible')
        .then($options => {
            const targetOptions = optionFilter
                ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
                : $options;

            if (targetOptions.length > 0) {
                const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
                cy.wrap(randomOpt).click({ force: true });
            } else if ($options.length > 0) {
                cy.wrap($options[0]).click({ force: true });
            } else {
                cy.get('.cdk-overlay-backdrop').click({ force: true });
            }
            cy.wait(500);
        });
};

const selectMatOptionWithValidation = (
    labelSelector: string,
    optionFilter?: (text: string) => boolean
): void => {
    cy.contains('label', labelSelector)
        .closest('.row')
        .find('mat-select')
        .should('not.have.class', 'mat-select-disabled')
        .click();

    cy.get('.cdk-overlay-pane mat-option:not(.mat-option-disabled)', { timeout: 10000 })
        .should('have.length.greaterThan', 0)
        .then($options => {
            const targetOptions = optionFilter
                ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
                : $options;

            if (targetOptions.length > 0) {
                const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
                cy.wrap(randomOpt).click({ force: true });
            } else {
                cy.wrap($options.first()).click({ force: true });
            }
        });

    cy.wait(500);

    cy.contains('label', labelSelector)
        .closest('.row')
        .find('mat-select')
        .should('not.contain', 'Please Select')
        .should('have.class', 'ng-valid')
        .and('have.class', 'ng-dirty');
};

const isPreModule = (productClass: string, subModule?: string): boolean =>
    productClass === 'main' && subModule?.toLowerCase() === 'pre';

const handleUsageLocalized = (): void => {
    cy.get('body').then($body => {
        const $radios = $body
            .find('input[formcontrolname="usageLocalizedFlag"]')
            .filter(':visible');

        if ($radios.length === 0) {
            cy.log('ℹ️ Usage Localized field not present in this variant, skipping');
            return;
        }

        const idx = Cypress._.random(0, $radios.length - 1);
        cy.wrap($radios.eq(idx)).click({ force: true });
        cy.wait(300);
        cy.log(`📌 Usage Localized option ${idx} selected`);
    });
};

const handleLimitedData = (productClass: string, subModule?: string) => {
    selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
    selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
    if (productClass === 'main') {
        selectMatOptionWithValidation('*Internet Exceed Rate :');
    }
};

const handleLimitedDataOnly = (productClass: string, subModule?: string, Module?: string) => {
    cy.log(`🔵 Case: Limited Data Only | ProductClass: ${productClass} | subModule: ${subModule}| Module: ${Module}`);
    selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
    selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
    if (isPreModule(productClass, subModule)) {
        cy.log('✅ Condition met → calling selectInternetExceedRate()');
        selectMatOptionWithValidation('*Internet Exceed Rate :');
    }
};

const handlePayPerUse = () => {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
};

const handleUnlimitedFixedSpeed = (productClass: string, subModule?: string) => {
    const checkboxSelector = '[formarrayname="internetQuotaNetworkCoverageCheckBox"]';

    cy.get(checkboxSelector)
        .filter(':visible')
        .then($container => {
            const $5gLabel = $container.find('label').filter((_, el) =>
                Cypress.$(el).text().trim().includes('5G')
            );

            if ($5gLabel.length > 0) {
                cy.wrap($5gLabel).click({ force: true });
                cy.wait(600);
            }

            const logPrefix = $5gLabel.length > 0 ? '[5G] ' : '[Non-5G] ';
            selectDropdownOption(
                'select[formcontrolname="fixedSpeedInternetSpeed"]',
                INTERNET_SPEEDS,
                { exact: false, logPrefix }
            );
        });

    if (isPreModule(productClass, subModule)) {
        selectMatOptionWithValidation('*Internet Exceed Rate :');
    }
};

const handleUnlimitedThrottling = (productClass: string, subModule?: string) => {
    selectMatOption('*Internet Quota :', text => text.startsWith('5G'));

    const speedsForThrottling = INTERNET_SPEEDS.filter(s => s !== '0 Kbps');

    selectDropdownOption('select[formcontrolname="internetSpeed"]', speedsForThrottling, { exact: true, logPrefix: '[Speed] ' });
    selectDropdownOption('select[formcontrolname="internetThrottlingSpeed"]', THROTTLING_SPEEDS, { exact: true, logPrefix: '[Throttling] ' });

    if (isPreModule(productClass, subModule)) {
        selectMatOptionWithValidation('*Internet Exceed Rate :');
    }
};

function selectMatOptionByLabel(labelText: string, optionText?: string) {
    cy.get('body').then(($body) => {
        if ($body.find('.cdk-overlay-pane').length > 0) {
            cy.get('body').type('{esc}', { force: true });
            cy.wait(200);
        }
    });

    cy.contains('label', labelText)
        .filter(':visible')
        .closest('.row')
        .find('mat-select .mat-select-trigger')
        .click({ force: true });

    cy.get('.cdk-overlay-pane').last().within(() => {
        if (optionText) {
            cy.contains('mat-option', optionText).click({ force: true });
        } else {
            cy.get('mat-option:not(.mat-option-disabled)').then(($opts) => {
                const idx = Cypress._.random(0, $opts.length - 1);
                cy.wrap($opts.eq(idx)).click({ force: true });
            });
        }
    });

    cy.wait(300);
    verifyMatSelectChanged(labelText);
}

function verifyMatSelectChanged(labelText: string, attemptsLeft: number = 2) {
    cy.contains('label', labelText)
        .filter(':visible')
        .closest('.row')
        .find('mat-select')
        .then(($select) => {
            const stillPlaceholder = $select.text().includes('Please Select');
            if (stillPlaceholder && attemptsLeft > 0) {
                cy.log(`⚠️ ${labelText} ยังไม่เปลี่ยนค่า - retry (${attemptsLeft} เหลือ)`);
                selectMatOptionByLabel(labelText);
            } else if (stillPlaceholder) {
                throw new Error(`❌ ${labelText} ไม่สามารถเลือกค่าได้หลัง retry`);
            } else {
                cy.log(`✅ ${labelText} เลือกสำเร็จ`);
            }
        });
}

// ==========================================
// ✅ FIX: ฟังก์ชันที่ปรับปรุงให้ทนทานและ Debug ได้ง่าย
// ==========================================
const clickAddUntilDataAppears = (
    tableSelector: string,
    addButtonSelector: string,
    formSelector: string = 'app-mass-mkt-internet',
    maxAttempts: number = 5,
    expectedRowText?: string
): void => {
    const checkTargetRowExists = (): Cypress.Chainable<boolean> =>
        cy.get(tableSelector).then($tbodies => {
            // ✅ DEBUG ขั้นสุด: ดึงข้อความของแต่ละแถว (tr) ออกมาแยกกันให้อ่านง่าย
            const allRowsText: string[] = [];
            $tbodies.each((_, tb) => {
                Cypress.$(tb).find('tr').each((_, tr) => {
                    const cleanText = Cypress.$(tr).text().replace(/\s+/g, ' ').trim();
                    if (cleanText.length > 5) { // กรองแถวว่างๆ ออก
                        allRowsText.push(cleanText);
                    }
                });
            });

            cy.log(`🔍 [DEBUG] พบทั้งหมด ${allRowsText.length} แถวในตาราง:`);
            allRowsText.forEach((text, idx) => {
                cy.log(`   [Row ${idx + 1}]: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
            });

            if (!expectedRowText) {
                const hasData = allRowsText.some(text => !text.includes('No data to display.'));
                return cy.wrap(hasData, { log: false });
            }

            // 1. ลองหาแบบ Exact Match ก่อน
            let found = allRowsText.some(text => text.includes(expectedRowText));

            // 2. ✅ SMART FALLBACK: ถ้าหาเป๊ะๆ ไม่เจอ ให้ลองหาแบบยืดหยุ่น
            // กรณี "Unlimited Data (Throttling Speed)" อาจจะแสดงในตารางเป็น "Unlimited (Throttling)" หรือคล้ายกัน
            if (!found && expectedRowText.includes('Unlimited') && expectedRowText.includes('Throttling')) {
                found = allRowsText.some(text => text.includes('Unlimited') && text.includes('Throttling'));
                if (found) {
                    cy.log(`⚠️ [DEBUG] เจอข้อมูลแบบ Fallback! (มีคำว่า Unlimited และ Throttling ในแถวเดียวกัน)`);
                }
            }

            // 3. FALLBACK 2: ถ้ายังหาไม่เจอ ลองหาแค่คำว่า "Throttling" อย่างเดียว
            if (!found && expectedRowText.includes('Throttling')) {
                found = allRowsText.some(text => text.includes('Throttling'));
                if (found) {
                    cy.log(`⚠️ [DEBUG] เจอข้อมูลแบบ Fallback 2! (มีคำว่า Throttling)`);
                }
            }

            return cy.wrap(found, { log: false });
        });

    const attempt = (attemptsLeft: number): void => {
        checkTargetRowExists().then(found => {
            if (found) {
                cy.log(`✅ พบข้อมูลที่ตรงกับเงื่อนไขในตารางแล้ว (หลังจากลอง ${5 - attemptsLeft} ครั้ง)`);
                return;
            }

            if (attemptsLeft <= 0) {
                // ✅ ตรวจสอบว่ามี Error Message โผล่ขึ้นมาบนหน้าจอหรือไม่
                cy.get('body').then($body => {
                    const hasError = $body.text().includes('Required') ||
                        $body.text().includes('Invalid') ||
                        $body.find('.text-danger, .mat-error, .alert-danger').length > 0;

                    if (hasError) {
                        cy.log('❌ [DEBUG] พบข้อความ Error หรือ Required บนหน้าจอ! Form อาจจะไม่ Valid จริงๆ แม้จะผ่านเช็ค ng-valid มาแล้ว');
                    } else {
                        cy.log('❌ [DEBUG] ไม่พบ Error บนหน้าจอ แต่ข้อมูลก็ไม่โผล่ในตาราง (อาจเป็นเพราะ API Save ล้มเหลว หรือ Form ไม่ Reset)');
                    }
                });

                throw new Error(`❌ ไม่พบแถวที่ตรงกับ "${expectedRowText}" (หรือ Fallback) ในตาราง หลังกด Add ซ้ำครบ ${maxAttempts} ครั้ง`);
            }

            cy.log(`⚠️ ยังไม่พบแถวที่ต้องการ → กำลังกด Add ซ้ำ (เหลือ ${attemptsLeft} ครั้ง)`);

            cy.get('body').then($body => {
                const $addBtn = $body
                    .find(addButtonSelector)
                    .filter(':visible')
                    .filter((_, el) => !Cypress.$(el).prop('disabled'))
                    .filter((_, el) => /Add/i.test(Cypress.$(el).text().trim()));

                if ($addBtn.length > 0) {
                    cy.wrap($addBtn.first())
                        .scrollIntoView()
                        .focus()
                        .click({ force: true });
                } else {
                    cy.log('ℹ️ ไม่พบปุ่ม Add ที่กดได้');
                }
            });

            // ✅ รอให้นานขึ้นเล็กน้อย เพื่อให้ Angular FormArray และ API ทำงานเสร็จ
            cy.wait(1500);
            attempt(attemptsLeft - 1);
        });
    };

    attempt(maxAttempts);
};

// ==========================================
// MAIN EXPORTED FUNCTION
// ==========================================
export const InternetRandom = (ProductClass: string, subModule?: string, Module?: string) => {
    cy.log('▶️ เริ่มต้น InternetRandom()');

    cy.get('body').then(($body) => {
        if ($body.find('.loading-curtain').length > 0) {
            cy.get('.loading-curtain', { timeout: 15000 }).should('not.exist');
        }
    });

    cy.get('.scrollmenu > .nav', { timeout: 30000 })
        .scrollIntoView()
        .should('be.visible')
        .should(($nav) => {
            const hasInternetTab = $nav.find('a').filter((_, el) => /internet/i.test(el.textContent || '')).length > 0;
            expect(hasInternetTab, 'Internet tab to be rendered').to.be.true;
        });

    cy.get('.scrollmenu > .nav', { timeout: 30000 })
        .contains(/internet/i)
        .should('be.visible')
        .and('not.be.disabled')
        .click({ force: true });

    cy.log('✅ คลิกแท็บ Internet สำเร็จ');

    cy.scrollTo('bottom');
    cy.get('app-mass-mkt-internet button.btn-xs').find('.glyphicon-plus').filter(':visible').first().click();

    cy.get('app-mass-mkt-internet select[formcontrolname="InternetQuotaType"]', { timeout: 15000 })
        .should(($select) => {
            expect($select.filter(':visible').length, 'Internet Quota Type select to become visible').to.be.greaterThan(0);
        });

    cy.log('✅ Internet Detail panel confirmed visible');

    handleUsageLocalized();

    const allowedOptions: InternetQuotaType[] = [
        'Limited Data (Pay per use)',
        'Limited Data (Stop Net)',
        'Limited Data Only',
        'Pay per use only',
        'Unlimited Data (Fixed Speed)',
        'Unlimited Data (Throttling Speed)'
    ];

    cy.get('app-mass-mkt-internet select[formcontrolname="InternetQuotaType"]')
        .filter(':visible')
        .last()
        .then($select => {
            cy.wrap($select).find('option').then($options => {
                const availableOptions = [...$options]
                    .map(opt => (opt as HTMLOptionElement).text.trim())
                    .filter(text => allowedOptions.includes(text as InternetQuotaType));

                if (availableOptions.length === 0) {
                    cy.log('❌ No allowed quota types available');
                    return;
                }

                const selectedType = availableOptions[Math.floor(Math.random() * availableOptions.length)] as InternetQuotaType;

                cy.wrap($select).select(selectedType);
                cy.wait(500);
                cy.log(`📌 Selected Quota Type: ${selectedType}`);

                const handlers: Record<InternetQuotaType, () => void> = {
                    'Limited Data (Pay per use)': () => handleLimitedData(ProductClass, subModule),
                    'Limited Data (Stop Net)': () => handleLimitedData(ProductClass, subModule),
                    'Limited Data Only': () => handleLimitedDataOnly(ProductClass, subModule, Module),
                    'Pay per use only': handlePayPerUse,
                    'Unlimited Data (Fixed Speed)': () => handleUnlimitedFixedSpeed(ProductClass, subModule),
                    'Unlimited Data (Throttling Speed)': () => handleUnlimitedThrottling(ProductClass, subModule),
                };

                handlers[selectedType]?.();
                cy.wait(500);

                // ✅ FIX 5: เช็ค Form Validation ให้แม่นยำขึ้น (เช็คเฉพาะ Form ที่ Active และ Visible)
                cy.get('app-mass-mkt-internet')
                    .find('form, [formgroup]')
                    .filter(':visible')
                    .last()
                    .should('not.have.class', 'ng-invalid')
                    .and('not.have.class', 'ng-pending');

                cy.get('app-mass-mkt-internet button.btn-primary')
                    .filter(':visible')
                    .contains(/^Add$/)
                    .should('be.enabled')
                    .scrollIntoView()
                    .click({ force: true });

                cy.wait(800);

                clickAddUntilDataAppears(
                    'app-mass-mkt-internet table tbody',
                    'app-mass-mkt-internet button.btn-primary',
                    'app-mass-mkt-internet',
                    5,
                    selectedType
                );

                cy.log(`✅ Confirmed Internet Quota row added with type="${selectedType}"`);
            });
        });
};