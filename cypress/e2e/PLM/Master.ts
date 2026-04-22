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

export const getTimeSuffix = (): string => `${day} ${month} ${hours} ${minutes}`;

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
      cy.log('Found Add to USMP button, clicking...');
      cy.contains('button', 'Add to USMP').click();
      cy.wait(5000);
      cy.get('.modal, .mat-dialog-container, div[role="dialog"]').should('be.visible').within(() => {
        cy.contains('button', /Close|OK|ปิด/i).click();
      });
      cy.wait(5000);
    } else {
      cy.log('Add to USMP button not found, skipping...');
    }
  });
};

export const scrollAndWait = (ms: number = 2000): void => {
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
    .type(username, { delay: 50 });

  cy.get('input[name="pwd"]')
    .should('be.visible')
    .clear()
    .type(password, { delay: 50 });

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
  const { waitAfterNext = 2000, filterCallback } = options;

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
            cy.wait(2000);

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

            cy.wait(2000);
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
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  cy.get('h3').contains('Team Task').should('be.visible');

  // รอให้ API โหลดเสร็จ
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(5000);
  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for Project: "${partialIdentifier}" with Keyword: "${uniqueKeyword}"`);

  searchInTableWithPagination(
    'Team Task',
    partialIdentifier,
    ($row) => {
      cy.wait(5000);
      cy.wrap($row).scrollIntoView().should('be.visible');

      cy.wrap($row).within(() => {
        cy.get('select.form-control.input-sm').as('assigneeDropdown');
        cy.get('@assigneeDropdown').parent().click();
        cy.get('@assigneeDropdown').then(($select) => {
          const selectElement = $select[0];
          selectElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
          selectElement.dispatchEvent(new FocusEvent('focus', { bubbles: true, cancelable: true }));
        });

        cy.get('@assigneeDropdown')
          .find(`option[value="${assignee}"]`, { timeout: 10000 })
          .should('exist');

        cy.get('@assigneeDropdown').select(assignee);
        cy.get('@assigneeDropdown').should('have.value', assignee);
        cy.get('span').contains('Set').click();
      });
      cy.log(`✅ Successfully assigned ${assignee}`);
    },
    {
      waitAfterNext: 2000,
      filterCallback: ($row) => {
        const rowText = $row.text().trim();
        // ข้ามถ้ายังเป็น Fetching data
        if (rowText.includes('Fetching data')) return false;

        const hasProjectName = rowText.includes(partialIdentifier);
        const hasKeyword = uniqueKeyword ? rowText.includes(uniqueKeyword) : true;
        return hasProjectName && hasKeyword;
      }
    }
  );
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

const _approveSPADLogic = (projectName: string, isComplex: boolean): void => {
  const buttonText = isComplex ? 'Approve as complex' : 'Approve as non complex';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-spad',
    () => {
      const random5DigitCode = Math.floor(Math.random() * 90000) + 10000;
      const random2DigitCode = Math.floor(Math.random() * 90) + 10;

      cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').type(random5DigitCode.toString());
      cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').type(random2DigitCode.toString());

      scrollAndWait();
      cy.contains('button', buttonText, { timeout: 3000000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

export const approveProjectSPADSup = (projectName: string): void => {
  _approveSPADLogic(projectName, true);
};

export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => {
  _approveSPADLogic(projectName, false);
};

export const approveProjectSPAD = (projectName: string, isComplex: boolean = true): void => {
  _approveSPADLogic(projectName, isComplex);
};

const _approveSPADDOERLogic = (projectName: string, isMainFlow: boolean): void => {
  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-configure',
    () => {
      if (isMainFlow) {
        cy.wait(5000);
        const rnd = () => Math.floor(Math.random() * 90000) + 10000;
        cy.get('label:contains("PACKAGE_TYPE")').parent().next('div').find('input').type('PT' + rnd());
        cy.get('label:contains("PACKAGE_ID (PP ID)")').parent().next('div').find('input').type('PP' + rnd());
        cy.get('label:contains("PACKAGE_SUB_TYPE")').parent().next('div').find('input').type('PST' + rnd());
      }
      selectRandomOption('Gprs type');
      cy.wait(2000);
      selectRandomOption('Template');

      scrollAndWait();
      cy.contains('button', 'Promote To SPAD Tester', { timeout: 3000000 }).should('be.visible').click();
    },
    'AlertAndLogout'
  );
};

export const approveProjectSPADDOER = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, false);
};

export const approveProjectSPADDOERMain = (projectName: string): void => {
  _approveSPADDOERLogic(projectName, true);
};

const _approveSPADTesterLogic = (projectName: string, isMainFlow: boolean): void => {
  const logoutStrategy = isMainFlow ? 'StopAfterCore' : 'AlertAndLogout';

  createFullPageApprovalFlow(
    projectName,
    'To Do List',
    '/cgmd/cgmd-tester',
    () => {
      if (isMainFlow) {
        cy.wait(5000);
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
        cy.wait(80000);

        cy.contains('button', 'Refresh Status', { timeout: 3000000 }).should('be.visible').click();
        scrollAndWait();
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
    logoutStrategy as FinalAction
  );
};

export const approveProjectSPADTester = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, false);
};

export const approveProjectSPADTesterMain = (projectName: string): void => {
  _approveSPADTesterLogic(projectName, true);
};

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

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    checkAndFillContentType();
    checkAndUpdatePriority();
    CopyDeductFail();
    smsCKSPOST();
    beforeapproveCKS();
  });

  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOERMain));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTesterMain));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, (projectName) => approveProjectSPADdeploy(projectName)));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};

export const afterMKTMainPRE_NotComplex = (): void => {
  executeCKSRole('standard', 'main', () => {
    dropdownRecurringCKSMain();
    unregister();
    addauto5gCKS();
    checkAndFillContentType();
    checkAndUpdatePriority();
    smsCKSPOST();
    beforeapproveCKS();
  });
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN'));
};

// ========================
// DROPDOWN RECURRING CKS
// ========================

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
// AFTER MKT ONTOP FUNCTIONS
// ========================

export const afterMKTontopPOST = (): void => _afterMKTontopCommon('POST');
export const afterMKTontopENTER = (): void => _afterMKTontopCommon('ENTER');
export const afterMKTontopMUSIC = (): void => _afterMKTontopCommon('MUSIC');

const _afterMKTontopCommon = (module: string): void => {
  executeCKSRole('standard', 'ontop', () => {
    checkAndFillContentType();
    checkAndUpdatePriority();
    smsCKSPOST();
  });
  afterCKSCommon(module);
};

const afterCKSCommon = (Module: string): void => {
  afterCKSPOST();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

export const afterMKTontopPRE = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _afterMKTontopPREWithModule(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _afterMKTontopPREWithModule(afterCKSCommonPRE, 'MUSIC');

const _afterMKTontopPREWithModule = (
  afterFn: (module: string) => void,
  module: string
): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPRE);
  afterFn(module);
};

const stepsOntopPRE = (): void => {
  cy.wait(7500);
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  checkAndFillContentType();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

const afterCKSCommonPRE_Internal = (): void => {
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup));
  it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER));
  it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester));
  it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy));
  it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
  it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO));
};

const afterCKSCommonPRE = (Module: string): void => {
  afterCKSCommonPRE_Internal();
  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

const afterCKSPREPlugin = (Module: string): void => {
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS'));
  it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin));
  it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN'));
  it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'PlugIN'));

  if (Module === 'MUSIC') {
    performMusicRoles();
  }
};

export const afterMKTontopPREUsage = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('PRE');
};

export const afterMKTontopPREUsageEnter = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('Enter');
};

export const afterMKTontopPREUsageMusic = (): void => {
  executeCKSRole('ontop', 'ontop', stepsOntopPREUsage);
  afterCKSCommonPRE('MUSIC');
};

const stepsOntopPREUsage = (): void => {
  cy.wait(7500);
  addauto5gCKS();
  unregister();
  dropdownRecurringCKS();
  diyflagCKS();
  checkAndFillContentType();
  checkAndUpdatePriority();
  cy.scrollTo('bottom');
  smsCKSPRE();
};

// ========================
// MUSIC ROLES
// ========================

const performMusicRoles = (): void => {
  it('TSCENTER role', () => {
    loginAndWaitReady(tscenter, tscenterpass);

    const finalProjectName = getStandardProjectName();
    cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);
    ClaimProject(finalProjectName);
    approveProject(finalProjectName);

    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getTodoList/**').as('getTodoList');
    cy.url({ timeout: 60000 }).should('include', '/zenon/ts-center');
    cy.wait(2000);
    cy.get('select[formcontrolname="olympus"]').should('be.visible').select('No').should('have.value', 'No');

    cy.scrollTo('bottom');
    cy.wait(2000);
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
      cy.wait(2000);
      cy.scrollTo('bottom');
      cy.wait(2000);
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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);

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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);
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
    cy.wait(2000);
    cy.scrollTo('bottom');
    cy.wait(2000);
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
      scrollAndWait();
      handleAddToUSMP();
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
      cy.wait(2000);
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
      cy.wait(5000);
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
      cy.wait(80000);

      cy.contains('button', 'Refresh Status', { timeout: 3000000 }).should('be.visible').click();
      scrollAndWait();
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

  cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');
  cy.get('table.table.table-condensed tbody tr', { timeout: 20000 })
    .first().find('td').first().should('not.be.empty');
  cy.contains('table.table.table-condensed tbody td', 'PLM', { timeout: 20000 }).should('be.visible');

  assignTeamTask(projectName, assignee, billingSystem);
};

const navigateToWorkspace = (): void => {
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
  // cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.visit('/#/workspace-home/workspace');
  // cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
  // const projectNamePONAME= 'MOB POST onetime main 2104 1848';
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
    // const HARDCODE_PROJECT_NAME = 'Enter POST 020426';
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

  cy.get('button.btn-sample')
    .contains('Enhance PO')
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  cy.url().should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/);
  cy.wait(8000);
  enhanceStepsCallback();
};

// ========================
// BEFORE APPROVE CKS
// ========================

const standardBeforeApproveCKS = (): void => {
  //Button Back
  cy.contains('button', 'Back')
    .should('be.visible')
    .and('not.be.disabled')
    .click();

  //Button yes
  cy.contains('button', 'Yes')
    .should('be.visible')
    .click();

  // wait API 
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // Wait for initial API requests to complete
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(5000);

  // Checkbox fast lane
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

  //date
  cy.get('input[aria-label="Date input field"]').eq(1).type(formattedDateMain2);

  // button Submit
  cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');

  //Button Approve
  cy.contains('button', 'Approve').click();

  cy.wait('@submitApprove', { timeout: 3000000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(3500);

  const finalProjectName = getStandardProjectName();

  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');
  cy.get('body', { timeout: 3000000 }).should('be.visible');
  cy.scrollTo('bottom');
  cy.wait(5000);

  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');
  cy.intercept('POST', '**/mail-service/CGMD-Conigure/**').as('sendMail');

  cy.contains('button', 'Approve To CGMD', { timeout: 3000000 })
    .should('be.visible')
    .click();

  cy.wait('@promoteChecker', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@assignCgmd', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@sendMail', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(2000);

  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();
};

export const beforeapproveCKS = (): void => {
  standardBeforeApproveCKS();
};

export const beforeapproveCKSontop = (): void => {
  standardBeforeApproveCKS();
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

  cy.wait(2000);

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
  const tabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game'];

  tabs.forEach((tabName) => {
    cy.wait(2000);
    cy.get('.scrollmenu > .nav').then(($nav) => {
      const $tab = $nav.find(':contains("' + tabName + '")').filter(function () {
        return Cypress.$(this).text().trim() === tabName;
      });

      if ($tab.length === 0) {
        cy.log(`Tab "${tabName}" not found, skipping...`);
        return;
      }

      cy.wrap($tab).scrollIntoView().click();

      cy.get('.nav-tabs').then(($navTabs) => {
        const $deductFail = $navTabs.find('.nav-link:contains("Deduct Fail")');

        if ($deductFail.length === 0) {
          cy.log(`"Deduct Fail" tab not found for "${tabName}", skipping...`);
          return;
        }

        cy.wrap($deductFail).click({ force: true });

        cy.wait(2000);
        cy.get('button').then(($buttons) => {
          const $copyBtn = $buttons.filter(':contains("Copy From Deduct Success")');

          if ($copyBtn.length === 0) {
            cy.log(`"Copy From Deduct Success" button not found for "${tabName}", skipping...`);
            return;
          }

          cy.wrap($copyBtn).click({ force: true });
        });
      });
    });
  });
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
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
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

  // ==================== UTILITY FUNCTIONS ====================

  /**
   * Clean text for English fields - remove Thai chars, special chars, double spaces, trim
   */
  const cleanEnglishText = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/[^\x00-\x7F\s]/g, '')           // ลบ non-ASCII (รวมภาษาไทย)
      .replace(/[^\w\s-]/g, '')                 // ลบ special characters ยกเว้นขีดกลาง
      .replace(/\s+/g, ' ')                     // ยุบ double space เป็น single space
      .trim();                                  // ตัดหัวท้าย
  };

  /**
   * Clean text for Thai fields - keep Thai/English, remove special chars, double spaces, trim
   */
  const cleanThaiText = (str: string): string => {
    if (!str) return '';
    return str
      .replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '') // เก็บเฉพาะไทย อังกฤษ ตัวเลข ช่องว่าง ขีดกลาง
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * Limit string length and ensure no trailing space
   */
  const limit = (str: string, maxLen: number): string => {
    if (!str) return '';
    let result = str.length > maxLen ? str.substring(0, maxLen) : str;
    // ถ้าลงท้ายด้วยช่องว่างให้ตัดออก
    result = result.trimEnd();
    // ถ้าตัดแล้วคำขาด ให้ตัดย้อนไปช่องว่างสุดท้าย (optional แต่ดีกว่า)
    if (result.length === maxLen && !result.endsWith(' ') && result.includes(' ')) {
      const lastSpace = result.lastIndexOf(' ');
      if (lastSpace > maxLen * 0.7) { // ตัดเฉพาะถ้าคำสุดท้ายสั้นเกินไป
        result = result.substring(0, lastSpace);
      }
    }
    return result;
  };

  /**
   * Limit and clean English text in one go
   */
  const limitAndCleanEN = (str: string, maxLen: number): string => {
    return limit(cleanEnglishText(str), maxLen);
  };

  /**
   * Limit and clean Thai text in one go
   */
  const limitAndCleanTH = (str: string, maxLen: number): string => {
    return limit(cleanThaiText(str), maxLen);
  };

  const getRandomSendFlag = (): string => {
    const options = ['Send', "Don't Send"];
    return options[Math.floor(Math.random() * options.length)];
  };

  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const WAIT_TIME = 2000;
  const SCROLL_DELAY = 500;

  // สุ่ม flags ทั้งหมด
  const smsGreetingFlag = getRandomSendFlag();
  const smsDeleteFlag = getRandomSendFlag();
  const lastMinuteVal = getRandomSendFlag();
  const beforeFeeDeductVal = getRandomSendFlag();
  const deductSuccessVal = getRandomSendFlag();
  const deductFailVal = getRandomSendFlag();
  const smsPromotePackVal = getRandomSendFlag();

  // ===== beforePromotionExpAlertSendFlag และ promotionExpAlertSendFlag ห้าม Send พร้อมกัน =====
  const randomExpiryLogic = (): { beforePromoVal: string; promoExpVal: string } => {
    const options = ['Send', "Don't Send"];
    const beforePromo = options[Math.floor(Math.random() * options.length)];
    let promoExp: string;
    if (beforePromo === 'Send') {
      promoExp = "Don't Send";
    } else {
      promoExp = options[Math.floor(Math.random() * options.length)];
    }
    return { beforePromoVal: beforePromo, promoExpVal: promoExp };
  };

  const { beforePromoVal, promoExpVal } = randomExpiryLogic();

  // ฟังก์ชัน scroll ไปยัง element
  const scrollToElement = (selector: string, sectionName: string) => {
    cy.log(`📌 Scrolling to: ${sectionName}`);
    cy.get(selector).first().scrollIntoView({ duration: SCROLL_DELAY, offset: { top: -100, left: 0 } });
    cy.wait(500);
  };

  // เริ่มต้น: scroll และคลิกที่เมนู
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(2000);

  cy.then(() => {
    const finalProjectName = Cypress.env('formattedDateMain') ||
      Cypress.env('formattedDate') ||
      Cypress.env('projectName') ||
      Cypress.env('formattedDateMainPONAME') ||
      Cypress.env('formattedDateOntopPONAME') ||
      Cypress.env('poName');

    const p = finalProjectName || 'Product';

    // ==================== WORDING POOLS (ขยายและเพิ่มข้อความสมจริง) ====================
    const wordingPools = {

      // ===== SHORT PROMOTION NAME =====
      shortPromotionName: {
        EN: [
          `Promo: ${p}`, `Deal: ${p}`, `Offer – ${p}`, `Package: ${p}`,
          `Special: ${p}`, `Bundle: ${p}`, `Plan: ${p}`, `Campaign: ${p}`,
          `Feature: ${p}`, `Highlight: ${p}`, `Pick: ${p}`, `Choice: ${p}`,
          `Value: ${p}`, `Hit: ${p}`, `Exclusive: ${p}`, `Privilege: ${p}`,
          `Boost: ${p}`, `Plus: ${p}`, `Prime: ${p}`, `Star: ${p}`,
          `Super: ${p}`, `Ultra: ${p}`, `Max: ${p}`, `Go ${p}`, `My ${p}`,
          `${p} Pro`, `${p} Lite`, `${p} Plus+`, `Turbo ${p}`, `Smart ${p}`,
          `Easy ${p}`, `Quick ${p}`, `Best ${p}`, `Top ${p}`, `Mega ${p}`,
          `Flash ${p}`, `Swift ${p}`, `Peak ${p}`, `Elite ${p}`, `Core ${p}`,
          `Power ${p}`, `Fresh ${p}`, `Pure ${p}`, `New ${p}`, `The ${p}`,
          `${p} Now`, `${p} Go`, `${p} Max`, `${p} 5G`, `${p} Unlimited`,
          `${p} Saver`, `${p} Combo`, `${p} Family`, `${p} Business`,
          `${p} Essential`, `${p} Basic`, `${p} Advanced`, `${p} Premium`,
        ],
        TH: [
          `โปรโมชัน: ${p}`, `ดีล: ${p}`, `ข้อเสนอ – ${p}`, `แพ็กเกจ: ${p}`,
          `พิเศษ: ${p}`, `บันเดิล: ${p}`, `แผน: ${p}`, `แคมเปญ: ${p}`,
          `ฟีเจอร์: ${p}`, `ไฮไลต์: ${p}`, `ตัวเลือก: ${p}`, `ความคุ้มค่า: ${p}`,
          `แพ็กฮิต: ${p}`, `เอ็กซ์คลูซีฟ: ${p}`, `สิทธิพิเศษ: ${p}`, `บูสต์: ${p}`,
          `พลัส: ${p}`, `พรีเมียม: ${p}`, `สตาร์: ${p}`, `ท็อปดีล: ${p}`,
          `ซูเปอร์: ${p}`, `อัลตร้า: ${p}`, `แม็กซ์: ${p}`, `ไปกับ ${p}`,
          `${p} ของฉัน`, `${p} โปร`, `${p} ไลท์`, `${p} พลัส+`, `เทอร์โบ ${p}`,
          `สมาร์ท ${p}`, `ง่ายๆ ${p}`, `ควิก ${p}`, `เบสท์ ${p}`, `ท็อป ${p}`,
          `เมกะ ${p}`, `แฟลช ${p}`, `สวิฟท์ ${p}`, `พีค ${p}`, `อีลิท ${p}`,
          `คอร์ ${p}`, `พาวเวอร์ ${p}`, `เฟรช ${p}`, `เพียว ${p}`, `ใหม่ ${p}`,
          `${p} เลย`, `${p} ไม่จำกัด`, `${p} เซฟเวอร์`, `${p} คอมโบ`,
          `${p} ครอบครัว`, `${p} ธุรกิจ`, `${p} พื้นฐาน`, `${p} ขั้นสูง`,
        ],
      },

      // ===== CMS DISPLAY =====
      cmsDisplay: {
        EN: [
          `Enjoy exclusive benefits with ${p}`, `Get the most out of ${p} today`,
          `Unlock premium features – ${p}`, `${p}: Your go-to package`,
          `Stay connected with ${p}`, `Discover what ${p} has to offer`,
          `Make every moment count with ${p}`, `${p} – designed just for you`,
          `Experience the difference with ${p}`, `Your perfect plan: ${p}`,
          `Level up with ${p}`, `${p} keeps you ahead of the game`,
          `More value, more fun – ${p}`, `${p}: Smart choice, great benefits`,
          `Start enjoying ${p} right now`, `${p} – packed with perks you'll love`,
          `Why settle for less? Choose ${p}`, `${p}: Where value meets quality`,
          `Supercharge your day with ${p}`, `${p} – the package that delivers`,
          `Upgrade to ${p} today!`, `${p} gives you more freedom`,
          `Simplify your life with ${p}`, `${p} is the smart move`,
          `Take control with ${p}`, `${p} – better, faster, stronger`,
          `You deserve ${p}`, `Make the switch to ${p}`,
          `${p} works as hard as you`, `Life's better with ${p}`,
          `Unleash the power of ${p}`, `${p} changes everything`,
          `Welcome to a new era with ${p}`, `${p} fits your vibe`,
          `Get more with ${p} every day`, `${p} – the upgrade you've been waiting for`,
          `${p} brings you closer to what matters`, `Your journey with ${p} starts here`,
          `${p} is your ticket to better connectivity`, `Experience seamless service with ${p}`,
          `${p} delivers unmatched value`, `Join thousands of happy ${p} users`,
          `${p} is the key to unlimited possibilities`, `Elevate your experience with ${p}`,
          `${p} combines speed and reliability`, `Enjoy peace of mind with ${p}`,
          `${p} is your partner in connectivity`, `Discover the true meaning of value with ${p}`,
        ],
        TH: [
          `เพลิดเพลินกับสิทธิพิเศษจาก ${p}`, `รับประโยชน์สูงสุดจาก ${p} วันนี้`,
          `ปลดล็อกฟีเจอร์พรีเมียม – ${p}`, `${p}: แพ็กเกจที่ใช่สำหรับคุณ`,
          `เชื่อมต่อไม่ขาดกับ ${p}`, `ค้นพบสิ่งที่ ${p} มอบให้คุณ`,
          `ทุกช่วงเวลามีความหมายกับ ${p}`, `${p} – ออกแบบมาเพื่อคุณโดยเฉพาะ`,
          `สัมผัสความแตกต่างกับ ${p}`, `แพ็กเกจที่ใช่: ${p}`,
          `อัปเลเวลกับ ${p}`, `${p} พาคุณนำหน้าทุกการเชื่อมต่อ`,
          `คุ้มกว่า สนุกกว่า – ${p}`, `${p}: เลือกฉลาด รับสิทธิ์ดี`,
          `เริ่มเพลิดเพลินกับ ${p} ได้เลยตอนนี้`, `${p} – เต็มไปด้วยสิทธิ์ที่คุณจะชอบ`,
          `ทำไมต้องน้อยกว่า? เลือก ${p}`, `${p}: จุดที่คุณภาพพบกับความคุ้มค่า`,
          `เพิ่มพลังให้วันของคุณกับ ${p}`, `${p} – แพ็กเกจที่ตอบโจทย์ทุกอย่าง`,
          `อัปเกรดเป็น ${p} วันนี้เลย!`, `${p} ให้อิสระคุณมากขึ้น`,
          `ชีวิตง่ายขึ้นด้วย ${p}`, `${p} คือการเคลื่อนไหวที่ชาญฉลาด`,
          `ควบคุมทุกอย่างด้วย ${p}`, `${p} – ดีกว่า เร็วกว่า แรงกว่า`,
          `คุณคู่ควรกับ ${p}`, `เปลี่ยนมาใช้ ${p} เลย`,
          `${p} ทำงานหนักเท่าคุณ`, `ชีวิตดีขึ้นเมื่อมี ${p}`,
          `ปลดปล่อยพลังของ ${p}`, `${p} เปลี่ยนทุกสิ่ง`,
          `ยินดีต้อนรับสู่ยุคใหม่กับ ${p}`, `${p} ตรงกับสไตล์คุณ`,
          `ได้มากขึ้นทุกวันกับ ${p}`, `${p} – การอัปเกรดที่คุณรอคอย`,
          `${p} พาคุณเข้าใกล้สิ่งที่สำคัญ`, `การเดินทางกับ ${p} เริ่มที่นี่`,
          `${p} คือตั๋วสู่การเชื่อมต่อที่ดีกว่า`, `สัมผัสบริการที่ราบรื่นกับ ${p}`,
          `${p} มอบคุณค่าที่ไม่มีใครเทียบ`, `ร่วมเป็นส่วนหนึ่งกับผู้ใช้ ${p} นับพัน`,
          `${p} คือกุญแจสู่ความเป็นไปได้ไม่จำกัด`, `ยกระดับประสบการณ์ด้วย ${p}`,
          `${p} ผสานความเร็วและความน่าเชื่อถือ`, `อุ่นใจทุกการใช้งานกับ ${p}`,
          `${p} คือคู่หูการเชื่อมต่อของคุณ`, `ค้นพบความหมายที่แท้จริงของความคุ้มค่ากับ ${p}`,
        ],
      },

      // ===== PROMOTION DESCRIPTION =====
      promotionDescription: {
        EN: [
          `Subscribe to ${p} and enjoy unlimited access`, `${p} gives you the best value for your money`,
          `Experience seamless connectivity with ${p}`, `Upgrade your lifestyle with ${p}`,
          `${p}: More benefits, better experience`, `Join ${p} today and unlock endless possibilities`,
          `${p} – tailored for those who want the best`, `Get connected, stay connected with ${p}`,
          `Your subscription to ${p} comes with amazing perks`, `${p} is the smart way to stay ahead`,
          `Enjoy priority service and more with ${p}`, `${p} brings you closer to what matters most`,
          `Activate ${p} and feel the difference immediately`, `The smarter choice for every lifestyle – ${p}`,
          `${p}: Great network, greater life`, `Explore all that ${p} has in store for you`,
          `With ${p}, every day is better connected`, `${p} – your key to premium benefits`,
          `Live more, spend less with ${p}`, `${p}: The package worth talking about`,
          `${p} unlocks a world of possibilities`, `Get ready for something great with ${p}`,
          `${p} puts you in the driver's seat`, `Experience the premium side of life with ${p}`,
          `${p} delivers what you need, when you need it`, `No limits, just benefits – that's ${p}`,
          `Join thousands who love ${p}`, `${p} fits your life perfectly`,
          `Stay ahead of the curve with ${p}`, `${p} – because you deserve the best`,
          `Transform your daily experience with ${p}`, `${p} is the game changer you need`,
          `Go further with ${p} by your side`, `${p} empowers you every step of the way`,
          `${p} is designed for those who demand more`, `Your search for the perfect plan ends with ${p}`,
          `${p} offers unparalleled speed and reliability`, `Make the smart choice – choose ${p} today`,
          `${p} brings innovation to your fingertips`, `Enjoy premium features without the premium price with ${p}`,
          `${p} is the ultimate connectivity solution`, `Never miss a moment with ${p}`,
          `${p} provides exceptional value for modern lifestyles`, `Experience true freedom with ${p}`,
        ],
        TH: [
          `สมัคร ${p} และรับสิทธิ์ใช้งานไม่จำกัด`, `${p} คุ้มค่าที่สุดสำหรับคุณ`,
          `สัมผัสการเชื่อมต่อที่ลื่นไหลกับ ${p}`, `อัปเกรดไลฟ์สไตล์ของคุณด้วย ${p}`,
          `${p}: สิทธิพิเศษมากกว่า ประสบการณ์ดีกว่า`, `สมัคร ${p} วันนี้ เปิดโลกไม่มีขีดจำกัด`,
          `${p} – สร้างมาเพื่อคนที่ต้องการสิ่งที่ดีที่สุด`, `เชื่อมต่อได้ อยู่กับ ${p} ตลอดไป`,
          `การสมัคร ${p} มาพร้อมสิทธิพิเศษมากมาย`, `${p} คือทางเลือกฉลาดเพื่อก้าวนำหน้า`,
          `รับบริการพรีออริตี้และอื่นๆ อีกมากกับ ${p}`, `${p} พาคุณเข้าใกล้สิ่งที่สำคัญที่สุด`,
          `เปิดใช้ ${p} แล้วรู้สึกถึงความแตกต่างทันที`, `ตัวเลือกที่ฉลาดสำหรับทุกไลฟ์สไตล์ – ${p}`,
          `${p}: เน็ตแรง ชีวิตดีกว่า`, `สำรวจทุกสิ่งที่ ${p} มีให้คุณ`,
          `กับ ${p} ทุกวันเชื่อมต่อได้ดีกว่าเดิม`, `${p} – กุญแจสู่สิทธิพิเศษระดับพรีเมียม`,
          `ใช้ชีวิตได้มากขึ้น จ่ายน้อยลงกับ ${p}`, `${p}: แพ็กเกจที่ทุกคนพูดถึง`,
          `${p} ปลดล็อกโลกแห่งความเป็นไปได้`, `เตรียมพร้อมสำหรับสิ่งดีๆ กับ ${p}`,
          `${p} ทำให้คุณเป็นผู้ควบคุมทุกอย่าง`, `สัมผัสชีวิตพรีเมียมกับ ${p}`,
          `${p} ส่งมอบสิ่งที่คุณต้องการ ในเวลาที่คุณต้องการ`, `ไร้ขีดจำกัด แค่สิทธิพิเศษ – นั่นคือ ${p}`,
          `ร่วมเป็นส่วนหนึ่งกับคนนับพันที่รัก ${p}`, `${p} เหมาะกับชีวิตคุณที่สุด`,
          `ก้าวนำทุกเส้นทางด้วย ${p}`, `${p} – เพราะคุณสมควรได้รับสิ่งที่ดีที่สุด`,
          `เปลี่ยนประสบการณ์ในแต่ละวันด้วย ${p}`, `${p} คือตัวเปลี่ยนเกมที่คุณต้องการ`,
          `ไปได้ไกลขึ้นกับ ${p} ที่เคียงข้างคุณ`, `${p} สร้างพลังให้คุณทุกย่างก้าว`,
          `${p} ออกแบบมาสำหรับผู้ที่ต้องการมากกว่า`, `การค้นหาแผนที่สมบูรณ์แบบสิ้นสุดที่ ${p}`,
          `${p} มอบความเร็วและความน่าเชื่อถือที่ไร้เทียมทาน`, `เลือกอย่างฉลาด – เลือก ${p} วันนี้`,
          `${p} นำนวัตกรรมมาสู่ปลายนิ้วคุณ`, `เพลิดเพลินกับฟีเจอร์พรีเมียมในราคาที่คุ้มค่ากับ ${p}`,
          `${p} คือโซลูชันการเชื่อมต่อขั้นสุด`, `ไม่พลาดทุกช่วงเวลากับ ${p}`,
          `${p} มอบคุณค่าพิเศษสำหรับไลฟ์สไตล์ยุคใหม่`, `สัมผัสอิสรภาพที่แท้จริงกับ ${p}`,
        ],
      },

      // ===== SMS CHECK CURRENT =====
      smsCheckCurrent: {
        EN: [
          `Check your current plan: ${p}`, `Your active package: ${p}`,
          `Currently subscribed to: ${p}`, `Package in use: ${p}`,
          `Your plan today: ${p}`, `Active now: ${p}`,
          `Running package: ${p}`, `Your service: ${p}`,
          `On plan: ${p}`, `Subscribed: ${p}`,
          `Live package: ${p}`, `In effect: ${p}`,
          `Current deal: ${p}`, `Now active: ${p}`,
          `Your current offer: ${p}`, `Status: ${p} active`,
          `Using: ${p}`, `Your chosen plan: ${p}`,
          `Ongoing package: ${p}`, `Enrolled in: ${p}`,
          `You're on: ${p}`, `Currently: ${p}`,
          `Active plan: ${p}`, `Now using: ${p}`,
          `Your package: ${p}`, `Current subscription: ${p}`,
          `Plan active: ${p}`, `Service running: ${p}`,
          `${p} is your plan`, `You have: ${p}`,
          `Active service: ${p}`, `Your active subscription: ${p}`,
        ],
        TH: [
          `ตรวจสอบแพ็กเกจปัจจุบัน: ${p}`, `แพ็กเกจที่ใช้งานอยู่: ${p}`,
          `กำลังสมัครใช้งาน: ${p}`, `แพ็กเกจที่เปิดใช้: ${p}`,
          `แพ็กเกจวันนี้ของคุณ: ${p}`, `ใช้งานอยู่: ${p}`,
          `แพ็กเกจที่รันอยู่: ${p}`, `บริการของคุณ: ${p}`,
          `อยู่ในแผน: ${p}`, `สมัครอยู่: ${p}`,
          `แพ็กเกจที่มีผล: ${p}`, `ใช้งานจริง: ${p}`,
          `ดีลปัจจุบัน: ${p}`, `กำลังใช้งาน: ${p}`,
          `ข้อเสนอปัจจุบัน: ${p}`, `สถานะ: ${p} ใช้งานอยู่`,
          `ใช้อยู่: ${p}`, `แผนที่เลือก: ${p}`,
          `แพ็กเกจที่ดำเนินอยู่: ${p}`, `ลงทะเบียนอยู่ใน: ${p}`,
          `คุณใช้: ${p}`, `ปัจจุบัน: ${p}`,
          `แผนที่ใช้งาน: ${p}`, `กำลังใช้: ${p}`,
          `แพ็กเกจของคุณ: ${p}`, `การสมัครปัจจุบัน: ${p}`,
          `แผนใช้งาน: ${p}`, `บริการกำลังทำงาน: ${p}`,
          `${p} คือแผนของคุณ`, `คุณมี: ${p}`,
          `บริการที่ใช้งาน: ${p}`, `การสมัครที่ใช้งานอยู่: ${p}`,
        ],
      },

      // ===== SMS GREETING =====
      smsGreeting: {
        EN: [
          `Welcome to ${p}! Your subscription is now active.`,
          `Hi! You've successfully joined ${p}. Enjoy your benefits!`,
          `Great news! ${p} is ready for you. Start enjoying now.`,
          `You're in! ${p} has been activated on your number.`,
          `Hello and welcome! ${p} is now available for you.`,
          `Congrats! Your ${p} package is live and ready to use.`,
          `${p} is ON! Enjoy all the perks starting right now.`,
          `Your journey with ${p} begins today. Welcome aboard!`,
          `We're thrilled to have you on ${p}. Enjoy every moment!`,
          `${p} activated! Get ready to experience something great.`,
          `Welcome! You're now part of ${p}. Explore your benefits.`,
          `Hi there! ${p} is all set. Time to enjoy your perks!`,
          `You're officially on ${p}! Make the most of it.`,
          `${p} is here for you. Welcome and enjoy!`,
          `Your ${p} subscription kicks off now. Have a great time!`,
          `Hello! ${p} is now active on your account. Enjoy!`,
          `Big welcome to ${p}! Your package is ready to roll.`,
          `You did it! ${p} is now yours. Start exploring today.`,
          `Welcome on board ${p}! Great things are waiting for you.`,
          `${p} is live! We're so glad you're here. Enjoy!`,
          `Success! ${p} is now on your device. Let's go!`,
          `Thank you for choosing ${p}. You're all set!`,
          `Boom! ${p} is activated. Time to enjoy the ride.`,
          `Ready, set, go! ${p} is now yours to enjoy.`,
          `You're officially a ${p} member. Welcome to the club!`,
          `${p} unlocked. Get ready for something amazing.`,
          `All done! ${p} is active and waiting for you.`,
          `Welcome to the ${p} family. We're happy to have you!`,
          `Your ${p} adventure starts now. Enjoy every bit of it!`,
          `Cheers! ${p} is ready. Make today awesome!`,
          `Welcome! ${p} is now live on your account. Enjoy the perks!`,
          `You've made a great choice with ${p}. Welcome!`,
          `${p} is now active. We're excited to have you with us!`,
          `Thank you for subscribing to ${p}. Your benefits are ready!`,
          `Your ${p} plan is now active. Enjoy seamless connectivity!`,
        ],
        TH: [
          `ยินดีต้อนรับสู่ ${p}! แพ็กเกจของคุณพร้อมใช้งานแล้ว`,
          `สวัสดี! คุณสมัคร ${p} สำเร็จแล้ว ขอให้เพลิดเพลิน`,
          `ข่าวดี! ${p} พร้อมให้คุณใช้งานแล้ว`,
          `เรียบร้อยแล้ว! ${p} ถูกเปิดใช้งานบนเบอร์ของคุณแล้ว`,
          `สวัสดีและยินดีต้อนรับ! ${p} พร้อมสำหรับคุณแล้ว`,
          `ยินดีด้วย! แพ็กเกจ ${p} ของคุณเปิดใช้งานแล้ว`,
          `${p} เปิดแล้ว! เพลิดเพลินกับสิทธิพิเศษได้ตั้งแต่ตอนนี้`,
          `การเดินทางของคุณกับ ${p} เริ่มต้นวันนี้ ยินดีต้อนรับ!`,
          `เรารู้สึกยินดีที่คุณมาร่วมกับ ${p} ขอให้สนุกทุกช่วงเวลา!`,
          `${p} เปิดใช้งานแล้ว! เตรียมพร้อมสำหรับประสบการณ์ที่ยอดเยี่ยม`,
          `ยินดีต้อนรับ! คุณเป็นส่วนหนึ่งของ ${p} แล้ว สำรวจสิทธิพิเศษของคุณได้เลย`,
          `สวัสดี! ${p} พร้อมแล้ว ถึงเวลาเพลิดเพลินกับสิทธิของคุณ!`,
          `คุณอยู่บน ${p} อย่างเป็นทางการแล้ว! ใช้งานให้คุ้มค่าที่สุด`,
          `${p} พร้อมอยู่เคียงข้างคุณ ยินดีต้อนรับและขอให้สนุก!`,
          `การสมัคร ${p} ของคุณเริ่มต้นแล้ว ขอให้มีวันที่ยอดเยี่ยม!`,
          `สวัสดี! ${p} เปิดใช้งานบนบัญชีของคุณแล้ว ขอให้สนุก!`,
          `ยินดีต้อนรับสู่ ${p}! แพ็กเกจของคุณพร้อมเดินหน้าแล้ว`,
          `คุณทำได้! ${p} เป็นของคุณแล้ว เริ่มสำรวจได้วันนี้เลย`,
          `ยินดีต้อนรับสู่ ${p}! สิ่งดีๆ กำลังรอคุณอยู่`,
          `${p} เปิดแล้ว! เรายินดีที่คุณมาอยู่กับเรา ขอให้สนุก!`,
          `สำเร็จ! ${p} อยู่ในอุปกรณ์ของคุณแล้ว ไปกันเลย!`,
          `ขอบคุณที่เลือก ${p} คุณพร้อมแล้ว!`,
          `ปัง! ${p} เปิดใช้งานแล้ว ถึงเวลาเพลิดเพลิน`,
          `พร้อม...เริ่ม...เลย! ${p} เป็นของคุณแล้ว`,
          `คุณเป็นสมาชิก ${p} อย่างเป็นทางการแล้ว ยินดีต้อนรับสู่ครอบครัว!`,
          `ปลดล็อก ${p} แล้ว เตรียมพบกับสิ่งที่น่าทึ่ง`,
          `เรียบร้อย! ${p} เปิดใช้งานและรอคุณอยู่`,
          `ยินดีต้อนรับสู่ครอบครัว ${p} เราดีใจที่มีคุณ`,
          `การผจญภัยกับ ${p} ของคุณเริ่มแล้ว ขอให้สนุกทุกส่วนของมัน!`,
          `ไชโย! ${p} พร้อมแล้ว ทำให้วันนี้ยอดเยี่ยม!`,
          `ยินดีต้อนรับ! ${p} พร้อมใช้งานบนบัญชีคุณแล้ว สนุกกับสิทธิพิเศษ!`,
          `คุณเลือก ${p} ได้ดีมาก ยินดีต้อนรับ!`,
          `${p} เปิดใช้งานแล้ว เราตื่นเต้นที่มีคุณอยู่กับเรา!`,
          `ขอบคุณที่สมัคร ${p} สิทธิประโยชน์ของคุณพร้อมแล้ว!`,
          `แผน ${p} ของคุณเปิดใช้งานแล้ว สนุกกับการเชื่อมต่อที่ราบรื่น!`,
        ],
      },

      // ===== SMS DELETE PRE =====
      smsDeletePRE: {
        EN: [
          `Your ${p} package has been removed. Thank you for using our service.`,
          `${p} has been unsubscribed from your number. Hope to see you again!`,
          `You have successfully cancelled ${p}. We appreciate your loyalty.`,
          `${p} is now deactivated. Thank you for being our customer.`,
          `Your subscription to ${p} has ended. We hope you enjoyed it.`,
          `${p} has been turned off on your number. Thanks for being with us!`,
          `We've processed your ${p} cancellation. Hope you'll be back soon.`,
          `${p} service is now stopped. Thank you for choosing us.`,
          `Your ${p} plan has been removed as requested. Take care!`,
          `${p} unsubscribed successfully. We'd love to have you back someday.`,
          `Thanks for using ${p}. Your package has now been cancelled.`,
          `${p} is no longer active on your number. We hope to serve you again.`,
          `Your ${p} membership has ended. We value your time with us.`,
          `${p} cancelled. We appreciate your trust in our services.`,
          `You've left ${p}. Thank you for the time you spent with us.`,
          `${p} has been deactivated per your request. See you next time!`,
          `We confirm ${p} is now off. Thank you for using our network.`,
          `${p} removed. We hope your experience was great while it lasted.`,
          `Your ${p} has been cancelled. Come back anytime – we'll be here!`,
          `${p} is done. Thanks for being part of our service family.`,
          `Farewell ${p}. You've been removed. Hope to see you again soon!`,
          `${p} cancelled successfully. We're sad to see you go!`,
          `Your ${p} subscription is now over. Thanks for the memories!`,
          `${p} has left your account. Take care and see you next time!`,
          `We've said goodbye to ${p} on your number. Come back anytime!`,
          `${p} removed. We appreciate every moment you spent with us.`,
          `Your ${p} plan has ended. It was a pleasure serving you.`,
          `${p} is officially off. Thank you for being a valued customer.`,
          `You've successfully unsubscribed from ${p}. Until next time!`,
          `${p} cancellation complete. We hope you'll return someday.`,
          `Your request to cancel ${p} has been processed. Thank you.`,
          `${p} has been removed from your account. We'll miss you!`,
          `Goodbye for now. Your ${p} package has been cancelled.`,
          `We're sorry to see you leave ${p}. Come back soon!`,
          `${p} deactivation confirmed. Thank you for choosing us.`,
        ],
        TH: [
          `แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว ขอบคุณที่ใช้บริการ`,
          `${p} ถูกยกเลิกจากเบอร์ของคุณแล้ว หวังว่าจะพบกันใหม่`,
          `คุณยกเลิก ${p} สำเร็จแล้ว ขอบคุณที่ไว้วางใจเรา`,
          `${p} ถูกปิดใช้งานแล้ว ขอบคุณที่เป็นลูกค้าของเรา`,
          `การสมัครใช้งาน ${p} ของคุณสิ้นสุดแล้ว หวังว่าคุณจะพอใจ`,
          `${p} ถูกปิดบนเบอร์ของคุณแล้ว ขอบคุณที่อยู่กับเรา!`,
          `เราดำเนินการยกเลิก ${p} เรียบร้อยแล้ว หวังว่าจะได้พบกันเร็วๆ นี้`,
          `บริการ ${p} หยุดให้บริการแล้ว ขอบคุณที่เลือกเรา`,
          `แผน ${p} ของคุณถูกลบออกตามที่ร้องขอ ดูแลตัวเองด้วยนะ!`,
          `ยกเลิก ${p} สำเร็จแล้ว หวังว่าจะได้ต้อนรับคุณอีกครั้ง`,
          `ขอบคุณที่ใช้ ${p} แพ็กเกจของคุณถูกยกเลิกแล้ว`,
          `${p} ไม่ได้ใช้งานบนเบอร์ของคุณแล้ว หวังว่าจะได้ให้บริการอีกครั้ง`,
          `การสมาชิก ${p} ของคุณสิ้นสุดแล้ว เราขอบคุณทุกช่วงเวลาที่ผ่านมา`,
          `ยกเลิก ${p} แล้ว ขอบคุณที่ไว้วางใจบริการของเรา`,
          `คุณออกจาก ${p} แล้ว ขอบคุณสำหรับเวลาที่คุณอยู่กับเรา`,
          `${p} ถูกปิดการใช้งานตามคำขอของคุณ แล้วพบกันใหม่!`,
          `เรายืนยันว่า ${p} ปิดแล้ว ขอบคุณที่ใช้เครือข่ายของเรา`,
          `ลบ ${p} แล้ว หวังว่าประสบการณ์ของคุณจะดีตลอดที่ผ่านมา`,
          `${p} ของคุณถูกยกเลิกแล้ว กลับมาหาเราได้ตลอดเวลา!`,
          `${p} เสร็จสิ้นแล้ว ขอบคุณที่เป็นส่วนหนึ่งของครอบครัวบริการเรา`,
          `ลาก่อน ${p} ถูกลบออกแล้ว หวังว่าจะได้พบคุณอีกเร็วๆ นี้!`,
          `ยกเลิก ${p} สำเร็จแล้ว เสียใจที่ต้องเสียคุณไป!`,
          `การสมัคร ${p} ของคุณสิ้นสุดแล้ว ขอบคุณสำหรับความทรงจำ!`,
          `${p} ออกจากบัญชีของคุณแล้ว ดูแลตัวเองด้วย แล้วพบกันใหม่!`,
          `เรากล่าวลากับ ${p} บนเบอร์ของคุณแล้ว กลับมาได้ทุกเวลา!`,
          `ลบ ${p} แล้ว เราขอบคุณทุกช่วงเวลาที่คุณอยู่กับเรา`,
          `แผน ${p} ของคุณสิ้นสุดแล้ว เป็นเกียรติที่ได้ให้บริการคุณ`,
          `${p} ปิดอย่างเป็นทางการแล้ว ขอบคุณที่เป็นลูกค้าที่มีค่า`,
          `คุณยกเลิก ${p} สำเร็จแล้ว เจอกันใหม่คราวหน้า!`,
          `ยกเลิก ${p} เสร็จสมบูรณ์ หวังว่าคุณจะกลับมาสักวัน`,
          `คำขอยกเลิก ${p} ได้รับการดำเนินการแล้ว ขอบคุณ`,
          `${p} ถูกลบออกจากบัญชีคุณแล้ว เราจะคิดถึงคุณ!`,
          `ลาก่อนก่อนนะ แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว`,
          `เสียใจที่เห็นคุณออกจาก ${p} กลับมาเร็วๆ นะ!`,
          `ยืนยันการปิดใช้งาน ${p} ขอบคุณที่เลือกเรา`,
        ],
      },

      // ===== SMS DELETE POST =====
      smsDeletePOST: {
        EN: [
          `Your ${p} package has been cancelled. We hope to serve you again.`,
          `${p} subscription ended. Thank you for being with us.`,
          `We've removed ${p} from your account as requested.`,
          `${p} is now cancelled. We value your time with us.`,
          `Your request to cancel ${p} is complete. Thank you.`,
          `${p} has been successfully removed from your postpaid plan.`,
          `We confirm the cancellation of ${p}. We appreciate your business.`,
          `${p} is off. We hope you enjoyed your time with us.`,
          `Your ${p} postpaid package has been deactivated as requested.`,
          `${p} cancelled. Feel free to subscribe again anytime.`,
          `We have processed your ${p} cancellation successfully.`,
          `${p} removed from your account. Thank you for your loyalty.`,
          `Your ${p} plan is now terminated. We hope to see you again soon.`,
          `${p} deactivated. We appreciate you choosing our services.`,
          `The ${p} package on your account is now closed. Thank you.`,
          `${p} has been turned off as per your request. Take care!`,
          `Your cancellation of ${p} is confirmed. We'll miss having you!`,
          `${p} is no longer part of your plan. Thank you for choosing us.`,
          `We've successfully cancelled ${p}. Come back whenever you're ready.`,
          `${p} ended. It was a pleasure serving you. See you next time!`,
          `Goodbye ${p}. Your postpaid package has been removed.`,
          `${p} cancellation successful. We hope to welcome you back!`,
          `Your ${p} subscription is now closed. Thank you for your trust.`,
          `${p} has left your account. See you again soon!`,
          `We've processed your request to remove ${p}. Take care!`,
          `${p} removed from your postpaid plan. It was great having you.`,
          `Your ${p} package is now cancelled. We appreciate you!`,
          `${p} deactivation complete. Feel free to rejoin anytime.`,
          `Thanks for being with ${p}. Your package has been removed.`,
          `${p} cancelled. Wishing you all the best until we meet again!`,
          `Postpaid ${p} has been deactivated successfully. Thank you.`,
          `We're sorry to see you go. ${p} has been cancelled.`,
          `Your ${p} postpaid service has ended. Hope to see you back!`,
          `${p} removal confirmed. Thank you for your business.`,
          `Your ${p} plan is no longer active. We valued your patronage.`,
        ],
        TH: [
          `แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว หวังว่าจะได้ให้บริการอีกครั้ง`,
          `การสมัคร ${p} สิ้นสุดแล้ว ขอบคุณที่อยู่กับเรา`,
          `เราได้ลบ ${p} ออกจากบัญชีของคุณตามที่ร้องขอ`,
          `${p} ถูกยกเลิกแล้ว เราขอบคุณในทุกช่วงเวลาที่ผ่านมา`,
          `คำขอยกเลิก ${p} ของคุณเสร็จสมบูรณ์ ขอบคุณ`,
          `${p} ถูกลบออกจากแผนโพสต์เพดของคุณสำเร็จแล้ว`,
          `เรายืนยันการยกเลิก ${p} ขอบคุณที่ใช้บริการของเรา`,
          `${p} ปิดแล้ว หวังว่าคุณจะสนุกกับช่วงเวลาที่อยู่กับเรา`,
          `แพ็กเกจโพสต์เพด ${p} ของคุณถูกปิดการใช้งานตามที่ร้องขอ`,
          `ยกเลิก ${p} แล้ว สามารถสมัครใหม่ได้ตลอดเวลา`,
          `เราดำเนินการยกเลิก ${p} ของคุณสำเร็จแล้ว`,
          `ลบ ${p} ออกจากบัญชีของคุณแล้ว ขอบคุณสำหรับความไว้วางใจ`,
          `แผน ${p} ของคุณถูกยุติแล้ว หวังว่าจะได้พบกันเร็วๆ นี้`,
          `ปิดการใช้งาน ${p} แล้ว ขอบคุณที่เลือกบริการของเรา`,
          `แพ็กเกจ ${p} บนบัญชีของคุณถูกปิดแล้ว ขอบคุณ`,
          `${p} ถูกปิดตามคำขอของคุณ ดูแลตัวเองด้วยนะ!`,
          `การยกเลิก ${p} ของคุณได้รับการยืนยันแล้ว เราจะคิดถึงคุณ!`,
          `${p} ไม่ได้เป็นส่วนหนึ่งของแผนของคุณอีกต่อไป ขอบคุณที่เลือกเรา`,
          `เราได้ยกเลิก ${p} สำเร็จแล้ว กลับมาหาเราได้เมื่อพร้อม`,
          `${p} สิ้นสุดแล้ว เป็นเกียรติที่ได้ให้บริการคุณ แล้วพบกันใหม่!`,
          `ลาก่อน ${p} แพ็กเกจโพสต์เพดของคุณถูกลบแล้ว`,
          `ยกเลิก ${p} สำเร็จแล้ว หวังว่าจะได้ต้อนรับคุณกลับมา!`,
          `การสมัคร ${p} ของคุณปิดแล้ว ขอบคุณสำหรับความไว้วางใจ`,
          `${p} ออกจากบัญชีของคุณแล้ว แล้วพบกันใหม่เร็วๆ นี้!`,
          `เราดำเนินการลบ ${p} ตามคำขอของคุณแล้ว ดูแลตัวเองด้วยนะ!`,
          `ลบ ${p} ออกจากแผนโพสต์เพดของคุณแล้ว ดีใจที่ได้มีคุณ`,
          `แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว เราขอบคุณคุณ!`,
          `ปิดการใช้งาน ${p} เสร็จสมบูรณ์ สามารถสมัครใหม่ได้ตลอดเวลา`,
          `ขอบคุณที่ใช้ ${p} แพ็กเกจของคุณถูกลบแล้ว`,
          `ยกเลิก ${p} แล้ว ขอให้คุณโชคดีจนกว่าเราจะพบกันใหม่!`,
          `โพสต์เพด ${p} ถูกปิดใช้งานเรียบร้อยแล้ว ขอบคุณ`,
          `เสียใจที่เห็นคุณจากไป ${p} ถูกยกเลิกแล้ว`,
          `บริการโพสต์เพด ${p} ของคุณสิ้นสุดแล้ว หวังว่าจะได้พบคุณอีก!`,
          `ยืนยันการลบ ${p} ขอบคุณที่ใช้บริการ`,
          `แผน ${p} ของคุณไม่ทำงานแล้ว เราขอบคุณที่ไว้วางใจเรา`,
        ],
      },

      // ===== MARKETING NAME =====
      marketingName: [
        `${p} Special Offer`, `${p} Best Value`, `${p} Limited Deal`,
        `${p} Top Pick`, `${p} Exclusive`, `${p} Premium Choice`,
        `${p} Handpicked for You`, `${p} Editor Pick`,
        `${p} Staff Favourite`, `${p} Hot Deal`,
        `${p} Must Have`, `${p} Smart Pick`,
        `${p} Today Best`, `${p} Trending Now`,
        `${p} Featured Plan`, `${p} Value King`,
        `${p} Recommended`, `${p} Fan Favourite`,
        `${p} Power Pack`, `${p} Prime Choice`,
        `${p} Customer Choice`, `${p} Bestseller`,
        `${p} Limited Time`, `${p} Flash Sale`,
        `${p} Weekly Deal`, `${p} Monthly Special`,
        `${p} Year Best`, `${p} All Star Pick`,
        `${p} Popular Pick`, `${p} Rising Star`,
        `${p} Community Fave`, `${p} Top Rated`,
        `${p} Budget Hero`, `${p} Value Champ`,
        `${p} Smart Saver`, `${p} Money Saver`,
        `${p} Mega Deal`, `${p} Super Saver`,
        `${p} Ultimate Plan`, `${p} Premium Deal`,
        `${p} VIP Offer`, `${p} Gold Package`,
        `${p} Platinum Deal`, `${p} Diamond Offer`,
        `${p} Elite Plan`, `${p} Signature Package`,
        `${p} Essential Pick`, `${p} Everyday Value`,
        `${p} Great Value`, `${p} Super Value`,
        `${p} Amazing Deal`, `${p} Fantastic Offer`,
      ],

      // ===== YOUR PACKAGE =====
      yourPackage: {
        EN: [
          `You are subscribed to ${p}. Enjoy your package benefits.`,
          `${p} is active on your account. Make the most of it!`,
          `Thanks for choosing ${p}. Your benefits are ready.`,
          `Your current package is ${p}. Enjoy every moment.`,
          `${p} is yours! Enjoy all the perks included.`,
          `Welcome to ${p}. Your plan is now fully active.`,
          `${p} is up and running for you. Enjoy the ride!`,
          `You're on ${p}. All features are unlocked and ready.`,
          `${p}: Your subscription is confirmed and live.`,
          `Great choice! ${p} is now your active package.`,
          `${p} loaded! Time to enjoy everything it offers.`,
          `Your ${p} plan is in full effect. Enjoy!`,
          `${p} is running smoothly on your account.`,
          `You're all set with ${p}. Start using your benefits now.`,
          `${p} activated. Take full advantage of your plan.`,
          `Everything's ready with ${p}. Go ahead and explore!`,
          `${p} – live and loaded just for you.`,
          `Your account now features ${p}. Enjoy the perks!`,
          `${p}: all systems go. Your benefits await.`,
          `Sit back and enjoy ${p}. It's all set for you!`,
          `Congratulations! ${p} is now your active package.`,
          `${p} is live on your account. Enjoy every benefit!`,
          `You're all signed up for ${p}. Let the good times roll!`,
          `${p} has been added to your account. Enjoy!`,
          `Your ${p} subscription is ready. Time to celebrate!`,
          `Welcome to the ${p} experience. You're going to love it!`,
          `${p} is now yours to enjoy. Make every day count!`,
          `You've got ${p} on your side. Enjoy the journey!`,
          `${p} is activated and waiting for you. Dive right in!`,
          `Success! ${p} is now part of your account. Enjoy!`,
        ],
        TH: [
          `คุณกำลังใช้งาน ${p} ขอให้เพลิดเพลินกับสิทธิประโยชน์`,
          `${p} เปิดใช้งานแล้วบนบัญชีของคุณ ใช้ให้คุ้มค่า!`,
          `ขอบคุณที่เลือก ${p} สิทธิประโยชน์พร้อมแล้วสำหรับคุณ`,
          `แพ็กเกจปัจจุบันของคุณคือ ${p} ขอให้สนุกกับทุกช่วงเวลา`,
          `${p} เป็นของคุณแล้ว! เพลิดเพลินกับสิทธิพิเศษทั้งหมด`,
          `ยินดีต้อนรับสู่ ${p} แผนของคุณเปิดใช้งานเต็มรูปแบบแล้ว`,
          `${p} พร้อมให้บริการคุณแล้ว ขอให้สนุกกับการใช้งาน!`,
          `คุณอยู่บน ${p} ฟีเจอร์ทั้งหมดพร้อมใช้งานแล้ว`,
          `${p}: การสมัครของคุณยืนยันและมีผลแล้ว`,
          `เลือกได้ดีมาก! ${p} คือแพ็กเกจที่ใช้งานอยู่ของคุณ`,
          `โหลด ${p} แล้ว! ถึงเวลาเพลิดเพลินกับทุกสิ่งที่มีให้`,
          `แผน ${p} ของคุณมีผลสมบูรณ์แล้ว ขอให้สนุก!`,
          `${p} ทำงานได้อย่างราบรื่นบนบัญชีของคุณ`,
          `คุณพร้อมแล้วกับ ${p} เริ่มใช้สิทธิพิเศษของคุณได้เลย`,
          `${p} เปิดใช้งานแล้ว ใช้ประโยชน์จากแผนของคุณให้เต็มที่`,
          `ทุกอย่างพร้อมแล้วกับ ${p} ไปสำรวจได้เลย!`,
          `${p} – พร้อมและโหลดเพื่อคุณโดยเฉพาะ`,
          `บัญชีของคุณมี ${p} แล้ว เพลิดเพลินกับสิทธิพิเศษ!`,
          `${p}: ระบบพร้อมทั้งหมด สิทธิประโยชน์รอคุณอยู่`,
          `นั่งสบายๆ และเพลิดเพลินกับ ${p} ทุกอย่างพร้อมแล้วสำหรับคุณ!`,
          `ยินดีด้วย! ${p} คือแพ็กเกจที่ใช้งานอยู่ของคุณแล้ว`,
          `${p} เปิดใช้งานบนบัญชีของคุณแล้ว เพลิดเพลินกับทุกสิทธิประโยชน์!`,
          `คุณสมัคร ${p} เรียบร้อยแล้ว ให้ความสนุกมาเยือน!`,
          `${p} ถูกเพิ่มในบัญชีของคุณแล้ว ขอให้สนุก!`,
          `การสมัคร ${p} ของคุณพร้อมแล้ว ถึงเวลาฉลอง!`,
          `ยินดีต้อนรับสู่ประสบการณ์ ${p} คุณจะต้องรักมันแน่`,
          `${p} เป็นของคุณแล้ว ทำให้ทุกวันมีค่า!`,
          `คุณมี ${p} อยู่เคียงข้างคุณ ขอให้สนุกกับการเดินทาง!`,
          `${p} เปิดใช้งานและรอคุณอยู่ ลงมือได้เลย!`,
          `สำเร็จ! ${p} เป็นส่วนหนึ่งของบัญชีคุณแล้ว ขอให้สนุก!`,
        ],
      },

      // ===== GREETING LETTER =====
      greetingLetter: {
        EN: [
          `Dear customer thank you for subscribing to ${p}`,
          `Hello We are glad you have chosen ${p} Welcome aboard`,
          `Dear valued customer your ${p} subscription is confirmed`,
          `Hi there ${p} is now ready for your use Enjoy`,
          `Welcome We are excited to have you on ${p}`,
          `Dear customer your ${p} plan is now active Enjoy`,
          `Hello and welcome to ${p} We are happy you are here`,
          `Greetings Thank you for activating ${p} with us`,
          `Dear subscriber ${p} is live on your account Enjoy`,
          `Hi We are delighted to welcome you to ${p}`,
          `Dear customer it is great to have you on ${p}`,
          `Hello Your ${p} journey starts now We are with you`,
          `Welcome to ${p} dear customer Great things ahead`,
          `Dear customer we are thrilled you chose ${p}`,
          `Hello ${p} is fully active Enjoy everything it brings`,
          `Greetings dear customer ${p} is ready for you`,
          `Hi and welcome ${p} is your plan starting today`,
          `Dear customer enjoy every bit of ${p} We are here for you`,
          `Hello Welcome to the ${p} family We are glad you are here`,
          `Dear customer ${p} is on Sit back and enjoy the benefits`,
          `Dear customer welcome to ${p} Let the adventure begin`,
          `Hello Thank you for trusting ${p} with your connectivity`,
          `Dear valued customer ${p} is now at your fingertips`,
          `Greetings Your ${p} package is ready to change your day`,
          `Dear customer we are honored to have you on ${p}`,
          `Hello ${p} is here to make your life easier and better`,
          `Dear subscriber welcome to the world of ${p} Enjoy`,
          `Hi ${p} is officially yours We are excited for you`,
          `Dear customer your journey with ${p} starts today Enjoy`,
          `Welcome aboard ${p} will take you further than ever before`,
        ],
        TH: [
          `เรียนลูกค้า ขอบคุณที่สมัครใช้บริการ ${p}`,
          `สวัสดี ดีใจที่คุณเลือก ${p} ยินดีต้อนรับ`,
          `เรียนลูกค้าที่มีคุณค่า การสมัคร ${p} ของคุณได้รับการยืนยันแล้ว`,
          `สวัสดี ${p} พร้อมใช้งานสำหรับคุณแล้ว ขอให้สนุก`,
          `ยินดีต้อนรับ เรายินดีที่คุณเป็นส่วนหนึ่งของ ${p}`,
          `เรียนลูกค้า แผน ${p} ของคุณเปิดใช้งานแล้ว ขอให้สนุก`,
          `สวัสดีและยินดีต้อนรับสู่ ${p} เรายินดีที่คุณมาอยู่ที่นี่`,
          `ขอทักทาย ขอบคุณที่เปิดใช้งาน ${p} กับเรา`,
          `เรียนสมาชิก ${p} มีผลบนบัญชีของคุณแล้ว ขอให้สนุก`,
          `สวัสดี เรายินดีที่ได้ต้อนรับคุณสู่ ${p}`,
          `เรียนลูกค้า ดีใจที่คุณอยู่บน ${p}`,
          `สวัสดี การเดินทางกับ ${p} ของคุณเริ่มแล้ว เราอยู่เคียงข้างคุณ`,
          `ยินดีต้อนรับสู่ ${p} เรียนลูกค้า สิ่งดีๆ กำลังรออยู่ข้างหน้า`,
          `เรียนลูกค้า เรารู้สึกตื่นเต้นที่คุณเลือก ${p}`,
          `สวัสดี ${p} เปิดใช้งานเต็มที่แล้ว เพลิดเพลินกับทุกสิ่งที่มี`,
          `ขอทักทาย เรียนลูกค้า ${p} พร้อมสำหรับคุณแล้ว`,
          `สวัสดีและยินดีต้อนรับ ${p} คือแผนของคุณตั้งแต่วันนี้เป็นต้นไป`,
          `เรียนลูกค้า ขอให้เพลิดเพลินกับทุกส่วนของ ${p} เราอยู่เคียงข้างคุณ`,
          `สวัสดี ยินดีต้อนรับสู่ครอบครัว ${p} เรายินดีที่คุณมาอยู่ที่นี่`,
          `เรียนลูกค้า ${p} เปิดแล้ว นั่งสบายๆ และเพลิดเพลินกับสิทธิพิเศษ`,
          `เรียนลูกค้า ยินดีต้อนรับสู่ ${p} ให้การผจญภัยเริ่มต้นขึ้น`,
          `สวัสดี ขอบคุณที่ไว้วางใจ ${p} ในการเชื่อมต่อของคุณ`,
          `เรียนลูกค้าที่มีคุณค่า ${p} อยู่แค่ปลายนิ้วคุณแล้ว`,
          `ขอทักทาย แพ็กเกจ ${p} ของคุณพร้อมที่จะเปลี่ยนวันของคุณ`,
          `เรียนลูกค้า เรารู้สึกเป็นเกียรติที่ได้มีคุณบน ${p}`,
          `สวัสดี ${p} อยู่ที่นี่เพื่อทำให้ชีวิตคุณง่ายขึ้นและดีขึ้น`,
          `เรียนสมาชิก ยินดีต้อนรับสู่โลกของ ${p} ขอให้สนุก`,
          `สวัสดี ${p} เป็นของคุณอย่างเป็นทางการแล้ว เราตื่นเต้นไปกับคุณ`,
          `เรียนลูกค้า การเดินทางกับ ${p} ของคุณเริ่มวันนี้ ขอให้สนุก`,
          `ยินดีต้อนรับ ${p} จะพาคุณไปได้ไกลกว่าที่เคย`,
        ],
      },
    };
    // ==================== END WORDING POOLS ====================

    // ==================== SECTION 1: Short Promotion Name ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('textarea[formcontrolname="shortPromotionName"]').length > 0) {
        scrollToElement('textarea[formcontrolname="shortPromotionName"]', 'Short Promotion Name');
        cy.get('textarea[formcontrolname="shortPromotionName"]').then(($els: any) => {
          cy.wrap($els[0]).clear({ force: true }).type(limitAndCleanEN(pickRandom(wordingPools.shortPromotionName.EN), 50), { delay: 0, force: true });
          if ($els.length > 1) {
            cy.wrap($els[1]).clear({ force: true }).type(limitAndCleanTH(pickRandom(wordingPools.shortPromotionName.TH), 50), { delay: 0, force: true });
          }
        });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 2: CMS Display ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('textarea[formcontrolname="cmsDisplay"]').length > 0) {
        scrollToElement('textarea[formcontrolname="cmsDisplay"]', 'CMS Display');
        cy.get('textarea[formcontrolname="cmsDisplay"]').then(($els: any) => {
          cy.wrap($els[0]).clear({ force: true }).type(limitAndCleanEN(pickRandom(wordingPools.cmsDisplay.EN), 250), { delay: 0, force: true });
          if ($els.length > 1) {
            cy.wrap($els[1]).clear({ force: true }).type(limitAndCleanTH(pickRandom(wordingPools.cmsDisplay.TH), 250), { delay: 0, force: true });
          }
        });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 3: Promotion Description ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('textarea[formcontrolname="promotionDescription"]').length > 0) {
        scrollToElement('textarea[formcontrolname="promotionDescription"]', 'Promotion Description');
        cy.get('textarea[formcontrolname="promotionDescription"]').then(($els: any) => {
          cy.wrap($els[0]).clear({ force: true }).type(limitAndCleanEN(pickRandom(wordingPools.promotionDescription.EN), 250), { delay: 0, force: true });
          if ($els.length > 1) {
            cy.wrap($els[1]).clear({ force: true }).type(limitAndCleanTH(pickRandom(wordingPools.promotionDescription.TH), 250), { delay: 0, force: true });
          }
        });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 4: SMS Check Current ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('textarea[formcontrolname="smsCheckCurrent"]').length > 0) {
        scrollToElement('textarea[formcontrolname="smsCheckCurrent"]', 'SMS Check Current');
        cy.get('textarea[formcontrolname="smsCheckCurrent"]').eq(0).clear({ force: true }).type(limitAndCleanEN(pickRandom(wordingPools.smsCheckCurrent.EN), 50), { delay: 0, force: true });
        cy.get('textarea[formcontrolname="smsCheckCurrent"]').eq(1).clear({ force: true }).type(limitAndCleanTH(pickRandom(wordingPools.smsCheckCurrent.TH), 50), { delay: 0, force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 5: SMS Greeting ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsGreetingSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="smsGreetingSendFlag"]', 'SMS Greeting');
        cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(smsGreetingFlag, { force: true });

        if (smsGreetingFlag === 'Send') {
          cy.get('textarea[formcontrolname="smsGreeting"]').each(($el: any, idx: number) => {
            const text = idx === 0
              ? pickRandom(wordingPools.smsGreeting.EN)
              : pickRandom(wordingPools.smsGreeting.TH);
            const cleaned = idx === 0
              ? limitAndCleanEN(text, 400)
              : limitAndCleanTH(text, 400);
            cy.wrap($el).clear({ force: true }).type(cleaned, { delay: 0, force: true });
          });
        }
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 6: SMS Confirm Subscription (PRE only) ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').length > 0) {
        cy.get('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').select(smsGreetingFlag, { force: true });
      }
    });

    // ==================== SECTION 7: SMS Delete ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsDeleteSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="smsDeleteSendFlag"]', 'SMS Delete');
        cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(smsDeleteFlag, { force: true });
        cy.wait(WAIT_TIME);

        if (smsDeleteFlag === 'Send') {
          if (type === 'PRE') {
            cy.get('input[formcontrolname="smsDeleteDefaultWordingFlag"]').then(($radios: any) => {
              if ($radios.length > 0) {
                const defaultOptions = ['Yes', 'No'];
                const randomDefaultVal = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];
                cy.wrap($radios).contains(randomDefaultVal).click({ force: true });
                cy.wait(WAIT_TIME);

                if (randomDefaultVal === 'No') {
                  cy.get('textarea[formcontrolname="smsDelete"]').then(($els: any) => {
                    // ENG - ต้อง clean พิเศษ (ไม่มีไทย, ไม่มี special chars)
                    const enText = pickRandom(wordingPools.smsDeletePRE.EN);
                    cy.wrap($els[0]).clear({ force: true }).type(limitAndCleanEN(enText, 250), { delay: 0, force: true });
                    if ($els.length > 1) {
                      const thText = pickRandom(wordingPools.smsDeletePRE.TH);
                      cy.wrap($els[1]).clear({ force: true }).type(limitAndCleanTH(thText, 250), { delay: 0, force: true });
                    }
                  });
                }
              }
            });
          } else {
            cy.get('textarea[formcontrolname="smsDelete"]').each(($el: any, idx: number) => {
              const text = idx === 0
                ? pickRandom(wordingPools.smsDeletePOST.EN)
                : pickRandom(wordingPools.smsDeletePOST.TH);
              const cleaned = idx === 0
                ? limitAndCleanEN(text, 250)
                : limitAndCleanTH(text, 250);
              cy.wrap($el).clear({ force: true }).type(cleaned, { delay: 0, force: true });
            });
          }
        }
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 8: Last Minute Alert ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="lastMinuteAlertSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="lastMinuteAlertSendFlag"]', 'Last Minute Alert');
        cy.get('select[formcontrolname="lastMinuteAlertSendFlag"]').select(lastMinuteVal, { force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 9: Before Fee Deduction ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsBeforeFeeDeductSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="smsBeforeFeeDeductSendFlag"]', 'Before Fee Deduction');
        cy.get('select[formcontrolname="smsBeforeFeeDeductSendFlag"]').select(beforeFeeDeductVal, { force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 10: Recurring Deduct Success ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="recurringDeductSuccessAlertSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="recurringDeductSuccessAlertSendFlag"]', 'Recurring Deduct Success');
        cy.get('select[formcontrolname="recurringDeductSuccessAlertSendFlag"]').select(deductSuccessVal, { force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 11: Recurring Deduct Fail ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="recurringDeductFailAlertSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="recurringDeductFailAlertSendFlag"]', 'Recurring Deduct Fail');
        cy.get('select[formcontrolname="recurringDeductFailAlertSendFlag"]').select(deductFailVal, { force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 12: SMS Promote Package ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsPromotePackSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="smsPromotePackSendFlag"]', 'SMS Promote Package');
        cy.get('select[formcontrolname="smsPromotePackSendFlag"]').select(smsPromotePackVal, { force: true });
        cy.wait(WAIT_TIME);

        if (smsPromotePackVal === 'Send') {
          cy.get('textarea[formcontrolname="smsPromotePack"]').each(($el: any, idx: number) => {
            if (idx === 0) {
              const enText = `Special offer! ${p} - Get it now`;
              cy.wrap($el).clear({ force: true }).type(limitAndCleanEN(enText, 250), { delay: 0, force: true });
            } else {
              const thText = `ข้อเสนอพิเศษ! ${p} - รับเลยตอนนี้`;
              cy.wrap($el).clear({ force: true }).type(limitAndCleanTH(thText, 250), { delay: 0, force: true });
            }
          });
        }
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 13: Before Promotion Expired ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="beforePromotionExpAlertSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="beforePromotionExpAlertSendFlag"]', 'Before Promotion Expired');
        cy.get('select[formcontrolname="beforePromotionExpAlertSendFlag"]').select(beforePromoVal, { force: true });
        cy.wait(WAIT_TIME);

        if (beforePromoVal === 'Send') {
          cy.get('input[formcontrolname="beforePromotionExpAlertDeduction"]')
            .clear({ force: true }).type(`${Cypress._.random(1, 30)}`, { force: true });

          cy.get('select[formcontrolname="beforePromotionExpAlertDeductionUnit"]').then(($select: any) => {
            const options = $select.find('option').toArray()
              .filter((opt: HTMLOptionElement) => opt.value && opt.value !== 'null' && !opt.disabled)
              .map((opt: HTMLOptionElement) => opt.value);
            if (options.length) {
              cy.wrap($select).select(Cypress._.sample(options), { force: true });
            }
          });
        }
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 14: Promotion Expired ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="promotionExpAlertSendFlag"]').length > 0) {
        scrollToElement('select[formcontrolname="promotionExpAlertSendFlag"]', 'Promotion Expired');
        cy.log(`Promotion Expired Alert Flag = ${promoExpVal} (mutually exclusive with Before Promotion)`);
        cy.get('select[formcontrolname="promotionExpAlertSendFlag"]').select(promoExpVal, { force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // ==================== SECTION 15: POST Only Fields ====================
    if (type === 'POST') {
      // Marketing Name (ต้องไม่เกิน 40 ตัว และ clean)
      cy.get('body').then(($body: any) => {
        if ($body.find('textarea[formcontrolname="marketingName"]').length > 0) {
          scrollToElement('textarea[formcontrolname="marketingName"]', 'Marketing Name');
          const rawText = pickRandom(wordingPools.marketingName);
          cy.get('textarea[formcontrolname="marketingName"]').clear({ force: true })
            .type(limitAndCleanEN(rawText, 40), { delay: 0, force: true });
          cy.wait(WAIT_TIME);
        }
      });

      // Your Package
      cy.get('body').then(($body: any) => {
        if ($body.find('textarea[formcontrolname="yourPackage"]').length > 0) {
          scrollToElement('textarea[formcontrolname="yourPackage"]', 'Your Package');
          cy.get('textarea[formcontrolname="yourPackage"]').each(($el: any, idx: number) => {
            const text = idx === 0
              ? pickRandom(wordingPools.yourPackage.EN)
              : pickRandom(wordingPools.yourPackage.TH);
            const cleaned = idx === 0
              ? limitAndCleanEN(text, 100)
              : limitAndCleanTH(text, 100);
            cy.wrap($el).clear({ force: true }).type(cleaned, { delay: 0, force: true });
          });
          cy.wait(WAIT_TIME);
        }
      });

      // Greeting Letter
      cy.get('body').then(($body: any) => {
        if ($body.find('textarea[formcontrolname="greetingLetter"]').length > 0) {
          scrollToElement('textarea[formcontrolname="greetingLetter"]', 'Greeting Letter');
          cy.get('textarea[formcontrolname="greetingLetter"]').each(($el: any, idx: number) => {
            const text = idx === 0
              ? pickRandom(wordingPools.greetingLetter.EN)
              : pickRandom(wordingPools.greetingLetter.TH);
            const cleaned = idx === 0
              ? limitAndCleanEN(text, 250)
              : limitAndCleanTH(text, 250);
            cy.wrap($el).clear({ force: true }).type(cleaned, { delay: 0, force: true });
          });
          cy.wait(WAIT_TIME);
        }
      });
    }

    // ==================== SAVE ====================
    cy.get('body').then(($body: any) => {
      if ($body.find('.container-fluid > :nth-child(3) > .btn').length > 0) {
        scrollToElement('.container-fluid > :nth-child(3) > .btn', 'Save Button');
        cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
        cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();
        cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
        closeSuccessModal();
      }
    });
  });
};

// ==================== EXPORT FUNCTIONS ====================
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
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.log('featureDescription');
};

export const smsCKSPOST = (): void => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(5000);

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
    cy.wait(1000);

    cy.get('select[formcontrolname="smsPromotePackSendFlag"]').then(($select) => {
      const currentValue = $select.val() as string;

      if (currentValue === 'Send') {
        cy.log('✅ SMS Promote Package = Send, filling messageCode');
        cy.get('input[formcontrolname="messageCode"]').type(randomMessageCode(), { force: true });
        cy.wait(1000);
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
// RANDOM REMARK
// ========================
export const RandomRemark = (
  projectName: string,
  poName: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  // ===== HELPER FUNCTIONS =====
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };
  const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
  const WAIT_TIME = 2000;

  const scrollToElement = (selector: string, sectionName: string) => {
    cy.log(`📌 Scrolling to: ${sectionName}`);
    cy.get(selector).first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(300);
  };

  // ==================== REMARK LOGIC ====================
  cy.get('body').then(($body: any) => {
    if ($body.find('textarea[formcontrolname="remark"]').length > 0) {
      scrollToElement('textarea[formcontrolname="remark"]', 'Remark');

      const shouldFillRemark = Math.random() < 0.8;

      if (shouldFillRemark) {
        const currentDate = new Date();
        const thaiDate = currentDate.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const engDate = currentDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        const currentTime = currentDate.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        const isoDate = currentDate.toISOString().split('T')[0];
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();

        // ใช้ค่าที่ส่งเข้ามา หรือค่า default
        const pName = projectName || 'New Package';
        const pOName = poName || 'Product Offering';
        const pType = priceType || 'recurring';
        const pClass = productClass || 'main';
        const sModule = subModule || 'POST';
        const mod = module || 'MOB';

        // ===== PRICE MAPPING =====
        const priceTypeDisplay: Record<string, { EN: string; TH: string }> = {
          'onetime': { EN: 'One-Time', TH: 'ครั้งเดียว' },
          'recurring': { EN: 'Recurring', TH: 'รายเดือน' },
          'usage': { EN: 'Usage-Based', TH: 'ตามการใช้งาน' }
        };
        const ptDisplay = priceTypeDisplay[pType] || { EN: pType, TH: pType };

        const productClassDisplay: Record<string, { EN: string; TH: string }> = {
          'main': { EN: 'Main Package', TH: 'แพ็กเกจหลัก' },
          'ontop': { EN: 'On-Top Package', TH: 'แพ็กเกจเสริม' },
          'ontopextra': { EN: 'On-Top Extra', TH: 'แพ็กเกจเสริมพิเศษ' }
        };
        const pcDisplay = productClassDisplay[pClass] || { EN: pClass, TH: pClass };

        const moduleDisplay: Record<string, { EN: string; TH: string }> = {
          'MOB': { EN: 'Mobile', TH: 'มือถือ' },
          'ENTER': { EN: 'Entertainment', TH: 'บันเทิง' },
          'MUSIC': { EN: 'Music', TH: 'เพลง' }
        };
        const modDisplay = moduleDisplay[mod] || { EN: mod, TH: mod };

        const subModuleDisplay: Record<string, { EN: string; TH: string }> = {
          'PRE': { EN: 'Prepaid', TH: 'เติมเงิน' },
          'POST': { EN: 'Postpaid', TH: 'รายเดือน' }
        };
        const smDisplay = subModuleDisplay[sModule] || { EN: sModule, TH: sModule };

        // ===== RANDOM VALUES FOR DIVERSITY =====
        const dataAllowance = pickRandom(['10GB', '30GB', '50GB', '100GB', '200GB', '500GB', 'Unlimited']);
        const speedTier = pickRandom(['10 Mbps', '100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '2 Gbps']);
        const priceAmount = randomInt(199, 1999);
        const contractMonths = pickRandom([1, 3, 6, 12, 24, 36]);
        const discountPercent = pickRandom([10, 15, 20, 25, 30, 40, 50]);
        const targetAgeMin = randomInt(18, 35);
        const targetAgeMax = randomInt(targetAgeMin + 10, 65);
        const launchQuarter = pickRandom(['Q1', 'Q2', 'Q3', 'Q4']) + ' ' + (currentDate.getFullYear() + pickRandom([0, 1]));
        const validityDays = pickRandom([1, 3, 7, 30, 90, 180, 365]);
        const subscriberTarget = pickRandom(['10K', '25K', '50K', '100K', '250K', '500K', '1M']);

        // ===== ENHANCED REMARK POOLS =====
        const remarkPools = {
          // ข้อความสั้น (1-2 บรรทัด)
          short: {
            EN: [
              `Initial setup for ${pName}.`,
              `Base configuration for ${pName} completed.`,
              `Price type set to ${ptDisplay.EN} for ${pName}.`,
              `Product class configured: ${pcDisplay.EN} - ${pName}.`,
              `PO created: ${pOName} for ${pName}.`,
              `${pName} ready for pricing configuration.`,
              `Bundle rules pending for ${pName}.`,
              `${pName} - awaiting commercial approval.`,
              `${pName} configured with standard parameters.`,
              `Market launch target for ${pName}: ${launchQuarter}.`,
              `${pName} added to ${smDisplay.EN} portfolio.`,
              `Auto-renewal enabled for ${pName}.`,
              `${pName} - data allowance: ${dataAllowance}.`,
              `${pName} - speed tier: ${speedTier}.`,
              `${pName} - monthly fee: ${priceAmount} THB.`,
              `${pName} - contract term: ${contractMonths} months.`,
              `${pName} - ${modDisplay.EN} ${smDisplay.EN} ${pcDisplay.EN}.`,
              `Created by: System Auto-Generation. Ref: ${randomId}.`,
              `${pName} - validity: ${validityDays} days.`,
              `${pName} - target: ${targetAgeMin}-${targetAgeMax} years.`,
              `Status: Draft - ${pName}.`,
              `Priority: High - ${pName} launch.`,
              `${pName} - channel readiness: In Progress.`,
              `${pName} - legal review: Pending.`,
              `${pName} - pricing approved: Tier ${pickRandom(['A', 'B', 'C', 'S'])}.`,
              `${pName} - network provisioning: Ready.`,
              `${pName} - billing integration: Complete.`,
              `${pName} - CRM sync: Scheduled.`,
              `${pName} - marketing assets: In Development.`,
              `${pName} - training materials: Pending.`,
            ],
            TH: [
              `ตั้งค่าเริ่มต้นสำหรับ ${pName}`,
              `กำหนดค่าพื้นฐาน ${pName} เรียบร้อย`,
              `กำหนดประเภทราคาเป็น ${ptDisplay.TH} สำหรับ ${pName}`,
              `กำหนดประเภทผลิตภัณฑ์: ${pcDisplay.TH} - ${pName}`,
              `สร้าง PO: ${pOName} สำหรับ ${pName}`,
              `${pName} พร้อมสำหรับการกำหนดราคา`,
              `รอกำหนดกฎบันเดิลสำหรับ ${pName}`,
              `${pName} - รออนุมัติเชิงพาณิชย์`,
              `${pName} กำหนดค่าด้วยพารามิเตอร์มาตรฐาน`,
              `เป้าหมายเปิดตัว ${pName}: ${launchQuarter}`,
              `${pName} เพิ่มในพอร์ตโฟลิโอ${smDisplay.TH}`,
              `เปิดใช้งานต่ออายุอัตโนมัติสำหรับ ${pName}`,
              `${pName} - ปริมาณเน็ต: ${dataAllowance}`,
              `${pName} - ความเร็ว: ${speedTier}`,
              `${pName} - ค่าบริการ: ${priceAmount} บาท`,
              `${pName} - ระยะสัญญา: ${contractMonths} เดือน`,
              `${pName} - ${modDisplay.TH} ${smDisplay.TH} ${pcDisplay.TH}`,
              `สร้างโดย: ระบบอัตโนมัติ อ้างอิง: ${randomId}`,
              `${pName} - อายุแพ็กเกจ: ${validityDays} วัน`,
              `${pName} - กลุ่มเป้าหมาย: ${targetAgeMin}-${targetAgeMax} ปี`,
              `สถานะ: ฉบับร่าง - ${pName}`,
              `ความสำคัญ: สูง - เปิดตัว ${pName}`,
              `${pName} - ความพร้อมช่องทาง: ระหว่างดำเนินการ`,
              `${pName} - ตรวจสอบกฎหมาย: รอดำเนินการ`,
              `${pName} - อนุมัติราคา: ระดับ ${pickRandom(['A', 'B', 'C', 'S'])}`,
              `${pName} - การตั้งค่าเครือข่าย: พร้อม`,
              `${pName} - เชื่อมต่อระบบบิล: เสร็จสิ้น`,
              `${pName} - เชื่อม CRM: ตามกำหนด`,
              `${pName} - สื่อการตลาด: ระหว่างพัฒนา`,
              `${pName} - เอกสารอบรม: รอดำเนินการ`,
            ],
          },

          // ข้อความกลาง (3-5 บรรทัด)
          medium: {
            EN: [
              `${pName} configuration in progress. Type: ${modDisplay.EN} ${smDisplay.EN} ${pcDisplay.EN}. Price: ${ptDisplay.EN} at ${priceAmount} THB/month. Data: ${dataAllowance} at ${speedTier}. PO: ${pOName}.`,
              `${pName} setup details: ${contractMonths}-month contract. Auto-renewal: Enabled. Credit check: Required for new customers. Deposit: ${pickRandom(['None', '1,000 THB', '3,000 THB'])} based on credit score.`,
              `${pName} pricing: Monthly ${priceAmount} THB (VAT incl). Activation: ${pickRandom(['Free', '100 THB'])}. Overage: Data ${randomInt(1, 5)} THB/MB, Voice ${randomInt(1, 3)} THB/min, SMS ${randomInt(2, 5)} THB/msg.`,
              `${pName} bundle eligibility: Compatible with ${pickRandom(['Video Streaming', 'Music Streaming', 'Cloud Storage', 'Security Suite'])} add-ons. Max ${randomInt(3, 10)} add-ons. Not compatible with other promos. PO: ${pOName}.`,
              `${pName} market positioning: ${smDisplay.EN} ${pcDisplay.EN} for ${modDisplay.EN}. Target: Age ${targetAgeMin}-${targetAgeMax}. USP: ${dataAllowance} data, ${speedTier} speed, 5G included. Launch: ${launchQuarter}.`,
              `${pName} technical specs: Supports 5G NSA/SA, VoLTE, VoWiFi, eSIM. Speed: Up to ${speedTier}. Video streaming: ${pickRandom(['1080p', '4K', '720p'])}. Fair usage: After ${dataAllowance}, speed reduced.`,
              `${pName} channel strategy: Available via ${pickRandom(['All Digital', 'Retail + Digital', 'Online Exclusive', 'All Channels'])}. Promotion: ${discountPercent}% off first ${randomInt(1, 6)} months.`,
              `${pName} lifecycle: ${pickRandom(['In Development', 'Pending Approval', 'Ready for UAT', 'Pre-Launch'])}. Expected launch: ${launchQuarter}. Post-launch review: ${randomInt(30, 90)} days. PO: ${pOName}.`,
              `${pName} provisioning: Activation within ${pickRandom(['2 hours', '24 hours', '1-3 days'])}. Port-in: Supported. eSIM: ${pickRandom(['Available', 'Coming Soon'])}. Temp number during port: Yes.`,
              `${pName} eligibility: Thai nationals & foreign residents with valid permit. Min age: 18. Credit threshold: ${randomInt(500, 700)}+. Alternative: ${randomInt(1000, 5000)} THB deposit.`,
              `${pName} bundle with ${pickRandom(['Entertainment Pack', 'Family Plan', 'Business Suite', 'Student Package'])}. Additional ${discountPercent}% discount on add-ons.`,
              `${pName} migration path: Existing customers on legacy plans can migrate with ${pickRandom(['fee waiver', 'bonus data', 'discount'])}.`,
            ],
            TH: [
              `กำลังกำหนดค่า ${pName} ประเภท: ${modDisplay.TH} ${smDisplay.TH} ${pcDisplay.TH}. ราคา: ${ptDisplay.TH} ${priceAmount} บาท/เดือน. เน็ต: ${dataAllowance} ความเร็ว ${speedTier}. PO: ${pOName}.`,
              `รายละเอียด ${pName}: สัญญา ${contractMonths} เดือน ต่ออายุอัตโนมัติ ตรวจสอบเครดิตสำหรับลูกค้าใหม่ เงินประกัน: ${pickRandom(['ไม่มี', '1,000 บาท', '3,000 บาท'])} ตามคะแนนเครดิต`,
              `ราคา ${pName}: ค่าบริการ ${priceAmount} บาท/เดือน (รวม VAT) ค่าเปิดใช้: ${pickRandom(['ฟรี', '100 บาท'])} ส่วนเกิน: เน็ต ${randomInt(1, 5)} บาท/MB โทร ${randomInt(1, 3)} บาท/นาที SMS ${randomInt(2, 5)} บาท/ข้อความ`,
              `สิทธิ์บันเดิล ${pName}: ใช้ร่วมกับ ${pickRandom(['สตรีมมิ่งวิดีโอ', 'สตรีมมิ่งเพลง', 'คลาวด์', 'ความปลอดภัย'])} ได้ สูงสุด ${randomInt(3, 10)} บริการเสริม PO: ${pOName}`,
              `ตำแหน่งตลาด ${pName}: ${smDisplay.TH} ${pcDisplay.TH} สำหรับ${modDisplay.TH} กลุ่มเป้าหมาย: ${targetAgeMin}-${targetAgeMax} ปี จุดขาย: เน็ต ${dataAllowance} ความเร็ว ${speedTier} รองรับ 5G เปิดตัว: ${launchQuarter}`,
              `สเปคเทคนิค ${pName}: รองรับ 5G NSA/SA, VoLTE, VoWiFi, eSIM ความเร็วสูงสุด ${speedTier} สตรีมมิ่ง: ${pickRandom(['1080p', '4K', '720p'])} FUP: หลัง ${dataAllowance} ลดความเร็ว`,
              `กลยุทธ์ช่องทาง ${pName}: จำหน่ายผ่าน ${pickRandom(['ดิจิทัล', 'ร้านค้า+ดิจิทัล', 'ออนไลน์เท่านั้น', 'ทุกช่องทาง'])} โปรโมชัน: ลด ${discountPercent}% ${randomInt(1, 6)} เดือนแรก`,
              `วงจรชีวิต ${pName}: ${pickRandom(['กำลังพัฒนา', 'รออนุมัติ', 'พร้อมทดสอบ', 'ก่อนเปิดตัว'])} คาดเปิดตัว: ${launchQuarter} ทบทวนหลังเปิด: ${randomInt(30, 90)} วัน PO: ${pOName}`,
              `การให้บริการ ${pName}: เปิดใช้ภายใน ${pickRandom(['2 ชม.', '24 ชม.', '1-3 วัน'])} รองรับย้ายค่าย eSIM: ${pickRandom(['พร้อม', 'เร็วๆ นี้'])} เบอร์ชั่วคราวระหว่างย้าย: มี`,
              `คุณสมบัติ ${pName}: สัญชาติไทย/ต่างด้าวมีใบอนุญาต อายุ 18+ เครดิต ${randomInt(500, 700)}+ ทางเลือก: วางประกัน ${randomInt(1000, 5000)} บาท`,
              `${pName} บันเดิลกับ ${pickRandom(['แพ็กบันเทิง', 'แพ็กครอบครัว', 'แพ็กธุรกิจ', 'แพ็กนักเรียน'])} ลดเพิ่ม ${discountPercent}% สำหรับบริการเสริม`,
              `${pName} เส้นทางย้าย: ลูกค้าเดิมสามารถย้ายจากแพ็กเกจเก่าโดย${pickRandom(['ยกเว้นค่าธรรมเนียม', 'รับเน็ตเพิ่ม', 'รับส่วนลด'])}`,
            ],
          },

          // ข้อความยาว (5+ บรรทัด รายละเอียดเยอะ)
          long: {
            EN: [
              `[${pName}] Comprehensive Configuration Summary\n` +
              `Package Type: ${modDisplay.EN} | ${smDisplay.EN} | ${pcDisplay.EN}\n` +
              `Price Model: ${ptDisplay.EN} - ${priceAmount} THB/month (VAT inclusive)\n` +
              `Data Allowance: ${dataAllowance} at ${speedTier} (5G where available)\n` +
              `Contract: ${contractMonths} months | Auto-Renewal: Yes | Early Termination: ${discountPercent}% of remaining\n` +
              `Credit Requirements: Score ${randomInt(500, 700)}+ or ${randomInt(1000, 5000)} THB deposit\n` +
              `Target Market: Age ${targetAgeMin}-${targetAgeMax} | ${pickRandom(['Urban', 'Suburban', 'Nationwide'])} | ${pickRandom(['Mass', 'Premium', 'Youth', 'Family'])} Segment\n` +
              `Launch Timeline: ${launchQuarter} | Subscriber Target: ${subscriberTarget} in first 3 months\n` +
              `PO Reference: ${pOName} | Product Code: PKG-${mod}-${sModule}-${timestamp.toString().slice(-6)}\n` +
              `Created: ${isoDate} | Status: ${pickRandom(['Draft', 'In Review', 'Pending Approval', 'Ready'])}`,

              `╔══════════════════════════════════════════════════════════════╗\n` +
              `║ ${pName} - Product Offering Documentation                     ║\n` +
              `╠══════════════════════════════════════════════════════════════╣\n` +
              `║ Category: ${modDisplay.EN.padEnd(20)} | Sub-Type: ${smDisplay.EN.padEnd(15)} | Class: ${pcDisplay.EN.padEnd(15)} ║\n` +
              `║ Price: ${(priceAmount + ' THB').padEnd(20)} | Billing: ${ptDisplay.EN.padEnd(15)} | Term: ${contractMonths} months`.padEnd(62) + `║\n` +
              `║ Data: ${dataAllowance.padEnd(20)} | Speed: ${speedTier.padEnd(15)} | 5G: Included`.padEnd(62) + `║\n` +
              `║ Voice: Unlimited (FUP: 10,000 mins) | SMS: 100 msgs | MMS: Extra`.padEnd(62) + `║\n` +
              `║ Add-ons: Up to 5 | Bundle Discount: ${discountPercent}% | Compatible: Streaming, Cloud`.padEnd(62) + `║\n` +
              `║ Target: Age ${targetAgeMin}-${targetAgeMax} | ARPU Target: ${priceAmount + randomInt(50, 200)} THB`.padEnd(62) + `║\n` +
              `║ Launch: ${launchQuarter.padEnd(20)} | Subscriber Goal: ${subscriberTarget}`.padEnd(62) + `║\n` +
              `║ PO: ${pOName}`.padEnd(62) + `║\n` +
              `║ Created: ${engDate} ${currentTime} | Ref: ${randomId}`.padEnd(62) + `║\n` +
              `╚══════════════════════════════════════════════════════════════╝`,

              `${pName} - Complete Product Specification\n` +
              `─────────────────────────────────────────────────\n` +
              `Product ID: PKG-${mod}-${sModule}-${pClass}-${timestamp.toString().slice(-8)}\n` +
              `Product Name: ${pName}\n` +
              `PO Name: ${pOName}\n` +
              `Module: ${mod} | Sub-Module: ${sModule} | Class: ${pClass}\n` +
              `Price Type: ${pType} | Monthly Fee: ${priceAmount} THB\n` +
              `─────────────────────────────────────────────────\n` +
              `Allowances:\n` +
              `  • Data: ${dataAllowance} @ ${speedTier}\n` +
              `  • Voice: Unlimited (FUP: 10,000 mins/month)\n` +
              `  • SMS: 100 messages/month\n` +
              `  • 5G Access: Included\n` +
              `─────────────────────────────────────────────────\n` +
              `Business Rules:\n` +
              `  • Auto-Renewal: Enabled\n` +
              `  • Grace Period: ${randomInt(3, 7)} days\n` +
              `  • Credit Limit: ${randomInt(2000, 10000)} THB\n` +
              `  • Barring Threshold: ${discountPercent}% of credit limit\n` +
              `─────────────────────────────────────────────────\n` +
              `Commercial Info:\n` +
              `  • Target Segment: Age ${targetAgeMin}-${targetAgeMax}\n` +
              `  • Launch Quarter: ${launchQuarter}\n` +
              `  • Subscriber Target: ${subscriberTarget}\n` +
              `  • Expected ARPU: ${priceAmount + randomInt(50, 200)} THB\n` +
              `─────────────────────────────────────────────────\n` +
              `System Integration:\n` +
              `  • CBS Product Code: ${pClass.toUpperCase()}_${sModule}_${randomInt(100, 999)}\n` +
              `  • CRM Eligibility: Credit Score >= ${randomInt(500, 700)}\n` +
              `  • Provisioning SLA: ${pickRandom(['2 hours', '24 hours', '1-3 days'])}\n` +
              `─────────────────────────────────────────────────\n` +
              `Created: ${thaiDate} | Updated: ${currentTime}\n` +
              `Document Ref: DOC-${randomId}-${timestamp.toString().slice(-4)}`,
            ],
            TH: [
              `[${pName}] สรุปการกำหนดค่าแบบครอบคลุม\n` +
              `ประเภทแพ็กเกจ: ${modDisplay.TH} | ${smDisplay.TH} | ${pcDisplay.TH}\n` +
              `รูปแบบราคา: ${ptDisplay.TH} - ${priceAmount} บาท/เดือน (รวมภาษีมูลค่าเพิ่ม)\n` +
              `ปริมาณเน็ต: ${dataAllowance} ความเร็ว ${speedTier} (รองรับ 5G)\n` +
              `สัญญา: ${contractMonths} เดือน | ต่ออายุอัตโนมัติ: ใช่ | ค่าธรรมเนียมยกเลิกก่อนกำหนด: ${discountPercent}% ของส่วนที่เหลือ\n` +
              `ข้อกำหนดเครดิต: คะแนน ${randomInt(500, 700)}+ หรือวางประกัน ${randomInt(1000, 5000)} บาท\n` +
              `กลุ่มเป้าหมาย: อายุ ${targetAgeMin}-${targetAgeMax} ปี | ${pickRandom(['ในเมือง', 'ชานเมือง', 'ทั่วประเทศ'])} | กลุ่ม${pickRandom(['ทั่วไป', 'พรีเมียม', 'วัยรุ่น', 'ครอบครัว'])}\n` +
              `แผนเปิดตัว: ${launchQuarter} | เป้าหมายสมาชิก: ${subscriberTarget} ใน 3 เดือนแรก\n` +
              `PO อ้างอิง: ${pOName} | รหัสผลิตภัณฑ์: PKG-${mod}-${sModule}-${timestamp.toString().slice(-6)}\n` +
              `สร้างเมื่อ: ${thaiDate} | สถานะ: ${pickRandom(['ฉบับร่าง', 'อยู่ระหว่างตรวจสอบ', 'รออนุมัติ', 'พร้อม'])}`,

              `╔══════════════════════════════════════════════════════════════╗\n` +
              `║ ${pName} - เอกสารผลิตภัณฑ์                                   ║\n` +
              `╠══════════════════════════════════════════════════════════════╣\n` +
              `║ ประเภท: ${modDisplay.TH.padEnd(15)} | รูปแบบ: ${smDisplay.TH.padEnd(10)} | ระดับ: ${pcDisplay.TH.padEnd(10)} ║\n` +
              `║ ราคา: ${(priceAmount + ' บาท').padEnd(15)} | การเรียกเก็บ: ${ptDisplay.TH.padEnd(12)} | สัญญา: ${contractMonths} ด.`.padEnd(62) + `║\n` +
              `║ เน็ต: ${dataAllowance.padEnd(15)} | ความเร็ว: ${speedTier.padEnd(12)} | 5G: รวม`.padEnd(62) + `║\n` +
              `║ โทร: ไม่จำกัด (FUP: 10,000 นาที) | SMS: 100 ข้อความ | MMS: เพิ่มเติม`.padEnd(62) + `║\n` +
              `║ บริการเสริม: สูงสุด 5 รายการ | ส่วนลดบันเดิล: ${discountPercent}% | ใช้ร่วมกับ: สตรีมมิ่ง, คลาวด์`.padEnd(62) + `║\n` +
              `║ กลุ่มเป้าหมาย: ${targetAgeMin}-${targetAgeMax} ปี | เป้าหมาย ARPU: ${priceAmount + randomInt(50, 200)} บาท`.padEnd(62) + `║\n` +
              `║ เปิดตัว: ${launchQuarter.padEnd(15)} | เป้าหมายสมาชิก: ${subscriberTarget}`.padEnd(62) + `║\n` +
              `║ PO: ${pOName}`.padEnd(62) + `║\n` +
              `║ สร้าง: ${thaiDate} | อ้างอิง: ${randomId}`.padEnd(62) + `║\n` +
              `╚══════════════════════════════════════════════════════════════╝`,

              `${pName} - ข้อมูลจำเพาะผลิตภัณฑ์ฉบับสมบูรณ์\n` +
              `─────────────────────────────────────────────────\n` +
              `รหัสผลิตภัณฑ์: PKG-${mod}-${sModule}-${pClass}-${timestamp.toString().slice(-8)}\n` +
              `ชื่อผลิตภัณฑ์: ${pName}\n` +
              `ชื่อ PO: ${pOName}\n` +
              `โมดูล: ${mod} | โมดูลย่อย: ${sModule} | ประเภท: ${pClass}\n` +
              `ประเภทราคา: ${pType} | ค่าบริการรายเดือน: ${priceAmount} บาท\n` +
              `─────────────────────────────────────────────────\n` +
              `สิทธิ์การใช้งาน:\n` +
              `  • เน็ต: ${dataAllowance} @ ${speedTier}\n` +
              `  • โทร: ไม่จำกัด (FUP: 10,000 นาที/เดือน)\n` +
              `  • SMS: 100 ข้อความ/เดือน\n` +
              `  • 5G: รวมในแพ็กเกจ\n` +
              `─────────────────────────────────────────────────\n` +
              `กฎทางธุรกิจ:\n` +
              `  • ต่ออายุอัตโนมัติ: เปิดใช้งาน\n` +
              `  • ระยะผ่อนผัน: ${randomInt(3, 7)} วัน\n` +
              `  • วงเงินเครดิต: ${randomInt(2000, 10000)} บาท\n` +
              `  • เกณฑ์ระงับบริการ: ${discountPercent}% ของวงเงินเครดิต\n` +
              `─────────────────────────────────────────────────\n` +
              `ข้อมูลเชิงพาณิชย์:\n` +
              `  • กลุ่มเป้าหมาย: อายุ ${targetAgeMin}-${targetAgeMax} ปี\n` +
              `  • ไตรมาสเปิดตัว: ${launchQuarter}\n` +
              `  • เป้าหมายสมาชิก: ${subscriberTarget}\n` +
              `  • ARPU คาดการณ์: ${priceAmount + randomInt(50, 200)} บาท\n` +
              `─────────────────────────────────────────────────\n` +
              `การเชื่อมต่อระบบ:\n` +
              `  • รหัส CBS: ${pClass.toUpperCase()}_${sModule}_${randomInt(100, 999)}\n` +
              `  • เงื่อนไข CRM: คะแนนเครดิต >= ${randomInt(500, 700)}\n` +
              `  • SLA การเปิดบริการ: ${pickRandom(['2 ชั่วโมง', '24 ชั่วโมง', '1-3 วัน'])}\n` +
              `─────────────────────────────────────────────────\n` +
              `สร้างเมื่อ: ${thaiDate} | อัปเดตล่าสุด: ${currentTime} น.\n` +
              `เอกสารอ้างอิง: DOC-${randomId}-${timestamp.toString().slice(-4)}`,
            ],
          },
        };

        const packageMetadata = {
          devStatus: {
            EN: ['Draft', 'In Development', 'Pending Approval', 'Ready for UAT', 'Production Ready', 'Launched', 'Grandfathered', 'Deprecated'],
            TH: ['ฉบับร่าง', 'กำลังพัฒนา', 'รออนุมัติ', 'พร้อมทดสอบ', 'พร้อมใช้งานจริง', 'เปิดตัวแล้ว', 'สำหรับลูกค้าเดิม', 'ยกเลิกแล้ว'],
          },
          billingType: {
            EN: ['Recurring - Monthly', 'Recurring - Prepaid', 'One-Time', 'Usage-Based', 'Hybrid', 'Tiered', 'Volume-Based'],
            TH: ['รายเดือน', 'เติมเงิน', 'ครั้งเดียว', 'ตามการใช้งาน', 'แบบผสม', 'ตามระดับ', 'ตามปริมาณ'],
          },
          targetSegment: {
            EN: ['Mass Market', 'Youth', 'Family', 'Business', 'Premium', 'Entry-Level', 'Senior', 'Student', 'SME', 'Enterprise', 'Tourist'],
            TH: ['ตลาดทั่วไป', 'วัยรุ่น', 'ครอบครัว', 'ธุรกิจ', 'พรีเมียม', 'ระดับเริ่มต้น', 'ผู้สูงอายุ', 'นักศึกษา', 'SME', 'องค์กร', 'นักท่องเที่ยว'],
          },
          contractTerm: {
            EN: ['No Contract', '3 Months', '6 Months', '12 Months', '24 Months', '36 Months', 'Month-to-Month'],
            TH: ['ไม่มีสัญญา', '3 เดือน', '6 เดือน', '12 เดือน', '24 เดือน', '36 เดือน', 'รายเดือน'],
          },
          approvalStatus: {
            EN: ['Product Committee: Approved', 'Product Committee: Pending', 'Pricing Committee: Approved', 'Pricing Committee: Pending', 'Legal: Approved', 'Legal: Under Review', 'Compliance: Approved', 'Risk: Approved', 'Risk: Pending', 'Finance: Approved'],
            TH: ['คณะกรรมการผลิตภัณฑ์: อนุมัติ', 'คณะกรรมการผลิตภัณฑ์: รอดำเนินการ', 'คณะกรรมการราคา: อนุมัติ', 'คณะกรรมการราคา: รอดำเนินการ', 'ฝ่ายกฎหมาย: อนุมัติ', 'ฝ่ายกฎหมาย: ระหว่างตรวจสอบ', 'ฝ่ายกำกับดูแล: อนุมัติ', 'ฝ่ายความเสี่ยง: อนุมัติ', 'ฝ่ายความเสี่ยง: รอดำเนินการ', 'ฝ่ายการเงิน: อนุมัติ'],
          },
          salesChannel: {
            EN: ['Digital Only', 'All Channels', 'Retail Exclusive', 'Online Exclusive', 'Telesales', 'Partner Network', 'Direct Sales', 'App Exclusive'],
            TH: ['ดิจิทัลเท่านั้น', 'ทุกช่องทาง', 'เฉพาะร้านค้า', 'เฉพาะออนไลน์', 'การขายทางโทรศัพท์', 'เครือข่ายพันธมิตร', 'การขายตรง', 'เฉพาะแอป'],
          },
          creditTier: {
            EN: ['Tier 1: No Deposit', 'Tier 2: 1,000 THB', 'Tier 3: 3,000 THB', 'Tier 4: 5,000 THB', 'Tier 5: 10,000 THB', 'Prepaid Only'],
            TH: ['ระดับ 1: ไม่มีเงินประกัน', 'ระดับ 2: 1,000 บาท', 'ระดับ 3: 3,000 บาท', 'ระดับ 4: 5,000 บาท', 'ระดับ 5: 10,000 บาท', 'เฉพาะเติมเงิน'],
          },
          priority: {
            EN: ['Critical', 'High', 'Medium', 'Low', 'Standard'],
            TH: ['วิกฤต', 'สูง', 'ปานกลาง', 'ต่ำ', 'มาตรฐาน'],
          },
          networkType: {
            EN: ['5G NSA/SA', '4G LTE', '5G Only', '4G/5G Hybrid', 'WiFi Calling Ready'],
            TH: ['5G NSA/SA', '4G LTE', '5G เท่านั้น', '4G/5G ผสม', 'พร้อม WiFi Calling'],
          },
        };

        // สุ่มประเภทความยาว (ปรับสัดส่วนให้หลากหลาย)
        const lengthType = (() => {
          const rand = Math.random();
          if (rand < 0.25) return 'short';      // 25% สั้น
          if (rand < 0.60) return 'medium';     // 35% กลาง
          return 'long';                         // 40% ยาว
        })();

        // สุ่มภาษา
        const useThai = Math.random() < 0.5;

        // เลือกข้อความหลัก (บางครั้งสุ่มเลือกหลายข้อความมา combine)
        let remarkText: string;
        const shouldCombine = lengthType === 'long' && Math.random() < 0.3;

        if (shouldCombine && !useThai) {
          // Combine multiple medium texts for extra long variety
          const texts = pickMultiple(remarkPools.medium.EN, randomInt(2, 3));
          remarkText = texts.join('\n\n---\n\n');
        } else if (shouldCombine && useThai) {
          const texts = pickMultiple(remarkPools.medium.TH, randomInt(2, 3));
          remarkText = texts.join('\n\n---\n\n');
        } else {
          if (useThai) {
            remarkText = pickRandom(remarkPools[lengthType].TH);
          } else {
            remarkText = pickRandom(remarkPools[lengthType].EN);
          }
        }

        // เพิ่ม Metadata (ปรับความน่าจะเป็นตามความยาว)
        const addMetadataProb = lengthType === 'short' ? 0.6 : (lengthType === 'medium' ? 0.8 : 0.9);
        const addMetadata = Math.random() < addMetadataProb;

        if (addMetadata) {
          const metadataLines: string[] = [];
          const metaCount = lengthType === 'short' ? randomInt(1, 2) : (lengthType === 'medium' ? randomInt(2, 4) : randomInt(3, 6));
          const usedTypes = new Set<string>();

          const availableMetaTypes = ['devStatus', 'billingType', 'targetSegment', 'contractTerm',
            'approvalStatus', 'salesChannel', 'creditTier', 'priority', 'networkType', 'po', 'ref', 'version'];

          for (let i = 0; i < metaCount; i++) {
            const availableTypes = availableMetaTypes.filter(t => !usedTypes.has(t));
            if (availableTypes.length === 0) break;

            const metaType = pickRandom(availableTypes);
            usedTypes.add(metaType);

            if (useThai) {
              switch (metaType) {
                case 'devStatus':
                  metadataLines.push(`สถานะการพัฒนา: ${pickRandom(packageMetadata.devStatus.TH)}`);
                  break;
                case 'billingType':
                  metadataLines.push(`ประเภทการเรียกเก็บ: ${pickRandom(packageMetadata.billingType.TH)}`);
                  break;
                case 'targetSegment':
                  metadataLines.push(`กลุ่มเป้าหมาย: ${pickRandom(packageMetadata.targetSegment.TH)}`);
                  break;
                case 'contractTerm':
                  metadataLines.push(`ระยะสัญญา: ${pickRandom(packageMetadata.contractTerm.TH)}`);
                  break;
                case 'approvalStatus':
                  metadataLines.push(`${pickRandom(packageMetadata.approvalStatus.TH)}`);
                  break;
                case 'salesChannel':
                  metadataLines.push(`ช่องทางการขาย: ${pickRandom(packageMetadata.salesChannel.TH)}`);
                  break;
                case 'creditTier':
                  metadataLines.push(`เกณฑ์เครดิต: ${pickRandom(packageMetadata.creditTier.TH)}`);
                  break;
                case 'priority':
                  metadataLines.push(`ระดับความสำคัญ: ${pickRandom(packageMetadata.priority.TH)}`);
                  break;
                case 'networkType':
                  metadataLines.push(`ประเภทรองรับเครือข่าย: ${pickRandom(packageMetadata.networkType.TH)}`);
                  break;
                case 'po':
                  metadataLines.push(`PO: ${pOName}`);
                  break;
                case 'ref':
                  metadataLines.push(`รหัสผลิตภัณฑ์: PKG-${mod}-${sModule}-${randomInt(1000, 9999)}-${String.fromCharCode(65 + randomInt(0, 25))}`);
                  break;
                case 'version':
                  metadataLines.push(`เวอร์ชัน: ${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 9)}`);
                  break;
              }
            } else {
              switch (metaType) {
                case 'devStatus':
                  metadataLines.push(`Development Status: ${pickRandom(packageMetadata.devStatus.EN)}`);
                  break;
                case 'billingType':
                  metadataLines.push(`Billing Type: ${pickRandom(packageMetadata.billingType.EN)}`);
                  break;
                case 'targetSegment':
                  metadataLines.push(`Target Segment: ${pickRandom(packageMetadata.targetSegment.EN)}`);
                  break;
                case 'contractTerm':
                  metadataLines.push(`Contract Term: ${pickRandom(packageMetadata.contractTerm.EN)}`);
                  break;
                case 'approvalStatus':
                  metadataLines.push(`${pickRandom(packageMetadata.approvalStatus.EN)}`);
                  break;
                case 'salesChannel':
                  metadataLines.push(`Sales Channel: ${pickRandom(packageMetadata.salesChannel.EN)}`);
                  break;
                case 'creditTier':
                  metadataLines.push(`Credit Tier: ${pickRandom(packageMetadata.creditTier.EN)}`);
                  break;
                case 'priority':
                  metadataLines.push(`Priority: ${pickRandom(packageMetadata.priority.EN)}`);
                  break;
                case 'networkType':
                  metadataLines.push(`Network Support: ${pickRandom(packageMetadata.networkType.EN)}`);
                  break;
                case 'po':
                  metadataLines.push(`PO: ${pOName}`);
                  break;
                case 'ref':
                  metadataLines.push(`Product Code: PKG-${mod}-${sModule}-${randomInt(1000, 9999)}-${String.fromCharCode(65 + randomInt(0, 25))}`);
                  break;
                case 'version':
                  metadataLines.push(`Version: ${randomInt(1, 5)}.${randomInt(0, 9)}.${randomInt(0, 9)}`);
                  break;
              }
            }
          }

          if (metadataLines.length > 0) {
            const separator = lengthType === 'short' ? ' | ' : '\n';
            const prefix = lengthType === 'short' ? ' | ' : (useThai ? '\n\nข้อมูลเพิ่มเติม:\n' : '\n\nAdditional Information:\n');

            if (lengthType === 'short') {
              remarkText += prefix + metadataLines.join(separator);
            } else {
              remarkText += prefix + metadataLines.map(l => `  • ${l}`).join('\n');
            }
          }
        }

        // เพิ่ม Timestamp (ปรับตามความยาว)
        const addTimestampProb = lengthType === 'short' ? 0.3 : 0.6;
        if (Math.random() < addTimestampProb) {
          const separator = lengthType === 'short' ? ' ' : '\n\n';
          if (useThai) {
            remarkText += `${separator}[บันทึก: ${thaiDate}]`;
          } else {
            remarkText += `${separator}[Recorded: ${engDate} ${currentTime}]`;
          }
        }

        // ตรวจสอบความยาวไม่เกิน 4000 ตัวอักษร
        if (remarkText.length > 4000) {
          remarkText = remarkText.substring(0, 3997) + '...';
        }

        // กรอกข้อความ
        cy.get('textarea[formcontrolname="remark"]')
          .clear({ force: true })
          .type(remarkText, { delay: 0, force: true });

        cy.log(`✅ Remark: ${remarkText.length} chars, ${useThai ? 'TH' : 'EN'}, ${lengthType}${shouldCombine ? ' (combined)' : ''}`);
      } else {
        cy.get('textarea[formcontrolname="remark"]').clear({ force: true });
        cy.log('⏭️ Remark skipped (20%)');
      }

      cy.wait(WAIT_TIME);
    }
  });
};

export const RandomProjectDescription = (
  projectName: string,
  poName?: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  // ===== HELPER FUNCTIONS =====
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
  const WAIT_TIME = 2000;

  const scrollToElement = (selector: string, sectionName: string) => {
    cy.log(`📌 Scrolling to: ${sectionName}`);
    cy.get(selector).first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(300);
  };

  // ==================== PROJECT DESCRIPTION LOGIC ====================
  cy.get('body').then(($body: any) => {
    if ($body.find('textarea[formcontrolname="projectDescription"]').length > 0) {
      scrollToElement('textarea[formcontrolname="projectDescription"]', 'Project Description');

      // สุ่มว่าจะกรอกหรือไม่ (85% กรอก, 15% ไม่กรอก)
      const shouldFill = Math.random() < 0.85;

      if (shouldFill) {
        // ใช้ค่าที่ส่งเข้ามา หรือค่า default
        const pName = projectName || 'New Package';
        const pOName = poName || 'Product Offering';
        const pType = priceType || 'recurring';
        const pClass = productClass || 'main';
        const sModule = subModule || 'POST';
        const mod = module || 'MOB';

        // ===== DISPLAY MAPPINGS =====
        const priceTypeDisplay: Record<string, { EN: string; TH: string }> = {
          'onetime': { EN: 'One-Time Charge', TH: 'ค่าบริการแบบครั้งเดียว' },
          'recurring': { EN: 'Monthly Recurring', TH: 'ค่าบริการรายเดือน' },
          'usage': { EN: 'Usage-Based', TH: 'คิดตามการใช้งานจริง' }
        };
        const ptDisplay = priceTypeDisplay[pType] || { EN: pType, TH: pType };

        const productClassDisplay: Record<string, { EN: string; TH: string }> = {
          'main': { EN: 'Main Package', TH: 'แพ็กเกจหลัก' },
          'ontop': { EN: 'On-Top Add-on', TH: 'แพ็กเกจเสริม' },
          'ontopextra': { EN: 'On-Top Extra', TH: 'แพ็กเกจเสริมพิเศษ' }
        };
        const pcDisplay = productClassDisplay[pClass] || { EN: pClass, TH: pClass };

        const moduleDisplay: Record<string, { EN: string; TH: string }> = {
          'MOB': { EN: 'Mobile Service', TH: 'บริการมือถือ' },
          'ENTER': { EN: 'Entertainment Service', TH: 'บริการความบันเทิง' },
          'MUSIC': { EN: 'Music Streaming', TH: 'บริการสตรีมมิ่งเพลง' }
        };
        const modDisplay = moduleDisplay[mod] || { EN: mod, TH: mod };

        const subModuleDisplay: Record<string, { EN: string; TH: string }> = {
          'PRE': { EN: 'Prepaid', TH: 'ระบบเติมเงิน' },
          'POST': { EN: 'Postpaid', TH: 'ระบบรายเดือน' }
        };
        const smDisplay = subModuleDisplay[sModule] || { EN: sModule, TH: sModule };

        // ===== RANDOM VALUES =====
        const dataVolume = pickRandom(['10GB', '30GB', '50GB', '100GB', '200GB', '300GB', '500GB', 'Unlimited']);
        const maxSpeed = pickRandom(['100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '2 Gbps', '5G Max Speed']);
        const priceAmount = randomInt(199, 2999);
        const validityPeriod = pickRandom(['1 Day', '7 Days', '30 Days', '90 Days', '180 Days', '365 Days']);
        const targetCustomers = pickRandom([
          'General Consumers', 'Young Professionals', 'Families', 'Students',
          'Business Users', 'Heavy Data Users', 'Budget-Conscious', 'Premium Segment',
          'Digital Natives', 'Urban Residents', 'Suburban Families', 'SME Owners'
        ]);
        const targetCustomersTH = pickRandom([
          'ลูกค้าทั่วไป', 'คนรุ่นใหม่วัยทำงาน', 'ครอบครัว', 'นักศึกษา',
          'กลุ่มธุรกิจ', 'ผู้ใช้งานเน็ตปริมาณมาก', 'กลุ่มประหยัด', 'กลุ่มพรีเมียม',
          'ชาวดิจิทัล', 'คนเมือง', 'ครอบครัวชานเมือง', 'เจ้าของธุรกิจขนาดย่อม'
        ]);
        const launchTiming = pickRandom(['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Early Next Year', 'This Quarter', 'Next Month']);
        const launchTimingTH = pickRandom(['ไตรมาส 1 ปี 2568', 'ไตรมาส 2 ปี 2568', 'ไตรมาส 3 ปี 2568', 'ไตรมาส 4 ปี 2568', 'ต้นปีหน้า', 'ไตรมาสนี้', 'เดือนหน้า']);
        const keyBenefit1 = pickRandom(['High-speed 5G', 'Unlimited Calls', 'Free Streaming', 'Rollover Data', 'Family Sharing', 'International Roaming']);
        const keyBenefit1TH = pickRandom(['5G ความเร็วสูง', 'โทรฟรีไม่อั้น', 'สตรีมมิ่งฟรี', 'ยกยอดเน็ตได้', 'แชร์ให้ครอบครัว', 'โรมมิ่งต่างประเทศ']);
        const keyBenefit2 = pickRandom(['No Contract', 'Free SIM', 'eSIM Support', 'Priority Support', 'Device Discount', 'Cashback']);
        const keyBenefit2TH = pickRandom(['ไม่มีสัญญา', 'ซิมฟรี', 'รองรับ eSIM', 'บริการพิเศษ', 'ส่วนลดเครื่อง', 'เงินคืน']);

        // ===== PROJECT DESCRIPTION POOLS =====
        const descriptionPools = {
          // แบบสั้น (1-2 ประโยค)
          short: {
            EN: [
              `${pName} is a ${smDisplay.EN} ${pcDisplay.EN.toLowerCase()} for ${modDisplay.EN.toLowerCase()} offering ${dataVolume} of high-speed data.`,
              `${pName}: ${modDisplay.EN} ${smDisplay.EN} ${pcDisplay.EN} featuring ${dataVolume} data and ${maxSpeed} speeds.`,
              `${pName} provides ${dataVolume} mobile data with ${maxSpeed} download speeds on ${smDisplay.EN.toLowerCase()} ${modDisplay.EN.toLowerCase()} service.`,
              `${pName} - ${modDisplay.EN} ${pcDisplay.EN} with ${priceTypeDisplay[pType]?.EN || pType} billing at ${priceAmount} THB.`,
              `${pName} delivers premium ${modDisplay.EN.toLowerCase()} experience with ${dataVolume} data allowance.`,
              `${pName}: Value-packed ${smDisplay.EN} package with ${keyBenefit1} and ${keyBenefit2}.`,
              `${pName} offers seamless connectivity with ${dataVolume} data and nationwide coverage.`,
              `${pName} is designed for ${targetCustomers} seeking reliable ${modDisplay.EN.toLowerCase()} service.`,
              `${pName} combines ${dataVolume} data, unlimited calls, and 5G access in one ${pcDisplay.EN.toLowerCase()}.`,
              `${pName} - The ultimate ${smDisplay.EN.toLowerCase()} solution for ${modDisplay.EN.toLowerCase()} users.`,
            ],
            TH: [
              `${pName} เป็น${pcDisplay.TH}${smDisplay.TH}สำหรับ${modDisplay.TH} มอบเน็ตความเร็วสูง ${dataVolume}`,
              `${pName}: ${modDisplay.TH} ${smDisplay.TH} ${pcDisplay.TH} พร้อมเน็ต ${dataVolume} ความเร็ว ${maxSpeed}`,
              `${pName} ให้บริการเน็ตมือถือ ${dataVolume} ความเร็วดาวน์โหลดสูงสุด ${maxSpeed} บน${modDisplay.TH}${smDisplay.TH}`,
              `${pName} - ${modDisplay.TH} ${pcDisplay.TH} คิดค่าบริการ${ptDisplay.TH} ${priceAmount} บาท`,
              `${pName} มอบประสบการณ์${modDisplay.TH}ระดับพรีเมียมด้วยปริมาณเน็ต ${dataVolume}`,
              `${pName}: แพ็กเกจ${smDisplay.TH}คุ้มค่า พร้อม${keyBenefit1TH}และ${keyBenefit2TH}`,
              `${pName} มอบการเชื่อมต่อที่ราบรื่นด้วยเน็ต ${dataVolume} และครอบคลุมทั่วประเทศ`,
              `${pName} ออกแบบมาสำหรับ${targetCustomersTH}ที่ต้องการ${modDisplay.TH}ที่เชื่อถือได้`,
              `${pName} รวมเน็ต ${dataVolume} โทรฟรี และการเข้าถึง 5G ใน${pcDisplay.TH}เดียว`,
              `${pName} - โซลูชัน${smDisplay.TH}ขั้นสุดสำหรับผู้ใช้${modDisplay.TH}`,
            ],
          },

          // แบบกลาง (3-4 ประโยค)
          medium: {
            EN: [
              `${pName} is a ${smDisplay.EN} ${pcDisplay.EN} for ${modDisplay.EN} customers. This package includes ${dataVolume} of high-speed data at up to ${maxSpeed}, unlimited on-net calls, and 5G network access at no additional cost. Priced at ${priceAmount} THB/month with ${ptDisplay.EN.toLowerCase()} billing.`,

              `${pName} offers exceptional value for ${targetCustomers}. The package features ${dataVolume} data allowance, ${keyBenefit1}, and ${keyBenefit2}. Available on ${smDisplay.EN} ${modDisplay.EN} with flexible ${validityPeriod} validity options. Monthly fee: ${priceAmount} THB.`,

              `${pName} is designed to meet the needs of modern ${modDisplay.EN.toLowerCase()} users. Subscribers enjoy ${dataVolume} of 5G data, unlimited voice calls, and access to exclusive promotions. This ${pcDisplay.EN.toLowerCase()} operates on ${smDisplay.EN.toLowerCase()} billing with auto-renewal capability.`,

              `${pName} - A comprehensive ${modDisplay.EN.toLowerCase()} solution featuring ${dataVolume} data (${maxSpeed}), unlimited calls, and premium support. Ideal for ${targetCustomers} seeking reliable connectivity. ${ptDisplay.EN} at ${priceAmount} THB per billing cycle.`,

              `${pName} brings together speed, value, and flexibility. With ${dataVolume} of data at ${maxSpeed}, subscribers can stream, browse, and connect without limits. This ${smDisplay.EN.toLowerCase()} ${pcDisplay.EN.toLowerCase()} includes ${keyBenefit1} and ${keyBenefit2} as standard features.`,
            ],
            TH: [
              `${pName} เป็น${pcDisplay.TH}${smDisplay.TH}สำหรับลูกค้า${modDisplay.TH} แพ็กเกจนี้รวมเน็ตความเร็วสูง ${dataVolume} ที่ความเร็วสูงสุด ${maxSpeed} โทรฟรีในเครือข่ายไม่จำกัด และการเข้าถึงเครือข่าย 5G โดยไม่มีค่าใช้จ่ายเพิ่มเติม ราคา ${priceAmount} บาท/เดือน คิดค่าบริการ${ptDisplay.TH}`,

              `${pName} มอบความคุ้มค่าที่ยอดเยี่ยมสำหรับ${targetCustomersTH} แพ็กเกจประกอบด้วยเน็ต ${dataVolume} ${keyBenefit1TH} และ${keyBenefit2TH} มีให้บริการบน${modDisplay.TH}${smDisplay.TH} พร้อมตัวเลือกระยะเวลา ${validityPeriod} ค่าบริการ ${priceAmount} บาท/เดือน`,

              `${pName} ออกแบบมาเพื่อตอบสนองความต้องการของผู้ใช้${modDisplay.TH}ยุคใหม่ สมาชิกจะได้เพลิดเพลินกับเน็ต 5G ${dataVolume} โทรฟรีไม่จำกัด และการเข้าถึงโปรโมชันพิเศษ ${pcDisplay.TH}นี้ทำงานบนระบบ${smDisplay.TH}พร้อมความสามารถต่ออายุอัตโนมัติ`,

              `${pName} - โซลูชัน${modDisplay.TH}ที่ครอบคลุม นำเสนอเน็ต ${dataVolume} (ความเร็ว ${maxSpeed}) โทรฟรีไม่จำกัด และการสนับสนุนระดับพรีเมียม เหมาะสำหรับ${targetCustomersTH}ที่ต้องการการเชื่อมต่อที่เชื่อถือได้ ${ptDisplay.TH} ${priceAmount} บาทต่อรอบบิล`,

              `${pName} ผสานความเร็ว ความคุ้มค่า และความยืดหยุ่นเข้าด้วยกัน ด้วยเน็ต ${dataVolume} ที่ความเร็ว ${maxSpeed} สมาชิกสามารถสตรีม ท่องเว็บ และเชื่อมต่อได้อย่างไร้ขีดจำกัด ${pcDisplay.TH}${smDisplay.TH}นี้รวม${keyBenefit1TH}และ${keyBenefit2TH}เป็นคุณสมบัติมาตรฐาน`,
            ],
          },

          // แบบยาว (5+ ประโยค)
          long: {
            EN: [
              `${pName} is a premium ${smDisplay.EN} ${pcDisplay.EN} offered under the ${modDisplay.EN} portfolio. This comprehensive package delivers ${dataVolume} of high-speed mobile data with maximum download speeds of ${maxSpeed} on our advanced 5G network. Subscribers benefit from unlimited voice calls to all domestic networks, SMS allowance, and seamless 5G connectivity at no extra charge.\n\n` +
              `Priced competitively at ${priceAmount} THB per month (${ptDisplay.EN.toLowerCase()}), ${pName} represents exceptional value for ${targetCustomers}. The package includes ${keyBenefit1} and ${keyBenefit2} as standard features, with optional add-ons available for further customization. Billing is processed on a ${smDisplay.EN.toLowerCase()} basis with automatic renewal for uninterrupted service.\n\n` +
              `Target launch: ${launchTiming}. This offering is positioned to capture the growing demand for high-speed, reliable ${modDisplay.EN.toLowerCase()} services among ${targetCustomers}.`,

              `${pName} - Product Offering Overview\n` +
              `─────────────────────────────────────────────────\n` +
              `Service Type: ${modDisplay.EN} | ${smDisplay.EN} | ${pcDisplay.EN}\n` +
              `Data Allowance: ${dataVolume} @ ${maxSpeed} (5G Ready)\n` +
              `Voice: Unlimited domestic calls\n` +
              `SMS: Standard allowance included\n` +
              `Price: ${priceAmount} THB/month (${ptDisplay.EN})\n` +
              `Validity: ${validityPeriod} with auto-renewal\n` +
              `─────────────────────────────────────────────────\n` +
              `Key Benefits:\n` +
              `  • ${keyBenefit1}\n` +
              `  • ${keyBenefit2}\n` +
              `  • 5G network access included\n` +
              `  • No hidden fees or charges\n` +
              `─────────────────────────────────────────────────\n` +
              `${pName} is ideal for ${targetCustomers} seeking a reliable, high-performance ${modDisplay.EN.toLowerCase()} solution.`,

              `${pName} represents the next evolution in ${modDisplay.EN} ${pcDisplay.EN}s. Building on our commitment to delivering superior connectivity, this ${smDisplay.EN.toLowerCase()} package combines generous data allowances (${dataVolume} at ${maxSpeed}) with unlimited domestic calling and 5G network access.\n\n` +
              `Designed specifically for ${targetCustomers}, ${pName} addresses the growing demand for high-bandwidth applications including video streaming, online gaming, and remote work. The ${ptDisplay.EN.toLowerCase()} pricing model at ${priceAmount} THB/month ensures predictable billing with no surprise charges.\n\n` +
              `Key features include ${keyBenefit1}, ${keyBenefit2}, and comprehensive network coverage nationwide. ${pName} is scheduled for commercial launch in ${launchTiming}, with pre-registration available for interested customers.`,
            ],
            TH: [
              `${pName} เป็น${pcDisplay.TH}${smDisplay.TH}ระดับพรีเมียมภายใต้พอร์ตโฟลิโอ${modDisplay.TH} แพ็กเกจที่ครอบคลุมนี้มอบเน็ตมือถือความเร็วสูง ${dataVolume} ด้วยความเร็วดาวน์โหลดสูงสุด ${maxSpeed} บนเครือข่าย 5G ขั้นสูงของเรา สมาชิกจะได้รับสิทธิประโยชน์โทรฟรีทุกเครือข่ายไม่จำกัด SMS และการเชื่อมต่อ 5G ที่ราบรื่นโดยไม่มีค่าใช้จ่ายเพิ่มเติม\n\n` +
              `ด้วยราคาที่แข่งขันได้ที่ ${priceAmount} บาทต่อเดือน (${ptDisplay.TH}) ${pName} แสดงถึงความคุ้มค่าที่ยอดเยี่ยมสำหรับ${targetCustomersTH} แพ็กเกจรวม${keyBenefit1TH}และ${keyBenefit2TH}เป็นคุณสมบัติมาตรฐาน พร้อมบริการเสริมที่สามารถเลือกเพิ่มได้เพื่อปรับแต่งเพิ่มเติม การเรียกเก็บเงินดำเนินการแบบ${smDisplay.TH}พร้อมการต่ออายุอัตโนมัติเพื่อบริการที่ไม่หยุดชะงัก\n\n` +
              `เป้าหมายการเปิดตัว: ${launchTimingTH} ข้อเสนอนี้ถูกวางตำแหน่งเพื่อตอบสนองความต้องการที่เพิ่มขึ้นสำหรับบริการ${modDisplay.TH}ความเร็วสูงและเชื่อถือได้ในกลุ่ม${targetCustomersTH}`,

              `${pName} - ภาพรวมผลิตภัณฑ์\n` +
              `─────────────────────────────────────────────────\n` +
              `ประเภทบริการ: ${modDisplay.TH} | ${smDisplay.TH} | ${pcDisplay.TH}\n` +
              `ปริมาณเน็ต: ${dataVolume} @ ${maxSpeed} (รองรับ 5G)\n` +
              `โทร: ไม่จำกัดในประเทศ\n` +
              `SMS: รวมสิทธิ์มาตรฐาน\n` +
              `ราคา: ${priceAmount} บาท/เดือน (${ptDisplay.TH})\n` +
              `อายุแพ็กเกจ: ${validityPeriod} พร้อมต่ออายุอัตโนมัติ\n` +
              `─────────────────────────────────────────────────\n` +
              `สิทธิประโยชน์หลัก:\n` +
              `  • ${keyBenefit1TH}\n` +
              `  • ${keyBenefit2TH}\n` +
              `  • การเข้าถึงเครือข่าย 5G รวมอยู่แล้ว\n` +
              `  • ไม่มีค่าธรรมเนียมแอบแฝง\n` +
              `─────────────────────────────────────────────────\n` +
              `${pName} เหมาะสำหรับ${targetCustomersTH}ที่ต้องการโซลูชัน${modDisplay.TH}ประสิทธิภาพสูงและเชื่อถือได้`,

              `${pName} แสดงถึงวิวัฒนาการขั้นต่อไปของ${pcDisplay.TH}${modDisplay.TH} ด้วยความมุ่งมั่นในการส่งมอบการเชื่อมต่อที่เหนือกว่า แพ็กเกจ${smDisplay.TH}นี้ผสานปริมาณเน็ตที่มากพอ (${dataVolume} ที่ ${maxSpeed}) กับการโทรในประเทศไม่จำกัดและการเข้าถึงเครือข่าย 5G\n\n` +
              `ออกแบบมาโดยเฉพาะสำหรับ${targetCustomersTH} ${pName} ตอบสนองความต้องการที่เพิ่มขึ้นสำหรับแอปพลิเคชันที่ใช้แบนด์วิธสูง รวมถึงการสตรีมมิ่งวิดีโอ เกมออนไลน์ และการทำงานระยะไกล รูปแบบการคิดราคา${ptDisplay.TH}ที่ ${priceAmount} บาท/เดือน ช่วยให้การเรียกเก็บเงินคาดการณ์ได้โดยไม่มีค่าใช้จ่ายที่ไม่คาดคิด\n\n` +
              `คุณสมบัติหลักรวมถึง ${keyBenefit1TH} ${keyBenefit2TH} และการครอบคลุมเครือข่ายทั่วประเทศ ${pName} มีกำหนดเปิดตัวเชิงพาณิชย์ใน${launchTimingTH} โดยเปิดให้ลงทะเบียนล่วงหน้าสำหรับลูกค้าที่สนใจ`,
            ],
          },
        };

        // สุ่มประเภทความยาว
        const lengthType = (() => {
          const rand = Math.random();
          if (rand < 0.3) return 'short';      // 30% สั้น
          if (rand < 0.65) return 'medium';    // 35% กลาง
          return 'long';                        // 35% ยาว
        })();

        // สุ่มภาษา (60% อังกฤษ, 40% ไทย)
        const useThai = Math.random() < 0.4;

        // เลือกข้อความ
        let descriptionText: string;
        if (useThai) {
          descriptionText = pickRandom(descriptionPools[lengthType].TH);
        } else {
          descriptionText = pickRandom(descriptionPools[lengthType].EN);
        }

        // บางครั้งเพิ่มข้อมูล PO
        if (Math.random() < 0.4 && pOName) {
          if (useThai) {
            descriptionText += `\n\nPO อ้างอิง: ${pOName}`;
          } else {
            descriptionText += `\n\nPO Reference: ${pOName}`;
          }
        }

        // ตรวจสอบความยาวไม่เกิน 4000 ตัวอักษร
        if (descriptionText.length > 4000) {
          descriptionText = descriptionText.substring(0, 3997) + '...';
        }

        // กรอกข้อความ
        cy.get('textarea[formcontrolname="projectDescription"]')
          .clear({ force: true })
          .type(descriptionText, { delay: 0, force: true });

        cy.log(`✅ Project Description: ${descriptionText.length} chars, ${useThai ? 'TH' : 'EN'}, ${lengthType}`);
      } else {
        cy.get('textarea[formcontrolname="projectDescription"]').clear({ force: true });
        cy.log('⏭️ Project Description skipped (15%)');
      }

      cy.wait(WAIT_TIME);
    }
  });
};
// ========================
// RANDOM PRODUCT SPECIFICATION
// ========================

export const RandomProductSpecification = (productClass: string, subModule?: string, Module?: string): void => {
  const generalList = [
    'AIS Secure Net',
    'Apple Care',
    'Cloud PC',
    'Flowaccount',
    'MS365 Copilot',
    'Mobile Care',
    'Ubisoft Plus',
    'Voice',
    'SMS', 'MMS',
    'Internet',
    'Calling Melody',
    // 'Vertical App',
    'Cloud Game',
    'AI IP Camera',
    // 'WiFi',
    // 'Karaoke',
    // 'VRBT',
    // 'Music Streaming',
    // 'Arcade',
    // 'TV Plus',
    // 'Youtube Premium'
  ];

  cy.contains('.panel-heading', '*Product Specification')
    .closest('.panel')
    .within(() => {
      if (productClass === 'main') {
        cy.get('select[formcontrolname="selectedListBox"]')
          .find('option')
          .then($options => {
            const selected = [...$options].map(el => el.textContent?.trim() || '');
            cy.wrap(selected).as('selectedItems');
          });
      } else {
        cy.wrap([]).as('selectedItems');
      }

      cy.get('select[formcontrolname="availableListBox"]')
        .first()
        .find('option')
        .then($options => {
          const allOptions = [...$options].map(el => el.textContent?.trim() || '');
          const availableGeneral = allOptions.filter(text => generalList.includes(text));
          // const pickedItems = availableGeneral.filter(() => Cypress._.random(0, 1) === 1);

          const pickedItems = availableGeneral;  // เลือกทั้งหมดที่อยู่ใน generalList
          cy.wrap(pickedItems).as('pickedItems');
        });
    });

  cy.get('@selectedItems').then(selectedItems => {
    cy.get('@pickedItems').then(pickedItems => {
      const configQueue: string[] = [];

      if (productClass === 'main' && (selectedItems as unknown as string[]).includes('Internet')) {
        configQueue.push('Internet');
      }

      (pickedItems as unknown as string[]).forEach(item => {
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]')
              .first()
              .contains('option', item)
              .dblclick({ force: true });
            cy.wait(300);
          });

        if (productClass === 'main') {
          if (!['Voice', 'SMS', 'MMS', 'Internet'].includes(item)) {
            configQueue.push(item);
          }
        } else {
          configQueue.push(item);
        }
      });

      cy.then(() => {
        if (configQueue.includes('Voice')) Voice();
        if (configQueue.includes('SMS')) Sms();
        if (configQueue.includes('MMS')) Mms();
        if (configQueue.includes('Internet')) InternetRandom(productClass, subModule, Module);
        if (configQueue.includes('Vertical App')) VerticalApp();
        if (configQueue.includes('Cloud Game')) CloudGame();
        if (configQueue.includes('AI IP Camera')) AIIPCamera();
        if (configQueue.includes('WiFi')) WiFi();
        if (configQueue.includes('Karaoke')) Karaoke();
        if (configQueue.includes('VRBT')) VRBT();
        if (configQueue.includes('Music Streaming')) MusicStreaming();

        const entItems = configQueue.filter(item => ['Arcade', 'TV Plus', 'Youtube Premium'].includes(item));
        if (entItems.length > 0) {
          EntertainmentPartnership(entItems as any);
        }
      });
    });
  });
};

// ========================
// VOICE
// ========================

export const Voice = (): void => {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Voice$/)
        .click({ force: true });

      const fillRatingForm = () => {
        cy.get('input[formcontrolname="rateExcludingVAT"]', { timeout: 10000 })
          .should('be.visible')
          .clear({ force: true })
          .type(Cypress._.random(0.5, 50.0).toFixed(2), { force: true })
          .blur({ force: true });

        cy.get('select[formcontrolname="rateUnit"]', { timeout: 10000 })
          .should('exist')
          .then(($select) => {
            const val = $select.find('option:not([disabled])').first().val();
            cy.wrap($select).select(val as string, { force: true });
          });
      };
    }
  });
};

// ========================
// SMS
// ========================

export const Sms = (): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.wait(2000);
        }
      });

      cy.get('button:has(.glyphicon-plus)').click({ force: true });
      cy.wait(2000);
      cy.get('mat-select .mat-select-trigger').click({ force: true });
    });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .then(($options) => {
        if ($options.length > 0) {
          const randomIndex = Cypress._.random(0, $options.length - 1);
          cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
        }
      });

    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.wait(2000);
      cy.contains('button', 'Add').click({ force: true });
    });
  };

  const fillRatingSection = (headerText: string, controlName: string) => {
    cy.get('app-mass-mkt-sms-rating').within(() => {
      cy.contains('.panel-heading', headerText)
        .closest('.panel')
        .within(() => {
          cy.get('.collapse-panel').then(($panel) => {
            if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
              cy.get('.panel-heading').click({ force: true });
              cy.get('.collapse-panel').should('be.visible');
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

      processFreeResource();
      cy.get('app-mass-mkt-sms-rating').within(() => {
        cy.get('.panel-heading').first().click({ force: true });
      });
      fillRatingSection('SMS Rating', 'smsExcludingVat');
      fillRatingSection('SMS Delivery Report Rating', 'smsdrExcludingVat');
      fillRatingSection('iSMS Rating', 'iSmsExcludingVat');
    }
  });
};

// ========================
// MMS
// ========================

export const Mms = (): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.wait(2000);
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
      cy.wait(2000);
      cy.get('mat-select .mat-select-trigger').click({ force: true });
    });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .then(($options) => {
        if ($options.length > 0) {
          const randomIndex = Cypress._.random(0, $options.length - 1);
          cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
        }
      });

    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.wait(2000);
      cy.contains('button', 'Add').click({ force: true });
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
      processFreeResource();

      cy.get('app-mass-mkt-mms-rating').within(() => {
        fillMmsRatingInput('mmsExcludingVat');
        fillMmsRatingInput('mmsdrExcludingVat');
        fillMmsRatingInput('mmsrrExcludingVat');
      });
    }
  });
};

