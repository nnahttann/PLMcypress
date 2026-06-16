// ========================
// SELECTORS CONFIGURATION
// Centralized CSS selectors and locators
// ========================

/**
 * Login page selectors
 */
export const LOGIN = {
  FORM: 'form',
  USER_ID: 'input[name="userId"]',
  PASSWORD: 'input[name="pwd"]',
  LOGIN_BUTTON: 'button[name="login"], button[type="submit"]',
  APP_LOGIN: 'app-login',
} as const;

/**
 * Navigation and menu selectors
 */
export const NAVIGATION = {
  PROJECT_CREATION: 'a:contains("Project Creation")',
} as const;

/**
 * Project creation form selectors
 */
export const PROJECT_FORM = {
  NAME: '#projectName',
  DESCRIPTION: '#projectDescription',
  START_DATE: 'input[formcontrolname="startDate"]',
  SAVE_AND_CONTINUE: 'button:contains("Save & Continue")',
  TODAY_BUTTON: 'span.title:contains("Today")',
  NEXT_YEAR_BUTTON: 'span.title:contains("Next Year")',
} as const;

/**
 * Table and grid selectors
 */
export const TABLE = {
  ROW: 'tbody tr',
  CELL_WITH_COLSPAN: 'td[colspan="2"]',
  CLICKABLE_ROW: 'tr.cursor-point',
} as const;

/**
 * Section headers for tables
 */
export const SECTIONS = {
  TODO_LIST: 'h3:contains("To Do List")',
  UNASSIGNED_TASK: 'h3:contains("Unassigned Task")',
} as const;

/**
 * Action buttons in tables
 */
export const ACTION_BUTTONS = {
  CLAIM_TOP: 'button.claim-top',
  ASSIGN_TASK_TOP: 'button.assign-task-top',
} as const;

/**
 * Pagination selectors
 */
export const PAGINATION = {
  CONTAINER: '.pagination',
  NEXT_BUTTON: '.pagination li:not(.disabled) a:contains("Next")',
  PREVIOUS_BUTTON: '.pagination li:not(.disabled) a:contains("Previous")',
} as const;

/**
 * Modal and dialog selectors
 */
export const MODALS = {
  BOOTSTRAP: '.modal.fade.in',
  ANGULAR: '.mat-dialog-container',
  TITLE: '.modal-title',
  FOOTER: '.modal-footer',
  CLOSE_BUTTON: 'button:contains("Close"), button:contains("OK"), button:contains("ปิด")',
  CONFIRM_BUTTON: 'button:contains("Confirm"), button:contains("Save"), button:contains("ตกลง")',
} as const;

/**
 * Form field selectors (generic)
 */
export const FORM_FIELDS = {
  MAT_FORM_FIELD: 'mat-form-field',
  MAT_SELECT: 'mat-select',
  MAT_OPTION: 'mat-option',
  LABEL: 'label',
} as const;

/**
 * Assignment dialog selectors
 */
export const ASSIGNMENT_DIALOG = {
  CONTAINER: 'mat-dialog-container',
  ASSIGN_TO_LABEL: 'label:contains(/Assign to|User/i)',
  BILLING_SYSTEM_LABEL: 'label:contains(/Billing System/i)',
  SAVE_BUTTON: 'button:contains("Save"), button:contains("Confirm"), button:contains("ตกลง")',
} as const;

/**
 * Success/error message selectors
 */
export const MESSAGES = {
  SUCCESS_MODAL_TITLE: '.modal-title:contains("Save Result")',
  SUCCESS_MODAL_CONTENT: '.modal-content',
  SUCCESS_MODAL_CLOSE: '.modal-footer button.btn-danger',
} as const;

/**
 * USMP related selectors
 */
export const USMP = {
  ADD_BUTTON: 'button:contains("Add to USMP")',
} as const;

/**
 * Workspace selectors
 */
export const WORKSPACE = {
  CONTAINER: 'app-workspace',
} as const;

/**
 * Helper function to get section selector by header name
 * @param headerName - The section header text (e.g., "To Do List", "Unassigned Task")
 * @returns CSS selector for the section
 */
export const getSectionSelector = (headerName: string): string => {
  return `h3:contains("${headerName}")`;
};

/**
 * Helper function to get table row selector within a section
 * @param headerName - The section header text
 * @returns CSS selector for table rows in the section
 */
export const getSectionRowsSelector = (headerName: string): string => {
  return `${getSectionSelector(headerName)} ${TABLE.ROW}`;
};

/**
 * Helper function to get pagination next button selector within a section
 * @param headerName - The section header text
 * @returns CSS selector for the next button in the section
 */
export const getSectionNextButtonSelector = (headerName: string): string => {
  return `${getSectionSelector(headerName)} ${PAGINATION.NEXT_BUTTON}`;
};
