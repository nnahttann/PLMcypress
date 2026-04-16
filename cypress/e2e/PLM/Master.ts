
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


export const login = (username: string, password: string): void => {
  // 1. รอให้ Angular app โหลดเสร็จ (สำคัญ!)
  cy.get('app-login', { timeout: 3000000 }).should('be.visible');

  // 2. รอให้ form โหลดเสร็จ
  cy.get('form', { timeout: 2000000 }).should('be.visible');

  // 3. ใช้วิธีที่มั่นคงกว่าในการหา input
  cy.get('input[name="userId"]', { timeout: 2000000 })
    .should('exist')  // ตรวจสอบว่า element มีอยู่ใน DOM
    .should('be.visible')  // ตรวจสอบว่าเห็นได้
    .should('not.be.disabled')  // ตรวจสอบว่าไม่ disabled
    .clear()  // ล้างค่าที่อาจมีอยู่ก่อน
    .type(username, { delay: 50 });  // พิมพ์แบบช้าๆ

  // 4. สำหรับ password
  cy.get('input[name="pwd"]')
    .should('be.visible')
    .clear()
    .type(password, { delay: 50 });

  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

  // 5. ใช้ selector ที่ชัดเจนขึ้นสำหรับปุ่ม login
  cy.get('button[name="login"], button[type="submit"]')
    .contains('Login')
    .should('be.visible')
    .click();

  cy.wait('@getErrorCodes', { timeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);
}
export const ClaimProject = (formattedDate: string): void => {
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

          if (text.includes(formattedDate)) {
            cy.log(`✅✅✅ EXACT MATCH at row ${index}`);
            matchFound = true;
          }
        });
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

/**
 * @param taskIdentifier ชื่อ Project หลัก (เช่น "MOB PRE onetime main 1912 1457")
 * @param assignee ชื่อคนที่จะ Assign
 * @param uniqueKeyword (Optional) คำเฉพาะเพื่อระบุแถว เช่น "CBS" หรือ "PlugIN" หรือ "Mobile"
 */
