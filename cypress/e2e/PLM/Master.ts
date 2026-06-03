const env = Cypress.env();
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

import { createPOWordingPools,RandomRemark, RandomProjectDescription } from './Approve/po-wording-pools';

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
export let formattedDateMain = '';
export let formattedDateOntop = '';

// ========================
// TYPE DEFINITIONS
// ========================
type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';
type PriceType = 'onetime' | 'recurring' | 'usage';
type ProductClass = 'main' | 'ontop' | 'ontopextra';
type ProductClass1 = 'Main' | 'Ontop' | 'OntopExtra';
type TaskListHeader = 'To Do List' | 'Unassigned Task';
type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
type CoreTaskCallback = () => void;
type ApproveFunction = (projectName: string) => void;
type GetProjectNameFn = () => string;
type EnhanceStepsCallback = () => void;

interface ProjectBasicOptions {
  ProductClass1: ProductClass1;
  Module: Module;
  subModule?: 'POST' | 'PRE';
  autoSetDuration?: boolean;
  Plugin?: string;
}

// ========================
// PROJECT MANAGEMENT SYSTEM
// ========================
class ProjectManager {
  private static instance: ProjectManager;
  private projects: Map<number, string> = new Map();
  private currentIndex: number = 0;

  private constructor() {
    const saved = Cypress.env('projectManager');
    if (saved) {
      this.projects = new Map(Object.entries(saved.projects || {}).map(([k, v]) => [parseInt(k), v as string]));
      this.currentIndex = saved.currentIndex || 0;
    }
  }

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  register(name: string, index?: number): void {
    const idx = index ?? this.projects.size;
    this.projects.set(idx, name);
    this.save();
  }

  get(index: number = 0): string {
    const name = this.projects.get(index);
    if (!name) {
      return this.getStandardFallback();
    }
    return name;
  }

  getAll(): string[] {
    return Array.from(this.projects.values());
  }

  getStandardFallback(): string {
    return formattedDateMain ||
      formattedDateOntop ||
      Cypress.env('formattedDateMain') ||
      Cypress.env('formattedDate') ||
      Cypress.env('projectName') ||
      Cypress.env('formattedDateMainPONAME') ||
      Cypress.env('formattedDateOntopPONAME') ||
      Cypress.env('poName') || '';
  }

  setCurrentIndex(index: number): void {
    this.currentIndex = index;
    this.save();
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear(): void {
    this.projects.clear();
    this.currentIndex = 0;
    this.save();
  }

  private save(): void {
    Cypress.env('projectManager', {
      projects: Object.fromEntries(this.projects),
      currentIndex: this.currentIndex
    });
  }

  runForAll(callback: (name: string, index: number) => void): void {
    const allProjects = this.getAll();
    if (allProjects.length === 0) {
      callback(this.getStandardFallback(), 0);
      return;
    }
    allProjects.forEach((name, idx) => callback(name, idx));
  }
}

const projectManager = ProjectManager.getInstance();

// ========================
// HELPER FUNCTIONS
// ========================

export const getCredentials = (module: Module): { user: string, pass: string } => {
  const credMap: Record<Module, { user: string, pass: string }> = {
    'POST': { user: MKTpost, pass: MKTpost1 },
    'PRE': { user: MKTpre, pass: MKTpre1 },
    'ENTER': { user: enter, pass: enterpass },
    'MUSIC': { user: music, pass: musicpass }
  };
  return credMap[module] || credMap['POST'];
};

export const getTimeSuffix = (): string => `${day}${month} ${hours}${minutes}`;

export const getTruncatedName = (baseName: string, suffix: string, maxLength: number): string => {
  let finalName = `${baseName} ${suffix}`;
  if (finalName.length > maxLength) {
    const allowedLength = maxLength - suffix.length - 1;
    const trimmedPrefix = baseName.substring(0, allowedLength).trim();
    finalName = `${trimmedPrefix} ${suffix}`;
  }
  return finalName;
};

export const selectRandomOption = (labelName: string): void => {
  cy.contains('label', labelName).parent().next('div').find('mat-select').click();
  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    cy.wrap($options[randomIndex]).click({ force: true });
  });
};

export const handleAddToUSMP = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Add to USMP")').length > 0) {
      cy.log('🟢 Found Add to USMP button, clicking...');
      cy.contains('button', 'Add to USMP').click();
      cy.wait(3500);

      // ✅ รอ Bootstrap modal เปิดสนิทก่อน (fade → in)
      // จับ Bootstrap modal หรือ Angular dialog อย่างใดอย่างหนึ่ง
      cy.get('body').then(($b) => {
        if ($b.find('.modal.fade.in').length > 0) {
          // Bootstrap 3 modal
          cy.log('📦 Bootstrap modal detected');
          cy.get('.modal.fade.in')
            .first()
            .should('be.visible')
            .within(() => {
              cy.contains('button', /Close|OK|ปิด/i).click();
            });
        } else if ($b.find('.mat-dialog-container').length > 0) {
          // Angular Material dialog
          cy.log('📦 Angular dialog detected');
          cy.get('.mat-dialog-container')
            .first()
            .should('be.visible')
            .within(() => {
              cy.contains('button', /Close|OK|ปิด/i).click();
            });
        } else {
          cy.log('⚠️ ไม่พบ modal/dialog — ข้ามการปิด');
        }
      });

      cy.wait(2000);
    } else {
      cy.log('⚪ Add to USMP button not found, skipping...');
    }
  });
};

export const scrollAndWait = (ms: number = 4000): void => {
  cy.scrollTo('bottom');
  cy.wait(ms);
};

export const clickYesIfExists = (timeout: number = 10000, position: 'first' | 'last' = 'last'): void => {
  cy.get('body').then(($body) => {
    if ($body.find('button:contains("Yes")').length > 0) {
      cy.get('button').contains('Yes', { timeout }).eq(position === 'first' ? 0 : -1).click();
    }
  });
};

export const clickButtonIfExists = (buttonText: string, timeout: number = 10000): void => {
  cy.get('body').then(($body) => {
    if ($body.find(`button:contains("${buttonText}")`).length > 0) {
      cy.contains('button', buttonText, { timeout }).click();
    }
  });
};

export const getRandomPhone = (): string => {
  return `0${Math.floor(8 + Math.random() * 2)}${Math.floor(10000000 + Math.random() * 90000000)}`;
};

const generateAccessNumber = (): string => {
  const randomPrefix = Cypress._.random(1000, 9999);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomSuffix = '';
  for (let i = 0; i < 6; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `*${randomPrefix}*${randomSuffix}#`;
};

// ========================
// LOGIN FUNCTIONS
// ========================

export const login = (username: string, password: string): void => {
  cy.get('app-login', { timeout: 3000000 }).should('be.visible');
  cy.get('form', { timeout: 2000000 }).should('be.visible');

  cy.get('input[name="userId"]', { timeout: 2000000 })
    .should('exist')
    .should('be.visible')
    .should('not.be.disabled')
    .clear()
    .type(username, { delay: 150 });

  cy.get('input[name="pwd"]')
    .should('be.visible')
    .clear()
    .type(password, { delay: 150 });

  cy.intercept('GET', '/PLMSpringBoot/api/plm-error-code/getAll').as('getErrorCodes');

  cy.get('button[name="login"], button[type="submit"]')
    .contains('Login')
    .should('be.visible')
    .click();

  cy.wait('@getErrorCodes', { timeout: 30000 })
    .its('response.statusCode')
    .should('eq', 200);
};

export const loginAndWaitReady = (username: string, password: string): void => {
  login(username, password);
  cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
};

// ========================
// PAGINATION HELPER - FIXED ASYNC CHAIN
// ========================

const searchInTableWithPagination = (
  sectionHeader: string,
  searchText: string,
  rowCallback: ($row: JQuery<HTMLElement>, index: number) => void,
  options: {
    waitAfterNext?: number;
    filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
  } = {}
): void => {
  const { waitAfterNext = 4000, filterCallback } = options;

  const searchInCurrentPage = (): Cypress.Chainable<boolean> => {
    return cy.get('h3').contains(sectionHeader, { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      })
      .then(($rows) => {
        cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

        let found = false;
        let matchingRow: JQuery<HTMLElement> | null = null;
        let matchingIndex = -1;

        $rows.each((index, row) => {
          if (found) return;

          const $row = Cypress.$(row);
          const rowText = $row.text().trim();

          const matches = filterCallback
            ? filterCallback($row, index)
            : rowText.includes(searchText);

          if (matches) {
            matchingRow = $row;
            matchingIndex = index;
            found = true;
            cy.log(`✅ Found match at row ${index}`);
          }
        });

        if (found && matchingRow) {
          rowCallback(matchingRow, matchingIndex);
        }

        return cy.wrap(found);
      });
  };

  const clickNextAndWait = (): Cypress.Chainable<boolean> => {
    return cy.get('body').then(($body) => {
      const $section = $body.find(`h3:contains("${sectionHeader}")`).parent();
      const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

      if ($nextBtn.length > 0) {
        cy.log(`➡️ ${sectionHeader} - Going to next page...`);
        cy.wrap($nextBtn).click();

        cy.get('h3').contains(sectionHeader, { timeout: 100000 })
          .parent()
          .find('tbody tr')
          .should(($rows) => {
            expect($rows.text()).not.to.contain('Fetching data');
          });

        cy.wait(waitAfterNext);
        return cy.wrap(true);
      }
      return cy.wrap(false);
    });
  };

  const searchPage = (pageNum: number = 1): void => {
    cy.log(`🔍 Searching page ${pageNum}...`);

    searchInCurrentPage().then((found) => {
      if (found) {
        cy.log(`✅ Found on page ${pageNum}!`);
        return;
      }

      clickNextAndWait().then((hasNext) => {
        if (hasNext) {
          searchPage(pageNum + 1);
        } else {
          cy.log(`❌ "${searchText}" not found after ${pageNum} page(s)`);
        }
      });
    });
  };

  searchPage();
};

// ========================
// CLAIM PROJECT
// ========================

export const ClaimProject = (formattedDate: string): void => {
  let currentPage = 1;
  const MAX_PAGES = 5;

  const searchAndClaim = (): void => {
    if (currentPage > MAX_PAGES) {
      cy.log(`⚠️ Checked ${MAX_PAGES} pages in Unassigned Task, checking To Do List...`);
      checkToDoList();
      return;
    }

    cy.log(`🔍 [Claim] Searching Unassigned Task - Page ${currentPage}...`);

    cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

    cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
      .parent()
      .find('tbody tr')
      .then(($rows) => {
        cy.log(`📊 Unassigned Task Page ${currentPage} - ${$rows.length} rows`);

        let found = false;

        $rows.each((index, row) => {
          if (found) return;

          const $row = Cypress.$(row);
          const rowText = $row.text().trim();

          if (rowText.includes(formattedDate) && !rowText.includes('Fetching data')) {
            found = true;
            cy.log(`✅ Found in Unassigned Task - Page ${currentPage}, Row ${index}`);

            cy.wrap($row)
              .find('button.claim-top')
              .should('be.visible')
              .click();

            cy.log(`✅ Successfully clicked claim: ${formattedDate}`);

            // 1. รอให้ server process การ claim และ UI เริ่ม re-render
            cy.wait(1500);

            // 2. รอให้ To Do List โหลดข้อมูลใหม่เสร็จ (หาย Fetching data)
            cy.get('h3').contains('To Do List', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($todoRows) => {
                expect($todoRows.text()).not.to.contain('Fetching data');
              });

            // 3. Assert ว่า project ขึ้น To Do List จริงๆ ก่อนทำต่อ
            cy.get('h3').contains('To Do List', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($todoRows) => {
                expect($todoRows.text()).to.contain(formattedDate);
              });

            cy.log(`✅ Project confirmed in To Do List: ${formattedDate}`);
          }
        });

        if (found) return;

        // ไม่เจอในหน้านี้ → ไปหน้าถัดไป
        cy.get('body').then(($body) => {
          const $section = $body.find('h3:contains("Unassigned Task")').parent();
          const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

          if ($nextBtn.length > 0) {
            cy.log(`➡️ Unassigned Task Page ${currentPage} - Not found, going to next page...`);
            cy.wrap($nextBtn).click();

            cy.get('h3').contains('Unassigned Task', { timeout: 100000 })
              .parent()
              .find('tbody tr')
              .should(($rows) => {
                expect($rows.text()).not.to.contain('Fetching data');
              });

            cy.wait(1500);
            currentPage++;
            searchAndClaim();
          } else {
            cy.log(`📋 Not found in Unassigned Task, checking To Do List...`);
            checkToDoList();
          }
        });
      });
  };

  // เช็ค To Do List หลังจากค้นหา Unassigned Task ครบแล้ว
  const checkToDoList = (): void => {
    cy.get('body').then(($body) => {
      const $todoSection = $body.find('h3:contains("To Do List")').parent();
      const todoText = $todoSection.find('tbody tr').text();

      if (todoText.includes(formattedDate)) {
        cy.log(`✅ Project already in To Do List! (claimed by someone else or previously)`);
      } else {
        cy.log(`⚠️ Project "${formattedDate}" not found in Unassigned Task or To Do List`);
        cy.log(`💡 Possible reasons:`);
        cy.log(`   1. Project name mismatch`);
        cy.log(`   2. Project already processed by someone else`);
        cy.log(`   3. Project is in different status`);
      }
    });
  };

  searchAndClaim();
};

// ========================
// APPROVE PROJECT
// ========================

export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    ($row) => {
      cy.wrap($row)
        .find('span')
        .should('be.visible')
        .click();
      cy.log(`✅ Successfully approved project: ${projectName}`);
    },
    {
      waitAfterNext: 2000,
      filterCallback: ($row) => {
        const rowText = $row.text().trim();
        return rowText.includes(projectName) && !rowText.includes('Fetching data');
      }
    }
  );
};

// ========================
// ASSIGN TEAM TASK
// ========================

export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for: "${partialIdentifier}" keyword: "${uniqueKeyword}"`);

  if (!partialIdentifier) {
    throw new Error(`❌ taskIdentifier is empty — cannot search`);
  }

  const findAndAssignOnCurrentPage = (): void => {
    cy.get('tbody tr').then(($rows) => {
      const matchedRow = $rows.filter((_, el) => {
        const $el = Cypress.$(el);
        const projectCode = $el.find('td:nth-child(1)').text().trim();
        const productName = $el.find('td:nth-child(2)').text().trim();

        const hasProject = productName.includes(partialIdentifier) || projectCode.includes(partialIdentifier);

        // ✅ ค้นหา keyword ใน ALL cells — รองรับ column layout ต่างกันระหว่าง role
        const hasKeyword = uniqueKeyword
          ? $el.find('td').toArray().some(td => Cypress.$(td).text().trim().includes(uniqueKeyword))
          : true;

        return hasProject && hasKeyword;
      });

      if (matchedRow.length > 0) {
        cy.log(`✅ Found row — Product: "${Cypress.$(matchedRow[0]).find('td:nth-child(2)').text().trim()}"`);
        cy.wrap(matchedRow.first()).as('taskRow');
        cy.get('@taskRow').scrollIntoView().should('be.visible');

        cy.get('@taskRow').within(() => {
          cy.get('select.form-control.input-sm').as('assigneeDropdown');

          // ✅ click parent <td> เพื่อ trigger Angular API load options (ไม่ใช่ select โดยตรง)
          cy.get('@assigneeDropdown').parent().click();

          // dispatch events เพื่อให้ Angular change detection รับรู้
          cy.get('@assigneeDropdown').then(($select) => {
            const el = $select[0];
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            el.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true }));
          });

          // รอ option โหลดเข้ามาใน DOM
          cy.get('@assigneeDropdown')
            .find(`option[value="${assignee}"]`, { timeout: 30000 })
            .should('have.length.gte', 1);

          cy.get('@assigneeDropdown').then(($select) => {
            $select.val(assignee);
            $select[0].dispatchEvent(new Event('change', { bubbles: true }));
          });

          cy.get('@assigneeDropdown').should('have.value', assignee);
          cy.contains('span', 'Set')
            .closest('button')
            .should('not.be.disabled')
            .click();

          // ✅ ไม่มี cy.* ใน callback — resolve ทันทีที่ alert มา
          const alertPromise = new Cypress.Promise<void>((resolve, reject) => {
            cy.once('window:alert', (text) => {
              if (text.includes('Reassign success')) {
                resolve();
              } else {
                reject(new Error(`❌ Unexpected alert: "${text}"`));
              }
            });
          });

          cy.wrap(alertPromise, { timeout: 60000 });
          cy.log('🔔 Alert confirmed: Reassign success');
        });

      } else {
        cy.get('ul.pagination li').then(($items) => {
          const nextItem = $items.filter((_, li) => {
            return Cypress.$(li).text().trim() === 'Next' &&
              !Cypress.$(li).hasClass('disabled');
          });

          if (nextItem.length > 0) {
            cy.log(`➡️ Not found — going to next page`);
            cy.wrap(nextItem.first()).find('a').click();
            cy.wait('@getRequest', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
            findAndAssignOnCurrentPage();
          } else {
            throw new Error(`❌ "${partialIdentifier}" (keyword: "${uniqueKeyword}") not found on any page`);
          }
        });
      }
    });
  };

  findAndAssignOnCurrentPage();
}

// ========================
// APPROVAL FLOW BASE FUNCTIONS
// ========================

const createFullPageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback,
  finalAction: FinalAction
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/newApi/cksnew/getproductdetailCGMD/**').as('getDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/getProductDetailAttachment/**').as('getAttachment');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.get('tbody tr').then(($rows) => {
      $rows.each((index, row) => {
        const text = Cypress.$(row).text().trim();
        cy.log(`Row ${index}: ${text.substring(0, 100)}`);
        if (text.includes(projectName)) {
          cy.log(`✅✅✅ MATCH at row ${index}`);
        }
      });
    });
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 600000 }).should('include', expectedUrl);

  cy.wait(['@getProject', '@getDetail', '@getAttachment'], { timeout: 60000 })
    .then((interceptions) => {
      interceptions.forEach((interception) => {
        expect(interception.response).to.exist;
        expect(interception.response!.statusCode).to.eq(200);
      });
    });

  coreTaskCallback();

  switch (finalAction) {
    case 'AlertAndLogout':
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      break;
    case 'ComplexLogout':
      cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').click();
      break;
    case 'StopAfterCore':
      cy.log('Core task finished. Stopping as requested.');
      break;
  }
};

const createSimplePageApprovalFlow = (
  projectName: string,
  taskListHeader: TaskListHeader,
  expectedUrl: string,
  coreTaskCallback: CoreTaskCallback
): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');

  cy.get('h3').contains(taskListHeader).parent().within(() => {
    cy.contains('tbody tr', projectName, { timeout: 100000 })
      .should('be.visible')
      .within(() => {
        cy.get('span').contains('Approve').click();
      });
  });

  cy.url({ timeout: 60000 }).should('include', expectedUrl);
  coreTaskCallback();
  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.contains('button', 'Logout').click();
};

// ========================
// PROJECT NAME GETTERS
// ========================

export const registerProjectName = (name: string, index: number = 0): void => {
  projectManager.register(name, index);
};

export const getProjectNameByIndex = (index: number = 0): string => {
  return projectManager.get(index);
};

export const runForAllProjects = (callback: (projectName: string) => void): void => {
  projectManager.runForAll((name) => callback(name));
};

export const getStandardProjectName = (): string => {
  return projectManager.get(projectManager.getCurrentIndex());
};

export const getOntopProjectName = (): string => formattedDateOntop as string;

// ========================
// SPAD APPROVAL FUNCTIONS
// ========================

const pollUntilSPADDeployReady = (maxAttempts = 24, intervalMs = 5000): void => {
  const attempt = (remaining: number): void => {
    cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
    cy.wait(intervalMs);

    cy.contains('button', 'Refresh Status', { timeout: 15000 })
      .should('be.visible')
      .click();
    scrollAndWait();

    cy.get('body').then(($body) => {
      const $btn = $body.find('button').filter((_, el) => {
        const $el = Cypress.$(el);
        return (
          $el.text().trim().includes('Promote to SPAD Deploy') &&
          $el.closest('[hidden]').length === 0 &&
          $el.is(':visible') &&
          !$el.is(':disabled')
        );
      });

      if ($btn.length > 0) {
        cy.log('✅ Promote to SPAD Deploy button is ready');
      } else if (remaining > 0) {
        attempt(remaining - 1);
      } else {
        throw new Error('❌ Promote to SPAD Deploy button never became available after max attempts');
      }
    });
  };

  attempt(maxAttempts);
};

// ─────────────────────────────────────────────
// SPAD Sup — Approve as complex / non-complex
// ─────────────────────────────────────────────
const _approveSPADSup = (projectName: string, isComplex: boolean): void => {
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      const rnd5 = () => Math.floor(Math.random() * 90000) + 10000;
      const rnd2 = () => Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').type(rnd5().toString());
      cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').type(rnd2().toString());

      scrollAndWait();
      cy.contains('button', buttonText, { timeout: 3000000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

export const approveProjectSPADSup           = (projectName: string): void => _approveSPADSup(projectName, true);
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => _approveSPADSup(projectName, false);
export const approveProjectSPAD             = (projectName: string, isComplex = true): void => _approveSPADSup(projectName, isComplex);

// ─────────────────────────────────────────────
// SPAD Doer — Promote to SPAD Tester
// ─────────────────────────────────────────────
const _approveSPADDoer = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      if (isMainFlow) {
        cy.wait(3500);
        const rnd = () => Math.floor(Math.random() * 90000) + 10000;
        cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input').type('PT' + rnd());
        cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + rnd());
        cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input').type('PST' + rnd());
      }

      selectRandomOption('Gprs type');
      cy.wait(1500);
      selectRandomOption('Template');

      scrollAndWait();
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectSPADDOER     = (projectName: string): void => _approveSPADDoer(projectName, false);
export const approveProjectSPADDOERMain = (projectName: string): void => _approveSPADDoer(projectName, true);

// ─────────────────────────────────────────────
// SPAD Tester — Send PlugIN → poll → Promote to SPAD Deploy
// ─────────────────────────────────────────────
const _approveSPADTester = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      if (isMainFlow) {
        cy.wait(3500);
        scrollAndWait();

        cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve')) {
            throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
          }
        });

        cy.on('window:confirm', () => true);
        cy.contains('button', 'Send PlugIN', { timeout: 3000000 }).should('be.visible').click();
        clickYesIfExists(10000, 'first');

        pollUntilSPADDeployReady();
        cy.removeAllListeners('window:alert');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
        clickYesIfExists(10000, 'last');
      } else {
        scrollAndWait();
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 }).should('be.visible').click();
      }
    },
    isMainFlow ? 'StopAfterCore' : 'AlertAndLogout'
  );
};

export const approveProjectSPADTester     = (projectName: string): void => _approveSPADTester(projectName, false);
export const approveProjectSPADTesterMain = (projectName: string): void => _approveSPADTester(projectName, true);

// ─────────────────────────────────────────────
// SPAD Deploy — Promote to ACTM
// ─────────────────────────────────────────────
export const approveProjectSPADdeploy = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/actm/actm-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To ACTM', { timeout: 3000000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};
// ========================
// AFTER MKT PRE FUNCTIONS
// ========================
type FlowPattern = 'CGMD_FIRST' | 'SPAD_FIRST' | 'INTERLEAVED' | 'RANDOM';

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
const shuffleArray = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─────────────────────────────────────────────
// FLOW_PATTERN — สุ่มครั้งเดียวตอน module load
// ─────────────────────────────────────────────
const FLOW_PATTERN: FlowPattern = (() => {
  const env = (globalThis as any).Cypress?.env?.('FLOW_PATTERN');
  const valid: FlowPattern[] = ['CGMD_FIRST', 'SPAD_FIRST', 'INTERLEAVED', 'RANDOM'];
  return valid.includes(env) ? (env as FlowPattern) : valid[Math.floor(Math.random() * valid.length)];
})();

// ─────────────────────────────────────────────
// Core helpers
// ─────────────────────────────────────────────
const declareTest = (name: string, fn: () => void): void => {
  it(name, () => {
    cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running: ${name}`);
    fn();
  });
};

type TestEntry = { name: string; group: 'CGMD' | 'SPAD' | 'OTHER'; fn: () => void };

/** จัดลำดับ tests ตาม FLOW_PATTERN แล้ว declare ทีเดียว */
const declareRoleTests = (tests: TestEntry[]): void => {
  const byGroup = (g: TestEntry['group']) => tests.filter(t => t.group === g);
  const cgmd = byGroup('CGMD');
  const spad = byGroup('SPAD');
  const other = byGroup('OTHER');

  let ordered: TestEntry[];
  switch (FLOW_PATTERN) {
    case 'CGMD_FIRST':
      ordered = [...cgmd, ...spad, ...other];
      break;
    case 'SPAD_FIRST':
      ordered = [...spad, ...cgmd, ...other];
      break;
    case 'INTERLEAVED': {
      // s1, c1, c2, ..., s2, s3, ..., other
      const s = [...spad], c = [...cgmd];
      const interleaved: TestEntry[] = [];
      if (s.length) interleaved.push(s.shift()!);
      interleaved.push(...c);
      interleaved.push(...s);
      ordered = [...interleaved, ...other];
      break;
    }
    case 'RANDOM':
      ordered = shuffleArray(tests);
      break;
  }

  ordered.forEach(t => declareTest(t.name, t.fn));
};

