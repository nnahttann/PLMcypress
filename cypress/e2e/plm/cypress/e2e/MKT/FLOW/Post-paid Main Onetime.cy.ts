const urlsit: string = Cypress.env('urlsit');
const MKTpost: string = Cypress.env('MKTpost');
const MKTpost1: string = Cypress.env('MKTpost1');
const cks: string = Cypress.env('cks');
const ckspass: string = Cypress.env('ckspass');
const cgcirb: string = Cypress.env('cgcirb');
const cgcirbpass: string = Cypress.env('cgcirbpass');

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(urlsit);
  cy.viewport(1920, 1080);
});
// const verify = () => {
//   const field: string[] = [
//     '*PO Name', '*Project Name', '*Project Owner', '*Customer Type', '*Price Type', '*Customer Type', '*Price Type', '*Commercial Launch Date', '*Product Class', '*Recurring Fee Deduction', '*Expire Date', '*Promotion Level', '*Package Duration', 'Fixed Start Date', '*Share Plan', '*Package Bill Cycle', 'Fixed End Date', '*Prorate Package Fee', '*Bill Period', 'PO Type', '*NRTG/NGCM(WO1044)', '*Target Group', 'PO Type', '*NRTG/NGCM(WO1056)', '*NRTG/PHX(WO1054)', '*NRTG/PHX(WO1055)', 'Handset', 'Promotion Group', 'Promotion Sub Group', 'Remark', '*Multi Duration', '*Full Price Excluding VAT', '*Full Price Including VAT', 'Partial Step', '*Target Customer', '*Product Specification', 'Selling Location & Channel', 'Market Segment', 'SMS Wording', 'Special Condition', 'Retry Pattern', 'PO Relation', 'Commu Touch Point', 'Other Privilege', 'Charge Partner'
//   ]
//   field.forEach((field: string) => {
//     cy.contains(field).should('be.visible');
//   });
// }
const now = new Date();
const formattedDate = `Mob POST Reg ${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

const clamProject = (formattedDate: string): void => {
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
    cy.wait('@getAssigneeList', { timeout: 10000 })
      .its('response.statusCode')
      .should('eq', 200);

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

    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');
    cy.get('button[type="button"]').contains('Set').click();
    cy.wait(50000)
  });
}
//Claim Project CKS
const ClaimProjectCKS = (formattedDate: string): void => {
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

const approveProject = (projectName: string): void => {
  cy.get('h3').contains('To Do List').parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span')
          // .contains('Approve')
          // .should('have.attr', 'style', 'color:green')
          .should('be.visible')
          .click();
      });
  });
};

const targetgroup = () => {
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

const login = (username: string, password: string): void => {
  cy.get('input[name="userId"]').type(username);
  cy.get('input[name="pwd"]').type(password);
  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');
  cy.get(':nth-child(4) > .btn').click();
  cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);
}

describe('Mobile', () => {
  it('MKT POSTPAID role', () => {
    //Logib
    login(MKTpost, MKTpost1);

    // create New Project
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    cy.log(formattedDate);
    //Projectname
    cy.get('input[formcontrolname="projectName"]').type(formattedDate);

    Cypress.env('projectName', formattedDate);

    // Date
    const date = new Date();
    date.setDate(date.getDate() + 1);

    // Format the date as 'dd/mm/yyyy'
    const formattedDate1 = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    //PLM1
    cy.get('input[aria-label="Date input field"]').type(formattedDate1);
    //PLM2
    // cy.get('input[name="expectedDate"]').type(formattedDate1);

    cy.wait(2000)

    // phone 
    cy.get('input[formcontrolname="phoneNo"]').type('0123')
    // button Save
    cy.get('button[type="button"]').contains('Save').click();

    cy.wait(5000)
    // cy.wait('@getNRM_PMT').its('response.statusCode').should('eq', 200);

    //button Close
    cy.get('.modal-body > :nth-child(1) > div > .btn').click();

    // Button Add Project 
    cy.get(':nth-child(4) > .btn').click();

    const formattedDatePONAME = `Onetime_Main_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // PO Name 
    cy.get('input[formcontrolname="productName"]').type(formattedDatePONAME);

    //PO Sub group
    // Product Offering
    cy.get('select[formcontrolname="promotionSubGroupFrom"]').select('Product Offering').should('have.value', 'Product Offering');;
    // Order Fee
    // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
    //Service
    // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');


    //button create 
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // Trigger the button click action
    cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
    cy.wait('@postRequest');
    // cy.wait('@getRequest');

    // Wait for URL change (wait for the page reload or redirection)
    cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
    // Intercept new requests triggered by the new URL
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/mass-po-detail/getByPoRowId/*').as('getPoRowId');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

    // Wait for the new requests after URL change
    // cy.wait('@getPoRowId', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
    cy.wait('@postRequest');
    cy.wait('@getRequest');
    //TC01
    // verify();

    //PriceType 
    // Select "One-Time" option
    cy.get('select[formcontrolname="priceType"]').select('1: One-Time', { force: true }).should('have.value', '1: One-Time');

    // Select "Recurring" option
    // cy.get('select[formcontrolname="priceType"]').select('2: Recurring', { force: true }).should('have.value', '2: Recurring');

    // Select "Usage" option
    // cy.get('select[formcontrolname="priceType"]').select('3: Usage', { force: true }).should('have.value', '3: Usage');
    cy.wait(15000);
    //Product class
    // Select "Main" option
    cy.get('select[formcontrolname="productClass"]').select('1: Main').should('have.value', '1: Main');

    // Select "On-Top" option
    // cy.get('select[formcontrolname="productClass"]').select('2: On-Top').should('have.value', '2: On-Top');

    // Select "On-Top Extra" option
    // cy.get('select[formcontrolname="productClass"]').select('3: On-Top Extra').should('have.value', '3: On-Top Extra');

    //targetgroup
    cy.get('select[formcontrolname="targetGroup"]').select('1: Mass').should('have.value', '1: Mass');
    // cy.get('select[formcontrolname="targetGroup"]').select('2: Mass Disabled').should('have.value', '2: Mass Disabled');
    // cy.get('select[formcontrolname="targetGroup"]').select('3: Mass Students').should('have.value', '3: Mass Students');
    // cy.get('select[formcontrolname="targetGroup"]').select('4: Save (Save Team, Save Port out)').should('have.value', '4: Save (Save Team, Save Port out)');
    // cy.get('select[formcontrolname="targetGroup"]').select('5: FMC').should('have.value', '5: FMC');
    // cy.get('select[formcontrolname="targetGroup"]').select('6: Special Condition').should('have.value', '6: Special Condition');
    // cy.get('select[formcontrolname="targetGroup"]').select('7: CVM').should('have.value', '7: CVM');
    // cy.get('select[formcontrolname="targetGroup"]').select('8: Staff').should('have.value', '8: Staff');
    // cy.get('select[formcontrolname="targetGroup"]').select('9: Test').should('have.value', '9: Test');
    // cy.get('select[formcontrolname="targetGroup"]').select('10: Net Gift').should('have.value', '10: Net Gift');
    // cy.get('select[formcontrolname="targetGroup"]').select('11: NBTC').should('have.value', '11: NBTC');
    // cy.get('select[formcontrolname="targetGroup"]').select('12: Dummy').should('have.value', '12: Dummy');
    // cy.get('select[formcontrolname="targetGroup"]').select('13: Traveller').should('have.value', '13: Traveller');
    // cy.get('select[formcontrolname="targetGroup"]').select('14: FBB').should('have.value', '14: FBB');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    //Multi Duration
    //add button
    cy.get('.col-md-8 > .btn').click();
    //Charge Excluding VAT 
    cy.get('input[formcontrolname="chargeExcVat"]')
      .should('have.class', 'form-control')
      .and('have.attr', 'maxlength', '13')
      .and('have.attr', 'type', 'text')
      .type('123.45')
      .should('have.value', '123.45');

    cy.get('input[formcontrolname="chargeExcVat"]')
      .clear()
      .type('abc123.45!@#')
      .should('have.value', '123.45');

    //add buttom
    cy.get('.col-md-6 > .btn').click();

    //*Target group
    targetgroup();

    //ProductSpec
    const optionsToSelectProductSpec = [
      // "AI IP Camera",
      "AIS Secure Net",
      // "Apple Care",
      // "Cloud Game",
      // "Cloud PC",
      // "Content VDO",
      // "Flowaccount",
      // "Internet",
      // "MMS",
      // "Mobile Care",
      // "SMS",
      // "Vertical App",
      // "Voice",
      // "WiFi",
      // "Youtube Premium"
    ];

    optionsToSelectProductSpec.forEach(option => {
      cy.get('select[formcontrolname="availableListBox"]')
        .contains(option)
        .then($option => {
          cy.wrap($option).dblclick();
        });
    });

    // Nav Internet
    cy.get('.scrollmenu > .nav')
      .contains('Internet')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.scrollTo('bottom');
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
    //Intternet Quota
    // cy.get('#mat-select-2 > .mat-select-trigger').click({ force: true }); 
    // cy.get('mat-option').contains('5G/4G/3G 10 GB').click();
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

    //button Save
    cy.get(':nth-child(1) > .btn').click();

    //Nav SMS Wording
    cy.scrollTo('bottom')
    cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();

    //Button Generate SMS Wording
    // cy.get(':nth-child(2) > :nth-child(2) > .btn').should('be.visible').click();

    // กำหนดข้อมูลที่ต้องการกรอกในแต่ละฟิลด์
    const fields = [
      { selector: 'textarea[formcontrolname="shortPromotionName"]', values: ['Sample Promotion Name ENG', 'ตัวอย่างชื่อโปรโมชั่น THA'] },
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

    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

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
    cy.wait('@getRequest4', { timeout: 10000 }).then((interception) => {
      console.log(`Intercepted request: ${interception.request.method} ${interception.request.url}`);
    });
    //Add File

    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    cy.wait(['@getRequest', '@postRequest'], { timeout: 10000 });

    cy.readFile('D:/PLMcypress/cypress/e2e/plm/cypress/fixtures/file.pdf', 'binary').then((fileContent) => {
      cy.get('input[type="file"][id="files"]').selectFile(
        {
          contents: Cypress.Buffer.from(fileContent, 'binary'),
          fileName: 'file.pdf',
          mimeType: 'application/pdf',
        },
        { force: true }
      );
      cy.wait(3000);
      //description 
      cy.get(':nth-child(2) > :nth-child(2) > .form-control').type('Description');
      // รอให้การร้องขอ API เสร็จสิ้น
      cy.wait(['@getRequest', '@postRequest'], { timeout: 10000 });
      //Button 
      cy.get(':nth-child(3) > :nth-child(1) > .btn').click();

      // *Approve memo 
      cy.get('.row.ng-star-inserted > .col-md-6 > input').click();

      // button Submit
      cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');

      cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
        .contains('Submit')
        .click();

      cy.wait('@submitApprove', { timeout: 30000 })
        .its('response.statusCode')
        .should('eq', 200);

      cy.on('window:alert', (text) => {
        expect(text).to.include('Approve and Send Mail Notify Success');
      });

      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');

      cy.wait(5000)

      //Find Project Unassigned Task and clam Project
      clamProject(formattedDate);
      // Find the "To Do List" section
      approveProject(formattedDate);

      // Intercept all GET and POST requests
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

      // Wait for initial API requests to complete
      cy.wait(['@getRequest', '@postRequest'], { timeout: 100000 });

      // Scroll to the bottom of the page (if needed)
      cy.scrollTo('bottom');

      // Wait for loading spinner to disappear (if applicable)
      cy.get('.loading-spinner', { timeout: 60000 }).should('not.exist');

      // Intercept and wait for specific API requests triggered after scrolling
      cy.intercept('GET', '/PLMSpringBoot/api/getProductInMKT/*').as('getProductInMKT');
      cy.intercept('GET', '/PLMSpringBoot/api/getSubmitDt/*').as('getSubmitDt');

      // Wait for API requests triggered after scrolling
      cy.wait(['@getProductInMKT', '@getSubmitDt'], { timeout: 120000 });
      // Wait for the "Approve" button to be visible and enabled
      cy.get('button.btn.btn-xs.btn-primary')
        .contains('Approve')
        .should('be.visible')
        .click();

      // Intercept and wait for API requests triggered after clicking "Approve"
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postApproveRequest');
      cy.intercept('GET', '/PLMSpringBoot/api/**').as('getApproveRequest');

      // Wait for post-approval API requests to complete
      cy.wait(['@getApproveRequest', '@postApproveRequest'], { timeout: 120000 });

      // Wait for the URL to change to the new workspace URL
      cy.url().should('include', '/workspace-home/workspace');

      // Intercept all POST and GET requests to /PLMSpringBoot/api/**
      cy.intercept(/\/PLMSpringBoot\/api\/.*/).as('approveRequest');

      // Wait for all API requests to complete
      cy.wait('@approveRequest', { timeout: 120000 }).then((interception) => {
        const requestMethod = interception.request.method;
        const responseBody = interception.response?.body;
        console.log(`${requestMethod} Request:`, responseBody);
      });

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
      cy.wait(['@getRequest', '@postRequest'], { timeout: 100000 });
    });
  });
  it('cks role', () => {

    login(cks, ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDate = 'Mob POST Reg 0409 0038';
    const projectName = Cypress.env('projectName');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    //  ClaimProjectCKS from Unassigned Task
    ClaimProjectCKS(formattedDate);

    // Find the "To Do List" section
    cy.wait(5000);
    approveProject(formattedDate);

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
    cy.wait(['@getRequest'], { timeout: 100000 });

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    cy.get('select[formcontrolname="groupPackage"]')
      .select('5G Hot Deal Max Speed Offset')

    // Nav Tariff & dissount
    cy.get('.scrollmenu > .nav').contains('Tariff Plan & Discount').should('be.visible').click();
    cy.scrollTo('bottom');

    const TariffPlans = [
      // 'GSM Advance Nationwide Call 1.50 Baht SMS 2.5 Baht',
      // 'tariff_mass_bfs1_no',
      'Call AIS Network 5AM-5PM. First-60 Min 0B Next 1.5B. Other Network 1.5B/Min SMS2.5B',
      // 'GSM Advance Nationwide Call 1 Baht',
      // 'Mobile_RTMT_110225',
      // 'Voice Normal AIS 0.5B/M OTH 0.75B/M'
    ]

    TariffPlans.forEach(option => {
      cy.get('#mat-select-2 .mat-select-trigger')
        .click({ force: true });

      cy.get('.mat-select-panel mat-option .mat-option-text')
        .should('be.visible')
        .contains(option)
        .click({ force: true });

      cy.get('#mat-select-2 .mat-select-value-text')
        .should('contain.text', option);
    });

    //Button Generate discount
    cy.contains('button', 'Generate Discount')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    //Button Save
    cy.contains('button', 'Save')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

    // Ensure the modal footer is visible
    cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');

    // Find the Close button, ensure it's visible and enabled, then click it
    cy.get('.modal-footer')
      .find('button.btn-danger')
      .should('be.visible')
      .and('not.be.disabled')
      .click();

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
    cy.wait(['@getRequest'], { timeout: 100000 });
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
    const formattedDate2 = `${day}/${month}/${year}`;

    //date
    cy.get('input[aria-label="Date input field"]').eq(1).type(formattedDate2)

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

    ClaimProjectCKS(formattedDate);

    // Find the "To Do List" section
    cy.wait(5000);
    approveProject(formattedDate);

    // รอให้ URL เปลี่ยนก่อน
    cy.url({ timeout: 30000 }).should('include', '/#/new-flow/home/newcks/cks-checker');

    // รอให้ table/element หลักโหลดเสร็จก่อน
    cy.get('body', { timeout: 30000 }).should('be.visible');

    // แล้วค่อยเลื่อนลงล่างสุด
    cy.scrollTo('bottom');

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

    // Wait for specific API requests to complete (if needed)
    // Intercept all GET and POST requests
    // cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    // cy.wait(['@getRequest', '@postRequest'], { timeout: 100000 });

  });
  it.only('CGMD Config IRB role', () => {

    login(cgcirb, cgcirbpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
    cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('GET', '**/api/flw-cfg-lov/getActiveFlagFlwApi/**').as('getActiveFlag');

    cy.visit('/#/workspace-home/workspace');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);
    cy.wait('@setUserOnline').its('response.statusCode').should('eq', 200);
    cy.wait('@getActiveFlag').its('response.statusCode').should('eq', 200);

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // คลิก Process tracking
    cy.get('a[href="#/new-report/home/tracking"]').click();

    // ตรวจสอบ URL เปลี่ยน
    cy.url().should('include', '/new-report/home/tracking');

    // รอ table แสดงผล
    cy.get('table.table.table-condensed', { timeout: 20000 })
      .should('be.visible');

    // optional: ตรวจสอบว่า table มีข้อมูล
    cy.get('table.table.table-condensed tbody tr')
      .should('have.length.greaterThan', 0);

    const projectName = 'Onetime_Main_0610_1721';
    const assignee = 'cgcirb';
    // const projectName = Cypress.env('projectName');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    assignTeamTask(projectName, assignee);

    cy.contains('span', 'Menu').click();

    cy.wait(5000)

    // ก่อนกดเมนู set intercept
    cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

    // // คลิก Process tracking
    // cy.get('a[href="#/workspace-home/workspace"]').click();

    // // จับ API หลัก
    // cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

    // approveProject(formattedDate);
  });
});