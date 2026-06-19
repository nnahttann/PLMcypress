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

  defaultCommandTimeout: 3000,
  pageLoadTimeout: 15000,
  requestTimeout: 10000,
  responseTimeout: 15000,
  execTimeout: 15000,
  taskTimeout: 15000,

  chromeWebSecurity: false,

  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  video: false,
  screenshotOnRunFailure: false,
  scrollBehavior: 'center',

  retries: {
    runMode: 0,
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
        launchOptions.args.push("--disable-features=IsolateOrigins,site-per-process");
        launchOptions.args.push("--disable-renderer-backgrounding");
        launchOptions.args.push("--disable-ipc-flooding-protection");
        launchOptions.args.push("--disable-background-timer-throttling");
        launchOptions.args.push("--disable-backgrounding-occluded-windows");
        launchOptions.args.push("--force-color-profile=srgb");
        launchOptions.args.push("--disable-extensions");
        launchOptions.args.push("--disable-plugins-discovery");
        launchOptions.args.push("--disable-translate");
        launchOptions.args.push("--metrics-recording-only");
        launchOptions.args.push("--no-first-run");
        launchOptions.args.push("--safebrowsing-disable-auto-update");
        launchOptions.args.push("--disable-client-side-phishing-detection");
        launchOptions.args.push("--disable-component-update");
        launchOptions.args.push("--disable-default-apps");
        launchOptions.args.push("--disable-hang-monitor");
        launchOptions.args.push("--disable-prompt-on-repost");
        launchOptions.args.push("--disable-sync");
        launchOptions.args.push("--disable-breakpad");
        launchOptions.args.push("--disable-crash-reporter");
        // Block ALL external resources aggressively
        launchOptions.args.push("--host-rules=MAP * 127.0.0.1");
        
        return launchOptions;
      });

      // Block ALL unnecessary resource requests before they start
      on('before:request', (req) => {
        const url = req.url || '';
        const headers = req.headers || {};
        const accept = headers['accept'] || '';
        const resourceType = req.resourceType || '';
        
        // Block images, fonts, media, and other non-essential resources
        if (accept.includes('image') || 
            accept.includes('font') ||
            accept.includes('video') ||
            accept.includes('audio') ||
            url.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|otf|webp|bmp|tif|tiff)$/i) ||
            url.match(/fonts\.(googleapis|gstatic)\.com/i) ||
            url.match(/cdnjs\.cloudflare\.com/i) ||
            url.match(/unpkg\.com/i) ||
            url.match(/maxcdn\.bootstrapcdn\.com/i) ||
            resourceType === 'image' ||
            resourceType === 'font' ||
            resourceType === 'stylesheet' && url.includes('fonts.googleapis.com')) {
          return req.destroy();
        }
      });

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
  },
});