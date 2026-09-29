import { createFullPageApprovalFlow, createSimplePageApprovalFlow, performSimpleClaimAndApprovalRole } from './claim-approve';
import { scrollAndWait, selectRandomOption, clickYesIfExists, handleAddToUSMP, waitForLoadingOverlayHidden, waitForVisibleEnabledButton, waitForVisibleEnabledInputByLabel } from './helpers';
import { TaskListHeader, CoreTaskCallback, FinalAction } from './config';
import { navigateToWorkspace, NavRole } from './claim-approve';
import { tscenter, tscenterpass } from './config';
import { ClaimProject, approveProject } from './claim-approve';
import { loginAndWaitReady } from './helpers';
import { getStandardProjectName } from './project-manager';

const roleShouldBeSkipped = (role: NavRole): boolean => {
    const skip = Cypress.env('skipApprovalRoles');
    if (!skip) return false;
    try {
        if (Array.isArray(skip)) {
            return skip.map(s => String(s).toUpperCase()).includes(String(role).toUpperCase());
        }
        if (typeof skip === 'string') {
            return skip.split(',').map(s => s.trim().toUpperCase()).includes(String(role).toUpperCase());
        }
    }
    catch (e) {
        // ignore parsing errors and don't skip
    }
    return false;
};
const LOADER_SELECTOR = '.loading-curtain, .spinner, [class*="loading"]:visible';
const waitForLoadingState = (): void => {
    cy.get('body').then(($body) => {
        const hasActiveLoader = $body.find(LOADER_SELECTOR).length > 0;
        if (hasActiveLoader) {
            cy.get(LOADER_SELECTOR, { timeout: 50000 }).should('not.exist');
        }
        else {
            cy.wait(500);
        }
    });
};

const selectMatSelectIfInteractive = (labelText: string): void => {
    cy.get('body').then($body => {
        const $labelEl = $body.find('label').filter((_, el) =>
            Cypress.$(el).text().trim().replace(/\s*:\s*$/, '') === labelText
        );

        if ($labelEl.length === 0) {
            cy.log(`ℹ️ Label "${labelText}" not found on screen — skipping`);
            return;
        }

        const $container = $labelEl.first().closest('div').next('div');
        const $matSelect = $container.find('mat-select');
        const $readonlyInput = $container.find('input[readonly]');

        if ($matSelect.length === 0) {
            if ($readonlyInput.length > 0) {
                cy.log(`ℹ️ "${labelText}" is a readonly display field — skipping`);
            } else {
                cy.log(`ℹ️ "${labelText}" field structure not recognized — skipping`);
            }
            return;
        }

        if ($matSelect.attr('aria-disabled') === 'true') {
            cy.log(`ℹ️ "${labelText}" mat-select is disabled — skipping`);
            return;
        }

        cy.log(`✅ "${labelText}" is an interactive mat-select — selecting via keyboard`);

        // ✅ live query เพื่อให้ Cypress retry จน element พร้อมจริงตอน execute (กัน detached element)
        const getMatSelect = () =>
            cy.contains('label', new RegExp(`^${labelText}\\s*:?\\s*$`))
                .closest('div')
                .next('div')
                .find('mat-select');

        // ✅ ถ้า panel เปิดค้างจาก interaction ก่อนหน้า ปิดก่อนด้วย {esc}
        getMatSelect()
            .scrollIntoView()
            .should('be.visible')
            .then(($el) => {
                if ($el.attr('aria-expanded') === 'true') {
                    cy.log(`⚠️ "${labelText}" panel เปิดค้างอยู่ — ปิดก่อนด้วย {esc}`);
                    cy.wrap($el).type('{esc}', { force: true });
                    cy.wait(200);
                }
            });

        // ✅ เปิด panel ด้วยคีย์บอร์ด (Enter) แทน click — robust กว่ามากสำหรับ mat-select ของ Angular Material
        getMatSelect()
            .focus()
            .type('{enter}', { force: true });

        // ✅ verify panel เปิดจริง ก่อนไปหา option — ถ้าไม่เจอ dump HTML ช่วย debug
        cy.get('body').then(($b) => {
            if ($b.find('.cdk-overlay-container mat-option').length === 0) {
                cy.log(`⚠️ "${labelText}" — ไม่พบ overlay panel เปิดขึ้นมาหลังกด Enter, ลองคลิกซ้ำเป็น fallback`);
                getMatSelect().click({ force: true });
            }
        });

        cy.get('.cdk-overlay-container mat-option', { timeout: 10000 })
            .should('have.length.greaterThan', 0)
            .then($options => {
                const randomIndex = Math.floor(Math.random() * $options.length);
                cy.wrap($options.eq(randomIndex)).click({ force: true });
            });

        // ✅ กัน overlay ค้างบัง element ถัดไป
        cy.get('body').then($b => {
            if ($b.find('.cdk-overlay-container mat-option').filter(':visible').length > 0) {
                cy.get('body').type('{esc}', { force: true });
            }
        });
    });
};

