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
        timeout: 60000000,
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
    cy.get('app-login', { timeout: 60000000 }).should('be.visible');
    cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000000 }).should('be.visible');
});
describe('PRE-PAID Main', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
                });
                Master.afterMKTMainPRE_FullSpadFlow();
            });
        });
        describe.only(`Plugin ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
                });
                Master.afterMKTMainPRE_NotComplex();
            });
        });
    });
});
