// ========================
// CREDENTIALS CONFIGURATION
// ========================

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

// ========================
// DATE/TIME UTILITIES
// ========================

export const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

export let formattedDateMain = '';
export let formattedDateOntop = '';

export const getTimeSuffix = (): string => `${day}${month} ${hours}${minutes}`;

// ========================
// CONSTANTS
// ========================

export const ABBREVIATIONS: Record<string, string> = {
  'Artificial Intelligence': 'AI',
  'Internet of Things': 'IoT',
  'Virtual Reality': 'VR',
  'Augmented Reality': 'AR',
  'Cloud Computing': 'Cloud',
  'Big Data': 'Data',
  'Machine Learning': 'ML',
  'Deep Learning': 'DL',
  'Blockchain': 'Chain',
  '5G': '5G',
  '4G': '4G',
  '3G': '3G'
};

export const INTERNET_SPEEDS = [
  '1 Mbps', '2 Mbps', '3 Mbps', '4 Mbps', '5 Mbps',
  '6 Mbps', '7 Mbps', '8 Mbps', '9 Mbps', '10 Mbps',
  '15 Mbps', '20 Mbps', '25 Mbps', '30 Mbps', '40 Mbps',
  '50 Mbps', '60 Mbps', '70 Mbps', '80 Mbps', '90 Mbps', '100 Mbps'
];

export const THROTTLING_SPEEDS = [
  '256 kbps', '384 kbps', '512 kbps',
  '1 Mbps', '2 Mbps', '3 Mbps', '4 Mbps', '5 Mbps'
];

export const ALL_PRIORITY_QUOTA_TYPES = [
  'Premium', 'Standard', 'Basic'
];