const loopApproveAllPOs = (taskListHeader: TaskListHeader, expectedUrl: string, buildCoreCallback: (poName: string, poIndex: number) => CoreTaskCallback, lastFinalAction: FinalAction, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
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
        createFullPageApprovalFlow(poName, taskListHeader, expectedUrl, buildCoreCallback(poName, poIndex), finalAction, poIndex === 0 ? options : undefined);
        if (!isLast) {
            waitForLoadingState();
            navigateToWorkspace({ role: options?.role });
        }
        approveAt(poIndex + 1);
    };
    approveAt(0);
};
const pollUntilSPADDeployReady = (maxAttempts = 3, intervalMs = 5000): void => {
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
        cy.contains('button', 'Refresh Status', { timeout: 150000 })
            .should('be.visible')
            .click({ force: true });
        scrollAndWait();
        cy.get('body').then(($body) => {
            const $btn = $body.find('button').filter((_, el) => {
                const $el = Cypress.$(el);
                return ($el.text().trim().includes('Promote to SPAD Deploy') &&
                    $el.closest('[hidden]').length === 0 &&
                    $el.is(':visible') &&
                    !$el.is(':disabled'));
            });
            if ($btn.length > 0) {
                cy.log('✅ Promote to SPAD Deploy button is ready');
            }
            else if (remaining > 0) {
                attempt(remaining - 1);
            }
            else {
                throw new Error('❌ Promote to SPAD Deploy button never became available after max attempts');
            }
        });
    };
    attempt(maxAttempts);
};
const _approveSPADSup = (projectName: string, isComplex: boolean, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

    loopApproveAllPOs('To Do List', '/cgmd/cgmd-spad', (_poName, _poIndex) => () => {
        cy.then(() => {
            waitForLoadingState();

            const rnd5 = Math.floor(Math.random() * 90000) + 10000;
            const rnd2 = Math.floor(Math.random() * 90) + 10;

            const fillRandomIfExists = (labelText: string, value: string) => {
                cy.get('body').then($body => {
                    const found = $body.find(`label:contains("${labelText}")`).length > 0;

                    if (!found) {
                        cy.log(`ℹ️ Label "${labelText}" not found on screen — skipping`);
                        return;
                    }

                    cy.contains('label', labelText).closest('.col-md-4').find('input').scrollIntoView();

                    waitForVisibleEnabledInputByLabel(labelText, 60000).then((ok) => {
                        if (!ok) {
                            cy.contains('label', labelText).closest('.col-md-4').then($c => {
                                cy.log(`⚠️ ${labelText} input never became enabled — dumping HTML for debug`);
                                cy.log($c.html());
                            });
                            throw new Error(`❌ ${labelText} input did not become enabled within timeout`);
                        }

                        // ✅ retry clear+type จนกว่าค่าจะตรงจริง กัน partial-type / re-render ตัดคำระหว่างพิมพ์
                        // (เหมือนที่แก้ไว้ใน _approveSPADDoer แล้ว — ปัญหาเดียวกัน)
                        const attemptFill = (attemptsLeft: number): void => {
                            cy.contains('label', labelText).closest('.col-md-4').find('input')
                                .click({ force: true })
                                .type('{selectall}{backspace}', { force: true });

                            cy.contains('label', labelText).closest('.col-md-4').find('input')
                                .then($input => {
                                    const currentVal = $input.val();
                                    if (currentVal !== '') {
                                        cy.log(`⚠️ ${labelText} ยังไม่ถูกเคลียร์ (ค่าปัจจุบัน: "${currentVal}") — force clear ผ่าน invoke`);
                                        cy.wrap($input).invoke('val', '').trigger('input').trigger('change');
                                    }
                                });

                            cy.contains('label', labelText).closest('.col-md-4').find('input')
                                .type(value, { force: true, delay: 50 });

                            cy.contains('label', labelText).closest('.col-md-4').find('input')
                                .then($input => {
                                    const finalVal = $input.val();
                                    if (finalVal !== value) {
                                        if (attemptsLeft > 0) {
                                            cy.log(`⚠️ ${labelText} ค่าไม่ตรง (ได้ "${finalVal}" ต้องการ "${value}") — retry อีก ${attemptsLeft} ครั้ง`);
                                            attemptFill(attemptsLeft - 1);
                                        } else {
                                            throw new Error(`❌ ${labelText} ค่าไม่ตรงหลัง retry ครบแล้ว: ได้ "${finalVal}" ต้องการ "${value}"`);
                                        }
                                    } else {
                                        cy.log(`✅ ${labelText} กรอกค่าสำเร็จ: "${finalVal}"`);
                                    }
                                });
                        };

                        attemptFill(3); // ลองสูงสุด 3 รอบ
                    });
                });
            };

            fillRandomIfExists('FEATURE_SUB_CODE', rnd5.toString());
            fillRandomIfExists('GROUP_FEATURE', rnd2.toString());
        });

        scrollAndWait();
        waitForLoadingState();

        cy.get('body').then($body => {
            const $btn = $body.find(`button:contains("${buttonText}")`);

            if ($btn.length === 0) {
                cy.log(`ℹ️ "${buttonText}" button not found — skipping`);
                return;
            }

            cy.contains('button', buttonText, { timeout: 60000000 })
                .should('be.visible')
                .click();

            clickYesIfExists(10000, 'last');
            waitForLoadingState();
        });
    }, 'AlertAndLogout', options);
};