// ─────────────────────────────────────────────
// Test definitions
// ─────────────────────────────────────────────
const STANDARD_TESTS: TestEntry[] = [
  { name: 'CGMD Config cbs role',  group: 'CGMD',  fn: () => performRoleTaskWithAssignment(cgccbs,   cgccbspass,   'cgccbs', approveProjectCGMDPRE,         'CBS') },
  { name: 'CGMD Tester CBS role',  group: 'CGMD',  fn: () => performRoleTaskWithAssignment(cgtcbs,   cgtcbspass,   'cgtcbs', approveProjectCGMDtesterPRE,   'CBS') },
  { name: 'Spadsup role',          group: 'SPAD',  fn: () => performSimpleClaimAndApprovalRole(spadsup,   spadsuppass,  approveProjectSPADSup) },
  { name: 'Spaddoer role',         group: 'SPAD',  fn: () => performSimpleClaimAndApprovalRole(spaddoer,  spaddoerpass, approveProjectSPADDOER) },
  { name: 'Spadtester role',       group: 'SPAD',  fn: () => performSimpleClaimAndApprovalRole(spadtest,  spadtestpass, approveProjectSPADTester) },
  { name: 'Spaddeploy role',       group: 'SPAD',  fn: () => performSimpleClaimAndApprovalRole(spaddp,    spaddppass,   approveProjectSPADdeploy) },
  { name: 'ACTM role',             group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM) },
  { name: 'APO role',              group: 'OTHER', fn: () => performSimpleApprovalRole(apo,  apopass,  approveProjectAPO) },
];

const PLUGIN_TESTS: TestEntry[] = [
  { name: 'CGMD Config cbs role',          group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE,                 'CBS')   },
  { name: 'CGMD Tester CBS role',          group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE,           'CBS')   },
  { name: 'Spadsup role',                  group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin) },
  { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex,   'PlugIN') },
  { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin,     'PlugIN') },
];

// ─────────────────────────────────────────────
// CKS-level exports
// ─────────────────────────────────────────────
export const afterCKSCommonPRE = (Module: string): void => {
  declareRoleTests(STANDARD_TESTS);
  if (Module === 'MUSIC') performMusicRoles();
};

export const afterCKSPREPlugin = (Module: string): void => {
  declareRoleTests(PLUGIN_TESTS);
  if (Module === 'MUSIC') performMusicRoles();
};

// ─────────────────────────────────────────────
// MKT Main exports
// ─────────────────────────────────────────────
export const afterMKTMainPRE_FullSpadFlow = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
    CopyDeductFail();
  });
  declareRoleTests(STANDARD_TESTS);
};

export const afterMKTMainPRE_NotComplex = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain(); unregister(); addauto5gCKS();
    checkAndFillContentType(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
  });
  declareRoleTests(PLUGIN_TESTS);
};

export const afterMKTOntop_NotComplex = (): void => {
  executeCKSRole('standard', 'ontop', () => {
    addauto5gCKS(); dropdownRecurringCKS(); diyflagCKS(); unregister();
    addauto5gCKS(); checkAndUpdatePriority(); checkAndUpdateVerticalAppPriority();
  });
  declareRoleTests(PLUGIN_TESTS);
};

// ─────────────────────────────────────────────
// MKT Ontop steps (เดิม stepsOntopPRE และ stepsOntopPREUsage เหมือนกัน 100%)
// ─────────────────────────────────────────────
const stepsOntopPRE = (): void => {
  cy.wait(15000);
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  checkAndFillContentType();
  checkAndUpdatePriority();
  checkAndUpdateVerticalAppPriority();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

// ─────────────────────────────────────────────
// MKT Ontop exports — ทุก variant ใช้ _runOntop เดียวกัน
// ─────────────────────────────────────────────
const _runOntop = (afterFn: (module: string) => void, module: string): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPRE);
  afterFn(module);
};

export const afterMKTontopPRE             = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER        = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin  = (): void => _runOntop(afterCKSPREPlugin,  'ENTER');
export const afterMKTontopPREMusicPlugin  = (): void => _runOntop(afterCKSPREPlugin,  'MUSIC');
export const afterMKTontopPREMUSIC        = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');

export const afterMKTontopPREUsage        = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREUsageEnter   = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREUsageMusic   = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');

const selectRandomDropdownRecurring = (): void => {
  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();

    cy.wrap($options[randomIndex]).click({ force: true });
    cy.get('.mat-select-value').should('contain.text', selectedText);
  });

  cy.get('.mat-select-value')
    .contains('Please Select')
    .click({ force: true });

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });

    cy.get('.mat-select-value').should('contain.text', selectedText);
  });
};
export const Randomdropdown = () => {
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="ontopConditionGroup"]';
    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          cy.get(selector).select(validOptions[randomIndex]);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="billPeriod"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then($options => {
          const validOptions = [...$options].map(o => (o as HTMLOptionElement).value);
          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const selectedValue = validOptions[randomIndex];

          cy.log(`Randomly selected Bill Period: ${selectedValue}`);

          // สั่ง Select ค่าที่สุ่มได้
          cy.get(selector).select(selectedValue);
        });
    } else {
      cy.log(`Skipped: ${selector} not found`);
    }
  });
  cy.get('body').then(($body) => {
    const tabSelector = 'a:contains("Money / Validity")';

    if ($body.find(tabSelector).length > 0) {
      cy.get(tabSelector).click();

      // คลิกปุ่ม +
      cy.get('button .glyphicon-plus').parent().click();

      // --- 1. Main Balance ---
      const randomBalance1 = Math.floor(Math.random() * 1000) + 100;
      cy.get('input[formcontrolname="balanceFirstPocket"]').type(randomBalance1.toString());

      // --- 2. Validity Main Balance & Unit ---
      cy.get('input[formcontrolname="validityFirstPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validityFirstPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement เพื่อเรียกใช้ .value ได้
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 3. Reward Balance ---
      const randomBalance2 = Math.floor(Math.random() * 500) + 50;
      cy.get('input[formcontrolname="balanceSecondPocket"]').type(randomBalance2.toString());

      // --- 4. Validity Reward Balance & Unit ---
      cy.get('input[formcontrolname="validitySecondPocket"]').type((Math.floor(Math.random() * 30) + 1).toString());

      cy.get('select[formcontrolname="validitySecondPocketUnit"]').then($select => {
        const options = $select.find('option:not([disabled])');
        const randomIndex = Math.floor(Math.random() * options.length);
        // แก้ไข: Cast เป็น HTMLOptionElement
        const randomOption = options[randomIndex] as HTMLOptionElement;
        cy.wrap($select).select(randomOption.value);
      });

      // --- 5. Usage Types (Dual List Box) ---
      cy.get('select[formcontrolname="availableListBox"]').then($select => {
        const options = $select.find('option');
        if (options.length > 0) {
          const randomIndex = Math.floor(Math.random() * options.length);
          // แก้ไข: Cast เป็น HTMLOptionElement
          const val = (options[randomIndex] as HTMLOptionElement).value;

          cy.get('select[formcontrolname="availableListBox"]').select(val);
          cy.get('button.str').click(); // ปุ่มเลื่อนไปขวา
        }
      });

      // --- 6. Description ---
      const randomDesc = `AutoTest_${Math.random().toString(36).substring(7)}`;
      cy.get('textarea[formcontrolname="balanceDescription"]').type(randomDesc);

      // --- กด Add ---
      cy.get('button').contains('Add').click();

    } else {
      cy.log('Skipped: Tab Money / Validity not found');
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .then($options => {
          const validOptions = [...$options]
            .map(o => (o as HTMLOptionElement).value)
            .filter(val => val !== '0: null');
          if (validOptions.length > 0) {
            const randomIndex = Math.floor(Math.random() * validOptions.length);
            cy.get(selector).select(validOptions[randomIndex]);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="recurringFeeDeduction"]';
    const $element = $body.find(selector);
    if ($element.length > 0 && $element.is(':visible')) {
      cy.get(selector)
        .find('option:not([disabled])')
        .then(($options) => {
          const randomIndex = Math.floor(Math.random() * $options.length);
          const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
          cy.get(selector).select(valueToSelect);
        });
    } else {
      cy.log(`Skipped: ${selector} is not visible or not found`);
    }
  });
  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="earlyRenewOfferingFlag"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });

  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="poType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;
            cy.get(selector).select(valueToSelect);
          }
        });
    }
  });


  cy.get('body').then(($body) => {
    const selector = 'select[formcontrolname="packageDataType"]';

    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .find('option')
        .not('[value="0: null"]')
        .then(($options) => {
          if ($options.length > 0) {
            const randomIndex = Math.floor(Math.random() * $options.length);
            const valueToSelect = ($options[randomIndex] as HTMLOptionElement).value;

            cy.get(selector).select(valueToSelect, { force: true });
          }
        });
    }
  });

}

export const dropdownRecurringCKS = (): void => {
  selectRandomDropdownRecurring();
};

export const dropdownRecurringCKSMain = (): void => {
  cy.get('.mat-select-value').eq(1).click({ force: true });

  cy.get('mat-option .mat-option-text').then($options => {
    const randomIndex = Math.floor(Math.random() * $options.length);
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.wrap($options.eq(randomIndex)).click({ force: true });
    cy.get('.mat-select-value').eq(1).should('contain.text', selectedText);
  });
};

export const dropdownRecurringPreMainCKS = (): void => {
  selectRandomDropdownRecurring();
};

// ========================
// UNREGISTER
// ========================

export const unregister = (): void => {
  cy.get('body').then(($body) => {
    if ($body.text().includes('UnRegister (Hold)')) {
      cy.contains('label', 'UnRegister (Hold)')
        .closest('.form-group')
        .find('input[type="radio"]')
        .then(($radios) => {
          const randomIndex = Math.floor(Math.random() * $radios.length);
          cy.wrap($radios[randomIndex]).check({ force: true });
          const selectedText = $radios[randomIndex].parentElement!.innerText.trim();
          cy.log(`Randomly selected: ${selectedText}`);
        });
    } else {
      cy.log('UnRegister (Hold) not found, skipping...');
    }
  });
};

// ========================
// ADD AUTO 5G CKS
// ========================

export const addauto5gCKS = (): void => {
  const values = ['1: Y', '2: X', '3: N'];
  const randomValue = values[Math.floor(Math.random() * values.length)];
  const selector = 'select[formcontrolname="autoAddService5g"]';

  cy.get('body').then(($body) => {
    if ($body.find(selector).length > 0) {
      cy.get(selector)
        .select(randomValue, { force: true })
        .should('have.value', randomValue);
    }
  });
};

// ========================
// DIY FLAG CKS
// ========================

export const diyflagCKS = (): void => {
  const isDiyYes = Math.random() < 0.5;
  const diyLabelToClick = isDiyYes ? 'Yes' : 'No';

  cy.log(`DIY Flag Decision: ${diyLabelToClick}`);
  cy.get('input[formcontrolname="diyFlag"]')
    .parent('label')
    .contains(diyLabelToClick)
    .click({ force: true });

  if (!isDiyYes) {
    cy.log('DIY Flag is No. Stopping execution.');
    return;
  }

  const isValidityYes = Math.random() < 0.5;
  const validityLabelToClick = isValidityYes ? 'Yes' : 'No';

  cy.log(`Validity Flag Decision: ${validityLabelToClick}`);

  cy.get('input[formcontrolname="validityFlag"]')
    .parent('label')
    .contains(validityLabelToClick)
    .click({ force: true });

  if (!isValidityYes) {
    cy.log('Validity Flag is No. Stopping execution.');
    return;
  }

  const isCBS = Math.random() < 0.5;
  const rewardLabel = isCBS ? 'CBS' : 'PlugIN/PHX';

  cy.log(`Reward Via Decision: ${rewardLabel}`);

  cy.get('input[formcontrolname="rewardVia"]')
    .parent('label')
    .contains(rewardLabel)
    .click({ force: true });

  cy.get('mat-select[formcontrolname="validityPackage"]')
    .filter(':visible')
    .as('activeDropdown')
    .click();

  cy.get('mat-option:not(.mat-option-disabled)')
    .should('have.length.gt', 0)
    .then(($options) => {
      const optionCount = $options.length;
      const randomIndex = Math.floor(Math.random() * optionCount);

      const selectedText = $options.eq(randomIndex).text().trim();
      cy.log(`Expecting to select: ${selectedText}`);

      cy.wrap($options)
        .eq(randomIndex)
        .scrollIntoView()
        .click({ force: true });

      cy.get('@activeDropdown')
        .find('.mat-select-value')
        .should('contain.text', selectedText);
    });
};

// ========================
// MUSIC ROLES
// ========================

export const performMusicRoles = (): void => {
  it('TSCENTER role', () => {
    loginAndWaitReady(tscenter, tscenterpass);

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
    cy.wait(1500);
    cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');

    cy.scrollTo('bottom');
    cy.wait(1500);
    cy.contains('button', 'Approve').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  const performSupportRole = (roleUser: any, rolePass: any, urlPart: string, btnText: string) => {
    it(`${urlPart} role`, () => {
      loginAndWaitReady(roleUser, rolePass);
      const finalProjectName = getStandardProjectName();
      cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
      ClaimProject(finalProjectName);
      approveProject(finalProjectName);
      cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');

      let checkUrl = '';
      if (urlPart === 'csisp') checkUrl = '/zenon/csi-support';
      else if (urlPart === 'aafsp') checkUrl = '/zenon/aaf-support';
      else if (urlPart === 'csidp') checkUrl = '/zenon/csi-support';
      else if (urlPart === 'aafdp') checkUrl = '/zenon/aaf-support';
      else checkUrl = urlPart;

      cy.url({ timeout: 60000 }).should('include', checkUrl);
      cy.wait(1500);
      cy.scrollTo('bottom');
      cy.wait(1500);
      cy.contains('button', btnText).should('be.visible').click({ force: true });
      cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
      cy.contains('button', 'Logout').should('be.visible').click();
    });
  };

  performSupportRole(csisp, csisppass, 'csisp', 'Promote To E2E Tester');
  performSupportRole(aafsp, aafsppass, 'aafsp', 'Promote To E2E Tester');

  it('e2etest role', () => {
    loginAndWaitReady(e2etest, e2etestpass);
    const finalProjectName = getStandardProjectName();
    cy.log('🎯 Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
    cy.wait(1500);
    cy.scrollTo('bottom');
    cy.wait(1500);

    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
      cy.get('input[type="file"][id="files"]').selectFile(
        { contents: Cypress.Buffer.from(fileContent, 'binary'), fileName: 'file.pdf', mimeType: 'application/pdf' },
        { force: true }
      );
    });
    cy.intercept('POST', '**/upload**').as('fileUpload');
    cy.contains('button', 'Approve to MKT Doer').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  it('MKT role', () => {
    loginAndWaitReady(music, musicpass);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/owner-zenon');
    cy.wait(1500);
    cy.scrollTo('bottom');
    cy.wait(1500);
    cy.contains('button', 'Approve').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });

  performSupportRole(csidp, csidppass, 'csidp', 'Promote To E2E Deploy');
  performSupportRole(aafdp, aafdppass, 'aafdp', 'Promote To E2E Deploy');

  it('e2edp role', () => {
    loginAndWaitReady(e2edp, e2edppass);
    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/e2e-tester');
    cy.wait(1500);
    cy.scrollTo('bottom');
    cy.wait(1500);
    cy.contains('button', 'Approve to Pre Go live').should('be.visible').click({ force: true });
    cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
    cy.contains('button', 'Logout').should('be.visible').click();
  });
};

// ========================
// TYPE REJECT NOTE BY ROLE
// ========================

export const typeRejectNoteByRole = (role: string): void => {
  const message = `reject from ${role}`;

  cy.get('textarea[formcontrolname="noteDetail"]')
    .should('be.visible')
    .type(message);

  cy.contains('button', 'Add')
    .should('not.be.disabled')
    .click();

  cy.get('button.btn-danger')
    .contains('Reject')
    .should('not.be.disabled')
    .click();
};

// ========================
// CKS ROLE RJ
// ========================

export const CKSroleRJ = (): void => {
  it('CKS role', () => {
    login(cks, ckspass);

    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
    cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

    typeRejectNoteByRole('cks');
  });
};
// ========================
// CGMD APPROVAL FUNCTIONS
// ========================

export const approveProjectCGMD = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      // Helper function สำหรับสุ่มเลือก mat-option เพียง 1 ค่า
      const selectSingleRandomMatOption = () => {
        cy.get('.cdk-overlay-container mat-option:not(.mat-option-disabled)')
          .should('have.length.greaterThan', 0)
          .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            cy.wrap($options.eq(randomIndex))
              .scrollIntoView()
              .click({ force: true });
          });
      };

      // ---------------------------------------------------------
      // Session DIY
      // ---------------------------------------------------------
      cy.get('body').then(($body) => {
        if ($body.find('app-diy-description mat-select').length > 0) {
          cy.log('🟢 พบ Session DIY - กำลังดำเนินการตั้งค่า');

          cy.get('app-diy-description .panel-heading').contains('DIY').click();

          cy.get('app-diy-description')
            .contains('.col-md-1', 'SO ID :')
            .next('.col-md-4')
            .find('mat-select')
            .click();
          selectSingleRandomMatOption();

          cy.get('body').then(($b) => {
            const rows = $b.find('app-diy-description table tbody tr');

            if (rows.length === 0) {
              cy.log('⚠️ DIY table ไม่มีแถว — ข้ามการสุ่ม Unit Name');
            } else {
              cy.log(`✅ DIY table พบ ${rows.length} แถว — กำลังสุ่ม Unit Name`);

              cy.wrap(rows).each(($tr) => {
                if ($tr.find('mat-select').length > 0) {
                  const typeName = $tr.find('td.text-left').text().trim();
                  cy.log(`🔧 กำลังสุ่มเลือกข้อมูลให้กับ: ${typeName}`);

                  cy.wrap($tr).find('mat-select').click();
                  selectSingleRandomMatOption();
                  cy.wait(1000);
                }
              });
            }
          });

          cy.get('app-diy-description button.btn-primary')
            .contains('Save')
            .scrollIntoView()
            .click({ force: true });

        } else {
          cy.log('⚪ ไม่พบ Session DIY (element ว่างเปล่า หรือไม่มี)');
        }
      });

      // ---------------------------------------------------------
      // SFF Product
      // ---------------------------------------------------------
      cy.get('body').then(($body) => {
        if ($body.find('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]').length > 0) {
          cy.log('🟢 พบ SFF Product - กำลังดำเนินการกรอกข้อมูล');

          const randomCommunityId = Cypress._.random(1000000000, 9999999999).toString();

          cy.get('app-sff-template-cgmd-addition input[formcontrolname="communityGroupId"]')
            .should('be.visible')
            .should('not.be.disabled')
            .clear()
            .type(randomCommunityId);

          cy.get('app-sff-template-cgmd-addition button.btn-success').contains('Save').click();

        } else {
          cy.log('⚪ ไม่พบ SFF Product (element ว่างเปล่า หรือไม่มี)');
        }
      });

      handleAddToUSMP();
      scrollAndWait();
      cy.get('button[name="CBS"]').should('be.visible', { timeout: 3000000 }).click();
      cy.contains('button', 'Yes').should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDPRE = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      const maxDigits = 12;
      const numDigits = Math.floor(Math.random() * maxDigits) + 1;
      const min = Math.pow(10, numDigits - 1);
      const max = Math.pow(10, numDigits) - 1;
      const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

      cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('input').type(randomNumber.toString());
      cy.contains('label', 'CBS_OFFERING_ID').closest('.col-md-4').find('a.btn').first().click();
      scrollAndWait();
      cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click({ force: true });
      handleAddToUSMP();
    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDPREMainNotComplex = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input')
        .type('PP' + Math.floor(Math.random() * 90000) + 10000);
      selectRandomOption('Gprs type');
      cy.wait(1500);
      selectRandomOption('Template');
      scrollAndWait();
      handleAddToUSMP();
      cy.contains('button', 'Approve To CGMD Tester', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDPREPlugin = approveProjectCGMDPREMainNotComplex;
export const approveProjectCGMDPREMain = approveProjectCGMDPREMainNotComplex;

export const approveProjectCGMDtester = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      scrollAndWait();
      cy.contains('span', 'Promote to ACTM').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDtesterPRE = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To Pre Go Live', { timeout: 3000000 }).should('be.visible').click();
      cy.contains('button', 'Yes').should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectCGMDtesterPREPlugin = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      cy.wait(3500);
      scrollAndWait();
      cy.intercept('GET', '**/api/SendPluginMain_v2/**').as('sendPluginApi');

      cy.once('window:alert', (alertText) => {
        if (!alertText.includes('Call API Plugin Success') && !alertText.includes('Do you want to Approve to Pre Go Live')) {
          throw new Error(`Unexpected alert text (Send PlugIN): ${alertText}`);
        }
      });

      cy.on('window:confirm', () => true);
      cy.contains('button', 'Send PlugIN', { timeout: 3000000 }).should('be.visible').click();
      clickYesIfExists(10000, 'first');

      // 🔄 Poll Refresh Status จนปุ่ม Promote to Pre Go Live พร้อม
      const pollUntilPromoteReady = (maxAttempts = 24, intervalMs = 5000): void => {
        const attempt = (remaining: number): void => {
          cy.log(`🔄 Polling Refresh Status... (attempts left: ${remaining})`);
          cy.wait(intervalMs);

          cy.contains('button', 'Refresh Status', { timeout: 15000 })
            .should('be.visible')
            .click();
          scrollAndWait();

          cy.get('body').then(($body) => {
            const $promoteBtn = $body.find('button').filter((_, el) => {
              const $el = Cypress.$(el);
              return (
                $el.text().trim().includes('Promote to Pre Go Live') &&
                $el.closest('[hidden]').length === 0 &&
                $el.is(':visible') &&
                !$el.is(':disabled')
              );
            });

            if ($promoteBtn.length > 0) {
              cy.log('✅ Promote to Pre Go Live button is ready');
            } else if (remaining > 0) {
              attempt(remaining - 1);
            } else {
              throw new Error('❌ Promote to Pre Go Live button never became available after max attempts');
            }
          });
        };
        attempt(maxAttempts);
      };

      pollUntilPromoteReady();

      cy.removeAllListeners('window:alert');

      cy.once('window:alert', (alertText) => {
        if (!alertText.includes('Do you want to Approve to Pre Go Live') && !alertText.includes('Call API Plugin Success')) {
          throw new Error(`Unexpected alert text (Promote): ${alertText}`);
        }
      });

      cy.contains('button', 'Promote to Pre Go Live', { timeout: 3000000 }).should('be.visible').click();
      clickYesIfExists(10000, 'last');
    },
    'StopAfterCore'
  );
};

// ========================
// OTHER APPROVAL FUNCTIONS
// ========================

export const approveProjectACTM = (projectName: string): void => {
  createFullPageApprovalFlow(
    projectName,
    'Unassigned Task',
    '/actm/actm-doer',
    () => {
      scrollAndWait();
      cy.get(':nth-child(3) > :nth-child(4)').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectOPER = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task',
    '/oper/oper-doer',
    () => {
      scrollAndWait();
      cy.get('.col-md-6 > :nth-child(3)').click();
    }
  );
};

export const approveProjectTSCenter = (projectName: string): void => {
  performSimpleClaimAndApprovalRole(
    'tscenter',
    'tscenter',
    (projectName: string) => {
      cy.get('select[formcontrolname="olympus"]').should('be.visible');
      cy.get('select[formcontrolname="olympus"]').select('No');
      cy.get('select[formcontrolname="olympus"]').should('have.value', 'No');
      cy.get('select[formcontrolname="olympus"]')
        .should('not.have.class', 'ng-invalid')
        .and('have.class', 'ng-valid');
      scrollAndWait();
      cy.contains('button', 'Approve').should('be.visible').click({ force: true });
      cy.contains('button', 'Yes').should('be.visible').click();
    }
  );
};

export const approveProjectAPO = (projectName: string): void => {
  createSimplePageApprovalFlow(
    projectName,
    'Unassigned Task',
    '/apo/apo-doer',
    () => {
      scrollAndWait();
      cy.contains('button', 'Promote To Pre Go Live').click();
    }
  );
};

// ========================
// ROLE HELPERS
// ========================

const assignTaskViaTracking = (projectName: string, assignee: string, billingSystem: string = ''): void => {
  cy.contains('span', 'Menu', { timeout: 100000 }).click();
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
  cy.get('a[href="#/new-report/home/tracking"]').click();
  cy.url({ timeout: 3000000 }).should('include', '/new-report/home/tracking', { timeout: 100000 });

  cy.get('table.table.table-condensed', { timeout: 200000 }).should('be.visible');
  cy.get('table.table.table-condensed tbody tr', { timeout: 200000 })
    .first().find('td').first().should('not.be.empty');
  cy.contains('table.table.table-condensed tbody td', 'PLM', { timeout: 200000 }).should('be.visible');

  assignTeamTask(projectName, assignee, billingSystem);
};

const navigateToWorkspace = (): void => {
  // cy.wait(10000)
  cy.contains('span', 'Menu', { timeout: 100000 }).click();
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
  cy.get('a[href="#/workspace-home/workspace"]').click();
  cy.url().should('include', '/workspace-home/workspace', { timeout: 1000000 });
};

const performRoleTaskWithAssignment = (
  user: string,
  pass: string,
  assignee: string,
  approveFunction: ApproveFunction,
  BillingSystem: string = ''
): void => {
  loginAndWaitReady(user, pass);
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  // cy.visit('/#/workspace-home/workspace');
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
  // const projectNamePONAME = 'MOB POST onetime main 1305 1615';
  const projectNamePONAME: string = getStandardProjectName();
  cy.log('Project Name: ' + projectNamePONAME);

  assignTaskViaTracking(projectNamePONAME, assignee, BillingSystem);
  navigateToWorkspace();

  cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
  approveFunction(projectNamePONAME);
};

const performSimpleApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction): void => {
  loginAndWaitReady(user, pass);
  const projectNamePONAME: string = getStandardProjectName();
  cy.log('Project Name: ' + projectNamePONAME);
  approveFunction(projectNamePONAME);
};

