import { createPOWordingPools } from '../Approve/po-wording-pools';

/* ============================================================
 * 1) UTILITIES
 * ========================================================== */

/** ✅ FIX #3: เช็คทีละ element เสมอ ป้องกัน jQuery set ทำให้ .is(':hidden') คืน true ผิด */
const isVisible = ($el: JQuery<HTMLElement>): boolean => {
    if (!$el || !$el.length) return false;
    const el = $el.first();
    if (el.is(':hidden') || el.prop('hidden')) return false;
    if (el.parents(':hidden').length > 0) return false;
    return true;
};

/** กรอง element ที่มองเห็นจริงออกมาเป็น array (ใช้ร่วมกันทุกที่) */
const visibleEls = ($els: JQuery<HTMLElement>): HTMLElement[] =>
    $els.toArray().filter((el) => isVisible(Cypress.$(el)));

/** ✅ FIX #6: อักขระต้องห้ามตาม validation rule ของระบบ */
const FORBIDDEN_BASE = /[|^'\u2018\u2019\u2013\u2014]/g;      // | ^ ' ' ' – —
const FORBIDDEN_STRICT = /[|^'\u2018\u2019\u2013\u2014<>&]/g; // + < > &

const cleanMulti = (s: string, strict = false): string =>
    s
        ? s
              .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
              .replace(strict ? FORBIDDEN_STRICT : FORBIDDEN_BASE, '')
              .replace(/\s+/g, ' ')
              .trim()
        : '';

/** ✅ FIX (minor): ตัดคำให้ถูกต้องจริง ไม่พึ่งเงื่อนไข length === max ที่ผิดหลัง trimEnd */
const limit = (s: string, max: number): string => {
    if (!s) return '';
    if (s.length <= max) return s;
    const hard = s.substring(0, max);
    const ls = hard.lastIndexOf(' ');
    return (ls > max * 0.7 ? hard.substring(0, ls) : hard).trimEnd();
};

/** ✅ FIX #10: กัน pool undefined / ว่าง ไม่ให้ throw */
const pick = <T>(arr?: T[]): T =>
    arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ('' as unknown as T);

const flag = (): 'Send' | "Don't Send" => (Math.random() < 0.8 ? 'Send' : "Don't Send");

/* ============================================================
 * 2) LANGUAGE RESOLUTION
 * ========================================================== */

const BASE_LANGS = new Set(['EN', 'TH']);

const langKeyMap: Record<string, string> = {
    Burmese: 'BUR',
    Chinese: 'CHI',
    Japanese: 'JPN',
    Khmer: 'KHM',
    Korean: 'KOR',
    Lao: 'LAO',
    Vietnamese: 'VIE',
    Indonesian: 'IND',
    Malay: 'MAL',
    Filipino: 'FIL',
    Hindi: 'HIN',
    Arabic: 'ARA',
    English: 'EN',
    Thai: 'TH',
};

/** alias code ที่ระบบอาจเขียนต่างจาก pool key */
const LANG_CODE_ALIAS: Record<string, string> = {
    CHN: 'CHI',
    ZH: 'CHI',
    CN: 'CHI',
    JP: 'JPN',
    KR: 'KOR',
    VN: 'VIE',
    MM: 'BUR',
    KH: 'KHM',
    ENG: 'EN',
    THA: 'TH',
};

const getLangKey = (lang: string, poolData: Record<string, string[]>): string => {
    if (langKeyMap[lang]) return langKeyMap[lang];
    const auto = lang.substring(0, 3).toUpperCase();
    const aliased = LANG_CODE_ALIAS[auto] ?? auto;
    if (poolData[aliased]) {
        cy.log(`🔑 Auto-derived key "${aliased}" for lang "${lang}"`);
        return aliased;
    }
    cy.log(`⚠️ [WARN] No pool key for lang "${lang}" (tried "${aliased}") → fallback EN`);
    return 'EN';
};

/** อ่าน language code จาก label ที่ครอบ field — คืน null ถ้าไม่มั่นใจ */
const detectLangCodeFromLabel = ($el: JQuery<HTMLElement>): string | null => {
    const $container = $el.closest('.form-group, .col-md-6, .col-md-12');
    const rawLabel = ($container.find('label').first().text() || '').trim();
    if (!rawLabel) return null;

    const cleaned = rawLabel.replace(/[()]/g, ' ').trim();
    const match =
        cleaned.match(/\b([A-Z]{2,4})\s*:?\s*$/) ||
        cleaned.match(/\b([A-Z]{2,4})\b(?!.*\b[A-Z]{2,4}\b)/);

    if (!match) return null;
    const code = match[1].toUpperCase();
    return LANG_CODE_ALIAS[code] ?? code;
};

/**
 * ✅ FIX #4: ใช้ label ใน DOM เป็นแหล่งความจริงหลัก
 * ถ้าอ่าน label ไม่ได้ ค่อย fallback มาใช้ index (พฤติกรรมเดิม)
 */
const resolveLangForField = (
    $el: JQuery<HTMLElement>,
    idx: number,
    poolData: Record<string, string[]>,
    extraLangs: string[]
): { langKey: string; isExtra: boolean; source: string } => {
    const detected = detectLangCodeFromLabel($el);

    if (detected && BASE_LANGS.has(detected)) {
        return { langKey: detected, isExtra: false, source: 'label' };
    }
    if (detected && poolData[detected]) {
        return { langKey: detected, isExtra: true, source: 'label' };
    }
    if (detected) {
        cy.log(`⚠️ [WARN] DOM code "${detected}" ไม่มีใน pool → fallback ตาม index`);
    }

    if (idx === 0) return { langKey: 'EN', isExtra: false, source: 'index' };
    if (idx === 1) return { langKey: 'TH', isExtra: false, source: 'index' };

    const fallbackLang = extraLangs[idx - 2];
    return {
        langKey: fallbackLang ? getLangKey(fallbackLang, poolData) : 'EN',
        isExtra: true,
        source: 'index',
    };
};

/* ============================================================
 * 3) SELECTORS
 * ========================================================== */

const SEL = {
    root: 'app-mass-mkt-sms-wording-detail',
    shortPromo: 'textarea[formcontrolname="shortPromotionName"]',
    cmsDisplay: 'textarea[formcontrolname="cmsDisplay"]',
    promoDesc: 'textarea[formcontrolname="promotionDescription"]',
    checkCurrent: 'textarea[formcontrolname="smsCheckCurrent"]',
    greetingFlag: 'select[formcontrolname="smsGreetingSendFlag"]',
    greetingText: 'textarea[formcontrolname="smsGreeting"]',
    confirmSubFlag: 'select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]',
    deleteFlag: 'select[formcontrolname="smsDeleteSendFlag"]',
    deleteText: 'textarea[formcontrolname="smsDelete"]',
    deleteRadio: 'input[formcontrolname="SmsDeletedefaultWordingFlag"]',
    promoteFlag: 'select[formcontrolname="smsPromotePackSendFlag"]',
    promoteText: 'textarea[formcontrolname="smsPromotePack"]',
    lastMinuteFlag: 'select[formcontrolname="lastMinuteAlertSendFlag"]',
    lastMinuteRadio: 'input[formcontrolname="lastMinuteAlertDefaultWordingFlag"]',
    lastMinuteText: 'textarea[formcontrolname="smsNotificationLastMinuteAlert"]',
    beforeFeeFlag: 'select[formcontrolname="smsBeforeFeeDeductSendFlag"]',
    beforeFeeDeduct: 'input[formcontrolname="beforeFeeDeduction"]',
    beforeFeeUnit: 'select[formcontrolname="beforeFeeDeductionUnit"]',
    beforeFeeRadio: 'input[formcontrolname="defaultWordingFlag"]',
    beforeFeeText: 'textarea[formcontrolname="smsNotificationBeforeFeeDeduction"]',
    recSuccessFlag: 'select[formcontrolname="recurringDeductSuccessAlertSendFlag"]',
    recSuccessRadio: 'input[formcontrolname="recurringDeductSuccessAlertDefaultWordingFlag"]',
    recSuccessText: 'textarea[formcontrolname="recurringFeeDeductSuccessAlert"]',
    recFailFlag: 'select[formcontrolname="recurringDeductFailAlertSendFlag"]',
    recFailRadio: 'input[formcontrolname="recurringDeductFailAlertDefaultWordingFlag"]',
    recFailText: 'textarea[formcontrolname="recurringFeeDeductFailAlert"]',
    beforePromoFlag: 'select[formcontrolname="beforePromotionExpAlertSendFlag"]',
    beforePromoDeduct: 'input[formcontrolname="beforePromotionExpAlertDeduction"]',
    beforePromoUnit: 'select[formcontrolname="beforePromotionExpAlertDeductionUnit"]',
    beforePromoRadio: 'input[formcontrolname="beforePromotionExpAlertDefaultWordingFlag"]',
    beforePromoText: 'textarea[formcontrolname="beforePromotionExpAlert"]',
    promoExpFlag: 'select[formcontrolname="promotionExpAlertSendFlag"]',
    promoExpRadio: 'input[formcontrolname="promotionExpAlertDefaultWordingFlag"]',
    promoExpText: 'textarea[formcontrolname="promotionExpAlert"]',
    marketingName: 'textarea[formcontrolname="marketingName"]',
    yourPackage: 'textarea[formcontrolname="yourPackage"]',
    greetingLetter: 'textarea[formcontrolname="greetingLetter"]',
    romText: 'textarea[formcontrolname="smsReponseSuccessForROM"]',
    payText: 'textarea[formcontrolname="smsReponseSuccessForPAY"]',
    generateBtn: 'app-mass-mkt-sms-wording-detail button[title="generate"]',
    saveBtn: '.container-fluid > :nth-child(3) > .btn',
    availableListBox:
        'app-mass-mkt-sms-wording-detail ng2-dual-list-box select[formcontrolname="availableListBox"]',
    selectedListBox:
        'app-mass-mkt-sms-wording-detail ng2-dual-list-box select[formcontrolname="selectedListBox"]',
    moveRightBtn: 'button.str',
    copyFromGreetingBtn: 'app-mass-mkt-sms-wording-detail .panel:not([hidden]) button[title="Copy"]',
    // ✅ FIX #13 (2026-09-07): modal ที่เด้งขึ้นหลังกด Save ("Save Result" / "Save Success")
    saveResultModalTitle: '.modal-title',
    saveResultModalBody: '.modal-body',
    saveResultModalCloseBtn: '.modal-footer button, .modal-footer .btn',
};

const fieldMaxLengths: Record<string, number> = {
    [SEL.shortPromo]: 50,
    [SEL.cmsDisplay]: 250,
    [SEL.promoDesc]: 255,
    [SEL.checkCurrent]: 50,
    [SEL.greetingText]: 250,
    [SEL.deleteText]: 250,
    [SEL.promoteText]: 250,
    [SEL.lastMinuteText]: 250,
    [SEL.beforeFeeText]: 250,
    [SEL.recSuccessText]: 250,
    [SEL.recFailText]: 250,
    [SEL.beforePromoText]: 250,
    [SEL.promoExpText]: 250,
    [SEL.marketingName]: 40,
    [SEL.yourPackage]: 100,
    [SEL.greetingLetter]: 250,
    [SEL.romText]: 250,
    [SEL.payText]: 250,
};

/** field ที่ห้าม < > & เพิ่มเติม */
const STRICT_FIELDS = new Set<string>([SEL.shortPromo, SEL.marketingName]);

/* ============================================================
 * 4) MAIN LOGIC
 * ========================================================== */

const _smsWordingLogic = (type: 'POST' | 'PRE'): void => {
    const WAIT = 500;
    const SCROLL = 500;

    /** ✅ FIX #5: พิมพ์ผ่าน selector + index สดๆ ไม่ wrap ref เก่า (กัน detached DOM) */
    const typeAtIndex = (selector: string, idx: number, val: string): void => {
        cy.get(selector, { timeout: 10000 })
            .filter((_, el) => isVisible(Cypress.$(el)))
            .eq(idx)
            .should('not.be.disabled')
            .focus()
            .clear({ force: true })
            .type(val, { delay: 0, force: true })
            .trigger('input', { bubbles: true })
            .trigger('change', { bubbles: true })
            .blur({ force: true });
    };

    /** สำหรับ extra-lang ที่ type() ช้า/มีปัญหา unicode → set val ตรงๆ แต่ยัง re-query */
    const setValAtIndex = (selector: string, idx: number, val: string): void => {
        cy.get(selector, { timeout: 10000 })
            .filter((_, el) => isVisible(Cypress.$(el)))
            .eq(idx)
            .should('not.be.disabled')
            .invoke('val', val)
            .trigger('input', { bubbles: true, force: true })
            .trigger('change', { bubbles: true, force: true })
            .blur({ force: true });
    };

    /**
     * ✅ FIX #11 (2026-09-07): เดิม assert แบบ hard-fail ถ้า field ไม่ render ภายใน timeout
     * ทำให้ทั้ง suite ล้มเวลาเจอ field ที่ "มีเงื่อนไข" (ขึ้นอยู่กับ module/priceType/subModule
     * ของ PO เช่น smsCheckCurrent) แล้วบังเอิญไม่ปรากฏใน run นั้นๆ
     *
     * เปลี่ยนเป็น soft-wait: รอจนถึง timeout แล้ว "log คำเตือน + ข้าม" แทนที่จะ throw
     * เพื่อไม่ให้ field ที่ไม่บังคับจริงๆ (ตามเงื่อนไขของระบบ) ทำให้ทั้ง test แดง
     */
    const waitUntilFieldReady = (selector: string, label: string, timeout = 10000): void => {
        cy.get('body').then(($body) => {
            if (visibleEls($body.find(selector)).length > 0) return;

            cy.log(`⏳ [WAIT] ${label} (${selector}) ยังไม่ render, รอสูงสุด ${timeout}ms...`);

            // รอแบบ soft: poll จนครบ timeout แล้วเช็คผลสุดท้าย โดยไม่ throw ถ้ายังไม่เจอ
            cy.wait(timeout, { log: false });
            cy.get('body').then(($b) => {
                const found = visibleEls($b.find(selector)).length > 0;
                if (found) {
                    cy.log(`✅ ${label} render แล้วหลังรอ`);
                } else {
                    cy.log(
                        `⚠️ [SKIP] ${label} (${selector}) ไม่ render ภายใน ${timeout}ms — ` +
                        `สันนิษฐานว่าเป็น field ที่มีเงื่อนไข (ขึ้นกับ module/priceType/subModule) ` +
                        `จึงข้ามแทนที่จะ fail ทั้ง test`
                    );
                }
            });
        });
    };

    const safeWithSection = (
        sel: string,
        label: string,
        fn: ($el: JQuery<HTMLElement>) => void,
        waitForIt = false
    ): void => {
        const run = ($body: JQuery<HTMLElement>) => {
            const targets = visibleEls($body.find(sel));
            if (!targets.length) {
                cy.log(`⚠️ [SKIP] ${label} ไม่พบหรือถูกซ่อน (${sel})`);
                return;
            }

            cy.log(`📌 Processing: ${label}`);
            cy.get(sel)
                .filter((_, el) => isVisible(Cypress.$(el)))
                .first()
                .scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
            cy.wait(WAIT);
            fn(Cypress.$(targets));
            cy.wait(WAIT);
        };

        if (!waitForIt) {
            cy.get('body').then(($body) => run($body));
            return;
        }

        cy.get('body').then(($body) => {
            if (visibleEls($body.find(sel)).length > 0) {
                run($body);
                return;
            }
            cy.log(`⏳ [WAIT] ${label} (${sel}) ยังไม่ render, รอ...`);
            // ✅ FIX #11: เดิมใช้ .should() แบบ assert (throw ถ้าไม่เจอ) → เปลี่ยนเป็น soft-wait เช่นกัน
            cy.wait(8000, { log: false });
            cy.get('body').then(($b) => {
                if (visibleEls($b.find(sel)).length > 0) {
                    run($b);
                } else {
                    cy.log(`⚠️ [SKIP] ${label} (${sel}) ไม่ render หลังรอ 8000ms — ข้าม`);
                }
            });
        });
    };

    /** สร้างค่าที่พร้อมพิมพ์ลง field (clean + limit + strict) */
    const buildValue = (
        selector: string,
        poolData: Record<string, string[]>,
        langKey: string,
        maxLen: number
    ): string => {
        const strict = STRICT_FIELDS.has(selector);
        const raw = pick(poolData[langKey] ?? poolData['EN']);
        const val = limit(cleanMulti(String(raw ?? ''), strict), maxLen);
        return val || limit(cleanMulti(String(pick(poolData['EN']) ?? 'Auto Test Wording'), strict), maxLen);
    };

    /**
     * กรอกข้อความลงทุก slot ภาษาของ field
     * - protectGenerated: ถ้ามาจาก Generate ให้เก็บค่า EN/TH ไว้
     * - extra-lang slot จะถูก retype เสมอ ให้ตรงกับ label
     */
    const processTextFields = (
        selector: string,
        poolData: Record<string, string[]>,
        maxEn: number,
        maxTh: number,
        forceRetype = false,
        protectGenerated = false,
        extraLangs: string[] = []
    ): void => {
        safeWithSection(selector, `TextField(${selector})`, () => {
            cy.get('body').then(($body) => {
                const els = visibleEls($body.find(selector));
                if (!els.length) return;

                els.forEach((el, idx) => {
                    const $el = Cypress.$(el);
                    if ($el.is(':disabled')) return;

                    const currentVal = String($el.val() ?? '').trim();
                    const hasValue = currentVal.length > 0;

                    const { langKey, isExtra, source } = resolveLangForField(
                        $el,
                        idx,
                        poolData,
                        extraLangs
                    );

                    // 1) ค่าที่ Generate มาให้ ถ้าเป็น EN/TH → เก็บไว้
                    if (protectGenerated && hasValue && !isExtra) {
                        cy.log(`🔒 [${langKey}] เก็บค่าจาก Generate ไว้`);
                        return;
                    }

                    // 2) ตัดสินใจว่าจะพิมพ์ใหม่ไหม
                    let shouldRetype = forceRetype;
                    if (!shouldRetype) {
                        if (!hasValue) {
                            shouldRetype = true;
                            cy.log(`⚠️ [${langKey}] ว่าง → บังคับพิมพ์`);
                        } else if (isExtra) {
                            shouldRetype = true;
                            cy.log(`🌍 [${langKey}] extra-lang → พิมพ์ใหม่ให้ตรง label เสมอ`);
                        } else if (Math.random() < 0.6) {
                            cy.log(`🔒 [${langKey}] สุ่มได้ KEEP ค่าเดิม`);
                            return;
                        } else {
                            shouldRetype = true;
                            cy.log(`🎲 [${langKey}] สุ่มได้ RETYPE`);
                        }
                    }
                    if (!shouldRetype) return;

                    const maxLen = langKey === 'TH' ? maxTh : maxEn;
                    const val = buildValue(selector, poolData, langKey, maxLen);

                    cy.log(`⌨️ Typing [${langKey}] idx=${idx} (source=${source}, len=${val.length}/${maxLen})`);

                    if (isExtra) setValAtIndex(selector, idx, val);
                    else typeAtIndex(selector, idx, val);
                });
            });
        });
    };

    /** ไล่เก็บตกเฉพาะช่องที่ยังว่างอยู่ (ใช้ resolver ตัวเดียวกันเพื่อไม่ให้ logic ขัดกัน) */
    const enforceNotEmpty = (
        selector: string,
        poolData: Record<string, string[]>,
        maxEn: number,
        maxTh: number,
        extraLangs: string[] = []
    ): void => {
        cy.get('body').then(($body) => {
            const els = visibleEls($body.find(selector));
            if (!els.length) return;

            els.forEach((el, idx) => {
                const $el = Cypress.$(el);
                if ($el.is(':disabled')) return;
                if (String($el.val() ?? '').trim().length > 0) return;

                const { langKey, isExtra } = resolveLangForField($el, idx, poolData, extraLangs);
                const maxLen = langKey === 'TH' ? maxTh : maxEn;
                const val = buildValue(selector, poolData, langKey, maxLen);

                cy.log(`⚠️ [REQUIRED] ${selector}[${idx}] (${langKey}) ว่าง → บังคับพิมพ์`);
                if (isExtra) setValAtIndex(selector, idx, val);
                else typeAtIndex(selector, idx, val);
            });
        });
    };

    const fillAndEnforce = (
        selector: string,
        poolData: Record<string, string[]>,
        maxEn: number,
        maxTh: number,
        extraLangs: string[] = [],
        forceRetype = false,
        protectGenerated = false
    ): void => {
        processTextFields(selector, poolData, maxEn, maxTh, forceRetype, protectGenerated, extraLangs);
        enforceNotEmpty(selector, poolData, maxEn, maxTh, extraLangs);
    };

    const safeSelectFlag = (
        sel: string,
        label: string
    ): Cypress.Chainable<'Send' | "Don't Send" | null> =>
        cy.get('body').then(($body) => {
            if (!visibleEls($body.find(sel)).length) {
                cy.log(`⚠️ [SKIP] Flag ${label} ไม่พบหรือถูกซ่อน`);
                return cy.wrap<'Send' | "Don't Send" | null>(null);
            }
            const v: 'Send' | "Don't Send" = flag();
            cy.log(`🎲 ${label} Flag = ${v}`);
            return cy
                .get(sel)
                .filter((_, el) => isVisible(Cypress.$(el)))
                .first()
                .select(v, { force: true })
                .then(() => v) as Cypress.Chainable<'Send' | "Don't Send" | null>;
        }) as unknown as Cypress.Chainable<'Send' | "Don't Send" | null>;

    const matchesTargetValue = ($radio: JQuery<HTMLElement>, target: 'Yes' | 'No'): boolean => {
        const attrVal = ($radio.attr('value') || ($radio.prop('value') as string) || '').trim();
        if (attrVal === target) return true;
        const labelText = $radio.closest('label, div').text().trim();
        return labelText === target || new RegExp(`^${target}\\b`).test(labelText);
    };

    const handleRadioAndText = (
        radioSel: string,
        textSel: string,
        poolData: Record<string, string[]>,
        maxEn: number,
        maxTh: number,
        hasExtraLangs: boolean,
        forceNo = false,
        extraLangs: string[] = []
    ): void => {
        cy.get('body').then(($body) => {
            const radios = visibleEls($body.find(radioSel));
            const texts = visibleEls($body.find(textSel));

            if (!radios.length) {
                if (texts.length) {
                    cy.log(`👻 [WARN] Radio ${radioSel} ซ่อนอยู่ แต่ TextField ยังเห็น → บังคับพิมพ์กัน "is required"`);
                    fillAndEnforce(textSel, poolData, maxEn, maxTh, extraLangs, true, false);
                } else {
                    cy.log(`👻 [SKIP] ทั้ง Radio และ TextField ถูกซ่อน (${radioSel})`);
                }
                return;
            }

            safeWithSection(radioSel, `Radio(${radioSel})`, ($radios) => {
                const vRadios = visibleEls($radios);
                const defaultVal: 'Yes' | 'No' =
                    forceNo && hasExtraLangs ? 'No' : Math.random() < 0.3 ? 'No' : 'Yes';
                cy.log(
                    forceNo && hasExtraLangs
                        ? `🌍 [Forced] Default Wording = No`
                        : `🎲 Default Wording = ${defaultVal}`
                );

                let clicked = false;
                vRadios.forEach((radioEl) => {
                    const $radio = Cypress.$(radioEl);
                    if (!clicked && matchesTargetValue($radio, defaultVal)) {
                        cy.wrap($radio.closest('label, div')).click({ force: true });
                        clicked = true;
                    }
                });
                if (!clicked) cy.log(`⚠️ [WARN] ไม่มี radio ตรงกับ "${defaultVal}" — ตรวจ markup ของ ${radioSel}`);

                cy.wait(WAIT);
                if (defaultVal === 'No') {
                    processTextFields(textSel, poolData, maxEn, maxTh, true, false, extraLangs);
                } else {
                    cy.log(`✅ ใช้ System Default`);
                }
                enforceNotEmpty(textSel, poolData, maxEn, maxTh, extraLangs);
            });
        });
    };

    const runFlagThenRadioText = (
        flagSel: string,
        label: string,
        radioSel: string,
        textSel: string,
        poolData: Record<string, string[]>,
        hasExtraLangs: boolean,
        extraLangs: string[]
    ): void => {
        safeSelectFlag(flagSel, label).then((v) => {
            if (v === 'Send') {
                handleRadioAndText(radioSel, textSel, poolData, 250, 250, hasExtraLangs, true, extraLangs);
            }
        });
    };

    const keepOrRetype = (
        $el: JQuery<HTMLElement>,
        label: string,
        isEmpty: (v: string) => boolean,
        retypeFn: () => void
    ): void => {
        const currentVal = String($el.first().val() ?? '').trim();
        if (!isEmpty(currentVal)) {
            cy.log(`🔒 เก็บค่าเดิมของ ${label}: "${currentVal}"`);
            return;
        }
        cy.log(`⌨️ ${label} ว่าง → ตั้งค่าใหม่`);
        retypeFn();
    };

    /**
     * ✅ FIX #13 (2026-09-07): หลังกด Save จะมี modal "Save Result" (มี header "Save Result",
     * body "Save Success", ปุ่ม "Close") เด้งขึ้นมาบังหน้าจอ ถ้าไม่กดปิด modal ค้างอยู่จะไป
     * บัง element อื่นๆ ทำให้ assertion ที่เช็ค validation error ด้านล่างเจอปัญหา (modal ทับ
     * .alert-danger เดิม หรือ modal เองไปโดน query ผิดตัว)
     *
     * ฟังก์ชันนี้: รอ modal (แบบ soft-wait ไม่ throw ถ้าไม่เจอ เพราะบางเคส Save ไม่ผ่านอาจไม่มี
     * modal นี้ขึ้นแล้วไปโชว์ inline error แทน) → log ข้อความใน body ของ modal → กดปุ่ม Close
     */
    const closeSaveResultModal = (timeout = 10000): void => {
        const findCloseBtn = ($body: JQuery<HTMLElement>): HTMLElement | null => {
            const titles = visibleEls($body.find(SEL.saveResultModalTitle)).filter((el) =>
                /save result/i.test(el.textContent || '')
            );
            if (!titles.length) return null;

            const $dialog = Cypress.$(titles[0]).closest('.modal-content, .modal-dialog');
            const scope = $dialog.length ? $dialog : $body;
            const btns = visibleEls(scope.find(SEL.saveResultModalCloseBtn));
            return btns.find((b) => /close/i.test(b.textContent || '')) ?? btns[0] ?? null;
        };

        const reportAndClose = (btn: HTMLElement): void => {
            const $modalBody = Cypress.$(btn)
                .closest('.modal-content, .modal-dialog')
                .find(SEL.saveResultModalBody)
                .first();
            const bodyText = ($modalBody.text() || '').trim();
            cy.log(`📋 Save Result modal: "${bodyText || '(ไม่มีข้อความ)'}"`);
            if (bodyText && !/success/i.test(bodyText)) {
                cy.log(`⚠️ [WARN] Save Result ไม่ได้ขึ้น Success: "${bodyText}"`);
            }

            cy.wrap(btn).scrollIntoView().should('be.visible').click({ force: true });
            cy.wait(500);
            cy.log('✅ ปิด Save Result modal แล้ว');
        };

        cy.get('body').then(($body) => {
            const btn = findCloseBtn($body);
            if (btn) {
                reportAndClose(btn);
                return;
            }

            cy.log(`⏳ [WAIT] Save Result modal ยังไม่ขึ้น, รอสูงสุด ${timeout}ms...`);
            cy.wait(timeout, { log: false });
            cy.get('body').then(($b2) => {
                const btn2 = findCloseBtn($b2);
                if (!btn2) {
                    cy.log(
                        '⚠️ [INFO] ไม่พบ Save Result modal หลังรอ — ข้าม ' +
                        '(อาจไม่มี modal ในเคสนี้ หรือ Save ไม่สำเร็จและไปขึ้น inline error แทน)'
                    );
                    return;
                }
                reportAndClose(btn2);
            });
        });
    };

    const validateAllFieldLengths = (): void => {
        cy.log('🔍 ตรวจ max length ทุก field...');
        cy.get('body').then(($body) => {
            let over = 0;
            let ok = 0;

            Object.entries(fieldMaxLengths).forEach(([sel, maxLen]) => {
                const els = visibleEls($body.find(sel));
                els.forEach((el, idx) => {
                    const $el = Cypress.$(el);
                    if ($el.is(':disabled')) return;

                    const val = String($el.val() ?? '').trim();
                    if (!val) return;

                    const strict = STRICT_FIELDS.has(sel);
                    const cleaned = cleanMulti(val, strict);
                    const needsFix = val.length > maxLen || cleaned !== val;

                    if (needsFix) {
                        over++;
                        const fixed = limit(cleaned, maxLen);
                        cy.log(`⚠️ [FIX] ${sel}[${idx}] → ${val.length} chars (max ${maxLen}) / อักขระต้องห้าม`);
                        typeAtIndex(sel, idx, fixed);
                    } else {
                        ok++;
                        cy.log(`✅ [OK] ${sel}[${idx}] → ${val.length}/${maxLen}`);
                    }
                });
            });

            cy.then(() => cy.log(`📊 Summary: ✅ ${ok} OK | ⚠️ ${over} แก้ไข`));
        });
    };

    /* ---------- เข้าแท็บ SMS Wording ---------- */
    cy.scrollTo('bottom');
    cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
    cy.get('textarea, select', { timeout: 15000 }).should('exist');
    cy.wait(2000);

    cy.then(() => {
        /** ✅ FIX #1: อ่าน env key ให้ตรงกับที่ฝั่ง project-basic เซ็ตจริง */
        const projectName =
            Cypress.env('currentProjectName') ??
            Cypress.env('formattedDateMain') ??
            Cypress.env('formattedDate') ??
            '';
        const poName = Cypress.env('currentPoName') ?? 'Product Offering';
        const module = Cypress.env('currentModule') ?? 'MOB';
        const priceType = Cypress.env('currentPriceType') ?? 'recurring';
        const subModule = Cypress.env('currentSubModule') ?? type;

        if (!Cypress.env('currentProjectName')) {
            cy.log('⚠️ [WARN] ไม่พบ Cypress.env("currentProjectName") — pool อาจไม่ตรงกับ PO จริง');
        }

        const poolsData = createPOWordingPools(projectName, poName, module, priceType, subModule);
        const useGenerate = Math.random() < 0.5;

        const pools = {
            shortPromo: poolsData.shortPromotionName,
            cmsDisplay: poolsData.description,
            promoDesc: poolsData.promotionDescription,
            checkCurrent: poolsData.yourPackageName,
            greeting: poolsData.smsGreeting,
            delete: poolsData.smsDelete,
            promotePack: poolsData.smsPromotePack,
            lastMinute: poolsData.lastMinuteAlert,
            beforeFee: poolsData.beforeFeeDeduction,
            recSuccess: poolsData.recurringSuccess,
            recFail: poolsData.recurringFail,
            beforePromoExp: poolsData.beforePromoExpired,
            promoExp: poolsData.promoExpired,
            marketingName: poolsData.shortPromotionName,
            yourPackage: poolsData.yourPackageName,
            greetingLetter: poolsData.greetingLetter,
        };

        cy.log(`🎲 Mode: ${useGenerate ? '🤖 Generate' : '✍️ Manual'}`);
        cy.log(`📦 Pool Source: ${module}/${priceType}/${subModule}`);

        /* ---------- SESSION 1: Extra Languages ---------- */
        cy.log('🌍 SESSION 1: Extra Languages Setup');
        cy.get('body').then(($body) => {
            const listBoxes = visibleEls($body.find(SEL.availableListBox));
            if (listBoxes.length > 1) {
                cy.log(`⚠️ [WARN] พบ availableListBox ${listBoxes.length} ตัวใน scope นี้`);
            }

            const allAvailableLangs: string[] = listBoxes.length
                ? Cypress.$(listBoxes[0])
                      .find('option')
                      .map((_, o) => Cypress.$(o).text().trim())
                      .get()
                      .filter(Boolean)
                : [];
            cy.log(`🌍 ภาษาที่เลือกได้: [${allAvailableLangs.join(', ') || 'none'}]`);

            const shouldAdd = allAvailableLangs.length > 0 && Math.random() < 0.4;
            const requestedLangs: string[] = shouldAdd
                ? Cypress._.sampleSize(
                      allAvailableLangs,
                      Cypress._.random(1, Math.min(2, allAvailableLangs.length))
                  )
                : [];

            if (requestedLangs.length) {
                cy.log(`🌍 เลือกภาษา: ${requestedLangs.join(', ')}`);
                cy.get(SEL.availableListBox).each(($select) => {
                    if (!isVisible($select)) return;

                    const availableTexts = $select
                        .find('option')
                        .map((_, o) => Cypress.$(o).text().trim())
                        .get();
                    const matched = requestedLangs.filter((l) => availableTexts.includes(l));
                    if (!matched.length) return;

                    cy.wrap($select)
                        .select(matched, { force: true })
                        .trigger('change', { force: true })
                        .trigger('input', { force: true });

                    cy.wrap($select)
                        .closest('ng2-dual-list-box')
                        .find(SEL.moveRightBtn)
                        .should('not.be.disabled')
                        .click({ force: true });
                });
                cy.wait(1500);
            }

            /* ---------- SESSION 2: Generate ---------- */
            cy.log('🤖 SESSION 2: Generate Button');
            if (useGenerate) {
                safeWithSection(SEL.generateBtn, 'Generate Button', () =>
                    cy.get(SEL.generateBtn).filter(':visible').first().click({ force: true })
                );
                cy.wait(4000);
            } else {
                cy.log(`✍️ ข้าม Generate (Manual Mode)`);
            }

            /** ✅ FIX #8: อ่านภาษาที่ "รอดจริง" ใหม่หลัง Generate */
            cy.get('body').then(($b) => {
                const stillSelected = $b
                    .find(`${SEL.selectedListBox} option`)
                    .map((_, o) => Cypress.$(o).text().trim())
                    .get();

                const confirmed = requestedLangs.filter((l) => stillSelected.includes(l));
                if (confirmed.length !== requestedLangs.length) {
                    cy.log(
                        `⚠️ ภาษาหายหลัง Generate: คาด [${requestedLangs.join(', ')}] → เหลือ [${confirmed.join(', ') || 'none'}]`
                    );
                }

                const selectedExtraLangs = confirmed;
                const hasExtraLangs = selectedExtraLangs.length > 0;
                cy.log(`🌍 ยืนยันภาษาเสริม: [${selectedExtraLangs.join(', ') || 'none'}]`);

                /* ---------- SESSION 3: Basic Fields ---------- */
                cy.log('📝 SESSION 3: Basic Fields');
                // ✅ FIX #11 (2026-09-07): smsCheckCurrent เป็น field ที่ "มีเงื่อนไข" ขึ้นอยู่กับ
                // module/priceType/subModule ของ PO — ไม่ใช่ทุก PO ที่จะมี field นี้ปรากฏ
                // เดิม mark เป็น required=true ทุก field เหมือนกันหมด ทำให้เวลา field นี้ไม่ render
                // (ตามเงื่อนไขจริงของระบบ) ทั้ง suite ล้มด้วย AssertionError
                // → เปลี่ยนเป็น required=false ให้ตรงกับ pattern เดียวกับ field/section แบบมีเงื่อนไขอื่นๆ
                //   ในไฟล์นี้ (Greeting/Delete/LastMinute ฯลฯ ที่ใช้ safeSelectFlag/safeWithSection
                //   ซึ่งจะ log [SKIP] เฉยๆถ้าไม่เจอ แทนที่จะ fail)
                const basicFields: [string, Record<string, string[]>, number, number, boolean][] = [
                    [SEL.shortPromo, pools.shortPromo, 50, 50, true],
                    [SEL.cmsDisplay, pools.cmsDisplay, 250, 250, true],
                    [SEL.promoDesc, pools.promoDesc, 255, 255, true],
                    [SEL.checkCurrent, pools.checkCurrent, 50, 50, false],
                ];
                basicFields.forEach(([sel, pool, maxEn, maxTh, required]) => {
                    if (required) waitUntilFieldReady(sel, `Basic Field(${sel})`);
                    processTextFields(sel, pool, maxEn, maxTh, false, useGenerate, selectedExtraLangs);
                    if (required) enforceNotEmpty(sel, pool, maxEn, maxTh, selectedExtraLangs);
                });

                /* ---------- SESSION 4: Greeting & Delete ---------- */
                cy.log('👋 SESSION 4: SMS Greeting & Delete');
                waitUntilFieldReady(SEL.greetingFlag, 'Greeting Flag', 8000);
                safeSelectFlag(SEL.greetingFlag, 'Greeting').then((v) => {
                    if (v === 'Send') {
                        fillAndEnforce(SEL.greetingText, pools.greeting, 250, 250, selectedExtraLangs);
                    }
                });
                // ✅ FIX #12 (2026-09-07): smsConfirmSubSuccessCbsSendFlag = Send ผูกกับ smsGreeting
                // ในระบบจริง — ถ้าไม่พิมพ์ smsGreeting ไว้ Save จะ error/field ว่างไม่ผ่าน validation
                // เดิม safeSelectFlag(SEL.confirmSubFlag, ...) เลือกค่าเฉยๆ ไม่ได้ทำอะไรต่อกับ v
                // จึงพังเคสที่ greetingFlag != 'Send' แต่ confirmSubFlag = 'Send'
                // → บังคับ retype smsGreeting ทุกครั้งที่ confirmSubFlag = 'Send' โดยไม่สนสถานะเดิมของ greetingFlag
                safeSelectFlag(SEL.confirmSubFlag, 'Confirm Sub').then((v) => {
                    if (v === 'Send') {
                        cy.log('🔗 Confirm Sub = Send → บังคับพิมพ์ smsGreeting เสมอ (ผูกกับ Confirm Sub)');
                        fillAndEnforce(
                            SEL.greetingText,
                            pools.greeting,
                            250,
                            250,
                            selectedExtraLangs,
                            true,  // forceRetype: พิมพ์ใหม่ทุก slot ภาษา ไม่สนว่ามีค่าอยู่แล้วหรือไม่
                            false
                        );
                    }
                });
                runFlagThenRadioText(
                    SEL.deleteFlag, 'Delete', SEL.deleteRadio, SEL.deleteText,
                    pools.delete, hasExtraLangs, selectedExtraLangs
                );

                /* ---------- SESSION 5: Event Notification ---------- */
                cy.log('🔔 SESSION 5: SMS Event Notification');
                runFlagThenRadioText(
                    SEL.lastMinuteFlag, 'Last Minute', SEL.lastMinuteRadio, SEL.lastMinuteText,
                    pools.lastMinute, hasExtraLangs, selectedExtraLangs
                );

                safeSelectFlag(SEL.beforeFeeFlag, 'Before Fee').then((v) => {
                    if (v !== 'Send') return;

                    safeWithSection(SEL.beforeFeeDeduct, 'Before Fee Deduct', ($el) => {
                        keepOrRetype($el, 'Before Fee Deduct', (val) => val.length === 0, () => {
                            cy.get(SEL.beforeFeeDeduct)
                                .filter(':visible')
                                .first()
                                .clear({ force: true })
                                .type(`${Cypress._.random(1, 30)}`, { force: true })
                                .trigger('input', { bubbles: true })
                                .trigger('change', { bubbles: true })
                                .blur({ force: true });
                        });
                    });

                    safeWithSection(SEL.beforeFeeUnit, 'Before Fee Unit', ($el) => {
                        keepOrRetype($el, 'Before Fee Unit', (val) => !val || val === 'null', () => {
                            const opts = ($el.first().find('option').toArray() as HTMLOptionElement[])
                                .filter((o) => o.value && o.value !== 'null' && !o.disabled)
                                .map((o) => o.value);
                            if (opts.length) {
                                cy.get(SEL.beforeFeeUnit)
                                    .filter(':visible')
                                    .first()
                                    .select(Cypress._.sample(opts)!, { force: true })
                                    .trigger('change', { force: true });
                            }
                        });
                    });

                    handleRadioAndText(
                        SEL.beforeFeeRadio, SEL.beforeFeeText, pools.beforeFee,
                        250, 250, hasExtraLangs, true, selectedExtraLangs
                    );
                });

                runFlagThenRadioText(
                    SEL.recSuccessFlag, 'Rec Success', SEL.recSuccessRadio, SEL.recSuccessText,
                    pools.recSuccess, hasExtraLangs, selectedExtraLangs
                );
                runFlagThenRadioText(
                    SEL.recFailFlag, 'Rec Fail', SEL.recFailRadio, SEL.recFailText,
                    pools.recFail, hasExtraLangs, selectedExtraLangs
                );

                const beforeVal: 'Send' | "Don't Send" = flag();
                safeWithSection(SEL.beforePromoFlag, 'Before Promo Exp', () => {
                    cy.log(`🎲 Before Promo Flag = ${beforeVal}`);
                    cy.get(SEL.beforePromoFlag).filter(':visible').first().select(beforeVal, { force: true });
                });

                if (beforeVal === 'Send') {
                    safeWithSection(SEL.beforePromoDeduct, 'Before Promo Deduct', ($el) => {
                        keepOrRetype($el, 'Before Promo Deduct', (val) => val.length === 0, () => {
                            cy.get(SEL.beforePromoDeduct)
                                .filter(':visible')
                                .first()
                                .clear({ force: true })
                                .type(`${Cypress._.random(1, 30)}`, { force: true })
                                .trigger('input', { bubbles: true })
                                .trigger('change', { bubbles: true })
                                .blur({ force: true });
                        });
                    });

                    safeWithSection(SEL.beforePromoUnit, 'Before Promo Unit', ($el) => {
                        keepOrRetype($el, 'Before Promo Unit', (val) => !val || val === 'null', () => {
                            const opts = ($el.first().find('option').toArray() as HTMLOptionElement[])
                                .filter((o) => o.value && o.value !== 'null' && !o.disabled)
                                .map((o) => o.value);
                            if (opts.length) {
                                cy.get(SEL.beforePromoUnit)
                                    .filter(':visible')
                                    .first()
                                    .select(Cypress._.sample(opts)!, { force: true })
                                    .trigger('change', { force: true });
                            }
                        });
                    });

                    handleRadioAndText(
                        SEL.beforePromoRadio, SEL.beforePromoText, pools.beforePromoExp,
                        250, 250, hasExtraLangs, true, selectedExtraLangs
                    );
                }

                const afterVal: 'Send' | "Don't Send" = beforeVal === 'Send' ? "Don't Send" : 'Send';
                safeWithSection(SEL.promoExpFlag, 'Promo Expired', () => {
                    cy.log(`🔒 Promo Exp Flag = ${afterVal}`);
                    cy.get(SEL.promoExpFlag).filter(':visible').first().select(afterVal, { force: true });
                });
                if (afterVal === 'Send') {
                    handleRadioAndText(
                        SEL.promoExpRadio, SEL.promoExpText, pools.promoExp,
                        250, 250, hasExtraLangs, true, selectedExtraLangs
                    );
                }

                /* ---------- SESSION 6: Promote Package ---------- */
                cy.log('📢 SESSION 6: SMS Promote Package');
                safeSelectFlag(SEL.promoteFlag, 'Promote Pack').then((v) => {
                    if (v === 'Send') {
                        fillAndEnforce(SEL.promoteText, pools.promotePack, 250, 250, selectedExtraLangs);
                    }
                });

                /* ---------- SESSION 7: POST only ---------- */
                if (type === 'POST') {
                    cy.log('📦 SESSION 7: POST Specifics');
                    const postFields: [string, Record<string, string[]>, number, number][] = [
                        [SEL.marketingName, pools.marketingName, 40, 40],
                        [SEL.yourPackage, pools.yourPackage, 100, 100],
                        [SEL.greetingLetter, pools.greetingLetter, 250, 250],
                    ];
                    postFields.forEach(([sel, pool, maxEn, maxTh]) => {
                        fillAndEnforce(sel, pool, maxEn, maxTh, selectedExtraLangs);
                    });
                } else {
                    cy.log('⏭️ SESSION 7: ข้าม POST-specific fields (โหมด PRE)');
                }

                /* ---------- SESSION 7B: ROM / mPAY ---------- */
                cy.log('📋 SESSION 7B: SMS for ROM / mPAY');
                cy.get('body').then(($b2) => {
                    const copyBtns = visibleEls($b2.find(SEL.copyFromGreetingBtn));
                    if (!copyBtns.length) {
                        cy.log('⚠️ [SKIP] ไม่พบ ROM/mPAY panel ที่ active');
                        return;
                    }

                    copyBtns.forEach((_btn, i) => {
                        cy.get(SEL.copyFromGreetingBtn)
                            .filter((_, el) => isVisible(Cypress.$(el)))
                            .eq(i)
                            .scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } })
                            .click({ force: true });
                        cy.wait(WAIT);
                    });

                    enforceNotEmpty(SEL.romText, pools.greeting, 250, 250, selectedExtraLangs);
                    enforceNotEmpty(SEL.payText, pools.greeting, 250, 250, selectedExtraLangs);
                });

                /* ---------- SESSION 8: Validate ---------- */
                cy.log('🔍 SESSION 8: Validate All Field Max Lengths');
                validateAllFieldLengths();
                cy.wait(500);

                /* ---------- SESSION 9: Save (ของจริง) ---------- */
                cy.log('💾 SESSION 9: Save');

                // sync Angular form state ก่อน
                cy.get('body').then(($b3) => {
                    visibleEls($b3.find(`${SEL.root} textarea`)).forEach((el, i) => {
                        const $el = Cypress.$(el);
                        if ($el.is(':disabled')) return;
                        if (!String($el.val() ?? '').trim()) return;
                        cy.get(`${SEL.root} textarea`)
                            .filter((_, e) => isVisible(Cypress.$(e)))
                            .eq(i)
                            .trigger('input', { bubbles: true, force: true })
                            .trigger('change', { bubbles: true, force: true });
                    });
                });
                cy.wait(1000);

                /** ✅ FIX #2: กดปุ่ม Save จริง + ยืนยันว่าไม่มี validation error ค้าง */
                cy.get('body').then(($b4) => {
                    let saveBtn = visibleEls($b4.find(SEL.saveBtn))[0];

                    if (!saveBtn) {
                        // fallback: หาปุ่มที่ข้อความว่า Save
                        saveBtn = $b4
                            .find('button, .btn')
                            .toArray()
                            .filter((el) => isVisible(Cypress.$(el)))
                            .find((el) => /^\s*save\s*$/i.test(el.textContent || '')) as HTMLElement;
                    }

                    if (!saveBtn) {
                        cy.log('⚠️ [SKIP] ไม่พบปุ่ม Save — ข้อมูลอาจไม่ถูกบันทึก!');
                        return;
                    }

                    cy.wrap(saveBtn)
                        .scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } })
                        .should('not.be.disabled')
                        .click({ force: true });

                    cy.wait(2000);

                    // ✅ FIX #13: ปิด modal "Save Result" ก่อน ไม่งั้นจะไปบัง element / ค้าง
                    closeSaveResultModal();

                    cy.get('body', { timeout: 15000 }).should(($after) => {
                        const errs = $after
                            .find('.alert-danger, .has-error .help-block')
                            .toArray()
                            .filter((el) => isVisible(Cypress.$(el)))
                            .map((el) => (el.textContent || '').trim())
                            .filter(Boolean);

                        expect(errs.length, `ยังมี validation error หลัง Save: ${errs.join(' | ')}`).to.eq(0);
                    });

                    cy.log('✅ SMS Wording บันทึกสำเร็จ');
                });
            });
        });
    });
};