const getRandomNumberOfEntries = (): number => {
  const random = Math.random();
  if (random < 0.95) return 1;
  else if (random < 0.98) return 2;
  else return 3;
};
const randomMatSelect = () => {
  // รอให้ panel ปรากฏ (ใช้ document.querySelector เพราะมันอยู่บอก component)
  cy.document().then((doc) => {
    // รอจนกว่าจะมี mat-select-panel ใน DOM
    const waitForPanel = () => {
      const panel = doc.querySelector('.mat-select-panel');
      if (!panel) {
        cy.wait(100);
        cy.document().then((newDoc) => {
          const newPanel = newDoc.querySelector('.mat-select-panel');
          if (newPanel) {
            cy.wrap(newPanel).should('be.visible');
            // สุ่มเลือก option
            cy.wrap(newPanel)
              .find('mat-option')
              .should('have.length.gt', 0)
              .then(($options) => {
                const index = Cypress._.random(0, $options.length - 1);
                cy.wrap($options).eq(index).click({ force: true });
                cy.log(`✅ Selected mat-option index: ${index}`);
              });
          }
        });
      } else {
        cy.wrap(panel).should('be.visible');
        cy.wrap(panel)
          .find('mat-option')
          .should('have.length.gt', 0)
          .then(($options) => {
            const index = Cypress._.random(0, $options.length - 1);
            cy.wrap($options).eq(index).click({ force: true });
            cy.log(`✅ Selected mat-option index: ${index}`);
          });
      }
    };

    waitForPanel();
  });
};
const clickAddButton = () => {
  cy.contains('button', /^Add$/)
    .filter(':visible')
    .should('be.enabled')
    .click({ force: true });
};

