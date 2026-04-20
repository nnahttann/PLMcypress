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
// PAGINATION HELPER (REUSABLE) - FIXED SCOPE ISSUE
// ========================

/**
 * ค้นหาข้อความในตารางและทำงาน callback เมื่อพบ โดยรองรับ pagination
 */
const searchInTableWithPagination = (
  sectionHeader: string,
  searchText: string,
  rowCallback: ($row: JQuery<HTMLElement>, index: number) => void,
  options: {
    waitAfterNext?: number;
    filterCallback?: ($row: JQuery<HTMLElement>, index: number) => boolean;
  } = {}
): void => {
  const { waitAfterNext = 3000, filterCallback } = options;

  // ฟังก์ชันค้นหาในหน้าปัจจุบัน
  const findInCurrentPage = (): Cypress.Chainable<boolean> => {
    return cy.get('h3').contains(sectionHeader, { timeout: 100000 })
      .parent()
      .within(() => {
        cy.get('tbody tr').then(($rows) => {
          cy.log(`📊 ${sectionHeader} - Current page rows: ${$rows.length}`);

          let found = false;
          let matchingRow: JQuery<HTMLElement> | null = null;
          let matchingIndex = -1;

          $rows.each((index, row) => {
            if (found) return;

            const $row = Cypress.$(row);
            const matches = filterCallback 
              ? filterCallback($row, index)
              : $row.text().trim().includes(searchText);

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
      });
  };

  // เช็คว่ามีปุ่ม Next ใน section นี้ไหม (เรียกนอก within)
  const hasNextPage = (): Cypress.Chainable<boolean> => {
    return cy.get('body').then(($body) => {
      const $section = $body.find(`h3:contains("${sectionHeader}")`).parent();
      const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');
      return $nextBtn.length > 0;
    });
  };

  // คลิก Next (เรียกนอก within)
  const clickNextPage = (): void => {
    cy.get('body').then(($body) => {
      const $section = $body.find(`h3:contains("${sectionHeader}")`).parent();
      const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');
      
      if ($nextBtn.length > 0) {
        cy.log(`➡️ ${sectionHeader} - Not found, going to next page...`);
        cy.wrap($nextBtn).click();
        cy.wait(waitAfterNext);
      }
    });
  };

  // Recursive ค้นหาทุกหน้า
  const searchRecursive = (): void => {
    findInCurrentPage().then((found) => {
      if (found) {
        cy.log(`✅ ${sectionHeader} - Found and processed`);
        return;
      }

      // ไม่เจอในหน้านี้ ลองไปหน้าถัดไป
      hasNextPage().then((hasNext) => {
        if (hasNext) {
          clickNextPage();
          searchRecursive();
        } else {
          cy.log(`❌ ${sectionHeader} - "${searchText}" not found in any page`);
        }
      });
    });
  };

  // เริ่มค้นหา
  searchRecursive();
};

// ========================
// CLAIM PROJECT (ใช้ HELPER)
// ========================

export const ClaimProject = (formattedDate: string): void => {
  searchInTableWithPagination(
    'Unassigned Task',
    formattedDate,
    ($row, index) => {
      cy.log(`🎯 Clicking claim button at row ${index} for: "${formattedDate}"`);
      cy.wrap($row)
        .find('button.claim-top')
        .should('be.visible')
        .click();
      cy.log(`✅ Successfully claimed project: ${formattedDate}`);
    },
    {
      filterCallback: ($row) => $row.text().trim().includes(formattedDate)
    }
  );
};

// ========================
// APPROVE PROJECT (ใช้ HELPER)
// ========================

export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    ($row) => {
      cy.wrap($row)
        .within(() => {
          cy.get('span')
            .should('be.visible')
            .click();
        });
      cy.log(`✅ Successfully approved project: ${projectName}`);
    },
    {
      filterCallback: ($row) => $row.text().trim().includes(projectName)
    }
  );
};

// ========================
// ASSIGN TEAM TASK (ใช้ HELPER)
// ========================

export function assignTeamTask(taskIdentifier: string, assignee: string, uniqueKeyword: string = ''): void {
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '**/api/getGroupIdCGMDConfigurer/**').as('getAssigneeList');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for Project: "${partialIdentifier}" with Keyword: "${uniqueKeyword}"`);

  searchInTableWithPagination(
    'Team Task',
    partialIdentifier,
    ($row) => {
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
      cy.log(`✅ Successfully assigned ${assignee} to project`);
    },
    {
      waitAfterNext: 3000,
      filterCallback: ($row) => {
        const rowText = $row.text().trim();
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
    checkAndFillCloudGameContentType();
    checkAndUpdatePriority();
    CopyDeductFail();
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
    checkAndFillCloudGameContentType();
    checkAndUpdatePriority();
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
// SMS CKS PRE
// ========================

export const smsCKSPRE = (): void => {
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.log('featureDescription');
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
    checkAndFillCloudGameContentType();
    checkAndUpdatePriority();
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
  checkAndFillCloudGameContentType();
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
  checkAndFillCloudGameContentType();
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
      cy.get('button').then(($buttons) => {
        const usmpBtn = $buttons.filter((_, el) => el.textContent?.trim() === 'Add to USMP');
        if (usmpBtn.length > 0) {
          cy.log('Found Add to USMP button, clicking...');
          cy.wrap(usmpBtn.first()).click();
          cy.wait(5000);
          cy.get('.modal, .mat-dialog-container, div[role="dialog"]').should('be.visible').within(() => {
            cy.contains('button', /Close|OK|ปิด/i).click();
          });
          cy.wait(5000);
        } else {
          cy.log('Add to USMP button not found, skipping...');
        }
      });
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
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.visit('/#/workspace-home/workspace');
  cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

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
    checkAndFillCloudGameContentType();
    checkAndUpdatePriority();
    Tariff();
  });
  afterCKSPOST();
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST; // alias for backward compatibility

// ========================
// CKS ROLE EXECUTION
// ========================

const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  approvalType: 'main' | 'ontop',
  customSteps: () => void
): void => {
  it.only('CKS role', () => {
    // ===== HARDCODE สำหรับทดสอบ =====
    const HARDCODE_PROJECT_NAME = 'MOB POST onetime main 2004 1127';
    const getProjectName: GetProjectNameFn = () => HARDCODE_PROJECT_NAME;
    // ================================

    // === ของเดิม (เก็บไว้) ===
    // const getProjectName: GetProjectNameFn = projectNameStrategy === 'standard' 
    //   ? getStandardProjectName 
    //   : getOntopProjectName;

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
  const limit = (str: string, maxLen: number): string => {
    if (!str) return '';
    return str.length > maxLen ? str.substring(0, maxLen) : str;
  };

  const getRandomSendFlag = (): string => {
    const options = ['Send', "Don't Send"];
    return options[Math.floor(Math.random() * options.length)];
  };

  const WAIT_TIME = 3000;
  const currentGreetingVal = 'Send';
  const lastMinuteVal = getRandomSendFlag();
  const beforeFeeDeductVal = getRandomSendFlag();
  const deductSuccessVal = getRandomSendFlag();
  const deductFailVal = getRandomSendFlag();

  const isBeforePromoSend = Math.random() < 0.5;
  const beforePromoVal = isBeforePromoSend ? 'Send' : "Don't Send";
  const promoExpVal = isBeforePromoSend ? "Don't Send" : 'Send';

  cy.scrollTo('bottom');
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

    const textFields = [
      { name: 'shortPromotionName', prefixEN: 'Sample ', prefixTH: 'ตัวอย่าง ', max: 50 },
      { name: 'cmsDisplay', prefixEN: 'CMS Display for ', prefixTH: 'CMS แสดงผล ', max: 250 },
      { name: 'promotionDescription', prefixEN: 'Desc: ', prefixTH: 'รายละเอียด: ', max: 250 }
    ];

    textFields.forEach(field => {
      cy.get(`textarea[formcontrolname="${field.name}"]`).should('be.visible').then(($els: any) => {
        cy.wrap($els[0]).clear({ force: true }).type(limit(`${field.prefixEN}${finalProjectName}`, field.max), { delay: 0, force: true });
        if ($els.length > 1) {
          cy.wrap($els[1]).clear({ force: true }).type(limit(`${field.prefixTH}${finalProjectName}`, field.max), { delay: 0, force: true });
        }
        cy.wait(WAIT_TIME);
      });
    });

    // --- Section 4: SMS Greeting (Force Send & Type) ---
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="smsGreetingSendFlag"]').length > 0) {
        cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(currentGreetingVal);
        cy.get('textarea[formcontrolname="smsGreeting"]')
          .should('be.visible')
          .each(($el: any, index: number) => {
            const prefix = index === 0 ? 'Welcome!' : 'ยินดีต้อนรับ';
            cy.wrap($el).clear({ force: true }).type(limit(`${prefix} ${finalProjectName}`, 400), { delay: 0, force: true });
          });
      }
      if ($body.find('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').length > 0) {
        cy.get('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').select(currentGreetingVal);
      }
    });

    // --- Section 6: SMS Delete (PRE Only) ---
    if (type === 'PRE') {
      const sendOptions = ['Send', "Don't Send"];
      const randomSendVal = sendOptions[Math.floor(Math.random() * sendOptions.length)];

      cy.get('select[formcontrolname="smsDeleteSendFlag"]').then(($select: any) => {
        if ($select.length === 0) return;

        // 1️⃣ Select Send / Don't Send
        cy.wrap($select).select(randomSendVal, { force: true });
        cy.wait(WAIT_TIME);

        if (randomSendVal !== 'Send') return;

        // 2️⃣ Random Default Wording (Y / N)
        const defaultOptions = ['Yes', 'No'];
        const randomDefaultVal = defaultOptions[Math.floor(Math.random() * defaultOptions.length)];

        cy.get('input[formcontrolname="smsDeleteDefaultWordingFlag"]')
          .then(($radios: any) => {
            if ($radios.length > 0) {
              cy.wrap($radios)
                .contains(randomDefaultVal)
                .click({ force: true });
            }
          });

        cy.wait(WAIT_TIME);

        // 3️⃣ If Default Wording = No → fill SMS Delete
        if (randomDefaultVal === 'No') {
          cy.get('textarea[formcontrolname="smsDelete"]').then(($els: any) => {
            cy.wrap($els[0])
              .clear({ force: true })
              .type(
                limit('SMS Delete ENG: Auto generated content for PRE case', 250),
                { delay: 0, force: true }
              );

            if ($els.length > 1) {
              cy.wrap($els[1])
                .clear({ force: true })
                .type(
                  limit('SMS Delete THA: ข้อความลบแพ็กสำหรับกรณี PRE', 250),
                  { delay: 0, force: true }
                );
            }
          });
        }
      });
    }

    // --- Section 7: Last Minute Alert ---
    cy.get('body').then(($body: any) => {
      const selector = 'select[formcontrolname="lastMinuteAlertSendFlag"]';

      if ($body.find(selector).length > 0) {
        const options = ['Send', "Don't Send"];
        const randomVal = options[Math.floor(Math.random() * options.length)];

        cy.get(selector).then(($select: any) => {
          if ($select.length > 0) {
            cy.wrap($select).select(randomVal, { force: true });
            cy.wait(WAIT_TIME);
          }
        });
      }
    });

    // --- Section 8: Before Promotion Expired ---
    const selectRandomOptionFn = ($select: any) => {
      const options = [...$select.find('option')]
        .filter((opt: any) =>
          opt.value &&
          opt.value !== 'null' &&
          !opt.disabled
        )
        .map((opt: any) => opt.value);

      return Cypress._.sample(options);
    };

    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="beforePromotionExpAlertSendFlag"]').length > 0) {

        cy.get('select[formcontrolname="beforePromotionExpAlertSendFlag"]')
          .select(beforePromoVal, { force: true });

        cy.wait(WAIT_TIME);

        if (beforePromoVal === 'Send') {

          // 👉 Deduction number
          cy.get('input[formcontrolname="beforePromotionExpAlertDeduction"]')
            .then(($input: any) => {
              if (!$input.val()) {
                cy.wrap($input)
                  .clear({ force: true })
                  .type(`${Cypress._.random(1, 30)}`, { force: true });
              }
            });

          // 👉 Deduction unit (dynamic)
          cy.get('select[formcontrolname="beforePromotionExpAlertDeductionUnit"]')
            .then(($select: any) => {
              const currentVal = $select.val();
              if (!currentVal || currentVal === 'null') {
                const randomUnit = selectRandomOptionFn($select);
                cy.wrap($select).select(randomUnit, { force: true });
              }
            });
        }
      }
    });

    // --- SMS Promote Pack ---
    cy.get('body').then(($body: any) => {
      const selector = 'select[formcontrolname="smsPromotePackSendFlag"]';

      if ($body.find(selector).length > 0) {
        const smsPromotePackVal = getRandomSendFlag();

        // เลือกค่าตามที่สุ่มได้
        cy.get(selector).select(smsPromotePackVal, { force: true }).trigger('change', { force: true });

        cy.wait(WAIT_TIME);

        // ✅ แยกกรณี Send และ Don't Send ชัดเจน
        if (smsPromotePackVal === 'Send') {
          // กรณี Send: textarea ต้องมีอยู่และมีอย่างน้อย 2 อัน
          cy.get('textarea[formcontrolname="smsPromotePack"]')
            .should('have.length.at.least', 2)
            .each(($el: any, index: number) => {
              const prefix = index === 0 ? 'SMS Promote Package ENG:' : 'SMS Promote Package THA:';
              cy.wrap($el)
                .clear({ force: true })
                .type(
                  limit(`${prefix} ${finalProjectName}`, 250),
                  { delay: 0, force: true }
                );
            });
        } else {
          // ✅ กรณี Don't Send: ไม่ต้องทำอะไรกับ textarea
          cy.log('Selected "Don\'t Send" - skipping textarea input');
        }
      }
    });

    // --- Section 9: Promotion Expired ---
    cy.get('body').then(($body: any) => {
      if ($body.find('select[formcontrolname="promotionExpAlertSendFlag"]').length > 0) {
        cy.get('select[formcontrolname="promotionExpAlertSendFlag"]').select(promoExpVal);
        cy.wait(WAIT_TIME);
      }
    });

    // --- Section 11: SMS Check Current ---
    cy.get('body').then(($body: any) => {
      if ($body.find('textarea[formcontrolname="smsCheckCurrent"]').length > 0) {
        cy.get('textarea[formcontrolname="smsCheckCurrent"]').eq(0).clear({ force: true }).type(limit(`sms Check Current ${finalProjectName}`, 50), { delay: 0, force: true });
        cy.get('textarea[formcontrolname="smsCheckCurrent"]').eq(1).clear({ force: true }).type(limit(`sms CheckCurrent ${finalProjectName}`, 50), { delay: 0, force: true });
        cy.wait(WAIT_TIME);
      }
    });

    // --- Section 12-14: Random Flags ---
    const otherFlags = [
      { name: 'smsBeforeFeeDeductSendFlag', val: beforeFeeDeductVal },
      { name: 'recurringDeductSuccessAlertSendFlag', val: deductSuccessVal },
      { name: 'recurringDeductFailAlertSendFlag', val: deductFailVal }
    ];
    otherFlags.forEach(item => {
      cy.get('body').then(($body: any) => {
        if ($body.find(`select[formcontrolname="${item.name}"]`).length > 0) {
          cy.get(`select[formcontrolname="${item.name}"]`).select(item.val);
          cy.wait(WAIT_TIME);
        }
      });
    });

    if (type === 'POST') {
      cy.get('body').then(($body: any) => {
        // Marketing Name
        if ($body.find('textarea[formcontrolname="marketingName"]').length > 0) {
          cy.get('textarea[formcontrolname="marketingName"]').clear({ force: true }).type(limit(`marketingName ${finalProjectName}`, 40), { delay: 0, force: true });
        }
        // Your Package
        if ($body.find('textarea[formcontrolname="yourPackage"]').length > 0) {
          cy.get('textarea[formcontrolname="yourPackage"]').each(($el: any, index: number) => {
            const prefix = index === 0 ? 'yourPackage ENG:' : 'yourPackage THA:';
            cy.wrap($el).clear({ force: true }).type(limit(`${prefix} ${finalProjectName}`, 250), { delay: 0, force: true });
          });
        }
        // Greeting Letter
        if ($body.find('textarea[formcontrolname="greetingLetter"]').length > 0) {
          cy.get('textarea[formcontrolname="greetingLetter"]').each(($el: any, index: number) => {
            const prefix = index === 0 ? 'Greeting Letter ENG:' : 'Greeting Letter THA:';
            cy.wrap($el).clear({ force: true }).type(limit(`${prefix} ${finalProjectName}`, 250), { delay: 0, force: true });
          });
        }
        // SMS Delete (POST) - Adjusted: Only Send/Don't Send Flag
        if ($body.find('select[formcontrolname="smsDeleteSendFlag"]').length > 0) {
          const deleteVal = getRandomSendFlag();

          cy.get('select[formcontrolname="smsDeleteSendFlag"]')
            .select(deleteVal, { force: true });

          cy.wait(WAIT_TIME);

          if (deleteVal === 'Send') {
            cy.get('textarea[formcontrolname="smsDelete"]')
              .should('have.length.at.least', 2)
              .each(($el: any, index: number) => {
                const prefix = index === 0 ? 'SMS Delete ENG:' : 'SMS Delete THA:';
                cy.wrap($el)
                  .clear({ force: true })
                  .type(
                    limit(`${prefix} ${finalProjectName}`, 250),
                    { delay: 0, force: true }
                  );
              });
          }
        }
      });
    }

    // --- Save ---
    cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
    cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();
    cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    closeSuccessModal();
  });
};

export const smsWording = (): void => {
  _smsWordingLogic('POST');
};

export const smsWordingpre = (): void => {
  _smsWordingLogic('PRE');
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
    'Vertical App', 
    'Cloud Game', 
    'AI IP Camera', 
    'WiFi',
    'Karaoke', 
    'VRBT', 
    'Music Streaming', 
    'Arcade', 
    'TV Plus', 
    'Youtube Premium'
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
          const pickedItems = availableGeneral.filter(() => Cypress._.random(0, 1) === 1);
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

// ========================
// VERTICAL APP
// ========================

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
// WIFI
// ========================

export const WiFi = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^WiFi$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-wifi')
    .find('.glyphicon-plus')
    .closest('button')
    .should('be.enabled')
    .click();

  cy.get('select[formcontrolname="wiFiUsageType"]').then(($select) => {
    const options = $select
      .find('option:not([disabled])')
      .toArray()
      .map((el) => (el as HTMLOptionElement).value)
      .filter((v) => v && v !== '0: null');

    const randomUsage = Cypress._.sample(options)!;
    cy.wrap($select).select(randomUsage);
    cy.log(`Selected WiFi Usage Type: ${randomUsage}`);
  });

  cy.get('select[formcontrolname="wiFiQuotaType"]').then(($select) => {
    const options = $select
      .find('option:not([disabled])')
      .toArray()
      .map((el) => (el as HTMLOptionElement).value)
      .filter((v) => v && v !== '0: null');

    const randomQuota = Cypress._.sample(options)!;
    cy.wrap($select).select(randomQuota);
    cy.log(`Selected WiFi Quota Type: ${randomQuota}`);
  });

  cy.contains('label', '*WiFi :')
    .closest('.form-group')
    .find('mat-select')
    .click();

  cy.get('mat-option')
    .should('be.visible')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      cy.wrap($options).eq(randomIndex).click();
      cy.log(`Selected WiFi Option Index: ${randomIndex}`);
    });
  cy.wait(5000);

  cy.contains('button', /^Add$/)
    .scrollIntoView()
    .should('be.visible')
    .click({ force: true });
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

// ========================
// INTERNET RANDOM
// ========================

export const InternetRandom = (ProductClass: string, subModule?: string, Module?: string): void => {
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.scrollTo('bottom');
  cy.get('app-mass-mkt-internet button.btn-xs').find('.glyphicon-plus').filter(':visible').first().click();

  const allowedOptions = [
    // 'Limited Data (Pay per use)',
    // 'Limited Data (Stop Net)',
    // 'Limited Data Only',
    'Pay per use only',
    // 'Unlimited Data (Fixed Speed)',
    // 'Unlimited Data (Throttling Speed)'
  ];


  cy.get('app-mass-mkt-internet select[formcontrolname="InternetQuotaType"]')
    .filter(':visible')
    .last()
    .then($select => {
      cy.wrap($select).find('option').then($options => {
        const availableOptions = [...$options]
          .map(opt => (opt as HTMLOptionElement).text.trim())
          .filter(text => allowedOptions.includes(text));

        const selectedValue = availableOptions[Math.floor(Math.random() * availableOptions.length)];
        cy.wrap($select).select(selectedValue);
        cy.wait(2000);

        switch (selectedValue) {
          case 'Limited Data (Pay per use)':
          case 'Limited Data (Stop Net)':
            selectRandomInternetQuota();
            selectRandomInternetSpeed();
            if (ProductClass === 'main') {
              selectRandomExceedRate();
            }
            break;

          case 'Limited Data Only':
            cy.log(`🔵 Case: Limited Data Only | ProductClass: ${ProductClass} | subModule: ${subModule}| Module: ${Module}`);
            selectRandomInternetQuota();
            selectRandomInternetSpeed();
            if (ProductClass === 'main' && subModule?.toLowerCase() === 'pre') {
              cy.log('✅ Condition met → calling selectRandomExceedRate()');
              selectRandomExceedRate();
            }
            break;

          case 'Pay per use only':
            selectRandomExceedRate();
            break;

          case 'Unlimited Data (Fixed Speed)':
            const networkCoverageCheckbox = '[formarrayname="internetQuotaNetworkCoverageCheckBox"]';
            cy.get(networkCoverageCheckbox)
              .filter(':visible')
              .then(($container) => {
                const $5gLabel = $container.find('label').filter((_, el) => Cypress.$(el).text().trim().includes('5G'));
                const has5G = $5gLabel.length > 0;
                if (has5G) {
                  cy.wrap($5gLabel).click({ force: true });
                  cy.wait(300);
                }
                // เรียกใช้ฟังก์ชันเดียวไม่ว่าจะมี 5G หรือไม่
                selectRandomInternetSpeedFixed();
              });
            if (ProductClass === 'main' && subModule?.toLowerCase() === 'pre') {
              selectRandomExceedRate();
            }
            break;

          case 'Unlimited Data (Throttling Speed)':
            selectRandomInternetQuota();
            selectRandomInternetSpeed();
            selectRandomInternetThrottlingSpeed();
            if (ProductClass === 'main' && subModule?.toLowerCase() === 'pre') {
              selectRandomExceedRate();
            }
            break;
        }
      });
    });

  cy.get('app-mass-mkt-internet button.btn-primary')
    .filter(':visible')
    .each(($btn) => {
      const text = $btn.text().trim();
      if (text === 'Add') {
        cy.wrap($btn).scrollIntoView().click({ force: true });
      }
    });
};

// สุ่ม Internet Quota ทั้งหมด (ไม่กรองเฉพาะ 5G)
const selectRandomInternetQuota = (): void => {
  cy.contains('label', '*Internet Quota :')
    .filter(':visible')
    .closest('.row')
    .find('mat-select .mat-select-trigger')
    .click({ force: true });

  cy.get('.cdk-overlay-pane mat-option', { timeout: 10000 })
    .should('be.visible')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.wrap($options[randomIndex]).click({ force: true });
      cy.wait(2000);
    });
};

// สุ่ม Exceed Rate ทั้งหมด
const selectRandomExceedRate = (): void => {
  cy.contains('label', '*Internet Exceed Rate :')
    .closest('.row')
    .find('mat-select')
    .should('not.have.class', 'mat-select-disabled')
    .click();

  cy.get('.cdk-overlay-pane mat-option:not(.mat-option-disabled)', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.wrap($options[randomIndex]).click({ force: true });
    });

  cy.wait(2000);

  cy.contains('label', '*Internet Exceed Rate :')
    .closest('.row')
    .find('.mat-select-value-text, .mat-select-value')
    .should('not.contain', 'Please Select');
};

// สุ่ม Internet Speed ทั้งหมด (ไม่มีการกรองค่า)
const selectRandomInternetSpeed = (): void => {
  cy.get('select[formcontrolname="internetSpeed"]')
    .filter(':visible')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;
      cy.get('select[formcontrolname="internetSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
      cy.wait(2000);
    });
};

// สุ่ม Internet Speed Fixed ทั้งหมด (ไม่มีการกรองค่า)
const selectRandomInternetSpeedFixed = (): void => {
  cy.get('select[formcontrolname="fixedSpeedInternetSpeed"]')
    .filter(':visible')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;
      cy.get('select[formcontrolname="fixedSpeedInternetSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
      cy.wait(2000);
    });
};

// สุ่ม Throttling Speed ทั้งหมด
const selectRandomInternetThrottlingSpeed = (): void => {
  cy.get('select[formcontrolname="internetThrottlingSpeed"]')
    .filter(':visible')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      const randomValue = ($options[randomIndex] as HTMLOptionElement).value;
      cy.get('select[formcontrolname="internetThrottlingSpeed"]')
        .select(randomValue)
        .should('have.value', randomValue);
      cy.wait(2000);
    });
};

// ========================
// CHECK AND FILL CONTENT TYPE (ASYNC HELPERS)
// ========================

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findUpdateButton(): HTMLButtonElement | null {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[type="button"]');
  return (
    Array.from(buttons).find((btn) => {
      const text = btn.textContent?.trim().toLowerCase() ?? '';
      return text === 'update' || text === 'save' || text === 'ok';
    }) ?? null
  );
}

function findCloudGameUpdateButton(container: HTMLElement): HTMLButtonElement | null {
  const buttons = container.querySelectorAll<HTMLButtonElement>('button[type="button"], button[type="submit"]');
  return (
    Array.from(buttons).find((btn) => {
      const text = btn.textContent?.trim().toLowerCase() ?? '';
      return text === 'update' || text === 'save' || text === 'ok';
    }) ?? null
  );
}

async function checkAndFillContentType(): Promise<void> {
  console.log('🚀 checkAndFillContentType started');

  const targetTabs: string[] = ['Karaoke', 'Music Streaming', 'Entertainment Partnership'];

  const tabs = document.querySelectorAll<HTMLAnchorElement>(
    'app-mass-enh-product-offering-detail-tab li a'
  );

  console.log('📋 All tabs found:', tabs.length);

  for (const tabName of targetTabs) {
    console.log(`🔍 Looking for tab: "${tabName}"`);

    const tab = Array.from(tabs).find(
      (a) => a.textContent?.trim() === tabName
    );

    if (!tab) {
      console.log(`⚠️ Tab "${tabName}" not found, skipping...`);
      continue;
    }

    tab.click();
    await wait(500);
    console.log(`✅ Clicked tab: ${tabName}`);

    const editButtons = document.querySelectorAll<HTMLButtonElement>(
      'button.btn-warning[title="Edit"]'
    );

    console.log(`📋 [${tabName}] Edit buttons found:`, editButtons.length);

    if (editButtons.length === 0) {
      console.log(`⚠️ No Edit button found in ${tabName}`);
      continue;
    }

    for (let i = 0; i < editButtons.length; i++) {
      editButtons[i].click();
      await wait(500);
      console.log(`✅ [${tabName}] Clicked Edit button #${i + 1}`);

      const contentTypeSelect = document.querySelector<HTMLSelectElement>(
        'select[formcontrolname="contentType"]'
      );

      console.log(`📋 [${tabName}] Content Type select found:`, !!contentTypeSelect);

      if (!contentTypeSelect) {
        console.log(`⚠️ [${tabName}] Content Type select not found`);
        continue;
      }

      const selectedValue: string = contentTypeSelect.value;
      const isEmpty: boolean =
        selectedValue === 'null' ||
        selectedValue === '' ||
        selectedValue === '0: null' ||
        contentTypeSelect.selectedIndex <= 0;

      console.log(
        `[${tabName}] Content Type value: "${selectedValue}" | isEmpty: ${isEmpty}`
      );

      if (isEmpty) {
        const validOptions = Array.from(contentTypeSelect.options).filter(
          (opt: HTMLOptionElement) => !opt.disabled && opt.value !== 'null'
        );

        console.log(`📋 [${tabName}] Valid options:`, validOptions.map(o => o.text.trim()));

        if (validOptions.length === 0) {
          console.log(`⚠️ [${tabName}] No valid options to select`);
          continue;
        }

        const randomOption: HTMLOptionElement =
          validOptions[Math.floor(Math.random() * validOptions.length)];

        contentTypeSelect.value = randomOption.value;

        contentTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        contentTypeSelect.dispatchEvent(new Event('input', { bubbles: true }));

        console.log(
          `✅ [${tabName}] Selected random Content Type: "${randomOption.text.trim()}"`
        );

        await wait(300);
        const updateButton: HTMLButtonElement | null = findUpdateButton();

        console.log(`📋 [${tabName}] Update button found:`, !!updateButton);

        if (updateButton) {
          updateButton.click();
          console.log(`✅ [${tabName}] Clicked Update button`);
          await wait(500);
        } else {
          console.log(`⚠️ [${tabName}] Update button not found`);
        }

      } else {
        const currentText =
          contentTypeSelect.options[contentTypeSelect.selectedIndex]?.text.trim();
        console.log(
          `✅ [${tabName}] Content Type already has value: "${currentText}"`
        );
      }
    }
  }

  console.log('🎉 Done checking all tabs');
}

