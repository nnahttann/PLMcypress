
import './commands';

// Mirror every cy.log(...) call to the browser console as well
try {
  // Overwrite the built-in `log` command so it also writes to console
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Cypress as any).Commands?.overwrite?.('log', (orig: any, ...args: any[]) => {
    orig(...args);
    try {
      // eslint-disable-next-line no-console
      console.log(...args);
    } catch (e) {
      // ignore
    }
  });
} catch (err) {
  // best-effort; if overwrite fails, fall back to adding a simple patch
  // eslint-disable-next-line no-console
  console.warn('cLog wrapper: could not overwrite cy.log', err);
}



function applyGlobalIntercepts() {
  cy.intercept({ url: '**/__socket-graphql**' }, (req) => req.destroy()).as('blockedGraphqlWS');

  cy.intercept('GET', 'https://fonts.googleapis.com/**', { statusCode: 200, body: '' }).as('blockedFonts');
  cy.intercept('GET', 'https://cdnjs.cloudflare.com/**', { statusCode: 200, body: '' }).as('blockedCDN');
  cy.intercept('GET', 'https://fonts.gstatic.com/**',   { statusCode: 200, body: '' }).as('blockedGstatic');


  cy.intercept('GET', '**/newApi/CheckTask/setUserOnline**', { statusCode: 200, body: {} }).as('stubUserOnline');

  cy.intercept('GET', '**/newApi/CheckTask/deleteData/**', { statusCode: 200, body: {} }).as('stubDeleteData');

  cy.intercept('GET', '**/api/plm-error-code/getAll', { statusCode: 200, body: [] }).as('stubErrorCodes');

  // (other flwCfgLov endpoints may carry real data needed by test assertions)
  cy.intercept('POST', '**/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam',
    { statusCode: 200, body: { content: [], totalElements: 0 } }
  ).as('stubFlwCfgLov');

  cy.intercept('GET', '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndlovType/FLW_BROADCAST/**',
    { statusCode: 200, body: [] }
  ).as('stubFlwBroadcast');

  cy.intercept('GET', '**/api/flw-cfg-lov/getActiveFlagFlwApi/**',
    { statusCode: 200, body: [] }
  ).as('stubActiveFlagFlw');
}


before(() => {
  applyGlobalIntercepts();
});

beforeEach(() => {
  applyGlobalIntercepts();
});

afterEach(() => {
  Cypress.env('formattedDateMain', undefined);
  Cypress.env('formattedDateOntop', undefined);
  Cypress.env('formattedDateOntopExtra', undefined);
  Cypress.env('formattedDateMainPONAME', undefined);
  Cypress.env('formattedDateOntopPONAME', undefined);
  Cypress.env('formattedDateOntopExtraPONAME', undefined);
});
