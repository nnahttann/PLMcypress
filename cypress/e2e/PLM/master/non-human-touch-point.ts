const ALL_TOUCHPOINT_ABBRS = [
  'RM', 'ES RM', 'AIS SHOP', 'ASP', 'CC', 'DS', 'EVT', 'MT', 'TS', 'TWZ', 'SEL CH',
  'USSD', 'BANK', 'IVR', 'MOT', 'PCM', 'RLP', 'SFF', 'WS', 'MPAY', 'HTP', 'NHTP',
];

const PO_ID_RE = /(PO\d+\s+\d{3,4}\s+\d{3,4})\s*$/i;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * ลบ touch-point abbr ที่ต่อท้ายชื่อออกทั้งหมดในครั้งเดียว
 * (เดิมวนลบทีละ abbr ตามลำดับความยาว ทำให้ "RM ES RM EVT" ถูกลบไม่หมด เหลือ "RM ES")
 * ต้องมีช่องว่างนำหน้าทุก abbr เพื่อ match เป็น token เต็ม
 */
const stripTrailingAbbrs = (name: string): string => {
  const alt = [...ALL_TOUCHPOINT_ABBRS]
    .sort((a, b) => b.length - a.length)
    .map((a) => escapeRegExp(a).replace(/\s+/g, '\\s+'))
    .join('|');
  const re = new RegExp(`(?:\\s+(?:${alt}))+\\s*$`, 'i');
  return String(name ?? '').trim().replace(re, '').trim();
};

const resolveProductNameMaxLength = (): Cypress.Chainable<number> => {
  return cy.get('body').then(($body) => {
    const $input = $body.find('input[formcontrolname="productName"]').first();
    const counterText = $input.siblings('small').first().text().trim();
    const m = counterText.match(/(\d+)\s*\/\s*(\d+)/);

    if (m) {
      const max = Number(m[2]);
      if (Number.isFinite(max) && max > 0) return cy.wrap(max, { log: false });
    }

    const $specPanel = $body
      .find('h3')
      .filter((_, el) => /product\s*specification/i.test(el.textContent || ''))
      .first()
      .closest('.panel');

    const selectedSpecs = $specPanel
      .find('select[formcontrolname="selectedListBox"]')
      .first()
      .find('option')
      .map((_, o) => Cypress.$(o).text().trim())
      .get();

    const hasInternet = selectedSpecs.some((t) => /^internet$/i.test(t));
    return cy.wrap(hasInternet ? 40 : 100, { log: false });
  }) as unknown as Cypress.Chainable<number>;
};

const buildNameWithinLimit = (strippedName: string, abbr: string, maxLen: number): string => {
  const base = String(strippedName ?? '').trim().replace(/\s+/g, ' ');
  const tag = String(abbr ?? '').trim();
  const full = tag ? `${base} ${tag}` : base;
  if (full.length <= maxLen) return full;

  const idMatch = base.match(PO_ID_RE);
  const poId = idMatch ? idMatch[1].trim() : '';
  const head = idMatch ? base.slice(0, idMatch.index).trim() : base;
  const mustKeep = [poId, tag].filter(Boolean).join(' ');

  if (mustKeep.length >= maxLen) {
    return (poId || base).substring(0, maxLen).trimEnd();
  }

  const roomForHead = maxLen - mustKeep.length - (mustKeep ? 1 : 0);
  let trimmedHead = head.substring(0, Math.max(0, roomForHead)).trimEnd();
  if (trimmedHead.length && head.length > trimmedHead.length) {
    const ls = trimmedHead.lastIndexOf(' ');
    if (ls > roomForHead * 0.5) trimmedHead = trimmedHead.substring(0, ls);
  }

  const out = [trimmedHead, mustKeep].filter(Boolean).join(' ').trim();
  return out.length > maxLen ? out.substring(0, maxLen).trimEnd() : out;
};

