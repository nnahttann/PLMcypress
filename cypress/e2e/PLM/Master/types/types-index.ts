// ========================
// TYPE DEFINITIONS
// ========================

export type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';
export type PriceType = 'onetime' | 'recurring' | 'usage';
export type ProductClass = 'main' | 'ontop' | 'ontopextra';
export type TaskListHeader = 'To Do List' | 'Unassigned Task';
export type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
export type CoreTaskCallback = () => void;
export type ApproveFunction = (projectName: string) => void;
export type GetProjectNameFn = () => string;

export interface ProjectBasicOptions {
  Module: Module;
  subModule?: 'POST' | 'PRE';
  autoSetDuration?: boolean;
  Plugin?: string;
}

export interface FlowPattern {
  [key: string]: string[];
}

export interface TestEntry {
  name: string;
  fn: () => void;
}
