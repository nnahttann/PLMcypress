const INTERNET_COMPONENT = 'app-mass-enh-internet';
const ALL_PRIORITY_QUOTA_TYPES = [
    'Limited Data (Pay per use)',
    'Limited Data (Stop Net)',
    'Limited Data Only',
    'Unlimited Data (Throttling Speed)',
    'Pay per use only',
    'Unlimited Data (Fixed Speed)',
];

// ⚠️ NOTE: เดิมมี QUOTA_TYPES_WITHOUT_ROW_PRIORITY ที่ใช้ skip inner Edit loop
// ทั้งหมดตาม quota type ("Unlimited Data (Throttling Speed)" /
// "Unlimited Data (Fixed Speed)") โดยสมมติว่า priority ถูกกรอกผ่าน
// top-level field (fixedSpeedPriority / internetThrottlingSpeedPriority)
// ไปแล้วใน Step 1
//
// ❌ แต่จาก DOM จริง คอลัมน์ "Priority" ใน "Internet Quota" table (inner table)
// เป็นคนละ field กับ fixedSpeedPriority/internetThrottlingSpeedPriority
// (คอลัมน์ Priority ใน table นั้น render เป็น <td></td> ว่างเปล่า และต้องกด
// Edit ต่อแถวเพื่อเปิด sub-form ที่มี input[formcontrolname="priority"])
//
// ผลคือ quota type สองแบบนี้ไม่เคยถูกกรอก row-level priority เลย เพราะ
// Step 2 ถูก skip ทั้งหมด — จึงลบเงื่อนไขนี้ออก แล้วเปลี่ยนไปเช็คจาก DOM จริง
// ว่ามี inner table + มีแถวข้อมูลให้กรอกหรือไม่ (ปล่อยให้
// pollForVisiblePriorityInput เป็นตัว fallback เองถ้าไม่เจอ input จริง ๆ)
//
// เก็บ constant นี้ไว้เผื่ออ้างอิง/ใช้ที่อื่น แต่ "ไม่ใช้" เป็นเงื่อนไข skip
// ใน updatePriorityInPanel อีกต่อไป
const QUOTA_TYPES_WITHOUT_ROW_PRIORITY: string[] = [
];

let priorityDigitLevel = 5;

const randomPriority = (): string => {
    const digits = Math.max(priorityDigitLevel, 1);
    const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;

    const value = Cypress._.random(min, max);

    if (priorityDigitLevel > 1) {
        priorityDigitLevel--;
    }

    return String(value);
};
const normalizeQuotaText = (text: string): string =>
    (text || '').replace(/\s+/g, ' ').trim();

const isKnownQuotaType = (text: string): boolean => {
    const normalized = normalizeQuotaText(text).toLowerCase();
    return ALL_PRIORITY_QUOTA_TYPES.some(
        (t) => normalizeQuotaText(t).toLowerCase() === normalized
    );
};

const getInternetDetailPanelBody = ($root: JQuery): JQuery => {
    const $activePane = $root.find('.tab-pane.active');
    const $searchScope = $activePane.length ? $activePane : $root;

    return $searchScope
        .find('h3.h3-panel-header')
        .filter((_i, el) => (el.textContent || '').trim() === 'Internet Detail')
        .closest('.panel.panel-default')
        .find('> .panel-body')
        .first();
};

const isInternetDetailPanelOpen = ($root: JQuery): boolean => {
    const $activePane = $root.find('.tab-pane.active');
    const $searchScope = $activePane.length ? $activePane : $root;

    const $h3 = $searchScope
        .find('h3.h3-panel-header')
        .filter((_i, el) => (el.textContent || '').trim() === 'Internet Detail');

    if (!$h3.length) return false;

    const $wrapperPanel = $h3.closest('.panel.panel-default');
    if (!$wrapperPanel.length) return false;

    return !$wrapperPanel[0].hasAttribute('hidden');
};

const getActiveScope = ($root: JQuery): JQuery => {
    const $activePane = $root.find('.tab-pane.active');
    return $activePane.length ? $activePane : $root;
};
const assertOuterQuotaHeaderReady = ($comp: JQuery): void => {
    const $scope = getActiveScope($comp);

    const $header = $scope
        .find('table thead th')
        .filter((_i, el) => (el.textContent || '').trim() === 'Quota Type');

    expect(
        $header.length,
        'ควรพบ header "Quota Type" ใน active scope (tab ที่กำลังใช้งานอยู่ ถ้ามี)'
    ).to.be.greaterThan(0);

    expect(
        Cypress.$($header.get(0)).is(':visible'),
        'header "Quota Type" ควร visible อยู่ใน active scope'
    ).to.be.true;

    const $outerTable = $header.closest('table');
    const $tbodyRows = $outerTable.find('tbody tr');

    expect(
        $tbodyRows.length,
        'tbody ของ outer quota table ควร render แถวแล้ว (ข้อมูลจริงหรือ "No data to display.") — ป้องกัน race condition ตอน Angular ยังโหลดข้อมูลไม่เสร็จ'
    ).to.be.greaterThan(0);
};

const tryFillPriority = (
    $pb: JQuery,
    formControlName: string,
    label: string
): void => {
    const $input = $pb
        .find(`input[formcontrolname="${formControlName}"]`)
        .first();

    if (!$input.length) {
        cy.log(`ℹ️ [tryFillPriority] "${label}" — ไม่พบ input ใน DOM`);
        return;
    }

    const $hiddenAncestorWithinPb = $input
        .parentsUntil($pb[0])
        .filter('[hidden]');

    if ($hiddenAncestorWithinPb.length > 0) {
        cy.log(`ℹ️ [tryFillPriority] "${label}" — section ถูกซ่อน (hidden ancestor), ข้าม`);
        return;
    }

    const val = randomPriority();
    cy.wrap($input)
        .scrollIntoView()
        .clear({ force: true })
        .type(val, { force: true, delay: 30 })
        .trigger('input', { force: true, bubbles: true })
        .trigger('change', { force: true, bubbles: true })
        .blur({ force: true });

    cy.log(`✅ [tryFillPriority] "${label}" = ${val}`);
};