export const approveProjectSPADSup = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => _approveSPADSup(projectName, true, options);
export const approveProjectSPADSupCGMDPlugin = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => _approveSPADSup(projectName, false, options);
export const approveProjectSPAD = (projectName: string, isComplex = true, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => _approveSPADSup(projectName, isComplex, options);
const _approveSPADDoer = (projectName: string, isMainFlow: boolean, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-configure', (_poName, _poIndex) => () => {
        waitForLoadingState();

        const fillRandomIfExists = (labelText: string, prefix: string) => {
            cy.get('body').then($body => {
                const $label = $body.find(`label:contains("${labelText}")`).filter((_, el) => {
                    return new RegExp(labelText).test(Cypress.$(el).text());
                });

                if ($label.length === 0) {
                    cy.log(`ℹ️ Label "${labelText}" not found on screen — skipping`);
                    return;
                }

                cy.contains('label', new RegExp(labelText))
                    .parent()
                    .next('div')
                    .find('input')
                    .scrollIntoView();

                waitForVisibleEnabledInputByLabel(labelText, 60000).then((ok) => {
                    if (!ok) {
                        cy.contains('label', new RegExp(labelText)).parent().next('div').then($c => {
                            cy.log(`⚠️ ${labelText} input never became enabled — dumping HTML for debug`);
                            cy.log($c.html());
                        });
                        throw new Error(`❌ ${labelText} input did not become enabled within timeout`);
                    }

                    const targetValue = `${prefix}${Math.floor(Math.random() * 90000) + 10000}`;

                    // ✅ retry clear+type จนกว่าค่าจะตรงจริง (เหมือน _approveSPADDoer)
                    const attemptFill = (attemptsLeft: number): void => {
                        cy.contains('label', new RegExp(labelText)).parent().next('div').find('input')
                            .click({ force: true })
                            .type('{selectall}{backspace}', { force: true });

                        cy.contains('label', new RegExp(labelText)).parent().next('div').find('input')
                            .then($input => {
                                const currentVal = $input.val();
                                if (currentVal !== '') {
                                    cy.log(`⚠️ ${labelText} ยังไม่ถูกเคลียร์ (ค่าปัจจุบัน: "${currentVal}") — force clear ผ่าน invoke`);
                                    cy.wrap($input).invoke('val', '').trigger('input').trigger('change');
                                }
                            });

                        cy.contains('label', new RegExp(labelText)).parent().next('div').find('input')
                            .type(targetValue, { force: true, delay: 50 });

                        cy.contains('label', new RegExp(labelText)).parent().next('div').find('input')
                            .then($input => {
                                const finalVal = $input.val();
                                if (finalVal !== targetValue) {
                                    if (attemptsLeft > 0) {
                                        cy.log(`⚠️ ${labelText} ค่าไม่ตรง (ได้ "${finalVal}" ต้องการ "${targetValue}") — retry อีก ${attemptsLeft} ครั้ง`);
                                        attemptFill(attemptsLeft - 1);
                                    } else {
                                        throw new Error(`❌ ${labelText} ค่าไม่ตรงหลัง retry ครบแล้ว: ได้ "${finalVal}" ต้องการ "${targetValue}"`);
                                    }
                                } else {
                                    cy.log(`✅ ${labelText} กรอกค่าสำเร็จ: "${finalVal}"`);
                                }
                            });
                    };

                    attemptFill(3);
                });
            });
        };

        fillRandomIfExists('PACKAGE_TYPE', 'PT');
        fillRandomIfExists('PACKAGE_ID (PP ID)', 'PP');
        fillRandomIfExists('PACKAGE_SUB_TYPE', 'PST');

        selectMatSelectIfInteractive('Gprs type');
        cy.wait(500);
        waitForLoadingState();
        selectMatSelectIfInteractive('Template');

        scrollAndWait();

        cy.get('body').then($body => {
            const $btn = $body.find('button:contains("Promote To SPAD Tester")');

            if ($btn.length === 0) {
                cy.log('ℹ️ "Promote To SPAD Tester" button not found — skipping');
                return;
            }

            cy.contains('button', 'Promote To SPAD Tester', { timeout: 60000000 })
                .should('be.visible')
                .click();

            clickYesIfExists(10000, 'last');
            waitForLoadingState();
        });
    }, 'AlertAndLogout', options);
};
export const approveProjectSPADDOER = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => _approveSPADDoer(projectName, false, options);
export const approveProjectSPADDOERMain = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => _approveSPADDoer(projectName, true, options);
const _approveSPADTester = (projectName: string, isMainFlow: boolean, options?: {
    alreadyOnPage?: boolean;
    skipLogout?: boolean;
    role?: NavRole;
}): void => {
    cy.on('window:confirm', () => true);
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-tester', (_poName, _poIndex) => () => {
        scrollAndWait();
        waitForLoadingState();
        waitForLoadingOverlayHidden(120000);
        const isPrePaidMain = isMainFlow && /pre[-\s_]?paid/i.test(projectName);
        const sendPluginTimeout = isPrePaidMain ? 180000 : isMainFlow ? 120000 : 5000;

        waitForVisibleEnabledButton('Send PlugIN', sendPluginTimeout).then((hasSendPlugin) => {
            if (hasSendPlugin) {
                cy.once('window:alert', (alertText) => {
                    if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
                        throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
                    }
                });
                cy.intercept('GET', '/api/SendPluginMain_v2/').as('sendPluginApi');
                cy.contains('button', 'Send PlugIN', { timeout: 1000000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });
                cy.contains('.modal-body', 'Do you want to Send API PlugIN', { timeout: 1000000 })
                    .should('be.visible')
                    .within(() => {
                        cy.contains('button', 'Yes').click({ force: true });
                    });
                cy.wait('@sendPluginApi', { timeout: 1200000 }).then((interception) => {
                    const statusCode = interception.response?.statusCode ?? 0;
                    expect(statusCode, 'sendPluginApi status').to.be.oneOf([200, 304]);
                });
                waitForLoadingState();
                pollUntilSPADDeployReady();
                cy.removeAllListeners('window:alert');
                cy.once('window:alert', (alertText) => {
                    if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
                        throw new Error(`Unexpected alert text (Promote): ${alertText}`);
                    }
                });
                cy.contains('button', 'Promote to SPAD Deploy', { timeout: 120000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });

                // ✅ แก้ไข: ใช้ smartClickYesIfExists แทน clickYesIfExists(10000, 'last')
                smartClickYesIfExists();
            } else {
                cy.log('⚠️ Send PlugIN not found within timeout — skipping to Promote directly');
                cy.contains('button', 'Promote to SPAD Deploy', { timeout: 1200000 })
                    .should('be.visible')
                    .and('not.be.disabled')
                    .click({ force: true });
                smartClickYesIfExists();
                waitForLoadingState();
            }
        });
    }, isMainFlow ? 'StopAfterCore' : 'AlertAndLogout', options);
};
export const approveProjectSPADTester = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    skipLogout?: boolean;
    role?: NavRole;
}): void => _approveSPADTester(projectName, false, options);
export const approveProjectSPADTesterMain = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    skipLogout?: boolean;
    role?: NavRole;
}): void => _approveSPADTester(projectName, true, options);
export const approveProjectSPADdeploy = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/actm/actm-doer', (_poName, _poIndex) => () => {
        waitForLoadingState();
        scrollAndWait();
        cy.contains('button', 'Promote To ACTM', { timeout: 60000000 }).should('be.visible').click();
    }, 'AlertAndLogout', options);
};
const DIY_DETECT_TIMEOUT = 15000;
const waitForDiySessionPresence = (timeout = DIY_DETECT_TIMEOUT): Cypress.Chainable<boolean> => {
    const startedAt = Date.now();
    const check = (): Cypress.Chainable<boolean> => {
        return cy.get('body', { log: false }).then(($body) => {
            const hasDiy = $body.find('app-diy-description mat-select').length > 0;
            if (hasDiy) {
                return cy.wrap(true, { log: false });
            }
            if (Date.now() - startedAt < timeout) {
                return cy.wait(300, { log: false }).then(() => check());
            }
            cy.log(`⚠️ ไม่พบ mat-select ของ DIY หลัง poll ${timeout}ms — สรุปว่าไม่มี Session DIY`);
            return cy.wrap(false, { log: false });
        });
    };
    return check();
};

