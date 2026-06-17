export const Voice = (fillRating = true): void => {
  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^Voice$/)
        .click({ force: true });

      cy.wait(1500);

      const shouldFill = {
        voiceFreeResource: Cypress._.random(0, 1) === 1,
        voiceFN: Cypress._.random(0, 1) === 1,
        voiceSpecialNumber: Cypress._.random(0, 1) === 1,
        // ✅ fillRating=false (main) → Rating ทั้ง 3 ถูกข้ามทุกครั้ง
        // ✅ fillRating=true  (ontop/ontop extra) → สุ่มตามปกติ
        voiceRating: fillRating && Cypress._.random(0, 1) === 1,
        vdoCallRating: fillRating && Cypress._.random(0, 1) === 1,
        landlineRating: fillRating && Cypress._.random(0, 1) === 1,
      };

      // ==========================================
      // 🔧 HELPER FUNCTIONS
      // ==========================================

      const randomSelectFromDropdown = (selector: string) => {
        return cy.get(selector).then($select => {
          if ($select.length > 0 && $select.is(':visible')) {
            cy.wrap($select).find('option:not([disabled])').then($options => {
              if ($options.length > 0) {
                const randomIndex = Cypress._.random(0, $options.length - 1);
                cy.wrap($select).select($options.eq(randomIndex).val() as string, { force: true });
                cy.wait(600);
              }
            });
          }
        });
      };

      const expandPanel = (selector: string) => {
        cy.get(selector).within(() => {
          cy.get('.panel-heading').first().then($heading => {
            cy.get('.collapse-panel').first().then($panel => {
              const isCollapsed = !$panel.hasClass('in') && !$panel.hasClass('show');
              const isHidden = $panel.css('display') === 'none';
              if (isCollapsed || isHidden) {
                cy.wrap($heading).click({ force: true });
                cy.wait(1200);
                cy.get('.collapse-panel').first().should('be.visible');
              }
            });
          });
        });
      };

      // ==========================================
      // SESSION 1: Voice Free Resource
      // ==========================================

      if (shouldFill.voiceFreeResource) {
        cy.log('--- Filling Voice Free Resource ---');
        const TOTAL_FREE_RESOURCE = Cypress._.random(2, 6);

        expandPanel('app-mass-mkt-voice-free-resource');
        cy.wait(1000);

        Cypress._.times(TOTAL_FREE_RESOURCE, (frIndex) => {
          cy.log(`📦 Adding Free Resource: ${frIndex + 1}/${TOTAL_FREE_RESOURCE}`);

          cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {
            cy.get('.collapse-panel').first().should('be.visible');
            cy.get('button.btn-primary.btn-xs').find('.glyphicon-plus').first().click({ force: true });
            cy.wait(1500);

            cy.get('select[formcontrolname="priceTypePattern"]', { timeout: 5000 }).then($select => {
              if ($select.length === 0) return;
              cy.wrap($select).find('option:not([disabled])').then($options => {
                if ($options.length === 0) return;
                cy.wrap($select).select(
                  $options.eq(Cypress._.random(0, $options.length - 1)).val() as string,
                  { force: true }
                );
                cy.wait(600);
              });
            });
          });

          cy.get('app-mass-mkt-voice-free-resource mat-select[role="listbox"]', { timeout: 10000 })
            .should('exist')
            .then($matSelect => {
              if (!$matSelect.is(':visible') || $matSelect.attr('aria-disabled') === 'true') return;
              cy.wrap($matSelect).find('.mat-select-trigger').scrollIntoView().click({ force: true });
              cy.wait(1000);
              cy.get('.cdk-overlay-container mat-option', { timeout: 10000 })
                .should('have.length.greaterThan', 0)
                .then($options => {
                  cy.wrap($options.eq(Cypress._.random(0, $options.length - 1))).click({ force: true });
                  cy.wait(800);
                });
              cy.get('body').then($body => {
                if ($body.find('.cdk-overlay-backdrop').length > 0) {
                  cy.wrap($body).click({ force: true });
                }
              });
              cy.wait(1000);
            });

          cy.get('app-mass-mkt-voice-free-resource', { timeout: 10000 }).within(() => {

            const checkRandomRadio = (name: string) => {
              cy.root().then($root => {
                const $visible = $root.find(`input[type="radio"][formcontrolname="${name}"]:visible`);
                if ($visible.length === 0) {
                  cy.log(`  ⚠️ No visible radio [${name}] -> Skipping`);
                  return;
                }
                cy.wrap($visible.eq(Cypress._.random(0, $visible.length - 1))).check({ force: true });
                cy.wait(600);
              });
            };

            const safeSelectDropdown = (selector: string) => {
              cy.root().then($root => {
                const $visible = $root.find(`${selector}:visible`);
                if ($visible.length === 0) return;
                cy.wrap($visible.first()).find('option:not([disabled])').then($opts => {
                  if ($opts.length === 0) return;
                  cy.wrap($visible.first()).select(
                    $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                    { force: true }
                  );
                  cy.wait(600);
                });
              });
            };

            const fillConditionalInputAndUnit = (inputName: string, unitName: string, label: string) => {
              cy.wait(1200);
              cy.root().then($root => {
                const $input = $root.find(`input[formcontrolname="${inputName}"]:visible`);
                if ($input.length === 0) {
                  cy.log(`  ℹ️ ${label} = No -> Skipping`);
                  return;
                }
                cy.log(`  ℹ️ ${label} = Yes -> Filling`);
                cy.wrap($input.first())
                  .clear({ force: true })
                  .type(Cypress._.random(10, 1000).toString(), { force: true, delay: 150 });
                cy.wait(600);
                safeSelectDropdown(`select[formcontrolname="${unitName}"]`);
              });
            };

            cy.get('input[formcontrolname="commuFreeResource"]')
              .should('be.visible')
              .clear({ force: true })
              .type(Cypress._.random(10, 500).toString(), { force: true, delay: 150 });
            cy.wait(600);
            safeSelectDropdown('select[formcontrolname="commuFreeResourceUnit"]');
            checkRandomRadio('peakTimeFlag');
            checkRandomRadio('voiceQuotaRollOver');
            fillConditionalInputAndUnit('maxRollOverQuota', 'maxRollOverQuotaUnit', 'Voice Quota Roll Over');
            checkRandomRadio('netFlexi');
            fillConditionalInputAndUnit('daily', 'dailyUnit', 'Daily Flag');
            cy.wait(800);

            cy.get('button[type="submit"].btn-primary').contains('Add').last().click({ force: true });
            cy.wait(1500);
          });

          cy.wait(1000);
          cy.log(`  ✅ Free Resource ${frIndex + 1} added`);
        });

        cy.log(`--- Voice Free Resource Filled Successfully (${TOTAL_FREE_RESOURCE} rows) ---`);
      }

      // ==========================================
      // SESSION 2: Voice FN
      // ==========================================

      if (shouldFill.voiceFN) {
        cy.log('--- Filling Voice FN ---');
        const MAX_FN = 5;
        const TOTAL_FN = Cypress._.random(1, MAX_FN);

        expandPanel('app-mass-mkt-voice-fn');
        cy.wait(1000);

        cy.get('app-mass-mkt-voice-fn').within(() => {
          cy.get('.collapse-panel', { timeout: 10000 })
            .should('be.visible')
            .then($panel => {
              const hasValidClass = $panel.hasClass('show') || $panel.hasClass('in');
              expect(hasValidClass).to.be.true;
            });

          Cypress._.times(TOTAL_FN, (fnIndex) => {
            cy.log(`📦 Adding FN: ${fnIndex + 1}/${TOTAL_FN}`);

            cy.get('> .panel > .collapse-panel')
              .find('> button.btn-primary.btn-xs')
              .first()
              .click({ force: true });
            cy.wait(1500);

            cy.get('.panel-body:visible', { timeout: 10000 }).should('exist').as('voiceForm');

            cy.get('@voiceForm').find('input[formcontrolname="maxFNNumber"]')
              .should('be.visible')
              .clear()
              .type(Cypress._.random(1, MAX_FN).toString(), { delay: 150 });
            cy.wait(600);
            randomSelectFromDropdown('select[formcontrolname="fnNetwork"]');

            cy.get('@voiceForm').find('select[formcontrolname="fnType"]').should('be.visible').then($select => {
              const options = $select.find('option:not([disabled])');
              const index = Cypress._.random(0, options.length - 1);
              const text = options.eq(index).text().trim();
              cy.wrap($select).select(text);
              cy.wait(1000);
              cy.log(`  ✓ FN Type: ${text}`);

              if (text === 'Free Call') {
                cy.get('@voiceForm').find('input[formcontrolname="fnFreeCall"]')
                  .should('be.visible').clear().type(Cypress._.random(10, 60).toString(), { delay: 150 });
                cy.wait(600);
                randomSelectFromDropdown('select[formcontrolname="fnFreeCallUnit"]');
              }
              if (text === 'Special Rate') {
                cy.get('@voiceForm').find('input[formcontrolname="fnRateExcVat"]')
                  .should('be.visible').clear().type((Math.random() * 10).toFixed(2), { delay: 150 });
                cy.wait(600);
                randomSelectFromDropdown('select[formcontrolname="fnRateExcVatUnit"]');
              }
            });

            cy.wait(800);
            cy.get('.panel-body:visible').find('.col-md-4.col-md-offset-8').last().within(() => {
              cy.contains('button', 'Add').should('be.visible').click({ force: true });
            });
            cy.wait(1200);
            cy.log(`  ✅ FN ${fnIndex + 1} added`);
          });
        });

        cy.log(`--- Voice FN Filled Successfully (${TOTAL_FN} rows) ---`);
      }

      // ==========================================
      // SESSION 3: Voice Special Number
      // ==========================================

      const genSpecialNumber = () => {
        const patterns = [
          () => `*${Cypress._.random(100, 999)}#`,
          () => `*${Cypress._.random(10, 99)}#`,
          () => `*${Cypress._.random(1, 9)}#`,
          () => `*${Cypress._.random(1000, 9999)}#`,
          () => `*${Cypress._.random(10000, 99999)}#`,
          () => `#${Cypress._.random(100, 999)}#`,
          () => `#${Cypress._.random(10, 99)}#`,
          () => `${Cypress._.random(100, 999)}`,
          () => `${Cypress._.random(1000, 9999)}`,
          () => `06${Cypress._.random(10000000, 99999999)}`,
          () => `08${Cypress._.random(10000000, 99999999)}`,
          () => `09${Cypress._.random(10000000, 99999999)}`,
          () => `+66${Cypress._.random(810000000, 899999999)}`,
          () => `*${Cypress._.random(10, 99)}*${Cypress._.random(10, 99)}#`,
          () => `*${Cypress._.random(100, 999)}*${Cypress._.random(10, 99)}#`,
        ];
        return patterns[Cypress._.random(0, patterns.length - 1)]();
      };

      if (shouldFill.voiceSpecialNumber) {
        cy.log('🔥 --- Filling Voice Special Number ---');
        const TOTAL_PANELS = Cypress._.random(2, 5);

        expandPanel('app-mass-mkt-voice-b-number');
        cy.wait(1000);

        cy.get('app-mass-mkt-voice-b-number').within(() => {
          cy.get('.collapse-panel.show, .collapse-panel.in', { timeout: 10000 }).should('be.visible');

          Cypress._.times(TOTAL_PANELS, (panelIndex) => {
            cy.log(`📦 [STEP 1] สร้าง Panel ที่ ${panelIndex + 1}/${TOTAL_PANELS}`);

            cy.get('.collapse-panel.show > button.btn-primary.btn-xs:visible, .collapse-panel.in > button.btn-primary.btn-xs:visible')
              .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
              .first()
              .click({ force: true });
            cy.wait(1500);

            cy.get('.panel.panel-default:visible', { timeout: 10000 }).last().as(`detailPanel${panelIndex}`);

            const ITEMS_PER_PANEL = Cypress._.random(2, 4);

            cy.get(`@detailPanel${panelIndex}`).within(() => {
              Cypress._.times(ITEMS_PER_PANEL, (itemIndex) => {
                cy.get('button.btn.btn-primary.btn-xs:visible')
                  .filter((_, el) => Cypress.$(el).find('span.glyphicon-plus').length > 0)
                  .first()
                  .click({ force: true });
                cy.wait(1200);

                cy.get('input[formcontrolname="specialNumber"]', { timeout: 5000 }).should('be.visible');

                const specialNum = genSpecialNumber();
                cy.get('input[formcontrolname="specialNumber"]')
                  .clear().type(specialNum, { delay: 150 });
                cy.wait(800);

                cy.get('button[type="submit"]:visible').last().click({ force: true });
                cy.wait(1500);
              });

              cy.get('select[formcontrolname="bNumberType"]').should('be.visible').then($select => {
                const options = $select.find('option:not([disabled])');
                if (options.length === 0) throw new Error('❌ No bNumberType options');
                const val = options.eq(Cypress._.random(0, options.length - 1)).val();
                cy.wrap($select).select(val as string);
                cy.wait(1500);

                cy.root().then($root => {
                  if (val === 'Free Call') {
                    const $freeCall = $root.find('input[formcontrolname="bFreeCall"]:visible');
                    const $freeCallUnit = $root.find('select[formcontrolname="bFreeCallUnit"]:visible');
                    if ($freeCall.length > 0) {
                      cy.wrap($freeCall.first()).clear().type(Cypress._.random(1, 60).toString(), { delay: 150 });
                      cy.wait(600);
                      if ($freeCallUnit.length > 0) {
                        cy.wrap($freeCallUnit.first()).find('option:not([disabled])').then($opts => {
                          if ($opts.length > 0) cy.wrap($freeCallUnit.first()).select($opts.eq(0).val() as string);
                          cy.wait(600);
                        });
                      }
                    }
                  } else if (val === 'Special Rate') {
                    const $rateExc = $root.find('input[formcontrolname="bRateExcVat"]:visible');
                    const $rateUnit = $root.find('select[formcontrolname="bRateExcVatUnit"]:visible');
                    if ($rateExc.length > 0) {
                      cy.wrap($rateExc.first()).clear().type(Cypress._.random(0.5, 10).toFixed(2), { delay: 150 });
                      cy.wait(600);
                      if ($rateUnit.length > 0) {
                        cy.wrap($rateUnit.first()).find('option:not([disabled])').then($opts => {
                          if ($opts.length > 0) cy.wrap($rateUnit.first()).select($opts.eq(0).val() as string);
                          cy.wait(600);
                        });
                      }
                    }
                  }
                });
              });

              cy.wait(800);
              cy.get('button:visible')
                .filter((_, el) => Cypress.$(el).text().trim() === 'Add')
                .last()
                .click({ force: true });
              cy.wait(2500);
            });

            cy.wait(1000);
          });
        });

        cy.log(`✅ --- Voice Special Number Completed (${TOTAL_PANELS} panels) ---`);
      }

      // ==========================================
      // SESSION 4, 5, 6: Ratings
      // ✅ ถูกข้ามทั้งหมดเมื่อ fillRating=false (main)
      // ✅ สุ่มตามปกติเมื่อ fillRating=true (ontop/ontop extra)
      // ==========================================

      const fillRatingSection = (selector: string, label: string) => {
        if (!selector || !label) return;
        cy.log(`--- Filling ${label} ---`);
        expandPanel(selector);
        cy.wait(1000);

        cy.get(selector, { timeout: 10000 }).within(() => {
          cy.get('.collapse-panel').first().should('be.visible');

          if (label.includes('VDO') || label.includes('Landline')) {
            if (Cypress._.random(0, 1) === 1) {
              cy.get('button.btn-info').contains('Copy From Voice Rating').then($btn => {
                if ($btn.is(':visible')) {
                  cy.wrap($btn).click({ force: true });
                  cy.wait(1500);
                  cy.log(`${label} - Copied from Voice Rating`);
                }
              });
            }
          }

          cy.get('button.btn-primary').first().then($btn => {
            if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
          });
        });

        cy.wait(1500);

        cy.get(selector, { timeout: 10000 }).within(() => {
          cy.get('.panel-body').then($panels => {
            const $formPanel = $panels.filter((i, el) => {
              return Cypress.$(el).find('input[formcontrolname="rateExcludingVAT"]').length > 0;
            });
            if ($formPanel.length === 0) {
              cy.log(`${label} - Inline form not found. Skipping fill.`);
              return;
            }

            cy.wrap($formPanel.first()).within(() => {
              cy.get('select[formcontrolname="networkFlag"]', { timeout: 3000 }).then($net => {
                if ($net.is(':visible') && !$net.is(':disabled')) {
                  const $opts = $net.find('option:not([disabled])');
                  if ($opts.length > 1) {
                    const randomIdx = Cypress._.random(1, $opts.length - 1);
                    cy.wrap($net).select($opts.eq(randomIdx).val() as string, { force: true });
                    cy.wait(800);
                  }
                }
              });

              cy.get('input[formcontrolname="rateExcludingVAT"]', { timeout: 3000 })
                .should('be.visible')
                .then($input => {
                  if (!$input.is(':disabled')) {
                    const randomRate = Cypress._.random(0.5, 50.0).toFixed(2);
                    cy.wrap($input).clear({ force: true }).type(randomRate, { force: true, delay: 150 });
                    cy.wait(600);
                  }
                });

              cy.get('select[formcontrolname="rateUnit"]', { timeout: 3000 })
                .should('be.visible')
                .then($sel => {
                  if (!$sel.is(':disabled')) {
                    const $opts = $sel.find('option:not([disabled])');
                    if ($opts.length > 0) {
                      cy.wrap($sel).select(
                        $opts.eq(Cypress._.random(0, $opts.length - 1)).val() as string,
                        { force: true }
                      );
                      cy.wait(600);
                    }
                  }
                });

              cy.wait(800);
              cy.get('button[type="submit"]').contains('Add', { timeout: 5000 })
                .should('be.visible')
                .then($btn => {
                  if ($btn.is(':visible')) cy.wrap($btn).click({ force: true });
                });
            });
          });
        });

        cy.wait(2000);
        cy.log(`${label} - Added new item`);
      };

      if (shouldFill.voiceRating) fillRatingSection('app-mass-mkt-voice-rating', 'Voice Rating');
      if (shouldFill.vdoCallRating) fillRatingSection('app-mass-mkt-vdo-call-rating', 'VDO Call Rating');
      if (shouldFill.landlineRating) fillRatingSection('app-mass-mkt-landline-rating', 'Landline Rating');

      cy.log('=== Voice Tab Fill Summary ===');
      cy.log(`Voice Free Resource: ${shouldFill.voiceFreeResource ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice FN: ${shouldFill.voiceFN ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice Special Number: ${shouldFill.voiceSpecialNumber ? 'Filled' : 'Skipped'}`);
      cy.log(`Voice Rating: ${shouldFill.voiceRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
      cy.log(`VDO Call Rating: ${shouldFill.vdoCallRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
      cy.log(`Landline Rating: ${shouldFill.landlineRating ? 'Filled' : 'Skipped (fillRating=false)'}`);
    }
  });
};

