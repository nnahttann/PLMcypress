import { defineConfig } from "cypress";

const users = [
  "cks",
  "cgcirb",
  "cgccbs",
  "cgtcbs",
  "cgtirb",
  "actm",
  "oper",
  "spadsup",
  "spaddoer",
  "spadtest",
  "spaddp",
  "apo",
  "enter",
  "music",
  "tscenter",
  "aafsp",
  "csisp",
  "e2etest",
  "aafdp",
  "csidp",
  "e2edp",
  "sasff",
];

const userEnv = Object.fromEntries(
  users.flatMap((user) => [
    [user, user],
    [`${user}pass`, user.padEnd(8, "a")],
  ])
);

export default defineConfig({
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
    openMode: 0,
  },

  env: {
    urlsit: "https://test-plm.intra.ais/#/login",

    // Exception
    MKTpre: "mobpre",
    MKTpre1: "mobpreaa",
    MKTpost: "mobpost",
    MKTpost1: "mobpostaa",

    ...userEnv,
  },

  e2e: {
    setupNodeEvents(_on, _config) {},

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    baseUrl: "https://test-plm.intra.ais",
  },
});