
const env = Cypress.env();
export const {
  urlsit,
  MKTpre, MKTpre1, MKTpost, MKTpost1,
  cks, ckspass,
  cgcirb, cgcirbpass,
  cgccbs, cgccbspass,
  cgtcbs, cgtcbspass,
  cgtirb, cgtirbpass,
  actm, actmpass,
  oper, operpass,
  spadsup, spadsuppass,
  spaddoer, spaddoerpass,
  spadtest, spadtestpass,
  spaddp, spaddppass,
  apo, apopass,
  enter, enterpass,
  music, musicpass,
  tscenter, tscenterpass,
  aafsp, aafsppass,
  csisp, csisppass,
  e2etest, e2etestpass,
  aafdp, aafdppass,
  csidp, csidppass,
  e2edp, e2edppass,
  sasff, sasffpass
} = env as Record<string, string>;

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
export let formattedDateMain = '';
export let formattedDateOntop = '';


/*
============================================================================
=== 
===   Core Reusable Functions (Login, Claim, Assign)
=== 
============================================================================
*/
export const login = (username: string, password: string): void => {
  cy.get('input[name="userId"]').type(username);
  cy.get('input[name="pwd"]').type(password);
  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');
  cy.get(':nth-child(4) > .btn').click();
  cy.wait('@getErrorCodes', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
}

export const ClaimProject = (formattedDate: string): void => {

  cy.log(`🔍 [ClaimProject] Searching for: "${formattedDate}"`);

  cy.get('h3')
    .contains('Unassigned Task', { timeout: 100000 })
    .parent()
    .within(() => {
      // Wait for data to load
      cy.get('tbody tr').should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

      // Debug: Show all rows
      cy.get('tbody tr').then(($rows) => {
        cy.log(`📊 Total rows found: ${$rows.length}`);
        let matchFound = false;

        $rows.each((index, row) => {
          const text = Cypress.$(row).text().trim();
          const displayText = text.substring(0, 100);
          cy.log(`Row ${index}: ${displayText}${text.length > 100 ? '...' : ''}`);

          if (text.includes(formattedDate)) {
            cy.log(`✅✅✅ EXACT MATCH at row ${index}`);
            matchFound = true;
          }
        });

        if (!matchFound) {
          cy.log(`❌ No row contains: "${formattedDate}"`);
        }
      });

      // Actual claim process
      cy.get('tbody tr').each(($row, index) => {
        const rowText = $row.text().trim();

        if (rowText.includes(formattedDate)) {
          cy.log(`🎯 Clicking claim button at row ${index} for: "${formattedDate}"`);
          cy.wrap($row)
            .find('button.claim-top')
            .should('be.visible')
            .click();
          cy.log(`✅ Successfully claimed project: ${formattedDate}`);
          return false; // Break loop
        }
      });
    });
};

// assign-functions.ts
export function assignTeamTask(taskIdentifier: string, assignee: string): void {

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.contains('tr', partialIdentifier, { timeout: 600000 })
    .should('be.visible')
    .as('taskRow');

  cy.get('@taskRow').within(() => {
    cy.get('select.form-control.input-sm').as('assigneeDropdown');

    cy.get('@assigneeDropdown').parent().click();

    cy.get('@assigneeDropdown').then(($select) => {
      const selectElement = $select[0];
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      selectElement.dispatchEvent(mouseDownEvent);

      const focusEvent = new FocusEvent('focus', {
        bubbles: true,
        cancelable: true
      });
      selectElement.dispatchEvent(focusEvent);
    });

    // Debug: Show all options
    cy.get('@assigneeDropdown')
      .find('option')
      .each(($option: JQuery<HTMLOptionElement>) => {
        cy.log(`📋 Option: "${$option.val()}" = "${$option.text().trim()}"`);
      });

    cy.get('@assigneeDropdown')
      .find(`option[value="${assignee}"]`, { timeout: 10000 })
      .should('exist');

    cy.get('@assigneeDropdown').select(assignee);
    cy.get('@assigneeDropdown').should('have.value', assignee);


    cy.get('@taskRow').contains('span', 'Set').click();
  });

  // cy.get('@alertStub', { timeout: 100000 }).should('have.been.calledWith', 'Reassign success');
  // cy.log(`✅ Successfully assigned task to: ${assignee}`);

  // cy.contains('Reassign success', { timeout: 20000 }).should('be.visible');
  // cy.contains('button', 'OK').click();
  // cy.log(`✅ Successfully assigned task to: ${assignee}`);

}

/*
============================================================================
=== 
===   Refactor Pattern 1: Page Approval Flows
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   1.1. การกำหนดประเภท (Type Definitions)
----------------------------------------------------------------------------
*/

/** ประเภทของ List ที่จะค้นหาโปรเจกต์ */
type TaskListHeader = 'To Do List' | 'Unassigned Task';

/** ประเภทของ Action สุดท้ายหลังจากทำงานเสร็จ */
type FinalAction =
  | 'AlertAndLogout'    // ทั่วไป: รอ Alert, กลับหน้า Workspace, แล้ว Logout
  | 'ComplexLogout'     // สำหรับ SPADSup: ไม่รอ Alert, กลับหน้า Workspace, แล้ว Logout
  | 'StopAfterCore';    // สำหรับ SPADTesterMain: ทำงานหลักเสร็จแล้วหยุดเลย

/** ฟังก์ชันที่บรรจุขั้นตอน "เฉพาะ" ของแต่ละ Role */
type CoreTaskCallback = () => void;

/*
----------------------------------------------------------------------------
---   1.2. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * 1. Helper หลัก: สำหรับ Flow ที่ซับซ้อน (ส่วนใหญ่)
 * --------------------------------------------------
 * หน้าที่: Intercept API -> คลิก Approve -> รอ URL -> รอ API 3 ตัว
 * -> รันงานเฉพาะ (Callback) -> จัดการตอนจบ (Alert/Logout)
 */
const createFullPageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback,
  finalAction: FinalAction
): void => {

  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  // --- 2. ค้นหาโปรเจกต์และคลิก Approve ---
  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.get('tbody tr').then(($rows) => {

      $rows.each((index, row) => {
        const text = Cypress.$(row).text().trim();
        cy.log(`Row ${index}: ${text.substring(0, 100)}`);
        if (text.includes(projectName)) {
          cy.log(`✅✅✅ MATCH at row ${index}`);
        }
      });
    });
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  cy.url({ timeout: 600000 }).should('include', expectedUrl);

  // --- 4. รอ API ที่สำคัญของหน้า Detail โหลดให้ครบ ---
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 5. รันขั้นตอน "เฉพาะ" ที่ส่งเข้ามา ---
  coreTaskCallback();

  // --- 6. จัดการขั้นตอนสุดท้าย (Alert, Redirect, Logout) ---
  switch (finalAction) {
    case 'AlertAndLogout':
      //cy.on('window:alert', (txt) => {
      //expect(txt).to.contain('Approve and Send Mail Notify Success');
      //});

      // cy.contains('Approve and Send Mail Notify Success', { timeout: 20000 })
      //   .should('be.visible');
      // cy.contains('button', 'OK').click();

      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      //cy.url({ timeout: 3000000 }).should('include', '/login');
      break;

    case 'ComplexLogout': // สำหรับ SPADSup (ไม่มี Alert)
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      //cy.url({ timeout: 3000000 }).should('include', '/login');
      break;

    case 'StopAfterCore': // สำหรับ SPADTesterMain (ทำเสร็จแล้วหยุด)
      cy.log('Core task finished. Stopping as requested.');
      break;
  }
};

const createSimplePageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback

): void => {

  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });


  cy.url({ timeout: 60000 }).should('include', expectedUrl);

  coreTaskCallback();

  //cy.on('window:alert', (txt) => {
  //expect(txt).to.contain('Approve and Send Mail Notify Success');
  //});
  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.contains('button', 'Logout').click();
  //cy.url({ timeout: 3000000 }).should('include', '/login');
};

/*
----------------------------------------------------------------------------
---   1.3. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

/**
 * (ฟังก์ชันเดิม)
 * 1. Approve แบบง่ายที่สุด: แค่คลิก Approve ใน To Do List
 */
export const approveProject = (projectName: string): void => {
  cy.get('tbody tr').then(($rows) => {
    $rows.each((index, row) => {
      const text = Cypress.$(row).text().trim();
      cy.log(`Row ${index}: ${text.substring(0, 100)}`);
      if (text.includes(projectName)) {
        cy.log(`✅✅✅ MATCH at row ${index}`);
      }
    });
  });
  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          .should('be.visible')
          .click();
      });
  });
};

/**
 * 2. Flow SPADSup (ใช้ Helper หลัก)
 */
const _approveSPADLogic = (projectName: string, isComplex: boolean): void => {
  // กำหนดข้อความบนปุ่มตามเงื่อนไข (True = Complex, False = Non Complex)
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      // --- Logic การกรอกข้อมูล (เหมือนเดิมเป๊ะ) ---
      const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;
      const random2DigitCode = Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE')
        .closest('.col-md-4')
        .find('input')
        .type(random5DigitCode.toString());

      cy.contains('label', 'GROUP_FEATURE')
        .closest('.col-md-4')
        .find('input')
        .type(random2DigitCode.toString());

      cy.scrollTo('bottom');
      cy.wait(5000);

      // --- ส่วนที่เปลี่ยนไปตามเงื่อนไข ---
      cy.contains('button', buttonText, { timeout: 3000000 })
        .should('be.visible')
        .click();
    },
    'ComplexLogout'
  );
};
// ฟังก์ชันเดิม 1: สำหรับเคส Complex
export const approveProjectSPADSup = (projectName: string): void => {
  cy.log(`🤖 Auto-selecting: Complex Approval for ${projectName}`);
  _approveSPADLogic(projectName, true); // ส่ง true
};

// ฟังก์ชันเดิม 2: สำหรับเคส Non Complex
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => {
  cy.log(`🤖 Auto-selecting: Non-Complex Approval for ${projectName}`);
  _approveSPADLogic(projectName, false); // ส่ง false
};

