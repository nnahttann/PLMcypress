const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const buildPools = (p: string) => {

    // ── Random Value Injection ───────────────────────────────────────────────
    const price = pick(['99', '150', '299', '399', '499', '599', '799', '899', '1099', '1199']);
    const data = pick(['5GB', '10GB', '20GB', '50GB', '100GB', '200GB', 'Unlimited']);

    // ── Vocab atoms (EN) ─────────────────────────────────────────────────────
    const enTag = ['Plan', 'Pack', 'Package', 'Promo', 'Option', 'Service', '5G-Pass', 'HighSpeed', 'Unlimited', 'Streaming'];
    const enSuffix = ['Pro', 'Plus', 'Max', 'Smart', 'Standard', 'Value', '5G', 'Xtra'];
    const enAction = [
        'Subscribe to', 'Access services with',
        'Stay connected with', 'Available for you:',
        'You are now using', 'Service details for',
        'Use AIS 5G high-speed data with',
        'Internet and entertainment services via',
        'Streaming services including Disney+ and Netflix with'
    ];
    const enCheck = [
        'Check your current plan', 'Your active package',
        'Currently subscribed to', 'Active plan', 'Now using',
        'Status of', 'Plan details for', 'Review your'
    ];
    const enMkt = [
        'Special Offer', 'Best Value', 'Monthly Pack',
        'Limited Time', 'Recommended', '5G Package',
        'High-Speed Pack'
    ];
    const enDeact = ['deactivated', 'cancelled', 'unsubscribed from', 'ended'];
    const enClose = [
        'Thank you for using our service.',
        'We appreciate your trust.',
        'For more info, please contact support.',
        'Have a good day.'
    ];

    // ── Vocab atoms (TH) ─────────────────────────────────────────────────────
    const thTag = ['แผน', 'แพ็กเกจ', 'โปรโมชัน', 'บริการ', 'ทางเลือก', 'เน็ตแรง', 'ไฮสปีด', 'เน็ตไม่อั้น', 'สตรีมมิ่ง'];
    const thSuffix = ['โปร', 'พลัส', 'แม็กซ์', 'สมาร์ท', 'คุ้ม', '5G'];
    const thAction = [
        'สมัครใช้งาน', 'รับสิทธิ์จาก',
        'เชื่อมต่ออินเทอร์เน็ตกับ', 'ข้อมูลบริการจาก',
        'ใช้งาน AIS 5G ความเร็วสูงกับ',
        'ดู Disney+ และ Netflix ผ่าน',
        'เริ่มต้นการใช้งานกับ'
    ];
    const thCheck = [
        'ตรวจสอบแพ็กเกจปัจจุบัน', 'แพ็กเกจที่ใช้งานอยู่',
        'กำลังสมัครใช้งาน', 'แผนที่ใช้งาน', 'กำลังใช้',
        'เช็กสถานะของ', 'รายละเอียดแพ็กเกจ', 'ดูข้อมูลของ'
    ];
    const thClose = [
        'ขอบคุณที่ใช้บริการ', 'เป็นเกียรติที่ได้ให้บริการคุณ',
        'ขอบคุณที่ไว้วางใจบริการของเรา',
        'สอบถามข้อมูลเพิ่มเติมได้ที่คอลเซ็นเตอร์',
        'ขอให้มีความสุขกับการใช้งาน'
    ];

    // ── Fixed templates (longer messages keep structure) ─────────────────────
    const greetEN = [
        `Welcome to ${p}! Your subscription is now active.`,
        `Hi! You have successfully subscribed to ${p}.`,
        `${p} is now active on your number.`,
        `Thank you for choosing ${p}. You're all set!`,
        `${p} activation is complete. Ready to use.`,
    ];
    const greetTH = [
        `ยินดีต้อนรับสู่ ${p} แพ็กเกจของคุณเริ่มใช้งานได้แล้ว`,
        `สวัสดี คุณสมัคร ${p} สำเร็จเรียบร้อยแล้ว`,
        `${p} เปิดใช้งานแล้ว เริ่มใช้สิทธิ์ได้ทันที`,
        `ขอบคุณที่เลือก ${p} ระบบตั้งค่าให้คุณเรียบร้อยแล้ว`,
        `เปิดใช้งาน ${p} สำเร็จ พร้อมใช้งานแล้วครับ`,
    ];

    const descEN = [
        `Subscription for ${p} with ${data} data access.`,
        `${p} provides 5G and ${data} high-speed internet.`,
        `${p}: ${data} data at only ${price} Baht.`,
        `Access priority service with ${p} plan.`,
        `5G connectivity and ${data} data from ${p}.`,
        `Monthly streaming access for Disney+ and Netflix with ${p}.`,
    ];
    const descTH = [
        `สมัคร ${p} เพื่อรับสิทธิ์ใช้งานอินเทอร์เน็ต ${data}`,
        `${p} แพ็กเกจเน็ตความเร็วสูง ${data} และ 5G`,
        `${p}: เน็ต ${data} ราคาเพียง ${price} บาท`,
        `รับบริการพิเศษเมื่อใช้งานแพ็กเกจ ${p}`,
        `เชื่อมต่อ 5G และเน็ต ${data} ด้วย ${p}`,
        `สิทธิ์รับชม Disney+ และ Netflix รายเดือนกับ ${p}`,
    ];

    const pkgEN = [
        `You are subscribed to ${p} (${data}).`,
        `${p} is currently active on your account.`,
        `Your active package is ${p} ${data}.`,
        `${p} is now your current plan for ${price} Baht.`,
        `Service ${p} is ready for use.`,
    ];
    const pkgTH = [
        `คุณกำลังใช้งานแพ็กเกจ ${p} เน็ต ${data}`,
        `${p} เปิดใช้งานบนหมายเลขของคุณแล้ว`,
        `แพ็กเกจปัจจุบันของคุณคือ ${p} (${data})`,
        `สมัครใช้งาน ${p} ราคา ${price} บาท เรียบร้อยแล้ว`,
        `ระบบเริ่มใช้งาน ${p} ให้คุณแล้ว`,
    ];

    const letterEN = [
        `Dear customer thank you for subscribing to ${p}`,
        `Hello We are glad you have chosen ${p} Welcome aboard`,
        `Welcome We are excited to have you on ${p}`,
        `Hi We are delighted to welcome you to ${p}`,
        `Welcome aboard ${p} will take you further than ever before`,
        `Great choice! ${p} is now ready for your professional life.`,
    ];
    const letterTH = [
        `เรียนลูกค้า ขอบคุณที่สมัครใช้บริการ ${p}`,
        `สวัสดี ดีใจที่คุณเลือก ${p} ยินดีต้อนรับ`,
        `ยินดีต้อนรับ เรายินดีที่คุณเป็นส่วนหนึ่งของ ${p}`,
        `สวัสดี เรายินดีที่ได้ต้อนรับคุณสู่ ${p}`,
        `ยินดีต้อนรับ ${p} จะพาคุณไปได้ไกลกว่าที่เคย`,
        `ทางเลือกที่ยอดเยี่ยม! ${p} พร้อมสำหรับไลฟ์สไตล์คุณแล้ว`,
    ];

    // ── Generators ───────────────────────────────────────────────────────────
    // shortPromo: 6 tags × 7 suffixes = 42+ combos
    const shortPromoEN = () => Math.random() < 0.5 ? `${pick(enTag)}: ${p}` : `${p} ${pick(enSuffix)}`;
    const shortPromoTH = () => Math.random() < 0.5 ? `${pick(thTag)}: ${p}` : `${p} ${pick(thSuffix)}`;

    // cmsDisplay: 6 actions × p = 6 combos (short, capped at 250)
    const cmsDisplayEN = () => `${pick(enAction)} ${p}`;
    const cmsDisplayTH = () => `${pick(thAction)} ${p}`;

    // checkCurrent: 5 phrases × p = 5 combos
    const checkCurrentEN = () => `${pick(enCheck)}: ${p}`;
    const checkCurrentTH = () => `${pick(thCheck)}: ${p}`;

    // delete: built from atoms → 4 deact × 5 close = 20 EN combos
    const deleteEN = () => `Your ${p} has been ${pick(enDeact)}. ${pick(enClose)}`;
    const deleteTH = () => `${pick(['แพ็กเกจ', 'บริการ', 'การสมัคร'])} ${p} ${pick(['ถูกยกเลิกแล้ว', 'สิ้นสุดแล้ว', 'ถูกปิดใช้งานแล้ว'])} ${pick(thClose)}`;

    // marketingName: p + 8 suffixes = 8 combos
    const marketingName = () => `${p} ${pick(enMkt)}`;

    // ── Exported shape (same as original, but all values are functions) ───────
    return {
        shortPromo: { EN: shortPromoEN, TH: shortPromoTH },
        cmsDisplay: { EN: cmsDisplayEN, TH: cmsDisplayTH },
        promoDesc: { EN: () => pick(descEN), TH: () => pick(descTH) },
        checkCurrent: { EN: checkCurrentEN, TH: checkCurrentTH },
        greeting: { EN: () => pick(greetEN), TH: () => pick(greetTH) },
        deletePRE: { EN: deleteEN, TH: deleteTH },
        deletePOST: { EN: deleteEN, TH: deleteTH },
        marketingName,
        yourPackage: { EN: () => pick(pkgEN), TH: () => pick(pkgTH) },
        greetingLetter: { EN: () => pick(letterEN), TH: () => pick(letterTH) },
    };
};