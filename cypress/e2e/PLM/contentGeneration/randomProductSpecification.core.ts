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
    // 'Voice',
    // 'SMS',
    // 'MMS',
    // 'Calling Melody',
    // 'Cloud Game',
    // 'AI IP Camera',
    // 'WiFi',
    // 'Karaoke',
    // 'VRBT',
    // 'Music Streaming',
    // 'Arcade',
    // 'TV Plus',
    // 'Youtube Premium',
    // 'Internet',
    // 'Vertical App',
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

      if (configQueue.includes('Voice')) { 
        cy.log('▶️ Voice()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'Voice').dblclick({ force: true });
          });
      }
      if (configQueue.includes('SMS')) { 
        cy.log('▶️ Sms()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'SMS').dblclick({ force: true });
          });
      }
      if (configQueue.includes('MMS')) { 
        cy.log('▶️ Mms()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'MMS').dblclick({ force: true });
          });
      }
      if (configQueue.includes('Internet')) { 
        cy.log('▶️ InternetRandom()'); 
        InternetRandom(productClass, subModule, Module); 
      }
      if (configQueue.includes('Vertical App')) { 
        cy.log('▶️ VerticalApp()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'Vertical App').dblclick({ force: true });
          });
      }
      if (configQueue.includes('Cloud Game')) { 
        cy.log('▶️ CloudGame()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'Cloud Game').dblclick({ force: true });
          });
      }
      if (configQueue.includes('AI IP Camera')) { 
        cy.log('▶️ AIIPCamera()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'AI IP Camera').dblclick({ force: true });
          });
      }
      if (configQueue.includes('WiFi')) { 
        cy.log('▶️ WiFi()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'WiFi').dblclick({ force: true });
          });
      }
      if (configQueue.includes('Karaoke')) { 
        cy.log('▶️ Karaoke()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'Karaoke').dblclick({ force: true });
          });
      }
      if (configQueue.includes('VRBT')) { 
        cy.log('▶️ VRBT()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'VRBT').dblclick({ force: true });
          });
      }
      if (configQueue.includes('Music Streaming')) { 
        cy.log('▶️ MusicStreaming()'); 
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            cy.get('select[formcontrolname="availableListBox"]').first().contains('option', 'Music Streaming').dblclick({ force: true });
          });
      }

      const entItems = configQueue.filter(i => ['Arcade', 'TV Plus', 'Youtube Premium'].includes(i));
      if (entItems.length > 0) {
        cy.log(`▶️ EntertainmentPartnership(${entItems.join(', ')})`);
        cy.contains('.panel-heading', '*Product Specification')
          .closest('.panel')
          .within(() => {
            entItems.forEach(item => {
              cy.get('select[formcontrolname="availableListBox"]').first().contains('option', item).dblclick({ force: true });
            });
          });
      }
    });
  });
};