const _approveSPADDOERLogic = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {

      // --- ส่วนที่ต่างกัน: เช็คว่าต้องกรอก Input หรือไม่ ---
      if (isMainFlow) {
        // สร้างเลขสุ่มสำหรับใช้กรอก (เพื่อไม่ให้ซ้ำ)
        const rnd = () => Math.floor(Math.random() * 90000) + 10000;

        cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input')
          .type('PT' + rnd());
        cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input')
          .type('PP' + rnd());
        cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input')
          .type('PST' + rnd());

        cy.log('📝 Filled Main Flow Inputs');
      }

      // --- ส่วนที่เหมือนกัน: เลือก Dropdown ---

      // Helper ย่อยสำหรับเลือก Random Option ใน mat-select
      const selectRandomOption = (labelName: string) => {
        cy.contains('label', labelName).parent().next('div').find('mat-select').click();
        cy.get('mat-option').then($options => {
          const randomIndex = Math.floor(Math.random() * $options.length);
          cy.wrap($options[randomIndex]).click({ force: true });
        });
      };

      selectRandomOption('Gprs type');
      cy.wait(2000);
      selectRandomOption('Template');

      // --- ส่วนที่เหมือนกัน: กดปุ่ม Approve ---
      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 })
        .should('be.visible')
        .click();
    },
    'AlertAndLogout'
  );
};

// ==========================================
// 2. Export Functions (Wrapper)
// ==========================================

/**
 * 3. Flow SPADDOER (ปกติ - ไม่กรอก Input)
 */
export const approveProjectSPADDOER = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, false); // ส่ง false
};

/**
 * 4. Flow SPADDOERMain (Main - กรอก Input เพิ่ม)
 */
export const approveProjectSPADDOERMain = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, true); // ส่ง true
};
const _approveSPADTesterLogic = (projectName: string, isMainFlow: boolean): void => {
  const logoutStrategy = isMainFlow ? 'StopAfterCore' : 'AlertAndLogout';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {

      if (isMainFlow) {
        cy.wait(10000);
        cy.scrollTo('bottom');

        // 1. Setup Network Intercept & Alert Listeners
        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

        // Listener สำหรับ Send PlugIN phase
        cy.once('window:alert', (alertText) => {
          if (alertText.includes('Call API Plugin Success') || alertText.includes('Do you want to Approve')) {
            expect(alertText).to.be.a('string');
          } else {
            throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
          }
        });

        // 2. Action: Send PlugIN
        cy.on('window:confirm', () => true); // Auto confirm
        cy.contains('button', 'Send PlugIN', { timeout: 3000000 }).should('be.visible').click();

        // Handle "Yes" popup if exists
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Yes")').length > 0) {
            cy.get('button').contains('Yes', { timeout: 10000 }).first().click();
          }
        });

        // 3. Waiting Phase (70s) & Refresh
        cy.log('⏳ Waiting 70s for Plugin processing...');
        cy.wait(40000);

        cy.scrollTo('top');
        cy.contains('button', 'Refresh Status', { timeout: 3000000 }).should('be.visible').click();

        cy.scrollTo('bottom');
        cy.wait(5000);

        // 4. Action: Promote to SPAD Deploy (Complex Mode)
        cy.removeAllListeners('window:alert'); // Clear old listeners

        // Setup listener ใหม่สำหรับ Promote phase
        cy.once('window:alert', (alertText) => {
          if (alertText.includes('Do you want to Approve') || alertText.includes('Call API Plugin Success')) {
            expect(alertText).to.be.a('string');
          } else {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();

        // Handle "Yes" popup again
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Yes")').length > 0) {
            cy.get('button').contains('Yes', { timeout: 10000 }).last().click();
          }
        });

      } else {
        // ==========================================
        // PATH B: Simple Flow (Just Promote)
        // ==========================================

        cy.scrollTo('bottom');
        cy.wait(5000);
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
      }
    },
    logoutStrategy // ส่งค่า Strategy ที่เราเลือกไว้ตอนต้น
  );
};

export const approveProjectSPADTester = (projectName: string): void => {
  cy.log(`🤖 SPAD Tester: Normal Flow`);
  _approveSPADTesterLogic(projectName, false);
};

export const approveProjectSPADTesterMain = (projectName: string): void => {
  cy.log(`🤖 SPAD Tester: Main Flow (PlugIN + Wait 70s)`);
  _approveSPADTesterLogic(projectName, true);
};
/**
 * 7. Flow SPADdeploy (ใช้ Helper หลัก)
 */
export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Promote To ACTM', { timeout: 3000000 }).should('be.visible').click();

    },
    'AlertAndLogout'
  );
};

/**
 * 8. Flow CGMD (ใช้ Helper หลัก)
 */
export const approveProjectCGMD = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.get('button[name="CBS"]').should('be.visible', { timeout: 3000000 }).click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};

/**
 * 9. Flow CGMDPRE (ใช้ Helper หลัก)
 */
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
      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDPREMobPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {

      cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + Math.floor(Math.random() * 90000) + 10000);

      cy.contains('label', 'Gprs type').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });
      cy.wait(2000);
      cy.contains('label', 'Template').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });
      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Approve To CGMD Tester', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};
export const approveProjectCGMDPREPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {

      cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + Math.floor(Math.random() * 90000) + 10000);

      cy.contains('label', 'Gprs type').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });
      cy.wait(2000);
      cy.contains('label', 'Template').parent().next('div').find('mat-select').click();
      cy.get('mat-option').then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.wrap($options[randomIndex]).click({ force: true });
      });
      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Approve To CGMD Tester', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};
/**
 * 10. Flow CGMDtesterProACTM (ใช้ Helper หลัก)
 */
export const approveProjectCGMDtester = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};

/**
 * 11. Flow CGMDtesterProPRE (ใช้ Helper หลัก)
 */
export const approveProjectCGMDtesterPRE = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Promote To Pre Go Live', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};
export const approveProjectCGMDtesterPREMobPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      cy.wait(10000);
      cy.scrollTo('bottom');

      cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

      cy.once('window:alert', (alertText) => {
        if (alertText.includes('Call API Plugin Success')) {
          expect(alertText).to.include('Call API Plugin Success');
        } else if (alertText.includes('Do you want to Approve to Pre Go Live')) {
          expect(alertText).to.include('Do you want to Approve to Pre Go Live');
        } else {
          throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
        }
      });

      // 4. ดัก confirm (ตอบ OK ทุก popup)
      cy.on('window:confirm', () => true);

      // 5. คลิก 'Send PlugIN'
      cy.contains('button', 'Send PlugIN', { timeout: 3000000 })
        .should('be.visible')
        .click();

      // 6. คลิก "Yes" ถ้ามี
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Yes")').length > 0) {
          cy.get('button').contains('Yes', { timeout: 10000 }).first().click();
        }
      });

      cy.wait(40000);
      cy.scrollTo('top');
      cy.contains('button', 'Refresh Status', { timeout: 3000000 })
        .click();
      cy.scrollTo('bottom');
      cy.wait(5000);

      cy.contains('button', /Promote To Pre Go Live/i)
        .should('be.visible')
        .click();

      // 10. คลิก "Yes" ถ้ามีปุ่ม
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Yes")').length > 0) {
          cy.get('button').contains('Yes', { timeout: 10000 }).last().click();
        }
      });
    },
    'StopAfterCore'
  );
};
export const approveProjectCGMDtesterPREPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {


      cy.wait(10000);
      cy.scrollTo('bottom');

      cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

      cy.once('window:alert', (alertText) => {
        if (alertText.includes('Call API Plugin Success')) {
          expect(alertText).to.include('Call API Plugin Success');
        } else if (alertText.includes('Do you want to Approve to Pre Go Live')) {
          expect(alertText).to.include('Do you want to Approve to Pre Go Live');
        } else {
          throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
        }
      });

      // 4. ดัก confirm (ตอบ OK ทุก popup)
      cy.on('window:confirm', () => true);

      // 5. คลิก 'Send PlugIN'
      cy.contains('button', 'Send PlugIN', { timeout: 3000000 })
        .should('be.visible')
        .click();

      // 6. คลิก "Yes" ถ้ามี
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Yes")').length > 0) {
          cy.get('button').contains('Yes', { timeout: 10000 }).first().click();
        }
      });

      // 7. รอ 70 วินาที และ Refresh Status
      cy.wait(40000);
      cy.scrollTo('top');
      cy.contains('button', 'Refresh Status', { timeout: 3000000 })
        .should('be.visible')
        .click();
      cy.scrollTo('bottom');
      cy.wait(5000);

      // --- แยก phase ใหม่ สำหรับ Promote ---
      // ลบ listener เดิมก่อน เพื่อไม่ให้ alert เก่าถูกจับซ้ำ
      cy.removeAllListeners('window:alert');

      // 8. ตั้ง alert listener สำหรับ Promote
      cy.once('window:alert', (alertText) => {
        if (alertText.includes('Do you want to Approve to Pre Go Live')) {
          expect(alertText).to.include('Do you want to Approve to Pre Go Live');
        } else if (alertText.includes('Call API Plugin Success')) {
          // fallback case: บางระบบยังเด้งข้อความนี้ซ้ำ
          expect(alertText).to.include('Call API Plugin Success');
        } else {
          throw new Error(`Unexpected alert text (Promote): ${alertText}`);
        }
      });

      // 9. คลิก 'Promote to SPAD Deploy'
      cy.contains('button', 'Promote to Pre Go Live', { timeout: 3000000 })
        .should('be.visible')
        .click();

      // 10. คลิก "Yes" ถ้ามีปุ่ม
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Yes")').length > 0) {
          cy.get('button').contains('Yes', { timeout: 10000 }).last().click();
        }
      });
    },
    'StopAfterCore'
  );
};


/**
 * 12. Flow CGMDACTM (ใช้ Helper หลัก)
 */
export const approveProjectACTM = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/actm/actm-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.get(':nth-child(3) > :nth-child(4)').click(); // Selector จากโค้ดเดิม

    },
    'AlertAndLogout'
  );
};

/**
 * 14. Flow CGMDOPER (ใช้ Helper รอง)
 */
export const approveProjectOPER = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/oper/oper-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.get('.col-md-6 > :nth-child(3)').click(); // Selector จากโค้ดเดิม

    }
  );
};
export const approveProjectTSCenter = (projectName: string): void => {
  performSimpleClaimAndApprovalRole(
    'tscenter',           // username
    'tscenter',           // password
    (projectName: string) => {  // approveFunction callback

      cy.get('select[formcontrolname="olympus"]').should('be.visible');

      // เลือก No
      cy.get('select[formcontrolname="olympus"]').select('No');

      // ตรวจสอบว่าเลือกแล้ว
      cy.get('select[formcontrolname="olympus"]').should('have.value', 'No');

      // ตรวจสอบว่า form valid
      cy.get('select[formcontrolname="olympus"]')
        .should('not.have.class', 'ng-invalid')
        .and('have.class', 'ng-valid');

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();

    }
  );
};
/**
 * 15. Flow CGMDAPO (ใช้ Helper รอง)
 */