const repeatEntries = (label: string, fn: (index: number) => void): void => {
  const count = getRandomNumberOfEntries();
  cy.log(`🔥 ${label}: ${count} entries`);

  const runNext = (i: number): void => {
    if (i >= count) return;
    cy.log(`➡️ ${label} รอบที่ ${i + 1}`);
    fn(i);
    cy.then(() => runNext(i + 1));
  };

  runNext(0);
};

const openTab = (name: RegExp) => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(name)
    .should('be.visible')
    .click({ force: true });
};

const randomSelect = (selector: string) => {
  cy.get(selector)
    .should('be.visible')
    .find('option:not([disabled])')
    .then(($options) => {
      const index = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(index).val() as string;
      cy.get(selector).select(val, { force: true });
      cy.log(`🎯 ${selector}: ${val}`);
    });
};

const openMatSelectWithRetry = (
  getMatSelect: () => Cypress.Chainable<JQuery<HTMLElement>>,
  maxAttempts: number = 5
): void => {
  const attempt = (remaining: number): void => {
    if (remaining === 0) {
      cy.document().then((doc) => {
        const overlayContainer = doc.querySelector('.cdk-overlay-container');
        const overlayPane = doc.querySelectorAll('.cdk-overlay-pane').length;
        const matPanel = doc.querySelectorAll('.mat-select-panel').length;

        cy.log(`🔍 overlay-container exists: ${!!overlayContainer}`);
        cy.log(`🔍 .cdk-overlay-pane count: ${overlayPane}`);
        cy.log(`🔍 .mat-select-panel count: ${matPanel}`);

        if (overlayContainer) {
          cy.log(`🔍 innerHTML: ${overlayContainer.innerHTML.substring(0, 300)}`);
        }
      });

      throw new Error('mat-select panel did not open after max attempts');
    }

    cy.get('body').type('{esc}');
    cy.wait(300);

    // click ที่ .mat-select-trigger โดยตรง แทน mat-select
    getMatSelect()
      .should('be.visible')
      .find('.mat-select-trigger')
      .should('exist')
      .click({ force: true });

    cy.wait(600);

    cy.document().then((doc) => {
      const combined = doc.querySelectorAll('.cdk-overlay-pane .mat-select-panel').length;
      cy.log(`🔍 attempt(${remaining}) — combined: ${combined}`);

      if (combined > 0) {
        cy.log(`✅ mat-select panel opened`);
      } else {
        cy.log(`⚠️ panel not found, retrying... (${remaining - 1} left)`);
        attempt(remaining - 1);
      }
    });
  };

  attempt(maxAttempts);
};

