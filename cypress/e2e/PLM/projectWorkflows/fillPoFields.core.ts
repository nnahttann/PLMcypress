// ==========================================
// 🔹 CYPRESS FILL FUNCTIONS (Logic กระชับ)
// ==========================================
import { createPOWordingPools } from '../poWordingPools.core';
import { pickRandom, fillBilingual, selectMultipleFromDualList, limitAndCleanEN, randInt, randomInt } from '../helpers/poUtilities.core';
import { generateProjectNames, createProjectBase, createPOBase } from '../helpers/projectNameManager.core';
import { getCredentials } from '../helpers/utils';
import { registerProjectName } from './projectNameManagement.core';
import { PriceExcluding } from '../productFeatures/priceExcluding.core';

export const fillServicePOFields = (Module: string, PriceType: string, projectName?: string, poName?: string, subModule?: string) => {
  const pools = createPOWordingPools(projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`, poName || 'ServicePO', Module, PriceType, subModule);

  cy.get('select[formcontrolname="promotionLevel"]').select(pickRandom(['Mobile', 'Account', 'Non-Mobile']));
  fillBilingual('textarea[formcontrolname="wordingInStatementEn"]', 'textarea[formcontrolname="wordingInStatementTh"]', pools.wordingInStatement.EN, pools.wordingInStatement.TH, 250, 250);

  const smsFlag = pickRandom(['Send', "Don't Send"]);
  cy.get('select[formcontrolname="smsGreetingSendFlag"]').select(smsFlag);
  if (smsFlag === 'Send') fillBilingual('textarea[formcontrolname="smsGreetingEn"]', 'textarea[formcontrolname="smsGreetingTh"]', pools.smsGreeting.EN, pools.smsGreeting.TH, 400, 400);

  const delFlag = pickRandom(['Send', "Don't Send"]);
  cy.get('select[formcontrolname="smsDeleteSendFlag"]').select(delFlag);
  if (delFlag === 'Send') fillBilingual('textarea[formcontrolname="smsDeleteEn"]', 'textarea[formcontrolname="smsDeleteTh"]', pools.smsDelete.EN, pools.smsDelete.TH, 250, 250);

  fillBilingual('textarea[formcontrolname="descriptionEn"]', 'textarea[formcontrolname="descriptionTh"]', pools.description.EN, pools.description.TH, 500, 500);
  fillField('input[formcontrolname="discountRevenueCode"]', 'APCP-009');
  selectMultipleFromDualList('availableListBox', randInt(1, 3));

  fillField('textarea[formcontrolname="otherCondition"]', limitAndCleanEN(pickMultiple(pools.otherCondition.EN, randInt(2, 6)).join(' '), 1000));
  fillField('textarea[formcontrolname="memoDescription"]', limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

export const fillCashBackPOFields = (Module: string, PriceType: string, projectName?: string, poName?: string, subModule?: string) => {
  const pools = createPOWordingPools(projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`, poName || 'CashBackPO', Module, PriceType, subModule);

  fillBilingual('textarea[formcontrolname="shortPromotionNameEn"]', 'textarea[formcontrolname="shortPromotionNameTh"]', pools.shortPromotionName.EN, pools.shortPromotionName.TH, 100, 100);
  fillBilingual('textarea[formcontrolname="promotionDescriptionEn"]', 'textarea[formcontrolname="promotionDescriptionTh"]', pools.promotionDescription.EN, pools.promotionDescription.TH, 500, 500);
  fillBilingual('textarea[formcontrolname="greetingLetterEn"]', 'textarea[formcontrolname="greetingLetterTh"]', pools.greetingLetter.EN, pools.greetingLetter.TH, 500, 500);
  fillBilingual('textarea[formcontrolname="yourPackageNameEn"]', 'textarea[formcontrolname="yourPackageNameTh"]', pools.yourPackageName.EN, pools.yourPackageName.TH, 100, 100);
  selectMultipleFromDualList('availableListBox', randInt(1, 3));
};

export const fillStandardPOFields = (Module: string, PriceType: string, projectName?: string, poName?: string, subModule?: string) => {
  const pools = createPOWordingPools(projectName || `${Module} ${PriceType}${day}${month} ${hours}${minutes}`, poName || 'StandardPO', Module, PriceType, subModule);

  cy.get('select[formcontrolname="productType"]').select(pickRandom(['FBB', 'Fixline', 'Mobile', 'Non Mobile']));
  fillBilingual('textarea[formcontrolname="wordingInStatementEn"]', 'textarea[formcontrolname="wordingInStatementTh"]', pools.wordingInStatement.EN, pools.wordingInStatement.TH, 250, 250);
  fillBilingual('textarea[formcontrolname="descriptionEn"]', 'textarea[formcontrolname="descriptionTh"]', pools.description.EN, pools.description.TH, 500, 500);
  fillField('input[formcontrolname="discountRevenueCode"]', 'APCP-009');
  selectMultipleFromDualList('availableListBox', randInt(1, 3));

  fillField('textarea[formcontrolname="otherCondition"]', limitAndCleanEN(pickMultiple(pools.otherCondition.EN, randInt(2, 6)).join(' '), 1000));
  fillField('textarea[formcontrolname="memoDescription"]', limitAndCleanEN(pickRandom(pools.memoDescription.EN), 500));
};