export const approveProjectAPO = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/apo/apo-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', 'Promote To Pre Go Live').click();

    }
  );
};
export const ProjectBasicInformationComplete = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  ProductClass: 'main' | 'ontop' | 'ontopextra',
  options: {
    ProductClass1: 'Main' | 'Ontop' | 'OntopExtra',
    Module: 'POST' | 'PRE' | 'ENTER' | 'MUSIC',
    subModule?: 'POST' | 'PRE',
    autoSetDuration?: boolean
  }
) => {
  const { ProductClass1, Module, subModule, autoSetDuration = false } = options;

  // --- Login ---
  const credentials = (() => {
    switch (Module) {
      case 'POST': return { user: MKTpost, pass: MKTpost1 };
      case 'PRE': return { user: MKTpre, pass: MKTpre1 };
      case 'ENTER': return { user: enter, pass: enterpass };
      case 'MUSIC': return { user: music, pass: musicpass };
      default: return { user: MKTpost, pass: MKTpost1 };
    }
  })();
  login(credentials.user, credentials.pass);

  // --- Create Project ---
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  const prefix = Module === 'ENTER' ? 'ENTER' : Module === 'MUSIC' ? 'MUSIC' : 'MOB';
  const ModulePart = (Module === 'ENTER' || Module === 'MUSIC') ? `${prefix} ${subModule}` : `${prefix} ${Module}`;


  const projectName = `${ModulePart} ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;
  cy.get('input[formcontrolname="projectName"]').type(projectName);

  const envKey = ProductClass1 === 'Main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);

  if (ProductClass1 === 'Main') formattedDateMain = projectName;
  else formattedDateOntop = projectName;

  // --- Date ---
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('input[aria-label="Date input field"]').type(formattedDate);
  cy.wait(2000);

  // --- Customer Type (ENTER/MUSIC) ---
  if (Module === 'ENTER' || Module === 'MUSIC') {
    if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
    const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
    cy.get('select[formcontrolname="customerType"]')
      .select(customerType)
      .should('have.value', customerType);
  }

  // --- Phone ---
  const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
  cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);

  // --- Save & Close ---
  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(2000);
  cy.get('.modal-body > :nth-child(1) > div > .btn').click();

  // --- Add PO ---
  cy.get(':nth-child(4) > .btn').click();
  const poName = `${ModulePart} ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;
  cy.get('input[formcontrolname="productName"]').type(poName);
  const poEnvKey = ProductClass1 === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  Cypress.env(poEnvKey, poName);

  cy.get('select[formcontrolname="promotionSubGroupFrom"]')
    .select('Product Offering')
    .should('have.value', 'Product Offering');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  // Wait for button to appear
  cy.contains('button', 'Create', { timeout: 10000 })
    .should('be.visible')
    .click()
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // --- Navigate to Product Offering ---
  cy.url({ timeout: 3000000 }).should('include', '/#/project-home/project-basic-information');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.url({ timeout: 3000000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
  cy.wait(8000);

  // --- Setup PriceType / ProductClass / Duration ---
  (() => {
    // --- PriceType ---
    const priceTypeMap = {
      onetime: '1: One-Time',
      recurring: '2: Recurring',
      usage: '3: Usage'
    };
    const priceValue = priceTypeMap[PriceType];
    cy.get('select[formcontrolname="priceType"]')
      .select(priceValue, { force: true })
      .should('have.value', priceValue);

    // --- ProductClass ---
    const productClassMapMobile = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
    const productClassMapEnterMusic = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };

    let productValue: string;
    if (Module === 'ENTER' || Module === 'MUSIC') {
      if (ProductClass === 'main') throw new Error(`Product Class "Main" is not available for Module ${Module}`);
      productValue = productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra'];
    } else {
      productValue = productClassMapMobile[ProductClass];
    }

    cy.get('select[formcontrolname="productClass"]')
      .select(productValue)
      .should('have.value', productValue);
    cy.wait(2000);

    // --- Duration ---
    if (autoSetDuration) {
      const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randomMonth = randomInRange(2, 60);
      cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());
      cy.get('select[formcontrolname="packageDurationUnit"]').select('Months');
      cy.get('select[formcontrolname="packageDurationUnit"]')
        .find('option:selected')
        .should('have.text', 'Months');
    }
  })();
};

