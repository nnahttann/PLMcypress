// ========================================
// ENVIRONMENT CONFIGURATION & CREDENTIALS
// ========================================

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

// ========================================
// DATE/TIME UTILITIES
// ========================================

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

export let formattedDateMain = '';
export let formattedDateOntop = '';
export let formattedDateOntopExtra = '';

export const setFormattedDateMain = (value: string): void => {
  formattedDateMain = value;
};

export const setFormattedDateOntop = (value: string): void => {
  formattedDateOntop = value;
};

export const setFormattedDateOntopExtra = (value: string): void => {
  formattedDateOntopExtra = value;
};

export const getDateFormattingInfo = (): {
  day: string;
  month: string;
  hours: string;
  minutes: string;
} => ({
  day,
  month,
  hours,
  minutes
});

export const getStandardProjectName = (): string => {
  return formattedDateMain;
};

export const getOntopProjectName = (): string => {
  return formattedDateOntop;
};

export const getOntopExtraProjectName = (): string => {
  return formattedDateOntopExtra;
};
