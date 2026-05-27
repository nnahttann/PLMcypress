// ========================
// PO UTILITIES HELPERS
// ========================

const now = new Date();
const day = String(now.getDate()).padStart(2, '0');
const month = String(now.getMonth() + 1).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');

const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pickMultiple = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const cleanEnglishText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^\x00-\x7F\s]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanThaiText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const limit = (s: string, max: number) => {
  if (!s) return '';
  let r = s.length > max ? s.substring(0, max) : s;
  if (r.length === max && r.includes(' ')) {
    const ls = r.lastIndexOf(' ');
    if (ls > max * 0.7) r = r.substring(0, ls);
  }
  return r.trimEnd();
};

export const selectMultipleFromDualList = (controlName: string, maxSelections: number): void => {
  cy.get(`select[formcontrolname="${controlName}"]`).then(($select) => {
    const optionCount = $select.find('option').length;
    const actualMax = Math.min(maxSelections, optionCount);
    const numberOfSelections = Math.floor(Math.random() * actualMax) + 1;

    const selectedIndices = new Set<number>();
    while (selectedIndices.size < numberOfSelections) {
      selectedIndices.add(Math.floor(Math.random() * optionCount));
    }

    selectedIndices.forEach((index: number) => {
      cy.get(`select[formcontrolname="${controlName}"] option`)
        .eq(index)
        .dblclick({ force: true });
    });
  });
};

export const limitAndCleanEN = (str: string, maxLen: number): string => {
  return limit(cleanEnglishText(str), maxLen);
};

const limitAndCleanTH = (str: string, maxLen: number): string => {
  return limit(cleanThaiText(str), maxLen);
};

const fillField = (selector: string, text: string) => cy.get(selector).clear().type(text);

export const fillBilingual = (
  enSel: string, thSel: string,
  enPool: string[], thPool: string[],
  enLim: number, thLim: number
) => {
  fillField(enSel, limitAndCleanEN(pickRandom(enPool), enLim));
  fillField(thSel, limitAndCleanTH(pickRandom(thPool), thLim));
};

export const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export { pickRandom, pickMultiple, randomInt };