export const fillCashBackDiscountConfig = (Module: string, PriceType: string, projectName?: string, poName?: string) => {
  const pools = createPOWordingPools(projectName || `${Module} ${PriceType}${day}${month}${hours}${minutes}`, poName || 'CashBackDiscount', Module, PriceType);

  fillField('input[formcontrolname="duration"]', pickRandom([1, 3, 6, 12, 24, 36]).toString());
  cy.get('button[class*="btn-primary"][type="button"]').first().click();
  fillField('input[formcontrolname="durationFrom"]', pickRandom([0, 1, 2, 3]).toString());

  cy.get('select[formcontrolname="discountType"]').find('option:not([disabled])').then(($opts) => {
    if ($opts.length) {
      const randomOpt = $opts[randInt(0, $opts.length - 1)] as HTMLOptionElement;
      cy.get('select[formcontrolname="discountType"]').select(randomOpt.value);
    }
  });
  
  fillBilingual('textarea[formcontrolname="discountNameEn"]', 'textarea[formcontrolname="discountNameTh"]', pools.discountName.EN, pools.discountName.TH, 100, 100);

  const idx = randInt(0, 1);
  cy.get('input[formcontrolname="marginalDiscount"]').eq(idx).check({ force: true });
  cy.get('button[class*="btn-primary"][type="button"]').eq(1).click();
  cy.get('input[formcontrolname="prorate"]').eq(idx).check({ force: true });

  // Logic เดิม: ถ้า idx=0 มีโอกาส 50% เป็น Fixed, ถ้า idx=1 เป็น Percent เสมอ
  const isFixed = idx === 0 && randInt(0, 1) === 0;
  cy.get('input[formcontrolname="cashBackType"]').eq(isFixed ? 0 : 1).check({ force: true });
  fillField('input[formcontrolname="totalUsageFromExcVat"]', randomInt(1000, 5000).toString());

  if (isFixed) {
    const cashBack = randomInt(50, 500);
    fillField('input[formcontrolname="cashBackExcVat"]', cashBack.toString());
    fillField('input[formcontrolname="cashBackIncVat"]', Math.round(cashBack * 1.07).toString());
  } else {
    fillField('input[formcontrolname="cashBackPercent"]', randomInt(1, 20).toString());
  }

  cy.wait(2000);
  cy.get('button.btn.btn-primary').contains('Add').click();
  cy.wait(2000);
  cy.get('button.btn.btn-primary').contains('Add').click();
};