export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {

  // 1. Setup Intercepts
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  // 2. รอให้ตารางโหลดเสร็จ
  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // 3. เตรียมชื่อที่จะค้นหา (ตัด _ ออกตาม Logic เดิมของคุณ เพื่อให้ได้ชื่อ Project หลัก)
  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for Project: "${partialIdentifier}" with Keyword: "${uniqueKeyword}"`);

  // 4. ค้นหา Row ที่ถูกต้อง (Logic ใหม่: Filter หาแถวที่มีทั้งชื่อ Project และ Keyword)
  cy.get('tr', { timeout: 600000 })
    .filter((index, element) => {
      const rowText = Cypress.$(element).text();
      // เงื่อนไข 1: ต้องมีชื่อ Project
      const hasProjectName = rowText.includes(partialIdentifier);
      // เงื่อนไข 2: ถ้าส่ง uniqueKeyword มา ต้องมีคำนั้นด้วย (ถ้าไม่ส่งมา ถือว่าผ่านเลย)
      const hasKeyword = uniqueKeyword ? rowText.includes(uniqueKeyword) : true;

      return hasProjectName && hasKeyword;
    })
    .first() // เอาแถวแรกที่เจอ (หลังจากกรองแล้ว)
    .as('taskRow');

  // ตรวจสอบว่าเจอแถวไหมและ Scroll ไปหา
  cy.get('@taskRow').scrollIntoView().should('be.visible');

  // 5. จัดการ Dropdown (Logic เดิมของคุณ)
  cy.get('@taskRow').within(() => {
    cy.get('select.form-control.input-sm').as('assigneeDropdown');

    // คลิก parent เพื่อเปิด (บาง Framework ต้องการ step นี้)
    cy.get('@assigneeDropdown').parent().click();

    // Trigger Event เพื่อบังคับให้ Dropdown ทำงาน (ตาม Code เดิมของคุณ)
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

    // Debug: Show all options (Log ดูค่าที่มีให้เลือก)
    // cy.get('@assigneeDropdown')
    //   .find('option')
    //   .each(($option: JQuery<HTMLOptionElement>) => {
    //     cy.log(`📋 Option: "${$option.val()}" = "${$option.text().trim()}"`);
    //   });

    // รอให้ Option ของ Assignee โผล่มาและเลือก
    cy.get('@assigneeDropdown')
      .find(`option[value="${assignee}"]`, { timeout: 10000 })
      .should('exist');

    cy.get('@assigneeDropdown').select(assignee);
    cy.get('@assigneeDropdown').should('have.value', assignee);

    // กดปุ่ม Set
    cy.get('@taskRow').contains('span', 'Set').click();
  });
}

type TaskListHeader = 'To Do List' | 'Unassigned Task';

type FinalAction =
  | 'AlertAndLogout'    // ทั่วไป: รอ Alert, กลับหน้า Workspace, แล้ว Logout
  | 'ComplexLogout'     // สำหรับ SPADSup: ไม่รอ Alert, กลับหน้า Workspace, แล้ว Logout
  | 'StopAfterCore';    // สำหรับ SPADTesterMain: ทำงานหลักเสร็จแล้วหยุดเลย

type CoreTaskCallback = () => void;

const createFullPageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback,
  finalAction: FinalAction
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

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

  cy.url({ timeout: 600000 }).should('include', expectedUrl);

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });

  coreTaskCallback();

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

    case 'ComplexLogout':
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      //cy.url({ timeout: 3000000 }).should('include', '/login');
      break;

    case 'StopAfterCore':
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
          // .contains('Approve')
          .should('be.visible')
          .click();
      });
  });
};

const _approveSPADLogic = (projectName: string, isComplex: boolean): void => {
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
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
      cy.wait(2000);

      cy.contains('button', buttonText, { timeout: 3000000 })
        .should('be.visible')
        .click();
    },
    'ComplexLogout'
  );
};

export const approveProjectSPADSup = (projectName: string): void => {
  _approveSPADLogic(projectName, true);
};

export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => {
  _approveSPADLogic(projectName, false);
};

const _approveSPADDOERLogic = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      if (isMainFlow) {
        const rnd = () => Math.floor(Math.random() * 90000) + 10000;

        cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input')
          .type('PT' + rnd());
        cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input')
          .type('PP' + rnd());
        cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input')
          .type('PST' + rnd());
      }
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

      cy.scrollTo('bottom');
      cy.wait(2000);
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 })
        .should('be.visible')
        .click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectSPADDOER = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, false);
};

export const approveProjectSPADDOERMain = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, true);
};
const _approveSPADTesterLogic = (projectName: string, isMainFlow: boolean): void => {
  const logoutStrategy = isMainFlow ? 'StopAfterCore' : 'AlertAndLogout';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {

      if (isMainFlow) {
        cy.wait(5000);
        cy.scrollTo('bottom');

        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

        cy.once('window:alert', (alertText) => {
          if (alertText.includes('Call API Plugin Success') || alertText.includes('Do you want to Approve')) {
            expect(alertText).to.be.a('string');
          } else {
            throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
          }
        });

        cy.on('window:confirm', () => true);
        cy.contains('button', 'Send PlugIN', { timeout: 3000000 }).should('be.visible').click();
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Yes")').length > 0) {
            cy.get('button').contains('Yes', { timeout: 10000 }).first().click();
          }
        });
        cy.wait(80000);

        cy.scrollTo('top');
        cy.contains('button', 'Refresh Status', { timeout: 3000000 }).should('be.visible').click();

        cy.scrollTo('bottom');
        cy.wait(2000);

        cy.removeAllListeners('window:alert'); // Clear old listeners

        cy.once('window:alert', (alertText) => {
          if (alertText.includes('Do you want to Approve') || alertText.includes('Call API Plugin Success')) {
            expect(alertText).to.be.a('string');
          } else {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();

        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Yes")').length > 0) {
            cy.get('button').contains('Yes', { timeout: 10000 }).last().click();
          }
        });

      } else {
        cy.scrollTo('bottom');
        cy.wait(2000);
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
      }
    },
    logoutStrategy
  );
};

export const approveProjectSPADTester = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, false);
};

export const approveProjectSPADTesterMain = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, true);
};

export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(2000);
      cy.contains('button', 'Promote To ACTM', { timeout: 3000000 }).should('be.visible').click();

    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMD = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {

      cy.scrollTo('bottom');
      cy.wait(2000);
      cy.get('button[name="CBS"]').should('be.visible', { timeout: 3000000 }).click();
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
      cy.scrollTo('bottom');
      cy.wait(2000);
      cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click({ force: true });

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
      cy.wait(2000);
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
      cy.wait(2000);
      cy.contains('button', 'Approve To CGMD Tester', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();

    },
    'AlertAndLogout'
  );
};
export const approveProjectCGMDtester = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {

      cy.scrollTo('bottom');
      cy.wait(2000);
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

      cy.scrollTo('bottom');
      cy.wait(2000);
      cy.contains('button', 'Promote To Pre Go Live', { timeout: 3000000 }).should('be.visible').click();
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


      cy.wait(5000);
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
      cy.wait(80000);
      cy.scrollTo('top');
      cy.contains('button', 'Refresh Status', { timeout: 3000000 })
        .should('be.visible')
        .click();
      cy.scrollTo('bottom');
      cy.wait(2000);

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

export const approveProjectACTM = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'Unassigned Task',
    '/actm/actm-doer',
    () => {

      cy.scrollTo('bottom');
      cy.wait(2000);
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

      cy.scrollTo('bottom');
      cy.wait(2000);
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

      // เลือก No
      cy.get('select[formcontrolname="olympus"]').select('No');

      // ตรวจสอบว่าเลือกแล้ว
      cy.get('select[formcontrolname="olympus"]').should('have.value', 'No');

      // ตรวจสอบว่า form valid
      cy.get('select[formcontrolname="olympus"]')
        .should('not.have.class', 'ng-invalid')
        .and('have.class', 'ng-valid');

      cy.scrollTo('bottom');
      cy.wait(2000);
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

      cy.scrollTo('bottom');
      cy.wait(2000);
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
    autoSetDuration?: boolean,
    Plugin?: string
  }
) => {
  const { ProductClass1, Module, subModule, autoSetDuration = false, Plugin } = options;

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

  const pluginSuffix = Plugin ? ` ${Plugin}` : '';
  const projectName = `${ModulePart} ${PriceType} ${ProductClass}${pluginSuffix} ${day}${month} ${hours}${minutes}`;

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

  const poName = `${ModulePart} ${PriceType} ${ProductClass}${pluginSuffix} ${day}${month} ${hours}${minutes}`;

  cy.get('input[formcontrolname="productName"]').type(poName);
  const poEnvKey = ProductClass1 === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  Cypress.env(poEnvKey, poName);

  cy.get('select[formcontrolname="promotionSubGroupFrom"]')
    .select('Product Offering')
    .should('have.value', 'Product Offering');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.contains('button', 'Create', { timeout: 10000 })
    .should('be.visible')
    .click()

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // --- Navigate to Product Offering ---
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

  cy.wait('@getProject', { timeout: 300000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.location('hash', { timeout: 300000 })
    .should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
  cy.wait(8000);

  cy.get('select[formcontrolname="priceType"]', { timeout: 300000 })
    .should('be.visible');

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

    if (autoSetDuration) {
      const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
      const randomMonth = randomInRange(2, 60);
      cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());

      cy.get('select[formcontrolname="packageDurationUnit"]')
        .find('option:not([disabled])')
        .then(($options) => {
          const randomIndex = Math.floor(Math.random() * $options.length);
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
          cy.get('select[formcontrolname="packageDurationUnit"]').select(valueToSelect);
        });
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
    projectName = `MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month}${hours}${minutes}`;
  } else {
    projectName = `MOB ${Module} ${PoSubGroup} ${day}${month}${hours}${minutes}`;
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
    poName = `MOB ${Module} ${PriceType} ${PoSubGroup} ${day}${month}${hours}${minutes}`;
  }
  else {
    poName = `MOB ${Module} ${PoSubGroup} ${day}${month}${hours}${minutes}`;
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
      cy.get('textarea[formcontrolname="discountNameEn"]').type(`MOB ${Module} ${PriceType}${day}${month}${hours}${minutes} Discount NameEn`);
      cy.get('textarea[formcontrolname="discountNameTh"]').type(`MOB ${Module} ${PriceType}${day}${month}${hours}${minutes} Discount Name Th`);
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
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // SMS Greeting Flag
      cy.get('select[formcontrolname="smsGreetingSendFlag"]')
        .select('Send')

      // SMS Greeting EN
      cy.get('textarea[formcontrolname="smsGreetingEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Greeting Eng`);

      // SMS Greeting TH
      cy.get('textarea[formcontrolname="smsGreetingTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Greeting Thai`);

      // SMS Delete Flag
      cy.get('select[formcontrolname="smsDeleteSendFlag"]')
        .select('Send')

      // SMS Delete EN
      cy.get('textarea[formcontrolname="smsDeleteEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Delete Eng`);

      // SMS Delete TH
      cy.get('textarea[formcontrolname="smsDeleteTh"]')
        .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} SMS Delete Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} description Thai`);
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
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Short Promotion Name Eng`);

      // shortPromotionName TH
      cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Short Promotion Name Thai`);

      // promotionDescriptionEn 
      cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Promotion Description Eng`);

      // promotionDescription TH
      cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Promotion Description Thai`);

      // greetingLetterEn 
      cy.get('textarea[formcontrolname="greetingLetterEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // greetingLetter TH
      cy.get('textarea[formcontrolname="greetingLetterTh"]')
        .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // yourPackageNameEn 
      cy.get('textarea[formcontrolname="yourPackageNameEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Your PackageName Eng`);

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
        .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);

      // SMS Wording Greeting Letter TH
      cy.get('textarea[formcontrolname="wordingInStatementTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Thai`);

      // Description EN
      cy.get('textarea[formcontrolname="descriptionEn"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} description Eng`);

      // Description TH
      cy.get('textarea[formcontrolname="descriptionTh"]')
        .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} description Thai`);

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

; export const priorityInternet = (): void => {
  // 1. เปิด Tab Internet
  cy.get('app-mass-enh-product-offering-detail-tab div.scrollmenu')
    .not('[hidden]')
    .contains('a', /^Internet$/)
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.log('⏳ Waiting for table data...');
  cy.wait(2000);

  // รอให้ตารางหลักโหลด
  cy.get('app-mass-enh-internet table.table-hover.table-bordered:visible')
    .should('exist')
    .find('tbody tr')
    .find('button[title="Edit"]')
    .should('be.visible');

  // --- Loop นอก: จัดการ Main Row ---
  const processMainTableRow = (rowIndex: number = 0) => {
    cy.get('body').then(($body) => {
      // หาตารางหลัก (Main Table)
      const $mainTable = $body.find('app-mass-enh-internet > div > table.table-hover.table-bordered:visible').first();
      const $rows = $mainTable.find('> tbody > tr');

      if (rowIndex >= $rows.length) {
        cy.log('✅ Processed all main rows.');
        return;
      }

      const $currentRow = Cypress.$($rows[rowIndex]);

      if ($currentRow.find('button[title="Edit"]').length === 0) {
        cy.log(`ℹ️ Row ${rowIndex} has no Edit button. Skipping.`);
        processMainTableRow(rowIndex + 1);
        return;
      }

      cy.log(`🚀 Processing Main Row: ${rowIndex}`);

      // กด Edit Main Row
      cy.wrap($currentRow).find('button[title="Edit"]').scrollIntoView().click();
      cy.wait(1000); // รอ Form เปิด

      // เรียก Loop ใน
      processFormInsideRow(rowIndex);
    });
  };

  // --- Loop ใน: จัดการ Form และ Nested Table ---
  const processFormInsideRow = (mainRowIndex: number) => {
    cy.get('body').then(($body) => {
      // Scope หาเฉพาะใน Form ที่เปิดอยู่ (Collapse Panel)
      const $activeForm = $body.find('app-mass-enh-internet .collapse.in, app-mass-enh-internet .collapse.show').first();

      // =======================================================
      // PART 1: เช็คตารางย่อย (Nested Table)
      // =======================================================
      // หาตารางข้างใน Form (ถ้ามี)
      const $nestedTable = $activeForm.find('table.table-hover.table-bordered');

      if ($nestedTable.length > 0) {
        // หา Header เพื่อดูว่า Column Priority อยู่ index ไหน (กันพลาด)
        let priorityColIndex = -1;
        $nestedTable.find('thead th').each((i, el) => {
          if (Cypress.$(el).text().trim().includes('Priority')) {
            priorityColIndex = i;
          }
        });

        // ถ้าเจอ Column Priority ให้วนลูปหาแถวที่ค่าว่าง
        if (priorityColIndex !== -1) {
          const $nestedRows = $nestedTable.find('tbody tr');
          let targetNestedRowIndex = -1;

          $nestedRows.each((i, row) => {
            const $cell = Cypress.$(row).find('td').eq(priorityColIndex);
            // เช็คว่า text ว่าง และ แถวนั้นต้องมีปุ่ม Edit ด้วย
            if ($cell.text().trim() === '' && Cypress.$(row).find('button[title="Edit"]').length > 0) {
              targetNestedRowIndex = i;
              return false; // break loop
            }
          });

          // เจอแถวว่างในตารางย่อย -> จัดการมันก่อน!
          if (targetNestedRowIndex !== -1) {
            cy.log(`⚠️ Found empty nested priority at row ${targetNestedRowIndex}. Fixing...`);

            // 1. กด Edit ของแถวย่อย
            cy.wrap($nestedRows[targetNestedRowIndex])
              .find('button[title="Edit"]')
              .click();

            // 2. รอ Input ปรากฏ (ชื่อ formcontrolname="priority")
            cy.wait(500);
            const randomNumber = Math.floor(Math.random() * 99999) + 1;

            // หา Input เฉพาะในแถวที่กำลังแก้
            cy.get('app-mass-enh-internet input[formcontrolname="priority"]:visible')
              .clear()
              .type(randomNumber.toString());

            // 3. กด Update ของแถวย่อย (ระวัง: ต้องกดปุ่ม Update ของ nested row หรือปุ่ม Add/Update ใกล้ๆ)
            // สมมติว่าพอกด Edit แถวย่อย ปุ่ม Action จะเปลี่ยนเป็น Update/Cancel ในแถวนั้น
            cy.wrap($nestedRows[targetNestedRowIndex])
              .parents('table') // ถอยไปหา Table แม่
              .parent() // ถอยไปอีกนิดเผื่อปุ่มอยู่นอก Table (ปกติเคสนี้ปุ่มมักจะอยู่ในแถว หรือใต้ตาราง)
              .find('button.btn-primary') // หาปุ่มสีฟ้า
              .contains(/Update|Add/i)
              .click();

            cy.wait(2000); // รอ Refresh
            processFormInsideRow(mainRowIndex); // วนกลับมาเช็คใหม่
            return; // จบรอบนี้
          }
        }
      }

      // =======================================================
      // PART 2: เช็ค Input ใน Form หลัก (Standalone Inputs)
      // =======================================================
      // ถ้าในตารางย่อยครบแล้ว (หรือไม่มี) มาเช็ค Input ทั่วไป เช่น fixedSpeedPriority
      const $mainInputs = $activeForm.find('input[formcontrolname*="riority"]'); // หา input ที่ชื่อมีคำว่า riority
      let emptyMainInputIndex = -1;

      for (let i = 0; i < $mainInputs.length; i++) {
        // ต้องเช็คว่า Input นี้ไม่ได้อยู่ในตารางย่อยที่เราเพิ่งเช็คไป (หรือเช็ค value เลยก็ได้)
        if (!Cypress.$($mainInputs[i]).val()) {
          emptyMainInputIndex = i;
          break;
        }
      }

      if (emptyMainInputIndex !== -1) {
        cy.log('⚠️ Found empty main form priority. Fixing...');
        const randomNumber = Math.floor(Math.random() * 99999) + 1;

        cy.wrap($mainInputs[emptyMainInputIndex])
          .scrollIntoView()
          .type(randomNumber.toString());

        // กด Update ใหญ่ของ Form
        cy.get('app-mass-enh-internet button.btn-primary')
          .contains(/Update|Add/i)
          .scrollIntoView()
          .click();

        cy.wait(2000);
        processFormInsideRow(mainRowIndex); // เช็คซ้ำ (เผื่อมีหลาย Input)
        return;
      }

      // =======================================================
      // PART 3: ครบทุกอย่างแล้ว -> ไป Main Row ถัดไป
      // =======================================================
      cy.log('✅ Form complete. Moving to next row.');
      cy.get('app-mass-enh-internet button').contains('Cancel').filter(':visible').click();
      cy.wait(500);
      processMainTableRow(mainRowIndex + 1);

    });
  };

  // เริ่มต้น
  processMainTableRow(0);
};
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

  cy.get(addButtonSelector).click();
  cy.get('select[formcontrolname="InternetQuotaType"]', { timeout: 20000 })
    .should('exist');


  detectDeductTabs().then((hasDeductTabs) => {
    if (hasDeductTabs) {
      cy.get('tabset .nav-tabs li', { timeout: 10000 })
        .first()
        .find('a')
        .should('be.visible')
        .click({ force: true });

      cy.wait(500);
    }

    cy.get(addButtonSelector, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('select[formcontrolname="InternetQuotaType"]', { timeout: 20000 })
      .should('be.visible')
      .last()
      .then(($select) => {

        const $options = $select.find('option:not([disabled])');

        if ($options.length === 0) {
          cy.log('❌ No InternetQuotaType options found');
          return;
        }

        const randomIndex = Math.floor(Math.random() * $options.length);
        const selectedValue = ($options[randomIndex] as HTMLOptionElement).value;

        cy.wrap($select).select(selectedValue, { force: true });

        const checkAndSelectExceedRate = () => {
          const labelText = 'Internet Exceed Rate';

          const rootSelector = hasDeductTabs
            ? '.tab-content .tab-pane.active'
            : 'body';

          cy.get(rootSelector).then(($root) => {
            if ($root.find(`label:contains("${labelText}"):visible`).length > 0) {
              cy.get(rootSelector)
                .contains('.col-md-12', labelText)
                .find('mat-select')
                .scrollIntoView()
                .click({ force: true });

              selectRandomExceedRate(hasDeductTabs);
              cy.wait(500);
            } else {
              cy.log('ℹ️ Internet Exceed Rate not found, skipping...');
            }
          });
        };

        switch (selectedValue) {
          case 'Limited Data (Pay per use)':
          case 'Limited Data (Stop Net)':
            selectRandomInternetQuota(hasDeductTabs);
            cy.wait(500);
            selectRandomInternetSpeed(hasDeductTabs);
            cy.wait(500);
            checkAndSelectExceedRate();
            break;

          case 'Limited Data Only':
            selectRandomInternetQuota(hasDeductTabs);
            cy.wait(500);
            selectRandomInternetSpeed(hasDeductTabs);
            cy.wait(500);
            checkAndSelectExceedRate();
            break;

          case 'Unlimited Data (Throttling Speed)':
            selectRandomInternetQuota(hasDeductTabs);
            cy.wait(500);
            selectRandomInternetSpeed(hasDeductTabs);
            cy.wait(500);
            selectInternetThrottlingSpeed(hasDeductTabs);
            cy.wait(500);
            checkAndSelectExceedRate();
            break;

          case 'Pay per use only':
            checkAndSelectExceedRate();
            break;

          case 'Unlimited Data (Fixed Speed)':
            cy.get('[formarrayname="internetQuotaNetworkCoverageCheckBox"]')
              .contains('label', '5G')
              .click({ force: true });

            cy.wait(800);

            selectRandomInternetSpeedfixed(hasDeductTabs);
            cy.wait(500);
            checkAndSelectExceedRate();
            break;

          default:
            cy.log(`⚠️ Unknown InternetQuotaType: ${selectedValue}`);
            break;
        }

        cy.get(saveButtonSelector, { timeout: 20000 })
          .should('be.visible')
          .click({ force: true });
      });
  });
};

const detectDeductTabs = (): Cypress.Chainable<boolean> => {
  return cy.get('body').then(($body) => {
    return $body.find('tabset .nav-tabs').length > 0;
  });
};

const selectRandomInternetQuota = (hasTabs: boolean) => {

  if (hasTabs) {
    cy.get('.nav-tabs').scrollIntoView();
    cy.get('.nav-tabs').contains('Deduct Success').click();
    cy.wait(500);
  }

  const rootSelector = hasTabs
    ? '.tab-content .tab-pane.active'
    : 'body';

  cy.get(rootSelector)
    .contains('.form-group', '*Internet Quota :')
    .find('mat-select')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get('.cdk-overlay-pane', { timeout: 10000 })
    .should('be.visible')
    .and('not.have.class', 'mat-select-panel-animating');

  cy.get('mat-option')
    .should('be.visible')
    .then(($options) => {
      const fiveGOptions = $options.filter((index, option) =>
        Cypress.$(option).text().trim().startsWith('5G')
      );

      if (fiveGOptions.length > 0) {
        const randomIndex = Math.floor(Math.random() * fiveGOptions.length);

        // ✅ แก้ไข: เพิ่ม { force: true } เพื่อแก้ปัญหา element hidden
        cy.wrap(fiveGOptions[randomIndex])
          .scrollIntoView()
          .click({ force: true });

      } else {
        cy.log('⚠️ No 5G options found!');
        // ใช้ click backdrop จะชัวร์กว่า ESC ในบางกรณี
        cy.get('body').click(0, 0, { force: true });
      }
    });
};
const selectRandomInternetSpeed = (hasTabs: boolean) => {
  cy.scrollTo('bottom');

  const rootSelector = hasTabs
    ? '.tab-content .tab-pane.active'
    : 'body';

  cy.get(rootSelector)
    .contains('.col-md-12', '*Internet Speed :')
    .find('select')
    .should('exist')
    .then(($select) => {

      const $options = $select.find('option');
      const startIndex = 1;

      if ($options.length > startIndex) {
        const randomIndex = Math.floor(Math.random() * ($options.length - startIndex)) + startIndex;
        const randomValue = ($options[randomIndex] as unknown as HTMLOptionElement).value;

        cy.wrap($select)
          .select(randomValue, { force: true })
          .should('have.value', randomValue);
      } else {
        cy.log('⚠️ No Internet Speed options available');
      }
    });
};

const selectRandomExceedRate = (hasTabs: boolean) => {
  const rootSelector = hasTabs
    ? '.tab-content .tab-pane.active'
    : 'body';

  cy.get(rootSelector)
    .contains('Internet Exceed Rate')
    .closest('.col-md-12')
    .find('mat-select')
    .scrollIntoView()
    .click({ force: true });

  // Wait for dropdown panel to appear
  cy.get('.mat-select-panel', { timeout: 10000 }).should('be.visible');
  cy.wait(500); // Give panel time to render options

  cy.get('.mat-select-panel mat-option', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.wrap($options.eq(randomIndex)).click({ force: true });
    });
};

const selectRandomInternetSpeedfixed = (hasTabs: boolean) => {
  cy.scrollTo('bottom');

  const selector = hasTabs
    ? '.tab-content .tab-pane.active select[formcontrolname="fixedSpeedInternetSpeed"]'
    : 'select[formcontrolname="fixedSpeedInternetSpeed"]';

  cy.get(selector, { timeout: 10000 }).then($select => {
    const $options = $select.find('option');
    const startIndex = 1;

    if ($options.length > startIndex) {
      const randomIndex = Math.floor(Math.random() * ($options.length - startIndex)) + startIndex;
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;

      cy.wrap($select)
        .select(randomValue, { force: true })
        .should('have.value', randomValue);
    } else {
      cy.log('⚠️ No Fixed Internet Speed options found');
    }
  });
};

const selectInternetThrottlingSpeed = (hasTabs: boolean) => {
  cy.scrollTo('bottom');

  const selector = hasTabs
    ? '.tab-content .tab-pane.active select[formcontrolname="internetThrottlingSpeed"]'
    : 'select[formcontrolname="internetThrottlingSpeed"]';

  cy.get(selector, { timeout: 10000 }).then($select => {
    const $options = $select.find('option:not([disabled])');

    if ($options.length > 0) {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;

      cy.wrap($select)
        .select(randomValue, { force: true })
        .should('have.value', randomValue);
    } else {
      cy.log('⚠️ No Throttling Speed options found');
    }
  });
};

export const CopyDeductFail = () => {
  const tabs = ['Internet', 'Voice', 'SMS', 'MMS'];

  tabs.forEach((tabName) => {
    cy.wait(2000);
    cy.get('.scrollmenu > .nav')
      .contains(tabName)
      .scrollIntoView()
      .click();
    cy.contains('.nav-tabs .nav-link', 'Deduct Fail')
      .click({ force: true });

    cy.wait(2000);
    cy.contains('button', 'Copy From Deduct Success')
      .click({ force: true });
  });
};

const closeSuccessModal = (): void => {
  cy.get('.modal-dialog', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
};

type SmsPattern =
  | 'BALANCED'
  | 'TRANSACTION_FOCUS'
  | 'MARKETING_FOCUS'
  | 'EXPIRY_FLOW'
  | 'SILENT_USER'
  | 'THAI_USER'
  | 'EN_USER'
  | 'SHORT_ALL'
  | 'LONG_ALL';

export const _smsWordingLogic = (type: 'POST' | 'PRE') => {

  // --------------------------------------------------
  // 🎯 PATTERN
  // --------------------------------------------------
  const pattern: SmsPattern = Cypress._.sample([
    'BALANCED',
    'TRANSACTION_FOCUS',
    'MARKETING_FOCUS',
    'EXPIRY_FLOW',
    'SILENT_USER',
    'THAI_USER',
    'EN_USER',
    'SHORT_ALL',
    'LONG_ALL'
  ]);

  cy.log(`🔥 Pattern: ${pattern}`);

  // --------------------------------------------------
  // 🧠 BASE
  // --------------------------------------------------
  const name =
    Cypress.env('projectName') ||
    Cypress.env('poName') ||
    'PACKAGE-A';

  const limit = (str: string, max: number) =>
    str.length > max ? str.substring(0, max) : str;

  // --------------------------------------------------
  // 🌏 LANGUAGE
  // --------------------------------------------------
  const getLang = (): 'TH' | 'EN' => {
    if (pattern === 'THAI_USER') return 'TH';
    if (pattern === 'EN_USER') return 'EN';
    return Math.random() < 0.7 ? 'TH' : 'EN';
  };

  // --------------------------------------------------
  // 🧠 REAL SMS TEXT LIBRARY
  // --------------------------------------------------
  const smsLib = {
    greeting: {
      TH: `ยินดีต้อนรับสู่แพ็กเกจ ${name}`,
      EN: `Welcome to ${name}`
    },
    success: {
      TH: `สมัคร ${name} สำเร็จ`,
      EN: `Subscription to ${name} successful`
    },
    fail: {
      TH: `ไม่สามารถหักค่าบริการ ${name} ได้`,
      EN: `Payment for ${name} failed`
    },
    beforeFee: {
      TH: `${name} จะหักค่าบริการในอีก 3 วัน`,
      EN: `${name} will be charged in 3 days`
    },
    expireSoon: {
      TH: `${name} ใกล้หมดอายุ`,
      EN: `${name} is about to expire`
    },
    expired: {
      TH: `${name} หมดอายุแล้ว`,
      EN: `${name} has expired`
    },
    promo: {
      TH: `รับสิทธิ์ ${name} วันนี้`,
      EN: `Enjoy ${name} today`
    },
    check: {
      TH: `เช็คแพ็กเกจ ${name}`,
      EN: `Check your package ${name}`
    }
  };

  // --------------------------------------------------
  // 🧠 TEXT GENERATOR
  // --------------------------------------------------
  const genText = (key: keyof typeof smsLib, maxLen: number) => {
    const lang = getLang();
    let text = smsLib[key][lang];

    if (pattern === 'SHORT_ALL') {
      text = lang === 'TH' ? `ใช้ ${name}` : `Use ${name}`;
    }

    if (pattern === 'LONG_ALL') {
      text =
        lang === 'TH'
          ? `ขอบคุณที่ใช้บริการ ${name} สามารถใช้งานได้ตามเงื่อนไขที่กำหนด`
          : `Thank you for using ${name}, service is active under terms`;
    }

    return limit(text, maxLen);
  };

  // --------------------------------------------------
  // 🎯 SEND FLAG LOGIC (REAL)
  // --------------------------------------------------
  const getSend = (section: string) => {
    switch (pattern) {

      case 'SILENT_USER':
        return "Don't Send";

      case 'TRANSACTION_FOCUS':
        return section.includes('Greeting') ||
          section.includes('Delete')
          ? 'Send'
          : "Don't Send";

      case 'MARKETING_FOCUS':
        return section.includes('Promote')
          ? 'Send'
          : Math.random() < 0.5 ? 'Send' : "Don't Send";

      case 'EXPIRY_FLOW':
        return section.includes('Exp')
          ? 'Send'
          : "Don't Send";

      default:
        return Math.random() < 0.75 ? 'Send' : "Don't Send";
    }
  };

  const getDefault = () => {
    if (pattern === 'TRANSACTION_FOCUS') return true;
    if (pattern === 'MARKETING_FOCUS') return false;
    return Math.random() < 0.5;
  };

  // --------------------------------------------------
  // 🧩 HELPERS
  // --------------------------------------------------
  const fill = (control: string, key: keyof typeof smsLib, len: number) => {
    cy.get(`textarea[formcontrolname="${control}"]`)
      .should('exist')
      .then($el => {
        const text = genText(key, len);

        cy.wrap($el[0]).clear().type(text, { force: true });

        if ($el.length > 1) {
          cy.wrap($el[1]).clear().type(genText(key, len), { force: true });
        }
      });
  };

  const sendOnly = (
    flag: string,
    textarea: string,
    key: keyof typeof smsLib,
    len: number
  ) => {
    const val = getSend(flag);

    cy.get('body').then($b => {
      if ($b.find(`select[formcontrolname="${flag}"]`).length) {
        cy.get(`select[formcontrolname="${flag}"]`).select(val);

        if (val === 'Send') {
          fill(textarea, key, len);
        }
      }
    });
  };

  const sendWithDefault = (
    flag: string,
    radio: string,
    textarea: string,
    key: keyof typeof smsLib,
    len: number
  ) => {
    const val = getSend(flag);

    cy.get('body').then($b => {
      if ($b.find(`select[formcontrolname="${flag}"]`).length) {
        cy.get(`select[formcontrolname="${flag}"]`).select(val);

        if (val === 'Send') {
          const isDefault = getDefault();

          cy.get(`input[formcontrolname="${radio}"]`)
            .eq(isDefault ? 0 : 1)
            .check({ force: true });

          if (!isDefault) {
            fill(textarea, key, len);
          }
        }
      }
    });
  };

  // --------------------------------------------------
  // 🚀 FLOW
  // --------------------------------------------------
  cy.contains('SMS Wording').click();

  fill('shortPromotionName', 'promo', 50);
  fill('cmsDisplay', 'promo', 250);
  fill('promotionDescription', 'promo', 250);

  if (type === 'POST') {
    fill('marketingName', 'promo', 40);
    fill('greetingLetter', 'greeting', 250);
    fill('yourPackage', 'promo', 100);
  }

  sendOnly('smsGreetingSendFlag', 'smsGreeting', 'greeting', 250);

  sendWithDefault(
    'smsDeleteSendFlag',
    'SmsDeletedefaultWordingFlag',
    'smsDelete',
    'expired',
    250
  );

  if (type === 'PRE') {

    sendWithDefault(
      'lastMinuteAlertSendFlag',
      'lastMinuteAlertDefaultWordingFlag',
      'smsNotificationLastMinuteAlert',
      'expireSoon',
      250
    );

    const val = getSend('smsBeforeFeeDeductSendFlag');

    cy.get('select[formcontrolname="smsBeforeFeeDeductSendFlag"]').select(val);

    if (val === 'Send') {
      cy.get('input[formcontrolname="beforeFeeDeduction"]').clear().type('3');
      cy.get('select[formcontrolname="beforeFeeDeductionUnit"]').select('2: Days');

      const isDefault = getDefault();

      cy.get('input[formcontrolname="defaultWordingFlag"]')
        .eq(isDefault ? 0 : 1)
        .check({ force: true });

      if (!isDefault) {
        fill('smsNotificationBeforeFeeDeduction', 'beforeFee', 250);
      }
    }
  }

  sendOnly('smsPromotePackSendFlag', 'smsPromotePack', 'promo', 250);

  cy.get('body').then($b => {
    if ($b.find('textarea[formcontrolname="smsCheckCurrent"]').length) {
      fill('smsCheckCurrent', 'check', 50);
    }
  });

  // --------------------------------------------------
  // 💾 SAVE
  // --------------------------------------------------
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('save');

  cy.contains('Save').click();

  cy.wait('@save', { timeout: 100000 })
    .its('response.statusCode')
    .should('eq', 200);

    closeSuccessModal();
};

export const smsWording = () => {
  _smsWordingLogic('POST');
};

export const smsWordingpre = () => {
  _smsWordingLogic('PRE');
};
export const Tariff = (): void => {
  // Navigate to Tariff & Discount section
  cy.get('.scrollmenu > .nav')
    .contains('Tariff Plan & Discount')
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(2000);
  cy.get('#mat-select-2 .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  // Wait for dropdown panel to appear
  cy.get('.mat-select-panel', { timeout: 10000 }).should('be.visible');
  cy.wait(500); // Give panel time to render options

  cy.get('.mat-select-panel mat-option', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
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
  cy.wait(5000);

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
  cy.contains('.row', 'Approve memo')
    .find('input[type="checkbox"]')
    .check({ force: true });

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
  cy.wait(2000)

  // Wait for loading spinner to disappear (if applicable)
  // cy.get('.loading-spinner', { timeout: 60000 }).should('not.exist'); // This line was error-prone, consider conditional check if needed

  cy.url({ timeout: 3000000 }).should('include', '/mkt/mktchecker');

  cy.get('button.btn.btn-xs.btn-primary')
    // .contains('Approve')
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


const selectRandomDropdownRecurring = (): void => {
  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.wrap($options[randomIndex]).click({ force: true });
    cy.get('.mat-select-value').should('contain.text', selectedText);
  });

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);

  });
}

export const dropdownRecurringCKS = () => {
  selectRandomDropdownRecurring();
};

export const dropdownRecurringCKSMain = () => {
  cy.get('.mat-select-value').eq(1).click({ force: true });

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });
    cy.get('.mat-select-value').eq(1).should('contain.text', selectedText);
  });
};

export const dropdownRecurringPreMainCKS = () => {
  selectRandomDropdownRecurring();
};

type GetProjectNameFn = () => string;

type EnhanceStepsCallback = () => void;

type ApproveFunction = (projectName: string) => void;


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
  cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 1000000 });
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
  cy.get('button.btn-sample', { timeout: 30000 }) // รอสูงสุด 30 วินาที
    .contains('Enhance PO')
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  //Navigate to mass product
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  // รอ url
  cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
  // Wait คงที่ตามโค้ดเดิม

  enhanceStepsCallback();
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
};

/**
 * 2. ฟังก์ชันสำหรับไปหน้า Tracking และ Assign งาน
 * --------------------------------------------------
 * หน้าที่: กดเมนู -> ไปหน้า Process Tracking -> รอ Table -> Assign งาน
 */
const assignTaskViaTracking = (
  projectName: string,
  assignee: string,
  billingSystem: string = ''
): void => {
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

  assignTeamTask(projectName, assignee, billingSystem);
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

const performRoleTaskWithAssignment = (
  user: string,
  pass: string,
  assignee: string,
  approveFunction: ApproveFunction,
  BillingSystem: string = ''
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
  assignTaskViaTracking(projectNamePONAME, assignee, BillingSystem);

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

  ClaimProject(projectNamePONAME);
  cy.wait(2000);
  approveFunction(projectNamePONAME);
};


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

const getOntopProjectName = (): string => formattedDateOntop as string;

const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
) => {
  it('CKS role', () => {
    const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard' ? getStandardProjectName : getOntopProjectName;
    // const getProjectName: GetProjectNameFn = () => 'Music PRE Regression 1912';
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
    cy.wait(2000);
    cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');

    cy.scrollTo('bottom');
    cy.wait(2000);
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
      cy.wait(2000);
      cy.scrollTo('bottom');
      cy.wait(2000);
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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);

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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);
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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);
    cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });
};

export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
  if (Module === 'POST') {
    executeCKSRole('standard', 'main', () => { }); // Empty custom steps for this case

    it('CGMD Config IRB role', () => {
      performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB');
    });
    it('CGMD Tester IRB role', () => {
      performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB');
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
        cy.wait(2000);
        cy.scrollTo('bottom');
        cy.wait(2000);
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
      performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS');
    });
    it('CGMD Tester CBS role', () => {
      performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS');
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
        cy.wait(2000);
        cy.scrollTo('bottom');
        cy.wait(2000);
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
    //priorityInternet();
  });
  afterCKSPOST();
};

export const afterMKTontopPOST = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    //priorityInternet();
  });
  afterCKSCommon('POST');
};

export const afterMKTontopENTER = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    //priorityInternet();
  });
  afterCKSCommon('ENTER');
};

export const afterMKTontopMUSIC = (): void => {
  executeCKSRole('standard', 'ontop', () => {

    //priorityInternet();
  });
  afterCKSCommon('MUSIC');
};

export const afterMKTMAINPOST = (): void => {
  executeCKSRole('standard', 'main', () => {
    Tariff();
    //priorityInternet();
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
  //priorityInternet();
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
    //priorityInternet();
    cy.scrollTo('bottom');
    smsCKSPRE();
  });
  afterCKSCommonPRE('ENTER');
};
export const afterMKTontopPREENTERPlugin = (): void => {
  executeCKSRole('ontop', 'ontop', () => {
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    //priorityInternet();
    cy.scrollTo('bottom');
    smsCKSPRE();
  });
  afterCKSPREPlugin('ENTER');
};

export const afterMKTontopPREMUSIC = (): void => {
  executeCKSRole('ontop', 'ontop', () => {
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    //priorityInternet();
    cy.scrollTo('bottom');
    smsCKSPRE();
  });
  afterCKSCommonPRE('MUSIC');
};

const stepsOntopPREUsage = () => {
  cy.wait(7500);
  addauto5gCKS();
  unregister();
  dropdownRecurringCKS();
  diyflagCKS();
  //priorityInternet();
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
  it('CKS role', () => {
    login(cks, ckspass);
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    // const finalProjectName = 'MOB PRE onetime main 1712 1349'
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });
    cy.get('button.btn-sample', { timeout: 30000 }) // รอสูงสุด 30 วินาที
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    cy.get('.loading-curtain', { timeout: 40000000 }).should('not.exist');
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);
    cy.wait(7500);
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    //priorityInternet();
    beforeapproveCKS();
  });

  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOERMain));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTesterMain));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, (projectName) => approveProjectSPADdeploy(projectName)));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};
export const afterMKTMainPRE_NotComplex = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    // const finalProjectName = 'MOB PRE recurring main Plg 0801 2111'
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });
    cy.get('button.btn-sample', { timeout: 30000 }) // รอสูงสุด 30 วินาที
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    cy.get('.loading-curtain', { timeout: 4000000 }).should('not.exist');
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);
    cy.wait(7500);
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    //priorityInternet();
    beforeapproveCKS();
  });
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN'));
};
export const afterMKTOntop_NotComplex = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 1000000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    // const finalProjectName = 'MOB PRE onetime ontop 1901 2145'
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 1000000 });

    // cy.get('button.btn.btn-xs.btn-success', { timeout: 30000 })
    //   .contains('Generate Enhance PO')
    //   .scrollIntoView({ ensureScrollable: false })
    //   .should('be.visible')
    //   .click();
    //   cy.once('window:alert', (alertText) => {
    //     // Verify the alert text
    //     expect(alertText).to.equal('Generate Enhance PO ?');
    //   });

    //   // Handle confirm dialogs (auto-click OK for all popups)
    //   cy.on('window:confirm', () => true);

    cy.get('.loading-curtain', { timeout: 4000000 }).should('not.exist');

    cy.get('button.btn-sample', { timeout: 30000 }) // รอสูงสุด 30 วินาที
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    cy.get('.loading-curtain', { timeout: 4000000 }).should('not.exist');
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    addauto5gCKS();
    // priorityInternet();
    beforeapproveCKS();
  });
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREPlugin, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN'));
};
export const afterMKTOntopEnter_NotComplex = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 1000000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName()
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 1000000 });

    // cy.get('button.btn.btn-xs.btn-success', { timeout: 30000 })
    //   .contains('Generate Enhance PO')
    //   .scrollIntoView({ ensureScrollable: false })
    //   .should('be.visible')
    //   .click();
    //   cy.once('window:alert', (alertText) => {
    //     // Verify the alert text
    //     expect(alertText).to.equal('Generate Enhance PO ?');
    //   });

    //   // Handle confirm dialogs (auto-click OK for all popups)
    //   cy.on('window:confirm', () => true);

    //   cy.get('.loading-curtain', { timeout: 4000000 }).should('not.exist');

    cy.get('button.btn-sample', { timeout: 30000 }) // รอสูงสุด 30 วินาที
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    cy.get('.loading-curtain', { timeout: 4000000 }).should('not.exist');
    cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);
    cy.wait(7500);
    addauto5gCKS();
    dropdownRecurringCKS();
    diyflagCKS();
    unregister();
    addauto5gCKS();
    // //priorityInternet();
    beforeapproveCKS();
  });
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREPlugin, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN'));
};
export const afterCKSPOST = (Module?: string): void => {
  it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
  it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
};
const afterCKSCommon = (Module: string): void => {
  afterCKSPOST(); // Re-use POST logic (CGMD IRB, ACTM, OPER)
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};
const afterCKSCommonPRE_Internal = () => {
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};
const afterCKSCommonPRE_Plugin = () => {
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'PlugIN'));
};
const afterCKSCommonPRE = (Module: string): void => {
  afterCKSCommonPRE_Internal();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};
const afterCKSPREPlugin = (Module: string): void => {
  afterCKSCommonPRE_Plugin();
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
        .select(randomValue, { force: true })
        .should('have.value', randomValue);
    }
  });
};

export const diyflagCKS = () => {
  const isDiyYes = Math.random() < 0.5;
  const diyLabelToClick = isDiyYes ? 'Yes' : 'No';

  cy.log(`DIY Flag Decision: ${diyLabelToClick}`);
  cy.get('input[formcontrolname="diyFlag"]')
    .parent('label')
    .contains(diyLabelToClick)
    .click({ force: true });
  if (!isDiyYes) {
    cy.log('DIY Flag is No. Stopping execution.');
    return;
  }
  const isValidityYes = Math.random() < 0.5;
  const validityLabelToClick = isValidityYes ? 'Yes' : 'No';

  cy.log(`Validity Flag Decision: ${validityLabelToClick}`);

  cy.get('input[formcontrolname="validityFlag"]')
    .parent('label')
    .contains(validityLabelToClick)
    .click({ force: true });

  if (!isValidityYes) {
    cy.log('Validity Flag is No. Stopping execution.');
    return;
  }
  const isCBS = Math.random() < 0.5;
  const rewardLabel = isCBS ? 'CBS' : 'PlugIN/PHX';

  cy.log(`Reward Via Decision: ${rewardLabel}`);

  cy.get('input[formcontrolname="rewardVia"]')
    .parent('label')
    .contains(rewardLabel)
    .click({ force: true });
  // 1. Find and alias the correct, visible dropdown
  cy.get('mat-select[formcontrolname="validityPackage"]')
    .filter(':visible')
    .as('activeDropdown') // Give it a name (Alias)
    .click();

  // 2. Select the random option
  cy.get('mat-option:not(.mat-option-disabled)')
    .should('have.length.gt', 0)
    .then(($options) => {
      const optionCount = $options.length;
      const randomIndex = Math.floor(Math.random() * optionCount);

      // Capture the text to verify later
      const selectedText = $options.eq(randomIndex).text().trim();
      cy.log(`Expecting to select: ${selectedText}`);

      // Click the option
      cy.wrap($options)
        .eq(randomIndex)
        .scrollIntoView()
        .click({ force: true });

      // 3. Verification: Look INSIDE the aliased dropdown only
      // This ensures we check the same element we just clicked
      cy.get('@activeDropdown')
        .find('.mat-select-value')
        .should('contain.text', selectedText);

    });
  // cy.contains('label', 'CBS')
  //   .find('input[type="radio"]')
  //   .check({ force: true });

  // cy.get('mat-select[formcontrolname="validityPackage"]').eq(1).click();

  // cy.get('mat-option')
  //   .contains('3801424 | 862770')
  //   .click();

  // cy.get('mat-select[formcontrolname="validityPackage"] .mat-select-value')
  //   .should('contain.text', '3801424 | 862770');
}

export const smsCKSPRE = () => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.log('featureDescription')
  // cy.get('textarea[formcontrolname="featureDescription"]')
  //   .clear()
  //   .type('feature description');
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
  cy.get('body').then(($body) => {
    if ($body.text().includes('UnRegister (Hold)')) {
      cy.contains('label', 'UnRegister (Hold)')
        .closest('.form-group')
        .find('input[type="radio"]')
        .then(($radios) => {
          const randomIndex = Math.floor(Math.random() * $radios.length);
          cy.wrap($radios[randomIndex]).check({ force: true });
          const selectedText = $radios[randomIndex].parentElement!.innerText.trim();
          cy.log(`Randomly selected: ${selectedText}`);
        });
    } else {
      cy.log('UnRegister (Hold) not found, skipping...');
    }
  });
}

export const RetryPattern = () => {
  cy.get('.scrollmenu > .nav')
    .contains('Retry Pattern')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
    .should(($select) => {
      const options = $select.find('option');
      expect(options.length).to.be.greaterThan(1);
    })
    .find('option:not(:disabled)')
    .then(($options) => {
      // 1. สุ่มค่า Dropdown แรก
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;

      cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
        .select(randomValue);

      cy.log(`Randomly selected: ${randomValue}`);

      // -------------------------------------------------------
      // 2. เช็คเงื่อนไขและจัดการ mat-select
      // -------------------------------------------------------
      if (randomValue.includes('Change to Other Main Promotion')) {

        // คลิกเปิด Dropdown ตัวที่สอง
        cy.contains('label', 'Change to Other Main Promotion Details')
          .parent()
          .next()
          .find('mat-select')
          .click();

        // รอให้ Choice เด้งขึ้นมา แล้วสุ่มเลือก
        cy.get('mat-option')
          .should('be.visible')
          .then(($matOptions) => {
            const matRandomIndex = Math.floor(Math.random() * $matOptions.length);

            // แก้ไข: ใส่ { force: true } เพื่อแก้ปัญหา Element hidden from view
            cy.wrap($matOptions[matRandomIndex]).click({ force: true });

            cy.log('Randomly selected sub-promotion');
          });
      }
    });
};

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
  cy.wait(2000)
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
  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: '1.txt',
        mimeType: 'application/txt',
      },
      { force: true }
    );
  });
  beforeapproveMKT();
};

export const Randomdropdown = () => {
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="ontopConditionGroup"]';
    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          cy.get(selector).select(validOptions[randomIndex]);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="billPeriod"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const selectedValue = validOptions[randomIndex];

          cy.log(`Randomly selected Bill Period: ${selectedValue}`);

          // สั่ง Select ค่าที่สุ่มได้
          cy.get(selector).select(selectedValue);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });
  cy.get('body').then(($body) => {
    const tabSelector = 'a:contains("Money / Validity")';

    if ($body.find(tabSelector).length > 0) {
      cy.get(tabSelector).click();

      // คลิกปุ่ม +
      cy.get('button .glyphicon-plus').parent().click();

      // --- 1. Main Balance ---
      const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
      cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());

      // --- 2. Validity Main Balance & Unit ---
      cy.get('input[formcontrolname="validityFirstPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validityFirstPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement เพื่อเรียกใช้ .value ได้
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 3. Reward Balance ---
      const randomBalance2 = Math.floor(Math.random() * 500) + 50;
      cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());

      // --- 4. Validity Reward Balance & Unit ---
      cy.get('input[formcontrolname="validitySecondPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validitySecondPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 5. Usage Types (Dual List Box) ---
      cy.get('select[formcontrolname="availableListBox"]').then($select => {
        const options = $select.find('option');
        if (options.length > 0) {
          const randomIndex = Math.floor(Math.random() * options.length);
          // แก้ไข: Cast เป็น HTMLOptionElement
          const val = (options[randomIndex] as HTMLOptionElement).value;

          cy.get('select[formcontrolname="availableListBox"]').select(val);
          cy.get('button.str').click(); // ปุ่มเลื่อนไปขวา
        }
      });

      // --- 6. Description ---
      const randomDesc = `AutoTest_${Math.random().toString(36).substring(7)}`;
      cy.get('textarea[formcontrolname="balanceDescription"]').type(randomDesc);

      // --- กด Add ---
      cy.get('button').contains('Add').click();

    } else {
      cy.log('Skipped: Tab Money / Validity not found');
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .then($options => {
          const validOptions = [...$options]
            .map(o => (o as HTMLOptionElement).value)
            .filter(val => val !== '0: null');
          if (validOptions.length > 0) {
            const randomIndex = Math.floor(Math.random() * validOptions.length);
            cy.get(selector).select(validOptions[randomIndex]);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="recurringFeeDeduction"]';
    const $element = $body.find(selector);
    if ($element.length > 0 && $element.is(':visible')) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then(($options) => {
          const randomIndex = Math.floor(Math.random() * $options.length);
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
          cy.get(selector).select(valueToSelect);
        });
    } else {
      cy.log(`Skipped: ${selector} is not visible or not found`);
    }
  });
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="earlyRenewOfferingFlag"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="poType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });


  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;

            cy.get(selector).select(valueToSelect, { force: true });
          }
        });
    }
  });

}

const processRatingSection = (
  componentSelector: string,
  sectionName: string,
  fillFormCallback?: () => void
) => {
  cy.get(componentSelector, { timeout: 15000 })
    .should('exist')
    .within(() => {
      cy.get('.collapse-panel').then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading')
            .contains(sectionName)
            .click({ force: true });
          cy.get('.collapse-panel').should('be.visible');
        }
      });

      // 2. Click Add Button
      cy.get('button:has(.glyphicon-plus)').click({ force: true });

      // 3. Fill Form (Execute callback if provided)
      if (fillFormCallback) {
        fillFormCallback();
      }

      // 4. Submit
      cy.get('button[type="submit"]')
        .contains('Add')
        .click({ force: true });
    });
};

export const RandomProductSpecification = () => {
  const targetList = [
    // "AIS Secure Net",
    // "Apple Care",
    // "Cloud PC",
    // "Flowaccount",
    // "MS365 Copilot",
    // "Mobile Care",
    // "Ubisoft Plus",
    // "Voice",
    // "SMS",
    // "MMS",
    "Vertical App"
  ];
  const selectedProducts: string[] = [];

  cy.contains('.panel-heading', '*Product Specification')
    .closest('.panel')
    .within(() => {
      cy.get('select[formcontrolname="availableListBox"] option')
        .then($options => {
          const allTexts = $options.toArray().map(el => (el as HTMLOptionElement).innerText.trim());
          const validTexts = allTexts.filter(text => targetList.includes(text));

          if (validTexts.length > 0) {
            const randomCount = Cypress._.random(1, validTexts.length);
            const selectedTexts = Cypress._.sampleSize(validTexts, randomCount);

            selectedTexts.forEach((itemText) => {
              cy.log(`Processing: ${itemText}`);

              cy.get('select[formcontrolname="availableListBox"]')
                .contains('option', itemText)
                .dblclick({ force: true });

              cy.wait(500);
              selectedProducts.push(itemText);
            });
          }
        });
    })
    .then(() => {
      if (selectedProducts.includes('Voice')) {
        Voice();
      }
      if (selectedProducts.includes('SMS')) {
        Sms();
      }
      if (selectedProducts.includes('MMS')) {
        Mms();
      }
      if (selectedProducts.includes('Vertical App')) { 
        VerticalApp();
      }
    });
};

export const Voice = () => {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {

      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Voice$/)
        .click({ force: true });

      const fillRatingForm = () => {
        cy.get('input[formcontrolname="rateExcludingVAT"]', { timeout: 10000 })
          .should('be.visible')
          .clear({ force: true })
          .type(Cypress._.random(0.5, 50.0).toFixed(2), { force: true })
          .blur({ force: true });

        cy.get('select[formcontrolname="rateUnit"]', { timeout: 10000 })
          .should('exist')
          .then(($select) => {
            const val = $select.find('option:not([disabled])').first().val();
            cy.wrap($select).select(val as string, { force: true });
          });
      };
      processRatingSection('app-mass-mkt-voice-rating', 'Voice Rating', fillRatingForm);
      processRatingSection('app-mass-mkt-vdo-call-rating', 'VDO Call Rating', fillRatingForm);
      processRatingSection('app-mass-mkt-landline-rating', 'Landline Rating', fillRatingForm);
    }
  });
};

export const Sms = () => {
  const processFreeResource = () => {
    // 1. เปิด Dropdown
    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.wait(500);
        }
      });

      cy.get('button:has(.glyphicon-plus)').click({ force: true });
      cy.wait(500);
      cy.get('mat-select .mat-select-trigger').click({ force: true });
    });
    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .then(($options) => {
        if ($options.length > 0) {
          const randomIndex = Cypress._.random(0, $options.length - 1);
          cy.wrap($options.eq(randomIndex))
            .scrollIntoView()
            .click({ force: true });
        } else {
          cy.log('❌ No valid options found');
        }
      });

    // 3. กดปุ่ม Add
    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.wait(500);
      cy.contains('button', 'Add').click({ force: true });
    });
  };

  const fillRatingSection = (headerText: string, controlName: string) => {
    cy.get('app-mass-mkt-sms-rating').within(() => {
      cy.contains('.panel-heading', headerText)
        .closest('.panel')
        .within(() => {
          cy.get('.collapse-panel').then(($panel) => {
            if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
              cy.get('.panel-heading').click({ force: true });
              cy.get('.collapse-panel').should('be.visible');
            }
          });

          cy.get(`input[formcontrolname="${controlName}"]`)
            .should('exist')
            .clear({ force: true })
            .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
            .blur({ force: true });
        });
    });
  };

  // --- Main Execution SMS ---
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^SMS$/)
        .click({ force: true });

      processFreeResource();
      cy.get('app-mass-mkt-sms-rating').within(() => {
        cy.get('.collapse-panel').first().then(($mainPanel) => {
          if ($mainPanel.outerHeight() === 0 || $mainPanel.css('display') === 'none') {
            cy.get('.panel-heading').first().click({ force: true });
            cy.wait(500);
          }
        });
      });
      fillRatingSection('SMS Rating', 'smsExcludingVat');
      fillRatingSection('SMS Delivery Report Rating', 'smsdrExcludingVat');
      fillRatingSection('iSMS Rating', 'iSmsExcludingVat');
    }
  });
};
export const Mms = () => {
  const processFreeResource = () => {
    // 1. จัดการ Free Resource (คล้าย SMS)
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.wait(500);
        }
      });

      // กดปุ่ม + เพื่อเพิ่ม
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
      cy.wait(500);

      // กดเปิด Dropdown (ใช้ mat-select)
      cy.get('mat-select .mat-select-trigger').click({ force: true });
    });

    // เลือก Option แบบสุ่ม
    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .then(($options) => {
        if ($options.length > 0) {
          const randomIndex = Cypress._.random(0, $options.length - 1);
          cy.wrap($options.eq(randomIndex))
            .scrollIntoView()
            .click({ force: true });
        } else {
          cy.log('❌ No valid options found for MMS Free Resource');
        }
      });

    // กดปุ่ม Add
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.wait(500);
      cy.contains('button', 'Add').click({ force: true });
    });
  };

  const fillMmsRatingInput = (controlName: string) => {
    cy.get(`input[formcontrolname="${controlName}"]`)
      .should('exist')
      .clear({ force: true })
      .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
      .blur({ force: true });
  };

  // --- Main Execution MMS ---
  cy.get('body', { timeout: 10000 }).then(($body) => {
    // เช็คว่ามี Tab อยู่ไหม
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {

      // 1. คลิก Tab MMS
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^MMS$/)
        .click({ force: true });

      // 2. ทำ MMS Free Resource
      processFreeResource();

      // 3. ทำ MMS Rating 
      // (ตาม requirement: ไม่ต้องกดเปิด panel rating ให้กรอกเลย)
      cy.get('app-mass-mkt-mms-rating').within(() => {
        // กรอก MMS Excluding VAT
        fillMmsRatingInput('mmsExcludingVat');

        // กรอก MMS Delivery Report Excluding VAT
        fillMmsRatingInput('mmsdrExcludingVat');

        // กรอก MMS Read & Reply Excluding VAT
        fillMmsRatingInput('mmsrrExcludingVat');
      });
    }
  });
};
export const VerticalApp = () => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Vertical App$/)
    .click({ force: true });

  cy.get('app-mass-mkt-vertical-app').within(() => {
    cy.get('.collapse-panel').then(($panel) => {
      if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
        cy.get('.panel-heading').click({ force: true });
      }
    });

    // กดปุ่ม +
    cy.get('button:has(.glyphicon-plus)').click({ force: true });
    cy.wait(500);

    cy.get('select[formcontrolname="VerticalAppQuotaType"]')
      .should('be.visible')
      .then(($select) => {
        const $options = $select.find('option:not([disabled])');
        const randomOption = Cypress._.sample($options.toArray());
        
        if (randomOption) {
          const $opt = Cypress.$(randomOption);
          const val = $opt.val() as string;
          const text = $opt.text().trim(); // ดึง Text ออกมาเตรียมไว้เลย

          cy.wrap($select).select(val, { force: true });
          
          // บันทึก Text เก็บไว้ใน Alias แทน Value หรือ Element
          cy.wrap(text).as('selectedQuotaTypeText'); 
        }
      });

    // กดเปิด Dropdown ของ Material (Application List)
    cy.get('mat-select[aria-label="Please Select"] .mat-select-trigger').click({ force: true });
  });

  // เลือก Application จาก Dropdown (อยู่นอก within เพราะ mat-option render ที่ body)
  cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 }).then(($options) => {
    if ($options.length > 0) {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      cy.wrap($options.eq(randomIndex)).click({ force: true });
    }
  });

  // กลับเข้ามาทำงานในส่วน Vertical App ต่อ
  cy.get('app-mass-mkt-vertical-app').within(() => {
    // Checkbox 5G

    cy.contains('label', '5G')
      .find('input[type="checkbox"]')
      .then(($checkbox) => {
        const shouldSelect = Cypress._.random(0, 1) === 1;
        if (shouldSelect) {
          cy.wrap($checkbox).check({ force: true });
        } else {
          cy.wrap($checkbox).uncheck({ force: true });
        }
      });

    // เลือก Speed
    cy.get('select[formcontrolname="commuSpeed"]').then(($select) => {

      const $options = $select.find('option:not([disabled])');
      const randomOption = Cypress._.sample($options.toArray());
      if (randomOption) {
        const value = Cypress.$(randomOption).val() as string;
        cy.wrap($select).select(value, { force: true });
      }
    });

    cy.get('@selectedQuotaTypeText').then((quotaText) => {
      if (String(quotaText).trim() === 'Unlimited Data (Throttling Speed)') {
        
        cy.get('select[formcontrolname="commuThrottlingSpeed"]', { timeout: 5000 })
          .should('be.visible')
          .then(($select) => {
            const $options = $select.find('option:not([disabled])');
            const randomOption = Cypress._.sample($options.toArray());
            if (randomOption) {
              const value = Cypress.$(randomOption).val() as string;
              cy.wrap($select).select(value, { force: true });
            }
          });
      }
    });

    cy.wait(500);
    cy.get('button.btn-primary')
      .contains('Add')
      .click({ force: true });
  });
};