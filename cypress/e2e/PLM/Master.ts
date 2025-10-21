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

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
export let formattedDateMain = '';
export let formattedDateOntop = '';

export const clamProject = (formattedDate: string): void => {
  cy.get('h3', { timeout: 100000 }).contains('Unassigned Task')
    .should('be.visible')
    .parent()
    .within(() => {

      cy.get('tbody tr', { timeout: 60000 }).should('exist').each(($row: JQuery<HTMLElement>) => {
        if ($row.text().includes(formattedDate)) {
          cy.wrap($row)
            .find('button.btn.btn-circle.btn-xs.btn-success.claim-top')
            .should('be.visible')
            .click();
          return false;
        }
      });
    });
};
export function assignTeamTask(taskIdentifier: string, assignee: string): void {
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  cy.window().then((win) => {
    cy.stub(win, 'alert').as('alertStub');
  });

  cy.get('h3').contains('Team Task').should('be.visible');
  // cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // cy.contains('tr', taskIdentifier).as('taskRow');

  // โค้ดใหม่
  const partialIdentifier = taskIdentifier.split('_')[0]; // ตัดเอาเฉพาะส่วนหน้า "_NEW"
  cy.log(`Searching for task using partial identifier: "${partialIdentifier}"`); // เพิ่ม log เพื่อให้เห็นค่าที่ใช้ค้นหาจริง
  cy.contains('tr', partialIdentifier).as('taskRow');
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

    cy.log(`✅ Successfully selected: ${assignee}`);

    cy.get('@taskRow').contains('span', 'Set').click();
  });
  cy.get('@alertStub').should('have.been.calledWith', 'Reassign success');
}
export const ClaimProjectCKS = (formattedDate: string): void => {
  cy.get('h3')
    .contains('Unassigned Task', { timeout: 100000 })
    .parent()
    .within(() => {
      cy.get('tbody tr').should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

      cy.log(`🔍 Searching for: "${formattedDate}"`);

      // Debug: แสดงทุก row
      cy.get('tbody tr').then(($rows) => {
        cy.log(`📊 Total rows: ${$rows.length}`);
        $rows.each((index, row) => {
          const text = Cypress.$(row).text().trim();
          cy.log(`Row ${index}: ${text.substring(0, 100)}`);
          if (text.includes(formattedDate)) {
            cy.log(`✅✅✅ MATCH at row ${index}`);
          }
        });
      });

      // ทำงานจริง
      cy.get('tbody tr').each(($row, index) => {
        const rowText = $row.text().trim();

        if (rowText.includes(formattedDate)) {
          cy.log(`🎯 Clicking claim button at row ${index}`);
          cy.wrap($row).find('button.claim-top').should('be.visible').click();
          return false;
        }
      });
    });
};
export const approveProject = (projectName: string): void => {
  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          .should('be.visible')
          .click();
      });
  });
};
export const approveProjectSPADSup = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว/cgmd/cgmd-spad
  cy.url({ timeout: 600000 }).should('include', '/cgmd/cgmd-spad');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll

  // 1. Random 5-digit number (from 10000 to 99999)
  const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;

  // 2. Random 2-digit number (from 10 to 99)
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
  cy.wait(3000)
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.contains('button', 'Approve as complex', { timeout: 30000 })
    .should('be.visible')
    .click();
  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');
};
export const approveProjectSPADDOER = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  cy.url({ timeout: 600000 }).should('include', '/cgmd/cgmd-configure');

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {

        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });

  // Gprs type
  cy.contains('label', 'Gprs type')
    .parent()
    .next('div')
    .find('mat-select')
    .click();

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
  cy.wait(2000);
  // Template
  cy.contains('label', 'Template')
    .parent()
    .next('div')
    .find('mat-select')
    .click();

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
  cy.scrollTo('bottom');
  cy.wait(3000)
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.contains('button', 'Promote To SPAD Tester', { timeout: 30000 })
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');
};
export const approveProjectSPADDOERMain = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  cy.url({ timeout: 600000 }).should('include', '/cgmd/cgmd-configure');

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {

        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input').type('PT' + Math.floor(Math.random() * 90000) + 10000);
  cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + Math.floor(Math.random() * 90000) + 10000);
  cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input').type('PST' + Math.floor(Math.random() * 90000) + 10000);
  // Gprs type
  cy.contains('label', 'Gprs type')
    .parent()
    .next('div')
    .find('mat-select')
    .click();

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
  cy.wait(2000);
  // Template
  cy.contains('label', 'Template')
    .parent()
    .next('div')
    .find('mat-select')
    .click();

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
  cy.scrollTo('bottom');
  cy.wait(3000)
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.contains('button', 'Promote To SPAD Tester', { timeout: 30000 })
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');
};
export const approveProjectSPADTester = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  cy.url({ timeout: 600000 }).should('include', '/cgmd/cgmd-tester');

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.scrollTo('bottom');
  cy.wait(3000)

  cy.contains('button', 'Promote to SPAD Deploy', { timeout: 30000 })
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');
};
export const approveProjectSPADTesterMain = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  cy.url({ timeout: 600000 }).should('include', '/cgmd/cgmd-tester');

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.scrollTo('bottom');
  cy.wait(3000)

  cy.contains('button', 'Send PlugIN', { timeout: 30000 })
    .should('be.visible')
    .click();

  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  cy.wait(100000)

  // cy.contains('button', 'Promote to SPAD Deploy', { timeout: 30000 })
  //   .should('be.visible')
  //   .click();

  // // verify alert
  // cy.on('window:alert', (txt) => {
  //   expect(txt).to.contain('Approve and Send Mail Notify Success');
  // });

  // // verify redirect กลับ workspace
  // cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // // Click the Logout button
  // cy.contains('button', 'Logout')
  //   .should('be.visible')
  //   .click();

  // // Wait for the URL to change to the login page
  // cy.url().should('include', '/login');
};
export const approveProjectSPADdeploy = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  cy.url({ timeout: 600000 }).should('include', '/actm/actm-doer');

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  cy.log('Page loaded successfully. Scrolling to bottom.');

  cy.scrollTo('bottom');
  cy.wait(3000)

  cy.contains('button', 'Promote To ACTM', { timeout: 30000 })
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');
};

