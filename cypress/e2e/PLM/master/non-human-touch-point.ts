import { updateProjectName } from './project-manager';

export const RandomNonHumanTouchPoint = (subModule?: string): void => {
    // ✅ Reset env ทุกครั้งที่เริ่มประมวลผล PO ใหม่ ป้องกันค่าเก่าจาก PO ก่อนหน้าค้าง
    Cypress.env('hasUssdDirect', false);
    Cypress.env('hasUssdInteractive', false);
    Cypress.env('nonHumanTouchPointAbbr', '');

    cy.contains('.scrollmenu a', 'Selling Location & Channel', { timeout: 30000 })
        .scrollIntoView()
        .click({ force: true });

    cy.get('app-mass-mkt-non-human-touch-point', { timeout: 30000 })
        .scrollIntoView()
        .should('exist')
        .and('be.visible');

    // ✅ สร้าง multiple formats สำหรับ access number (เหมือนฝั่ง Human Touch Point)
    const generateAccessNumberWithFormat = (): string => {
        const formats: (() => string)[] = [
            () => {
                const num = Math.floor(Math.random() * 90000 + 10000);
                return `*${num}*#`;
            },
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                return `*${letters}*#`;
            },
            () => {
                const num = Math.floor(Math.random() * 900 + 100);
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                return `*${num}${letters}*#`;
            },
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const num = Math.floor(Math.random() * 9000 + 1000);
                return `*${letters}${num}*#`;
            },
            () => {
                const num = Math.floor(Math.random() * 900000 + 100000);
                return `*${num}*#`;
            },
        ];
        const randomFormat = formats[Math.floor(Math.random() * formats.length)];
        return randomFormat();
    };

    const touchPointAbbrMap: Record<string, string> = {
        'USSD Direct Specify': 'USSD',
        'USSD Interactive Specify Menu': 'USSD',
    };

    const mandatoryTargets = ['USSD Direct Specify', 'USSD Interactive Specify Menu'];
    let finalSelection: string[] = [];
    let touchPointAbbr = '';

    // -----------------------------------------------------------
    // STEP 1: วิเคราะห์และเลือกตัวเลือกจาก Dual List Box
    // -----------------------------------------------------------
    cy.get('app-mass-mkt-non-human-touch-point').within(() => {
        cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
            .find('option')
            .then($options => {
                const allOptions = [...$options].map(opt => opt.innerText.trim()).filter(t => t !== '');
                const availableTargets = mandatoryTargets.filter(target => allOptions.includes(target));

                let itemsToSelect: string[] = [];

                if (availableTargets.length === 0) {
                    throw new Error('❌ Critical Error: Neither USSD Direct Specify nor USSD Interactive Specify Menu is available in the list!');
                }

                if (availableTargets.length >= 2) {
                    const pickBoth = Cypress._.random(0, 1) === 1;

                    if (pickBoth) {
                        itemsToSelect = [...availableTargets];
                        cy.log(`🎲 Non-Human Logic Selected: BOTH (${itemsToSelect.join(', ')})`);
                    } else {
                        const singlePick = Cypress._.sample(availableTargets) ?? '';
                        itemsToSelect = [singlePick];
                        cy.log(`🎲 Non-Human Logic Selected: SINGLE (${singlePick})`);
                    }
                } else {
                    itemsToSelect = [...availableTargets];
                    cy.log(`🎲 Non-Human Logic Selected: SINGLE ONLY - อีกตัวไม่มีใน list (${itemsToSelect[0]})`);
                }

                if (itemsToSelect.length === 0) {
                    throw new Error('❌ Critical Error: Failed to select USSD Direct Specify or USSD Interactive Specify Menu!');
                }

                Cypress.env('hasUssdDirect', itemsToSelect.includes('USSD Direct Specify'));
                Cypress.env('hasUssdInteractive', itemsToSelect.includes('USSD Interactive Specify Menu'));

                // ✅ ต่อท้ายชื่อด้วย "USSD" ตัวเดียว ไม่ว่าจะเลือก 1 หรือ 2 รายการ
                touchPointAbbr = itemsToSelect.some(item => touchPointAbbrMap[item]) ? 'USSD' : '';
                Cypress.env('nonHumanTouchPointAbbr', touchPointAbbr);

                cy.log(`🏷️ Non-Human Touch Point Abbr (stored): ${touchPointAbbr}`);
                cy.log(`🏷️ Non-Human Touch Point selected: ${itemsToSelect.join(', ')}`);

                const otherOptions = allOptions.filter(opt => !mandatoryTargets.includes(opt));
                const maxRandom = Math.min(2, otherOptions.length);
                const randomOthers = Cypress._.sampleSize(otherOptions, Cypress._.random(0, maxRandom));

                finalSelection = [...itemsToSelect, ...randomOthers];

                cy.log(`✅ Non-Human Final Selection (stored, not applied yet): ${finalSelection.join(', ')}`);
            });
    });

    // -----------------------------------------------------------
    // STEP 2: อัปเดตชื่อ PO Name (ถ้ามีการเลือก USSD Direct/Interactive)
    // -----------------------------------------------------------
    cy.then(() => {
        if (!touchPointAbbr) {
            cy.log('ℹ️ No USSD Direct/Interactive selected — skip PO Name update');
            return;
        }

        cy.get('input[formcontrolname="productName"]', { timeout: 20000 })
            .scrollIntoView()
            .should('be.visible')
            .and('not.be.disabled')
            .invoke('val')
            .then(currentVal => {
                const currentName = (currentVal as string) || '';

                // ✅ ลบ abbr "USSD" เก่าที่อาจติดค้างจาก PO ก่อนหน้าออกก่อนเสมอ
                const strippedName = currentName.replace(/\s*USSD\s*$/, '').trim();

                const newName = `${strippedName} ${touchPointAbbr}`.trim();

                cy.get('input[formcontrolname="productName"]')
                    .clear()
                    .type(newName, { delay: 20 })
                    .blur();

                Cypress.env('currentPoName', newName);
                Cypress.env('poName', newName);

                // ✅ sync กลับเข้า ProjectManager Map
                updateProjectName(newName);

                cy.log(`✅ PO Name updated (fresh): ${newName}`);
            });
    });

    // -----------------------------------------------------------
    // STEP 3: เลือกตัวเลือกใน Dual List Box และกดปุ่มย้าย (>)
    // -----------------------------------------------------------
    cy.get('app-mass-mkt-non-human-touch-point').within(() => {
        cy.then(() => {
            if (finalSelection.length === 0) {
                cy.log('⚠️ No non-human items to select, skipping dual list box action');
                return;
            }

            cy.get('select[formcontrolname="availableListBox"]')
                .select(finalSelection, { force: true });

            cy.get('button.str')
                .should('not.be.disabled')
                .click({ force: true });
        });

        // -----------------------------------------------------------
        // STEP 4: Loop เพื่อกรอกข้อมูล (Edit) ในแต่ละแถว
        // -----------------------------------------------------------
        cy.get('table tbody tr.ng-star-inserted', { timeout: 30000 })
            .should('have.length.greaterThan', 0);

        cy.get('table tbody tr.ng-star-inserted')
            .each($row => {
                if ($row.find('td').length === 0) {
                    cy.log('⚠️ Skipping empty row (no <td> elements found)');
                    return;
                }

                cy.wrap($row)
                    .find('td')
                    .first()
                    .invoke('text')
                    .then(raw => {
                        const channel = raw.trim();
                        if (!channel) return;

                        // ✅ ทำเฉพาะแถว USSD Direct Specify / USSD Interactive Specify Menu
                        if (
                            channel !== 'USSD Direct Specify' &&
                            channel !== 'USSD Interactive Specify Menu'
                        ) {
                            return;
                        }

                        cy.log(`✏️ Edit Non-Human Touch Point: ${channel}`);

                        cy.wrap($row)
                            .find('button[title="Edit"]')
                            .should('be.visible')
                            .click({ force: true });

                        let sub = '';
                        let unsub = '';

                        do {
                            // ✅ สุ่มใหม่เสมอต่อแถว/ต่อ PO — ไม่มี caching
                            sub = generateAccessNumberWithFormat();
                            unsub = generateAccessNumberWithFormat();
                        } while (sub === unsub);

                        cy.get('input[formcontrolname="subscribeAccessNumber"]', { timeout: 20000 })
                            .should('be.visible')
                            .clear()
                            .type(sub);

                        cy.get('input[formcontrolname="unsubscribeAccessNumber"]')
                            .should('be.visible')
                            .clear()
                            .type(unsub);

                        cy.log(`📱 Subscribe: ${sub}, Unsubscribe: ${unsub}`);

                        // กด Update
                        cy.contains('button', 'Update', { timeout: 20000 })
                            .should('be.visible')
                            .click({ force: true });

                        // รอให้ UI / Form ปิดลงก่อนวนลูปไปแก้แถวถัดไป
                        cy.wait(500);
                    });
            });
    });
};
