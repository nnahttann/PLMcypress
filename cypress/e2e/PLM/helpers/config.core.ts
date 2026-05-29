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

export let formattedDateOntop = '';
export let formattedDateMain = '';
export let formattedDateOntopExtra = '';
export let formattedDateOntopOnetime = '';

export const getStandardProjectName = (): string => Cypress.env('formattedDateMain') as string;
export const getOntopProjectName = (): string => Cypress.env('formattedDateOntop') as string;
export const getOntopExtraProjectName = (): string => Cypress.env('formattedDateOntopExtra') as string;
export const getOntopOnetimeProjectName = (): string => Cypress.env('formattedDateOntopOnetime') as string;
