
const urlsit: string = Cypress.env('urlsit');
const MKTpre: string = Cypress.env('MKTpre');
const MKTpre1: string = Cypress.env('MKTpre1');

beforeEach(() => {
  cy.visit(urlsit);
  cy.viewport(1920, 1080);
});
const verify = () => {
  const field: string[] = [
    '*PO Name', '*Project Name', '*Project Owner', '*Customer Type', '*Price Type', '*Customer Type', '*Price Type', '*Commercial Launch Date', '*Product Class', '*Recurring Fee Deduction', '*Expire Date', '*Promotion Level', '*Package Duration', 'Fixed Start Date', '*Share Plan', '*Package Bill Cycle', 'Fixed End Date', '*Prorate Package Fee', '*Bill Period', 'PO Type', '*NRTG/NGCM(WO1044)', '*Target Group', 'PO Type', '*NRTG/NGCM(WO1056)', '*NRTG/PHX(WO1054)', '*NRTG/PHX(WO1055)', 'Handset', 'Promotion Group', 'Promotion Sub Group', 'Remark', '*Multi Duration', '*Full Price Excluding VAT', '*Full Price Including VAT', 'Partial Step', '*Target Customer', '*Product Specification', 'Selling Location & Channel', 'Market Segment', 'SMS Wording', 'Special Condition', 'Retry Pattern', 'PO Relation', 'Commu Touch Point', 'Other Privilege', 'Charge Partner'
  ]
  field.forEach((field: string) => {
    cy.contains(field).should('be.visible');
  });
}

