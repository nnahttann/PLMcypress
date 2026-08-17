// ========================
// RANDOM HUMAN TOUCH POINT
// ========================

export const RandomHumanTouchPoint = (subModule?: string): void => {
    // ✅ Reset env ทุกครั้งที่เริ่มประมวลผล PO ใหม่ ป้องกันค่าเก่าจาก PO ก่อนหน้าค้าง
    Cypress.env('hasRom', false);
    Cypress.env('hasEasyAppRom', false);
    Cypress.env('touchPointAbbr', '');

    cy.contains('.scrollmenu a', 'Selling Location & Channel', { timeout: 30000 })
        .scrollIntoView()
        .click({ force: true });

    cy.get('app-mass-mkt-human-touch-point', { timeout: 30000 })
        .should('exist')
        .and('be.visible');

    // ✅ สร้าง meaningful text arrays แทน random string
    const descriptionTexts = [
        'Marketing campaign for Q3 2026',
        'Promotional offer for new customers',
        'Special discount program',
        'Customer retention initiative',
        'Seasonal promotion event',
        'Loyalty reward program',
        'Product launch campaign',
        'Brand awareness initiative',
        'Customer engagement program',
        'Targeted marketing strategy',
        'Digital marketing campaign',
        'Customer acquisition program',
        'Value-added service offer',
        'Premium package promotion',
        'Exclusive member benefits'
    ];

    const attachmentDescriptionTexts = [
        'Campaign brochure PDF',
        'Promotional materials document',
        'Marketing collateral file',
        'Product information sheet',
        'Customer guide document',
        'Service agreement template',
        'Terms and conditions',
        'Promotion details document',
        'Marketing presentation',
        'Campaign guidelines PDF',
        'Product catalog document',
        'Service brochure file',
        'Promotional flyer document',
        'Customer information pack',
        'Marketing asset file'
    ];

    // ✅ สร้าง multiple formats สำหรับ access number
    const generateAccessNumberWithFormat = (): string => {
        const formats: (() => string)[] = [
            // Format 1: *ตัวเลข 3-5 หลัก*#
            () => {
                const num = Math.floor(Math.random() * 90000 + 10000);
                return `*${num}*#`;
            },
            // Format 2: *ตัวอักษร 3 ตัว*#
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                return `*${letters}*#`;
            },
            // Format 3: *ตัวเลข 3 หลัก + ตัวอักษร 2 ตัว*#
            () => {
                const num = Math.floor(Math.random() * 900 + 100);
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                return `*${num}${letters}*#`;
            },
            // Format 4: *ตัวอักษร 2 ตัว + ตัวเลข 4 หลัก*#
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const num = Math.floor(Math.random() * 9000 + 1000);
                return `*${letters}${num}*#`;
            },
            // Format 5: *ตัวเลข 6 หลัก*#
            () => {
                const num = Math.floor(Math.random() * 900000 + 100000);
                return `*${num}*#`;
            },
            // Format 6: *ตัวอักษร 4 ตัว + ตัวเลข 2 หลัก*#
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const num = Math.floor(Math.random() * 90 + 10);
                return `*${letters}${num}*#`;
            },
            // Format 7: *ตัวเลข 2 หลัก + ตัวอักษร 3 ตัว + ตัวเลข 2 หลัก*#
            () => {
                const num1 = Math.floor(Math.random() * 90 + 10);
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                const num2 = Math.floor(Math.random() * 90 + 10);
                return `*${num1}${letters}${num2}*#`;
            },
            // Format 8: *ตัวอักษร 1 ตัว + ตัวเลข 5 หลัก*#
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letter = chars[Math.floor(Math.random() * chars.length)];
                const num = Math.floor(Math.random() * 90000 + 10000);
                return `*${letter}${num}*#`;
            },
            // Format 9: *ตัวเลข 4 หลัก + ตัวอักษร 1 ตัว + ตัวเลข 2 หลัก*#
            () => {
                const num1 = Math.floor(Math.random() * 9000 + 1000);
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letter = chars[Math.floor(Math.random() * chars.length)];
                const num2 = Math.floor(Math.random() * 90 + 10);
                return `*${num1}${letter}${num2}*#`;
            },
            // Format 10: *ตัวอักษร 5 ตัว*#
            () => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const letters = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                return `*${letters}*#`;
            }
        ];

        // สุ่มเลือก format
        const randomFormat = formats[Math.floor(Math.random() * formats.length)];
        return randomFormat();
    };

    const touchPointAbbrMap: Record<string, string> = {
        'ROM': 'RM',
        'Easy App ROM': 'ES RM',
    };

    let finalSelection: string[] = [];
    let touchPointAbbr = '';

    // -----------------------------------------------------------
    // STEP 1: วิเคราะห์และเลือกตัวเลือกจาก Dual List Box
    // -----------------------------------------------------------
    cy.get('app-mass-mkt-human-touch-point').within(() => {
        cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
            .find('option')
            .then($options => {
                const allOptions = [...$options].map(opt => opt.innerText.trim()).filter(t => t !== '');
                const mandatoryTargets = ['ROM', 'Easy App ROM'];
                const availableTargets = mandatoryTargets.filter(target => allOptions.includes(target));

                let itemsToSelect: string[] = [];

                // ✅ ถ้าไม่มีทั้งคู่ → Fail ทันที
                if (availableTargets.length === 0) {
                    throw new Error('❌ Critical Error: Neither ROM nor Easy App ROM is available in the list!');
                }

                // ✅ ถ้ามีให้เลือกได้ทั้ง ROM และ Easy App ROM (list มีทั้ง 2 ตัว)
                // → สุ่มว่าจะเลือกทั้งคู่ หรือเลือกแค่ตัวเดียว
                // ถ้า list มีแค่ตัวเดียว (อีกตัวไม่มีใน DOM) → เลือกตัวที่มีเลย ไม่ต้องสุ่ม
                if (availableTargets.length >= 2) {
                    const pickBoth = Cypress._.random(0, 1) === 1;

                    if (pickBoth) {
                        itemsToSelect = [...availableTargets];
                        cy.log(`🎲 Logic Selected: BOTH (${itemsToSelect.join(', ')})`);
                    } else {
                        const singlePick = Cypress._.sample(availableTargets) ?? '';
                        itemsToSelect = [singlePick];
                        cy.log(`🎲 Logic Selected: SINGLE (${singlePick})`);
                    }
                } else {
                    itemsToSelect = [...availableTargets];
                    cy.log(`🎲 Logic Selected: SINGLE ONLY - อีกตัวไม่มีใน list (${itemsToSelect[0]})`);
                }

                if (itemsToSelect.length === 0) {
                    throw new Error('❌ Critical Error: Failed to select ROM or Easy App ROM!');
                }

                const hasRom = itemsToSelect.includes('ROM');
                const hasEasyAppRom = itemsToSelect.includes('Easy App ROM');
                Cypress.env('hasRom', hasRom);
                Cypress.env('hasEasyAppRom', hasEasyAppRom);

                touchPointAbbr = itemsToSelect
                    .map(item => touchPointAbbrMap[item])
                    .filter(Boolean)
                    .join(' ');
                Cypress.env('touchPointAbbr', touchPointAbbr);

                cy.log(`🏷️ Touch Point Abbr (stored): ${touchPointAbbr}`);

                const otherOptions = allOptions.filter(opt => !mandatoryTargets.includes(opt));
                // ป้องกันการสุ่มมากกว่าจำนวนตัวเลือกที่มีอยู่จริง
                const maxRandom = Math.min(2, otherOptions.length);
                const randomOthers = Cypress._.sampleSize(otherOptions, Cypress._.random(0, maxRandom));

                // เก็บผลลัพธ์สุดท้ายไว้ในตัวแปรนอก .within() เพื่อนำไปใช้ต่อ
                finalSelection = [...itemsToSelect, ...randomOthers];

                cy.log(`✅ Final Selection (stored, not applied yet): ${finalSelection.join(', ')}`);
            });
    });

      // -----------------------------------------------------------
    // STEP 2: อัปเดตชื่อ PO Name (ถ้ามีการเลือก ROM / Easy App ROM)
    // -----------------------------------------------------------
    cy.then(() => {
        if (!touchPointAbbr) {
            cy.log('ℹ️ No ROM/Easy App ROM selected — skip PO Name update');
            return;
        }

        cy.get('input[formcontrolname="productName"]', { timeout: 20000 })
            .scrollIntoView()
            .should('be.visible')
            .and('not.be.disabled')
            .invoke('val')
            .then(currentVal => {
                const currentName = (currentVal as string) || '';

                // ✅ ลบ abbr เก่า (RM / ES RM) ที่อาจติดค้างจาก PO ก่อนหน้าออกก่อนเสมอ
                const knownAbbrs = Object.values(touchPointAbbrMap);
                const strippedName = knownAbbrs
                    .reduce((name, abbr) => name.replace(new RegExp(`\\s*${abbr}\\s*$`), ''), currentName)
                    .trim();

                const newName = `${strippedName} ${touchPointAbbr}`.trim();

                // ✅ แก้ไข: Chain .blur() ต่อท้าย .type() โดยตรง เพื่อป้องกัน Error "not focused"
                cy.get('input[formcontrolname="productName"]')
                    .clear()
                    .type(newName, { delay: 20 })
                    .blur();

                // ✅ สำคัญมาก: อัปเดตทั้ง currentPoName และ poName
                // — นี่คือ key ที่ promoteToActmRole (ROM / Easy App ROM role) อ่านค่า
                //   PO ล่าสุดเพื่อ Claim/Approve อยู่แล้ว ไม่ต้อง sync กลับเข้า
                //   ProjectManager (getStandardProjectName) เพราะ ProjectManager
                //   เก็บ "ชื่อ Project" (index เดียวกับตอน registerProjectName ใน
                //   project-creation.ts) — ถ้าเรียก updateProjectName(newName) ที่นี่
                //   จะเขียนทับชื่อ Project จริงด้วยชื่อ PO (...RM) ทันที ทำให้
                //   cksDoerFinalStep / ClaimProject(claimBy: 'project') รอบสุดท้าย
                //   หา Project ไม่เจอ (ดู bugfix note ด้านล่าง)
                Cypress.env('currentPoName', newName);
                Cypress.env('poName', newName);

                // ❌ เดิมมีบรรทัด updateProjectName(newName) ตรงนี้ — ถูกลบออกแล้ว
                //    เพราะมันเขียนทับชื่อ Project ตัวจริงใน ProjectManager Map
                //    (index เดียวกับที่ registerProjectName ตั้งไว้ตอนสร้าง Project)
                //    ด้วยชื่อ PO ที่เพิ่ง rename (มี suffix RM/ES RM) ส่งผลให้
                //    getStandardProjectName() ที่จุดอื่น (เช่น cksDoerFinalStep,
                //    performMusicRoles, performTscenterRoleOnly) คืนชื่อ PO แทน
                //    ชื่อ Project จริง → ClaimProject(claimBy: 'project') หา row
                //    ไม่เจอใน Unassigned Task แล้ว timeout ตอนกด Next page
                //
                //    promoteToActmRole (ที่ใช้กับ ROM / Easy App ROM) อ่านค่าจาก
                //    Cypress.env('currentPoName') อยู่แล้วเป็นค่าแรก (บรรทัดด้านบน
                //    set ไว้ครบแล้ว) จึงไม่จำเป็นต้อง sync เข้า ProjectManager อีก

                cy.log(`✅ PO Name updated (fresh): ${newName}`);
            });
    });

    // -----------------------------------------------------------
    // STEP 3: เลือกตัวเลือกใน Dual List Box และกดปุ่มย้าย (>)
    // -----------------------------------------------------------
    cy.get('app-mass-mkt-human-touch-point').within(() => {
        cy.then(() => {
            // ป้องกัน Error กรณีไม่มีรายการให้เลือกเลย (ปุ่ม str จะ disabled ตลอดเวลา)
            if (finalSelection.length === 0) {
                cy.log('⚠️ No items to select, skipping dual list box action');
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
                // ✅ ตรวจสอบก่อนว่า row นี้มี <td> หรือไม่
                // เพื่อป้องกัน Error จาก tr ว่างเปล่าที่ Angular สร้างไว้เป็น placeholder
                if ($row.find('td').length === 0) {
                    cy.log('⚠️ Skipping empty row (no <td> elements found)');
                    return; // ข้ามการประมวลผล row นี้ทันที
                }

                cy.wrap($row)
                    .find('td')
                    .first()
                    .invoke('text')
                    .then(raw => {
                        const channel = raw.trim();
                        if (!channel) return; // ป้องกันกรณี td มีแต่ช่องว่าง

                        cy.log(`✏️ Edit Human Touch Point: ${channel}`);

                        cy.wrap($row)
                            .find('button[title="Edit"]')
                            .should('be.visible')
                            .click({ force: true });

                        if (channel === 'ROM' || channel === 'Easy App ROM') {
                            // Logic: ตรวจสอบ subModule = PRE เท่านั้น (ตรงกับ DOM ที่มีคอลัมน์ Subscribe/Unsubscribe)
                            if (subModule === 'PRE') {
                                let sub = '';
                                let unsub = '';

                                do {
                                    // ✅ สุ่มใหม่เสมอต่อแถว/ต่อ PO — ไม่มี caching
                                    sub = generateAccessNumberWithFormat();
                                    unsub = generateAccessNumberWithFormat();
                                } while (sub === unsub);

                                cy.get('input[formcontrolname="subscribeAccessNumber"]', { timeout: 20000 })
                                    .clear()
                                    .type(sub);

                                cy.get('input[formcontrolname="unsubscribeAccessNumber"]')
                                    .clear()
                                    .type(unsub);

                                cy.log(`📱 Subscribe: ${sub}, Unsubscribe: ${unsub}`);
                            }

                            // ✅ สุ่มใหม่ทุกครั้ง — ใช้ meaningful text แทน random string
                            const randomDescription = Cypress._.sample(descriptionTexts) ?? '';
                            cy.get('textarea[formcontrolname="description"]')
                                .clear()
                                .type(randomDescription);

                            cy.get('input[type="file"]')
                                .selectFile('cypress/fixtures/file.pdf', { force: true });

                            // ✅ สุ่มใหม่ทุกครั้ง — ใช้ meaningful text แทน random string
                            const randomAttachmentDesc = Cypress._.sample(attachmentDescriptionTexts) ?? '';
                            cy.get('textarea[formcontrolname="attachmentDescription"]')
                                .clear()
                                .type(randomAttachmentDesc);
                        }

                        if (
                            channel === 'Event' ||
                            channel === 'Selective Channel/Location'
                        ) {
                            // ✅ สุ่มใหม่ทุกครั้ง — ใช้ meaningful text แทน random string
                            const randomDescription = Cypress._.sample(descriptionTexts) ?? '';
                            cy.get('textarea[formcontrolname="description"]')
                                .clear()
                                .type(randomDescription);
                        }

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