async function checkAndFillCloudGameContentType(): Promise<void> {
  
  console.log('🚀 checkAndFillCloudGameContentType started');

  const cloudGameComponent = document.querySelector<HTMLElement>(
    'app-mass-enh-vr[title="Cloud Game"]'
  );

  console.log('📋 Cloud Game component found:', !!cloudGameComponent);

  if (!cloudGameComponent) {
    console.log('⚠️ Cloud Game component not found, skipping...');
    return;
  }

  const editButtons = cloudGameComponent.querySelectorAll<HTMLButtonElement>(
    'button.btn-warning[title="Edit"]'
  );

  console.log('📋 Edit buttons found:', editButtons.length);

  if (editButtons.length === 0) {
    console.log('⚠️ No Edit button found in Cloud Game');
    return;
  }

  for (let i = 0; i < editButtons.length; i++) {
    editButtons[i].click();
    await wait(500);
    console.log(`✅ [Cloud Game] Clicked Edit button #${i + 1}`);

    const contentTypeSelect = cloudGameComponent.querySelector<HTMLSelectElement>(
      'select[formcontrolname="contentTypeValue"]'
    );

    console.log(`📋 [Cloud Game] Content Type select found:`, !!contentTypeSelect);

    if (!contentTypeSelect) {
      console.log('⚠️ [Cloud Game] Content Type select not found');
      continue;
    }

    const selectedValue: string = contentTypeSelect.value;
    const isEmpty: boolean =
      selectedValue === '' ||
      selectedValue === 'null' ||
      contentTypeSelect.selectedIndex < 0 ||
      (contentTypeSelect.selectedIndex === 0 && contentTypeSelect.options[0]?.disabled);

    console.log(
      `[Cloud Game] Content Type value: "${selectedValue}" | isEmpty: ${isEmpty}`
    );

    if (isEmpty) {
      const validOptions = Array.from(contentTypeSelect.options).filter(
        (opt: HTMLOptionElement) => !opt.disabled && opt.value !== '' && opt.value !== 'null'
      );

      console.log('📋 [Cloud Game] Valid options:', validOptions.map(o => o.text.trim()));

      if (validOptions.length === 0) {
        console.log('⚠️ [Cloud Game] No valid options to select');
        continue;
      }

      const randomOption: HTMLOptionElement =
        validOptions[Math.floor(Math.random() * validOptions.length)];

      contentTypeSelect.value = randomOption.value;

      contentTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      contentTypeSelect.dispatchEvent(new Event('input', { bubbles: true }));

      console.log(
        `✅ [Cloud Game] Selected random Content Type: "${randomOption.text.trim()}"`
      );

      await wait(300);

      const updateButton: HTMLButtonElement | null = findCloudGameUpdateButton(cloudGameComponent);

      console.log('📋 [Cloud Game] Update button found:', !!updateButton);

      if (updateButton) {
        updateButton.click();
        console.log('✅ [Cloud Game] Clicked Update button');
        await wait(500);
      } else {
        console.log('⚠️ [Cloud Game] Update button not found');
      }

    } else {
      const currentText =
        contentTypeSelect.options[contentTypeSelect.selectedIndex]?.text.trim();
      console.log(
        `✅ [Cloud Game] Content Type already has value: "${currentText}"`
      );
    }
  }

  console.log('🎉 [Cloud Game] Done checking Content Type');
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

// Main function
const checkAndUpdatePriority = (): void => {
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.wait(10000);
  cy.contains('th', 'Quota Type', { timeout: 15000 });

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
          // แก้ไข filter function ให้ return boolean เท่านั้น
          const $subRows = $subTable.find('tbody tr').filter((_: number, tr: HTMLElement) => {
            const text = Cypress.$(tr).find('td:first').text().trim();
            return text !== '' && !text.includes('No data to display');
          });

          if ($subRows.length === 0) {
            cy.log('⚠️ ไม่พบ Internet Quota ในตารางย่อย');
            cy.get('button').contains('Cancel').click();
            cy.wait(2000);
            processRows(rowIndex + 1);
            return;
          }

          // ตัวเลือก: ทำเฉพาะตัวสุดท้าย
          const $targetRow = $subRows.last();
          
          const internetQuota = $targetRow.find('td:first').text().trim();
          cy.log(`🎯 เลือก Internet Quota: ${internetQuota}`);

          cy.wrap($targetRow).find('button.btn-warning').first().click();
          cy.wait(2000);

          updatePriorityInPanel();
          
          cy.get('button').contains('Cancel').click();
          cy.wait(2000);
          
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
    prefixName = `${ModulePart} ${PriceType} ${ProductClass}${pluginSuffix}`;
  }

  const projectName = getTruncatedName(prefixName, timeSuffix, 40);
  const poName = getTruncatedName(prefixName, timeSuffix, 37);

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

/**
 * Fill Service PO specific fields
 */
const fillServicePOFields = (Module: Module, PriceType: string): void => {
  const promotionLevels = ['Mobile', 'Account', 'Non-Mobile'] as const;
  const randomPromotion = promotionLevels[Math.floor(Math.random() * promotionLevels.length)];

  cy.get('select[formcontrolname="promotionLevel"]')
    .select(randomPromotion)
    .should('have.value', randomPromotion);

  cy.get('textarea[formcontrolname="wordingInStatementEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Eng`);
  cy.get('textarea[formcontrolname="wordingInStatementTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Thai`);

  cy.get('select[formcontrolname="smsGreetingSendFlag"]').select('Send');
  cy.get('textarea[formcontrolname="smsGreetingEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Greeting Eng`);
  cy.get('textarea[formcontrolname="smsGreetingTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Greeting Thai`);

  cy.get('select[formcontrolname="smsDeleteSendFlag"]').select('Send');
  cy.get('textarea[formcontrolname="smsDeleteEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} SMS Delete Eng`);
  cy.get('textarea[formcontrolname="smsDeleteTh"]')
    .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} SMS Delete Thai`);

  cy.get('textarea[formcontrolname="descriptionEn"]')
    .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} description Eng`);
  cy.get('textarea[formcontrolname="descriptionTh"]')
    .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} description Thai`);

  cy.get('input[formcontrolname="discountRevenueCode"]').type('APCP-009');

  selectMultipleFromDualList('availableListBox', 3);
  cy.get('textarea[formcontrolname="otherCondition"]').type('Other Condition '.repeat(6));
  cy.get('textarea[formcontrolname="memoDescription"]').type('Memo Description '.repeat(6));
};

/**
 * Fill CashBack PO specific fields
 */
const fillCashBackPOFields = (Module: Module, PriceType: string): void => {
  cy.get('textarea[formcontrolname="shortPromotionNameEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Short Promotion Name Eng`);
  cy.get('textarea[formcontrolname="shortPromotionNameTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Short Promotion Name Thai`);
  cy.get('textarea[formcontrolname="promotionDescriptionEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Promotion Description Eng`);
  cy.get('textarea[formcontrolname="promotionDescriptionTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Promotion Description Thai`);
  cy.get('textarea[formcontrolname="greetingLetterEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Eng`);
  cy.get('textarea[formcontrolname="greetingLetterTh"]')
    .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} Greeting Letter Thai`);
  cy.get('textarea[formcontrolname="yourPackageNameEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Your PackageName Eng`);
  cy.get('textarea[formcontrolname="yourPackageNameTh"]').type('ทดสอบ'.repeat(5));
  selectMultipleFromDualList('availableListBox', 3);
};

/**
 * Fill standard PO fields (for other types)
 */
const fillStandardPOFields = (Module: Module, PriceType: string): void => {
  const productTypes = ['FBB', 'Fixline', 'Mobile', 'Non Mobile'] as const;
  const randomValue = productTypes[Math.floor(Math.random() * productTypes.length)];
  cy.get('select[formcontrolname="productType"]').select(randomValue).should('have.value', randomValue);

  cy.get('textarea[formcontrolname="wordingInStatementEn"]')
    .type(`MOB ${Module} ${PriceType} ${day}${month} ${hours}${minutes} Greeting Letter Eng`);
  cy.get('textarea[formcontrolname="wordingInStatementTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} Greeting Letter Thai`);
  cy.get('textarea[formcontrolname="descriptionEn"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} description Eng`);
  cy.get('textarea[formcontrolname="descriptionTh"]')
    .type(`MOB ${Module} ${PriceType}${day}${month} ${hours}${minutes} description Thai`);

  cy.get('input[formcontrolname="discountRevenueCode"]').type('APCP-009');
  selectMultipleFromDualList('availableListBox', 3);
  cy.get('textarea[formcontrolname="otherCondition"]').type('Other Condition '.repeat(6));
  cy.get('textarea[formcontrolname="memoDescription"]').type('Memo Description '.repeat(6));
};

/**
 * Helper: Select multiple random options from dual list
 */
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

/**
 * Fill CashBack discount configuration
 */
const fillCashBackDiscountConfig = (Module: Module, PriceType: string): void => {
  const randomDuration = Math.floor(Math.random() * 999) + 1;
  cy.get('input[formcontrolname="duration"]').clear().type(randomDuration.toString());
  cy.get('button[class*="btn-primary"][type="button"]').click();
  cy.get('input[formcontrolname="durationFrom"]').type('1');

  cy.get('select[formcontrolname="discountType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Math.floor(Math.random() * $options.length);
      cy.get('select[formcontrolname="discountType"]').select(($options[randomIndex] as HTMLOptionElement).value);
    });

  cy.get('textarea[formcontrolname="discountNameEn"]').type(`MOB ${Module} ${PriceType}${day}${month}${hours}${minutes} Discount NameEn`);
  cy.get('textarea[formcontrolname="discountNameTh"]').type(`MOB ${Module} ${PriceType}${day}${month}${hours}${minutes} Discount Name Th`);

  const randomIndex = Math.floor(Math.random() * 2);
  cy.get('input[formcontrolname="marginalDiscount"]').eq(randomIndex).check();
  cy.get('button[class*="btn-primary"][type="button"]').eq(1).click();
  cy.get('input[formcontrolname="prorate"]').eq(randomIndex).check();

  const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

  if (randomIndex === 0) {
    cy.get('input[formcontrolname="cashBackType"]').first().check();
    const totalUsage = getRandomNumber(1000, 5000);
    const cashBackExc = getRandomNumber(50, 500);
    cy.get('input[formcontrolname="totalUsageFromExcVat"]').type(totalUsage.toString());
    cy.get('input[formcontrolname="cashBackExcVat"]').type(cashBackExc.toString());
    cy.get('input[formcontrolname="cashBackIncVat"]').type(Math.round(cashBackExc * 1.07).toString());
  } else {
    cy.get('input[formcontrolname="cashBackType"]').last().check();
    cy.get('input[formcontrolname="totalUsageFromExcVat"]').type(getRandomNumber(1000, 5000).toString());
    cy.get('input[formcontrolname="cashBackPercent"]').type(getRandomNumber(1, 20).toString());
  }
  cy.get('button.btn.btn-primary').contains('Add').click();
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
  cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.'.repeat(5));

  cy.log(`🟡 Before RandomProductSpecification | ProductClass: ${ProductClass} | subModule: ${subModule} | Module: ${Module}`);
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