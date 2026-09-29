import * as Master from '../../../Master';
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
describe('USSD - POST-PAID Main', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', {
                        Module: 'POST',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                if (priceType === 'usage') {
                    Master.afterMKTMainUsagePOST();
                }
                else {
                    Master.afterMKTMAINPOST();
                }
            });
        });
    });
});
describe('USSD - POST-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'POST',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPOST();
            });
            describe('ENTER', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'ENTER',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopENTER();
            });
            describe('MUSIC', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'MUSIC',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopMUSIC();
            });
        });
    });
});
describe('USSD - POST-PAID OntopExtra', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'POST',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPOST();
            });
            describe('ENTER', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'ENTER',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopENTER();
            });
            describe('MUSIC', () => {
                it('MKT POSTPAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'MUSIC',
                        subModule: 'POST',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopMUSIC();
            });
        });
    });
});
