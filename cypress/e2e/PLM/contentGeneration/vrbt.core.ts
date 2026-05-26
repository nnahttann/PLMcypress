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
    .find('.mat-select-value-text, .mat-select-value')
    .should('not.contain', 'Please Select');
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
  // Submit form
  cy.get('app-mass-mkt-internet button.btn-primary')
    .filter(':visible')
    .each(($btn) => {
      const text = $btn.text().trim();
      if (text === 'Add') {
        cy.wrap($btn).scrollIntoView().click({ force: true });
      }
    });
};

