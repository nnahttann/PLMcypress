// ========================
// CONSTANTS CONFIGURATION
// Centralized constants for test automation
// ========================

/**
 * Timeout configurations in milliseconds
 */
export const TIMEOUTS = {
  /** Default command timeout */
  DEFAULT: 10000,
  /** Extended timeout for slow operations */
  EXTENDED: 30000,
  /** Short timeout for quick checks */
  SHORT: 5000,
  /** Extra long timeout for complex operations */
  EXTRA_LONG: 60000,
} as const;

/**
 * Pagination settings
 */
export const PAGINATION = {
  /** Maximum pages to search before giving up */
  MAX_PAGES: 3,
  /** Wait time after clicking next page (ms) */
  WAIT_AFTER_NEXT: 2000,
  /** Retry delay for pagination (ms) */
  RETRY_DELAY: 1500,
} as const;

/**
 * Button text constants for common actions
 */
export const BUTTON_TEXT = {
  LOGIN: 'Login',
  SAVE: 'Save',
  SAVE_AND_CONTINUE: 'Save & Continue',
  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',
  CLOSE: 'Close',
  OK: 'OK',
  YES: 'Yes',
  NO: 'No',
  NEXT: 'Next',
  PREVIOUS: 'Previous',
  CLAIM: 'Claim',
  ASSIGN: 'Assign',
  APPROVE: 'Approve',
  ADD_TO_USMP: 'Add to USMP',
} as const;

/**
 * Common labels for form fields
 */
export const LABELS = {
  ASSIGN_TO: /Assign to|User/i,
  BILLING_SYSTEM: /Billing System/i,
  USER_ID: 'userId',
  PASSWORD: 'pwd',
} as const;

/**
 * Table section headers
 */
export const SECTION_HEADERS = {
  TODO_LIST: 'To Do List',
  UNASSIGNED_TASK: 'Unassigned Task',
} as const;

/**
 * Modal/dialog CSS classes
 */
export const MODAL_CLASSES = {
  BOOTSTRAP: '.modal.fade.in',
  ANGULAR: '.mat-dialog-container',
  TITLE: '.modal-title',
  FOOTER_BUTTON: '.modal-footer button.btn-danger',
} as const;

/**
 * Project name length limits
 */
export const NAME_LIMITS = {
  PROJECT_MAX_LENGTH: 40,
  PO_MAX_LENGTH: 30,
  PREFIX_MAX_LENGTH: 20,
} as const;

/**
 * Date/time format patterns
 */
export const DATE_FORMATS = {
  DAY_MONTH: 'DD/MM/YYYY',
  TIMESTAMP: 'MMhh DDss',
} as const;

/**
 * Test environment URLs (if needed)
 */
export const URLS = {
  API_BASE: '/PLMSpringBoot/api',
  ERROR_CODES: '/plm-error-code/getAll',
} as const;

/**
 * Logging prefixes for better traceability
 */
export const LOG_PREFIXES = {
  INFO: 'ℹ️',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
  SEARCH: '🔍',
  FOUND: '🎯',
  CLAIM: '🔑',
  ASSIGN: '👤',
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /** Maximum retry attempts */
  MAX_RETRIES: 3,
  /** Delay between retries (ms) */
  DELAY_MS: 1500,
} as const;

/**
 * Common test data
 */
export const TEST_DATA = {
  /** Priority quota types */
  PRIORITY_QUOTA_TYPES: ['Premium', 'Standard', 'Basic'],
  /** Internet speeds for testing */
  INTERNET_SPEEDS: [
    '1 Mbps', '2 Mbps', '3 Mbps', '4 Mbps', '5 Mbps',
    '6 Mbps', '7 Mbps', '8 Mbps', '9 Mbps', '10 Mbps',
    '15 Mbps', '20 Mbps', '25 Mbps', '30 Mbps', '40 Mbps',
    '50 Mbps', '60 Mbps', '70 Mbps', '80 Mbps', '90 Mbps', '100 Mbps'
  ],
  /** Throttling speeds for testing */
  THROTTLING_SPEEDS: [
    '256 kbps', '384 kbps', '512 kbps',
    '1 Mbps', '2 Mbps', '3 Mbps', '4 Mbps', '5 Mbps'
  ],
} as const;

/**
 * Abbreviations mapping for project naming
 */
export const ABBREVIATIONS: Record<string, string> = {
  'Artificial Intelligence': 'AI',
  'Internet of Things': 'IoT',
  'Virtual Reality': 'VR',
  'Augmented Reality': 'AR',
  'Cloud Computing': 'Cloud',
  'Big Data': 'Data',
  'Machine Learning': 'ML',
  'Deep Learning': 'DL',
  'Blockchain': 'Chain',
  '5G': '5G',
  '4G': '4G',
  '3G': '3G',
} as const;