// ========================
// MMS
// ========================

export const Mms = (fillRating = true): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.get('.collapse-panel').first().should('be.visible');
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('app-mass-mkt-mms-free-resource mat-select .mat-select-trigger')
      .should('be.visible')
      .click({ force: true });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .should('have.length.gt', 0)
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
      });

    cy.get('app-mass-mkt-mms-free-resource').within(() => {
      cy.contains('button', 'Add').should('be.visible').click({ force: true });
    });
  };

  const fillMmsRatingInput = (controlName: string) => {
    cy.get(`input[formcontrolname="${controlName}"]`)
      .should('exist')
      .clear({ force: true })
      .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
      .blur({ force: true });
  };

  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^MMS$/)
        .click({ force: true });

      // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
      processFreeResource();

      // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
      if (fillRating) {
        cy.get('app-mass-mkt-mms-rating').within(() => {
          cy.get('.panel-heading').first().click({ force: true });
        });
        cy.get('app-mass-mkt-mms-rating').within(() => {
          fillMmsRatingInput('mmsExcludingVat');
          fillMmsRatingInput('mmsdrExcludingVat');
          fillMmsRatingInput('mmsrrExcludingVat');
        });
      } else {
        cy.log('⏭️ Mms Rating skipped (fillRating=false / main)');
      }
    }
  });
};

// ========================
// SMS
// ========================

export const Sms = (fillRating = true): void => {
  const processFreeResource = () => {
    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.get('.collapse-panel').first().then(($panel) => {
        if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
          cy.get('.panel-heading').first().click({ force: true });
          cy.get('.collapse-panel').first().should('be.visible');
        }
      });
      cy.get('button:has(.glyphicon-plus)').click({ force: true });
    });

    cy.get('app-mass-mkt-sms-free-resource mat-select .mat-select-trigger')
      .should('be.visible')
      .click({ force: true });

    cy.get('mat-option:not(.mat-option-disabled)', { timeout: 10000 })
      .should('have.length.gt', 0)
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        cy.wrap($options.eq(randomIndex)).scrollIntoView().click({ force: true });
      });

    cy.get('app-mass-mkt-sms-free-resource').within(() => {
      cy.contains('button', 'Add').should('be.visible').click({ force: true });
    });
  };

  const fillRatingSection = (headerText: string, controlName: string) => {
    cy.get('app-mass-mkt-sms-rating').within(() => {
      cy.contains('.panel-heading', headerText)
        .closest('.panel')
        .within(() => {
          cy.get('.collapse-panel').first().then(($panel) => {
            if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
              cy.get('.panel-heading').first().click({ force: true });
              cy.get('.collapse-panel').first().should('be.visible');
            }
          });
          cy.get(`input[formcontrolname="${controlName}"]`)
            .should('exist')
            .clear({ force: true })
            .type(Cypress._.random(0.5, 10.0).toFixed(2), { force: true })
            .blur({ force: true });
        });
    });
  };

  cy.get('body', { timeout: 10000 }).then(($body) => {
    if ($body.find('app-mass-mkt-product-offering-detail-tab ul.nav-tabs').length > 0) {
      cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
        .contains(/^SMS$/)
        .click({ force: true });

      // ✅ Free Resource กรอกเสมอ ไม่ว่าจะ main หรือ ontop
      processFreeResource();

      // ✅ Rating: ข้ามเมื่อ fillRating=false (main), กรอกเมื่อ fillRating=true (ontop/ontop extra)
      if (fillRating) {
        cy.get('app-mass-mkt-sms-rating').within(() => {
          cy.get('.panel-heading').first().click({ force: true });
        });
        fillRatingSection('SMS Rating', 'smsExcludingVat');
        fillRatingSection('SMS Delivery Report Rating', 'smsdrExcludingVat');
        fillRatingSection('iSMS Rating', 'iSmsExcludingVat');
      } else {
        cy.log('⏭️ Sms Rating skipped (fillRating=false / main)');
      }
    }
  });
};

