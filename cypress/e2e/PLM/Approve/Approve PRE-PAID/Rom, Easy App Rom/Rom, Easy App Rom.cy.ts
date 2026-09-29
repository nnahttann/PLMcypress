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
describe('Rom, Easy App Rom - PRE-PAID Main', () => {
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
                    });
                });
                Master.afterMKTMainPRE_FullSpadFlow();
            });
        });
        describe(`Plugin ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'main', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTMainPRE_NotComplex();
            });
        });
    });
});
describe('Rom, Easy App Rom - PRE-PAID Ontop', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runHumanTouchPoint: true,
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
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
        describe(`Plugin ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREPlugin();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'ENTER',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREENTERPlugin();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontop', {
                        Module: 'MUSIC',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMusicPlugin();
            });
        });
    });
});
describe('Rom, Easy App Rom - PRE-PAID OntopExtra', () => {
    const priceTypes: PriceType[] = ['onetime', 'recurring', 'usage'];
    priceTypes.forEach((priceType) => {
        describe(`Standard ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        runHumanTouchPoint: true,
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
                    });
                });
                Master.afterMKTontopPREMUSIC();
            });
        });
        describe(`Plugin ${priceType}`, () => {
            describe('Mobile', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'PRE',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREPlugin();
            });
            describe('ENTER', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'ENTER',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREENTERPlugin();
            });
            describe('MUSIC', () => {
                it('MKT PRE-PAID role', () => {
                    Master.ProjectBasicInformationComplete(priceType, 'ontopextra', {
                        Module: 'MUSIC',
                        subModule: 'PRE',
                        autoSetDuration: true,
                        Plugin: 'Pl',
                        runHumanTouchPoint: true,
                    });
                });
                Master.afterMKTontopPREMusicPlugin();
            });
        });
    });
});