// ✅ อ่านค่า InternetQuotaType ที่เลือกอยู่ปัจจุบันจาก native <select>
// (เก็บไว้เผื่อใช้ debug/log — ไม่ได้ใช้ตัดสินใจ skip อีกต่อไป)
const getCurrentQuotaTypeValue = ($pb: JQuery): string => {
    const $select = $pb
        .find('select[formcontrolname="InternetQuotaType"]')
        .first();

    if (!$select.length) return '';

    return String($select.val() || '').trim();
};

// ✅ poll หา visible priority input แบบไม่ throw ถ้าไม่เจอ
// ใช้แทน .should() + expect ที่ hard-fail ทั้ง test เมื่อ quota type บางแบบ
// ไม่มี per-row priority input เลย (defensive fallback)
const pollForVisiblePriorityInput = (
    maxAttempts: number,
    onFound: ($input: JQuery) => void,
    onNotFound: () => void
): void => {
    const attempt = (n: number): void => {
        cy.get(INTERNET_COMPONENT, { timeout: 10000 }).then(($comp) => {
            const $pb = getInternetDetailPanelBody($comp);
            const $priorityInput = getVisiblePriorityInput($pb);

            if ($priorityInput.length > 0) {
                onFound($priorityInput.first());
                return;
            }

            if (n >= maxAttempts) {
                cy.log(
                    `⚠️ [pollForVisiblePriorityInput] ไม่พบ priority input หลังรอ ${maxAttempts} รอบ — quota type นี้อาจไม่มี per-row priority — ข้ามแถว`
                );
                onNotFound();
                return;
            }

            cy.wait(500);
            attempt(n + 1);
        });
    };

    attempt(0);
};

const safeClickCancel = (): void => {
    cy.log('🔍 [safeClickCancel] หาปุ่ม Cancel...');

    cy.get(INTERNET_COMPONENT, { timeout: 8000 }).then(($comp) => {
        if (!isInternetDetailPanelOpen($comp)) {
            cy.log('ℹ️ [safeClickCancel] panel ปิดอยู่แล้ว — ข้าม');
            return;
        }

        const $pb = getInternetDetailPanelBody($comp);
        if (!$pb.length) {
            cy.log('ℹ️ [safeClickCancel] ไม่พบ panel-body — ข้าม');
            return;
        }

        const $cancelBtn = $pb
            .find('button')
            .filter((_i, btn) => {
                const text = (btn.textContent || '').trim();
                return text === 'Cancel' && Cypress.$(btn).is(':visible');
            })
            .first();

        if (!$cancelBtn.length) {
            cy.log('ℹ️ [safeClickCancel] ไม่พบปุ่ม Cancel ที่ visible — ข้าม');
            return;
        }

        cy.wrap($cancelBtn)
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });

        cy.log('✅ [safeClickCancel] กด Cancel แล้ว');
    });

    // ✅ แยก chain — retry อิสระ ไม่ติด snapshot ใน .then ด้านบน
    cy.get(INTERNET_COMPONENT, { timeout: 12000 }).should(($comp) => {
        const $activePane = $comp.find('.tab-pane.active');
        const $scope = $activePane.length ? $activePane : $comp;

        const $h3 = $scope
            .find('h3.h3-panel-header')
            .filter((_i, el) => (el.textContent || '').trim() === 'Internet Detail');

        if (!$h3.length) return; // ไม่มี h3 = ถือว่าปิดแล้ว

        const $wrapperPanel = $h3.closest('.panel.panel-default');
        expect(
            $wrapperPanel[0]?.hasAttribute('hidden'),
            'Internet Detail panel should be hidden after Cancel'
        ).to.be.true;
    });

    cy.log('✅ [safeClickCancel] confirmed panel ปิดแล้ว');
};

const shouldCopyDeductFailEnhancement = (): boolean => {
    const module = Cypress.env('currentModule');
    const priceType = Cypress.env('currentPriceType');
    const productClass = Cypress.env('currentProductClass');

    const result = module === 'PRE' && priceType === 'recurring' && productClass === 'main';

    cy.log(
        `🔎 [shouldCopyDeductFailEnhancement] module="${module}", priceType="${priceType}", productClass="${productClass}" → ${result}`
    );

    return result;
};

const runCopyDeductFailIfNeeded = (): void => {
    if (shouldCopyDeductFailEnhancement()) {
        CopyDeductFail('enhancement');
    } else {
        cy.log('⚠️ ข้าม CopyDeductFail("enhancement") — เงื่อนไขไม่ตรง (ต้องเป็น Module=PRE, PriceType=recurring, ProductClass=main)');
    }
};

export const CopyDeductFail = (pageType: 'mass-market' | 'enhancement'): void => {
    const mainTabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game', 'WiFi'];

    const COMPONENT_MAP: Record<'mass-market' | 'enhancement', Record<string, string>> = {
        'mass-market': {
            'Internet': 'app-mass-mkt-internet',
            'Voice': 'app-mass-mkt-voice',
            'SMS': 'app-mass-mkt-sms',
            'MMS': 'app-mass-mkt-mms',
            'Vertical App': 'app-mass-mkt-vertical-app',
            'Cloud Game': 'app-mass-mkt-cloud-game',
            'WiFi': 'app-mass-mkt-wifi',
        },
        'enhancement': {
            'Internet': 'app-mass-enh-internet',
            'Voice': 'app-mass-enh-voice',
            'SMS': 'app-mass-enh-sms',
            'MMS': 'app-mass-enh-mms',
            'Vertical App': 'app-mass-enh-vertical-app',
            'Cloud Game': 'app-mass-enh-cloud-game',
            'WiFi': 'app-mass-enh-wifi',
        },
    };

    const tabBarSelector = pageType === 'enhancement'
        ? 'ul.nav.nav-tabs a'
        : '.scrollmenu .nav a';

    const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const processTab = (index: number): void => {
        if (index >= mainTabs.length) {
            cy.log('🎉 All tabs processed successfully.');
            return;
        }

        const tabName = mainTabs[index];
        const componentSelector = COMPONENT_MAP[pageType][tabName];
        cy.log(`\n🔄 [${pageType}] Processing [${index + 1}/${mainTabs.length}]: "${tabName}"`);

        cy.get(tabBarSelector).then(($tabs) => {
            const $match = $tabs.filter((_, el) =>
                normalize(el.textContent || '').includes(normalize(tabName))
            );

            if (!$match.length) {
                const seenLabels = [...new Set(
                    $tabs.toArray().map((el) => el.textContent?.trim()).filter(Boolean)
                )];
                cy.log(`⚠️ Main tab "${tabName}" not found — skipping. Visible labels: ${seenLabels.join(', ')}`);
                processTab(index + 1);
                return;
            }

            cy.wrap($match.first()).click();

            cy.get('body').then(($body) => {
                if (!$body.find(componentSelector).length) {
                    cy.log(`⚠️ Component "${componentSelector}" not found — skipping.`);
                    processTab(index + 1);
                    return;
                }

                cy.get(componentSelector, { timeout: 20000 }).should('exist');
                cy.wait(600);

                cy.get(componentSelector).within(() => {
                    cy.get('.nav-tabs a').contains('Deduct Fail').click();
                    cy.get('.tab-pane.active', { timeout: 10000 }).should('be.visible');

                    cy.get('.tab-pane.active').then(($pane) => {
                        const $btn = $pane.find('button:contains("Copy From Deduct Success")');

                        if ($btn.length > 0) {
                            cy.wrap($btn.first()).click({ force: true });
                            cy.log(`✅ Copied Deduct Success → Deduct Fail for "${tabName}"`);
                        } else {
                            cy.log(`⚠️ No "Copy From Deduct Success" button in "${tabName}" — skipping.`);
                        }
                    });
                });

                cy.wait(500);
                processTab(index + 1);
            });
        });
    };

    cy.get(tabBarSelector).should('exist');
    processTab(0);
};

