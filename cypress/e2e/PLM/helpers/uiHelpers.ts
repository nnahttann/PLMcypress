// ========================================
// DOMAIN-SPECIFIC UI HELPERS
// ========================================

export { scrollAndWait, handleAddToUSMP, selectRandomOption, clickYesIfExists } from './uiHelpers.core';

/**
 * Check and fill Content Type for various tabs (Karaoke, Music, etc.)
 */
export function checkAndFillContentType(): void {
  cy.log('🚀 checkAndFillContentType started');

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

      cy.get('body').then(($b) => {
        const $container = $b.find(tabConfig.containerSelector);

        if (!$container.length) {
          cy.log(`⚠️ Container "${tabConfig.containerSelector}" not found, skipping...`);
          processTab(index + 1);
          return;
        }

        const $editButtons = $container.find(tabConfig.editButtonSelector);
        if ($editButtons.length === 0) {
          cy.log(`⚠️ No Edit button found in ${tabConfig.name}, skipping...`);
          processTab(index + 1);
          return;
        }

        let currentEditIndex = 0;

        const processNextEditButton = () => {
          if (currentEditIndex >= $editButtons.length) {
            processTab(index + 1);
            return;
          }

          cy.get('body').then(($b2) => {
            const $freshContainer = $b2.find(tabConfig.containerSelector);
            const $currentBtn = $freshContainer.find(tabConfig.editButtonSelector).eq(currentEditIndex);

            if (!$currentBtn.length || Cypress.$($currentBtn).closest('[hidden]').length > 0) {
              currentEditIndex++;
              processNextEditButton();
              return;
            }

            cy.wrap($currentBtn).click({ force: true });
            cy.wait(1500);

            cy.get('body').then(($b3) => {
              const $freshContainer2 = $b3.find(tabConfig.containerSelector);
              const $visibleSelects = $freshContainer2.find(tabConfig.contentTypeSelector).filter((_i, el) => {
                return Cypress.$(el).closest('[hidden]').length === 0;
              });

              if (!$visibleSelects.length) {
                currentEditIndex++;
                processNextEditButton();
                return;
              }

              const $select = $visibleSelects.first();
              const select = $select[0] as unknown as HTMLSelectElement;
              const selectedValue: string = select.value || '';
              const isEmpty: boolean = !selectedValue || selectedValue === 'null' || selectedValue === '' || selectedValue === '0: null' || select.selectedIndex <= 0;

              if (isEmpty) {
                const validOptions = Array.from(select.options || []).filter(
                  (opt: HTMLOptionElement) => opt && !opt.disabled && opt.value && opt.value !== 'null' && opt.value !== '0: null' && opt.value !== ''
                );

                if (validOptions.length === 0) {
                  currentEditIndex++;
                  processNextEditButton();
                  return;
                }

                const randomOption = validOptions[Math.floor(Math.random() * validOptions.length)];
                cy.wrap($select).select(randomOption.value, { force: true });
                cy.wait(600);

                cy.get('body').then(($b4) => {
                  const $freshContainer3 = $b4.find(tabConfig.containerSelector);
                  const $updateBtn = $freshContainer3.find('button').filter((_i, btn) => {
                    return btn.textContent?.trim() === 'Update' && Cypress.$(btn).closest('[hidden]').length === 0;
                  });

                  if ($updateBtn.length) {
                    cy.wrap($updateBtn.first()).click({ force: true });
                    cy.wait(3000);
                  }
                  currentEditIndex++;
                  processNextEditButton();
                });
              } else {
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
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIORITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ALL_PRIORITY_QUOTA_TYPES = [
  'Limited Data (Pay per use)',
  'Limited Data (Stop Net)',
  'Limited Data Only',
  'Unlimited Data (Throttling Speed)',
  'Pay per use only',
  'Unlimited Data (Fixed Speed)',
];

const INTERNET_COMPONENT = 'app-mass-enh-internet';

const randomPriority = (): string => String(Math.floor(Math.random() * 99) + 1);

const getInternetDetailPanelBody = ($component: JQuery): JQuery =>
  $component
    .find('.h3-panel-header, .panel-heading h3')
    .filter((_i, el) => el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail')
    .closest('.panel')
    .find('> .panel-body')
    .first();

const tryFillVisible = ($scope: JQuery, formControlName: string, label: string): void => {
  const $input = $scope.find(`input[formcontrolname="${formControlName}"]`).first();
  if (!$input.length) return;
  if (Cypress.$($input[0]).closest('[hidden]').length > 0) return;
  if (!Cypress.$($input[0]).is(':visible')) return;

  const existing = (($input.val() as string) || '').trim();
  if (existing !== '') {
    cy.log(`ℹ️ ${label} มีค่า "${existing}" — ใช้ค่าเดิม`);
    return;
  }
  cy.wrap($input)
    .focus({ force: true }).clear({ force: true }).type(randomPriority(), { force: true, delay: 50 }).blur();
  cy.wait(300);
  cy.log(`✅ กรอก ${label} สำเร็จ`);
};

const updatePriorityInPanel = (): void => {
  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    tryFillVisible($pb, 'internetExceedRatePriority', 'Internet Exceed Rate Priority');
    tryFillVisible($pb, 'internetThrottlingSpeedPriority', 'Internet Throttling Speed Priority');
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $innerEditBtn = $pb
      .find('table')
      .filter((_i, el) => Cypress.$(el).is(':visible'))
      .find('tbody tr')
      .filter((_i, el) => {
        const $tr = Cypress.$(el);
        return $tr.is(':visible') && $tr.find('td[colspan]').length === 0;
      })
      .first()
      .find('button.btn-warning')
      .filter((_i, el) => Cypress.$(el).is(':visible'))
      .first();

    if ($innerEditBtn.length) {
      cy.wrap($innerEditBtn).scrollIntoView().click({ force: true });
      cy.wait(500);
    }
  });

  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $priorityInput = $pb.find('input[formcontrolname="priority"]').first();

    if ($priorityInput.length && Cypress.$($priorityInput[0]).closest('[hidden]').length === 0 && Cypress.$($priorityInput[0]).is(':visible')) {
      const existing = (($priorityInput.val() as string) || '').trim();
      if (existing === '') {
        cy.wrap($priorityInput).focus({ force: true }).clear({ force: true }).type(randomPriority(), { force: true, delay: 50 }).blur();
        cy.wait(300);
      }

      cy.then(() => {
        cy.get(INTERNET_COMPONENT).then(($comp2) => {
          const $pb2 = getInternetDetailPanelBody($comp2);
          const $pInput2 = $pb2.find('input[formcontrolname="priority"]').first();
          if (!$pInput2.length) return;

          const $subPanelBody = Cypress.$($pInput2[0]).closest('.panel-body');
          const $innerUpdateBtn = $subPanelBody.find('button').toArray().filter((el) =>
            /Update/i.test((el.textContent || '').trim()) && Cypress.$(el).is(':visible')
          );

          if ($innerUpdateBtn.length) {
            cy.wrap($innerUpdateBtn[0]).scrollIntoView().click({ force: true });
            cy.wait(600);
          }
        });
      });
    }
  });

  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;
    tryFillVisible($pb, 'fixedSpeedPriority', 'Fixed Speed Priority');
  });

  cy.get(INTERNET_COMPONENT).then(($comp) => {
    const $pb = getInternetDetailPanelBody($comp);
    if (!$pb.length) return;

    const $outerUpdateBtn = $pb.find('button').toArray().filter((el) => {
      const $el = Cypress.$(el);
      return /Update|Add/i.test((el.textContent || '').trim()) && $el.is(':visible') && $el.closest('.panel-body').is($pb[0]);
    });

    if ($outerUpdateBtn.length) {
      cy.wrap($outerUpdateBtn[0]).scrollIntoView().click({ force: true });
      cy.wait(800);
    }
  });
};

/**
 * Check and update priority in Internet tab
 */
export function checkAndUpdatePriority(): void {
  cy.log('🚀 checkAndUpdatePriority started');

  const safeClickCancel = (): void => {
    cy.get(INTERNET_COMPONENT).then(($comp) => {
      const $cancelBtns = $comp.find('button').toArray().filter((el) => {
        const text = (el.textContent || '').trim();
        return text === 'Cancel' && Cypress.$(el).is(':visible');
      });
      if ($cancelBtns.length > 0) {
        cy.wrap($cancelBtns[0]).scrollIntoView().click({ force: true });
        cy.wait(400);
      }
    });
  };

  const processRows = (rowIndex: number = 0): void => {
    cy.get(INTERNET_COMPONENT)
      .find('table')
      .filter((_i, el) => {
        const $el = Cypress.$(el);
        return $el.is(':visible') && $el.find('thead th').toArray().some((th) => th.textContent?.trim() === 'Quota Type');
      })
      .first()
      .should('be.visible')
      .find('tbody tr')
      .filter((_i, el) => {
        const text = Cypress.$(el).find('td').first().text().trim();
        return text.length > 0 && text !== 'No data to display.';
      })
      .then(($rows) => {
        if (rowIndex >= $rows.length) return;

        const $currentRow = $rows.eq(rowIndex);
        cy.wrap($currentRow).scrollIntoView();
        const quotaType = $currentRow.find('td').first().text().trim();

        if (!ALL_PRIORITY_QUOTA_TYPES.includes(quotaType)) {
          processRows(rowIndex + 1);
          return;
        }

        const $editBtn = $currentRow.find('button.btn-warning').filter((_i, el) => Cypress.$(el).is(':visible')).first();

        if (!$editBtn.length) {
          processRows(rowIndex + 1);
          return;
        }

        cy.wrap($editBtn).scrollIntoView().click({ force: true });

        cy.get(INTERNET_COMPONENT)
          .find('.h3-panel-header, .panel-heading h3')
          .filter((_i, el) => el.textContent?.replace(/\s+/g, ' ').trim() === 'Internet Detail')
          .closest('.panel')
          .find('> .panel-body')
          .should('be.visible', { timeout: 8000 })
          .then(() => {
            updatePriorityInPanel();
            cy.then(() => {
              safeClickCancel();
              processRows(rowIndex + 1);
            });
          });
      });
  };

  cy.get('body').then(($body) => {
    const $internetTab = $body.find('.scrollmenu > .nav a, .scrollmenu > .nav li a').filter((_i, el) => el.textContent?.trim() === 'Internet');

    if (!$internetTab.length) return;

    cy.wrap($internetTab.first()).scrollIntoView().click({ force: true });
    cy.wait(500);
    processRows(0);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL APP HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const VERTICAL_APP_COMPONENT = 'app-mass-enh-vertical-app';

/**
 * Check and update priority in Vertical App tab
 */
export function checkAndUpdateVerticalAppPriority(): void {
  cy.log('🚀 checkAndUpdateVerticalAppPriority started');

  const fillIfEmpty = ($input: JQuery<HTMLElement>, label: string, onFilled: () => void, onSkip: () => void): void => {
    cy.wrap($input).invoke('val').then((val) => {
      const isEmpty = !val || String(val).trim() === '';

      if (isEmpty) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        cy.wrap($input).scrollIntoView().focus({ force: true }).clear().type(randomNum.toString(), { delay: 150 }).blur();
        cy.wait(2000);
        onFilled();
      } else {
        onSkip();
      }
    });
  };

  const clickUpdateIfVisible = (afterUpdate: () => void): void => {
    cy.get(`${VERTICAL_APP_COMPONENT} .panel-body`).then(($panelBody) => {
      const $updateBtn = $panelBody.find('button.btn-success').filter((_i, btn) => {
        return btn.textContent?.trim() === 'Update' && Cypress.$(btn).closest('[hidden]').length === 0;
      });

      if ($updateBtn.length) {
        cy.wrap($updateBtn.first()).click({ force: true });
        cy.wait(3000);
      }
      afterUpdate();
    });
  };

  const clickCancel = (afterCancel: () => void): void => {
    cy.get(`${VERTICAL_APP_COMPONENT} .panel-body`).then(($panelBody) => {
      const $cancelBtn = $panelBody.find('button').filter((_i, btn) => {
        return btn.textContent?.trim() === 'Cancel' && Cypress.$(btn).closest('[hidden]').length === 0;
      });

      if ($cancelBtn.length) {
        cy.wrap($cancelBtn.first()).click({ force: true });
        cy.wait(1000);
      }
      afterCancel();
    });
  };

  const processRows = (rowIndex: number): void => {
    cy.get('body').then(($b) => {
      const $rows = $b.find(`${VERTICAL_APP_COMPONENT} table > tbody > tr`).filter((_i, tr) => {
        const text = Cypress.$(tr).find('td:first').text().trim();
        return text !== '' && !text.includes('No data to display');
      });

      if (rowIndex >= $rows.length) return;

      const $currentRow = $rows.eq(rowIndex);
      const $editBtn = $currentRow.find('button.btn-warning[title="Edit"]').first();

      if (!$editBtn.length || Cypress.$($editBtn).closest('[hidden]').length > 0) {
        processRows(rowIndex + 1);
        return;
      }

      cy.wrap($editBtn).click({ force: true });
      cy.wait(1500);

      cy.get(`${VERTICAL_APP_COMPONENT} .panel-body`).then(($panelBody) => {
        const $priorityInput = $panelBody.find('input[formcontrolname="priority"]').filter((_i, el) => {
          return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
        });

        const $throttlingInput = $panelBody.find('input[formcontrolname="throttlingSpeedPriority"]').filter((_i, el) => {
          return Cypress.$(el).closest('[hidden]').length === 0 && Cypress.$(el).is(':visible');
        });

        if (!$priorityInput.length && !$throttlingInput.length) {
          processRows(rowIndex + 1);
          return;
        }

        let needsUpdate = false;

        const finishRow = (): void => {
          if (needsUpdate) {
            clickUpdateIfVisible(() => processRows(rowIndex + 1));
          } else {
            clickCancel(() => processRows(rowIndex + 1));
          }
        };

        const checkThrottlingThenFinish = (): void => {
          if ($throttlingInput.length) {
            fillIfEmpty($throttlingInput.first(), 'Throttling Speed Priority', () => { needsUpdate = true; finishRow(); }, () => finishRow());
          } else {
            finishRow();
          }
        };

        if ($priorityInput.length) {
          fillIfEmpty($priorityInput.first(), 'Priority', () => { needsUpdate = true; checkThrottlingThenFinish(); }, () => checkThrottlingThenFinish());
        } else {
          checkThrottlingThenFinish();
        }
      });
    });
  };

  cy.get('body').then(($body) => {
    const normalizeText = (text: string | null | undefined): string => (text ?? '').replace(/\s+/g, ' ').trim();
    const $allLinks = $body.find('ul.nav.nav-tabs li a, .scrollmenu > .nav a');
    const $tab = $allLinks.filter((_i, el) => normalizeText(el.textContent) === 'Vertical App');

    if (!$tab.length) return;

    cy.wrap($tab.first()).scrollIntoView().click({ force: true });
    cy.wait(1500);

    cy.get('body').then(($b) => {
      const $rows = $b.find(`${VERTICAL_APP_COMPONENT} table > tbody > tr`);
      if (!$rows.length) return;
      processRows(0);
    });
  });
}
