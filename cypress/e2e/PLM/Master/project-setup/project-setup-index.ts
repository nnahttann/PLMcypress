// ========================
// PROJECT SETUP FUNCTIONS
// Project Creation, Basic Information
// ========================

import { Module } from '../types';
import { ABBREVIATIONS } from '../config/config-index';
import { limitAndCleanEN, limitAndCleanTH, buildUniqueName } from '../utils';
import { projectManager } from '../core';

const getAbbreviation = (word: string | undefined): string => {
  if (!word) return '';
  return ABBREVIATIONS[word] || word;
};

const generateUniqueId = (): string => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}${h} ${day}${s}`;
};

export const generateProjectNames = (
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

  const projectIdentifier = `PRJ ${timeId}`;
  const poIdentifier = `PO ${timeId}`;

  const projectName = buildUniqueName(prefixName, projectIdentifier, 40);
  const poName = buildUniqueName(prefixName, poIdentifier, 30);

  return { projectName, poName, prefixName };
};

export const createProjectBase = (
  credentials: { user: string; pass: string },
  projectName: string,
  Module: Module,
  subModule?: string,
  description?: string,
  autoSetDuration: boolean = true
): void => {
  cy.login(credentials.user, credentials.pass);
  cy.wait(2000);

  cy.contains('a', 'Project Creation').click();
  cy.wait(3000);

  cy.get('#projectName').clear().type(projectName);
  cy.get('#projectDescription').clear().type(description || `Test project: ${projectName}`);

  if (autoSetDuration) {
    cy.get('input[formcontrolname=\"startDate\"]').click();
    cy.get('span.title').contains('Today').click();
    cy.get('span.title').contains('Next Year').click();
  }

  cy.contains('button', 'Save & Continue').click();
  cy.wait(5000);
};

export const ProjectBasicInformationComplete = (
  Module: Module,
  subModule?: 'POST' | 'PRE',
  autoSetDuration: boolean = true,
  Plugin?: string
): void => {
  const { projectName, poName } = generateProjectNames('Project', Module, subModule, 'Recurring', 'main', undefined, Plugin);
  
  projectManager.register(projectName);
  Cypress.env('formattedDateMain', projectName);
  Cypress.env('formattedDateOntopPONAME', poName);

  createProjectBase(
    { user: Cypress.env('MKTpre'), pass: Cypress.env('MKTpre1') },
    projectName,
    Module,
    subModule,
    `Basic project for ${Module}`,
    autoSetDuration
  );
};

export const ProjectBasicInformationCompleteOtherPOSub = (
  PoSubGroup: string,
  Module: Module,
  PriceType: string = 'recurring'
): void => {
  const { projectName, poName } = generateProjectNames('Project', Module, undefined, PriceType, 'main', PoSubGroup);
  
  projectManager.register(projectName);
  Cypress.env('formattedDateMain', projectName);
  Cypress.env('poName', poName);

  createProjectBase(
    { user: Cypress.env('MKTpre'), pass: Cypress.env('MKTpre1') },
    projectName,
    Module,
    undefined,
    `Project with PO SubGroup: ${PoSubGroup}`,
    true
  );
};