// ========================
// CHECK AND FILL CONTENT TYPE
// ========================
const COMPONENT = 'app-mass-enh-vertical-app';

export function checkAndFillContentType(): void {
    cy.log('🚀 checkAndFillContentType started');

    const targetTabs: Array<{
        name: string;
        containerSelector: string;
        editButtonSelector: string;
        contentTypeSelector: string;
    }> = [
            {
                name: 'Karaoke',
                containerSelector: 'app-mass-enh-content-music-streaming',
                editButtonSelector: 'button.btn-warning[title="Edit"]',
                contentTypeSelector: 'select[formcontrolname="contentType"]',
            },
            {
                name: 'Music Streaming',
                containerSelector: 'app-mass-enh-content-music-streaming',
                editButtonSelector: 'button.btn-warning[title="Edit"]',
                contentTypeSelector: 'select[formcontrolname="contentType"]',
            },
            {
                name: 'Entertainment Partnership',
                containerSelector: 'app-mass-enh-content-music-streaming',
                editButtonSelector: 'button.btn-warning[title="Edit"]',
                contentTypeSelector: 'select[formcontrolname="contentType"]',
            },
            {
                name: 'Cloud Game',
                containerSelector: 'app-mass-enh-vr[title="Cloud Game"]',
                editButtonSelector: 'button.btn-warning[title="Edit"]',
                contentTypeSelector: 'select[formcontrolname="contentTypeValue"]',
            },
            {
                name: 'AI IP Camera',
                containerSelector: 'app-mass-enh-ai-ip-camera',
                editButtonSelector: 'button.btn-warning[title="Edit"]',
                contentTypeSelector: 'select[formcontrolname="contentType"]',
            },
        ];

    const processTab = (index: number): void => {
        if (index >= targetTabs.length) {
            cy.log('🎉 All tabs processed');
            return;
        }

        const tabConfig = targetTabs[index];
        cy.log(`🔍 [${index + 1}/${targetTabs.length}] Looking for tab: "${tabConfig.name}"`);

        cy.get('body').then(($body) => {
            const $tab = $body.find('ul.nav.nav-tabs li a').filter((_i, el) => {
                return el.textContent?.trim() === tabConfig.name;
            });

            if (!$tab.length) {
                cy.log(`⚠️ Tab "${tabConfig.name}" not found, skipping to next tab...`);
                processTab(index + 1);
                return;
            }

            cy.log(`✅ Found tab: "${tabConfig.name}"`);
            cy.wrap($tab).click({ force: true });
            cy.wait(500);
            cy.log(`✅ Clicked tab: ${tabConfig.name}`);

            cy.get('body').then(($b) => {
                const $container = $b.find(tabConfig.containerSelector).filter((_i, el) => {
                    return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
                });

                if (!$container.length) {
                    cy.log(`⚠️ Container "${tabConfig.containerSelector}" not found, skipping...`);
                    processTab(index + 1);
                    return;
                }

                cy.log(`✅ Container found: ${tabConfig.containerSelector}`);

                const $editButtons = $container.find(tabConfig.editButtonSelector);
                cy.log(`📋 [${tabConfig.name}] Edit buttons found: ${$editButtons.length}`);

                if ($editButtons.length === 0) {
                    cy.log(`⚠️ No Edit button found in ${tabConfig.name}, skipping...`);
                    processTab(index + 1);
                    return;
                }

                let currentEditIndex = 0;

                const processNextEditButton = (): void => {
                    if (currentEditIndex >= $editButtons.length) {
                        cy.log(`✅ [${tabConfig.name}] All ${$editButtons.length} Edit buttons processed`);
                        processTab(index + 1);
                        return;
                    }

                    cy.log(`📌 [${tabConfig.name}] Processing Edit button ${currentEditIndex + 1}/${$editButtons.length}`);

                    cy.get('body').then(($b2) => {
                        const $freshContainer = $b2.find(tabConfig.containerSelector).filter((_i, el) => {
                            return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
                        });
                        const $currentBtn = $freshContainer
                            .find(tabConfig.editButtonSelector)
                            .eq(currentEditIndex);

                        if (!$currentBtn.length) {
                            cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} disappeared, skipping...`);
                            currentEditIndex++;
                            processNextEditButton();
                            return;
                        }

                        const isHidden = Cypress.$($currentBtn).closest('[hidden]').length > 0;
                        if (isHidden) {
                            cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} is hidden, skipping...`);
                            currentEditIndex++;
                            processNextEditButton();
                            return;
                        }

                        cy.wrap($currentBtn).click({ force: true });
                        cy.wait(500);
                        cy.log(`✅ [${tabConfig.name}] Clicked Edit button #${currentEditIndex + 1}`);

                        cy.get('body').then(($b3) => {
                            const $freshContainer2 = $b3.find(tabConfig.containerSelector).filter((_i, el) => {
                                return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
                            });
                            const $allSelects = $freshContainer2.find(tabConfig.contentTypeSelector);
                            const $visibleSelects = $allSelects.filter((_i, el) => {
                                return Cypress.$(el).closest('[hidden]').length === 0;
                            });

                            cy.log(`📋 [${tabConfig.name}] Visible Content Type selects: ${$visibleSelects.length}`);

                            if (!$visibleSelects.length) {
                                cy.log(`⚠️ [${tabConfig.name}] No visible Content Type select found`);
                                currentEditIndex++;
                                processNextEditButton();
                                return;
                            }

                            const $select = $visibleSelects.first();
                            const select = $select[0] as unknown as HTMLSelectElement;
                            const selectedValue: string = select.value || '';
                            const isEmpty: boolean =
                                !selectedValue ||
                                selectedValue === 'null' ||
                                selectedValue === '' ||
                                selectedValue === '0: null' ||
                                select.selectedIndex <= 0;

                            cy.log(`[${tabConfig.name}] Content Type value: "${selectedValue}" | isEmpty: ${isEmpty}`);

                            if (isEmpty) {
                                const validOptions: HTMLOptionElement[] = Array.from(select.options || []).filter(
                                    (opt: HTMLOptionElement) =>
                                        opt &&
                                        !opt.disabled &&
                                        opt.value &&
                                        opt.value !== 'null' &&
                                        opt.value !== '0: null' &&
                                        opt.value !== ''
                                );

                                cy.log(`📋 [${tabConfig.name}] Valid options: ${validOptions.length}`);

                                if (validOptions.length === 0) {
                                    cy.log(`⚠️ [${tabConfig.name}] No valid options to select`);
                                    currentEditIndex++;
                                    processNextEditButton();
                                    return;
                                }

                                const randomOption: HTMLOptionElement =
                                    validOptions[Math.floor(Math.random() * validOptions.length)];

                                cy.wrap($select).select(randomOption.value, { force: true });
                                cy.wait(600);
                                cy.log(`✅ [${tabConfig.name}] Selected: "${randomOption.text?.trim() || 'Unknown'}"`);

                                cy.get('body').then(($b4) => {
                                    const $freshContainer3 = $b4.find(tabConfig.containerSelector).filter((_i, el) => {
                                        return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
                                    });
                                    const $updateBtn = $freshContainer3
                                        .find('button')
                                        .filter((_i, btn) => {
                                            return (
                                                btn.textContent?.trim() === 'Update' &&
                                                Cypress.$(btn).closest('[hidden]').length === 0
                                            );
                                        });

                                    cy.log(`📋 [${tabConfig.name}] Update button found: ${$updateBtn.length}`);

                                    if ($updateBtn.length) {
                                        cy.wrap($updateBtn.first()).click({ force: true });
                                        cy.log(`✅ [${tabConfig.name}] Clicked Update button`);
                                        cy.wait(500);
                                    } else {
                                        cy.log(`⚠️ [${tabConfig.name}] Update button not found`);
                                    }

                                    currentEditIndex++;
                                    processNextEditButton();
                                });
                            } else {
                                const currentText: string =
                                    select.options[select.selectedIndex]?.text?.trim() || 'Unknown';
                                cy.log(`✅ [${tabConfig.name}] Content Type already has value: "${currentText}"`);
                                currentEditIndex++;
                                processNextEditButton();
                            }
                        });
                    });
                };

                processNextEditButton();
            });
        });
    };

    processTab(0);
    cy.log('🎉 Done checking all tabs');
}

