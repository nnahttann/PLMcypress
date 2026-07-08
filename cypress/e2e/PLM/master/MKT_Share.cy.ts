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

// ---------------------------------------------------------------
// Helper: คลิก tab ถ้ามี ถ้าไม่มีก็ log แล้วผ่านไป ไม่ทำให้ test พัง
// ---------------------------------------------------------------
function clickTabIfExists(tabName: string): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
        const $tab = $body.find('ul.nav-tabs li a').filter((_, el) => {
            return Cypress.$(el).text().trim().includes(tabName);
        });

        if ($tab.length > 0) {
            cy.wrap($tab.first()).click({ force: true });
            cy.log(`Tab "${tabName}" found -> clicked`);
            return cy.wrap(true);
        } else {
            cy.log(`Tab "${tabName}" ไม่มีในหน้านี้ -> ข้าม ไม่ทำให้ test fail`);
            return cy.wrap(false);
        }
    });
}

// ---------------------------------------------------------------
// Internal Share
// ---------------------------------------------------------------
export function InternalShare(): void {
    clickTabIfExists('Internal Share').then((found) => {
        if (!found) return;

        cy.get('body').then(($body) => {
            if ($body.find('app-mass-mkt-internal-share').length === 0) {
                cy.log('ไม่พบ component app-mass-mkt-internal-share -> ข้าม');
                return;
            }

            cy.get('app-mass-mkt-internal-share').within(() => {
                cy.get('body').then(($inner) => {
                    if ($inner.find('input[formcontrolname="shareAtCostFlag"]').length === 0) {
                        cy.log('ไม่พบ shareAtCostFlag radio -> ข้าม');
                        return;
                    }

                    const shareAtCostYes: boolean = Math.random() < 0.5;

                    // ลำดับ radio ใน DOM: [0] = Yes, [1] = No
                    cy.get('input[formcontrolname="shareAtCostFlag"]')
                        .eq(shareAtCostYes ? 0 : 1)
                        .check({ force: true });

                    if (!shareAtCostYes) {
                        cy.log('Share At Cost = No -> ไม่ต้องเพิ่มค่าใด ๆ');
                        cy.get('body').then(($b) => {
                            if ($b.find('table tbody td:contains("No data to display")').length > 0) {
                                cy.contains('table tbody td', 'No data to display').should('be.visible');
                            }
                        });
                        return;
                    }

                    cy.log('Share At Cost = Yes -> เริ่มเพิ่ม Internal Company');

                    const rowCount: number = randomInt(1, 2); // สุ่มเพิ่ม 1-2 row
                    const usedCompanies: string[] = [];

                    for (let i = 0; i < rowCount; i++) {
                        cy.get('body').then(($b2) => {
                            const $plusBtn = $b2.find('.glyphicon-plus').parent('button');
                            if ($plusBtn.length === 0) {
                                cy.log('ไม่พบปุ่ม + สำหรับเปิด panel -> ข้าม row นี้');
                                return;
                            }

                            cy.wrap($plusBtn.first()).click({ force: true });

                            let company: string = randomItem(INTERNAL_COMPANIES);
                            while (usedCompanies.includes(company) && usedCompanies.length < INTERNAL_COMPANIES.length) {
                                company = randomItem(INTERNAL_COMPANIES);
                            }
                            usedCompanies.push(company);

                            cy.get('body').then(($b3) => {
                                if ($b3.find('select[formcontrolname="internalCompany"]').length > 0) {
                                    cy.get('select[formcontrolname="internalCompany"]')
                                        .select(company, { force: true });
                                } else {
                                    cy.log('ไม่พบ select internalCompany -> ข้าม');
                                }
                            });

                            const amount: string = randomAmount();
                            cy.get('body').then(($b4) => {
                                if ($b4.find('input[formcontrolname="shareAmount"]').length > 0) {
                                    cy.get('input[formcontrolname="shareAmount"]')
                                        .clear({ force: true })
                                        .type(amount, { force: true });
                                } else {
                                    cy.log('ไม่พบ input shareAmount -> ข้าม');
                                }
                            });

                            const unit: string = randomItem(SHARE_UNITS);
                            cy.get('body').then(($b5) => {
                                if ($b5.find('select[formcontrolname="shareAmountUnit"]').length > 0) {
                                    cy.get('select[formcontrolname="shareAmountUnit"]')
                                        .select(unit, { force: true });
                                } else {
                                    cy.log('ไม่พบ select shareAmountUnit -> ข้าม');
                                }
                            });

                            cy.get('body').then(($b6) => {
                                const $addBtn = $b6.find('.panel-body').last().find('button:contains("Add")');
                                if ($addBtn.length > 0) {
                                    cy.get('.panel-body').last().contains('button', 'Add').click({ force: true });
                                } else {
                                    cy.log('ไม่พบปุ่ม Add -> ข้าม');
                                }
                            });

                            cy.log(`Row ${i + 1} attempted: ${company} / ${amount} / ${unit}`);
                        });
                    }

                    cy.get('body').then(($b7) => {
                        if ($b7.find('table.table-hover tbody tr').length > 0) {
                            cy.get('table.table-hover tbody tr').should('have.length.at.least', 1);
                        }
                    });
                });
            });
        });
    });
}

