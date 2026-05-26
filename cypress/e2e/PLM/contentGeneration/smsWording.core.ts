// ========================
// SMS WORDING FUNCTIONS
// ========================
const closeSuccessModal = (): void => {
  cy.get('.modal-dialog', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer', { timeout: 20000 }).should('be.visible');
  cy.get('.modal-footer')
    .find('button.btn-danger')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
};

import { POWordingPoolsData } from './poWordingPoolsData';

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
  const pick  = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const flag  = () => pick(['Send', "Don't Send"]);

  // ── Timing ────────────────────────────────────────────────────────────────
  const WAIT   = 500;
  const SCROLL = 500;

  // ── Pre-roll flags ────────────────────────────────────────────────────────
  const flags = {
    greeting:     flag(),
    delete:       flag(),
    lastMinute:   flag(),
    beforeDeduct: flag(),
    deductOk:     flag(),
    deductFail:   flag(),
    promote:      flag(),
  };

  const beforePromoVal = flag();
  const promoExpVal    = beforePromoVal === 'Send' ? "Don't Send" : flag();

  // ── Cypress helpers ───────────────────────────────────────────────────────
  const scrollTo = (sel: string, label: string) => {
    cy.log(`📌 Scrolling to: ${label}`);
    cy.get(sel).first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } });
    cy.wait(1000);
  };

  const withSection = (sel: string, label: string, fn: () => void) => {
    cy.get('body').then(($b: any) => {
      if (!$b.find(sel).length) return;
      scrollTo(sel, label);
      fn();
      cy.wait(WAIT);
    });
  };

  const fillTextarea = (sel: string, en: string, th: string, maxEn: number, maxTh: number) => {
    cy.get(sel).each(($el: any, idx: number) => {
      const cleaned = idx === 0 ? capEN(en, maxEn) : capTH(th, maxTh);
      cy.wrap($el).focus().clear({ force: true }).type(cleaned, { delay: 0, force: true }).blur({ force: true });
    });
    cy.wait(300);
  };

  // ── Init ─────────────────────────────────────────────────────────────────
  cy.scrollTo('bottom');
  cy.get('.scrollmenu > .nav').contains('SMS Wording').should('be.visible').click();
  cy.get('textarea, select', { timeout: 15000 }).should('exist');
  cy.wait(1500);

  cy.then(() => {
    const p = Cypress.env('formattedDateMain')
      || Cypress.env('formattedDate')
      || Cypress.env('projectName')
      || Cypress.env('formattedDateMainPONAME')
      || Cypress.env('formattedDateOntopPONAME')
      || Cypress.env('poName')
      || 'Product';


    // ── Generate random values for placeholders ───────────────────────────
    const dataAmount = pick(['10GB', '30GB', '50GB', '100GB', '200GB', 'Unlimited']);
    const speed      = pick(['100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '2 Gbps']);
    const price      = String(Math.floor(Math.random() * (2999 - 199 + 1)) + 199);
    const modNameEN  = type === 'POST' ? 'Postpaid' : 'Prepaid';
    const modNameTH  = type === 'POST' ? 'รายเดือน' : 'เติมเงิน';
    const benefit1EN = pick(['5G Access', 'Unlimited Calls', 'Free Streaming']);
    const benefit1TH = pick(['เข้าใช้ 5G', 'โทรฟรีไม่อั้น', 'สตรีมมิ่งฟรี']);
    const benefit2EN = pick(['No Contract', 'Free SIM', 'eSIM Ready']);
    const benefit2TH = pick(['ไม่มีสัญญา', 'ซิมฟรี', 'พร้อม eSIM']);
    const ptNameEN   = 'Monthly';
    const ptNameTH   = 'รายเดือน';
    const validity   = pick(['30', '90', '365']);

    const r = (str: string, isTH: boolean) => str
      .replace(/{p}/g, p)
      .replace(/{dataAmount}/g, dataAmount)
      .replace(/{speed}/g, speed)
      .replace(/{price}/g, price)
      .replace(/{modName}/g, isTH ? modNameTH : modNameEN)
      .replace(/{benefit1}/g, isTH ? benefit1TH : benefit1EN)
      .replace(/{benefit2}/g, isTH ? benefit2TH : benefit2EN)
      .replace(/{ptName}/g, isTH ? ptNameTH : ptNameEN)
      .replace(/{validity}/g, validity);

    const pools = {
      shortPromo: {
        EN: () => r(pick(POWordingPoolsData.shortPromotionNameEN), false),
        TH: () => r(pick(POWordingPoolsData.shortPromotionNameTH), true),
      },
      cmsDisplay: {
        EN: () => r(pick(POWordingPoolsData.descriptionEN), false),
        TH: () => r(pick(POWordingPoolsData.descriptionTH), true),
      },
      promoDesc: {
        EN: () => r(pick(POWordingPoolsData.promotionDescriptionEN), false),
        TH: () => r(pick(POWordingPoolsData.promotionDescriptionTH), true),
      },
      checkCurrent: {
        EN: () => r(pick(POWordingPoolsData.yourPackageNameEN), false),
        TH: () => r(pick(POWordingPoolsData.yourPackageNameTH), true),
      },
      greeting: {
        EN: () => r(pick(POWordingPoolsData.smsGreetingEN), false),
        TH: () => r(pick(POWordingPoolsData.smsGreetingTH), true),
      },
      deletePRE: {
        EN: () => r(pick(POWordingPoolsData.smsDeleteEN), false),
        TH: () => r(pick(POWordingPoolsData.smsDeleteTH), true),
      },
      deletePOST: {
        EN: () => r(pick(POWordingPoolsData.smsDeleteEN), false),
        TH: () => r(pick(POWordingPoolsData.smsDeleteTH), true),
      },
      marketingName: () => r(pick(POWordingPoolsData.shortPromotionNameEN), false),
      yourPackage: {
        EN: () => r(pick(POWordingPoolsData.yourPackageNameEN), false),
        TH: () => r(pick(POWordingPoolsData.yourPackageNameTH), true),
      },
      greetingLetter: {
        EN: () => r(pick(POWordingPoolsData.greetingLetterEN), false),
        TH: () => r(pick(POWordingPoolsData.greetingLetterTH), true),
      },
    };

    // ── Mode: 50/50 Generate vs Manual ───────────────────────────────────────
    const useGenerate = Math.random() < 0.5;
    cy.log(`🎲 SMS Wording mode: ${useGenerate ? '🤖 Generate Button' : '✍️ Manual Type'}`);

    // ── Trim generated overflow ───────────────────────────────────────────────
    const trimOverflow = (): void => {
      cy.log('✂️ Trimming overflowed generated fields...');
      cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el) => {
        const max = parseInt($el.attr('maxlength') || '9999', 10);
        const val = String($el.val() ?? '');
        if (val.length <= max) return;
        let trimmed = val.substring(0, max).trimEnd();
        if (trimmed.includes(' ')) {
          const ls = trimmed.lastIndexOf(' ');
          if (ls > max * 0.7) trimmed = trimmed.substring(0, ls);
        }
        cy.wrap($el)
          .invoke('val', trimmed)
          .trigger('input',  { bubbles: true, force: true })
          .trigger('change', { bubbles: true, force: true })
          .blur({ force: true });
      });
      cy.wait(500);
    };

    // ── Fill only if empty ────────────────────────────────────────────────────
    const fillIfEmpty = (sel: string, en: string, th: string, maxEn: number, maxTh: number): void => {
      cy.get('body').then(($b: any) => {
        if (!$b.find(sel).length) return;
        cy.get(sel).then(($els: any) => {
          if (!String($els.eq(0).val() ?? '').trim())
            cy.wrap($els.eq(0)).focus().type(capEN(en, maxEn), { delay: 0, force: true }).blur({ force: true });
          if ($els.length > 1 && !String($els.eq(1).val() ?? '').trim())
            cy.wrap($els.eq(1)).focus().type(capTH(th, maxTh), { delay: 0, force: true }).blur({ force: true });
        });
        cy.wait(300);
      });
    };

    // ════════════════════════════════════════════════════════════════════════
    //  PATH A — Generate Button
    // ════════════════════════════════════════════════════════════════════════
    if (useGenerate) {
      cy.get('app-mass-mkt-sms-wording-detail button[title="generate"]')
        .first().scrollIntoView({ duration: SCROLL, offset: { top: -100, left: 0 } })
        .should('be.visible').click({ force: true });
      cy.wait(2500);
      trimOverflow();

      fillIfEmpty('textarea[formcontrolname="shortPromotionName"]',   pools.shortPromo.EN(),   pools.shortPromo.TH(),   50,  50);
      fillIfEmpty('textarea[formcontrolname="cmsDisplay"]',           pools.cmsDisplay.EN(),   pools.cmsDisplay.TH(),   250, 250);
      fillIfEmpty('textarea[formcontrolname="promotionDescription"]', pools.promoDesc.EN(),    pools.promoDesc.TH(),    255, 255);
      fillIfEmpty('textarea[formcontrolname="smsCheckCurrent"]',      pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50,  50);

      if (flags.greeting === 'Send')
        fillIfEmpty('textarea[formcontrolname="smsGreeting"]', pools.greeting.EN(), pools.greeting.TH(), 400, 400);

      if (flags.delete === 'Send') {
        const dp = type === 'PRE' ? pools.deletePRE : pools.deletePOST;
        fillIfEmpty('textarea[formcontrolname="smsDelete"]', dp.EN(), dp.TH(), 250, 250);
      }

      if (type === 'POST') {
        fillIfEmpty('textarea[formcontrolname="marketingName"]',  pools.marketingName(), pools.marketingName(), 40,  40);
        fillIfEmpty('textarea[formcontrolname="yourPackage"]',    pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100);
        fillIfEmpty('textarea[formcontrolname="greetingLetter"]', pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PATH B — Manual Type (sections 1–4)
    // ════════════════════════════════════════════════════════════════════════
    if (!useGenerate) {
      withSection('textarea[formcontrolname="shortPromotionName"]', 'Short Promotion Name', () =>
        fillTextarea('textarea[formcontrolname="shortPromotionName"]', pools.shortPromo.EN(), pools.shortPromo.TH(), 50, 50));

      withSection('textarea[formcontrolname="cmsDisplay"]', 'CMS Display', () =>
        fillTextarea('textarea[formcontrolname="cmsDisplay"]', pools.cmsDisplay.EN(), pools.cmsDisplay.TH(), 250, 250));

      withSection('textarea[formcontrolname="promotionDescription"]', 'Promotion Description', () =>
        fillTextarea('textarea[formcontrolname="promotionDescription"]', pools.promoDesc.EN(), pools.promoDesc.TH(), 250, 250));

      withSection('textarea[formcontrolname="smsCheckCurrent"]', 'SMS Check Current', () =>
        fillTextarea('textarea[formcontrolname="smsCheckCurrent"]', pools.checkCurrent.EN(), pools.checkCurrent.TH(), 50, 50));
    }

    // ════════════════════════════════════════════════════════════════════════
    //  ALWAYS — Sections 5–15
    // ════════════════════════════════════════════════════════════════════════

    // SECTION 5: SMS Greeting
    withSection('select[formcontrolname="smsGreetingSendFlag"]', 'SMS Greeting', () => {
      cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(flags.greeting, { force: true });
      if (flags.greeting === 'Send' && !useGenerate)
        fillTextarea('textarea[formcontrolname="smsGreeting"]', pools.greeting.EN(), pools.greeting.TH(), 400, 400);
    });

    // SECTION 6: SMS Confirm Subscription (PRE only)
    cy.get('body').then(($b: any) => {
      if ($b.find('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').length)
        cy.get('select[formcontrolname="smsConfirmSubSuccessCbsSendFlag"]').select(flags.greeting, { force: true });
    });

    // SECTION 7: SMS Delete
    withSection('select[formcontrolname="smsDeleteSendFlag"]', 'SMS Delete', () => {
      cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(flags.delete, { force: true });
      cy.wait(WAIT);

      if (flags.delete === 'Send') {
        if (type === 'PRE') {
          cy.get('input[formcontrolname="SmsDeletedefaultWordingFlag"]').then(($radios: any) => {
            if (!$radios.length) return;
            const defaultVal = pick(['Yes', 'No']);
            cy.wrap($radios).parent().contains(defaultVal).click({ force: true });
            cy.wait(WAIT);
            if (defaultVal === 'No' && !useGenerate)
              fillTextarea('textarea[formcontrolname="smsDelete"]', pools.deletePRE.EN(), pools.deletePRE.TH(), 250, 250);
          });
        } else if (!useGenerate) {
          fillTextarea('textarea[formcontrolname="smsDelete"]', pools.deletePOST.EN(), pools.deletePOST.TH(), 250, 250);
        }
      }
    });

    // SECTIONS 8–11: simple flag selects
    const simpleFlagSections: [string, string, string][] = [
      ['select[formcontrolname="lastMinuteAlertSendFlag"]',            'Last Minute Alert',        flags.lastMinute],
      ['select[formcontrolname="smsBeforeFeeDeductSendFlag"]',         'Before Fee Deduction',     flags.beforeDeduct],
      ['select[formcontrolname="recurringDeductSuccessAlertSendFlag"]','Recurring Deduct Success', flags.deductOk],
      ['select[formcontrolname="recurringDeductFailAlertSendFlag"]',   'Recurring Deduct Fail',    flags.deductFail],
    ];
    simpleFlagSections.forEach(([sel, label, val]) =>
      withSection(sel, label, () => cy.get(sel).select(val, { force: true })));

    // SECTION 12: SMS Promote Package
    withSection('select[formcontrolname="smsPromotePackSendFlag"]', 'SMS Promote Package', () => {
      cy.get('select[formcontrolname="smsPromotePackSendFlag"]').select(flags.promote, { force: true });
      if (flags.promote === 'Send')
        fillTextarea('textarea[formcontrolname="smsPromotePack"]',
          `Special offer! ${p} - Get it now`, `ข้อเสนอพิเศษ! ${p} - รับเลยตอนนี้`, 250, 250);
    });

    // SECTION 13: Before Promotion Expired
    withSection('select[formcontrolname="beforePromotionExpAlertSendFlag"]', 'Before Promotion Expired', () => {
      cy.get('select[formcontrolname="beforePromotionExpAlertSendFlag"]').select(beforePromoVal, { force: true });
      if (beforePromoVal === 'Send') {
        cy.get('input[formcontrolname="beforePromotionExpAlertDeduction"]')
          .clear({ force: true }).type(`${Cypress._.random(1, 30)}`, { force: true });
        cy.get('select[formcontrolname="beforePromotionExpAlertDeductionUnit"]').then(($s: any) => {
          const opts = $s.find('option').toArray()
            .filter((o: HTMLOptionElement) => o.value && o.value !== 'null' && !o.disabled)
            .map((o: HTMLOptionElement) => o.value);
          if (opts.length) cy.wrap($s).select(Cypress._.sample(opts), { force: true });
        });
      }
    });

    // SECTION 14: Promotion Expired
    withSection('select[formcontrolname="promotionExpAlertSendFlag"]', 'Promotion Expired', () => {
      cy.log(`🔒 Promo Exp = ${promoExpVal} (excl. Before Promo = ${beforePromoVal})`);
      cy.get('select[formcontrolname="promotionExpAlertSendFlag"]').select(promoExpVal, { force: true });
    });

    // SECTION 15: POST-only fields (Manual only)
    if (type === 'POST' && !useGenerate) {
      withSection('textarea[formcontrolname="marketingName"]', 'Marketing Name', () =>
        cy.get('textarea[formcontrolname="marketingName"]').focus()
          .clear({ force: true })
          .type(capEN(pools.marketingName(), 40), { delay: 0, force: true })
          .blur({ force: true }));

      withSection('textarea[formcontrolname="yourPackage"]', 'Your Package', () =>
        fillTextarea('textarea[formcontrolname="yourPackage"]', pools.yourPackage.EN(), pools.yourPackage.TH(), 100, 100));

      withSection('textarea[formcontrolname="greetingLetter"]', 'Greeting Letter', () =>
        fillTextarea('textarea[formcontrolname="greetingLetter"]', pools.greetingLetter.EN(), pools.greetingLetter.TH(), 250, 250));
    }

    // ── Flush all pending Angular form state before Save ──────────────────────
    cy.get('app-mass-mkt-sms-wording-detail textarea').each(($el: any) => {
      cy.wrap($el).blur({ force: true });
    });
    cy.wait(500);

    // ── Save ─────────────────────────────────────────────────────────────────
    cy.get('body').then(($b: any) => {
      if (!$b.find('.container-fluid > :nth-child(3) > .btn').length) return;
      scrollTo('.container-fluid > :nth-child(3) > .btn', 'Save Button');
      cy.intercept('POST', '/PLMSpringBoot/api/**').as('postRequest');
      cy.get('.container-fluid > :nth-child(3) > .btn').should('be.visible').click();
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
