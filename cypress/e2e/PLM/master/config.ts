const env = Cypress.env();
export const {
    urlsit,
    MKTpre, MKTpre1, MKTpost, MKTpost1,
    cks, ckspass,
    cgcirb, cgcirbpass,
    cgccbs, cgccbspass,
    cgtcbs, cgtcbspass,
    cgtirb, cgtirbpass,
    actm, actmpass,
    oper, operpass,
    spadsup, spadsuppass,
    spaddoer, spaddoerpass,
    spadtest, spadtestpass,
    spaddp, spaddppass,
    apo, apopass,
    enter, enterpass,
    music, musicpass,
    tscenter, tscenterpass,
    aafsp, aafsppass,
    csisp, csisppass,
    e2etest, e2etestpass,
    aafdp, aafdppass,
    csidp, csidppass,
    e2edp, e2edppass,
    sasff, sasffpass
} = env as Record<string, string>;

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
export let formattedDateMain = '';
export let formattedDateOntop = '';

export const getTimeSuffix = (): string => `${day}${month} ${hours}${minutes}`;

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

// อัปเดต Interface
export interface ProjectBasicOptions {
    Module: Module;
    subModule?: 'POST' | 'PRE';
    autoSetDuration?: boolean;
    Plugin?: string;
}
