const INTERNAL_COMPANIES: string[] = ['AMP', 'AWN', 'FBB', 'MMT', 'SBN'];
const SHARE_UNITS: string[] = ['THB', 'USD'];
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}
function randomAmount(): string {
    return randomInt(1, 100000).toString();
}
function clickSingleVisibleButton($buttons: JQuery<HTMLElement>, label: string, which: 'first' | 'last' = 'first'): void {
    const $visible = Cypress.$($buttons).filter(':visible');
    if ($visible.length === 0) {
        cy.log(`ไม่พบปุ่ม "${label}" ที่ visible -> ข้าม`);
        return;
    }
    const $target = which === 'last' ? $visible.last() : $visible.first();
    cy.wrap($target).scrollIntoView().click({ force: true });
}
const SKIP_PROBABILITY = {
    INTERNAL_SHARE: 0,
    SHARING_PARTNER: 0,
    REVENUE_SHARING: 0,
    CHARGE_PARTNER: 0,
};
function shouldSkipFlow(label: string, skipProbability: number = 0): boolean {
    const skip = Math.random() < skipProbability;
    if (skip) {
        cy.log(`สุ่มผลลัพธ์: ข้าม "${label}" ทั้งหมด -> ไม่ทำอะไร`);
    }
    else {
        cy.log(`สุ่มผลลัพธ์: ดำเนินการ "${label}"`);
    }
    return skip;
}
function clickTabIfExists(tabName: string): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
        const $tab = $body.find('ul.nav-tabs li a').filter((_, el) => {
            return Cypress.$(el).text().trim().includes(tabName);
        });
        if ($tab.length > 0) {
            cy.wrap($tab.first()).scrollIntoView().click({ force: true });
            cy.wait(500);
            cy.log(`Tab "${tabName}" found -> clicked`);
            return cy.wrap(true);
        }
        else {
            cy.log(`Tab "${tabName}" ไม่มีในหน้านี้ -> ข้าม ไม่ทำให้ test fail`);
            return cy.wrap(false);
        }
    });
}
function countRealDataRows($table: JQuery<HTMLElement>): number {
    return $table
        .find('tbody tr')
        .filter((_, el) => {
        const text = Cypress.$(el).text().trim();
        return text !== '' && !text.includes('No data to display');
    })
        .length;
}
function clickPlusButtonIfExists(scopeSelector: string, label: string, which: 'first' | 'last' = 'first'): Cypress.Chainable<boolean> {
    const scopedSelector = scopeSelector
        ? `${scopeSelector} .glyphicon-plus`
        : '.glyphicon-plus';
    return retryUntilVisibleGlyphiconButton(scopedSelector, `ปุ่ม + สำหรับ "${label}"`).then(($btn) => {
        if (!$btn || $btn.length === 0) {
            return cy.wrap(false, { log: false });
        }
        const $target = which === 'last' ? $btn.last() : $btn.first();
        cy.wrap($target).scrollIntoView().should('be.visible').click({ force: true });
        cy.wait(500);
        cy.log(`เปิดฟอร์ม "${label}" สำเร็จ`);
        return cy.wrap(true, { log: false });
    });
}
function clickAddButtonIfExists(scopeSelector: string, label: string, which: 'first' | 'last' = 'last'): Cypress.Chainable<boolean> {
    const attempt = (attemptsLeft: number): Cypress.Chainable<boolean> => cy.get('body').then(($body) => {
        const $scope = scopeSelector ? $body.find(scopeSelector) : $body;
        const $btn = $scope
            .find('button')
            .filter(':visible')
            .filter((_, el) => Cypress.$(el).text().trim() === 'Add');
        if ($btn.length > 0) {
            const $target = which === 'last' ? $btn.last() : $btn.first();
            cy.wrap($target).scrollIntoView().should('be.enabled').click({ force: true });
            cy.wait(500);
            cy.log(`กด Add "${label}" สำเร็จ`);
            return cy.wrap(true, { log: false });
        }
        if (attemptsLeft <= 0) {
            cy.log(`ไม่พบปุ่ม Add สำหรับ "${label}" -> ข้าม`);
            return cy.wrap(false, { log: false });
        }
        cy.wait(400);
        return attempt(attemptsLeft - 1);
    });
    return attempt(6);
}
function retryUntilVisibleGlyphiconButton(glyphiconSelector: string, label: string, maxAttempts: number = 3, intervalMs: number = 400): Cypress.Chainable<JQuery<HTMLElement> | null> {
    const attempt = (attemptsLeft: number): Cypress.Chainable<JQuery<HTMLElement> | null> => cy.get('body').then(($body): Cypress.Chainable<JQuery<HTMLElement> | null> => {
        const $found = $body.find(glyphiconSelector).parent('button').filter(':visible') as JQuery<HTMLElement>;
        if ($found.length > 0) {
            return cy.wrap($found, { log: false }) as Cypress.Chainable<JQuery<HTMLElement> | null>;
        }
        if (attemptsLeft <= 0) {
            cy.log(`ไม่พบ "${label}" หลังรอครบ ${maxAttempts} ครั้ง -> ข้าม`);
            return cy.wrap(null, { log: false }) as Cypress.Chainable<JQuery<HTMLElement> | null>;
        }
        cy.wait(intervalMs);
        return attempt(attemptsLeft - 1) as Cypress.Chainable<JQuery<HTMLElement> | null>;
    });
    return attempt(maxAttempts);
}
function retryForSelectableOptions(selectSelector: string, label: string, maxAttempts: number = 3, intervalMs: number = 400): Cypress.Chainable<HTMLOptionElement[] | null> {
    const attempt = (attemptsLeft: number): Cypress.Chainable<HTMLOptionElement[] | null> => cy.get('body').then(($body): Cypress.Chainable<HTMLOptionElement[] | null> => {
        const $select = $body.find(selectSelector).filter(':visible');
        if ($select.length > 0) {
            const optionElements = ($select
                .last()
                .find('option:not([disabled])')
                .toArray() as HTMLElement[])
                .filter((el): el is HTMLOptionElement => el instanceof HTMLOptionElement);
            if (optionElements.length > 0) {
                return cy.wrap(optionElements, { log: false }) as Cypress.Chainable<HTMLOptionElement[] | null>;
            }
        }
        if (attemptsLeft <= 0) {
            cy.log(`"${label}" ไม่มีตัวเลือกให้เลือก (มีแค่ placeholder หรือไม่มี select เลย) -> ปกติ ไม่ใช่บั๊กเสมอไป -> ข้าม`);
            return cy.wrap(null, { log: false }) as Cypress.Chainable<HTMLOptionElement[] | null>;
        }
        cy.wait(intervalMs);
        return attempt(attemptsLeft - 1) as Cypress.Chainable<HTMLOptionElement[] | null>;
    });
    return attempt(maxAttempts);
}
function selectRandomDropdownOptionIfAny(selectSelector: string, label: string): void {
    retryForSelectableOptions(selectSelector, label).then((options) => {
        if (!options || options.length === 0)
            return;
        const randomOpt = options[randomInt(0, options.length - 1)];
        cy.get(selectSelector)
            .filter(':visible')
            .last()
            .scrollIntoView()
            .select(randomOpt.value, { force: true });
        cy.wait(400);
        cy.log(`"${label}" ที่เลือก: ${randomOpt.text.trim()}`);
    });
}
function retryUntilVisible(selector: string, label: string, maxAttempts: number = 3, intervalMs: number = 400): Cypress.Chainable<JQuery<HTMLElement> | null> {
    const attempt = (attemptsLeft: number): Cypress.Chainable<JQuery<HTMLElement> | null> => cy.get('body').then(($body): Cypress.Chainable<JQuery<HTMLElement> | null> => {
        const $found = $body.find(selector).filter(':visible') as JQuery<HTMLElement>;
        if ($found.length > 0) {
            return cy.wrap($found, { log: false }) as Cypress.Chainable<JQuery<HTMLElement> | null>;
        }
        if (attemptsLeft <= 0) {
            cy.log(`ไม่พบ "${label}" หลังรอครบ ${maxAttempts} ครั้ง -> ข้าม`);
            return cy.wrap(null, { log: false }) as Cypress.Chainable<JQuery<HTMLElement> | null>;
        }
        cy.wait(intervalMs);
        return attempt(attemptsLeft - 1) as Cypress.Chainable<JQuery<HTMLElement> | null>;
    });
    return attempt(maxAttempts);
}
function selectRandomMatOption(matSelectScopeSelector: string, label: string, which: 'first' | 'last' = 'last'): void {
    retryUntilVisible(`${matSelectScopeSelector} mat-select .mat-select-trigger`, `mat-select-trigger ของ "${label}"`).then(($trigger) => {
        if (!$trigger || $trigger.length === 0)
            return;
        const $target = which === 'last' ? $trigger.last() : $trigger.first();
        cy.wrap($target).scrollIntoView().click({ force: true });
        cy.wait(500);
        retryUntilVisible('.cdk-overlay-container mat-option', `mat-option ใน overlay ของ "${label}"`).then(($options) => {
            if (!$options || $options.length === 0)
                return;
            const selectable = $options.toArray().filter((el) => {
                const text = (el as HTMLElement).innerText.trim();
                const isDisabled = el.getAttribute('aria-disabled') === 'true';
                return !isDisabled && text.length > 0 && text !== 'Please Select';
            });
            if (selectable.length === 0) {
                cy.log(`ไม่พบตัวเลือกที่เลือกได้สำหรับ "${label}" -> ข้าม`);
                cy.get('body').then(($b) => {
                    if ($b.find('.cdk-overlay-backdrop').length > 0) {
                        cy.get('.cdk-overlay-backdrop').click({ force: true });
                    }
                });
                return;
            }
            const chosen = selectable[randomInt(0, selectable.length - 1)];
            const chosenText = (chosen as HTMLElement).innerText.trim();
            cy.wrap(chosen).scrollIntoView().click({ force: true });
            cy.wait(500);
            cy.log(`"${label}" ที่เลือก: ${chosenText}`);
        });
    });
}
const INTERNAL_SHARE_COMPONENT = 'app-mass-mkt-internal-share';
export function InternalShare(): void {
    if (shouldSkipFlow('Internal Share', SKIP_PROBABILITY.INTERNAL_SHARE))
        return;
    clickTabIfExists('Internal Share').then((found) => {
        if (!found)
            return;
        cy.get('body').then(($body) => {
            if ($body.find(INTERNAL_SHARE_COMPONENT).length === 0) {
                cy.log(`ไม่พบ component ${INTERNAL_SHARE_COMPONENT} -> ข้าม`);
                return;
            }
            if ($body.find(`${INTERNAL_SHARE_COMPONENT} input[formcontrolname="shareAtCostFlag"]`).length === 0) {
                cy.log('ไม่พบ radio shareAtCostFlag -> ข้าม');
                return;
            }
            const shareAtCostYes: boolean = Math.random() < 0.6;
            cy.get(`${INTERNAL_SHARE_COMPONENT} input[formcontrolname="shareAtCostFlag"]`)
                .eq(shareAtCostYes ? 0 : 1)
                .scrollIntoView()
                .check({ force: true });
            cy.wait(500);
            if (!shareAtCostYes) {
                cy.log('Share At Cost = No -> จบ ไม่ต้องเพิ่ม Internal Company');
                return;
            }
            cy.log('Share At Cost = Yes -> เริ่มเพิ่ม Internal Company');
            const rowsToAdd = randomInt(1, 3);
            for (let i = 0; i < rowsToAdd; i++) {
                addInternalShareRow(i);
            }
        });
    });
}
function addInternalShareRow(rowIndex: number): void {
    cy.get('body').then(($b) => {
        const $plusBtn = $b
            .find(`${INTERNAL_SHARE_COMPONENT} button`)
            .filter((_, el) => Cypress.$(el).find('.glyphicon-plus').length > 0 && Cypress.$(el).is(':visible'));
        if ($plusBtn.length === 0 || $plusBtn.is(':disabled')) {
            cy.log(`ปุ่ม + Internal Company (row ${rowIndex}) ถูก disable หรือไม่พบ -> ข้าม`);
            return;
        }
        cy.wrap($plusBtn.first())
            .scrollIntoView()
            .click({ force: true });
        cy.wait(500);
        cy.log(`เปิดฟอร์ม "Internal Company row ${rowIndex}" สำเร็จ`);
    });
    cy.get('body').then(($b) => {
        const $detailHeader = $b
            .find(`${INTERNAL_SHARE_COMPONENT} h3.h3-panel-header:contains("Internal Share Detail")`)
            .filter(':visible');
        if ($detailHeader.length === 0) {
            cy.log(`ไม่พบ panel "Internal Share Detail" (row ${rowIndex}) -> ข้าม`);
            return;
        }
        const $detailPanel = $detailHeader.last().closest('.panel');
        cy.wrap($detailPanel).as(`internalSharePanel_${rowIndex}`);
        cy.wrap($detailPanel)
            .scrollIntoView()
            .should('be.visible');
    });
    cy.get('body').then(($b) => {
        if ($b.find(`${INTERNAL_SHARE_COMPONENT} h3.h3-panel-header:contains("Internal Share Detail")`).filter(':visible').length === 0) {
            cy.log(`ข้ามการกรอก Internal Company (row ${rowIndex}) เพราะไม่พบ panel ที่เปิดอยู่`);
            return;
        }
        cy.get(`@internalSharePanel_${rowIndex}`).within(() => {
            cy.get('select[formcontrolname="internalCompany"]')
                .filter(':visible')
                .scrollIntoView()
                .select(randomItem(['AMP', 'AWN', 'FBB', 'MMT', 'SBN']), { force: true });
            cy.wait(400);
            cy.get('input[formcontrolname="shareAmount"]')
                .filter(':visible')
                .type(randomAmount(), { force: true })
                .blur({ force: true });
            cy.wait(300);
            cy.root().then(($root) => {
                const $unitSelect = Cypress.$($root)
                    .find('select[formcontrolname="shareAmountUnit"]')
                    .filter(':visible');
                const hasOptions = $unitSelect.find('option:not([disabled])').length > 0;
                if ($unitSelect.length > 0 && hasOptions) {
                    const unit = selectRandomAvailableOption($unitSelect);
                    if (unit) {
                        cy.wrap($unitSelect).select(unit, { force: true });
                    }
                }
                else {
                    cy.log(`select shareAmountUnit ยังไม่มี option (row ${rowIndex}) -> ข้าม`);
                }
            });
            cy.wait(300);
        });
    });
    cy.get(`@internalSharePanel_${rowIndex}`).then(($panel) => {
        const $addBtn = Cypress.$($panel)
            .find('button')
            .filter((_, el) => Cypress.$(el).text().trim() === 'Add' && Cypress.$(el).is(':visible'));
        if ($addBtn.length === 0) {
            cy.log(`ไม่พบปุ่ม Add สำหรับบันทึก Internal Company (row ${rowIndex}) -> ข้าม`);
            return;
        }
        cy.wrap($panel).within(() => {
            cy.contains('button', 'Add')
                .filter(':visible')
                .first()
                .scrollIntoView()
                .click({ force: true });
        });
        cy.wait(500);
        cy.log(`บันทึกแถว Internal Company row ${rowIndex} เรียบร้อย`);
    });
    cy.get('body').then(($b) => {
        const $stillOpenForm = $b
            .find(`${INTERNAL_SHARE_COMPONENT} h3.h3-panel-header:contains("Internal Share Detail")`)
            .filter(':visible')
            .closest('.panel')
            .find('select[formcontrolname="internalCompany"]')
            .filter(':visible');
        if ($stillOpenForm.length > 0) {
            cy.log(`ฟอร์ม Internal Company ยังไม่ปิด (row ${rowIndex}) -> กด Add ซ้ำ`);
            cy.get(`@internalSharePanel_${rowIndex}`).within(() => {
                cy.contains('button', 'Add')
                    .filter(':visible')
                    .first()
                    .scrollIntoView()
                    .click({ force: true });
            });
            cy.wait(500);
        }
    });
}
export function SharingPartner(): void {
    if (shouldSkipFlow('Sharing Partner', SKIP_PROBABILITY.SHARING_PARTNER))
        return;
    clickTabIfExists('Sharing Partner').then((found) => {
        if (!found)
            return;
        cy.get('body').then(($body) => {
            if ($body.find('app-mass-mkt-sharing-partner').length === 0) {
                cy.log('ไม่พบ component app-mass-mkt-sharing-partner -> ข้าม');
                return;
            }
            clickPlusButtonIfExists('app-mass-mkt-sharing-partner', 'Sharing Partner');
            selectRandomMatOption('app-mass-mkt-sharing-partner', 'Sharing Partner', 'last');
            selectRandomDropdownOptionIfAny('app-mass-mkt-sharing-partner select[formcontrolname="shareAmount"]', 'Sharing Partner Amount');
            clickAddButtonIfExists('app-mass-mkt-sharing-partner', 'Sharing Partner', 'last');
            cy.get('body').then(($b) => {
                const $table = $b.find('app-mass-mkt-sharing-partner table');
                if ($table.length > 0) {
                    const before = countRealDataRows($table);
                    cy.log(`Sharing Partner: จำนวนแถวข้อมูลจริงหลัง Add = ${before}`);
                }
            });
        });
    });
}
const REVENUE_SHARING_COMPONENT = 'app-mass-mkt-revenue-sharing';
type StepRangeState = {
    lastStepTo: number;
};
function selectRandomAvailableOption($select: JQuery<HTMLElement>): string | null {
    const options = $select
        .find('option')
        .toArray()
        .map((el) => Cypress.$(el).val() as string)
        .filter((v) => v && !v.startsWith('0:'));
    if (options.length === 0)
        return null;
    return options[randomInt(0, options.length - 1)];
}
export function RevenueSharing(): void {
    if (shouldSkipFlow('Revenue Sharing', SKIP_PROBABILITY.REVENUE_SHARING))
        return;
    clickTabIfExists('Revenue Sharing').then((found) => {
        if (!found)
            return;
        let modelSharingValue: string | null = null;
        let sharingTypeValue: 'Flat' | 'Step' | 'Tier' | null = null;
        const stepRangeState: StepRangeState = { lastStepTo: 0 };
        cy.get('body').then(($body) => {
            if ($body.find(REVENUE_SHARING_COMPONENT).length === 0) {
                cy.log(`ไม่พบ component ${REVENUE_SHARING_COMPONENT} -> ข้าม`);
                return;
            }
            if ($body.find(`${REVENUE_SHARING_COMPONENT} input[name="revenueSharingFlag"]`).length === 0) {
                cy.log('ไม่พบ radio revenueSharingFlag -> ข้าม');
                return;
            }
            const revenueSharingYes: boolean = Math.random() < 0.6;
            cy.get(`${REVENUE_SHARING_COMPONENT} input[name="revenueSharingFlag"]`)
                .eq(revenueSharingYes ? 0 : 1)
                .scrollIntoView()
                .check({ force: true });
            cy.wait(500);
            if (!revenueSharingYes) {
                cy.log('Revenue Sharing = No -> จบ ไม่ต้องกรอกอะไรเพิ่ม');
                return;
            }
            cy.log('Revenue Sharing = Yes -> เริ่มกรอก Model Sharing Detail');
            cy.get('body').then(($b1) => {
                if ($b1.find(`${REVENUE_SHARING_COMPONENT} select[formcontrolname="sharingBasis"]`).filter(':visible').length > 0) {
                    const sharingBasisValue = randomItem(['CSH', 'ACR']);
                    cy.get(`${REVENUE_SHARING_COMPONENT} select[formcontrolname="sharingBasis"]`)
                        .filter(':visible')
                        .scrollIntoView()
                        .select(sharingBasisValue, { force: true });
                    cy.wait(400);
                    cy.log(`Sharing Basis: ${sharingBasisValue}`);
                }
                else {
                    cy.log('ไม่พบ select sharingBasis -> ข้าม');
                }
            });
            cy.get('body').then(($b2) => {
                if ($b2.find(`${REVENUE_SHARING_COMPONENT} select[formcontrolname="modelSharing"]`).filter(':visible').length > 0) {
                    modelSharingValue = randomItem(['Other', 'Fix', 'Rev Share']);
                    cy.get(`${REVENUE_SHARING_COMPONENT} select[formcontrolname="modelSharing"]`)
                        .filter(':visible')
                        .scrollIntoView()
                        .select(modelSharingValue, { force: true });
                    cy.wait(400);
                    cy.log(`Model Sharing: ${modelSharingValue}`);
                    if (modelSharingValue === 'Other') {
                        cy.log('Model Sharing = Other -> ไม่มี Portion Sharing / Sharing Type -> ข้าม');
                    }
                    else {
                        cy.get('body').then(($pb) => {
                            const $portionRadio = $pb.find(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="portionSharing"]`).filter(':visible');
                            if ($portionRadio.length > 0) {
                                const portionYes: boolean = Math.random() < 0.6;
                                cy.get(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="portionSharing"]`)
                                    .filter(':visible')
                                    .eq(portionYes ? 0 : 1)
                                    .scrollIntoView()
                                    .check({ force: true });
                                cy.wait(400);
                                cy.log(`Portion Sharing: ${portionYes ? 'Yes' : 'No'}`);
                            }
                            else {
                                cy.log('คาดว่าจะพบ Portion Sharing radio (Model Sharing != Other) แต่ไม่พบ -> ข้าม');
                            }
                        });
                        cy.get('body').then(($sb) => {
                            const $sharingTypeRadio = $sb.find(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="sharingType"]`).filter(':visible');
                            if ($sharingTypeRadio.length > 0) {
                                const idx = randomInt(0, $sharingTypeRadio.length - 1);
                                const typeLabels: Array<'Flat' | 'Step' | 'Tier'> = ['Flat', 'Step', 'Tier'];
                                sharingTypeValue = typeLabels[idx] ?? null;
                                cy.get(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="sharingType"]`)
                                    .filter(':visible')
                                    .eq(idx)
                                    .scrollIntoView()
                                    .check({ force: true });
                                cy.wait(400);
                                cy.log(`Sharing Type ที่เลือก: ${sharingTypeValue} (index ${idx})`);
                            }
                            else {
                                cy.log('คาดว่าจะพบ Sharing Type radio (Model Sharing != Other) แต่ไม่พบ -> ข้าม');
                            }
                        });
                    }
                }
                else {
                    cy.log('ไม่พบ select modelSharing -> ข้าม');
                }
            });
            cy.get('body').then(($b5) => {
                if ($b5.find(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="internalShareFlag"]`).filter(':visible').length > 0) {
                    const internalYes: boolean = Math.random() < 0.6;
                    cy.get(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="internalShareFlag"]`)
                        .filter(':visible')
                        .eq(internalYes ? 0 : 1)
                        .scrollIntoView()
                        .check({ force: true });
                    cy.wait(400);
                    cy.log(`Internal Share: ${internalYes ? 'Yes' : 'No'}`);
                    if (internalYes) {
                        cy.get('body').then(($ib) => {
                            const $internalHeader = $ib
                                .find(`${REVENUE_SHARING_COMPONENT} h3.h3-panel-header:contains("Internal Share")`)
                                .filter(':visible');
                            if ($internalHeader.length === 0) {
                                cy.log('Internal Share = Yes แต่ไม่พบ panel Internal Share -> ข้าม');
                                return;
                            }
                            const $internalPanel = $internalHeader.last().closest('.panel');
                            const $defaultBtn = $internalPanel
                                .find('button')
                                .filter(':visible')
                                .filter((_, el) => Cypress.$(el).text().trim() === 'Default MMT Model');
                            if ($defaultBtn.length > 0) {
                                cy.wrap($defaultBtn.first())
                                    .scrollIntoView()
                                    .click({ force: true });
                                cy.wait(500);
                                cy.log('กด "Default MMT Model" สำเร็จ -> ควรได้ 2 row (AWN + MMT) ครบตาม validate');
                            }
                            else {
                                cy.log('ไม่พบปุ่ม "Default MMT Model" -> ข้าม (table อาจยังไม่ครบ 2 row)');
                            }
                        });
                    }
                }
                else {
                    cy.log('ไม่พบ Internal Share radio -> ข้าม');
                }
            });
            cy.get('body').then(($b7) => {
                if (modelSharingValue === 'Other' || modelSharingValue === null) {
                    cy.log('Model Sharing = Other (หรือไม่พบ) -> ไม่มี Revenue Sharing table -> ข้าม');
                    return;
                }
                const $revenueHeader = $b7.find(`${REVENUE_SHARING_COMPONENT} h3.h3-panel-header:contains("Revenue Sharing")`);
                if ($revenueHeader.length === 0) {
                    cy.log('ไม่พบ panel header Revenue Sharing -> ข้าม');
                    return;
                }
                const rowsNeeded = sharingTypeValue === 'Flat' ? 1 : 2;
                cy.log(`Sharing Type = ${sharingTypeValue ?? 'unknown'} -> ต้องเพิ่ม ${rowsNeeded} row(s)`);
                for (let i = 0; i < rowsNeeded; i++) {
                    addRevenueSharingRow(i, sharingTypeValue, stepRangeState);
                }
            });
            cy.get('body').then(($b8) => {
                const hasInternalSharePanel = $b8.find(`${REVENUE_SHARING_COMPONENT} h3:contains("Internal Share")`).length > 0;
                if (hasInternalSharePanel) {
                    cy.log('พบ panel Internal Share -> สามารถต่อยอด logic ได้ที่นี่');
                }
                else {
                    cy.log('ไม่พบ panel Internal Share ในรอบนี้ -> ข้าม');
                }
            });
        });
    });
}
function addRevenueSharingRow(rowIndex: number, sharingTypeValue: 'Flat' | 'Step' | 'Tier' | null, stepRangeState: StepRangeState): void {
    let newCpId = '';
    let rowUnit: string | null = null;
    let isPercentRow = false;
    let awnAmount = '';
    let newCpAmount = '';
    cy.get('body').then(($b) => {
        const $header = $b.find(`${REVENUE_SHARING_COMPONENT} h3.h3-panel-header:contains("Revenue Sharing")`);
        const $plusBtn = $header.parents('.panel').find('.glyphicon-plus').parent('button').filter(':visible');
        if ($plusBtn.length === 0 || $plusBtn.is(':disabled')) {
            cy.log(`ปุ่ม + Revenue Sharing (row ${rowIndex}) ถูก disable หรือไม่พบ -> ข้าม`);
            return;
        }
        cy.contains(`${REVENUE_SHARING_COMPONENT} h3.h3-panel-header`, 'Revenue Sharing')
            .parents('.panel')
            .find('.glyphicon-plus')
            .parent('button')
            .filter(':visible')
            .then(($buttons) => {
            clickSingleVisibleButton($buttons, 'Revenue Sharing +', 'first');
        });
        cy.wait(500);
        cy.log(`เปิดฟอร์มเพิ่มแถว Revenue Sharing (row ${rowIndex})`);
    });
    if (sharingTypeValue === 'Step' || sharingTypeValue === 'Tier') {
        cy.get('body').then(($b) => {
            const $stepFrom = $b.find(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="stepFrom"]`).filter(':visible');
            if ($stepFrom.length === 0) {
                cy.log(`Sharing Type = ${sharingTypeValue} แต่ไม่พบ input stepFrom (row ${rowIndex}) -> ข้าม`);
                return;
            }
            const stepFromValue = stepRangeState.lastStepTo + 1;
            const stepToValue = stepFromValue + randomInt(50, 99);
            stepRangeState.lastStepTo = stepToValue;
            cy.get(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="stepFrom"]`)
                .filter(':visible')
                .last()
                .scrollIntoView()
                .type(String(stepFromValue), { force: true })
                .blur({ force: true });
            cy.get(`${REVENUE_SHARING_COMPONENT} input[formcontrolname="stepTo"]`)
                .filter(':visible')
                .last()
                .type(String(stepToValue), { force: true })
                .blur({ force: true });
            cy.get('body').then(($sb) => {
                const $stepUnitSelect = $sb
                    .find(`${REVENUE_SHARING_COMPONENT} select[formcontrolname="stepUnit"]`)
                    .filter(':visible')
                    .last();
                if ($stepUnitSelect.length > 0) {
                    const unit = selectRandomAvailableOption($stepUnitSelect);
                    if (unit) {
                        cy.wrap($stepUnitSelect).select(unit, { force: true });
                        cy.log(`Step Unit (row ${rowIndex}): ${unit}`);
                    }
                    else {
                        cy.log(`stepUnit ไม่มี option ให้เลือก (row ${rowIndex}) -> ข้าม`);
                    }
                }
                else {
                    cy.log(`ไม่พบ select stepUnit (row ${rowIndex}) -> ข้าม`);
                }
            });
            cy.wait(300);
            cy.log(`Step Range (row ${rowIndex}, ${sharingTypeValue}): ${stepFromValue} - ${stepToValue}`);
        });
    }
    cy.get('body').then(($b) => {
        const $cpHeaders = $b
            .find(`${REVENUE_SHARING_COMPONENT} h3:contains("CP Sharing")`)
            .filter(':visible');
        if ($cpHeaders.length === 0) {
            cy.log(`ไม่พบ panel CP Sharing (row ${rowIndex}) -> ข้าม`);
            return;
        }
        const $cpPanel = $cpHeaders.last().closest('.panel');
        const $editBtn = $cpPanel.find('button[title="Edit"]').filter(':visible').first();
        if ($editBtn.length === 0) {
            cy.log(`ไม่พบปุ่ม Edit ของ CP Sharing default row (row ${rowIndex}) -> ข้าม`);
            return;
        }
        cy.wrap($cpPanel).as(`cpPanel_${rowIndex}`);
        clickSingleVisibleButton($editBtn, 'Edit CP Sharing', 'first');
        cy.wait(400);
    });
    cy.get('body').then(($b) => {
        if ($b.find(`${REVENUE_SHARING_COMPONENT} h3:contains("CP Sharing")`).filter(':visible').length === 0) {
            cy.log(`ข้ามการกรอก Share Amount (row ${rowIndex}) เพราะไม่พบ panel ที่เปิดอยู่`);
            return;
        }
        cy.get(`@cpPanel_${rowIndex}`).within(() => {
            cy.root().then(($root) => {
                const $unitSelect = Cypress.$($root)
                    .find('select[formcontrolname="shareAmountUnit"]')
                    .filter(':visible');
                if ($unitSelect.length > 0) {
                    const options = $unitSelect
                        .find('option')
                        .toArray()
                        .map((el) => Cypress.$(el).val() as string)
                        .filter((v) => v && !v.startsWith('0:'));
                    const percentOption = options.find((v) => v.trim().includes('%'));
                    if (percentOption) {
                        isPercentRow = true;
                        rowUnit = percentOption;
                        const awnShare = randomInt(1, 99);
                        awnAmount = String(awnShare);
                        newCpAmount = String(100 - awnShare);
                        cy.log(`row ${rowIndex}: unit มี "%" -> บังคับ AWN=${awnAmount}% + CP ใหม่=${newCpAmount}% (รวม 100%)`);
                    }
                    else {
                        rowUnit = selectRandomAvailableOption($unitSelect);
                        awnAmount = randomAmount();
                    }
                }
                else {
                    awnAmount = randomAmount();
                }
            });
            cy.get('input[formcontrolname="shareAmount"]')
                .filter(':visible')
                .scrollIntoView()
                .then(($input) => {
                cy.wrap($input).clear({ force: true }).type(awnAmount, { force: true }).blur({ force: true });
            });
            cy.root().then(($root) => {
                const $unitSelect = Cypress.$($root)
                    .find('select[formcontrolname="shareAmountUnit"]')
                    .filter(':visible');
                if ($unitSelect.length > 0 && rowUnit) {
                    cy.wrap($unitSelect).select(rowUnit, { force: true });
                    cy.log(`Share Amount Unit (default CP, row ${rowIndex}): ${rowUnit}`);
                }
            });
            cy.wait(300);
            cy.contains('button', 'Update')
                .filter(':visible')
                .then(($buttons) => {
                clickSingleVisibleButton($buttons, 'Update', 'first');
            });
        });
        cy.wait(400);
        cy.log(`CP Sharing default (AWN) row (row ${rowIndex}): Share Amount filled + Update`);
    });
    cy.get(`@cpPanel_${rowIndex}`).within(() => {
        cy.get('button')
            .filter((_, el) => Cypress.$(el).find('.glyphicon-plus').length > 0 && Cypress.$(el).is(':visible'))
            .then(($buttons) => {
            clickSingleVisibleButton($buttons, 'CP Sharing +', 'first');
        });
    });
    cy.wait(400);
    cy.log(`กด "+" ใหม่ใน CP Sharing (row ${rowIndex}) เพื่อเพิ่ม CP อีกตัว`);
    cy.get(`@cpPanel_${rowIndex}`).within(() => {
        newCpId = `CP${randomInt(1000, 9999)}`;
        cy.get('input[formcontrolname="cpId"]')
            .filter(':visible')
            .last()
            .scrollIntoView()
            .type(newCpId, { force: true })
            .blur({ force: true });
        cy.get('input[formcontrolname="cpName"]')
            .filter(':visible')
            .last()
            .type(randomItem(['AMP', 'FBB', 'MMT', 'SBN']), { force: true })
            .blur({ force: true });
        cy.get('input[formcontrolname="shareAmount"]')
            .filter(':visible')
            .last()
            .then(($input) => {
            const amount = isPercentRow ? newCpAmount : randomAmount();
            cy.wrap($input).clear({ force: true }).type(amount, { force: true }).blur({ force: true });
        });
        cy.root().then(($root) => {
            const $unitSelect = Cypress.$($root)
                .find('select[formcontrolname="shareAmountUnit"]')
                .filter(':visible')
                .last();
            if ($unitSelect.length > 0) {
                const unit = isPercentRow && rowUnit ? rowUnit : selectRandomAvailableOption($unitSelect);
                if (unit) {
                    cy.wrap($unitSelect).select(unit, { force: true });
                    cy.log(`Share Amount Unit (new CP, row ${rowIndex}): ${unit}`);
                }
                else {
                    cy.log(`shareAmountUnit ไม่มี option ให้เลือก (new CP, row ${rowIndex}) -> ข้าม`);
                }
            }
        });
        cy.wait(300);
        cy.contains('button', 'Add')
            .filter(':visible')
            .then(($buttons) => {
            clickSingleVisibleButton($buttons, 'Add CP', 'first');
        });
    });
    cy.wait(400);
    cy.get(`@cpPanel_${rowIndex}`).then(($panel) => {
        const $stillOpenForm = Cypress.$($panel).find('input[formcontrolname="cpId"]').filter(':visible');
        if ($stillOpenForm.length > 0) {
            cy.log(`ฟอร์มเพิ่ม CP ยังไม่ปิด (row ${rowIndex}) -> field อาจยัง validate ไม่ทัน -> กด Add ซ้ำ`);
            cy.wrap($panel).within(() => {
                cy.contains('button', 'Add')
                    .filter(':visible')
                    .first()
                    .scrollIntoView()
                    .click({ force: true });
            });
            cy.wait(400);
        }
        else {
            cy.log(`เพิ่ม CP ใหม่สำเร็จตั้งแต่กดครั้งแรก (row ${rowIndex})`);
        }
    });
    cy.log(`เพิ่ม CP ใหม่ใน row ${rowIndex} เรียบร้อย (Edit -> Update -> + -> Add [+ retry ถ้าจำเป็น])`);
    cy.get('body').then(($b) => {
        const hasSumAlert = $b
            .find(`${REVENUE_SHARING_COMPONENT} .alert-danger`)
            .filter(':visible')
            .text()
            .includes('must be 100%');
        if (hasSumAlert) {
            cy.log(`⚠️ row ${rowIndex}: ยังเจอ alert "Sum of Share Amount must be 100%" -> ผลรวม % อาจไม่ครบ (AWN=${awnAmount}, ใหม่=${newCpAmount})`);
        }
    });
    cy.get('body').then(($b) => {
        const $addBtn = $b
            .find(`${REVENUE_SHARING_COMPONENT} button`)
            .filter((_, el) => Cypress.$(el).text().trim() === 'Add' && Cypress.$(el).is(':visible'));
        if ($addBtn.length === 0) {
            cy.log(`ไม่พบปุ่ม Add สำหรับบันทึกแถว (row ${rowIndex}) -> ข้าม`);
            return;
        }
        const $table = $b.find(`${REVENUE_SHARING_COMPONENT} table`).filter(':visible');
        const rowsBefore = $table.length > 0 ? countRealDataRows($table) : 0;
        clickSingleVisibleButton($addBtn, 'Add row', 'last');
        cy.wait(500);
        cy.get('body').then(($after) => {
            const $tableAfter = $after.find(`${REVENUE_SHARING_COMPONENT} table`).filter(':visible');
            const rowsAfter = $tableAfter.length > 0 ? countRealDataRows($tableAfter) : 0;
            if (newCpId && $tableAfter.text().includes(newCpId)) {
                cy.log(`บันทึกแถว Revenue Sharing row ${rowIndex} เรียบร้อย -> พบ CP ${newCpId} ในตารางจริง`);
            }
            else if (rowsAfter > rowsBefore) {
                cy.log(`บันทึกแถว Revenue Sharing row ${rowIndex} เรียบร้อย -> จำนวนแถวข้อมูลจริงเพิ่มขึ้น (${rowsBefore} -> ${rowsAfter})`);
            }
            else {
                cy.log(`⚠️ คลิก Add แล้วแต่ไม่พบ CP ${newCpId || '(ไม่ทราบ id)'} ในตาราง (แถวข้อมูลจริง: ${rowsBefore} -> ${rowsAfter}) -> ตรวจ validation / formcontrolname`);
            }
        });
    });
}
const CHARGE_PARTNER_COMPONENT = 'app-mass-mkt-charge-partner';
export function ChargePartner(): void {
    if (shouldSkipFlow('Charge Partner', SKIP_PROBABILITY.CHARGE_PARTNER))
        return;
    clickTabIfExists('Charge Partner').then((found) => {
        if (!found)
            return;
        cy.get('body').then(($body) => {
            if ($body.find(CHARGE_PARTNER_COMPONENT).length === 0) {
                cy.log(`ไม่พบ component ${CHARGE_PARTNER_COMPONENT} -> ข้าม`);
                return;
            }
            if ($body.find(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargePartnerFlag"]`).length === 0) {
                cy.log('ไม่พบ radio chargePartnerFlag -> ข้าม');
                return;
            }
            const chargePartnerYes: boolean = Math.random() < 0.6;
            cy.get(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargePartnerFlag"]`)
                .eq(chargePartnerYes ? 0 : 1)
                .scrollIntoView()
                .check({ force: true });
            cy.wait(500);
            if (!chargePartnerYes) {
                cy.log('Charge Partner = No -> ไม่ต้องเพิ่มค่าใด ๆ (ค่า default)');
                return;
            }
            cy.log('Charge Partner = Yes -> เริ่มเลือก CP Name');
            cy.get('body').then(($b1) => {
                if ($b1.find(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="cpName"]`).filter(':visible').length === 0) {
                    cy.log('ไม่พบ select cpName -> ข้าม');
                    return;
                }
                cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="cpName"]`).filter(':visible').then(($select) => {
                    const options = $select.find('option')
                        .toArray()
                        .filter((opt) => {
                        const val = Cypress.$(opt).val() as string;
                        return val && !val.startsWith('0:');
                    });
                    if (options.length === 0) {
                        cy.log('ไม่พบตัวเลือก CP Name ที่เลือกได้ -> ข้าม');
                        return;
                    }
                    const randomOpt = options[randomInt(0, options.length - 1)];
                    const value = Cypress.$(randomOpt).val() as string;
                    cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="cpName"]`).filter(':visible').scrollIntoView().select(value, { force: true });
                    cy.wait(400);
                    cy.log(`CP Name ที่เลือกจาก dropdown: ${Cypress.$(randomOpt).text().trim()}`);
                });
            });
            // ปิดการใช้งานเคส "กด + เพื่อเพิ่ม CP Name ใหม่" -> เข้าเฉพาะเคสสุ่มเลือกจาก dropdown เท่านั้น
            // โค้ดเดิมเก็บไว้ด้านล่างเผื่อกลับมาใช้ภายหลัง (ห้ามลบ)
            /*
            const shouldAddNewCpName: boolean = Math.random() < 0.15;
            if (shouldAddNewCpName) {
                cy.get('body').then(($b2) => {
                    const $addBtn = $b2.find(`${CHARGE_PARTNER_COMPONENT} button[title="Add"]`).filter(':visible');
                    if ($addBtn.length > 0) {
                        cy.get(`${CHARGE_PARTNER_COMPONENT} button[title="Add"]`).filter(':visible').first().scrollIntoView().click({ force: true });
                        cy.wait(400);
                        // createCpNameIfModalOpen();
                    }
                    else {
                        cy.log('ไม่พบปุ่ม Add ข้าง CP Name -> ข้าม');
                    }
                });
            }
            else {
                cy.log('ใช้ CP Name ที่เลือกจาก dropdown (ไม่กด Add)');
            }
            */
            cy.log('ใช้ CP Name ที่เลือกจาก dropdown เท่านั้น [เคส Add ถูกปิดใช้งาน]');
            clickPlusButtonIfExists(CHARGE_PARTNER_COMPONENT, 'Charge Partner', 'last');
            cy.get('body').then(($b4) => {
                if ($b4.find(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="chargeModel"]`).filter(':visible').length === 0) {
                    cy.log('ไม่พบ select chargeModel -> ข้าม');
                    return;
                }
                const isFix: boolean = Math.random() < 0.6;
                const modelValue = isFix ? '1: Fix' : '2: Percentage';
                cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="chargeModel"]`)
                    .filter(':visible')
                    .scrollIntoView()
                    .select(modelValue, { force: true });
                cy.wait(500);
                cy.log(`Charge Model ที่เลือก: ${isFix ? 'Fix' : 'Percentage'}`);
                cy.get('body').then(($b5) => {
                    if ($b5.find(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="chargeBy"]`).filter(':visible').length > 0) {
                        const chargeByValues = ['1: AMP', '2: AWN', '3: MMT', '4: FBB', '5: SBN'];
                        const chargeByValue = randomItem(chargeByValues);
                        cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="chargeBy"]`)
                            .filter(':visible')
                            .scrollIntoView()
                            .select(chargeByValue, { force: true });
                        cy.wait(400);
                        cy.log(`Charge By ที่เลือก: ${chargeByValue}`);
                    }
                    else {
                        cy.log('ไม่พบ select chargeBy -> ข้าม');
                    }
                });
                if (isFix) {
                    cy.get('body').then(($b6) => {
                        if ($b6.find(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargeExcVat"]`).filter(':visible').length > 0) {
                            cy.get(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargeExcVat"]`)
                                .filter(':visible')
                                .scrollIntoView()
                                .type(randomAmount(), { force: true })
                                .blur({ force: true });
                            cy.wait(300);
                        }
                        // if ($b6.find(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargeIncVat"]`).filter(':visible').length > 0) {
                        // cy.get(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="chargeIncVat"]`)
                        //         .filter(':visible')
                        //         .scrollIntoView()
                        //         .type(randomAmount(), { force: true })
                        //         .blur({ force: true });
                        //     cy.wait(300);
                        // }
                        if ($b6.find(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="fixChargeUnit"]`).filter(':visible').length > 0) {
                            const unitValue = randomItem(['1: THB', '2: USD']);
                            cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="fixChargeUnit"]`)
                                .filter(':visible')
                                .scrollIntoView()
                                .select(unitValue, { force: true });
                            cy.wait(300);
                        }
                    });
                }
                else {
                    cy.get('body').then(($b7) => {
                        if ($b7.find(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="baseOnExcVat"]`).filter(':visible').length > 0) {
                            cy.get(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="baseOnExcVat"]`)
                                .filter(':visible')
                                .scrollIntoView()
                                .type(randomAmount(), { force: true })
                                .blur({ force: true });
                            cy.wait(300);
                        }
                        if ($b7.find(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="baseOnUnit"]`).filter(':visible').length > 0) {
                            const unitValue = randomItem(['1: THB', '2: USD']);
                            cy.get(`${CHARGE_PARTNER_COMPONENT} select[formcontrolname="baseOnUnit"]`)
                                .filter(':visible')
                                .scrollIntoView()
                                .select(unitValue, { force: true });
                            cy.wait(300);
                        }
                        if ($b7.find(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="charge"]`).filter(':visible').length > 0) {
                            const percentValue = randomInt(1, 100).toString();
                            cy.get(`${CHARGE_PARTNER_COMPONENT} input[formcontrolname="charge"]`)
                                .filter(':visible')
                                .scrollIntoView()
                                .type(percentValue, { force: true })
                                .blur({ force: true });
                            cy.wait(300);
                        }
                    });
                }
                clickAddButtonIfExists(CHARGE_PARTNER_COMPONENT, 'Charge Partner Detail', 'last');
            });
        });
    });
}