export const WiFi = (): void => {
  const COMPONENT = 'app-mass-mkt-wifi'
  const HEADING_SELECTOR = '.panel-heading.cursor-point'
  const WIFI_USAGE_TYPES = ['Volume-based', 'Time-based']
  const WIFI_QUOTA_TYPES = ['Unlimited Data (Fixed Speed)', 'Unlimited Data (Throttling Speed)']

  const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

  const normalizeText = (el: HTMLElement): string =>
    Cypress.$(el).text().replace(/\s+/g, ' ').trim()

  const expandPanelIfNeeded = (): void => {
    cy.log('🔓 Ensuring WiFi panel is expanded...')
    cy.get(COMPONENT, { timeout: 15000 })
      .should('exist')
      .find(HEADING_SELECTOR, { timeout: 10000 })
      .should('be.visible')
      .then(($heading) => {
        const isCollapsed =
          $heading.find('.glyphicon-chevron-down').length > 0 &&
          $heading.find('.glyphicon-chevron-up').length === 0
        if (isCollapsed) {
          cy.log('📥 Panel collapsed → expanding')
          cy.wrap($heading).click({ force: true })
          cy.wait(800)
        } else {
          cy.log('📤 Panel already expanded ✓')
        }
      })
    cy.wait(400)
  }

  // ✅ scope ไปที่ active tab ถ้ามี tabset, ไม่งั้นใช้ component ทั้งหมด
  const getActivePane = (): Cypress.Chainable<JQuery<HTMLElement>> =>
    cy.get(COMPONENT).then(($comp) => {
      const hasTabset = $comp.find('tabset').length > 0
      if (hasTabset) {
        return $comp.find('tab.active, .tab-pane.active').first()
      }
      return $comp
    })

  // ✅ clickTab: ข้ามถ้าไม่มี tabset
  const clickTab = (tabName: string): void => {
    cy.get(COMPONENT).then(($comp) => {
      const $tabs = $comp.find('.nav.nav-tabs a')
      if ($tabs.length === 0) {
        cy.log(`⚠️ No tabset found → skipping clickTab("${tabName}")`)
        return
      }
      cy.log(`🔍 Clicking sub-tab: "${tabName}"`)
      cy.wrap($tabs)
        .filter((_, el) => normalizeText(el as HTMLElement).includes(tabName))
        .first()
        .should('be.visible')
        .click({ force: true })
      cy.wait(500)
    })
  }

  const fillDeductSuccess = (): void => {
    cy.log('🚀 [WiFi – Deduct Success] Starting form fill...')

    const usageType = rand(WIFI_USAGE_TYPES)
    const quotaType = rand(WIFI_QUOTA_TYPES)
    cy.log(`🎲 Usage: ${usageType} | Quota: ${quotaType}`)

    getActivePane()
      .find('button.btn-primary.btn-xs[style*="width:60px"]', { timeout: 12000 })
      .should('be.visible')
      .click({ force: true })
    cy.wait(600)

    // ✅ unhide WiFi Detail panel
    getActivePane()
      .find('.panel.panel-default', { timeout: 8000 })
      .then(($panels) => {
        $panels.toArray().forEach((el) => {
          if (Cypress.$(el).attr('hidden') !== undefined) {
            Cypress.$(el).removeAttr('hidden')
          }
        })
      })
    cy.wait(300)

    getActivePane()
      .find('select[formcontrolname="wiFiUsageType"]', { timeout: 10000 })
      .should('be.visible')
      .select(usageType, { force: true })
    cy.wait(400)

    getActivePane()
      .find('select[formcontrolname="wiFiQuotaType"]', { timeout: 10000 })
      .should('be.visible')
      .select(quotaType, { force: true })
    cy.wait(400)

    cy.log('🎯 Opening mat-select dropdown')
    getActivePane()
      .find('mat-select .mat-select-trigger', { timeout: 10000 })
      .first()
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    cy.get('body').then(($body) => {
      if ($body.find('mat-option').length === 0) {
        cy.log('⚠️ Dropdown not open yet → retrying')
        getActivePane()
          .find('mat-select .mat-select-trigger')
          .first()
          .click({ force: true })
        cy.wait(800)
      }
    })

    cy.get('.cdk-overlay-container mat-option, mat-option', { timeout: 12000 })
      .should('have.length.greaterThan', 0)
      .then(($opts) => {
        const available = $opts.toArray().filter(
          (el) =>
            el.getAttribute('aria-disabled') !== 'true' &&
            !Cypress.$(el).hasClass('mat-option-disabled')
        )
        if (available.length === 0) {
          cy.log('⚠️ No enabled options → closing')
          cy.get('body').type('{esc}', { force: true })
          return
        }
        const picked = available[Math.floor(Math.random() * available.length)]
        cy.log(`🎲 WiFi value → ${Cypress.$(picked).text().trim()}`)
        cy.wrap(picked).click({ force: true })
      })
    cy.wait(500)

    getActivePane()
      .find('button.btn-primary')
      .filter((_, el) => /^Add$/i.test(normalizeText(el as HTMLElement)))
      .first()
      .should('be.visible')
      .click({ force: true })
    cy.wait(1000)

    cy.log('✨ [WiFi – Deduct Success] Done')
  }

  const verifyTabHasData = (tabName: string): void => {
    cy.log(`🔎 Verifying data in tab: "${tabName}"`)
    clickTab(tabName)
    getActivePane()
      .find('table.table tbody', { timeout: 8000 })
      .first()
      .should(($tbody) => {
        expect($tbody.text().trim()).not.to.match(/No data|ไม่พบข้อมูล/i)
      })
  }

  // ═══════════════════════════════════════════════
  // 🚀 MAIN FLOW
  // ═══════════════════════════════════════════════

  cy.log('📶 [WiFi] Starting...')
  cy.get('.scrollmenu .nav a').contains('WiFi').click()

  expandPanelIfNeeded()

  cy.log('📶 [WiFi] ▶️ Tab: Deduct Success')
  clickTab('Deduct Success')   // ← safe: ข้ามอัตโนมัติถ้าไม่มี tabset
  fillDeductSuccess()

  verifyTabHasData('Deduct Success')

  cy.log('📶 [WiFi] 🎉 Done ✨')
}

// ========================
// VerticalApp
// ========================
export const VerticalApp = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Vertical App$/)
    .click({ force: true });
  cy.wait(3500);

  cy.get('app-mass-mkt-vertical-app').within(() => {
    cy.get('.collapse-panel').then(($panel) => {
      if ($panel.outerHeight() === 0 || $panel.css('display') === 'none') {
        cy.get('.panel-heading').click({ force: true });
      }
    });

    cy.get('button:has(.glyphicon-plus)').click({ force: true });
  });

  cy.get('select[formcontrolname="VerticalAppUsageType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📡 Vertical App Usage Type: ${val}`);
      cy.get('select[formcontrolname="VerticalAppUsageType"]').select(val, { force: true });
    });

  cy.get('select[formcontrolname="VerticalAppQuotaType"]')
    .find('option:not([disabled])')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const val = $options.eq(randomIndex).val() as string;
      cy.log(`📦 Vertical App Quota Type: ${val}`);
      cy.wrap(val).as('selectedQuotaValue');
      cy.get('select[formcontrolname="VerticalAppQuotaType"]').select(val, { force: true });
    });

  cy.contains('label', '*Vertical App :')
    .closest('.form-group')
    .find('mat-select .mat-select-trigger')
    .should('be.visible')
    .click({ force: true });

  cy.get('body')
    .find('mat-option')
    .not('.mat-option-disabled')
    .then(($options) => {
      const randomIndex = Cypress._.random(0, $options.length - 1);
      const label = $options.eq(randomIndex).text().trim();
      cy.log(`📱 Vertical App selected: ${label}`);
      cy.wrap($options).eq(randomIndex).scrollIntoView().click({ force: true });
    });

  cy.get('app-mass-mkt-vertical-app').within(() => {
    const scenario = Cypress._.random(0, 2);
    // 0 = 3G only
    // 1 = 4G + 3G  (system default)
    // 2 = 5G + 4G + 3G
    const scenarioLabels = ['3G only', '4G + 3G', '5G + 4G + 3G'];
    cy.log(`🗼 Network Coverage scenario: ${scenarioLabels[scenario]}`);

    cy.get('[formarrayname="vaNetworkCoverageCheckBox"] input[type="checkbox"]')
      .each(($checkbox, index) => {
        // index 0 = 5G, index 1 = 4G, index 2 = 3G
        const shouldCheck =
          (scenario === 0 && index === 2) ||  // 3G only
          (scenario === 1 && index >= 1) ||   // 4G + 3G
          (scenario === 2);                   // 5G + 4G + 3G

        if (shouldCheck) {
          cy.wrap($checkbox).check({ force: true });
        } else {
          cy.wrap($checkbox).uncheck({ force: true });
        }
      });

    cy.get('select[formcontrolname="commuSpeed"]')
      .find('option:not([disabled])')
      .then(($options) => {
        const randomIndex = Cypress._.random(0, $options.length - 1);
        const val = $options.eq(randomIndex).val() as string;
        cy.log(`⚡ Commu Speed: ${val}`);
        cy.get('select[formcontrolname="commuSpeed"]').select(val, { force: true });
      });

    cy.get('@selectedQuotaValue').then((quotaValue) => {
      if (String(quotaValue).includes('Throttling')) {
        cy.log(`🐢 Quota includes Throttling → selecting Throttling Speed`);
        cy.get('select[formcontrolname="commuThrottlingSpeed"]')
          .should('exist')
          .find('option:not([disabled])', { timeout: 10000 })
          .should('have.length.greaterThan', 0)
          .then(($options) => {
            const randomIndex = Cypress._.random(0, $options.length - 1);
            const val = $options.eq(randomIndex).val() as string;
            cy.log(`🐢 Commu Throttling Speed: ${val}`);
            cy.get('select[formcontrolname="commuThrottlingSpeed"]').select(val, { force: true });
          });
      }
    });

    cy.wait(2000);
    cy.contains('button', /^Add$/).click({ force: true });
    cy.log(`✅ Vertical App → Add clicked`);
    cy.wait(2000);
  });
};

// ========================
// CLOUD GAME
// ========================

export const CloudGame = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Cloud Game$/)
    .click({ force: true });

  cy.wait(3500);

  cy.get('app-mass-mkt-product-offering-detail-tab app-mass-mkt-vr', { timeout: 10000 })
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('button .glyphicon-plus').first().parent().click();

      cy.contains('label', '*Content :')
        .closest('.col-md-12')
        .find('.mat-select-trigger')
        .click({ force: true });
    });

  cy.get('.cdk-overlay-container .mat-select-panel', { timeout: 10000 })
    .should('be.visible');

  cy.get('.cdk-overlay-container .mat-select-panel mat-option', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then(($options) => {
      const count = $options.length;
      const randomIndex = Math.floor(Math.random() * count);
      cy.wrap($options).eq(randomIndex).click({ force: true });
    });
  cy.wait(3000)
  cy.get('app-mass-mkt-product-offering-detail-tab app-mass-mkt-vr', { timeout: 10000 })
    .first()
    .should('be.visible')
    .within(() => {
      cy.get('button.btn-primary').contains('Add').click({ force: true });
    });
};

// ========================
// ENTERTAINMENT PARTNERSHIP
// ========================

export const EntertainmentPartnership = (platforms: Array<'Arcade' | 'TV Plus' | 'Youtube Premium'>): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Entertainment Partnership$/)
    .click({ force: true });

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          platforms.forEach((platform) => {
            const targetPlatform = platform === 'Youtube Premium' ? 'Google' : platform;

            cy.get('button .glyphicon-plus').first().parent().click();

            const cpOptions = ['Apple', 'GOOGLE IRELAND LIMITED'];
            const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

            cy.contains('label', 'CP Name')
              .closest('.form-group')
              .find('select[formcontrolname="cpName"]')
              .select(randomCp);

            cy.wait(1500);

            cy.contains('label', 'Platform')
              .closest('.form-group')
              .find('select[formcontrolname="platform"]')
              .select(targetPlatform);

            cy.wait(1500);

            cy.contains('h3', 'Partner App ID')
              .closest('.panel')
              .within(() => {
                cy.get('button .glyphicon-plus').first().parent().click();

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should('be.visible')
                  .within(() => {
                    cy.get('input[formcontrolname="partnerPackageName"]').clear().type('test');

                    cy.get('select[formcontrolname="customerType"]')
                      .should('be.visible')
                      .find('option:not([disabled])')
                      .then(($options) => {
                        const options = $options.toArray() as HTMLOptionElement[];
                        const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                        if (!matched) {
                          throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                        }
                        cy.get('select[formcontrolname="customerType"]')
                          .select(matched.value.trim())
                          .should('have.value', matched.value.trim());
                        cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                      });
                    cy.wait(2000)
                    cy.contains('button', /^Add$/).should('be.visible').click();
                    cy.wait(2000)
                  });

                cy.contains('h3', 'Partner App ID Detail')
                  .closest('.panel')
                  .should(($panel) => {
                    const isHidden = $panel.attr('hidden') !== undefined ||
                      $panel.css('display') === 'none' ||
                      $panel.css('visibility') === 'hidden' ||
                      !$panel.is(':visible');
                    expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                  });
              });

            cy.wait(1500);

            cy.get('button')
              .filter(':visible')
              .contains(/^Add$/)
              .should('be.enabled')
              .click({ force: true });
          });
        });
    });
};
// ========================
// AI IP CAMERA
// ========================

