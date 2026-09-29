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
describe('PRE-PAID OntopEx', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true });
                });
                Master.afterMKTontopPRE();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'ENTER', subModule: 'PRE', autoSetDuration: true });
                });
                Master.afterMKTontopPREENTER();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
    priceTypes.forEach((priceType) => {
        describe(`PlugIN ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'PRE', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
                });
                Master.afterMKTontopPRE();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
                });
                Master.afterMKTontopPREENTER();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', { Module: 'MUSIC', subModule: 'PRE', autoSetDuration: true, Plugin: 'Pl' });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
});