const selectMatOptionWiFi = (): void => {
  cy.get('.cdk-overlay-pane .mat-select-panel')
    .should('exist')
    .scrollIntoView()
    .within(() => {
      cy.get('mat-option')
        .not('.mat-option-disabled')
        .should('have.length.gt', 0)
        .then(($options) => {
          const index = Cypress._.random(0, $options.length - 1);
          cy.wrap($options).eq(index).scrollIntoView().click({ force: true });
        });
    });
};

const handleContentTypeIfExist = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('select[formcontrolname="contentType"]').length) {
      cy.log('⚡ contentType detected');

      cy.get('select[formcontrolname="contentType"]')
        .should('exist')
        .should('be.visible')
        .find('option:not([disabled])')
        .should('have.length.gt', 0)
        .then(($options) => {
          const index = Cypress._.random(0, $options.length - 1);
          const val = $options.eq(index).val() as string;

          cy.get('select[formcontrolname="contentType"]').select(val);
          cy.log(`🎯 contentType: ${val}`);
        });
    } else {
      cy.log('ℹ️ no contentType');
    }
  });
};

export const WiFi = (): void => {
  openTab(/^WiFi$/);

  repeatEntries('WiFi', () => {

    // =====================
    // STEP 1: click +
    // =====================
    cy.get('app-mass-mkt-wifi')
      .find('.glyphicon-plus')
      .closest('button')
      .should('be.enabled')
      .click();

    // =====================
    // STEP 2: select dropdown
    // =====================
    randomSelect('select[formcontrolname="wiFiUsageType"]');
    randomSelect('select[formcontrolname="wiFiQuotaType"]');

    // =====================
    // STEP 3: mat-select (WiFi) — retry until panel opens
    // =====================
    openMatSelectWithRetry(() =>
      cy.contains('*WiFi :')
        .closest('.form-group')
        .find('mat-select')
    );

    selectMatOptionWiFi();

    // =====================
    // STEP 4: conditional field
    // =====================
    handleContentTypeIfExist();

    // =====================
    // STEP 5: validation
    // =====================
    cy.get('form')
      .should('not.have.class', 'ng-invalid');

    cy.get('.alert-danger').should('not.exist');

    // =====================
    // STEP 6: Add
    // =====================
    cy.contains('button', /^Add$/)
      .filter(':visible')
      .should('be.enabled')
      .click({ force: true });

    // =====================
    // STEP 7: wait for UI reset
    // =====================
    cy.get('app-mass-mkt-wifi')
      .should('exist');

    cy.wait(500);
  });
};

