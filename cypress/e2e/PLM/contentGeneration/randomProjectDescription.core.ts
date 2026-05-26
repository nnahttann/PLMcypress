// ========================
// RANDOM ProjectDescription
// ========================

export const RandomProjectDescription = (
  projectName: string,
  poName?: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  // ===== HELPER FUNCTIONS =====
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const WAIT_TIME = 2000;
  const MAX_DESC_LENGTH = 2000; // จำกัดความยาวตามที่ระบบรับได้จริง

  const scrollToElement = (selector: string, sectionName: string) => {
    cy.log(`📌 Scrolling to: ${sectionName}`);
    cy.get(selector).first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(600);
  };

  // ===== REALISTIC DATA CONFIGURATION =====

  const priceByData: Record<string, { min: number; max: number }> = {
    '5GB': { min: 99, max: 199 }, '10GB': { min: 199, max: 399 },
    '15GB': { min: 299, max: 499 }, '30GB': { min: 399, max: 699 },
    '50GB': { min: 599, max: 999 }, '100GB': { min: 899, max: 1499 },
    '150GB': { min: 1199, max: 1999 }, '200GB': { min: 1499, max: 2499 },
    'Unlimited': { min: 1999, max: 3999 }
  };

  const speedByNetwork: Record<string, string[]> = {
    '4G': ['10 Mbps', '25 Mbps', '50 Mbps', '100 Mbps'],
    '5G-Standard': ['100 Mbps', '300 Mbps', '500 Mbps'],
    '5G-Premium': ['500 Mbps', '1 Gbps', '2 Gbps']
  };

  const targetSegments: Record<string, { min: number; max: number; labelEN: string; labelTH: string; descEN: string; descTH: string }> = {
    'Youth': {
      min: 18, max: 25,
      labelEN: 'Youth (18-25)', labelTH: 'วัยรุ่น (18-25 ปี)',
      descEN: 'digital-native users who prioritize social media, streaming, and gaming',
      descTH: 'ผู้ใช้เจนเนอเรชันดิจิทัลที่ให้ความสำคัญกับโซเชียลมีเดีย สตรีมมิ่ง และเกม'
    },
    'YoungPro': {
      min: 22, max: 35,
      labelEN: 'Young Professionals (22-35)', labelTH: 'วัยทำงานต้น (22-35 ปี)',
      descEN: 'career-focused individuals needing reliable connectivity for work and lifestyle',
      descTH: 'คนทำงานที่เน้นการเชื่อมต่อที่เชื่อถือได้สำหรับงานและไลฟ์สไตล์'
    },
    'Family': {
      min: 30, max: 50,
      labelEN: 'Families (30-50)', labelTH: 'ครอบครัว (30-50 ปี)',
      descEN: 'households seeking shared data plans and parental control features',
      descTH: 'ครัวเรือนที่ต้องการแพ็กเกจแชร์เน็ตและฟีเจอร์ควบคุมโดยผู้ปกครอง'
    },
    'Mass': {
      min: 18, max: 60,
      labelEN: 'Mass Market (18-60)', labelTH: 'ตลาดทั่วไป (18-60 ปี)',
      descEN: 'broad consumer base looking for balanced value and performance',
      descTH: 'กลุ่มผู้บริโภคทั่วไปที่มองหาความคุ้มค่าและประสิทธิภาพที่สมดุล'
    }
  };

  const getRealisticLaunchQuarter = (): string => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    if (Math.random() < 0.7) {
      const possibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => parseInt(q[1]) >= currentQuarter);
      return pickRandom(possibleQuarters.length > 0 ? possibleQuarters : ['Q1']) + ' ' + currentYear;
    }
    return pickRandom(['Q1', 'Q2', 'Q3', 'Q4']) + ' ' + (currentYear + 1);
  };

  const getContractTerms = (subMod: string, pClass: string): number[] => {
    if (subMod === 'PRE') return [1];
    if (pClass === 'ontop' || pClass === 'ontopextra') return [1, 3, 6];
    return [1, 3, 6, 12, 24];
  };

  // ==================== MAIN LOGIC ====================
  cy.get('body').then(($body: any) => {
    if ($body.find('textarea[formcontrolname="projectDescription"]').length > 0) {
      scrollToElement('textarea[formcontrolname="projectDescription"]', 'Project Description');

      const shouldFill = Math.random() < 0.9; // 90% กรอก

      if (shouldFill) {
        // ===== USE INPUTS OR DEFAULTS =====
        const pName = projectName || 'New Package';
        const pOName = poName || 'Product Offering';
        const pType = priceType || 'recurring';
        const pClass = productClass || 'main';
        const sModule = subModule || 'POST';
        const mod = module || 'MOB';

        // ===== DISPLAY MAPPINGS =====
        const priceTypeDisplay: Record<string, { EN: string; TH: string }> = {
          'onetime': { EN: 'One-Time Charge', TH: 'ชำระครั้งเดียว' },
          'recurring': { EN: 'Monthly Recurring', TH: 'รายเดือน' },
          'usage': { EN: 'Usage-Based', TH: 'ตามการใช้งาน' }
        };
        const ptDisplay = priceTypeDisplay[pType] || { EN: pType, TH: pType };

        const productClassDisplay: Record<string, { EN: string; TH: string }> = {
          'main': { EN: 'Main Package', TH: 'แพ็กเกจหลัก' },
          'ontop': { EN: 'On-Top Add-on', TH: 'แพ็กเกจเสริม' },
          'ontopextra': { EN: 'On-Top Extra', TH: 'แพ็กเกจเสริมพิเศษ' }
        };
        const pcDisplay = productClassDisplay[pClass] || { EN: pClass, TH: pClass };

        const moduleDisplay: Record<string, { EN: string; TH: string }> = {
          'MOB': { EN: 'Mobile Service', TH: 'บริการมือถือ' },
          'ENTER': { EN: 'Entertainment', TH: 'ความบันเทิง' },
          'MUSIC': { EN: 'Music Streaming', TH: 'สตรีมมิ่งเพลง' },
          'FIXED': { EN: 'Fixed Broadband', TH: 'อินเทอร์เน็ตบ้าน' }
        };
        const modDisplay = moduleDisplay[mod] || { EN: mod, TH: mod };

        const subModuleDisplay: Record<string, { EN: string; TH: string }> = {
          'PRE': { EN: 'Prepaid', TH: 'เติมเงิน' },
          'POST': { EN: 'Postpaid', TH: 'รายเดือน' }
        };
        const smDisplay = subModuleDisplay[sModule] || { EN: sModule, TH: sModule };

        // ===== GENERATE REALISTIC VALUES =====
        const selectedData = pickRandom(Object.keys(priceByData));
        const priceRange = priceByData[selectedData];
        const priceMultiplier = pClass === 'main' ? 1 : (pClass === 'ontop' ? 0.5 : 0.3);
        const priceAmount = randomInt(
          Math.ceil(priceRange.min * priceMultiplier),
          Math.floor(priceRange.max * priceMultiplier)
        );

        const networkType = mod === 'MOB' && pClass === 'main' && Math.random() < 0.8
          ? pickRandom(['5G-Standard', '5G-Premium']) : '4G';
        const maxSpeed = pickRandom(speedByNetwork[networkType]);

        const validContracts = getContractTerms(sModule, pClass);
        const contractMonths = pickRandom(validContracts);

        const segmentKey = pickRandom(Object.keys(targetSegments));
        const segment = targetSegments[segmentKey];

        const validityDays = sModule === 'PRE' ? pickRandom([1, 7, 15, 30]) : pickRandom([30, 90, 180, 365]);
        const launchTiming = getRealisticLaunchQuarter();

        // ===== BENEFITS BY PACKAGE CLASS =====
        const benefits = {
          main: {
            EN: ['5G network access', 'unlimited on-net calls', 'rollover data', 'priority support', 'device installment options'],
            TH: ['ใช้งานเครือข่าย 5G', 'โทรฟรีในเครือข่ายไม่จำกัด', 'ยกยอดเน็ตได้', 'บริการลูกค้าพิเศษ', 'ตัวเลือกผ่อนชำระอุปกรณ์']
          },
          ontop: {
            EN: ['streaming app subscription', 'cloud storage bonus', 'international data add-on', 'family sharing'],
            TH: ['สมัครสตรีมมิ่งแอป', 'เพิ่มพื้นที่คลาวด์', 'แพ็กเกจเน็ตต่างประเทศ', 'แชร์ให้สมาชิกในครอบครัว']
          }
        };
        const benefitList = benefits[pClass === 'main' ? 'main' : 'ontop'];
        const benefit1EN = pickRandom(benefitList.EN);
        const benefit1TH = pickRandom(benefitList.TH);
        const benefit2EN = pickRandom(benefitList.EN.filter(b => b !== benefit1EN));
        const benefit2TH = pickRandom(benefitList.TH.filter(b => b !== benefit1TH));

        // ===== DESCRIPTION POOLS =====
        const descPools = {
          short: {
            EN: [
              `${pName} is a ${pcDisplay.EN.toLowerCase()} for ${modDisplay.EN.toLowerCase()} (${smDisplay.EN}), offering ${selectedData} of high-speed data at up to ${maxSpeed} on ${networkType} networks. Priced at ${priceAmount} THB/${pType === 'recurring' ? 'month' : 'activation'} with ${contractMonths}-month term.`,
              `${pName}: ${selectedData} ${modDisplay.EN.toLowerCase()} data package with ${maxSpeed} speeds. ${ptDisplay.EN} billing at ${priceAmount} THB. Designed for ${segment.labelEN}. Includes ${benefit1EN}.`,
              `${pcDisplay.EN} ${pName} delivers ${selectedData} data @ ${maxSpeed} on ${networkType}. Target: ${segment.labelEN}. Launch: ${launchTiming}. PO: ${pOName}.`,
            ],
            TH: [
              `${pName} เป็น${pcDisplay.TH.toLowerCase()}สำหรับ${modDisplay.TH.toLowerCase()} (${smDisplay.TH}) มอบเน็ตความเร็วสูง ${selectedData} ที่ความเร็วสูงสุด ${maxSpeed} บนเครือข่าย ${networkType} ราคา ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'เปิดใช้'} สัญญา ${contractMonths} เดือน`,
              `${pName}: แพ็กเกจ${modDisplay.TH}เน็ต ${selectedData} ความเร็ว ${maxSpeed} ${ptDisplay.TH} ${priceAmount} บาท ออกแบบสำหรับ${segment.labelTH} รวม${benefit1TH}`,
              `${pcDisplay.TH} ${pName} มอบเน็ต ${selectedData} @ ${maxSpeed} บน${networkType} กลุ่มเป้าหมาย: ${segment.labelTH} เปิดตัว: ${launchTiming} PO: ${pOName}`,
            ],
          },

          medium: {
            EN: [
              `${pName} is a ${smDisplay.EN} ${pcDisplay.EN} for ${modDisplay.EN} customers. The package includes ${selectedData} of high-speed data with maximum speeds of ${maxSpeed} on our ${networkType} network, unlimited on-net voice calls, and standard SMS allowance. Priced at ${priceAmount} THB per ${pType === 'recurring' ? 'month' : 'activation'} (${ptDisplay.EN}, VAT inclusive) with a ${contractMonths}-month contract term. Auto-renewal is ${sModule === 'POST' ? 'enabled' : 'not applicable'}. This offering targets ${segment.labelEN}, ${segment.descEN}. Key features include ${benefit1EN} and ${benefit2EN}. Commercial launch is targeted for ${launchTiming}.`,

              `${pName} delivers exceptional value for ${segment.labelEN}. Subscribers receive ${selectedData} of 5G-ready data at ${maxSpeed}, enabling seamless streaming, browsing, and connectivity. The ${ptDisplay.EN} pricing model at ${priceAmount} THB ensures predictable billing. Package validity is ${validityDays} days with ${contractMonths}-month commitment. Additional benefits: ${benefit1EN}, ${benefit2EN}. PO Reference: ${pOName}.`,
            ],
            TH: [
              `${pName} เป็น${pcDisplay.TH}${smDisplay.TH}สำหรับลูกค้า${modDisplay.TH} แพ็กเกจรวมเน็ตความเร็วสูง ${selectedData} ความเร็วสูงสุด ${maxSpeed} บนเครือข่าย ${networkType} โทรฟรีในเครือข่ายไม่จำกัด และสิทธิ์ SMS มาตรฐาน ราคา ${priceAmount} บาทต่อ${pType === 'recurring' ? 'เดือน' : 'การเปิดใช้'} (${ptDisplay.TH} รวม VAT) สัญญา ${contractMonths} เดือน ${sModule === 'POST' ? 'ต่ออายุอัตโนมัติ' : 'ไม่มีการต่ออายุ'} ข้อเสนอนี้มุ่งเป้า${segment.labelTH} ${segment.descTH} คุณสมบัติหลักได้แก่ ${benefit1TH} และ ${benefit2TH} คาดการณ์เปิดตัวเชิงพาณิชย์ ${launchTiming}`,

              `${pName} มอบความคุ้มค่าที่ยอดเยี่ยมสำหรับ${segment.labelTH} สมาชิกได้รับเน็ตพร้อม 5G ${selectedData} ที่ความเร็ว ${maxSpeed} สนับสนุนการสตรีม ท่องเว็บ และการเชื่อมต่อที่ราบรื่น รูปแบบราคา${ptDisplay.TH}ที่ ${priceAmount} บาท ช่วยให้คาดการณ์ค่าใช้จ่ายได้ แพ็กเกจมีอายุ ${validityDays} วัน ผูกพันสัญญา ${contractMonths} เดือน สิทธิประโยชน์เพิ่มเติม: ${benefit1TH}, ${benefit2TH} PO อ้างอิง: ${pOName}`,
            ],
          },

          long: {
            EN: [
              `${pName} - Product Offering Description\n` +
              `══════════════════════════════════════\n` +
              `Category: ${modDisplay.EN} > ${pcDisplay.EN} (${smDisplay.EN})\n` +
              `Data Allowance: ${selectedData} high-speed data, throttled to 128 Kbps thereafter\n` +
              `Network: ${networkType} with speeds up to ${maxSpeed} (where available)\n` +
              `Voice/SMS: Unlimited on-net calls, standard SMS allowance included\n` +
              `Pricing: ${priceAmount} THB/${pType === 'recurring' ? 'month' : 'activation'} (${ptDisplay.EN}, VAT inclusive)\n` +
              `Contract: ${contractMonths} month${contractMonths > 1 ? 's' : ''} | Auto-renewal: ${sModule === 'POST' ? 'Yes' : 'N/A'}\n` +
              `Validity: ${validityDays} days from activation\n` +
              `──────────────────────────────────────\n` +
              `Target Market: ${segment.labelEN}\n` +
              `  • Demographic: Age ${segment.min}-${segment.max}\n` +
              `  • Profile: ${segment.descEN}\n` +
              `Key Benefits:\n` +
              `  • ${benefit1EN}\n` +
              `  • ${benefit2EN}\n` +
              `  • Nationwide coverage with ${networkType} priority\n` +
              `Commercial Timeline:\n` +
              `  • Launch Target: ${launchTiming}\n` +
              `  • Subscriber Goal: First 90 days\n` +
              `System Integration:\n` +
              `  • PO Reference: ${pOName}\n` +
              `  • Product Code: PKG-${mod.toUpperCase()}-${sModule}-${pClass}\n` +
              `  • Billing Integration: CBS/CRM ready\n` +
              `Status: Configuration Complete | Pending Commercial Approval`,

              `${pName} represents a strategic ${pcDisplay.EN.toLowerCase()} offering within our ${modDisplay.EN} portfolio, designed to address the connectivity needs of ${segment.labelEN.toLowerCase()}. ${segment.descEN.charAt(0).toUpperCase() + segment.descEN.slice(1)}.\n\n` +
              `Technical Specifications:\n` +
              `• Data: ${selectedData} at ${maxSpeed} on ${networkType} network\n` +
              `• Post-limit speed: 128 Kbps for continued basic connectivity\n` +
              `• Voice: Unlimited calls to same-network numbers\n` +
              `• SMS: Standard monthly allowance\n` +
              `• 5G Access: ${networkType.includes('5G') ? 'Included where available' : '4G LTE standard'}\n\n` +
              `Commercial Structure:\n` +
              `• Price: ${priceAmount} THB/${pType === 'recurring' ? 'month' : 'activation'} (${ptDisplay.EN})\n` +
              `• Contract Term: ${contractMonths} month${contractMonths > 1 ? 's' : ''}\n` +
              `• Auto-renewal: ${sModule === 'POST' ? 'Enabled with 7-day grace period' : 'Not applicable (prepaid)'}\n` +
              `• Early termination: ${contractMonths > 1 ? 'Pro-rated fee applies' : 'N/A'}\n\n` +
              `Value Proposition:\n` +
              `• ${benefit1EN.charAt(0).toUpperCase() + benefit1EN.slice(1)}\n` +
              `• ${benefit2EN.charAt(0).toUpperCase() + benefit2EN.slice(1)}\n` +
              `• Predictable billing with no hidden charges\n` +
              `• Seamless migration path for existing customers\n\n` +
              `Go-to-Market: Target launch ${launchTiming} via ${pickRandom(['digital channels', 'all retail + digital', 'online exclusive'])}. PO Reference: ${pOName}.`,
            ],
            TH: [
              `${pName} - รายละเอียดผลิตภัณฑ์\n` +
              `══════════════════════════════════════\n` +
              `ประเภท: ${modDisplay.TH} > ${pcDisplay.TH} (${smDisplay.TH})\n` +
              `ปริมาณเน็ต: ${selectedData} ความเร็วสูง (ลดความเร็วเหลือ 128 Kbps หลังครบ)\n` +
              `เครือข่าย: ${networkType} ความเร็วสูงสุด ${maxSpeed} (ในพื้นที่รองรับ)\n` +
              `โทร/SMS: โทรฟรีในเครือข่ายไม่จำกัด รวมสิทธิ์ SMS มาตรฐาน\n` +
              `ราคา: ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'เปิดใช้'} (${ptDisplay.TH} รวม VAT)\n` +
              `สัญญา: ${contractMonths} เดือน | ต่ออายุอัตโนมัติ: ${sModule === 'POST' ? 'ใช่' : 'ไม่เกี่ยวข้อง'}\n` +
              `อายุแพ็กเกจ: ${validityDays} วันนับจากเปิดใช้\n` +
              `──────────────────────────────────────\n` +
              `กลุ่มเป้าหมาย: ${segment.labelTH}\n` +
              `  • ประชากร: อายุ ${segment.min}-${segment.max} ปี\n` +
              `  • โปรไฟล์: ${segment.descTH}\n` +
              `สิทธิประโยชน์หลัก:\n` +
              `  • ${benefit1TH}\n` +
              `  • ${benefit2TH}\n` +
              `  • ครอบคลุมทั่วประเทศด้วยความสำคัญเครือข่าย ${networkType}\n` +
              `แผนเชิงพาณิชย์:\n` +
              `  • เป้าหมายเปิดตัว: ${launchTiming}\n` +
              `  • เป้าหมายสมาชิก: 90 วันแรก\n` +
              `การเชื่อมต่อระบบ:\n` +
              `  • PO อ้างอิง: ${pOName}\n` +
              `  • รหัสผลิตภัณฑ์: PKG-${mod.toUpperCase()}-${sModule}-${pClass}\n` +
              `  • การเชื่อมต่อระบบบิล: พร้อม CBS/CRM\n` +
              `สถานะ: กำหนดค่าเสร็จสิ้น | รออนุมัติเชิงพาณิชย์`,

              `${pName} เป็นข้อเสนอยุทธศาสตร์${pcDisplay.TH}ภายในพอร์ตโฟลิโอ${modDisplay.TH}ของเรา ออกแบบมาเพื่อตอบสนองความต้องการการเชื่อมต่อของ${segment.labelTH.toLowerCase()} ${segment.descTH}\n\n` +
              `ข้อกำหนดทางเทคนิค:\n` +
              `• เน็ต: ${selectedData} ที่ ${maxSpeed} บนเครือข่าย ${networkType}\n` +
              `• ความเร็วหลังครบ: 128 Kbps สำหรับการเชื่อมต่อพื้นฐานต่อเนื่อง\n` +
              `• โทร: ไม่จำกัดเบอร์ในเครือข่ายเดียวกัน\n` +
              `• SMS: สิทธิ์มาตรฐานรายเดือน\n` +
              `• การเข้าถึง 5G: ${networkType.includes('5G') ? 'รวมในพื้นที่รองรับ' : 'มาตรฐาน 4G LTE'}\n\n` +
              `โครงสร้างเชิงพาณิชย์:\n` +
              `• ราคา: ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'เปิดใช้'} (${ptDisplay.TH})\n` +
              `• ระยะสัญญา: ${contractMonths} เดือน\n` +
              `• ต่ออายุอัตโนมัติ: ${sModule === 'POST' ? 'เปิดใช้งานพร้อมระยะผ่อนผัน 7 วัน' : 'ไม่เกี่ยวข้อง (เติมเงิน)'}\n` +
              `• ยกเลิกก่อนกำหนด: ${contractMonths > 1 ? 'มีค่าธรรมเนียมตามสัดส่วน' : 'ไม่เกี่ยวข้อง'}\n\n` +
              `ข้อเสนอคุณค่า:\n` +
              `• ${benefit1TH.charAt(0).toUpperCase() + benefit1TH.slice(1)}\n` +
              `• ${benefit2TH.charAt(0).toUpperCase() + benefit2TH.slice(1)}\n` +
              `• การเรียกเก็บเงินที่คาดการณ์ได้โดยไม่มีค่าใช้จ่ายแอบแฝง\n` +
              `• เส้นทางย้ายแพ็กเกจที่ราบรื่นสำหรับลูกค้าเดิม\n\n` +
              `แผนออกสู่ตลาด: เป้าหมายเปิดตัว ${launchTiming} ผ่าน${pickRandom(['ช่องทางดิจิทัล', 'ทุกร้านค้า + ดิจิทัล', 'ออนไลน์เท่านั้น'])} PO อ้างอิง: ${pOName}`,
            ],
          },
        };

        // ===== SELECT LENGTH & LANGUAGE =====
        const lengthType = (() => {
          const rand = Math.random();
          if (rand < 0.20) return 'short';
          if (rand < 0.60) return 'medium';
          return 'long';
        })();

        const useThai = Math.random() < 0.4;

        // ===== BUILD DESCRIPTION =====
        let descriptionText = pickRandom(descPools[lengthType][useThai ? 'TH' : 'EN']);

        // Add PO reference (50% chance)
        if (pOName && Math.random() < 0.5) {
          const poLine = useThai ? `\n\nPO อ้างอิง: ${pOName}` : `\n\nPO Reference: ${pOName}`;
          descriptionText += poLine;
        }

        // Add product code
        const productCode = `PKG-${mod.toUpperCase()}-${sModule}-${pClass}-${randomInt(1000, 9999)}`;
        const codeLine = useThai ? `\nรหัส: ${productCode}` : `\nCode: ${productCode}`;
        if (Math.random() < 0.6) {
          descriptionText += codeLine;
        }

        // ===== FINAL TRUNCATION & INPUT =====
        if (descriptionText.length > MAX_DESC_LENGTH) {
          descriptionText = descriptionText.substring(0, MAX_DESC_LENGTH - 3) + '...';
        }

        cy.get('textarea[formcontrolname="projectDescription"]')
          .clear({ force: true })
          .type(descriptionText, { delay: 0, force: true });

        cy.log(`✅ Description: ${descriptionText.length}/${MAX_DESC_LENGTH} chars | ${useThai ? 'TH' : 'EN'} | ${lengthType}`);
      } else {
        cy.get('textarea[formcontrolname="projectDescription"]').clear({ force: true });
        cy.log('⏭️ Project Description skipped (10%)');
      }
      cy.wait(WAIT_TIME);
    }
  });
};
