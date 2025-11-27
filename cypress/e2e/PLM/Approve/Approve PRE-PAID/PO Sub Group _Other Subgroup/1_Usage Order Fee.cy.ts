import * as Master from '../../../Master';
beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(Master.urlsit);
    cy.viewport(1920, 1080);
});

describe('Mobile', () => {
    it('MKT PRE-PAID role', () => {
        Master.ProjectBasicInformationCompleteOtherPOSub('usage','OrderFee','PRE');

        Master.backBacicInfo();

        Master.addFile();
    });
    Master.afterMKTothersubgroup('OrderFee','PRE');
});

