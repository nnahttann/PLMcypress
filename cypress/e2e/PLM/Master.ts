export const urlsit: string = Cypress.env('urlsit');
export const MKTpre: string = Cypress.env('MKTpre');
export const MKTpre1: string = Cypress.env('MKTpre1');
export const MKTpost: string = Cypress.env('MKTpost');
export const MKTpost1: string = Cypress.env('MKTpost1');
export const cks: string = Cypress.env('cks');
export const ckspass: string = Cypress.env('ckspass');
export const cgcirb: string = Cypress.env('cgcirb');
export const cgcirbpass: string = Cypress.env('cgcirbpass');
export const cgccbs: string = Cypress.env('cgccbs');
export const cgccbspass: string = Cypress.env('cgccbspass');
export const cgtcbs: string = Cypress.env('cgtcbs');
export const cgtcbspass: string = Cypress.env('cgtcbspass');
export const cgtirb: string = Cypress.env('cgtirb');
export const cgtirbpass: string = Cypress.env('cgtirbpass');
export const actm: string = Cypress.env('actm');
export const actmpass: string = Cypress.env('actmpass');
export const oper: string = Cypress.env('oper');
export const operpass: string = Cypress.env('operpass');
export const spadsup: string = Cypress.env('spadsup');
export const spadsuppass: string = Cypress.env('spadsuppass');
export const spaddoer: string = Cypress.env('spaddoer');
export const spaddoerpass: string = Cypress.env('spaddoerpass');
export const spadtest: string = Cypress.env('spadtest');
export const spadtestpass: string = Cypress.env('spadtestpass');
export const spaddp: string = Cypress.env('spaddp');
export const spaddppass: string = Cypress.env('spaddppass');
export const apo: string = Cypress.env('apo');
export const apopass: string = Cypress.env('apopass');
export const enter: string = Cypress.env('enter');
export const enterpass: string = Cypress.env('enterpass');
export const music: string = Cypress.env('music');
export const musicpass: string = Cypress.env('musicpass');
export const tscenter: string = Cypress.env('tscenter');
export const tscenterpass: string = Cypress.env('tscenter');
export const aafsp: string = Cypress.env('aafsp');
export const aafsppass: string = Cypress.env('aafsppass');
export const csisp: string = Cypress.env('csisp');
export const csisppass: string = Cypress.env('csisppass');
export const e2etest: string = Cypress.env('e2etest');
export const e2etestpass: string = Cypress.env('e2etestpass');
export const aafdp: string = Cypress.env('aafdp');
export const aafdppass: string = Cypress.env('aafdppass');
export const csidp: string = Cypress.env('csidp');
export const csidppass: string = Cypress.env('csidppass');
export const e2edp: string = Cypress.env('e2edp');
export const e2edppass: string = Cypress.env('e2edppass');
export const sasff: string = Cypress.env('sasff');
export const sasffpass: string = Cypress.env('sasffpass');



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

export const setProjectName = (type: 'Main' | 'Ontop' | 'OntopExtra', name: string): void => {
  const envKey = `formattedDate${type}`;
  Cypress.env(envKey, name);
  cy.log(`✅ Saved to ${envKey}: ${name}`);
};

export const setPOName = (type: 'Main' | 'Ontop' | 'OntopExtra', name: string): void => {
  const envKey = `formattedDate${type}PONAME`;
  Cypress.env(envKey, name);
  cy.log(`✅ Saved to ${envKey}: ${name}`);
};

export const getProjectName = (type: 'Main' | 'Ontop' | 'OntopExtra'): string => {
  const envKey = `formattedDate${type}`;
  const name = Cypress.env(envKey);
  if (!name) {
    throw new Error(`❌ Project name for ${type} not found in Cypress.env(). Please create project first.`);
  }
  return name;
};

export const getPOName = (type: 'Main' | 'Ontop' | 'OntopExtra'): string => {
  const envKey = `formattedDate${type}PONAME`;
  const name = Cypress.env(envKey);
  if (!name) {
    throw new Error(`❌ PO name for ${type} not found in Cypress.env(). Please create PO first.`);
  }
  return name;
};

export const debugProjectNames = (): void => {
  cy.log('=== 📋 Debug Project Names in Cypress.env() ===');
  const keys = [
    'formattedDateMain',
    'formattedDateOntop',
    'formattedDateOntopExtra',
    'formattedDateMainPONAME',
    'formattedDateOntopPONAME',
    'formattedDateOntopExtraPONAME',
    'projectName',
    'poName'
  ];

  keys.forEach(key => {
    const value = Cypress.env(key);
    cy.log(`${key}: ${value || '❌ NOT SET'}`);
  });
  cy.log('=== ✅ End Debug ===');
};

