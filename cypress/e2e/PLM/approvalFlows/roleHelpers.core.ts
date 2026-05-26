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
