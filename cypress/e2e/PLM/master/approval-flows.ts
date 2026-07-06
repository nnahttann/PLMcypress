import { createFullPageApprovalFlow, createSimplePageApprovalFlow, performSimpleClaimAndApprovalRole } from './claim-approve';
import { scrollAndWait, selectRandomOption, clickYesIfExists, handleAddToUSMP } from './helpers';
import { TaskListHeader, CoreTaskCallback, FinalAction } from './config';

// ========================
// SHARED PO LOOP UTILITY
// ========================

import { navigateToWorkspace, NavRole } from './claim-approve';

const loopApproveAllPOs = (
    taskListHeader: TaskListHeader,
    expectedUrl: string,
    buildCoreCallback: (poName: string, poIndex: number) => CoreTaskCallback,
    lastFinalAction: FinalAction,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];

    cy.log(`📋 Starting PO approval loop — total: ${poCount}`);

    const approveAt = (poIndex: number): void => {
        if (poIndex >= poCount) {
            cy.log('✅ All POs approved');
            return;
        }

        const poName = allPoNames[poIndex] ?? `PO${poIndex + 1}`;
        const isLast = poIndex === poCount - 1;
        const finalAction: FinalAction = isLast ? lastFinalAction : 'StopAfterCore';

        cy.log(`🔄 PO ${poIndex + 1}/${poCount}: "${poName}" — finalAction: ${finalAction}`);

        createFullPageApprovalFlow(
            poName,
            taskListHeader,
            expectedUrl,
            buildCoreCallback(poName, poIndex),
            finalAction,
            poIndex === 0 ? options : undefined
        );

        // ✅ FIX: forward role เข้า navigateToWorkspace ไม่งั้นจะ default เป็น CGMD (คลิก Menu) เสมอ
        if (!isLast) {
            navigateToWorkspace({ role: options?.role });
        }

        approveAt(poIndex + 1);
    };

    approveAt(0);
};

// ========================
// SPAD APPROVAL FUNCTIONS
// ========================

const pollUntilSPADDeployReady = (maxAttempts = 50, intervalMs = 5000): void => {
    const expandStatusPanelIfCollapsed = (): void => {
        cy.get('body').then(($body) => {
            const $panel = $body
                .find('h4:contains("Status Send API to PlugIN/PHX")')
                .closest('.panel-heading');
            const isCollapsed = $panel.next('.collapse-panel').attr('aria-expanded') === 'false';

            if (isCollapsed) {
                cy.contains('h4', 'Status Send API to PlugIN/PHX').click({ force: true });
                cy.wait(300);
            }
        });
    };

    const attempt = (remaining: number): void => {
        cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
        cy.wait(intervalMs);

        expandStatusPanelIfCollapsed();

        cy.contains('button', 'Refresh Status', { timeout: 15000 })
            .should('be.visible')
            .click({ force: true });
        scrollAndWait();

        cy.get('body').then(($body) => {
            const $btn = $body.find('button').filter((_, el) => {
                const $el = Cypress.$(el);
                return (
                    $el.text().trim().includes('Promote to SPAD Deploy') &&
                    $el.closest('[hidden]').length === 0 &&
                    $el.is(':visible') &&
                    !$el.is(':disabled')
                );
            });

            if ($btn.length > 0) {
                cy.log('✅ Promote to SPAD Deploy button is ready');
            } else if (remaining > 0) {
                attempt(remaining - 1);
            } else {
                throw new Error('❌ Promote to SPAD Deploy button never became available after max attempts');
            }
        });
    };

    attempt(maxAttempts);
};

// ─────────────────────────────────────────────
// SPAD Supervisor
// ─────────────────────────────────────────────

