import * as Master from '../../Master';
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('Mobile', () => {
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'main', { type: 'Main', segment: 'PRE', autoSetDuration: true });

    //targetgroup
    Master.selectTargetGroup('mass');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    Master.PriceExcluding();

    //*Target group
    Master.targetgroup();

    //ProductSpec
    const optionsToSelectProductSpec = [
      // "AI IP Camera",
      "AIS Secure Net",
      // "Apple Care",
      // "Cloud Game",
      // "Cloud PC",
      // "Content VDO",
      // "Flowaccount",
      // "Internet",
      // "MMS",
      // "Mobile Care",
      // "SMS",
      // "Vertical App",
      // "Voice",
      // "WiFi",
      // "Youtube Premium"
    ];

    optionsToSelectProductSpec.forEach(option => {
      cy.get('select[formcontrolname="availableListBox"]')
        .contains(option)
        .then($option => {
          cy.wrap($option).dblclick();
        });
    });
    cy.scrollTo('top');
    //allowMvpn
    // cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
    // Auto Add Service 5G Select the second option ('Auto Add')
    // cy.get('#service-options').select(1);

    Master.InternetLimitedDataOnly();

    Master.smsWordingpre();

    Master.backBacicInfo();

    //Add File
    cy.get('input[type="file"]', { timeout: 10000 }).should('exist');
    cy.wait('@postRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);

    cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/file.pdf', 'binary').then((fileContent) => {
      cy.get('input[type="file"][id="files"]').selectFile(
        {
          contents: Cypress.Buffer.from(fileContent, 'binary'),
          fileName: 'file.pdf',
          mimeType: 'application/pdf',
        },
        { force: true }
      );
      Master.beforeapproveMKT();
    });
  });
  it('CKS role', () => {

    Master.login(Master.cks, Master.ckspass);

    // ดักจับและรอให้ API อื่น ๆ เสร็จสิ้น
    cy.intercept('GET', '/PLMSpringBoot/newApi/CheckTask/setUserOnline').as('setUserOnline');
    cy.intercept('POST', '/PLMSpringBoot/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam').as('getCfgLovParam');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-cfg-lov/getActiveFlagFlwApi/NRM_RTMT/INITIAL_RTMT').as('getActiveFlag');

    // รอให้ API ต่าง ๆ เสร็จสิ้น
    cy.wait(['@setUserOnline', '@getCfgLovParam', '@getActiveFlag'], { timeout: 100000 });
    cy.get('body').should('be.visible');

    // const formattedDateMainPONAME = 'Mob POST Reg 0409 0038';
    const projectName = Cypress.env('projectName');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectName);

    // ClaimProject from Unassigned Task
    Master.ClaimProjectCKS(Master.formattedDateMain);

    // Find the "To Do List" section
    Master.approveProject(Master.formattedDateMain);

    // intercept API 
    cy.intercept('GET', '/PLMSpringBoot/api/flw-project/getProjectByProjectId/**').as('getProject');
    cy.intercept('GET', '/PLMSpringBoot/api/mod-po-history/getByProjectCode/**').as('getHistory');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/attachment/**').as('getAttachment');
    cy.intercept('GET', '/PLMSpringBoot/api/flw-common/note/**').as('getNote');

    // รอ
    cy.wait(['@getProject', '@getHistory', '@getAttachment', '@getNote'], { timeout: 100000 }).then((interceptions) => {
    });

    // Click the button
    //button Enhance PO
    cy.get('button.btn-sample')
      .contains('Enhance PO')
      .scrollIntoView({ ensureScrollable: false })
      .should('be.visible')
      .click();

    //Navigate to mass product 

    // wait API 
    cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

    // Wait for initial API requests to complete
    cy.wait(['@getRequest'], { timeout: 100000 }).its('response.statusCode').should('eq', 200);

    // รอ url
    cy.url().should('include', 'mass-enh-product-offering-detail')

    //Group package
    // cy.get('select[formcontrolname="groupPackage"]')
    // .select('5G Hot Deal Max Speed Offset')
    //grouppackage();
    Master.dropdownRecurringCKSMain();
    Master.addauto5gCKS();
    Master.priorityInternetLimitedDataOnly();
    Master.beforeapproveCKS();
  });
  // it('CGMD Config cbs role', () => {

  //   Master.login(Master.cgccbs, Master.cgccbspass);
  //   // intercept APIs ที่ต้องรอ
  //   cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  //   cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
  //   cy.visit('/#/workspace-home/workspace');

  //   // รอและตรวจสอบ response
  //   cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  //   cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  //   cy.url().should('include', '/workspace-home/workspace');
  //   cy.contains('span', 'Menu').click();

  //   // ก่อนกดเมนู set intercept
  //   cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

  //   // คลิก Process tracking
  //   cy.get('a[href="#/new-report/home/tracking"]').click();

  //   // ตรวจสอบ URL เปลี่ยน
  //   cy.url().should('include', '/new-report/home/tracking');

  //   // รอ table แสดงผล
  //   cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

  //   // optional: ตรวจสอบว่า table มีข้อมูล
  //   cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

  //   // const taskIdentifier = 'Onetime_Main_0910_0951';
  //   // const projectNamePONAME = 'Onetime Ontop 1510 0013'
  //   const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
  //   cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
  //   const assignee = 'cgccbs';

  //   Master.assignTeamTask(projectNamePONAME, assignee);

  //   cy.contains('span', 'Menu').click();

  //   // ก่อนกดเมนู set intercept
  //   cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

  //   // คลิก Process tracking
  //   cy.get('a[href="#/workspace-home/workspace"]').click();

  //   cy.url().should('include', '/workspace-home/workspace');

  //   // จับ API หลัก
  //   cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');

  //   Master.approveProjectCGMDPRE(projectNamePONAME);
  // });
  // it('CGMD Tester CBS role', () => {

  //   Master.login(Master.cgtcbs, Master.cgtcbspass);
  //   // intercept APIs ที่ต้องรอ
  //   cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');
  //   cy.intercept('GET', '**/newApi/CheckTask/setUserOnline').as('setUserOnline');
  //   cy.visit('/#/workspace-home/workspace');

  //   // รอและตรวจสอบ response
  //   cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  //   cy.wait('@setUserOnline', { timeout: 20000 }).its('response.statusCode').should('eq', 200);
  //   cy.url().should('include', '/workspace-home/workspace');
  //   cy.contains('span', 'Menu').click();

  //   // ก่อนกดเมนู set intercept
  //   cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

  //   // คลิก Process tracking
  //   cy.get('a[href="#/new-report/home/tracking"]').click();

  //   // ตรวจสอบ URL เปลี่ยน
  //   cy.url().should('include', '/new-report/home/tracking');

  //   // รอ table แสดงผล
  //   cy.get('table.table.table-condensed', { timeout: 20000 }).should('be.visible');

  //   // optional: ตรวจสอบว่า table มีข้อมูล
  //   cy.get('table.table.table-condensed tbody tr').should('have.length.greaterThan', 0);

  //   // const taskIdentifier = 'Onetime_Main_0910_0951';
  //   // const projectNamePONAME = 'Onetime Ontop 1510 0013'
  //   const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
  //   cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
  //   const assignee = 'cgtcbs';

  //   Master.assignTeamTask(projectNamePONAME, assignee);

  //   cy.contains('span', 'Menu').click();

  //   // ก่อนกดเมนู set intercept
  //   cy.intercept('GET', '**/api/plm-project/AllNonCompleteStatus/**').as('loadTracking');

  //   // คลิก Process tracking
  //   cy.get('a[href="#/workspace-home/workspace"]').click();

  //   cy.url().should('include', '/workspace-home/workspace');

  //   // จับ API หลัก
  //   cy.intercept('GET', '**/PLMSpringBoot/api/Get-BillingSystemCGMD/**').as('getBillingSystem');
  //   Master.approveProjectCGMDtesterProPRE(projectNamePONAME);
  // });
  it('Spadsup role', () => {

    Master.login(Master.spadsup, Master.spadsuppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1024';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    Master.ClaimProjectCKS(projectNamePONAME);

    Master.approveProjectSPADSup(projectNamePONAME);

  });
  it('Spaddoer role', () => {

    Master.login(Master.spaddoer, Master.spaddoerpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1352';

    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);

    Master.ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    Master.approveProjectSPADDOERMain(projectNamePONAME);
  });
  it.only('Spadtester role', () => {

    Master.login(Master.spadtest, Master.spadtestpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    const projectNamePONAME = 'Onetime Main 1710 1409_NEW';
    // const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    // cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    // Master.ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    Master.approveProjectSPADTesterMain(projectNamePONAME);
  });
  it('Spaddeploy role', () => {

    Master.login(Master.spaddp, Master.spaddppass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1310 1838';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    Master.ClaimProjectCKS(projectNamePONAME);

    // Find the "To Do List" section
    cy.wait(5000);
    Master.approveProjectSPADdeploy(projectNamePONAME);
  });
  it('ACTM role', () => {

    Master.login(Master.actm, Master.actmpass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    Master.approveProjectCGMDACTMPRE(projectNamePONAME);
  });
  it('APO role', () => {

    Master.login(Master.apo, Master.apopass);

    // intercept APIs ที่ต้องรอ
    cy.intercept('GET', '**/api/plm-error-code/getAll').as('getErrorCodes');

    // รอและตรวจสอบ response
    cy.wait('@getErrorCodes', { timeout: 20000 }).its('response.statusCode').should('eq', 200);

    // const projectNamePONAME = 'Onetime Ontop 1510 1712';
    const projectNamePONAME = Cypress.env('formattedDateMainPONAME');
    cy.log('ใช้ค่าเดิมจาก it(1): ' + projectNamePONAME);
    Master.approveProjectCGMDAPO(projectNamePONAME);
  });
});

