import { createFullPageApprovalFlow, createSimplePageApprovalFlow, performSimpleClaimAndApprovalRole } from './claim-approve';
import { scrollAndWait, selectRandomOption, clickYesIfExists, handleAddToUSMP } from './helpers';
import { ApproveFunction, TaskListHeader, CoreTaskCallback, FinalAction } from './config';

// ========================
// SPAD APPROVAL FUNCTIONS
// ========================

const pollUntilSPADDeployReady = (maxAttempts = 24, intervalMs = 5000): void => {
    const attempt = (remaining: number): void => {
        cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
        cy.wait(intervalMs);

        cy.contains('button', 'Refresh Status', { timeout: 15000 })
            .should('be.visible')
            .click();
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
// SPAD Sup — Approve as complex / non-complex
// ─────────────────────────────────────────────
const _approveSPADSup = (projectName: string, isComplex: boolean): void => {
    const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-spad',
        () => {
            cy.then(() => {
                const rnd5 = Math.floor(Math.random() * 90000) + 10000;
                const rnd2 = Math.floor(Math.random() * 90) + 10;

                cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').clear().type(rnd5.toString());
                cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').clear().type(rnd2.toString());
            });

            scrollAndWait();
            cy.contains('button', buttonText, { timeout: 60000 }).should('be.visible').click();
        },
        'ComplexLogout'
    );
};

export const approveProjectSPADSup = (projectName: string): void => _approveSPADSup(projectName, true);
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => _approveSPADSup(projectName, false);
export const approveProjectSPAD = (projectName: string, isComplex = true): void => _approveSPADSup(projectName, isComplex);

// ─────────────────────────────────────────────
// SPAD Doer — Promote to SPAD Tester
// ─────────────────────────────────────────────
const _approveSPADDoer = (projectName: string, isMainFlow: boolean): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-configure',
        () => {
            if (isMainFlow) {
                cy.wait(500);

                // FIX: ใช้ .then() เพื่อดีเลย์การสุ่มค่า Math.random() ไปทำงานตอน Execution Time จริงๆ
                // และใช้ .clear() เพื่อล้างค่าเดิมก่อนพิมพ์ค่าใหม่เสมอ
                const fillRandom = (labelText: string, prefix: string) => {
                    cy.get(`label:contains("${labelText}")`)
                        .parent()
                        .next('div')
                        .find('input')
                        .then(($input) => {
                            const rnd = Math.floor(Math.random() * 90000) + 10000;
                            cy.wrap($input).clear().type(`${prefix}${rnd}`);
                        });
                };

                fillRandom('PACKAGE_TYPE', 'PT');
                fillRandom('PACKAGE_ID (PP ID)', 'PP');
                fillRandom('PACKAGE_SUB_TYPE', 'PST');
            }

            selectRandomOption('Gprs type');
            cy.wait(500);
            selectRandomOption('Template');

            scrollAndWait();
            cy.contains('button', 'Promote To SPAD Tester', { timeout: 60000 }).should('be.visible').click();
        },
        'AlertAndLogout'
    );
};

export const approveProjectSPADDOER = (projectName: string): void => _approveSPADDoer(projectName, false);
export const approveProjectSPADDOERMain = (projectName: string): void => _approveSPADDoer(projectName, true);

// ─────────────────────────────────────────────
// SPAD Tester — Send PlugIN → poll → Promote to SPAD Deploy
// ─────────────────────────────────────────────
const _approveSPADTester = (projectName: string, isMainFlow: boolean): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-tester',
        () => {
            if (isMainFlow) {
                cy.wait(500);
                scrollAndWait();

                cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

                cy.once('window:alert', (alertText) => {
                    if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
                        throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
                    }
                });

                cy.on('window:confirm', () => true);

                // FIX: เพิ่ม .and('not.be.disabled') เพื่อรอให้ปุ่มหาย disabled ก่อน และใส่ { force: true } เพื่อบังคับกด
                cy.contains('button', 'Send PlugIN', { timeout: 60000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });

                clickYesIfExists(10000, 'first');

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
                scrollAndWait();
                cy.contains('button', 'Promote to SPAD Deploy', { timeout: 60000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });
            }
        },
        isMainFlow ? 'StopAfterCore' : 'AlertAndLogout'
    );
};

export const approveProjectSPADTester = (projectName: string): void => _approveSPADTester(projectName, false);
export const approveProjectSPADTesterMain = (projectName: string): void => _approveSPADTester(projectName, true);

