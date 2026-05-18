// ========================================
// TYPE DEFINITIONS & INTERFACES
// ========================================

export type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';
export type PriceType = 'onetime' | 'recurring' | 'usage';
export type ProductClass = 'main' | 'ontop' | 'ontopextra';
export type ProductClass1 = 'Main' | 'Ontop' | 'OntopExtra';
export type TaskListHeader = 'To Do List' | 'Unassigned Task';
export type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
export type CoreTaskCallback = () => void;
export type ApproveFunction = (projectName: string) => void;
export type GetProjectNameFn = () => string;
export type EnhanceStepsCallback = () => void;

export interface ProjectBasicOptions {
    ProductClass1: ProductClass1;
    Module: Module;
    subModule?: 'POST' | 'PRE';
    autoSetDuration?: boolean;
    Plugin?: string;
}
