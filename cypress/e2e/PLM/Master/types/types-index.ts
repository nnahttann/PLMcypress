// ========================
// TYPE DEFINITIONS
// Centralized type definitions for test automation
// ========================

/**
 * User module types for authentication
 */
export type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';

/**
 * Price type for product pricing models
 */
export type PriceType = 'onetime' | 'recurring' | 'usage';

/**
 * Product classification in project structure
 */
export type ProductClass = 'main' | 'ontop' | 'ontopextra';

/**
 * Task list section headers
 */
export type TaskListHeader = 'To Do List' | 'Unassigned Task';

/**
 * Final action after test completion
 */
export type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';

/**
 * Callback function type for core task operations
 */
export type CoreTaskCallback = () => void;

/**
 * Function type for approval operations
 * @param projectName - Name of the project to approve
 */
export type ApproveFunction = (projectName: string) => void;

/**
 * Function type to retrieve project name
 */
export type GetProjectNameFn = () => string;

/**
 * Options for project basic information setup
 */
export interface ProjectBasicOptions {
  /** User module for authentication */
  Module: Module;
  /** Sub-module specification */
  subModule?: 'POST' | 'PRE';
  /** Automatically set project duration */
  autoSetDuration?: boolean;
  /** Plugin identifier */
  Plugin?: string;
}

/**
 * Flow pattern mapping for test workflows
 * Keys represent flow stages, values are arrays of actions
 */
export interface FlowPattern {
  [key: string]: string[];
}

/**
 * Test entry definition for test suites
 */
export interface TestEntry {
  /** Test case name */
  name: string;
  /** Test function to execute */
  fn: () => void;
}

/**
 * Credentials for user authentication
 */
export interface Credentials {
  /** Username */
  user: string;
  /** Password */
  pass: string;
}

/**
 * Configuration for pagination operations
 */
export interface PaginationOptions {
  /** Maximum number of pages to search */
  maxPages?: number;
  /** Wait time after navigating to next page (ms) */
  waitAfterNext?: number;
  /** Custom filter function for rows */
  filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
}

/**
 * Configuration for retry operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Delay between retries (ms) */
  delayMs?: number;
}

/**
 * Result of a search operation in paginated tables
 */
export interface SearchResult {
  /** Whether the item was found */
  found: boolean;
  /** Page number where item was found */
  pageNumber?: number;
  /** Row index where item was found */
  rowIndex?: number;
  /** The found row element */
  row?: JQuery<HTMLElement>;
}

/**
 * Project naming result from generation functions
 */
export interface ProjectNamingResult {
  /** Generated project name */
  projectName: string;
  /** Generated PO (Purchase Order) name */
  poName: string;
  /** Generated prefix name */
  prefixName: string;
}