export const approveProjectCGMD = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-configure', (_poName, _poIndex) => () => {
        cy.wait(3000);
        waitForLoadingState();
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

        // ✅ กดปุ่ม Save ของ DIY panel ทุกครั้งหลังเลือกค่า (SO ID และแต่ละแถว Unit Name)
        const clickDiySave = () => {
            cy.get('app-diy-description button.btn-primary')
                .contains('Save')
                .scrollIntoView()
                .click({ force: true });
            waitForLoadingState();
        };

        waitForDiySessionPresence().then((hasDiySession) => {
            if (hasDiySession) {
                cy.log('🟢 พบ Session DIY - กำลังดำเนินการตั้งค่า');
                cy.get('app-diy-description .panel-heading').contains('DIY').click();
                cy.get('app-diy-description')
                    .contains('.col-md-1', 'SO ID :')
                    .next('.col-md-4')
                    .find('mat-select')
                    .click();
                waitForLoadingState();
                selectSingleRandomMatOption();

                // ✅ เลือก SO ID แล้วต้องกด Save ทันที
                clickDiySave();

                cy.get('body').then(($b) => {
                    const rows = $b.find('app-diy-description table tbody tr');
                    if (rows.length === 0) {
                        cy.log('⚠️ DIY table ไม่มีแถว — ข้ามการสุ่ม Unit Name');
                    }
                    else {
                        cy.log(`✅ DIY table พบ ${rows.length} แถว — กำลังสุ่ม Unit Name`);
                        cy.wrap(rows).each(($tr) => {
                            if ($tr.find('mat-select').length > 0) {
                                const typeName = $tr.find('td.text-left').text().trim();
                                cy.log(`🔧 กำลังสุ่มเลือกข้อมูลให้กับ: ${typeName}`);
                                cy.wrap($tr).find('mat-select').click();
                                selectSingleRandomMatOption();
                                waitForLoadingState();

                                // ✅ เลือก Unit Name ของแต่ละแถวแล้วต้องกด Save ทันที
                                clickDiySave();
                            }
                        });
                    }
                });
            }
            else {
                cy.log('⚪ ไม่พบ Session DIY');
            }
        });

        // ✅ SFF Product: เพิ่ม type selection ก่อนกด Save
        cy.get('body').then(($body) => {
            if ($body.find('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]').length > 0) {
                cy.log('🟢 พบ SFF Product - กำลังดำเนินการกรอกข้อมูล');
                const randomCommunityId = Cypress._.random(1000000000, 9999999999).toString();

                // ✅ retry clear+type จนกว่าค่าจะตรงจริง กัน partial-type / re-render ตัดคำระหว่างพิมพ์
                const attemptFillCommunityId = (attemptsLeft: number): void => {
                    cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
                        .should('be.visible')
                        .should('not.be.disabled')
                        .click({ force: true })
                        .type('{selectall}{backspace}', { force: true });

                    cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
                        .then($input => {
                            const currentVal = $input.val();
                            if (currentVal !== '') {
                                cy.log(`⚠️ communityGroupId ยังไม่ถูกเคลียร์ (ค่าปัจจุบัน: "${currentVal}") — force clear ผ่าน invoke`);
                                cy.wrap($input).invoke('val', '').trigger('input').trigger('change');
                            }
                        });

                    cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
                        .type(randomCommunityId, { force: true, delay: 50 });

                    cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
                        .then($input => {
                            const finalVal = $input.val();
                            if (finalVal !== randomCommunityId) {
                                if (attemptsLeft > 0) {
                                    cy.log(`⚠️ communityGroupId ค่าไม่ตรง (ได้ "${finalVal}" ต้องการ "${randomCommunityId}") — retry อีก ${attemptsLeft} ครั้ง`);
                                    attemptFillCommunityId(attemptsLeft - 1);
                                } else {
                                    throw new Error(`❌ communityGroupId ค่าไม่ตรงหลัง retry ครบแล้ว: ได้ "${finalVal}" ต้องการ "${randomCommunityId}"`);
                                }
                            } else {
                                cy.log(`✅ communityGroupId กรอกค่าสำเร็จ: "${finalVal}"`);
                            }
                        });
                };

                attemptFillCommunityId(3);
                waitForLoadingState();

                // ✅ เลือก type ถ้ามี dropdown อยู่ในฟอร์ม SFF Product นี้
                cy.get('app-sff-template-cgmd-addition').then(($sff) => {
                    const $typeSelect = $sff.find('select[formcontrolname="type"], select[formcontrolname="sffType"]').filter(':visible');
                    if ($typeSelect.length > 0) {
                        cy.wrap($typeSelect.first()).then(($select) => {
                            const el = $select.get(0) as HTMLSelectElement;
                            const opts = [...el.querySelectorAll('option:not([disabled])')] as HTMLOptionElement[];
                            const validOpts = opts.filter(o => o.value && o.value !== 'null' && o.value !== '');
                            if (validOpts.length > 0) {
                                const randomOpt = validOpts[Cypress._.random(0, validOpts.length - 1)];
                                cy.log(`🎯 เลือก SFF Product type: "${randomOpt.text}"`);
                                cy.wrap($select).select(randomOpt.value, { force: true });
                            }
                            else {
                                cy.log('⚠️ SFF Product type dropdown ไม่มี option ที่เลือกได้');
                            }
                        });
                    }
                    else {
                        cy.log('⏭️ ไม่พบ type dropdown ใน SFF Product — ข้าม');
                    }
                });

                waitForLoadingState();
                cy.get('app-sff-template-cgmd-addition button.btn-success').contains('Save').click();
            }
            else {
                cy.log('⚪ ไม่พบ SFF Product');
            }
        });

        handleAddToUSMP();
        scrollAndWait();
        cy.get('button[name="CBS"]').should('be.visible', { timeout: 6000000000 }).click();
        cy.contains('button', 'Yes').should('be.visible').click();
    }, 'AlertAndLogout', options);
};

