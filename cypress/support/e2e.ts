/// <summary>
/// e2e.ts - Global setup before every test file
/// Performance optimizations:
/// 1. Block __socket-graphql WebSocket that hangs 23s before test starts
/// 2. Intercept external CDNs — applied both in before() and beforeEach()
/// 3. Stub high-frequency PLM APIs that fire on every Angular mount
/// 4. Re-apply all intercepts in beforeEach (Cypress clears between tests)
/// </summary>

import './commands';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyGlobalIntercepts() {
  // ── 🔥 Bug #1: Block Cypress GraphQL socket that hangs ~23s ──────────────
  // wss://__socket-graphql opens a connection and waits forever before test begins
  cy.intercept({ url: '**/__socket-graphql**' }, (req) => req.destroy()).as('blockedGraphqlWS');

  // ── Bug #2: Block external CDNs (belt-and-suspenders on top of --host-rules) ──
  // --host-rules in cypress.config.ts handles DNS level, but intercept catches
  // any that slip through (e.g. cdnjs via Angular's lazy chunk loading in iframe)
  cy.intercept('GET', 'https://fonts.googleapis.com/**', { statusCode: 200, body: '' }).as('blockedFonts');
  cy.intercept('GET', 'https://cdnjs.cloudflare.com/**', { statusCode: 200, body: '' }).as('blockedCDN');
  cy.intercept('GET', 'https://fonts.gstatic.com/**',   { statusCode: 200, body: '' }).as('blockedGstatic');

  // ── Bug #3: Stub high-frequency PLM APIs that fire on every Angular mount ──
  // HAR shows these called 3–8x per test with heavy BLOCKED time (connection pool)

  // setUserOnline: called 3x, total 2,864ms (1,252ms blocked each)
  cy.intercept('GET', '**/newApi/CheckTask/setUserOnline**', { statusCode: 200, body: {} }).as('stubUserOnline');

  // deleteData: called on login, blocks connection pool
  cy.intercept('GET', '**/newApi/CheckTask/deleteData/**', { statusCode: 200, body: {} }).as('stubDeleteData');

  // plm-error-code/getAll: called 4x, total 5,300ms (1,322ms blocked each)
  cy.intercept('GET', '**/api/plm-error-code/getAll', { statusCode: 200, body: [] }).as('stubErrorCodes');

  // flwCfgLov: called 8x POST, total 7,032ms — stub only the param variant
  // (other flwCfgLov endpoints may carry real data needed by test assertions)
  cy.intercept('POST', '**/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam',
    { statusCode: 200, body: { content: [], totalElements: 0 } }
  ).as('stubFlwCfgLov');

  // FLW_BROADCAST: called 2x, 1,528ms total — safe to stub
  cy.intercept('GET', '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndlovType/FLW_BROADCAST/**',
    { statusCode: 200, body: [] }
  ).as('stubFlwBroadcast');

  // getActiveFlagFlwApi: called for NRM_RTMT, 718ms blocked 608ms
  cy.intercept('GET', '**/api/flw-cfg-lov/getActiveFlagFlwApi/**',
    { statusCode: 200, body: [] }
  ).as('stubActiveFlagFlw');
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

before(() => {
  // Apply once before entire suite — catches the very first page load
  applyGlobalIntercepts();
});

beforeEach(() => {
  // Must re-apply: Cypress clears cy.intercept() registrations between each test
  applyGlobalIntercepts();
});