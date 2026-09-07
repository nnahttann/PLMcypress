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
  "ssbsp",
  "ssbdp",
  "cpcsp",
  "cpcdp",
  "rom",
  "ckseasyapp",
  "aqss"
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

  defaultCommandTimeout: 100000,
  pageLoadTimeout: 6000000,
  requestTimeout: 1000000,
  responseTimeout: 1000000,

  chromeWebSecurity: false,

  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  allowCypressEnv: true,

  taskTimeout: 30000,
  screenshotOnRunFailure: false, // Disable screenshots on failures to save time
  video: false, // Disable video recording for faster test runs
  
  retries: {
    runMode: 1,
    openMode: 0,
  },

  env: {
    urlsit: "https://test-plm.intra.ais/#/login",

    MKTpre:   "mobpre",
    MKTpre1:  "mobpreaa",
    MKTpost:  "mobpost",
    MKTpost1: "mobpostaa",

    music:     "musicmkt",
    musicpass: "musicmkt",

    enter:     "entermkt",
    enterpass: "entermkt",

    ...userEnv,

    waitForAnimations:          false,
    animationDistanceThreshold: 0,
  },

  e2e: {
    baseUrl: "https://test-plm.intra.ais",

    setupNodeEvents(on, config) {
      on("before:browser:launch", (_browser, launchOptions) => {

        launchOptions.args.push("--disable-dev-shm-usage");
        launchOptions.args.push("--disable-gpu");
        launchOptions.args.push("--no-sandbox");

        launchOptions.args.push("--disable-background-networking");
        launchOptions.args.push("--disable-default-apps");
        launchOptions.args.push("--disable-extensions");
        launchOptions.args.push("--disable-hang-monitor");
        launchOptions.args.push("--disable-sync");
        launchOptions.args.push("--disable-translate");
        launchOptions.args.push("--metrics-recording-only");
        launchOptions.args.push("--no-first-run");
        launchOptions.args.push("--prerender-from-omnibox=disabled");
        launchOptions.args.push("--disable-component-extensions-with-background-pages");

        launchOptions.args.push("--disable-extensions-except");
        launchOptions.args.push("--mute-audio");
        launchOptions.args.push("--disable-media-session-api");
        launchOptions.args.push("--disable-default-apps");
        launchOptions.args.push("--enable-automation");
        launchOptions.args.push("--disable-popup-blocking");

        launchOptions.args.push(
          "--host-rules=" + [
            "MAP fonts.googleapis.com 127.0.0.1",
            "MAP fonts.gstatic.com 127.0.0.1",
            "MAP cdnjs.cloudflare.com 127.0.0.1",
          ].join(", ")
        );

        launchOptions.args.push("--disable-background-timer-throttling");
        launchOptions.args.push("--disable-renderer-backgrounding");

        launchOptions.args.push("--disable-websocket-from-service-worker");

        return launchOptions;
      });

      return config;
    },

    specPattern:  "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile:  "cypress/support/e2e.ts",
  },
});