// ========================
// AFTER MKT FUNCTIONS
// ========================

export const afterMKTMAINPOST = (): void => {
  executeCKSRole('standard', 'main', () => {
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
    smsCKSPOST();
    Tariff();
  });
  afterCKSPOST();
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;

// ========================
// CKS ROLE EXECUTION
// ========================

const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
): void => {
  it('CKS role', () => {
    // ===== HARDCODE สำหรับทดสอบ =====
    // const HARDCODE_PROJECT_NAME = 'MOB PRE usage main 1905 1352';
    // const getProjectName: GetProjectNameFn = () => HARDCODE_PROJECT_NAME;
    // ================================

    const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard'
      ? getStandardProjectName
      : getOntopProjectName;

    standardCksPoEnhancementFlow(getProjectName, () => {
      customSteps();

      if (approvalType === 'main') {
        beforeapproveCKS();
      } else {
        beforeapproveCKSontop();
      }
    });
  });
};

// ========================
// CKS PO ENHANCEMENT FLOW
// ========================
const standardCksPoEnhancementFlow = (
  getProjectNameFn: GetProjectNameFn,
  enhanceStepsCallback: EnhanceStepsCallback
): void => {
  login(cks, ckspass);

  cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

  cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
  cy.get('body').should('be.visible');

  const finalProjectName: string = getProjectNameFn();
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

  cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

  // ✅ register ก่อน click เพื่อไม่ให้ request ยิงหนีก่อน intercept ทัน
  cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
  cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');

  cy.get('button.btn-sample')
    .contains('Enhance PO')
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  cy.url()
    .should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
    .then((url) => {
      if (url.includes('mass-enh-product-offering-detail')) {
        cy.wait('@getPoEnhDetail', { timeout: 60000 });
        cy.wait('@getCheckGenPoEnh', { timeout: 60000 });
        cy.wait('@getCheckSffEnh', { timeout: 60000 });
      } else {
        // ✅ Landed on fee-definition route — getPoEnhDetail/getCheckGenPoEnh/getCheckSffEnh ไม่ถูกเรียกบน route นี้
        cy.log('ℹ️ Landed on mass-enh-additional route — skipping PO detail waits');
      }
    });

  cy.wait(3500);

  enhanceStepsCallback();
};
// ========================
// BEFORE APPROVE CKS
// ========================


export const beforeapproveCKS = (): void => {
  standardBeforeApproveCKS();
};

export const beforeapproveCKSontop = (): void => {
  standardBeforeApproveCKS();
};

const standardBeforeApproveCKS = (): void => {
  // Button Back
  cy.contains('button', 'Back')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  // Button yes
  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  // รอ navigate ไปถึง cks-doer จริงๆ ก่อนแตะ UI
  cy.url({ timeout: 60000 }).should('include', '/new-flow/home/newcks/cks-doer');
  cy.get('body', { timeout: 60000 }).should('be.visible');
  cy.wait(2000);

  cy.contains('label', 'Fast Lane :')
    .parent()
    .next()
    .find('input[type="checkbox"]')
    .check();

  cy.get('.row.col-md-11')
    .find('input[type="checkbox"]')
    .check();
  cy.wait(['@getRequest'], { timeout: 100000 });

  const now = new Date();
  now.setDate(now.getDate() + 1);
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const formattedDateMain2 = `${day}/${month}/${year}`;

  cy.get('input[aria-label="Date input field"]').eq(1).type(formattedDateMain2);

  cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');
  cy.contains('button', 'Approve').click();
  cy.wait('@submitApprove', { timeout: 3000000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(7000);

  const finalProjectName = getStandardProjectName();
  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');
  cy.get('body', { timeout: 3000000 }).should('be.visible');
  cy.scrollTo('bottom');
  cy.wait(3500);

  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');

  cy.contains('button', 'Approve To CGMD', { timeout: 3000000 })
    .should('be.visible')
    .click();

  cy.wait('@promoteChecker', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@assignCgmd', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(1500);
  cy.contains('button', 'Logout').should('be.visible').click();
};

// ========================
// AFTER CKS POST
// ========================

export const afterCKSPOST = (Module?: string): void => {
  it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
  it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
};

// ========================
// TARIFF
// ========================

export const Tariff = (): void => {
  cy.get('.scrollmenu > .nav').contains('Tariff Plan & Discount').scrollIntoView().should('be.visible').click();
  cy.contains('.panel-heading', 'Tariff Plan')
    .scrollIntoView()
    .should('be.visible');

  cy.contains('label', '*Tariff Plan :')
    .closest('.col-md-12')
    .find('mat-select .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const totalOptions = $options.length;
      const firstOptionText = $options.eq(0).text().trim();
      const startIndex = (firstOptionText === 'Please Select') ? 1 : 0;
      const randomIndex = Math.floor(Math.random() * (totalOptions - startIndex)) + startIndex;
      const selectedTariffName = $options.eq(randomIndex).text().trim();
      cy.log(`✨ ระบบสุ่มเลือกแพ็กเกจ: ${selectedTariffName}`);
      cy.wrap($options[randomIndex]).click({ force: true });

      cy.contains('label', '*Tariff Plan :')
        .closest('.col-md-12')
        .find('mat-select .mat-select-value')
        .should('contain.text', selectedTariffName);
    });

  cy.contains('button', 'Generate Discount')
    .should('be.visible')
    .click();

  cy.get('select[formcontrolname="actualUsageVoice"]').should('be.visible').select(1);
  cy.get('select[formcontrolname="billPresentment"]').should('be.visible').select(1);

  cy.contains('button', 'Save')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  closeSuccessModal();
};

// ========================
// PRICE EXCLUDING
// ========================

export const PriceExcluding = (): void => {
  cy.contains('th', 'Charge Excluding VAT')
    .closest('.col-md-8')
    .find('.btn-primary')
    .click();

  function getRandomRealisticCharge(min = 100, max = 2000): string {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  const randomCharge = getRandomRealisticCharge();

  cy.get('input[formcontrolname="chargeExcVat"]')
    .clear()
    .type(randomCharge)
    .should('have.value', randomCharge);

  cy.get('input[formcontrolname="chargeExcVat"]')
    .clear()
    .type(randomCharge + 'abc!@#')
    .should('have.value', randomCharge);

  cy.get('.col-md-6 > .btn').click();
};

// ========================
// SELECT TARGET GROUP
// ========================

export const selectTargetGroup = (type:
  'mass' | 'massDisabled' | 'massStudents' | 'save' | 'fmc' |
  'specialCondition' | 'cvm' | 'staff' | 'test' | 'netGift' |
  'nbtc' | 'dummy' | 'traveller' | 'fbb' | 'random'
): void => {
  const targetGroupMap = {
    mass: '1: Mass',
    massDisabled: '2: Mass Disabled',
    massStudents: '3: Mass Students',
    save: '4: Save (Save Team, Save Port out)',
    fmc: '5: FMC',
    specialCondition: '6: Special Condition',
    cvm: '7: CVM',
    staff: '8: Staff',
    test: '9: Test',
    netGift: '10: Net Gift',
    nbtc: '11: NBTC',
    dummy: '12: Dummy',
    traveller: '13: Traveller',
    fbb: '14: FBB'
  };

  let value: string;

  if (type === 'random') {
    const availableTypes = Object.keys(targetGroupMap).filter(
      key => key !== 'netGift' && key !== 'traveller' && key !== 'fbb'
    ) as Array<keyof typeof targetGroupMap>;

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    value = targetGroupMap[randomType];
  } else {
    value = targetGroupMap[type as keyof typeof targetGroupMap];
  }

  cy.get('select[formcontrolname="targetGroup"]')
    .select(value)
    .should('have.value', value);
};

// ========================
// DROPDOWN PROMOTION GROUP
// ========================

export const dropdownPromotionGroup = (): void => {
  cy.get('select[formcontrolname="groupPackage"]').then($select => {
    const options = $select.find('option:not([value="0: null"])');
    if (options.length > 0) {
      const randomIndex = Math.floor(Math.random() * options.length);
      const selectedValue = Cypress.$(options[randomIndex]).prop('value');
      const selectedText = Cypress.$(options[randomIndex]).text().trim();
      cy.log(`Selected Group Package: ${selectedText}`);
      cy.wrap($select).select(selectedValue);
      cy.wrap($select).should('have.value', selectedValue);
    }
  });

  cy.get('select[formcontrolname="promotionGroup"]')
    .find('option')
    .then(($options) => {
      const options = [...$options];
      const validOptions = options.filter(option => option.value !== '0: null');
      const randomIndex = Math.floor(Math.random() * validOptions.length);
      const valueToSelect = validOptions[randomIndex].value;
      cy.get('select[formcontrolname="promotionGroup"]').select(valueToSelect);
    });

  cy.wait(1500);

  cy.get('select[formcontrolname="promotionSubGroup"]').each(($select: JQuery<HTMLElement>) => {
    const options = $select.find('option').toArray() as HTMLOptionElement[];
    const validOptions = options.filter((opt) => opt.value !== '0: null');
    if (validOptions.length > 0) {
      const randomOption = Cypress._.sample(validOptions);
      if (randomOption) {
        cy.wrap($select).select(randomOption.value);
        cy.log(`Selected: ${randomOption.text.trim()}`);
      }
    } else {
      cy.log('Skipped a dropdown because it had no valid options');
    }
  });
};

// ========================
// TARGET GROUP (DUAL LIST)
// ========================

export const targetgroup = (): void => {
  const optionsToSelect = [
    'Change Charge Type (Convert)',
    'Existing',
    'New',
    'Port In (Mobile Number Port)',
    'Renew / Recall from Terminate'
  ];

  const randomOption = optionsToSelect[Math.floor(Math.random() * optionsToSelect.length)];

  cy.get('select[formcontrolname="availableListBox"]')
    .should('exist')
    .and('be.visible');

  cy.get('select[formcontrolname="availableListBox"]')
    .contains('option', randomOption)
    .should('exist')
    .and('be.visible')
    .then($option => {
      cy.wrap($option).dblclick({ force: true });
    });
};

// ========================
// RETRY PATTERN
// ========================

export const RetryPattern = (): void => {
  cy.get('.scrollmenu > .nav')
    .contains('Retry Pattern')
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
    .should(($select) => {
      const options = $select.find('option');
      expect(options.length).to.be.greaterThan(1);
    })
    .find('option:not(:disabled)')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;

      cy.get('select[formcontrolname="actionWhenRetryReachMaxPeriod"]')
        .select(randomValue);

      cy.log(`Randomly selected: ${randomValue}`);

      if (randomValue.includes('Change to Other Main Promotion')) {
        cy.contains('label', 'Change to Other Main Promotion Details')
          .parent()
          .next()
          .find('mat-select')
          .click();

        cy.get('mat-option')
          .should('be.visible')
          .then(($matOptions) => {
            const matRandomIndex = Math.floor(Math.random() * $matOptions.length);
            cy.wrap($matOptions[matRandomIndex]).click({ force: true });
            cy.log('Randomly selected sub-promotion');
          });
      }
    });
};

// ========================
// COPY DEDUCT FAIL
// ========================
export const CopyDeductFail = (): void => {
  const mainTabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game'];

  const processTab = (index: number): void => {
    if (index >= mainTabs.length) {
      cy.log('🎉 All tabs processed successfully.');
      return;
    }

    const tabName = mainTabs[index];
    cy.log(`\n🔄 Processing [${index + 1}/${mainTabs.length}]: "${tabName}"`);

    cy.wait(1000);

    // ✅ 1. หา Main Tab แบบ jQuery (ไม่ใช้ cy.get() ที่ retry จนเทสพัง)
    cy.get('body').then(($body) => {
      const $mainTab = $body.find('.scrollmenu .nav a').filter(function () {
        return Cypress.$(this).text().trim() === tabName;
      });

      if ($mainTab.length === 0) {
        cy.log(`⚠️ Main tab "${tabName}" not found. Skipping...`);
        processTab(index + 1);
        return;
      }

      cy.wrap($mainTab.first()).click({ force: true });
      cy.wait(4000);

      // ✅ 2. หา Sub-tab "Deduct Fail"
      cy.get('body').then(($b) => {
        const $deductFail = $b.find('.nav-tabs a:visible').filter(function () {
          return Cypress.$(this).text().trim() === 'Deduct Fail';
        });

        if ($deductFail.length === 0) {
          cy.log(`⚠️ Sub-tab "Deduct Fail" not found for "${tabName}". Skipping...`);
          processTab(index + 1);
          return;
        }

        cy.wrap($deductFail.first()).click({ force: true });
        cy.wait(2000);

        // ✅ 3. หาปุ่ม "Copy From Deduct Success" ใน active pane
        cy.get('body').then(($bb) => {
          const $copyBtn = $bb.find('.tab-pane.active button:visible, .tab-pane.active a.btn:visible').filter(function () {
            return Cypress.$(this).text().trim() === 'Copy From Deduct Success';
          });

          if ($copyBtn.length === 0) {
            cy.log(`⚠️ Button "Copy From Deduct Success" not found for "${tabName}". Skipping...`);
          } else {
            cy.wrap($copyBtn.first()).click({ force: true });
            cy.log(`✅ Clicked Copy for "${tabName}"`);
          }

          cy.wait(500);
          processTab(index + 1); // ✅ เรียกถัดไปเสมอ ไม่ว่าจะสำเร็จหรือข้าม
        });
      });
    });
  };

  processTab(0);
};
// ========================
// BACK BASIC INFO
// ========================

export const backBacicInfo = (): void => {
  cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');
  cy.get('.modal-body > .col-md-12 > :nth-child(1) > .btn')
    .should('be.visible')
    .click();
  cy.wait('@getRequest4', { timeout: 100000 }).then((interception) => {
    console.log(`Intercepted request: ${interception.request.method} ${interception.request.url}`);
  });
};

// ========================
// ADD FILE
// ========================

export const addFile = (): void => {
  cy.get('input[type="file"]', { timeout: 10000 }).should('exist');

  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]').selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: '1.txt',
        mimeType: 'application/txt',
      },
      { force: true }
    );
  });

  // ✅ wait หลัง selectFile — requests ถูก trigger จาก file upload
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  beforeapproveMKT();
};
// ========================
// SMS WORDING FUNCTIONS
// ========================