const _approveSPADSup = (
    projectName: string,
    isComplex: boolean,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-spad',
        (_poName, _poIndex) => () => {
            cy.then(() => {
                const rnd5 = Math.floor(Math.random() * 90000) + 10000;
                const rnd2 = Math.floor(Math.random() * 90) + 10;
                cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').clear().type(rnd5.toString());
                cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').clear().type(rnd2.toString());
            });
            scrollAndWait();
            cy.contains('button', buttonText, { timeout: 60000 }).should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectSPADSup = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => _approveSPADSup(projectName, true, options);

export const approveProjectSPADSupCGMDPlugin = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => _approveSPADSup(projectName, false, options);

export const approveProjectSPAD = (
    projectName: string,
    isComplex = true,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => _approveSPADSup(projectName, isComplex, options);

// ─────────────────────────────────────────────
// SPAD Doer
// ─────────────────────────────────────────────

const _approveSPADDoer = (
    projectName: string,
    isMainFlow: boolean,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-configure',
        (_poName, _poIndex) => () => {
            cy.wait(500);

            const fillRandom = (labelText: string, prefix: string) => {
                const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                cy.contains('label', new RegExp(`^\\s*${escaped}\\s*:\\s*$`))
                    .parent()
                    .next('div')
                    .find('input[type="text"]')
                    .then(($input) => {
                        const rnd = Math.floor(Math.random() * 90000) + 10000;
                        cy.wrap($input).clear().type(`${prefix}${rnd}`);
                    });
            };
            fillRandom('PACKAGE_TYPE', 'PT');
            fillRandom('PACKAGE_ID (PP ID)', 'PP');
            fillRandom('PACKAGE_SUB_TYPE', 'PST');

            selectRandomOption('Gprs type');
            cy.wait(500);
            selectRandomOption('Template');

            scrollAndWait();
            cy.contains('button', 'Promote To SPAD Tester', { timeout: 60000 })
                .should('be.visible')
                .click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectSPADDOER = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => _approveSPADDoer(projectName, false, options);

export const approveProjectSPADDOERMain = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => _approveSPADDoer(projectName, true, options);

// ─────────────────────────────────────────────
// SPAD Tester
// ─────────────────────────────────────────────

const _approveSPADTester = (
    projectName: string,
    isMainFlow: boolean,
    options?: { alreadyOnPage?: boolean; skipLogout?: boolean; role?: NavRole }
): void => {
    // 🐛 FIX: window:confirm listener was being re-registered inside the
    // per-PO core callback below, so with poCount > 1 it accumulated N
    // duplicate handlers by the end of the loop. Register it once, here,
    // outside the loop, instead.
    cy.on('window:confirm', () => true);

    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-tester',
        (_poName, _poIndex) => () => {
            cy.wait(500);
            scrollAndWait();

            cy.get('body').then(($body) => {
                const hasSendPlugin =
                    $body.find('button:contains("Send PlugIN")').length > 0;

                cy.once('window:alert', (alertText) => {
                    if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
                        throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
                    }
                });

                if (hasSendPlugin) {
                    cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

                    cy.contains('button', 'Send PlugIN', { timeout: 60000 })
                        .should('be.visible')
                        .and('not.be.disabled')
                        .click({ force: true });

                    // ✅ FIX: modal "Do you want to Send API PlugIN ?" เด้งขึ้นมาหลังกดปุ่ม Send PlugIN
                    // ต้องกด "Yes" ในโมดัลนี้ก่อน API SendPluginMain_v2 ถึงจะถูกยิงออกไปจริง
                    // (เดิมโค้ดไป cy.wait('@sendPluginApi') ก่อน แล้วค่อยกด Yes ทีหลัง ทำให้ wait ค้าง/timeout)
                    cy.contains('.modal-body', 'Do you want to Send API PlugIN', { timeout: 10000 })
                        .should('be.visible')
                        .within(() => {
                            cy.contains('button', 'Yes').click({ force: true });
                        });

                    cy.wait('@sendPluginApi', { timeout: 60000 })
                        .its('response.statusCode').should('eq', 200);

                    pollUntilSPADDeployReady();

                    cy.removeAllListeners('window:alert');
                    cy.once('window:alert', (alertText) => {
                        if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
                            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
                        }
                    });

                    cy.contains('button', 'Promote to SPAD Deploy', { timeout: 60000 })
                        .should('be.visible')
                        .and('not.be.disabled')
                        .click({ force: true });

                    clickYesIfExists(10000, 'last');

                } else {
                    cy.log('⚠️ Send PlugIN not found — skipping to Promote directly');

                    cy.contains('button', 'Promote to SPAD Deploy', { timeout: 60000 })
                        .should('be.visible')
                        .and('not.be.disabled')
                        .click({ force: true });

                    clickYesIfExists(10000, 'last');
                }
            });
        },
        isMainFlow ? 'StopAfterCore' : 'AlertAndLogout',
        options
    );
};

export const approveProjectSPADTester = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; skipLogout?: boolean; role?: NavRole }
): void => _approveSPADTester(projectName, false, options);

