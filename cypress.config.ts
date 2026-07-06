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
  pageLoadTimeout: 60000,
  requestTimeout: 10000,
  responseTimeout: 10000,

  chromeWebSecurity: false,

  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,

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

    waitForAnimations:          true,
    animationDistanceThreshold: 1,
  },

  e2e: {
    baseUrl: "https://test-plm.intra.ais",

    setupNodeEvents(on, config) {
      on("before:browser:launch", (_browser, launchOptions) => {

        // ── Sandbox / stability ──────────────────────────────────────────────
        launchOptions.args.push("--disable-dev-shm-usage");
        launchOptions.args.push("--disable-gpu");
        launchOptions.args.push("--no-sandbox");

        // ── Background noise ─────────────────────────────────────────────────
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

        // ── Bug #2: DNS-level block for external CDNs ────────────────────────
        // Belt-and-suspenders with cy.intercept in e2e.ts
        // cdnjs added with port :1 so TCP connect fails fast (not just DNS redirect)
        launchOptions.args.push(
          "--host-rules=" + [
            "MAP fonts.googleapis.com 127.0.0.1",
            "MAP fonts.gstatic.com 127.0.0.1",
            "MAP cdnjs.cloudflare.com 127.0.0.1",
          ].join(", ")
        );

        // ── Throttle / scheduler tweaks for Angular SPA ──────────────────────
        launchOptions.args.push("--disable-background-timer-throttling");
        launchOptions.args.push("--disable-renderer-backgrounding");

        // ── Bug #1 (assist): disable WebSocket compression to reduce negotiation ──
        // Actual socket destruction handled in cy.intercept in e2e.ts
        launchOptions.args.push("--disable-websocket-from-service-worker");

        return launchOptions;
      });

      return config;
    },

    specPattern:  "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile:  "cypress/support/e2e.ts",
  },
});