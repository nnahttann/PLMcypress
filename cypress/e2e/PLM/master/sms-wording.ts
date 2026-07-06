import { createPOWordingPools } from '../Approve/po-wording-pools';

// ========================
// SMS WORDING FUNCTIONS
// ========================
// const closeSuccessModal = (): void => {
//     cy.contains('.modal-title', 'Save Result', { timeout: 600000 })
//         .closest('.modal-content')
//         .find('.modal-footer button.btn-danger')
//         .should('be.visible')
//         .and('not.be.disabled')
//         .click();
// };

const _smsWordingLogic = (type: 'POST' | 'PRE'): void => {
  const WAIT = 500;
  const SCROLL = 500;


  // ── Utility Functions ───────────────────────────────────────────────────
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

  const langKeyMap: Record<string, string> = {
    'Burmese': 'BUR', 'Chinese': 'CHI', 'Japanese': 'JPN', 'Khmer': 'KHM', 'Korean': 'KOR', 'Lao': 'LAO',
    'Vietnamese': 'VIE', 'Indonesian': 'IND', 'Malay': 'MAL', 'Filipino': 'FIL', 'Hindi': 'HIN', 'Arabic': 'ARA'
  };

  const getLangKey = (lang: string, poolData: Record<string, string[]>): string => {
    if (langKeyMap[lang]) return langKeyMap[lang];
    const auto = lang.substring(0, 3).toUpperCase();
    if (poolData[auto]) { cy.log(`🔑 Auto-derived key "${auto}" for lang "${lang}"`); return auto; }
    cy.log(`⚠️ [WARN] No pool key for lang "${lang}" (tried "${auto}") → fallback EN`);
    return 'EN';
  };

  const getLangCodeFromLabel = ($el: JQuery<HTMLElement>): string => {
    const $container = $el.closest('.col-md-6, .col-md-12');
    const labelText = ($container.find('label').first().text() || '').trim();
    const match = labelText.match(/([A-Z]{2,4})\s*:?\s*$/);
    if (match) return match[1];
    cy.log(`⚠️ [WARN] Cannot detect lang code from label "${labelText}"`);
    return 'EN';
  };

  const isVisible = ($el: JQuery<HTMLElement>): boolean => {
    if (!$el || !$el.length) return false;
    if ($el.is(':hidden') || $el.prop('hidden')) return false;
    if ($el.parents(':hidden').length > 0) return false;
    return true;
  };

  const waitUntilFieldReady = (selector: string, label: string, timeout = 10000) => {
    cy.get('body').then(($body) => {
      const alreadyReady = $body.find(selector).filter((_, el) => isVisible(Cypress.$(el))).length > 0;
      if (alreadyReady) return;

      cy.log(`⏳ [WAIT] ${label} (${selector}) not rendered yet, waiting up to ${timeout}ms...`);
      cy.get(selector, { timeout }).should(($el) => {
        expect($el.length, `${label} (${selector}) should exist in DOM`).to.be.greaterThan(0);
        expect(isVisible($el), `${label} (${selector}) should be visible`).to.eq(true);
      });
    });
  };

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
    availableListBox: 'app-mass-mkt-sms-wording-detail ng2-dual-list-box select[formcontrolname="availableListBox"]',
    moveRightBtn: 'app-mass-mkt-sms-wording-detail ng2-dual-list-box button.str',
    romText: 'textarea[formcontrolname="smsReponseSuccessForROM"]',
    payText: 'textarea[formcontrolname="smsReponseSuccessForPAY"]',
    copyFromGreetingBtn: 'app-mass-mkt-sms-wording-detail .panel:not([hidden]) button[title="Copy"]',
  };

  const fieldMaxLengths: Record<string, number> = {
    [SEL.shortPromo]: 50, [SEL.cmsDisplay]: 250, [SEL.promoDesc]: 255, [SEL.checkCurrent]: 50,
    // ✅ FIX: เปลี่ยนจาก 400 → 250 ให้ตรงกับ requirement จริง
    [SEL.greetingText]: 250,
    [SEL.deleteText]: 250, [SEL.promoteText]: 250, [SEL.lastMinuteText]: 250, [SEL.beforeFeeText]: 250,
    [SEL.recSuccessText]: 250, [SEL.recFailText]: 250, [SEL.beforePromoText]: 250, [SEL.promoExpText]: 250,
    [SEL.marketingName]: 40, [SEL.yourPackage]: 100, [SEL.greetingLetter]: 250,
    [SEL.romText]: 250, [SEL.payText]: 250,
  };

  const safeWithSection = (sel: string, label: string, fn: ($el: JQuery<HTMLElement>) => void) => {
    cy.get('body').then(($body) => {
      const $allTargets = $body.find(sel);
      const $target = $allTargets.filter((_, el) => isVisible(Cypress.$(el)));

      if (!$target.length) {
        cy.log(`⚠️ [SKIP] ${label} not found or hidden (${sel})`);
        return;
      }

      cy.log(`📌 Processing: ${label}`);
      cy.wrap($target.first()).scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
      cy.wait(WAIT);
      fn($target);
      cy.wait(WAIT);
    });
  };

  const processTextFields = (selector: string, poolData: Record<string, string[]>, maxEn: number, maxTh: number, hasExtraLangs: boolean, forceRetype: boolean = false, protectGenerated: boolean = false, extraLangs: string[] = []) => {
    safeWithSection(selector, `TextField(${selector})`, ($els) => {
      $els.each((idx, el) => {
        const $el = Cypress.$(el);
        if ($el.is(':disabled') || !isVisible($el)) return;

        const currentVal = String($el.val() ?? '').trim();
        const hasValue = currentVal.length > 0;
        const isExtraLangSlot = idx >= 2;

        if (protectGenerated && hasValue && !isExtraLangSlot) {
          cy.log(`🔒 Keep Generated value (protected, not retyping)`);
          return;
        }

        if (hasValue && !forceRetype && !isExtraLangSlot) {
          const shouldClear = Math.random() < 0.5;
          if (!shouldClear) {
            cy.log(`🎲 Keep existing value (randomly skipped)`);
            return;
          }
          cy.log(`🎲 Clear and retype (randomly chosen)`);
        }

        cy.wrap($el).focus().clear({ force: true });
        let langKey = 'EN';
        let maxLen = maxEn;

        if (idx === 0) { langKey = 'EN'; maxLen = maxEn; }
        else if (idx === 1) { langKey = 'TH'; maxLen = maxTh; }
        else if (isExtraLangSlot) {
          const domCode = getLangCodeFromLabel($el);
          if (poolData[domCode]) {
            langKey = domCode;
          } else {
            const fallbackLang = extraLangs[idx - 2];
            langKey = fallbackLang ? getLangKey(fallbackLang, poolData) : 'EN';
            cy.log(`⚠️ [WARN] DOM code "${domCode}" not in pool → fallback to "${langKey}"`);
          }
          maxLen = maxEn;
        }

        const rawVal = pick(poolData[langKey] || poolData['EN']);
        const val = limit(cleanMulti(rawVal), maxLen);
        const langLabel = isExtraLangSlot ? langKey : (idx === 1 ? 'TH' : 'EN');
        cy.log(`⌨️ Typing [${langKey}] for idx ${idx} (lang: ${langLabel})`);

        if (isExtraLangSlot) {
          cy.wrap($el).invoke('val', val).trigger('input', { bubbles: true, force: true }).trigger('change', { bubbles: true, force: true }).blur({ force: true });
        } else {
          cy.wrap($el).type(val, { delay: 0, force: true }).trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
        }
      });
    });
  };

  // 🛡️ Safety Net Function - บังคับ Type หาก Field ที่ Visible ดันว่างเปล่า
  const enforceNotEmpty = (selector: string, poolData: Record<string, string[]>, maxEn: number, maxTh: number, hasExtraLangs: boolean, extraLangs: string[] = []) => {
    cy.get('body').then(($body) => {
      const $els = $body.find(selector).filter((_, el) => isVisible(Cypress.$(el)));
      if (!$els.length) return;

      $els.each((idx, el) => {
        const $el = Cypress.$(el);
        if ($el.is(':disabled')) return;

        const currentVal = String($el.val() ?? '').trim();
        if (currentVal.length > 0) return;

        cy.log(`⚠️ [REQUIRED] Field ${selector}[${idx}] is EMPTY but required! Forcing type...`);

        let langKey = 'EN';
        let maxLen = maxEn;
        const isExtraLangSlot = idx >= 2;

        if (idx === 0) { langKey = 'EN'; maxLen = maxEn; }
        else if (idx === 1) { langKey = 'TH'; maxLen = maxTh; }
        else if (isExtraLangSlot) {
          const domCode = getLangCodeFromLabel($el);
          if (poolData[domCode]) {
            langKey = domCode;
          } else {
            const fallbackLang = extraLangs[idx - 2];
            langKey = fallbackLang ? getLangKey(fallbackLang, poolData) : 'EN';
          }
          maxLen = maxEn;
        }

        const rawVal = pick(poolData[langKey] || poolData['EN']);
        const val = limit(cleanMulti(rawVal), maxLen);

        cy.wrap($el).focus().clear({ force: true })
          .type(val, { delay: 0, force: true })
          .trigger('input', { bubbles: true })
          .trigger('change', { bubbles: true })
          .blur({ force: true });
      });
    });
  };

  const safeSelectFlag = (sel: string, label: string): Cypress.Chainable<'Send' | "Don't Send" | null> => {
    return cy.get('body').then(($body) => {
      const $el = $body.find(sel).filter((_, el) => isVisible(Cypress.$(el)));
      if (!$el.length) {
        cy.log(`⚠️ [SKIP] Flag ${label} not found or hidden`);
        return cy.wrap<'Send' | "Don't Send" | null>(null);
      }

      const v: 'Send' | "Don't Send" = flag();
      cy.log(`🎲 ${label} Flag = ${v}`);
      return cy.wrap($el.first()).select(v, { force: true }).then(() => v) as Cypress.Chainable<'Send' | "Don't Send" | null>;
    }) as unknown as Cypress.Chainable<'Send' | "Don't Send" | null>;
  };

  // 🛡️ REFACTORED: handleRadioAndText - แก้ปัญหา POST mode ที่ Radio ถูกซ่อน
  const handleRadioAndText = (radioSel: string, textSel: string, poolData: Record<string, string[]>, maxEn: number, maxTh: number, hasExtraLangs: boolean, forceNo: boolean = false, extraLangs: string[] = []) => {
    cy.get('body').then(($body) => {
      const $allRadios = $body.find(radioSel);
      const $visibleRadios = $allRadios.filter((_, el) => isVisible(Cypress.$(el)));
      const $visibleTextFields = $body.find(textSel).filter((_, el) => isVisible(Cypress.$(el)));

      // 🛑 CRITICAL FIX for POST MODE:
      // ถ้า Radio ถูกซ่อน/ไม่มีอยู่ แต่ TextField ยัง visible → บังคับ type ค่าทันทีเพื่อป้องกัน "is required" error
      if ($visibleRadios.length === 0) {
        if ($visibleTextFields.length > 0) {
          cy.log(`👻 [WARN] Radio ${radioSel} is hidden/missing but TextFields are visible. Forcing type to prevent "is required" error...`);
          // บังคับ type ค่าลงไปเลย (ไม่สน defaultVal เพราะ radio ไม่มีให้กด Yes/No)
          processTextFields(textSel, poolData, maxEn, maxTh, hasExtraLangs, true, false, extraLangs);
          enforceNotEmpty(textSel, poolData, maxEn, maxTh, hasExtraLangs, extraLangs);
        } else {
          cy.log(`👻 [SKIP] Both Radio ${radioSel} and TextFields ${textSel} are hidden/missing`);
        }
        return;
      }

      // ถ้า Radio Visible → ทำงานตาม Flow ปกติ
      safeWithSection(radioSel, `Radio(${radioSel})`, ($radios) => {
        const $vRadios = $radios.filter((_, el) => isVisible(Cypress.$(el)));
        let defaultVal: 'Yes' | 'No';
        if (forceNo && hasExtraLangs) { defaultVal = 'No'; cy.log(`🌍 [Forced] Default Wording = No`); }
        else { defaultVal = Math.random() < 0.3 ? 'No' : 'Yes'; cy.log(`🎲 Default Wording = ${defaultVal}`); }

        $vRadios.each((_, radioEl) => {
          const $radio = Cypress.$(radioEl);
          const $label = $radio.closest('label, div');
          if ($label.text().trim() === defaultVal) cy.wrap($label).click({ force: true });
        });

        cy.wait(WAIT);
        if (defaultVal === 'No') processTextFields(textSel, poolData, maxEn, maxTh, hasExtraLangs, hasExtraLangs, false, extraLangs);
        else cy.log(`✅ Using System Default`);

        // Safety Net: กันกรณี defaultVal === 'Yes' แต่ระบบไม่เจนค่ามาให้
        enforceNotEmpty(textSel, poolData, maxEn, maxTh, hasExtraLangs, extraLangs);
      });
    });
  };

  const validateAllFieldLengths = () => {
    cy.log('🔍 Validating max length for all fields...');
    cy.get('body').then(($body) => {
      let overCount = 0; let okCount = 0;
      Object.entries(fieldMaxLengths).forEach(([sel, maxLen]) => {
        const $els = $body.find(sel);
        if (!$els.length) return;

        $els.each((idx, el) => {
          const $el = Cypress.$(el);
          if ($el.is(':disabled') || !isVisible($el)) return;

          const val = String($el.val() ?? '').trim();
          if (!val) return;

          if (val.length > maxLen) {
            overCount++;
            cy.log(`⚠️ [OVER] ${sel}[${idx}] → ${val.length} chars (max ${maxLen}) → Truncating`);
            const truncated = limit(val, maxLen);
            cy.wrap($el).focus().clear({ force: true })
              .type(truncated, { delay: 0, force: true })
              .trigger('input', { bubbles: true })
              .trigger('change', { bubbles: true })
              .blur({ force: true });
          } else {
            okCount++;
            cy.log(`✅ [OK] ${sel}[${idx}] → ${val.length}/${maxLen}`);
          }
        });
      });
      cy.then(() => cy.log(`📊 Validation Summary: ✅ ${okCount} OK | ⚠️ ${overCount} Truncated`));
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

    const pools = {
      shortPromo: poolsData.shortPromotionName, cmsDisplay: poolsData.description, promoDesc: poolsData.promotionDescription,
      checkCurrent: poolsData.yourPackageName, greeting: poolsData.smsGreeting, delete: poolsData.smsDelete,
      promotePack: poolsData.smsPromotePack, lastMinute: poolsData.lastMinuteAlert, beforeFee: poolsData.beforeFeeDeduction,
      recSuccess: poolsData.recurringSuccess, recFail: poolsData.recurringFail, beforePromoExp: poolsData.beforePromoExpired,
      promoExp: poolsData.promoExpired, marketingName: poolsData.shortPromotionName, yourPackage: poolsData.yourPackageName,
      greetingLetter: poolsData.greetingLetter,
    };

    cy.log(`🎲 Mode: ${useGenerate ? '🤖 Generate' : '✍️ Manual'}`);
    cy.log(`📦 Pool Source: ${module}/${priceType}/${subModule}`);

    cy.log('🌍 SESSION 1: Extra Languages Setup');
    cy.get('body').then(($body) => {
      const $listBox = $body.find(SEL.availableListBox).filter((_, el) => isVisible(Cypress.$(el)));

      if ($listBox.length > 1) cy.log(`⚠️ [WARN] Found ${$listBox.length} availableListBox elements in SMS Wording scope`);

      const allAvailableLangs: string[] = $listBox.length
        ? $listBox.first().find('option').map((_, opt) => Cypress.$(opt).text().trim()).get().filter(Boolean)
        : [];
      cy.log(`🌍 Available languages in DOM: [${allAvailableLangs.join(', ') || 'none'}]`);

      const shouldAddExtraLangs = allAvailableLangs.length > 0 && Math.random() < 0.4;
      const selectedExtraLangs: string[] = shouldAddExtraLangs
        ? Cypress._.sampleSize(allAvailableLangs, Cypress._.random(1, Math.min(2, allAvailableLangs.length)))
        : [];
      const hasExtraLangs = selectedExtraLangs.length > 0;

      if (hasExtraLangs) {
        cy.log(`🌍 Selected Languages: ${selectedExtraLangs.join(', ')}`);
        cy.get(SEL.availableListBox).each(($select) => {
          if (!isVisible($select)) return;

          const availableTexts = $select.find('option').map((_, opt) => Cypress.$(opt).text().trim()).get();
          const matchedLangs = selectedExtraLangs.filter((lang) => availableTexts.includes(lang));
          if (!matchedLangs.length) return;

          cy.wrap($select).select(matchedLangs, { force: true }).trigger('change', { force: true }).trigger('input', { force: true });
          cy.wrap($select).closest('ng2-dual-list-box').find('button.str').should('not.be.disabled', { timeout: 5000 }).click({ force: true });
        });
        cy.wait(1500);
      }

      cy.log('🤖 SESSION 2: Generate Button');
      if (useGenerate) {
        safeWithSection('app-mass-mkt-sms-wording-detail button[title="generate"]', 'Generate Button', ($el) => cy.wrap($el.first()).click({ force: true }));
        cy.wait(4000);
      } else cy.log(`✍️ Skip Generate (Manual Mode)`);

      cy.log('📝 SESSION 3: Basic Fields');
      // `required` = the form actually blocks Save on these (confirmed via validation messages:
      // Short Promotion Name / CMS Display / Promotion Description). smsCheckCurrent is optional,
      // so it stays best-effort and won't fail the test if it's genuinely absent for this PO type.
      const basicFields: [string, Record<string, string[]>, number, number, boolean][] = [
        [SEL.shortPromo, pools.shortPromo, 50, 50, true],
        [SEL.cmsDisplay, pools.cmsDisplay, 250, 250, true],
        [SEL.promoDesc, pools.promoDesc, 255, 255, true],
        [SEL.checkCurrent, pools.checkCurrent, 50, 50, false],
      ];
      basicFields.forEach(([sel, pool, maxEn, maxTh, required]) => {
        if (required) waitUntilFieldReady(sel, `Basic Field(${sel})`);
        processTextFields(sel, pool, maxEn, maxTh, hasExtraLangs, false, useGenerate, selectedExtraLangs);
        if (required) enforceNotEmpty(sel, pool, maxEn, maxTh, hasExtraLangs, selectedExtraLangs);
      });

      cy.log('👋 SESSION 4: SMS Greeting & Delete');
      safeSelectFlag(SEL.greetingFlag, 'Greeting').then((v) => {
        if (v === 'Send') {
          // ✅ FIX: เปลี่ยนจาก 400, 400 → 250, 250 ให้ตรงกับ requirement จริง
          processTextFields(SEL.greetingText, pools.greeting, 250, 250, hasExtraLangs, hasExtraLangs, false, selectedExtraLangs);
          enforceNotEmpty(SEL.greetingText, pools.greeting, 250, 250, hasExtraLangs, selectedExtraLangs);
        }
      });
      safeSelectFlag(SEL.confirmSubFlag, 'Confirm Sub');
      safeSelectFlag(SEL.deleteFlag, 'Delete').then((v) => {
        if (v === 'Send') handleRadioAndText(SEL.deleteRadio, SEL.deleteText, pools.delete, 250, 250, hasExtraLangs, true, selectedExtraLangs);
      });

      cy.log('🔔 SESSION 5: SMS Event Notification');
      safeSelectFlag(SEL.lastMinuteFlag, 'Last Minute').then((v) => {
        if (v === 'Send') handleRadioAndText(SEL.lastMinuteRadio, SEL.lastMinuteText, pools.lastMinute, 250, 250, hasExtraLangs, true, selectedExtraLangs);
      });

      safeSelectFlag(SEL.beforeFeeFlag, 'Before Fee').then((v) => {
        if (v === 'Send') {
          safeWithSection(SEL.beforeFeeDeduct, 'Before Fee Deduct', ($el) => cy.wrap($el.first()).clear().type(`${Cypress._.random(1, 30)}`, { force: true }));
          safeWithSection(SEL.beforeFeeUnit, 'Before Fee Unit', ($el) => { const opts = ($el.find('option').toArray() as HTMLOptionElement[]).filter(o => o.value && o.value !== 'null' && !o.disabled).map(o => o.value); if (opts.length) cy.wrap($el.first()).select(Cypress._.sample(opts)!, { force: true }); });
          handleRadioAndText(SEL.beforeFeeRadio, SEL.beforeFeeText, pools.beforeFee, 250, 250, hasExtraLangs, true, selectedExtraLangs);
        }
      });

      safeSelectFlag(SEL.recSuccessFlag, 'Rec Success').then((v) => {
        if (v === 'Send') handleRadioAndText(SEL.recSuccessRadio, SEL.recSuccessText, pools.recSuccess, 250, 250, hasExtraLangs, true, selectedExtraLangs);
      });
      safeSelectFlag(SEL.recFailFlag, 'Rec Fail').then((v) => {
        if (v === 'Send') handleRadioAndText(SEL.recFailRadio, SEL.recFailText, pools.recFail, 250, 250, hasExtraLangs, true, selectedExtraLangs);
      });

      const beforeVal: 'Send' | "Don't Send" = flag();
      safeWithSection(SEL.beforePromoFlag, 'Before Promo Exp', ($el) => { cy.wrap($el.first()).select(beforeVal, { force: true }); cy.log(`🎲 Before Promo Flag = ${beforeVal}`); });
      if (beforeVal === 'Send') {
        safeWithSection(SEL.beforePromoDeduct, 'Before Promo Deduct', ($el) => cy.wrap($el.first()).clear().type(`${Cypress._.random(1, 30)}`, { force: true }));
        safeWithSection(SEL.beforePromoUnit, 'Before Promo Unit', ($el) => { const opts = ($el.find('option').toArray() as HTMLOptionElement[]).filter(o => o.value && o.value !== 'null' && !o.disabled).map(o => o.value); if (opts.length) cy.wrap($el.first()).select(Cypress._.sample(opts)!, { force: true }); });
        handleRadioAndText(SEL.beforePromoRadio, SEL.beforePromoText, pools.beforePromoExp, 250, 250, hasExtraLangs, true, selectedExtraLangs);
      }

      const afterVal: 'Send' | "Don't Send" = beforeVal === 'Send' ? "Don't Send" : 'Send';
      safeWithSection(SEL.promoExpFlag, 'Promo Expired', ($el) => { cy.log(`🔒 Promo Exp Flag = ${afterVal}`); cy.wrap($el.first()).select(afterVal, { force: true }); });
      if (afterVal === 'Send') handleRadioAndText(SEL.promoExpRadio, SEL.promoExpText, pools.promoExp, 250, 250, hasExtraLangs, true, selectedExtraLangs);

      cy.log('📢 SESSION 6: SMS Promote Package');
      safeSelectFlag(SEL.promoteFlag, 'Promote Pack').then((v) => {
        if (v === 'Send') {
          processTextFields(SEL.promoteText, pools.promotePack, 250, 250, hasExtraLangs, hasExtraLangs, false, selectedExtraLangs);
          enforceNotEmpty(SEL.promoteText, pools.promotePack, 250, 250, hasExtraLangs, selectedExtraLangs);
        }
      });

      if (type === 'POST') {
        cy.log('📦 SESSION 7: POST Specifics');
        const postFields: [string, Record<string, string[]>, number, number][] = [
          [SEL.marketingName, pools.marketingName, 40, 40], [SEL.yourPackage, pools.yourPackage, 100, 100], [SEL.greetingLetter, pools.greetingLetter, 250, 250],
        ];
        postFields.forEach(([sel, pool, maxEn, maxTh]) => {
          processTextFields(sel, pool, maxEn, maxTh, hasExtraLangs, false, false, selectedExtraLangs);
          enforceNotEmpty(sel, pool, maxEn, maxTh, hasExtraLangs, selectedExtraLangs);
        });
      }

      cy.log('📋 SESSION 7B: SMS for ROM / mPAY');
      cy.get('body').then(($b) => {
        const $copyBtns = $b.find(SEL.copyFromGreetingBtn);
        if (!$copyBtns.length) {
          cy.log('⚠️ [SKIP] No active ROM/mPAY panel found (hidden or not present)');
          return;
        }

        $copyBtns.each((_, btn) => {
          const $btn = Cypress.$(btn);
          if (!isVisible($btn)) {
            cy.log('👻 [SKIP] Copy button is inside a hidden panel');
            return;
          }

          cy.wrap(btn).scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
          cy.wait(WAIT);
          cy.wrap(btn).click({ force: true });
          cy.wait(WAIT);

          enforceNotEmpty(SEL.romText, pools.greeting, 250, 250, hasExtraLangs, selectedExtraLangs);
          enforceNotEmpty(SEL.payText, pools.greeting, 250, 250, hasExtraLangs, selectedExtraLangs);
        });
      });

      cy.log('🔍 SESSION 8: Validate All Field Max Lengths');
      validateAllFieldLengths();
      cy.wait(500);

      cy.log('💾 SESSION 9: Save');
      cy.get('body').then(($b) => {
        $b.find('app-mass-mkt-sms-wording-detail textarea').each((_, el) => {
          const $el = Cypress.$(el);
          if ($el.is(':disabled') || !isVisible($el)) return;

          const val = String($el.val() ?? '').trim();
          if (val) {
            cy.wrap($el)
              .trigger('input', { bubbles: true, force: true })
              .trigger('change', { bubbles: true, force: true });
          }
        });
      });
      cy.wait(1000);

      // safeWithSection(SEL.saveBtn, 'Save Button', ($el) => {
      //   cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      //   cy.wrap($el.first()).click();
      //   cy.wait('@postRequest', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
      //   // closeSuccessModal();
      // });
    });
  });
};