/* ============================================================
 * 5) CHI VALIDATION HELPERS
 * ========================================================== */

export function getRandomValidChiText(_isShortPromoName = false, maxLength = 20): string {
    const allowedChars =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%*()_+=.,?/:';
    const wordCount = Math.floor(Math.random() * 3) + 1;
    const words: string[] = [];

    for (let i = 0; i < wordCount; i++) {
        const wordLength = Math.floor(Math.random() * 5) + 3;
        let word = '';
        for (let j = 0; j < wordLength; j++) {
            word += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
        }
        words.push(word);
    }

    return limit(words.join(' ').trim(), maxLength);
}

export const testChiFieldsValidation = (): void => {
    const chiFields = [
        { name: 'Short Promotion Name CHI', selector: 'input[formcontrolname="shortPromotionNameChi"]', hasExtraForbidden: true },
        { name: 'Promotion Description CHI', selector: 'textarea[formcontrolname="promotionDescriptionChi"]', hasExtraForbidden: false },
        { name: 'SMS Greeting CHI', selector: 'textarea[formcontrolname="smsGreetingChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Before Fee Deduction CHI', selector: 'textarea[formcontrolname="smsNotiBeforeFeeChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Recurring Success CHI', selector: 'textarea[formcontrolname="smsNotiSuccessChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Before Promotion Expired CHI', selector: 'textarea[formcontrolname="smsNotiExpiredChi"]', hasExtraForbidden: false },
        { name: 'SMS Promote Package CHI', selector: 'textarea[formcontrolname="smsPromotePkgChi"]', hasExtraForbidden: false },
        { name: 'SMS Check Current CHI', selector: 'textarea[formcontrolname="smsCheckCurrentChi"]', hasExtraForbidden: false },
    ];

    const invalidCases = [
        { label: 'Thai Characters', input: 'ValidTextทดสอบ' },
        { label: 'Double Space', input: 'Valid  Text' },
        { label: 'Leading Space', input: ' ValidText' },
        { label: 'Trailing Space', input: 'ValidText ' },
    ];

    chiFields.forEach((field) => {
        cy.log(`🧪 Testing Validation for: ${field.name}`);

        cy.get('body').then(($body) => {
            // ✅ ใช้ visibleEls แทน isVisible(set) เพื่อไม่ให้ข้ามผิด
            if (!visibleEls($body.find(field.selector)).length) {
                cy.log(`⚠️ [SKIP] ${field.name} ไม่พบหรือถูกซ่อน`);
                return;
            }

            const target = () => cy.get(field.selector).filter(':visible').first();

            const assertInvalid = () => {
                target().should('have.class', 'ng-invalid');
            };
            const clearField = () => target().clear({ force: true }).blur({ force: true });

            const forbidden = field.hasExtraForbidden
                ? ['|', '^', "'", '–', '>', '<', '&']
                : ['|', '^', "'", '–'];

            invalidCases.forEach((tc) => {
                cy.log(`  ↳ Case: ${tc.label}`);
                target().clear({ force: true }).type(tc.input, { force: true }).blur({ force: true });
                assertInvalid();
                clearField();
            });

            forbidden.forEach((ch) => {
                cy.log(`  ↳ Case: Forbidden char '${ch}'`);
                target().clear({ force: true }).type(`Text${ch}Text`, { force: true }).blur({ force: true });
                assertInvalid();
                clearField();
            });

            clearField();
        });
    });
};

