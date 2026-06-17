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