export const ProjectBasicInformationCompleteOtherPOSub = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  PoSubGroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
  Module: 'POST' | 'PRE'
): void => {
  // --- Login ---
  const credentials = (() => {
    switch (Module) {
      case 'POST': return { user: MKTpost, pass: MKTpost1 };
      case 'PRE': return { user: MKTpre, pass: MKTpre1 };
      default: return { user: MKTpost, pass: MKTpost1 };
    }
  })();

  login(credentials.user, credentials.pass);

  // --- Create Project ---
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  let projectName: string;
  if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
    projectName = `MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes}`;
  } else {
    projectName = `MOB ${Module} ${PoSubGroup} ${day}${month} ${hours}${minutes}`;
  }

  cy.get('input[formcontrolname="projectName"]').type(projectName);
  Cypress.env('projectName', projectName);

  // ตรวจสอบว่าเก็บค่าถูกต้อง
  cy.log(`✅ Stored projectName: ${Cypress.env('projectName')}`);

  // --- Date ---
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('input[aria-label="Date input field"]').type(formattedDate);
  cy.wait(2000);

  // --- Phone ---
  const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
  cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);

  // --- Save & Close ---
  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(2000);
  cy.get('.modal-body > :nth-child(1) > div > .btn').click();

  // --- Add PO ---
  cy.get(':nth-child(4) > .btn').click();

  let poName: string;
  if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
    poName = `MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes}`;
  }
  else {
    poName = `MOB ${Module} ${PoSubGroup} ${day}${month} ${hours}${minutes}`;
  }

  cy.get('input[formcontrolname="productName"]').type(poName);
  Cypress.env('poName', poName);
  cy.log(`✅ Stored poName: ${Cypress.env('poName')}`);

  const subGroupMap = {
    AccountFee: 'Account Fee',
    OrderFee: 'Order Fee',
    CashBack: 'Cash Back',
    Service: 'Service',
    GroupPoFee: 'Group PO Fee'
  };

  if (subGroupMap[PoSubGroup]) {
    cy.get('select[formcontrolname="promotionSubGroupFrom"]')
      .select(subGroupMap[PoSubGroup])
      .should('contain', subGroupMap[PoSubGroup]);
  }

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for button to appear
  cy.contains('button', 'Create', { timeout: 10000 })
    .should('be.visible')
    .click();

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // --- Navigate to Product Offering ---
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(8000);

  // --- Fill additional fields ---
  (() => {

    // Set PriceType for PRE Service/OrderFee
    if (Module === 'PRE' && (PoSubGroup === 'OrderFee' || PoSubGroup === 'Service')) {
      const priceTypeMap = {
        onetime: 'One-Time',
        recurring: 'Recurring',
        usage: 'Usage'
      };
      const priceValue = priceTypeMap[PriceType];
      cy.get('select[formcontrolname="priceType"]')
        .select(priceValue, { force: true })
        .should('have.value', priceValue);
    }
    if (Module === 'POST' && PoSubGroup === 'CashBack') {
      // For productClass dropdown
      // cy.get('select[formcontrolname="productClass"]')
      //   .find('option:not([disabled])')
      //   .then(($options) => {
      //     const randomIndex = Math.floor(Math.random() * $options.length);
      //     const value = $options.eq(randomIndex).val();

      //     // Type guard to ensure value is not undefined
      //     if (value && value !== '0: null') {
      //       cy.get('select[formcontrolname="productClass"]').select(value);
      //     }
      //   });

      // // For priceType dropdown  
      // cy.get('select[formcontrolname="priceType"]')
      //   .find('option:not([disabled])')
      //   .then(($options) => {
      //     const randomIndex = Math.floor(Math.random() * $options.length);
      //     const value = $options.eq(randomIndex).val();

      //     if (value && value !== '0: null') {
      //       cy.get('select[formcontrolname="priceType"]').select(value);
      //     }
      //   });

      // สุ่มตัวเลข 1-999 (เพราะ maxlength="5")
      const randomDuration = Math.floor(Math.random() * 999) + 1;

      cy.get('input[formcontrolname="duration"]')
        .clear()
        .type(randomDuration.toString())
        .should('have.value', randomDuration.toString());

      // const durationUnits = [
      //   '1: Bill Cycle',
      //   '2: Months',
      //   '3: Month_Midnight'
      // ];

      // const randomUnit = durationUnits[Math.floor(Math.random() * durationUnits.length)];

      // cy.get('select[formcontrolname="durationUnit"]')
      //   .select(randomUnit)
      //   .should('have.value', randomUnit);
      // cy.wait(2000);
      cy.get('button[class*="btn-primary"][type="button"]').click()
      cy.get('input[formcontrolname="durationFrom"]').type('1')
      cy.get('select[formcontrolname="discountType"]')
        .find('option:not([disabled])')
        .then(($options) => {
          const randomIndex = Math.floor(Math.random() * $options.length);

          // Cast the element to HTMLOptionElement to satisfy TypeScript
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;

          cy.get('select[formcontrolname="discountType"]').select(valueToSelect);
          cy.log('Selected Value:', valueToSelect);
        });
      cy.get('textarea[formcontrolname="discountNameEn"]').type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Discount NameEn`);
      cy.get('textarea[formcontrolname="discountNameTh"]').type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Discount Name Th`);
      const randomIndex = Math.floor(Math.random() * 2)
      cy.get('input[formcontrolname="marginalDiscount"]')
        .eq(randomIndex)
        .check()
      cy.get('button[class*="btn-primary"][type="button"]').eq(1).click();
      cy.get('input[formcontrolname="prorate"]')
        .eq(randomIndex)
        .check()

      const isConstant = randomIndex === 0
      const getRandomNumber = (min: number, max: number): number =>
        Math.floor(Math.random() * (max - min + 1)) + min

      if (isConstant) {
        // กรณีเลือก Constant
        cy.get('input[formcontrolname="cashBackType"]').first().check()

        // สุ่มค่าต่างๆ
        const totalUsage: number = getRandomNumber(1000, 5000)
        const cashBackExc: number = getRandomNumber(50, 500)
        const cashBackInc: number = Math.round(cashBackExc * 1.07)

        cy.get('input[formcontrolname="totalUsageFromExcVat"]').type(totalUsage.toString())
        cy.get('input[formcontrolname="cashBackExcVat"]').type(cashBackExc.toString())
        cy.get('input[formcontrolname="cashBackIncVat"]').type(cashBackInc.toString())

      } else {
        // กรณีเลือก Percentage
        cy.get('input[formcontrolname="cashBackType"]').last().check()

        // สุ่มค่าต่างๆ
        const totalUsage: number = getRandomNumber(1000, 5000)
        const percent: number = getRandomNumber(1, 20)

        cy.get('input[formcontrolname="totalUsageFromExcVat"]').type(totalUsage.toString())
        cy.get('input[formcontrolname="cashBackPercent"]').type(percent.toString())
      }
      cy.get('button.btn.btn-primary').contains('Add').click()

      cy.get('button.btn.btn-primary').contains('Add').click()
    }


    if (!(Module === 'POST' && PoSubGroup === 'CashBack')) {

      function getRandomRealisticCharge(min = 100, max = 2000) {
        return (Math.random() * (max - min) + min).toFixed(2);
      }
      const randomCharge = getRandomRealisticCharge();
      const priceIncludingVAT = (parseFloat(randomCharge) * 1.07).toFixed(2);

      // Price Excluding VAT
      cy.get('input[formcontrolname="priceExcludingVAT"]')
        .clear()
        .type(randomCharge)
        .should('have.value', randomCharge);

      // Price Including VAT
      cy.get('input[formcontrolname="priceIncludingVAT"]')
        .clear()
        .type(priceIncludingVAT)
        .should('have.value', priceIncludingVAT);
    }
    // Additional fields based on PoSubGroup
    if (PoSubGroup === 'Service') {
      //promotion levels
      const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;

      // Select random from known values
      const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

      cy.get('select[formcontrolname="promotionLevel"]')
        .select(randomPromotion)
        .should('have.value', randomPromotion);

      // SMS Wording Greeting Letter EN
      cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // SMS Greeting Flag
      cy.get('select[formcontrolname="smsGreetingSendFlag"]')
        .select('Send')

      // SMS Greeting EN
      cy.get('textarea[formcontrolname="smsGreetingEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} SMS Greeting Eng`);

      // SMS Greeting TH
      cy.get('textarea[formcontrolname="smsGreetingTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} SMS Greeting Thai`);

      // SMS Delete Flag
      cy.get('select[formcontrolname="smsDeleteSendFlag"]')
        .select('Send')

      // SMS Delete EN
      cy.get('textarea[formcontrolname="smsDeleteEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} SMS Delete Eng`);

      // SMS Delete TH
      cy.get('textarea[formcontrolname="smsDeleteTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} SMS Delete Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} description Thai`);
      // Discount Revenue Code
      cy.get('input[formcontrolname="discountRevenueCode"]')
        .type('APCP-009');

      // Matching Product Offering
      cy.get('select[formcontrolname="availableListBox"]').then(($select) => {
        const optionCount = $select.find('option').length;

        const maxSelections = Math.min(3, optionCount);
        const numberOfSelections = Math.floor(Math.random() * maxSelections) + 1;

        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numberOfSelections) {
          const randomIndex = Math.floor(Math.random() * optionCount);
          selectedIndices.add(randomIndex);
        }

        selectedIndices.forEach((index: number) => {
          cy.get('select[formcontrolname="availableListBox"] option')
            .eq(index)
            .dblclick();
        });
      });
      // Other Condition
      cy.get('textarea[formcontrolname="otherCondition"]')
        .type('Other Condition '.repeat(6))

      // Memo Description
      cy.get('textarea[formcontrolname="memoDescription"]')
        .type('Memo Description '.repeat(6))
    } else if (PoSubGroup === 'CashBack') {
      // shortPromotionName  EN
      cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Short Promotion Name Eng`);

      // shortPromotionName TH
      cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Short Promotion Name Thai`);

      // promotionDescriptionEn 
      cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Promotion Description Eng`);

      // promotionDescription TH
      cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Promotion Description Thai`);

      // greetingLetterEn 
      cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // greetingLetter TH
      cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // yourPackageNameEn 
      cy.get('textarea[formcontrolname="yourPackageNameEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Your PackageName Eng`);

      // yourPackageNameEn 
      cy.get('textarea[formcontrolname="yourPackageNameTh"]')
        .type('ทดสอบ'.repeat(5));
      // Matching Product Offering
      cy.get('select[formcontrolname="availableListBox"]').then(($select) => {
        const optionCount = $select.find('option').length;

        const maxSelections = Math.min(3, optionCount);
        const numberOfSelections = Math.floor(Math.random() * maxSelections) + 1;

        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numberOfSelections) {
          const randomIndex = Math.floor(Math.random() * optionCount);
          selectedIndices.add(randomIndex);
        }

        selectedIndices.forEach((index: number) => {
          cy.get('select[formcontrolname="availableListBox"] option')
            .eq(index)
            .dblclick();
        });
      });
      // Memo Description
      // cy.get('textarea[formcontrolname="memoDescription"]')
      //   .type('Memo Description '.repeat(6))
    }
    else {
      //productTypes
      const productTypes = ['FBB', 'Fixline', 'Mobile', 'Non Mobile'] as const;

      cy.get('select[formcontrolname="productType"]')
        .then(() => {
          const randomValue = productTypes[Math.floor(Math.random() * productTypes.length)];

          cy.get('select[formcontrolname="productType"]')
            .select(randomValue)
            .should('have.value', randomValue);
        });
      // SMS Wording Greeting Letter EN
      cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month} ${hours}${minutes} description Thai`);

      // Discount Revenue Code
      cy.get('input[formcontrolname="discountRevenueCode"]')
        .type('APCP-009');

      // Matching Product Offering
      cy.get('select[formcontrolname="availableListBox"]').then(($select) => {
        const optionCount = $select.find('option').length;

        const maxSelections = Math.min(3, optionCount);
        const numberOfSelections = Math.floor(Math.random() * maxSelections) + 1;

        const selectedIndices = new Set<number>();
        while (selectedIndices.size < numberOfSelections) {
          const randomIndex = Math.floor(Math.random() * optionCount);
          selectedIndices.add(randomIndex);
        }

        selectedIndices.forEach((index: number) => {
          cy.get('select[formcontrolname="availableListBox"] option')
            .eq(index)
            .dblclick();
        });
      });

      // Other Condition
      cy.get('textarea[formcontrolname="otherCondition"]')
        .type('Other Condition '.repeat(6))

      // Memo Description
      cy.get('textarea[formcontrolname="memoDescription"]')
        .type('Memo Description '.repeat(6))
    }
  })();
};


// รับ parameter ชื่อ 'type' (ตั้งค่า default เป็น 'normal' หรือค่าที่คุณใช้บ่อยสุด)
export const InternetRandom = (type: 'notrecurring' | 'recurring' = 'notrecurring') => {
  if (type === 'notrecurring') {
    Internetrandom(
      'button.btn.btn-primary.btn-xs:eq(3)',
      ':nth-child(1) > .btn'
    );
  } else if (type === 'recurring') {
    Internetrandom(
      'button.btn.btn-primary.btn-xs:eq(4)',
      'button.btn-primary:contains("Add"):last'
    );
  }
};

const Internetrandom = (addButtonSelector: string, saveButtonSelector: string): void => {
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.scrollTo('bottom');
  cy.wait(5000);
  cy.get(addButtonSelector).click();

  cy.get('select[formcontrolname="InternetQuotaType"]')
    .find('option:not([disabled])')
    .then(($options) => {

      const randomIndex = Math.floor(Math.random() * $options.length);
      // const selectedValue = ($options[randomIndex] as HTMLOptionElement).value;
      const selectedValue = 'Limited Data (Pay per use)';
      cy.get('select[formcontrolname="InternetQuotaType"]').last().select(selectedValue);
      cy.wait(5000);

      switch (selectedValue) {
        case 'Limited Data (Pay per use)':
        // case 'Limited Data (Stop Net)':
        // case 'Limited Data Only':
          selectRandomInternetQuota();
          cy.wait(2000);
          selectRandomInternetSpeed();
          cy.wait(2000);
          selectRandomExceedRate();
          cy.wait(2000);
          break;

        // case 'Unlimited Data (Throttling Speed)':
        //   selectRandomInternetQuota();
        //   cy.wait(2000);
        //   selectRandomInternetSpeed();
        //   cy.wait(2000);
        //   selectInternetThrottlingSpeed();
        //   cy.wait(2000);
        //   selectRandomExceedRate();
        //   cy.wait(2000);
        //   break;

        // case 'Pay per use only':
        //   selectRandomExceedRate();
        //   cy.wait(2000);
        //   break;

        // case 'Unlimited Data (Fixed Speed)':
        //   cy.get('[formarrayname="internetQuotaNetworkCoverageCheckBox"]')
        //     .contains('label', '5G')
        //     .click();
        //   cy.wait(2000);
        //   selectRandomInternetSpeedfixed();
        //   cy.wait(2000);
        //   selectRandomExceedRate();
        //   cy.wait(2000);
        //   break;
      }
      cy.get(saveButtonSelector).click();
    });
};

const selectRandomInternetQuota = () => {
  cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });
  cy.get('.mat-select-panel mat-option')
    .should('be.visible')
    .then(($options) => {
      const fiveGOptions = $options.filter((index, option) =>
        Cypress.$(option).text().trim().startsWith('5G')
      );
      const randomIndex = Math.floor(Math.random() * fiveGOptions.length);
      cy.wrap(fiveGOptions[randomIndex]).click({ force: true });
    });
};

const selectRandomInternetSpeed = () => {
  cy.get('select[formcontrolname="internetSpeed"]')
    .find('option')
    .then(($options) => {
      const startIndex = 1;
      const randomIndex = Math.floor(Math.random() * ($options.length - startIndex)) + startIndex;
      const randomValue = $options[randomIndex].value;

      cy.get('select[formcontrolname="internetSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
    });
};
const selectRandomInternetSpeedfixed = () => {
  cy.get('select[formcontrolname="fixedSpeedInternetSpeed"]')
    .find('option')
    .then(($options) => {
      const startIndex = 1;
      const randomIndex = Math.floor(Math.random() * ($options.length - startIndex)) + startIndex;
      const randomValue = $options[randomIndex].value;

      cy.get('select[formcontrolname="fixedSpeedInternetSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
    });
};
const selectRandomExceedRate = () => {
  cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });
  cy.get('.mat-select-panel mat-option')
    .should('be.visible')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.wrap($options[randomIndex]).click({ force: true });
    });
};
const selectInternetThrottlingSpeed = () => {
  cy.get('select[formcontrolname="internetThrottlingSpeed"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomOption = $options[randomIndex] as HTMLOptionElement;
      const randomValue = randomOption.value;

      cy.get('select[formcontrolname="internetThrottlingSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
    });

};

/*
============================================================================
=== 
===   Refactor Pattern 4: SMS Wording & Tariff Tabs
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   4.1. การกำหนดประเภท (Type Definitions)
----------------------------------------------------------------------------
*/

/**
 * โครงสร้างสำหรับข้อมูล "ช่องกรอกข้อความ" (Textarea)
 * - selector: ชื่อ CSS ของช่องกรอก
 * - values: รายการข้อความที่จะพิมพ์ (เช่น [eng, th])
 */
type SmsField = {
  selector: string;
  values: string[];
};

/**
 * โครงสร้างสำหรับข้อมูล "ดรอปดาวน์" (Dropdown)
 * - selector: ชื่อ CSS ของ dropdown
 * - value: ค่าที่ต้องการเลือก
 */
type SmsDropdown = {
  selector: string;
  value: string;
};

/*
----------------------------------------------------------------------------
---   4.2. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * ฟังก์ชันช่วย: ปิด Modal "Success"
 * * หน้าที่: รอให้ Modal ปรากฏขึ้นมาหลังกด Save
 * จากนั้นค้นหาปุ่ม 'Close' (สีแดง) และคลิกปิด
 */
const closeSuccessModal = (): void => {

  // Wait for the modal to appear
  cy.get('.modal-dialog', { timeout: 20000 }).should('be.visible');

  // Ensure the modal footer is visible
  cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');

  // Find the Close button, ensure it's visible and enabled, then click it
  cy.get('.modal-footer')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
};

/**
 * ฟังก์ชันช่วย: สำหรับหน้า SMS Wording
 * * หน้าที่: รับ "ข้อมูลช่องกรอก" และ "ข้อมูลดรอปดาวน์"
 * แล้วทำกระบวนการทั้งหมด: คลิกแท็บ -> กรอกข้อมูล -> เลือกดรอปดาวน์
 * -> รอ API -> กด Save -> และเรียกใช้ 'closeSuccessModal'
 */
const fillSmsWordingTab = (fields: SmsField[], dropdowns: SmsDropdown[]): void => {
  //Nav SMS Wording
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();

  // วนลูปเพื่อกรอกข้อมูลในฟิลด์ต่าง ๆ
  fields.forEach((field) => {
    field.values.forEach((value, index) => {
      cy.get(field.selector).eq(index)
        .type(value)
        .should('have.value', value);
    });
  });

  // วนลูปเพื่อเลือกค่าใน dropdown
  dropdowns.forEach((dropdown) => {
    cy.get(dropdown.selector)
      .select(dropdown.value)
      .should('have.value', dropdown.value);
  });

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  //Save button
  cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();

  //Buttom Close (เรียกใช้ฟังก์ชันช่วย)
  closeSuccessModal();
};

/*
----------------------------------------------------------------------------
---   4.3. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

/**
 * (Refactored)
 * กรอก SMS Wording (แบบเต็ม)
 * หน้าที่: กำหนด "ข้อมูล" แล้วส่งให้ฟังก์ชันช่วย 'fillSmsWordingTab' จัดการ
 */
// ==========================================
// 1. Logic กลาง (รวมความต่างไว้ที่นี่)
// ==========================================
const _smsWordingLogic = (type: 'POST' | 'PRE') => {
  // Fields พื้นฐานที่มีในทั้ง 2 แบบ
  const baseFields: SmsField[] = [
    { selector: 'textarea[formcontrolname="shortPromotionName"]', values: ['Sample Promotion Name ENG', 'ตัวอย่างชื่อโปรโมชั่น THA'] },
    { selector: 'textarea[formcontrolname="cmsDisplay"]', values: ['Sample CMS Display ENG', 'ตัวอย่าง CMS Display THA'] },
    { selector: 'textarea[formcontrolname="promotionDescription"]', values: ['Sample Promotion Description in English', 'ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsGreeting"]', values: ['Sample SMS Greeting in English', 'ตัวอย่าง SMS ทักทายภาษาไทย'] },
  ];

  // Fields พิเศษสำหรับแบบ POST (แบบแรก)
  const postOnlyFields: SmsField[] = [
    { selector: 'textarea[formcontrolname="marketingName"]', values: ['Marketing Name EN Only'] },
    { selector: 'textarea[formcontrolname="greetingLetter"]', values: ['Sample Greeting Letter in English', 'ตัวอย่างจดหมายทักทายภาษาไทย'] },
    { selector: 'textarea[formcontrolname="yourPackage"]', values: ['Sample Billing Description in English', 'ตัวอย่างคำอธิบายบิลภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsDelete"]', values: ['Sample SMS Delete in English', 'ตัวอย่าง SMS ลบแพ็กภาษาไทย'] },
  ];

  // รวม Fields: ถ้าเป็น POST ให้เอา base + postOnly, ถ้าเป็น PRE เอาแค่ base
  const finalFields = type === 'POST' ? [...baseFields, ...postOnlyFields] : baseFields;


  // --- 2. จัดการ Dropdowns ---
  const dropdowns: SmsDropdown[] = [
    { selector: 'select[formcontrolname="smsGreetingSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsDeleteSendFlag"]', value: 'Send' },
  ];

  // ถ้าเป็น PRE ต้องเพิ่ม Dropdown พิเศษตัวนี้เข้าไป
  if (type === 'PRE') {
    dropdowns.push({ selector: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]', value: 'Send' });
  }

  // --- 3. เรียกใช้งาน Helper ---
  fillSmsWordingTab(finalFields, dropdowns);
};

export const smsWording = () => {
  cy.log('📝 Filling SMS Wording: POST Mode');
  _smsWordingLogic('POST');
};

export const smsWordingpre = () => {
  cy.log('📝 Filling SMS Wording: PRE Mode');
  _smsWordingLogic('PRE');
};
export const Tariff = (): void => {
  // Navigate to Tariff & Discount section
  cy.get('.scrollmenu > .nav')
    .contains('Tariff Plan & Discount')
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(5000);

  // --- ส่วนนี้คือตรรกะเฉพาะของ Tariff (การสุ่มเลือก) ---
  cy.get('#mat-select-2 .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  cy.get('.mat-select-panel mat-option')
    .should('be.visible')
    .then($options => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const selectedText = $options.eq(randomIndex).text().trim();

      cy.log(`Total options: ${$options.length}`);
      cy.log(`Random index: ${randomIndex}`);
      cy.log(`Selected: ${selectedText}`);

      cy.wrap($options[randomIndex]).click({ force: true });

      // Verify selection
      cy.get('#mat-select-2 .mat-select-value-text')
        .should('contain.text', selectedText);
    });
  // --- จบตรรกะเฉพาะ ---

  // Click Generate Discount button
  cy.contains('button', 'Generate Discount')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  // Click Save button
  cy.contains('button', 'Save')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  // Wait for modal footer and close it (เรียกใช้ฟังก์ชันช่วย)
  closeSuccessModal();
};

const standardBeforeApproveCKS = (): void => {
  //Button Back
  cy.contains('button', 'Back')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  //Button yes
  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // wait API 
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(10000);

  // Checkbox fast lane
  // Using the label text to find the checkbox
  cy.contains('label', 'Fast Lane :')
    .parent() // go to the div containing the label
    .next() // move to the next sibling div
    .find('input[type="checkbox"]')
    .check()

  // Using the row structure
  cy.get('.row.col-md-11')
    .find('input[type="checkbox"]')
    .check()
  cy.wait(['@getRequest'], { timeout: 100000 });

  const now = new Date();
  now.setDate(now.getDate() + 1);

  // Format เป็น dd/MM/yyyy
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const formattedDateMain2 = `${day}/${month}/${year}`;

  //date
  cy.get('input[aria-label="Date input field"]').eq(1).type(formattedDateMain2)

  // button Submit
  // intercept GET แทน POST
  cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');

  //Button Approve
  cy.contains('button', 'Approve').click();

  cy.wait('@submitApprove', { timeout: 3000000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(3500)

  // ใช้ global variable ที่ตั้งค่าไว้ตอนสร้างโปรเจกต์
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME') || Cypress.env('poName');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProject from Unassigned Task
  ClaimProject(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);

  // รอให้ URL เปลี่ยนก่อน
  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');

  // รอให้ table/element หลักโหลดเสร็จก่อน
  cy.get('body', { timeout: 3000000 }).should('be.visible');

  // แล้วค่อยเลื่อนลงล่างสุด
  cy.scrollTo('bottom');
  cy.wait(5000)

  // intercept API หลัก
  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
  cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

  // Click ปุ่ม Approve To CGMD
  cy.contains('button', 'Approve To CGMD', { timeout: 3000000 })
    .should('be.visible')
    .click();

  // รอ API ที่สำคัญต้องยิงครบ
  cy.wait('@promoteChecker', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@assignCgmd', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@sendMail', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

  // verify alert
  //cy.on('window:alert', (txt) => {
  //expect(txt).to.contain('Approve and Send Mail Notify Success');
  //});

  // verify redirect กลับ workspace
  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  //cy.url({ timeout: 3000000 }).should('include', '/login');
}

export const beforeapproveMKT = () => {
  //description 
  // Wait for the element to not be disabled and not be covered
  cy.get(':nth-child(2) > :nth-child(2) > .form-control', { timeout: 10000 })
    .should('be.visible')
    .should('be.enabled')
    .should('not.be.disabled')
    .type('Description');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.get(':nth-child(3) > :nth-child(1) > .btn').click();

  // *Approve memo 
  cy.get('.row.ng-star-inserted > .col-md-6 > input').click();

  // button Submit
  cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');

  cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
    .contains('Submit')
    .click();

  cy.wait('@submitApprove', { timeout: 3000000 })
    .its('response.statusCode')
    .should('eq', 200);

  // cy.on('window:alert', (text) => {
  //   expect(text).to.include('Approve and Send Mail Notify Success');
  // });

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  cy.wait(3500)
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME') || Cypress.env('poName');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProject from Unassigned Task
  ClaimProject(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);

  // Intercept all GET and POST requests
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // Scroll to the bottom of the page (if needed)
  cy.scrollTo('bottom');
  cy.wait(5000)

  // Wait for loading spinner to disappear (if applicable)
  // cy.get('.loading-spinner', { timeout: 60000 }).should('not.exist'); // This line was error-prone, consider conditional check if needed

  cy.url({ timeout: 3000000 }).should('include', '/mkt/mktchecker');

  cy.get('button.btn.btn-xs.btn-primary')
    .contains('Approve')
    .should('be.visible')
    .click();

  //cy.on('window:alert', (txt) => {
  //expect(txt).to.contain('Approve and Send Mail Notify Success');
  //});

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  //cy.url({ timeout: 3000000 }).should('include', '/login');

  // Wait for specific API requests to complete (if needed)
  // Intercept all GET and POST requests
  // cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  // cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  // cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
}


export const beforeapproveCKS = () => {
  standardBeforeApproveCKS();
};

export const beforeapproveCKSontop = () => {
  standardBeforeApproveCKS();
};


/*
============================================================================
=== 
===   Refactor Pattern 6: Dropdown Helpers
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   6.1. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * ฟังก์ชันช่วย: สุ่มเลือก 1 รายการจาก CKS Recurring Dropdown
 */
const selectRandomDropdownRecurring = (): void => {
  // คลิก dropdown เพื่อเปิดตัวเลือก
  cy.get('.mat-select-value')
    .contains('Please Select')
    .click();

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.wrap($options[randomIndex]).click({ force: true });

    // ตรวจสอบว่าค่าที่เลือกถูกแสดง
    cy.get('.mat-select-value').should('contain.text', selectedText);
  });

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click();

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);

  });
}

/*
----------------------------------------------------------------------------
---   6.2. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

export const dropdownRecurringCKS = () => {
  // This function uniquely clicks twice
  selectRandomDropdownRecurring();
};

export const dropdownRecurringCKSMain = () => {
  cy.get('.mat-select-value').eq(1).click();

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);
  })

};

export const dropdownRecurringPreMainCKS = () => {
  selectRandomDropdownRecurring();
};

/*
============================================================================
=== 
===   Refactor Pattern 7: Chained Test Flows (afterMKT...)
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   7.1. การกำหนดประเภท (Type Definitions)
----------------------------------------------------------------------------
*/

/**
 * Type สำหรับฟังก์ชันที่ return ชื่อโปรเจกต์ (string)
 */
type GetProjectNameFn = () => string;

/**
 * Type สำหรับฟังก์ชัน callback ที่รันขั้นตอนเฉพาะ (void)
 */
type EnhanceStepsCallback = () => void;

/**
 * Type สำหรับฟังก์ชันที่รับชื่อโปรเจกต์ (string) และทำการ approve (void)
 */
type ApproveFunction = (projectName: string) => void;

/*
----------------------------------------------------------------------------
---   7.2. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * 1. ฟังก์ชันหลักสำหรับ Flow ของ CKS (CKS Main Flow)
 * --------------------------------------------------
 * หน้าที่: ล็อกอิน CKS -> รอ API -> เคลมโปรเจกต์ -> กด Approve ->
 * รอ API -> กดปุ่ม 'Enhance PO' -> รอหน้าโหลด ->
 * จากนั้น... เรียกฟังก์ชัน "ขั้นตอนเฉพาะ" ที่เราส่งเข้ามา
 */
const standardCksPoEnhancementFlow = (
  getProjectNameFn: GetProjectNameFn,
  enhanceStepsCallback: EnhanceStepsCallback
): void => {
  login(cks, ckspass);

  // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
  // cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
  cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

  // รอให้ API ต่าง ๆ เสร็จสิ้น
  cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
  cy.get('body').should('be.visible');

  // ดึงชื่อโปรเจกต์ตาม Logic ที่ส่งเข้ามา
  const finalProjectName: string = getProjectNameFn();
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  // ClaimProject from Unassigned Task
  ClaimProject(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);

  // intercept API 
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

  // รอ
  cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

  // Click the button Enhance PO
  cy.get('button.btn-sample')
    .contains('Enhance PO')
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  //Navigate to mass product
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  // รอ url
  cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
  cy.wait(3500); // Wait คงที่ตามโค้ดเดิม

  // *** เรียกใช้ฟังก์ชัน "ขั้นตอนเฉพาะ" ที่ส่งเข้ามา ***
  enhanceStepsCallback();
};

/**
 * 2. ฟังก์ชันสำหรับไปหน้า Tracking และ Assign งาน
 * --------------------------------------------------
 * หน้าที่: กดเมนู -> ไปหน้า Process Tracking -> รอ Table -> Assign งาน
 */
const assignTaskViaTracking = (projectName: string, assignee: string): void => {
  cy.contains('span', 'Menu', { timeout: 100000 }).click();

  // ก่อนกดเมนู set intercept
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

  // คลิก Process tracking
  cy.get('a[href="#/new-report/home/tracking"]').click();

  // ตรวจสอบ URL เปลี่ยน
  cy.url({ timeout: 3000000 }).should('include', '/new-report/home/tracking', { timeout: 100000 });

  // รอ table แสดงผล
  cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');
  cy.get('table.table.table-condensed tbody tr', { timeout: 20000 })
    .first()             // เอาแค่แถวแรก
    .find('td')          // หา column ในแถวนั้น
    .first()             // เอา column แรก
    .should('not.be.empty'); // รอจนกว่าข้างในจะมีตัวหนังสือ
  // รอจนกว่าจะเจอ td ที่มีคำว่า PLM 
  cy.contains('table.table.table-condensed tbody td', 'PLM', { timeout: 20000 })
    .should('be.visible');
  // Assign งาน
  assignTeamTask(projectName, assignee);
};

/**
 * 3. ฟังก์ชันสำหรับกลับไปหน้า Workspace
 * --------------------------------------------------
 * หน้าที่: กดเมนู -> กลับไปหน้า Workspace
 */
const navigateToWorkspace = (): void => {
  cy.contains('span', 'Menu', { timeout: 100000 }).click();
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
  cy.get('a[href="#/workspace-home/workspace"]').click();
  cy.url().should('include', '/workspace-home/workspace', { timeout: 1000000 });
};

/**
 * 4. ฟังก์ชันสำหรับ Role ที่ต้อง Assign งาน (เช่น CGMD)
 * --------------------------------------------------
 * หน้าที่: ล็อกอิน -> รอ API -> Assign งานผ่าน Tracking -> กลับมา Workspace -> Approve
 */
const performRoleTaskWithAssignment = (
  user: string,
  pass: string,
  assignee: string,
  approveFunction: ApproveFunction
): void => {
  login(user, pass);

  // intercept APIs ที่ต้องรอ
  cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  // cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.visit('/#/workspace-home/workspace');

  // รอและตรวจสอบ response
  cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  // cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  // ดึงชื่อโปรเจกต์
  const projectNamePONAME: string = (Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) || formattedDateMain || formattedDateOntop || Cypress.env('projectName') as string;
  cy.log('Project Name: ' + projectNamePONAME);

  // ไปหน้า Tracking และ Assign งาน
  assignTaskViaTracking(projectNamePONAME, assignee);

  // กลับมาหน้า Workspace
  navigateToWorkspace();

  // Approve งาน
  cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
  approveFunction(projectNamePONAME);
};

/**
 * 5. ฟังก์ชันสำหรับ Role ที่แค่ "Approve" (เช่น ACTM, OPER)
 * --------------------------------------------------
 * หน้าที่: ล็อกอิน -> รอ API -> Approve
 */
const performSimpleApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction
): void => {
  login(user, pass);

  cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

  const projectNamePONAME: string = (Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) || formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('poName') as string;
  // const projectNamePONAME = 'MUSIC POST onetime ontop 3110 1008';
  cy.log('Project Name: ' + projectNamePONAME);

  approveFunction(projectNamePONAME);
};

/**
 * 6. ฟังก์ชันสำหรับ Role ที่ต้อง "Claim" และ "Approve" (เช่น Spad)
 * --------------------------------------------------
 * หน้าที่: ล็อกอิน -> รอ API -> Claim -> Approve
 */
const performSimpleClaimAndApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction
): void => {
  login(user, pass);

  cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

  const projectNamePONAME: string = (Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) || formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('poName') as string;
  cy.log('Project Name: ' + projectNamePONAME);

  ClaimProject(projectNamePONAME); // ใช้ ClaimProject ตามโค้ดเดิม
  cy.wait(2000); // มี wait ในบาง Spad role
  approveFunction(projectNamePONAME);
};

// ==========================================
// 1. HELPER FUNCTIONS & SHARED LOGIC
// ==========================================

// Helper: ดึงชื่อ Project ตาม Logic เดิม
const getStandardProjectName = (): string => {
  return (
    formattedDateMain ||
    formattedDateOntop ||
    Cypress.env('projectName') ||
    Cypress.env('formattedDateMainPONAME') ||
    Cypress.env('formattedDateOntopPONAME') ||
    Cypress.env('poName')
  ) as string;
};

// Helper: ดึงชื่อ Project เฉพาะ Ontop (สำหรับเคสที่บังคับใช้ ontop)
const getOntopProjectName = (): string => formattedDateOntop as string;

// Helper: สุ่มเลือก Group Package
const selectRandomGroupPackage = () => {
  cy.get('[formcontrolname="groupPackage"]')
    .find('option')
    .then(($options) => {
      const options = [...$options].filter(option => option.value !== '0: null' && option.text !== 'Please Select');
      const randomIndex = Math.floor(Math.random() * options.length);
      const randomValue = options[randomIndex].value;
      cy.get('[formcontrolname="groupPackage"]').select(randomValue);
      cy.get('[formcontrolname="groupPackage"]').should('have.value', randomValue);
    });
};

// Helper: Core CKS Execution Runner
// ใช้รวม it('CKS role') ของทุกฟังก์ชันให้เหลือตัวเดียว โดยรับ callback สำหรับ step ที่ต่างกัน
const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
) => {
  it('CKS role', () => {
    const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard' ? getStandardProjectName : getOntopProjectName;

    standardCksPoEnhancementFlow(getProjectName, () => {
      customSteps();

      if (approvalType === 'main') {
        beforeapproveCKS();
      } else {
        beforeapproveCKSontop();
      }
    });
  });
};

const performMusicRoles = () => {
  it('TSCENTER role', () => {
    login(tscenter, tscenterpass);
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
    cy.wait(5000);
    cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');

    cy.scrollTo('bottom');
    cy.wait(5000);
    cy.contains('button', 'Approve').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  const performSupportRole = (roleUser: any, rolePass: any, urlPart: string, btnText: string) => {
    it(`${urlPart} role`, () => {
      login(roleUser, rolePass);
      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
      const finalProjectName = getStandardProjectName();
      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProject(finalProjectName);
      approveProject(finalProjectName);
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      let checkUrl = '';
      if (urlPart === 'csisp') checkUrl = '/zenon/csi-support';
      else if (urlPart === 'aafsp') checkUrl = '/zenon/aaf-support';
      else if (urlPart === 'csidp') checkUrl = '/zenon/csi-support';
      else if (urlPart === 'aafdp') checkUrl = '/zenon/aaf-support';
      else checkUrl = urlPart; // Fallback

      cy.url({ timeout: 60000 }).should('include', checkUrl);
      cy.wait(5000);
      cy.scrollTo('bottom');
      cy.wait(5000);
      cy.contains('button', btnText).should('be.visible').click({ force: true });
      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').should('be.visible').click();
    });
  }

  performSupportRole(csisp, csisppass, 'csisp', 'Promote To E2E Tester');
  performSupportRole(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester');

  it('e2etest role', () => {
    login(e2etest, e2etestpass);
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    const finalProjectName = getStandardProjectName();
    cy.log('🎯 Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
    cy.wait(5000);
    cy.scrollTo('bottom');
    cy.wait(5000);

    // File Upload Logic
    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
      cy.get('input[type="file"][id="files"]').selectFile(
        { contents: Cypress.Buffer.from(fileContent, 'binary'), fileName: 'file.pdf', mimeType: 'application/pdf' },
        { force: true }
      );
    });
    cy.intercept('POST', '**/upload**').as('fileUpload');
    cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  it('MKT role', () => {
    login(music, musicpass);
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
    cy.wait(5000);
    cy.scrollTo('bottom');
    cy.wait(5000);
    cy.contains('button', 'Approve').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  performSupportRole(csidp, csidppass, 'csidp', 'Promote To E2E Deploy');
  performSupportRole(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy');

  it('e2edp role', () => {
    login(e2edp, e2edppass);
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
    cy.wait(5000);
    cy.scrollTo('bottom');
    cy.wait(5000);
    cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });
};

export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
  if (Module === 'POST') {
    executeCKSRole('standard', 'main', () => { }); // Empty custom steps for this case

    it('CGMD Config IRB role', () => {
      performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD);
    });
    it('CGMD Tester IRB role', () => {
      performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester);
    });

    if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
      it('SASFF role', () => {
        login(sasff, sasffpass);
        cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
        cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(5000);
        cy.scrollTo('bottom');
        cy.wait(5000);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
      });
    }

    it('ACTM role', () => {
      performSimpleApprovalRole(actm, actmpass, approveProjectACTM);
    });
    it('OPER role', () => {
      performSimpleApprovalRole(oper, operpass, approveProjectOPER);
    });

  } else if (Module === 'PRE') {
    executeCKSRole('standard', 'main', () => { });

    it('CGMD Config cbs role', () => {
      performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
    });
    it('CGMD Tester CBS role', () => {
      performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
    });

    if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
      // Logic for SASFF in PRE seems identical to POST in provided snippet
      it('SASFF role', () => {
        login(sasff, sasffpass);
        cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
        cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(5000);
        cy.scrollTo('bottom');
        cy.wait(5000);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
      });
    }

    it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
    it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER));
    it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester));
    it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy));
    it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
    it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
  }
};

export const afterMKTMainUsagePOST = (): void => {
  executeCKSRole('standard', 'main', () => {
    Tariff();
    priorityInternet();
  });
  afterCKSPOST();
};

export const afterMKTontopPOST = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    priorityInternet();
  });
  afterCKSCommon('POST');
};

export const afterMKTontopENTER = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    priorityInternet();
  });
  afterCKSCommon('ENTER');
};

export const afterMKTontopMUSIC = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    priorityInternet();
  });
  afterCKSCommon('MUSIC');
};

export const afterMKTMAINPOST = (): void => {
  executeCKSRole('standard', 'main', () => {
    Tariff();
    priorityInternet();
  });
  afterCKSPOST();
};

export const afterCKSPREontop = (): void => {
  afterCKSCommonPRE_Internal();
};

const stepsOntopPRE = () => {
  cy.wait(7500);
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  cy.wait(3500);
  priorityInternet();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

export const afterMKTontopPRE = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPRE);
  afterCKSCommonPRE('PRE');
};

export const afterMKTontopPREENTER = (): void => {
  executeCKSRole('ontop', 'ontop', () => {
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    cy.wait(3500);
    priorityInternet();
    cy.scrollTo('bottom');
    smsCKSPRE();
  });
  afterCKSCommonPRE('ENTER');
};

export const afterMKTontopPREMUSIC = (): void => {
  executeCKSRole('ontop', 'ontop', () => {
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    cy.wait(3500);
    priorityInternet();
    cy.scrollTo('bottom');
    smsCKSPRE();
  });
  afterCKSCommonPRE('MUSIC');
};

const stepsOntopPREUsage = () => {
  addauto5gCKS();
  unregister();
  dropdownRecurringCKS();
  diyflagCKS();
  priorityInternet();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

export const afterMKTontopPREUsage = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('PRE');
};

export const afterMKTontopPREUsageEnter = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('Enter');
};

export const afterMKTontopPREUsageMusic = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('MUSIC');
};

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  // Manual CKS login flow (Complex custom steps, keeping mostly original structure but using helpers where possible)
  it('CKS role', () => {
    login(cks, ckspass);
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);

    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    priorityInternet();
    beforeapproveCKS();
  });

  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOERMain));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTesterMain));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, (projectName) => approveProjectSPADdeploy(projectName)));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};

export const afterCKSPOST = (Module?: string): void => {
  it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD));
  it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
};

// ==========================================
// 3. INTERNAL COMMON FLOWS
// ==========================================

const afterCKSCommon = (Module: string): void => {
  afterCKSPOST(); // Re-use POST logic (CGMD IRB, ACTM, OPER)
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

// Internal function to avoid duplicate code inside afterCKSPREontop export
const afterCKSCommonPRE_Internal = () => {
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};

const afterCKSCommonPRE = (Module: string): void => {
  afterCKSCommonPRE_Internal();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

export const targetgroup = () => {
  const optionsToSelect = [
    'Change Charge Type (Convert)',
    'Existing',
    'New',
    'Port In (Mobile Number Port)',
    'Renew / Recall from Terminate'
  ];

  // ✅ สุ่มเลือก 1 option จากทั้งหมด 5 ตัว
  const randomOption = optionsToSelect[Math.floor(Math.random() * optionsToSelect.length)];

  // Ensure the select element is visible
  cy.get('select[formcontrolname="availableListBox"]')
    .should('exist')
    .and('be.visible');

  // Select the random option
  cy.get('select[formcontrolname="availableListBox"]')
    .contains('option', randomOption)
    .should('exist')
    .and('be.visible')
    .then($option => {
      cy.wrap($option).dblclick();
    });
}

export const selectTargetGroup = (type:
  'mass' | 'massDisabled' | 'massStudents' | 'save' | 'fmc' |
  'specialCondition' | 'cvm' | 'staff' | 'test' | 'netGift' |
  'nbtc' | 'dummy' | 'traveller' | 'fbb' | 'random'
) => {
  const targetGroupMap = {
    mass: '1: Mass',
    massDisabled: '2: Mass Disabled',
    massStudents: '3: Mass Students',
    save: '4: Save (Save Team, Save Port out)',
    fmc: '5: FMC',
    specialCondition: '6: Special Condition',
    cvm: '7: CVM',
    staff: '8: Staff',
    test: '9: Test',
    netGift: '10: Net Gift',
    nbtc: '11: NBTC',
    dummy: '12: Dummy',
    traveller: '13: Traveller',
    fbb: '14: FBB'
  };

  let value: string;

  if (type === 'random') {
    // Exclude netGift and traveller
    const availableTypes = Object.keys(targetGroupMap).filter(
      key => key !== 'netGift' && key !== 'traveller' && key !== 'fbb'
    ) as Array<keyof typeof targetGroupMap>;

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    value = targetGroupMap[randomType];
  } else {
    value = targetGroupMap[type as keyof typeof targetGroupMap];
  }

  cy.get('select[formcontrolname="targetGroup"]')
    .select(value)
    .should('have.value', value);
};

export const PriceExcluding = (): void => {
  //Multi Duration
  //add button
  cy.get('.col-md-8 > .btn').click();
  //Charge Excluding VAT 

  function getRandomRealisticCharge(min = 100, max = 2000): string {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  const randomCharge = getRandomRealisticCharge();

  cy.get('input[formcontrolname="chargeExcVat"]')
    .clear()
    .type(randomCharge)
    .should('have.value', randomCharge);

  cy.get('input[formcontrolname="chargeExcVat"]')
    .clear()
    .type(randomCharge + 'abc!@#')
    .should('have.value', randomCharge);

  cy.get('.col-md-6 > .btn').click();
}

export const priorityInternet = (): void => {
  cy.get('.scrollmenu > .nav')
    .contains('Internet')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.wait(5000);
  // cy.get('table.table-hover thead tr').then(($headerRow) => {
  //   const hasPriorityColumn = $headerRow.find('th:contains("Priority")').length > 0;

  //   switch (hasPriorityColumn) {
  //     case true:
  //       cy.get('table.table-hover tbody tr').each(($row) => {
  //         const $priorityCell = $row.find('td').eq(5);
  //         const cellText = $priorityCell.text().trim();

  //         switch (cellText) {
  //           case '':
  //             cy.get('button[title="Edit"]').eq(1).click();
  //             cy.get('button[title="Edit"]').eq(2).click();
  //             const randomNumber = Math.floor(Math.random() * 99999) + 1;
  //             cy.get('input[formcontrolname="priority"]')
  //               .clear()
  //               .type(randomNumber.toString());
  //             cy.contains('button', 'Update').eq(0).click();
  //             break;
  //         }
  //       });
  //     case false:
  //       cy.log('Column NOT found in table header. Skipping.');
  //       break;
  //   }
  // });

  cy.get('table.table-hover thead tr').last().then(($headerRow) => {
    cy.get('button[title="Edit"]').eq(1).click();

    const hasPriorityColumn = $headerRow.find('th:contains("Quota Type")').length > 0;
    switch (hasPriorityColumn) {
      case true:
        cy.get('table.table-hover tbody tr').last().each(($row) => {
          const $priorityCell = $row.find('td').eq(1);
          const cellText = $priorityCell.text().trim();
          const randomNumber = Math.floor(Math.random() * 99999) + 1;

          switch (cellText) {
            case 'Limited Data (Pay per use)':
            case 'Unlimited Data (Throttling Speed)':
            case 'Limited Data (Stop Net)':
            case 'Limited Data Only' :
              cy.wrap($row).find('button[title="Edit"]').eq(1).click();
              cy.get('button[title="Edit"]').eq(2).click();

              cy.get('table.table-hover thead tr').last().then(($innerHeaderRow) => {
                const hasInnerPriorityColumn = $innerHeaderRow.find('th:contains("Priority")').length > 0;

                switch (hasInnerPriorityColumn) {
                  case true:
                    cy.get('table.table-hover tbody tr').each(($innerRow) => {
                      const $innerPriorityCell = $innerRow.find('td').eq(5);
                      const innerCellText = $innerPriorityCell.text().trim();

                      switch (innerCellText) {
                        case '':
                          cy.get('button[title="Edit"]').eq(1).click();
                          cy.get('button[title="Edit"]').eq(2).click();
                          const innerRandomNumber = Math.floor(Math.random() * 99999) + 1;
                          cy.get('input[formcontrolname="priority"]')
                            .clear()
                            .type(innerRandomNumber.toString());
                          cy.contains('button', 'Update').eq(0).click();
                          break;
                        default:
                          cy.contains('button', 'Update').eq(0).click();
                          break;
                      }
                    });
                    break;
                }
              });
              cy.contains('button', 'Update').click();
              break;

            case 'Unlimited Data (Fixed Speed)':
              cy.wrap($row).find('button[title="Edit"]').eq(1).click();
              cy.get('input[formcontrolname="priority"]').invoke('val').then((val) => {
                if (!val) {
                  cy.get('input[formcontrolname="priority"]').type(randomNumber.toString());
                }

                cy.contains('button', 'Update').click();
              });
              break;

              case 'Pay per use only':
              cy.wrap($row).find('button[title="Edit"]').eq(1).click();
              cy.get('input[formcontrolname="internetExceedRatePriority"]').invoke('val').then((val) => {
                if (!val) {
                  cy.get('input[formcontrolname="internetExceedRatePriority"]').type(randomNumber.toString());
                }

                cy.contains('button', 'Update').click();
              });
              break;

              default:
                cy.wrap($row).find('button[title="Edit"]').eq(1).click();
                cy.contains('button', 'Update').click();
              break;
          }
        });
        break;
    }
  });


  cy.get('button[title="Edit"]').eq(1).click();

  const fieldsToCheck = [
    'internetExceedRatePriority',
    'internetThrottlingSpeedPriority',
    'fixedSpeedPriority'
  ];

  fieldsToCheck.forEach(controlName => {
    cy.get('body').then(($body) => {
      const selector = `input[formcontrolname="${controlName}"]`;
      const $element = $body.find(selector);
      if ($element.length > 0 && $element.is(':visible')) {

        cy.get(selector).then(($input) => {
          const value = $input.val();

          if (!value) {
            const randomNum = Math.floor(Math.random() * 99999).toString();
            cy.log(`[${controlName}] ว่างและแสดงอยู่ -> Random: ${randomNum}`);
            cy.wrap($input).clear().type(randomNum);
            cy.contains('button', 'Update').eq(0).click();
          } else {
            cy.log(`[${controlName}] มีค่าอยู่แล้ว: ${value}`);
          }
        });

      } else {
        cy.log(`Skipped: [${controlName}] ไม่แสดงบนหน้าจอ (Hidden or Not Found)`);
      }
    });
  });
  cy.get('button[title="Edit"]').eq(1).click();
  cy.contains('button', 'Update').eq(0).click();
};

export const backBacicInfo = () => {
  //Back to Project Basic Information 
  cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });

  // Intercept the request
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');

  // Click the button
  cy.get('.modal-body > .col-md-12 > :nth-child(1) > .btn')
    .should('be.visible')
    .click();

  // Wait for the request and log it
  cy.wait('@getRequest4', { timeout: 100000 }).then((interception) => {
    console.log(`Intercepted request: ${interception.request.method} ${interception.request.url}`);
  });
}

export const addauto5gCKS = () => {
  const values = ['1: Y', '2: X', '3: N'];
  const randomValue = values[Math.floor(Math.random() * values.length)];
  const selector = 'select[formcontrolname="autoAddService5g"]';
  cy.scrollTo('top');
  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .select(randomValue)
        .should('have.value', randomValue);
    } else {
      cy.log('Auto Service 5G dropdown not found, skipping...');
    }
  });
};

export const diyflagCKS = () => {
  cy.contains('label', 'CBS')
    .find('input[type="radio"]')
    .check({ force: true });

  // คลิกที่ mat-select เพื่อเปิด dropdown
  cy.get('mat-select[formcontrolname="validityPackage"]').eq(1).click();

  // เลือก option ตาม text
  cy.get('mat-option')
    .contains('3801424 | 862770')  // หรือ text ส่วนที่ชัดเจน
    .click();

  // ตรวจสอบว่าค่าเลือกแล้วแสดงผลถูกต้อง
  cy.get('mat-select[formcontrolname="validityPackage"] .mat-select-value')
    .should('contain.text', '3801424 | 862770');
}

export const smsCKSPRE = () => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  // เลือก textarea ด้วย formControlName แล้วพิมพ์ข้อความ
  cy.get('textarea[formcontrolname="featureDescription"]')
    .clear() // ล้างค่าก่อนถ้าจำเป็น
    .type('feature description');
}

export const grouppackage = () => {
  cy.get('select[formcontrolname="groupPackage"]')
    .find('option:not([disabled])')
    .then($options => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const selectedValue = $options.eq(randomIndex).val() as string;
      const selectedText = $options.eq(randomIndex).text().trim();

      cy.log(`Randomly selected: ${selectedText}`);

      cy.get('select[formcontrolname="groupPackage"]')
        .select(selectedValue)
        .should('have.value', selectedValue);
    });
}

export const unregister = () => {
  cy.contains('label', 'UnRegister (Hold)')
    .parent()
    .siblings('div.col-md-6')
    .contains('label', 'Yes')
    .find('input[type="radio"]')
    .check({ force: true });
}

export const RetryPattern = () => {
  cy.get('.scrollmenu > .nav')
    .contains('Retry Pattern')
    .scrollIntoView()
    .should('be.visible')
    .click();
  cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
    .select('1: Suspend retry next cycle')
}

export const dropdownPromotionGroup = () => {
  cy.get('select[formcontrolname="groupPackage"]').then($select => {
    const options = $select.find('option:not([value="0: null"])');

    if (options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedValue = Cypress.$(options[randomIndex]).prop('value');
      const selectedText = Cypress.$(options[randomIndex]).text().trim();

      cy.log(`Selected Group Package: ${selectedText}`);
      cy.wrap($select).select(selectedValue);
      cy.wrap($select).should('have.value', selectedValue);
    }
  });

  cy.get('select[formcontrolname="promotionGroup"]')
    .find('option')
    .then(($options) => {
      const options = [...$options];
      const validOptions = options.filter(option => option.value !== '0: null');
      const randomIndex = Math.floor(Math.random() * validOptions.length);
      const valueToSelect = validOptions[randomIndex].value;
      cy.get('select[formcontrolname="promotionGroup"]').select(valueToSelect);
    });
  cy.wait(5000)
  cy.get('select[formcontrolname="promotionSubGroup"]').each(($select: JQuery<HTMLElement>) => {
    const options = $select.find('option').toArray() as HTMLOptionElement[];
    const validOptions = options.filter((opt) => opt.value !== '0: null');

    if (validOptions.length > 0) {
      const randomOption = Cypress._.sample(validOptions);
      if (randomOption) {
        cy.wrap($select).select(randomOption.value);
        cy.log(`Selected: ${randomOption.text.trim()}`);
      }
    } else {
      cy.log('Skipped a dropdown because it had no valid options');
    }
  });
}
export const addFile = () => {
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
      },
      { force: true }
    );
  });
  beforeapproveMKT();
};

export const ontopCondition = () => {
  // cy.get('select[formcontrolname="onTopCategory"]')
  //   .find('option')
  //   .then($options => {
  //     const validOptions = [...$options]
  //       .map(o => o.value)
  //       .filter(val => val !== '0: null');
  //     const randomIndex = Math.floor(Math.random() * validOptions.length);
  //     const randomValue = validOptions[randomIndex];
  //     cy.get('select[formcontrolname="onTopCategory"]').select(randomValue);
  //     cy.get('select[formcontrolname="onTopCategory"]').should('have.value', randomValue);
  //   });

  cy.get('select[formcontrolname="ontopConditionGroup"]')
    .find('option:not([disabled])')
    .then($options => {
      const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);

      const randomIndex = Math.floor(Math.random() * validOptions.length);
      const randomValue = validOptions[randomIndex];

      cy.get('select[formcontrolname="ontopConditionGroup"]').select(randomValue);
    });
  cy.get('select[formcontrolname="packageDataType"]')
    .find('option')
    .then($options => {
      const validOptions = [...$options]
        .map(o => o.value)
        .filter(val => val !== '0: null');
      const randomIndex = Math.floor(Math.random() * validOptions.length);
      const randomValue = validOptions[randomIndex];

      cy.get('select[formcontrolname="packageDataType"]').select(randomValue);
    });
}