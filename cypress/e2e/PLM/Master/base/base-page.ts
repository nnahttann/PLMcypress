// ========================
// BASE PAGE CLASS
// Foundation for Page Object Model
// ========================

import { TIMEOUTS, PAGINATION, RETRY_CONFIG, LOG_PREFIXES } from '../constants/constants-index';
import * as Selectors from '../selectors/selectors-index';

/**
 * Base page class providing common functionality for all page objects
 */
export class BasePage {
  /**
   * Wait for element to be visible with default timeout
   * @param selector - CSS selector or Cypress chainable
   * @param timeout - Optional custom timeout in ms
   * @param description - Optional description for logging
   */
  protected waitForElement(
    selector: string,
    timeout: number = TIMEOUTS.DEFAULT,
    description?: string
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const logMsg = description ? `${LOG_PREFIXES.SEARCH} Waiting for: ${description}` : `${LOG_PREFIXES.SEARCH} Waiting for: ${selector}`;
    cy.log(logMsg);
    
    return cy.get(selector, { timeout }).should('be.visible');
  }

  /**
   * Wait for element to exist (not necessarily visible)
   * @param selector - CSS selector
   * @param timeout - Optional custom timeout in ms
   */
  protected waitForElementExist(
    selector: string,
    timeout: number = TIMEOUTS.DEFAULT
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(selector, { timeout }).should('exist');
  }

  /**
   * Check if element exists without failing
   * @param selector - CSS selector
   */
  protected elementExists(selector: string): Cypress.Chainable<boolean> {
    return cy.get('body').then(($body) => {
      return $body.find(selector).length > 0;
    });
  }

  /**
   * Click element if it exists
   * @param selector - CSS selector
   * @param options - Optional click options
   */
  protected clickIfExists(
    selector: string,
    options?: Partial<Cypress.ClickOptions>
  ): void {
    cy.get('body').then(($body) => {
      if ($body.find(selector).length > 0) {
        cy.get(selector).click(options);
      }
    });
  }

  /**
   * Get text from table rows in a section
   * @param sectionHeader - Section header name
   */
  protected getSectionRowsText(sectionHeader: string): Cypress.Chainable<string> {
    return cy.contains('h3', sectionHeader, { timeout: TIMEOUTS.DEFAULT })
      .parent()
      .find(Selectors.TABLE.ROW)
      .then(($rows) => $rows.text());
  }

  /**
   * Wait for table rows to not contain "Fetching data"
   * @param sectionHeader - Section header name
   * @param timeout - Optional custom timeout
   */
  protected waitForTableReady(
    sectionHeader: string,
    timeout: number = TIMEOUTS.DEFAULT
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('h3', sectionHeader, { timeout })
      .parent()
      .find(Selectors.TABLE.ROW)
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
        expect($rows.length).to.be.greaterThan(0);
      });
  }

  /**
   * Search in paginated table and execute callback on found row
   * @param sectionHeader - Section header name
   * @param searchText - Text to search for
   * @param callback - Callback function to execute on found row
   * @param maxPages - Maximum pages to search
   */
  protected searchInPaginatedTable(
    sectionHeader: string,
    searchText: string,
    callback: ($row: JQuery<HTMLElement>, index: number) => void,
    maxPages: number = PAGINATION.MAX_PAGES
  ): void {
    const searchPage = (currentPage: number = 1): void => {
      if (currentPage > maxPages) {
        cy.log(`${LOG_PREFIXES.WARNING} Checked ${maxPages} pages, "${searchText}" not found`);
        return;
      }

      cy.log(`${LOG_PREFIXES.SEARCH} [${sectionHeader}] Page ${currentPage} searching for: "${searchText}"`);

      this.waitForTableReady(sectionHeader).then(($rows) => {
        let found = false;
        let foundRowIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;
          const $row = Cypress.$(row);
          const rowText = $row.text().trim();
          
          if (rowText.includes(searchText) && !rowText.includes('Fetching data')) {
            found = true;
            foundRowIndex = index;
          }
        });

        if (found && foundRowIndex >= 0) {
          cy.log(`${LOG_PREFIXES.SUCCESS} Found on page ${currentPage}, row ${foundRowIndex}`);
          callback(Cypress.$($rows[foundRowIndex]), foundRowIndex);
        } else {
          // Try to go to next page
          cy.contains('h3', sectionHeader).parent().then(($section) => {
            const $nextBtn = $section.find(Selectors.PAGINATION.NEXT_BUTTON);
            
            if ($nextBtn.length > 0) {
              cy.log(`${LOG_PREFIXES.INFO} Page ${currentPage} - Not found, going next...`);
              const firstRowTextBefore = $section.find(Selectors.TABLE.ROW).first().text().trim();
              
              cy.wrap($nextBtn).click();
              
              cy.contains('h3', sectionHeader, { timeout: TIMEOUTS.DEFAULT })
                .parent()
                .find(Selectors.TABLE.ROW)
                .should(($r) => {
                  expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                  expect($r.text()).not.to.contain('Fetching data');
                });
              
              cy.wait(PAGINATION.WAIT_AFTER_NEXT);
              searchPage(currentPage + 1);
            } else {
              cy.log(`${LOG_PREFIXES.INFO} No more pages, "${searchText}" not found`);
            }
          });
        }
      });
    };

    searchPage();
  }

  /**
   * Take screenshot on failure
   * @param testName - Name of the test for screenshot filename
   */
  protected captureScreenshot(testName: string): void {
    cy.screenshot(`failure-${testName}-${Date.now()}`, { capture: 'runner' });
  }

  /**
   * Log error with screenshot
   * @param errorMessage - Error message to log
   * @param testName - Name of the test
   */
  protected logError(errorMessage: string, testName: string): void {
    cy.log(`${LOG_PREFIXES.ERROR} ${errorMessage}`);
    this.captureScreenshot(testName);
  }

  /**
   * Retry operation with delay
   * @param operation - Operation to retry
   * @param maxRetries - Maximum retry attempts
   * @param delayMs - Delay between retries
   */
  protected retryOperation(
    operation: () => void,
    maxRetries: number = RETRY_CONFIG.MAX_RETRIES,
    delayMs: number = RETRY_CONFIG.DELAY_MS
  ): void {
    if (maxRetries <= 0) {
      cy.log(`${LOG_PREFIXES.ERROR} Failed after multiple retries`);
      return;
    }

    cy.wait(delayMs);
    
    try {
      operation();
    } catch (error) {
      cy.log(`${LOG_PREFIXES.WARNING} Retry attempt failed, retries left: ${maxRetries - 1}`);
      this.retryOperation(operation, maxRetries - 1, delayMs);
    }
  }

  /**
   * Scroll to bottom of page and wait
   * @param waitTime - Time to wait after scrolling (ms)
   */
  protected scrollDown(waitTime: number = 2000): void {
    cy.scrollTo('bottom');
    cy.wait(waitTime);
  }

  /**
   * Reload page and wait for container
   * @param containerSelector - Selector for container to wait for
   * @param timeout - Timeout for container to appear
   */
  protected reloadAndWait(
    containerSelector: string = Selectors.WORKSPACE.CONTAINER,
    timeout: number = TIMEOUTS.EXTENDED
  ): void {
    cy.reload();
    cy.get(containerSelector, { timeout }).should('be.visible');
  }
}

/**
 * Options for search operations
 */
export interface SearchOptions {
  /** Wait time after clicking next page */
  waitAfterNext?: number;
  /** Custom filter function */
  filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
}

/**
 * Options for retry operations
 */
export interface RetryOptions {
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Delay between retries in ms */
  delayMs?: number;
}