export const AIIPCamera = (): void => {
  // 1. คลิก Tab AI IP Camera
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^AI IP Camera$/)
    .should('be.visible')
    .click({ force: true });

  // 2. กดปุ่ม Add ในหน้าหลัก
  cy.get('app-mass-mkt-ai-ip-camera .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  // 3. ดึงค่า Customer Type เพื่อคำนวณ Partner Type
  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      // ✅ 4. แก้ไขหลัก: เพิ่ม Scope + รอจน Angular Render Options เสร็จก่อนเข้า .then()
      cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
        .should('be.visible')
        .find('option')
        .should('have.length.gt', 1)
        .then(($options) => {
          const validOptions = ($options.toArray() as HTMLOptionElement[]).filter((opt) => {
            const val = opt.value?.trim();
            return !opt.disabled && val && val !== 'null' && val !== '';
          });

          if (validOptions.length === 0) {
            throw new Error('No valid options found in CP Name dropdown');
          }

          const randomIndex = Math.floor(Math.random() * validOptions.length);
          const randomValue = validOptions[randomIndex].value;

          // ✅ Re-query after Angular re-render settles, THEN select
          cy.get('app-mass-mkt-ai-ip-camera select[formcontrolname="cpName"]')
            .should('exist')
            .should('be.visible')
            .should('not.be.disabled')
            .select(randomValue)
            .should('have.value', randomValue);

          cy.log(`Selected CP Name: ${randomValue}`);
        });

      // 5. กดปุ่ม Add ใน Panel Partner App ID
      cy.contains('.panel-heading', 'Partner App ID')
        .closest('.panel')
        .within(() => {
          cy.get('.btn-xs .glyphicon-plus').last().should('be.visible').click();
        });

      // 6. กรอกข้อมูลใน Panel Partner App ID Detail
      cy.contains('.panel-heading', 'Partner App ID Detail')
        .closest('.panel')
        .should('be.visible')
        .within(() => {
          cy.get('select[formcontrolname="customerType"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
              if (!matched) {
                throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
              }
              cy.get('select[formcontrolname="customerType"]')
                .select(matched.value.trim())
                .should('have.value', matched.value.trim());
              cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
            });
          cy.wait(2000)
          // ✅ ลบ cy.wait(2000) ออก → .should('be.enabled') จะรอจนกว่า DOM และ JS พร้อม
          cy.contains('button', /^Add$/).should('be.enabled').click();
        });

      // 7. ตรวจสอบว่า Detail Panel ถูกซ่อนหลังกด Add
      cy.contains('.panel-heading', 'Partner App ID Detail')
        .closest('.panel')
        .should(($panel) => {
          const isHidden = $panel.attr('hidden') !== undefined ||
            $panel.css('display') === 'none' ||
            $panel.css('visibility') === 'hidden' ||
            !$panel.is(':visible');
          expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
        });
      cy.wait(2000)
      // 8. กดปุ่ม Add ที่ท้าย Form
      // ✅ ลบ cy.wait(2000) ออก → ใช้ Cypress Auto-waiting แทน
      cy.get('app-mass-mkt-ai-ip-camera')
        .within(() => {
          cy.get('.row.ng-star-inserted')
            .last()
            .within(() => {
              cy.contains('button', /^Add$/).should('be.enabled').click();
            });
        });
    });
};

// ========================
// KARAOKE
// ========================

export const Karaoke = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Karaoke$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          cy.get('select[formcontrolname="cpName"]')
            .should('be.visible')
            .select('Karaoke_Bundle_PLAYPremium')
            .should('have.value', 'Karaoke_Bundle_PLAYPremium');

          cy.log('Selected CP Name: Karaoke_Bundle_PLAYPremium');

          const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
          const isAISPlayBox = randomPlatform === '3: AIS Play Box';

          cy.get('select[formcontrolname="platform"]')
            .should('be.visible')
            .select(randomPlatform)
            .should('have.value', randomPlatform);

          cy.log(`Selected Platform: ${randomPlatform}`);

          cy.wait(1500);

          cy.contains('h3', 'Partner App ID')
            .closest('.panel')
            .within(() => {
              cy.get('button .glyphicon-plus').first().parent().click();

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should('be.visible')
                .within(() => {
                  cy.get('input[formcontrolname="partnerPackageName"]').should('be.visible').clear().type('test');

                  cy.get('select[formcontrolname="customerType"]')
                    .should('be.visible')
                    .find('option:not([disabled])')
                    .then(($options) => {
                      const options = $options.toArray() as HTMLOptionElement[];
                      const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                      if (!matched) {
                        throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                      }
                      cy.get('select[formcontrolname="customerType"]')
                        .select(matched.value.trim())
                        .should('have.value', matched.value.trim());
                      cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                    });
                  cy.wait(2000)
                  cy.contains('button', /^Add$/).should('be.visible').click();
                });

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should(($panel) => {
                  const isHidden = $panel.attr('hidden') !== undefined ||
                    $panel.css('display') === 'none' ||
                    $panel.css('visibility') === 'hidden' ||
                    !$panel.is(':visible');
                  expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                });
            });

          cy.wait(1500);

          if (isAISPlayBox) {
            cy.contains('h3', 'Vimmi Product')
              .closest('.panel')
              .within(() => {
                cy.get('button .glyphicon-plus').first().parent().click();

                cy.contains('h4', 'Vimmi Product Detail')
                  .closest('.panel')
                  .should('be.visible')
                  .within(() => {
                    cy.get('input[formcontrolname="vimmiProductNameText"]').should('be.visible').clear().type('test');

                    const random19Digits = Array.from({ length: 19 }, () => Math.floor(Math.random() * 10)).join('');
                    cy.log(`Random Vimmi Product ID: ${random19Digits}`);

                    cy.get('input[formcontrolname="vimmiProductId"]').should('be.visible').clear().type(random19Digits);
                    cy.wait(2000)
                    cy.contains('button', /^Add$/).should('be.visible').click();
                  });
              });

            cy.wait(1500);
          }
          cy.wait(2000)
          cy.get('button')
            .filter(':visible')
            .contains(/^Add$/)
            .should('be.enabled')
            .click();
        });
    });
};

// ========================
// MUSIC STREAMING
// ========================

export const MusicStreaming = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^Music Streaming$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-content-music-streaming .panel-body .btn-primary .glyphicon-plus')
    .first()
    .parent()
    .should('be.enabled')
    .click();

  cy.get('app-mass-mkt-product-offering select[formcontrolname="customerType"]')
    .find('option:selected')
    .invoke('val')
    .then((selectedVal) => {
      const rawVal = String(selectedVal);
      const label = rawVal.includes(':') ? rawVal.split(':')[1].trim() : rawVal.trim();

      let partnerCustomerType: string;
      if (label === 'Post-paid' || label === 'Hybrid-Post') {
        partnerCustomerType = 'Post-paid';
      } else if (label === 'Pre-paid') {
        partnerCustomerType = 'Pre-paid';
      } else {
        partnerCustomerType = Math.random() < 0.5 ? 'Post-paid' : 'Pre-paid';
      }

      cy.log(`Product Offering CustomerType: ${label} → Partner CustomerType: ${partnerCustomerType}`);

      cy.get('app-mass-mkt-content-music-streaming', { timeout: 15000 })
        .should('be.visible')
        .within(() => {
          const cpOptions = ['GMM Plern', 'jooxvip', 'Apple'];
          const randomCp = cpOptions[Math.floor(Math.random() * cpOptions.length)];

          cy.get('select[formcontrolname="cpName"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim().includes(randomCp));
              if (!matched) {
                throw new Error(`No option matched "${randomCp}" in CP Name dropdown`);
              }
              cy.get('select[formcontrolname="cpName"]').select(matched.value.trim()).should('have.value', matched.value.trim());
              cy.log(`Selected CP Name: ${matched.value.trim()}`);
            });

          cy.wait(1500);

          const platforms = ['1: Music Streaming', '2: AIS Play', '3: AIS Play Box'];
          const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];

          cy.get('select[formcontrolname="platform"]')
            .should('be.visible')
            .select(randomPlatform)
            .should('have.value', randomPlatform);

          cy.log(`Selected Platform: ${randomPlatform}`);

          cy.wait(1500);

          cy.contains('h3', 'Partner App ID')
            .closest('.panel')
            .within(() => {
              cy.get('button .glyphicon-plus').first().parent().click();

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should('be.visible')
                .within(() => {
                  cy.get('input[formcontrolname="partnerPackageName"]').should('be.visible').clear().type('test');

                  cy.get('select[formcontrolname="customerType"]')
                    .should('be.visible')
                    .find('option:not([disabled])')
                    .then(($options) => {
                      const options = $options.toArray() as HTMLOptionElement[];
                      const matched = options.find((opt) => opt.text.trim() === partnerCustomerType);
                      if (!matched) {
                        throw new Error(`No option matched "${partnerCustomerType}" in customerType dropdown`);
                      }
                      cy.get('select[formcontrolname="customerType"]')
                        .select(matched.value.trim())
                        .should('have.value', matched.value.trim());
                      cy.log(`Selected Partner CustomerType: ${matched.value.trim()}`);
                    });

                  cy.contains('button', /^Add$/).should('be.visible').click();
                });

              cy.contains('h3', 'Partner App ID Detail')
                .closest('.panel')
                .should(($panel) => {
                  const isHidden = $panel.attr('hidden') !== undefined ||
                    $panel.css('display') === 'none' ||
                    $panel.css('visibility') === 'hidden' ||
                    !$panel.is(':visible');
                  expect(isHidden, 'Partner App ID Detail panel should be hidden').to.be.true;
                });
            });

          cy.wait(1500);

          cy.get('button')
            .filter(':visible')
            .contains(/^Add$/)
            .should('be.enabled')
            .click();
        });
    });
};

// ========================
// VRBT
// ========================

