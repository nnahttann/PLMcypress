// ========================
// TYPE DEFINITIONS
// ========================
type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';
type PriceType = 'onetime' | 'recurring' | 'usage';
type ProductClass = 'main' | 'ontop' | 'ontopextra';
type ProductClass1 = 'Main' | 'Ontop' | 'OntopExtra';
type TaskListHeader = 'To Do List' | 'Unassigned Task';
type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
type CoreTaskCallback = () => void;
type ApproveFunction = (projectName: string) => void;
type GetProjectNameFn = () => string;
type EnhanceStepsCallback = () => void;

interface ProjectBasicOptions {
  ProductClass1: ProductClass1;
  Module: Module;
  subModule?: 'POST' | 'PRE';
  autoSetDuration?: boolean;
  Plugin?: string;
}
