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
        onBeforeLoad: (win) => {
            win.document.documentElement.style.setProperty('--animation-duration', '0ms', 'important');
        }
    });
});

describe('POST-PAID Main', () => {
    const priceTypes: PriceType[] = ['recurring'];
    priceTypes.forEach((priceType) => {
        describe(`MKT POSTPAID ${priceType}`, () => {
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
            } else {
                Master.afterMKTMAINPOST();
            }
        });
    });
});