export const VerticalApp = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Vertical App$/)
    .click({ force: true });
  cy.wait(5000);

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
      cy.get('select[formcontrolname="VerticalAppUsageType"]').select(val, { force: true });
    });

  cy.get('select[formcontrolname="VerticalAppQuotaType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
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
      cy.wrap($options).eq(randomIndex).scrollIntoView().click({ force: true });
    });

  cy.get('app-mass-mkt-vertical-app').within(() => {
    const pick5G = Cypress._.random(0, 1) === 1;

    cy.get('[formarrayname="vaNetworkCoverageCheckBox"] input[type="checkbox"]')
      .each(($checkbox, index) => {
        const should5GBeChecked = index === 0 && pick5G;
        const shouldNo4GBeChecked = index === 1 && !pick5G;

        if (should5GBeChecked || shouldNo4GBeChecked) {
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
        cy.get('select[formcontrolname="commuSpeed"]').select(val, { force: true });
      });

    cy.get('@selectedQuotaValue').then((quotaValue) => {
      if (String(quotaValue).includes('Throttling')) {
        cy.get('select[formcontrolname="commuThrottlingSpeed"]')
          .should('exist')
          .find('option:not([disabled])')
          .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.get('select[formcontrolname="commuThrottlingSpeed"]').select(val, { force: true });
          });
      }
    });

    cy.contains('button', /^Add$/).click({ force: true });
  });
};