export const approveProjectCGMDPRE = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-configure', (_poName, _poIndex) => () => {
        cy.wait(3000);
        const maxDigits = 12;
        const numDigits = Math.floor(Math.random() * maxDigits) + 1;
        const min = Math.pow(10, numDigits - 1);
        const max = Math.pow(10, numDigits) - 1;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        const targetValue = randomNumber.toString();

        cy.contains('label', 'CBS_OFFERING_ID')
            .closest('.col-md-4')
            .find('input')
            .scrollIntoView();

        waitForVisibleEnabledInputByLabel('CBS_OFFERING_ID', 60000).then((ok) => {
            if (!ok) {
                cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').then($c => {
                    cy.log('⚠️ CBS_OFFERING_ID input never became enabled — dumping HTML for debug');
                    cy.log($c.html());
                });
                throw new Error('❌ CBS_OFFERING_ID input did not become enabled within timeout');
            }

            // ✅ retry clear+type จนกว่าค่าจะตรงจริง (เหมือน _approveSPADDoer)
            const attemptFill = (attemptsLeft: number): void => {
                cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input')
                    .click({ force: true })
                    .type('{selectall}{backspace}', { force: true });

                cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input')
                    .then($input => {
                        const currentVal = $input.val();
                        if (currentVal !== '') {
                            cy.log(`⚠️ CBS_OFFERING_ID ยังไม่ถูกเคลียร์ (ค่าปัจจุบัน: "${currentVal}") — force clear ผ่าน invoke`);
                            cy.wrap($input).invoke('val', '').trigger('input').trigger('change');
                        }
                    });

                cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input')
                    .type(targetValue, { force: true, delay: 50 });

                cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input')
                    .then($input => {
                        const finalVal = $input.val();
                        if (finalVal !== targetValue) {
                            if (attemptsLeft > 0) {
                                cy.log(`⚠️ CBS_OFFERING_ID ค่าไม่ตรง (ได้ "${finalVal}" ต้องการ "${targetValue}") — retry อีก ${attemptsLeft} ครั้ง`);
                                attemptFill(attemptsLeft - 1);
                            } else {
                                throw new Error(`❌ CBS_OFFERING_ID ค่าไม่ตรงหลัง retry ครบแล้ว: ได้ "${finalVal}" ต้องการ "${targetValue}"`);
                            }
                        } else {
                            cy.log(`✅ CBS_OFFERING_ID กรอกค่าสำเร็จ: "${finalVal}"`);
                        }
                    });
            };

            attemptFill(3);
        });

        cy.contains('label', 'CBS_OFFERING_ID')
            .closest('.col-md-4')
            .then($container => {
                const $btn = $container.find('a.btn.btn-success');

                if ($btn.length === 0) {
                    cy.log('ℹ️ CBS success button not found on screen — skipping');
                    return;
                }

                cy.wrap($btn)
                    .should('be.visible')
                    .should('not.be.disabled')
                    .then($b => {
                        if ($b.prop('disabled') || $b.attr('aria-disabled') === 'true') {
                            cy.log('⚠️ CBS success button is disabled but test expected it enabled');
                            throw new Error('CBS success button is disabled');
                        }
                        cy.wrap($b).click({ force: true });
                    });
            });
        scrollAndWait();
        handleAddToUSMP();
        waitForLoadingState();
        cy.contains('button', 'Approve To CGMD', { timeout: 60000000 })
            .should('be.visible')
            .and('not.be.disabled')
            .click();
        cy.on('window:confirm', () => true);
        clickYesIfExists(10000, 'last');
        waitForLoadingState();
    }, 'AlertAndLogout', options);
};
const _approveProjectCGMDPREMainNotComplex = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-configure', (_poName, _poIndex) => () => {
        cy.wait(3000);   // ✅ ให้ฟอร์มมีเวลาโหลดก่อน เหมือน SPADDoer
        waitForLoadingState();

        const fillRandomIfExists = (labelText: string, prefix: string) => {
            cy.get('body').then($body => {
                const $label = $body.find(`label:contains("${labelText}")`).filter((_, el) => {
                    return new RegExp(labelText).test(Cypress.$(el).text());
                });

                if ($label.length === 0) {
                    cy.log(`ℹ️ Label "${labelText}" not found on screen — skipping`);
                    return;
                }

                cy.contains('label', new RegExp(labelText))
                    .parent()
                    .next('div')
                    .find('input')
                    .scrollIntoView();

                waitForVisibleEnabledInputByLabel(labelText, 60000).then((ok) => {
                    if (!ok) {
                        cy.contains('label', new RegExp(labelText)).parent().next('div').then($c => {
                            cy.log(`⚠️ ${labelText} input never became enabled — dumping HTML for debug`);
                            cy.log($c.html());
                        });
                        throw new Error(`❌ ${labelText} input did not become enabled within timeout`);
                    }
                    cy.contains('label', new RegExp(labelText))
                        .parent()
                        .next('div')
                        .find('input')
                        .clear({ force: true })
                        .type(`${prefix}${Math.floor(Math.random() * 90000) + 10000}`, { force: true });
                });
            });
        };

        fillRandomIfExists('PACKAGE_ID \\(PP ID\\)', 'PP');   // ✅ ข้ามถ้าไม่มี field, รอ enabled ก่อนพิมพ์ถ้ามี
        selectMatSelectIfInteractive('Gprs type');
        cy.wait(500);   // ✅ เว้นช่วงระหว่าง select ให้ dropdown ถัดไป render
        waitForLoadingState();
        selectMatSelectIfInteractive('Template');

        scrollAndWait();
        handleAddToUSMP();
        waitForLoadingState();

        cy.get('body').then($body => {
            const $btn = $body.find('button:contains("Approve To CGMD Tester")');

            if ($btn.length === 0) {
                cy.log('ℹ️ "Approve To CGMD Tester" button not found — skipping');
                return;
            }

            cy.contains('button', 'Approve To CGMD Tester', { timeout: 60000000 })
                .should('be.visible')
                .click();

            clickYesIfExists(10000, 'last');
            waitForLoadingState();
        });
    }, 'AlertAndLogout', options);
};
export const approveProjectCGMDPREMainNotComplex = _approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREPlugin = _approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREMain = _approveProjectCGMDPREMainNotComplex;
const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();
const isMatchSpanText = (el: HTMLElement, matcher: string | RegExp): boolean => {
    const text = normalizeText(el.innerText || el.textContent || '');
    if (typeof matcher === 'string') {
        return text === normalizeText(matcher);
    }
    return matcher.test(text);
};
export const clickSpanOrFallback = (primaryText: string | RegExp, fallbackText: string | RegExp): void => {
    cy.get('body').then(($body) => {
        const spans = $body.find('span').toArray() as HTMLElement[];
        const primaryEl = spans.find((el) => isMatchSpanText(el, primaryText) && Cypress.dom.isVisible(el));
        const fallbackEl = spans.find((el) => isMatchSpanText(el, fallbackText) && Cypress.dom.isVisible(el));
        if (primaryEl) {
            cy.wrap(primaryEl).should('be.visible').click({ force: true });
        }
        else if (fallbackEl) {
            cy.wrap(fallbackEl).should('be.visible').click({ force: true });
        }
        else {
            throw new Error(`ไม่เจอปุ่ม span: ${String(primaryText)} หรือ ${String(fallbackText)}`);
        }
    });
};
export const approveProjectCGMDtester = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-tester', (_poName, _poIndex) => () => {
        waitForLoadingState();
        scrollAndWait();
        cy.get('body').then(($body) => {
            if ($body.find('span:contains("Promote to ACTM")').length > 0) {
                cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
            }
            else {
                cy.contains('span', 'Approve').should('be.visible').click({ force: true });
            }
        });
        cy.contains('button', 'Yes').should('be.visible').click();
    }, 'AlertAndLogout', options);
};
export const approveProjectCGMDtesterPRE = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-tester', (_poName, _poIndex) => () => {
        waitForLoadingState();
        scrollAndWait();
        cy.contains('button', 'Promote To Pre Go Live', { timeout: 6000000000 }).should('be.visible').click();
        cy.contains('button', 'Yes').should('be.visible').click();
    }, 'AlertAndLogout', options);
};
export const approveProjectCGMDtesterPREPlugin = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    const pollUntilPromoteReady = (maxAttempts = 3, intervalMs = 5000): void => {
        const attempt = (remaining: number): void => {
            cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
            cy.wait(intervalMs);
            cy.contains('button', 'Refresh Status', { timeout: 1500000 })
                .should('be.visible')
                .click();
            scrollAndWait();
            cy.get('body').then(($body) => {
                const $promoteBtn = $body.find('button').filter((_, el) => {
                    const $el = Cypress.$(el);
                    return ($el.text().trim().includes('Promote to Pre Go Live') &&
                        $el.closest('[hidden]').length === 0 &&
                        $el.is(':visible') &&
                        !$el.is(':disabled'));
                });
                if ($promoteBtn.length > 0) {
                    cy.log('✅ Promote to Pre Go Live button is ready');
                }
                else if (remaining > 0) {
                    attempt(remaining - 1);
                }
                else {
                    throw new Error('❌ Promote to Pre Go Live button never became available after max attempts');
                }
            });
        };
        attempt(maxAttempts);
    };
    cy.on('window:confirm', () => true);
    loopApproveAllPOs('To Do List', '/cgmd/cgmd-tester', (_poName, _poIndex) => () => {
        waitForLoadingState();
        scrollAndWait();
        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');
        cy.once('window:alert', (alertText) => {
            if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve to Pre Go Live')) {
                throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
            }
        });
        cy.contains('button', 'Send PlugIN', { timeout: 6000000000 }).should('be.visible').click();
        clickYesIfExists(1000000, 'first');

        cy.wait('@sendPluginApi', { timeout: 1200000 }).then((interception) => {
            const statusCode = interception.response?.statusCode ?? 0;
            expect(statusCode, 'sendPluginApi status').to.be.oneOf([200, 304]);
        });

        pollUntilPromoteReady();
        cy.removeAllListeners('window:alert');
        cy.once('window:alert', (alertText) => {
            if (!alertText.includes('Do you want to Approve to Pre Go Live') && !alertText.includes('Call API Plugin Success')) {
                throw new Error(`Unexpected alert text (Promote): ${alertText}`);
            }
        });
        cy.contains('button', 'Promote to Pre Go Live', { timeout: 6000000000 }).should('be.visible').click();
        clickYesIfExists(1000000, 'last');
    }, 'StopAfterCore', options);
};
const buildSearchMatcher = (poName: string): ((rowText: string) => boolean) => {
    // ชื่อแบบเดิมที่มี "_" → คง behavior เดิมทุกอย่าง
    if (poName.includes('_')) {
        const kw = poName.split('_')[0].trim();
        return (t) => t.includes(kw);
    }
    // ชื่อแบบมีเลข PO คั่นกลาง เช่น "MOB POST ORD FEE PO1 0928 1305"
    const m = poName.match(/^(.*?)\s+PO\d+\s+(.+)$/i);
    if (!m) return (t) => t.includes(poName.trim());
    const prefix = m[1].trim();
    const suffix = m[2].trim();
    return (t) => t.includes(prefix) && t.includes(suffix);
};
const approveFromUnassignedTask = (expectedUrl: string, role: NavRole, coreAction: (poName: string, poIndex: number) => void, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    if (roleShouldBeSkipped(role)) {
        cy.log(`⏭️ Skipping ${role} per skipApprovalRoles flag`);
        cy.log(`✅ All POs approved (${role}) - skipped by flag`);
        return;
    }
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
    const approveAt = (poIndex: number): void => {
        if (poIndex >= poCount) {
            cy.log(`✅ All POs approved (${role})`);
            return;
        }
        const poName = allPoNames[poIndex] ?? `PO${poIndex + 1}`;
        const isLast = poIndex === poCount - 1;
        cy.log(`🔄 ${role} PO ${poIndex + 1}/${poCount}: "${poName}"`);
        const skipClick = poIndex === 0 && options?.alreadyOnPage;
        if (skipClick) {
            cy.log(`⏭️ [${role}] Already on detail page — skip click from Unassigned Task`);
            cy.url({ timeout: 3000000 }).should('include', expectedUrl);
        }
        else {
            cy.log(`⏳ [${role}] กำลังค้นหา "${poName}" ใน Unassigned Task (รองรับ pagination)...`);
            const matches = buildSearchMatcher(poName);
            const searchKeyword = poName.includes('_') ? poName.split('_')[0].trim() : poName; // ใช้แสดงใน log เท่านั้น
            const findAndClickPO = (currentPage: number = 1): void => {
                cy.log(`🔍 [${role}] ค้นหาในหน้า ${currentPage} ด้วย keyword: "${searchKeyword}"`);
                cy.get('h3:contains("Unassigned Task")', { timeout: 3000000 }).should('be.visible');
                cy.wait(3000);
                cy.get('body').then(($body) => {
                    const $table = $body.find('h3:contains("Unassigned Task")').parent().find('table');
                    const $rows = $table.find('tbody tr');
                    const foundRow = $rows.filter((_, row) => {
                        const rowText = Cypress.$(row).text();
                        return matches(rowText);
                    }).first();
                    if (foundRow.length > 0) {
                        cy.log(`✅ [${role}] พบ PO ในหน้า ${currentPage} — กำลังคลิก`);
                        cy.wrap(foundRow)
                            .should('be.visible')
                            .click({ force: true });
                        cy.url({ timeout: 3000000 }).should('include', expectedUrl);
                        cy.wait(5000);
                        coreAction(poName, poIndex);
                        if (!isLast) {
                            cy.log(`⏳ [${role}] กลับไปหน้า Unassigned Task เพื่อ Approve PO ถัดไป...`);
                            navigateToWorkspace({ role: options?.role ?? role });
                            cy.get('h3:contains("Unassigned Task")', { timeout: 3000000 }).should('be.visible');
                            waitForLoadingState();
                            cy.get('h3:contains("Unassigned Task")').parent().find('table tbody tr', { timeout: 3000000 })
                                .should(($rows) => {
                                    const text = $rows.text();
                                    expect(text, 'ตารางต้องไม่อยู่ในสถานะ Fetching data').not.to.contain('Fetching data');
                                    expect($rows.length, 'ตารางควรมีข้อมูล').to.be.greaterThan(0);
                                });
                            waitForLoadingState();
                            cy.log(`✅ [${role}] ตาราง Unassigned Task พร้อมแล้ว — เริ่มค้นหา PO ถัดไป`);
                        }
                        approveAt(poIndex + 1);
                    }
                    else {
                        const $nextBtn = $body.find('h3:contains("Unassigned Task")')
                            .parent()
                            .find('ul.pagination li')
                            .filter((_, li) => Cypress.$(li).text().trim() === 'Next');
                        if ($nextBtn.length > 0 && !$nextBtn.hasClass('disabled')) {
                            if (currentPage >= 5) {
                                cy.log(`⚠️ [${role}] ค้นหาครบ 5 หน้าแล้ว ไม่พบ "${poName}" — ข้าม PO นี้`);
                                if (!isLast) {
                                    approveAt(poIndex + 1);
                                }
                                return;
                            }
                            cy.log(`⏭️ [${role}] ไม่พบในหน้า ${currentPage} — ไปหน้าถัดไป`);
                            cy.wrap($nextBtn).find('a').click();
                            waitForLoadingState();
                            findAndClickPO(currentPage + 1);
                        }
                        else {
                            cy.log(`⚠️ [${role}] ไม่พบ "${poName}" ในทุกหน้า — ข้าม PO นี้ (อาจถูก claim ไปแล้ว)`);
                            if (!isLast) {
                                approveAt(poIndex + 1);
                            }
                        }
                    }
                });
            };
            findAndClickPO(1);
        }
        if (skipClick) {
            coreAction(poName, poIndex);
            if (!isLast) {
                approveAt(poIndex + 1);
            }
        }
    };
    approveAt(0);
};
export const approveProjectACTM = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    approveFromUnassignedTask('/actm/actm-doer', 'ACTM', (_poName, _poIndex) => {
        cy.wait(3000);
        scrollAndWait();
        cy.on('window:confirm', () => true);
        cy.get('button.btn-primary')
            .filter((_i, el) => /^Promote To\s+\w+/.test(el.innerText.trim()))
            .should('have.length', 1)
            .click();
        cy.wait(500);
        cy.get('body').then($body => {
            if ($body.find('.modal:visible').length > 0 || $body.find('button:contains("Yes")').length > 0) {
                cy.log('🔔 พบ modal ยืนยัน — กำลังกด Yes');
                cy.contains('button', 'Yes').should('be.visible').click();
            }
            else {
                cy.log('ℹ️ ไม่พบ modal ยืนยัน');
            }
        });
        cy.url({ timeout: 1500000 }).should('not.include', '/actm/actm-doer/detail');
    }, options);
};
export const approveProjectOPER = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    approveFromUnassignedTask('/oper/oper-doer', 'OPER', (_poName, _poIndex) => {
        cy.wait(3000);
        scrollAndWait();
        cy.on('window:confirm', () => true);
        cy.get('.col-md-6 > :nth-child(3)').click();
        cy.wait(500);
        cy.get('body').then($body => {
            if ($body.find('.modal:visible').length > 0 || $body.find('button:contains("Yes")').length > 0) {
                cy.log('🔔 พบ modal ยืนยัน — กำลังกด Yes');
                cy.contains('button', 'Yes').should('be.visible').click();
            }
            else {
                cy.log('ℹ️ ไม่พบ modal ยืนยัน');
            }
        });
        cy.url({ timeout: 120000 }).should('not.include', '/oper/oper-doer/detail');
    }, options);
};

