import * as Master from '../Master';

type PriceType = 'onetime' | 'recurring' | 'usage';

beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then((win) => {
        win.sessionStorage.clear();
    });
    cy.visit(Master.urlsit, {
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
});

describe.only('PRE-PAID Main', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT PREPAID ${priceType}`, () => {
            it('MKT PREPAID role', () => {
                Master.ProjectBasicInformationCompleteModify(
                    priceType,
                    'main',
                    { Module: 'PRE', subModule: 'PRE', autoSetDuration: true },
                    2
                );
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
                Master.ProjectBasicInformationCompleteModify(
                    priceType,
                    'ontop',
                    { Module: 'PRE', subModule: 'PRE', autoSetDuration: true },
                    2
                );
            });

            Master.afterMKTothersubgroup('Service', 'PRE');
        });
    });
});