export const login = (username: string, password: string): void => {
  cy.get('input[name="userId"]').type(username);
  cy.get('input[name="pwd"]').type(password);
  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');
  cy.get(':nth-child(4) > .btn').click();
  cy.wait('@getErrorCodes', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
}

// claim-functions.ts
export const clamProject = (formattedDate: string): void => {

  cy.log(`🔍 [clamProject] Searching for: "${formattedDate}"`);

  cy.get('h3', { timeout: 100000 })
    .contains('Unassigned Task')
    .should('be.visible')
    .parent()
    .within(() => {
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
      cy.get('tbody tr', { timeout: 60000 })
        .should('exist')
        .each(($row: JQuery<HTMLElement>) => {
          const rowText = $row.text().trim();
          if (rowText.includes(formattedDate)) {
            cy.log(`🎯 Clicking claim button for: "${formattedDate}"`);
            cy.wrap($row)
              .find('button.btn.btn-circle.btn-xs.btn-success.claim-top')
              .should('be.visible')
              .click();
            cy.log(`✅ Successfully claimed project: ${formattedDate}`);
            return false; // Break loop
          }
        })
        .then(($rows) => {
          // Check if any row was processed
          if ($rows.length === 0) {
            cy.log('❌ No rows found in table');
          }
        });
    });
};

export const ClaimProjectCKS = (formattedDate: string): void => {

  cy.log(`🔍 [ClaimProjectCKS] Searching for: "${formattedDate}"`);

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

  cy.window().then((win) => {
    cy.stub(win, 'alert').as('alertStub');
  });

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for task using partial identifier: "${partialIdentifier}"`);

  // Debug: Show all rows
  cy.get('tbody tr').then(($rows) => {
    cy.log(`📊 Total rows: ${$rows.length}`);
    let matchFound = false;

    $rows.each((index, row) => {
      const text = Cypress.$(row).text().trim();
      const displayText = text.substring(0, 100);
      cy.log(`Row ${index}: ${displayText}${text.length > 100 ? '...' : ''}`);

      if (text.includes(partialIdentifier)) {
        cy.log(`✅✅✅ MATCH at row ${index}`);
        matchFound = true;
      }
    });

    if (!matchFound) {
      cy.log(`❌ No row contains: "${partialIdentifier}"`);
    }
  });

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

    cy.log(`✅ Successfully selected assignee: ${assignee}`);

    cy.get('@taskRow').contains('span', 'Set').click();
  });

  cy.get('@alertStub', { timeout: 100000 }).should('have.been.calledWith', 'Reassign success');
  cy.log(`✅ Successfully assigned task to: ${assignee}`);
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
      cy.log(`📊 Total rows: ${$rows.length}`);
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

  cy.log('Page loaded successfully. Running core task...');

  // --- 5. รันขั้นตอน "เฉพาะ" ที่ส่งเข้ามา ---
  coreTaskCallback();

  // --- 6. จัดการขั้นตอนสุดท้าย (Alert, Redirect, Logout) ---
  switch (finalAction) {
    case 'AlertAndLogout':
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });
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

  // --- 1. ตั้งค่าการดักจับ API (ชุดเล็ก) ---
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  // --- 2. ค้นหาโปรเจกต์และคลิก Approve ---
  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  cy.url({ timeout: 60000 }).should('include', expectedUrl);

  cy.log('Page loaded successfully. Running core task...');

  // --- 4. รันขั้นตอน "เฉพาะ" ที่ส่งเข้ามา ---
  coreTaskCallback();

  // --- 5. จัดการขั้นตอนสุดท้าย (แบบมาตรฐาน) ---
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });
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
    cy.log(`📊 Total rows: ${$rows.length}`);
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
export const approveProjectSPADSup = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      // --- Core Task ---
      const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;
      const random2DigitCode = Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').type(random5DigitCode.toString());
      cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').type(random2DigitCode.toString());
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve as complex', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'ComplexLogout' // Action สุดท้าย: ไม่มี Alert
  );
};
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      // --- Core Task ---
      const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;
      const random2DigitCode = Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').type(random5DigitCode.toString());
      cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').type(random2DigitCode.toString());
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve as non complex', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'ComplexLogout' // Action สุดท้าย: ไม่มี Alert
  );
};

/**
 * 3. Flow SPADDOER (ใช้ Helper หลัก)
 */
export const approveProjectSPADDOER = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      // --- Core Task ---
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
      cy.wait(3000);
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 4. Flow SPADDOERMain (ใช้ Helper หลัก)
 */
export const approveProjectSPADDOERMain = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      // --- Core Task ---
      cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input').type('PT' + Math.floor(Math.random() * 90000) + 10000);
      cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + Math.floor(Math.random() * 90000) + 10000);
      cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input').type('PST' + Math.floor(Math.random() * 90000) + 10000);

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
      cy.wait(3000);
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 5. Flow SPADTester (ใช้ Helper หลัก)
 */
export const approveProjectSPADTester = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 6. Flow SPADTesterMain (ใช้ Helper หลัก)
 * (*** นี่คือเวอร์ชันที่อัปเดตตามไฟล์ test.cy.ts ของคุณ ***)
 */
export const approveProjectSPADTesterMain = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      // --- Core Task ---

      cy.wait(10000);
      cy.scrollTo('bottom');

      // 2. Intercept API
      cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

      // 3. ดักจับ alert แรก (ตอนกด Send PlugIN)
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
      cy.wait(70000);
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
      cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 })
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
 * 7. Flow SPADdeploy (ใช้ Helper หลัก)
 */
export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To ACTM', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
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
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.get('button[name="CBS"]').should('be.visible', { timeout: 3000000 }).click();
      cy.contains('button', 'Yes').should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
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
      // --- Core Task ---
      const maxDigits = 12;
      const numDigits = Math.floor(Math.random() * maxDigits) + 1;
      const min = Math.pow(10, numDigits - 1);
      const max = Math.pow(10, numDigits) - 1;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input').type(randomNumber.toString());
      cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('a.btn').first().click();
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

export const approveProjectCGMDPREPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      // --- Core Task ---
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
      cy.wait(3000);
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 10. Flow CGMDtesterProACTM (ใช้ Helper หลัก)
 */
export const approveProjectCGMDtesterACTM = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
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
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To Pre Go Live', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

export const approveProjectCGMDtesterPREPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      // --- Core Task ---

      cy.wait(10000);
      cy.scrollTo('bottom');

      // 2. Intercept API
      cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

      // 3. ดักจับ alert แรก (ตอนกด Send PlugIN)
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
      cy.wait(70000);
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
      cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 })
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
export const approveProjectCGMDACTM = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/actm/actm-doer',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.get(':nth-child(3) > :nth-child(4)').click(); // Selector จากโค้ดเดิม
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 13. Flow CGMDACTMPRE (ใช้ Helper หลัก)
 */
export const approveProjectCGMDACTMPRE = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/actm/actm-doer',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.get(':nth-child(3) > :nth-child(4)').click(); // Selector จากโค้ดเดิม
      // --- End Core Task ---
    },
    'AlertAndLogout' // Action สุดท้าย: มาตรฐาน
  );
};

/**
 * 14. Flow CGMDOPER (ใช้ Helper รอง)
 */
export const approveProjectCGMDOPER = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/oper/oper-doer',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.get('.col-md-6 > :nth-child(3)').click(); // Selector จากโค้ดเดิม
      // --- End Core Task ---
    }
  );
};
export const approveProjectTSCenter = (projectName: string): void => {
  performSimpleClaimAndApprovalRole(
    'tscenter',           // username
    'tscenter',           // password
    (projectName: string) => {  // approveFunction callback
      // --- Core Task ---
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
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();
      // --- End Core Task ---
    }
  );
};
/**
 * 15. Flow CGMDAPO (ใช้ Helper รอง)
 */
export const approveProjectCGMDAPO = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task', // <-- แตกต่าง
    '/apo/apo-doer',
    () => {
      // --- Core Task ---
      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To Pre Go Live').click();
      // --- End Core Task ---
    }
  );
};


/*
============================================================================
=== 
===   Refactor Pattern 2: Project Basic Information
=== 
============================================================================
*/

/**
 * (Refactored)
 * ฟังก์ชันเดียวสำหรับสร้างโปรเจกต์ทุกรูปแบบ (POST, PRE, ENTER, MUSIC)
 * และทุกประเภท (Main, Ontop, OntopExtra)
 */
// project-creation.ts
export const ProjectBasicInformationComplete = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  ProductClass: 'main' | 'ontop' | 'ontopextra',
  options: {
    type: 'Main' | 'Ontop' | 'OntopExtra',
    Module: 'POST' | 'PRE' | 'ENTER' | 'MUSIC',
    CustomerType?: 'POST' | 'PRE',
    autoSetDuration?: boolean
  }
): void => {
  const { type, Module, CustomerType, autoSetDuration = false } = options;

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
  const ModulePart = (Module === 'ENTER' || Module === 'MUSIC')
    ? `${prefix} ${CustomerType}`
    : `${prefix} ${Module}`;

  // --- Generate Project Name ---
  const projectName = `${ModulePart} ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;
  cy.get('input[formcontrolname="projectName"]').type(projectName);

  // ✅ เก็บค่า Project Name ใช้ helper function
  setProjectName(type, projectName);

  // --- Date ---
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('input[aria-label="Date input field"]').type(formattedDate);
  cy.wait(2000);

  // --- Customer Type (ENTER/MUSIC) ---
  if (Module === 'ENTER' || Module === 'MUSIC') {
    const customerType = CustomerType === 'POST' ? 'Post-paid' : 'Pre-paid';
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

  // ✅ เก็บค่า PO Name ใช้ helper function
  setPOName(type, poName);

  cy.get('select[formcontrolname="promotionSubGroupFrom"]')
    .select('Product Offering')
    .should('have.value', 'Product Offering');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for button to appear
  cy.contains('button', 'Create', { timeout: 10000 })
    .should('be.visible')
    .click();

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // --- Navigate to Product Offering ---
  cy.url({ timeout: 3000000 }).should('include', '/#/project-home/project-basic-information');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.url({ timeout: 3000000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
  cy.wait(8000);

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
    const productClassMapMobile = {
      main: '1: Main',
      ontop: '2: On-Top',
      ontopextra: '3: On-Top Extra'
    };
    const productClassMapEnterMusic = {
      ontop: '1: On-Top',
      ontopextra: '2: On-Top Extra'
    };

    let productValue: string;
    if (Module === 'ENTER' || Module === 'MUSIC') {
      if (ProductClass === 'main') {
        throw new Error(`Product Class "Main" is not available for Module ${Module}`);
      }
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
  PoSubgroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
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
  if (Module === 'PRE' && (PoSubgroup === 'Service' || PoSubgroup === 'OrderFee')) {
    projectName = `MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes}`;
  } else {
    projectName = `MOB ${Module} ${PoSubgroup} ${day}${month} ${hours}${minutes}`;
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
  if (Module === 'PRE' && (PoSubgroup === 'Service' || PoSubgroup === 'OrderFee')) {
    poName = `MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes}`;
  }
  else {
    poName = `MOB ${Module} ${PoSubgroup} ${day}${month} ${hours}${minutes}`;
  }

  cy.get('input[formcontrolname="productName"]').type(poName);
  Cypress.env('poName', poName);
  cy.log(`✅ Stored poName: ${Cypress.env('poName')}`);

  // Handle different PoSubgroup selections
  const subGroupMap = {
    AccountFee: 'Account Fee',
    OrderFee: 'Order Fee',
    CashBack: 'Cash Back',
    Service: 'Service',
    GroupPoFee: 'Group PO Fee'
  };

  if (subGroupMap[PoSubgroup]) {
    cy.get('select[formcontrolname="promotionSubGroupFrom"]')
      .select(subGroupMap[PoSubgroup])
      .should('contain', subGroupMap[PoSubgroup]);
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
    if (Module === 'PRE' && (PoSubgroup === 'OrderFee' || PoSubgroup === 'Service')) {
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
    if (Module === 'POST' && PoSubgroup === 'CashBack') {
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
    }
    if (!(Module === 'POST' && PoSubgroup === 'CashBack')) {

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
    // Additional fields based on PoSubgroup
    if (PoSubgroup === 'Service') {
      //promotion levels
      const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;

      // Select random from known values
      const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

      cy.get('select[formcontrolname="promotionLevel"]')
        .select(randomPromotion)
        .should('have.value', randomPromotion);

      // SMS Wording Greeting Letter EN
      cy.get('textarea[formcontrolname="wordingInStatementEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // SMS Greeting Flag
      cy.get('select[formcontrolname="smsGreetingSendFlag"]')
        .select('Send')

      // SMS Greeting EN
      cy.get('textarea[formcontrolname="smsGreetingEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} SMS Greeting Eng`);

      // SMS Greeting TH
      cy.get('textarea[formcontrolname="smsGreetingTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} SMS Greeting Thai`);

      // SMS Delete Flag
      cy.get('select[formcontrolname="smsDeleteSendFlag"]')
        .select('Send')

      // SMS Delete EN
      cy.get('textarea[formcontrolname="smsDeleteEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} SMS Delete Eng`);

      // SMS Delete TH
      cy.get('textarea[formcontrolname="smsDeleteTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} SMS Delete Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} description Thai`);
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
    } else if (PoSubgroup === 'CashBack') {
      // shortPromotionName  EN
      cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Short Promotion Name Eng`);

      // shortPromotionName TH
      cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Short Promotion Name Thai`);

      // promotionDescriptionEn 
      cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Promotion Description Eng`);

      // promotionDescription TH
      cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Promotion Description Thai`);

      // greetingLetterEn 
      cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // greetingLetter TH
      cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // yourPackageNameEn 
      cy.get('textarea[formcontrolname="yourPackageNameEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Your PackageName Eng`);

      // yourPackageNameEn 
      cy.get('textarea[formcontrolname="yourPackageNameTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Your PackageName  Thai`);
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
        cy.get('textarea[formcontrolname="memoDescription"]')
          .type('Memo Description '.repeat(6))
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
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${PoSubgroup} ${day}${month} ${hours}${minutes} description Thai`);

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

/*
============================================================================
=== 
===   Refactor Pattern 3: Internet Tab Forms
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   3.1. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * ฟังก์ชันช่วย: กรอกฟอร์ม Internet (Limited Data Only)
 * * หน้าที่: รับ selector ของปุ่ม "Add" และ "Save"
 * แล้วทำกระบวนการทั้งหมด: คลิกแท็บ -> คลิก Add -> กรอกฟอร์ม -> คลิก Save
 */
const fillInternetLimitedDataOnly = (addButtonSelector: string, saveButtonSelector: string): void => {
  // Nav Internet
  cy.get('.scrollmenu > .nav')
    .contains('Internet')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)

  // button add (Dynamic)
  cy.get(addButtonSelector).click();

  //Intternet Quota type 
  cy.get('select[formcontrolname="InternetQuotaType"]')
    .select('Limited Data Only')
    .should('have.value', 'Limited Data Only');
  // Internet Quota - สุ่มจาก mat-option
  cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });

  cy.get('.mat-select-panel mat-option')
    .should('be.visible')
    .then(($options) => {
      const fiveGOptions = $options.filter((index, option) => {
        const text = Cypress.$(option).text().trim();
        return text.startsWith('5G');
      });
      // สุ่มเลือก option 5G ใดก็ได้
      const randomIndex = Math.floor(Math.random() * fiveGOptions.length);
      cy.wrap(fiveGOptions[randomIndex]).click({ force: true });
    });

  // Internet Speed - สุ่มจาก select options
  cy.get('select[formcontrolname="internetSpeed"]')
    .find('option')
    .then(($options) => {
      // ข้าม option แรกถ้าเป็น placeholder (เช่น "-- Select --")
      const startIndex = 1;
      const randomIndex = Math.floor(Math.random() * ($options.length - startIndex)) + startIndex;
      const randomValue = $options[randomIndex].value;

      cy.get('select[formcontrolname="internetSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
    });

  // Internet Exceed Rate - สุ่มจาก mat-option
  cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });
  cy.get('.mat-select-panel mat-option')
    .should('be.visible')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.wrap($options[randomIndex]).click({ force: true });
    });

  //button Save (Dynamic)
  cy.get(saveButtonSelector).click();
}

/*
----------------------------------------------------------------------------
---   3.2. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

export const InternetLimitedDataOnly = () => {
  fillInternetLimitedDataOnly(
    'button.btn.btn-primary.btn-xs:eq(3)', // Selector ปุ่ม Add ของฟอร์มนี้
    ':nth-child(1) > .btn'                 // Selector ปุ่ม Save ของฟอร์มนี้
  );
};

export const InternetLimitedDataOnlyPRERecurring = () => {
  fillInternetLimitedDataOnly(
    'button.btn.btn-primary.btn-xs:eq(4)',   // Selector ปุ่ม Add ของฟอร์ม PRE
    'button.btn-primary:contains("Add"):last' // Selector ปุ่ม Save/Add ของฟอร์ม PRE
  );
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
export const smsWording = () => {
  // กำหนดข้อมูลที่ต้องการกรอกในแต่ละฟิลด์
  const fields: SmsField[] = [
    { selector: 'textarea[formcontrolname="shortPromotionName"]', values: ['Sample Promotion Name ENG', 'ตัวอย่างชื่อโปรโมชั่นTHA'] },
    { selector: 'textarea[formcontrolname="marketingName"]', values: ['Marketing Name EN Only'] },
    { selector: 'textarea[formcontrolname="cmsDisplay"]', values: ['Sample CMS Display ENG', 'ตัวอย่าง CMS Display THA'] },
    { selector: 'textarea[formcontrolname="promotionDescription"]', values: ['Sample Promotion Description in English', 'ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย'] },
    { selector: 'textarea[formcontrolname="greetingLetter"]', values: ['Sample Greeting Letter in English', 'ตัวอย่างจดหมายทักทายภาษาไทย'] },
    { selector: 'textarea[formcontrolname="yourPackage"]', values: ['Sample Billing Description in English', 'ตัวอย่างคำอธิบายบิลภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsGreeting"]', values: ['Sample SMS Greeting in English', 'ตัวอย่าง SMS ทักทายภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsDelete"]', values: ['Sample SMS Delete in English', 'ตัวอย่าง SMS ลบแพ็กภาษาไทย'] },
  ];

  // กำหนดข้อมูลสำหรับ dropdown
  const dropdowns: SmsDropdown[] = [
    { selector: 'select[formcontrolname="smsGreetingSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsDeleteSendFlag"]', value: 'Send' },
  ];

  // เรียกใช้ฟังก์ชันช่วย โดยส่งข้อมูลที่กำหนดไว้เข้าไป
  fillSmsWordingTab(fields, dropdowns);
};

/**
 * (Refactored)
 * กรอก SMS Wording (แบบ Pre-paid)
 * หน้าที่: กำหนด "ข้อมูล" (อีกชุด) แล้วส่งให้ฟังก์ชันช่วย 'fillSmsWordingTab' จัดการ
 */
export const smsWordingpre = () => {
  // กำหนดข้อมูลที่ต้องการกรอกในแต่ละฟิลด์
  const fields: SmsField[] = [
    { selector: 'textarea[formcontrolname="shortPromotionName"]', values: ['Sample Promotion Name ENG', 'ตัวอย่างชื่อโปรโมชั่น THA'] },
    { selector: 'textarea[formcontrolname="cmsDisplay"]', values: ['Sample CMS Display ENG', 'ตัวอย่าง CMS Display THA'] },
    { selector: 'textarea[formcontrolname="promotionDescription"]', values: ['Sample Promotion Description in English', 'ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsGreeting"]', values: ['Sample SMS Greeting in English', 'ตัวอย่าง SMS ทักทายภาษาไทย'] },
  ];

  // กำหนดข้อมูลสำหรับ dropdown
  const dropdowns: SmsDropdown[] = [
    { selector: 'select[formcontrolname="smsGreetingSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsDeleteSendFlag"]', value: 'Send' },
  ];

  // เรียกใช้ฟังก์ชันช่วย โดยส่งข้อมูลที่กำหนดไว้เข้าไป
  fillSmsWordingTab(fields, dropdowns);
};

/**
 * (Refactored)
 * กรอก Tariff & Discount
 * หน้าที่: ทำตรรกะเฉพาะของตัวเอง (สุ่มเลือก Tariff)
 * และเรียกใช้ 'closeSuccessModal' ในตอนท้าย
 */
export const Tariff = (): void => {
  // Navigate to Tariff & Discount section
  cy.get('.scrollmenu > .nav')
    .contains('Tariff Plan & Discount')
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000);

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

/*
============================================================================
=== 
===   Refactor Pattern 5: CKS Approval Flow
=== 
============================================================================
*/

/*
----------------------------------------------------------------------------
---   5.1. ฟังก์ชันช่วย (Reusable Helper Functions)
----------------------------------------------------------------------------
*/

/**
 * ฟังก์ชันช่วย: รวมขั้นตอน 'beforeapproveCKS' และ 'beforeapproveCKSontop'
 * ที่เหมือนกัน 100% ไว้ที่เดียว
 */
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
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProjectCKS from Unassigned Task
  ClaimProjectCKS(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);

  // รอให้ URL เปลี่ยนก่อน
  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');

  // รอให้ table/element หลักโหลดเสร็จก่อน
  cy.get('body', { timeout: 3000000 }).should('be.visible');

  // แล้วค่อยเลื่อนลงล่างสุด
  cy.scrollTo('bottom');
  cy.wait(3000)

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
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  //cy.url({ timeout: 3000000 }).should('include', '/login');
}

/*
----------------------------------------------------------------------------
---   5.2. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

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

  cy.on('window:alert', (text) => {
    expect(text).to.include('Approve and Send Mail Notify Success');
  });

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  cy.wait(3500)
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProjectCKS from Unassigned Task
  ClaimProjectCKS(finalProjectName);

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
  cy.wait(3000)

  // Wait for loading spinner to disappear (if applicable)
  // cy.get('.loading-spinner', { timeout: 60000 }).should('not.exist'); // This line was error-prone, consider conditional check if needed

  cy.url({ timeout: 3000000 }).should('include', '/mkt/mktchecker');

  cy.get('button.btn.btn-xs.btn-primary')
    .contains('Approve')
    .should('be.visible')
    .click();

  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  //cy.url({ timeout: 3000000 }).should('include', '/login');

  // Wait for specific API requests to complete (if needed)
  // Intercept all GET and POST requests
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
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

    cy.log(`Selected: ${selectedText}`);
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

    cy.log(`Randomly selected: ${selectedText}`);
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

    cy.log(`Randomly selected: ${selectedText}`);
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

  // ClaimProjectCKS from Unassigned Task
  ClaimProjectCKS(finalProjectName);

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
  cy.get('table.table.table-condensed tbody tr', { timeout: 20000 }).should('have.length.greaterThan', 0);

  // Assign งาน
  assignTeamTask(projectName, assignee);
};

/**
 * 3. ฟังก์ชันสำหรับกลับไปหน้า Workspace
 * --------------------------------------------------
 * หน้าที่: กดเมนู -> กลับไปหน้า Workspace
 */
const navigateToWorkspace = (): void => {
  cy.log('กำลังกลับไปหน้า Workspace');
  cy.contains('span', 'Menu', { timeout: 100000 }).click();
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
  cy.get('a[href="#/workspace-home/workspace"]').click();
  cy.url({ timeout: 3000000 }).should('include', '/workspace-home/workspace', { timeout: 100000 });
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

  ClaimProjectCKS(projectNamePONAME); // ใช้ ClaimProjectCKS ตามโค้ดเดิม
  cy.wait(2000); // มี wait ในบาง Spad role
  approveFunction(projectNamePONAME);
};

/*
----------------------------------------------------------------------------
---   7.3. โค้ด Export หลัก (Refactored)
----------------------------------------------------------------------------
*/

export const afterMKTMAINPOST = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTMAINPOST');
      Tariff();
      beforeapproveCKS();
      // --- จบส่วนที่แตกต่าง ---
    });
  });

  afterCKSPOST();
}
export const afterMKTothersubgroup = (PoSubgroup: string, Module: string): void => {
  if (Module === 'POST') {
    it('CKS role', () => {
      // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
      const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;

      // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
      standardCksPoEnhancementFlow(getProjectName, () => {
        beforeapproveCKS();
        // --- จบส่วนที่แตกต่าง ---
      });
    });
    it('CGMD Config IRB role', () => {
      performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD);
    });
    it('CGMD Tester IRB role', () => {
      performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtesterACTM);
    });
    if (PoSubgroup === 'AccountFee' || PoSubgroup === 'OrderFee') {
      it('SASFF role', () => {
        login(sasff, sasffpass);
        cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
        cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

        const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProjectCKS(finalProjectName);
        approveProject(finalProjectName);
        // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(3000);

        cy.scrollTo('bottom');
        cy.wait(3000);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });

        // verify alert
        cy.on('window:alert', (txt) => {
          expect(txt).to.contain('Approve and Send Mail Notify Success');
        });

        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

        cy.contains('button', 'Logout')
          .should('be.visible')
          .click();
      });
    }
    it('ACTM role', () => {
      performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTM);
    });

    it('OPER role', () => {
      performSimpleApprovalRole(oper, operpass, approveProjectCGMDOPER);
    });
  } else if (Module === 'PRE') {
    it('CKS role', () => {
      // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
      const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;

      // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
      standardCksPoEnhancementFlow(getProjectName, () => {
        beforeapproveCKS();
        // --- จบส่วนที่แตกต่าง ---
      });
    });
    it('CGMD Config cbs role', () => {
      performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
    });

    it('CGMD Tester CBS role', () => {
      performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
    });
    if (PoSubgroup === 'AccountFee' || PoSubgroup === 'OrderFee') {
      it('SASFF role', () => {
        login(sasff, sasffpass);
        cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
        cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

        const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProjectCKS(finalProjectName);
        approveProject(finalProjectName);
        // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(3000);

        cy.scrollTo('bottom');
        cy.wait(3000);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });

        // verify alert
        cy.on('window:alert', (txt) => {
          expect(txt).to.contain('Approve and Send Mail Notify Success');
        });

        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

        cy.contains('button', 'Logout')
          .should('be.visible')
          .click();
      });
    }
    it('Spadsup role', () => {
      performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup);
    });

    it('Spaddoer role', () => {
      performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER);
    });

    it('Spadtester role', () => {
      performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester);
    });

    it('Spaddeploy role', () => {
      performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy);
    });

    it('ACTM role', () => {
      performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
    });

    it('APO role', () => {
      performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
    });

  }
}

export const afterCKSPOST = (Module?: string): void => {
  it('CGMD Config IRB role', () => {
    performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD);
  });

  it('CGMD Tester IRB role', () => {
    performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtesterACTM);
  });

  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTM);
  });

  it('OPER role', () => {
    performSimpleApprovalRole(oper, operpass, approveProjectCGMDOPER);
  });
}

export const afterMKTMainUsagePOST = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTMainUsagePOST');
      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');
      Tariff();
      cy.wait(3000);
      priorityInternetLimitedDataOnly();
      beforeapproveCKS();
    });
  });
  afterCKSPOST();
}

export const afterMKTontopPOST = (): void => {
  it('CKS role', () => {
    const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;
    standardCksPoEnhancementFlow(getProjectName, () => {
      cy.log('Executing steps for POST Module');
      cy.get('select[formcontrolname="groupPackage"]').select('5G Hot Deal Max Speed Offset');
      priorityInternetLimitedDataOnly();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommon('POST');
}
export const afterMKTontopENTER = (): void => {
  it('CKS role', () => {
    const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;
    standardCksPoEnhancementFlow(getProjectName, () => {
      cy.log('Executing steps for ENTER Module');
      cy.get('select[formcontrolname="groupPackage"]').select('5G Hot Deal Max Speed Offset');
      priorityInternetLimitedDataOnly();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommon('ENTER');
}

export const afterMKTontopMUSIC = (): void => {
  it('CKS role', () => {
    const getProjectName: GetProjectNameFn = () => (formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME')) as string;
    standardCksPoEnhancementFlow(getProjectName, () => {
      cy.log('Executing steps for MUSIC Module');
      cy.get('select[formcontrolname="groupPackage"]').select('5G Hot Deal Max Speed Offset');
      priorityInternetLimitedDataOnly();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommon('MUSIC');
}

const afterCKSCommon = (Module: string): void => {
  it('CGMD Config IRB role', () => {
    performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD);
  });

  it('CGMD Tester IRB role', () => {
    performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtesterACTM);
  });

  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTM);
  });

  it('OPER role', () => {
    performSimpleApprovalRole(oper, operpass, approveProjectCGMDOPER);
  });

  if (Module === 'MUSIC') {
    it('TSCENTER role', () => {
      login(tscenter, tscenterpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
      cy.wait(3000);
      cy.get('select[formcontrolname="olympus"]')
        .should('be.visible')
        .select('No')
        .should('have.value', 'No');

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();
    });
    it('csisp role', () => {
      login(csisp, csisppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafsp role', () => {
      login(aafsp, aafsppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2etest role', () => {
      login(e2etest, e2etestpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName =
        Cypress.env('formattedDateMain') ||
        Cypress.env('formattedDateOntop') ||
        Cypress.env('formattedDateOntopExtra') ||
        Cypress.env('formattedDateMainPONAME') ||
        Cypress.env('formattedDateOntopPONAME') ||
        Cypress.env('formattedDateOntopExtraPONAME') ||
        'default-project-name';

      cy.log('🎯 Project ใช้สำหรับ Claim: ' + finalProjectName);
      // const finalProjectName = 'MUSIC POST onetime ontop 0311 1635'
      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      // ClaimProjectCKS(finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      // Add File - ใช้วิธีเดิมที่ทำงานได้
      cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

      // ใช้ readFile แบบเดิมที่ทำงานได้
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
      // Wait for upload to complete
      cy.intercept('POST', '**/upload**').as('fileUpload');

      cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('MKT role', () => {
      login(music, musicpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('csidp role', () => {
      login(csidp, csidppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafdp role', () => {
      login(aafdp, aafdppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2edp role', () => {
      login(e2edp, e2edppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);

      cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
  }
}
export const afterCKSPREontop = (): void => {
  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
  });

  it('Spadsup role', () => {
    performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup);
  });

  it('Spaddoer role', () => {
    performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER);
  });

  it('Spadtester role', () => {
    performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester);
  });

  it('Spaddeploy role', () => {
    performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy);
  });

  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
  });

  it('APO role', () => {
    performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
  });
}

export const afterMKTontopPRE = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string;

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      cy.wait(7500)
      addauto5gCKS();
      dropdownRecurringCKS();
      diyflagCKS();
      cy.wait(3500);
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommonPRE('PRE');
}
export const afterMKTontopPREplugin = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string;

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      cy.wait(7500)
      addauto5gCKS();
      dropdownRecurringCKS();
      diyflagCKS();
      cy.wait(3500);
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommonPREplugin('PRE');
}
export const afterMKTontopPREENTER = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string; // โค้ดเดิมใช้ formattedDateOntop

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTontopPRE');
      cy.wait(7500);
      addauto5gCKS();
      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');
      dropdownRecurringCKS();
      diyflagCKS();
      unregister();
      cy.wait(3500);
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
      // --- จบส่วนที่แตกต่าง ---
    });
  });
  afterCKSCommonPRE('ENTER');
}

export const afterMKTontopPREMUSIC = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string; // โค้ดเดิมใช้ formattedDateOntop

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTontopPRE');
      cy.wait(7500);
      addauto5gCKS();
      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');
      dropdownRecurringCKS();
      diyflagCKS();
      unregister();
      cy.wait(3500);
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });
  afterCKSCommonPRE('MUSIC');
}

const afterCKSCommonPRE = (Module: string): void => {
  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
  });

  it('Spadsup role', () => {
    performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup);
  });

  it('Spaddoer role', () => {
    performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER);
  });

  it('Spadtester role', () => {
    performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester);
  });

  it('Spaddeploy role', () => {
    performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy);
  });

  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
  });

  it('APO role', () => {
    performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
  });

  if (Module === 'MUSIC') {
    it('TSCENTER role', () => {
      login(tscenter, tscenterpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
      cy.wait(3000);
      cy.get('select[formcontrolname="olympus"]')
        .should('be.visible')
        .select('No')
        .should('have.value', 'No');

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();
    });
    it('csisp role', () => {
      login(csisp, csisppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafsp role', () => {
      login(aafsp, aafsppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2etest role', () => {
      login(e2etest, e2etestpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');
      // const finalProjectName = 'MUSIC POST onetime ontop 0311 1635'
      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      // Add File - ใช้วิธีเดิมที่ทำงานได้
      cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

      // ใช้ readFile แบบเดิมที่ทำงานได้
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
      // Wait for upload to complete
      cy.intercept('POST', '**/upload**').as('fileUpload');

      cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('MKT role', () => {
      login(music, musicpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('csidp role', () => {
      login(csidp, csidppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafdp role', () => {
      login(aafdp, aafdppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2edp role', () => {
      login(e2edp, e2edppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);

      cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
  }
}
const afterCKSCommonPREplugin = (Module: string): void => {
  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
  });

  it('Spadsup role', () => {
    performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin);
  });

  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREPlugin);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin);
  });
  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
  });

  it('APO role', () => {
    performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
  });

  if (Module === 'MUSIC') {
    it('TSCENTER role', () => {
      login(tscenter, tscenterpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
      cy.wait(3000);
      cy.get('select[formcontrolname="olympus"]')
        .should('be.visible')
        .select('No')
        .should('have.value', 'No');

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();
    });
    it('csisp role', () => {
      login(csisp, csisppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafsp role', () => {
      login(aafsp, aafsppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Tester').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2etest role', () => {
      login(e2etest, e2etestpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');
      // const finalProjectName = 'MUSIC POST onetime ontop 0311 1635'
      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      // Add File - ใช้วิธีเดิมที่ทำงานได้
      cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

      // ใช้ readFile แบบเดิมที่ทำงานได้
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
      // Wait for upload to complete
      cy.intercept('POST', '**/upload**').as('fileUpload');

      cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('MKT role', () => {
      login(music, musicpass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('csidp role', () => {
      login(csidp, csidppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/csi-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('aafdp role', () => {
      login(aafdp, aafdppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);
      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/aaf-support');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);
      cy.contains('button', 'Promote To E2E Deploy').should('be.visible').click({ force: true });
      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
    it('e2edp role', () => {
      login(e2edp, e2edppass);

      cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
      cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

      const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProjectCKS(finalProjectName);
      approveProject(finalProjectName);

      // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
      cy.wait(3000);

      cy.scrollTo('bottom');
      cy.wait(3000);

      cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });

      // verify alert
      cy.on('window:alert', (txt) => {
        expect(txt).to.contain('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.contains('button', 'Logout')
        .should('be.visible')
        .click();


    });
  }
}
export const afterMKTontopPREUsage = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string; // โค้ดเดิมใช้ formattedDateOntop

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTontopPREUsage');
      addauto5gCKS();
      unregister();

      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');

      dropdownRecurringCKS();
      diyflagCKS();
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });

  afterCKSCommonPRE('PRE');
}
export const afterMKTontopPREUsageEnter = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string; // โค้ดเดิมใช้ formattedDateOntop

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTontopPREUsage');
      addauto5gCKS();
      unregister();

      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');

      dropdownRecurringCKS();
      diyflagCKS();
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });

  afterCKSCommonPRE('Enter');
}
export const afterMKTontopPREUsageMusic = (): void => {
  it('CKS role', () => {
    // 1. ระบุฟังก์ชันสำหรับดึงชื่อโปรเจกต์
    const getProjectName: GetProjectNameFn = () => formattedDateOntop as string; // โค้ดเดิมใช้ formattedDateOntop

    // 2. เรียก Flow CKS มาตรฐาน และส่ง "ขั้นตอนเฉพาะ" เข้าไป
    standardCksPoEnhancementFlow(getProjectName, () => {
      // --- นี่คือส่วนที่แตกต่าง ---
      cy.log('Executing steps for afterMKTontopPREUsage');
      addauto5gCKS();
      unregister();

      cy.get('select[formcontrolname="groupPackage"]')
        .select('5G Hot Deal Max Speed Offset');

      dropdownRecurringCKS();
      diyflagCKS();
      priorityInternetLimitedDataOnly();
      cy.scrollTo('bottom');
      smsCKSPRE();
      beforeapproveCKSontop();
    });
  });

  afterCKSCommonPRE('MUSIC');
}

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);

    // cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProjectCKS(finalProjectName);
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
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)

    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    priorityInternetLimitedDataOnly();
    beforeapproveCKS();
  });

  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
  });

  it('Spadsup role', () => {
    performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup);
  });

  it('Spaddoer role', () => {
    performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOERMain);
  });

  it('Spadtester role', () => {
    performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTesterMain);
  });

  it('Spaddeploy role', () => {
    performSimpleClaimAndApprovalRole(spaddp, spaddppass, (projectName) => {
      approveProjectSPADdeploy(projectName);
    });
  });

  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
  });

  it('APO role', () => {
    performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
  });

};

export const afterMKTMainPRE_PluginCGMD = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);

    // cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName') || Cypress.env('formattedDateMainPONAME') || Cypress.env('formattedDateOntopPONAME');

    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProjectCKS(finalProjectName);
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
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)

    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    priorityInternetLimitedDataOnly();
    beforeapproveCKS();
  });

  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE);
  });

  it('Spadsup role', () => {
    performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin);
  });

  it('CGMD Config cbs role', () => {
    performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREPlugin);
  });

  it('CGMD Tester CBS role', () => {
    performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin);
  });
  it('ACTM role', () => {
    performSimpleApprovalRole(actm, actmpass, approveProjectCGMDACTMPRE);
  });

  it('APO role', () => {
    performSimpleApprovalRole(apo, apopass, approveProjectCGMDAPO);
  });

};

/*
============================================================================
=== 
===   Other Standalone Functions
=== 
============================================================================
*/

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

  cy.log(`🎲 Randomly selected: ${randomOption}`);

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
    .should('have.value', randomCharge); // ควรยังเป็นเลขเดิม หลังกรอง non-numeric

  //add buttom
  cy.get('.col-md-6 > .btn').click();
}

export const priorityInternetLimitedDataOnly = (): void => {
  //Nav Internet
  cy.get('.scrollmenu > .nav')
    .contains('Internet')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)
  //0 อยู่ตรง edit
  cy.get('button[title="Edit"]').eq(1).click();  // ตัวแรก
  cy.get('button[title="Edit"]').eq(2).click();  // ตัวที่สอง
  const randomNumber = Math.floor(Math.random() * 99999) + 1; // 1-99999
  cy.get('input[formcontrolname="priority"]')
    .clear()
    .type(randomNumber.toString());

  cy.contains('button', 'Update').eq(0).click();// ตัวแรก
  cy.wait(3000)
  cy.contains('button', 'Update').eq(0).click();// ตัวสอง
}

export const backBacicInfo = () => {
  //Back to Project Basic Information 
  cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });
  Cypress.on('log:added', (log) => {
    if (log.name === 'intercept') {
      console.log(`Intercept registered: ${log.message}`);
    }
  });

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

  cy.get('select[formcontrolname="autoAddService5g"]')
    .select(randomValue)
    .should('have.value', randomValue);
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
  // Handle regular select dropdowns
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

  cy.get('select[formcontrolname="promotionGroup"]').then($select => {
    const options = $select.find('option:not([value="0: null"])');

    if (options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedValue = Cypress.$(options[randomIndex]).prop('value');
      const selectedText = Cypress.$(options[randomIndex]).text().trim();

      cy.log(`Selected Promotion Group: ${selectedText}`);
      cy.wrap($select).select(selectedValue);
      cy.wrap($select).should('have.value', selectedValue);
    }
  });

  cy.get('select[formcontrolname="promotionSubGroup"]').then($select => {
    const options = $select.find('option:not([value="0: null"])');

    if (options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedValue = Cypress.$(options[randomIndex]).prop('value');
      const selectedText = Cypress.$(options[randomIndex]).text().trim();

      cy.log(`Selected Promotion Sub Group: ${selectedText}`);
      cy.wrap($select).select(selectedValue);
      cy.wrap($select).should('have.value', selectedValue);
    }
  });
}