export const approveProjectAPO = (projectName: string, options?: {
    alreadyOnPage?: boolean;
    role?: NavRole;
}): void => {
    approveFromUnassignedTask('/apo/apo-doer', 'APO', (_poName, _poIndex) => {
        cy.wait(3000);
        scrollAndWait();
        cy.on('window:confirm', () => true);
        cy.contains('button', 'Promote To Pre Go Live', { timeout: 6000000000 })
            .should('be.visible')
            .click();
        cy.wait(500);
        cy.get('body').then($body => {
            if ($body.find('.modal:visible').length > 0 || $body.find('button:contains("Yes")').length > 0) {
                cy.log('🔔 พบ modal ยืนยัน — กำลังกด Yes');
                cy.contains('button', 'Yes').should('be.visible').click();
            }
            else {
                cy.log('ℹ️ ไม่พบ modal ยืนยัน');
            }
        });
        cy.url({ timeout: 120000 }).should('not.include', '/apo/apo-doer/detail');
    }, options);
};
export const approveProjectTSCenter = (projectName: string): void => {
    performSimpleClaimAndApprovalRole(
        tscenter,
        tscenterpass,
        (_projectName: string, _options?: { alreadyOnPage?: boolean }) => {
            cy.get('select[formcontrolname="olympus"]').should('be.visible');

            // ✅ สุ่มเลือก Yes หรือ No แทนที่จะเลือก 'No' เสมอ
            const olympusValue = Math.random() < 0.5 ? 'Yes' : 'No';
            cy.log(`🎲 [TSCENTER] สุ่มเลือก Olympus Flag: "${olympusValue}"`);

            cy.get('select[formcontrolname="olympus"]').select(olympusValue);
            cy.get('select[formcontrolname="olympus"]').should('have.value', olympusValue);
            cy.get('select[formcontrolname="olympus"]')
                .should('not.have.class', 'ng-invalid')
                .and('have.class', 'ng-valid');

            scrollAndWait();
            cy.contains('button', 'Approve')
                .should('be.visible')
                .click({ force: true });
            cy.contains('button', 'Yes')
                .should('be.visible')
                .click();
            cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');
            cy.contains('button', 'Logout')
                .should('be.visible')
                .click();
            cy.url({ timeout: 30000 }).should('include', '/login');
        },
        {
            role: 'TSCENTER',
            searchBy: 'project',
            approveFunctionHandlesAllPOs: true,
        }
    );
};

