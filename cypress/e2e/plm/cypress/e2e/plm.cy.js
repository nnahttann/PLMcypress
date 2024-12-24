const urlsit = Cypress.env('urlsit')
const MKTpre = Cypress.env('MKTpre')
const MKTpre1 = Cypress.env('MKTpre1')

beforeEach(function () {
  cy.visit(urlsit);
});
describe('Mobile', () => {
  it.only('MKT Prepaid role', () => {
    // 
    cy.get('.col-md-10 > :nth-child(2) > .input-group > .form-control').type(MKTpre);

    cy.get('[style="margin-bottom:5px;"] > .input-group > .form-control').type(MKTpre1);

    cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

    cy.get(':nth-child(4) > .btn').click();

    cy.wait('@getErrorCodes').its('response.statusCode').should('eq', 200);

    // create New Project
    cy.get('.col-md-10 > .btn').click();

    const now = new Date();
    const formattedDate = `Mobile_Prepaid_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

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
    cy.get('.col-md-10 > div > :nth-child(2)').click();

    cy.wait(2000)
    // cy.wait('@getNRM_PMT').its('response.statusCode').should('eq', 200);

    //button Close
    cy.get('.ng-star-inserted > div > .btn').click();
    cy.wait(2000)

    // Button Add Project 
    cy.get(':nth-child(4) > .btn').click();

    const formattedDatePONAME = `Mobile_Prepaid_PONAME${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

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
    cy.wait('@getPoRowId', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
    // cy.wait('@getCfgLov', { timeout: 35000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getProject', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    cy.wait(5000)

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
    cy.get(':nth-child(13) > .col-md-12 > .form-group > .col-md-8 > .form-control').type('Test Remark')

    //Multi Duration
    
  });
});