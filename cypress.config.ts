import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    defaultCommandTimeout: 100000,        // timeout สำหรับคำสั่งทั่วไป (default: 4000ms)
    pageLoadTimeout: 600000,              // timeout สำหรับการโหลดหน้า (default: 60000ms)
    requestTimeout: 100000,               // timeout สำหรับ request (default: 5000ms)
    responseTimeout: 300000,              // timeout สำหรับ response (default: 30000ms)
    execTimeout: 600000,                  // timeout สำหรับคำสั่ง cy.exec() (default: 60000ms)
    taskTimeout: 600000,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 10,
    retries: {
      runMode: 1,
      openMode: 0
    }
  },
});