export const approveProjectSPADTesterMain = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; skipLogout?: boolean; role?: NavRole }
): void => _approveSPADTester(projectName, true, options);

// ─────────────────────────────────────────────
// SPAD Deploy
// ─────────────────────────────────────────────

export const approveProjectSPADdeploy = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/actm/actm-doer',
        (_poName, _poIndex) => () => {
            scrollAndWait();
            cy.contains('button', 'Promote To ACTM', { timeout: 60000 }).should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

// ========================
// CGMD APPROVAL FUNCTIONS
// ========================

// 🐛 FIX: this function previously took only `projectName` and never
// forwarded `options` into loopApproveAllPOs. That meant `options?.role`
// was always undefined, so navigateToWorkspace() silently fell back to the
// CGMD role (clicking "Menu") between POs whenever poCount > 1, regardless
// of which role the test was actually running as. Now mirrors the pattern
// used by approveProjectCGMDPRE / approveProjectSPADSup / etc.
export const approveProjectCGMD = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-configure',
        (_poName, _poIndex) => () => {
            const selectSingleRandomMatOption = () => {
                cy.get('.cdk-overlay-container mat-option:not(.mat-option-disabled)')
                    .should('have.length.greaterThan', 0)
                    .then(($options) => {
                        const randomIndex = Cypress._.random(0, $options.length - 1);
                        cy.wrap($options.eq(randomIndex))
                            .scrollIntoView()
                            .click({ force: true });
                    });
            };

            // Session DIY
            cy.get('body').then(($body) => {
                if ($body.find('app-diy-description mat-select').length > 0) {
                    cy.log('🟢 พบ Session DIY - กำลังดำเนินการตั้งค่า');

                    cy.get('app-diy-description .panel-heading').contains('DIY').click();

                    cy.get('app-diy-description')
                        .contains('.col-md-1', 'SO ID :')
                        .next('.col-md-4')
                        .find('mat-select')
                        .click();
                    selectSingleRandomMatOption();

                    cy.get('body').then(($b) => {
                        const rows = $b.find('app-diy-description table tbody tr');

                        if (rows.length === 0) {
                            cy.log('⚠️ DIY table ไม่มีแถว — ข้ามการสุ่ม Unit Name');
                        } else {
                            cy.log(`✅ DIY table พบ ${rows.length} แถว — กำลังสุ่ม Unit Name`);

                            cy.wrap(rows).each(($tr) => {
                                if ($tr.find('mat-select').length > 0) {
                                    const typeName = $tr.find('td.text-left').text().trim();
                                    cy.log(`🔧 กำลังสุ่มเลือกข้อมูลให้กับ: ${typeName}`);

                                    cy.wrap($tr).find('mat-select').click();
                                    selectSingleRandomMatOption();
                                    cy.wait(500);
                                }
                            });
                        }
                    });

                    cy.get('app-diy-description button.btn-primary')
                        .contains('Save')
                        .scrollIntoView()
                        .click({ force: true });
                } else {
                    cy.log('⚪ ไม่พบ Session DIY');
                }
            });

            // SFF Product
            cy.get('body').then(($body) => {
                if ($body.find('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]').length > 0) {
                    cy.log('🟢 พบ SFF Product - กำลังดำเนินการกรอกข้อมูล');

                    const randomCommunityId = Cypress._.random(1000000000, 9999999999).toString();

                    cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
                        .should('be.visible')
                        .should('not.be.disabled')
                        .clear()
                        .type(randomCommunityId);

                    cy.get('app-sff-template-cgmd-addition button.btn-success').contains('Save').click();
                } else {
                    cy.log('⚪ ไม่พบ SFF Product');
                }
            });

            handleAddToUSMP();
            scrollAndWait();
            cy.get('button[name="CBS"]').should('be.visible', { timeout: 60000 }).click();
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectCGMDPRE = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-configure',
        (_poName, _poIndex) => () => {
            const maxDigits = 12;
            const numDigits = Math.floor(Math.random() * maxDigits) + 1;
            const min = Math.pow(10, numDigits - 1);
            const max = Math.pow(10, numDigits) - 1;
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

            cy.contains('label', 'CBS_OFFERING_ID')
                .closest('.col-md-4')
                .find('input')
                .scrollIntoView()
                .should('be.visible')
                .should('not.be.disabled')
                .clear({ force: true })
                .type(randomNumber.toString(), { force: true, delay: 50 })
                .should('have.value', randomNumber.toString());

            cy.contains('label', 'CBS_OFFERING_ID')
                .closest('.col-md-4')
                .find('a.btn.btn-success')
                .should('be.visible')
                .click({ force: true });

            scrollAndWait();
            cy.contains('button', 'Approve To CGMD', { timeout: 60000 }).should('be.visible').click({ force: true });
            cy.contains('button', 'Yes').should('be.visible').click({ force: true });
            handleAddToUSMP();
        },
        'AlertAndLogout',
        options
    );
};

