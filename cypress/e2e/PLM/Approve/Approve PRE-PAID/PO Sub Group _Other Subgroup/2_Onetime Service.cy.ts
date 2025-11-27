import * as Master from '../../../Master';

beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(Master.urlsit);
    cy.viewport(1920, 1080);
    Cypress.env('formattedDateMain', undefined);
    Cypress.env('formattedDateOntop', undefined);
    Cypress.env('formattedDateOntopExtra', undefined);
    Cypress.env('formattedDateMainPONAME', undefined);
    Cypress.env('formattedDateOntopPONAME', undefined);
    Cypress.env('formattedDateOntopExtraPONAME', undefined);
});

describe('Mobile', () => {
    it('MKT POSTPAID role', () => {
        Master.ProjectBasicInformationCompleteOtherPOSub('onetime','Service','PRE');

        Master.backBacicInfo();

        Master.addFile();
    });

    Master.afterMKTothersubgroup('Service','PRE');
});