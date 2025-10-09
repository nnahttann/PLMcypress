export const urlsit: string = Cypress.env('urlsit');
export const MKTpost: string = Cypress.env('MKTpost');
export const MKTpost1: string = Cypress.env('MKTpost1');
export const cks: string = Cypress.env('cks');
export const ckspass: string = Cypress.env('ckspass');
export const cgcirb: string = Cypress.env('cgcirb');
export const cgcirbpass: string = Cypress.env('cgcirbpass');
export const cgtirb: string = Cypress.env('cgtirb');
export const cgtirbpass: string = Cypress.env('cgtirbpass');
export const actm: string = Cypress.env('actm');
export const actmpass: string = Cypress.env('actmpass');
export const oper: string = Cypress.env('oper');
export const operpass: string = Cypress.env('operpass');

export const now = new Date();
export const formattedDate = `Mob POST Reg ${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

export const clamProject = (formattedDate: string): void => {
  // รอ h3 โผล่มา
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
  // cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  cy.window().then((win) => {
    cy.stub(win, 'alert').as('alertStub');
  });

  cy.get('h3').contains('Team Task').should('be.visible');
  // cy.wait('@postRequest').its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest').its('response.statusCode').should('eq', 200);
  cy.log('✅ APIs for task list have loaded.');

  cy.contains('tr', taskIdentifier).as('taskRow');

  cy.get('@taskRow').within(() => {
    cy.log(`➡️ Found task row for "${taskIdentifier}". Performing actions...`);

    cy.get('select.form-control.input-sm').as('assigneeDropdown');

    // ⭐ วิธีที่ 1: Click ที่ parent element หรือ container ของ select
    cy.get('@assigneeDropdown').parent().click();

    // หรือ ⭐ วิธีที่ 2: Simulate native browser interaction
    cy.get('@assigneeDropdown').then(($select) => {
      // Create และ dispatch mouse events
      const selectElement = $select[0];

      // MouseDown event (เหมือนกด mouse ลง)
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      selectElement.dispatchEvent(mouseDownEvent);

      // Focus event
      const focusEvent = new FocusEvent('focus', {
        bubbles: true,
        cancelable: true
      });
      selectElement.dispatchEvent(focusEvent);
    });

    // รอ API
    // cy.wait('@getAssigneeList', { timeout: 10000 })
    //   .its('response.statusCode')
    //   .should('eq', 200);

    cy.log('✅ Assignee list API loaded');

    // รอให้ Angular render options
    cy.wait(2000);

    // Debug: ดู options หลัง API load
    cy.get('@assigneeDropdown')
      .find('option')
      .each(($option: JQuery<HTMLOptionElement>) => {
        cy.log(`📋 Option: "${$option.val()}" = "${$option.text().trim()}"`);
      });

    // รอจนกว่า option ที่ต้องการจะมี
    cy.get('@assigneeDropdown')
      .find(`option[value="${assignee}"]`, { timeout: 10000 })
      .should('exist');

    // Select
    cy.get('@assigneeDropdown').select(assignee);
    cy.get('@assigneeDropdown').should('have.value', assignee);

    cy.log(`✅ Successfully selected: ${assignee}`);

    cy.get('@taskRow').contains('span', 'Set').click();
    cy.wait(10000)
  });
  cy.get('@alertStub').should('have.been.calledWith', 'Reassign success');
}
export const ClaimProjectCKS = (formattedDate: string): void => {
  cy.get('h3')
    .contains('Unassigned Task', { timeout: 100000 })
    .parent()
    .within(() => {
      // รอจนกว่ามีแถวจริง
      cy.get('tbody tr').should(($rows) => {
        expect(
          $rows.text(),
          'Table should not show loading text'
        ).not.to.contain('Fetching data');
      });

      // ค่อยวนหา row
      cy.get('tbody tr').each(($row) => {
        cy.log('Row text:', $row.text());
        if ($row.text().includes(formattedDate)) {
          cy.wrap($row).find('button.claim-top').click();
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
          // .should('be.visible')
          .click();
      });
  });
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
  cy.wait(5000);

};
export const approveProjectCGMDtester = (projectName: string): void => {
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
  cy.wait(5000);

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
  cy.wait(5000);

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
  cy.wait(10000);

};
export const targetgroup = () => {
  const optionsToSelect = [
    // 'Change Charge Type (Convert)',
    // 'Existing',
    'New',
    // 'Port In (Mobile Number Port)',
    // 'Renew / Recall from Terminate'
  ];

  // Ensure the select element is visible
  cy.get('select[formcontrolname="availableListBox"]')
    .should('exist')
    .and('be.visible');

  // Select each option
  optionsToSelect.forEach(option => {
    cy.get('select[formcontrolname="availableListBox"]')
      .contains('option', option)
      .should('exist')
      .and('be.visible')
      .then($option => {
        cy.wrap($option).dblclick(); // Click the option to select it
      });
  });
}
export const login = (username: string, password: string): void => {
  cy.get('input[name="userId"]').type(username);
  cy.get('input[name="pwd"]').type(password);
  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');
  cy.get(':nth-child(4) > .btn').click();
  cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);
}
