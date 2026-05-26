// ========================
// RANDOM REMARK
// ========================

export const RandomRemark = (
  projectName: string,
  poName: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  // ===== HELPER FUNCTIONS =====
  const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const pickMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  };
  const randomInt = (min: number, max: number): number =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const randomFloat = (min: number, max: number, decimals: number = 0): number =>
    parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

  const WAIT_TIME = 2000;
  const MAX_REMARK_LENGTH = 1000; // จำกัดความยาวตามระบบจริง

  const scrollToElement = (selector: string, sectionName: string) => {
    cy.log(`📌 Scrolling to: ${sectionName}`);
    cy.get(selector).first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
    cy.wait(600);
  };

  // ===== REALISTIC DATA CONFIGURATION =====

  // 💰 ราคาอ้างอิงตามปริมาณเน็ต (บาท/เดือน) - สมจริงตามตลาดไทย
  const priceByData: Record<string, { min: number; max: number }> = {
    '5GB': { min: 99, max: 199 },
    '10GB': { min: 199, max: 399 },
    '15GB': { min: 299, max: 499 },
    '30GB': { min: 399, max: 699 },
    '50GB': { min: 599, max: 999 },
    '100GB': { min: 899, max: 1499 },
    '150GB': { min: 1199, max: 1999 },
    '200GB': { min: 1499, max: 2499 },
    'Unlimited': { min: 1999, max: 3999 }
  };

  // 📶 ความเร็วตามประเภทเครือข่าย
  const speedByNetwork: Record<string, string[]> = {
    '4G': ['10 Mbps', '25 Mbps', '50 Mbps', '100 Mbps'],
    '5G-Standard': ['100 Mbps', '300 Mbps', '500 Mbps'],
    '5G-Premium': ['500 Mbps', '1 Gbps', '2 Gbps']
  };

  // 👥 กลุ่มเป้าหมายมาตรฐาน (อายุ)
  const targetSegments: Record<string, { min: number; max: number; labelEN: string; labelTH: string }> = {
    'Youth': { min: 18, max: 25, labelEN: 'Youth (18-25)', labelTH: 'วัยรุ่น (18-25 ปี)' },
    'YoungPro': { min: 22, max: 35, labelEN: 'Young Professionals (22-35)', labelTH: 'วัยทำงานต้น (22-35 ปี)' },
    'Family': { min: 30, max: 50, labelEN: 'Families (30-50)', labelTH: 'ครอบครัว (30-50 ปี)' },
    'Senior': { min: 55, max: 70, labelEN: 'Seniors (55+)', labelTH: 'ผู้สูงอายุ (55+ ปี)' },
    'Mass': { min: 18, max: 60, labelEN: 'Mass Market (18-60)', labelTH: 'ตลาดทั่วไป (18-60 ปี)' },
    'Student': { min: 18, max: 24, labelEN: 'Students (18-24)', labelTH: 'นักศึกษา (18-24 ปี)' },
    'SME': { min: 25, max: 55, labelEN: 'SME Owners (25-55)', labelTH: 'เจ้าของธุรกิจ (25-55 ปี)' }
  };

  // 📅 ไตรมาสที่สมเหตุสมผล (ไม่ย้อนอดีต)
  const getRealisticLaunchQuarter = (): string => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;

    // 70% เปิดตัวในอนาคตอันใกล้, 30% ไตรมาสถัดไปปีหน้า
    if (Math.random() < 0.7) {
      const year = currentYear;
      const possibleQuarters = ['Q1', 'Q2', 'Q3', 'Q4'].filter(q => {
        const qNum = parseInt(q[1]);
        return qNum >= currentQuarter;
      });
      return pickRandom(possibleQuarters.length > 0 ? possibleQuarters : ['Q1']) + ' ' + year;
    } else {
      return pickRandom(['Q1', 'Q2', 'Q3', 'Q4']) + ' ' + (currentYear + 1);
    }
  };

  // 🔄 ประเภทสัญญาตามระบบการชำระเงิน
  const getContractTerms = (subMod: string, pClass: string): number[] => {
    // เติมเงิน (PRE) = ไม่มีสัญญาหรือ 1 เดือน
    if (subMod === 'PRE') return [1];
    // แพ็กเกจเสริม = สัญญาสั้น
    if (pClass === 'ontop' || pClass === 'ontopextra') return [1, 3, 6];
    // แพ็กเกจหลัก รายเดือน = สัญญาปกติ
    return [1, 3, 6, 12, 24];
  };

  // 💡 สิทธิประโยชน์ที่สมจริงตามประเภทแพ็กเกจ
  const getBenefitsByClass = (pClass: string, isPrepaid: boolean): { EN: string[]; TH: string[] } => {
    const baseBenefits = {
      EN: ['5G Network Access', 'Unlimited On-net Calls', 'Rollover Data', 'Free SIM/eSIM'],
      TH: ['ใช้งานเครือข่าย 5G', 'โทรฟรีในเครือข่ายไม่จำกัด', 'ยกยอดเน็ตได้', 'ซิม/eSIM ฟรี']
    };

    if (pClass === 'main') {
      return {
        EN: [...baseBenefits.EN, 'Priority Customer Support', 'International Roaming Discount', 'Device Installment'],
        TH: [...baseBenefits.TH, 'บริการลูกค้าพิเศษ', 'ส่วนลดโรมมิ่งต่างประเทศ', 'ผ่อนชำระอุปกรณ์']
      };
    } else if (pClass === 'ontop') {
      return {
        EN: [...baseBenefits.EN, 'Streaming App Subscription', 'Cloud Storage Bonus'],
        TH: [...baseBenefits.TH, 'สมัครสตรีมมิ่งแอป', 'เพิ่มพื้นที่คลาวด์']
      };
    }
    return baseBenefits;
  };

  // ==================== MAIN LOGIC ====================
  cy.get('body').then(($body: any) => {
    if ($body.find('textarea[formcontrolname="remark"]').length > 0) {
      scrollToElement('textarea[formcontrolname="remark"]', 'Remark');

      const shouldFillRemark = Math.random() < 0.85; // 85% กรอก, 15% ว่าง

      if (shouldFillRemark) {
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
          'MOB': { EN: 'Mobile', TH: 'มือถือ' },
          'ENTER': { EN: 'Entertainment', TH: 'บันเทิง' },
          'MUSIC': { EN: 'Music', TH: 'เพลง' },
          'FIXED': { EN: 'Fixed Broadband', TH: 'อินเทอร์เน็ตบ้าน' }
        };
        const modDisplay = moduleDisplay[mod] || { EN: mod, TH: mod };

        const subModuleDisplay: Record<string, { EN: string; TH: string }> = {
          'PRE': { EN: 'Prepaid', TH: 'เติมเงิน' },
          'POST': { EN: 'Postpaid', TH: 'รายเดือน' }
        };
        const smDisplay = subModuleDisplay[sModule] || { EN: sModule, TH: sModule };

        // ===== GENERATE REALISTIC VALUES =====

        // 📊 ปริมาณเน็ต + ราคาที่สอดคล้องกัน
        const dataAllowanceKeys = Object.keys(priceByData);
        const selectedData = pickRandom(dataAllowanceKeys);
        const priceRange = priceByData[selectedData];

        // แพ็กเกจเสริมราคาถูกลง 30-60%
        const priceMultiplier = pClass === 'main' ? 1 : (pClass === 'ontop' ? 0.5 : 0.3);
        const priceAmount = randomInt(
          Math.ceil(priceRange.min * priceMultiplier),
          Math.floor(priceRange.max * priceMultiplier)
        );

        // 📶 ความเร็วตามเครือข่าย (ถ้าเป็นมือถือ)
        let networkType: string;
        if (mod === 'MOB') {
          // 80% เป็น 5G สำหรับแพ็กเกจหลัก, 4G สำหรับแพ็กเกจเสริม
          const is5GLikely = pClass === 'main' && Math.random() < 0.8;
          networkType = is5GLikely ? pickRandom(['5G-Standard', '5G-Premium']) : '4G';
        } else {
          networkType = '4G'; // บริการอื่นใช้ 4G เป็นพื้นฐาน
        }
        const speedTier = pickRandom(speedByNetwork[networkType]);

        // 📋 ระยะสัญญาตามประเภท
        const validContracts = getContractTerms(sModule, pClass);
        const contractMonths = pickRandom(validContracts);

        // 👥 กลุ่มเป้าหมาย
        const segmentKey = pickRandom(Object.keys(targetSegments));
        const segment = targetSegments[segmentKey];
        const targetAgeMin = segment.min;
        const targetAgeMax = segment.max;

        // 🎁 สิทธิประโยชน์
        const benefits = getBenefitsByClass(pClass, sModule === 'PRE');
        const benefit1EN = pickRandom(benefits.EN);
        const benefit1TH = pickRandom(benefits.TH);
        const benefit2EN = pickRandom(benefits.EN.filter(b => b !== benefit1EN));
        const benefit2TH = pickRandom(benefits.TH.filter(b => b !== benefit1TH));

        // 📅 วันที่และข้อมูลอ้างอิง
        const currentDate = new Date();
        const thaiDate = currentDate.toLocaleDateString('th-TH', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const engDate = currentDate.toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
        const currentTime = currentDate.toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        const isoDate = currentDate.toISOString().split('T')[0];
        const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
        const launchQuarter = getRealisticLaunchQuarter();
        const subscriberTarget = pickRandom(['5K', '10K', '25K', '50K', '100K']);
        const validityDays = sModule === 'PRE' ? pickRandom([1, 7, 15, 30]) : pickRandom([30, 90, 180, 365]);

        // ===== REMARK POOLS (Realistic Content) =====
        const remarkPools = {
          short: {
            EN: [
              `${pName}: ${pcDisplay.EN} for ${modDisplay.EN} (${smDisplay.EN}). ${selectedData} data @ ${speedTier}. Price: ${priceAmount} THB/${pType === 'recurring' ? 'mo' : 'time'}.`,
              `PO ${pOName}: ${pName} configured. ${ptDisplay.EN} billing, ${contractMonths}-mo term. Target: ${segment.labelEN}.`,
              `${pName} - ${selectedData} ${modDisplay.EN} data, ${speedTier} speed. ${benefit1EN}. Status: Draft.`,
              `Setup ${pName}: ${pcDisplay.EN} | ${smDisplay.EN} | ${priceAmount} THB | Launch: ${launchQuarter}.`,
              `${pName} ready for review. Data: ${selectedData}, Speed: ${speedTier}, Network: ${networkType}. Ref: ${randomId}.`,
            ],
            TH: [
              `${pName}: ${pcDisplay.TH} สำหรับ${modDisplay.TH} (${smDisplay.TH}) เน็ต ${selectedData} ความเร็ว ${speedTier} ราคา ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'ครั้ง'}`,
              `PO ${pOName}: กำหนดค่า ${pName} เรียบร้อย ${ptDisplay.TH} สัญญา ${contractMonths} เดือน กลุ่มเป้าหมาย: ${segment.labelTH}`,
              `${pName} - เน็ต ${selectedData} ${modDisplay.TH} ความเร็ว ${speedTier} ${benefit1TH} สถานะ: ฉบับร่าง`,
              `ตั้งค่า ${pName}: ${pcDisplay.TH} | ${smDisplay.TH} | ${priceAmount} บาท | เปิดตัว: ${launchQuarter}`,
              `${pName} พร้อมตรวจสอบ เน็ต: ${selectedData} ความเร็ว: ${speedTier} เครือข่าย: ${networkType} อ้างอิง: ${randomId}`,
            ],
          },

          medium: {
            EN: [
              `${pName} configuration: ${pcDisplay.EN} for ${modDisplay.EN} ${smDisplay.EN}. Includes ${selectedData} high-speed data at ${speedTier} on ${networkType} network. Priced at ${priceAmount} THB/${pType === 'recurring' ? 'month' : 'activation'} with ${contractMonths}-month term. Target segment: ${segment.labelEN}. Key benefit: ${benefit1EN}.`,

              `PO ${pOName} - ${pName}: ${selectedData} data allowance, ${speedTier} max speed, ${networkType} connectivity. ${ptDisplay.EN} billing model. Auto-renewal: ${sModule === 'POST' ? 'Enabled' : 'N/A'}. Validity: ${validityDays} days. Launch target: ${launchQuarter}. Subscriber goal: ${subscriberTarget}.`,

              `${pName} product setup complete. Package type: ${modDisplay.EN} ${pcDisplay.EN} (${smDisplay.EN}). Data: ${selectedData} @ ${speedTier}. Price: ${priceAmount} THB (${ptDisplay.EN}). Contract: ${contractMonths} months. Target: ${segment.labelEN}. Features: ${benefit1EN}, ${benefit2EN}. Status: Pending approval.`,
            ],
            TH: [
              `การกำหนดค่า ${pName}: ${pcDisplay.TH} สำหรับ${modDisplay.TH} ${smDisplay.TH} รวมเน็ตความเร็วสูง ${selectedData} ที่ความเร็ว ${speedTier} บนเครือข่าย ${networkType} ราคา ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'เปิดใช้'} สัญญา ${contractMonths} เดือน กลุ่มเป้าหมาย: ${segment.labelTH} สิทธิประโยชน์หลัก: ${benefit1TH}`,

              `PO ${pOName} - ${pName}: ปริมาณเน็ต ${selectedData} ความเร็วสูงสุด ${speedTier} การเชื่อมต่อ ${networkType} รูปแบบการเรียกเก็บ ${ptDisplay.TH} ต่ออายุอัตโนมัติ: ${sModule === 'POST' ? 'เปิดใช้งาน' : 'ไม่เกี่ยวข้อง'} อายุแพ็กเกจ: ${validityDays} วัน เป้าหมายเปิดตัว: ${launchQuarter} เป้าหมายสมาชิก: ${subscriberTarget}`,

              `ตั้งค่าผลิตภัณฑ์ ${pName} เรียบร้อย ประเภทแพ็กเกจ: ${modDisplay.TH} ${pcDisplay.TH} (${smDisplay.TH}) เน็ต: ${selectedData} @ ${speedTier} ราคา: ${priceAmount} บาท (${ptDisplay.TH}) สัญญา: ${contractMonths} เดือน กลุ่มเป้าหมาย: ${segment.labelTH} คุณสมบัติ: ${benefit1TH}, ${benefit2TH} สถานะ: รออนุมัติ`,
            ],
          },

          long: {
            EN: [
              `[${pName}] Product Configuration Summary\n` +
              `─────────────────────────────────\n` +
              `Package: ${pcDisplay.EN} | ${modDisplay.EN} | ${smDisplay.EN}\n` +
              `Data Allowance: ${selectedData} @ ${speedTier} (${networkType})\n` +
              `Pricing: ${priceAmount} THB/${pType === 'recurring' ? 'month' : 'time'} (${ptDisplay.EN})\n` +
              `Contract Term: ${contractMonths} month${contractMonths > 1 ? 's' : ''} | Auto-renewal: ${sModule === 'POST' ? 'Yes' : 'No'}\n` +
              `Target Segment: ${segment.labelEN} (Age ${targetAgeMin}-${targetAgeMax})\n` +
              `Key Features: ${benefit1EN} | ${benefit2EN}\n` +
              `Validity: ${validityDays} days | Launch: ${launchQuarter}\n` +
              `PO Reference: ${pOName} | Product ID: PKG-${mod}-${sModule}-${randomId}\n` +
              `Status: Draft | Created: ${engDate} ${currentTime}`,

              `${pName} - Complete Setup Details\n` +
              `═════════════════════════════════\n` +
              `• Category: ${modDisplay.EN} > ${pcDisplay.EN} (${smDisplay.EN})\n` +
              `• Data: ${selectedData} high-speed, throttled thereafter\n` +
              `• Speed: Up to ${speedTier} on ${networkType} network\n` +
              `• Voice/SMS: Standard allowance included\n` +
              `• Price: ${priceAmount} THB (${ptDisplay.EN}, VAT incl.)\n` +
              `• Term: ${contractMonths} month${contractMonths > 1 ? 's' : ''}, ${sModule === 'POST' ? 'auto-renew' : 'no contract'}\n` +
              `• Eligibility: ${segment.labelEN}, Credit check: ${sModule === 'POST' ? 'Required' : 'N/A'}\n` +
              `• Benefits: ${benefit1EN}, ${benefit2EN}\n` +
              `• Commercial: Launch ${launchQuarter}, Target ${subscriberTarget} subs\n` +
              `• System: PO:${pOName} | Ref:${randomId} | Created:${isoDate}`,
            ],
            TH: [
              `[${pName}] สรุปการกำหนดค่าผลิตภัณฑ์\n` +
              `─────────────────────────────────\n` +
              `แพ็กเกจ: ${pcDisplay.TH} | ${modDisplay.TH} | ${smDisplay.TH}\n` +
              `ปริมาณเน็ต: ${selectedData} @ ${speedTier} (${networkType})\n` +
              `ราคา: ${priceAmount} บาท/${pType === 'recurring' ? 'เดือน' : 'ครั้ง'} (${ptDisplay.TH})\n` +
              `ระยะสัญญา: ${contractMonths} เดือน | ต่ออายุอัตโนมัติ: ${sModule === 'POST' ? 'ใช่' : 'ไม่'}\n` +
              `กลุ่มเป้าหมาย: ${segment.labelTH} (อายุ ${targetAgeMin}-${targetAgeMax} ปี)\n` +
              `คุณสมบัติหลัก: ${benefit1TH} | ${benefit2TH}\n` +
              `อายุแพ็กเกจ: ${validityDays} วัน | เปิดตัว: ${launchQuarter}\n` +
              `PO อ้างอิง: ${pOName} | รหัสผลิตภัณฑ์: PKG-${mod}-${sModule}-${randomId}\n` +
              `สถานะ: ฉบับร่าง | สร้างเมื่อ: ${thaiDate}`,

              `${pName} - รายละเอียดการตั้งค่าครบถ้วน\n` +
              `═════════════════════════════════\n` +
              `• ประเภท: ${modDisplay.TH} > ${pcDisplay.TH} (${smDisplay.TH})\n` +
              `• เน็ต: ${selectedData} ความเร็วสูง (ลดความเร็วหลังครบ)\n` +
              `• ความเร็ว: สูงสุด ${speedTier} บนเครือข่าย ${networkType}\n` +
              `• โทร/SMS: รวมสิทธิ์มาตรฐาน\n` +
              `• ราคา: ${priceAmount} บาท (${ptDisplay.TH}, รวม VAT)\n` +
              `• สัญญา: ${contractMonths} เดือน, ${sModule === 'POST' ? 'ต่ออายุอัตโนมัติ' : 'ไม่มีสัญญา'}\n` +
              `• คุณสมบัติ: ${segment.labelTH}, ตรวจสอบเครดิต: ${sModule === 'POST' ? 'จำเป็น' : 'ไม่เกี่ยวข้อง'}\n` +
              `• สิทธิประโยชน์: ${benefit1TH}, ${benefit2TH}\n` +
              `• เชิงพาณิชย์: เปิดตัว ${launchQuarter} เป้าหมาย ${subscriberTarget} สมาชิก\n` +
              `• ระบบ: PO:${pOName} | อ้างอิง:${randomId} | สร้าง:${isoDate}`,
            ],
          },
        };

        // ===== METADATA POOLS (Realistic Combinations) =====
        const metadataPools = {
          devStatus: {
            EN: ['Draft', 'In Review', 'Pending Approval', 'Ready for UAT', 'Approved'],
            TH: ['ฉบับร่าง', 'อยู่ระหว่างตรวจสอบ', 'รออนุมัติ', 'พร้อมทดสอบ', 'อนุมัติแล้ว']
          },
          approval: {
            EN: ['Product: Pending', 'Pricing: Approved', 'Legal: Under Review', 'Compliance: Approved'],
            TH: ['ผลิตภัณฑ์: รอดำเนินการ', 'ราคา: อนุมัติแล้ว', 'กฎหมาย: ระหว่างตรวจสอบ', 'กำกับดูแล: อนุมัติแล้ว']
          },
          channel: {
            EN: ['Digital', 'All Channels', 'Retail + Digital', 'Online Exclusive'],
            TH: ['ดิจิทัล', 'ทุกช่องทาง', 'ร้านค้า + ดิจิทัล', 'ออนไลน์เท่านั้น']
          },
          credit: {
            EN: ['No Deposit', '1,000 THB', '3,000 THB', 'Credit Score 600+'],
            TH: ['ไม่ต้องวางประกัน', 'วางประกัน 1,000 บาท', 'วางประกัน 3,000 บาท', 'คะแนนเครดิต 600+']
          }
        };

        // ===== SELECT LENGTH & LANGUAGE =====
        const lengthType = (() => {
          const rand = Math.random();
          if (rand < 0.25) return 'short';
          if (rand < 0.70) return 'medium';
          return 'long';
        })();

        const useThai = Math.random() < 0.45; // 45% ไทย, 55% อังกฤษ

        // ===== BUILD REMARK TEXT =====
        let remarkText = pickRandom(remarkPools[lengthType][useThai ? 'TH' : 'EN']);

        // Add metadata (probability based on length)
        const addMetadataChance = lengthType === 'short' ? 0.4 : (lengthType === 'medium' ? 0.7 : 0.9);
        if (Math.random() < addMetadataChance) {
          const metaCount = lengthType === 'short' ? 1 : (lengthType === 'medium' ? 2 : 3);
          const metaLines: string[] = [];

          // สุ่มเลือก metadata ที่ไม่ซ้ำ
          const metaTypes = ['devStatus', 'approval', 'channel', 'credit'];
          const selectedTypes = pickMultiple(metaTypes, metaCount);

          selectedTypes.forEach(type => {
            const prefix = useThai ?
              ({ devStatus: 'สถานะ:', approval: 'อนุมัติ:', channel: 'ช่องทาง:', credit: 'เครดิต:' } as any)[type] :
              ({ devStatus: 'Status:', approval: 'Approval:', channel: 'Channel:', credit: 'Credit:' } as any)[type];
            const value = pickRandom(metadataPools[type as keyof typeof metadataPools][useThai ? 'TH' : 'EN']);
            metaLines.push(`${prefix} ${value}`);
          });

          const separator = lengthType === 'short' ? ' | ' : '\n  • ';
          const prefix = lengthType === 'short' ? ' | ' : (useThai ? '\n\nข้อมูลเพิ่มเติม:\n  • ' : '\n\nAdditional Info:\n  • ');
          remarkText += prefix + metaLines.join(separator);
        }

        // Add timestamp (30% chance for short, 60% for others)
        const addTimestampChance = lengthType === 'short' ? 0.3 : 0.6;
        if (Math.random() < addTimestampChance) {
          const ts = useThai ? `[บันทึก: ${thaiDate}]` : `[Recorded: ${engDate} ${currentTime}]`;
          remarkText += (lengthType === 'short' ? ' ' : '\n\n') + ts;
        }

        // ===== FINAL TRUNCATION & INPUT =====
        if (remarkText.length > MAX_REMARK_LENGTH) {
          remarkText = remarkText.substring(0, MAX_REMARK_LENGTH - 3) + '...';
        }

        cy.get('textarea[formcontrolname="remark"]')
          .clear({ force: true })
          .type(remarkText, { delay: 0, force: true });

        cy.log(`✅ Remark: ${remarkText.length}/${MAX_REMARK_LENGTH} chars | ${useThai ? 'TH' : 'EN'} | ${lengthType}`);
      } else {
        cy.get('textarea[formcontrolname="remark"]').clear({ force: true });
        cy.log('⏭️ Remark skipped (15%)');
      }
      cy.wait(WAIT_TIME);
    }
  });
};