export const RandomNonHumanTouchPoint = (subModule?: string): void => {
  Cypress.env('hasUssdDirect', false);
  Cypress.env('hasUssdInteractive', false);
  Cypress.env('nonHumanTouchPointAbbr', '');

  cy.contains('.scrollmenu a', 'Selling Location & Channel', { timeout: 30000 })
    .scrollIntoView()
    .click({ force: true });

  cy.get('app-mass-mkt-non-human-touch-point', { timeout: 30000 })
    .first()
    .should('exist')
    .and('be.visible');

  const generateAccessNumber = (): string => {
    return '*' + Math.floor(Math.random() * 90000 + 10000) + '*#';
  };

  const USSD_CHANNELS = ['USSD Direct Specify', 'USSD Interactive Specify Menu'];

  const touchPointAbbrMap: Record<string, string> = {
    'USSD Direct Specify': 'USSD',
    'USSD Interactive Specify Menu': 'USSD',
    'Bank': 'BANK',
    'IVR IMEI Checking *212xxx': 'IVR',
    'IVR Specify Menu, Call Flow': 'IVR',
    'Mobile Online Tracking': 'MOT',
    'PCM/NGCM': 'PCM',
    'Rabbit Line Pay': 'RLP',
    'SFF Online Register': 'SFF',
    'Web Staff': 'WS',
    'mPay': 'MPAY'
  };

  type FieldGroup = 'ussd' | 'ivr' | 'none';
  const channelFieldMap: Record<string, FieldGroup> = {
    'USSD Direct Specify': 'ussd',
    'USSD Interactive Specify Menu': 'ussd',
    'IVR IMEI Checking *212xxx': 'ivr',
    'IVR Specify Menu, Call Flow': 'ivr',
  };

  // ── helpers ────────────────────────────────────────────────────────────────

  /** รอจนฟอร์ม Edit เปิดจริง (เห็นปุ่ม Update) แทน cy.wait(500) แบบเดา */
  const waitForEditFormOpen = (): void => {
    cy.get('button:visible', { timeout: 10000, withinSubject: null }).should(($btns) => {
      const has = $btns.toArray().some((el) => (el.textContent || '').trim() === 'Update');
      expect(has, 'ฟอร์ม Edit ต้องแสดงปุ่ม Update').to.equal(true);
    });
  };

  /** รอจนฟอร์ม Edit ปิด (ปุ่ม Update หาย) — ถ้าไม่ปิดแปลว่า Update ไม่สำเร็จ เช่น validation ไม่ผ่าน */
  const waitForEditFormClosed = (): void => {
    cy.get('body', { withinSubject: null, timeout: 10000 }).should(($body) => {
      const stillOpen = $body
        .find('button:visible')
        .toArray()
        .some((el) => (el.textContent || '').trim() === 'Update');
      expect(stillOpen, 'ฟอร์ม Edit ควรปิดหลังกด Update (ถ้ายังเปิดอยู่ ค่าอาจไม่ถูกบันทึก)').to.equal(false);
    });
  };

  /** ช่องที่ "ต้องมี" — retry จนเจอ, type, แล้วยืนยันว่าค่าเข้าจริง ไม่เจอ = fail */
  const typeRequired = (selector: string, value: string): void => {
    cy.get(`${selector}:visible`, { timeout: 10000, withinSubject: null })
      .first()
      .clear({ force: true })
      .type(value, { force: true })
      .should('have.value', value);
  };

  /** ช่องที่ "อาจไม่มี" — ถ้าไม่เจอให้ log เตือน (ไม่ข้ามเงียบ) */
  const typeIfVisible = (selector: string, value: string): void => {
    cy.document({ log: false }).then((doc) => {
      const $el = Cypress.$(selector, doc).filter(':visible');
      if ($el.length === 0) {
        cy.log(`⚠️ ไม่พบช่อง ${selector} — ข้าม`);
        return;
      }
      cy.wrap($el.first()).clear({ force: true }).type(value, { force: true });
    });
  };

  const clickUpdateButton = (): void => {
    cy.get('button:visible', { timeout: 10000, withinSubject: null })
      .filter((_, el) => (el.textContent || '').trim() === 'Update')
      .first()
      .should('not.be.disabled')
      .click({ force: true });
  };

  const fillChannelFields = (channelName: string): void => {
    const group: FieldGroup = channelFieldMap[channelName] || 'none';
    if (group === 'none') return;

    const sub = generateAccessNumber();
    let unsub = generateAccessNumber();
    while (unsub === sub) unsub = generateAccessNumber();

    if (group === 'ussd') {
      // USSD ต้องมีเลขเสมอ — ไม่เจอช่อง/ค่าไม่เข้า = fail
      typeRequired('input[formcontrolname="subscribeAccessNumber"]', sub);
      typeRequired('input[formcontrolname="unsubscribeAccessNumber"]', unsub);
    } else {
      // IVR: ทำแบบเดิม (ถ้ามีช่องก็ใส่) แต่ log เตือนถ้าไม่เจอ
      typeIfVisible('input[formcontrolname="subscribeAccessNumber"]', sub);
      typeIfVisible('input[formcontrolname="unsubscribeAccessNumber"]', unsub);
    }
    cy.log(`📞 ${channelName}: subscribe=${sub} | unsubscribe=${unsub}`);
  };

  // ── 1) สุ่มเลือก touch point ────────────────────────────────────────────────

  let finalSelection: string[] = [];
  let touchPointAbbr = '';

  cy.get('app-mass-mkt-non-human-touch-point').first().within(() => {
    cy.get('select[formcontrolname="availableListBox"]', { timeout: 20000 })
      .first()
      .find('option')
      .then($options => {
        const all = Array.from($options).map(o => o.innerText.trim()).filter(t => t !== '');
        const target = USSD_CHANNELS.filter(t => all.indexOf(t) !== -1);
        let mandatorySelection: string[] = [];

        if (target.length === 0) {
          mandatorySelection = Cypress._.sampleSize(all, Math.min(2, all.length));
        } else if (target.length >= 2) {
          mandatorySelection = Cypress._.random(0, 1) === 1 ? [...target] : [Cypress._.sample(target) || ''];
        } else {
          mandatorySelection = [...target];
        }

        Cypress.env('hasUssdDirect', mandatorySelection.indexOf('USSD Direct Specify') !== -1);
        Cypress.env('hasUssdInteractive', mandatorySelection.indexOf('USSD Interactive Specify Menu') !== -1);

        const otherOptions = all.filter(opt => mandatorySelection.indexOf(opt) === -1);
        const extraCount = Math.min(Cypress._.random(0, 2), otherOptions.length);
        const extraSelection = Cypress._.sampleSize(otherOptions, extraCount);

        finalSelection = mandatorySelection.concat(extraSelection).filter(Boolean);

        const uniqueAbbr = [...new Set(finalSelection.map(item => touchPointAbbrMap[item]).filter(Boolean))];
        touchPointAbbr = uniqueAbbr.join(' ');
        if (!touchPointAbbr) touchPointAbbr = 'NHTP';
        Cypress.env('nonHumanTouchPointAbbr', touchPointAbbr);
      });
  });

  // ── 2) ปรับชื่อ PO ────────────────────────────────────────────────────────

  cy.then(() => {
    if (!touchPointAbbr) return;
    resolveProductNameMaxLength().then((maxLen) => {
      cy.get('input[formcontrolname="productName"]', { timeout: 20000 })
        .first()
        .should('be.visible')
        .invoke('val')
        .then(v => {
          const currentName = String(v ?? '');
          const strippedName = stripTrailingAbbrs(currentName);

          const prevAbbr = Cypress.env('touchPointAbbr') || '';
          const combinedAbbr = [prevAbbr, touchPointAbbr].filter(Boolean).join(' ');
          const newName = buildNameWithinLimit(strippedName, combinedAbbr, maxLen);

          cy.get('input[formcontrolname="productName"]')
            .first()
            .clear({ force: true })
            .type(newName, { force: true, delay: 0 })
            .should('have.value', newName)
            .blur();

          Cypress.env('currentPoName', newName);
          Cypress.env('poName', newName);
        });
    });
  });

  // ── 3) เลือก touch point เข้า dual list แล้ว Edit ทีละแถว ───────────────────

  cy.get('app-mass-mkt-non-human-touch-point').first().within(() => {
    cy.then(() => {
      if (finalSelection.length === 0) return;
      cy.get('select[formcontrolname="availableListBox"]').first().select(finalSelection, { force: true });
      cy.get('ng2-dual-list-box button.str').first().should('not.be.disabled').click({ force: true });
      cy.get('select[formcontrolname="selectedListBox"]').first().find('option').should('have.length.at.least', 1);
    });

    const processedChannels = new Set<string>();

    const editNextRow = (iter = 0): void => {
      if (iter > 25) throw new Error('❌ วน Edit แถว Non-Human Touch Point เกินรอบที่กำหนด');

      cy.get('table tbody tr.ng-star-inserted', { timeout: 30000 }).then($rows => {
        const rowsArray = Array.from($rows);
        const targetIdx = rowsArray.findIndex(row => {
          const text = Cypress.$(row).find('td').first().text().trim();
          return finalSelection.includes(text) && !processedChannels.has(text);
        });

        if (targetIdx === -1) {
          const missed = finalSelection.filter(c => !processedChannels.has(c));
          if (missed.length > 0) cy.log(`⚠️ ไม่พบแถวสำหรับ: ${missed.join(', ')}`);
          return;
        }

        const $target = Cypress.$(rowsArray[targetIdx]);
        const targetChannel = $target.find('td').first().text().trim();
        processedChannels.add(targetChannel);

        const $editBtn = $target.find('button[title="Edit"]');
        if ($editBtn.length === 0) {
          throw new Error(`❌ ไม่พบปุ่ม Edit ของแถว "${targetChannel}"`);
        }
        ($editBtn[0] as HTMLElement).click();

        waitForEditFormOpen();
        fillChannelFields(targetChannel);
        clickUpdateButton();
        waitForEditFormClosed();
        cy.wait(600);
        editNextRow(iter + 1);
      });
    };
    editNextRow();
  });
};