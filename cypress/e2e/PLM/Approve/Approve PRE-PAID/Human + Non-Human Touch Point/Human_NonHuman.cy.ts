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
// Rom, Easy App Rom & USSD (Human + Non-Human Touch Point) - Main
// ========================
describe('Rom, Easy App Rom & USSD - PRE-PAID Main', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runHumanTouchPoint: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTMainPRE_FullSpadFlow();
            });
        });
    });
});

// ========================
// Rom, Easy App Rom & USSD (Human + Non-Human Touch Point) - Ontop
// ========================
describe('Rom, Easy App Rom & USSD - PRE-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runHumanTouchPoint: true,
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
                        runHumanTouchPoint: true,
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
                        runHumanTouchPoint: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
});

// ========================
// Rom, Easy App Rom & USSD (Human + Non-Human Touch Point) - OntopExtra
// ========================
describe('Rom, Easy App Rom & USSD - PRE-PAID OntopExtra', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];

    priceTypes.forEach((priceType) => {
        describe(`${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runHumanTouchPoint: true,
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
                        runHumanTouchPoint: true,
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
                        runHumanTouchPoint: true,
                        runNonHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
    });
});