const closeSuccessModal = (): void => {
  cy.get('.modal-dialog', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
};

const _smsWordingLogic = (type: 'POST' | 'PRE'): void => {

  // ── String helpers ────────────────────────────────────────────────────────
  const cleanEN = (s: string) => s ? s.replace(/[^\x00-\x7F\s]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim() : '';
  const cleanTH = (s: string) => s ? s.replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '').replace(/\s+/g, ' ').trim() : '';

  const limit = (s: string, max: number) => {
    if (!s) return '';
    let r = s.length > max ? s.substring(0, max).trimEnd() : s;
    if (r.length === max && r.includes(' ')) {
      const ls = r.lastIndexOf(' ');
      if (ls > max * 0.7) r = r.substring(0, ls);
    }
    return r;
  };

  const capEN = (s: string, max: number) => limit(cleanEN(s), max);
  const capTH = (s: string, max: number) => limit(cleanTH(s), max);
  const pick  = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const flag  = () => pick(['Send', "Don't Send"]);

  // ── Timing ────────────────────────────────────────────────────────────────
  const WAIT   = 500;
  const SCROLL = 500;

  // ── Pre-roll flags ────────────────────────────────────────────────────────
  const flags = {
    greeting:     flag(),
    delete:       flag(),
    lastMinute:   flag(),
    beforeDeduct: flag(),
    deductOk:     flag(),
    deductFail:   flag(),
    promote:      flag(),
  };

  const beforePromoVal = flag();
  const promoExpVal    = beforePromoVal === 'Send' ? "Don't Send" : flag();

  // ── Cypress helpers ───────────────────────────────────────────────────────
  const scrollTo = (sel: string, label: string) => {
    cy.log(`📌 Scrolling to: ${label}`);
    cy.get(sel).first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
    cy.wait(1000);
  };

  const withSection = (sel: string, label: string, fn: () => void) => {
    cy.get('body').then(($b: any) => {
      if (!$b.find(sel).length) return;
      scrollTo(sel, label);
      fn();
      cy.wait(WAIT);
    });
  };

  const fillTextarea = (sel: string, en: string, th: string, maxEn: number, maxTh: number) => {
    cy.get(sel).each(($el: any, idx: number) => {
      const cleaned = idx === 0 ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($el).focus().clear({ force: true }).type(cleaned, { delay: 0, force: true }).blur({ force: true });
    });
    cy.wait(300);
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(1500);

  cy.then(() => {
    const p = Cypress.env('formattedDateMain')
      || Cypress.env('formattedDate')
      || Cypress.env('projectName')
      || Cypress.env('formattedDateMainPONAME')
      || Cypress.env('formattedDateOntopPONAME')
      || Cypress.env('poName')
      || 'Product';

    const poName = Cypress.env('poName') || 'Product Offering';

    // ✅ สร้าง pools จาก createPOWordingPools (ค่าถูก resolve ทันที ไม่ต้อง replace ทีหลัง)
    const poolsData = createPOWordingPools(p, poName, type, 'recurring');

    // ✅ pools object ใหม่ — ไม่ต้องมี function r() แล้ว
    const pools = {
      shortPromo: {
        EN: () => pick(poolsData.shortPromotionName.EN),
        TH: () => pick(poolsData.shortPromotionName.TH),
      },
      cmsDisplay: {
        EN: () => pick(poolsData.description.EN),
        TH: () => pick(poolsData.description.TH),
      },
      promoDesc: {
        EN: () => pick(poolsData.promotionDescription.EN),
        TH: () => pick(poolsData.promotionDescription.TH),
      },
      checkCurrent: {
        EN: () => pick(poolsData.yourPackageName.EN),
        TH: () => pick(poolsData.yourPackageName.TH),
      },
      greeting: {
        EN: () => pick(poolsData.smsGreeting.EN),
        TH: () => pick(poolsData.smsGreeting.TH),
      },
      deletePRE: {
        EN: () => pick(poolsData.smsDelete.EN),
        TH: () => pick(poolsData.smsDelete.TH),
      },
      deletePOST: {
        EN: () => pick(poolsData.smsDelete.EN),
        TH: () => pick(poolsData.smsDelete.TH),
      },
      marketingName: () => pick(poolsData.shortPromotionName.EN),
      yourPackage: {
        EN: () => pick(poolsData.yourPackageName.EN),
        TH: () => pick(poolsData.yourPackageName.TH),
      },
      greetingLetter: {
        EN: () => pick(poolsData.greetingLetter.EN),
        TH: () => pick(poolsData.greetingLetter.TH),
      },
    };

    // ── Mode: 50/50 Generate vs Manual ───────────────────────────────────────
    const useGenerate = Math.random() < 0.5;
    cy.log(`🎲 SMS Wording mode: ${useGenerate ? '🤖 Generate Button' : '✍️ Manual Type'}`);

    // ── Trim generated overflow ───────────────────────────────────────────────
    const trimOverflow = (): void => {
      cy.log('✂️ Trimming overflowed generated fields...');
      cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
        const max = parseInt($el.attr('maxlength') || '9999', 10);
        const val = String($el.val() ?? '');
        if (val.length <= max) return;
        let trimmed = val.substring(0, max).trimEnd();
        if (trimmed.includes(' ')) {
          const ls = trimmed.lastIndexOf(' ');
          if (ls > max * 0.7) trimmed = trimmed.substring(0, ls);
        }
        cy.wrap($el)
          .invoke('val', trimmed)
          .trigger('input',  { bubbles: true, force: true })
          .trigger('change', { bubbles: true, force: true })
          .blur({ force: true });
      });
      cy.wait(500);
    };

    // ── Fill only if empty ────────────────────────────────────────────────────
    const fillIfEmpty = (sel: string, en: string, th: string, maxEn: number, maxTh: number): void => {
      cy.get('body').then(($b: any) => {
        if (!$b.find(sel).length) return;
        cy.get(sel).then(($els: any) => {
          if (!String($els.eq(0).val() ?? '').trim())
            cy.wrap($els.eq(0)).focus().type(capEN(en, maxEn), { delay: 0, force: true }).blur({ force: true });
          if ($els.length > 1 && !String($els.eq(1).val() ?? '').trim())
            cy.wrap($els.eq(1)).focus().type(capTH(th, maxTh), { delay: 0, force: true }).blur({ force: true });
        });
        cy.wait(300);
      });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PATH A — Generate Button
    // ════════════════════════════════════════════════════════════════════════
    if (useGenerate) {
      cy.get('app-mass-mkt-sms-wording-detail button[title="generate"]')
        .first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } })
        .should('be.visible').click({ force: true });
      cy.wait(2500);
      trimOverflow();

      fillIfEmpty('textarea[formcontrolname="shortPromotionName"]',   pools.shortPromo.EN(),   pools.shortPromo.TH(),   50,  50);
      fillIfEmpty('textarea[formcontrolname="cmsDisplay"]',           pools.cmsDisplay.EN(),   pools.cmsDisplay.TH(),   250, 250);
      fillIfEmpty('textarea[formcontrolname="promotionDescription"]', pools.promoDesc.EN(),    pools.promoDesc.TH(),    255, 255);
      fillIfEmpty('textarea[formcontrolname="smsCheckCurrent"]',      pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50,  50);

      if (flags.greeting === 'Send')
        fillIfEmpty('textarea[formcontrolname="smsGreeting"]', pools.greeting.EN(), pools.greeting.TH(), 400, 400);

      if (flags.delete === 'Send') {
        const dp = type === 'PRE' ? pools.deletePRE : pools.deletePOST;
        fillIfEmpty('textarea[formcontrolname="smsDelete"]', dp.EN(), dp.TH(), 250, 250);
      }

      if (type === 'POST') {
        fillIfEmpty('textarea[formcontrolname="marketingName"]',  pools.marketingName(), pools.marketingName(), 40,  40);
        fillIfEmpty('textarea[formcontrolname="yourPackage"]',    pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100);
        fillIfEmpty('textarea[formcontrolname="greetingLetter"]', pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PATH B — Manual Type (sections 1–4)
    // ════════════════════════════════════════════════════════════════════════
    if (!useGenerate) {
      withSection('textarea[formcontrolname="shortPromotionName"]', 'Short Promotion Name', () =>
        fillTextarea('textarea[formcontrolname="shortPromotionName"]', pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));

      withSection('textarea[formcontrolname="cmsDisplay"]', 'CMS Display', () =>
        fillTextarea('textarea[formcontrolname="cmsDisplay"]', pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));

      withSection('textarea[formcontrolname="promotionDescription"]', 'Promotion Description', () =>
        fillTextarea('textarea[formcontrolname="promotionDescription"]', pools.promoDesc.EN(), pools.promoDesc.TH(), 250, 250));

      withSection('textarea[formcontrolname="smsCheckCurrent"]', 'SMS Check Current', () =>
        fillTextarea('textarea[formcontrolname="smsCheckCurrent"]', pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ALWAYS — Sections 5–15
    // ════════════════════════════════════════════════════════════════════════

    // SECTION 5: SMS Greeting
    withSection('select[formcontrolname="smsGreetingSendFlag"]', 'SMS Greeting', () => {
      cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(flags.greeting, { force: true });
      if (flags.greeting === 'Send' && !useGenerate)
        fillTextarea('textarea[formcontrolname="smsGreeting"]', pools.greeting.EN(), pools.greeting.TH(), 400, 400);
    });

    // SECTION 6: SMS Confirm Subscription (PRE only)
    cy.get('body').then(($b: any) => {
      if ($b.find('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').length)
        cy.get('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').select(flags.greeting, { force: true });
    });

    // SECTION 7: SMS Delete
    withSection('select[formcontrolname="smsDeleteSendFlag"]', 'SMS Delete', () => {
      cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(flags.delete, { force: true });
      cy.wait(WAIT);

      if (flags.delete === 'Send') {
        if (type === 'PRE') {
          cy.get('input[formcontrolname="SmsDeletedefaultWordingFlag"]').then(($radios: any) => {
            if (!$radios.length) return;
            const defaultVal = pick(['Yes', 'No']);
            cy.wrap($radios).parent().contains(defaultVal).click({ force: true });
            cy.wait(WAIT);
            if (defaultVal === 'No' && !useGenerate)
              fillTextarea('textarea[formcontrolname="smsDelete"]', pools.deletePRE.EN(), pools.deletePRE.TH(), 250, 250);
          });
        } else if (!useGenerate) {
          fillTextarea('textarea[formcontrolname="smsDelete"]', pools.deletePOST.EN(), pools.deletePOST.TH(), 250, 250);
        }
      }
    });

    // SECTIONS 8–11: simple flag selects
    const simpleFlagSections: [string, string, string][] = [
      ['select[formcontrolname="lastMinuteAlertSendFlag"]',            'Last Minute Alert',        flags.lastMinute],
      ['select[formcontrolname="smsBeforeFeeDeductSendFlag"]',         'Before Fee Deduction',     flags.beforeDeduct],
      ['select[formcontrolname="recurringDeductSuccessAlertSendFlag"]','Recurring Deduct Success', flags.deductOk],
      ['select[formcontrolname="recurringDeductFailAlertSendFlag"]',   'Recurring Deduct Fail',    flags.deductFail],
    ];
    simpleFlagSections.forEach(([sel, label, val]) =>
      withSection(sel, label, () => cy.get(sel).select(val, { force: true })));

    // SECTION 12: SMS Promote Package
    withSection('select[formcontrolname="smsPromotePackSendFlag"]', 'SMS Promote Package', () => {
      cy.get('select[formcontrolname="smsPromotePackSendFlag"]').select(flags.promote, { force: true });
      if (flags.promote === 'Send')
        fillTextarea('textarea[formcontrolname="smsPromotePack"]',
          `Special offer! ${p} - Get it now`, `ข้อเสนอพิเศษ! ${p} - รับเลยตอนนี้`, 250, 250);
    });

    // SECTION 13: Before Promotion Expired
    withSection('select[formcontrolname="beforePromotionExpAlertSendFlag"]', 'Before Promotion Expired', () => {
      cy.get('select[formcontrolname="beforePromotionExpAlertSendFlag"]').select(beforePromoVal, { force: true });
      if (beforePromoVal === 'Send') {
        cy.get('input[formcontrolname="beforePromotionExpAlertDeduction"]')
          .clear({ force: true }).type(`${Cypress._.random(1, 30)}`, { force: true });
        cy.get('select[formcontrolname="beforePromotionExpAlertDeductionUnit"]').then(($s: any) => {
          const opts = $s.find('option').toArray()
            .filter((o: HTMLOptionElement) => o.value && o.value !== 'null' && !o.disabled)
            .map((o: HTMLOptionElement) => o.value);
          if (opts.length) cy.wrap($s).select(Cypress._.sample(opts), { force: true });
        });
      }
    });

    // SECTION 14: Promotion Expired
    withSection('select[formcontrolname="promotionExpAlertSendFlag"]', 'Promotion Expired', () => {
      cy.log(`🔒 Promo Exp = ${promoExpVal} (excl. Before Promo = ${beforePromoVal})`);
      cy.get('select[formcontrolname="promotionExpAlertSendFlag"]').select(promoExpVal, { force: true });
    });

    // SECTION 15: POST-only fields (Manual only)
    if (type === 'POST' && !useGenerate) {
      withSection('textarea[formcontrolname="marketingName"]', 'Marketing Name', () =>
        cy.get('textarea[formcontrolname="marketingName"]').focus()
          .clear({ force: true })
          .type(capEN(pools.marketingName(), 40), { delay: 0, force: true })
          .blur({ force: true }));

      withSection('textarea[formcontrolname="yourPackage"]', 'Your Package', () =>
        fillTextarea('textarea[formcontrolname="yourPackage"]', pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));

      withSection('textarea[formcontrolname="greetingLetter"]', 'Greeting Letter', () =>
        fillTextarea('textarea[formcontrolname="greetingLetter"]', pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
    }

    // ── Flush all pending Angular form state before Save ──────────────────────
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el: any) => {
      cy.wrap($el).blur({ force: true });
    });
    cy.wait(500);

    // ── Save ─────────────────────────────────────────────────────────────────
    cy.get('body').then(($b: any) => {
      if (!$b.find('.container-fluid > :nth-child(3) > .btn').length) return;
      scrollTo('.container-fluid > :nth-child(3) > .btn', 'Save Button');
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();
      cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
      closeSuccessModal();
    });

  }); // end cy.then()
};

export const smsWording = (): void => {
  _smsWordingLogic('POST');
};

export const smsWordingpre = (): void => {
  _smsWordingLogic('PRE');
};
// ========================
// SMS CKS 
// ========================

export const smsCKSPRE = (): void => {
  cy.get('body').then(($body) => {
    const normalizeText = (text: string | null | undefined): string =>
      (text ?? '').replace(/\s+/g, ' ').trim();

    const $tab = $body
      .find('ul.nav.nav-tabs li a, .scrollmenu > .nav a')
      .filter((_i, el) => normalizeText(el.textContent) === 'SMS Wording');

    if (!$tab.length) {
      cy.log('⚠️ Tab "SMS Wording" not found — skipping');
      return;
    }

    cy.wrap($tab.first()).scrollIntoView().click({ force: true });
    cy.log('✅ Clicked tab: "SMS Wording"');
    cy.log('featureDescription');
  });
};

export const smsCKSPOST = (): void => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(3500);

  cy.then(() => {
    const finalProjectName = Cypress.env('formattedDateMain') ||
      Cypress.env('formattedDate') ||
      Cypress.env('projectName') ||
      Cypress.env('formattedDateMainPONAME') ||
      Cypress.env('formattedDateOntopPONAME') ||
      Cypress.env('poName');

    const p = finalProjectName;

    const randomMessageCode = (): string => {
      return `PRO${Math.floor(Math.random() * 10000)}`;
    };

    cy.get('select[formcontrolname="smsPromotePackSendFlag"]').first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(2000);

    cy.get('select[formcontrolname="smsPromotePackSendFlag"]').then(($select) => {
      const currentValue = $select.val() as string;

      if (currentValue === 'Send') {
        cy.log('✅ SMS Promote Package = Send, filling messageCode');
        cy.get('input[formcontrolname="messageCode"]').first().type(randomMessageCode(), { force: true });
        cy.wait(2000);
      } else {
        cy.log('⚠️ SMS Promote Package is not "Send", skipping messageCode');
      }
    });

    // Save - ใช้ selector ที่ถูกต้อง
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.contains('button', 'Save').should('be.visible').click(); // ✅ แก้ตรงนี้
    cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    closeSuccessModal();
  });
};

// ========================
// RANDOM PRODUCT SPECIFICATION
// ========================

export const RandomProductSpecification = (
  productClass: string,
  priceType?: string,
  subModule?: string,
  Module?: string
): void => {
  const targetList = [
    'AIS Secure Net',
    'Apple Care',
    'Cloud PC',
    'Flowaccount',
    'MS365 Copilot',
    'Mobile Care',
    'Ubisoft Plus',
    // 'Voice',
    // 'SMS',
    // 'MMS',
    // 'Calling Melody',
    // 'Cloud Game',
    // 'AI IP Camera',
    // 'WiFi',
    // 'Karaoke',
    // 'VRBT',
    // 'Music Streaming',
    // 'Arcade',
    // 'TV Plus',
    // 'Youtube Premium',
    // 'Internet',
    // 'Vertical App',
  ];

  const blockedForMain = ['SMS', 'MMS', 'Voice'];

  const effectiveBlocked = [
    ...blockedForMain,
    ...(productClass === 'main' ? ['AI IP Camera', 'Youtube Premium', 'Mobile Care', 'Ubisoft Plus', 'Calling Melody', 'Karaoke', 'VRBT', 'Music Streaming', 'Arcade', 'TV Plus'] : []),
  ];

  const canRandomPick = productClass === 'main' || productClass === 'ontop' || productClass === 'ontop extra';

  // ── Step 1: scan available options & pick random subset ──────────────────
  if (canRandomPick) {
    cy.contains('.panel-heading', '*Product Specification')
      .closest('.panel')
      .within(() => {
        cy.get('select[formcontrolname="availableListBox"]')
          .first()
          .find('option')
          .should($options => {
            const texts = [...$options].map(el => el.textContent?.trim() || '');
            const hasAny = texts.some(t => targetList.includes(t));
            expect(hasAny, 'waiting for targetList options to load').to.be.true;
          })
          .then($options => {
            const available = [...$options]
              .map(el => el.textContent?.trim() || '')
              .filter(text => targetList.includes(text))
              .filter(text => !effectiveBlocked.includes(text)); // ✅ กันตั้งแต่ step 1

            const pickCount = Cypress._.random(1, Math.min(available.length, 5));
            const picked = Cypress._.shuffle(available).slice(0, pickCount);

            cy.wrap(picked).as('pickedItems');
            cy.log(`🎲 Picked (${pickCount}): ${picked.join(', ')}`);
          });
      });
  } else {
    // ไม่สุ่ม — ใช้ empty array เป็น placeholder
    cy.wrap([]).as('pickedItems');
    cy.log(`⏭️ productClass="${productClass}" — ข้ามการสุ่ม pickedItems`);
  }

  // ── Step 2: build configQueue + dblclick ─────────────────────────────────
  cy.get('@pickedItems').then(alias => {
    const pickedItems = alias as unknown as string[];
    const configQueue: string[] = [];

    // ✅ main — Internet เสมอ ไม่ขึ้นกับ random
    if (productClass === 'main') {
      configQueue.push('Internet');
      cy.log('📌 main: Internet forced into configQueue');
    }

    if (canRandomPick) {
      pickedItems
        .filter(item => !effectiveBlocked.includes(item)) // ✅ defense layer 2
        .forEach(item => {
          cy.contains('.panel-heading', '*Product Specification')
            .closest('.panel')
            .within(() => {
              cy.get('select[formcontrolname="availableListBox"]')
                .first()
                .contains('option', item)
                .dblclick({ force: true });

              cy.get('select[formcontrolname="availableListBox"]')
                .first()
                .find('option')
                .should($options => {
                  const texts = [...$options].map(el => el.textContent?.trim() || '');
                  expect(texts, `"${item}" should leave availableListBox`).not.to.include(item);
                });

              cy.get('select[formcontrolname="selectedListBox"]')
                .find('option')
                .should($options => {
                  const texts = [...$options].map(el => el.textContent?.trim() || '');
                  expect(texts, `"${item}" should arrive in selectedListBox`).to.include(item);
                })
                .then(() => cy.log(`✅ moved to selected: ${item}`));
            });

          if (!configQueue.includes(item)) {
            configQueue.push(item);
            cy.log(`➕ added to configQueue: ${item}`);
          }
        });
    }

    // ── Step 3: dispatch sub-functions ───────────────────────────────────
    cy.then(() => {
      cy.log(`⚙️ configQueue: ${configQueue.join(', ')}`);

      if (configQueue.includes('Voice')) { cy.log('▶️ Voice()'); Voice(); }
      if (configQueue.includes('SMS')) { cy.log('▶️ Sms()'); Sms(); }
      if (configQueue.includes('MMS')) { cy.log('▶️ Mms()'); Mms(); }
      if (configQueue.includes('Internet')) { cy.log('▶️ InternetRandom()'); InternetRandom(productClass, subModule, Module); }
      if (configQueue.includes('Vertical App')) { cy.log('▶️ VerticalApp()'); VerticalApp(); }
      if (configQueue.includes('Cloud Game')) { cy.log('▶️ CloudGame()'); CloudGame(); }
      if (configQueue.includes('AI IP Camera')) { cy.log('▶️ AIIPCamera()'); AIIPCamera(); }
      if (configQueue.includes('WiFi')) { cy.log('▶️ WiFi()'); WiFi(); }
      if (configQueue.includes('Karaoke')) { cy.log('▶️ Karaoke()'); Karaoke(); }
      if (configQueue.includes('VRBT')) { cy.log('▶️ VRBT()'); VRBT(); }
      if (configQueue.includes('Music Streaming')) { cy.log('▶️ MusicStreaming()'); MusicStreaming(); }

      const entItems = configQueue.filter(i => ['Arcade', 'TV Plus', 'Youtube Premium'].includes(i));
      if (entItems.length > 0) {
        cy.log(`▶️ EntertainmentPartnership(${entItems.join(', ')})`);
        EntertainmentPartnership(entItems as any);
      }
    });
  });
};


// ========================
// VOICE
// ========================

export const Voice = (fillRating = true): void => {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Voice$/)
        .click({ force: true });

      cy.wait(1500);

      const shouldFill = {
        voiceFreeResource: Cypress._.random(0, 1) === 1,
        voiceFN: Cypress._.random(0, 1) === 1,
        voiceSpecialNumber: Cypress._.random(0, 1) === 1,
        // ✅ fillRating=false (main) → Rating ทั้ง 3 ถูกข้ามทุกครั้ง
        // ✅ fillRating=true  (ontop/ontop extra) → สุ่มตามปกติ
        voiceRating: fillRating && Cypress._.random(0, 1) === 1,
        vdoCallRating: fillRating && Cypress._.random(0, 1) === 1,
        landlineRating: fillRating && Cypress._.random(0, 1) === 1,
      };

      // ==========================================
      // 🔧 HELPER FUNCTIONS
      // ==========================================

      const randomSelectFromDropdown = (selector: string) => {
        return cy.get(selector).then($select => {
          if ($select.length > 0 && $select.is(':visible')) {
            cy.wrap($select).find('option:not([disabled])').then($options => {
              if ($options.length > 0) {
                const randomIndex = Cypress._.random(0, $options.length - 1);
                cy.wrap($select).select($options.eq(randomIndex).val() as string, { force: true });
                cy.wait(600);
              }
            });
          }
        });
      };

      const expandPanel = (selector: string) => {
        cy.get(selector).within(() => {
          cy.get('.panel-heading').first().then($heading => {
            cy.get('.collapse-panel').first().then($panel => {
              const isCollapsed = !$panel.hasClass('in') && !$panel.hasClass('show');
              const isHidden = $panel.css('display') === 'none';
              if (isCollapsed || isHidden) {
                cy.wrap($heading).click({ force: true });
                cy.wait(1200);
                cy.get('.collapse-panel').first().should('be.visible');
              }
            });
          });
        });
      };

      // ==========================================
      // SESSION 1: Voice Free Resource
      // ==========================================

      if (shouldFill.voiceFreeResource) {
        cy.log('--- Filling Voice Free Resource ---');
        const TOTAL_FREE_RESOURCE = Cypress._.random(2, 6);

        expandPanel('app-mass-mkt-voice-free-resource');
        cy.wait(1000);

        Cypress._.times(TOTAL_FREE_RESOURCE, (frIndex) => {
          cy.log(`📦 Adding Free Resource: ${frIndex + 1}/${TOTAL_FREE_RESOURCE}`);

          cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {
            cy.get('.collapse-panel').first().should('be.visible');
            cy.get('button.btn-primary.btn-xs').find('.glyphicon-plus').first().click({ force: true });
            cy.wait(1500);

            cy.get('select[formcontrolname="priceTypePattern"]', { timeout: 5000 }).then($select => {
              if ($select.length === 0) return;
              cy.wrap($select).find('option:not([disabled])').then($options => {
                if ($options.length === 0) return;
                cy.wrap($select).select(
                  $options.eq(Cypress._.random(0, $options.length - 1)).val() as string,
                  { force: true }
                );
                cy.wait(600);
              });
            });
          });

          cy.get('app-mass-mkt-voice-free-resource mat-select[role="listbox"]', { timeout: 10000 })
            .should('exist')
            .then($matSelect => {
              if (!$matSelect.is(':visible') || $matSelect.attr('aria-disabled') === 'true') return;
              cy.wrap($matSelect).find('.mat-select-trigger').scrollIntoView().click({ force: true });
              cy.wait(1000);
              cy.get('.cdk-overlay-container mat-option', { timeout: 10000 })
                .should('have.length.greaterThan', 0)
                .then($options => {
                  cy.wrap($options.eq(Cypress._.random(0, $options.length - 1))).click({ force: true });
                  cy.wait(800);
                });
              cy.get('body').then($body => {
                if ($body.find('.cdk-overlay-backdrop').length > 0) {
                  cy.wrap($body).click({ force: true });
                }
              });
              cy.wait(1000);
            });

          cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {

            const checkRandomRadio = (name: string) => {
              cy.root().then($root => {
                const $visible = $root.find(`input[type="radio"][formcontrolname="${name}"]:visible`);
                if ($visible.length === 0) {
                  cy.log(`  ⚠️ No visible radio [${name}] -> Skipping`);
                  return;
                }
                cy.wrap($visible.eq(Cypress._.random(0, $visible.length - 1))).check({ force: true });
                cy.wait(600);
              });
            };

            const safeSelectDropdown = (selector: string) => {
              cy.root().then($root => {
                const $visible = $root.find(`${selector}:visible`);
                if ($visible.length === 0) return;
                cy.wrap($visible.first()).find('option:not([disabled])').then($opts => {
                  if ($opts.length === 0) return;
                  cy.wrap($visible.first()).select(
                    $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                    { force: true }
                  );
                  cy.wait(600);
                });
              });
            };

            const fillConditionalInputAndUnit = (inputName: string, unitName: string, label: string) => {
              cy.wait(1200);
              cy.root().then($root => {
                const $input = $root.find(`input[formcontrolname="${inputName}"]:visible`);
                if ($input.length === 0) {
                  cy.log(`  ℹ️ ${label} = No -> Skipping`);
                  return;
                }
                cy.log(`  ℹ️ ${label} = Yes -> Filling`);
                cy.wrap($input.first())
                  .clear({ force: true })
                  .type(Cypress._.random(10, 1000).toString(), { force: true, delay: 150 });
                cy.wait(600);
                safeSelectDropdown(`select[formcontrolname="${unitName}"]`);
              });
            };

            cy.get('input[formcontrolname="commuFreeResource"]')
              .should('be.visible')
              .clear({ force: true })
              .type(Cypress._.random(10, 500).toString(), { force: true, delay: 150 });
            cy.wait(600);
            safeSelectDropdown('select[formcontrolname="commuFreeResourceUnit"]');
            checkRandomRadio('peakTimeFlag');
            checkRandomRadio('voiceQuotaRollOver');
            fillConditionalInputAndUnit('maxRollOverQuota', 'maxRollOverQuotaUnit', 'Voice Quota Roll Over');
            checkRandomRadio('netFlexi');
            fillConditionalInputAndUnit('daily', 'dailyUnit', 'Daily Flag');
            cy.wait(800);

            cy.get('button[type="submit"].btn-primary').contains('Add').last().click({ force: true });
            cy.wait(1500);
          });

          cy.wait(1000);
          cy.log(`  ✅ Free Resource ${frIndex + 1} added`);
        });

        cy.log(`--- Voice Free Resource Filled Successfully (${TOTAL_FREE_RESOURCE} rows) ---`);
      }

      // ==========================================
      // SESSION 2: Voice FN
      // ==========================================

      if (shouldFill.voiceFN) {
        cy.log('--- Filling Voice FN ---');
        const MAX_FN = 5;
        const TOTAL_FN = Cypress._.random(1, MAX_FN);

        expandPanel('app-mass-mkt-voice-fn');
        cy.wait(1000);

        cy.get('app-mass-mkt-voice-fn').within(() => {
          cy.get('.collapse-panel', { timeout: 10000 })
            .should('be.visible')
            .then($panel => {
              const hasValidClass = $panel.hasClass('show') || $panel.hasClass('in');
              expect(hasValidClass).to.be.true;
            });

          Cypress._.times(TOTAL_FN, (fnIndex) => {
            cy.log(`📦 Adding FN: ${fnIndex + 1}/${TOTAL_FN}`);

            cy.get('> .panel > .collapse-panel')
              .find('> button.btn-primary.btn-xs')
              .first()
              .click({ force: true });
            cy.wait(1500);

            cy.get('.panel-body:visible', { timeout: 10000 }).should('exist').as('voiceForm');

            cy.get('@voiceForm').find('input[formcontrolname="maxFNNumber"]')
              .should('be.visible')
              .clear()
              .type(Cypress._.random(1, MAX_FN).toString(), { delay: 150 });
            cy.wait(600);
            randomSelectFromDropdown('select[formcontrolname="fnNetwork"]');

            cy.get('@voiceForm').find('select[formcontrolname="fnType"]').should('be.visible').then($select => {
              const options = $select.find('option:not([disabled])');
              const index = Cypress._.random(0, options.length - 1);
              const text = options.eq(index).text().trim();
              cy.wrap($select).select(text);
              cy.wait(1000);
              cy.log(`  ✓ FN Type: ${text}`);

              if (text === 'Free Call') {
                cy.get('@voiceForm').find('input[formcontrolname="fnFreeCall"]')
                  .should('be.visible').clear().type(Cypress._.random(10, 60).toString(), { delay: 150 });
                cy.wait(600);
                randomSelectFromDropdown('select[formcontrolname="fnFreeCallUnit"]');
              }
              if (text === 'Special Rate') {
                cy.get('@voiceForm').find('input[formcontrolname="fnRateExcVat"]')
                  .should('be.visible').clear().type((Math.random() * 10).toFixed(2), { delay: 150 });
                cy.wait(600);
                randomSelectFromDropdown('select[formcontrolname="fnRateExcVatUnit"]');
              }
            });

            cy.wait(800);
            cy.get('.panel-body:visible').find('.col-md-4.col-md-offset-8').last().within(() => {
              cy.contains('button', 'Add').should('be.visible').click({ force: true });
            });
            cy.wait(1200);
            cy.log(`  ✅ FN ${fnIndex + 1} added`);
          });
        });

        cy.log(`--- Voice FN Filled Successfully (${TOTAL_FN} rows) ---`);
      }

      // ==========================================
      // SESSION 3: Voice Special Number
      // ==========================================

      const genSpecialNumber = () => {
        const patterns = [
          () => `*${Cypress._.random(100, 999)}#`,
          () => `*${Cypress._.random(10, 99)}#`,
          () => `*${Cypress._.random(1, 9)}#`,
          () => `*${Cypress._.random(1000, 9999)}#`,
          () => `*${Cypress._.random(10000, 99999)}#`,
          () => `#${Cypress._.random(100, 999)}#`,
          () => `#${Cypress._.random(10, 99)}#`,
          () => `${Cypress._.random(100, 999)}`,
          () => `${Cypress._.random(1000, 9999)}`,
          () => `06${Cypress._.random(10000000, 99999999)}`,
          () => `08${Cypress._.random(10000000, 99999999)}`,
          () => `09${Cypress._.random(10000000, 99999999)}`,
          () => `+66${Cypress._.random(810000000, 899999999)}`,
          () => `*${Cypress._.random(10, 99)}*${Cypress._.random(10, 99)}#`,
          () => `*${Cypress._.random(100, 999)}*${Cypress._.random(10, 99)}#`,
        ];
        return patterns[Cypress._.random(0, patterns.length - 1)]();
      };

      if (shouldFill.voiceSpecialNumber) {
        cy.log('🔥 --- Filling Voice Special Number ---');
        const TOTAL_PANELS = Cypress._.random(2, 5);

        expandPanel('app-mass-mkt-voice-b-number');
        cy.wait(1000);

        cy.get('app-mass-mkt-voice-b-number').within(() => {
          cy.get('.collapse-panel.show, .collapse-panel.in', { timeout: 10000 }).should('be.visible');

          Cypress._.times(TOTAL_PANELS, (panelIndex) => {
            cy.log(`📦 [STEP 1] สร้าง Panel ที่ ${panelIndex + 1}/${TOTAL_PANELS}`);

            cy.get('.collapse-panel.show > button.btn-primary.btn-xs:visible, .collapse-panel.in > button.btn-primary.btn-xs:visible')
              .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
              .first()
              .click({ force: true });
            cy.wait(1500);

            cy.get('.panel.panel-default:visible', { timeout: 10000 }).last().as(`detailPanel${panelIndex}`);

            const ITEMS_PER_PANEL = Cypress._.random(2, 4);

            cy.get(`@detailPanel${panelIndex}`).within(() => {
              Cypress._.times(ITEMS_PER_PANEL, (itemIndex) => {
                cy.get('button.btn.btn-primary.btn-xs:visible')
                  .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
                  .first()
                  .click({ force: true });
                cy.wait(1200);

                cy.get('input[formcontrolname="specialNumber"]', { timeout: 5000 }).should('be.visible');

                const specialNum = genSpecialNumber();
                cy.get('input[formcontrolname="specialNumber"]')
                  .clear().type(specialNum, { delay: 150 });
                cy.wait(800);

                cy.get('button[type="submit"]:visible').last().click({ force: true });
                cy.wait(1500);
              });

              cy.get('select[formcontrolname="bNumberType"]').should('be.visible').then($select => {
                const options = $select.find('option:not([disabled])');
                if (options.length === 0) throw new Error('❌ No bNumberType options');
                const val = options.eq(Cypress._.random(0, options.length - 1)).val();
                cy.wrap($select).select(val as string);
                cy.wait(1500);

                cy.root().then($root => {
                  if (val === 'Free Call') {
                    const $freeCall = $root.find('input[formcontrolname="bFreeCall"]:visible');
                    const $freeCallUnit = $root.find('select[formcontrolname="bFreeCallUnit"]:visible');
                    if ($freeCall.length > 0) {
                      cy.wrap($freeCall.first()).clear().type(Cypress._.random(1, 60).toString(), { delay: 150 });
                      cy.wait(600);
                      if ($freeCallUnit.length > 0) {
                        cy.wrap($freeCallUnit.first()).find('option:not([disabled])').then($opts => {
                          if ($opts.length > 0) cy.wrap($freeCallUnit.first()).select($opts.eq(0).val() as string);
                          cy.wait(600);
                        });
                      }
                    }
                  } else if (val === 'Special Rate') {
                    const $rateExc = $root.find('input[formcontrolname="bRateExcVat"]:visible');
                    const $rateUnit = $root.find('select[formcontrolname="bRateExcVatUnit"]:visible');
                    if ($rateExc.length > 0) {
                      cy.wrap($rateExc.first()).clear().type(Cypress._.random(0.5, 10).toFixed(2), { delay: 150 });
                      cy.wait(600);
                      if ($rateUnit.length > 0) {
                        cy.wrap($rateUnit.first()).find('option:not([disabled])').then($opts => {
                          if ($opts.length > 0) cy.wrap($rateUnit.first()).select($opts.eq(0).val() as string);
                          cy.wait(600);
                        });
                      }
                    }
                  }
                });
              });

              cy.wait(800);
              cy.get('button:visible')
                .filter((_, el) => Cypress.$(el).text().trim() === 'Add')
                .last()
                .click({ force: true });
              cy.wait(2500);
            });

            cy.wait(1000);
          });
        });

        cy.log(`✅ --- Voice Special Number Completed (${TOTAL_PANELS} panels) ---`);
      }

      // ==========================================
      // SESSION 4, 5, 6: Ratings
      // ✅ ถูกข้ามทั้งหมดเมื่อ fillRating=false (main)
      // ✅ สุ่มตามปกติเมื่อ fillRating=true (ontop/ontop extra)
      // ==========================================

      const fillRatingSection = (selector: string, label: string) => {
        if (!selector || !label) return;
        cy.log(`--- Filling ${label} ---`);
        expandPanel(selector);
        cy.wait(1000);

        cy.get(selector, { timeout: 10000 }).within(() => {
          cy.get('.collapse-panel').first().should('be.visible');

          if (label.includes('VDO') || label.includes('Landline')) {
            if (Cypress._.random(0, 1) === 1) {
              cy.get('button.btn-info').contains('Copy From Voice Rating').then($btn => {
                if ($btn.is(':visible')) {
                  cy.wrap($btn).click({ force: true });
                  cy.wait(1500);
                  cy.log(`${label} - Copied from Voice Rating`);
                }
              });
            }
          }

          cy.get('button.btn-primary').first().then($btn => {
            if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
          });
        });

        cy.wait(1500);

        cy.get(selector, { timeout: 10000 }).within(() => {
          cy.get('.panel-body').then($panels => {
            const $formPanel = $panels.filter((i, el) => {
              return Cypress.$(el).find('input[formcontrolname="rateExcludingVAT"]').length > 0;
            });
            if ($formPanel.length === 0) {
              cy.log(`${label} - Inline form not found. Skipping fill.`);
              return;
            }

            cy.wrap($formPanel.first()).within(() => {
              cy.get('select[formcontrolname="networkFlag"]', { timeout: 3000 }).then($net => {
                if ($net.is(':visible') && !$net.is(':disabled')) {
                  const $opts = $net.find('option:not([disabled])');
                  if ($opts.length > 1) {
                    const randomIdx = Cypress._.random(1, $opts.length - 1);
                    cy.wrap($net).select($opts.eq(randomIdx).val() as string, { force: true });
                    cy.wait(800);
                  }
                }
              });

              cy.get('input[formcontrolname="rateExcludingVAT"]', { timeout: 3000 })
                .should('be.visible')
                .then($input => {
                  if (!$input.is(':disabled')) {
                    const randomRate = Cypress._.random(0.5, 50.0).toFixed(2);
                    cy.wrap($input).clear({ force: true }).type(randomRate, { force: true, delay: 150 });
                    cy.wait(600);
                  }
                });

              cy.get('select[formcontrolname="rateUnit"]', { timeout: 3000 })
                .should('be.visible')
                .then($sel => {
                  if (!$sel.is(':disabled')) {
                    const $opts = $sel.find('option:not([disabled])');
                    if ($opts.length > 0) {
                      cy.wrap($sel).select(
                        $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                        { force: true }
                      );
                      cy.wait(600);
                    }
                  }
                });

              cy.wait(800);
              cy.get('button[type="submit"]').contains('Add', { timeout: 5000 })
                .should('be.visible')
                .then($btn => {
                  if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
                });
            });
          });
        });

        cy.wait(2000);
        cy.log(`${label} - Added new item`);
      };

      if (shouldFill.voiceRating) fillRatingSection('app-mass-mkt-voice-rating', 'Voice Rating');
      if (shouldFill.vdoCallRating) fillRatingSection('app-mass-mkt-vdo-call-rating', 'VDO Call Rating');
      if (shouldFill.landlineRating) fillRatingSection('app-mass-mkt-landline-rating', 'Landline Rating');

      cy.log('=== Voice Tab Fill Summary ===');
      cy.log(`Voice Free Resource: ${shouldFill.voiceFreeResource ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice FN: ${shouldFill.voiceFN ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice Special Number: ${shouldFill.voiceSpecialNumber ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice Rating: ${shouldFill.voiceRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
      cy.log(`VDO Call Rating: ${shouldFill.vdoCallRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
      cy.log(`Landline Rating: ${shouldFill.landlineRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
    }
  });
};

// ========================
// MMS
// ========================

export const Mms = (fillRating = true): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.get('.collapse-panel').first().should('be.visible');
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('app-mass-mkt-mms-free-resource mat-select .mat-select-trigger')
      .should('be.visible')
      .click({ force: true });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .should('have.length.gt', 0)
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
      });

    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.contains('button', 'Add').should('be.visible').click({ force: true });
    });
  };

  const fillMmsRatingInput = (controlName: string) => {
    cy.get(`input[formcontrolname="${controlName}"]`)
      .should('exist')
      .clear({ force: true })
      .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
      .blur({ force: true });
  };

  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^MMS$/)
        .click({ force: true });

      // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
      processFreeResource();

      // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
      if (fillRating) {
        cy.get('app-mass-mkt-mms-rating').within(() => {
          cy.get('.panel-heading').first().click({ force: true });
        });
        cy.get('app-mass-mkt-mms-rating').within(() => {
          fillMmsRatingInput('mmsExcludingVat');
          fillMmsRatingInput('mmsdrExcludingVat');
          fillMmsRatingInput('mmsrrExcludingVat');
        });
      } else {
        cy.log('⏭️ Mms Rating skipped (fillRating=false / main)');
      }
    }
  });
};

// ========================
// SMS
// ========================

export const Sms = (fillRating = true): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.get('.collapse-panel').first().should('be.visible');
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('app-mass-mkt-sms-free-resource mat-select .mat-select-trigger')
      .should('be.visible')
      .click({ force: true });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .should('have.length.gt', 0)
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
      });

    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.contains('button', 'Add').should('be.visible').click({ force: true });
    });
  };

  const fillRatingSection = (headerText: string, controlName: string) => {
    cy.get('app-mass-mkt-sms-rating').within(() => {
      cy.contains('.panel-heading', headerText)
        .closest('.panel')
        .within(() => {
          cy.get('.collapse-panel').first().then(($panel) => {
            if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
              cy.get('.panel-heading').first().click({ force: true });
              cy.get('.collapse-panel').first().should('be.visible');
            }
          });
          cy.get(`input[formcontrolname="${controlName}"]`)
            .should('exist')
            .clear({ force: true })
            .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
            .blur({ force: true });
        });
    });
  };

  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^SMS$/)
        .click({ force: true });

      // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
      processFreeResource();

      // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
      if (fillRating) {
        cy.get('app-mass-mkt-sms-rating').within(() => {
          cy.get('.panel-heading').first().click({ force: true });
        });
        fillRatingSection('SMS Rating', 'smsExcludingVat');
        fillRatingSection('SMS Delivery Report Rating', 'smsdrExcludingVat');
        fillRatingSection('iSMS Rating', 'iSmsExcludingVat');
      } else {
        cy.log('⏭️ Sms Rating skipped (fillRating=false / main)');
      }
    }
  });
};

// ========================
// WiFi
// ========================

export const WiFi = (): void => {
  // ═══════════════════════════════════════════════════════
  // 🔧 CONFIG & SELECTORS
  // ═══════════════════════════════════════════════════════
  const COMPONENT = 'app-mass-mkt-wifi'
  const HEADING_SELECTOR = '.panel-heading.cursor-point'
  const PANEL_BODY = '.panel.panel-default'
  const WIFI_USAGE_TYPES = ['Volume-based', 'Time-based']
  const WIFI_QUOTA_TYPES = ['Unlimited Data (Fixed Speed)', 'Unlimited Data (Throttling Speed)']

  // 🎯 Resilient tab selector - supports Bootstrap + Angular Material
  const TAB_SELECTOR = 'a.nav-link, .nav-item a, mat-tab-label, [role="tab"], button.mat-tab-label, .mat-tab-label'

  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const waitForComponentReady = (componentSelector: string, timeout = 30000): void => {
    cy.log(`⏳ Waiting for ${componentSelector} to be fully loaded...`)

    // ✅ FIX 1: ไม่ return $el เพราะ downstream ไม่ได้ใช้ค่านี้
    cy.get(componentSelector, { timeout })
      .should('exist')
      .and('be.visible')
      .then(($el) => {
        cy.log(`✅ Component loaded: ${$el.length} element(s)`)
      })

    // ✅ FIX 2: แยก chain ออกมาชัดเจน ไม่ปนกัน
    cy.get('body', { timeout: 10000 })
      .should('not.have.class', 'loading')
      .and('not.contain.text', 'Loading...')
      .and('not.contain.text', 'Loading')
  }
  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: findTabByName (Resilient Tab Finder)
  // ═══════════════════════════════════════════════════════
  const findTabByName = (tabName: string, scope: Cypress.Chainable = cy.get(COMPONENT)): Cypress.Chainable => {
    cy.log(`🔍 Searching for tab: "${tabName}"`)

    return scope
      .find(TAB_SELECTOR, { timeout: 15000 })
      .filter((_, el) => {
        const text = Cypress.$(el).text().trim()
        return text === tabName || text.includes(tabName)
      })
      .should('be.visible')
      .first()
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: expandPanelIfNeeded
  // ═══════════════════════════════════════════════════════
  const expandPanelIfNeeded = (): void => {
    cy.log('🔓 Ensuring WiFi panel is expanded...')

    cy.get(COMPONENT, { timeout: 15000 })
      .should('exist')
      .find(HEADING_SELECTOR, { timeout: 10000 })
      .should('be.visible')
      .then(($heading) => {
        const $chevronDown = $heading.find('.glyphicon-chevron-down')
        const $chevronUp = $heading.find('.glyphicon-chevron-up')

        if ($chevronDown.length > 0 && $chevronUp.length === 0) {
          cy.log('📥 Panel is collapsed → clicking to expand')
          cy.wrap($heading).click({ force: true })
          cy.wait(800)
        } else {
          cy.log('📤 Panel already expanded ✓')
        }
      })

    // Ensure inner form panel is visible (remove hidden attribute if present)
    cy.get(COMPONENT).within(() => {
      cy.get(PANEL_BODY, { timeout: 10000 })
        .should('exist')
        .then(($panel) => {
          if ($panel.attr('hidden') !== undefined) {
            cy.log('🔧 Removing "hidden" attribute from form panel')
            cy.wrap($panel).invoke('removeAttr', 'hidden')
            cy.wait(300)
          }
        })
    })

    cy.wait(400)
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: fillWifiDetailForm
  // ═══════════════════════════════════════════════════════
  const fillWifiDetailForm = (tabIdx: number, tabName: string): void => {
    cy.log(`🚀 [WiFi – ${tabName}] Starting form fill...`)

    const usageType = rand(WIFI_USAGE_TYPES)
    const quotaType = rand(WIFI_QUOTA_TYPES)

    cy.log(`🎲 Usage Type → ${usageType} | Quota Type → ${quotaType}`)

    // Click Add button with flexible selector
    cy.log(`➕ Clicking Add button (index: ${tabIdx})`)
    cy.get(COMPONENT)
      .find('button.btn-primary.btn-xs[style*="width:60px"], button.btn-primary.btn-xs', { timeout: 12000 })
      .eq(tabIdx)
      .should('be.visible')
      .click({ force: true })
    cy.wait(600)

    // Select Usage Type
    cy.log(`📋 Selecting Usage Type: ${usageType}`)
    cy.get(COMPONENT)
      .find('select[formcontrolname="wiFiUsageType"], select[name*="usage"], select.ng-pristine', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .select(usageType, { force: true })
    cy.wait(400)

    // Select Quota Type
    cy.log(`📋 Selecting Quota Type: ${quotaType}`)
    cy.get(COMPONENT)
      .find('select[formcontrolname="wiFiQuotaType"], select[name*="quota"]', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .select(quotaType, { force: true })
    cy.wait(400)

    // Handle Angular Material mat-select
    cy.log(`🎯 Opening mat-select dropdown`)
    cy.get(COMPONENT)
      .find('mat-select .mat-select-trigger, mat-select, .mat-select-trigger', { timeout: 10000 })
      .eq(tabIdx)
      .should('be.visible')
      .click({ force: true })
    cy.wait(800)

    // Select random enabled option from dropdown
    cy.get('body')
      .find('mat-option, .mat-option, [role="option"]', { timeout: 12000 })
      .should('have.length.greaterThan', 0)
      .then(($opts) => {
        const available = $opts
          .toArray()
          .filter((el: Element) => {
            const disabled = el.getAttribute('aria-disabled') === 'true'
              || el.getAttribute('disabled') !== null
              || Cypress.$(el).hasClass('mat-option-disabled')
            return !disabled
          })

        if (available.length === 0) {
          cy.log(`⚠️ No enabled options found → closing dropdown`)
          cy.get('body').type('{esc}', { force: true })
          return
        }

        const picked = available[Math.floor(Math.random() * available.length)]
        const optionText = Cypress.$(picked).text().trim()
        cy.log(`🎲 Selected WiFi value → ${optionText}`)
        cy.wrap(picked).click({ force: true })
      })
    cy.wait(500)

    // Click Save/Add button
    cy.log(`💾 Clicking Add button to save`)
    cy.get(COMPONENT)
      .find('.panel-body, .mat-tab-body-active, form', { timeout: 10000 })
      .eq(tabIdx)
      .find('button.btn-primary, button[type="submit"]')
      .contains(/Add|Save|บันทึก|เพิ่ม/i)
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    // Verify success message or table update
    cy.log(`✅ Form filled - verifying update...`)
    cy.get('body', { timeout: 8000 })
      .should('not.contain.text', 'Error')
      .and('not.contain.text', 'Failed')

    cy.log(`✨ [WiFi – ${tabName}] Form completed successfully`)
  }

  // ═══════════════════════════════════════════════════════
  // 🔹 HELPER: verifyTabHasData
  // ═══════════════════════════════════════════════════════
  const verifyTabHasData = (tabName: string): void => {
    cy.log(`🔎 Verifying data in tab: ${tabName}`)

    // Try to find and click the tab first
    cy.get(COMPONENT)
      .find(TAB_SELECTOR, { timeout: 10000 })
      .filter((_, el) => {
        const text = Cypress.$(el).text().trim()
        return text === tabName || text.includes(tabName)
      })
      .first()
      .click({ force: true })
    cy.wait(400)

    // Check table has actual data (not "No data to display")
    cy.get(COMPONENT)
      .find('table.table tbody, tbody', { timeout: 8000 })
      .first()
      .should(($tbody) => {
        const text = $tbody.text().trim()
        expect(text).not.to.match(/No data|ไม่พบข้อมูล|empty/i)
      })
  }

  // ═══════════════════════════════════════════════════════
  // 🚀 MAIN TEST FLOW
  // ═══════════════════════════════════════════════════════

  // ── STEP 1: Navigate to WiFi Component ─────────────────
  cy.log('📶 [WiFi] 🎯 Navigating to WiFi component...')

  cy.get('a.nav-link, a[routerlinkactive], .nav-tabs a, button.nav-link', { timeout: 20000 })
    .contains('WiFi')
    .should('be.visible')
    .click({ force: true })

  waitForComponentReady(COMPONENT, 35000)

  // ── STEP 2: Expand Panel & Prepare UI ──────────────────
  expandPanelIfNeeded()

  // ── STEP 3: Locate & Click "Deduct Success" (Adaptive) ───
  cy.log('📶 [WiFi] 🔍 Locating "Deduct Success" section...')

  // ✅ ใช้ cy.contains() ซึ่งมี Retry + Timeout ในตัว
  // ลองค้นหาใน Component ก่อน ถ้าไม่เจอให้ค้นหาทั้งหน้า
  cy.get(COMPONENT, { timeout: 20000 })
    .should('exist')
    .then(($comp) => {
      const html = $comp.html()
      const isInComponent = html.includes('Deduct Success') ||
        html.includes('deduct-success') ||
        html.includes('DeductSuccess')

      if (isInComponent) {
        cy.log('📍 Found within component scope → clicking')
        cy.get(COMPONENT).contains('Deduct Success', { timeout: 10000 })
          .should('be.visible')
          .click({ force: true })
      } else {
        cy.log('🌍 Not in component → searching globally')
        cy.contains('Deduct Success', { timeout: 15000 })
          .should('be.visible')
          .click({ force: true })
      }
    })
  cy.wait(500)
  // ── STEP 4: Process "Deduct Success" Tab (Mandatory) ───
  cy.log('📶 [WiFi] ▶️ Processing Tab: Deduct Success')

  findTabByName('Deduct Success', cy.get(COMPONENT))
    .click({ force: true })
  cy.wait(500)

  fillWifiDetailForm(0, 'Deduct Success')

  // ── STEP 5: Process "Deduct Fail" Tab (Optional) ───────
  cy.log('📶 [WiFi] 🔍 Checking for optional tab: Deduct Fail')

  cy.get(COMPONENT).then(($component) => {
    const html = $component.html()
    const hasDeductFail = html.includes('Deduct Fail')

    if (hasDeductFail) {
      cy.log('📶 [WiFi] 🔀 Deduct Fail tab found → processing...')

      // Use retry logic in case tab isn't immediately clickable
      cy.get(COMPONENT, { timeout: 15000 })
        .find(TAB_SELECTOR)
        .filter((_, el) => {
          const text = Cypress.$(el).text().trim()
          return text === 'Deduct Fail' || text.includes('Deduct Fail')
        })
        .first()
        .should('be.visible')
        .click({ force: true })
      cy.wait(600)

      fillWifiDetailForm(1, 'Deduct Fail')
    } else {
      cy.log('📶 [WiFi] ⏭️ Deduct Fail tab not present → skipping (expected)')
    }
  })

  // ── STEP 6: Final Verification ─────────────────────────
  cy.log('📶 [WiFi] 🏁 Running final verification...')

  // Verify Deduct Success has data
  verifyTabHasData('Deduct Success')

  // Verify Deduct Fail if it exists
  cy.get(COMPONENT).then(($component) => {
    if ($component.html().includes('Deduct Fail')) {
      verifyTabHasData('Deduct Fail')
    }
  })

  // ── STEP 7: Success Logging ────────────────────────────
  cy.log('📶 [WiFi] 🎉 All WiFi test steps completed successfully! ✨')

  // Optional: Take screenshot for evidence
  // cy.get(COMPONENT).screenshot('wifi-test-completed', { capture: 'viewport' })
}
// ========================
// VerticalApp
// ========================
export const VerticalApp = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Vertical App$/)
    .click({ force: true });
  cy.wait(3500);

  cy.get('app-mass-mkt-vertical-app').within(() => {
    cy.get('.collapse-panel').then(($panel) => {
      if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
        cy.get('.panel-heading').click({ force: true });
      }
    });

    cy.get('button:has(.glyphicon-plus)').click({ force: true });
  });

  cy.get('select[formcontrolname="VerticalAppUsageType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📡 Vertical App Usage Type: ${val}`);
      cy.get('select[formcontrolname="VerticalAppUsageType"]').select(val, { force: true });
    });

  cy.get('select[formcontrolname="VerticalAppQuotaType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📦 Vertical App Quota Type: ${val}`);
      cy.wrap(val).as('selectedQuotaValue');
      cy.get('select[formcontrolname="VerticalAppQuotaType"]').select(val, { force: true });
    });

  cy.contains('label', '*Vertical App :')
    .closest('.form-group')
    .find('mat-select .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  cy.get('body')
    .find('mat-option')
    .not('.mat-option-disabled')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const label = $options.eq(randomIndex).text().trim();
      cy.log(`📱 Vertical App selected: ${label}`);
      cy.wrap($options).eq(randomIndex).scrollIntoView().click({ force: true });
    });

  cy.get('app-mass-mkt-vertical-app').within(() => {
    const scenario = Cypress._.random(0, 2);
    // 0 = 3G only
    // 1 = 4G + 3G  (system default)
    // 2 = 5G + 4G + 3G
    const scenarioLabels = ['3G only', '4G + 3G', '5G + 4G + 3G'];
    cy.log(`🗼 Network Coverage scenario: ${scenarioLabels[scenario]}`);

    cy.get('[formarrayname="vaNetworkCoverageCheckBox"] input[type="checkbox"]')
      .each(($checkbox, index) => {
        // index 0 = 5G, index 1 = 4G, index 2 = 3G
        const shouldCheck =
          (scenario === 0 && index === 2) ||  // 3G only
          (scenario === 1 && index >= 1) ||   // 4G + 3G
          (scenario === 2);                   // 5G + 4G + 3G

        if (shouldCheck) {
          cy.wrap($checkbox).check({ force: true });
        } else {
          cy.wrap($checkbox).uncheck({ force: true });
        }
      });

    cy.get('select[formcontrolname="commuSpeed"]')
      .find('option:not([disabled])')
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        const val = $options.eq(randomIndex).val() as string;
        cy.log(`⚡ Commu Speed: ${val}`);
        cy.get('select[formcontrolname="commuSpeed"]').select(val, { force: true });
      });

    cy.get('@selectedQuotaValue').then((quotaValue) => {
      if (String(quotaValue).includes('Throttling')) {
        cy.log(`🐢 Quota includes Throttling → selecting Throttling Speed`);
        cy.get('select[formcontrolname="commuThrottlingSpeed"]')
          .should('exist')
          .find('option:not([disabled])', { timeout: 10000 })
          .should('have.length.greaterThan', 0)
          .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.log(`🐢 Commu Throttling Speed: ${val}`);
            cy.get('select[formcontrolname="commuThrottlingSpeed"]').select(val, { force: true });
          });
      }
    });

    cy.wait(2000);
    cy.contains('button', /^Add$/).click({ force: true });
    cy.log(`✅ Vertical App → Add clicked`);
    cy.wait(2000);
  });
};

