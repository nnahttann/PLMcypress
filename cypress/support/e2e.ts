// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Block external resource requests to speed up page load
beforeEach(() => {
  // Block Google Fonts and CDN requests that timeout on intranet
  cy.intercept('GET', '**/fonts.googleapis.com/**', { statusCode: 200, body: '' })
  cy.intercept('GET', '**/cdnjs.cloudflare.com/**', { statusCode: 200, body: '' })
  cy.intercept('GET', '**/fonts.gstatic.com/**', { statusCode: 200, body: '' })
})