export const checkAndUpdateVerticalAppPriority = (): void => {
    cy.log('🚀 checkAndUpdateVerticalAppPriority started');

    const fillIfEmpty = (
        $input: JQuery<HTMLElement>,
        label: string,
        onFilled: () => void,
        onSkip: () => void
    ): void => {
        cy.wrap($input).invoke('val').then((val) => {
            const isEmpty = !val || String(val).trim() === '';

            if (isEmpty) {
                const randomNum = Math.floor(10000 + Math.random() * 90000);
                cy.wrap($input)
                    .scrollIntoView()
                    .focus()
                    .clear()
                    .type(randomNum.toString(), { delay: 150 })
                    .blur();
                cy.log(`✅ ใส่ค่า ${label}: ${randomNum}`);
                cy.wait(500);
                onFilled();
            } else {
                cy.log(`ℹ️ ${label} มีค่าอยู่แล้ว: "${val}" — ข้าม`);
                onSkip();
            }
        });
    };

    const clickUpdateIfVisible = (afterUpdate: () => void): void => {
        cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
            const $updateBtn = $panelBody.find('button.btn-success').filter((_i, btn) => {
                return (
                    btn.textContent?.trim() === 'Update' &&
                    Cypress.$(btn).closest('[hidden]').length === 0
                );
            });

            if ($updateBtn.length) {
                cy.wrap($updateBtn.first()).click({ force: true });
                cy.log('✅ คลิก Update');
                cy.wait(500);
            } else {
                cy.log('⚠️ ไม่พบ Update button');
            }

            afterUpdate();
        });
    };

    const clickCancel = (afterCancel: () => void): void => {
        cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
            const $cancelBtn = $panelBody.find('button').filter((_i, btn) => {
                return (
                    btn.textContent?.trim() === 'Cancel' &&
                    Cypress.$(btn).closest('[hidden]').length === 0
                );
            });

            if ($cancelBtn.length) {
                cy.wrap($cancelBtn.first()).click({ force: true });
                cy.log('✅ คลิก Cancel');
                cy.wait(500);
            } else {
                cy.log('⚠️ ไม่พบ Cancel button');
            }

            afterCancel();
        });
    };

    // ── รอจนกว่าตารางจะมีข้อมูลจริง (ไม่ใช่แถวว่าง/"No data to display") ──
    const waitForTableData = (
        attempt: number,
        onReady: () => void,
        onTimeout: () => void
    ): void => {
        const MAX_ATTEMPTS = 10;
        const RETRY_DELAY = 3000;

        cy.get('body').then(($b) => {
            const $validRows = $b.find(`${COMPONENT} table > tbody > tr`).filter((_i, tr) => {
                const text = Cypress.$(tr).find('td:first').text().trim();
                return text !== '' && !text.includes('No data to display');
            });

            if ($validRows.length > 0) {
                cy.log(`✅ ตารางมีข้อมูลแล้ว (${$validRows.length} แถว)`);
                onReady();
                return;
            }

            if (attempt >= MAX_ATTEMPTS) {
                cy.log(`⚠️ รอครบ ${MAX_ATTEMPTS} ครั้งแล้วตารางยังไม่มีข้อมูล — ข้าม`);
                onTimeout();
                return;
            }

            cy.log(`⏳ ตารางยังไม่มีข้อมูล กำลังรอ... (ครั้งที่ ${attempt + 1}/${MAX_ATTEMPTS})`);
            cy.wait(RETRY_DELAY);
            waitForTableData(attempt + 1, onReady, onTimeout);
        });
    };

    const processRows = (rowIndex: number): void => {
        cy.get('body').then(($b) => {
            const $rows = $b.find(`${COMPONENT} table > tbody > tr`).filter((_i, tr) => {
                const text = Cypress.$(tr).find('td:first').text().trim();
                return text !== '' && !text.includes('No data to display');
            });

            if (rowIndex >= $rows.length) {
                cy.log(`✅ ทำครบทุกแถวแล้ว (${$rows.length} แถว)`);
                return;
            }

            cy.log(`📝 กำลังทำแถวที่ ${rowIndex + 1}/${$rows.length}`);

            const $currentRow = $rows.eq(rowIndex);
            const $editBtn = $currentRow.find('button.btn-warning[title="Edit"]').first();

            if (!$editBtn.length) {
                cy.log(`⚠️ ไม่พบ Edit button ในแถวที่ ${rowIndex + 1} — ข้าม`);
                processRows(rowIndex + 1);
                return;
            }

            const isHidden = Cypress.$($editBtn).closest('[hidden]').length > 0;
            if (isHidden) {
                cy.log(`⚠️ Edit button ในแถวที่ ${rowIndex + 1} ถูกซ่อนอยู่ — ข้าม`);
                processRows(rowIndex + 1);
                return;
            }

            cy.wrap($editBtn).click({ force: true });
            cy.wait(500);
            cy.log(`✅ คลิก Edit button แถวที่ ${rowIndex + 1}`);

            cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
                const $priorityInput = $panelBody
                    .find('input[formcontrolname="priority"]')
                    .filter((_i, el) => {
                        return (
                            Cypress.$(el).closest('[hidden]').length === 0 &&
                            Cypress.$(el).is(':visible')
                        );
                    });

                const $throttlingInput = $panelBody
                    .find('input[formcontrolname="throttlingSpeedPriority"]')
                    .filter((_i, el) => {
                        return (
                            Cypress.$(el).closest('[hidden]').length === 0 &&
                            Cypress.$(el).is(':visible')
                        );
                    });

                cy.log(
                    `📋 Priority: ${$priorityInput.length} | ThrottlingSpeedPriority: ${$throttlingInput.length}`
                );

                if (!$priorityInput.length && !$throttlingInput.length) {
                    cy.log('⚠️ ไม่พบ input ใดๆ ที่มองเห็นได้ — ข้ามแถวนี้');
                    processRows(rowIndex + 1);
                    return;
                }

                let needsUpdate = false;

                const finishRow = (): void => {
                    if (needsUpdate) {
                        clickUpdateIfVisible(() => processRows(rowIndex + 1));
                    } else {
                        cy.log('ℹ️ ไม่มีการเปลี่ยนแปลง — กด Cancel');
                        clickCancel(() => processRows(rowIndex + 1));
                    }
                };

                const checkThrottlingThenFinish = (): void => {
                    if ($throttlingInput.length) {
                        fillIfEmpty(
                            $throttlingInput.first(),
                            'Throttling Speed Priority',
                            () => {
                                needsUpdate = true;
                                finishRow();
                            },
                            () => finishRow()
                        );
                    } else {
                        cy.log('ℹ️ ไม่มี Throttling Speed Priority — ข้าม');
                        finishRow();
                    }
                };

                if ($priorityInput.length) {
                    fillIfEmpty(
                        $priorityInput.first(),
                        'Priority',
                        () => {
                            needsUpdate = true;
                            checkThrottlingThenFinish();
                        },
                        () => checkThrottlingThenFinish()
                    );
                } else {
                    cy.log('ℹ️ ไม่มี Priority — ข้ามไปเช็ค Throttling');
                    checkThrottlingThenFinish();
                }
            });
        });
    };

    cy.get('body').then(($body) => {
        const normalizeText = (text: string | null | undefined): string =>
            (text ?? '').replace(/\s+/g, ' ').trim();

        const $allLinks = $body.find('ul.nav.nav-tabs li a, .scrollmenu > .nav a');

        $allLinks.each((_i, el) => {
            cy.log(`🔍 tab: "${normalizeText(el.textContent)}"`);
        });

        const $tab = $allLinks.filter(
            (_i, el) => normalizeText(el.textContent) === 'Vertical App'
        );

        if (!$tab.length) {
            cy.log('⚠️ Tab "Vertical App" not found — skipping');
            return;
        }

        const $target = $tab.first();
        cy.log(`✅ Found tab: "Vertical App" (${$target.length} element)`);
        cy.wrap($target).scrollIntoView().click({ force: true });
        cy.wait(500);

        // รอให้ตารางมีข้อมูลก่อนเริ่มประมวลผลแถว
        waitForTableData(
            0,
            () => {
                processRows(0);
                cy.log('🎉 checkAndUpdateVerticalAppPriority เสร็จสิ้น');
            },
            () => {
                cy.log(`⚠️ ไม่พบแถวใน ${COMPONENT} — skipping`);
            }
        );
    });
};