// ========================
// CLOUD GAME
// ========================

export const CloudGame = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Cloud Game$/)
    .click({ force: true });

  cy.wait(3500);

  cy.get('app-mass-mkt-product-offering-detail-tab app-mass-mkt-vr', { timeout: 10000 })
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('button .glyphicon-plus').first().parent().click();

      cy.contains('label', '*Content :')
        .closest('.col-md-12')
        .find('.mat-select-trigger')
        .click({ force: true });
    });

  cy.get('.cdk-overlay-container .mat-select-panel', { timeout: 10000 })
    .should('be.visible');

  cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const count = $options.length;
      const randomIndex = Math.floor(Math.random() * count);
      cy.wrap($options).eq(randomIndex).click({ force: true });
    });
  cy.wait(3000)
  cy.get('app-mass-mkt-product-offering-detail-tab app-mass-mkt-vr', { timeout: 10000 })
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('button.btn-primary').contains('Add').click({ force: true });
    });
};

// ========================
// ENTERTAINMENT PARTNERSHIP
// ========================

export const EntertainmentPartnership = (platforms: Array<'Arcade' | 'TV Plus' | 'Youtube Premium'>): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Entertainment Partnership$/)
    .click({ force: true });

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          platforms.forEach((platform) => {
            const targetPlatform = platform === 'Youtube Premium' ? 'Google' : platform;

            cy.get('button .glyphicon-plus').first().parent().click();

            const cpOptions = ['Apple', 'GOOGLE IRELAND LIMITED'];
            const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

            cy.contains('label', 'CP Name')
              .closest('.form-group')
              .find('select[formcontrolname="cpName"]')
              .select(randomCp);

            cy.wait(1500);

            cy.contains('label', 'Platform')
              .closest('.form-group')
              .find('select[formcontrolname="platform"]')
              .select(targetPlatform);

            cy.wait(1500);

            cy.contains('h3', 'Partner App ID')
              .closest('.panel')
              .within(() => {
                cy.get('button .glyphicon-plus').first().parent().click();

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should('be.visible')
                  .within(() => {
                    cy.get('input[formcontrolname="partnerPackageName"]').clear().type('test');

                    cy.get('select[formcontrolname="customerType"]')
                      .should('be.visible')
                      .find('option:not([disabled])')
                      .then(($options) => {
                        const options = $options.toArray() as HTMLOptionElement[];
                        const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                        if (!matched) {
                          throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                        }
                        cy.get('select[formcontrolname="customerType"]')
                          .select(matched.value.trim())
                          .should('have.value', matched.value.trim());
                        cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                      });
                    cy.wait(2000)
                    cy.contains('button', /^Add$/).should('be.visible').click();
                    cy.wait(2000)
                  });

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should(($panel) => {
                    const isHidden = $panel.attr('hidden') !== undefined ||
                      $panel.css('display') === 'none' ||
                      $panel.css('visibility') === 'hidden' ||
                      !$panel.is(':visible');
                    expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                  });
              });

            cy.wait(1500);

            cy.get('button')
              .filter(':visible')
              .contains(/^Add$/)
              .should('be.enabled')
              .click({ force: true });
          });
        });
    });
};
// ========================
// AI IP CAMERA
// ========================

