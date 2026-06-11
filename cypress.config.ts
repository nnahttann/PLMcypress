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
  pageLoadTimeout: 90000,
  requestTimeout: 30000,
  responseTimeout: 60000,

  chromeWebSecurity: false,

  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,

  retries: {
    runMode: 1,
    openMode: 0,
  },

  env: {
    urlsit: "https://test-plm.intra.ais/#/login",

    MKTpre: "mobpre",
    MKTpre1: "mobpreaa",
    MKTpost: "mobpost",
    MKTpost1: "mobpostaa",

    music: "musicmkt",
    musicpass: "musicaaa",

    enter: "entermkt",
    enterpass: "enteraaa",

    ...userEnv,
  },

  e2e: {
    baseUrl: "https://test-plm.intra.ais",

    setupNodeEvents(on, config) {
      on("before:browser:launch", (_browser, launchOptions) => {
        launchOptions.args.push("--disable-dev-shm-usage");
        launchOptions.args.push("--disable-gpu");
        launchOptions.args.push("--no-sandbox");
        launchOptions.args.push("--disable-background-networking");
        // Block requests to external CDN that are unreachable from intranet
        launchOptions.args.push("--host-rules=MAP fonts.googleapis.com 127.0.0.1, MAP cdnjs.cloudflare.com 127.0.0.1");

        return launchOptions;
      });

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  },
});