export const approveProjectCGMD = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/cgmd/cgmd-configure');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)

  // Click ปุ่ม Approve To CGMD
  // cy.contains('button', 'Approve To CGMD', { timeout: 30000 })
  //   .should('be.visible')
  //   .click();
  cy.get('button[name="CBS"]')
    .should('be.visible', { timeout: 30000 })
    .click();

  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

};
export const approveProjectCGMDPRE = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/cgmd/cgmd-configure');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  cy.log('Page loaded successfully. Scrolling to bottom.');
  const maxDigits = 12;
  const numDigits = Math.floor(Math.random() * maxDigits) + 1;

  // 2. Calculate the smallest and largest possible numbers for that length
  //    - For example, if numDigits is 4, the range is 1000 to 9999.
  //    - If numDigits is 1, the range is 1 to 9.
  const min = Math.pow(10, numDigits - 1);
  const max = Math.pow(10, numDigits) - 1;

  // 3. Generate a random whole number within that calculated range
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // --- Your Cypress Command ---

  cy.contains('label', 'CBS_OFFERING_ID')
    .closest('.col-md-4')
    .find('input')
    .type(randomNumber.toString());

  cy.contains('label', 'CBS_OFFERING_ID')
    .closest('.col-md-4')
    .find('a.btn')
    .first()
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)
  // Click ปุ่ม Approve To CGMD
  cy.contains('button', 'Approve To CGMD', { timeout: 30000 })
    .should('be.visible')
    .click();

  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

};
export const approveProjectCGMDtesterProACTM = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/cgmd/cgmd-tester');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)

  // Click ปุ่ม Approve To CGMD
  // cy.contains('button', 'Promote To ACTM', { timeout: 30000 })
  //   .should('be.visible')
  //   .click();
  cy.contains('span', 'Promote to ACTM')
    .should('be.visible')
    .click({ force: true });

  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');


};
export const approveProjectCGMDtesterProPRE = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/cgmd/cgmd-tester');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)

  // Click ปุ่ม Approve To CGMD
  cy.contains('button', 'Promote To Pre Go Live', { timeout: 30000 })
    .should('be.visible')
    .click();

  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');


};
export const approveProjectCGMDACTM = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('Unassigned Task').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/actm/actm-doer');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)
  // Click ปุ่ม Approve To CGMD
  cy.get(':nth-child(3) > :nth-child(4)').click();
  // cy.contains('button', 'Promote To OPER', { timeout: 30000 })
  // .should('be.visible')
  // .click();

  // cy.contains('button', 'Yes')
  //   .should('be.visible')
  //   .click();
  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

};
export const approveProjectCGMDACTMPRE = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains('Unassigned Task').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/actm/actm-doer');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        // ตรวจสอบว่า response มีค่า
        expect(interception.response, `API ${interception.request.url} should have response`).to.exist;

        // ใช้ non-null assertion (!) เพื่อให้ TypeScript ไม่เตือน
        expect(interception.response!.statusCode, `API ${interception.request.url} should return 200`).to.eq(200);
      });
    });
  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.get(':nth-child(3) > :nth-child(4)').click();
  // cy.contains('button', 'Promote To APO', { timeout: 30000 })
  //   .should('be.visible')
  //   .click();

  // cy.contains('button', 'Yes')
  //   .should('be.visible')
  //   .click();
  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

};
export const approveProjectCGMDOPER = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains('Unassigned Task').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/oper/oper-doer');

  // รอ API ที่สำคัญของหน้า Detail โหลดให้ครบทั้งหมดในครั้งเดียว
  // เป็นวิธีที่เสถียรกว่าการรอ API ทั่วไปแบบไม่เจาะจง
  // This will return an array, and your .forEach loop would work correctly

  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)
  // Click ปุ่ม Approve To PreGolive

  cy.get('.col-md-6 > :nth-child(3)').click();

  // cy.contains('button', 'Yes')
  //   .should('be.visible')
  //   .click();
  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

};
export const approveProjectCGMDAPO = (projectName: string): void => {
  // --- 1. ตั้งค่าการดักจับ API ที่สำคัญก่อนเริ่มเทส ---
  // ดักจับ API ที่ใช้โหลดข้อมูล To Do List ทั้งหมด
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  // ดักจับ API ที่จะถูกเรียกหลังจากเปิดโปรเจกต์แล้ว
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains('Unassigned Task').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          // .should('be.visible')
          .click();
      });
  });
  // --- 3. รอให้หน้าใหม่โหลดเสร็จสมบูรณ์ ---
  // ตรวจสอบว่า URL เปลี่ยนไปยังหน้าที่คาดหวังแล้ว
  cy.url({ timeout: 60000 }).should('include', '/apo/apo-doer');

  // --- 4. ทำ Action สุดท้ายหลังจากทุกอย่างพร้อมแล้ว ---
  // เมื่อมั่นใจว่าหน้าโหลดสมบูรณ์แล้ว จึงค่อย Scroll
  cy.log('Page loaded successfully. Scrolling to bottom.');
  cy.scrollTo('bottom');
  cy.wait(3000)

  // Click ปุ่ม Approve To PreGolive
  cy.contains('button', 'Promote To Pre Go Live').click();

  // cy.contains('button', 'Yes')
  //   .should('be.visible')
  //   .click();
  // verify alert
  cy.on('window:alert', (txt) => {
    expect(txt).to.contain('Approve and Send Mail Notify Success');
  });

  // verify redirect กลับ workspace
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

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
export const login = (username: string, password: string): void => {
  cy.get('input[name="userId"]').type(username);
  cy.get('input[name="pwd"]').type(password);
  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');
  cy.get(':nth-child(4) > .btn').click();
  cy.wait('@getErrorCodes', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
}
// export const ProjectBasicInformationMain = (PriceType: string, ProductClass: string) => {
//   //Login
//   login(MKTpost, MKTpost1);

//   // create New Project
//   cy.get('.col-md-10 > .btn').should('be.visible').click();
//   // อัปเดตค่าตัวแปร global
//   formattedDateMain = `Mob POST Reg ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // log และ type ชื่อโปรเจกต์
//   cy.log(formattedDateMain);
//   cy.get('input[formcontrolname="projectName"]').type(formattedDateMain);

//   // เก็บใน env ด้วย เผื่อใช้ในเทสต์อื่น
//   Cypress.env('formattedDateMain', formattedDateMain);

//   // Date
//   const date = new Date();
//   date.setDate(date.getDate() + 1);

//   // Format the date as 'dd/mm/yyyy'
//   const formattedDateMain1 = date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   });

//   //PLM1
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.get('input[aria-label="Date input field"]').type(formattedDateMain1);
//   //PLM2
//   // cy.get('input[name="expectedDate"]').type(formattedDateMain1);
//   cy.wait(2000)

//   // phone 
//   // For Thai mobile format: 0X-XXXX-XXXX
//   const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
//   cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);
//   // button Save
//   cy.get('button[type="button"]').contains('Save').click();

//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(2000)
//   //button Close
//   cy.get('.modal-body > :nth-child(1) > div > .btn').click();

//   // Button Add Project 
//   cy.get(':nth-child(4) > .btn').click();
//   // 3. Combine the parameters and the formatted date/time into a single string
//   const formattedDateMainPONAME = `${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // PO Name 
//   cy.get('input[formcontrolname="productName"]').type(formattedDateMainPONAME);
//   Cypress.env('formattedDateMainPONAME', formattedDateMainPONAME);
//   //PO Sub group
//   // Product Offering
//   cy.get('select[formcontrolname="promotionSubGroupFrom"]').select('Product Offering').should('have.value', 'Product Offering');
//   // Order Fee
//   // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
//   //Service
//   // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

//   //button create 
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   // Trigger the button click action
//   cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   // Wait for URL change (wait for the page reload or redirection)
//   cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
//   // Intercept new requests triggered by the new URL
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

//   // Wait for the new requests after URL change
//   cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(10000)
// }
// export const ProjectBasicInformationOntop = (PriceType: string, ProductClass: string) => {
//   //Login
//   login(MKTpost, MKTpost1);

//   // create New Project
//   cy.get('.col-md-10 > .btn').should('be.visible').click();
//   // อัปเดตค่าตัวแปร global
//   formattedDateOntop = `Mob POST Reg ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // log และ type ชื่อโปรเจกต์
//   cy.log(formattedDateOntop);
//   cy.get('input[formcontrolname="projectName"]').type(formattedDateOntop);

//   // เก็บใน env ด้วย เผื่อใช้ในเทสต์อื่น
//   Cypress.env('formattedDate', formattedDateOntop);

//   // Date
//   const date = new Date();
//   date.setDate(date.getDate() + 1);

//   // Format the date as 'dd/mm/yyyy'
//   const formattedDateOntop1 = date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   });

//   //PLM1
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.get('input[aria-label="Date input field"]').type(formattedDateOntop1);
//   //PLM2
//   // cy.get('input[name="expectedDate"]').type(formattedDateMain1);
//   cy.wait(2000)

//   // phone 
//   // For Thai mobile format: 0X-XXXX-XXXX
//   const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
//   cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);
//   // button Save
//   cy.get('button[type="button"]').contains('Save').click();

//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

//   cy.wait(2000)

//   //button Close
//   cy.get('.modal-body > :nth-child(1) > div > .btn').click();

//   // Button Add Project 
//   cy.get(':nth-child(4) > .btn').click();

//   // 3. Combine the parameters and the formatted date/time into a single string
//   const formattedDateOntopPONAME = `${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // PO Name 
//   cy.get('input[formcontrolname="productName"]').type(formattedDateOntopPONAME);
//   Cypress.env('formattedDateOntopPONAME', formattedDateOntopPONAME);
//   //PO Sub group
//   // Product Offering
//   cy.get('select[formcontrolname="promotionSubGroupFrom"]').select('Product Offering').should('have.value', 'Product Offering');
//   // Order Fee
//   // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
//   //Service
//   // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

//   //button create 
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   // Trigger the button click action
//   cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   // Wait for URL change (wait for the page reload or redirection)
//   cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
//   // Intercept new requests triggered by the new URL
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

//   // Wait for the new requests after URL change
//   cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(5000)
// }
// export const ProjectBasicInformationPREOntop = (PriceType: string, ProductClass: string) => {
//   //Login
//   login(MKTpre, MKTpre1);

//   // create New Project
//   cy.get('.col-md-10 > .btn').should('be.visible').click();
//   // อัปเดตค่าตัวแปร global
//   formattedDateOntop = `Mob PRE Reg ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // log และ type ชื่อโปรเจกต์
//   cy.log(formattedDateOntop);
//   cy.get('input[formcontrolname="projectName"]').type(formattedDateOntop);

//   // เก็บใน env ด้วย เผื่อใช้ในเทสต์อื่น
//   Cypress.env('formattedDate', formattedDateOntop);

//   // Date
//   const date = new Date();
//   date.setDate(date.getDate() + 1);

//   // Format the date as 'dd/mm/yyyy'
//   const formattedDateOntop1 = date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   });

//   //PLM1
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.get('input[aria-label="Date input field"]').type(formattedDateOntop1);
//   //PLM2
//   // cy.get('input[name="expectedDate"]').type(formattedDateMain1);
//   cy.wait(2000)

//   // phone 
//   // For Thai mobile format: 0X-XXXX-XXXX
//   const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
//   cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);
//   // button Save
//   cy.get('button[type="button"]').contains('Save').click();

//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

//   cy.wait(2000)
//   //button Close
//   cy.get('.modal-body > :nth-child(1) > div > .btn').click();

//   // Button Add Project 
//   cy.get(':nth-child(4) > .btn').click();

//   // 3. Combine the parameters and the formatted date/time into a single string
//   const formattedDateOntopPONAME = `${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // PO Name 
//   cy.get('input[formcontrolname="productName"]').type(formattedDateOntopPONAME);
//   Cypress.env('formattedDateOntopPONAME', formattedDateOntopPONAME);
//   //PO Sub group
//   // Product Offering
//   cy.get('select[formcontrolname="promotionSubGroupFrom"]').select('Product Offering').should('have.value', 'Product Offering');
//   // Order Fee
//   // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
//   //Service
//   // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

//   //button create 
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   // Trigger the button click action
//   cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   // Wait for URL change (wait for the page reload or redirection)
//   cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
//   // Intercept new requests triggered by the new URL
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

//   // Wait for the new requests after URL change
//   cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(5000)
// }
// export const ProjectBasicInformationPREMain = (PriceType: string, ProductClass: string) => {
//   //Login
//   login(MKTpre, MKTpre1);

//   // create New Project
//   cy.get('.col-md-10 > .btn').should('be.visible').click();
//   // อัปเดตค่าตัวแปร global
//   formattedDateMain = `Mob PRE Reg ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // log และ type ชื่อโปรเจกต์
//   cy.log(formattedDateMain);
//   cy.get('input[formcontrolname="projectName"]').type(formattedDateMain);

//   // เก็บใน env ด้วย เผื่อใช้ในเทสต์อื่น
//   Cypress.env('formattedDateMain', formattedDateMain);

//   // Date
//   const date = new Date();
//   date.setDate(date.getDate() + 1);

//   // Format the date as 'dd/mm/yyyy'
//   const formattedDateMain1 = date.toLocaleDateString('en-GB', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//   });

//   //PLM1
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.get('input[aria-label="Date input field"]').type(formattedDateMain1);
//   //PLM2
//   // cy.get('input[name="expectedDate"]').type(formattedDateMain1);
//   cy.wait(2000)

//   // phone 
//   // For Thai mobile format: 0X-XXXX-XXXX
//   const randomPhone = `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
//   cy.get('input[formcontrolname="phoneNo"]').type(randomPhone);
//   // button Save
//   cy.get('button[type="button"]').contains('Save').click();

//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(2000)
//   //button Close
//   cy.get('.modal-body > :nth-child(1) > div > .btn').click();

//   // Button Add Project 
//   cy.get(':nth-child(4) > .btn').click();
//   // 3. Combine the parameters and the formatted date/time into a single string
//   const formattedDateMainPONAME = `${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;

//   // PO Name 
//   cy.get('input[formcontrolname="productName"]').type(formattedDateMainPONAME);
//   Cypress.env('formattedDateMainPONAME', formattedDateMainPONAME);
//   //PO Sub group
//   // Product Offering
//   cy.get('select[formcontrolname="promotionSubGroupFrom"]').select('Product Offering').should('have.value', 'Product Offering');
//   // Order Fee
//   // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
//   //Service
//   // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

//   //button create 
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   // Trigger the button click action
//   cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   // Wait for URL change (wait for the page reload or redirection)
//   cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
//   // Intercept new requests triggered by the new URL
//   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
//   cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

//   // Wait for the new requests after URL change
//   cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
//   cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
//   cy.wait(10000)
// }

export const ProjectBasicInformationComplete = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  ProductClass: 'main' | 'ontop' | 'ontopextra',
  options: {
    type: 'Main' | 'Ontop' | 'OntopExtra',
    segment: 'POST' | 'PRE' | 'ENTER' | 'MUSIC',
    subSegment?: 'POST' | 'PRE',
    autoSetDuration?: boolean
  }
) => {
  const { type, segment, subSegment, autoSetDuration = false } = options;

  // --- Login ---
  const credentials = (() => {
    switch (segment) {
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

  const prefix = segment === 'ENTER' ? 'ENTER' : segment === 'MUSIC' ? 'MUSIC' : 'Mob';
  const segmentPart = (segment === 'ENTER' || segment === 'MUSIC') ? `${prefix} ${subSegment}` : `${prefix} ${segment}`;

  const projectName = `${segmentPart} ${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;
  cy.log(projectName);
  cy.get('input[formcontrolname="projectName"]').type(projectName);

  const envKey = type === 'Main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);

  if (type === 'Main') formattedDateMain = projectName;
  else formattedDateOntop = projectName;

  const finalProjectName = formattedDateMain || formattedDateOntop || projectName;

  // --- Date ---
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('input[aria-label="Date input field"]').type(formattedDate);
  cy.wait(2000);

  // --- Customer Type (ENTER/MUSIC) ---
  if (segment === 'ENTER' || segment === 'MUSIC') {
    if (!subSegment) throw new Error(`subSegment is required for segment ${segment}`);
    const customerType = subSegment === 'POST' ? 'Post-paid' : 'Pre-paid';
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
  const poName = `${PriceType} ${ProductClass} ${day}${month} ${hours}${minutes}`;
  cy.get('input[formcontrolname="productName"]').type(poName);
  const poEnvKey = type === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  Cypress.env(poEnvKey, poName);

  cy.get('select[formcontrolname="promotionSubGroupFrom"]')
    .select('Product Offering')
    .should('have.value', 'Product Offering');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // --- Navigate to Product Offering ---
  cy.url().should('include', '/#/project-home/project-basic-information');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
  cy.wait(5000);

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
    if (segment === 'ENTER' || segment === 'MUSIC') {
      if (ProductClass === 'main') throw new Error(`Product Class "Main" is not available for segment ${segment}`);
      productValue = productClassMapEnterMusic[ProductClass];
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
      const randomMonth = randomInRange(3, 24);
      cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());
      cy.get('select[formcontrolname="packageDurationUnit"]').select('Months');
      cy.get('select[formcontrolname="packageDurationUnit"]')
        .find('option:selected')
        .should('have.text', 'Months');
    }
  })();
};
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
      key => key !== 'netGift' && key !== 'traveller'
    ) as Array<keyof typeof targetGroupMap>;

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    value = targetGroupMap[randomType];
  } else {
    value = targetGroupMap[type];
  }

  cy.get('select[formcontrolname="targetGroup"]')
    .select(value)
    .should('have.value', value);
};
export const InternetLimitedDataOnly = () => {
  // Nav Internet
  cy.get('.scrollmenu > .nav')
    .contains('Internet')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)
  // button add
  // cy.get('[style="width: 60px;"]').click();
  cy.get('button.btn.btn-primary.btn-xs').eq(3).click();

  //Intternet Quota type 
  // Limited Data (Pay per use)
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Limited Data (Pay per use)')
  //   .should('have.value', 'Limited Data (Pay per use)');
  // Select the option "Limited Data Only" from the dropdown
  cy.get('select[formcontrolname="InternetQuotaType"]')
    .select('Limited Data Only')
    .should('have.value', 'Limited Data Only');

  // Limited Data (Stop Net)
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //     .select('Limited Data (Stop Net)')
  //     .should('have.value', 'Limited Data (Stop Net)');

  //      // Pay per use only
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Pay per use only')
  //   .should('have.value', 'Pay per use only');

  //   // Unlimited Data (Throttling Speed)
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Unlimited Data (Throttling Speed)')
  //   .should('have.value', 'Unlimited Data (Throttling Speed)');

  // // Limited Data Only
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  // .select('Limited Data Only')
  // .should('have.value', 'Limited Data Only');

  // // Unlimited Data (Fixed Speed
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  // .select('Limited Data Only')
  // .should('have.value', 'Limited Data Only');
  // Intternet Quota
  cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });
  cy.get('mat-option').contains('5G/4G/3G 10 GB').click();
  const IntternetQuota = [
    // '5G/4G/3G 10 GB',
    // '5G/4G/3G 20 GB',
    '5G/4G/3G 150 GB',
    // '5G/4G/3G 350 GB',
    // '4G/3G 10 GB',
    // '4G/3G 20 GB',
    // '5G/4G/3G 30 GB'
  ];

  IntternetQuota.forEach(option => {
    cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });
    cy.get('.mat-select-panel mat-option')
      .should('be.visible')
      .contains(option)
      .click({ force: true });
  });
  //   cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });

  // cy.get('.mat-select-panel mat-option')
  //   .should('be.visible')
  //   .then($options => {
  //     const randomIndex = Math.floor(Math.random() * $options.length);
  //     const selectedText = $options.eq(randomIndex).text().trim();

  //     cy.log(`Randomly selected: ${selectedText}`);
  //     cy.wrap($options[randomIndex]).click({ force: true });
  //   });

  //Internet speed
  const speeds = [
    // '4Gbps/4Gbps',
    // '3Gbps/3Gbps',
    // 'Max Speed (5G 2Gbps/2Gbps)',
    // 'Max Speed (5G Default 1Gbps/1Gbps)',
    // '450 Mbps',
    // '300 Mbps',
    // '150 Mbps',
    // '50 Mbps',
    // '42 Mbps',
    // '30 Mbps',
    // '21 Mbps',
    // '20 Mbps',
    // '15 Mbps',
    // '12 Mbps',
    // '11 Mbps',
    // '10 Mbps',
    // '8 Mbps',
    // '7.2 Mbps',
    // '6 Mbps',
    // '5 Mbps',
    // '4 Mbps',
    // '3 Mbps',
    // '2 Mbps',
    // '1 Mbps',
    // '512 Kbps',
    // '384 Kbps',
    // '256 Kbps',
    // '128 Kbps',
    // '64 Kbps',
    // '10 Kbps',
    // '0 Kbps',
    'Max Speed (5G 2Gbps/2Gbps)'
  ];

  speeds.forEach(speed => {
    cy.get('select[formcontrolname="internetSpeed"]')
      .select(speed)
      .should('have.value', speed);
  });
  // cy.get('select[formcontrolname="internetSpeed"]')
  // .find('option:not([disabled])')
  // .then($options => {
  //   const randomIndex = Math.floor(Math.random() * $options.length);
  //   const selectedValue = $options.eq(randomIndex).val() as string;
  //   const selectedText = $options.eq(randomIndex).text().trim();

  //   cy.log(`Randomly selected: ${selectedText}`);

  //   cy.get('select[formcontrolname="internetSpeed"]')
  //     .select(selectedValue)
  //     .should('have.value', selectedValue);
  // });

  //Internet Exceed Rate 
  const InternetExceedRate = [
    '0.963 Baht per',
    '149 Baht per GB'
  ];

  InternetExceedRate.forEach(option => {
    cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });
    cy.get('.mat-select-panel mat-option')
      .should('be.visible')
      .contains(option)
      .click({ force: true });
  });
  //   cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });

  // cy.get('.mat-select-panel mat-option')
  //   .should('be.visible')
  //   .then($options => {
  //     const randomIndex = Math.floor(Math.random() * $options.length);
  //     const selectedText = $options.eq(randomIndex).text().trim();

  //     cy.log(`Randomly selected: ${selectedText}`);
  //     cy.wrap($options[randomIndex]).click({ force: true });
  //   });

  //button Save
  cy.get(':nth-child(1) > .btn').click();

}
export const InternetLimitedDataOnlyPRERecurring = () => {
  // Nav Internet
  cy.get('.scrollmenu > .nav')
    .contains('Internet')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)
  // button add
  // cy.get('[style="width: 60px;"]').click();
  cy.get('button.btn.btn-primary.btn-xs').eq(4).click();

  //Intternet Quota type 
  // Limited Data (Pay per use)
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Limited Data (Pay per use)')
  //   .should('have.value', 'Limited Data (Pay per use)');
  // Select the option "Limited Data Only" from the dropdown
  cy.get('select[formcontrolname="InternetQuotaType"]')
    .select('Limited Data Only')
    .should('have.value', 'Limited Data Only');

  // Limited Data (Stop Net)
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //     .select('Limited Data (Stop Net)')
  //     .should('have.value', 'Limited Data (Stop Net)');

  //      // Pay per use only
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Pay per use only')
  //   .should('have.value', 'Pay per use only');

  //   // Unlimited Data (Throttling Speed)
  //   cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  //   .select('Unlimited Data (Throttling Speed)')
  //   .should('have.value', 'Unlimited Data (Throttling Speed)');

  // // Limited Data Only
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  // .select('Limited Data Only')
  // .should('have.value', 'Limited Data Only');

  // // Unlimited Data (Fixed Speed
  // cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
  // .select('Limited Data Only')
  // .should('have.value', 'Limited Data Only');
  // Intternet Quota
  cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });
  cy.get('mat-option').contains('5G/4G/3G 10 GB').click();
  const IntternetQuota = [
    // '5G/4G/3G 10 GB',
    // '5G/4G/3G 20 GB',
    '5G/4G/3G 150 GB',
    // '5G/4G/3G 350 GB',
    // '4G/3G 10 GB',
    // '4G/3G 20 GB',
    // '5G/4G/3G 30 GB'
  ];

  IntternetQuota.forEach(option => {
    cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });
    cy.get('.mat-select-panel mat-option')
      .should('be.visible')
      .contains(option)
      .click({ force: true });
  });
  //   cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true });

  // cy.get('.mat-select-panel mat-option')
  //   .should('be.visible')
  //   .then($options => {
  //     const randomIndex = Math.floor(Math.random() * $options.length);
  //     const selectedText = $options.eq(randomIndex).text().trim();

  //     cy.log(`Randomly selected: ${selectedText}`);
  //     cy.wrap($options[randomIndex]).click({ force: true });
  //   });

  //Internet speed
  const speeds = [
    // '4Gbps/4Gbps',
    // '3Gbps/3Gbps',
    // 'Max Speed (5G 2Gbps/2Gbps)',
    // 'Max Speed (5G Default 1Gbps/1Gbps)',
    // '450 Mbps',
    // '300 Mbps',
    // '150 Mbps',
    // '50 Mbps',
    // '42 Mbps',
    // '30 Mbps',
    // '21 Mbps',
    // '20 Mbps',
    // '15 Mbps',
    // '12 Mbps',
    // '11 Mbps',
    // '10 Mbps',
    // '8 Mbps',
    // '7.2 Mbps',
    // '6 Mbps',
    // '5 Mbps',
    // '4 Mbps',
    // '3 Mbps',
    // '2 Mbps',
    // '1 Mbps',
    // '512 Kbps',
    // '384 Kbps',
    // '256 Kbps',
    // '128 Kbps',
    // '64 Kbps',
    // '10 Kbps',
    // '0 Kbps',
    'Max Speed (5G 2Gbps/2Gbps)'
  ];

  speeds.forEach(speed => {
    cy.get('select[formcontrolname="internetSpeed"]')
      .select(speed)
      .should('have.value', speed);
  });
  // cy.get('select[formcontrolname="internetSpeed"]')
  // .find('option:not([disabled])')
  // .then($options => {
  //   const randomIndex = Math.floor(Math.random() * $options.length);
  //   const selectedValue = $options.eq(randomIndex).val() as string;
  //   const selectedText = $options.eq(randomIndex).text().trim();

  //   cy.log(`Randomly selected: ${selectedText}`);

  //   cy.get('select[formcontrolname="internetSpeed"]')
  //     .select(selectedValue)
  //     .should('have.value', selectedValue);
  // });

  //Internet Exceed Rate 
  const InternetExceedRate = [
    '0.963 Baht per',
    '149 Baht per GB'
  ];

  InternetExceedRate.forEach(option => {
    cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });
    cy.get('.mat-select-panel mat-option')
      .should('be.visible')
      .contains(option)
      .click({ force: true });
  });
  //   cy.get('#mat-select-3 > .mat-select-trigger').click({ force: true });

  // cy.get('.mat-select-panel mat-option')
  //   .should('be.visible')
  //   .then($options => {
  //     const randomIndex = Math.floor(Math.random() * $options.length);
  //     const selectedText = $options.eq(randomIndex).text().trim();

  //     cy.log(`Randomly selected: ${selectedText}`);
  //     cy.wrap($options[randomIndex]).click({ force: true });
  //   });

  //button Save
  // cy.get(':nth-child(1) > .btn').click();
  // cy.get('button:contains("Add")').click({ multiple: true });
  cy.get('button.btn-primary:contains("Add")').last().click();
}
export const smsWording = () => {
  //Nav SMS Wording
  cy.scrollTo('bottom')
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();

  //Button Generate SMS Wording
  // cy.get(':nth-child(2) > :nth-child(2) > .btn').should('be.visible').click();

  // กำหนดข้อมูลที่ต้องการกรอกในแต่ละฟิลด์
  const fields = [
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
  const dropdowns = [
    { selector: 'select[formcontrolname="smsGreetingSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsDeleteSendFlag"]', value: 'Send' },
  ];

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

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  //Save button
  cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();

  //Buttom Close
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
}
export const smsWordingpre = () => {
  //Nav SMS Wording
  cy.scrollTo('bottom')
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();

  //Button Generate SMS Wording
  // cy.get(':nth-child(2) > :nth-child(2) > .btn').should('be.visible').click();

  // กำหนดข้อมูลที่ต้องการกรอกในแต่ละฟิลด์
  const fields = [
    { selector: 'textarea[formcontrolname="shortPromotionName"]', values: ['Sample Promotion Name ENG', 'ตัวอย่างชื่อโปรโมชั่น THA'] },
    { selector: 'textarea[formcontrolname="cmsDisplay"]', values: ['Sample CMS Display ENG', 'ตัวอย่าง CMS Display THA'] },
    { selector: 'textarea[formcontrolname="promotionDescription"]', values: ['Sample Promotion Description in English', 'ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย'] },
    // { selector: 'textarea[formcontrolname="greetingLetter"]', values: ['Sample Greeting Letter in English', 'ตัวอย่างจดหมายทักทายภาษาไทย'] },
    // { selector: 'textarea[formcontrolname="yourPackage"]', values: ['Sample Billing Description in English', 'ตัวอย่างคำอธิบายบิลภาษาไทย'] },
    { selector: 'textarea[formcontrolname="smsGreeting"]', values: ['Sample SMS Greeting in English', 'ตัวอย่าง SMS ทักทายภาษาไทย'] },
    // { selector: 'textarea[formcontrolname="smsDelete"]', values: ['Sample SMS Delete in English', 'ตัวอย่าง SMS ลบแพ็กภาษาไทย'] },
  ];

  // กำหนดข้อมูลสำหรับ dropdown
  const dropdowns = [
    { selector: 'select[formcontrolname="smsGreetingSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]', value: 'Send' },
    { selector: 'select[formcontrolname="smsDeleteSendFlag"]', value: 'Send' },
  ];

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

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  //Save button
  cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();

  //Buttom Close
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
}
export const Tariff = (): void => {
  // Navigate to Tariff & Discount section
  cy.get('.scrollmenu > .nav')
    .contains('Tariff Plan & Discount')
    .should('be.visible')
    .click();

  cy.scrollTo('bottom');
  cy.wait(3000)

  // const tariffPlans: string[] = [
  //   'Call AIS Network 5AM-5PM. First-60 Min 0B Next 1.5B. Other Network 1.5B/Min SMS2.5B',
  // ];

  // tariffPlans.forEach((option: string) => {
  //   // Open dropdown
  //   cy.get('#mat-select-2 .mat-select-trigger')
  //     .should('be.visible')
  //     .click({ force: true });

  //   // Select option from dropdown
  //   cy.get('.mat-select-panel mat-option .mat-option-text')
  //     .should('be.visible')
  //     .contains(option)
  //     .click({ force: true });

  //   // Verify selection
  //   cy.get('#mat-select-2 .mat-select-value-text')
  //     .should('contain.text', option);
  // });
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

  // Wait for modal footer and close it
  cy.get('.modal-footer', { timeout: 20000 })
    .should('be.visible')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
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
export const beforeapproveMKT = () => {
  //description 
  cy.get(':nth-child(2) > :nth-child(2) > .form-control').type('Description');
  // รอให้การร้องขอ API เสร็จสิ้น
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  //Button 
  cy.get(':nth-child(3) > :nth-child(1) > .btn').click();

  // *Approve memo 
  cy.get('.row.ng-star-inserted > .col-md-6 > input').click();

  // button Submit
  cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');

  cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
    .contains('Submit')
    .click();

  cy.wait('@submitApprove', { timeout: 300000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.on('window:alert', (text) => {
    expect(text).to.include('Approve and Send Mail Notify Success');
  });

  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  cy.wait(5000)
  //Find Project Unassigned Task and clam Project
  //Find Project Unassigned Task and clam Project
  clamProject(formattedDateMain);
  // Find the "To Do List" section
  // approveProject(formattedDateMain);
  approveProject(formattedDateMain);

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
  // cy.get('.loading-spinner', { timeout: 60000 }).should('not.exist');

  // Intercept and wait for specific API requests triggered after scrolling
  // cy.intercept('GET', '/PLMSpringBoot/api/getProductInMKT/*').as('getProductInMKT');
  // cy.intercept('GET', '/PLMSpringBoot/api/getSubmitDt/*').as('getSubmitDt');

  // Wait for API requests triggered after scrolling
  // cy.wait(['@getProductInMKT', '@getSubmitDt'], { timeout: 120000 });
  // Wait for the "Approve" button to be visible and enabled
  cy.get('button.btn.btn-xs.btn-primary')
    .contains('Approve')
    .should('be.visible')
    .click();

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

  // Wait for specific API requests to complete (if needed)
  // Intercept all GET and POST requests
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
}
export const beforeapproveCKS = () => {
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
  cy.wait(15000);

  // Checkbox fast lane
  cy.get('input[type="checkbox"]').check({ force: true });
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

  cy.wait('@submitApprove', { timeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(5000)
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProjectCKS from Unassigned Task
  ClaimProjectCKS(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);
  // รอให้ URL เปลี่ยนก่อน
  cy.url({ timeout: 30000 }).should('include', '/#/new-flow/home/newcks/cks-checker');

  // รอให้ table/element หลักโหลดเสร็จก่อน
  cy.get('body', { timeout: 30000 }).should('be.visible');

  // แล้วค่อยเลื่อนลงล่างสุด
  cy.scrollTo('bottom');
  cy.wait(3000)

  // intercept API หลัก
  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
  cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

  // Click ปุ่ม Approve To CGMD
  cy.contains('button', 'Approve To CGMD', { timeout: 30000 })
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
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

}
export const beforeapproveCKSontop = () => {
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
  cy.wait(15000);

  // Checkbox fast lane
  cy.get('input[type="checkbox"]').check({ force: true });
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

  cy.wait('@submitApprove', { timeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(5000)
  const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName');
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  //  ClaimProjectCKS from Unassigned Task
  ClaimProjectCKS(finalProjectName);

  // Find the "To Do List" section
  approveProject(finalProjectName);

  // รอให้ URL เปลี่ยนก่อน
  cy.url({ timeout: 30000 }).should('include', '/#/new-flow/home/newcks/cks-checker');

  // รอให้ table/element หลักโหลดเสร็จก่อน
  cy.get('body', { timeout: 30000 }).should('be.visible');

  // แล้วค่อยเลื่อนลงล่างสุด
  cy.scrollTo('bottom');
  cy.wait(3000)

  // intercept API หลัก
  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
  cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

  // Click ปุ่ม Approve To CGMD
  cy.contains('button', 'Approve To CGMD', { timeout: 30000 })
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
  cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

  // Click the Logout button
  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();

  // Wait for the URL to change to the login page
  cy.url().should('include', '/login');

}
export const addauto5gCKS = () => {
  const values = ['1: Y', '2: X', '3: N'];
  const randomValue = values[Math.floor(Math.random() * values.length)];

  cy.get('select[formcontrolname="autoAddService5g"]')
    .select(randomValue)
    .should('have.value', randomValue);
};
export const dropdownRecurringCKS = () => {
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
  })

}
export const dropdownRecurringCKSMain = () => {

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click();

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.log(`Randomly selected: ${selectedText}`);
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);
  })

}
export const dropdownRecurringPreMainCKS = () => {

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click();

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.log(`Randomly selected: ${selectedText}`);
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);
  })

}
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
export const afterMKTMAINPOST = () => {
  it('CKS role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateMain = 'Mob POST Reg 0409 0038';
    const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName');
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(finalProjectName);

    // Find the "To Do List" section
    approveProject(finalProjectName);
    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    // cy.get('select[formcontrolname="groupPackage"]')
    // .select('5G Hot Deal Max Speed Offset')
    //grouppackage();

    Tariff();

    beforeapproveCKS();
  });
  it('CGMD Config IRB role', () => {

    login(cgcirb, cgcirbpass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.intercept('POST', '/PLMSpringBoot/api/**').as('POSTRequest');

    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    // cy.wait(['@POSTRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Ontop Onetime 1010 1727';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgcirb';

    assignTeamTask(projectNamePONAME, assignee);


    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMD(projectNamePONAME);

  });
  it('CGMD Tester IRB role', () => {

    login(cgtirb, cgtirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();


    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0610_2318';

    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtirb';

    assignTeamTask(projectNamePONAME, assignee);


    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    approveProjectCGMDtesterProACTM(projectNamePONAME);

  });
  it('ACTM role', () => {

    login(actm, actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDACTM(projectNamePONAME);
  });
  it('OPER role', () => {

    login(oper, operpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDOPER(projectNamePONAME);
  });
}
export const afterMKTMainUsagePOST = () => {

  it('CKS role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateMain = 'Mob POST Reg 0409 0038';
    const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName');
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(finalProjectName);

    // Find the "To Do List" section
    approveProject(finalProjectName);
    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')

    //grouppackage();
    //grouppackage();
    Tariff();
    cy.wait(3000)
    priorityInternetLimitedDataOnly();
    beforeapproveCKS();
  });
  it('CGMD Config IRB role', () => {

    login(cgcirb, cgcirbpass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // cy.intercept('POST', '/PLMSpringBoot/api/**').as('POSTRequest');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    // cy.wait(['@POSTRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    cy.contains('span', 'Menu').click();


    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Ontop Onetime 1010 1727';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgcirb';

    assignTeamTask(projectNamePONAME, assignee);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMD(projectNamePONAME);

  });
  it('CGMD Tester IRB role', () => {

    login(cgtirb, cgtirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0610_2318';

    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtirb';

    assignTeamTask(projectNamePONAME, assignee);


    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMDtesterProACTM(projectNamePONAME);
  });
  it('ACTM role', () => {

    login(actm, actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDACTM(projectNamePONAME);

  });
  it('OPER role', () => {

    login(oper, operpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDOPER(projectNamePONAME);


  });
}
export const afterMKTontopPOST = () => {
  it('CKS role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateMain = 'Mob POST Reg 0409 0038';
    const finalProjectName = formattedDateMain || formattedDateOntop || Cypress.env('projectName');
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(finalProjectName);

    // Find the "To Do List" section
    approveProject(finalProjectName);

    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')

    //grouppackage();
    //grouppackage();
    // Tariff();
    priorityInternetLimitedDataOnly();

    beforeapproveCKSontop();
  });
  it('CGMD Config IRB role', () => {

    login(cgcirb, cgcirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();


    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgcirb';

    assignTeamTask(projectNamePONAME, assignee);


    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMD(projectNamePONAME);

  });
  it('CGMD Tester IRB role', () => {

    login(cgtirb, cgtirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();
    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');


    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0610_2318';

    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtirb';

    assignTeamTask(projectNamePONAME, assignee);


    cy.contains('span', 'Menu').click();


    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMDtesterProACTM(projectNamePONAME);

  });
  it('ACTM role', () => {

    login(actm, actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDACTM(projectNamePONAME);


  });
  it('OPER role', () => {

    login(oper, operpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const taskIdentifier = 'Onetime_Main_3009_1126';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDOPER(projectNamePONAME);


  });
}
export const afterMKTontopPRE = () => {
  it('CKS role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDate = 'Mob PRE Reg Onetime Ontop 1310 1625';
    const projectName = Cypress.env('projectName');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(formattedDateOntop);

    // Find the "To Do List" section
    cy.wait(2000);
    approveProject(formattedDateOntop);

    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    addauto5gCKS();

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')

    //grouppackage();
    //grouppackage();
    dropdownRecurringCKS();
    diyflagCKS();
    //Tariff();
    cy.wait(5000)
    priorityInternetLimitedDataOnly();

    cy.scrollTo('bottom')

    smsCKSPRE();

    beforeapproveCKSontop();
  });
  it('CGMD Config cbs role', () => {

    login(cgccbs, cgccbspass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/workspace-home/workspace');
    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');

    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    // const projectNamePONAME = 'Onetime Ontop 1510 0013'
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgccbs';

    assignTeamTask(projectNamePONAME, assignee);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMDPRE(projectNamePONAME);
  });
  it('CGMD Tester CBS role', () => {

    login(cgtcbs, cgtcbspass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/workspace-home/workspace');
    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');

    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    // const projectNamePONAME = 'Onetime Ontop 1510 0013'
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtcbs';

    assignTeamTask(projectNamePONAME, assignee);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    approveProjectCGMDtesterProPRE(projectNamePONAME);
  });
  it('Spadsup role', () => {

    login(spadsup, spadsuppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1024';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    ClaimProjectCKS(projectNamePONAME);

    approveProjectSPADSup(projectNamePONAME);
  });
  it('Spaddoer role', () => {

    login(spaddoer, spaddoerpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1352';

    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    approveProjectSPADDOER(projectNamePONAME);
  });
  it('Spadtester role', () => {

    login(spadtest, spadtestpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1310 1838';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    approveProjectSPADTester(projectNamePONAME);
  });
  it('Spaddeploy role', () => {

    login(spaddp, spaddppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1310 1838';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    cy.wait(2000);
    approveProjectSPADdeploy(projectNamePONAME);
  });
  it('ACTM role', () => {

    login(actm, actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDACTMPRE(projectNamePONAME);
  });
  it('APO role', () => {

    login(apo, apopass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDAPO(projectNamePONAME);
  });
}
export const afterMKTontopPREUsage = () => {
  it('CKS role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateOntop = 'Mob PRE Reg Usage Ontop 1610 1712';
    const projectName = Cypress.env('projectName');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(formattedDateOntop);

    // Find the "To Do List" section
    approveProject(formattedDateOntop);

    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    addauto5gCKS();

    cy.contains('label', 'UnRegister (Hold)')
      .parent() // ขึ้นไป div.col-md-6
      .siblings('div.col-md-6') // หา sibling div
      .contains('label', 'Yes')
      .find('input[type="radio"]')
      .check({ force: true });

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')

    //grouppackage();

    //grouppackage();

    dropdownRecurringCKS();
    diyflagCKS();
    // Tariff();
    priorityInternetLimitedDataOnly();

    cy.scrollTo('bottom')

    smsCKSPRE();

    beforeapproveCKSontop();
  });
  it('CGMD Config cbs role', () => {

    login(cgccbs, cgccbspass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/workspace-home/workspace');
    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');

    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    // const projectNamePONAME = 'Onetime Ontop 1510 0013'
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgccbs';

    assignTeamTask(projectNamePONAME, assignee);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    approveProjectCGMDPRE(projectNamePONAME);
  });
  it('CGMD Tester CBS role', () => {

    login(cgtcbs, cgtcbspass);
    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/workspace-home/workspace');
    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');

    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

    // const taskIdentifier = 'Onetime_Main_0910_0951';
    // const projectNamePONAME = 'Onetime Ontop 1510 0013'
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    const assignee = 'cgtcbs';

    assignTeamTask(projectNamePONAME, assignee);

    cy.contains('span', 'Menu').click();

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/workspace-home/workspace"]').click();

    cy.url().should('include', '/workspace-home/workspace');

    // จับ API หลัก
    cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    approveProjectCGMDtesterProPRE(projectNamePONAME);
  });
  it('Spadsup role', () => {

    login(spadsup, spadsuppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1024';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    ClaimProjectCKS(projectNamePONAME);

    approveProjectSPADSup(projectNamePONAME);
  });
  it('Spaddoer role', () => {

    login(spaddoer, spaddoerpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1352';

    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    approveProjectSPADDOER(projectNamePONAME);
  });
  it('Spadtester role', () => {

    login(spadtest, spadtestpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1310 1838';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    approveProjectSPADTester(projectNamePONAME);
  });
  it('Spaddeploy role', () => {

    login(spaddp, spaddppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1310 1838';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    ClaimProjectCKS(projectNamePONAME);

    approveProjectSPADdeploy(projectNamePONAME);
  });
  it('ACTM role', () => {

    login(actm, actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDACTMPRE(projectNamePONAME);
  });
  it('APO role', () => {

    login(apo, apopass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateOntopPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    approveProjectCGMDAPO(projectNamePONAME);
  });
}