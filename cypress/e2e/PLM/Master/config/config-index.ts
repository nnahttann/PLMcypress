// ========================
// CREDENTIALS CONFIGURATION
// Environment-based configuration for test credentials
// ========================

const env = Cypress.env();

/**
 * Interface for environment variables
 */
interface EnvVariables {
  urlsit: string;
  MKTpre: string;
  MKTpre1: string;
  MKTpost: string;
  MKTpost1: string;
  cks: string;
  ckspass: string;
  cgcirb: string;
  cgcirbpass: string;
  cgccbs: string;
  cgccbspass: string;
  cgtcbs: string;
  cgtcbspass: string;
  cgtirb: string;
  cgtirbpass: string;
  actm: string;
  actmpass: string;
  oper: string;
  operpass: string;
  spadsup: string;
  spadsuppass: string;
  spaddoer: string;
  spaddoerpass: string;
  spadtest: string;
  spadtestpass: string;
  spaddp: string;
  spaddppass: string;
  apo: string;
  apopass: string;
  enter: string;
  enterpass: string;
  music: string;
  musicpass: string;
  tscenter: string;
  tscenterpass: string;
  aafsp: string;
  aafsppass: string;
  csisp: string;
  csisppass: string;
  e2etest: string;
  e2etestpass: string;
  aafdp: string;
  aafdppass: string;
  csidp: string;
  csidppass: string;
  e2edp: string;
  e2edppass: string;
  sasff: string;
  sasffpass: string;
}

/**
 * Destructure environment variables for credentials and URLs
 * All values are loaded from Cypress environment configuration
 */
export const {
  urlsit,
  MKTpre, MKTpre1, MKTpost, MKTpost1,
  cks, ckspass,
  cgcirb, cgcirbpass,
  cgccbs, cgccbspass,
  cgtcbs, cgtcbspass,
  cgtirb, cgtirbpass,
  actm, actmpass,
  oper, operpass,
  spadsup, spadsuppass,
  spaddoer, spaddoerpass,
  spadtest, spadtestpass,
  spaddp, spaddppass,
  apo, apopass,
  enter, enterpass,
  music, musicpass,
  tscenter, tscenterpass,
  aafsp, aafsppass,
  csisp, csisppass,
  e2etest, e2etestpass,
  aafdp, aafdppass,
  csidp, csidppass,
  e2edp, e2edppass,
  sasff, sasffpass
} = env as EnvVariables;

// ========================
// DATE/TIME UTILITIES
// Helper functions for date/time formatting
// ========================

/**
 * Current date/time instance
 */
export const now = new Date();

const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

/**
 * Formatted date string for main project naming
 * Format: DD/MM with timestamp
 */
export let formattedDateMain = '';

/**
 * Formatted date string for ontop project naming
 * Format: DD/MM with timestamp
 */
export let formattedDateOntop = '';

/**
 * Get time suffix for unique naming
 * @returns Time suffix in format "DDMM HHmm"
 */
export const getTimeSuffix = (): string => `${day}${month} ${hours}${minutes}`;

// Note: ABBREVIATIONS, INTERNET_SPEEDS, THROTTLING_SPEEDS, ALL_PRIORITY_QUOTA_TYPES
// have been moved to constants/constants-index.ts for better organization
// Import them from there when needed:
// import { ABBREVIATIONS, TEST_DATA } from '../constants/constants-index';