export const AIIPCamera = (): void => {
  // 1. คลิก Tab AI IP Camera
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^AI IP Camera$/)
    .should('be.visible')
    .click({ force: true });

  // 2. กดปุ่ม Add ในหน้าหลัก
  cy.get('app-mass-mkt-ai-ip-camera .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  // 3. ดึงค่า Customer Type เพื่อคำนวณ Partner Type
  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      // ✅ 4. แก้ไขหลัก: เพิ่ม Scope + รอจน Angular Render Options เสร็จก่อนเข้า .then()
      cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
        .should('be.visible')
        .find('option')
        .should('have.length.gt', 1)
        .then(($options) => {
          const validOptions = ($options.toArray() as HTMLOptionElement[]).filter((opt) => {
            const val = opt.value?.trim();
            return !opt.disabled && val && val !== 'null' && val !== '';
          });

          if (validOptions.length === 0) {
            throw new Error('No valid options found in CP Name dropdown');
          }

          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const randomValue = validOptions[randomIndex].value;

          // ✅ Re-query after Angular re-render settles, THEN select
          cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
            .should('exist')
            .should('be.visible')
            .should('not.be.disabled')
            .select(randomValue)
            .should('have.value', randomValue);

          cy.log(`Selected CP Name: ${randomValue}`);
        });

      // 5. กดปุ่ม Add ใน Panel Partner App ID
      cy.contains('.panel-heading', 'Partner App ID')
        .closest('.panel')
        .within(() => {
          cy.get('.btn-xs .glyphicon-plus').last().should('be.visible').click();
        });

      // 6. กรอกข้อมูลใน Panel Partner App ID Detail
      cy.contains('.panel-heading', 'Partner App ID Detail')
        .closest('.panel')
        .should('be.visible')
        .within(() => {
          cy.get('select[formcontrolname="customerType"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
              if (!matched) {
                throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
              }
              cy.get('select[formcontrolname="customerType"]')
                .select(matched.value.trim())
                .should('have.value', matched.value.trim());
              cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
            });
          cy.wait(2000)
          // ✅ ลบ cy.wait(2000) ออก → .should('be.enabled') จะรอจนกว่า DOM และ JS พร้อม
          cy.contains('button', /^Add$/).should('be.enabled').click();
        });

      // 7. ตรวจสอบว่า Detail Panel ถูกซ่อนหลังกด Add
      cy.contains('.panel-heading', 'Partner App ID Detail')
        .closest('.panel')
        .should(($panel) => {
          const isHidden = $panel.attr('hidden') !== undefined ||
            $panel.css('display') === 'none' ||
            $panel.css('visibility') === 'hidden' ||
            !$panel.is(':visible');
          expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
        });
      cy.wait(2000)
      // 8. กดปุ่ม Add ที่ท้าย Form
      // ✅ ลบ cy.wait(2000) ออก → ใช้ Cypress Auto-waiting แทน
      cy.get('app-mass-mkt-ai-ip-camera')
        .within(() => {
          cy.get('.row.ng-star-inserted')
            .last()
            .within(() => {
              cy.contains('button', /^Add$/).should('be.enabled').click();
            });
        });
    });
};

// ========================
// KARAOKE
// ========================

export const Karaoke = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Karaoke$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          cy.get('select[formcontrolname="cpName"]')
            .should('be.visible')
            .select('Karaoke_Bundle_PLAYPremium')
            .should('have.value', 'Karaoke_Bundle_PLAYPremium');

          cy.log('Selected CP Name: Karaoke_Bundle_PLAYPremium');

          const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
          const isAISPlayBox = randomPlatform === '3: AIS Play Box';

          cy.get('select[formcontrolname="platform"]')
            .should('be.visible')
            .select(randomPlatform)
            .should('have.value', randomPlatform);

          cy.log(`Selected Platform: ${randomPlatform}`);

          cy.wait(1500);

          cy.contains('h3', 'Partner App ID')
            .closest('.panel')
            .within(() => {
              cy.get('button .glyphicon-plus').first().parent().click();

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should('be.visible')
                .within(() => {
                  cy.get('input[formcontrolname="partnerPackageName"]').should('be.visible').clear().type('test');

                  cy.get('select[formcontrolname="customerType"]')
                    .should('be.visible')
                    .find('option:not([disabled])')
                    .then(($options) => {
                      const options = $options.toArray() as HTMLOptionElement[];
                      const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                      if (!matched) {
                        throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                      }
                      cy.get('select[formcontrolname="customerType"]')
                        .select(matched.value.trim())
                        .should('have.value', matched.value.trim());
                      cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                    });
                  cy.wait(2000)
                  cy.contains('button', /^Add$/).should('be.visible').click();
                });

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should(($panel) => {
                  const isHidden = $panel.attr('hidden') !== undefined ||
                    $panel.css('display') === 'none' ||
                    $panel.css('visibility') === 'hidden' ||
                    !$panel.is(':visible');
                  expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                });
            });

          cy.wait(1500);

          if (isAISPlayBox) {
            cy.contains('h3', 'Vimmi Product')
              .closest('.panel')
              .within(() => {
                cy.get('button .glyphicon-plus').first().parent().click();

                cy.contains('h4', 'Vimmi Product Detail')
                  .closest('.panel')
                  .should('be.visible')
                  .within(() => {
                    cy.get('input[formcontrolname="vimmiProductNameText"]').should('be.visible').clear().type('test');

                    const random19Digits = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
                    cy.log(`Random Vimmi Product ID: ${random19Digits}`);

                    cy.get('input[formcontrolname="vimmiProductId"]').should('be.visible').clear().type(random19Digits);
                    cy.wait(2000)
                    cy.contains('button', /^Add$/).should('be.visible').click();
                  });
              });

            cy.wait(1500);
          }
          cy.wait(2000)
          cy.get('button')
            .filter(':visible')
            .contains(/^Add$/)
            .should('be.enabled')
            .click();
        });
    });
};

// ========================
// MUSIC STREAMING
// ========================

export const MusicStreaming = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Music Streaming$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          const cpOptions = ['GMM Plern', 'jooxvip', 'Apple'];
          const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

          cy.get('select[formcontrolname="cpName"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim().includes(randomCp));
              if (!matched) {
                throw new Error(`No option matched "${randomCp}" in CP Name dropdown`);
              }
              cy.get('select[formcontrolname="cpName"]').select(matched.value.trim()).should('have.value', matched.value.trim());
              cy.log(`Selected CP Name: ${matched.value.trim()}`);
            });

          cy.wait(1500);

          const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

          cy.get('select[formcontrolname="platform"]')
            .should('be.visible')
            .select(randomPlatform)
            .should('have.value', randomPlatform);

          cy.log(`Selected Platform: ${randomPlatform}`);

          cy.wait(1500);

          cy.contains('h3', 'Partner App ID')
            .closest('.panel')
            .within(() => {
              cy.get('button .glyphicon-plus').first().parent().click();

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should('be.visible')
                .within(() => {
                  cy.get('input[formcontrolname="partnerPackageName"]').should('be.visible').clear().type('test');

                  cy.get('select[formcontrolname="customerType"]')
                    .should('be.visible')
                    .find('option:not([disabled])')
                    .then(($options) => {
                      const options = $options.toArray() as HTMLOptionElement[];
                      const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                      if (!matched) {
                        throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                      }
                      cy.get('select[formcontrolname="customerType"]')
                        .select(matched.value.trim())
                        .should('have.value', matched.value.trim());
                      cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                    });

                  cy.contains('button', /^Add$/).should('be.visible').click();
                });

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should(($panel) => {
                  const isHidden = $panel.attr('hidden') !== undefined ||
                    $panel.css('display') === 'none' ||
                    $panel.css('visibility') === 'hidden' ||
                    !$panel.is(':visible');
                  expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                });
            });

          cy.wait(1500);

          cy.get('button')
            .filter(':visible')
            .contains(/^Add$/)
            .should('be.enabled')
            .click();
        });
    });
};

// ========================
// VRBT
// ========================

export const VRBT = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^VRBT$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-vrbt')
    .find('button.btn-primary')
    .find('.glyphicon-plus')
    .parent('button')
    .should('be.enabled')
    .click({ force: true });

  cy.wait(1500);

  cy.get('app-mass-mkt-vrbt', { timeout: 15000 })
    .should('be.visible')
    .within(() => {
      cy.get('.panel')
        .contains('h3', 'VRBT Detail')
        .closest('.panel')
        .should('not.have.attr', 'hidden')
        .within(() => {
          cy.get('select[formcontrolname="productName"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim() === 'Platform Calling VDO');
              if (!matched) {
                throw new Error('No option matched "Platform Calling VDO" in Product Name dropdown');
              }
              cy.get('select[formcontrolname="productName"]').select(matched.value.trim()).should('have.value', matched.value.trim());
              cy.log(`Selected Product Name: ${matched.value.trim()}`);
            });
          cy.wait(1500);

          cy.get('ng2-dual-list-box[formcontrolname="partnerSku"]')
            .within(() => {
              cy.get('select[formcontrolname="availableListBox"]')
                .find('option')
                .then(($options) => {
                  const options = $options.toArray() as HTMLOptionElement[];
                  if (options.length === 0) {
                    throw new Error('No available options in Partner SKU list');
                  }
                  const randomIndex = Math.floor(Math.random() * options.length);
                  const randomValue = options[randomIndex].value;
                  cy.log(`Selected Partner SKU: ${options[randomIndex].text.trim()}`);
                  cy.get('select[formcontrolname="availableListBox"]').select(randomValue);
                  cy.wait(600);
                  cy.get('button.str').click();
                });
            });
          cy.wait(2000)

          cy.contains('button', /^Add$/).should('be.visible').should('be.enabled').click();
        });
    });
};


const INTERNET_SPEEDS = [
  '4Gbps/4Gbps', '3Gbps/3Gbps', 'Max Speed (5G 2Gbps/2Gbps)',
  'Max Speed (5G Default 1Gbps/1Gbps)', '1000 Mbps', '450 Mbps',
  '300 Mbps', '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps',
  '40 Mbps', '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps',
  '12 Mbps', '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps',
  '6 Mbps', '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
  '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
  '10 Kbps', '0 Kbps'
] as const;

const THROTTLING_SPEEDS = [
  '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps', '40 Mbps',
  '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps', '12 Mbps',
  '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps', '6 Mbps',
  '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
  '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
  '10 Kbps', '0 Kbps'
] as const;

type InternetQuotaType =
  | 'Limited Data (Pay per use)'
  | 'Limited Data (Stop Net)'
  | 'Limited Data Only'
  | 'Pay per use only'
  | 'Unlimited Data (Fixed Speed)'
  | 'Unlimited Data (Throttling Speed)';

// ============ Core Utility Functions ============
const selectDropdownOption = <T extends string>(
  selector: string,
  options: readonly T[],
  config: {
    exact?: boolean;
    maxRetries?: number;
    skipFirst?: boolean;
    logPrefix?: string;
  } = {}
): void => {
  const { exact = true, maxRetries = 3, skipFirst = true, logPrefix = '' } = config;
  let attempts = 0;

  const attemptSelection = (): void => {
    cy.get(selector)
      .filter(':visible')
      .then($select => {
        const $options = $select.find('option:not([disabled])');
        const availableOptions = [...$options].filter((_, i) => !skipFirst || i > 0);

        const matchedOptions = availableOptions.filter(opt => {
          const text = (opt as HTMLOptionElement).text.trim();
          return exact
            ? options.includes(text as T)
            : options.some(allowed => text.toLowerCase().includes(allowed.toLowerCase()));
        });

        if (matchedOptions.length > 0) {
          const randomOpt = matchedOptions[Math.floor(Math.random() * matchedOptions.length)] as HTMLOptionElement;
          cy.wrap($select).select(randomOpt.value);
          cy.wait(1500);
          cy.log(`✅ ${logPrefix}Selected: ${randomOpt.text}`);
          return;
        }

        attempts++;
        if (attempts < maxRetries) {
          cy.log(`⚠️ ${logPrefix}No match, retry ${attempts}/${maxRetries}`);
          cy.wait(2000);
          attemptSelection();
          return;
        }

        // Fallback
        cy.log(`❌ ${logPrefix}Failed after ${maxRetries} attempts, using fallback`);
        if (availableOptions.length > 0) {
          const fallback = availableOptions[Math.floor(Math.random() * availableOptions.length)] as HTMLOptionElement;
          cy.wrap($select).select(fallback.value);
          cy.wait(1500);
          cy.log(`⚠️ ${logPrefix}Fallback: ${fallback.text}`);
        }
      });
  };

  attemptSelection();
};

const selectMatOption = (
  labelSelector: string,
  optionFilter?: (text: string) => boolean
): void => {
  cy.contains('label', labelSelector)
    .filter(':visible')
    .closest('.row')
    .find('mat-select .mat-select-trigger')
    .click({ force: true });

  cy.get('.cdk-overlay-pane mat-option', { timeout: 10000 })
    .should('be.visible')
    .then($options => {
      const targetOptions = optionFilter
        ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
        : $options;

      if (targetOptions.length > 0) {
        const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        cy.wrap(randomOpt).click({ force: true });
      } else if ($options.length > 0) {
        cy.wrap($options[0]).click({ force: true });
      } else {
        cy.get('.cdk-overlay-backdrop').click({ force: true });
      }
      cy.wait(1500);
    });
};

const selectMatOptionWithValidation = (
  labelSelector: string,
  optionFilter?: (text: string) => boolean
): void => {
  cy.contains('label', labelSelector)
    .closest('.row')
    .find('mat-select')
    .should('not.have.class', 'mat-select-disabled')
    .click();

  cy.get('.cdk-overlay-pane mat-option:not(.mat-option-disabled)', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then($options => {
      const targetOptions = optionFilter
        ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
        : $options;

      if (targetOptions.length > 0) {
        const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        cy.wrap(randomOpt).click({ force: true });
      } else {
        cy.wrap($options.first()).click({ force: true });
      }
    });

  cy.wait(1500);

  cy.contains('label', labelSelector)
    .closest('.row')
    .find('.mat-select-value-text, .mat-select-value')
    .should('not.contain', 'Please Select');
};

const isPreModule = (productClass: string, subModule?: string): boolean =>
  productClass === 'main' && subModule?.toLowerCase() === 'pre';

// ============ Internet Quota Type Handlers ============
const handleLimitedData = (productClass: string, subModule?: string) => {
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  if (productClass === 'main') {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handleLimitedDataOnly = (productClass: string, subModule?: string, Module?: string) => {
  cy.log(`🔵 Case: Limited Data Only | ProductClass: ${productClass} | subModule: ${subModule}| Module: ${Module}`);
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  if (isPreModule(productClass, subModule)) {
    cy.log('✅ Condition met → calling selectInternetExceedRate()');
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handlePayPerUse = () => {
  selectMatOptionWithValidation('*Internet Exceed Rate :');
};

const handleUnlimitedFixedSpeed = (productClass: string, subModule?: string) => {
  const checkboxSelector = '[formarrayname="internetQuotaNetworkCoverageCheckBox"]';

  cy.get(checkboxSelector)
    .filter(':visible')
    .then($container => {
      const $5gLabel = $container.find('label').filter((_, el) =>
        Cypress.$(el).text().trim().includes('5G')
      );

      if ($5gLabel.length > 0) {
        cy.wrap($5gLabel).click({ force: true });
        cy.wait(600);
      }

      const logPrefix = $5gLabel.length > 0 ? '[5G] ' : '[Non-5G] ';
      selectDropdownOption(
        'select[formcontrolname="fixedSpeedInternetSpeed"]',
        INTERNET_SPEEDS,
        { exact: false, logPrefix }
      );
    });

  if (isPreModule(productClass, subModule)) {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handleUnlimitedThrottling = (productClass: string, subModule?: string) => {
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  selectDropdownOption('select[formcontrolname="internetThrottlingSpeed"]', THROTTLING_SPEEDS, { exact: true, logPrefix: '[Throttling] ' });

  if (isPreModule(productClass, subModule)) {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

// ============ Main Export Function ============
export const InternetRandom = (ProductClass: string, subModule?: string, Module?: string) => {
  // Navigate and open form
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.scrollTo('bottom');
  cy.get('app-mass-mkt-internet button.btn-xs').find('.glyphicon-plus').filter(':visible').first().click();

  // สุ่มจากทุก options ที่มี
  const allowedOptions: InternetQuotaType[] = [
    'Limited Data (Pay per use)',
    'Limited Data (Stop Net)',
    'Limited Data Only',
    'Pay per use only',
    'Unlimited Data (Fixed Speed)',
    'Unlimited Data (Throttling Speed)'
  ];

  // Select quota type
  cy.get('app-mass-mkt-internet select[formcontrolname="InternetQuotaType"]')
    .filter(':visible')
    .last()
    .then($select => {
      cy.wrap($select).find('option').then($options => {
        const availableOptions = [...$options]
          .map(opt => (opt as HTMLOptionElement).text.trim())
          .filter(text => allowedOptions.includes(text as InternetQuotaType));

        if (availableOptions.length === 0) {
          cy.log('❌ No allowed quota types available');
          return;
        }

        const selectedType = availableOptions[Math.floor(Math.random() * availableOptions.length)] as InternetQuotaType;
        cy.wrap($select).select(selectedType);
        cy.wait(1500);
        cy.log(`📌 Selected Quota Type: ${selectedType}`);

        // Route to appropriate handler
        const handlers: Record<InternetQuotaType, () => void> = {
          'Limited Data (Pay per use)': () => handleLimitedData(ProductClass, subModule),
          'Limited Data (Stop Net)': () => handleLimitedData(ProductClass, subModule),
          'Limited Data Only': () => handleLimitedDataOnly(ProductClass, subModule, Module),
          'Pay per use only': handlePayPerUse,
          'Unlimited Data (Fixed Speed)': () => handleUnlimitedFixedSpeed(ProductClass, subModule),
          'Unlimited Data (Throttling Speed)': () => handleUnlimitedThrottling(ProductClass, subModule),
        };

        handlers[selectedType]?.();
      });
    });
  cy.wait(2000)
  // Submit form
  cy.get('app-mass-mkt-internet button.btn-primary')
    .filter(':visible')
    .each(($btn) => {
      const text = $btn.text().trim();
      if (text === 'Add') {
        cy.wrap($btn).scrollIntoView().click({ force: true });
      }
    });
};

// ========================
// CHECK AND FILL CONTENT TYPE 
// ========================
const COMPONENT = 'app-mass-enh-vertical-app';
function checkAndFillContentType(): void {
  cy.log('🚀 checkAndFillContentType started');

  // ✅ รวมทุก tab ที่ต้องการ
  const targetTabs: Array<{
    name: string;
    containerSelector: string;
    editButtonSelector: string;
    contentTypeSelector: string;
  }> = [
      {
        name: 'Karaoke',
        containerSelector: 'app-mass-enh-content-karaoke',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Music Streaming',
        containerSelector: 'app-mass-enh-content-music-streaming',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Entertainment Partnership',
        containerSelector: 'app-mass-enh-content-music-streaming',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Cloud Game',
        containerSelector: 'app-mass-enh-vr[title="Cloud Game"]',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentTypeValue"]'
      },
      {
        name: 'AI IP Camera',
        containerSelector: 'app-mass-enh-ai-ip-camera',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      }
    ];

  const processTab = (index: number) => {
    if (index >= targetTabs.length) {
      cy.log('🎉 All tabs processed');
      return;
    }

    const tabConfig = targetTabs[index];
    cy.log(`🔍 [${index + 1}/${targetTabs.length}] Looking for tab: "${tabConfig.name}"`);

    cy.get('body').then(($body) => {
      const $tab = $body.find('ul.nav.nav-tabs li a').filter((_i, el) => {
        return el.textContent?.trim() === tabConfig.name;
      });

      if (!$tab.length) {
        cy.log(`⚠️ Tab "${tabConfig.name}" not found, skipping to next tab...`);
        processTab(index + 1);
        return;
      }

      cy.log(`✅ Found tab: "${tabConfig.name}"`);

      cy.wrap($tab).click({ force: true });
      cy.wait(2000);
      cy.log(`✅ Clicked tab: ${tabConfig.name}`);

      // ✅ รอให้ container ของ tab นี้โหลด
      cy.get('body').then(($b) => {
        const $container = $b.find(tabConfig.containerSelector);

        if (!$container.length) {
          cy.log(`⚠️ Container "${tabConfig.containerSelector}" not found, skipping...`);
          processTab(index + 1);
          return;
        }

        cy.log(`✅ Container found: ${tabConfig.containerSelector}`);

        // ✅ หา Edit buttons เฉพาะภายใน container นี้
        const $editButtons = $container.find(tabConfig.editButtonSelector);
        cy.log(`📋 [${tabConfig.name}] Edit buttons found: ${$editButtons.length}`);

        if ($editButtons.length === 0) {
          cy.log(`⚠️ No Edit button found in ${tabConfig.name}, skipping...`);
          processTab(index + 1);
          return;
        }

        let currentEditIndex = 0;

        const processNextEditButton = () => {
          if (currentEditIndex >= $editButtons.length) {
            cy.log(`✅ [${tabConfig.name}] All ${$editButtons.length} Edit buttons processed`);
            processTab(index + 1);
            return;
          }

          cy.log(`📌 [${tabConfig.name}] Processing Edit button ${currentEditIndex + 1}/${$editButtons.length}`);

          // ✅ Requery container และ Edit button ใหม่
          cy.get('body').then(($b2) => {
            const $freshContainer = $b2.find(tabConfig.containerSelector);
            const $currentBtn = $freshContainer.find(tabConfig.editButtonSelector).eq(currentEditIndex);

            if (!$currentBtn.length) {
              cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} disappeared, skipping...`);
              currentEditIndex++;
              processNextEditButton();
              return;
            }

            const isHidden = Cypress.$($currentBtn).closest('[hidden]').length > 0;
            if (isHidden) {
              cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} is hidden, skipping...`);
              currentEditIndex++;
              processNextEditButton();
              return;
            }

            cy.wrap($currentBtn).click({ force: true });
            cy.wait(1500);
            cy.log(`✅ [${tabConfig.name}] Clicked Edit button #${currentEditIndex + 1}`);

            // ✅ หา Content Type select ใน container
            cy.get('body').then(($b3) => {
              const $freshContainer2 = $b3.find(tabConfig.containerSelector);
              const $allSelects = $freshContainer2.find(tabConfig.contentTypeSelector);
              const $visibleSelects = $allSelects.filter((_i, el) => {
                return Cypress.$(el).closest('[hidden]').length === 0;
              });

              cy.log(`📋 [${tabConfig.name}] Visible Content Type selects: ${$visibleSelects.length}`);

              if (!$visibleSelects.length) {
                cy.log(`⚠️ [${tabConfig.name}] No visible Content Type select found`);
                currentEditIndex++;
                processNextEditButton();
                return;
              }

              const $select = $visibleSelects.first();
              const select = $select[0] as unknown as HTMLSelectElement;
              const selectedValue: string = select.value || '';
              const isEmpty: boolean =
                !selectedValue ||
                selectedValue === 'null' ||
                selectedValue === '' ||
                selectedValue === '0: null' ||
                select.selectedIndex <= 0;

              cy.log(`[${tabConfig.name}] Content Type value: "${selectedValue}" | isEmpty: ${isEmpty}`);

              if (isEmpty) {
                const validOptions = Array.from(select.options || []).filter(
                  (opt: HTMLOptionElement) => opt && !opt.disabled && opt.value && opt.value !== 'null' && opt.value !== '0: null' && opt.value !== ''
                );

                cy.log(`📋 [${tabConfig.name}] Valid options: ${validOptions.length}`);

                if (validOptions.length === 0) {
                  cy.log(`⚠️ [${tabConfig.name}] No valid options to select`);
                  currentEditIndex++;
                  processNextEditButton();
                  return;
                }

                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];

                cy.wrap($select).select(randomOption.value, { force: true });
                cy.wait(600);
                cy.log(`✅ [${tabConfig.name}] Selected: "${randomOption.text?.trim() || 'Unknown'}"`);

                // ✅ หา Update button ใน container
                cy.get('body').then(($b4) => {
                  const $freshContainer3 = $b4.find(tabConfig.containerSelector);
                  const $updateBtn = $freshContainer3.find('button').filter((_i, btn) => {
                    return btn.textContent?.trim() === 'Update' &&
                      Cypress.$(btn).closest('[hidden]').length === 0;
                  });

                  cy.log(`📋 [${tabConfig.name}] Update button found: ${$updateBtn.length}`);

                  if ($updateBtn.length) {
                    cy.wrap($updateBtn.first()).click({ force: true });
                    cy.log(`✅ [${tabConfig.name}] Clicked Update button`);
                    cy.wait(3000);
                    currentEditIndex++;
                    processNextEditButton();
                  } else {
                    cy.log(`⚠️ [${tabConfig.name}] Update button not found`);
                    currentEditIndex++;
                    processNextEditButton();
                  }
                });
              } else {
                const currentText = select.options[select.selectedIndex]?.text?.trim() || 'Unknown';
                cy.log(`✅ [${tabConfig.name}] Content Type already has value: "${currentText}"`);
                currentEditIndex++;
                processNextEditButton();
              }
            });
          });
        };

        processNextEditButton();
      });
    });
  };

  processTab(0);
  cy.log('🎉 Done checking all tabs');
}
const INTERNET_COMPONENT = 'app-mass-enh-internet';

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_PRIORITY_QUOTA_TYPES = [
  'Limited Data (Pay per use)',
  'Limited Data (Stop Net)',
  'Limited Data Only',
  'Unlimited Data (Throttling Speed)',
  'Pay per use only',
  'Unlimited Data (Fixed Speed)',
];

const randomPriority = (): string => String(Math.floor(Math.random() * 99) + 1);

// ─── Helper: หา Internet Detail panel-body ───────────────────────────────────
const getInternetDetailPanelBody = ($component: JQuery): JQuery =>
  $component
    .find('.h3-panel-header, .panel-heading h3')
    .filter((_i, el) => el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail')
    .closest('.panel')
    .find('> .panel-body')
    .first();

// ─── Helper: fill input ถ้า visible และยังไม่มีค่า ───────────────────────────
const tryFillVisible = ($scope: JQuery, formControlName: string, label: string): void => {
  const $input = $scope.find(`input[formcontrolname="${formControlName}"]`).first();
  if (!$input.length) return;
  if (Cypress.$($input[0]).closest('[hidden]').length > 0) return;
  if (!Cypress.$($input[0]).is(':visible')) return;

  const existing = (($input.val() as string) || '').trim();
  if (existing !== '') {
    cy.log(`ℹ️ ${label} มีค่า "${existing}" — ใช้ค่าเดิม`);
    return;
  }
  cy.wrap($input)
    .focus().clear({ force: true }).type(randomPriority(), { force: true, delay: 50 }).blur();
  cy.wait(300);
  cy.log(`✅ กรอก ${label} สำเร็จ`);
};

// ─── updatePriorityInPanel ────────────────────────────────────────────────────
const updatePriorityInPanel = (): void => {

  // ── Step 1: fill outer-level visible fields ─────────────────────────────────
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) { cy.log('⚠️ ไม่พบ Internet Detail panel-body'); return; }

    tryFillVisible($pb, 'internetExceedRatePriority', 'Internet Exceed Rate Priority');
    tryFillVisible($pb, 'internetThrottlingSpeedPriority', 'Internet Throttling Speed Priority');
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // ── Step 2: คลิก inner Edit ใน sub-table ────────────────────────────────────
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $innerEditBtn = $pb
      .find('table')
      .filter((_i, el) => Cypress.$(el).is(':visible'))
      .find('tbody tr')
      .filter((_i, el) => {
        const $tr = Cypress.$(el);
        return $tr.is(':visible') && $tr.find('td[colspan]').length === 0;
      })
      .first()
      .find('button.btn-warning')
      .filter((_i, el) => Cypress.$(el).is(':visible'))
      .first();

    if ($innerEditBtn.length) {
      cy.wrap($innerEditBtn).scrollIntoView().click({ force: true });
      cy.log('✅ คลิก inner Edit (2nd Edit) — รอ sub-panel โผล่');
      cy.wait(500);
    } else {
      cy.log('ℹ️ ไม่มี inner sub-table row — ข้าม inner Edit');
    }
  });

  // ── Step 3: fill `priority` ใน sub-panel + คลิก inner Update ────────────────
  // `priority` อยู่ใน ng-star-inserted div ที่ render หลัง inner Edit เท่านั้น
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();

    if (
      $priorityInput.length &&
      Cypress.$($priorityInput[0]).closest('[hidden]').length === 0 &&
      Cypress.$($priorityInput[0]).is(':visible')
    ) {
      // fill priority
      const existing = (($priorityInput.val() as string) || '').trim();
      if (existing !== '') {
        cy.log(`ℹ️ priority มีค่า "${existing}" — ใช้ค่าเดิม`);
      } else {
        cy.wrap($priorityInput)
          .focus().clear({ force: true }).type(randomPriority(), { force: true, delay: 50 }).blur();
        cy.wait(300);
        cy.log('✅ กรอก priority (sub-panel) สำเร็จ');
      }

      // คลิก inner Update — หา btn-success ที่อยู่ใน panel-body เดียวกับ priority input
      // (ไม่ใช่ outer Update ของ Internet Detail)
      cy.then(() => {
        cy.get(INTERNET_COMPONENT).then(($comp2) => {
          const $pb2 = getInternetDetailPanelBody($comp2);
          const $pInput2 = $pb2.find('input[formcontrolname="priority"]').first();
          if (!$pInput2.length) return;

          // หา panel-body ที่ใกล้ที่สุดของ priority input (= sub-panel-body)
          const $subPanelBody = Cypress.$($pInput2[0]).closest('.panel-body');

          const $innerUpdateBtn = $subPanelBody
            .find('button')
            .toArray()
            .filter((el) =>
              /Update/i.test((el.textContent || '').trim()) &&
              Cypress.$(el).is(':visible')
            );

          if ($innerUpdateBtn.length) {
            cy.wrap($innerUpdateBtn[0]).scrollIntoView().click({ force: true });
            cy.log('✅ คลิก inner Update (sub-panel)');
            cy.wait(600);
          } else {
            cy.log('⚠️ ไม่พบ inner Update button');
          }
        });
      });
    } else {
      cy.log('ℹ️ priority input ไม่ visible — ข้าม sub-panel step');
    }
  });

  // ── Step 4: fill fixedSpeedPriority อีกครั้งถ้า revealed ────────────────────
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // ── Step 5: คลิก outer Update ───────────────────────────────────────────────
  // ต้องหา Update ที่อยู่ใน Internet Detail panel-body โดยตรง
  // ไม่ใช่ Update ที่อยู่ใน nested sub-panel
  // → เช็ค: $el.closest('.panel-body').is($pb[0])
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $outerUpdateBtn = $pb
      .find('button')
      .toArray()
      .filter((el) => {
        const $el = Cypress.$(el);
        return (
          /Update|Add/i.test((el.textContent || '').trim()) &&
          $el.is(':visible') &&
          // closest .panel-body ต้องเป็น Internet Detail panel-body ตัวเอง
          $el.closest('.panel-body').is($pb[0])
        );
      });

    if ($outerUpdateBtn.length) {
      cy.wrap($outerUpdateBtn[0]).scrollIntoView().click({ force: true });
      cy.log('✅ คลิก outer Update เรียบร้อย');
      cy.wait(800);
    } else {
      cy.log('⚠️ ไม่พบ outer Update button');
    }
  });
};

