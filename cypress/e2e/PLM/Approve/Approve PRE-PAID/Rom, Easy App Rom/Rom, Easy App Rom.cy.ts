import * as Master from '../../../Master';

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

describe('Rom, Easy App Rom - PRE-PAID Main Onetime', () => {
  describe('Mobile', () => {
    it('MKT PREPAID role', () => {
      Master.ProjectBasicInformationComplete('onetime', 'main', {
        Module: 'PRE',
        subModule: 'PRE',
        autoSetDuration: true,
        runHumanTouchPoint: true
      });
    });
    Master.afterMKTMainPRE_FullSpadFlow();
  });
});