const getVisiblePriorityInput = ($pbScope: JQuery): JQuery => {
    return $pbScope
        .find('input[formcontrolname="priority"]')
        .filter((_i, el) => {
            return (
                Cypress.$(el).parentsUntil($pbScope[0]).filter('[hidden]').length === 0 &&
                Cypress.$(el).is(':visible')
            );
        });
};

const updatePriorityInPanel = (): void => {
    cy.log('🚀 [updatePriorityInPanel] เริ่มต้น');

    cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(($comp) => {
        const $pb = getInternetDetailPanelBody($comp);

        if (!$pb.length) {
            cy.log('⚠️ [Step 1] ไม่พบ Internet Detail panel-body — ข้าม');
            return;
        }

        cy.log('📝 [Step 1] fill top-level priority fields');
        tryFillPriority($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
        tryFillPriority($pb, 'internetThrottlingSpeedPriority', 'Throttling Speed Priority');
        tryFillPriority($pb, 'internetExceedRatePriority', 'Exceed Rate Priority');
    });

    // ── helper: หา Internet Quota table section (ไม่ hidden) ────────────────
    const findInnerTableSection = ($pbScope: JQuery): JQuery => {
        return $pbScope
            .find('div.col-md-12')
            .filter((_i, el) => {
                const $el = Cypress.$(el);
                const hasInternetQuotaHeader = $el
                    .find('thead th')
                    .toArray()
                    .some((th) => (th.textContent || '').trim() === 'Internet Quota');
                const notHidden =
                    !el.hasAttribute('hidden') &&
                    $el.parentsUntil($pbScope[0]).filter('[hidden]').length === 0;
                return hasInternetQuotaHeader && notHidden;
            })
            .first();
    };

    const getDataRows = ($sectionScope: JQuery): JQuery => {
        return $sectionScope.find('tbody tr').filter((_i, el) => {
            const $tr = Cypress.$(el);
            return (
                $tr.find('td[colspan]').length === 0 &&
                $tr.find('td').first().text().trim().length > 0
            );
        });
    };

    // ── helper: หา visible inner Update button ใน panel-body ปัจจุบัน ─────────
    const getVisibleInnerUpdateBtn = ($pbScope: JQuery): JQuery => {
        return $pbScope
            .find('form button')
            .filter((_i, btn) => {
                const text = (btn.textContent || '').trim();
                return (
                    /^Update$/i.test(text) &&
                    Cypress.$(btn).is(':visible') &&
                    Cypress.$(btn).parentsUntil($pbScope[0]).filter('[hidden]').length === 0
                );
            });
    };

    // ── Step 2-4: loop ทุกแถวใน Internet Quota table (ไม่ใช่แถวแรกอย่างเดียว) ──
    cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(($comp) => {
        const $pb = getInternetDetailPanelBody($comp);

        if (!$pb.length) {
            cy.log('ℹ️ [Step 2] ไม่พบ panel-body — ข้าม inner Edit loop');
            return;
        }

        // ✅ FIX: เดิม skip inner Edit loop ทั้งหมดถ้า quota type อยู่ใน
        // QUOTA_TYPES_WITHOUT_ROW_PRIORITY (เช่น "Unlimited Data
        // (Throttling Speed)" / "Unlimited Data (Fixed Speed)") โดยสมมติว่า
        // priority ถูกกรอกผ่าน top-level field ใน Step 1 ไปแล้ว
        //
        // แต่จาก DOM จริง คอลัมน์ Priority ใน "Internet Quota" table (inner
        // table) เป็นคนละ field กับ fixedSpeedPriority /
        // internetThrottlingSpeedPriority — คอลัมน์นี้ต้องกด Edit ต่อแถว
        // เพื่อกรอก input[formcontrolname="priority"] แยกต่างหาก
        //
        // จึงเปลี่ยนมาเช็คจาก DOM จริงแทนว่า inner table section มีอยู่และ
        // มีแถวข้อมูลให้กรอกหรือไม่ (ไม่ตัดสินใจจาก quota type string อีก
        // ต่อไป) ส่วน pollForVisiblePriorityInput ที่มีอยู่แล้วจะเป็นตัว
        // fallback เองถ้าบางแถวไม่มี priority input จริง ๆ
        const currentQuotaType = getCurrentQuotaTypeValue($pb);
        cy.log(`ℹ️ [Step 2] quota type = "${currentQuotaType}" (ใช้เพื่อ log เท่านั้น ไม่ใช้ตัดสินใจ skip)`);

        const $innerTableSection = findInnerTableSection($pb);

        if (!$innerTableSection.length) {
            cy.log('ℹ️ [Step 2] Internet Quota table section ถูก hidden หรือไม่พบ — ข้าม inner Edit loop');
            return;
        }

        const rowCount = getDataRows($innerTableSection).length;

        if (!rowCount) {
            cy.log('ℹ️ [Step 2] Internet Quota table ไม่มีแถวข้อมูล — ข้าม inner Edit loop');
            return;
        }

        cy.log(`📊 [Step 2] พบ ${rowCount} แถวใน Internet Quota table — จะวน process ทุกแถว`);

        cy.wrap(Array.from({ length: rowCount }, (_, i) => i)).each((rowIdx: number) => {
            cy.log(`\n➡️ [Internet Quota row ${rowIdx + 1}/${rowCount}] เริ่ม`);

            // -- คลิก Edit ของแถวนี้ (re-query DOM สดทุกครั้ง) --
            cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(($comp2) => {
                const $pb2 = getInternetDetailPanelBody($comp2);
                if (!$pb2.length) {
                    cy.log(`⚠️ [row ${rowIdx + 1}] ไม่พบ panel-body — ข้าม`);
                    return;
                }

                const $section2 = findInnerTableSection($pb2);
                if (!$section2.length) {
                    cy.log(`⚠️ [row ${rowIdx + 1}] ไม่พบ Internet Quota table — ข้าม`);
                    return;
                }

                const $targetRow = getDataRows($section2).eq(rowIdx);

                if (!$targetRow.length) {
                    cy.log(`⚠️ [row ${rowIdx + 1}] ไม่พบแถว .eq(${rowIdx}) — ข้าม`);
                    return;
                }

                const $editBtn = $targetRow.find('button.btn-warning').first();

                if (!$editBtn.length) {
                    cy.log(`⚠️ [row ${rowIdx + 1}] ไม่พบ inner Edit button — ข้าม`);
                    return;
                }

                cy.wrap($editBtn)
                    .scrollIntoView()
                    .should('be.visible')
                    .click({ force: true });

                cy.log(`✅ [row ${rowIdx + 1}] คลิก inner Edit แล้ว`);
            });

            // ✅ ใช้ pollForVisiblePriorityInput แทน .should() + expect
            // เดิม hard-fail ทั้ง test ถ้าไม่เจอ priority input ภายใน 15s
            // ตอนนี้ poll สูงสุด ~5s แล้ว fallback ไป cancel row นั้นแทนที่จะ throw
            pollForVisiblePriorityInput(
                10, // 10 x 500ms = 5s max
                ($priorityInput) => {
                    const val = randomPriority();
                    cy.wrap($priorityInput)
                        .scrollIntoView()
                        .clear({ force: true })
                        .type(val, { force: true, delay: 30 })
                        .trigger('input', { force: true, bubbles: true })
                        .trigger('change', { force: true, bubbles: true })
                        .blur({ force: true });

                    cy.log(`✅ [row ${rowIdx + 1}] กรอก priority (sub-form) = ${val}`);

                    cy.get(INTERNET_COMPONENT, { timeout: 15000 })
                        .should(($comp4) => {
                            const $pb4 = getInternetDetailPanelBody($comp4);
                            const $priorityInput2 = getVisiblePriorityInput($pb4);
                            const $innerUpdateBtn = getVisibleInnerUpdateBtn($pb4);

                            expect(
                                $priorityInput2.length,
                                `[row ${rowIdx + 1}] priority input ควรยังอยู่ก่อนกด inner Update`
                            ).to.be.greaterThan(0);

                            expect(
                                $innerUpdateBtn.length,
                                `[row ${rowIdx + 1}] inner Update button ควร render แล้ว`
                            ).to.be.greaterThan(0);
                        })
                        .then(($comp4) => {
                            const $pb4 = getInternetDetailPanelBody($comp4);
                            const $innerUpdateBtn = getVisibleInnerUpdateBtn($pb4).first();

                            cy.wrap($innerUpdateBtn)
                                .scrollIntoView()
                                .click({ force: true });

                            cy.log(`✅ [row ${rowIdx + 1}] คลิก inner Update`);
                        });

                    // -- confirm sub-form ปิดแล้วก่อนไปแถวถัดไป (กัน race condition) --
                    cy.get(INTERNET_COMPONENT, { timeout: 12000 }).should(($comp5) => {
                        const $pb5 = getInternetDetailPanelBody($comp5);
                        if (!$pb5.length) return;

                        const $stillOpenPriorityInput = getVisiblePriorityInput($pb5);

                        expect(
                            $stillOpenPriorityInput.length,
                            `sub-form ควรปิดแล้วหลังกด Update (row ${rowIdx + 1})`
                        ).to.eq(0);
                    });

                    cy.log(`✅ [row ${rowIdx + 1}] เสร็จสิ้น — พร้อม row ถัดไป`);
                },
                () => {
                    // ไม่เจอ priority input เลยหลัง poll ครบ — cancel sub-form (ถ้ามี)
                    // แล้วปล่อยให้ .each ไป row ถัดไปตามปกติ
                    cy.log(`⚠️ [row ${rowIdx + 1}] ไม่มี priority input ให้กรอก — cancel sub-form แล้วข้าม`);
                    safeClickCancel();
                }
            );
        });
    });

    // ── Step 5: กด outer Update button (หลัง process ครบทุกแถวแล้ว) ──────────
    cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
        const $pb = getInternetDetailPanelBody($comp);

        if (!$pb.length) {
            cy.log('⚠️ [Step 5] ไม่พบ panel-body — ข้าม outer Update');
            return;
        }

        const $outerBtn = $pb
            .find('button.btn-success')
            .filter((_i, btn) => {
                const text = (btn.textContent || '').trim();
                return (
                    /^Update$/i.test(text) &&
                    Cypress.$(btn).is(':visible') &&
                    Cypress.$(btn).parentsUntil($pb[0]).filter('[hidden]').length === 0
                );
            })
            .first();

        if (!$outerBtn.length) {
            cy.log('⚠️ [Step 5] ไม่พบ outer Update button — ข้าม');
            return;
        }

        cy.wrap($outerBtn)
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });

        cy.log('✅ [Step 5] คลิก outer Update เรียบร้อย');
    });

    cy.log('🏁 [updatePriorityInPanel] เสร็จสิ้นทุก step');
};

