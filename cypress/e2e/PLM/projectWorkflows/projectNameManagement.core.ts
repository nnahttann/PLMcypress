// ========================
// PROJECT NAME GETTERS
// ========================

import { formattedDateOntop, formattedDateOntopExtra } from '../helpers/config.core';
import { projectManager } from './projectManager.core';

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

export const getOntopExtraProjectName = (): string => formattedDateOntopExtra as string;
