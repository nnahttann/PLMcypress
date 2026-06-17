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

import { createPOWordingPools, RandomRemark, RandomProjectDescription } from './Approve/po-wording-pools';

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
type TaskListHeader = 'To Do List' | 'Unassigned Task';
type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
type CoreTaskCallback = () => void;
type ApproveFunction = (projectName: string) => void;
type GetProjectNameFn = () => string;

// อัปเดต Interface
interface ProjectBasicOptions {
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
        let matchingIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;

          const $row = Cypress.$(row);
          const rowText = $row.text().trim();

          const matches = filterCallback
            ? filterCallback($row, index)
            : rowText.includes(searchText);

          if (matches) {
            matchingIndex = index;
            found = true;
            cy.log(`✅ Found match at row ${index}`);
          }
        });

        if (found && matchingIndex >= 0) {
          // ✅ ส่ง empty jQuery + index เข้า callback
          // callback ต้องไม่ใช้ $row — ให้ re-query เองด้วย sectionHeader/searchText
          rowCallback(Cypress.$(), matchingIndex);
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

        const firstRowTextBefore = $section.find('tbody tr').first().text().trim();

        cy.wrap($nextBtn).click();

        cy.get('h3').contains(sectionHeader, { timeout: 100000 })
          .parent()
          .find('tbody tr')
          .should(($rows) => {
            expect($rows.first().text().trim()).not.to.equal(firstRowTextBefore);
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

export const ClaimProject = (projectName: string, options?: { claimBy?: 'project' | 'po' }): void => {
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const claimBy = options?.claimBy ?? 'po';

  cy.log(`🔁 Total PO to Claim: ${poCount}`);
  cy.log(`🔑 Claim mode: ${claimBy}`);

  const MAX_PAGES = 3;

  const waitForUnassignedReady = (): Cypress.Chainable => {
    return cy
      .get('h3:contains("Unassigned Task")', { timeout: 15000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
        expect($rows.length).to.be.greaterThan(0);
      });
  };

  // ✅ claimBy === 'project' → claim ครั้งเดียว
  const claimOnce = (keyword: string): void => {
    const searchAndClaimOnce = (currentPage: number = 1): void => {
      if (currentPage > MAX_PAGES) {
        cy.log(`⚠️ Checked ${MAX_PAGES} pages, not found: "${keyword}"`);
        return;
      }

      cy.log(`🔍 [Claim-Project] Page ${currentPage} keyword: "${keyword}"`);

      waitForUnassignedReady().then(($rows) => {
        let found = false;
        let foundRowIndex = -1;

        $rows.each((index: number, row: HTMLElement) => {
          if (found) return;
          const rowText = Cypress.$(row).text().trim();
          if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
            found = true;
            foundRowIndex = index;
          }
        });

        if (found) {
          cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}`);

          cy.get('h3:contains("Unassigned Task")')
            .parent()
            .find('tbody tr')
            .eq(foundRowIndex)
            .find('button.claim-top')
            .click({ force: true });

          cy.log(`✅ Claimed project (once)`);

          // ✅ รอให้ To Do List มี keyword จริงๆ ก่อน
          cy.get('h3:contains("To Do List")', { timeout: 30000 })
            .parent()
            .find('tbody tr')
            .should(($todoRows) => {
              expect($todoRows.text()).not.to.contain('Fetching data');
              expect($todoRows.text()).to.include(keyword);
            });

          cy.log(`✅ Confirmed in To Do List`);

        } else {
          cy.get('body').then(($body) => {
            const $section = $body.find('h3:contains("Unassigned Task")').parent();
            const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

            if ($nextBtn.length > 0) {
              cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
              const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
              cy.wrap($nextBtn).click();

              cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
                .parent()
                .find('tbody tr')
                .should(($r) => {
                  expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                  expect($r.text()).not.to.contain('Fetching data');
                });

              searchAndClaimOnce(currentPage + 1);
            } else {
              cy.log(`📋 No more pages, "${keyword}" not found`);
            }
          });
        }
      });
    };

    searchAndClaimOnce();
  };

  // ✅ claimBy === 'po' → claim ตามจำนวน PO
  const claimByPO = (remainingPOs: number, poIndex: number = 0, currentPage: number = 1): void => {
    if (remainingPOs <= 0) {
      cy.log('✅ All POs claimed and moved to To Do List');
      return;
    }

    if (currentPage > MAX_PAGES) {
      cy.log(`⚠️ Checked ${MAX_PAGES} pages, checking To Do List...`);
      return;
    }

    const keyword = allPoNames[poIndex] ?? `${projectName}_PO${poIndex + 1}`;
    cy.log(`🔍 [Claim-PO] Page ${currentPage} (Remaining: ${remainingPOs}) keyword: "${keyword}"`);

    waitForUnassignedReady().then(($rows) => {
      let found = false;
      let foundRowIndex = -1;

      $rows.each((index: number, row: HTMLElement) => {
        if (found) return;
        const rowText = Cypress.$(row).text().trim();
        if (rowText.includes(keyword) && !rowText.includes('Fetching data')) {
          found = true;
          foundRowIndex = index;
        }
      });

      if (found) {
        cy.log(`✅ Found - Page ${currentPage}, Row ${foundRowIndex}, keyword: "${keyword}"`);

        cy.get('h3:contains("Unassigned Task")')
          .parent()
          .find('tbody tr')
          .eq(foundRowIndex)
          .find('button.claim-top')
          .click({ force: true });

        cy.log(`✅ Claimed 1 PO`);

        // ✅ รอให้ To Do List มี keyword จริงๆ ก่อน
        cy.get('h3:contains("To Do List")', { timeout: 30000 })
          .parent()
          .find('tbody tr')
          .should(($todoRows) => {
            expect($todoRows.text()).not.to.contain('Fetching data');
            expect($todoRows.text()).to.include(keyword);
          });

        cy.log(`✅ PO confirmed in To Do List`);
        claimByPO(remainingPOs - 1, poIndex + 1, 1);

      } else {
        cy.get('body').then(($body) => {
          const $section = $body.find('h3:contains("Unassigned Task")').parent();
          const $nextBtn = $section.find('.pagination li:not(.disabled) a:contains("Next")');

          if ($nextBtn.length > 0) {
            cy.log(`➡️ Page ${currentPage} - Not found, going next...`);
            const firstRowTextBefore = $section.find('tbody tr').first().text().trim();
            cy.wrap($nextBtn).click();

            cy.get('h3:contains("Unassigned Task")', { timeout: 15000 })
              .parent()
              .find('tbody tr')
              .should(($r) => {
                expect($r.first().text().trim()).not.to.equal(firstRowTextBefore);
                expect($r.text()).not.to.contain('Fetching data');
              });

            claimByPO(remainingPOs, poIndex, currentPage + 1);
          } else {
            cy.log(`📋 No more pages, "${keyword}" not found`);
          }
        });
      }
    });
  };

  // ✅ dispatch ตาม mode
  if (claimBy === 'project') {
    claimOnce(projectName);
  } else {
    claimByPO(poCount);
  }
};

// ========================
// APPROVE PROJECT
// ========================

export const approveProject = (projectName: string): void => {
  searchInTableWithPagination(
    'To Do List',
    projectName,
    (_$row, _index) => {
      // ✅ re-query ใหม่ทั้งหมด ไม่แตะ _$row
      cy.get('h3:contains("To Do List")')
        .parent()
        .contains('td[colspan="2"]', projectName)
        .closest('tr.cursor-point')
        .as('approveRow');

      cy.get('@approveRow').should('be.visible');
      cy.get('@approveRow').click();

      cy.log(`✅ Successfully entered approval page: ${projectName}`);
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

export function assignTeamTask(
  taskIdentifier: string,
  assignee: string,
  uniqueKeyword: string = ''
): void {
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  cy.get('h3').contains('Team Task').should('be.visible');
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  const partialIdentifier = taskIdentifier.split('_')[0];
  cy.log(`🔍 Searching for: "${partialIdentifier}" keyword: "${uniqueKeyword}"`);

  if (!partialIdentifier) {
    throw new Error(`❌ taskIdentifier is empty — cannot search`);
  }

  const findAndAssignOnCurrentPage = (): void => {
    cy.get('tbody tr').then(($rows) => {
      const matchedRow = $rows.filter((_, el) => {
        const $el = Cypress.$(el);
        const projectCode = $el.find('td:nth-child(1) div').text().trim();
        const productName = $el.find('td:nth-child(2) div').text().trim();

        const hasProject =
          productName.includes(partialIdentifier) ||
          projectCode.includes(partialIdentifier);

        const hasKeyword = uniqueKeyword
          ? $el
            .find('td')
            .toArray()
            .some((td) => Cypress.$(td).text().trim().includes(uniqueKeyword))
          : true;

        return hasProject && hasKeyword;
      });

      if (matchedRow.length > 0) {
        const productNameText = Cypress.$(matchedRow[0])
          .find('td:nth-child(2) div')
          .text()
          .trim();
        cy.log(`✅ Found row — Product: "${productNameText}"`);

        const $row = matchedRow.first();
        cy.wrap($row).scrollIntoView().should('be.visible');

        // Focus + trigger Angular population ก่อน
        cy.wrap($row)
          .find('select.form-control.input-sm')
          .as('assigneeDropdown')
          .scrollIntoView()
          .focus()
          .trigger('mousedown', { force: true })
          .wait(1000); // รอ Angular populate options

        // ตรวจว่า option มีแล้ว
        cy.get('@assigneeDropdown')
          .find(`option`)
          .should('have.length.greaterThan', 1); // มากกว่า placeholder

        // set value ผ่าน jQuery + dispatch change
        cy.get('@assigneeDropdown').then(($select) => {
          $select.val(assignee);
          $select[0].dispatchEvent(new Event('change', { bubbles: true }));
        });

        cy.get('@assigneeDropdown').should('have.value', assignee);
        cy.log(`✅ Selected assignee: "${assignee}"`);

        // register alert BEFORE click
        cy.on('window:alert', (text) => {
          cy.log(`🔔 Alert: "${text}"`);
          expect(text).to.include('success');
        });

        cy.wrap($row)
          .find('button.btn-info')
          .filter((_, el) => {
            const txt = Cypress.$(el).text().trim();
            return txt === 'Set' || txt === 'Reassign';
          })
          .first()
          .should('not.be.disabled')
          .click({ force: true });

        cy.wait('@getRequest', { timeout: 30000 })
          .its('response.statusCode')
          .should('eq', 200);
        cy.log('✅ assignTeamTask complete');
      } else {
        cy.get('ul.pagination li').then(($items) => {
          const nextItem = $items.filter((_, li) => {
            return (
              Cypress.$(li).text().trim() === 'Next' &&
              !Cypress.$(li).hasClass('disabled')
            );
          });

          if (nextItem.length > 0) {
            cy.log(`➡️ Not found on this page — going next`);
            cy.wrap(nextItem.first()).find('a').click();
            cy.wait('@getRequest', { timeout: 30000 })
              .its('response.statusCode')
              .should('eq', 200);
            findAndAssignOnCurrentPage();
          } else {
            throw new Error(
              `❌ "${partialIdentifier}" (keyword: "${uniqueKeyword}") not found on any page`
            );
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
      cy.then(() => {
        const rnd5 = Math.floor(Math.random() * 90000) + 10000;
        const rnd2 = Math.floor(Math.random() * 90) + 10;

        cy.contains('label', 'FEATURE_SUB_CODE').closest('.col-md-4').find('input').clear().type(rnd5.toString());
        cy.contains('label', 'GROUP_FEATURE').closest('.col-md-4').find('input').clear().type(rnd2.toString());
      });

      scrollAndWait();
      cy.contains('button', buttonText, { timeout: 3000000 }).should('be.visible').click();
    },
    'ComplexLogout'
  );
};

export const approveProjectSPADSup = (projectName: string): void => _approveSPADSup(projectName, true);
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void => _approveSPADSup(projectName, false);
export const approveProjectSPAD = (projectName: string, isComplex = true): void => _approveSPADSup(projectName, isComplex);

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

        // FIX: ใช้ .then() เพื่อดีเลย์การสุ่มค่า Math.random() ไปทำงานตอน Execution Time จริงๆ 
        // และใช้ .clear() เพื่อล้างค่าเดิมก่อนพิมพ์ค่าใหม่เสมอ
        const fillRandom = (labelText: string, prefix: string) => {
          cy.get(`label:contains("${labelText}")`)
            .parent()
            .next('div')
            .find('input')
            .then(($input) => {
              const rnd = Math.floor(Math.random() * 90000) + 10000;
              cy.wrap($input).clear().type(`${prefix}${rnd}`);
            });
        };

        fillRandom('PACKAGE_TYPE', 'PT');
        fillRandom('PACKAGE_ID (PP ID)', 'PP');
        fillRandom('PACKAGE_SUB_TYPE', 'PST');
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

export const approveProjectSPADDOER = (projectName: string): void => _approveSPADDoer(projectName, false);
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

        // FIX: เพิ่ม .and('not.be.disabled') เพื่อรอให้ปุ่มหาย disabled ก่อน และใส่ { force: true } เพื่อบังคับกด
        cy.contains('button', 'Send PlugIN', { timeout: 3000000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });

        clickYesIfExists(10000, 'first');

        pollUntilSPADDeployReady();
        cy.removeAllListeners('window:alert');

        cy.once('window:alert', (alertText) => {
          if (!alertText.includes('Do you want to Approve') && !alertText.includes('Call API Plugin Success')) {
            throw new Error(`Unexpected alert text (Promote): ${alertText}`);
          }
        });

        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });

        clickYesIfExists(10000, 'last');
      } else {
        scrollAndWait();
        cy.contains('button', 'Promote to SPAD Deploy', { timeout: 3000000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });
      }
    },
    isMainFlow ? 'StopAfterCore' : 'AlertAndLogout'
  );
};

export const approveProjectSPADTester = (projectName: string): void => _approveSPADTester(projectName, false);
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
type FlowPattern = 'CGMD_FIRST' | 'SPAD_FIRST' | 'INTERLEAVED' | 'CGMD_SPAD_ALTERNATE_C' | 'CGMD_SPAD_ALTERNATE_S' | 'RANDOM';

const shuffleArray = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const FLOW_PATTERN: FlowPattern = (() => {
  const env = (globalThis as any).Cypress?.env?.('FLOW_PATTERN');
  const valid: FlowPattern[] = [
    'CGMD_FIRST',
    'SPAD_FIRST',
    'INTERLEAVED',
    'CGMD_SPAD_ALTERNATE_C',
    'CGMD_SPAD_ALTERNATE_S',
    'RANDOM',
  ];
  return valid.includes(env) ? (env as FlowPattern) : valid[Math.floor(Math.random() * valid.length)];
})();

const declareTest = (name: string, fn: () => void): void => {
  it(name, () => {
    cy.log(`🎲 [FLOW:${FLOW_PATTERN}] Running: ${name}`);
    fn();
  });
};

type TestEntry = { name: string; group: 'CGMD' | 'SPAD' | 'OTHER'; fn: () => void };

const SPAD_ORDER = ['Spadsup', 'Spaddoer', 'Spadtester', 'Spaddeploy'];
const CGMD_ORDER = ['Config', 'Tester'];

const sortSpad = (arr: TestEntry[]): TestEntry[] =>
  [...arr].sort((a, b) => {
    const ai = SPAD_ORDER.findIndex(k => a.name.includes(k));
    const bi = SPAD_ORDER.findIndex(k => b.name.includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

const sortCgmd = (arr: TestEntry[]): TestEntry[] =>
  [...arr].sort((a, b) => {
    const ai = CGMD_ORDER.findIndex(k => a.name.includes(k));
    const bi = CGMD_ORDER.findIndex(k => b.name.includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

// ─────────────────────────────────────────────
// Standard flow — randomisable
// ─────────────────────────────────────────────
const declareRoleTests = (tests: TestEntry[]): void => {
  const byGroup = (g: TestEntry['group']) => tests.filter(t => t.group === g);
  const cgmd = sortCgmd(byGroup('CGMD'));
  const spad = sortSpad(byGroup('SPAD'));
  const other = byGroup('OTHER');

  const spadsup = spad.find(t => t.name.includes('Spadsup'));
  const spaddoer = spad.find(t => t.name.includes('Spaddoer'));
  const spadRest = sortSpad(spad.filter(t =>
    !t.name.includes('Spadsup') && !t.name.includes('Spaddoer')
  ));
  const cgmdConfig = cgmd.find(t => t.name.includes('Config'));
  const cgmdTester = cgmd.find(t => t.name.includes('Tester'));
  const cgmdRest = sortCgmd(cgmd.filter(t =>
    !t.name.includes('Config') && !t.name.includes('Tester')
  ));

  let ordered: TestEntry[];

  switch (FLOW_PATTERN) {
    case 'CGMD_FIRST':
      ordered = [...cgmd, ...spad, ...other];
      break;

    case 'SPAD_FIRST':
      ordered = [...spad, ...cgmd, ...other];
      break;

    case 'INTERLEAVED': {
      const s = [...spad];
      const c = [...cgmd];
      const interleaved: TestEntry[] = [];
      if (s.length) interleaved.push(s.shift()!); // Spadsup first
      interleaved.push(...c);
      interleaved.push(...s); // Spaddoer, Spadtester, Spaddeploy
      ordered = [...interleaved, ...other];
      break;
    }

    case 'CGMD_SPAD_ALTERNATE_C':
      ordered = [
        ...(cgmdConfig ? [cgmdConfig] : []),
        ...(spadsup ? [spadsup] : []),
        ...(cgmdTester ? [cgmdTester] : []),
        ...(spaddoer ? [spaddoer] : []),
        ...cgmdRest,
        ...spadRest,
        ...other,
      ];
      break;

    case 'CGMD_SPAD_ALTERNATE_S':
      ordered = [
        ...(spadsup ? [spadsup] : []),
        ...(cgmdConfig ? [cgmdConfig] : []),
        ...(spaddoer ? [spaddoer] : []),
        ...(cgmdTester ? [cgmdTester] : []),
        ...cgmdRest,
        ...spadRest,
        ...other,
      ];
      break;

    case 'RANDOM': {
      const mixed = shuffleArray([...cgmd, ...spad]);
      // lock Spadsup before Spaddoer
      const si = mixed.findIndex(t => t.name.includes('Spadsup'));
      const di = mixed.findIndex(t => t.name.includes('Spaddoer'));
      if (si !== -1 && di !== -1 && di < si) {
        [mixed[si], mixed[di]] = [mixed[di], mixed[si]];
      }
      // lock Config before Tester
      const ci = mixed.findIndex(t => t.name.includes('Config'));
      const ti = mixed.findIndex(t => t.name.includes('Tester'));
      if (ci !== -1 && ti !== -1 && ti < ci) {
        [mixed[ci], mixed[ti]] = [mixed[ti], mixed[ci]];
      }
      ordered = [...mixed, ...other];
      break;
    }

    default:
      ordered = [...cgmd, ...spad, ...other];
  }

  ordered.forEach(t => declareTest(t.name, t.fn));
};

const declarePluginTests = (tests: TestEntry[]): void => {
  const baseCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && !t.name.includes('Plugin')));
  const spads = sortSpad(tests.filter(t => t.group === 'SPAD'));
  const pluginCgmd = sortCgmd(tests.filter(t => t.group === 'CGMD' && t.name.includes('Plugin')));
  const other = tests.filter(t => t.group === 'OTHER');

  const ordered: TestEntry[] = [
    ...baseCgmd,   // Config → Tester (base)
    ...spads,      // Spadsup (depends on base CGMD)
    ...pluginCgmd, // Config (Plugin) → Tester (Plugin) (depends on Spadsup)
    ...other,
  ];

  cy.log(`🔌 [PLUGIN FLOW] order: ${ordered.map(t => t.name).join(' → ')}`);
  ordered.forEach(t => declareTest(t.name, t.fn));
};

// ─────────────────────────────────────────────
// Test definitions
// ─────────────────────────────────────────────
const STANDARD_TESTS: TestEntry[] = [
  { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }) },
  { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }) },
  { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po' }) },
  { name: 'Spaddoer role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po' }) },
  { name: 'Spadtester role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po' }) },
  { name: 'Spaddeploy role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po' }) },
  { name: 'ACTM role', group: 'OTHER', fn: () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po' }) },
  { name: 'APO role', group: 'OTHER', fn: () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po' }) },
];

const PLUGIN_TESTS: TestEntry[] = [
  { name: 'CGMD Config cbs role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS') },
  { name: 'CGMD Tester CBS role', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS') },
  { name: 'Spadsup role', group: 'SPAD', fn: () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSupCGMDPlugin, { searchBy: 'po' }) },
  { name: 'CGMD Config cbs role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPREMainNotComplex, 'PlugIN') },
  { name: 'CGMD Tester CBS role (Plugin)', group: 'CGMD', fn: () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPREPlugin, 'PlugIN') },
];

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

          cy.log(`🎲 Randomly selected Bill Period: ${selectedValue}`);

          cy.get(selector).select(selectedValue, { force: true });
        });
    } else {
      cy.log(`⏭️ Skipped: ${selector} not found`);
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

  cy.get('mat-option .mat-option-text').then(($options) => {
    const randomIndex = Math.floor(Math.random() * $options.length);

    // capture text ก่อน click — ป้องกัน CDK overlay re-render สลับ index
    const selectedText = $options.eq(randomIndex).text().trim();
    cy.log(`🎲 Selected: "${selectedText}"`);

    // click ด้วย text แทน index เพื่อความ stable
    cy.contains('mat-option .mat-option-text', selectedText).click({ force: true });

    // assert จาก text ที่ capture ไว้
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
      cy.log(`✅ autoAddService5g selected: ${randomValue}`);
    } else {
      cy.log('ℹ️ autoAddService5g not found — skipping');
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
    ClaimProject(finalProjectName, { claimBy: 'project' });
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
  cy.contains('span', 'Menu', { timeout: 100000 }).click();
  cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');
  cy.get('a[href="#/workspace-home/workspace"]').click();
  cy.url().should('include', '/workspace-home/workspace', { timeout: 1000000 });
};

const performApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction,
  options?: {
    searchBy?: 'project' | 'po';
    assignee?: string;
    billingSystem?: string;
  }
): void => {
  loginAndWaitReady(user, pass);

  if (options?.assignee) {
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);
  }

  const projectNamePONAME: string = getStandardProjectName();
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const searchBy = options?.searchBy ?? 'po';

  cy.log(`📋 Project: ${projectNamePONAME}`);
  cy.log(`🔁 Total PO to process: ${poCount}`);
  cy.log(`🔍 Search mode: ${searchBy}`);

  const approveNextPO = (index: number): void => {
    if (index >= poCount) {
      cy.log('✅ All POs approved');
      return;
    }

    const currentUniqueKeyword: string =
      searchBy === 'project'
        ? projectNamePONAME
        : allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;

    cy.log(`📦 [${index + 1}/${poCount}] Processing: "${currentUniqueKeyword}"`);

    if (options?.assignee) {
      assignTaskViaTracking(projectNamePONAME, options.assignee, currentUniqueKeyword);
      navigateToWorkspace();
      cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
    } else {
      cy.get('h3:contains("To Do List")', { timeout: 15000 })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
          expect($rows.text()).not.to.contain('Fetching data');
        });

      searchInTableWithPagination(
        'To Do List',
        currentUniqueKeyword,
        () => {
          cy.get('h3:contains("To Do List")')
            .parent()
            .find('tbody tr.cursor-point')
            .filter((_i, el) => Cypress.$(el).text().includes(currentUniqueKeyword))
            .first()
            .as('targetRow');

          cy.get('@targetRow').should('be.visible').click();
          cy.log(`✅ [${index + 1}/${poCount}] Entered PO approval page`);
        },
        {
          waitAfterNext: 2000,
          filterCallback: ($row) => {
            const rowText = $row.text().trim();
            return rowText.includes(currentUniqueKeyword) && !rowText.includes('Fetching data');
          }
        }
      );
    }

    approveFunction(projectNamePONAME);

    if (index < poCount - 1) {
      if (options?.assignee) cy.wait(2000);
      navigateToWorkspace();

      cy.get('h3:contains("To Do List")', { timeout: 15000 })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
          expect($rows.text()).not.to.contain('Fetching data');
          expect($rows.length).to.be.greaterThan(0);
        });

      approveNextPO(index + 1);
    }
  };

  approveNextPO(0);
};

const performRoleTaskWithAssignment = (
  user: string,
  pass: string,
  assignee: string,
  approveFunction: ApproveFunction,
  billingSystem: string = '',
  options?: { searchBy?: 'project' | 'po' }
): void => {
  performApprovalRole(user, pass, approveFunction, {
    assignee,
    billingSystem,
    searchBy: options?.searchBy,
  });
};

const performSimpleApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction,
  options?: { searchBy?: 'project' | 'po' }
): void => {
  performApprovalRole(user, pass, approveFunction, {
    searchBy: options?.searchBy,
  });
};

// ========================
// HELPERS
// ========================

const registerCksInitialIntercepts = (): void => {
  cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');
};

const registerProjectPageIntercepts = (): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
  cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
  cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');
};

const registerPoEnhancementIntercepts = (): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/mass-enh-po-detail/getByPoEnhRowId/**').as('getPoEnhDetail');
  cy.intercept('GET', '/PLMSpringBoot/api/check-generate-po-enh/**').as('getCheckGenPoEnh');
  cy.intercept('GET', '/PLMSpringBoot/api/check-sff-product-enh/**').as('getCheckSffEnh');
};

const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const yyyy = tomorrow.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ========================
// CKS ROLE EXECUTION
// ========================

const executeCKSRole = (
  projectNameStrategy: 'standard' | 'ontop',
  customSteps: () => void,
  declareFn: () => void = () => { },
  beforeApprove: () => void = beforeapproveCKS,
  overrideProjectName?: string
): void => {
  it('CKS role', () => {
    let getProjectName: GetProjectNameFn = overrideProjectName
      ? () => overrideProjectName
      : projectNameStrategy === 'standard'
        ? getStandardProjectName
        : getOntopProjectName;

    // getProjectName = () => 'MOB PRE OT Main PRJ 0611 0905';

    cy.log(String(Cypress.env('poCount')));
    standardCksPoEnhancementFlow(getProjectName, customSteps, beforeApprove);
  });

  declareFn();
};

// ========================
// CKS PO ENHANCEMENT FLOW
// ========================

const handleProductNameTrim = (): void => {
  cy.get('input[formcontrolname="productName"]').each(($input) => {
    cy.wrap($input)
      .siblings('small')
      .invoke('text')
      .then((text) => {
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return;

        const currentCounter = parseInt(match[1], 10);
        const maxLen = parseInt(match[2], 10);

        cy.wrap($input).invoke('val').then((currentVal) => {
          const valStr = (currentVal || '').toString();
          let newVal = valStr.trimEnd();

          if (currentCounter > maxLen || valStr.length > maxLen) {
            newVal = newVal.substring(0, maxLen);
          }

          if (newVal !== valStr) {
            cy.log(`✏️ แก้ไข PO Name: "${valStr}" -> "${newVal}" (Max: ${maxLen})`);
            cy.wrap($input).clear().type(newVal).blur();
          }
        });
      });
  });
};

const handlePoDetailRoute = (customStepsCallback: () => void): void => {
  cy.wait('@getPoEnhDetail', { timeout: 60000 });
  cy.wait('@getCheckGenPoEnh', { timeout: 60000 });
  cy.wait('@getCheckSffEnh', { timeout: 60000 });

  handleProductNameTrim();

  cy.wait(3500);
  customStepsCallback();
};

const handleAdditionalRoute = (customStepsCallback: () => void): void => {
  cy.log('ℹ️ Landed on mass-enh-additional route — skipping PO detail waits');
  cy.wait(3500);
  customStepsCallback();
};

const enhanceSinglePO = (
  index: number,
  actualCount: number,
  projectPageUrl: string,
  customStepsCallback: () => void,
): void => {
  cy.log(`📦 [${index + 1}/${actualCount}] Starting Enhance PO loop`);

  registerPoEnhancementIntercepts();

  cy.get('button.btn-sample')
    .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
    .eq(index)
    .scrollIntoView({ ensureScrollable: false })
    .should('be.visible')
    .click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  cy.url()
    .should('match', /mass-enh-product-offering-detail|mass-enh-project-home\/mass-enh-additional/)
    .then((url) => {
      if (url.includes('mass-enh-product-offering-detail')) {
        handlePoDetailRoute(customStepsCallback);
      } else {
        handleAdditionalRoute(customStepsCallback);
      }

      backToCksDoer();

      if (index < actualCount - 1) {
        cy.log(`🔙 Done PO ${index + 1}. Navigating back to project page...`);
        // cy.visit(projectPageUrl);
        cy.url().should('include', '/new-flow/home/newcks/cks-doer');

        registerProjectPageIntercepts();
        cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });
        cy.wait(3000);
      }
    });
};

const standardCksPoEnhancementFlow = (
  getProjectNameFn: GetProjectNameFn,
  customStepsCallback: () => void,
  beforeApproveCallback: () => void
): void => {
  login(cks, ckspass);

  registerCksInitialIntercepts();
  cy.wait(['@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
  cy.get('body').should('be.visible');

  const finalProjectName = getProjectNameFn();
  cy.log('Project ใช้สำหรับ Claim: ' + finalProjectName);

  ClaimProject(finalProjectName, { claimBy: 'project' });

  // ✅ capture URL ตอนอยู่ที่ project page ก่อน approveProject navigate ออกไป
  cy.url().then((projectPageUrl) => {
    cy.log(`📌 Project page URL: ${projectPageUrl}`);
    Cypress.env('projectPageUrl', projectPageUrl);
  });

  approveProject(finalProjectName);

  cy.then(() => {
    registerProjectPageIntercepts();
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 });

    cy.get('button.btn-sample')
      .filter((_, el) => el.textContent?.trim() === 'Enhance PO')
      .then(($buttons) => {
        const actualCount = $buttons.length;
        cy.log(`🔢 Actual Enhance PO buttons found: ${actualCount}`);

        const projectPageUrl = Cypress.env('projectPageUrl') as string;

        Cypress._.times(actualCount, (index) => {
          enhanceSinglePO(index, actualCount, projectPageUrl, customStepsCallback);
        });

        cy.log(`✅ All ${actualCount} PO(s) enhanced. Running beforeApprove...`);
        beforeApproveCallback();
      });
  });
};
// ========================
// BEFORE APPROVE CKS
// ========================

export const beforeapproveCKS = (): void => standardBeforeApproveCKS();
export const beforeapproveCKSontop = (): void => standardBeforeApproveCKS();

const backToCksDoer = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find('.cdk-overlay-backdrop').length > 0) {
      cy.get('.cdk-overlay-backdrop').click({ force: true });
      cy.get('.cdk-overlay-backdrop').should('not.exist');
    }
  });

  cy.contains('button', 'Back').should('be.visible').and('not.be.disabled').click();
  cy.contains('button', 'Yes').should('be.visible').click();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait(5000);

  cy.url({ timeout: 60000 }).should('include', '/new-flow/home/newcks/cks-doer');
  cy.get('body', { timeout: 60000 }).should('be.visible');
};

const standardBeforeApproveCKS = (): void => {
  // backToCksDoer();

  cy.contains('label', 'Fast Lane :').parent().next().find('input[type="checkbox"]').check();
  cy.get('.row.col-md-11').find('input[type="checkbox"]').check();

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.wait(['@getRequest'], { timeout: 100000 });

  cy.get('input[aria-label="Date input field"]').eq(1).type(getTomorrowDateString());

  cy.intercept('GET', '**/api-cks/PromoteFromCksDoer/**').as('submitApprove');
  cy.contains('button', 'Approve').click();
  cy.wait('@submitApprove', { timeout: 3000000 }).its('response.statusCode').should('eq', 200);

  cy.url({ timeout: 3000000 }).should('include', '/#/workspace-home/workspace');
  cy.wait(7000);

  const finalProjectName = getStandardProjectName();
  ClaimProject(finalProjectName, { claimBy: 'project' });
  approveProject(finalProjectName);

  cy.url({ timeout: 3000000 }).should('include', '/#/new-flow/home/newcks/cks-checker');
  cy.get('body', { timeout: 3000000 }).should('be.visible');
  cy.scrollTo('bottom');
  cy.wait(3500);

  cy.intercept('GET', '**/api-cks/promoteFromCksCheckerToCenter/**').as('promoteChecker');
  cy.intercept('POST', '**/api/flw-cgmd/assigneecgmdconfig/**').as('assignCgmd');

  cy.contains('button', 'Approve To CGMD', { timeout: 3000000 }).should('be.visible').click();

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
// AFTER MKT ONTOP FUNCTIONS
// ========================

export const afterMKTontopPOST = (): void => _afterMKTontopCommon('POST');
export const afterMKTontopENTER = (): void => _afterMKTontopCommon('ENTER');
export const afterMKTontopMUSIC = (): void => _afterMKTontopCommon('MUSIC');


const _afterMKTontopCommon = (module: string): void => {
  executeCKSRole('ontop', () => {
    checkAndFillContentType();
    checkAndUpdatePriority();
    checkAndUpdateVerticalAppPriority();
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

// ========================
// AFTER MKT FUNCTIONS
// ========================
export const afterMKTothersubgroup = (PoSubGroup: string, Module: string): void => {
  const sasffTest = (): void => {
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
  };

  if (Module === 'POST') {
    executeCKSRole(
      'standard',
      () => { },
      () => {
        it('CGMD Config IRB role', () => performRoleTaskWithAssignment(cgcirb, cgcirbpass, 'cgcirb', approveProjectCGMD, 'IRB'));
        it('CGMD Tester IRB role', () => performRoleTaskWithAssignment(cgtirb, cgtirbpass, 'cgtirb', approveProjectCGMDtester, 'IRB'));
        sasffTest();
        it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM));
        it('OPER role', () => performSimpleApprovalRole(oper, operpass, approveProjectOPER));
      }
    );

  } else if (Module === 'PRE') {
    executeCKSRole(
      'standard',
      () => { },
      () => {
        it('CGMD Config cbs role', () => performRoleTaskWithAssignment(cgccbs, cgccbspass, 'cgccbs', approveProjectCGMDPRE, 'CBS', { searchBy: 'po' }));
        it('CGMD Tester CBS role', () => performRoleTaskWithAssignment(cgtcbs, cgtcbspass, 'cgtcbs', approveProjectCGMDtesterPRE, 'CBS', { searchBy: 'po' }));
        sasffTest();
        it('Spadsup role', () => performSimpleClaimAndApprovalRole(spadsup, spadsuppass, approveProjectSPADSup, { searchBy: 'po' }));
        it('Spaddoer role', () => performSimpleClaimAndApprovalRole(spaddoer, spaddoerpass, approveProjectSPADDOER, { searchBy: 'po' }));
        it('Spadtester role', () => performSimpleClaimAndApprovalRole(spadtest, spadtestpass, approveProjectSPADTester, { searchBy: 'po' }));
        it('Spaddeploy role', () => performSimpleClaimAndApprovalRole(spaddp, spaddppass, approveProjectSPADdeploy, { searchBy: 'po' }));
        it('ACTM role', () => performSimpleApprovalRole(actm, actmpass, approveProjectACTM, { searchBy: 'po' }));
        it('APO role', () => performSimpleApprovalRole(apo, apopass, approveProjectAPO, { searchBy: 'po' }));
      }
    );
  }
};

export const afterMKTMAINPOST = (): void => {
  executeCKSRole(
    'standard',
    () => {
      checkAndFillContentType();
      checkAndUpdatePriority();
      checkAndUpdateVerticalAppPriority();
      smsCKSPOST();
      Tariff();
    },
    () => afterCKSPOST()
  );
};

export const afterMKTMainUsagePOST = afterMKTMAINPOST;
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
// Shared CKS step blocks
// ─────────────────────────────────────────────

const stepsCKSMain = (): void => {
  dropdownRecurringCKSMain();
  Randomdropdown();
  unregister();
  addauto5gCKS();
  checkAndFillContentType();
  checkAndUpdatePriority();
  checkAndUpdateVerticalAppPriority();
};

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

const stepsOntopNotComplex = (): void => {
  addauto5gCKS();
  dropdownRecurringCKS();
  diyflagCKS();
  unregister();
  checkAndUpdatePriority();
  checkAndUpdateVerticalAppPriority();
};

// ─────────────────────────────────────────────
// MKT Main exports
// ─────────────────────────────────────────────

export const afterMKTMainPRE_FullSpadFlow = (): void => {
  executeCKSRole(
    'standard',
    () => { stepsCKSMain(); CopyDeductFail('enhancement'); },
    () => declareRoleTests(STANDARD_TESTS)
  );
};

export const afterMKTMainPRE_NotComplex = (): void => {
  executeCKSRole(
    'standard',
    () => { stepsCKSMain(); CopyDeductFail('enhancement'); },
    () => declareRoleTests(PLUGIN_TESTS)
  );
};

export const afterMKTOntop_NotComplex = (): void => {
  executeCKSRole(
    'standard',
    stepsOntopNotComplex,
    () => declareRoleTests(PLUGIN_TESTS)
  );
};


// ─────────────────────────────────────────────
// MKT Ontop exports
// ─────────────────────────────────────────────

const _runOntop = (afterFn: (module: string) => void, module: string): void => {
  executeCKSRole(
    'ontop',
    stepsOntopPRE,
    () => afterFn(module)
  );
};

export const afterMKTontopPRE = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREENTER = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREENTERPlugin = (): void => _runOntop(afterCKSPREPlugin, 'ENTER');
export const afterMKTontopPREMusicPlugin = (): void => _runOntop(afterCKSPREPlugin, 'MUSIC');
export const afterMKTontopPREMUSIC = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');
export const afterMKTontopPREUsage = (): void => _runOntop(afterCKSCommonPRE, 'PRE');
export const afterMKTontopPREUsageEnter = (): void => _runOntop(afterCKSCommonPRE, 'ENTER');
export const afterMKTontopPREUsageMusic = (): void => _runOntop(afterCKSCommonPRE, 'MUSIC');

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
// BACK BASIC INFO
// ========================

export const backBacicInfo = (): void => {
  cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getRequest4');
  cy.get('.sidebar-nav > :nth-child(2) > a').click({ timeout: 100000 });
  cy.get('.modal-body > .col-md-12 > :nth-child(1) > .btn', { timeout: 30000 })
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
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // ✅ รอ input ใน DOM — Angular *ngIf อาจ render ช้า
  cy.get('input[type="file"]', { timeout: 30000 }).should('exist');

  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]', { timeout: 15000 }).selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: '1.txt',
        mimeType: 'text/plain',
      },
      { force: true }
    );
  });

  cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  beforeapproveMKT();
};
// ========================
// SMS WORDING FUNCTIONS
// ========================

const closeSuccessModal = (): void => {
  cy.contains('.modal-title', 'Save Result', { timeout: 20000 })
    .closest('.modal-content')
    .find('.modal-footer button.btn-danger')
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
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] || '' as unknown as T;
  const flag = () => Math.random() < 0.8 ? 'Send' : "Don't Send";

  const WAIT = 1000;
  const SCROLL = 500;

  // ── Centralized Selectors ─────────────────────────────────────────────────
  const SEL = {
    shortPromo: 'textarea[formcontrolname="shortPromotionName"]',
    cmsDisplay: 'textarea[formcontrolname="cmsDisplay"]',
    promoDesc: 'textarea[formcontrolname="promotionDescription"]',
    checkCurrent: 'textarea[formcontrolname="smsCheckCurrent"]',

    greetingFlag: 'select[formcontrolname="smsGreetingSendFlag"]',
    greetingText: 'textarea[formcontrolname="smsGreeting"]',
    confirmSubFlag: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]',

    deleteFlag: 'select[formcontrolname="smsDeleteSendFlag"]',
    deleteText: 'textarea[formcontrolname="smsDelete"]',
    deleteDefaultRadio: 'input[formcontrolname="SmsDeletedefaultWordingFlag"]',

    promoteFlag: 'select[formcontrolname="smsPromotePackSendFlag"]',
    promoteText: 'textarea[formcontrolname="smsPromotePack"]',

    lastMinuteFlag: 'select[formcontrolname="lastMinuteAlertSendFlag"]',
    lastMinuteRadio: 'input[formcontrolname="lastMinuteAlertDefaultWordingFlag"]',
    lastMinuteText: 'textarea[formcontrolname="smsNotificationLastMinuteAlert"]',

    beforeFeeFlag: 'select[formcontrolname="smsBeforeFeeDeductSendFlag"]',
    beforeFeeRadio: 'input[formcontrolname="defaultWordingFlag"]',
    beforeFeeText: 'textarea[formcontrolname="smsNotificationBeforeFeeDeduction"]',

    recSuccessFlag: 'select[formcontrolname="recurringDeductSuccessAlertSendFlag"]',
    recSuccessRadio: 'input[formcontrolname="recurringDeductSuccessAlertDefaultWordingFlag"]',
    recSuccessText: 'textarea[formcontrolname="recurringFeeDeductSuccessAlert"]',

    recFailFlag: 'select[formcontrolname="recurringDeductFailAlertSendFlag"]',
    recFailRadio: 'input[formcontrolname="recurringDeductFailAlertDefaultWordingFlag"]',
    recFailText: 'textarea[formcontrolname="recurringFeeDeductFailAlert"]',

    beforePromoFlag: 'select[formcontrolname="beforePromotionExpAlertSendFlag"]',
    beforePromoDeduct: 'input[formcontrolname="beforePromotionExpAlertDeduction"]',
    beforePromoUnit: 'select[formcontrolname="beforePromotionExpAlertDeductionUnit"]',
    beforePromoDefaultRadio: 'input[formcontrolname="beforePromotionExpAlertDefaultWordingFlag"]',
    beforePromoText: 'textarea[formcontrolname="beforePromotionExpAlert"]',

    promoExpFlag: 'select[formcontrolname="promotionExpAlertSendFlag"]',
    promoExpRadio: 'input[formcontrolname="promotionExpAlertDefaultWordingFlag"]',
    promoExpText: 'textarea[formcontrolname="promotionExpAlert"]',

    marketingName: 'textarea[formcontrolname="marketingName"]',
    yourPackage: 'textarea[formcontrolname="yourPackage"]',
    greetingLetter: 'textarea[formcontrolname="greetingLetter"]',
    saveBtn: '.container-fluid > :nth-child(3) > .btn'
  };

  // ── Cypress helpers ───────────────────────────────────────────────────────
  const scrollTo = (sel: string, label: string) => {
    cy.log(`📌 Scrolling to: ${label}`);
    cy.get(sel).first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
    cy.wait(WAIT);
  };

  const withSection = (sel: string, label: string, fn: ($el: JQuery<HTMLElement>) => void) => {
    cy.get('body').then(($b) => {
      const $target = $b.find(sel);
      if (!$target.length) return;
      scrollTo(sel, label);
      fn($target);
      cy.wait(WAIT);
    });
  };

  const fillTextareaMulti = ($el: JQuery<HTMLElement>, en: string, th: string, maxEn: number, maxTh: number) => {
    $el.each((idx, el) => {
      const $textarea = Cypress.$(el);
      if ($textarea.is(':disabled')) return;
      const cleaned = (idx % 2 === 0) ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($textarea).focus().clear({ force: true }).type(cleaned, { delay: 0, force: true })
        .trigger('input', { bubbles: true, force: true }).trigger('change', { bubbles: true, force: true }).blur({ force: true });
    });
    cy.wait(1000);
  };

  const fillIfEmpty = ($el: JQuery<HTMLElement>, en: string, th: string, maxEn: number, maxTh: number): void => {
    $el.each((idx, el) => {
      const $textarea = Cypress.$(el);
      if ($textarea.is(':disabled')) return;
      if (String($textarea.val() ?? '').trim()) return;
      const cleaned = (idx % 2 === 0) ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($textarea).focus().type(cleaned, { delay: 0, force: true })
        .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
    });
  };

  const selectFlag = ($el: JQuery<HTMLElement>, label: string): 'Send' | "Don't Send" => {
    const v = flag();
    cy.log(`🎲 ${label} = ${v}`);
    cy.wrap($el).select(v, { force: true });
    return v;
  };

  const trimOverflow = (): void => {
    cy.log('✂️ Trimming overflowed generated fields...');
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
      if ($el.is(':disabled')) return;
      const max = parseInt($el.attr('maxlength') || '9999', 10);
      const val = String($el.val() ?? '');
      if (val.length <= max) return;
      let trimmed = val.substring(0, max).trimEnd();
      if (trimmed.includes(' ')) {
        const ls = trimmed.lastIndexOf(' ');
        if (ls > max * 0.7) trimmed = trimmed.substring(0, ls);
      }
      cy.wrap($el).then(($native) => {
        const nativeEl = $native[0] as HTMLTextAreaElement;
        nativeEl.value = trimmed;
        nativeEl.dispatchEvent(new Event('input', { bubbles: true }));
        nativeEl.dispatchEvent(new Event('change', { bubbles: true }));
      }).blur({ force: true });
    });
    cy.wait(1000);
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(2000);

  cy.then(() => {
    const p = Cypress.env('formattedDateMain') || Cypress.env('formattedDate') || Cypress.env('projectName') || 'Product';
    const poName = Cypress.env('poName') || 'Product Offering';
    const poolsData = createPOWordingPools(p, poName, type, 'recurring');

    const pools = {
      shortPromo: { EN: () => pick(poolsData.shortPromotionName.EN), TH: () => pick(poolsData.shortPromotionName.TH) },
      cmsDisplay: { EN: () => pick(poolsData.description.EN), TH: () => pick(poolsData.description.TH) },
      promoDesc: { EN: () => pick(poolsData.promotionDescription.EN), TH: () => pick(poolsData.promotionDescription.TH) },
      checkCurrent: { EN: () => pick(poolsData.yourPackageName.EN), TH: () => pick(poolsData.yourPackageName.TH) },
      greeting: { EN: () => pick(poolsData.smsGreeting.EN), TH: () => pick(poolsData.smsGreeting.TH) },
      delete: { EN: () => pick(poolsData.smsDelete.EN), TH: () => pick(poolsData.smsDelete.TH) },
      promotePack: { EN: () => pick(poolsData.smsPromotePack.EN), TH: () => pick(poolsData.smsPromotePack.TH) },
      lastMinute: { EN: () => pick(poolsData.lastMinuteAlert.EN), TH: () => pick(poolsData.lastMinuteAlert.TH) },
      beforeFee: { EN: () => pick(poolsData.beforeFeeDeduction.EN), TH: () => pick(poolsData.beforeFeeDeduction.TH) },
      recSuccess: { EN: () => pick(poolsData.recurringSuccess.EN), TH: () => pick(poolsData.recurringSuccess.TH) },
      recFail: { EN: () => pick(poolsData.recurringFail.EN), TH: () => pick(poolsData.recurringFail.TH) },
      beforePromoExp: { EN: () => pick(poolsData.beforePromoExpired.EN), TH: () => pick(poolsData.beforePromoExpired.TH) },
      promoExp: { EN: () => pick(poolsData.promoExpired.EN), TH: () => pick(poolsData.promoExpired.TH) },
      marketingName: () => pick(poolsData.shortPromotionName.EN),
      yourPackage: { EN: () => pick(poolsData.yourPackageName.EN), TH: () => pick(poolsData.yourPackageName.TH) },
      greetingLetter: { EN: () => pick(poolsData.greetingLetter.EN), TH: () => pick(poolsData.greetingLetter.TH) },
    };

    cy.log('🎲 SMS Wording: สุ่ม flag ใหม่ทีละ section');
    const useGenerate = Math.random() < 0.5;
    cy.log(`🎲 SMS Wording mode: ${useGenerate ? '🤖 Generate Button' : '✍️ Manual Type'}`);

    // ════════════════════════════════════════════════════════════════════════
    //  🌍 LOGIC สุ่มภาษาเพิ่ม (Dual List Box)
    // ════════════════════════════════════════════════════════════════════════
    const extraLangOptions = ['Burmese', 'Chinese', 'Japanese', 'Korean', 'Lao'];
    const shouldAddExtraLangs = Math.random() < 0.2;
    let selectedExtraLangs: string[] = [];

    if (shouldAddExtraLangs) {
      const count = Cypress._.random(1, 2);
      selectedExtraLangs = Cypress._.sampleSize(extraLangOptions, count);
      cy.log(`🌍 สุ่มเพิ่มภาษา: ${selectedExtraLangs.join(', ')}`);
      cy.get('ng2-dual-list-box select[formcontrolname="availableListBox"]').select(selectedExtraLangs, { force: true });
      cy.get('ng2-dual-list-box button.str').should('not.be.disabled').click({ force: true });
      cy.wait(1500);
    }

    // ✨ Helper สำหรับจัดการ Default Wording (สุ่ม Yes/No แบบยืดหยุ่น)
    // ประกาศใน cy.then เพื่อให้เข้าถึง useGenerate และ selectedExtraLangs ได้
    const handleDefaultWording = (
      radioSel: string, textSel: string, enPool: () => string, thPool: () => string, maxEn: number, maxTh: number
    ) => {
      cy.get('body').then(($b) => {
        const $radios = $b.find(radioSel);
        if (!$radios.length) return;

        // สุ่ม Yes (70%) / No (30%)
        const defaultVal = Math.random() < 0.3 ? 'No' : 'Yes';
        cy.log(`🎲 Default Wording = ${defaultVal}`);
        cy.wrap($radios).parent().contains(defaultVal).click({ force: true });
        cy.wait(WAIT);

        if (defaultVal === 'No') {
          cy.log(`✍️ Checking fields for Default Wording = No`);
          cy.get(textSel).each(($el, idx) => {
            if ($el.is(':disabled')) return;

            const currentVal = String($el.val() ?? '').trim();
            const hasValue = currentVal.length > 0;

            // ถ้ามีค่าอยู่แล้ว (เช่น จาก Generate) -> สุ่ม 50/50 ว่าจะเก็บไว้หรือ clear
            if (hasValue && useGenerate) {
              const keepOriginal = Math.random() < 0.5;
              if (keepOriginal) {
                cy.log(`🔒 Keeping original value for idx ${idx}`);
                return;
              }
            }

            let val = (idx % 2 === 0) ? capEN(enPool(), maxEn) : capTH(thPool(), maxTh);
            if (selectedExtraLangs.length > 0 && !hasValue) {
              val = 'Default System';
            }

            cy.wrap($el).focus().clear({ force: true })
              .type(val, { force: true, delay: 0 })
              .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
          });
        } else {
          cy.log(`✅ Default Wording = Yes (Using system default, skipping manual type)`);
        }
      });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PATH A — Generate Button
    // ════════════════════════════════════════════════════════════════════════
    if (useGenerate) {
      cy.get('app-mass-mkt-sms-wording-detail button[title="generate"]').first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } }).should('be.visible').click({ force: true });
      cy.wait(4000);
      trimOverflow();

      withSection(SEL.shortPromo, 'Short Promo', ($el) => fillIfEmpty($el, pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));
      withSection(SEL.cmsDisplay, 'CMS Display', ($el) => fillIfEmpty($el, pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));
      withSection(SEL.promoDesc, 'Promo Desc', ($el) => fillIfEmpty($el, pools.promoDesc.EN(), pools.promoDesc.TH(), 255, 255));
      withSection(SEL.checkCurrent, 'Check Current', ($el) => fillIfEmpty($el, pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));

      if (flag() === 'Send') withSection(SEL.greetingText, 'Greeting', ($el) => fillIfEmpty($el, pools.greeting.EN(), pools.greeting.TH(), 400, 400));
      if (flag() === 'Send') withSection(SEL.deleteText, 'Delete', ($el) => fillIfEmpty($el, pools.delete.EN(), pools.delete.TH(), 250, 250));

      if (type === 'POST') {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => fillIfEmpty($el, pools.marketingName(), pools.marketingName(), 40, 40));
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillIfEmpty($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillIfEmpty($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PATH B — Manual Type (sections 1–4)
    // ════════════════════════════════════════════════════════════════════════
    if (!useGenerate) {
      withSection(SEL.shortPromo, 'Short Promotion Name', ($el) => fillTextareaMulti($el, pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));
      withSection(SEL.cmsDisplay, 'CMS Display', ($el) => fillTextareaMulti($el, pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));
      withSection(SEL.promoDesc, 'Promotion Description', ($el) => fillTextareaMulti($el, pools.promoDesc.EN(), pools.promoDesc.TH(), 250, 250));
      withSection(SEL.checkCurrent, 'SMS Check Current', ($el) => fillTextareaMulti($el, pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ALWAYS — Sections Flags & Events
    // ════════════════════════════════════════════════════════════════════════

    withSection(SEL.greetingFlag, 'SMS Greeting', ($el) => {
      const v = selectFlag($el, 'Greeting');
      if (v === 'Send' && !useGenerate) {
        withSection(SEL.greetingText, 'Greeting Text', ($textEl) => fillTextareaMulti($textEl, pools.greeting.EN(), pools.greeting.TH(), 400, 400));
      }
    });

    withSection(SEL.confirmSubFlag, 'Confirm Sub', ($el) => selectFlag($el, 'Confirm Sub'));

    // SMS Delete
    withSection(SEL.deleteFlag, 'SMS Delete', ($el) => {
      const vDel = selectFlag($el, 'Delete');
      cy.wait(WAIT);
      if (vDel === 'Send') {
        if (type === 'PRE') {
          handleDefaultWording(SEL.deleteDefaultRadio, SEL.deleteText, pools.delete.EN, pools.delete.TH, 250, 250);
        } else {
          cy.get(SEL.deleteText).each(($textEl, idx) => {
            if (!$textEl.is(':disabled')) {
              const currentVal = String($textEl.val() ?? '').trim();
              const hasValue = currentVal.length > 0;
              if (hasValue && useGenerate && Math.random() < 0.5) return;

              let val = (idx % 2 === 0) ? pools.delete.EN() : pools.delete.TH();
              if (selectedExtraLangs.length > 0 && !hasValue) val = 'Default System';

              cy.wrap($textEl).focus().clear({ force: true }).type(val, { force: true, delay: 0 })
                .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
            }
          });
        }
      }
    });

    // Simple Flags with Default Wording
    const simpleFlags: [string, string, string, string, () => string, () => string, number, number][] = [
      [SEL.lastMinuteFlag, 'Last Minute Alert', SEL.lastMinuteRadio, SEL.lastMinuteText, pools.lastMinute.EN, pools.lastMinute.TH, 250, 250],
      [SEL.beforeFeeFlag, 'Before Fee Deduction', SEL.beforeFeeRadio, SEL.beforeFeeText, pools.beforeFee.EN, pools.beforeFee.TH, 250, 250],
      [SEL.recSuccessFlag, 'Recurring Deduct Success', SEL.recSuccessRadio, SEL.recSuccessText, pools.recSuccess.EN, pools.recSuccess.TH, 250, 250],
      [SEL.recFailFlag, 'Recurring Deduct Fail', SEL.recFailRadio, SEL.recFailText, pools.recFail.EN, pools.recFail.TH, 250, 250],
    ];

    simpleFlags.forEach(([sel, label, radioSel, textSel, enPool, thPool, maxEn, maxTh]) => {
      withSection(sel, label, ($el) => {
        const v = selectFlag($el, label);
        if (v === 'Send' && radioSel && textSel) {
          handleDefaultWording(radioSel, textSel, enPool, thPool, maxEn, maxTh);
        }
      });
    });

    // SMS Promote Package
    withSection(SEL.promoteFlag, 'SMS Promote Package', ($el) => {
      const vPro = selectFlag($el, 'Promote');
      if (vPro === 'Send') {
        withSection(SEL.promoteText, 'Promote Text', ($textEl) =>
          fillTextareaMulti($textEl, pools.promotePack.EN(), pools.promotePack.TH(), 250, 250)
        );
      }
    });

    // Before / After Promotion Expired
    const beforePromoVal = flag();
    const promoExpVal = beforePromoVal === 'Send' ? "Don't Send" : 'Send';
    cy.log(`🎲 BeforePromo=${beforePromoVal}, PromoExp=${promoExpVal} (inverse กันเสมอ)`);

    withSection(SEL.beforePromoFlag, 'Before Promotion Expired', ($el) => {
      cy.wrap($el).select(beforePromoVal, { force: true });
      if (beforePromoVal === 'Send') {
        cy.get(SEL.beforePromoDeduct).clear({ force: true }).type(`${Cypress._.random(1, 30)}`, { force: true });
        cy.get(SEL.beforePromoUnit).then(($s) => {
          const opts = ($s.find('option').toArray() as HTMLOptionElement[])
            .filter((o) => o.value && o.value !== 'null' && !o.disabled)
            .map((o) => o.value);
          if (opts.length) cy.wrap($s).select(Cypress._.sample(opts) || '', { force: true });
        });
        handleDefaultWording(SEL.beforePromoDefaultRadio, SEL.beforePromoText, pools.beforePromoExp.EN, pools.beforePromoExp.TH, 250, 250);
      }
    });

    withSection(SEL.promoExpFlag, 'Promotion Expired', ($el) => {
      cy.log(`🔒 PromoExp=${promoExpVal} (ต้องตรงข้าม Before=${beforePromoVal})`);
      cy.wrap($el).select(promoExpVal, { force: true });
      if (promoExpVal === 'Send') {
        handleDefaultWording(SEL.promoExpRadio, SEL.promoExpText, pools.promoExp.EN, pools.promoExp.TH, 250, 250);
      }
    });

    // POST-only fields
    if (type === 'POST') {
      if (!useGenerate) {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => {
          cy.wrap($el).focus().clear({ force: true })
            .type(capEN(pools.marketingName(), 40), { delay: 0, force: true })
            .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
        });
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillTextareaMulti($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillTextareaMulti($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      } else {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => fillIfEmpty($el, pools.marketingName(), pools.marketingName(), 40, 40));
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillIfEmpty($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillIfEmpty($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      }
    }

    // Flush state & Save
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
      if ($el.is(':disabled') || !String($el.val() ?? '').trim()) return;
      cy.wrap($el).focus().trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
    });
    cy.wait(1000);

    withSection(SEL.saveBtn, 'Save Button', ($el) => {
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.wrap($el).should('be.visible').click();
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
  cy.wait(500);

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
        cy.get('input[formcontrolname="messageCode"]').first().type(randomMessageCode(), { force: true });
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
    'Voice',
    'SMS',
    'MMS',
    'Calling Melody',
    'Cloud Game',
    'AI IP Camera',
    'WiFi',
    'Karaoke',
    'VRBT',
    'Music Streaming',
    'Arcade',
    'TV Plus',
    'Youtube Premium',
    'Internet',
    'Vertical App'
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

export const WiFi = (): void => {
  const COMPONENT = 'app-mass-mkt-wifi'
  const HEADING_SELECTOR = '.panel-heading.cursor-point'
  const WIFI_USAGE_TYPES = ['Volume-based', 'Time-based']
  const WIFI_QUOTA_TYPES = ['Unlimited Data (Fixed Speed)', 'Unlimited Data (Throttling Speed)']

  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const normalizeText = (el: HTMLElement): string =>
    Cypress.$(el).text().replace(/\s+/g, ' ').trim()

  const expandPanelIfNeeded = (): void => {
    cy.log('🔓 Ensuring WiFi panel is expanded...')
    cy.get(COMPONENT, { timeout: 15000 })
      .should('exist')
      .find(HEADING_SELECTOR, { timeout: 10000 })
      .should('be.visible')
      .then(($heading) => {
        const isCollapsed =
          $heading.find('.glyphicon-chevron-down').length > 0 &&
          $heading.find('.glyphicon-chevron-up').length === 0
        if (isCollapsed) {
          cy.log('📥 Panel collapsed → expanding')
          cy.wrap($heading).click({ force: true })
          cy.wait(800)
        } else {
          cy.log('📤 Panel already expanded ✓')
        }
      })
    cy.wait(400)
  }

  // ✅ scope ไปที่ active tab ถ้ามี tabset, ไม่งั้นใช้ component ทั้งหมด
  const getActivePane = (): Cypress.Chainable<JQuery<HTMLElement>> =>
    cy.get(COMPONENT).then(($comp) => {
      const hasTabset = $comp.find('tabset').length > 0
      if (hasTabset) {
        return $comp.find('tab.active, .tab-pane.active').first()
      }
      return $comp
    })

  // ✅ clickTab: ข้ามถ้าไม่มี tabset
  const clickTab = (tabName: string): void => {
    cy.get(COMPONENT).then(($comp) => {
      const $tabs = $comp.find('.nav.nav-tabs a')
      if ($tabs.length === 0) {
        cy.log(`⚠️ No tabset found → skipping clickTab("${tabName}")`)
        return
      }
      cy.log(`🔍 Clicking sub-tab: "${tabName}"`)
      cy.wrap($tabs)
        .filter((_, el) => normalizeText(el as HTMLElement).includes(tabName))
        .first()
        .should('be.visible')
        .click({ force: true })
      cy.wait(500)
    })
  }

  const fillDeductSuccess = (): void => {
    cy.log('🚀 [WiFi – Deduct Success] Starting form fill...')

    const usageType = rand(WIFI_USAGE_TYPES)
    const quotaType = rand(WIFI_QUOTA_TYPES)
    cy.log(`🎲 Usage: ${usageType} | Quota: ${quotaType}`)

    getActivePane()
      .find('button.btn-primary.btn-xs[style*="width:60px"]', { timeout: 12000 })
      .should('be.visible')
      .click({ force: true })
    cy.wait(600)

    // ✅ unhide WiFi Detail panel
    getActivePane()
      .find('.panel.panel-default', { timeout: 8000 })
      .then(($panels) => {
        $panels.toArray().forEach((el) => {
          if (Cypress.$(el).attr('hidden') !== undefined) {
            Cypress.$(el).removeAttr('hidden')
          }
        })
      })
    cy.wait(300)

    getActivePane()
      .find('select[formcontrolname="wiFiUsageType"]', { timeout: 10000 })
      .should('be.visible')
      .select(usageType, { force: true })
    cy.wait(400)

    getActivePane()
      .find('select[formcontrolname="wiFiQuotaType"]', { timeout: 10000 })
      .should('be.visible')
      .select(quotaType, { force: true })
    cy.wait(400)

    cy.log('🎯 Opening mat-select dropdown')
    getActivePane()
      .find('mat-select .mat-select-trigger', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    cy.get('body').then(($body) => {
      if ($body.find('mat-option').length === 0) {
        cy.log('⚠️ Dropdown not open yet → retrying')
        getActivePane()
          .find('mat-select .mat-select-trigger')
          .first()
          .click({ force: true })
        cy.wait(800)
      }
    })

    cy.get('.cdk-overlay-container mat-option, mat-option', { timeout: 12000 })
      .should('have.length.greaterThan', 0)
      .then(($opts) => {
        const available = $opts.toArray().filter(
          (el) =>
            el.getAttribute('aria-disabled') !== 'true' &&
            !Cypress.$(el).hasClass('mat-option-disabled')
        )
        if (available.length === 0) {
          cy.log('⚠️ No enabled options → closing')
          cy.get('body').type('{esc}', { force: true })
          return
        }
        const picked = available[Math.floor(Math.random() * available.length)]
        cy.log(`🎲 WiFi value → ${Cypress.$(picked).text().trim()}`)
        cy.wrap(picked).click({ force: true })
      })
    cy.wait(500)

    getActivePane()
      .find('button.btn-primary')
      .filter((_, el) => /^Add$/i.test(normalizeText(el as HTMLElement)))
      .first()
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    cy.log('✨ [WiFi – Deduct Success] Done')
  }

  const verifyTabHasData = (tabName: string): void => {
    cy.log(`🔎 Verifying data in tab: "${tabName}"`)
    clickTab(tabName)
    getActivePane()
      .find('table.table tbody', { timeout: 8000 })
      .first()
      .should(($tbody) => {
        expect($tbody.text().trim()).not.to.match(/No data|ไม่พบข้อมูล/i)
      })
  }

  // ═══════════════════════════════════════════════
  // 🚀 MAIN FLOW
  // ═══════════════════════════════════════════════

  cy.log('📶 [WiFi] Starting...')
  cy.get('.scrollmenu .nav a').contains('WiFi').click()

  expandPanelIfNeeded()

  cy.log('📶 [WiFi] ▶️ Tab: Deduct Success')
  clickTab('Deduct Success')   // ← safe: ข้ามอัตโนมัติถ้าไม่มี tabset
  fillDeductSuccess()

  verifyTabHasData('Deduct Success')

  cy.log('📶 [WiFi] 🎉 Done ✨')
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
    .find('mat-select')
    .should('not.contain', 'Please Select')
    // ✅ รอ Angular commit ค่าลง form
    .should('have.class', 'ng-valid')
    .and('have.class', 'ng-dirty');
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
  cy.get('app-mass-mkt-internet').find('form, [formgroup]').should('have.class', 'ng-valid');

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

const ALL_PRIORITY_QUOTA_TYPES = [
  'Limited Data (Pay per use)',
  'Limited Data (Stop Net)',
  'Limited Data Only',
  'Unlimited Data (Throttling Speed)',
  'Pay per use only',
  'Unlimited Data (Fixed Speed)',
];

const randomPriority = (): string => String(Math.floor(Math.random() * 99) + 1);

const tryFillVisible = ($scope: JQuery, formControlName: string, label: string): void => {
  const $input = $scope.find(`input[formcontrolname="${formControlName}"]`).first();
  if (!$input.length) return;

  const existing = (($input.val() as string) || '').trim();
  if (existing !== '') {
    cy.log(`ℹ️ ${label} มีค่า "${existing}" — ใช้ค่าเดิม`);
    return;
  }
  cy.wrap($input)
    .clear({ force: true })
    .type(randomPriority(), { force: true, delay: 50 })
    .trigger('blur', { force: true });

  cy.wait(300);
  cy.log(`✅ กรอก ${label} สำเร็จ`);

};

export const checkAndUpdatePriority = (): void => {
  cy.log('🚀 checkAndUpdatePriority started');

  const safeClickCancel = (): void => {
    // รอ component แทน bail out
    cy.get(INTERNET_COMPONENT, { timeout: 6000 }).should('exist').then(($comp) => {
      const $cancelBtns = $comp
        .find('button')
        .toArray()
        .filter((el) => {
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
    cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(() => {
      cy.get(INTERNET_COMPONENT)
        .find('table')
        .filter((_i, el) => {
          const $el = Cypress.$(el);
          return (
            $el.is(':visible') &&
            $el
              .find('thead th')
              .toArray()
              .some((th) => th.textContent?.trim() === 'Quota Type')
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
          cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(($comp) => {
            const $pb = getInternetDetailPanelBody($comp);
            if (!$pb.length) {
              cy.log('⚠️ Internet Detail panel-body ไม่พบหลัง click Edit — ข้าม row');
              processRows(rowIndex + 1);
              return;
            }

            cy.log('✅ Internet Detail panel เปิดแล้ว → เรียก updatePriorityInPanel');
            updatePriorityInPanel();

            cy.then(() => {
              safeClickCancel();
              processRows(rowIndex + 1);
            });
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

const getInternetDetailPanelBody = ($component: JQuery): JQuery =>
  $component
    .find('.h3-panel-header, .panel-heading h3')
    .filter((_i, el) => {
      // ต้อง text match + panel ต้องไม่ hidden
      return (
        el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail' &&
        Cypress.$(el).closest('[hidden]').length === 0
      );
    })
    .closest('.panel')
    .find('> .panel-body')
    .first();

const updatePriorityInPanel = (): void => {
  // Step 1: fill top-level priority fields
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) { cy.log('⚠️ ไม่พบ Internet Detail panel-body (step 1)'); return; }
    tryFillVisible($pb, 'internetExceedRatePriority', 'Internet Exceed Rate Priority');
    tryFillVisible($pb, 'internetThrottlingSpeedPriority', 'Internet Throttling Speed Priority');
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // Step 2: หา inner table แล้ว click inner Edit
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) {
      cy.log('ℹ️ Step 2: ไม่พบ panel-body — ข้าม inner Edit');
      return;
    }

    const $innerTable = $pb
      .find('table')
      .filter((_i, el) => Cypress.$(el).closest('[hidden]').length === 0)
      .first();

    if (!$innerTable.length) {
      cy.log('ℹ️ ไม่มี inner table ที่ไม่ถูก hide — ข้าม inner Edit');
      return;
    }

    const $innerEditBtn = $innerTable
      .find('tbody tr')
      .filter((_i, el) => {
        const $tr = Cypress.$(el);
        return (
          $tr.find('td[colspan]').length === 0 &&
          $tr.find('td').first().text().trim().length > 0
        );
      })
      .first()
      .find('button.btn-warning')
      .first();

    if (!$innerEditBtn.length) {
      cy.log('ℹ️ ไม่มี inner sub-table row — ข้าม inner Edit');
      return;
    }

    cy.wrap($innerEditBtn).scrollIntoView().click({ force: true });
    cy.log('✅ คลิก inner Edit (2nd Edit) — รอ sub-panel โผล่');
    // รอ Angular re-render เสร็จก่อนไปขั้นต่อไป
    cy.wait(3500);
  });

  // Step 3: guard ด้วย body check ก่อน แล้วค่อย fill priority ใน sub-panel
  cy.get('body').then(($body) => {
    if (!$body.find(INTERNET_COMPONENT).length) {
      cy.log('⏳ Step 3: INTERNET_COMPONENT หายหลัง inner Edit — รอ re-render');
      cy.wait(4000);
    }
  });

  cy.get(INTERNET_COMPONENT, { timeout: 25000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) {
      cy.log('ℹ️ Step 3: ไม่พบ panel-body — ข้าม sub-panel fill');
      return;
    }

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();
    if (!$priorityInput.length) {
      cy.log('ℹ️ priority input ไม่มีใน DOM — ข้าม sub-panel step');
      return;
    }

    const existing = (($priorityInput.val() as string) || '').trim();
    if (existing !== '') {
      cy.log(`ℹ️ priority มีค่า "${existing}" — ใช้ค่าเดิม`);
    } else {
      cy.wrap($priorityInput)
        .clear({ force: true })
        .type(randomPriority(), { force: true, delay: 50 })
        .trigger('blur', { force: true });
      cy.wait(2500);
      cy.log('✅ กรอก priority (sub-panel) สำเร็จ');
    }
  });

  // Step 4: click inner Update — แยก block เพื่อให้ re-query หลัง fill
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();
    if (!$priorityInput.length) return;

    const $subPanelBody = Cypress.$($priorityInput[0]).closest('.panel-body');
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
      cy.wait(2500);
    } else {
      cy.log('⚠️ ไม่พบ inner Update button');
    }
  });

  // Step 5: fill fixedSpeedPriority อีกรอบหลัง sub-panel close
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // Step 6: click outer Update/Add
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
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
          $el.closest('.panel-body').is($pb[0])
        );
      });

    if ($outerUpdateBtn.length) {
      cy.wrap($outerUpdateBtn[0]).scrollIntoView().click({ force: true });
      cy.log('✅ คลิก outer Update เรียบร้อย');
      cy.wait(2500);
    } else {
      cy.log('⚠️ ไม่พบ outer Update button');
    }
  });
};

const performSimpleClaimAndApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction,
  options?: {
    searchBy?: 'project' | 'po'; // default: 'po'
  }
): void => {
  loginAndWaitReady(user, pass);


  const projectNamePONAME: string = getStandardProjectName();
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const searchBy = options?.searchBy ?? 'po';
  cy.log(`🔑 allPoNames raw: ${JSON.stringify(allPoNames)}`);
  cy.log(`🔑 allPoNames[0]: "${allPoNames[0]}"`);
  cy.log(`🔑 poCount: ${poCount}`);
  cy.log(`🔑 projectName: ${projectNamePONAME}`);
  cy.log(`📋 Project: ${projectNamePONAME}`);
  cy.log(`🔁 Total PO to process: ${poCount}`);
  cy.log(`🔍 Search mode: ${searchBy}`);

  ClaimProject(projectNamePONAME);

  const approveNextPO = (index: number): void => {
    if (index >= poCount) {
      cy.log('✅ All POs approved');
      return;
    }
    let currentUniqueKeyword: string =
      searchBy === 'project'
        ? projectNamePONAME
        : allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;

    if (searchBy === 'po' && currentUniqueKeyword.includes('_')) {
      currentUniqueKeyword = currentUniqueKeyword.split('_')[0].trim();
      cy.log(`✂️ Cleaned keyword: "${currentUniqueKeyword}"`);
    }

    cy.log(`📦 [${index + 1}/${poCount}] Searching by "${searchBy}": "${currentUniqueKeyword}"`);

    cy.get('h3:contains("To Do List")', { timeout: 15000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

    searchInTableWithPagination(
      'To Do List',
      currentUniqueKeyword,
      ($row) => {
        cy.get('h3:contains("To Do List")')
          .parent()
          .find('tbody tr.cursor-point')
          .filter((_i, el) => Cypress.$(el).text().includes(currentUniqueKeyword))
          .first()
          .as('targetRow');

        cy.get('@targetRow').should('be.visible').click();
        cy.log(`✅ [${index + 1}/${poCount}] Entered PO approval page`);
      },
      {
        waitAfterNext: 2000,
        filterCallback: ($row) => {
          const rowText = $row.text().trim();
          // การใช้ includes จะทำงานได้สมบูรณ์ เพราะ Keyword ที่ตัด _ ออกแล้ว 
          // จะยังคงเป็น substring ของข้อความจริงใน DOM เช่น "MOB PRE OT Main PO1..."
          return rowText.includes(currentUniqueKeyword) && !rowText.includes('Fetching data');
        }
      }
    );

    approveFunction(projectNamePONAME);

    if (index < poCount - 1) {
      navigateToWorkspace();

      cy.get('h3:contains("To Do List")', { timeout: 15000 })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
          expect($rows.text()).not.to.contain('Fetching data');
          expect($rows.length).to.be.greaterThan(0);
        });

      approveNextPO(index + 1);
    }
  };

  approveNextPO(0);
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

export const CopyDeductFail = (pageType: 'mass-market' | 'enhancement'): void => {
  const mainTabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game', 'WiFi']

  const COMPONENT_MAP: Record<'mass-market' | 'enhancement', Record<string, string>> = {
    'mass-market': {
      'Internet': 'app-mass-mkt-internet',
      'Voice': 'app-mass-mkt-voice',
      'SMS': 'app-mass-mkt-sms',
      'MMS': 'app-mass-mkt-mms',
      'Vertical App': 'app-mass-mkt-vertical-app',
      'Cloud Game': 'app-mass-mkt-cloud-game',
      'WiFi': 'app-mass-mkt-wifi',
    },
    'enhancement': {
      'Internet': 'app-mass-enh-internet',
      'Voice': 'app-mass-enh-voice',
      'SMS': 'app-mass-enh-sms',
      'MMS': 'app-mass-enh-mms',
      'Vertical App': 'app-mass-enh-vertical-app',
      'Cloud Game': 'app-mass-enh-cloud-game',
      'WiFi': 'app-mass-enh-wifi',
    },
  }

  const tabBarSelector = pageType === 'enhancement'
    ? 'ul.nav.nav-tabs a'
    : '.scrollmenu .nav a'

  const processTab = (index: number): void => {
    if (index >= mainTabs.length) {
      cy.log('🎉 All tabs processed successfully.')
      return
    }

    const tabName = mainTabs[index]
    const componentSelector = COMPONENT_MAP[pageType][tabName]
    cy.log(`\n🔄 [${pageType}] Processing [${index + 1}/${mainTabs.length}]: "${tabName}"`)

    cy.get(tabBarSelector).contains(tabName).click()

    cy.get('body').then(($body) => {
      if (!$body.find(componentSelector).length) {
        cy.log(`⚠️ Component "${componentSelector}" not found — skipping.`)
        processTab(index + 1)
        return
      }

      cy.get(componentSelector, { timeout: 20000 }).should('exist')
      cy.wait(600)

      cy.get(componentSelector).within(() => {
        cy.get('.nav-tabs a').contains('Deduct Fail').click()

        cy.get('.tab-pane.active', { timeout: 10000 }).should('be.visible')

        cy.get('.tab-pane.active').then(($pane) => {
          const $btn = $pane.find('button:contains("Copy From Deduct Success")')

          if ($btn.length > 0) {
            cy.wrap($btn.first()).click({ force: true })
            cy.log(`✅ Copied Deduct Success → Deduct Fail for "${tabName}"`)
          } else {
            cy.log(`⚠️ No "Copy From Deduct Success" button in "${tabName}" — skipping.`)
          }
        })
      })

      cy.wait(500)
      processTab(index + 1)
    })
  }

  cy.get(tabBarSelector).should('exist')
  processTab(0)
}

// ========================
// PROJECT BASIC INFORMATION HELPERS
// ========================

const ABBREVIATIONS: Record<string, string> = {
  // PriceType
  recurring: 'Rec',
  onetime: 'OT',
  usage: 'Usg',
  // ProductClass
  main: 'Main',
  ontop: 'Ontop',
  ontopextra: 'OtopX',
  // Modules
  ENTER: 'ENT',
  MUSIC: 'MUS',
  // PoSubGroup
  AccountFee: 'Account Fee',
  OrderFee: 'Order Fee',
  CashBack: 'Cash Back',
  Service: 'Service',
  GroupPoFee: 'Group Po Fee',
};

const getAbbreviation = (word: string | undefined): string => {
  if (!word) return '';
  return ABBREVIATIONS[word] || word; // ถ้าไม่มีใน dict ให้ใช้คำเดิม
};

const generateUniqueId = (): string => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  // const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}${h} ${day}${s}`;
};

const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
  // const separator = '_';
  const reservedLength = identifier.length;
  const maxBaseLength = maxLength - reservedLength;

  let cleanBase = baseName;
  if (cleanBase.length > maxBaseLength) {
    cleanBase = cleanBase.substring(0, maxBaseLength);
  }

  return `${cleanBase} ${identifier}`;
};

// ========================
// GENERATE PROJECT NAMES
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
  const timeId = generateUniqueId();
  let prefixName: string;

  if (PoSubGroup) {
    const modulePart = getAbbreviation(Module);
    const subGroupPart = getAbbreviation(PoSubGroup);
    if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
      prefixName = `MOB ${modulePart} ${getAbbreviation(PriceType)} ${subGroupPart}`;
    } else {
      prefixName = `MOB ${modulePart} ${subGroupPart}`;
    }
  } else {
    const ModulePart = (Module === 'ENTER' || Module === 'MUSIC')
      ? `${getAbbreviation(prefix)} ${getAbbreviation(subModule)}`
      : `${getAbbreviation(prefix)} ${getAbbreviation(Module)}`;

    const parts = [ModulePart, getAbbreviation(PriceType), getAbbreviation(ProductClass), getAbbreviation(Plugin)].filter(Boolean);
    prefixName = parts.join(' ');
  }

  // ✅ คง Prefix PRJ และ PO ไว้ตามที่ต้องการ
  const projectIdentifier = `PRJ ${timeId}`; // PRJ143052 (9 ตัว)
  const poIdentifier = `PO ${timeId}`;       // PO143052 (8 ตัว)

  // Project ใช้ Max 40 ตัว
  const projectName = buildUniqueName(prefixName, projectIdentifier, 40);

  // ✅ PO ใช้ Max 30 ตัว (เผื่อที่ว่าง 10 ตัว สำหรับ _{target_customer} ที่จะเติมตอน Approve)
  const poName = buildUniqueName(prefixName, poIdentifier, 30);

  return { projectName, poName, prefixName };
};

// ========================
// CREATE PROJECT BASE
// ========================

const createProjectBase = (
  credentials: { user: string; pass: string },
  projectName: string,
  Module: Module,
  subModule?: string
): void => {
  login(credentials.user, credentials.pass);
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  cy.get('input[formcontrolname="projectName"]', { timeout: 10000 })
    .should('be.visible').should('not.be.disabled').click().type(projectName);

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
    .should('be.visible').click({ force: true });

  cy.get('modal-container').should('not.exist');
};

// ========================
// PROJECT BASIC INFORMATION COMPLETE
// ========================

export const ProjectBasicInformationComplete = (
  PriceType: PriceType,
  ProductClass: ProductClass,
  options: ProjectBasicOptions
): void => {
  const { Module, subModule, autoSetDuration = false, Plugin } = options;
  const credentials = getCredentials(Module);
  const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

  const { projectName, poName, prefixName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

  createProjectBase(credentials, projectName, Module, subModule);
  const envKey = ProductClass === 'main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);
  registerProjectName(projectName, ProductClass === 'main' ? 0 : 1);

  const poCount = 2;
  // เปลี่ยนเงื่อนไขมาใช้เช็ค ProductClass === 'main' แทน
  const poEnvKey = ProductClass === 'main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  const poNames: string[] = [];

  cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

  for (let i = 0; i < poCount; i++) {
    const nextTimeId = generateUniqueId();
    const poIdentifier = `PO${i + 1} ${nextTimeId}`;
    const currentPoName = buildUniqueName(prefixName, poIdentifier, 30);

    poNames.push(currentPoName);
    cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

    createPOBase(currentPoName, 'Product Offering');

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
      CopyDeductFail('mass-market');
    }

    smsWording();

    if (i < poCount - 1) {
      cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
      backBacicInfo();
      cy.wait(1500);
    }
  }

  Cypress.env('currentModule', Module);
  Cypress.env('currentSubModule', subModule);
  Cypress.env('currentPriceType', PriceType);
  Cypress.env('currentProductClass', ProductClass);
  Cypress.env('currentProjectName', projectName);
  Cypress.env('currentPoName', poNames[0] || poName);

  cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);
  backBacicInfo();
  addFile();
};


// ========================
// PROJECT BASIC INFORMATION OTHER PO SUB
// ========================

export const ProjectBasicInformationCompleteOtherPOSub = (
  PriceType: 'onetime' | 'recurring' | 'usage',
  PoSubGroup: 'AccountFee' | 'OrderFee' | 'CashBack' | 'Service' | 'GroupPoFee',
  Module: 'POST' | 'PRE'
): void => {
  const credentials = getCredentials(Module);
  const { projectName, poName } = generateProjectNames('MOB', Module, undefined, PriceType, undefined, PoSubGroup);

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

// ========================
// BEFORE APPROVE MKT
// ========================

export const beforeapproveMKT = (): void => {

  const semiEN = [
    'File description for this offering',
    'Attached file for product team review',
    'File description updated for this PO',
    'Supporting file for internal reference',
    'File description submitted for team review',
    'Updated file attached for consideration',
    'File pending sign-off and confirmation',
    'File description included for this submission',
  ];

  const semiTH = [
    'คำอธิบายไฟล์สำหรับข้อเสนอนี้',
    'ไฟล์แนบสำหรับทีมผลิตภัณฑ์',
    'อัปเดตคำอธิบายไฟล์สำหรับ PO นี้',
    'ไฟล์ประกอบสำหรับอ้างอิงภายใน',
    'คำอธิบายไฟล์ส่งให้ทีมตรวจสอบ',
    'แนบไฟล์ที่อัปเดตแล้วเพื่อประกอบการพิจารณา',
    'ไฟล์รอการลงนามและยืนยัน',
    'คำอธิบายไฟล์สำหรับการส่งมอบนี้',
  ];

  const useThai = Math.random() < 0.5;
  const pool = useThai ? semiTH : semiEN;
  let attachmentDesc = pool[Math.floor(Math.random() * pool.length)];

  const MAX_LEN = 120;
  if (attachmentDesc.length > MAX_LEN) attachmentDesc = attachmentDesc.substring(0, MAX_LEN - 3) + '...';

  cy.log(`📎 Attachment Description: ${attachmentDesc}`);
  cy.get('textarea[formcontrolname="fileDescription"]', { timeout: 10000 })
    .should('be.visible')
    .focus()
    .clear({ force: true })
    .type(attachmentDesc, { delay: 30 })
    .trigger('input', { bubbles: true, force: true })
    .trigger('change', { bubbles: true, force: true })
    .blur({ force: true });

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

  ClaimProject(finalProjectName, { claimBy: 'project' });
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
// RANDOM HUMAN TOUCH POINT
// ========================

export const RandomHumanTouchPoint = (subModule: string): void => {
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