import * as Master from '../../../Master';
beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit(Master.urlsit);
    cy.viewport(1920, 1080);
});

describe('Mobile', () => {
    it('MKT POSTPAID role', () => {
        Master.ProjectBasicInformationCompleteOtherPOSub('onetime','CashBack','POST');

        Master.backBacicInfo();

        Master.addFile();
    });
    Master.afterMKTothersubgroup('Cashback','POST');

});

