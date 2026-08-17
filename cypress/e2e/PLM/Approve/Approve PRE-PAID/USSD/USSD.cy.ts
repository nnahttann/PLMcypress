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
        timeout: 60000,
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });

    cy.get('app-login', { timeout: 60000 }).should('be.visible');
    cy.get('input[name="userId"], input[name="pwd"]', { timeout: 60000 }).should('be.visible');
});

// ========================
// USSD (Non-Human Touch Point) - Main
// ========================
describe('USSD - PRE-PAID Main', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTMainPRE_FullSpadFlow();
            });
        });
    });
});

// ========================
// USSD (Non-Human Touch Point) - Ontop
// ========================
describe('USSD - PRE-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPRE();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'ENTER',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREENTER();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'MUSIC',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
});

// ========================
// USSD (Non-Human Touch Point) - OntopExtra
// ========================
describe('USSD - PRE-PAID OntopExtra', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPRE();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'ENTER',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREENTER();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'MUSIC',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
});