export const VRBT = (): void => {
  cy.get('app-mass-mkt-product-offering-detail-tab ul.nav-tabs li a')
    .contains(/^VRBT$/)
    .should('be.visible')
    .click({ force: true });

  cy.get('app-mass-mkt-vrbt')
    .find('button.btn-primary')
    .find('.glyphicon-plus')
    .parent('button')
    .should('be.enabled')
    .click({ force: true });

  cy.wait(1500);

  cy.get('app-mass-mkt-vrbt', { timeout: 15000 })
    .should('be.visible')
    .within(() => {
      cy.get('.panel')
        .contains('h3', 'VRBT Detail')
        .closest('.panel')
        .should('not.have.attr', 'hidden')
        .within(() => {
          cy.get('select[formcontrolname="productName"]')
            .should('be.visible')
            .find('option:not([disabled])')
            .then(($options) => {
              const options = $options.toArray() as HTMLOptionElement[];
              const matched = options.find((opt) => opt.text.trim() === 'Platform Calling VDO');
              if (!matched) {
                throw new Error('No option matched "Platform Calling VDO" in Product Name dropdown');
              }
              cy.get('select[formcontrolname="productName"]').select(matched.value.trim()).should('have.value', matched.value.trim());
              cy.log(`Selected Product Name: ${matched.value.trim()}`);
            });
          cy.wait(1500);

          cy.get('ng2-dual-list-box[formcontrolname="partnerSku"]')
            .within(() => {
              cy.get('select[formcontrolname="availableListBox"]')
                .find('option')
                .then(($options) => {
                  const options = $options.toArray() as HTMLOptionElement[];
                  if (options.length === 0) {
                    throw new Error('No available options in Partner SKU list');
                  }
                  const randomIndex = Math.floor(Math.random() * options.length);
                  const randomValue = options[randomIndex].value;
                  cy.log(`Selected Partner SKU: ${options[randomIndex].text.trim()}`);
                  cy.get('select[formcontrolname="availableListBox"]').select(randomValue);
                  cy.wait(600);
                  cy.get('button.str').click();
                });
            });
          cy.wait(2000)

          cy.contains('button', /^Add$/).should('be.visible').should('be.enabled').click();
        });
    });
};


const INTERNET_SPEEDS = [
  '4Gbps/4Gbps', '3Gbps/3Gbps', 'Max Speed (5G 2Gbps/2Gbps)',
  'Max Speed (5G Default 1Gbps/1Gbps)', '1000 Mbps', '450 Mbps',
  '300 Mbps', '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps',
  '40 Mbps', '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps',
  '12 Mbps', '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps',
  '6 Mbps', '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
  '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
  '10 Kbps', '0 Kbps'
] as const;

const THROTTLING_SPEEDS = [
  '150 Mbps', '100 Mbps', '50 Mbps', '42 Mbps', '40 Mbps',
  '30 Mbps', '21 Mbps', '20 Mbps', '15 Mbps', '12 Mbps',
  '11 Mbps', '10 Mbps', '8 Mbps', '7.2 Mbps', '6 Mbps',
  '5 Mbps', '4 Mbps', '3 Mbps', '2 Mbps', '1 Mbps',
  '512 Kbps', '384 Kbps', '256 Kbps', '128 Kbps', '64 Kbps',
  '10 Kbps', '0 Kbps'
] as const;

type InternetQuotaType =
  | 'Limited Data (Pay per use)'
  | 'Limited Data (Stop Net)'
  | 'Limited Data Only'
  | 'Pay per use only'
  | 'Unlimited Data (Fixed Speed)'
  | 'Unlimited Data (Throttling Speed)';

// ============ Core Utility Functions ============
const selectDropdownOption = <T extends string>(
  selector: string,
  options: readonly T[],
  config: {
    exact?: boolean;
    maxRetries?: number;
    skipFirst?: boolean;
    logPrefix?: string;
  } = {}
): void => {
  const { exact = true, maxRetries = 3, skipFirst = true, logPrefix = '' } = config;
  let attempts = 0;

  const attemptSelection = (): void => {
    cy.get(selector)
      .filter(':visible')
      .then($select => {
        const $options = $select.find('option:not([disabled])');
        const availableOptions = [...$options].filter((_, i) => !skipFirst || i > 0);

        const matchedOptions = availableOptions.filter(opt => {
          const text = (opt as HTMLOptionElement).text.trim();
          return exact
            ? options.includes(text as T)
            : options.some(allowed => text.toLowerCase().includes(allowed.toLowerCase()));
        });

        if (matchedOptions.length > 0) {
          const randomOpt = matchedOptions[Math.floor(Math.random() * matchedOptions.length)] as HTMLOptionElement;
          cy.wrap($select).select(randomOpt.value);
          cy.wait(1500);
          cy.log(`✅ ${logPrefix}Selected: ${randomOpt.text}`);
          return;
        }

        attempts++;
        if (attempts < maxRetries) {
          cy.log(`⚠️ ${logPrefix}No match, retry ${attempts}/${maxRetries}`);
          cy.wait(2000);
          attemptSelection();
          return;
        }

        // Fallback
        cy.log(`❌ ${logPrefix}Failed after ${maxRetries} attempts, using fallback`);
        if (availableOptions.length > 0) {
          const fallback = availableOptions[Math.floor(Math.random() * availableOptions.length)] as HTMLOptionElement;
          cy.wrap($select).select(fallback.value);
          cy.wait(1500);
          cy.log(`⚠️ ${logPrefix}Fallback: ${fallback.text}`);
        }
      });
  };

  attemptSelection();
};

const selectMatOption = (
  labelSelector: string,
  optionFilter?: (text: string) => boolean
): void => {
  cy.contains('label', labelSelector)
    .filter(':visible')
    .closest('.row')
    .find('mat-select .mat-select-trigger')
    .click({ force: true });

  cy.get('.cdk-overlay-pane mat-option', { timeout: 10000 })
    .should('be.visible')
    .then($options => {
      const targetOptions = optionFilter
        ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
        : $options;

      if (targetOptions.length > 0) {
        const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        cy.wrap(randomOpt).click({ force: true });
      } else if ($options.length > 0) {
        cy.wrap($options[0]).click({ force: true });
      } else {
        cy.get('.cdk-overlay-backdrop').click({ force: true });
      }
      cy.wait(1500);
    });
};

const selectMatOptionWithValidation = (
  labelSelector: string,
  optionFilter?: (text: string) => boolean
): void => {
  cy.contains('label', labelSelector)
    .closest('.row')
    .find('mat-select')
    .should('not.have.class', 'mat-select-disabled')
    .click();

  cy.get('.cdk-overlay-pane mat-option:not(.mat-option-disabled)', { timeout: 10000 })
    .should('have.length.greaterThan', 0)
    .then($options => {
      const targetOptions = optionFilter
        ? $options.filter((_, opt) => optionFilter(Cypress.$(opt).text().trim()))
        : $options;

      if (targetOptions.length > 0) {
        const randomOpt = targetOptions[Math.floor(Math.random() * targetOptions.length)];
        cy.wrap(randomOpt).click({ force: true });
      } else {
        cy.wrap($options.first()).click({ force: true });
      }
    });

  cy.wait(1500);

  cy.contains('label', labelSelector)
    .closest('.row')
    .find('mat-select')
    .should('not.contain', 'Please Select')
    // ✅ รอ Angular commit ค่าลง form
    .should('have.class', 'ng-valid')
    .and('have.class', 'ng-dirty');
};

const isPreModule = (productClass: string, subModule?: string): boolean =>
  productClass === 'main' && subModule?.toLowerCase() === 'pre';