const _approveProjectCGMDPREMainNotComplex = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-configure',
        (_poName, _poIndex) => () => {
            cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input')
                .type('PP' + Math.floor(Math.random() * 90000) + 10000);
            selectRandomOption('Gprs type');
            cy.wait(500);
            selectRandomOption('Template');
            scrollAndWait();
            handleAddToUSMP();
            cy.contains('button', 'Approve To CGMD Tester', { timeout: 60000 }).should('be.visible').click();
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

// ⚠️ NOTE (unchanged behavior, flagged for review): all three exports below
// point at the exact same implementation with no branching on "Main" vs.
// non-"Main" variants, unlike their SPAD counterparts (_approveSPADSup /
// _approveSPADDoer / _approveSPADTester all take an isComplex/isMainFlow
// flag that changes behavior, e.g. which FinalAction is used). If the
// "Main" flows here are supposed to differ (e.g. use 'StopAfterCore'
// instead of always 'AlertAndLogout' so a longer chained flow can
// continue), that distinction appears to have been lost. Left as-is
// pending confirmation of intended behavior.
export const approveProjectCGMDPREMainNotComplex = _approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREPlugin = _approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREMain = _approveProjectCGMDPREMainNotComplex;

// 🐛 FIX: same missing-options bug as approveProjectCGMD above.
export const approveProjectCGMDtester = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-tester',
        (_poName, _poIndex) => () => {
            scrollAndWait();
            cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectCGMDtesterPRE = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-tester',
        (_poName, _poIndex) => () => {
            scrollAndWait();
            cy.contains('button', 'Promote To Pre Go Live', { timeout: 60000 }).should('be.visible').click();
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectCGMDtesterPREPlugin = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    const pollUntilPromoteReady = (maxAttempts = 24, intervalMs = 5000): void => {
        const attempt = (remaining: number): void => {
            cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
            cy.wait(intervalMs);

            cy.contains('button', 'Refresh Status', { timeout: 15000 })
                .should('be.visible')
                .click();
            scrollAndWait();

            cy.get('body').then(($body) => {
                const $promoteBtn = $body.find('button').filter((_, el) => {
                    const $el = Cypress.$(el);
                    return (
                        $el.text().trim().includes('Promote to Pre Go Live') &&
                        $el.closest('[hidden]').length === 0 &&
                        $el.is(':visible') &&
                        !$el.is(':disabled')
                    );
                });

                if ($promoteBtn.length > 0) {
                    cy.log('✅ Promote to Pre Go Live button is ready');
                } else if (remaining > 0) {
                    attempt(remaining - 1);
                } else {
                    throw new Error('❌ Promote to Pre Go Live button never became available after max attempts');
                }
            });
        };
        attempt(maxAttempts);
    };

    cy.on('window:confirm', () => true);

    loopApproveAllPOs(
        'To Do List',
        '/cgmd/cgmd-tester',
        (_poName, _poIndex) => () => {
            cy.wait(500);
            scrollAndWait();
            cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

            cy.once('window:alert', (alertText) => {
                if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve to Pre Go Live')) {
                    throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
                }
            });

            cy.contains('button', 'Send PlugIN', { timeout: 60000 }).should('be.visible').click();
            clickYesIfExists(10000, 'first');

            pollUntilPromoteReady();

            cy.removeAllListeners('window:alert');

            cy.once('window:alert', (alertText) => {
                if (!alertText.includes('Do you want to Approve to Pre Go Live') && !alertText.includes('Call API Plugin Success')) {
                    throw new Error(`Unexpected alert text (Promote): ${alertText}`);
                }
            });

            cy.contains('button', 'Promote to Pre Go Live', { timeout: 60000 }).should('be.visible').click();
            clickYesIfExists(10000, 'last');
        },
        'StopAfterCore',
        options
    );
};

// ========================
// OTHER APPROVAL FUNCTIONS
// ========================

export const approveProjectACTM = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'Unassigned Task',
        '/actm/actm-doer',
        (_poName, _poIndex) => () => {
            scrollAndWait();
            // ⚠️ NOTE (unchanged, flagged for review): positional selector
            // ':nth-child(3) > :nth-child(4)' has no text/attribute anchor.
            // Any DOM reorder will silently click the wrong element instead
            // of failing the test loudly. Consider anchoring on button text
            // or a stable attribute if one exists.
            cy.get(':nth-child(3) > :nth-child(4)').click();
        },
        'AlertAndLogout',
        options
    );
};

