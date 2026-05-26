// ========================
// VOICE
// ========================

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