// ---------------------------------------------------------------
// Sharing Partner
// ---------------------------------------------------------------
export function SharingPartner(): void {
    clickTabIfExists('Sharing Partner').then((found) => {
        if (!found) return;

        cy.get('body').then(($body) => {
            if ($body.find('app-mass-mkt-sharing-partner').length === 0) {
                cy.log('ไม่พบ component app-mass-mkt-sharing-partner -> ข้าม');
                return;
            }

            cy.get('app-mass-mkt-sharing-partner').within(() => {
                cy.get('body').then(($inner) => {
                    const $plusBtn = $inner.find('.glyphicon-plus').parent('button');
                    if ($plusBtn.length === 0) {
                        cy.log('ไม่พบปุ่ม + สำหรับเปิด panel Sharing Partner -> ข้าม');
                        return;
                    }
                    cy.wrap($plusBtn.first()).click({ force: true });
                });
            });

            // --- เลือก Sharing Partner (mat-select) แบบสุ่ม ---
            cy.get('body').then(($b1) => {
                const $matSelect = $b1.find('app-mass-mkt-sharing-partner mat-select');
                if ($matSelect.length === 0) {
                    cy.log('ไม่พบ mat-select Sharing Partner -> ข้าม');
                    return;
                }

                cy.get('app-mass-mkt-sharing-partner mat-select')
                    .last()
                    .click({ force: true });

                cy.get('body').then(($b2) => {
                    const $options = $b2.find('.cdk-overlay-container mat-option').filter(':visible');
                    if ($options.length === 0) {
                        cy.log('ไม่พบ mat-option ใน overlay -> ข้าม');
                        return;
                    }

                    const selectable = $options.toArray().filter((el) => {
                        const text = (el as HTMLElement).innerText.trim();
                        const isDisabled = el.getAttribute('aria-disabled') === 'true';
                        return !isDisabled && text.length > 0 && text !== 'Please Select';
                    });

                    if (selectable.length === 0) {
                        cy.log('ไม่พบตัวเลือก Sharing Partner ที่เลือกได้ -> ข้าม');
                        return;
                    }

                    const randomIndex = Math.floor(Math.random() * selectable.length);
                    const chosen = selectable[randomIndex];
                    const chosenText = (chosen as HTMLElement).innerText.trim();

                    cy.wrap(chosen).click({ force: true });
                    cy.log(`Sharing Partner ที่เลือก: ${chosenText}`);
                });
            });

            // --- สุ่มว่าจะกรอก Sharing Partner Amount หรือไม่ ---
            const fillAmount: boolean = Math.random() < 0.5;

            cy.get('body').then(($body) => {
                if ($body.find('app-mass-mkt-sharing-partner').length === 0) return;

                cy.get('app-mass-mkt-sharing-partner').within(() => {
                    cy.get('body').then(($inner) => {
                        const amountInputSelector = 'input[formcontrolname="sharingPartnerAmount"]';

                        if (fillAmount) {
                            if ($inner.find(amountInputSelector).length > 0) {
                                const amount = randomAmount();
                                cy.get(amountInputSelector)
                                    .clear({ force: true })
                                    .type(amount, { force: true });
                                cy.log(`Sharing Partner Amount: ${amount}`);
                            } else {
                                cy.log('ไม่พบ input Sharing Partner Amount -> ข้าม');
                            }
                        } else {
                            cy.log('รอบนี้ไม่กรอก Sharing Partner Amount (เว้นว่างไว้)');
                        }
                    });

                    cy.get('body').then(($b) => {
                        if ($b.find('button:contains("Add")').length > 0) {
                            cy.contains('button', 'Add').click({ force: true });
                        } else {
                            cy.log('ไม่พบปุ่ม Add -> ข้าม');
                        }
                    });
                });
            });

            cy.get('body').then(($b) => {
                if ($b.find('app-mass-mkt-sharing-partner table tbody tr').length > 0) {
                    cy.get('app-mass-mkt-sharing-partner table tbody tr')
                        .should('have.length.at.least', 1);
                }
            });
        });
    });
}

