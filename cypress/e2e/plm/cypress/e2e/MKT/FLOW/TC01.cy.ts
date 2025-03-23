
const urlsit: string = Cypress.env('urlsit');
const MKTpost: string = Cypress.env('MKTpost');
const MKTpost1: string = Cypress.env('MKTpost1');
const cks: string = Cypress.env('cks');
const ckspass: string = Cypress.env('ckspass');

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
  cy.get('h3').contains('Unassigned Task', { timeout: 100000 }).parent().within(() => {
    cy.get('tbody tr').each(($row: JQuery<HTMLElement>) => {
      if ($row.text().includes(formattedDate)) {
        cy.wrap($row).find('button.btn.btn-circle.btn-xs.btn-success.claim-top').click();
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
          .contains('Approve')
          .should('have.attr', 'style', 'color:green')
          .should('be.visible')
          .click();
      });
  });
};

const targetgroup = () => {
  const optionsToSelect = [
    'Change Charge Type (Convert)',
    'Existing',
    'New',
    'Port In (Mobile Number Port)',
    'Renew / Recall from Terminate'
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
describe('Mobile', () => {
  it.only('MKT Prepaid role', () => {
    // 
    cy.get('.col-md-10 > :nth-child(2) > .input-group > .form-control', { timeout: 100000 }).type(MKTpost);

    cy.get('[style="margin-bottom:5px;"] > .input-group > .form-control', { timeout: 100000 }).type(MKTpost1);

    cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll', { timeout: 100000 }).as('getErrorCodes');

    cy.get(':nth-child(4) > .btn').click();

    cy.wait('@getErrorCodes').its('response.statusCode', { timeout: 100000 }).should('eq', 200);

    // create New Project
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    cy.log(formattedDate);
    //Projectname
    cy.get(':nth-child(2) > :nth-child(1) > .form-group > :nth-child(2) > .form-control').type(formattedDate);

    // Date
    const date = new Date();
    date.setDate(date.getDate() + 1);

    // Format the date as 'dd/mm/yyyy'
    const formattedDate1 = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    cy.get('.selection').type(formattedDate1);

    cy.wait(2000)

    // phone 
    cy.get(':nth-child(4) > .col-md-3 > .form-group > :nth-child(2) > .form-control', { timeout: 100000 }).type('0123')
    // button Save
    cy.get('.col-md-10 > div > :nth-child(2)', { timeout: 100000 }).should('be.visible').click();

    cy.wait(5000)
    // cy.wait('@getNRM_PMT').its('response.statusCode').should('eq', 200);

    //button Close
    // Add 
    cy.get('.ng-star-inserted > div > .btn').should('be.visible', { timeout: 100000 }).click();
    cy.wait(5000)

    // Button Add Project 
    cy.get(':nth-child(4) > .btn').click();

    const formattedDatePONAME = `Onetime_Main_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // PO Name 
    cy.get('.modal-body > .ng-star-inserted > .form-control').type(formattedDatePONAME);

    //PO Sub group
    // Product Offering
    cy.get('.col-md-4 > .form-control').select('Product Offering').should('have.value', 'Product Offering', { timeout: 100000 });
    // Order Fee
    // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
    //Service
    // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

    //button create 
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    // Trigger the button click action
    cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();
    cy.wait('@postRequest');
    cy.wait('@getRequest');

    // Wait for URL change (wait for the page reload or redirection)
    cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
    // Intercept new requests triggered by the new URL
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.intercept('GET', '/PLMSpringBoot/api/mass-po-detail/getByPoRowId/*').as('getPoRowId');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

    // Wait for the new requests after URL change
    cy.wait('@getPoRowId', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.url({ timeout: 30000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
    cy.wait('@postRequest');
    cy.wait('@getRequest');
    //TC01
    // verify();

    //Flow
    //PriceType 
    // Select "One-Time" option
    cy.get('select[formcontrolname="priceType"]').select('1: One-Time', { force: true }).should('have.value', '1: One-Time');

    // Select "Recurring" option
    // cy.get('select[formcontrolname="priceType"]').select('2: Recurring', { force: true }).should('have.value', '2: Recurring');

    // Select "Usage" option
    // cy.get('select[formcontrolname="priceType"]').select('3: Usage', { force: true }).should('have.value', '3: Usage');
    cy.wait(5000);
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
    //Nav Internet
    cy.scrollTo('bottom')
    cy.get('.scrollmenu > .nav').contains('Internet').should('be.visible').click();

    //button add
    cy.get('div.collapse-panel').within(() => {
      cy.get('button.btn.btn-primary.btn-xs[style="width:60px"]').should('be.visible').click();
    });

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

    // Short Promotion Name& Marketing Name
    cy.get('textarea[formcontrolname="shortPromotionName"]').first()
      .type('Sample Promotion Name ENG')
      .should('have.value', 'Sample Promotion Name ENG');

    cy.get('textarea[formcontrolname="shortPromotionName"]').eq(1)
      .type('ตัวอย่างชื่อโปรโมชั่น THA')
      .should('have.value', 'ตัวอย่างชื่อโปรโมชั่น THA');

    cy.get('textarea[formcontrolname="marketingName"]')
      .type('Marketing Name EN Only')
      .should('have.value', 'Marketing Name EN Only');

    // CMS Display Wording in myAIS 2.0

    cy.get('textarea[formcontrolname="cmsDisplay"]').first()
      .type('Sample CMS Display ENG')
      .should('have.value', 'Sample CMS Display ENG');

    cy.get('textarea[formcontrolname="cmsDisplay"]').eq(1)
      .type('ตัวอย่าง CMS Display THA')
      .should('have.value', 'ตัวอย่าง CMS Display THA');

    //Promotion Description 
    cy.get('textarea[formcontrolname="promotionDescription"]').first()
      .type('Sample Promotion Description in English')
      .should('have.value', 'Sample Promotion Description in English');

    cy.get('textarea[formcontrolname="promotionDescription"]').eq(1)
      .type('ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย')
      .should('have.value', 'ตัวอย่างรายละเอียดโปรโมชั่นภาษาไทย');

    //Greeting Letter
    cy.get('textarea[formcontrolname="greetingLetter"]').first()
      .type('Sample Greeting Letter in English')
      .should('have.value', 'Sample Greeting Letter in English');

    cy.get('textarea[formcontrolname="greetingLetter"]').eq(1)
      .type('ตัวอย่างจดหมายทักทายภาษาไทย')
      .should('have.value', 'ตัวอย่างจดหมายทักทายภาษาไทย');

    //Billing Description (Your Package Name)
    cy.get('textarea[formcontrolname="yourPackage"]').first()
      .type('Sample Billing Description in English')
      .should('have.value', 'Sample Billing Description in English');

    cy.get('textarea[formcontrolname="yourPackage"]').eq(1)
      .type('ตัวอย่างคำอธิบายบิลภาษาไทย')
      .should('have.value', 'ตัวอย่างคำอธิบายบิลภาษาไทย');

    //SMS Greeting & Delete
    cy.get('select[formcontrolname="smsGreetingSendFlag"]').select('Send')
      .should('have.value', 'Send');

    cy.get('select[formcontrolname="smsGreetingSendFlag"]').select('Send')
      .should('have.value', 'Send');

    cy.get('textarea[formcontrolname="smsGreeting"]').first()
      .type('Sample SMS Greeting in English')
      .should('have.value', 'Sample SMS Greeting in English');

    cy.get('textarea[formcontrolname="smsGreeting"]').eq(1)
      .type('ตัวอย่าง SMS ทักทายภาษาไทย')
      .should('have.value', 'ตัวอย่าง SMS ทักทายภาษาไทย');

    cy.get('select[formcontrolname="smsDeleteSendFlag"]').select('Send')
      .should('have.value', 'Send');

    cy.get('textarea[formcontrolname="smsDelete"]').first()
      .type('Sample SMS Delete in English')
      .should('have.value', 'Sample SMS Delete in English');

    cy.get('textarea[formcontrolname="smsDelete"]').eq(1)
      .type('ตัวอย่าง SMS ลบแพ็กภาษาไทย')
      .should('have.value', 'ตัวอย่าง SMS ลบแพ็กภาษาไทย');

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
      cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
        .contains('Submit')
        .click();
      cy.wait(20000);

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
      cy.intercept('POST', '/PLMSpringBoot/api/po-fbb-view/findPoByPoGroupListAndOnTopCatagoryAndAllowBundleIsYAndStatusNotCancelAndNotHold/*').as('postScrollRequest');
      cy.intercept('GET', '/PLMSpringBoot/api/flw-common/checkAnswerForMore/*').as('getCheckAnswer');
      cy.intercept('GET', '/PLMSpringBoot/api/getProductInMKT/*').as('getProductInMKT');
      cy.intercept('GET', '/PLMSpringBoot/api/getSubmitDt/*').as('getSubmitDt');

      // Wait for API requests triggered after scrolling
      cy.wait(['@postScrollRequest', '@getCheckAnswer', '@getProductInMKT', '@getSubmitDt'], { timeout: 120000 });
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

      // Type into the first input field
      cy.get('.col-md-10 > :nth-child(2) > .input-group > .form-control', { timeout: 100000 })
        .type(cks);

      // Type into the second input field
      // พิมพ์ข้อมูลลงในฟิลด์
      cy.get('[style="margin-bottom:5px;"] > .input-group > .form-control', { timeout: 100000 })
        .type(ckspass);

      // ดักจับและรอให้ API getErrorCodes เสร็จสิ้น
      cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

      // คลิกปุ่มเพื่อดำเนินการต่อไป
      cy.get(':nth-child(4) > .btn').click();

      // รอให้ API getErrorCodes เสร็จสิ้น
      cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);

      // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
      cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
      cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
      cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

      // รอให้ API ต่าง ๆ เสร็จสิ้น
      cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });

      // เรียกใช้ฟังก์ชัน clamProject เพื่อ Claim Project
      clamProject(formattedDate);

      // Find the "To Do List" section
      approveProject(formattedDate);

      // รอให้หน้าเว็บโหลดเสร็จสมบูรณ์
      cy.get('body').should('be.visible'); // ตรวจสอบว่า body ปรากฏบนหน้า

      // ตรวจสอบว่า URL ตรงกับ #/new-flow/home/newcks/cks-doer
      cy.url().should('include', '#/new-flow/home/newcks/cks-doer');

      // ดำเนินการต่อไป
      cy.contains('button', 'Enhance PO')
        .should('be.visible')
        .click();
    });
  });
});