// ============ Internet Quota Type Handlers ============
const handleLimitedData = (productClass: string, subModule?: string) => {
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  if (productClass === 'main') {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handleLimitedDataOnly = (productClass: string, subModule?: string, Module?: string) => {
  cy.log(`🔵 Case: Limited Data Only | ProductClass: ${productClass} | subModule: ${subModule}| Module: ${Module}`);
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  if (isPreModule(productClass, subModule)) {
    cy.log('✅ Condition met → calling selectInternetExceedRate()');
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handlePayPerUse = () => {
  selectMatOptionWithValidation('*Internet Exceed Rate :');
};

const handleUnlimitedFixedSpeed = (productClass: string, subModule?: string) => {
  const checkboxSelector = '[formarrayname="internetQuotaNetworkCoverageCheckBox"]';

  cy.get(checkboxSelector)
    .filter(':visible')
    .then($container => {
      const $5gLabel = $container.find('label').filter((_, el) =>
        Cypress.$(el).text().trim().includes('5G')
      );

      if ($5gLabel.length > 0) {
        cy.wrap($5gLabel).click({ force: true });
        cy.wait(600);
      }

      const logPrefix = $5gLabel.length > 0 ? '[5G] ' : '[Non-5G] ';
      selectDropdownOption(
        'select[formcontrolname="fixedSpeedInternetSpeed"]',
        INTERNET_SPEEDS,
        { exact: false, logPrefix }
      );
    });

  if (isPreModule(productClass, subModule)) {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

const handleUnlimitedThrottling = (productClass: string, subModule?: string) => {
  selectMatOption('*Internet Quota :', text => text.startsWith('5G'));
  selectDropdownOption('select[formcontrolname="internetSpeed"]', INTERNET_SPEEDS, { exact: true, logPrefix: '[Speed] ' });
  selectDropdownOption('select[formcontrolname="internetThrottlingSpeed"]', THROTTLING_SPEEDS, { exact: true, logPrefix: '[Throttling] ' });

  if (isPreModule(productClass, subModule)) {
    selectMatOptionWithValidation('*Internet Exceed Rate :');
  }
};

// ============ Main Export Function ============
export const InternetRandom = (ProductClass: string, subModule?: string, Module?: string) => {
  // Navigate and open form
  cy.get('.scrollmenu > .nav').contains('Internet').scrollIntoView().should('be.visible').click();
  cy.scrollTo('bottom');
  cy.get('app-mass-mkt-internet button.btn-xs').find('.glyphicon-plus').filter(':visible').first().click();

  // สุ่มจากทุก options ที่มี
  const allowedOptions: InternetQuotaType[] = [
    'Limited Data (Pay per use)',
    'Limited Data (Stop Net)',
    'Limited Data Only',
    'Pay per use only',
    'Unlimited Data (Fixed Speed)',
    'Unlimited Data (Throttling Speed)'
  ];

  // Select quota type
  cy.get('app-mass-mkt-internet select[formcontrolname="InternetQuotaType"]')
    .filter(':visible')
    .last()
    .then($select => {
      cy.wrap($select).find('option').then($options => {
        const availableOptions = [...$options]
          .map(opt => (opt as HTMLOptionElement).text.trim())
          .filter(text => allowedOptions.includes(text as InternetQuotaType));

        if (availableOptions.length === 0) {
          cy.log('❌ No allowed quota types available');
          return;
        }

        const selectedType = availableOptions[Math.floor(Math.random() * availableOptions.length)] as InternetQuotaType;
        cy.wrap($select).select(selectedType);
        cy.wait(1500);
        cy.log(`📌 Selected Quota Type: ${selectedType}`);

        // Route to appropriate handler
        const handlers: Record<InternetQuotaType, () => void> = {
          'Limited Data (Pay per use)': () => handleLimitedData(ProductClass, subModule),
          'Limited Data (Stop Net)': () => handleLimitedData(ProductClass, subModule),
          'Limited Data Only': () => handleLimitedDataOnly(ProductClass, subModule, Module),
          'Pay per use only': handlePayPerUse,
          'Unlimited Data (Fixed Speed)': () => handleUnlimitedFixedSpeed(ProductClass, subModule),
          'Unlimited Data (Throttling Speed)': () => handleUnlimitedThrottling(ProductClass, subModule),
        };

        handlers[selectedType]?.();
      });
    });
  cy.wait(2000)
  cy.get('app-mass-mkt-internet').find('form, [formgroup]').should('have.class', 'ng-valid');

  cy.get('app-mass-mkt-internet button.btn-primary')
    .filter(':visible')
    .each(($btn) => {
      const text = $btn.text().trim();
      if (text === 'Add') {
        cy.wrap($btn).scrollIntoView().click({ force: true });
      }
    });
};

// ========================
// CHECK AND FILL CONTENT TYPE 
// ========================
const COMPONENT = 'app-mass-enh-vertical-app';
function checkAndFillContentType(): void {
  cy.log('🚀 checkAndFillContentType started');

  // ✅ รวมทุก tab ที่ต้องการ
  const targetTabs: Array<{
    name: string;
    containerSelector: string;
    editButtonSelector: string;
    contentTypeSelector: string;
  }> = [
      {
        name: 'Karaoke',
        containerSelector: 'app-mass-enh-content-karaoke',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Music Streaming',
        containerSelector: 'app-mass-enh-content-music-streaming',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Entertainment Partnership',
        containerSelector: 'app-mass-enh-content-music-streaming',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      },
      {
        name: 'Cloud Game',
        containerSelector: 'app-mass-enh-vr[title="Cloud Game"]',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentTypeValue"]'
      },
      {
        name: 'AI IP Camera',
        containerSelector: 'app-mass-enh-ai-ip-camera',
        editButtonSelector: 'button.btn-warning[title="Edit"]',
        contentTypeSelector: 'select[formcontrolname="contentType"]'
      }
    ];

  const processTab = (index: number) => {
    if (index >= targetTabs.length) {
      cy.log('🎉 All tabs processed');
      return;
    }

    const tabConfig = targetTabs[index];
    cy.log(`🔍 [${index + 1}/${targetTabs.length}] Looking for tab: "${tabConfig.name}"`);

    cy.get('body').then(($body) => {
      const $tab = $body.find('ul.nav.nav-tabs li a').filter((_i, el) => {
        return el.textContent?.trim() === tabConfig.name;
      });

      if (!$tab.length) {
        cy.log(`⚠️ Tab "${tabConfig.name}" not found, skipping to next tab...`);
        processTab(index + 1);
        return;
      }

      cy.log(`✅ Found tab: "${tabConfig.name}"`);

      cy.wrap($tab).click({ force: true });
      cy.wait(2000);
      cy.log(`✅ Clicked tab: ${tabConfig.name}`);

      // ✅ รอให้ container ของ tab นี้โหลด
      cy.get('body').then(($b) => {
        const $container = $b.find(tabConfig.containerSelector);

        if (!$container.length) {
          cy.log(`⚠️ Container "${tabConfig.containerSelector}" not found, skipping...`);
          processTab(index + 1);
          return;
        }

        cy.log(`✅ Container found: ${tabConfig.containerSelector}`);

        // ✅ หา Edit buttons เฉพาะภายใน container นี้
        const $editButtons = $container.find(tabConfig.editButtonSelector);
        cy.log(`📋 [${tabConfig.name}] Edit buttons found: ${$editButtons.length}`);

        if ($editButtons.length === 0) {
          cy.log(`⚠️ No Edit button found in ${tabConfig.name}, skipping...`);
          processTab(index + 1);
          return;
        }

        let currentEditIndex = 0;

        const processNextEditButton = () => {
          if (currentEditIndex >= $editButtons.length) {
            cy.log(`✅ [${tabConfig.name}] All ${$editButtons.length} Edit buttons processed`);
            processTab(index + 1);
            return;
          }

          cy.log(`📌 [${tabConfig.name}] Processing Edit button ${currentEditIndex + 1}/${$editButtons.length}`);

          // ✅ Requery container และ Edit button ใหม่
          cy.get('body').then(($b2) => {
            const $freshContainer = $b2.find(tabConfig.containerSelector);
            const $currentBtn = $freshContainer.find(tabConfig.editButtonSelector).eq(currentEditIndex);

            if (!$currentBtn.length) {
              cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} disappeared, skipping...`);
              currentEditIndex++;
              processNextEditButton();
              return;
            }

            const isHidden = Cypress.$($currentBtn).closest('[hidden]').length > 0;
            if (isHidden) {
              cy.log(`⚠️ [${tabConfig.name}] Edit button #${currentEditIndex + 1} is hidden, skipping...`);
              currentEditIndex++;
              processNextEditButton();
              return;
            }

            cy.wrap($currentBtn).click({ force: true });
            cy.wait(1500);
            cy.log(`✅ [${tabConfig.name}] Clicked Edit button #${currentEditIndex + 1}`);

            // ✅ หา Content Type select ใน container
            cy.get('body').then(($b3) => {
              const $freshContainer2 = $b3.find(tabConfig.containerSelector);
              const $allSelects = $freshContainer2.find(tabConfig.contentTypeSelector);
              const $visibleSelects = $allSelects.filter((_i, el) => {
                return Cypress.$(el).closest('[hidden]').length === 0;
              });

              cy.log(`📋 [${tabConfig.name}] Visible Content Type selects: ${$visibleSelects.length}`);

              if (!$visibleSelects.length) {
                cy.log(`⚠️ [${tabConfig.name}] No visible Content Type select found`);
                currentEditIndex++;
                processNextEditButton();
                return;
              }

              const $select = $visibleSelects.first();
              const select = $select[0] as unknown as HTMLSelectElement;
              const selectedValue: string = select.value || '';
              const isEmpty: boolean =
                !selectedValue ||
                selectedValue === 'null' ||
                selectedValue === '' ||
                selectedValue === '0: null' ||
                select.selectedIndex <= 0;

              cy.log(`[${tabConfig.name}] Content Type value: "${selectedValue}" | isEmpty: ${isEmpty}`);

              if (isEmpty) {
                const validOptions = Array.from(select.options || []).filter(
                  (opt: HTMLOptionElement) => opt && !opt.disabled && opt.value && opt.value !== 'null' && opt.value !== '0: null' && opt.value !== ''
                );

                cy.log(`📋 [${tabConfig.name}] Valid options: ${validOptions.length}`);

                if (validOptions.length === 0) {
                  cy.log(`⚠️ [${tabConfig.name}] No valid options to select`);
                  currentEditIndex++;
                  processNextEditButton();
                  return;
                }

                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];

                cy.wrap($select).select(randomOption.value, { force: true });
                cy.wait(600);
                cy.log(`✅ [${tabConfig.name}] Selected: "${randomOption.text?.trim() || 'Unknown'}"`);

                // ✅ หา Update button ใน container
                cy.get('body').then(($b4) => {
                  const $freshContainer3 = $b4.find(tabConfig.containerSelector);
                  const $updateBtn = $freshContainer3.find('button').filter((_i, btn) => {
                    return btn.textContent?.trim() === 'Update' &&
                      Cypress.$(btn).closest('[hidden]').length === 0;
                  });

                  cy.log(`📋 [${tabConfig.name}] Update button found: ${$updateBtn.length}`);

                  if ($updateBtn.length) {
                    cy.wrap($updateBtn.first()).click({ force: true });
                    cy.log(`✅ [${tabConfig.name}] Clicked Update button`);
                    cy.wait(3000);
                    currentEditIndex++;
                    processNextEditButton();
                  } else {
                    cy.log(`⚠️ [${tabConfig.name}] Update button not found`);
                    currentEditIndex++;
                    processNextEditButton();
                  }
                });
              } else {
                const currentText = select.options[select.selectedIndex]?.text?.trim() || 'Unknown';
                cy.log(`✅ [${tabConfig.name}] Content Type already has value: "${currentText}"`);
                currentEditIndex++;
                processNextEditButton();
              }
            });
          });
        };

        processNextEditButton();
      });
    });
  };

  processTab(0);
  cy.log('🎉 Done checking all tabs');
}

const INTERNET_COMPONENT = 'app-mass-enh-internet';

const ALL_PRIORITY_QUOTA_TYPES = [
  'Limited Data (Pay per use)',
  'Limited Data (Stop Net)',
  'Limited Data Only',
  'Unlimited Data (Throttling Speed)',
  'Pay per use only',
  'Unlimited Data (Fixed Speed)',
];

const randomPriority = (): string => String(Math.floor(Math.random() * 99) + 1);

const tryFillVisible = ($scope: JQuery, formControlName: string, label: string): void => {
  const $input = $scope.find(`input[formcontrolname="${formControlName}"]`).first();
  if (!$input.length) return;

  const existing = (($input.val() as string) || '').trim();
  if (existing !== '') {
    cy.log(`ℹ️ ${label} มีค่า "${existing}" — ใช้ค่าเดิม`);
    return;
  }
  cy.wrap($input)
    .clear({ force: true })
    .type(randomPriority(), { force: true, delay: 50 })
    .trigger('blur', { force: true });

  cy.wait(300);
  cy.log(`✅ กรอก ${label} สำเร็จ`);

};

export const checkAndUpdatePriority = (): void => {
  cy.log('🚀 checkAndUpdatePriority started');

  const safeClickCancel = (): void => {
    // รอ component แทน bail out
    cy.get(INTERNET_COMPONENT, { timeout: 6000 }).should('exist').then(($comp) => {
      const $cancelBtns = $comp
        .find('button')
        .toArray()
        .filter((el) => {
          const text = (el.textContent || '').trim();
          return text === 'Cancel' && Cypress.$(el).is(':visible');
        });
      if ($cancelBtns.length > 0) {
        cy.wrap($cancelBtns[0]).scrollIntoView().click({ force: true });
        cy.log('✅ กด Cancel');
        cy.wait(400);
      } else {
        cy.log('ℹ️ ไม่พบปุ่ม Cancel ที่ visible — ข้าม');
      }
    });
  };

  const processRows = (rowIndex: number = 0): void => {
    cy.log(`🔄 กำลังตรวจสอบแถวที่ ${rowIndex + 1}...`);
    cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(() => {
      cy.get(INTERNET_COMPONENT)
        .find('table')
        .filter((_i, el) => {
          const $el = Cypress.$(el);
          return (
            $el.is(':visible') &&
            $el
              .find('thead th')
              .toArray()
              .some((th) => th.textContent?.trim() === 'Quota Type')
          );
        })
        .first()
        .should('be.visible')
        .find('tbody tr')
        .filter((_i, el) => {
          const text = Cypress.$(el).find('td').first().text().trim();
          return text.length > 0 && text !== 'No data to display.';
        })
        .then(($rows) => {
          const totalRows = $rows.length;
          cy.log(`📊 พบข้อมูลทั้งหมด ${totalRows} แถว`);

          if (rowIndex >= totalRows) {
            cy.log('✅ ทำครบทุกแถวแล้ว');
            return;
          }

          const $currentRow = $rows.eq(rowIndex);
          cy.wrap($currentRow).scrollIntoView();
          const quotaType = $currentRow.find('td').first().text().trim();

          if (!ALL_PRIORITY_QUOTA_TYPES.includes(quotaType)) {
            cy.log(`⏭️ ข้าม "${quotaType}" (ไม่มี priority field)`);
            processRows(rowIndex + 1);
            return;
          }

          cy.log(`📝 ประมวลผลแถวที่ ${rowIndex + 1}: "${quotaType}"`);

          const $editBtn = $currentRow
            .find('button.btn-warning')
            .filter((_i, el) => Cypress.$(el).is(':visible'))
            .first();

          if (!$editBtn.length) {
            cy.log(`⚠️ ไม่พบปุ่ม Edit แถวที่ ${rowIndex + 1} — ข้าม`);
            processRows(rowIndex + 1);
            return;
          }

          cy.wrap($editBtn).scrollIntoView().click({ force: true });
          cy.get(INTERNET_COMPONENT, { timeout: 10000 }).should('exist').then(($comp) => {
            const $pb = getInternetDetailPanelBody($comp);
            if (!$pb.length) {
              cy.log('⚠️ Internet Detail panel-body ไม่พบหลัง click Edit — ข้าม row');
              processRows(rowIndex + 1);
              return;
            }

            cy.log('✅ Internet Detail panel เปิดแล้ว → เรียก updatePriorityInPanel');
            updatePriorityInPanel();

            cy.then(() => {
              safeClickCancel();
              processRows(rowIndex + 1);
            });
          });
        });
    });
  };

  cy.get('body').then(($body) => {
    const $internetTab = $body
      .find('.scrollmenu > .nav a, .scrollmenu > .nav li a')
      .filter((_i, el) => el.textContent?.trim() === 'Internet');

    if (!$internetTab.length) {
      cy.log('⚠️ Tab "Internet" not found — skipping');
      return;
    }

    cy.wrap($internetTab.first()).scrollIntoView().click({ force: true });
    cy.log('✅ กด Tab Internet');

    cy.get(`${INTERNET_COMPONENT} table thead th`)
      .contains('Quota Type')
      .should('be.visible', { timeout: 10000 });

    cy.wait(500);
    processRows(0);
  });
};

const getInternetDetailPanelBody = ($component: JQuery): JQuery =>
  $component
    .find('.h3-panel-header, .panel-heading h3')
    .filter((_i, el) => {
      // ต้อง text match + panel ต้องไม่ hidden
      return (
        el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail' &&
        Cypress.$(el).closest('[hidden]').length === 0
      );
    })
    .closest('.panel')
    .find('> .panel-body')
    .first();

const updatePriorityInPanel = (): void => {
  // Step 1: fill top-level priority fields
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) { cy.log('⚠️ ไม่พบ Internet Detail panel-body (step 1)'); return; }
    tryFillVisible($pb, 'internetExceedRatePriority', 'Internet Exceed Rate Priority');
    tryFillVisible($pb, 'internetThrottlingSpeedPriority', 'Internet Throttling Speed Priority');
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // Step 2: หา inner table แล้ว click inner Edit
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) {
      cy.log('ℹ️ Step 2: ไม่พบ panel-body — ข้าม inner Edit');
      return;
    }

    const $innerTable = $pb
      .find('table')
      .filter((_i, el) => Cypress.$(el).closest('[hidden]').length === 0)
      .first();

    if (!$innerTable.length) {
      cy.log('ℹ️ ไม่มี inner table ที่ไม่ถูก hide — ข้าม inner Edit');
      return;
    }

    const $innerEditBtn = $innerTable
      .find('tbody tr')
      .filter((_i, el) => {
        const $tr = Cypress.$(el);
        return (
          $tr.find('td[colspan]').length === 0 &&
          $tr.find('td').first().text().trim().length > 0
        );
      })
      .first()
      .find('button.btn-warning')
      .first();

    if (!$innerEditBtn.length) {
      cy.log('ℹ️ ไม่มี inner sub-table row — ข้าม inner Edit');
      return;
    }

    cy.wrap($innerEditBtn).scrollIntoView().click({ force: true });
    cy.log('✅ คลิก inner Edit (2nd Edit) — รอ sub-panel โผล่');
    // รอ Angular re-render เสร็จก่อนไปขั้นต่อไป
    cy.wait(3500);
  });

  // Step 3: guard ด้วย body check ก่อน แล้วค่อย fill priority ใน sub-panel
  cy.get('body').then(($body) => {
    if (!$body.find(INTERNET_COMPONENT).length) {
      cy.log('⏳ Step 3: INTERNET_COMPONENT หายหลัง inner Edit — รอ re-render');
      cy.wait(4000);
    }
  });

  cy.get(INTERNET_COMPONENT, { timeout: 25000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) {
      cy.log('ℹ️ Step 3: ไม่พบ panel-body — ข้าม sub-panel fill');
      return;
    }

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();
    if (!$priorityInput.length) {
      cy.log('ℹ️ priority input ไม่มีใน DOM — ข้าม sub-panel step');
      return;
    }

    const existing = (($priorityInput.val() as string) || '').trim();
    if (existing !== '') {
      cy.log(`ℹ️ priority มีค่า "${existing}" — ใช้ค่าเดิม`);
    } else {
      cy.wrap($priorityInput)
        .clear({ force: true })
        .type(randomPriority(), { force: true, delay: 50 })
        .trigger('blur', { force: true });
      cy.wait(2500);
      cy.log('✅ กรอก priority (sub-panel) สำเร็จ');
    }
  });

  // Step 4: click inner Update — แยก block เพื่อให้ re-query หลัง fill
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();
    if (!$priorityInput.length) return;

    const $subPanelBody = Cypress.$($priorityInput[0]).closest('.panel-body');
    const $innerUpdateBtn = $subPanelBody
      .find('button')
      .toArray()
      .filter((el) =>
        /Update/i.test((el.textContent || '').trim()) &&
        Cypress.$(el).is(':visible')
      );

    if ($innerUpdateBtn.length) {
      cy.wrap($innerUpdateBtn[0]).scrollIntoView().click({ force: true });
      cy.log('✅ คลิก inner Update (sub-panel)');
      cy.wait(2500);
    } else {
      cy.log('⚠️ ไม่พบ inner Update button');
    }
  });

  // Step 5: fill fixedSpeedPriority อีกรอบหลัง sub-panel close
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  // Step 6: click outer Update/Add
  cy.get(INTERNET_COMPONENT, { timeout: 15000 }).should('exist').then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $outerUpdateBtn = $pb
      .find('button')
      .toArray()
      .filter((el) => {
        const $el = Cypress.$(el);
        return (
          /Update|Add/i.test((el.textContent || '').trim()) &&
          $el.is(':visible') &&
          $el.closest('.panel-body').is($pb[0])
        );
      });

    if ($outerUpdateBtn.length) {
      cy.wrap($outerUpdateBtn[0]).scrollIntoView().click({ force: true });
      cy.log('✅ คลิก outer Update เรียบร้อย');
      cy.wait(2500);
    } else {
      cy.log('⚠️ ไม่พบ outer Update button');
    }
  });
};