const targetgroup = () => {
  const optionsToSelectTargetgroup = [
    // 'Change Charge Type (Convert)',
    // 'Existing',
    'New',
    // 'Port In (Mobile Number Port)',
    // 'Renew / Recall from Terminate'
  ];

  optionsToSelectTargetgroup.forEach(option => {
    cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
      .contains(option)
      .dblclick();
  });
}
describe('Mobile', () => {
  it.only('MKT Prepaid role', () => {
    // 
    cy.get('.col-md-10 > :nth-child(2) > .input-group > .form-control').type(MKTpre);

    cy.get('[style="margin-bottom:5px;"] > .input-group > .form-control').type(MKTpre1);

    cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

    cy.get(':nth-child(4) > .btn').click();

    cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);

    // create New Project
    cy.get('.col-md-10 > .btn').should('be.visible').click();

    const now = new Date();
    const formattedDate = `Mobile_Prepaid_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

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
    cy.get(':nth-child(4) > .col-md-3 > .form-group > :nth-child(2) > .form-control').type('0123')
    // cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_PMT/INITIAL_PMT').as('getNRM_PMT');
    // button Save
    cy.get('.col-md-10 > div > :nth-child(2)').should('be.visible').click();

    cy.wait(5000)
    // cy.wait('@getNRM_PMT').its('response.statusCode').should('eq', 200);

    //button Close
    // Add 
    cy.get('.ng-star-inserted > div > .btn').should('be.visible').click();
    cy.wait(5000)

    // Button Add Project 
    cy.get(':nth-child(4) > .btn').click();

    const formattedDatePONAME = `Onetime_Main_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    // PO Name 
    cy.get('.modal-body > .ng-star-inserted > .form-control').type(formattedDatePONAME);

    //PO Sub group
    // Product Offering
    cy.get('.col-md-4 > .form-control').select('Product Offering').should('have.value', 'Product Offering');
    // Order Fee
    // cy.get('.col-md-4 > .form-control').select('Order Fee').should('have.value', 'Order Fee');
    //Service
    // cy.get('.col-md-4 > .form-control').select('Service').should('have.value', 'Service');

    //button create 
    // Intercept initial requests
    cy.intercept('POST', '/PLMSpringBoot/api/plm-po/addUpdate/*').as('addUpdatePO');
    cy.intercept('GET', '/PLMSpringBoot/api/market-segment/getListMarketSegment').as('getListMarketSegment');
    cy.intercept('POST', '/PLMSpringBoot/api/mass-po-detail/addUpdate/').as('addMassPODetail');
    cy.intercept('GET', '/PLMSpringBoot/api/plm-po/getPoListByProjectIdForMobile/*').as('getPoList');

    // Trigger the button click action
    cy.get('.modal-footer > :nth-child(2) > .btn-primary').click();

    // Wait for initial responses
    cy.wait('@addUpdatePO').its('response.statusCode').should('eq', 200);
    cy.wait('@getListMarketSegment').its('response.statusCode').should('eq', 200);
    cy.wait('@addMassPODetail').its('response.statusCode').should('eq', 200);
    cy.wait('@getPoList').its('response.statusCode').should('eq', 200);

    // Wait for URL change (wait for the page reload or redirection)
    cy.url().should('include', '/#/project-home/project-basic-information');  // Update to match the actual URL or part of it
    cy.wait(35000)
    // Intercept new requests triggered by the new URL
    cy.intercept('GET', '/PLMSpringBoot/api/mass-po-detail/getByPoRowId/*').as('getPoRowId');
    // cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getByGroupTypeAndActiveFlagOrderByOrderbyAsc/*').as('getCfgLov');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');

    // Wait for the new requests after URL change
    // cy.wait('@getPoRowId', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    // cy.wait('@getCfgLov', { timeout: 35000 }).its('response.statusCode').should('eq', 200);
    // cy.wait('@getProject', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    cy.wait(5000)

    //TC01
    verify();

    //Flow
    //PriceType 
    // Select "One-Time" option
    cy.get('select[formcontrolname="priceType"]').select('1: One-Time', { force: true }).should('have.value', '1: One-Time');

    // Select "Recurring" option
    // cy.get('select[formcontrolname="priceType"]').select('2: Recurring', { force: true }).should('have.value', '2: Recurring');

    // Select "Usage" option
    // cy.get('select[formcontrolname="priceType"]').select('3: Usage', { force: true }).should('have.value', '3: Usage');

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
    // cy.get(':nth-child(12) > .col-md-12 > .form-group > .col-md-8 > .form-control').type('Test Remark')

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
    //value Change Charge Type (Convert)
    // cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    // .contains('Change Charge Type (Convert)')
    // .dblclick(); 

    // cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    // .contains('Existing')
    // .dblclick(); 

    // cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    // .contains('New')
    // .dblclick(); 

    // cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    // .contains('Port In (Mobile Number Port)')
    // .dblclick(); 

    // cy.get(':nth-child(7) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    // .contains('Renew / Recall from Terminate')
    // .dblclick(); 

    targetgroup();

    //ProductSpec
    // const optionsToSelectProductSpec= [
    //   // "AI IP Camera",
    //   // "AIS Secure Net",
    //   // "Apple Care",
    //   // "Cloud Game",
    //   // "Cloud PC",
    //   // "Content VDO",
    //   // "Flowaccount",
    //   // "Internet",
    //   // "MMS",
    //   // "Mobile Care",
    //   // "SMS",
    //   // "Vertical App",
    //   // "Voice",
    //   // "WiFi",
    //   // "Youtube Premium"

    // ];

    // optionsToSelectProductSpec.forEach(option => {
    //   cy.get(':nth-child(8) > .panel-body > :nth-child(1) > .col-md-12 > .form-group > .col-md-6 > ng2-dual-list-box > .row > :nth-child(1) > .list-box')
    //     .contains(option) 
    //     .dblclick(); 
    // });

    //Nav Internet
    cy.scrollTo('bottom')
    cy.get('.scrollmenu > .nav').contains('Internet').should('be.visible').click();

    //button add
    cy.get('[style="width:60px"]').click();

    //Intternet Quota type 
    // Limited Data (Pay per use)
    cy.get('form.ng-untouched > :nth-child(2) > .form-group > .col-md-12 > .col-md-4 > .form-control')
      .select('Limited Data (Pay per use)')
      .should('have.value', 'Limited Data (Pay per use)');

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
      '5G/4G/3G 10 GB',
      '5G/4G/3G 20 GB',
      '5G/4G/3G 150 GB',
      '5G/4G/3G 350 GB',
      '4G/3G 10 GB',
      '4G/3G 20 GB',
      '5G/4G/3G 30 GB'
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
      '4Gbps/4Gbps',
      '3Gbps/3Gbps',
      'Max Speed (5G 2Gbps/2Gbps)',
      'Max Speed (5G Default 1Gbps/1Gbps)',
      '450 Mbps',
      '300 Mbps',
      '150 Mbps',
      '50 Mbps',
      '42 Mbps',
      '30 Mbps',
      '21 Mbps',
      '20 Mbps',
      '15 Mbps',
      '12 Mbps',
      '11 Mbps',
      '10 Mbps',
      '8 Mbps',
      '7.2 Mbps',
      '6 Mbps',
      '5 Mbps',
      '4 Mbps',
      '3 Mbps',
      '2 Mbps',
      '1 Mbps',
      '512 Kbps',
      '384 Kbps',
      '256 Kbps',
      '128 Kbps',
      '64 Kbps',
      '10 Kbps',
      '0 Kbps',
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
    cy.get(':nth-child(2) > :nth-child(2) > .btn').should('be.visible').click();

    //Send SMS Greeting Flag 
    cy.get(':nth-child(7) > .collapse-panel > form.ng-untouched > :nth-child(1) > .col-md-12 > .col-md-6 > :nth-child(2) > .form-control').select('Send').should('have.value', 'Send');

    // SMS Confirm Subscription success on CBS(One time/Recurring)
    cy.get('.row.ng-star-inserted > .col-md-12 > .col-md-6 > :nth-child(2) > .form-control').select('Send').should('have.value', 'Send');

    // Send SMS Delete Flag
    cy.get(':nth-child(5) > .col-md-12 > .col-md-6 > :nth-child(2) > .form-control').select('Send').should('have.value', 'Send');

    //Save button
    cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();

    //Buttom Close
    cy.get('.modal-footer', { timeout: 10000 }).should('be.visible');
    cy.get('.modal-footer').find('button.btn-danger').click();


    //Back to Project Basic Information 
    cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });

    // Do you want save PO? 
    cy.get('.modal-body > .col-md-12 > :nth-child(1) > .btn').should('be.visible').click();

    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    cy.wait(10000);
    cy.readFile('D:/PLMcypress/cypress/e2e/plm/cypress/fixtures/file.pdf', 'binary').then((fileContent) => {
      cy.get('input[type="file"][id="files"]').selectFile(
        {
          contents: Cypress.Buffer.from(fileContent, 'binary'),
          fileName: 'file.pdf',
          mimeType: 'application/pdf',
        },
        { force: true }
      );
      //description 
      cy.get(':nth-child(2) > :nth-child(2) > .form-control').type('Description');

      //Button 
      cy.get(':nth-child(3) > :nth-child(1) > .btn').click();

      // *Approve memo 
      cy.get('.row.ng-star-inserted > .col-md-6 > input').click();

      // button Submit
      cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
        .contains('Submit')
        .click();
      cy.wait(10000);

      // Assuming the table is in the "Unassigned Task" section
      cy.get('h3').contains('Unassigned Task').parent().within(() => {
        // Iterate through each row in the table
        cy.get('tbody tr').each(($row) => {
          // Check if the row contains the formattedDate
          if ($row.text().includes(formattedDate)) {
            // If found, click the button within that row
            cy.wrap($row).find('button.btn.btn-circle.btn-xs.btn-success.claim-top').click();
            return false; // Exit the loop once the button is clicked
          }
        });
      });
    });
  });
});