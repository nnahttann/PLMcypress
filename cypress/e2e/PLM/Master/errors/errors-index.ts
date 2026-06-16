// ========================
// ERROR HANDLING UTILITIES
// Centralized error handling and logging
// ========================

import { LOG_PREFIXES, TIMEOUTS } from '../constants/constants-index';

/**
 * Error types for test automation
 */
export enum ErrorType {
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
  ELEMENT_NOT_VISIBLE = 'ELEMENT_NOT_VISIBLE',
  TIMEOUT = 'TIMEOUT',
  ASSERTION_FAILED = 'ASSERTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  MODAL_NOT_FOUND = 'MODAL_NOT_FOUND',
  TABLE_NOT_READY = 'TABLE_NOT_READY',
  PAGINATION_ERROR = 'PAGINATION_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error context interface
 */
export interface ErrorContext {
  /** Type of error */
  type: ErrorType;
  /** Error message */
  message: string;
  /** Selector or element that caused the error */
  selector?: string;
  /** Test name where error occurred */
  testName?: string;
  /** Additional context data */
  data?: Record<string, unknown>;
  /** Timestamp of error */
  timestamp?: Date;
}

/**
 * Custom error class for test automation
 */
export class TestError extends Error {
  public readonly type: ErrorType;
  public readonly selector?: string;
  public readonly testName?: string;
  public readonly data?: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(context: ErrorContext) {
    super(context.message);
    this.type = context.type;
    this.selector = context.selector;
    this.testName = context.testName;
    this.data = context.data;
    this.timestamp = context.timestamp || new Date();
    this.name = 'TestError';
  }

  /**
   * Convert error to plain object for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      selector: this.selector,
      testName: this.testName,
      data: this.data,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * Error handler class for centralized error management
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: ErrorContext[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Log error with context
   * @param context - Error context
   */
  logError(context: ErrorContext): void {
    const errorWithContext = {
      ...context,
      timestamp: context.timestamp || new Date(),
    };
    
    this.errorLog.push(errorWithContext);
    
    const logMessage = `${LOG_PREFIXES.ERROR} [${context.type}] ${context.message}${
      context.selector ? ` (Selector: ${context.selector})` : ''
    }${
      context.testName ? ` (Test: ${context.testName})` : ''
    }`;
    
    cy.log(logMessage);
  }

  /**
   * Throw formatted test error
   * @param context - Error context
   */
  throwError(context: ErrorContext): never {
    this.logError(context);
    throw new TestError(context);
  }

  /**
   * Handle element not found error
   * @param selector - CSS selector
   * @param testName - Test name
   */
  handleElementNotFound(selector: string, testName?: string): void {
    this.throwError({
      type: ErrorType.ELEMENT_NOT_FOUND,
      message: `Element not found`,
      selector,
      testName,
    });
  }

  /**
   * Handle timeout error
   * @param operation - Operation that timed out
   * @param timeout - Timeout value
   * @param testName - Test name
   */
  handleTimeout(operation: string, timeout: number, testName?: string): void {
    this.throwError({
      type: ErrorType.TIMEOUT,
      message: `Operation timed out: ${operation} (${timeout}ms)`,
      testName,
      data: { operation, timeout },
    });
  }

  /**
   * Handle assertion failure
   * @param message - Assertion message
   * @param testName - Test name
   */
  handleAssertionFailed(message: string, testName?: string): void {
    this.throwError({
      type: ErrorType.ASSERTION_FAILED,
      message,
      testName,
    });
  }

  /**
   * Get all logged errors
   */
  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error count by type
   * @param type - Error type to count
   */
  getErrorCountByType(type: ErrorType): number {
    return this.errorLog.filter((err) => err.type === type).length;
  }

  /**
   * Export error log as JSON string
   */
  exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }
}

/**
 * Create error handler singleton
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Wrap Cypress command with error handling
 * @param command - Cypress command function
 * @param errorMessage - Error message if command fails
 * @param errorType - Type of error
 */
export function withErrorHandling<T>(
  command: () => Cypress.Chainable<T>,
  errorMessage: string,
  errorType: ErrorType = ErrorType.UNKNOWN
): Cypress.Chainable<T> {
  return command().catch((error) => {
    errorHandler.logError({
      type: errorType,
      message: errorMessage,
      data: { originalError: error.message },
    });
    throw error;
  });
}

/**
 * Retry operation with error handling
 * @param operation - Operation to retry
 * @param maxRetries - Maximum retry attempts
 * @param delayMs - Delay between retries
 * @param onError - Optional error callback
 */
export function retryWithErrorHandling(
  operation: () => void,
  maxRetries: number = 3,
  delayMs: number = 1500,
  onError?: (error: unknown, attempt: number) => void
): void {
  const attempt = (remainingRetries: number): void => {
    try {
      operation();
    } catch (error) {
      const currentAttempt = maxRetries - remainingRetries + 1;
      
      if (onError) {
        onError(error, currentAttempt);
      }
      
      cy.log(`${LOG_PREFIXES.WARNING} Attempt ${currentAttempt} failed. Retries left: ${remainingRetries - 1}`);
      
      if (remainingRetries <= 1) {
        cy.log(`${LOG_PREFIXES.ERROR} All retry attempts exhausted`);
        throw error;
      }
      
      cy.wait(delayMs);
      attempt(remainingRetries - 1);
    }
  };

  attempt(maxRetries);
}

/**
 * Safe Cypress command that doesn't fail on error
 * @param selector - CSS selector
 * @param timeout - Timeout in ms
 */
export function safeGet(
  selector: string,
  timeout: number = TIMEOUTS.DEFAULT
): Cypress.Chainable<JQuery<HTMLElement> | null> {
  return cy.get('body', { timeout }).then(($body) => {
    const $element = $body.find(selector);
    return $element.length > 0 ? cy.wrap($element) : cy.wrap(null);
  });
}

/**
 * Check if element exists without failing
 * @param selector - CSS selector
 * @param callback - Callback with boolean result
 */
export function ifElementExists(
  selector: string,
  callback: (exists: boolean) => void
): void {
  cy.get('body').then(($body) => {
    const exists = $body.find(selector).length > 0;
    callback(exists);
  });
}

/**
 * Log warning message
 * @param message - Warning message
 */
export function logWarning(message: string): void {
  cy.log(`${LOG_PREFIXES.WARNING} ${message}`);
}

/**
 * Log info message
 * @param message - Info message
 */
export function logInfo(message: string): void {
  cy.log(`${LOG_PREFIXES.INFO} ${message}`);
}

/**
 * Log success message
 * @param message - Success message
 */
export function logSuccess(message: string): void {
  cy.log(`${LOG_PREFIXES.SUCCESS} ${message}`);
}