const performSimpleClaimAndApprovalRole = (
  user: string,
  pass: string,
  approveFunction: ApproveFunction,
  options?: {
    searchBy?: 'project' | 'po'; // default: 'po'
  }
): void => {
  loginAndWaitReady(user, pass);


  const projectNamePONAME: string = getStandardProjectName();
  const poCount: number = Cypress.env('poCount') ?? 1;
  const allPoNames: string[] = Cypress.env('allPoNames') ?? [];
  const searchBy = options?.searchBy ?? 'po';
  cy.log(`🔑 allPoNames raw: ${JSON.stringify(allPoNames)}`);
  cy.log(`🔑 allPoNames[0]: "${allPoNames[0]}"`);
  cy.log(`🔑 poCount: ${poCount}`);
  cy.log(`🔑 projectName: ${projectNamePONAME}`);
  cy.log(`📋 Project: ${projectNamePONAME}`);
  cy.log(`🔁 Total PO to process: ${poCount}`);
  cy.log(`🔍 Search mode: ${searchBy}`);

  ClaimProject(projectNamePONAME);

  const approveNextPO = (index: number): void => {
    if (index >= poCount) {
      cy.log('✅ All POs approved');
      return;
    }
    let currentUniqueKeyword: string =
      searchBy === 'project'
        ? projectNamePONAME
        : allPoNames[index] ?? `${projectNamePONAME}_PO${index + 1}`;

    if (searchBy === 'po' && currentUniqueKeyword.includes('_')) {
      currentUniqueKeyword = currentUniqueKeyword.split('_')[0].trim();
      cy.log(`✂️ Cleaned keyword: "${currentUniqueKeyword}"`);
    }

    cy.log(`📦 [${index + 1}/${poCount}] Searching by "${searchBy}": "${currentUniqueKeyword}"`);

    cy.get('h3:contains("To Do List")', { timeout: 15000 })
      .parent()
      .find('tbody tr')
      .should(($rows) => {
        expect($rows.text()).not.to.contain('Fetching data');
      });

    searchInTableWithPagination(
      'To Do List',
      currentUniqueKeyword,
      ($row) => {
        cy.get('h3:contains("To Do List")')
          .parent()
          .find('tbody tr.cursor-point')
          .filter((_i, el) => Cypress.$(el).text().includes(currentUniqueKeyword))
          .first()
          .as('targetRow');

        cy.get('@targetRow').should('be.visible').click();
        cy.log(`✅ [${index + 1}/${poCount}] Entered PO approval page`);
      },
      {
        waitAfterNext: 2000,
        filterCallback: ($row) => {
          const rowText = $row.text().trim();
          // การใช้ includes จะทำงานได้สมบูรณ์ เพราะ Keyword ที่ตัด _ ออกแล้ว 
          // จะยังคงเป็น substring ของข้อความจริงใน DOM เช่น "MOB PRE OT Main PO1..."
          return rowText.includes(currentUniqueKeyword) && !rowText.includes('Fetching data');
        }
      }
    );

    approveFunction(projectNamePONAME);

    if (index < poCount - 1) {
      navigateToWorkspace();

      cy.get('h3:contains("To Do List")', { timeout: 15000 })
        .parent()
        .find('tbody tr')
        .should(($rows) => {
          expect($rows.text()).not.to.contain('Fetching data');
          expect($rows.length).to.be.greaterThan(0);
        });

      approveNextPO(index + 1);
    }
  };

  approveNextPO(0);
};