// ========================
// CLOUD GAME
// ========================

export const CloudGame = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Cloud Game$/)
    .click({ force: true });

  cy.wait(5000);

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

            cy.wait(2000);

            cy.contains('label', 'Platform')
              .closest('.form-group')
              .find('select[formcontrolname="platform"]')
              .select(targetPlatform);

            cy.wait(2000);

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

            cy.wait(2000);

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
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^AI IP Camera$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-ai-ip-camera .panel-body .btn-primary .glyphicon-plus')
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

      cy.get('select[formcontrolname="cpName"]')
        .should('be.visible')
        .find('option')
        .then(($options) => {
          const validOptions = ($options.toArray() as HTMLOptionElement[]).filter(
            (opt) => !opt.disabled && opt.value && opt.value !== 'null' && opt.value !== ''
          );

          if (validOptions.length === 0) {
            throw new Error('No valid options found in CP Name dropdown');
          }

          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const randomValue = validOptions[randomIndex].value;

          cy.get('select[formcontrolname="cpName"]').select(randomValue).should('have.value', randomValue);
          cy.log(`Selected CP Name: ${randomValue}`);
        });

      cy.contains('.panel-heading', 'Partner App ID')
        .closest('.panel')
        .within(() => {
          cy.get('.btn-xs .glyphicon-plus').last().should('be.visible').click();
        });

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

          cy.contains('button', /^Add$/).should('be.enabled').click();
        });

      cy.contains('.panel-heading', 'Partner App ID Detail')
        .closest('.panel')
        .should(($panel) => {
          const isHidden = $panel.attr('hidden') !== undefined ||
            $panel.css('display') === 'none' ||
            $panel.css('visibility') === 'hidden' ||
            !$panel.is(':visible');
          expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
        });

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

          cy.wait(2000);

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

          cy.wait(2000);

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

                    cy.contains('button', /^Add$/).should('be.visible').click();
                  });
              });

            cy.wait(2000);
          }

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

          cy.wait(2000);

          const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

          cy.get('select[formcontrolname="platform"]')
            .should('be.visible')
            .select(randomPlatform)
            .should('have.value', randomPlatform);

          cy.log(`Selected Platform: ${randomPlatform}`);

          cy.wait(2000);

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

          cy.wait(2000);

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

  cy.wait(2000);

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
          cy.wait(2000);

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
                  cy.wait(300);
                  cy.get('button.str').click();
                });
            });
          cy.wait(300);

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
          cy.wait(2000);
          cy.log(`✅ ${logPrefix}Selected: ${randomOpt.text}`);
          return;
        }

        attempts++;
        if (attempts < maxRetries) {
          cy.log(`⚠️ ${logPrefix}No match, retry ${attempts}/${maxRetries}`);
          cy.wait(1000);
          attemptSelection();
          return;
        }

        // Fallback
        cy.log(`❌ ${logPrefix}Failed after ${maxRetries} attempts, using fallback`);
        if (availableOptions.length > 0) {
          const fallback = availableOptions[Math.floor(Math.random() * availableOptions.length)] as HTMLOptionElement;
          cy.wrap($select).select(fallback.value);
          cy.wait(2000);
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
      cy.wait(2000);
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

  cy.wait(2000);

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
        cy.wait(300);
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
        cy.wait(2000);
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
      cy.wait(1000);
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
            cy.wait(800);
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
                cy.wait(300);
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
                    cy.wait(1500);
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
const updatePriorityInPanel = (): void => {
  cy.get('.panel-body').should('be.visible').then(($panelBody) => {
    const $priorityInput = $panelBody.find('input[formcontrolname="priority"]');
    const $exceedInput = $panelBody.find('input[formcontrolname="internetExceedRatePriority"]');
    const $throttlingInput = $panelBody.find('input[formcontrolname="internetThrottlingSpeedPriority"]');
    const $fixedSpeedPriority = $panelBody.find('input[formcontrolname="fixedSpeedPriority"]');

    let updateNeeded = false;

    // เช็คและอัพเดท Priority
    if ($priorityInput.length > 0 && $priorityInput.is(':visible')) {
      cy.wrap($priorityInput).invoke('val').then((val) => {
        if (!val || val === '') {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          cy.wrap($priorityInput).clear().type(randomNum.toString());
          cy.log(`✅ ใส่ค่า Priority: ${randomNum}`);
          updateNeeded = true;
        } else {
          cy.log(`ℹ️ Priority มีค่าอยู่แล้ว: ${val}`);
        }
      });
    }

    // เช็คและอัพเดท Exceed Priority
    if ($exceedInput.length > 0 && $exceedInput.is(':visible')) {
      cy.wrap($exceedInput).invoke('val').then((val) => {
        if (!val || val === '') {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          cy.wrap($exceedInput).clear().type(randomNum.toString());
          cy.log(`✅ ใส่ค่า Exceed Priority: ${randomNum}`);
          updateNeeded = true;
        } else {
          cy.log(`ℹ️ Exceed Priority มีค่าอยู่แล้ว: ${val}`);
        }
      });
    }

    // เช็คและอัพเดท Throttling Priority
    if ($throttlingInput.length > 0 && $throttlingInput.is(':visible')) {
      cy.wrap($throttlingInput).invoke('val').then((val) => {
        if (!val || val === '') {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          cy.wrap($throttlingInput).clear().type(randomNum.toString());
          cy.log(`✅ ใส่ค่า Throttling Priority: ${randomNum}`);
          updateNeeded = true;
        } else {
          cy.log(`ℹ️ Throttling Priority มีค่าอยู่แล้ว: ${val}`);
        }
      });
    }

    // เช็คและอัพเดท Fixed Speed Priority
    if ($fixedSpeedPriority.length > 0 && $fixedSpeedPriority.is(':visible')) {
      cy.wrap($fixedSpeedPriority).invoke('val').then((val) => {
        if (!val || val === '') {
          const randomNum = Math.floor(10000 + Math.random() * 90000);
          cy.wrap($fixedSpeedPriority).clear().type(randomNum.toString());
          cy.log(`✅ ใส่ค่า Fixed Speed Priority: ${randomNum}`);
          updateNeeded = true;
        } else {
          cy.log(`ℹ️ Fixed Speed Priority มีค่าอยู่แล้ว: ${val}`);
        }
      });
    }

    // กด Update ถ้ามีการเปลี่ยนแปลง
    cy.then(() => {
      if (updateNeeded) {
        cy.wrap($panelBody).find('button.btn-success').contains('Update').click();
        cy.log('✅ อัพเดทเรียบร้อย');
        cy.wait(1500);
      } else {
        cy.log('ℹ️ ไม่มีการอัพเดทใดๆ');
      }
    });

    // เช็คว่าไม่มี input ไหนเลยที่มองเห็น
    if (!$priorityInput.is(':visible') &&
      !$exceedInput.is(':visible') &&
      !$throttlingInput.is(':visible') &&
      !$fixedSpeedPriority.is(':visible')) {
      cy.log('⚠️ ไม่พบ Priority input ใดๆ ที่มองเห็นได้');
    }
  });
};

const checkAndUpdatePriority = (): void => {
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.wait(5000);
  cy.contains('th', 'Quota Type', { timeout: 15000 });

  const safeClickCancel = (): void => {
    cy.get('button').contains('Cancel').then(($btn) => {
      if ($btn.is(':visible')) {
        cy.wrap($btn).click();
        cy.log('✅ กด Cancel เรียบร้อย');
      } else {
        cy.log('ℹ️ Cancel button ไม่ได้แสดงอยู่ (panel ปิดไปแล้ว — ข้าม Cancel)');
      }
    });
    cy.wait(2000);
  };

  const processRows = (rowIndex: number) => {
    cy.get('table thead th')
      .contains('Quota Type')
      .closest('table')
      .find('tbody tr')
      .then(($rows) => {
        if (rowIndex >= $rows.length) {
          cy.log('✅ ทำครบทุกแถวแล้ว');
          return;
        }

        const $currentRow = $rows.eq(rowIndex);
        const quotaType = $currentRow.find('td:first').text().trim();

        if (!quotaType || quotaType === 'No data to display') {
          cy.log(`⚠️ ข้ามแถวที่ ${rowIndex + 1} ไม่มีข้อมูล`);
          processRows(rowIndex + 1);
          return;
        }

        cy.log(`📝 กำลังทำแถวที่ ${rowIndex + 1}: ${quotaType}`);

        cy.wrap($currentRow).find('button.btn-warning').first().click();
        cy.wait(2000);

        cy.get('table.table-hover.table-bordered').then(($subTable) => {
          const $subRows = $subTable.find('tbody tr').filter((_: number, tr: HTMLElement) => {
            const text = Cypress.$(tr).find('td:first').text().trim();
            return text !== '' && !text.includes('No data to display');
          });

          if ($subRows.length === 0) {
            cy.log('⚠️ ไม่พบ Internet Quota ในตารางย่อย');
            safeClickCancel();
            processRows(rowIndex + 1);
            return;
          }

          const $targetRow = $subRows.last();
          const internetQuota = $targetRow.find('td:first').text().trim();
          cy.log(`🎯 เลือก Internet Quota: ${internetQuota}`);

          cy.wrap($targetRow).find('button.btn-warning').first().click();
          cy.wait(2000);

          updatePriorityInPanel();

          // ใช้ safeClickCancel แทน cy.get('button').contains('Cancel').click()
          // รองรับกรณี Unlimited Data (Fixed Speed) ที่ panel ปิดหลัง Update
          safeClickCancel();

          processRows(rowIndex + 1);
        });
      });
  };

  processRows(0);
  cy.log('🎉 เสร็จสิ้น');
};

const performSimpleClaimAndApprovalRole = (user: string, pass: string, approveFunction: ApproveFunction): void => {
  loginAndWaitReady(user, pass);
  const projectNamePONAME: string = getStandardProjectName();
  cy.log('Project Name: ' + projectNamePONAME);
  ClaimProject(projectNamePONAME);
  cy.wait(2000);
  approveFunction(projectNamePONAME);
};
// ========================
// PROJECT BASIC INFORMATION HELPERS
// ========================

/**
 * Generate project and PO names based on configuration
 */
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
    prefixName = `${ModulePart} ${PriceType} ${ProductClass} ${pluginSuffix}`;
  }

  const projectName = getTruncatedName(prefixName,timeSuffix, 40);
  const poName = getTruncatedName(prefixName,timeSuffix, 37);

  return { projectName, poName, prefixName };
};

