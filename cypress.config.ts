import { defineConfig } from "cypress";

export default defineConfig({
  // 🔹 Root-level options (วางนอก e2e)
  viewportWidth: 1920,
  viewportHeight: 1080,
  defaultCommandTimeout: 10000,
  pageLoadTimeout: 600000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 10,
  chromeWebSecurity: false,
  retries: {
    runMode: 1,
    openMode: 0
  },

  // 🔹 E2E-specific options
  e2e: {
    setupNodeEvents(_on, _config) {
    },
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "https://test-plm.intra.ais",
  },
});