const checkAndUpdateVerticalAppPriority = (): void => {
  cy.log('🚀 checkAndUpdateVerticalAppPriority started');

  const fillIfEmpty = (
    $input: JQuery<HTMLElement>,
    label: string,
    onFilled: () => void,
    onSkip: () => void
  ): void => {
    cy.wrap($input).invoke('val').then((val) => {
      const isEmpty = !val || String(val).trim() === '';

      if (isEmpty) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        cy.wrap($input)
          .scrollIntoView()
          .focus()
          .clear()
          .type(randomNum.toString(), { delay: 150 })
          .blur();
        cy.log(`✅ ใส่ค่า ${label}: ${randomNum}`);
        cy.wait(2000);
        onFilled();
      } else {
        cy.log(`ℹ️ ${label} มีค่าอยู่แล้ว: "${val}" — ข้าม`);
        onSkip();
      }
    });
  };

  const clickUpdateIfVisible = (afterUpdate: () => void): void => {
    cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
      const $updateBtn = $panelBody.find('button.btn-success').filter((_i, btn) => {
        return (
          btn.textContent?.trim() === 'Update' &&
          Cypress.$(btn).closest('[hidden]').length === 0
        );
      });

      if ($updateBtn.length) {
        cy.wrap($updateBtn.first()).click({ force: true });
        cy.log('✅ คลิก Update');
        cy.wait(3000);
      } else {
        cy.log('⚠️ ไม่พบ Update button');
      }

      afterUpdate();
    });
  };

  const clickCancel = (afterCancel: () => void): void => {
    cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
      const $cancelBtn = $panelBody.find('button').filter((_i, btn) => {
        return (
          btn.textContent?.trim() === 'Cancel' &&
          Cypress.$(btn).closest('[hidden]').length === 0
        );
      });

      if ($cancelBtn.length) {
        cy.wrap($cancelBtn.first()).click({ force: true });
        cy.log('✅ คลิก Cancel');
        cy.wait(1000);
      } else {
        cy.log('⚠️ ไม่พบ Cancel button');
      }

      afterCancel();
    });
  };

  const processRows = (rowIndex: number): void => {
    cy.get('body').then(($b) => {
      const $rows = $b.find(`${COMPONENT} table > tbody > tr`).filter((_i, tr) => {
        const text = Cypress.$(tr).find('td:first').text().trim();
        return text !== '' && !text.includes('No data to display');
      });

      if (rowIndex >= $rows.length) {
        cy.log(`✅ ทำครบทุกแถวแล้ว (${$rows.length} แถว)`);
        return;
      }

      cy.log(`📝 กำลังทำแถวที่ ${rowIndex + 1}/${$rows.length}`);

      const $currentRow = $rows.eq(rowIndex);
      const $editBtn = $currentRow.find('button.btn-warning[title="Edit"]').first();

      if (!$editBtn.length) {
        cy.log(`⚠️ ไม่พบ Edit button ในแถวที่ ${rowIndex + 1} — ข้าม`);
        processRows(rowIndex + 1);
        return;
      }

      const isHidden = Cypress.$($editBtn).closest('[hidden]').length > 0;
      if (isHidden) {
        cy.log(`⚠️ Edit button ในแถวที่ ${rowIndex + 1} ถูกซ่อนอยู่ — ข้าม`);
        processRows(rowIndex + 1);
        return;
      }

      cy.wrap($editBtn).click({ force: true });
      cy.wait(1500);
      cy.log(`✅ คลิก Edit button แถวที่ ${rowIndex + 1}`);

      cy.get(`${COMPONENT} .panel-body`).then(($panelBody) => {
        const $priorityInput = $panelBody
          .find('input[formcontrolname="priority"]')
          .filter((_i, el) => {
            return (
              Cypress.$(el).closest('[hidden]').length === 0 &&
              Cypress.$(el).is(':visible')
            );
          });

        const $throttlingInput = $panelBody
          .find('input[formcontrolname="throttlingSpeedPriority"]')
          .filter((_i, el) => {
            return (
              Cypress.$(el).closest('[hidden]').length === 0 &&
              Cypress.$(el).is(':visible')
            );
          });

        cy.log(
          `📋 Priority: ${$priorityInput.length} | ThrottlingSpeedPriority: ${$throttlingInput.length}`
        );

        if (!$priorityInput.length && !$throttlingInput.length) {
          cy.log('⚠️ ไม่พบ input ใดๆ ที่มองเห็นได้ — ข้ามแถวนี้');
          processRows(rowIndex + 1);
          return;
        }

        let needsUpdate = false;

        const finishRow = (): void => {
          if (needsUpdate) {
            clickUpdateIfVisible(() => processRows(rowIndex + 1));
          } else {
            cy.log(`ℹ️ ไม่มีการเปลี่ยนแปลง — กด Cancel`);
            clickCancel(() => processRows(rowIndex + 1));
          }
        };

        const checkThrottlingThenFinish = (): void => {
          if ($throttlingInput.length) {
            fillIfEmpty(
              $throttlingInput.first(),
              'Throttling Speed Priority',
              () => {
                needsUpdate = true;
                finishRow();
              },
              () => finishRow()
            );
          } else {
            cy.log('ℹ️ ไม่มี Throttling Speed Priority — ข้าม');
            finishRow();
          }
        };

        if ($priorityInput.length) {
          fillIfEmpty(
            $priorityInput.first(),
            'Priority',
            () => {
              needsUpdate = true;
              checkThrottlingThenFinish();
            },
            () => checkThrottlingThenFinish()
          );
        } else {
          cy.log('ℹ️ ไม่มี Priority — ข้ามไปเช็ค Throttling');
          checkThrottlingThenFinish();
        }
      });
    });
  };

  // ── Tab check ─────────────────────────────────────────────────────────────
  cy.get('body').then(($body) => {
    const normalizeText = (text: string | null | undefined): string =>
      (text ?? '').replace(/\s+/g, ' ').trim();

    // ✅ ลบ '.scrollmenu > .nav li a' ออก — ซ้ำซ้อนกับ '.scrollmenu > .nav a'
    //    และเป็นต้นเหตุของ 2-element bug
    const $allLinks = $body.find(
      'ul.nav.nav-tabs li a, .scrollmenu > .nav a'
    );

    // 🔍 Debug: log ทุก tab ที่เจอ (ลบออกได้หลัง confirm)
    $allLinks.each((_i, el) => {
      cy.log(`🔍 tab: "${normalizeText(el.textContent)}"`);
    });

    const $tab = $allLinks.filter(
      (_i, el) => normalizeText(el.textContent) === 'Vertical App'
    );

    if (!$tab.length) {
      cy.log('⚠️ Tab "Vertical App" not found — skipping');
      return;
    }

    // ✅ ดึง element แรกออกมาก่อน wrap เพื่อการันตี 1 element เสมอ
    const $target = $tab.first();
    cy.log(`✅ Found tab: "Vertical App" (${$target.length} element)`);
    cy.wrap($target).scrollIntoView().click({ force: true });
    cy.wait(1500);

    cy.get('body').then(($b) => {
      const $rows = $b.find(`${COMPONENT} table > tbody > tr`);

      if (!$rows.length) {
        cy.log(`⚠️ ไม่พบแถวใน ${COMPONENT} — skipping`);
        return;
      }

      cy.log(`✅ พบ ${$rows.length} แถว — เริ่ม processRows`);
      processRows(0);
      cy.log('🎉 checkAndUpdateVerticalAppPriority เสร็จสิ้น');
    });
  });
};

export const CopyDeductFail = (pageType: 'mass-market' | 'enhancement'): void => {
  const mainTabs = ['Internet', 'Voice', 'SMS', 'MMS', 'Vertical App', 'Cloud Game', 'WiFi']

  const COMPONENT_MAP: Record<'mass-market' | 'enhancement', Record<string, string>> = {
    'mass-market': {
      'Internet': 'app-mass-mkt-internet',
      'Voice': 'app-mass-mkt-voice',
      'SMS': 'app-mass-mkt-sms',
      'MMS': 'app-mass-mkt-mms',
      'Vertical App': 'app-mass-mkt-vertical-app',
      'Cloud Game': 'app-mass-mkt-cloud-game',
      'WiFi': 'app-mass-mkt-wifi',
    },
    'enhancement': {
      'Internet': 'app-mass-enh-internet',
      'Voice': 'app-mass-enh-voice',
      'SMS': 'app-mass-enh-sms',
      'MMS': 'app-mass-enh-mms',
      'Vertical App': 'app-mass-enh-vertical-app',
      'Cloud Game': 'app-mass-enh-cloud-game',
      'WiFi': 'app-mass-enh-wifi',
    },
  }

  const tabBarSelector = pageType === 'enhancement'
    ? 'ul.nav.nav-tabs a'
    : '.scrollmenu .nav a'

  const processTab = (index: number): void => {
    if (index >= mainTabs.length) {
      cy.log('🎉 All tabs processed successfully.')
      return
    }

    const tabName = mainTabs[index]
    const componentSelector = COMPONENT_MAP[pageType][tabName]
    cy.log(`\n🔄 [${pageType}] Processing [${index + 1}/${mainTabs.length}]: "${tabName}"`)

    cy.get(tabBarSelector).contains(tabName).click()

    cy.get('body').then(($body) => {
      if (!$body.find(componentSelector).length) {
        cy.log(`⚠️ Component "${componentSelector}" not found — skipping.`)
        processTab(index + 1)
        return
      }

      cy.get(componentSelector, { timeout: 20000 }).should('exist')
      cy.wait(600)

      cy.get(componentSelector).within(() => {
        cy.get('.nav-tabs a').contains('Deduct Fail').click()

        cy.get('.tab-pane.active', { timeout: 10000 }).should('be.visible')

        cy.get('.tab-pane.active').then(($pane) => {
          const $btn = $pane.find('button:contains("Copy From Deduct Success")')

          if ($btn.length > 0) {
            cy.wrap($btn.first()).click({ force: true })
            cy.log(`✅ Copied Deduct Success → Deduct Fail for "${tabName}"`)
          } else {
            cy.log(`⚠️ No "Copy From Deduct Success" button in "${tabName}" — skipping.`)
          }
        })
      })

      cy.wait(500)
      processTab(index + 1)
    })
  }

  cy.get(tabBarSelector).should('exist')
  processTab(0)
}

// ========================
// PROJECT BASIC INFORMATION HELPERS
// ========================

const ABBREVIATIONS: Record<string, string> = {
  // PriceType
  recurring: 'Rec',
  onetime: 'OT',
  usage: 'Usg',
  // ProductClass
  main: 'Main',
  ontop: 'Ontop',
  ontopextra: 'OtopX',
  // Modules
  ENTER: 'ENT',
  MUSIC: 'MUS',
  // PoSubGroup
  AccountFee: 'Account Fee',
  OrderFee: 'Order Fee',
  CashBack: 'Cash Back',
  Service: 'Service',
  GroupPoFee: 'Group Po Fee',
};

const getAbbreviation = (word: string | undefined): string => {
  if (!word) return '';
  return ABBREVIATIONS[word] || word; // ถ้าไม่มีใน dict ให้ใช้คำเดิม
};

const generateUniqueId = (): string => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  // const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${month}${h} ${day}${s}`;
};

const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string => {
  // const separator = '_';
  const reservedLength = identifier.length;
  const maxBaseLength = maxLength - reservedLength;

  let cleanBase = baseName;
  if (cleanBase.length > maxBaseLength) {
    cleanBase = cleanBase.substring(0, maxBaseLength);
  }

  return `${cleanBase} ${identifier}`;
};

// ========================
// GENERATE PROJECT NAMES
// ========================

const generateProjectNames = (
  prefix: string,
  Module: Module,
  subModule: string | undefined,
  PriceType: string,
  ProductClass?: string,
  PoSubGroup?: string,
  Plugin?: string
): { projectName: string; poName: string; prefixName: string } => {
  const timeId = generateUniqueId();
  let prefixName: string;

  if (PoSubGroup) {
    const modulePart = getAbbreviation(Module);
    const subGroupPart = getAbbreviation(PoSubGroup);
    if (Module === 'PRE' && (PoSubGroup === 'Service' || PoSubGroup === 'OrderFee')) {
      prefixName = `MOB ${modulePart} ${getAbbreviation(PriceType)} ${subGroupPart}`;
    } else {
      prefixName = `MOB ${modulePart} ${subGroupPart}`;
    }
  } else {
    const ModulePart = (Module === 'ENTER' || Module === 'MUSIC')
      ? `${getAbbreviation(prefix)} ${getAbbreviation(subModule)}`
      : `${getAbbreviation(prefix)} ${getAbbreviation(Module)}`;

    const parts = [ModulePart, getAbbreviation(PriceType), getAbbreviation(ProductClass), getAbbreviation(Plugin)].filter(Boolean);
    prefixName = parts.join(' ');
  }

  // ✅ คง Prefix PRJ และ PO ไว้ตามที่ต้องการ
  const projectIdentifier = `PRJ ${timeId}`; // PRJ143052 (9 ตัว)
  const poIdentifier = `PO ${timeId}`;       // PO143052 (8 ตัว)

  // Project ใช้ Max 40 ตัว
  const projectName = buildUniqueName(prefixName, projectIdentifier, 40);

  // ✅ PO ใช้ Max 30 ตัว (เผื่อที่ว่าง 10 ตัว สำหรับ _{target_customer} ที่จะเติมตอน Approve)
  const poName = buildUniqueName(prefixName, poIdentifier, 30);

  return { projectName, poName, prefixName };
};

// ========================
// CREATE PROJECT BASE
// ========================

const createProjectBase = (
  credentials: { user: string; pass: string },
  projectName: string,
  Module: Module,
  subModule?: string
): void => {
  login(credentials.user, credentials.pass);
  cy.get('.col-md-10 > .btn').should('be.visible').click();

  cy.get('input[formcontrolname="projectName"]', { timeout: 10000 })
    .should('be.visible').should('not.be.disabled').click().type(projectName);

  const date = new Date();
  date.setDate(date.getDate() + 1);
  const formattedDateString = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  cy.intercept('GET', '/PLMSpringBoot/api/**').as('getRequest');
  cy.intercept('GET', '/PLMSpringBoot/api/edsOfferingController/getExistPackage/**').as('getExistPackage');

  cy.get('input[aria-label="Date input field"]').click().type(formattedDateString);
  cy.wait(1500);

  if (Module === 'ENTER' || Module === 'MUSIC') {
    if (!subModule) throw new Error(`subModule is required for Module ${Module}`);
    const customerType = subModule === 'POST' ? 'Post-paid' : 'Pre-paid';
    cy.get('select[formcontrolname="customerType"]').select(customerType);
  }

  cy.get('input[formcontrolname="phoneNo"]').type(getRandomPhone());
  RandomProjectDescription(projectName, subModule, Module);

  cy.get('button[type="button"]').contains('Save').click();
  cy.wait('@getRequest', { timeout: 1000000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@getExistPackage', { timeout: 30000 });

  cy.get('.modal-body > :nth-child(1) > div > .btn', { timeout: 15000 })
    .should('be.visible').click({ force: true });

  cy.get('modal-container').should('not.exist');
};

// ========================
// PROJECT BASIC INFORMATION COMPLETE
// ========================

