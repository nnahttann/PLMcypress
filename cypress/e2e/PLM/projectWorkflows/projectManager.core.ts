// ========================
// PROJECT MANAGEMENT SYSTEM
// ========================

import { formattedDateMain, formattedDateOntop } from '../helpers/config.core';

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

export { projectManager };