// ─── checkAndUpdatePriority ──────────────────────────────────────────────────
const checkAndUpdatePriority = (): void => {
  cy.log('🚀 checkAndUpdatePriority started');

  const safeClickCancel = (): void => {
    cy.get(INTERNET_COMPONENT).then(($comp) => {
      const $cancelBtns = $comp.find('button').toArray().filter((el) => {
        const text = (el.textContent || '').trim();
        return text === 'Cancel' && Cypress.$(el).is(':visible');
      });
      if ($cancelBtns.length > 0) {
        cy.wrap($cancelBtns[0]).scrollIntoView().click({ force: true });
        cy.log('✅ กด Cancel');
        cy.wait(400);
      } else {
        cy.log('ℹ️ ไม่พบปุ่ม Cancel ที่ visible — ข้าม');
      }
    });
  };

  const processRows = (rowIndex: number = 0): void => {
    cy.log(`🔄 กำลังตรวจสอบแถวที่ ${rowIndex + 1}...`);

    cy.get(INTERNET_COMPONENT)
      .find('table')
      .filter((_i, el) => {
        const $el = Cypress.$(el);
        return (
          $el.is(':visible') &&
          $el.find('thead th').toArray().some((th) => th.textContent?.trim() === 'Quota Type')
        );
      })
      .first()
      .should('be.visible')
      .find('tbody tr')
      .filter((_i, el) => {
        const text = Cypress.$(el).find('td').first().text().trim();
        return text.length > 0 && text !== 'No data to display.';
      })
      .then(($rows) => {
        const totalRows = $rows.length;
        cy.log(`📊 พบข้อมูลทั้งหมด ${totalRows} แถว`);

        if (rowIndex >= totalRows) {
          cy.log('✅ ทำครบทุกแถวแล้ว');
          return;
        }

        const $currentRow = $rows.eq(rowIndex);
        cy.wrap($currentRow).scrollIntoView();
        const quotaType = $currentRow.find('td').first().text().trim();

        if (!ALL_PRIORITY_QUOTA_TYPES.includes(quotaType)) {
          cy.log(`⏭️ ข้าม "${quotaType}" (ไม่มี priority field)`);
          processRows(rowIndex + 1);
          return;
        }

        cy.log(`📝 ประมวลผลแถวที่ ${rowIndex + 1}: "${quotaType}"`);

        const $editBtn = $currentRow
          .find('button.btn-warning')
          .filter((_i, el) => Cypress.$(el).is(':visible'))
          .first();

        if (!$editBtn.length) {
          cy.log(`⚠️ ไม่พบปุ่ม Edit แถวที่ ${rowIndex + 1} — ข้าม`);
          processRows(rowIndex + 1);
          return;
        }

        cy.wrap($editBtn).scrollIntoView().click({ force: true });

        // รอ Internet Detail panel-body visible
        cy.get(INTERNET_COMPONENT)
          .find('.h3-panel-header, .panel-heading h3')
          .filter((_i, el) => el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail')
          .closest('.panel')
          .find('> .panel-body')
          .should('be.visible', { timeout: 8000 })
          .then(() => {
            cy.log('✅ Internet Detail panel เปิดแล้ว → เรียก updatePriorityInPanel');
            updatePriorityInPanel();

            cy.then(() => {
              safeClickCancel();
              processRows(rowIndex + 1);
            });
          });
      });
  };

  cy.get('body').then(($body) => {
    const $internetTab = $body
      .find('.scrollmenu > .nav a, .scrollmenu > .nav li a')
      .filter((_i, el) => el.textContent?.trim() === 'Internet');

    if (!$internetTab.length) {
      cy.log('⚠️ Tab "Internet" not found — skipping');
      return;
    }

    cy.wrap($internetTab.first()).scrollIntoView().click({ force: true });
    cy.log('✅ กด Tab Internet');

    cy.get(`${INTERNET_COMPONENT} table thead th`)
      .contains('Quota Type')
      .should('be.visible', { timeout: 10000 });

    cy.wait(500);
    processRows(0);
  });
};
const performSimpleClaimAndApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction): void => {
  loginAndWaitReady(user, pass);
  const projectNamePONAME: string = getStandardProjectName();
  cy.log('Project Name: ' + projectNamePONAME);
  ClaimProject(projectNamePONAME);
  cy.wait(1500);
  approveFunction(projectNamePONAME);
};

const checkAndUpdateVerticalAppPriority = (): void => {
  cy.log('🚀 checkAndUpdateVerticalAppPriority started');

  const fillIfEmpty = (
    $input: JQuery<HTMLElement>,
    label: string,
    onFilled: () => void,
    onSkip: () => void
  ): void => {
    cy.wrap($input).invoke('val').then((val) => {
      const isEmpty = !val || String(val).trim() === '';

      if (isEmpty) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        cy.wrap($input)
          .scrollIntoView()
          .focus()
          .clear()
          .type(randomNum.toString(), { delay: 150 })
          .blur();
        cy.log(`✅ ใส่ค่า ${label}: ${randomNum}`);
        cy.wait(2000);
        onFilled();
      } else {
        cy.log(`ℹ️ ${label} มีค่าอยู่แล้ว: "${val}" — ข้าม`);
        onSkip();
      }
    });
  };

  const clickUpdateIfVisible = (afterUpdate: () => void): void => {
    cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
      const $updateBtn = $panelBody.find('button.btn-success').filter((_i, btn) => {
        return (
          btn.textContent?.trim() === 'Update' &&
          Cypress.$(btn).closest('[hidden]').length === 0
        );
      });

      if ($updateBtn.length) {
        cy.wrap($updateBtn.first()).click({ force: true });
        cy.log('✅ คลิก Update');
        cy.wait(3000);
      } else {
        cy.log('⚠️ ไม่พบ Update button');
      }

      afterUpdate();
    });
  };

  const clickCancel = (afterCancel: () => void): void => {
    cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
      const $cancelBtn = $panelBody.find('button').filter((_i, btn) => {
        return (
          btn.textContent?.trim() === 'Cancel' &&
          Cypress.$(btn).closest('[hidden]').length === 0
        );
      });

      if ($cancelBtn.length) {
        cy.wrap($cancelBtn.first()).click({ force: true });
        cy.log('✅ คลิก Cancel');
        cy.wait(1000);
      } else {
        cy.log('⚠️ ไม่พบ Cancel button');
      }

      afterCancel();
    });
  };

  const processRows = (rowIndex: number): void => {
    cy.get('body').then(($b) => {
      const $rows = $b.find(`${COMPONENT} table > tbody > tr`).filter((_i, tr) => {
        const text = Cypress.$(tr).find('td:first').text().trim();
        return text !== '' && !text.includes('No data to display');
      });

      if (rowIndex >= $rows.length) {
        cy.log(`✅ ทำครบทุกแถวแล้ว (${$rows.length} แถว)`);
        return;
      }

      cy.log(`📝 กำลังทำแถวที่ ${rowIndex + 1}/${$rows.length}`);

      const $currentRow = $rows.eq(rowIndex);
      const $editBtn = $currentRow.find('button.btn-warning[title="Edit"]').first();

      if (!$editBtn.length) {
        cy.log(`⚠️ ไม่พบ Edit button ในแถวที่ ${rowIndex + 1} — ข้าม`);
        processRows(rowIndex + 1);
        return;
      }

      const isHidden = Cypress.$($editBtn).closest('[hidden]').length > 0;
      if (isHidden) {
        cy.log(`⚠️ Edit button ในแถวที่ ${rowIndex + 1} ถูกซ่อนอยู่ — ข้าม`);
        processRows(rowIndex + 1);
        return;
      }

      cy.wrap($editBtn).click({ force: true });
      cy.wait(1500);
      cy.log(`✅ คลิก Edit button แถวที่ ${rowIndex + 1}`);

      cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
        const $priorityInput = $panelBody
          .find('input[formcontrolname="priority"]')
          .filter((_i, el) => {
            return (
              Cypress.$(el).closest('[hidden]').length === 0 &&
              Cypress.$(el).is(':visible')
            );
          });

        const $throttlingInput = $panelBody
          .find('input[formcontrolname="throttlingSpeedPriority"]')
          .filter((_i, el) => {
            return (
              Cypress.$(el).closest('[hidden]').length === 0 &&
              Cypress.$(el).is(':visible')
            );
          });

        cy.log(
          `📋 Priority: ${$priorityInput.length} | ThrottlingSpeedPriority: ${$throttlingInput.length}`
        );

        if (!$priorityInput.length && !$throttlingInput.length) {
          cy.log('⚠️ ไม่พบ input ใดๆ ที่มองเห็นได้ — ข้ามแถวนี้');
          processRows(rowIndex + 1);
          return;
        }

        let needsUpdate = false;

        const finishRow = (): void => {
          if (needsUpdate) {
            clickUpdateIfVisible(() => processRows(rowIndex + 1));
          } else {
            cy.log(`ℹ️ ไม่มีการเปลี่ยนแปลง — กด Cancel`);
            clickCancel(() => processRows(rowIndex + 1));
          }
        };

        const checkThrottlingThenFinish = (): void => {
          if ($throttlingInput.length) {
            fillIfEmpty(
              $throttlingInput.first(),
              'Throttling Speed Priority',
              () => {
                needsUpdate = true;
                finishRow();
              },
              () => finishRow()
            );
          } else {
            cy.log('ℹ️ ไม่มี Throttling Speed Priority — ข้าม');
            finishRow();
          }
        };

        if ($priorityInput.length) {
          fillIfEmpty(
            $priorityInput.first(),
            'Priority',
            () => {
              needsUpdate = true;
              checkThrottlingThenFinish();
            },
            () => checkThrottlingThenFinish()
          );
        } else {
          cy.log('ℹ️ ไม่มี Priority — ข้ามไปเช็ค Throttling');
          checkThrottlingThenFinish();
        }
      });
    });
  };

  // ── Tab check ─────────────────────────────────────────────────────────────
  cy.get('body').then(($body) => {
    const normalizeText = (text: string | null | undefined): string =>
      (text ?? '').replace(/\s+/g, ' ').trim();

    // ✅ ลบ '.scrollmenu > .nav li a' ออก — ซ้ำซ้อนกับ '.scrollmenu > .nav a'
    //    และเป็นต้นเหตุของ 2-element bug
    const $allLinks = $body.find(
      'ul.nav.nav-tabs li a, .scrollmenu > .nav a'
    );

    // 🔍 Debug: log ทุก tab ที่เจอ (ลบออกได้หลัง confirm)
    $allLinks.each((_i, el) => {
      cy.log(`🔍 tab: "${normalizeText(el.textContent)}"`);
    });

    const $tab = $allLinks.filter(
      (_i, el) => normalizeText(el.textContent) === 'Vertical App'
    );

    if (!$tab.length) {
      cy.log('⚠️ Tab "Vertical App" not found — skipping');
      return;
    }

    // ✅ ดึง element แรกออกมาก่อน wrap เพื่อการันตี 1 element เสมอ
    const $target = $tab.first();
    cy.log(`✅ Found tab: "Vertical App" (${$target.length} element)`);
    cy.wrap($target).scrollIntoView().click({ force: true });
    cy.wait(1500);

    cy.get('body').then(($b) => {
      const $rows = $b.find(`${COMPONENT} table > tbody > tr`);

      if (!$rows.length) {
        cy.log(`⚠️ ไม่พบแถวใน ${COMPONENT} — skipping`);
        return;
      }

      cy.log(`✅ พบ ${$rows.length} แถว — เริ่ม processRows`);
      processRows(0);
      cy.log('🎉 checkAndUpdateVerticalAppPriority เสร็จสิ้น');
    });
  });
};
// ========================
// PROJECT BASIC INFORMATION HELPERS
// ========================

const generateProjectNames = (
  prefix: string,
  Module: Module,
  subModule: string | undefined,
  PriceType: string,
  ProductClass?: string,
  PoSubGroup?: string,
  Plugin?: string
): { projectName: string; poName: string; prefixName: string } => {
  const timeSuffix = getTimeSuffix();
  const pluginSuffix = Plugin ? ` ${Plugin}` : '';

  let prefixName: string;
  if (PoSubGroup) {
    // For OtherPOSub
    if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
      prefixName = `MOB ${Module} ${PriceType} ${PoSubGroup}`;
    } else {
      prefixName = `MOB ${Module} ${PoSubGroup}`;
    }
  } else {
    // For standard ProjectBasicInformationComplete
    const ModulePart = (Module === 'ENTER' || Module === 'MUSIC') ? `${prefix} ${subModule}` : `${prefix} ${Module}`;
    prefixName = `${ModulePart} ${PriceType} ${ProductClass}${pluginSuffix}`;
  }

  const projectName = getTruncatedName(prefixName, timeSuffix, 40);
  const poName = getTruncatedName(prefixName, timeSuffix, 37);

  return { projectName, poName, prefixName };
};

const createProjectBase = (
  credentials: { user: string; pass: string },
  projectName: string,
  Module: Module,
  subModule?: string
): void => {
  login(credentials.user, credentials.pass);
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  cy.get('input[formcontrolname="projectName"]', { timeout: 10000 })
    .should('be.visible')
    .should('not.be.disabled')
    .click()
    .type(projectName);

  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/edsOfferingController/getExistPackage/**').as('getExistPackage');

  cy.get('input[aria-label="Date input field"]').click().type(formattedDateString);
  cy.wait(1500);

  if (Module === 'ENTER' || Module === 'MUSIC') {
    if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
    const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
    cy.get('select[formcontrolname="customerType"]').select(customerType);
  }

  cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
  RandomProjectDescription(projectName, subModule, Module);

  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getExistPackage', { timeout: 30000 });

  cy.get('.modal-body > :nth-child(1) > div > .btn', { timeout: 15000 })
    .should('be.visible')
    .click({ force: true });

  cy.get('modal-container').should('not.exist');
};
const createPOBase = (
  poName: string,
  promotionSubGroupValue: string
): void => {
cy.contains('li.sidebar-brand', 'List of Product Offering:')
    .find('button.btn')
    .first()
    .should('be.visible')
    .click();

  cy.get('input[formcontrolname="productName"]').type(poName);
  cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(promotionSubGroupValue);

  // 🔹 Narrow intercept to the actual creation endpoint (improves reliability)
  cy.intercept('POST', '**/plm-po/addUpdate/**').as('createPO');
  cy.contains('button', 'Create').should('be.visible').click();
  cy.wait('@createPO').its('response.statusCode').should('eq', 200);

  cy.intercept('GET', '**/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 300000 });

  cy.location('hash').should('include', '/project-home/mass-mkt/mass-mkt-product-offering');

  cy.get('select[formcontrolname="priceType"]').should('be.visible');
};

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;


const cleanEnglishText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^\x00-\x7F\s]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ===== HELPER: Clean text for Thai fields =====
const cleanThaiText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ===== HELPER: Limit string length =====
const limit = (str: string, maxLen: number): string => {
  if (!str) return '';
  let result = str.length > maxLen ? str.substring(0, maxLen) : str;
  result = result.trimEnd();
  if (result.length === maxLen && !result.endsWith(' ') && result.includes(' ')) {
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > maxLen * 0.7) {
      result = result.substring(0, lastSpace);
    }
  }
  return result;
};
const selectMultipleFromDualList = (controlName: string, maxSelections: number): void => {
  cy.get(`select[formcontrolname="${controlName}"]`).then(($select) => {
    const optionCount = $select.find('option').length;
    const actualMax = Math.min(maxSelections, optionCount);
    const numberOfSelections = Math.floor(Math.random() * actualMax) + 1;

    const selectedIndices = new Set<number>();
    while (selectedIndices.size < numberOfSelections) {
      selectedIndices.add(Math.floor(Math.random() * optionCount));
    }

    selectedIndices.forEach((index: number) => {
      cy.get(`select[formcontrolname="${controlName}"] option`)
        .eq(index)
        .dblclick({ force: true });
    });
  });
};

// ===== HELPER: Limit and clean EN =====
const limitAndCleanEN = (str: string, maxLen: number): string => {
  return limit(cleanEnglishText(str), maxLen);
};

// ===== HELPER: Limit and clean TH =====
const limitAndCleanTH = (str: string, maxLen: number): string => {
  return limit(cleanThaiText(str), maxLen);
};

// ====================================================================
// WORDING POOLS สำหรับ PO Fields
// ====================================================================

const fillServicePOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
  const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;
  const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

  cy.get('select[formcontrolname="promotionLevel"]')
    .select(randomPromotion)
    .should('have.value', randomPromotion);

  const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
  const pOName = poName || 'ServicePO';

  const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

  // Wording In Statement
  cy.get('textarea[formcontrolname="wordingInStatementEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
  cy.get('textarea[formcontrolname="wordingInStatementTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

  // SMS Greeting
  const smsFlags = ['Send', "Don't Send"];
  const randomSmsFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
  cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(randomSmsFlag);

  if (randomSmsFlag === 'Send') {
    cy.get('textarea[formcontrolname="smsGreetingEn"]')
      .clear().type(limitAndCleanEN(pickRandom(pools.smsGreeting.EN), 400));
    cy.get('textarea[formcontrolname="smsGreetingTh"]')
      .clear().type(limitAndCleanTH(pickRandom(pools.smsGreeting.TH), 400));
  }

  // SMS Delete
  const randomDeleteFlag = smsFlags[Math.floor(Math.random() * smsFlags.length)];
  cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(randomDeleteFlag);

  if (randomDeleteFlag === 'Send') {
    cy.get('textarea[formcontrolname="smsDeleteEn"]')
      .clear().type(limitAndCleanEN(pickRandom(pools.smsDelete.EN), 250));
    cy.get('textarea[formcontrolname="smsDeleteTh"]')
      .clear().type(limitAndCleanTH(pickRandom(pools.smsDelete.TH), 250));
  }

  // Description
  cy.get('textarea[formcontrolname="descriptionEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
  cy.get('textarea[formcontrolname="descriptionTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

  cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');

  selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

  // Other Condition
  const conditionCount = Math.floor(Math.random() * 5) + 2;
  const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
  cy.get('textarea[formcontrolname="otherCondition"]')
    .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

  // Memo Description
  cy.get('textarea[formcontrolname="memoDescription"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackPOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
  const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
  const pOName = poName || 'CashBackPO';

  const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

  // Short Promotion Name
  cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.shortPromotionName.EN), 100));
  cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.shortPromotionName.TH), 100));

  // Promotion Description
  cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.promotionDescription.EN), 500));
  cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.promotionDescription.TH), 500));

  // Greeting Letter
  cy.get('textarea[formcontrolname="greetingLetterEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.greetingLetter.EN), 500));
  cy.get('textarea[formcontrolname="greetingLetterTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.greetingLetter.TH), 500));

  // Your Package Name
  cy.get('textarea[formcontrolname="yourPackageNameEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.yourPackageName.EN), 100));
  cy.get('textarea[formcontrolname="yourPackageNameTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.yourPackageName.TH), 100));

  selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);
};

const fillStandardPOFields = (Module: Module, PriceType: string, projectName?: string, poName?: string, subModule?: string): void => {
  const productTypes = ['FBB', 'Fixline', 'Mobile', 'Non Mobile'] as const;
  const randomValue = productTypes[Math.floor(Math.random() * productTypes.length)];
  cy.get('select[formcontrolname="productType"]').select(randomValue).should('have.value', randomValue);

  const pName = projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`;
  const pOName = poName || 'StandardPO';

  const pools = createPOWordingPools(pName, pOName, Module, PriceType, subModule);

  // Wording In Statement
  cy.get('textarea[formcontrolname="wordingInStatementEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.wordingInStatement.EN), 250));
  cy.get('textarea[formcontrolname="wordingInStatementTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.wordingInStatement.TH), 250));

  // Description
  cy.get('textarea[formcontrolname="descriptionEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.description.EN), 500));
  cy.get('textarea[formcontrolname="descriptionTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.description.TH), 500));

  cy.get('input[formcontrolname="discountRevenueCode"]').clear().type('APCP-009');
  selectMultipleFromDualList('availableListBox', Math.floor(Math.random() * 3) + 1);

  // Other Condition
  const conditionCount = Math.floor(Math.random() * 5) + 2;
  const selectedConditions = pickMultiple(pools.otherCondition.EN, conditionCount);
  cy.get('textarea[formcontrolname="otherCondition"]')
    .clear().type(limitAndCleanEN(selectedConditions.join(' '), 1000));

  // Memo Description
  cy.get('textarea[formcontrolname="memoDescription"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

const fillCashBackDiscountConfig = (Module: Module, PriceType: string, projectName?: string, poName?: string): void => {
  const pName = projectName || `${Module} ${PriceType}${day}${month}${hours}${minutes}`;
  const pOName = poName || 'CashBackDiscount';

  const pools = createPOWordingPools(pName, pOName, Module, PriceType);

  // Duration
  const durationOptions = [1, 3, 6, 12, 24, 36];
  const randomDuration = durationOptions[Math.floor(Math.random() * durationOptions.length)];
  cy.get('input[formcontrolname="duration"]').clear().type(randomDuration.toString());
  cy.get('button[class*="btn-primary"][type="button"]').first().click();

  // Duration From
  const durationFromOptions = [0, 1, 2, 3];
  const randomDurationFrom = durationFromOptions[Math.floor(Math.random() * durationFromOptions.length)];
  cy.get('input[formcontrolname="durationFrom"]').clear().type(randomDurationFrom.toString());

  // Discount Type
  cy.get('select[formcontrolname="discountType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      if ($options.length > 0) {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.get('select[formcontrolname="discountType"]').select(($options[randomIndex] as HTMLOptionElement).value);
      }
    });

  // Discount Name
  cy.get('textarea[formcontrolname="discountNameEn"]')
    .clear().type(limitAndCleanEN(pickRandom(pools.discountName.EN), 100));
  cy.get('textarea[formcontrolname="discountNameTh"]')
    .clear().type(limitAndCleanTH(pickRandom(pools.discountName.TH), 100));

  const randomIndex = Math.floor(Math.random() * 2);
  cy.get('input[formcontrolname="marginalDiscount"]').eq(randomIndex).check({ force: true });
  cy.get('button[class*="btn-primary"][type="button"]').eq(1).click();
  cy.get('input[formcontrolname="prorate"]').eq(randomIndex).check({ force: true });

  const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

  if (randomIndex === 0) {
    const cashbackTypes = Math.floor(Math.random() * 2);

    if (cashbackTypes === 0) {
      cy.get('input[formcontrolname="cashBackType"]').first().check({ force: true });
      const totalUsage = getRandomNumber(1000, 5000);
      const cashBackExc = getRandomNumber(50, 500);
      cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(totalUsage.toString());
      cy.get('input[formcontrolname="cashBackExcVat"]').clear().type(cashBackExc.toString());
      cy.get('input[formcontrolname="cashBackIncVat"]').clear().type(Math.round(cashBackExc * 1.07).toString());
    } else {
      cy.get('input[formcontrolname="cashBackType"]').last().check({ force: true });
      cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(getRandomNumber(1000, 5000).toString());
      cy.get('input[formcontrolname="cashBackPercent"]').clear().type(getRandomNumber(1, 20).toString());
    }
  } else {
    cy.get('input[formcontrolname="cashBackType"]').last().check({ force: true });
    cy.get('input[formcontrolname="totalUsageFromExcVat"]').clear().type(getRandomNumber(1000, 5000).toString());
    cy.get('input[formcontrolname="cashBackPercent"]').clear().type(getRandomNumber(1, 20).toString());
  }
  cy.wait(2000)
  cy.get('button.btn.btn-primary').contains('Add').click();
  cy.wait(2000);
  cy.get('button.btn.btn-primary').contains('Add').click();
};

const setPriceVAT = (): void => {
  const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
  const randomCharge = getRandomCharge();
  const priceIncludingVAT = (parseFloat(randomCharge) * 1.07).toFixed(2);

  cy.get('input[formcontrolname="priceExcludingVAT"]').clear().type(randomCharge);
  cy.get('input[formcontrolname="priceIncludingVAT"]').clear().type(priceIncludingVAT);
};

export const ProjectBasicInformationComplete = (
  PriceType: PriceType,
  ProductClass: ProductClass,
  options: ProjectBasicOptions
): void => {
  const { ProductClass1, Module, subModule, autoSetDuration = false, Plugin } = options;
  const credentials = getCredentials(Module);
  const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

  // ✅ 1. สร้างชื่อ Project & PO ครั้งเดียว
  const { projectName, poName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

  // ✅ 2. สร้าง Project Base (1 ครั้ง)
  createProjectBase(credentials, projectName, Module, subModule);

  const envKey = ProductClass1 === 'Main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);

  registerProjectName(projectName, ProductClass1 === 'Main' ? 0 : 1);

  const poCount = Math.floor(Math.random() * 2) + 1; // สุ่ม 1-4 PO
  const poEnvKey = ProductClass1 === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  const poNames: string[] = [];

  cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

  for (let i = 0; i < poCount; i++) {
    const currentPoName = i === 0 ? poName : `${poName}_PO${i + 1}`;
    poNames.push(currentPoName);
    cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

    // 🔹 สร้าง PO ใหม่
    createPOBase(currentPoName, 'Product Offering');

    // 🔹 กรอกฟอร์ม PO (เริ่มตั้งแต่เลือก PriceType ถึง smsWording)
    const priceTypeMap: Record<PriceType, string> = { onetime: '1: One-Time', recurring: '2: Recurring', usage: '3: Usage' };
    cy.get('select[formcontrolname="priceType"]').should('be.visible').and('not.be.disabled').select(priceTypeMap[PriceType]);

    const productClassMapMobile: Record<ProductClass, string> = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
    const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };
    const productValue = (Module === 'ENTER' || Module === 'MUSIC')
      ? productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra']
      : productClassMapMobile[ProductClass];

    cy.get('select[formcontrolname="productClass"]').should('be.visible').and('not.be.disabled').select(productValue);

    if (ProductClass === 'main') {
      const defaultItems = ['Internet', 'MMS', 'SMS', 'Voice'];
      const retrySelectProductClass = (attemptsLeft: number) => {
        cy.contains('.panel-heading', '*Product Specification').scrollIntoView().closest('.panel').within(() => {
          cy.get('select[formcontrolname="selectedListBox"]').then($select => {
            const selected = [...$select.find('option')].map(el => el.textContent?.trim() || '');
            const hasAllDefaults = defaultItems.every(d => selected.includes(d));
            cy.wrap(hasAllDefaults).as('defaultsReady');
          });
        });

        cy.get('@defaultsReady').then(hasAllDefaults => {
          if (hasAllDefaults) {
            cy.log(`✅ default items confirmed`);
          } else if (attemptsLeft > 0) {
            cy.log(`⚠️ default items missing (${attemptsLeft} retries left)`);
            cy.get('select[formcontrolname="productClass"]').select(productClassMapMobile['ontop']);
            cy.wait(500);
            cy.get('select[formcontrolname="productClass"]').select(productValue);
            cy.wait(500);
            cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType]);
            cy.wait(800);
            retrySelectProductClass(attemptsLeft - 1);
          } else {
            cy.log(`❌ default items still missing after retries`);
          }
        });
      };
      cy.wait(800);
      retrySelectProductClass(3);
    }

    if (autoSetDuration) {
      const randomMonth = Math.floor(Math.random() * 59) + 2;
      cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());
      cy.get('select[formcontrolname="packageDurationUnit"] option:not([disabled])').should('have.length.greaterThan', 0).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.get('select[formcontrolname="packageDurationUnit"]').select(($options[randomIndex] as HTMLOptionElement).value);
      });
      cy.get('.col-md-8 > .btn').click();
    }

    if (subModule === 'PRE') {
      const randomBillCycle = Math.floor(Math.random() * 60) + 1;
      cy.get('input[formcontrolname="packageBillCycle"]').should('be.visible').clear().type(randomBillCycle.toString());
      cy.get('select[formcontrolname="packageBillCycleUnit"] option:not([disabled])').should('have.length.greaterThan', 0).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.get('select[formcontrolname="packageBillCycleUnit"]').select(($options[randomIndex] as HTMLOptionElement).value);
      });
    }

    PriceExcluding();
    selectTargetGroup('random');
    dropdownPromotionGroup();
    RandomProductSpecification(ProductClass, subModule, Module);

    if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
      cy.get('input[formcontrolname="allowMvpn"]').should('exist').then(($radios) => {
        cy.wrap($radios).eq(Math.floor(Math.random() * $radios.length)).check();
      });
    }

    targetgroup();
    RandomRemark(projectName, currentPoName, PriceType, ProductClass, subModule);

    if ((Module !== 'POST') && subModule === 'PRE' && PriceType === 'recurring') {
      RetryPattern();
    }

    if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
      CopyDeductFail();
    }

    smsWording();
    // 🔚 จบการกรอกฟอร์มสำหรับ PO นี้

    // ⬅️ ถ้ายังไม่ใช่ PO สุดท้าย ให้กลับไปหน้าเดิมเพื่อเตรียมสร้างตัวถัดไป
    if (i < poCount - 1) {
      cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
      backBacicInfo(); // กลับไปหน้าเตรียมสร้าง
      cy.wait(1500);   // รอ UI โหลดเสถียรก่อนเริ่มรอบใหม่
    }
  }

  // ==================== 🏁 ขั้นตอนสุดท้าย (ทำ 1 ครั้ง) ====================
  Cypress.env(poEnvKey, poNames[0]);
  Cypress.env('allPoNames', poNames);
  Cypress.env('poCount', poCount);

  cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);
  backBacicInfo();
  addFile();
  // =======================================================================
};
// ========================
// PROJECT BASIC INFORMATION OTHER PO SUB (REFACTORED)
// ========================

export const ProjectBasicInformationCompleteOtherPOSub = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  PoSubGroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
  Module: 'POST' | 'PRE'
): void => {
  const credentials = getCredentials(Module);
  const { projectName, poName } = generateProjectNames('MOB', Module, undefined, PriceType, undefined, PoSubGroup);

  // Create Project
  login(credentials.user, credentials.pass);
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  cy.get('input[formcontrolname="projectName"]').type(projectName);
  Cypress.env('projectName', projectName);

  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.get('input[aria-label="Date input field"]').type(formattedDate);
  cy.wait(1500);
  cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
  RandomProjectDescription(projectName, Module);
  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(8000);
  cy.get('.modal-body > :nth-child(1) > div > .btn').click({ force: true });

  // Create PO
  cy.get(':nth-child(4) > .btn').click({ force: true });
  cy.get('input[formcontrolname="productName"]').type(poName);
  Cypress.env('poName', poName);

  const subGroupMap: Record<string, string> = {
    AccountFee: 'Account Fee', OrderFee: 'Order Fee', CashBack: 'Cash Back',
    Service: 'Service', GroupPoFee: 'Group PO Fee'
  };
  cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(subGroupMap[PoSubGroup]);

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.contains('button', 'Create', { timeout: 10000 }).click();
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(15000);

  // Configure PO based on type
  if (Module === 'PRE' && (PoSubGroup === 'OrderFee' || PoSubGroup === 'Service')) {
    const priceTypeMap: Record<string, string> = { onetime: 'One-Time', recurring: 'Recurring', usage: 'Usage' };
    cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType]);
  }

  if (Module === 'POST' && PoSubGroup === 'CashBack') {
    fillCashBackDiscountConfig(Module, PriceType);
  }

  if (!(Module === 'POST' && PoSubGroup === 'CashBack')) {
    setPriceVAT();
  }

  // Fill type-specific fields
  const fieldFillers: Record<string, () => void> = {
    Service: () => fillServicePOFields(Module, PriceType),
    CashBack: () => fillCashBackPOFields(Module, PriceType),
  };

  if (fieldFillers[PoSubGroup]) {
    fieldFillers[PoSubGroup]();
  } else if (PoSubGroup !== 'CashBack' || Module !== 'POST') {
    fillStandardPOFields(Module, PriceType);
  }
};
// ========================
// BEFORE APPROVE MKT
// ========================

export const beforeapproveMKT = (): void => {

  const poName = `PO-${Math.floor(Math.random() * 900 + 100)}`;
  const projectName = `Project-${['A', 'B', 'Test', 'Demo'][Math.floor(Math.random() * 4)]}`;
  const useThai = Math.random() < 0.5;

  const casualEN = [
    'file for {po}', '{project} doc', 'attachment for {po}',
    'contract draft for {po} (pls check)',
    'updated specs for {project} - v2',
  ];
  const casualTH = [
    'ไฟล์สำหรับ {po}', 'เอกสาร {project}',
    'ร่างสัญญา {po} (ช่วยดู)',
    'สเปคอัปเดต {project} - v2',
    'สำรองไว้ก่อน',
  ];

  let descTemplate = useThai
    ? casualEN[Math.floor(Math.random() * casualEN.length)]
    : casualTH[Math.floor(Math.random() * casualTH.length)];

  let attachmentDesc = descTemplate.replace('{po}', poName).replace('{project}', projectName);
  if (Math.random() < 0.3) attachmentDesc += ' (draft)';
  if (Math.random() < 0.2) attachmentDesc += ' - updated';

  const MAX_LEN = 120;
  if (attachmentDesc.length > MAX_LEN) attachmentDesc = attachmentDesc.substring(0, MAX_LEN - 3) + '...';

  cy.log(`📎 Attachment Description: ${attachmentDesc}`);
  cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
    .should('be.visible')
    .focus()
    .type(attachmentDesc, { delay: 50 });

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get(':nth-child(3) > :nth-child(1) > .btn').click();
  cy.contains('.row', 'Approve memo')
    .find('input[type="checkbox"]')
    .check({ force: true });

  cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');
  cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
    .contains('Submit')
    .click();

  cy.wait('@postRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@submitApprove', { timeout: 180000 }).its('response.statusCode').should('eq', 200);

  // ===== 🔄 3. NAVIGATION & PROJECT WORKFLOW =====
  cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

  // cy.wait(7000); // ⚠️ Hard wait ไม่แนะนำ ใช้ cy.get('...').should('exist') แทนถ้าเป็นไปได้
  const finalProjectName = getStandardProjectName();
  cy.log(`✅ Project ใช้สำหรับ Claim: ${finalProjectName}`);

  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  // ===== 📥 4. FINAL CHECK & SCROLL =====
  cy.wait('@postRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 120000 }).its('response.statusCode').should('eq', 200);

  cy.scrollTo('bottom');
  // cy.wait(1500); // ⚠️ แทนที่ด้วย assertion ของ element ที่โผล่มาหลัง scroll จะเสถียรกว่า

  cy.url({ timeout: 120000 }).should('include', '/mkt/mktchecker');
  cy.get('button.btn.btn-xs.btn-primary').should('be.visible').click();
  cy.url({ timeout: 120000 }).should('include', '/#/workspace-home/workspace');

  // ===== 🚪 5. LOGOUT =====
  cy.contains('button', 'Logout').should('be.visible').click();
};
// ========================
// AFTER MKT OTHER SUBGROUP
// ========================

export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
  if (Module === 'POST') {
    executeCKSRole('standard', 'main', () => { });

    it('CGMD Config IRB role', () => {
      performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB');
    });
    it('CGMD Tester IRB role', () => {
      performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB');
    });

    if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
      it('SASFF role', () => {
        loginAndWaitReady(sasff, sasffpass);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(1500);
        cy.scrollTo('bottom');
        cy.wait(1500);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
      });
    }

    it('ACTM role', () => {
      performSimpleApprovalRole(actm, actmpass, approveProjectACTM);
    });
    it('OPER role', () => {
      performSimpleApprovalRole(oper, operpass, approveProjectOPER);
    });

  } else if (Module === 'PRE') {
    executeCKSRole('standard', 'main', () => { });

    it('CGMD Config cbs role', () => {
      performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS');
    });
    it('CGMD Tester CBS role', () => {
      performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS');
    });

    if (PoSubGroup === 'AccountFee' || PoSubGroup === 'OrderFee') {
      it('SASFF role', () => {
        loginAndWaitReady(sasff, sasffpass);
        const finalProjectName = getStandardProjectName();
        cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
        ClaimProject(finalProjectName);
        approveProject(finalProjectName);
        cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
        cy.url({ timeout: 60000 }).should('include', '/cgmd/sasff-tester');
        cy.wait(1500);
        cy.scrollTo('bottom');
        cy.wait(1500);
        cy.contains('button', 'Promote').should('be.visible').click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/#/workspace-home/workspace');
        cy.contains('button', 'Logout').should('be.visible').click();
      });
    }

    it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
    it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER));
    it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester));
    it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy));
    it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
    it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
  }
};
// ========================
// EXPORT PROJECT MANAGER
// ========================

export { projectManager };

// ========================
// RANDOM HUMAN TOUCH POINT
// ========================

export const RandomHumanTouchPoint = (subModule: string): void => {
  // 1. เปิด Panel Human Touch Point
  cy.contains('.scrollmenu a', 'Selling Location & Channel', { timeout: 30000 })
    .scrollIntoView()
    .click({ force: true });

  cy.get('app-mass-mkt-human-touch-point', { timeout: 30000 })
    .should('exist')
    .and('be.visible');

  // Helper สร้าง Text สุ่ม
  const randomText = (len = 30) =>
    Cypress._.sampleSize(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
      len
    ).join('');

  // Helper สร้างเบอร์โทรสุ่ม
  const generateAccessNumberLocal = () =>
    `0${Math.floor(Math.random() * 900000000 + 100000000)}`;

  // -----------------------------------------------------------
  // 2. Logic การเลือก: ต้องมี ROM หรือ Easy App ROM หรือ ทั้งคู่
  // -----------------------------------------------------------
  cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
    .find('option')
    .then($options => {
      // ดึง Text ทั้งหมดออกมา
      const allOptions = [...$options].map(opt => opt.innerText.trim()).filter(t => t !== '');

      // ตัวเป้าหมายที่ต้องมี
      const mandatoryTargets = ['ROM', 'Easy App ROM'];

      // เช็คว่าใน list มีตัวเป้าหมายตัวไหนบ้าง
      const availableTargets = mandatoryTargets.filter(target => allOptions.includes(target));

      if (availableTargets.length === 0) {
        cy.log('⚠️ Warning: ROM and Easy App ROM are not available in the list!');
        return;
      }

      let itemsToSelect: string[] = [];

      // --- Logic สุ่มการเลือก Mandatory (1 ตัว หรือ ทั้งคู่) ---
      const pickCount = availableTargets.length > 1 ? Cypress._.random(1, 2) : 1;

      if (pickCount === 2) {
        itemsToSelect = availableTargets;
        cy.log('🎲 Logic Selected: BOTH (ROM & Easy App ROM)');
      } else {
        const singlePick = Cypress._.sample(availableTargets);
        if (singlePick) itemsToSelect = [singlePick];
        cy.log(`🎲 Logic Selected: SINGLE (${singlePick})`);
      }

      // --- Logic สุ่มตัวประกอบอื่นๆ (Optional: 0-2 ตัว) ---
      const otherOptions = allOptions.filter(opt => !mandatoryTargets.includes(opt));
      const randomOthers = Cypress._.sampleSize(otherOptions, Cypress._.random(0, 2));

      // รวม List ที่จะเลือกทั้งหมด
      const finalSelection = [...itemsToSelect, ...randomOthers];

      cy.log(`✅ Final Selection: ${finalSelection.join(', ')}`);

      // ทำการเลือกใน Dropdown
      cy.get('select[formcontrolname="availableListBox"]')
        .select(finalSelection, { force: true });

      // กดปุ่ม Add (>)
      cy.get('button')
        .find('.glyphicon-chevron-right')
        .first()
        .parents('button')
        .click({ force: true });
    });

  // -----------------------------------------------------------
  // 3. Loop เพื่อกรอกข้อมูล (Edit)
  // -----------------------------------------------------------
  cy.get('table tbody tr.ng-star-inserted', { timeout: 30000 })
    .should('have.length.greaterThan', 0);

  cy.get('table tbody tr.ng-star-inserted')
    .each($row => {
      cy.wrap($row)
        .find('td')
        .first()
        .invoke('text')
        .then(raw => {
          const channel = raw.trim();
          if (!channel) return;

          cy.log(`✏️ Edit Human Touch Point: ${channel}`);

          cy.wrap($row)
            .find('button[title="Edit"]')
            .should('be.visible')
            .click({ force: true });

          // --- Case: ROM / Easy App ROM ---
          if (channel === 'ROM' || channel === 'Easy App ROM') {

            // Logic: ตรวจสอบ subModule = PRE เท่านั้น
            if (subModule === 'PRE') {
              let sub = '';
              let unsub = '';

              do {
                sub = generateAccessNumberLocal();
                unsub = generateAccessNumberLocal();
              } while (sub === unsub);

              cy.get('input[formcontrolname="subscribeAccessNumber"]', { timeout: 20000 })
                .clear()
                .type(sub);

              cy.get('input[formcontrolname="unsubscribeAccessNumber"]')
                .clear()
                .type(unsub);
            }

            // กรอกราคาและ Description ของ ROM
            cy.get('input[formcontrolname="romPrice"]')
              .clear()
              .type(Cypress._.random(1, 999).toString());

            cy.get('textarea[formcontrolname="description"]')
              .clear()
              .type(randomText(40));

            // Upload File
            cy.get('input[type="file"]')
              .selectFile('cypress/fixtures/sample.pdf', { force: true });

            cy.get('textarea[formcontrolname="attachmentDescription"]')
              .clear()
              .type(randomText(30));
          }

          // --- Case: Event / Selective ---
          if (
            channel === 'Event' ||
            channel === 'Selective Channel/Location'
          ) {
            cy.get('textarea[formcontrolname="description"]')
              .clear()
              .type(randomText(35));
          }

          // กด Update
          cy.contains('button', 'Update', { timeout: 20000 })
            .should('be.visible')
            .click({ force: true });

          cy.wait(3500);
        });
    });
};