// ─────────────────────────────────────────────
// SPAD Deploy — Promote to ACTM
// ─────────────────────────────────────────────
export const approveProjectSPADdeploy = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/actm/actm-doer',
        () => {
            scrollAndWait();
            cy.contains('button', 'Promote To ACTM', { timeout: 60000 }).should('be.visible').click();
        },
        'AlertAndLogout'
    );
};

// ========================
// CGMD APPROVAL FUNCTIONS
// ========================

export const approveProjectCGMD = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-configure',
        () => {
            // Helper function สำหรับสุ่มเลือก mat-option เพียง 1 ค่า
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

            // ---------------------------------------------------------
            // Session DIY
            // ---------------------------------------------------------
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
                    cy.log('⚪ ไม่พบ Session DIY (element ว่างเปล่า หรือไม่มี)');
                }
            });

            // ---------------------------------------------------------
            // SFF Product
            // ---------------------------------------------------------
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
                    cy.log('⚪ ไม่พบ SFF Product (element ว่างเปล่า หรือไม่มี)');
                }
            });

            handleAddToUSMP();
            scrollAndWait();
            cy.get('button[name="CBS"]').should('be.visible', { timeout: 60000 }).click();
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout'
    );
};

export const approveProjectCGMDPRE = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-configure',
        () => {
            const maxDigits = 12;
            const numDigits = Math.floor(Math.random() * maxDigits) + 1;
            const min = Math.pow(10, numDigits - 1);
            const max = Math.pow(10, numDigits) - 1;
            const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

            cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input').type(randomNumber.toString());
            cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('a.btn').first().click();
            scrollAndWait();
            cy.contains('button', 'Approve To CGMD', { timeout: 60000 }).should('be.visible').click({ force: true });
            cy.contains('button', 'Yes').should('be.visible').click({ force: true });
            handleAddToUSMP();
        },
        'AlertAndLogout'
    );
};

export const approveProjectCGMDPREMainNotComplex = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-configure',
        () => {
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
        'AlertAndLogout'
    );
};

export const approveProjectCGMDPREPlugin = approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREMain = approveProjectCGMDPREMainNotComplex;

export const approveProjectCGMDtester = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-tester',
        () => {
            scrollAndWait();
            cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout'
    );
};

export const approveProjectCGMDtesterPRE = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-tester',
        () => {
            scrollAndWait();
            cy.contains('button', 'Promote To Pre Go Live', { timeout: 60000 }).should('be.visible').click();
            cy.contains('button', 'Yes').should('be.visible').click();
        },
        'AlertAndLogout'
    );
};

export const approveProjectCGMDtesterPREPlugin = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'To Do List',
        '/cgmd/cgmd-tester',
        () => {
            cy.wait(500);
            scrollAndWait();
            cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

            cy.once('window:alert', (alertText) => {
                if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve to Pre Go Live')) {
                    throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
                }
            });

            cy.on('window:confirm', () => true);
            cy.contains('button', 'Send PlugIN', { timeout: 60000 }).should('be.visible').click();
            clickYesIfExists(10000, 'first');

            // 🔄 Poll Refresh Status จนปุ่ม Promote to Pre Go Live พร้อม
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
        'StopAfterCore'
    );
};

// ========================
// OTHER APPROVAL FUNCTIONS
// ========================

export const approveProjectACTM = (projectName: string): void => {
    createFullPageApprovalFlow(
        projectName,
        'Unassigned Task',
        '/actm/actm-doer',
        () => {
            scrollAndWait();
            cy.get(':nth-child(3) > :nth-child(4)').click();
        },
        'AlertAndLogout'
    );
};

export const approveProjectOPER = (projectName: string): void => {
    createSimplePageApprovalFlow(
        projectName,
        'Unassigned Task',
        '/oper/oper-doer',
        () => {
            scrollAndWait();
            cy.get('.col-md-6 > :nth-child(3)').click();
        }
    );
};

export const approveProjectTSCenter = (projectName: string): void => {
    performSimpleClaimAndApprovalRole(
        'tscenter',
        'tscenter',
        (projectName: string) => {
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

export const approveProjectAPO = (projectName: string): void => {
    createSimplePageApprovalFlow(
        projectName,
        'Unassigned Task',
        '/apo/apo-doer',
        () => {
            scrollAndWait();
            cy.contains('button', 'Promote To Pre Go Live').click();
        }
    );
};
