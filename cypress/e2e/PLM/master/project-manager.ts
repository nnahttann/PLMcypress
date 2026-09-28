class ProjectManager {
    private static instance: ProjectManager;
    private projects: Map<number, string> = new Map();
    private projectCodes: Map<number, string> = new Map();
    private currentIndex: number = 0;
    private constructor() {
        const saved = Cypress.env('projectManager');
        if (saved) {
            this.projects = new Map(Object.entries(saved.projects || {}).map(([k, v]) => [parseInt(k), v as string]));
            this.projectCodes = new Map(Object.entries(saved.projectCodes || {}).map(([k, v]) => [parseInt(k), v as string]));
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
    registerCode(code: string, index?: number): void {
        const idx = index ?? this.currentIndex;
        this.projectCodes.set(idx, code);
        this.save();
    }
    getCode(index: number = 0): string {
        return this.projectCodes.get(index) || (Cypress.env('currentProjectCode') as string) || '';
    }
    getAllCodes(): string[] {
        return Array.from(this.projectCodes.values());
    }
    getStandardFallback(): string {
        return (Cypress.env('formattedDateMain') as string) ||
            (Cypress.env('formattedDate') as string) ||
            (Cypress.env('projectName') as string) ||
            (Cypress.env('formattedDateMainPONAME') as string) ||
            (Cypress.env('formattedDateOntopPONAME') as string) ||
            (Cypress.env('poName') as string) || '';
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
        this.projectCodes.clear();
        this.currentIndex = 0;
        this.save();
    }
    private save(): void {
        Cypress.env('projectManager', {
            projects: Object.fromEntries(this.projects),
            projectCodes: Object.fromEntries(this.projectCodes),
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
export const getOntopProjectName = (): string => (Cypress.env('formattedDate') as string) ||
    (Cypress.env('formattedDateOntopPONAME') as string) ||
    getProjectNameByIndex(1) ||
    '';
export const getCurrentProjectIndex = (): number => {
    return projectManager.getCurrentIndex();
};
export const updateProjectName = (name: string, index?: number): void => {
    const idx = index ?? projectManager.getCurrentIndex();
    projectManager.register(name, idx);
};
export const registerProjectCode = (code: string, index?: number): void => {
    projectManager.registerCode(code, index);
};
export const getProjectCodeByIndex = (index: number = 0): string => {
    return projectManager.getCode(index);
};
export const getStandardProjectCode = (): string => {
    return projectManager.getCode(projectManager.getCurrentIndex());
};
