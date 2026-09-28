import * as Master from '../../Master';
let isFirstRun = true;
beforeEach(() => {
    if (isFirstRun) {
        cy.clearLocalStorage();
        cy.clearCookies();
        cy.window().then((win) => {
            win.sessionStorage.clear();
        });
        isFirstRun = false;
    }
    cy.visit(Master.urlsit, {
        timeout: 60000,
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
    cy.get('app-login', { timeout: 60000 }).should('be.visible');
    cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000 }).should('be.visible');
    Cypress.env('formattedDateMain', undefined);
    Cypress.env('formattedDateOntop', undefined);
    Cypress.env('formattedDateOntopExtra', undefined);
    Cypress.env('formattedDateMainPONAME', undefined);
    Cypress.env('formattedDateOntopPONAME', undefined);
    Cypress.env('formattedDateOntopExtraPONAME', undefined);
});
describe('POST-PAID PO Sub Group', () => {
    const subTypes = ['AccountFee', 'OrderFee', 'CashBack', 'Service', 'GroupPoFee'] as const;
// const subTypes = ['AccountFee] as const;
// const subTypes = ['OrderFee'] as const;
// const subTypes = ['CashBack'] as const;
// const subTypes = ['Service'] as const;
// const subTypes = ['GroupPoFee'] as const;

    subTypes.forEach((subType) => {
        it(`MKT POSTPAID role - ${subType}`, () => {
            Master.ProjectBasicInformationCompleteOtherPOSub('onetime', subType, 'POST');
            // Master.backBacicInfo();
            // Master.addFile();
        });
            Master.afterMKTothersubgroup(subType, 'POST'); 
    });
});
