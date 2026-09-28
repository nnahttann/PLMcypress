import * as Master from '../../Master';
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
        timeout: 60000,
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
    cy.get('app-login', { timeout: 60000 }).should('be.visible');
    cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000 }).should('be.visible');
});
describe('POST-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['onetime'];
    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'POST', subModule: 'POST', autoSetDuration: true });
                });
                Master.afterMKTontopPOST();
            });
            describe('ENTER', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
                });
                Master.afterMKTontopENTER();
            });
            describe.only('MUSIC', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', { Module: 'MUSIC', subModule: 'POST', autoSetDuration: true });
                });
                Master.afterMKTontopMUSIC();
            });
        });
    });
});
