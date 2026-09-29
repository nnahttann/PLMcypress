import * as Master from '../Master';
type PriceType = 'onetime' | 'recurring' | 'usage';
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
        timeout: 60000000,
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
    cy.get('app-login', { timeout: 60000000 }).should('be.visible');
    cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000000 }).should('be.visible');
});
describe.only('POST-PAID Main', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT POSTPAID ${priceType}`, () => {
            it('MKT POSTPAID role', () => {
                Master.ProjectBasicInformationCompleteModify(priceType, 'main', { Module: 'POST', subModule: 'POST', autoSetDuration: true }, 2);
            });
            Master.afterMKTothersubgroup('Service', 'POST');
        });
    });
});
describe('POST-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT POSTPAID ${priceType}`, () => {
            it('MKT POSTPAID role', () => {
                Master.ProjectBasicInformationCompleteModify(priceType, 'ontop', { Module: 'POST', subModule: 'POST', autoSetDuration: true }, 2);
            });
            Master.afterMKTothersubgroup('Service', 'POST');
        });
    });
});
