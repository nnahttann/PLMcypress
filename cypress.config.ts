import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
    },
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
  viewportWidth: 1920,
  viewportHeight: 1080,
  },
});