// ============================================================================
// ----------------------------------------------------------------------------
export const checkAndUpdatePriority = (): void => {
    cy.log('🚀 [checkAndUpdatePriority] เริ่มต้น');

    // ── คลิก Tab Internet + ทำงานทั้งหมดภายใน .then() เดียวกัน ──────────────
    cy.get('body').then(($body) => {
        const $internetTab = $body
            .find('.scrollmenu > .nav a, .scrollmenu > .nav li a')
            .filter((_i, el) => (el.textContent || '').trim() === 'Internet');

        if (!$internetTab.length) {
            cy.log('⚠️ Tab "Internet" ไม่พบ — ข้าม checkAndUpdatePriority ทั้งหมด');
            return;
        }

        cy.wrap($internetTab.first())
            .scrollIntoView()
            .should('be.visible')
            .click({ force: true });

        cy.log('✅ คลิก Tab Internet');
        cy.wait(5000);

        // ── ย้ายมาจากนอก .then() เดิม: รอ outer quota table พร้อม ──────────
        cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should(($comp) => {
            assertOuterQuotaHeaderReady($comp);
        });

        cy.log('✅ outer quota table พร้อมแล้ว');

        // ── นับ row indices ที่ต้องประมวลผล (snapshot ครั้งเดียว) ──────────
        cy.get(INTERNET_COMPONENT, { timeout: 10000 })
            .should('exist')
            .then(($comp) => {
                const $activePane = $comp.find('.tab-pane.active');
                const $scope = $activePane.length ? $activePane : $comp;

                const $outerTable = $scope
                    .find('table')
                    .filter((_i, el) =>
                        Cypress.$(el)
                            .find('thead th')
                            .toArray()
                            .some((th) => (th.textContent || '').trim() === 'Quota Type')
                    )
                    .first();

                if (!$outerTable.length) {
                    cy.log('⚠️ ไม่พบ outer quota table — ข้าม');
                    return;
                }

                // 🔎 DEBUG: dump ทุกแถวใน outer quota table เพื่อดู text จริง
                //     ก่อนที่จะถูก filter ด้วย isKnownQuotaType
                const $allRowsDebug = $outerTable.find('tbody tr');
                cy.log(`🔎 [DEBUG] จำนวนแถวทั้งหมดใน tbody (ก่อน filter): ${$allRowsDebug.length}`);

                $allRowsDebug.each((i, el) => {
                    const rawText = Cypress.$(el).find('td').first().text();
                    const normalized = normalizeQuotaText(rawText);
                    const matched = isKnownQuotaType(normalized);
                    cy.log(
                        `🔎 [DEBUG row ${i + 1}] raw="${rawText}" | normalized="${normalized}" | matched=${matched}`
                    );
                });

                const rowCount: number = $outerTable
                    .find('tbody tr')
                    .toArray()
                    .filter((el) => {
                        const text = normalizeQuotaText(Cypress.$(el).find('td').first().text());
                        return (
                            text.length > 0 &&
                            text !== 'No data to display.' &&
                            isKnownQuotaType(text)
                        );
                    }).length;

                cy.log(`📊 พบ ${rowCount} แถวที่ต้องประมวลผล`);

                if (!rowCount) {
                    cy.log('✅ ไม่มีแถวที่ต้องอัปเดต priority');
                    return;
                }

                // ── Loop by loopIdx (0-based) — re-query DOM ทุก iteration ──
                cy.wrap(Array.from({ length: rowCount }, (_, i) => i)).each(
                    (loopIdx: number) => {
                        cy.log(`\n──────────────────────────────────────────`);
                        cy.log(`🔄 [${loopIdx + 1}/${rowCount}] เริ่ม iteration`);

                        cy.get(INTERNET_COMPONENT, { timeout: 10000 })
                            .should('exist')
                            .then(($comp2) => {
                                const $activePane2 = $comp2.find('.tab-pane.active');
                                const $scope2 = $activePane2.length ? $activePane2 : $comp2;

                                const $outerTable2 = $scope2
                                    .find('table')
                                    .filter((_i, el) =>
                                        Cypress.$(el)
                                            .find('thead th')
                                            .toArray()
                                            .some((th) => (th.textContent || '').trim() === 'Quota Type')
                                    )
                                    .first();

                                if (!$outerTable2.length) {
                                    cy.log(`⚠️ [${loopIdx + 1}] ไม่พบ outer table — ข้าม`);
                                    return;
                                }

                                const $allDataRows = $outerTable2
                                    .find('tbody tr')
                                    .filter((_i, el) => {
                                        const text = normalizeQuotaText(
                                            Cypress.$(el).find('td').first().text()
                                        );
                                        return (
                                            text.length > 0 &&
                                            text !== 'No data to display.' &&
                                            isKnownQuotaType(text)
                                        );
                                    });

                                const $targetRow = $allDataRows.eq(loopIdx);

                                if (!$targetRow.length) {
                                    cy.log(`⚠️ [${loopIdx + 1}] ไม่พบแถว .eq(${loopIdx}) — ข้าม`);
                                    return;
                                }

                                const quotaTypeText = $targetRow.find('td').first().text().trim();
                                cy.log(`📋 [${loopIdx + 1}] quota type = "${quotaTypeText}"`);

                                const $editBtn = $targetRow.find('button.btn-warning').first();

                                if (!$editBtn.length) {
                                    cy.log(`⚠️ [${loopIdx + 1}] ไม่พบปุ่ม Edit — ข้าม`);
                                    return;
                                }

                                cy.wrap($editBtn)
                                    .scrollIntoView()
                                    .should('be.visible')
                                    .click({ force: true });

                                cy.log(`✅ [${loopIdx + 1}] คลิก Edit แล้ว`);
                            });

                        cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should(($comp3) => {
                            expect(
                                isInternetDetailPanelOpen($comp3),
                                `Internet Detail panel should open (row ${loopIdx + 1})`
                            ).to.be.true;
                        });

                        cy.log(`✅ [${loopIdx + 1}] Internet Detail panel เปิดแล้ว`);

                        cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should(($comp) => {
                            const $pb = getInternetDetailPanelBody($comp);
                            expect(
                                $pb.length,
                                `panel-body ควรพบ (row ${loopIdx + 1})`
                            ).to.be.greaterThan(0);

                            const $updateBtn = $pb.find('button').filter(
                                (_i, btn) => (btn.textContent || '').trim() === 'Update'
                            );
                            const $addBtn = $pb.find('button').filter(
                                (_i, btn) => (btn.textContent || '').trim() === 'Add'
                            );

                            if ($addBtn.length > 0 && $updateBtn.length === 0) {
                                throw new Error(
                                    `❌ [row ${loopIdx + 1}] Panel เปิดมาเป็นโหมด "Add" (Quota Type ยังไม่เลือก) ` +
                                    `แทนที่จะเป็นโหมด "Edit" — น่าจะกดปุ่มผิด (คลิก "+" แทน Edit) หรือ panel เดิมค้างอยู่ก่อนหน้า`
                                );
                            }

                            expect(
                                $updateBtn.length,
                                `ควรพบปุ่ม "Update" ใน panel โหมด Edit (row ${loopIdx + 1})`
                            ).to.be.greaterThan(0);
                        });

                        updatePriorityInPanel();

                        safeClickCancel();

                        cy.get(INTERNET_COMPONENT, { timeout: 12000 }).should(($comp4) => {
                            expect(
                                isInternetDetailPanelOpen($comp4),
                                `Internet Detail panel should be closed before next iteration`
                            ).to.be.false;
                        });

                        cy.get(INTERNET_COMPONENT, { timeout: 12000 }).should(($comp5) => {
                            assertOuterQuotaHeaderReady($comp5);
                        });

                        cy.log(`✅ [${loopIdx + 1}] เสร็จสิ้น — พร้อม iteration ถัดไป`);
                    }
                );

                cy.log('✅ [checkAndUpdatePriority] ทำครบทุกแถวแล้ว');
            });
    });
};