export const approveProjectOPER = (projectName: string): void => {
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];

    const approveAt = (poIndex: number): void => {
        if (poIndex >= poCount) {
            cy.log('✅ All POs approved (OPER)');
            return;
        }

        const poName = allPoNames[poIndex] ?? `PO${poIndex + 1}`;
        cy.log(`🔄 OPER PO ${poIndex + 1}/${poCount}: "${poName}"`);

        createSimplePageApprovalFlow(
            poName,
            'Unassigned Task',
            '/oper/oper-doer',
            () => {
                scrollAndWait();
                cy.get('.col-md-6 > :nth-child(3)').click();
            }
        );

        approveAt(poIndex + 1);
    };

    approveAt(0);
};

export const approveProjectTSCenter = (projectName: string): void => {
    performSimpleClaimAndApprovalRole(
        'tscenter',
        'tscenter',
        (_projectName: string, _options?: { alreadyOnPage?: boolean }) => {
            cy.get('select[formcontrolname="olympus"]').should('be.visible');
            cy.get('select[formcontrolname="olympus"]').select('No');
            cy.get('select[formcontrolname="olympus"]').should('have.value', 'No');
            cy.get('select[formcontrolname="olympus"]')
                .should('not.have.class', 'ng-invalid')
                .and('have.class', 'ng-valid');
            scrollAndWait();
            cy.contains('button', 'Approve').should('be.visible').click({ force: true });
            cy.contains('button', 'Yes').should('be.visible').click();
        }
    );
};

export const approveProjectAPO = (
    projectName: string,
    options?: { alreadyOnPage?: boolean; role?: NavRole }
): void => {
    loopApproveAllPOs(
        'Unassigned Task',
        '/apo/apo-doer',
        (_poName, _poIndex) => () => {
            scrollAndWait();
            cy.contains('button', 'Promote To Pre Go Live').click();
        },
        'AlertAndLogout',
        options
    );
};