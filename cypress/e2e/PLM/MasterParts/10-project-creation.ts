export const addFile = (): void => {
  cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');

  // ✅ รอ input ใน DOM — Angular *ngIf อาจ render ช้า
  cy.get('input[type="file"]', { timeout: 30000 }).should('exist');

  cy.readFile('D:/PLMcypress/cypress/e2e/fixtures/1.txt', 'binary').then((fileContent) => {
    cy.get('input[type="file"][id="files"]', { timeout: 15000 }).selectFile(
      {
        contents: Cypress.Buffer.from(fileContent, 'binary'),
        fileName: '1.txt',
        mimeType: 'text/plain',
      },
      { force: true }
    );
  });

  cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);

  beforeapproveMKT();
};
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
  // ── String helpers ────────────────────────────────────────────────────────
  const cleanEN = (s: string) => s ? s.replace(/[^\x00-\x7F\s]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim() : '';
  const cleanTH = (s: string) => s ? s.replace(/[^\u0E00-\u0E7F\u0020-\u007F\s-]/g, '').replace(/\s+/g, ' ').trim() : '';

  const limit = (s: string, max: number) => {
    if (!s) return '';
    let r = s.length > max ? s.substring(0, max).trimEnd() : s;
    if (r.length === max && r.includes(' ')) {
      const ls = r.lastIndexOf(' ');
      if (ls > max * 0.7) r = r.substring(0, ls);
    }
    return r;
  };

  const capEN = (s: string, max: number) => limit(cleanEN(s), max);
  const capTH = (s: string, max: number) => limit(cleanTH(s), max);
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)] || '' as unknown as T;
  const flag = () => Math.random() < 0.8 ? 'Send' : "Don't Send";

  const WAIT = 1000;
  const SCROLL = 500;

  // ── Centralized Selectors ─────────────────────────────────────────────────
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
    deleteDefaultRadio: 'input[formcontrolname="SmsDeletedefaultWordingFlag"]',

    promoteFlag: 'select[formcontrolname="smsPromotePackSendFlag"]',
    promoteText: 'textarea[formcontrolname="smsPromotePack"]',

    lastMinuteFlag: 'select[formcontrolname="lastMinuteAlertSendFlag"]',
    lastMinuteRadio: 'input[formcontrolname="lastMinuteAlertDefaultWordingFlag"]',
    lastMinuteText: 'textarea[formcontrolname="smsNotificationLastMinuteAlert"]',

    beforeFeeFlag: 'select[formcontrolname="smsBeforeFeeDeductSendFlag"]',
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
    beforePromoDefaultRadio: 'input[formcontrolname="beforePromotionExpAlertDefaultWordingFlag"]',
    beforePromoText: 'textarea[formcontrolname="beforePromotionExpAlert"]',

    promoExpFlag: 'select[formcontrolname="promotionExpAlertSendFlag"]',
    promoExpRadio: 'input[formcontrolname="promotionExpAlertDefaultWordingFlag"]',
    promoExpText: 'textarea[formcontrolname="promotionExpAlert"]',

    marketingName: 'textarea[formcontrolname="marketingName"]',
    yourPackage: 'textarea[formcontrolname="yourPackage"]',
    greetingLetter: 'textarea[formcontrolname="greetingLetter"]',
    saveBtn: '.container-fluid > :nth-child(3) > .btn'
  };

  // ── Cypress helpers ───────────────────────────────────────────────────────
  const scrollTo = (sel: string, label: string) => {
    cy.log(`📌 Scrolling to: ${label}`);
    cy.get(sel).first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
    cy.wait(WAIT);
  };

  const withSection = (sel: string, label: string, fn: ($el: JQuery<HTMLElement>) => void) => {
    cy.get('body').then(($b) => {
      const $target = $b.find(sel);
      if (!$target.length) return;
      scrollTo(sel, label);
      fn($target);
      cy.wait(WAIT);
    });
  };

  const fillTextareaMulti = ($el: JQuery<HTMLElement>, en: string, th: string, maxEn: number, maxTh: number) => {
    $el.each((idx, el) => {
      const $textarea = Cypress.$(el);
      if ($textarea.is(':disabled')) return;
      const cleaned = (idx % 2 === 0) ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($textarea).focus().clear({ force: true }).type(cleaned, { delay: 0, force: true })
        .trigger('input', { bubbles: true, force: true }).trigger('change', { bubbles: true, force: true }).blur({ force: true });
    });
    cy.wait(1000);
  };

  const fillIfEmpty = ($el: JQuery<HTMLElement>, en: string, th: string, maxEn: number, maxTh: number): void => {
    $el.each((idx, el) => {
      const $textarea = Cypress.$(el);
      if ($textarea.is(':disabled')) return;
      if (String($textarea.val() ?? '').trim()) return;
      const cleaned = (idx % 2 === 0) ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($textarea).focus().type(cleaned, { delay: 0, force: true })
        .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
    });
  };

  const selectFlag = ($el: JQuery<HTMLElement>, label: string): 'Send' | "Don't Send" => {
    const v = flag();
    cy.log(`🎲 ${label} = ${v}`);
    cy.wrap($el).select(v, { force: true });
    return v;
  };

  const trimOverflow = (): void => {
    cy.log('✂️ Trimming overflowed generated fields...');
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
      if ($el.is(':disabled')) return;
      const max = parseInt($el.attr('maxlength') || '9999', 10);
      const val = String($el.val() ?? '');
      if (val.length <= max) return;
      let trimmed = val.substring(0, max).trimEnd();
      if (trimmed.includes(' ')) {
        const ls = trimmed.lastIndexOf(' ');
        if (ls > max * 0.7) trimmed = trimmed.substring(0, ls);
      }
      cy.wrap($el).then(($native) => {
        const nativeEl = $native[0] as HTMLTextAreaElement;
        nativeEl.value = trimmed;
        nativeEl.dispatchEvent(new Event('input', { bubbles: true }));
        nativeEl.dispatchEvent(new Event('change', { bubbles: true }));
      }).blur({ force: true });
    });
    cy.wait(1000);
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(2000);

  cy.then(() => {
    const p = Cypress.env('formattedDateMain') || Cypress.env('formattedDate') || Cypress.env('projectName') || 'Product';
    const poName = Cypress.env('poName') || 'Product Offering';
    const poolsData = createPOWordingPools(p, poName, type, 'recurring');

    const pools = {
      shortPromo: { EN: () => pick(poolsData.shortPromotionName.EN), TH: () => pick(poolsData.shortPromotionName.TH) },
      cmsDisplay: { EN: () => pick(poolsData.description.EN), TH: () => pick(poolsData.description.TH) },
      promoDesc: { EN: () => pick(poolsData.promotionDescription.EN), TH: () => pick(poolsData.promotionDescription.TH) },
      checkCurrent: { EN: () => pick(poolsData.yourPackageName.EN), TH: () => pick(poolsData.yourPackageName.TH) },
      greeting: { EN: () => pick(poolsData.smsGreeting.EN), TH: () => pick(poolsData.smsGreeting.TH) },
      delete: { EN: () => pick(poolsData.smsDelete.EN), TH: () => pick(poolsData.smsDelete.TH) },
      promotePack: { EN: () => pick(poolsData.smsPromotePack.EN), TH: () => pick(poolsData.smsPromotePack.TH) },
      lastMinute: { EN: () => pick(poolsData.lastMinuteAlert.EN), TH: () => pick(poolsData.lastMinuteAlert.TH) },
      beforeFee: { EN: () => pick(poolsData.beforeFeeDeduction.EN), TH: () => pick(poolsData.beforeFeeDeduction.TH) },
      recSuccess: { EN: () => pick(poolsData.recurringSuccess.EN), TH: () => pick(poolsData.recurringSuccess.TH) },
      recFail: { EN: () => pick(poolsData.recurringFail.EN), TH: () => pick(poolsData.recurringFail.TH) },
      beforePromoExp: { EN: () => pick(poolsData.beforePromoExpired.EN), TH: () => pick(poolsData.beforePromoExpired.TH) },
      promoExp: { EN: () => pick(poolsData.promoExpired.EN), TH: () => pick(poolsData.promoExpired.TH) },
      marketingName: () => pick(poolsData.shortPromotionName.EN),
      yourPackage: { EN: () => pick(poolsData.yourPackageName.EN), TH: () => pick(poolsData.yourPackageName.TH) },
      greetingLetter: { EN: () => pick(poolsData.greetingLetter.EN), TH: () => pick(poolsData.greetingLetter.TH) },
    };

    cy.log('🎲 SMS Wording: สุ่ม flag ใหม่ทีละ section');
    const useGenerate = Math.random() < 0.5;
    cy.log(`🎲 SMS Wording mode: ${useGenerate ? '🤖 Generate Button' : '✍️ Manual Type'}`);

    // ════════════════════════════════════════════════════════════════════════
    //  🌍 LOGIC สุ่มภาษาเพิ่ม (Dual List Box)
    // ════════════════════════════════════════════════════════════════════════
    const extraLangOptions = ['Burmese', 'Chinese', 'Japanese', 'Korean', 'Lao'];
    const shouldAddExtraLangs = Math.random() < 0.2;
    let selectedExtraLangs: string[] = [];

    if (shouldAddExtraLangs) {
      const count = Cypress._.random(1, 2);
      selectedExtraLangs = Cypress._.sampleSize(extraLangOptions, count);
      cy.log(`🌍 สุ่มเพิ่มภาษา: ${selectedExtraLangs.join(', ')}`);
      cy.get('ng2-dual-list-box select[formcontrolname="availableListBox"]').select(selectedExtraLangs, { force: true });
      cy.get('ng2-dual-list-box button.str').should('not.be.disabled').click({ force: true });
      cy.wait(1500);
    }

    // ✨ Helper สำหรับจัดการ Default Wording (สุ่ม Yes/No แบบยืดหยุ่น)
    // ประกาศใน cy.then เพื่อให้เข้าถึง useGenerate และ selectedExtraLangs ได้
    const handleDefaultWording = (
      radioSel: string, textSel: string, enPool: () => string, thPool: () => string, maxEn: number, maxTh: number
    ) => {
      cy.get('body').then(($b) => {
        const $radios = $b.find(radioSel);
        if (!$radios.length) return;

        // สุ่ม Yes (70%) / No (30%)
        const defaultVal = Math.random() < 0.3 ? 'No' : 'Yes';
        cy.log(`🎲 Default Wording = ${defaultVal}`);
        cy.wrap($radios).parent().contains(defaultVal).click({ force: true });
        cy.wait(WAIT);

        if (defaultVal === 'No') {
          cy.log(`✍️ Checking fields for Default Wording = No`);
          cy.get(textSel).each(($el, idx) => {
            if ($el.is(':disabled')) return;

            const currentVal = String($el.val() ?? '').trim();
            const hasValue = currentVal.length > 0;

            // ถ้ามีค่าอยู่แล้ว (เช่น จาก Generate) -> สุ่ม 50/50 ว่าจะเก็บไว้หรือ clear
            if (hasValue && useGenerate) {
              const keepOriginal = Math.random() < 0.5;
              if (keepOriginal) {
                cy.log(`🔒 Keeping original value for idx ${idx}`);
                return;
              }
            }

            let val = (idx % 2 === 0) ? capEN(enPool(), maxEn) : capTH(thPool(), maxTh);
            if (selectedExtraLangs.length > 0 && !hasValue) {
              val = 'Default System';
            }

            cy.wrap($el).focus().clear({ force: true })
              .type(val, { force: true, delay: 0 })
              .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
          });
        } else {
          cy.log(`✅ Default Wording = Yes (Using system default, skipping manual type)`);
        }
      });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PATH A — Generate Button
    // ════════════════════════════════════════════════════════════════════════
    if (useGenerate) {
      cy.get('app-mass-mkt-sms-wording-detail button[title="generate"]').first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } }).should('be.visible').click({ force: true });
      cy.wait(4000);
      trimOverflow();

      withSection(SEL.shortPromo, 'Short Promo', ($el) => fillIfEmpty($el, pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));
      withSection(SEL.cmsDisplay, 'CMS Display', ($el) => fillIfEmpty($el, pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));
      withSection(SEL.promoDesc, 'Promo Desc', ($el) => fillIfEmpty($el, pools.promoDesc.EN(), pools.promoDesc.TH(), 255, 255));
      withSection(SEL.checkCurrent, 'Check Current', ($el) => fillIfEmpty($el, pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));

      if (flag() === 'Send') withSection(SEL.greetingText, 'Greeting', ($el) => fillIfEmpty($el, pools.greeting.EN(), pools.greeting.TH(), 400, 400));
      if (flag() === 'Send') withSection(SEL.deleteText, 'Delete', ($el) => fillIfEmpty($el, pools.delete.EN(), pools.delete.TH(), 250, 250));

      if (type === 'POST') {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => fillIfEmpty($el, pools.marketingName(), pools.marketingName(), 40, 40));
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillIfEmpty($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillIfEmpty($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PATH B — Manual Type (sections 1–4)
    // ════════════════════════════════════════════════════════════════════════
    if (!useGenerate) {
      withSection(SEL.shortPromo, 'Short Promotion Name', ($el) => fillTextareaMulti($el, pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));
      withSection(SEL.cmsDisplay, 'CMS Display', ($el) => fillTextareaMulti($el, pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));
      withSection(SEL.promoDesc, 'Promotion Description', ($el) => fillTextareaMulti($el, pools.promoDesc.EN(), pools.promoDesc.TH(), 250, 250));
      withSection(SEL.checkCurrent, 'SMS Check Current', ($el) => fillTextareaMulti($el, pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ALWAYS — Sections Flags & Events
    // ════════════════════════════════════════════════════════════════════════

    withSection(SEL.greetingFlag, 'SMS Greeting', ($el) => {
      const v = selectFlag($el, 'Greeting');
      if (v === 'Send' && !useGenerate) {
        withSection(SEL.greetingText, 'Greeting Text', ($textEl) => fillTextareaMulti($textEl, pools.greeting.EN(), pools.greeting.TH(), 400, 400));
      }
    });

    withSection(SEL.confirmSubFlag, 'Confirm Sub', ($el) => selectFlag($el, 'Confirm Sub'));

    // SMS Delete
    withSection(SEL.deleteFlag, 'SMS Delete', ($el) => {
      const vDel = selectFlag($el, 'Delete');
      cy.wait(WAIT);
      if (vDel === 'Send') {
        if (type === 'PRE') {
          handleDefaultWording(SEL.deleteDefaultRadio, SEL.deleteText, pools.delete.EN, pools.delete.TH, 250, 250);
        } else {
          cy.get(SEL.deleteText).each(($textEl, idx) => {
            if (!$textEl.is(':disabled')) {
              const currentVal = String($textEl.val() ?? '').trim();
              const hasValue = currentVal.length > 0;
              if (hasValue && useGenerate && Math.random() < 0.5) return;

              let val = (idx % 2 === 0) ? pools.delete.EN() : pools.delete.TH();
              if (selectedExtraLangs.length > 0 && !hasValue) val = 'Default System';

              cy.wrap($textEl).focus().clear({ force: true }).type(val, { force: true, delay: 0 })
                .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
            }
          });
        }
      }
    });

    // Simple Flags with Default Wording
    const simpleFlags: [string, string, string, string, () => string, () => string, number, number][] = [
      [SEL.lastMinuteFlag, 'Last Minute Alert', SEL.lastMinuteRadio, SEL.lastMinuteText, pools.lastMinute.EN, pools.lastMinute.TH, 250, 250],
      [SEL.beforeFeeFlag, 'Before Fee Deduction', SEL.beforeFeeRadio, SEL.beforeFeeText, pools.beforeFee.EN, pools.beforeFee.TH, 250, 250],
      [SEL.recSuccessFlag, 'Recurring Deduct Success', SEL.recSuccessRadio, SEL.recSuccessText, pools.recSuccess.EN, pools.recSuccess.TH, 250, 250],
      [SEL.recFailFlag, 'Recurring Deduct Fail', SEL.recFailRadio, SEL.recFailText, pools.recFail.EN, pools.recFail.TH, 250, 250],
    ];

    simpleFlags.forEach(([sel, label, radioSel, textSel, enPool, thPool, maxEn, maxTh]) => {
      withSection(sel, label, ($el) => {
        const v = selectFlag($el, label);
        if (v === 'Send' && radioSel && textSel) {
          handleDefaultWording(radioSel, textSel, enPool, thPool, maxEn, maxTh);
        }
      });
    });

    // SMS Promote Package
    withSection(SEL.promoteFlag, 'SMS Promote Package', ($el) => {
      const vPro = selectFlag($el, 'Promote');
      if (vPro === 'Send') {
        withSection(SEL.promoteText, 'Promote Text', ($textEl) =>
          fillTextareaMulti($textEl, pools.promotePack.EN(), pools.promotePack.TH(), 250, 250)
        );
      }
    });

    // Before / After Promotion Expired
    const beforePromoVal = flag();
    const promoExpVal = beforePromoVal === 'Send' ? "Don't Send" : 'Send';
    cy.log(`🎲 BeforePromo=${beforePromoVal}, PromoExp=${promoExpVal} (inverse กันเสมอ)`);

    withSection(SEL.beforePromoFlag, 'Before Promotion Expired', ($el) => {
      cy.wrap($el).select(beforePromoVal, { force: true });
      if (beforePromoVal === 'Send') {
        cy.get(SEL.beforePromoDeduct).clear({ force: true }).type(`${Cypress._.random(1, 30)}`, { force: true });
        cy.get(SEL.beforePromoUnit).then(($s) => {
          const opts = ($s.find('option').toArray() as HTMLOptionElement[])
            .filter((o) => o.value && o.value !== 'null' && !o.disabled)
            .map((o) => o.value);
          if (opts.length) cy.wrap($s).select(Cypress._.sample(opts) || '', { force: true });
        });
        handleDefaultWording(SEL.beforePromoDefaultRadio, SEL.beforePromoText, pools.beforePromoExp.EN, pools.beforePromoExp.TH, 250, 250);
      }
    });

    withSection(SEL.promoExpFlag, 'Promotion Expired', ($el) => {
      cy.log(`🔒 PromoExp=${promoExpVal} (ต้องตรงข้าม Before=${beforePromoVal})`);
      cy.wrap($el).select(promoExpVal, { force: true });
      if (promoExpVal === 'Send') {
        handleDefaultWording(SEL.promoExpRadio, SEL.promoExpText, pools.promoExp.EN, pools.promoExp.TH, 250, 250);
      }
    });

    // POST-only fields
    if (type === 'POST') {
      if (!useGenerate) {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => {
          cy.wrap($el).focus().clear({ force: true })
            .type(capEN(pools.marketingName(), 40), { delay: 0, force: true })
            .trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
        });
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillTextareaMulti($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillTextareaMulti($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      } else {
        withSection(SEL.marketingName, 'Marketing Name', ($el) => fillIfEmpty($el, pools.marketingName(), pools.marketingName(), 40, 40));
        withSection(SEL.yourPackage, 'Your Package', ($el) => fillIfEmpty($el, pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));
        withSection(SEL.greetingLetter, 'Greeting Letter', ($el) => fillIfEmpty($el, pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
      }
    }

    // Flush state & Save
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
      if ($el.is(':disabled') || !String($el.val() ?? '').trim()) return;
      cy.wrap($el).focus().trigger('input', { bubbles: true }).trigger('change', { bubbles: true }).blur({ force: true });
    });
    cy.wait(1000);

    withSection(SEL.saveBtn, 'Save Button', ($el) => {
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.wrap($el).should('be.visible').click();
      cy.wait('@postRequest', { timeout: 100000 }).its('response.statusCode').should('eq', 200);
      closeSuccessModal();
    });

  }); // end cy.then()
};

export const smsWording = (): void => {
  _smsWordingLogic('POST');
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
    cy.wait(1000);

    cy.get('select[formcontrolname="smsPromotePackSendFlag"]').then(($select) => {
      const currentValue = $select.val() as string;

      if (currentValue === 'Send') {
        cy.log('✅ SMS Promote Package = Send, filling messageCode');
        cy.get('input[formcontrolname="messageCode"]').first().type(randomMessageCode(), { force: true });
        cy.wait(1000);
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

// ========================
// RANDOM PRODUCT SPECIFICATION
// ========================

export const RandomProductSpecification = (
  productClass: string,
  priceType?: string,
  subModule?: string,
  Module?: string
): void => {
  const targetList = [
    'AIS Secure Net',
    'Apple Care',
    'Cloud PC',
    'Flowaccount',
    'MS365 Copilot',
    'Mobile Care',
    'Ubisoft Plus',
    'Voice',
    'SMS',
    'MMS',
    'Calling Melody',
    'Cloud Game',
    'AI IP Camera',
    'WiFi',
    'Karaoke',
    'VRBT',
    'Music Streaming',
    'Arcade',
    'TV Plus',
    'Youtube Premium',
    'Internet',
    'Vertical App'
  ];

  const blockedForMain = ['SMS', 'MMS', 'Voice'];

  const effectiveBlocked = [
    ...blockedForMain,
    ...(productClass === 'main' ? ['AI IP Camera', 'Youtube Premium', 'Mobile Care', 'Ubisoft Plus', 'Calling Melody', 'Karaoke', 'VRBT', 'Music Streaming', 'Arcade', 'TV Plus'] : []),
  ];

  const canRandomPick = productClass === 'main' || productClass === 'ontop' || productClass === 'ontop extra';

  // ── Step 1: scan available options & pick random subset ──────────────────
  if (canRandomPick) {
    cy.contains('.panel-heading', '*Product Specification')
      .closest('.panel')
      .within(() => {
        cy.get('select[formcontrolname="availableListBox"]')
          .first()
          .find('option')
          .should($options => {
            const texts = [...$options].map(el => el.textContent?.trim() || '');
            const hasAny = texts.some(t => targetList.includes(t));
            expect(hasAny, 'waiting for targetList options to load').to.be.true;
          })
          .then($options => {
            const available = [...$options]
              .map(el => el.textContent?.trim() || '')
              .filter(text => targetList.includes(text))
              .filter(text => !effectiveBlocked.includes(text)); // ✅ กันตั้งแต่ step 1

            const pickCount = Cypress._.random(1, Math.min(available.length, 5));
            const picked = Cypress._.shuffle(available).slice(0, pickCount);

            cy.wrap(picked).as('pickedItems');
            cy.log(`🎲 Picked (${pickCount}): ${picked.join(', ')}`);
          });
      });
  } else {
    // ไม่สุ่ม — ใช้ empty array เป็น placeholder
    cy.wrap([]).as('pickedItems');
    cy.log(`⏭️ productClass="${productClass}" — ข้ามการสุ่ม pickedItems`);
  }

  // ── Step 2: build configQueue + dblclick ─────────────────────────────────
  cy.get('@pickedItems').then(alias => {
    const pickedItems = alias as unknown as string[];
    const configQueue: string[] = [];

    // ✅ main — Internet เสมอ ไม่ขึ้นกับ random
    if (productClass === 'main') {
      configQueue.push('Internet');
      cy.log('📌 main: Internet forced into configQueue');
    }

    if (canRandomPick) {
      pickedItems
        .filter(item => !effectiveBlocked.includes(item)) // ✅ defense layer 2
        .forEach(item => {
          cy.contains('.panel-heading', '*Product Specification')
            .closest('.panel')
            .within(() => {
              cy.get('select[formcontrolname="availableListBox"]')
                .first()
                .contains('option', item)
                .dblclick({ force: true });

              cy.get('select[formcontrolname="availableListBox"]')
                .first()
                .find('option')
                .should($options => {
                  const texts = [...$options].map(el => el.textContent?.trim() || '');
                  expect(texts, `"${item}" should leave availableListBox`).not.to.include(item);
                });

              cy.get('select[formcontrolname="selectedListBox"]')
                .find('option')
                .should($options => {
                  const texts = [...$options].map(el => el.textContent?.trim() || '');
                  expect(texts, `"${item}" should arrive in selectedListBox`).to.include(item);
                })
                .then(() => cy.log(`✅ moved to selected: ${item}`));
            });

          if (!configQueue.includes(item)) {
            configQueue.push(item);
            cy.log(`➕ added to configQueue: ${item}`);
          }
        });
    }

    // ── Step 3: dispatch sub-functions ───────────────────────────────────
    cy.then(() => {
      cy.log(`⚙️ configQueue: ${configQueue.join(', ')}`);

      if (configQueue.includes('Voice')) { cy.log('▶️ Voice()'); Voice(); }
      if (configQueue.includes('SMS')) { cy.log('▶️ Sms()'); Sms(); }
      if (configQueue.includes('MMS')) { cy.log('▶️ Mms()'); Mms(); }
      if (configQueue.includes('Internet')) { cy.log('▶️ InternetRandom()'); InternetRandom(productClass, subModule, Module); }
      if (configQueue.includes('Vertical App')) { cy.log('▶️ VerticalApp()'); VerticalApp(); }
      if (configQueue.includes('Cloud Game')) { cy.log('▶️ CloudGame()'); CloudGame(); }
      if (configQueue.includes('AI IP Camera')) { cy.log('▶️ AIIPCamera()'); AIIPCamera(); }
      if (configQueue.includes('WiFi')) { cy.log('▶️ WiFi()'); WiFi(); }
      if (configQueue.includes('Karaoke')) { cy.log('▶️ Karaoke()'); Karaoke(); }
      if (configQueue.includes('VRBT')) { cy.log('▶️ VRBT()'); VRBT(); }
      if (configQueue.includes('Music Streaming')) { cy.log('▶️ MusicStreaming()'); MusicStreaming(); }

      const entItems = configQueue.filter(i => ['Arcade', 'TV Plus', 'Youtube Premium'].includes(i));
      if (entItems.length > 0) {
        cy.log(`▶️ EntertainmentPartnership(${entItems.join(', ')})`);
        EntertainmentPartnership(entItems as any);
      }
    });
  });
};


// ========================
// VOICE
// ========================