/**
 * Common project creation steps (login, create project, set date, phone, save)
 */
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
  cy.get('input[aria-label="Date input field"]').click().type(formattedDateString);
  cy.wait(2000);

  if (Module === 'ENTER' || Module === 'MUSIC') {
    if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
    const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
    cy.get('select[formcontrolname="customerType"]').select(customerType);
  }

  cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
  RandomProjectDescription(projectName, subModule, Module);

  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(4000);
  cy.get('.modal-body > :nth-child(1) > div > .btn').click({ force: true });
  cy.get('modal-container').should('not.exist');
};

/**
 * Common PO creation steps
 */
const createPOBase = (
  poName: string,
  promotionSubGroupValue: string
): void => {
  cy.get(':nth-child(4) > .btn').should('be.visible').click({ force: true });
  cy.get('input[formcontrolname="productName"]').click().type(poName, { force: true });
  cy.get('select[formcontrolname="promotionSubGroupFrom"]').select(promotionSubGroupValue);

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.contains('button', 'Create', { timeout: 10000 }).should('be.visible').click();
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  cy.intercept('GET', '**/getProjectByProjectId/*').as('getProject');
  cy.wait('@getProject', { timeout: 300000 });
  cy.location('hash', { timeout: 300000 }).should('include', '/project-home/mass-mkt/mass-mkt-product-offering');
  cy.wait(8000);
};

// ===== HELPER: Pick random from array =====
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ===== HELPER: Pick multiple random items =====
const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// ===== HELPER: Random integer =====
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// ===== HELPER: Clean text for English fields =====
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

/**
 * สร้าง Wording Pools สำหรับ PO Fields
 */