const smartClickYesIfExists = (): void => {
    cy.url().then(url => {
        if (url.includes('/workspace-home/workspace') || url.includes('/login')) {
            cy.log('ℹ️ หน้าเว็บ Redirect ไปแล้ว — ข้ามการกด Yes');
            return;
        }
        cy.get('body').then($body => {
            const $yesBtn = $body.find('button:contains("Yes")').filter(':visible');
            if ($yesBtn.length > 0) {
                cy.wrap($yesBtn.first()).click({ force: true });
            } else {
                cy.log('ℹ️ ไม่พบปุ่ม Yes (อาจเป็น Browser Alert) — ข้าม');
            }
        });
    });
};

/**
 * SASFF: login ครั้งเดียว แล้ว Claim → Approve(Promote) ทีละ PO ใน session เดียวกัน
 * - ไม่ Logout ระหว่าง PO (Promote เสร็จระบบเด้งกลับ workspace-home เอง)
 * - Logout เฉพาะหลัง PO สุดท้าย
 * - Claim/Approve ด้วยชื่อ PO แบบ strict → ไม่สลับ PO1/PO2
 */
export const approveAllPOsSASFF = (user: string, pass: string, options?: { expectedUrl?: string }): void => {
    const expectedUrl = options?.expectedUrl ?? '/cgmd/sasff-tester';
    const projectName = getStandardProjectName();
    const poCount: number = Cypress.env('poCount') ?? 1;
    const allPoNames: string[] = Cypress.env('allPoNames') ?? [];

    cy.log(`🔁 SASFF: Total PO to process: ${poCount} (login ครั้งเดียว)`);
    loginAndWaitReady(user, pass);

    const processPO = (poIndex: number): void => {
        if (poIndex >= poCount) {
            cy.log('✅ SASFF: All POs approved');
            return;
        }
        const poName = (allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`).replace(/\s+/g, ' ').trim();
        const isLast = poIndex === poCount - 1;
        cy.log(`🔄 SASFF PO ${poIndex + 1}/${poCount}: "${poName}" — ${isLast ? 'Logout หลังจบ' : 'ต่อ PO ถัดไปโดยไม่ Logout'}`);

        // 1) Claim เฉพาะ PO นี้ (รอให้ชื่อ PO นี้โผล่ใน To Do List จริง)
        ClaimProject(projectName, { claimBy: 'po', specificPoName: poName });

        // 2) เปิดแถวใน To Do List — strict: ถ้าไม่เจอชื่อตรงให้ fail ไม่ fallback
        approveProject(poName, { strict: true });
        cy.url({ timeout: 180000 }).should('include', expectedUrl);

        // 3) Promote
        cy.wait(500);
        cy.scrollTo('bottom');
        cy.wait(500);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });
        cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

        // 4) ไม่ใช่ตัวสุดท้าย → กลับหน้า list แล้ววนต่อ / ตัวสุดท้าย → Logout
        if (!isLast) {
            waitForLoadingState();
            navigateToWorkspace({ role: 'CGMD' });
        } else {
            cy.contains('button', 'Logout').should('be.visible').click();
            cy.url({ timeout: 30000 }).should('include', '/login');
        }
        processPO(poIndex + 1);
    };
    processPO(0);
};