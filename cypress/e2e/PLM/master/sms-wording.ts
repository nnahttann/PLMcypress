import { createPOWordingPools } from '../Approve/po-wording-pools';

// ========================
// SMS WORDING FUNCTIONS
// ========================

const closeSuccessModal = (): void => {
    cy.contains('.modal-title', 'Save Result', { timeout: 20000 })
        .closest('.modal-content')
        .find('.modal-footer button.btn-danger')
        .should('be.visible')
        .and('not.be.disabled')
        .click();
};

const _smsWordingLogic = (type: 'POST' | 'PRE'): void => {
  // ── Helpers & Constants ───────────────────────────────────────────────────
  const WAIT = 500;
  const SCROLL = 500;

  // ✅ เปลี่ยนมาใช้ cleanMulti เพื่อไม่ให้ลบตัวอักษร Non-ASCII ของภาษาอื่นๆ ทิ้ง
  const cleanMulti = (s: string) => s ? s.replace(/[\x00-\x1F\x7F-\x9F]/g, '').replace(/\s+/g, ' ').trim() : '';

  const limit = (s: string, max: number) => {
    if (!s) return '';
    let r = s.length > max ? s.substring(0, max).trimEnd() : s;
    if (r.length === max && r.includes(' ')) {
      const ls = r.lastIndexOf(' ');
      if (ls > max * 0.7) r = r.substring(0, ls);
    }
    return r;
  };

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] || '' as unknown as T;
  const flag = (): 'Send' | "Don't Send" => Math.random() < 0.8 ? 'Send' : "Don't Send";

  // ✅ Map ชื่อภาษาพิเศษไปยัง Key ของ Pool
  const langKeyMap: Record<string, string> = {
    'Burmese': 'BUR',
    'Chinese': 'CHI',
    'Japanese': 'JPN',
    'Khmer': 'KHM',
    'Korean': 'KOR',
    'Lao': 'LAO'
  };

  // ── Selectors ─────────────────────────────────────────────────────────────
  // ... (SEL object remains unchanged) ...
  const SEL = {
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
    saveBtn: '.container-fluid > :nth-child(3) > .btn',
    availableListBox: 'ng2-dual-list-box select[formcontrolname="availableListBox"]',
    moveRightBtn: 'ng2-dual-list-box button.str',
  };

  // ── SAFE Core Actions ─────────────────────────────────────────────────────
  const safeWithSection = (sel: string, label: string, fn: ($el: JQuery<HTMLElement>) => void) => {
    cy.get('body').then(($body) => {
      const $target = $body.find(sel);
      if (!$target.length) {
        cy.log(`⚠️ [SKIP] ${label} not found (${sel})`);
        return;
      }
      cy.log(`📌 Processing: ${label}`);
      cy.wrap($target.first()).scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
      cy.wait(WAIT);
      fn($target);
      cy.wait(WAIT);
    });
  };

  // ✅ ปรับ processTextFields ให้รองรับ Object poolData และ extraLangs
  const processTextFields = (
    selector: string,
    poolData: Record<string, string[]>,
    maxEn: number,
    maxTh: number,
    hasExtraLangs: boolean,
    forceRetype: boolean = false,
    protectGenerated: boolean = false,
    extraLangs: string[] = []
  ) => {
    safeWithSection(selector, `TextField(${selector})`, ($els) => {
      $els.each((idx, el) => {
        const $el = Cypress.$(el);
        if ($el.is(':disabled')) return;

        const currentVal = String($el.val() ?? '').trim();
        const hasValue = currentVal.length > 0;
        const isExtraLangSlot = hasExtraLangs && idx >= 2;

        if (protectGenerated && hasValue && !isExtraLangSlot) {
          cy.log(`🔒 Keep Generated value (protected, not retyping)`);
          return;
        }

        if (hasValue && !forceRetype) {
          const shouldClear = Math.random() < 0.5;
          if (!shouldClear) {
            cy.log(`🎲 Keep existing value (randomly skipped)`);
            return;
          }
          cy.log(`🎲 Clear and retype (randomly chosen)`);
        }

        cy.wrap($el).focus().clear({ force: true });

        // ✅ Logic เลือกภาษาตาม Index ของ DOM
        let langKey = 'EN';
        let maxLen = maxEn;
        
        if (idx === 0) {
          langKey = 'EN';
          maxLen = maxEn;
        } else if (idx === 1) {
          langKey = 'TH';
          maxLen = maxTh;
        } else if (isExtraLangSlot) {
          const extraIdx = idx - 2;
          if (extraIdx < extraLangs.length) {
            langKey = langKeyMap[extraLangs[extraIdx]] || 'EN';
            maxLen = maxEn; // Default max length for extra langs
          } else {
            langKey = 'EN';
            maxLen = maxEn;
          }
        }

        const rawVal = pick(poolData[langKey] || poolData['EN']);
        const val = limit(cleanMulti(rawVal), maxLen);
        
        cy.log(`⌨️ Typing [${langKey}] for idx ${idx}`);

        cy.wrap($el)
          .type(val, { delay: 0, force: true })
          .trigger('input', { bubbles: true })
          .trigger('change', { bubbles: true })
          .blur({ force: true });
      });
    });
  };

  const safeSelectFlag = (sel: string, label: string): Cypress.Chainable<'Send' | "Don't Send" | null> => {
    return cy.get('body').then(($body) => {
      const $el = $body.find(sel);
      if (!$el.length) {
        cy.log(`⚠️ [SKIP] Flag ${label} not found`);
        return cy.wrap<'Send' | "Don't Send" | null>(null);
      }
      const v: 'Send' | "Don't Send" = flag();
      cy.log(`🎲 ${label} Flag = ${v}`);
      return cy.wrap($el.first()).select(v, { force: true }).then(() => v) as Cypress.Chainable<'Send' | "Don't Send" | null>;
    }) as unknown as Cypress.Chainable<'Send' | "Don't Send" | null>;
  };

  // ✅ ปรับ handleRadioAndText ให้ส่งต่อ extraLangs
  const handleRadioAndText = (
    radioSel: string,
    textSel: string,
    poolData: Record<string, string[]>,
    maxEn: number,
    maxTh: number,
    hasExtraLangs: boolean,
    forceNo: boolean = false,
    extraLangs: string[] = []
  ) => {
    safeWithSection(radioSel, `Radio(${radioSel})`, ($radios) => {
      let defaultVal: 'Yes' | 'No';
      if (forceNo && hasExtraLangs) {
        defaultVal = 'No';
        cy.log(`🌍 [Forced] Default Wording = No`);
      } else {
        defaultVal = Math.random() < 0.3 ? 'No' : 'Yes';
        cy.log(`🎲 Default Wording = ${defaultVal}`);
      }

      $radios.each((_, radioEl) => {
        const $radio = Cypress.$(radioEl);
        const $label = $radio.closest('label, div');
        const labelText = $label.text().trim();
        if (labelText === defaultVal) {
          cy.wrap($label).click({ force: true });
        }
      });
      cy.wait(WAIT);

      if (defaultVal === 'No') {
        processTextFields(textSel, poolData, maxEn, maxTh, hasExtraLangs, hasExtraLangs, false, extraLangs);
      } else {
        cy.log(`✅ Using System Default`);
      }
    });
  };

  // ── Main Execution Flow ───────────────────────────────────────────────────
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(2000);

  cy.then(() => {
    const projectName = Cypress.env('projectName') || Cypress.env('formattedDateMain') || 'Mobile Service';
    const poName = Cypress.env('poName') || 'Product Offering';
    const module = Cypress.env('module') || 'MOB';
    const priceType = Cypress.env('priceType') || 'recurring';
    const subModule = type;

    const poolsData = createPOWordingPools(projectName, poName, module, priceType, subModule);
    const useGenerate = Math.random() < 0.5;

    // ✅ ปรับ pools ให้ดึง Object ภาษาทั้งหมดมาตรงๆ
    const pools = {
      shortPromo:     poolsData.shortPromotionName,
      cmsDisplay:     poolsData.description,
      promoDesc:      poolsData.promotionDescription,
      checkCurrent:   poolsData.yourPackageName,
      greeting:       poolsData.smsGreeting,
      delete:         poolsData.smsDelete,
      promotePack:    poolsData.smsPromotePack,
      lastMinute:     poolsData.lastMinuteAlert,
      beforeFee:      poolsData.beforeFeeDeduction,
      recSuccess:     poolsData.recurringSuccess,
      recFail:        poolsData.recurringFail,
      beforePromoExp: poolsData.beforePromoExpired,
      promoExp:       poolsData.promoExpired,
      marketingName:  poolsData.shortPromotionName,
      yourPackage:    poolsData.yourPackageName,
      greetingLetter: poolsData.greetingLetter,
    };

    cy.log(`🎲 Mode: ${useGenerate ? '🤖 Generate' : '✍️ Manual'}`);
    cy.log(`📦 Pool Source: ${module}/${priceType}/${subModule}`);

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 1: Extra Languages Setup
    // ════════════════════════════════════════════════════════════════════════
    cy.log('🌍 SESSION 1: Extra Languages Setup');
    
    const extraLangOptions = ['Burmese', 'Chinese', 'Japanese', 'Khmer', 'Korean', 'Lao'];
    const shouldAddExtraLangs = Math.random() <0.4;
    let selectedExtraLangs: string[] = [];

    if (shouldAddExtraLangs) {
      selectedExtraLangs = Cypress._.sampleSize(extraLangOptions, Cypress._.random(1, 2));
      cy.log(`🌍 Adding Languages: ${selectedExtraLangs.join(', ')}`);

      cy.get(SEL.availableListBox).each(($select) => {
        const availableTexts = $select.find('option').map((_, opt) => Cypress.$(opt).text().trim()).get();
        const matchedLangs = selectedExtraLangs.filter((lang) => availableTexts.includes(lang));
        if (!matchedLangs.length) return;

        cy.wrap($select).select(matchedLangs, { force: true }).trigger('change', { force: true }).trigger('input', { force: true });
        cy.wrap($select).closest('ng2-dual-list-box').find('button.str').should('not.be.disabled', { timeout: 5000 }).click({ force: true });
      });
      cy.wait(1500);
    }
    const hasExtraLangs = selectedExtraLangs.length > 0;

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 2: Generate Button
    // ════════════════════════════════════════════════════════════════════════
    cy.log('🤖 SESSION 2: Generate Button');
    if (useGenerate) {
      safeWithSection('app-mass-mkt-sms-wording-detail button[title="generate"]', 'Generate Button', ($el) => {
        cy.wrap($el.first()).click({ force: true });
      });
      cy.wait(4000);
    } else {
      cy.log(`✍️ Skip Generate (Manual Mode)`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 3: Basic Fields
    // ════════════════════════════════════════════════════════════════════════
    cy.log('📝 SESSION 3: Basic Fields');
    const basicFields: [string, Record<string, string[]>, number, number][] = [
      [SEL.shortPromo, pools.shortPromo, 50, 50],
      [SEL.cmsDisplay, pools.cmsDisplay, 250, 250],
      [SEL.promoDesc, pools.promoDesc, 255, 255],
      [SEL.checkCurrent, pools.checkCurrent, 50, 50],
    ];

    basicFields.forEach(([sel, pool, maxEn, maxTh]) => {
      processTextFields(sel, pool, maxEn, maxTh, hasExtraLangs, false, useGenerate, selectedExtraLangs);
    });

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 4: SMS Greeting & Delete Section
    // ════════════════════════════════════════════════════════════════════════
    cy.log('👋 SESSION 4: SMS Greeting & Delete');
    
    safeSelectFlag(SEL.greetingFlag, 'Greeting').then((v) => {
      if (v === 'Send') processTextFields(SEL.greetingText, pools.greeting, 400, 400, hasExtraLangs, hasExtraLangs, false, selectedExtraLangs);
    });

    safeSelectFlag(SEL.confirmSubFlag, 'Confirm Sub');

    safeSelectFlag(SEL.deleteFlag, 'Delete').then((v) => {
      if (v === 'Send') handleRadioAndText(SEL.deleteRadio, SEL.deleteText, pools.delete, 250, 250, hasExtraLangs, true, selectedExtraLangs);
    });

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 5: SMS Event Notification Section
    // ════════════════════════════════════════════════════════════════════════
    cy.log('🔔 SESSION 5: SMS Event Notification');
    
    safeSelectFlag(SEL.lastMinuteFlag, 'Last Minute').then((v) => {
      if (v === 'Send') handleRadioAndText(SEL.lastMinuteRadio, SEL.lastMinuteText, pools.lastMinute, 250, 250, hasExtraLangs, false, selectedExtraLangs);
    });

    safeSelectFlag(SEL.beforeFeeFlag, 'Before Fee').then((v) => {
      if (v === 'Send') {
        safeWithSection(SEL.beforeFeeDeduct, 'Before Fee Deduct', ($el) => cy.wrap($el.first()).clear().type(`${Cypress._.random(1, 30)}`, { force: true }));
        safeWithSection(SEL.beforeFeeUnit, 'Before Fee Unit', ($el) => {
          const opts = ($el.find('option').toArray() as HTMLOptionElement[]).filter(o => o.value && o.value !== 'null' && !o.disabled).map(o => o.value);
          if (opts.length) cy.wrap($el.first()).select(Cypress._.sample(opts)!, { force: true });
        });
        handleRadioAndText(SEL.beforeFeeRadio, SEL.beforeFeeText, pools.beforeFee, 250, 250, hasExtraLangs, false, selectedExtraLangs);
      }
    });

    safeSelectFlag(SEL.recSuccessFlag, 'Rec Success').then((v) => {
      if (v === 'Send') handleRadioAndText(SEL.recSuccessRadio, SEL.recSuccessText, pools.recSuccess, 250, 250, hasExtraLangs, false, selectedExtraLangs);
    });

    safeSelectFlag(SEL.recFailFlag, 'Rec Fail').then((v) => {
      if (v === 'Send') handleRadioAndText(SEL.recFailRadio, SEL.recFailText, pools.recFail, 250, 250, hasExtraLangs, false, selectedExtraLangs);
    });

    const beforeVal: 'Send' | "Don't Send" = flag();
    safeWithSection(SEL.beforePromoFlag, 'Before Promo Exp', ($el) => {
      cy.wrap($el.first()).select(beforeVal, { force: true });
      cy.log(`🎲 Before Promo Flag = ${beforeVal}`);
    });

    if (beforeVal === 'Send') {
      safeWithSection(SEL.beforePromoDeduct, 'Before Promo Deduct', ($el) => cy.wrap($el.first()).clear().type(`${Cypress._.random(1, 30)}`, { force: true }));
      safeWithSection(SEL.beforePromoUnit, 'Before Promo Unit', ($el) => {
        const opts = ($el.find('option').toArray() as HTMLOptionElement[]).filter(o => o.value && o.value !== 'null' && !o.disabled).map(o => o.value);
        if (opts.length) cy.wrap($el.first()).select(Cypress._.sample(opts)!, { force: true });
      });
      handleRadioAndText(SEL.beforePromoRadio, SEL.beforePromoText, pools.beforePromoExp, 250, 250, hasExtraLangs, true, selectedExtraLangs);
    }

    const afterVal: 'Send' | "Don't Send" = beforeVal === 'Send' ? "Don't Send" : 'Send';
    safeWithSection(SEL.promoExpFlag, 'Promo Expired', ($el) => {
      cy.log(`🔒 Promo Exp Flag = ${afterVal}`);
      cy.wrap($el.first()).select(afterVal, { force: true });
    });

    if (afterVal === 'Send') handleRadioAndText(SEL.promoExpRadio, SEL.promoExpText, pools.promoExp, 250, 250, hasExtraLangs, false, selectedExtraLangs);

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 6: SMS Promote Package
    // ════════════════════════════════════════════════════════════════════════
    cy.log('📢 SESSION 6: SMS Promote Package');
    safeSelectFlag(SEL.promoteFlag, 'Promote Pack').then((v) => {
      if (v === 'Send') processTextFields(SEL.promoteText, pools.promotePack, 250, 250, hasExtraLangs, hasExtraLangs, false, selectedExtraLangs);
    });

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 7: POST Specifics
    // ════════════════════════════════════════════════════════════════════════
    if (type === 'POST') {
      cy.log('📦 SESSION 7: POST Specifics');
      const postFields: [string, Record<string, string[]>, number, number][] = [
        [SEL.marketingName, pools.marketingName, 40, 40],
        [SEL.yourPackage, pools.yourPackage, 100, 100],
        [SEL.greetingLetter, pools.greetingLetter, 250, 250],
      ];

      postFields.forEach(([sel, pool, maxEn, maxTh]) => {
        processTextFields(sel, pool, maxEn, maxTh, hasExtraLangs, false, false, selectedExtraLangs);
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // SESSION 8: Save
    // ════════════════════════════════════════════════════════════════════════
    cy.log('💾 SESSION 8: Save');
    cy.get('body').then(($body) => {
      const $textareas = $body.find('app-mass-mkt-sms-wording-detail textarea');
      $textareas.each((_, el) => {
        const $el = Cypress.$(el);
        if (!$el.is(':disabled') && String($el.val() ?? '').trim()) {
          cy.wrap($el).trigger('input', { bubbles: true }).trigger('change', { bubbles: true });
        }
      });
    });
    cy.wait(1000);

    safeWithSection(SEL.saveBtn, 'Save Button', ($el) => {
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.wrap($el.first()).click();
      cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
      closeSuccessModal();
    });
  });
};

export const smsWording = (): void => {
    _smsWordingLogic('POST');
};
export function getRandomValidChiText(isShortPromoName: boolean = false, maxLength: number = 20): string {
    // ตัวอักษรที่อนุญาต (A-Z, a-z, 0-9 และ Special characters ที่ปลอดภัย)
    // ระวัง: ไม่ใส่ Space ลงไปใน pool เด็ดขาด เพื่อป้องกัน Double Space
    const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%*()_+=.,?/:';
    
    // สร้างคำหลายๆ คำแล้วค่อยนำมารวมกันด้วย Space เดียว เพื่อให้ข้อความดูสมจริง
    const wordCount = Math.floor(Math.random() * 3) + 1; // 1-3 คำ
    const words = [];
    
    for (let i = 0; i < wordCount; i++) {
        const wordLength = Math.floor(Math.random() * 5) + 3; // 3-7 ตัวอักษรต่อคำ
        let word = '';
        for (let j = 0; j < wordLength; j++) {
            word += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
        }
        words.push(word);
    }
    
    // รวมคำด้วย Space เดียว และ trim หัวท้ายทิ้ง
    let result = words.join(' ').trim();
    
    // ตัดความยาวให้ไม่เกิน maxLength
    if (result.length > maxLength) {
        result = result.substring(0, maxLength).trim();
    }
    
    return result;
}
export const testChiFieldsValidation = () => {
    const chiFields = [
        { name: 'Short Promotion Name CHI', selector: 'input[formcontrolname="shortPromotionNameChi"]', hasExtraForbidden: true },
        { name: 'Promotion Description CHI', selector: 'textarea[formcontrolname="promotionDescriptionChi"]', hasExtraForbidden: false },
        { name: 'SMS Greeting CHI', selector: 'textarea[formcontrolname="smsGreetingChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Before Fee Deduction CHI', selector: 'textarea[formcontrolname="smsNotiBeforeFeeChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Recurring Fee Deduct Success Alert CHI', selector: 'textarea[formcontrolname="smsNotiSuccessChi"]', hasExtraForbidden: false },
        { name: 'SMS Notification Before Promotion Expired CHI', selector: 'textarea[formcontrolname="smsNotiExpiredChi"]', hasExtraForbidden: false },
        { name: 'SMS Promote Package CHI', selector: 'textarea[formcontrolname="smsPromotePkgChi"]', hasExtraForbidden: false },
        { name: 'SMS Check Current CHI', selector: 'textarea[formcontrolname="smsCheckCurrentChi"]', hasExtraForbidden: false }
    ];

    // ข้อมูลทดสอบที่ "ผิดกฎ" (Space rules & Thai)
    const invalidSpaceAndThaiCases = [
        { label: 'Thai Characters', input: 'ValidTextทดสอบ' },
        { label: 'Double Space', input: 'Valid  Text' },
        { label: 'Leading Space', input: ' ValidText' },
        { label: 'Trailing Space', input: 'ValidText ' }
    ];

    chiFields.forEach(field => {
        cy.log(`🧪 Testing Validation for: ${field.name}`);
        
        // 1. ทดสอบ Case พื้นฐานที่ผิดทุกฟิลด์ (ภาษาไทย, Space)
        invalidSpaceAndThaiCases.forEach(testCase => {
            cy.get(field.selector).clear().type(testCase.input);
            // ตรวจสอบว่าระบบแสดง Error (ปรับ selector '.text-danger' ตาม UI จริงของคุณ)
            cy.get('.text-danger').should('be.visible'); 
        });

        // 2. ทดสอบ Special Characters ที่ห้ามทุกฟิลด์
        ['|', '^', "'", '–'].forEach(char => {
            cy.get(field.selector).clear().type(`Text${char}Text`);
            cy.get('.text-danger').should('be.visible');
        });

        // 3. ทดสอบ Special Characters เพิ่มเติม เฉพาะ Short Promotion Name
        if (field.hasExtraForbidden) {
            ['>', '<', '&'].forEach(char => {
                cy.get(field.selector).clear().type(`Text${char}Text`);
                cy.get('.text-danger').should('be.visible');
            });
        }
    });
};
export const smsWordingpre = (): void => {
    _smsWordingLogic('PRE');
};
// ========================
// SMS CKS
// ========================

export const smsCKSPRE = (): void => {
    cy.get('body').then(($body) => {
        const normalizeText = (text: string | null | undefined): string =>
            (text ?? '').replace(/\s+/g, ' ').trim();

        const $tab = $body
            .find('ul.nav.nav-tabs li a, .scrollmenu > .nav a')
            .filter((_i, el) => normalizeText(el.textContent) === 'SMS Wording');

        if (!$tab.length) {
            cy.log('⚠️ Tab "SMS Wording" not found — skipping');
            return;
        }

        cy.wrap($tab.first()).scrollIntoView().click({ force: true });
        cy.log('✅ Clicked tab: "SMS Wording"');
        cy.log('featureDescription');
    });
};

export const smsCKSPOST = (): void => {
    cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
    cy.get('textarea, select', { timeout: 15000 }).should('exist');
    cy.wait(500);

    cy.then(() => {
        const finalProjectName = Cypress.env('formattedDateMain') ||
            Cypress.env('formattedDate') ||
            Cypress.env('projectName') ||
            Cypress.env('formattedDateMainPONAME') ||
            Cypress.env('formattedDateOntopPONAME') ||
            Cypress.env('poName');

        const p = finalProjectName;

        const randomMessageCode = (): string => {
            return `PRO${Math.floor(Math.random() * 10000)}`;
        };

        cy.get('select[formcontrolname="smsPromotePackSendFlag"]').first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
        cy.wait(500);

        cy.get('select[formcontrolname="smsPromotePackSendFlag"]').then(($select) => {
            const currentValue = $select.val() as string;

            if (currentValue === 'Send') {
                cy.log('✅ SMS Promote Package = Send, filling messageCode');
                cy.get('input[formcontrolname="messageCode"]').first().type(randomMessageCode(), { force: true });
                cy.wait(500);
            } else {
                cy.log('⚠️ SMS Promote Package is not "Send", skipping messageCode');
            }
        });

        // Save - ใช้ selector ที่ถูกต้อง
        cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
        cy.contains('button', 'Save').should('be.visible').click(); // ✅ แก้ตรงนี้
        cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

        closeSuccessModal();
    });
};