export function getRandomValidChiText(isShortPromoName: boolean = false, maxLength: number = 20): string {
  const allowedChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%*()_+=.,?/:';
  const wordCount = Math.floor(Math.random() * 3) + 1;
  const words = [];

  for (let i = 0; i < wordCount; i++) {
    const wordLength = Math.floor(Math.random() * 5) + 3;
    let word = '';
    for (let j = 0; j < wordLength; j++) {
      word += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    words.push(word);
  }

  let result = words.join(' ').trim();
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

  const invalidSpaceAndThaiCases = [
    { label: 'Thai Characters', input: 'ValidTextทดสอบ' },
    { label: 'Double Space', input: 'Valid  Text' },
    { label: 'Leading Space', input: ' ValidText' },
    { label: 'Trailing Space', input: 'ValidText ' }
  ];

  const isVisible = ($el: JQuery<HTMLElement>): boolean => {
    if (!$el || !$el.length) return false;
    if ($el.is(':hidden') || $el.prop('hidden')) return false;
    if ($el.parents(':hidden').length > 0) return false;
    return true;
  };

  chiFields.forEach(field => {
    cy.log(`🧪 Testing Validation for: ${field.name}`);

    cy.get('body').then($body => {
      const $field = $body.find(field.selector);
      if (!$field.length || !isVisible($field)) {
        cy.log(`⚠️ [SKIP] ${field.name} not found or hidden`);
        return;
      }

      const assertInvalid = () => {
        cy.get(field.selector).should('have.class', 'ng-invalid');
        cy.get(field.selector).closest('.form-group, .col-md-6, .col-md-12, div').find('.text-danger, .invalid-feedback').first().should('exist');
      };

      const clearField = () => {
        cy.get(field.selector).clear({ force: true }).blur({ force: true });
      };

      invalidSpaceAndThaiCases.forEach(testCase => {
        cy.log(`  ↳ Case: ${testCase.label}`);
        cy.get(field.selector).clear({ force: true }).type(testCase.input, { force: true }).blur({ force: true });
        assertInvalid();
        clearField();
      });

      ['|', '^', "'", '–'].forEach(char => {
        cy.log(`  ↳ Case: Forbidden char '${char}'`);
        cy.get(field.selector).clear({ force: true }).type(`Text${char}Text`, { force: true }).blur({ force: true });
        assertInvalid();
        clearField();
      });

      if (field.hasExtraForbidden) {
        ['>', '<', '&'].forEach(char => {
          cy.log(`  ↳ Case: Extra forbidden char '${char}'`);
          cy.get(field.selector).clear({ force: true }).type(`Text${char}Text`, { force: true }).blur({ force: true });
          assertInvalid();
          clearField();
        });
      }

      clearField();
    });
  });
};

export const smsWording = (): void => {
  _smsWordingLogic('POST');
};
export const smsWordingPRE = (): void => {
  _smsWordingLogic('PRE');
};
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

    // closeSuccessModal();
  });
};