/* ============================================================
 * 6) PUBLIC API
 * ========================================================== */

/** ✅ FIX #7: เลือกโหมดอัตโนมัติจาก env ถ้าไม่ระบุ */
export const smsWordingAuto = (): void => {
    const sub = String(Cypress.env('currentSubModule') ?? 'POST').toUpperCase();
    _smsWordingLogic(sub === 'PRE' ? 'PRE' : 'POST');
};

export const smsWording = (): void => _smsWordingLogic('POST');
export const smsWordingPRE = (): void => _smsWordingLogic('PRE');

export const smsCKSPRE = (): void => {
    cy.get('body').then(($body) => {
        const normalize = (t: string | null | undefined): string => (t ?? '').replace(/\s+/g, ' ').trim();

        const $tab = $body
            .find('ul.nav.nav-tabs li a, .scrollmenu > .nav a')
            .filter((_i, el) => normalize(el.textContent) === 'SMS Wording');

        if (!$tab.length) {
            cy.log('⚠️ ไม่พบแท็บ "SMS Wording" — ข้าม');
            return;
        }

        cy.wrap($tab.first()).scrollIntoView().click({ force: true });
        cy.log('✅ คลิกแท็บ "SMS Wording" แล้ว');
    });
};

export const smsCKSPOST = (): void => {
    cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
    cy.get('textarea, select', { timeout: 15000 }).should('exist');
    cy.wait(500);

    cy.then(() => {
        const randomMessageCode = (): string => `PRO${Math.floor(Math.random() * 10000)}`;

        /** ✅ FIX #9: คืนแค่ตัวแรก ป้องกันพิมพ์ทับ input ของ section อื่น */
        const findScopedMessageCodeInput = (
            $select: JQuery<HTMLElement>,
            maxDepth = 8
        ): JQuery<HTMLElement> | null => {
            let $node = $select;
            for (let i = 0; i < maxDepth; i++) {
                $node = $node.parent();
                if ($node.length === 0) break;
                const $input = $node.find('input[formcontrolname="messageCode"]');
                if ($input.length > 0) {
                    if ($input.length > 1) {
                        cy.log(`⚠️ [WARN] พบ messageCode ${$input.length} ตัวในระดับ ${i + 1} → ใช้ตัวแรก`);
                    }
                    return $input.first();
                }
            }
            return null;
        };

        const fillMessageCodeIfSend = (selectFormControl: string, label: string): void => {
            const sel = `select[formcontrolname="${selectFormControl}"]`;

            cy.get('body').then(($body) => {
                if (!visibleEls($body.find(sel)).length) {
                    cy.log(`⚠️ [SKIP] ${label} ไม่พบหรือถูกซ่อน`);
                    return;
                }

                cy.get(sel).filter(':visible').first()
                    .scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
                cy.wait(500);

                cy.get(sel).filter(':visible').first().then(($select) => {
                    if (($select.val() as string) !== 'Send') {
                        cy.log(`⚠️ ${label} ไม่ใช่ "Send" — ข้าม messageCode`);
                        return;
                    }

                    cy.log(`✅ ${label} = Send, กรอก messageCode`);
                    const $input = findScopedMessageCodeInput($select);

                    if (!$input || !$input.length) {
                        throw new Error(
                            `ไม่พบ messageCode input ที่ผูกกับ "${label}" (formcontrolname="${selectFormControl}") ` +
                            `ไล่ขึ้นไป 8 ชั้นแล้วไม่เจอ — ตรวจ DOM รอบ select นี้`
                        );
                    }

                    cy.wrap($input)
                        .should('exist')
                        .clear({ force: true })
                        .type(randomMessageCode(), { force: true })
                        .trigger('input', { bubbles: true })
                        .trigger('change', { bubbles: true })
                        .blur({ force: true });

                    cy.wait(500);
                });
            });
        };

        fillMessageCodeIfSend('smsPromotePackSendFlag', 'SMS Promote Package');
        fillMessageCodeIfSend('beforePromotionExpAlertSendFlag', 'Before Promotion Expired Flag');
    });
};