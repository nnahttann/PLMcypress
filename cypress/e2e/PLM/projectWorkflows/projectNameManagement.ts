import { projectManager } from '../helpers/projectManager';
import { formattedDateOntop } from '../helpers/config';

// ========================================
// PROJECT NAME GETTERS & SETTERS
// ========================================

/**
 * Register a project name with optional index
 */
export const registerProjectName = (name: string, index: number = 0): void => {
  projectManager.register(name, index);
};

/**
 * Get project name by index
 */
export const getProjectNameByIndex = (index: number = 0): string => {
  return projectManager.get(index);
};

/**
 * Run callback for all registered projects
 */
export const runForAllProjects = (callback: (projectName: string) => void): void => {
  projectManager.runForAll((name) => callback(name));
};

/**
 * Get standard/default project name
 */
export const getStandardProjectName = (): string => {
  return projectManager.get(projectManager.getCurrentIndex());
};

/**
 * Get ontop product project name
 */
export const getOntopProjectName = (): string => formattedDateOntop as string;
