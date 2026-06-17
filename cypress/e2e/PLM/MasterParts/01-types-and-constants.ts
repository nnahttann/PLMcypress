// ========================
// TYPE DEFINITIONS AND CONSTANTS
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

export interface FlowPattern {
  order: string[];
  shuffle: boolean;
}

export interface TestEntry {
  name: string;
  fn: () => void;
}

// Environment variables
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

// Date constants
export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
export let formattedDateMain = '';
export let formattedDateOntop = '';

// Constants for Internet speeds
export const INTERNET_SPEEDS = [
  '100/50', '200/100', '300/150', '500/250', '1000/500',
  '2/1', '4/2', '6/3', '8/4', '10/5'
];

export const THROTTLING_SPEEDS = [
  '384kbps', '512kbps', '1Mbps', '2Mbps', '4Mbps', '6Mbps'
];

// Abbreviations
export const ABBREVIATIONS: Record<string, string> = {
  'Artificial': 'AI',
  'Intelligence': 'AI',
  'Internet': 'INET',
  'Protocol': 'IP',
  'Camera': 'CAM',
  'Virtual': 'VR',
  'Reality': 'R',
  'Back': 'B',
  'Tone': 'T',
  'Cloud': 'CLD',
  'Game': 'GM',
  'Entertainment': 'ENT',
  'Partnership': 'PTR',
  'Streaming': 'STR',
  'Music': 'MSC',
  'Application': 'APP',
  'Vertical': 'VRT'
};

// Project Manager instance
export const projectManager = ProjectManager.getInstance();

// Helper function to get credentials
export const getCredentials = (module: Module): { user: string, pass: string } => {
  const map: Record<Module, { user: string, pass: string }> = {
    POST: { user: MKTpost, pass: MKTpost1 },
    PRE: { user: MKTpre, pass: MKTpre1 },
    ENTER: { user: enter, pass: enterpass },
    MUSIC: { user: music, pass: musicpass }
  };
  return map[module];
};

// Time suffix helper
export const getTimeSuffix = (): string => `${day}${month} ${hours}${minutes}`;

// Truncated name helper
export const getTruncatedName = (baseName: string, suffix: string, maxLength: number): string => {
  const full = `${baseName} ${suffix}`;
  return full.length > maxLength ? full.substring(0, maxLength - 3) + '...' : full;
};