export const setPriceVAT = (): void => {
  const getRandomCharge = (min = 100, max = 2000) => (Math.random() * (max - min) + min).toFixed(2);
  const randomCharge = getRandomCharge();
  const priceIncludingVAT = (parseFloat(randomCharge) * 1.07).toFixed(2);

  cy.get('input[formcontrolname="priceExcludingVAT"]').clear().type(randomCharge);
  cy.get('input[formcontrolname="priceIncludingVAT"]').clear().type(priceIncludingVAT);
};
export const ProjectBasicInformationComplete = (
  PriceType: PriceType,
  ProductClass: ProductClass,
  options: ProjectBasicOptions
): void => {
  const { ProductClass1, Module, subModule, autoSetDuration = false, Plugin } = options;
  const credentials = getCredentials(Module);
  const prefix = (Module === 'ENTER' || Module === 'MUSIC') ? Module : 'MOB';

  // ✅ 1. สร้างชื่อ Project & PO ครั้งเดียว
  const { projectName, poName } = generateProjectNames(prefix, Module, subModule, PriceType, ProductClass, undefined, Plugin);

  // ✅ 2. สร้าง Project Base (1 ครั้ง)
  createProjectBase(credentials, projectName, Module, subModule);

  const envKey = ProductClass1 === 'Main' ? 'formattedDateMain' : 'formattedDate';
  Cypress.env(envKey, projectName);

  registerProjectName(projectName, ProductClass1 === 'Main' ? 0 : 1);

  const poCount = Math.floor(Math.random() * 2) + 1; // สุ่ม 1-4 PO
  const poEnvKey = ProductClass1 === 'Main' ? 'formattedDateMainPONAME' : 'formattedDateOntopPONAME';
  const poNames: string[] = [];

  cy.log(`🎲 Randomly selected to create ${poCount} PO(s)`);

  for (let i = 0; i < poCount; i++) {
    const currentPoName = i === 0 ? poName : `${poName}_PO${i + 1}`;
    poNames.push(currentPoName);
    cy.log(`📦 [${i + 1}/${poCount}] Processing PO: ${currentPoName}`);

    // 🔹 สร้าง PO ใหม่
    createPOBase(currentPoName, 'Product Offering');

    // 🔹 กรอกฟอร์ม PO (เริ่มตั้งแต่เลือก PriceType ถึง smsWording)
    const priceTypeMap: Record<PriceType, string> = { onetime: '1: One-Time', recurring: '2: Recurring', usage: '3: Usage' };
    cy.get('select[formcontrolname="priceType"]').should('be.visible').and('not.be.disabled').select(priceTypeMap[PriceType]);

    const productClassMapMobile: Record<ProductClass, string> = { main: '1: Main', ontop: '2: On-Top', ontopextra: '3: On-Top Extra' };
    const productClassMapEnterMusic: Record<'ontop' | 'ontopextra', string> = { ontop: '1: On-Top', ontopextra: '2: On-Top Extra' };
    const productValue = (Module === 'ENTER' || Module === 'MUSIC')
      ? productClassMapEnterMusic[ProductClass as 'ontop' | 'ontopextra']
      : productClassMapMobile[ProductClass];

    cy.get('select[formcontrolname="productClass"]').should('be.visible').and('not.be.disabled').select(productValue);

    if (ProductClass === 'main') {
      const defaultItems = ['Internet', 'MMS', 'SMS', 'Voice'];
      const retrySelectProductClass = (attemptsLeft: number) => {
        cy.contains('.panel-heading', '*Product Specification').scrollIntoView().closest('.panel').within(() => {
          cy.get('select[formcontrolname="selectedListBox"]').then($select => {
            const selected = [...$select.find('option')].map(el => el.textContent?.trim() || '');
            const hasAllDefaults = defaultItems.every(d => selected.includes(d));
            cy.wrap(hasAllDefaults).as('defaultsReady');
          });
        });

        cy.get('@defaultsReady').then(hasAllDefaults => {
          if (hasAllDefaults) {
            cy.log(`✅ default items confirmed`);
          } else if (attemptsLeft > 0) {
            cy.log(`⚠️ default items missing (${attemptsLeft} retries left)`);
            cy.get('select[formcontrolname="productClass"]').select(productClassMapMobile['ontop']);
            cy.wait(500);
            cy.get('select[formcontrolname="productClass"]').select(productValue);
            cy.wait(500);
            cy.get('select[formcontrolname="priceType"]').select(priceTypeMap[PriceType]);
            cy.wait(800);
            retrySelectProductClass(attemptsLeft - 1);
          } else {
            cy.log(`❌ default items still missing after retries`);
          }
        });
      };
      cy.wait(800);
      retrySelectProductClass(3);
    }

    if (autoSetDuration) {
      const randomMonth = Math.floor(Math.random() * 59) + 2;
      cy.get('input[formcontrolname="packageDuration"]').clear().type(randomMonth.toString());
      cy.get('select[formcontrolname="packageDurationUnit"] option:not([disabled])').should('have.length.greaterThan', 0).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.get('select[formcontrolname="packageDurationUnit"]').select(($options[randomIndex] as HTMLOptionElement).value);
      });
      cy.get('.col-md-8 > .btn').click();
    }

    if (subModule === 'PRE') {
      const randomBillCycle = Math.floor(Math.random() * 60) + 1;
      cy.get('input[formcontrolname="packageBillCycle"]').should('be.visible').clear().type(randomBillCycle.toString());
      cy.get('select[formcontrolname="packageBillCycleUnit"] option:not([disabled])').should('have.length.greaterThan', 0).then($options => {
        const randomIndex = Math.floor(Math.random() * $options.length);
        cy.get('select[formcontrolname="packageBillCycleUnit"]').select(($options[randomIndex] as HTMLOptionElement).value);
      });
    }

    PriceExcluding();
    selectTargetGroup('random');
    dropdownPromotionGroup();
    RandomProductSpecification(ProductClass, subModule, Module);

    if (Module === 'PRE' && (ProductClass === 'ontop' || ProductClass === 'ontopextra')) {
      cy.get('input[formcontrolname="allowMvpn"]').should('exist').then(($radios) => {
        cy.wrap($radios).eq(Math.floor(Math.random() * $radios.length)).check();
      });
    }

    targetgroup();
    RandomRemark(projectName, currentPoName, PriceType, ProductClass, subModule);

    if ((Module !== 'POST') && subModule === 'PRE' && PriceType === 'recurring') {
      RetryPattern();
    }

    if (Module === 'PRE' && PriceType === 'recurring' && ProductClass === 'main') {
      CopyDeductFail();
    }

    smsWording();
    // 🔚 จบการกรอกฟอร์มสำหรับ PO นี้

    // ⬅️ ถ้ายังไม่ใช่ PO สุดท้าย ให้กลับไปหน้าเดิมเพื่อเตรียมสร้างตัวถัดไป
    if (i < poCount - 1) {
      cy.log(`🔙 PO ${currentPoName} done. Navigating back for next PO...`);
      backBacicInfo(); // กลับไปหน้าเตรียมสร้าง
      cy.wait(1500);   // รอ UI โหลดเสถียรก่อนเริ่มรอบใหม่
    }
  }

  // ==================== 🏁 ขั้นตอนสุดท้าย (ทำ 1 ครั้ง) ====================
  Cypress.env(poEnvKey, poNames[0]);
  Cypress.env('allPoNames', poNames);
  Cypress.env('poCount', poCount);

  cy.log(`✅ All ${poCount} PO(s) processed. Finalizing...`);
  backBacicInfo();
  addFile();
};
