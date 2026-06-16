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

  defaultCommandTimeout: 5000,
  pageLoadTimeout: 30000,
  requestTimeout: 15000,
  responseTimeout: 30000,

  chromeWebSecurity: false,

  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  blockHosts: ['fonts.googleapis.com', 'cdnjs.cloudflare.com', 'fonts.gstatic.com'],

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
    baseUrl: "https://test-plm2.intra.ais",

    setupNodeEvents(on, config) {
      on("before:browser:launch", (_browser, launchOptions) => {
        launchOptions.args.push("--disable-dev-shm-usage");
        launchOptions.args.push("--disable-gpu");
        launchOptions.args.push("--no-sandbox");
        launchOptions.args.push("--disable-background-networking");
        launchOptions.args.push("--disable-web-security");
        // Block requests to external CDN that are unreachable from intranet
        launchOptions.args.push("--host-rules=MAP fonts.googleapis.com 127.0.0.1, MAP cdnjs.cloudflare.com 127.0.0.1, MAP fonts.gstatic.com 127.0.0.1");

        return launchOptions;
      });

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  },
});