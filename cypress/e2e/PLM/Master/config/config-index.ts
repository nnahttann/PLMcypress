// ========================
// CREDENTIALS CONFIGURATION
// Environment-based configuration for test credentials
// ========================

const env = Cypress.env();

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
} = env as Record<string, string>;

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

