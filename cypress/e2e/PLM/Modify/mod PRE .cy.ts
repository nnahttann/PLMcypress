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
describe.only('PRE-PAID Main', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT PREPAID ${priceType}`, () => {
            it('MKT PREPAID role', () => {
                Master.ProjectBasicInformationCompleteModify(priceType, 'main', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true }, 2);
            });
            Master.afterMKTothersubgroup('Service', 'PRE');
        });
    });
});
describe('PRE-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT PREPAID ${priceType}`, () => {
            it('MKT PREPAID role', () => {
                Master.ProjectBasicInformationCompleteModify(priceType, 'ontop', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true }, 2);
            });
            Master.afterMKTothersubgroup('Service', 'PRE');
        });
    });
});