// ---------------------------------------------------------------
// Revenue Sharing
// ---------------------------------------------------------------
export function RevenueSharing(): void {
    clickTabIfExists('Revenue Sharing').then((found) => {
        if (!found) return;

        cy.get('body').then(($body) => {
            if ($body.find('app-mass-mkt-revenue-sharing').length === 0) {
                cy.log('ไม่พบ component app-mass-mkt-revenue-sharing -> ข้าม');
                return;
            }

            cy.get('app-mass-mkt-revenue-sharing').within(() => {
                cy.get('body').then(($inner) => {
                    if ($inner.find('input[name="revenueSharingFlag"]').length === 0) {
                        cy.log('ไม่พบ radio revenueSharingFlag -> ข้าม');
                        return;
                    }

                    const revenueSharingYes: boolean = Math.random() < 0.5;

                    cy.get('input[name="revenueSharingFlag"]')
                        .eq(revenueSharingYes ? 0 : 1)
                        .check({ force: true });

                    if (!revenueSharingYes) {
                        cy.log('Revenue Sharing = No -> จบ ไม่ต้องกรอกอะไรเพิ่ม');
                        return;
                    }

                    cy.log('Revenue Sharing = Yes -> เริ่มกรอก Model Sharing Detail');

                    cy.get('body').then(($b1) => {
                        if ($b1.find('select[formcontrolname="sharingBasis"]').length > 0) {
                            const sharingBasisValue = randomItem(['CSH', 'ACR']);
                            cy.get('select[formcontrolname="sharingBasis"]')
                                .select(sharingBasisValue, { force: true });
                            cy.log(`Sharing Basis: ${sharingBasisValue}`);
                        } else {
                            cy.log('ไม่พบ select sharingBasis -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b2) => {
                        if ($b2.find('select[formcontrolname="modelSharing"]').length > 0) {
                            const modelSharingValue = randomItem(['Other', 'Fix', 'Rev Share']);
                            cy.get('select[formcontrolname="modelSharing"]')
                                .select(modelSharingValue, { force: true });
                            cy.log(`Model Sharing: ${modelSharingValue}`);
                        } else {
                            cy.log('ไม่พบ select modelSharing -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b3) => {
                        const $portionRadio = $b3.find('input[formcontrolname="portionSharing"]');
                        if ($portionRadio.length > 0) {
                            const portionYes: boolean = Math.random() < 0.5;
                            cy.get('input[formcontrolname="portionSharing"]')
                                .eq(portionYes ? 0 : 1)
                                .check({ force: true });
                            cy.log(`Portion Sharing: ${portionYes ? 'Yes' : 'No'}`);
                        } else {
                            cy.log('ไม่พบ Portion Sharing radio -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b4) => {
                        const $sharingTypeRadio = $b4.find('input[formcontrolname="sharingType"]');
                        if ($sharingTypeRadio.length > 0) {
                            const idx = randomInt(0, $sharingTypeRadio.length - 1);
                            cy.get('input[formcontrolname="sharingType"]')
                                .eq(idx)
                                .check({ force: true });
                            cy.log(`Sharing Type index ที่เลือก: ${idx}`);
                        } else {
                            cy.log('ไม่พบ Sharing Type radio -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b5) => {
                        if ($b5.find('input[formcontrolname="internalShareFlag"]').length > 0) {
                            const internalYes: boolean = Math.random() < 0.5;
                            cy.get('input[formcontrolname="internalShareFlag"]')
                                .eq(internalYes ? 0 : 1)
                                .check({ force: true });
                            cy.log(`Internal Share: ${internalYes ? 'Yes' : 'No'}`);
                        } else {
                            cy.log('ไม่พบ Internal Share radio -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b6) => {
                        if ($b6.find('textarea[formcontrolname="remark"]').length > 0 && Math.random() < 0.5) {
                            cy.get('textarea[formcontrolname="remark"]')
                                .clear({ force: true })
                                .type('Automated test remark', { force: true });
                        }
                    });

                    cy.get('body').then(($b7) => {
                        const $revenueHeader = $b7.find('h3.h3-panel-header:contains("Revenue Sharing")');
                        if ($revenueHeader.length === 0) {
                            cy.log('ไม่พบ panel header Revenue Sharing -> ข้าม');
                            return;
                        }
                        cy.contains('h3.h3-panel-header', 'Revenue Sharing')
                            .parents('.panel')
                            .find('.glyphicon-plus')
                            .parent('button')
                            .then(($btn) => {
                                if ($btn.length > 0 && !$btn.is(':disabled')) {
                                    cy.wrap($btn).click({ force: true });
                                    cy.log('เปิดฟอร์มเพิ่มแถว Revenue Sharing');
                                } else {
                                    cy.log('ปุ่ม + Revenue Sharing ถูก disable หรือไม่พบ -> ข้าม');
                                }
                            });
                    });

                    cy.get('body').then(($b8) => {
                        const hasInternalSharePanel = $b8.find('h3:contains("Internal Share")').length > 0;
                        if (hasInternalSharePanel) {
                            cy.log('พบ panel Internal Share -> สามารถต่อยอด logic ได้ที่นี่');
                        } else {
                            cy.log('ไม่พบ panel Internal Share ในรอบนี้ -> ข้าม');
                        }
                    });
                });
            });
        });
    });
}

// ---------------------------------------------------------------
// Charge Partner
// ---------------------------------------------------------------
export function ChargePartner(): void {
    clickTabIfExists('Charge Partner').then((found) => {
        if (!found) return;

        cy.get('body').then(($body) => {
            if ($body.find('app-mass-mkt-charge-partner').length === 0) {
                cy.log('ไม่พบ component app-mass-mkt-charge-partner -> ข้าม');
                return;
            }

            cy.get('app-mass-mkt-charge-partner').within(() => {
                cy.get('body').then(($inner) => {
                    if ($inner.find('input[formcontrolname="chargePartnerFlag"]').length === 0) {
                        cy.log('ไม่พบ radio chargePartnerFlag -> ข้าม');
                        return;
                    }

                    const chargePartnerYes: boolean = Math.random() < 0.5;

                    cy.get('input[formcontrolname="chargePartnerFlag"]')
                        .eq(chargePartnerYes ? 0 : 1)
                        .check({ force: true });

                    if (!chargePartnerYes) {
                        cy.log('Charge Partner = No -> ไม่ต้องเพิ่มค่าใด ๆ (ค่า default)');
                        return;
                    }

                    cy.log('Charge Partner = Yes -> เริ่มเลือก CP Name');

                    cy.get('body').then(($b1) => {
                        if ($b1.find('select[formcontrolname="cpName"]').length === 0) {
                            cy.log('ไม่พบ select cpName -> ข้าม');
                            return;
                        }

                        cy.get('select[formcontrolname="cpName"]').then(($select) => {
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

                            cy.get('select[formcontrolname="cpName"]').select(value, { force: true });
                            cy.log(`CP Name ที่เลือก: ${Cypress.$(randomOpt).text().trim()}`);
                        });
                    });

                    cy.get('body').then(($b2) => {
                        const $addBtn = $b2.find('button[title="Add"]');
                        if ($addBtn.length > 0) {
                            cy.get('button[title="Add"]').first().click({ force: true });
                        } else {
                            cy.log('ไม่พบปุ่ม Add ข้าง CP Name -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b3) => {
                        const $plusBtn = $b3.find('.glyphicon-plus').parent('button');
                        if ($plusBtn.length > 0) {
                            cy.wrap($plusBtn.last()).click({ force: true });
                        } else {
                            cy.log('ไม่พบปุ่ม + สำหรับเปิด Charge Partner Detail -> ข้าม');
                        }
                    });

                    cy.get('body').then(($b4) => {
                        if ($b4.find('select[formcontrolname="chargeModel"]').length === 0) {
                            cy.log('ไม่พบ select chargeModel -> ข้าม');
                            return;
                        }

                        const isFix: boolean = Math.random() < 0.5;
                        const modelValue = isFix ? '1: Fix' : '2: Percentage';

                        cy.get('select[formcontrolname="chargeModel"]')
                            .select(modelValue, { force: true });

                        cy.log(`Charge Model ที่เลือก: ${isFix ? 'Fix' : 'Percentage'}`);

                        cy.get('body').then(($b5) => {
                            if ($b5.find('select[formcontrolname="chargeBy"]').length > 0) {
                                const chargeByValues = ['1: AMP', '2: AWN', '3: MMT', '4: FBB', '5: SBN'];
                                const chargeByValue = randomItem(chargeByValues);
                                cy.get('select[formcontrolname="chargeBy"]')
                                    .select(chargeByValue, { force: true });
                                cy.log(`Charge By ที่เลือก: ${chargeByValue}`);
                            } else {
                                cy.log('ไม่พบ select chargeBy -> ข้าม');
                            }
                        });

                        if (isFix) {
                            cy.get('body').then(($b6) => {
                                if ($b6.find('input[formcontrolname="chargeExcVat"]').length > 0) {
                                    cy.get('input[formcontrolname="chargeExcVat"]')
                                        .clear({ force: true })
                                        .type(randomAmount(), { force: true });
                                }
                                if ($b6.find('input[formcontrolname="chargeIncVat"]').length > 0) {
                                    cy.get('input[formcontrolname="chargeIncVat"]')
                                        .clear({ force: true })
                                        .type(randomAmount(), { force: true });
                                }
                                if ($b6.find('select[formcontrolname="fixChargeUnit"]').length > 0) {
                                    const unitValue = randomItem(['1: THB', '2: USD']);
                                    cy.get('select[formcontrolname="fixChargeUnit"]')
                                        .select(unitValue, { force: true });
                                }
                            });
                        } else {
                            cy.get('body').then(($b7) => {
                                if ($b7.find('input[formcontrolname="baseOnExcVat"]').length > 0) {
                                    cy.get('input[formcontrolname="baseOnExcVat"]')
                                        .clear({ force: true })
                                        .type(randomAmount(), { force: true });
                                }
                                if ($b7.find('input[formcontrolname="baseOnIncVat"]').length > 0) {
                                    cy.get('input[formcontrolname="baseOnIncVat"]')
                                        .clear({ force: true })
                                        .type(randomAmount(), { force: true });
                                }
                                if ($b7.find('select[formcontrolname="baseOnUnit"]').length > 0) {
                                    const unitValue = randomItem(['1: THB', '2: USD']);
                                    cy.get('select[formcontrolname="baseOnUnit"]')
                                        .select(unitValue, { force: true });
                                }
                                if ($b7.find('input[formcontrolname="charge"]').length > 0) {
                                    const percentValue = randomInt(1, 100).toString();
                                    cy.get('input[formcontrolname="charge"]')
                                        .clear({ force: true })
                                        .type(percentValue, { force: true });
                                }
                            });
                        }

                        cy.get('body').then(($b8) => {
                            if ($b8.find('button:contains("Add")').length > 0) {
                                cy.contains('button', 'Add').last().click({ force: true });
                                cy.log('บันทึก Charge Partner Detail สำเร็จ');
                            } else {
                                cy.log('ไม่พบปุ่ม Add -> ข้าม');
                            }
                        });
                    });
                });
            });
        });
    });
}