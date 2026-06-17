// ========================
// 05-APPROVAL CORE FUNCTIONS
// ========================
// ฟังก์ชันหลักของระบบอนุมัติ

import { searchInTableWithPagination } from './03-helpers';
import { TaskListHeader, CoreTaskCallback, FinalAction } from './01-types-and-constants';

export const approveProject = (projectName: string): void => {
  cy.get('input[id="search-project-name"]').clear().type(projectName);
  cy.get('button[id="search-btn"]').click();
  searchInTableWithPagination(projectName, (_$row, _index) => {
    cy.wait(2000);
  });
};

export function assignTeamTask(
  taskName: string,
  assignTo: string,
  header: TaskListHeader = 'To Do List',
  finalAction: FinalAction = 'AlertAndLogout',
  coreTaskCallback?: CoreTaskCallback
): void {
  cy.contains('h4', header).should('be.visible');
  cy.contains('td', taskName).then(($cell) => {
    const $row = $cell.closest('tr');
    cy.wrap($row).within(() => {
      cy.contains('button', 'Assign').click();
    });
    cy.get('app-assign-team-modal').within(() => {
      cy.get('input[formcontrolname="searchText"]').clear().type(assignTo);
      cy.wait(1000);
      cy.contains('td', assignTo).closest('tr').find('input[type="checkbox"]').click({ force: true });
      cy.contains('button', 'Save').click();
    });
    cy.wait(1000);
    if (coreTaskCallback) coreTaskCallback();
    if (finalAction === 'AlertAndLogout') {
      alert('Assign completed');
    }
  });
}

const createFullPageApprovalFlow = (
  projectName: string,
  roles: string[],
  callback?: () => void
): void => {
  approveProject(projectName);
  roles.forEach((role, index) => {
    assignTeamTask(
      projectName,
      role,
      'Unassigned Task',
      index === roles.length - 1 ? 'ComplexLogout' : 'StopAfterCore',
      callback
    );
  });
};

const createSimplePageApprovalFlow = (
  projectName: string,
  role: string,
  callback?: () => void
): void => {
  approveProject(projectName);
  assignTeamTask(projectName, role, 'Unassigned Task', 'ComplexLogout', callback);
};

export const registerProjectName = (name: string, index: number = 0): void => {
  projectManager.register(name, index);
};

export const getProjectNameByIndex = (index: number = 0): string => {
  return projectManager.get(index);
};

export const runForAllProjects = (callback: (projectName: string) => void): void => {
  projectManager.getAll().forEach(callback);
};

export const getStandardProjectName = (): string => {
  return projectManager.getStandardFallback();
};

export const getOntopProjectName = (): string => formattedDateOntop as string;
