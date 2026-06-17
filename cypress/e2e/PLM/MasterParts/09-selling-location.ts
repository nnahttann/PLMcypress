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

