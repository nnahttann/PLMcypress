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

// Disable all animations globally before any test runs
before(() => {
  cy.document().then((doc) => {
    const style = doc.createElement('style')
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `
    doc.head.appendChild(style)
  })
})

beforeEach(() => {
  // Aggressively block ALL external resources at the network level
  cy.intercept('GET', '**/*.{png,jpg,jpeg,gif,svg,ico,woff,woff2,ttf,eot,otf,webp,bmp,tif,tiff}', { statusCode: 204 })
  cy.intercept('GET', '**/fonts/**', { statusCode: 204 })
  cy.intercept('GET', 'https://fonts.googleapis.com/**', { statusCode: 204, body: '' })
  cy.intercept('GET', 'https://fonts.gstatic.com/**', { statusCode: 204 })
  cy.intercept('GET', 'https://cdnjs.cloudflare.com/**', { statusCode: 204, body: '' })
  cy.intercept('GET', 'https://unpkg.com/**', { statusCode: 204 })
  cy.intercept('GET', 'https://maxcdn.bootstrapcdn.com/**', { statusCode: 204 })
  cy.intercept('GET', 'https://www.googletagmanager.com/**', { statusCode: 204 })
  cy.intercept('GET', 'https://www.google-analytics.com/**', { statusCode: 204 })
  cy.intercept('GET', '**/*analytics**', { statusCode: 204 })
  cy.intercept('GET', '**/*tracking**', { statusCode: 204 })
  cy.intercept('GET', '**/ads/**', { statusCode: 204 })
  
  // Block images by content type
  cy.intercept({ resourceType: /image/ }, { statusCode: 204 })
  cy.intercept({ resourceType: /font/ }, { statusCode: 204 })
  cy.intercept({ resourceType: /media/ }, { statusCode: 204 })
  
  // Disable CSS animations on every page load
  cy.document().then((doc) => {
    let style = doc.getElementById('cypress-disable-animations')
    if (!style) {
      style = doc.createElement('style')
      style.id = 'cypress-disable-animations'
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
      `
      doc.head.appendChild(style)
    }
  })
})