const createPOWordingPools = (
  projectName: string,
  poName: string,
  Module: string,
  PriceType: string,
  subModule?: string
) => {
  const p = projectName || `${Module} ${PriceType}`;
  const po = poName || 'Product Offering';
  const mod = Module || 'MOB';
  const sm = subModule || 'POST';

  // ===== DISPLAY NAMES =====
  const moduleNames: Record<string, { EN: string; TH: string }> = {
    'MOB': { EN: 'Mobile', TH: 'มือถือ' },
    'ENTER': { EN: 'Entertainment', TH: 'บันเทิง' },
    'MUSIC': { EN: 'Music', TH: 'เพลง' },
    'FBB': { EN: 'Fiber Broadband', TH: 'ไฟเบอร์บรอดแบนด์' },
    'Fixline': { EN: 'Fixed Line', TH: 'โทรศัพท์บ้าน' },
  };
  const modName = moduleNames[mod] || { EN: mod, TH: mod };

  const priceTypeNames: Record<string, { EN: string; TH: string }> = {
    'onetime': { EN: 'One-Time', TH: 'ครั้งเดียว' },
    'recurring': { EN: 'Recurring', TH: 'รายเดือน' },
    'usage': { EN: 'Usage', TH: 'ตามการใช้งาน' },
  };
  const ptName = priceTypeNames[PriceType] || { EN: PriceType, TH: PriceType };

  // ===== RANDOM VALUES =====
  const dataAmount = pickRandom(['10GB', '30GB', '50GB', '100GB', '200GB', '300GB', '500GB', 'Unlimited']);
  const speed = pickRandom(['100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '2 Gbps', '5G Max']);
  const price = randomInt(199, 2999);
  const discount = pickRandom([10, 15, 20, 25, 30, 40, 50]);
  const validity = pickRandom([1, 3, 7, 30, 90, 180, 365]);
  const contractMonths = pickRandom([1, 3, 6, 12, 24, 36]);
  const benefit1 = pickRandom(['5G Access', 'Unlimited Calls', 'Free Streaming', 'Rollover Data', 'Family Sharing', 'International Roaming']);
  const benefit1TH = pickRandom(['เข้าใช้ 5G', 'โทรฟรีไม่อั้น', 'สตรีมมิ่งฟรี', 'ยกยอดเน็ต', 'แชร์ครอบครัว', 'โรมมิ่ง']);
  const benefit2 = pickRandom(['No Contract', 'Free SIM', 'eSIM Ready', 'Priority Support', 'Device Discount', 'Cashback']);
  const benefit2TH = pickRandom(['ไม่มีสัญญา', 'ซิมฟรี', 'พร้อม eSIM', 'บริการพิเศษ', 'ส่วนลดเครื่อง', 'เงินคืน']);

  return {
    // ===== SHORT PROMOTION NAME =====
    shortPromotionName: {
      EN: [
        `${p} Special Offer`,
        `${p} Best Value`,
        `${p} Limited Deal`,
        `${p} Top Pick`,
        `${p} Exclusive`,
        `${p} Premium Choice`,
        `Promo: ${p}`,
        `Deal: ${p}`,
        `Offer – ${p}`,
        `Package: ${p}`,
        `Special: ${p}`,
        `Bundle: ${p}`,
        `${p} Flash Sale`,
        `${p} Hot Deal`,
        `${p} Mega Saver`,
        `${p} Pro`,
        `${p} Max`,
        `${p} Unlimited`,
        `${p} ${dataAmount}`,
        `${p} ${speed}`,
        `${p} ${discount}% Off`,
      ],
      TH: [
        `${p} ข้อเสนอพิเศษ`,
        `${p} คุ้มที่สุด`,
        `${p} ดีลพิเศษ`,
        `${p} แนะนำ`,
        `${p} เอ็กซ์คลูซีฟ`,
        `${p} พรีเมียม`,
        `โปรฯ: ${p}`,
        `ดีล: ${p}`,
        `ข้อเสนอ – ${p}`,
        `แพ็กเกจ: ${p}`,
        `พิเศษ: ${p}`,
        `บันเดิล: ${p}`,
        `${p} แฟลชเซล`,
        `${p} ดีลด่วน`,
        `${p} เมกะเซฟเวอร์`,
        `${p} โปร`,
        `${p} แม็กซ์`,
        `${p} ไม่จำกัด`,
        `${p} ${dataAmount}`,
        `${p} ${speed}`,
        `${p} ลด ${discount}%`,
      ],
    },

    // ===== PROMOTION DESCRIPTION =====
    promotionDescription: {
      EN: [
        `Subscribe to ${p} and enjoy ${dataAmount} of high-speed data at ${speed}. This ${modName.EN} package includes unlimited calls, ${benefit1}, and ${benefit2}. Only ${price} THB/month!`,
        `${p} gives you the best value with ${dataAmount} data, ${speed} speeds, and premium features. ${benefit1} included. Sign up today!`,
        `Experience seamless ${modName.EN} with ${p}. ${dataAmount} data allowance, unlimited domestic calls, and 5G ready. Special launch price: ${price} THB.`,
        `${p}: More data, better experience. ${dataAmount} @ ${speed}, ${benefit1}, ${benefit2}. ${price} THB/month. Limited time offer!`,
        `Get ${dataAmount} of high-speed ${modName.EN} data for just ${price} THB with ${p}. Includes ${benefit1} and ${benefit2}.`,
      ],
      TH: [
        `สมัคร ${p} และรับเน็ตความเร็วสูง ${dataAmount} ที่ความเร็ว ${speed} แพ็กเกจ${modName.TH}นี้รวมโทรฟรีไม่จำกัด ${benefit1TH} และ${benefit2TH} เพียง ${price} บาท/เดือน!`,
        `${p} ให้ความคุ้มค่าสูงสุดด้วยเน็ต ${dataAmount} ความเร็ว ${speed} และฟีเจอร์พรีเมียม ${benefit1TH} รวมอยู่แล้ว สมัครวันนี้!`,
        `สัมผัสประสบการณ์${modName.TH}ที่ราบรื่นกับ ${p} เน็ต ${dataAmount} โทรฟรีทุกเครือข่ายไม่จำกัด รองรับ 5G ราคาเปิดตัวพิเศษ ${price} บาท`,
        `${p}: เน็ตเยอะกว่า ประสบการณ์ดีกว่า ${dataAmount} @ ${speed} ${benefit1TH} ${benefit2TH} ${price} บาท/เดือน ข้อเสนอจำนวนจำกัด!`,
        `รับเน็ต${modName.TH}ความเร็วสูง ${dataAmount} ในราคาเพียง ${price} บาท กับ ${p} รวม ${benefit1TH} และ ${benefit2TH}`,
      ],
    },

    // ===== GREETING LETTER =====
    greetingLetter: {
      EN: [
        `Dear customer, thank you for subscribing to ${p}. Your ${modName.EN} package is now active with ${dataAmount} of high-speed data. Enjoy seamless connectivity and exclusive benefits!`,
        `Hello! Welcome to ${p}. We're thrilled to have you on board. Your ${modName.EN} service includes ${dataAmount} data, unlimited calls, and more. Enjoy`,
        `Congratulations on choosing ${p}! Your subscription is confirmed. ${dataAmount} data, ${speed} speeds, and premium features are ready for you.`,
        `Welcome to the ${p} family! Your ${modName.EN} package is now live. Enjoy ${dataAmount} of data, ${benefit1}, and ${benefit2}.`,
        `Thank you for joining ${p}. Your account is active and ready to use. ${dataAmount} data allowance, unlimited calls, and 5G access included.`,
      ],
      TH: [
        `เรียนลูกค้า ขอบคุณที่สมัครใช้บริการ ${p} แพ็กเกจ${modName.TH}ของคุณพร้อมใช้งานแล้วด้วยเน็ตความเร็วสูง ${dataAmount} ขอให้เพลิดเพลินกับการเชื่อมต่อที่ราบรื่นและสิทธิพิเศษ`,
        `สวัสดี! ยินดีต้อนรับสู่ ${p} เรายินดีที่คุณมาร่วมกับเรา บริการ${modName.TH}ของคุณรวมเน็ต ${dataAmount} โทรฟรีไม่จำกัด และอื่นๆ อีกมากมาย ขอให้สนุก`,
        `ยินดีด้วยที่คุณเลือก ${p}! การสมัครของคุณได้รับการยืนยันแล้ว เน็ต ${dataAmount} ความเร็ว ${speed} และฟีเจอร์พรีเมียมพร้อมสำหรับคุณแล้ว`,
        `ยินดีต้อนรับสู่ครอบครัว ${p}! แพ็กเกจ${modName.TH}ของคุณเปิดใช้งานแล้ว เพลิดเพลินกับเน็ต ${dataAmount} ${benefit1TH} และ ${benefit2TH}`,
        `ขอบคุณที่ร่วมใช้ ${p} บัญชีของคุณพร้อมใช้งานแล้ว เน็ต ${dataAmount} โทรฟรีไม่จำกัด และการเข้าถึง 5G รวมอยู่แล้ว`,
      ],
    },

    // ===== YOUR PACKAGE NAME =====
    yourPackageName: {
      EN: [
        `You are subscribed to ${p}`,
        `Your package: ${p}`,
        `Active plan: ${p}`,
        `Current package: ${p}`,
        `${p} (Active)`,
        `${p} - ${dataAmount}`,
        `${p} ${modName.EN} ${ptName.EN}`,
      ],
      TH: [
        `คุณกำลังใช้งาน ${p}`,
        `แพ็กเกจของคุณ: ${p}`,
        `แผนปัจจุบัน: ${p}`,
        `แพ็กเกจที่ใช้งาน: ${p}`,
        `${p} (ใช้งานอยู่)`,
        `${p} - ${dataAmount}`,
        `${p} ${modName.TH} ${ptName.TH}`,
      ],
    },

    // ===== SMS GREETING =====
    smsGreeting: {
      EN: [
        `Welcome to ${p}! Your subscription is now active. Enjoy ${dataAmount} data!`,
        `Hi! You've successfully joined ${p}. ${dataAmount} data ready to use.`,
        `${p} activated! Enjoy ${dataAmount} of high-speed data.`,
        `Welcome! ${p} is live on your number. ${benefit1} included.`,
        `Thanks for choosing ${p}! Your ${dataAmount} data package is ready.`,
        `You're on ${p}! Enjoy ${speed} speeds and unlimited calls.`,
        `${p}: Your ${modName.EN} package is active. Start exploring!`,
      ],
      TH: [
        `ยินดีต้อนรับสู่ ${p}! แพ็กเกจของคุณพร้อมใช้งานแล้ว รับเน็ต ${dataAmount}!`,
        `สวัสดี! คุณสมัคร ${p} สำเร็จแล้ว เน็ต ${dataAmount} พร้อมใช้งาน`,
        `เปิดใช้งาน ${p} แล้ว! เพลิดเพลินกับเน็ตความเร็วสูง ${dataAmount}`,
        `ยินดีต้อนรับ! ${p} พร้อมใช้งานบนเบอร์ของคุณแล้ว ${benefit1TH} รวมอยู่ด้วย`,
        `ขอบคุณที่เลือก ${p}! แพ็กเกจเน็ต ${dataAmount} ของคุณพร้อมแล้ว`,
        `คุณใช้ ${p} อยู่! เพลิดเพลินกับความเร็ว ${speed} และโทรฟรีไม่จำกัด`,
        `${p}: แพ็กเกจ${modName.TH}ของคุณเปิดใช้งานแล้ว เริ่มสำรวจได้เลย!`,
      ],
    },

    // ===== SMS DELETE =====
    smsDelete: {
      EN: [
        `Your ${p} package has been removed. Thank you for using our service.`,
        `${p} has been unsubscribed. Hope to see you again!`,
        `You have cancelled ${p}. We appreciate your loyalty.`,
        `${p} is now deactivated. Thank you for being with us.`,
        `Your ${p} subscription has ended. Come back anytime!`,
        `${p} service stopped. Thanks for choosing us.`,
      ],
      TH: [
        `แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว ขอบคุณที่ใช้บริการ`,
        `${p} ถูกยกเลิกแล้ว หวังว่าจะพบกันใหม่!`,
        `คุณยกเลิก ${p} แล้ว ขอบคุณที่ไว้วางใจเรา`,
        `${p} ถูกปิดใช้งานแล้ว ขอบคุณที่อยู่กับเรา`,
        `การสมัคร ${p} สิ้นสุดแล้ว กลับมาได้ทุกเมื่อ!`,
        `บริการ ${p} หยุดแล้ว ขอบคุณที่เลือกเรา`,
      ],
    },

    // ===== WORDING IN STATEMENT =====
    wordingInStatement: {
      EN: [
        `${p} - ${modName.EN} ${ptName.EN} Package`,
        `${p} | ${dataAmount} | ${speed}`,
        `${p} (${price} THB/month)`,
        `${p} - Thank you for your payment`,
        `${p} Subscription Fee`,
        `${p} Monthly Charge`,
        `Service: ${p}`,
      ],
      TH: [
        `${p} - แพ็กเกจ${modName.TH} ${ptName.TH}`,
        `${p} | ${dataAmount} | ${speed}`,
        `${p} (${price} บาท/เดือน)`,
        `${p} - ขอบคุณสำหรับการชำระเงิน`,
        `ค่าบริการ ${p}`,
        `ค่าบริการรายเดือน ${p}`,
        `บริการ: ${p}`,
      ],
    },

    // ===== DESCRIPTION =====
    description: {
      EN: [
        `${p} is a ${ptName.EN} ${modName.EN} package offering ${dataAmount} of high-speed data, unlimited domestic calls, and 5G network access.`,
        `${p}: Comprehensive ${modName.EN} solution with ${dataAmount} data allowance at ${speed}. Includes ${benefit1} and ${benefit2}.`,
        `${p} provides exceptional value with ${dataAmount} data, unlimited calls, and premium features for just ${price} THB/month.`,
        `${p} - The ultimate ${modName.EN} experience. ${dataAmount} data, ${speed} speeds, 5G ready.`,
      ],
      TH: [
        `${p} เป็นแพ็กเกจ${modName.TH}แบบ${ptName.TH} มอบเน็ตความเร็วสูง ${dataAmount} โทรฟรีทุกเครือข่ายไม่จำกัด และการเข้าถึงเครือข่าย 5G`,
        `${p}: โซลูชัน${modName.TH}ที่ครอบคลุมด้วยปริมาณเน็ต ${dataAmount} ความเร็ว ${speed} รวม ${benefit1TH} และ ${benefit2TH}`,
        `${p} มอบความคุ้มค่าที่ยอดเยี่ยมด้วยเน็ต ${dataAmount} โทรฟรีไม่จำกัด และฟีเจอร์พรีเมียมในราคาเพียง ${price} บาท/เดือน`,
        `${p} - ประสบการณ์${modName.TH}ขั้นสุด เน็ต ${dataAmount} ความเร็ว ${speed} พร้อม 5G`,
      ],
    },

    // ===== OTHER CONDITION =====
    otherCondition: {
      EN: [
        `Offer valid for new ${modName.EN} subscribers only.`,
        `Promotion valid for ${validity} days from activation.`,
        `Fair usage policy applies after ${dataAmount}.`,
        `Cannot be combined with other promotions.`,
        `Subject to credit approval.`,
        `Auto-renewal applies unless cancelled.`,
        `Terms and conditions apply.`,
        `Limited time offer while supplies last.`,
        `Valid for Thai nationals and residents only.`,
        `Minimum contract term: ${contractMonths} months.`,
      ],
      TH: [
        `ข้อเสนอสำหรับลูกค้าใหม่${modName.TH}เท่านั้น`,
        `โปรโมชันมีอายุ ${validity} วันนับจากวันเปิดใช้งาน`,
        `ใช้นโยบายการใช้งานที่เหมาะสมหลังใช้ครบ ${dataAmount}`,
        `ไม่สามารถใช้ร่วมกับโปรโมชันอื่นได้`,
        `ขึ้นอยู่กับการอนุมัติเครดิต`,
        `ต่ออายุอัตโนมัติหากไม่ยกเลิก`,
        `เป็นไปตามข้อกำหนดและเงื่อนไข`,
        `ข้อเสนอจำนวนจำกัด`,
        `สำหรับบุคคลสัญชาติไทยและผู้มีถิ่นพำนักในไทยเท่านั้น`,
        `ระยะสัญญาขั้นต่ำ ${contractMonths} เดือน`,
      ],
    },

    // ===== MEMO DESCRIPTION =====
    memoDescription: {
      EN: [
        `${p} - Internal notes for configuration reference.`,
        `${p}: ${modName.EN} ${ptName.EN}. PO: ${po}.`,
        `Product config: ${dataAmount}, ${speed}, ${price} THB.`,
        `${p} - Created for testing and validation purposes.`,
        `Memo: ${p} setup completed with standard parameters.`,
      ],
      TH: [
        `${p} - บันทึกภายในสำหรับอ้างอิงการกำหนดค่า`,
        `${p}: ${modName.TH} ${ptName.TH}. PO: ${po}`,
        `การกำหนดค่าผลิตภัณฑ์: ${dataAmount}, ${speed}, ${price} บาท`,
        `${p} - สร้างเพื่อวัตถุประสงค์ในการทดสอบและตรวจสอบ`,
        `บันทึก: การตั้งค่า ${p} เสร็จสมบูรณ์ด้วยพารามิเตอร์มาตรฐาน`,
      ],
    },

    // ===== DISCOUNT NAME =====
    discountName: {
      EN: [
        `${p} Launch Discount`,
        `${p} Welcome Offer`,
        `${p} ${discount}% Off`,
        `${p} First Month Free`,
        `${p} Cashback`,
        `${p} Rebate`,
        `${p} Promo`,
        `${p} Special`,
      ],
      TH: [
        `ส่วนลดเปิดตัว ${p}`,
        `ข้อเสนอต้อนรับ ${p}`,
        `${p} ลด ${discount}%`,
        `${p} ฟรีเดือนแรก`,
        `${p} เงินคืน`,
        `${p} ส่วนลด`,
        `${p} โปรโมชัน`,
        `${p} พิเศษ`,
      ],
    },
  };
};

/**
 * Fill Service PO specific fields (ปรับปรุงใช้ Pool)
 */
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

/**
 * Fill CashBack PO specific fields (ปรับปรุงใช้ Pool)
 */
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

/**
 * Fill standard PO fields (ปรับปรุงใช้ Pool)
 */
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

/**
 * Fill CashBack discount configuration (ปรับปรุงใช้ Pool)
 */
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

  cy.get('button.btn.btn-primary').contains('Add').click();
  cy.wait(1000);
  cy.get('button.btn.btn-primary').contains('Add').click();
};

/**
 * Set price excluding/including VAT
 */
const setPriceVAT = (): void => {
  const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
  const randomCharge = getRandomCharge();
  const priceIncludingVAT = (parseFloat(randomCharge) * 1.07).toFixed(2);

  cy.get('input[formcontrolname="priceExcludingVAT"]').clear().type(randomCharge);
  cy.get('input[formcontrolname="priceIncludingVAT"]').clear().type(priceIncludingVAT);
};

// ========================
// PROJECT BASIC INFORMATION (REFACTORED)
// ========================

export const ProjectBasicInformationComplete = (
  PriceType: PriceType,
  ProductClass: ProductClass,
  options: ProjectBasicOptions
): void => {
  const { ProductClass1, Module, subModule, autoSetDuration = false, Plugin } = options;
  const credentials = getCredentials(Module);
  const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

  const { projectName, poName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

  // Create Project
  createProjectBase(credentials, projectName, Module, subModule);

  // Store project names
  const envKey = ProductClass1 === 'Main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);
  if (typeof formattedDateMain !== 'undefined' && ProductClass1 === 'Main') formattedDateMain = projectName;
  if (typeof formattedDateOntop !== 'undefined' && ProductClass1 !== 'Main') formattedDateOntop = projectName;
  registerProjectName(projectName, ProductClass1 === 'Main' ? 0 : 1);

  // Create PO
  const poEnvKey = ProductClass1 === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  Cypress.env(poEnvKey, poName);
  createPOBase(poName, 'Product Offering');

  // Configure PO
  const priceTypeMap: Record<PriceType, string> = { onetime: '1: One-Time', recurring: '2: Recurring', usage: '3: Usage' };
  cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType], { force: true });

  const productClassMapMobile: Record<ProductClass, string> = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
  const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };
  const productValue = (Module === 'ENTER' || Module === 'MUSIC')
    ? productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra']
    : productClassMapMobile[ProductClass];
  cy.get('select[formcontrolname="productClass"]').select(productValue);

  if (autoSetDuration) {
    const randomMonth = Cypress._.random(2, 60);
    cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());
    cy.get('select[formcontrolname="packageDurationUnit"]').find('option:not([disabled])').then($options => {
      cy.get('select[formcontrolname="packageDurationUnit"]').select(($options[Cypress._.random(0, $options.length - 1)] as HTMLOptionElement).value);
    });
    cy.get('.col-md-8 > .btn').click();
  }

  if (subModule === 'PRE') {
    const randomBillCycle = Cypress._.random(1, 60);
    cy.get('input[formcontrolname="packageBillCycle"]').should('be.visible').clear().type(randomBillCycle.toString());
    cy.get('select[formcontrolname="packageBillCycleUnit"]').find('option:not([disabled])').then($options => {
      cy.get('select[formcontrolname="packageBillCycleUnit"]').select(($options[Cypress._.random(0, $options.length - 1)] as HTMLOptionElement).value);
    });
  }

  PriceExcluding();
  selectTargetGroup('random');
  dropdownPromotionGroup();
  RandomProductSpecification(ProductClass, subModule, Module);
  if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
    cy.get('body').then(($body) => {
      const mvpnRadios = $body.find('input[formcontrolname="allowMvpn"]');
      if (mvpnRadios.length > 0) {
        cy.wrap(mvpnRadios).eq(Math.floor(Math.random() * 2)).check({ force: true });
      }
    });
  }
  targetgroup();
  RandomRemark(projectName, poName, PriceType, ProductClass, subModule);
  if ((Module !== 'POST') && subModule === 'PRE' && PriceType === 'recurring') {
    RetryPattern();
  }
  if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
    CopyDeductFail();
  }
  smsWording();
  backBacicInfo();
  addFile();
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
  cy.wait(2000);
  cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
  RandomProjectDescription(projectName, Module);
  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(4000);
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
  cy.wait(8000);

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
  cy.get(':nth-child(2) > :nth-child(2) > .form-control', { timeout: 10000 })
    .should('be.visible')
    .should('be.enabled')
    .should('not.be.disabled')
    .type('Description');

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.get(':nth-child(3) > :nth-child(1) > .btn').click();

  cy.contains('.row', 'Approve memo')
    .find('input[type="checkbox"]')
    .check({ force: true });

  cy.intercept('POST', '**/api-mkt/promoteFromMktDoer').as('submitApprove');

  cy.get('button.btn.btn-primary.btn-xs.ng-star-inserted')
    .contains('Submit')
    .click();

  cy.wait('@submitApprove', { timeout: 3000000 })
    .its('response.statusCode')
    .should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  cy.wait(3500);
  const finalProjectName = getStandardProjectName();
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  ClaimProject(finalProjectName);
  approveProject(finalProjectName);

  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  cy.scrollTo('bottom');
  cy.wait(2000);

  cy.url({ timeout: 3000000 }).should('include', '/mkt/mktchecker');

  cy.get('button.btn.btn-xs.btn-primary')
    .should('be.visible')
    .click();

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');

  cy.contains('button', 'Logout')
    .should('be.visible')
    .click();
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
        cy.wait(2000);
        cy.scrollTo('bottom');
        cy.wait(2000);
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
        cy.wait(2000);
        cy.scrollTo('bottom');
        cy.wait(2000);
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

          cy.wait(5000);
        });
    });
};