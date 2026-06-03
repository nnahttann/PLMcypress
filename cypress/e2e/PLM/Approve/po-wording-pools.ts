const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

export const createPOWordingPools = (
    projectName: string,
    poName: string,
    Module: string,
    PriceType: string,
    subModule?: string
) => {
    const p = projectName || `${Module} ${PriceType}`;
    const po = poName || 'Product Offering';
    const mod = Module || 'MOB';
    const sm = subModule || 'POST';

    // ===== DISPLAY NAMES =====
    const moduleNames: Record<string, { EN: string; TH: string }> = {
        'MOB': { EN: 'Mobile', TH: 'มือถือ' },
        'ENTER': { EN: 'Entertainment', TH: 'บันเทิง' },
        'MUSIC': { EN: 'Music', TH: 'เพลง' },
        'FBB': { EN: 'Fiber Broadband', TH: 'ไฟเบอร์บรอดแบนด์' },
        'Fixline': { EN: 'Fixed Line', TH: 'โทรศัพท์บ้าน' },
        'POST': { EN: 'Postpaid', TH: 'รายเดือน' },
        'PRE': { EN: 'Prepaid', TH: 'เติมเงิน' },
    };
    const modName = moduleNames[mod] || { EN: mod, TH: mod };

    const priceTypeNames: Record<string, { EN: string; TH: string }> = {
        'onetime': { EN: 'One-Time', TH: 'ครั้งเดียว' },
        'recurring': { EN: 'Recurring', TH: 'รายเดือน' },
        'usage': { EN: 'Usage', TH: 'ตามการใช้งาน' },
    };
    const ptName = priceTypeNames[PriceType] || { EN: PriceType, TH: PriceType };

    // ===== RANDOM VALUES =====
    const dataAmount = pickRandom(['10GB', '30GB', '50GB', '100GB', '200GB', '300GB', '500GB', 'Unlimited']);
    const speed = pickRandom(['100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '2 Gbps', '5G Max']);
    const price = randomInt(199, 2999);
    const discount = pickRandom([10, 15, 20, 25, 30, 40, 50]);
    const validity = pickRandom([1, 3, 7, 30, 90, 180, 365]);
    const contractMonths = pickRandom([1, 3, 6, 12, 24, 36]);
    const benefit1 = pickRandom(['5G Access', 'Unlimited Calls', 'Free Streaming', 'Rollover Data', 'Family Sharing', 'International Roaming']);
    const benefit1TH = pickRandom(['เข้าใช้ 5G', 'โทรฟรีไม่อั้น', 'สตรีมมิ่งฟรี', 'ยกยอดเน็ต', 'แชร์ครอบครัว', 'โรมมิ่ง']);
    const benefit2 = pickRandom(['No Contract', 'Free SIM', 'eSIM Ready', 'Priority Support', 'Device Discount', 'Cashback']);
    const benefit2TH = pickRandom(['ไม่มีสัญญา', 'ซิมฟรี', 'พร้อม eSIM', 'บริการพิเศษ', 'ส่วนลดเครื่อง', 'เงินคืน']);

    return {
        // ===== SHORT PROMOTION NAME =====
        shortPromotionName: {
            EN: [
                `${p} Value Pack`,
                `${p} Smart Deal`,
                `${p} Power Plan`,
                `${p} Daily Deal`,
                `${p} Big Save`,
                `${p} Speed Pack`,
                `${p} Data King`,
                `${p} Net Plus`,
                `${p} Always On`,
                `${p} Full Power`,
                `${p} Next Level`,
                `${p} My Choice`,
                `${p} Go Extra`,
                `${p} Double Up`,
                `${p} Hero`,
                `${p} Ace`,
                `${p} Edge`,
                `${p} Flex`,
                `${p} Rise`,
                `${p} Zone`,
                `${p} Core Plus`,
                `${p} Super Plan`,
                `${p} Fast Lane`,
                `${p} All Day`,
                `${p} Family Plan`,
                `${p} Business Pack`,
                `${p} Weekend Pick`,
                `${p} Monthly Star`,
                `${p} Top Value`,
                `${p} Best Buy`,
            ],
            TH: [
                `${p} แพ็กคุ้ม`,
                `${p} ดีลฉลาด`,
                `${p} พลานพาวเวอร์`,
                `${p} ดีลรายวัน`,
                `${p} ประหยัดสุด`,
                `${p} แพ็กความเร็ว`,
                `${p} ดาต้าคิง`,
                `${p} เน็ตพลัส`,
                `${p} ออนตลอด`,
                `${p} พลังเต็ม`,
                `${p} ขั้นต่อไป`,
                `${p} ของฉัน`,
                `${p} โกเอ็กซ์ตร้า`,
                `${p} ดับเบิลอัป`,
                `${p} ฮีโร่`,
                `${p} เอซ`,
                `${p} เอดจ์`,
                `${p} เฟล็กซ์`,
                `${p} ไรส์`,
                `${p} โซน`,
                `${p} คอร์พลัส`,
                `${p} ซูเปอร์แพลน`,
                `${p} เลนเร็ว`,
                `${p} ตลอดวัน`,
                `${p} แพลนครอบครัว`,
                `${p} แพ็กธุรกิจ`,
                `${p} พิเศษวีคเอนด์`,
                `${p} สตาร์ประจำเดือน`,
                `${p} คุ้มสุดคุ้ม`,
                `${p} ซื้อดีที่สุด`,
            ],
        },

        // ===== PROMOTION DESCRIPTION =====
        promotionDescription: {
            EN: [
                `Sign up for ${p} and get ${dataAmount} of data at ${speed} plus unlimited calls for just ${price} THB per month`,
                `${p} is the ${modName.EN} package that gives you ${dataAmount} data ${speed} speeds and ${benefit1} all in one`,
                `Get more done every day with ${p} featuring ${dataAmount} data at ${speed} and ${benefit2} included`,
                `${p} is your complete ${modName.EN} solution with ${dataAmount} data unlimited calls and 5G access at ${price} THB`,
                `Try ${p} and enjoy ${dataAmount} high speed data plus ${benefit1} and ${benefit2} for only ${price} THB monthly`,
                `${p} gives you ${dataAmount} of ${modName.EN} data at ${speed} so you never slow down`,
                `Choose ${p} for ${dataAmount} data ${speed} connectivity and top features at just ${price} THB a month`,
                `Stay connected with ${p} and enjoy ${dataAmount} data ${benefit1} and unlimited domestic calls all day`,
                `${p} is built for modern users offering ${dataAmount} data at ${speed} plus ${benefit1} and ${benefit2}`,
                `Upgrade to ${p} today and get ${dataAmount} of data at ${speed} with full 5G support for ${price} THB`,
                `${p} combines great speed and generous data giving you ${dataAmount} at ${speed} every single month`,
                `Subscribe to ${p} and unlock ${dataAmount} data at ${speed} plus exclusive benefits for ${price} THB`,
                `With ${p} you get ${dataAmount} of high speed data at ${speed} and the freedom to do more`,
                `${p} packs in ${dataAmount} data ${speed} speeds unlimited calls and ${benefit1} at just ${price} THB per month`,
                `Activate ${p} now and start enjoying ${dataAmount} data unlimited calls and ${benefit1} right away`,
                `${p} brings you ${dataAmount} of fast ${modName.EN} data and premium features at an unbeatable price`,
                `${p} is the all in one ${modName.EN} package with ${dataAmount} data ${benefit1} and ${benefit2} ready for you`,
                `Take your connectivity to the next level with ${p} and enjoy ${dataAmount} data plus ${benefit2}`,
                `${p} is designed for those who need ${dataAmount} data ${speed} and ${benefit1} without compromise`,
                `Get everything you need with ${p} including ${dataAmount} data at ${speed} and ${benefit2} for ${price} THB`,
            ],
            TH: [
                `สมัคร ${p} รับเน็ต ${dataAmount} ความเร็ว ${speed} พร้อมโทรฟรีไม่จำกัดในราคาเพียง ${price} บาทต่อเดือน`,
                `${p} คือแพ็กเกจ${modName.TH}ที่มอบเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit1TH}ครบในที่เดียว`,
                `ทำได้มากขึ้นทุกวันด้วย ${p} ที่มีเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit2TH}รวมไว้แล้ว`,
                `${p} คือโซลูชัน${modName.TH}ครบวงจรด้วยเน็ต ${dataAmount} โทรฟรีไม่จำกัด และ 5G ที่ ${price} บาท`,
                `ลอง ${p} และเพลิดเพลินกับเน็ตความเร็วสูง ${dataAmount} พร้อม${benefit1TH}และ${benefit2TH}เพียง ${price} บาทต่อเดือน`,
                `${p} มอบเน็ต${modName.TH} ${dataAmount} ที่ความเร็ว ${speed} ทำให้คุณไม่มีวันช้าลง`,
                `เลือก ${p} สำหรับเน็ต ${dataAmount} การเชื่อมต่อ ${speed} และฟีเจอร์ชั้นยอดในราคาเพียง ${price} บาทต่อเดือน`,
                `เชื่อมต่อกับ ${p} และเพลิดเพลินกับเน็ต ${dataAmount} ${benefit1TH} และโทรฟรีไม่จำกัดตลอดวัน`,
                `${p} สร้างมาสำหรับผู้ใช้ยุคใหม่ มอบเน็ต ${dataAmount} ที่ความเร็ว ${speed} พร้อม${benefit1TH}และ${benefit2TH}`,
                `อัปเกรดเป็น ${p} วันนี้รับเน็ต ${dataAmount} ที่ความเร็ว ${speed} พร้อมรองรับ 5G เต็มรูปแบบในราคา ${price} บาท`,
                `${p} ผสานความเร็วสูงและเน็ตปริมาณมากมอบ ${dataAmount} ที่ ${speed} ทุกเดือน`,
                `สมัคร ${p} ปลดล็อกเน็ต ${dataAmount} ที่ความเร็ว ${speed} พร้อมสิทธิพิเศษในราคา ${price} บาท`,
                `กับ ${p} คุณได้เน็ตความเร็วสูง ${dataAmount} ที่ ${speed} และอิสระในการทำสิ่งต่างๆ มากขึ้น`,
                `${p} อัดแน่นด้วยเน็ต ${dataAmount} ความเร็ว ${speed} โทรฟรีไม่จำกัด และ${benefit1TH}ในราคาเพียง ${price} บาทต่อเดือน`,
                `เปิดใช้ ${p} ตอนนี้และเริ่มเพลิดเพลินกับเน็ต ${dataAmount} โทรฟรีไม่จำกัด และ${benefit1TH}ได้ทันที`,
                `${p} มอบเน็ต${modName.TH}ความเร็วสูง ${dataAmount} และฟีเจอร์พรีเมียมในราคาที่ไม่มีใครเทียบ`,
                `${p} คือแพ็กเกจ${modName.TH}ครบวงจรด้วยเน็ต ${dataAmount} ${benefit1TH} และ${benefit2TH}พร้อมสำหรับคุณ`,
                `ยกระดับการเชื่อมต่อด้วย ${p} และเพลิดเพลินกับเน็ต ${dataAmount} พร้อม${benefit2TH}`,
                `${p} ออกแบบมาสำหรับผู้ที่ต้องการเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit1TH}โดยไม่ยอมรับน้อยกว่า`,
                `ได้ทุกสิ่งที่ต้องการกับ ${p} รวมเน็ต ${dataAmount} ที่ความเร็ว ${speed} และ${benefit2TH}ในราคา ${price} บาท`,
            ],
        },

        // ===== GREETING LETTER =====
        greetingLetter: {
            EN: [
                `Dear customer we are glad to confirm that your ${p} subscription is now active and ready to use`,
                `Hello and welcome to ${p} your ${modName.EN} package is live and all features are available to you`,
                `Dear valued customer your ${p} plan has been successfully activated with ${dataAmount} of data ready for you`,
                `Welcome to the ${p} family we are thrilled to have you and hope you enjoy every benefit included`,
                `Dear customer your ${p} subscription has been confirmed and your ${dataAmount} data at ${speed} is now ready`,
                `Hello we are happy to let you know that ${p} is now active on your account enjoy your benefits`,
                `Dear customer thank you for trusting us with your ${modName.EN} needs we are proud to bring you ${p}`,
                `Welcome aboard ${p} we have activated your ${dataAmount} data package and it is ready for you today`,
                `Dear subscriber your ${p} plan is fully live including ${benefit1} and ${benefit2} starting from today`,
                `Hello valued customer your ${p} subscription starts now enjoy ${dataAmount} of data at ${speed}`,
                `Dear customer we are pleased to welcome you to ${p} your account is fully set up and ready`,
                `Thank you for joining ${p} dear customer your ${modName.EN} package is now confirmed and active`,
                `Dear customer ${p} is now yours enjoy ${dataAmount} data at ${speed} plus all the premium features included`,
                `Hello welcome to ${p} we have set everything up for you so you can start enjoying your benefits today`,
                `Dear customer your ${p} journey starts here we are excited to be part of your connected life`,
                `Welcome to ${p} dear customer we hope this ${modName.EN} package brings great value to your everyday life`,
                `Dear valued customer we confirm that ${p} is now running on your account with ${dataAmount} data ready`,
                `Hello and thank you for choosing ${p} your ${modName.EN} subscription is active and all set for you`,
                `Dear customer we are honored to have you on ${p} and we are committed to giving you the best experience`,
                `Welcome dear customer ${p} is now active enjoy ${dataAmount} data ${speed} speeds and unlimited calls`,
                `Dear customer your ${p} plan includes ${benefit1} and ${benefit2} and everything is ready for you now`,
                `Hello ${p} is successfully activated on your number enjoy seamless ${modName.EN} service from today`,
                `Dear subscriber welcome to ${p} your ${dataAmount} data and premium features are all set and ready`,
                `Thank you for choosing ${p} dear customer we promise to deliver the best ${modName.EN} experience to you`,
                `Dear customer your ${p} subscription is now live and we are here to support you every step of the way`,
                `Welcome to ${p} we are glad you are here your package is active and all your benefits are unlocked`,
                `Dear customer we have activated ${p} for you enjoy ${dataAmount} data at ${speed} starting right now`,
                `Hello and welcome we are happy to confirm that ${p} is now part of your account`,
                `Dear customer ${p} is set up and ready for you we hope you enjoy every feature of this package`,
                `Welcome aboard dear customer ${p} is now live on your number and ready to serve you`,
            ],
            TH: [
                `เรียนลูกค้า เรายินดียืนยันว่าการสมัคร ${p} ของคุณพร้อมใช้งานแล้ว`,
                `สวัสดีและยินดีต้อนรับสู่ ${p} แพ็กเกจ${modName.TH}ของคุณมีผลแล้วและฟีเจอร์ทั้งหมดพร้อมใช้`,
                `เรียนลูกค้าที่มีคุณค่า แผน ${p} ของคุณถูกเปิดใช้งานสำเร็จพร้อมเน็ต ${dataAmount} รอคุณอยู่`,
                `ยินดีต้อนรับสู่ครอบครัว ${p} เรารู้สึกตื่นเต้นที่มีคุณอยู่ด้วยและหวังว่าคุณจะสนุกกับทุกสิทธิพิเศษ`,
                `เรียนลูกค้า การสมัคร ${p} ของคุณได้รับการยืนยันแล้ว เน็ต ${dataAmount} ที่ความเร็ว ${speed} พร้อมแล้ว`,
                `สวัสดี เรายินดีแจ้งให้ทราบว่า ${p} เปิดใช้งานบนบัญชีของคุณแล้ว ขอให้เพลิดเพลินกับสิทธิพิเศษ`,
                `เรียนลูกค้า ขอบคุณที่ไว้วางใจเราดูแลความต้องการด้าน${modName.TH}ของคุณ เรายินดีนำเสนอ ${p}`,
                `ยินดีต้อนรับสู่ ${p} เราได้เปิดใช้งานแพ็กเกจเน็ต ${dataAmount} ของคุณและพร้อมให้บริการวันนี้`,
                `เรียนสมาชิก แผน ${p} ของคุณมีผลสมบูรณ์แล้ว รวมถึง${benefit1TH}และ${benefit2TH}ตั้งแต่วันนี้`,
                `สวัสดีลูกค้าที่มีคุณค่า การสมัคร ${p} ของคุณเริ่มต้นแล้ว เพลิดเพลินกับเน็ต ${dataAmount} ที่ ${speed}`,
                `เรียนลูกค้า เรายินดีต้อนรับคุณสู่ ${p} บัญชีของคุณตั้งค่าครบถ้วนและพร้อมใช้งานแล้ว`,
                `ขอบคุณที่ร่วมใช้ ${p} เรียนลูกค้า แพ็กเกจ${modName.TH}ของคุณได้รับการยืนยันและเปิดใช้งานแล้ว`,
                `เรียนลูกค้า ${p} เป็นของคุณแล้ว เพลิดเพลินกับเน็ต ${dataAmount} ที่ ${speed} พร้อมฟีเจอร์พรีเมียมทั้งหมด`,
                `สวัสดี ยินดีต้อนรับสู่ ${p} เราจัดการทุกอย่างไว้ให้คุณแล้ว เริ่มเพลิดเพลินกับสิทธิพิเศษได้วันนี้`,
                `เรียนลูกค้า การเดินทางกับ ${p} ของคุณเริ่มที่นี่ เรารู้สึกตื่นเต้นที่ได้เป็นส่วนหนึ่งของชีวิตที่เชื่อมต่อของคุณ`,
                `ยินดีต้อนรับสู่ ${p} เรียนลูกค้า หวังว่าแพ็กเกจ${modName.TH}นี้จะมอบคุณค่าที่ยิ่งใหญ่ให้ชีวิตประจำวันของคุณ`,
                `เรียนลูกค้าที่มีคุณค่า เรายืนยันว่า ${p} ทำงานบนบัญชีของคุณแล้วพร้อมเน็ต ${dataAmount}`,
                `สวัสดีและขอบคุณที่เลือก ${p} การสมัคร${modName.TH}ของคุณมีผลและพร้อมสำหรับคุณแล้ว`,
                `เรียนลูกค้า เรารู้สึกเป็นเกียรติที่มีคุณอยู่บน ${p} และมุ่งมั่นที่จะมอบประสบการณ์ที่ดีที่สุดให้คุณ`,
                `ยินดีต้อนรับเรียนลูกค้า ${p} เปิดใช้งานแล้ว เพลิดเพลินกับเน็ต ${dataAmount} ความเร็ว ${speed} และโทรฟรีไม่จำกัด`,
                `เรียนลูกค้า แผน ${p} ของคุณรวม${benefit1TH}และ${benefit2TH}ทุกอย่างพร้อมสำหรับคุณแล้ว`,
                `สวัสดี ${p} ถูกเปิดใช้งานบนเบอร์ของคุณสำเร็จแล้ว เพลิดเพลินกับบริการ${modName.TH}ที่ราบรื่นตั้งแต่วันนี้`,
                `เรียนสมาชิก ยินดีต้อนรับสู่ ${p} เน็ต ${dataAmount} และฟีเจอร์พรีเมียมของคุณพร้อมทั้งหมดแล้ว`,
                `ขอบคุณที่เลือก ${p} เรียนลูกค้า เราสัญญาว่าจะมอบประสบการณ์${modName.TH}ที่ดีที่สุดให้คุณ`,
                `เรียนลูกค้า การสมัคร ${p} ของคุณมีผลแล้วและเราอยู่เคียงข้างคุณในทุกขั้นตอน`,
                `ยินดีต้อนรับสู่ ${p} เรายินดีที่คุณอยู่ที่นี่ แพ็กเกจของคุณเปิดใช้งานแล้วและสิทธิพิเศษทั้งหมดพร้อมแล้ว`,
                `เรียนลูกค้า เราเปิดใช้งาน ${p} ให้คุณแล้ว เพลิดเพลินกับเน็ต ${dataAmount} ที่ ${speed} ตั้งแต่ตอนนี้`,
                `สวัสดีและยินดีต้อนรับ เรายินดียืนยันว่า ${p} เป็นส่วนหนึ่งของบัญชีคุณแล้ว`,
                `เรียนลูกค้า ${p} ตั้งค่าและพร้อมสำหรับคุณแล้ว หวังว่าคุณจะสนุกกับทุกฟีเจอร์ของแพ็กเกจนี้`,
                `ยินดีต้อนรับเรียนลูกค้า ${p} เปิดใช้งานบนเบอร์ของคุณแล้วและพร้อมให้บริการ`,
            ],
        },

        // ===== YOUR PACKAGE NAME =====
        yourPackageName: {
            EN: [
                `Your plan: ${p}`,
                `Currently on: ${p}`,
                `Active subscription: ${p}`,
                `Subscribed plan: ${p}`,
                `Running package: ${p}`,
                `Now on: ${p}`,
                `Package in use: ${p}`,
                `My plan: ${p}`,
                `Signed up for: ${p}`,
                `Live package: ${p}`,
                `Enrolled plan: ${p}`,
                `Chosen package: ${p}`,
                `${p} is active`,
                `${p} ${dataAmount} plan`,
                `${p} ${modName.EN} ${ptName.EN} active`,
            ],
            TH: [
                `แผนของคุณ: ${p}`,
                `ใช้งานอยู่: ${p}`,
                `การสมัครที่ใช้งาน: ${p}`,
                `แผนที่สมัคร: ${p}`,
                `แพ็กเกจที่รัน: ${p}`,
                `ตอนนี้ใช้: ${p}`,
                `แพ็กเกจที่ใช้: ${p}`,
                `แผนของฉัน: ${p}`,
                `สมัครอยู่กับ: ${p}`,
                `แพ็กเกจที่มีผล: ${p}`,
                `แผนที่ลงทะเบียน: ${p}`,
                `แพ็กเกจที่เลือก: ${p}`,
                `${p} ใช้งานอยู่`,
                `${p} แผน ${dataAmount}`,
                `${p} ${modName.TH} ${ptName.TH} ใช้งานอยู่`,
            ],
        },

        // ===== SMS GREETING =====
        smsGreeting: {
            EN: [
                `Welcome to ${p} your package is now active and ready`,
                `You have joined ${p} enjoy ${dataAmount} data starting today`,
                `${p} is now on enjoy your ${modName.EN} benefits`,
                `Your ${p} plan is live and all features are unlocked`,
                `Thanks for choosing ${p} enjoy ${dataAmount} at ${speed}`,
                `${p} is active on your number enjoy every benefit`,
                `You are now on ${p} ${dataAmount} data is ready for you`,
                `${p} subscription confirmed enjoy seamless connectivity`,
                `Hello and welcome your ${p} package is active now`,
                `${p} is running on your account enjoy your plan today`,
                `Great choice ${p} is now live enjoy the full experience`,
                `${p} activated and ${dataAmount} data ready for you`,
                `Your journey with ${p} starts now enjoy every moment`,
                `${p} is set up and ready go ahead and explore`,
                `You are all set with ${p} start enjoying right now`,
                `Welcome aboard ${p} your ${modName.EN} plan is live`,
                `${p} is yours enjoy ${dataAmount} at ${speed} from today`,
                `${p} is on and your ${dataAmount} data is waiting for you`,
                `Your ${p} plan is active enjoy unlimited calls and ${benefit1}`,
                `${p} is fully live welcome and enjoy all the perks`,
                `You are officially on ${p} make the most of it`,
                `${p} unlocked and ready enjoy ${dataAmount} data today`,
                `Thank you for subscribing to ${p} enjoy your benefits`,
                `${p} is now yours go explore everything it offers`,
                `Your ${p} package is confirmed and active right now`,
                `${p} is here for you enjoy ${modName.EN} service today`,
                `All set ${p} is live and waiting for you`,
                `You have ${p} now enjoy ${dataAmount} and ${benefit1}`,
                `${p} is activated enjoy top speed and great value`,
                `${p} your ${modName.EN} package is active start exploring`,
            ],
            TH: [
                `ยินดีต้อนรับสู่ ${p} แพ็กเกจของคุณพร้อมใช้งานแล้ว`,
                `คุณเข้าร่วม ${p} แล้ว เพลิดเพลินกับเน็ต ${dataAmount} ตั้งแต่วันนี้`,
                `${p} เปิดแล้ว เพลิดเพลินกับสิทธิพิเศษ${modName.TH}ของคุณ`,
                `แผน ${p} ของคุณมีผลแล้วและฟีเจอร์ทั้งหมดพร้อมใช้`,
                `ขอบคุณที่เลือก ${p} เพลิดเพลินกับ ${dataAmount} ที่ ${speed}`,
                `${p} เปิดใช้งานบนเบอร์ของคุณแล้ว เพลิดเพลินกับทุกสิทธิพิเศษ`,
                `ตอนนี้คุณอยู่บน ${p} แล้ว เน็ต ${dataAmount} พร้อมสำหรับคุณ`,
                `ยืนยันการสมัคร ${p} แล้ว เพลิดเพลินกับการเชื่อมต่อที่ราบรื่น`,
                `สวัสดีและยินดีต้อนรับ แพ็กเกจ ${p} ของคุณเปิดใช้งานแล้ว`,
                `${p} ทำงานบนบัญชีของคุณแล้ว เพลิดเพลินกับแผนของคุณวันนี้`,
                `เลือกได้ดีมาก ${p} เปิดใช้งานแล้ว เพลิดเพลินกับประสบการณ์เต็มรูปแบบ`,
                `${p} เปิดใช้งานแล้วและเน็ต ${dataAmount} พร้อมสำหรับคุณ`,
                `การเดินทางกับ ${p} ของคุณเริ่มแล้ว เพลิดเพลินกับทุกช่วงเวลา`,
                `${p} ตั้งค่าและพร้อมแล้ว ไปสำรวจได้เลย`,
                `คุณพร้อมหมดแล้วกับ ${p} เริ่มเพลิดเพลินได้ตอนนี้`,
                `ยินดีต้อนรับ ${p} แผน${modName.TH}ของคุณมีผลแล้ว`,
                `${p} เป็นของคุณแล้ว เพลิดเพลินกับ ${dataAmount} ที่ ${speed} ตั้งแต่วันนี้`,
                `${p} เปิดแล้วและเน็ต ${dataAmount} รอคุณอยู่`,
                `แผน ${p} ของคุณพร้อมแล้ว เพลิดเพลินกับโทรฟรีไม่จำกัดและ${benefit1TH}`,
                `${p} มีผลสมบูรณ์แล้ว ยินดีต้อนรับและเพลิดเพลินกับสิทธิพิเศษทั้งหมด`,
                `คุณอยู่บน ${p} อย่างเป็นทางการแล้ว ใช้ให้คุ้มค่าที่สุด`,
                `${p} ปลดล็อกแล้วและพร้อม เพลิดเพลินกับเน็ต ${dataAmount} วันนี้`,
                `ขอบคุณที่สมัคร ${p} เพลิดเพลินกับสิทธิพิเศษของคุณ`,
                `${p} เป็นของคุณแล้ว ไปสำรวจทุกสิ่งที่มีให้`,
                `ยืนยันและเปิดใช้งานแพ็กเกจ ${p} ของคุณแล้ว`,
                `${p} อยู่ที่นี่เพื่อคุณ เพลิดเพลินกับบริการ${modName.TH}วันนี้`,
                `พร้อมหมดแล้ว ${p} เปิดใช้งานและรอคุณอยู่`,
                `คุณมี ${p} แล้ว เพลิดเพลินกับ ${dataAmount} และ${benefit1TH}`,
                `${p} เปิดใช้งานแล้ว เพลิดเพลินกับความเร็วสูงและความคุ้มค่ายอดเยี่ยม`,
                `${p} แพ็กเกจ${modName.TH}ของคุณเปิดใช้งานแล้ว เริ่มสำรวจได้เลย`,
            ],
        },

        // ===== SMS DELETE =====
        smsDelete: {
            EN: [
                `Your ${p} package has been cancelled thank you for using our service`,
                `${p} has been removed from your number we hope to see you again`,
                `Your ${p} plan is now deactivated thank you for being with us`,
                `We have cancelled ${p} on your account thank you for your loyalty`,
                `${p} has been successfully unsubscribed we value your time with us`,
                `Your request to cancel ${p} is complete we hope you enjoyed the service`,
                `${p} is now off on your number feel free to rejoin anytime`,
                `We confirm the removal of ${p} from your account`,
                `Your ${p} subscription has ended we appreciate every moment you spent with us`,
                `${p} removed we hope your experience was a great one`,
                `Thank you for using ${p} your package has now been cancelled`,
                `${p} is no longer active on your number come back whenever you are ready`,
                `Your ${p} plan has been successfully deactivated as requested`,
                `We have processed your ${p} cancellation thank you for choosing us`,
                `${p} cancelled we hope to welcome you back someday`,
                `Your ${p} package is now closed thank you for being our customer`,
                `We confirm that ${p} has been removed from your account`,
                `${p} is done on your number thank you for your support`,
                `Your cancellation of ${p} is confirmed we will miss having you`,
                `${p} is off we hope you enjoyed the benefits while you were with us`,
                `Thank you for your time with ${p} your package is now cancelled`,
                `${p} ended we appreciated having you on our network`,
                `We have removed ${p} from your number it was great serving you`,
                `${p} cancellation complete we hope to serve you again in the future`,
                `Your ${p} plan is now closed thank you for your trust in us`,
                `${p} removed from your account we appreciate you`,
                `We confirm ${p} is now deactivated on your number`,
                `Your subscription to ${p} has been cancelled come back anytime`,
                `${p} is officially off thank you for being a valued customer`,
                `${p} service ended thanks for choosing us we hope to see you again`,
            ],
            TH: [
                `แพ็กเกจ ${p} ของคุณถูกยกเลิกแล้ว ขอบคุณที่ใช้บริการของเรา`,
                `${p} ถูกลบออกจากเบอร์ของคุณแล้ว หวังว่าจะพบกันใหม่`,
                `แผน ${p} ของคุณถูกปิดใช้งานแล้ว ขอบคุณที่อยู่กับเรา`,
                `เราได้ยกเลิก ${p} บนบัญชีของคุณแล้ว ขอบคุณสำหรับความไว้วางใจ`,
                `${p} ถูกยกเลิกสำเร็จแล้ว เราขอบคุณในทุกช่วงเวลาที่ผ่านมา`,
                `คำขอยกเลิก ${p} ของคุณเสร็จสมบูรณ์แล้ว หวังว่าคุณจะพอใจกับบริการ`,
                `${p} ปิดแล้วบนเบอร์ของคุณ สามารถสมัครใหม่ได้ตลอดเวลา`,
                `เรายืนยันการลบ ${p} ออกจากบัญชีของคุณ`,
                `การสมัคร ${p} ของคุณสิ้นสุดแล้ว เราขอบคุณทุกช่วงเวลาที่คุณอยู่กับเรา`,
                `ลบ ${p} แล้ว หวังว่าประสบการณ์ของคุณจะยอดเยี่ยม`,
                `ขอบคุณที่ใช้ ${p} แพ็กเกจของคุณถูกยกเลิกแล้ว`,
                `${p} ไม่ได้ทำงานบนเบอร์ของคุณแล้ว กลับมาได้เมื่อพร้อม`,
                `แผน ${p} ของคุณถูกปิดใช้งานสำเร็จตามที่ร้องขอ`,
                `เราดำเนินการยกเลิก ${p} ของคุณแล้ว ขอบคุณที่เลือกเรา`,
                `ยกเลิก ${p} แล้ว หวังว่าจะได้ต้อนรับคุณกลับมาสักวัน`,
                `แพ็กเกจ ${p} ของคุณปิดแล้ว ขอบคุณที่เป็นลูกค้าของเรา`,
                `เรายืนยันว่า ${p} ถูกลบออกจากบัญชีของคุณแล้ว`,
                `${p} สิ้นสุดบนเบอร์ของคุณแล้ว ขอบคุณสำหรับการสนับสนุน`,
                `การยกเลิก ${p} ของคุณได้รับการยืนยันแล้ว เราจะคิดถึงคุณ`,
                `${p} ปิดแล้ว หวังว่าคุณจะสนุกกับสิทธิพิเศษในช่วงที่อยู่กับเรา`,
                `ขอบคุณสำหรับเวลากับ ${p} แพ็กเกจของคุณถูกยกเลิกแล้ว`,
                `${p} สิ้นสุดแล้ว เราขอบคุณที่มีคุณอยู่บนเครือข่ายของเรา`,
                `เราลบ ${p} ออกจากเบอร์ของคุณแล้ว เป็นเกียรติที่ได้ให้บริการคุณ`,
                `ยกเลิก ${p} เสร็จสมบูรณ์ หวังว่าจะได้ให้บริการคุณอีกในอนาคต`,
                `แผน ${p} ของคุณปิดแล้ว ขอบคุณสำหรับความไว้วางใจ`,
                `ลบ ${p} ออกจากบัญชีของคุณแล้ว เราขอบคุณคุณ`,
                `เรายืนยันว่า ${p} ถูกปิดใช้งานบนเบอร์ของคุณแล้ว`,
                `การสมัคร ${p} ของคุณถูกยกเลิกแล้ว กลับมาได้ทุกเวลา`,
                `${p} ปิดอย่างเป็นทางการแล้ว ขอบคุณที่เป็นลูกค้าที่มีคุณค่า`,
                `บริการ ${p} สิ้นสุดแล้ว ขอบคุณที่เลือกเรา หวังว่าจะพบกันใหม่`,
            ],
        },

        // ===== WORDING IN STATEMENT =====
        wordingInStatement: {
            EN: [
                `${p} ${modName.EN} ${ptName.EN} monthly charge`,
                `${p} data package ${dataAmount} at ${speed}`,
                `${p} subscription ${price} THB`,
                `Monthly fee ${p}`,
                `${p} service charge`,
                `${p} billing ${price} THB per month`,
                `${p} ${ptName.EN} plan charge`,
                `Payment for ${p}`,
                `${p} plan ${dataAmount} monthly`,
                `${p} subscription fee ${price} THB`,
                `Charge for ${p} ${modName.EN}`,
                `${p} account deduction`,
                `${p} recurring charge`,
                `${p} monthly package fee`,
                `Billed: ${p}`,
                `${p} ${modName.EN} service fee`,
                `${p} data plan ${price} THB`,
                `${p} thank you for your payment`,
                `${p} plan renewal charge`,
                `${p} ${ptName.EN} monthly billing`,
            ],
            TH: [
                `ค่าบริการรายเดือน ${p} ${modName.TH} ${ptName.TH}`,
                `แพ็กเกจเน็ต ${p} ${dataAmount} ที่ ${speed}`,
                `การสมัคร ${p} ${price} บาท`,
                `ค่าบริการรายเดือน ${p}`,
                `ค่าบริการ ${p}`,
                `การเรียกเก็บเงิน ${p} ${price} บาทต่อเดือน`,
                `ค่าบริการแผน ${p} ${ptName.TH}`,
                `ชำระเงินสำหรับ ${p}`,
                `แผน ${p} ${dataAmount} รายเดือน`,
                `ค่าสมัคร ${p} ${price} บาท`,
                `ค่าบริการ ${p} ${modName.TH}`,
                `การหักบัญชี ${p}`,
                `ค่าบริการประจำ ${p}`,
                `ค่าแพ็กเกจรายเดือน ${p}`,
                `เรียกเก็บ: ${p}`,
                `ค่าบริการ${modName.TH} ${p}`,
                `แผนเน็ต ${p} ${price} บาท`,
                `${p} ขอบคุณสำหรับการชำระเงิน`,
                `ค่าต่ออายุแผน ${p}`,
                `ค่าบริการรายเดือน ${p} ${ptName.TH}`,
            ],
        },

        // ===== DESCRIPTION =====
        description: {
            EN: [
                `${p} is a ${ptName.EN} ${modName.EN} package with ${dataAmount} data ${speed} speeds and unlimited domestic calls`,
                `${p} offers ${dataAmount} of high speed ${modName.EN} data at ${speed} including ${benefit1} and ${benefit2}`,
                `${p} is the ${ptName.EN} plan for modern users delivering ${dataAmount} data ${speed} and 5G access`,
                `${p} provides ${dataAmount} data at ${speed} plus unlimited calls and premium features for ${price} THB monthly`,
                `${p} is a ${modName.EN} package designed to give you ${dataAmount} data ${benefit1} and ${benefit2} at great value`,
                `${p} includes ${dataAmount} of fast data at ${speed} with full 5G support and unlimited domestic calls`,
                `${p} is the smart ${ptName.EN} choice offering ${dataAmount} data ${speed} connectivity and exclusive benefits`,
                `${p} delivers ${dataAmount} data ${speed} speeds and ${benefit1} in one comprehensive ${modName.EN} plan`,
                `${p} is a feature packed ${modName.EN} package with ${dataAmount} data ${benefit1} and ${benefit2} at ${price} THB`,
                `${p} brings you ${dataAmount} of ${modName.EN} data at ${speed} with top tier connectivity and great value`,
                `${p} is a complete ${modName.EN} solution with ${dataAmount} data ${speed} unlimited calls and 5G ready`,
                `${p} gives you the ultimate ${ptName.EN} ${modName.EN} experience with ${dataAmount} data and ${benefit1}`,
                `${p} is your go to ${modName.EN} package with ${dataAmount} data at ${speed} for just ${price} THB`,
                `${p} combines ${dataAmount} data ${speed} and ${benefit2} in one powerful ${modName.EN} package`,
                `${p} is a reliable ${ptName.EN} ${modName.EN} plan with ${dataAmount} data and unlimited domestic calls`,
            ],
            TH: [
                `${p} คือแพ็กเกจ${modName.TH}แบบ${ptName.TH}ด้วยเน็ต ${dataAmount} ความเร็ว ${speed} และโทรฟรีทุกเครือข่ายไม่จำกัด`,
                `${p} มอบเน็ต${modName.TH}ความเร็วสูง ${dataAmount} ที่ ${speed} รวมถึง${benefit1TH}และ${benefit2TH}`,
                `${p} คือแผน${ptName.TH}สำหรับผู้ใช้ยุคใหม่ มอบเน็ต ${dataAmount} ความเร็ว ${speed} และการเข้าถึง 5G`,
                `${p} มอบเน็ต ${dataAmount} ที่ ${speed} พร้อมโทรฟรีไม่จำกัดและฟีเจอร์พรีเมียมในราคา ${price} บาทต่อเดือน`,
                `${p} คือแพ็กเกจ${modName.TH}ที่ออกแบบมาเพื่อมอบเน็ต ${dataAmount} ${benefit1TH}และ${benefit2TH}ในราคาที่คุ้มค่า`,
                `${p} รวมเน็ตความเร็วสูง ${dataAmount} ที่ ${speed} พร้อมรองรับ 5G เต็มรูปแบบและโทรฟรีไม่จำกัด`,
                `${p} คือตัวเลือก${ptName.TH}ที่ฉลาด มอบเน็ต ${dataAmount} การเชื่อมต่อ ${speed} และสิทธิพิเศษเฉพาะ`,
                `${p} ส่งมอบเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit1TH}ในแผน${modName.TH}ที่ครอบคลุม`,
                `${p} คือแพ็กเกจ${modName.TH}ที่เต็มไปด้วยฟีเจอร์ด้วยเน็ต ${dataAmount} ${benefit1TH}และ${benefit2TH}ในราคา ${price} บาท`,
                `${p} มอบเน็ต${modName.TH} ${dataAmount} ที่ ${speed} พร้อมการเชื่อมต่อระดับสูงสุดและความคุ้มค่าที่ยอดเยี่ยม`,
                `${p} คือโซลูชัน${modName.TH}ครบวงจรด้วยเน็ต ${dataAmount} ความเร็ว ${speed} โทรฟรีไม่จำกัดและรองรับ 5G`,
                `${p} มอบประสบการณ์${ptName.TH}${modName.TH}ขั้นสุดด้วยเน็ต ${dataAmount} และ${benefit1TH}`,
                `${p} คือแพ็กเกจ${modName.TH}ที่ใช่สำหรับคุณด้วยเน็ต ${dataAmount} ที่ ${speed} ในราคาเพียง ${price} บาท`,
                `${p} ผสานเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit2TH}ในแพ็กเกจ${modName.TH}อันทรงพลัง`,
                `${p} คือแผน${ptName.TH}${modName.TH}ที่เชื่อถือได้ด้วยเน็ต ${dataAmount} และโทรฟรีไม่จำกัด`,
            ],
        },

        // ===== OTHER CONDITION =====
        otherCondition: {
            EN: [
                `Promotion is valid for new ${modName.EN} customers only`,
                `This offer is available for a limited time only`,
                `Valid for ${validity} days from the date of activation`,
                `Fair usage policy applies once the ${dataAmount} data limit is reached`,
                `This promotion cannot be combined with any other offer`,
                `Subject to credit check and approval`,
                `Auto renews each month unless cancelled before the renewal date`,
                `Terms and conditions of this promotion apply`,
                `Available to Thai nationals and residents only`,
                `Minimum contract period of ${contractMonths} months applies`,
                `Network availability may vary by location`,
                `Prices are inclusive of VAT unless stated otherwise`,
                `Package must be activated within ${validity} days of subscription`,
                `Data speed may be reduced after reaching ${dataAmount} limit`,
                `This offer applies to personal use accounts only`,
                `Promotional pricing valid for the first ${contractMonths} months`,
                `Service subject to network coverage in your area`,
                `One promotional package per customer account`,
                `Package features and pricing are subject to change without notice`,
                `Data allowance resets at the start of each billing cycle`,
            ],
            TH: [
                `โปรโมชันสำหรับลูกค้า${modName.TH}ใหม่เท่านั้น`,
                `ข้อเสนอนี้มีระยะเวลาจำกัดเท่านั้น`,
                `มีอายุ ${validity} วันนับจากวันที่เปิดใช้งาน`,
                `นโยบายการใช้งานที่เหมาะสมมีผลเมื่อใช้เน็ตครบ ${dataAmount}`,
                `โปรโมชันนี้ไม่สามารถใช้ร่วมกับข้อเสนออื่นได้`,
                `ขึ้นอยู่กับการตรวจสอบและอนุมัติเครดิต`,
                `ต่ออายุอัตโนมัติทุกเดือนหากไม่ยกเลิกก่อนวันต่ออายุ`,
                `ข้อกำหนดและเงื่อนไขของโปรโมชันนี้มีผลบังคับใช้`,
                `สำหรับบุคคลสัญชาติไทยและผู้มีถิ่นพำนักในประเทศไทยเท่านั้น`,
                `มีระยะสัญญาขั้นต่ำ ${contractMonths} เดือน`,
                `ความครอบคลุมเครือข่ายอาจแตกต่างกันตามพื้นที่`,
                `ราคารวมภาษีมูลค่าเพิ่มแล้วหากไม่ระบุเป็นอย่างอื่น`,
                `ต้องเปิดใช้งานแพ็กเกจภายใน ${validity} วันหลังการสมัคร`,
                `ความเร็วอินเทอร์เน็ตอาจลดลงหลังใช้ครบ ${dataAmount}`,
                `ข้อเสนอนี้ใช้ได้กับบัญชีส่วนตัวเท่านั้น`,
                `ราคาโปรโมชันใช้ได้สำหรับ ${contractMonths} เดือนแรก`,
                `บริการขึ้นอยู่กับการครอบคลุมสัญญาณในพื้นที่ของคุณ`,
                `หนึ่งแพ็กเกจโปรโมชันต่อบัญชีลูกค้าหนึ่งราย`,
                `ฟีเจอร์และราคาของแพ็กเกจอาจเปลี่ยนแปลงได้โดยไม่ต้องแจ้งล่วงหน้า`,
                `ปริมาณเน็ตจะรีเซ็ตในช่วงต้นรอบการเรียกเก็บเงินใหม่แต่ละรอบ`,
            ],
        },

        // ===== MEMO DESCRIPTION =====
        memoDescription: {
            EN: [
                `${p} internal configuration notes for reference and validation`,
                `${p} ${modName.EN} ${ptName.EN} setup memo PO ${po}`,
                `Product parameters: ${dataAmount} data at ${speed} price ${price} THB`,
                `${p} created for system testing and quality validation`,
                `Memo: ${p} configuration completed with standard settings`,
                `${p} package details: ${dataAmount} ${speed} ${price} THB for internal use`,
                `Internal reference: ${p} ${ptName.EN} ${modName.EN} PO ${po}`,
                `${p} setup record: data ${dataAmount} speed ${speed} monthly ${price} THB`,
                `Validation memo for ${p} ${modName.EN} package configuration`,
                `${p} created and verified for deployment PO ${po}`,
            ],
            TH: [
                `บันทึกการกำหนดค่าภายในสำหรับ ${p} เพื่อใช้อ้างอิงและตรวจสอบ`,
                `บันทึกการตั้งค่า ${p} ${modName.TH} ${ptName.TH} PO ${po}`,
                `พารามิเตอร์ผลิตภัณฑ์: เน็ต ${dataAmount} ที่ ${speed} ราคา ${price} บาท`,
                `${p} สร้างขึ้นเพื่อการทดสอบระบบและการตรวจสอบคุณภาพ`,
                `บันทึก: การกำหนดค่า ${p} เสร็จสมบูรณ์ด้วยการตั้งค่ามาตรฐาน`,
                `รายละเอียดแพ็กเกจ ${p}: เน็ต ${dataAmount} ${speed} ${price} บาทสำหรับใช้ภายใน`,
                `อ้างอิงภายใน: ${p} ${ptName.TH} ${modName.TH} PO ${po}`,
                `บันทึกการตั้งค่า ${p}: เน็ต ${dataAmount} ความเร็ว ${speed} รายเดือน ${price} บาท`,
                `บันทึกการตรวจสอบสำหรับการกำหนดค่าแพ็กเกจ ${p} ${modName.TH}`,
                `${p} สร้างและตรวจสอบพร้อมสำหรับการใช้งาน PO ${po}`,
            ],
        },

        // ===== DISCOUNT NAME =====
        discountName: {
            EN: [
                `${p} New Member Discount`,
                `${p} Loyalty Reward`,
                `${p} Activation Saving`,
                `${p} Early Bird Saving`,
                `${p} Seasonal Offer`,
                `${p} Bundle Saving`,
                `${p} Data Bonus`,
                `${p} Speed Upgrade`,
                `${p} Referral Reward`,
                `${p} Renewal Discount`,
                `${p} First Month Saving`,
                `${p} Annual Discount`,
                `${p} Intro Rate`,
                `${p} Welcome Discount`,
                `${p} Sign Up Saving`,
                `${p} Upgrade Benefit`,
                `${p} Member Privilege`,
                `${p} Value Boost`,
                `${p} Price Cut`,
                `${p} Trade In Offer`,
            ],
            TH: [
                `ส่วนลดสมาชิกใหม่ ${p}`,
                `รางวัลความภักดี ${p}`,
                `ส่วนลดเปิดใช้งาน ${p}`,
                `ส่วนลดจองล่วงหน้า ${p}`,
                `ข้อเสนอตามฤดูกาล ${p}`,
                `ประหยัดจากบันเดิล ${p}`,
                `โบนัสเน็ต ${p}`,
                `อัปเกรดความเร็ว ${p}`,
                `รางวัลแนะนำเพื่อน ${p}`,
                `ส่วนลดต่ออายุ ${p}`,
                `ประหยัดเดือนแรก ${p}`,
                `ส่วนลดรายปี ${p}`,
                `ราคาแนะนำ ${p}`,
                `ส่วนลดต้อนรับ ${p}`,
                `ประหยัดจากการสมัคร ${p}`,
                `สิทธิพิเศษอัปเกรด ${p}`,
                `สิทธิพิเศษสมาชิก ${p}`,
                `เพิ่มคุณค่า ${p}`,
                `ลดราคา ${p}`,
                `ข้อเสนอเปลี่ยนเครือข่าย ${p}`,
            ],
        },
    };
};

// ========================
// TYPES
// ========================
type LengthType = 'short' | 'medium' | 'long';
type LangType = 'EN' | 'TH';
type MetadataType = 'devStatus' | 'approval' | 'channel' | 'credit';
type RemarkStyle = 'technical' | 'business' | 'operational' | 'summary';

interface PackageSegment {
  min: number;
  max: number;
  labelEN: string;
  labelTH: string;
  descEN: string;
  descTH: string;
}

interface PackageContext {
  pName: string;
  pOName: string;
  pType: string;
  pClass: string;
  sModule: string;
  mod: string;
  ptDisplay: { EN: string; TH: string };
  pcDisplay: { EN: string; TH: string };
  modDisplay: { EN: string; TH: string };
  smDisplay: { EN: string; TH: string };
  selectedData: string;
  priceAmount: number;
  networkType: string;
  maxSpeed: string;
  contractMonths: number;
  validityDays: number;
  launchTiming: string;
  segment: PackageSegment;
  benefit1: { EN: string; TH: string };
  benefit2: { EN: string; TH: string };
  productCode: string;
  randomId: string;
  subscriberTarget: string;
  dates: {
    thaiDate: string;
    engDate: string;
    currentTime: string;
    isoDate: string;
  };
}

interface PoolData {
  EN: string[];
  TH: string[];
}

type PoolsRecord = Record<LengthType, PoolData>;

// ========================
// CONSTANTS
// ========================
const WAIT_TIME = 4000;
const MAX_REMARK_LENGTH = 1000;
const MAX_DESC_LENGTH = 2000;

// ========================
// SHARED HELPERS
// ========================
const pickMultiple = <T>(arr: readonly T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};

const weightedChoice = <T extends string>(
  choices: ReadonlyArray<{ value: T; weight: number }>
): T => {
  const total = choices.reduce((sum, c) => sum + c.weight, 0);
  let rand = Math.random() * total;
  for (const choice of choices) {
    if (rand < choice.weight) return choice.value;
    rand -= choice.weight;
  }
  return choices[choices.length - 1].value;
};

const scrollToElement = (selector: string, sectionName: string): void => {
  cy.log(`📌 Scrolling to: ${sectionName}`);
  cy.get(selector).first().scrollIntoView({ duration: 500, offset: { top: -100, left: 0 } });
  cy.wait(600);
};

// ========================
// DATA CONFIGURATIONS
// ========================
const PRICE_BY_DATA: Record<string, { min: number; max: number }> = {
  '5GB':       { min: 99,   max: 199  },
  '10GB':      { min: 199,  max: 399  },
  '15GB':      { min: 299,  max: 499  },
  '30GB':      { min: 399,  max: 699  },
  '50GB':      { min: 599,  max: 999  },
  '100GB':     { min: 899,  max: 1499 },
  '150GB':     { min: 1199, max: 1999 },
  '200GB':     { min: 1499, max: 2499 },
  'Unlimited': { min: 1999, max: 3999 },
};

const SPEED_BY_NETWORK: Record<string, string[]> = {
  '4G':          ['10 Mbps', '25 Mbps', '50 Mbps', '100 Mbps'],
  '5G-Standard': ['100 Mbps', '300 Mbps', '500 Mbps'],
  '5G-Premium':  ['500 Mbps', '1 Gbps', '2 Gbps'],
};

const TARGET_SEGMENTS: Record<string, PackageSegment> = {
  Youth: {
    min: 18, max: 25,
    labelEN: 'Youth (18-25)', labelTH: 'วัยรุ่น (18-25 ปี)',
    descEN: 'digital-native users who prioritize social media, streaming, and gaming',
    descTH: 'ผู้ใช้เจนเนอเรชันดิจิทัลที่ให้ความสำคัญกับโซเชียลมีเดีย สตรีมมิ่ง และเกม',
  },
  YoungPro: {
    min: 22, max: 35,
    labelEN: 'Young Professionals (22-35)', labelTH: 'วัยทำงานต้น (22-35 ปี)',
    descEN: 'career-focused individuals needing reliable connectivity for work and lifestyle',
    descTH: 'คนทำงานที่เน้นการเชื่อมต่อที่เชื่อถือได้สำหรับงานและไลฟ์สไตล์',
  },
  Family: {
    min: 30, max: 50,
    labelEN: 'Families (30-50)', labelTH: 'ครอบครัว (30-50 ปี)',
    descEN: 'households seeking shared data plans and parental control features',
    descTH: 'ครัวเรือนที่ต้องการแพ็กเกจแชร์เน็ตและฟีเจอร์ควบคุมโดยผู้ปกครอง',
  },
  Senior: {
    min: 55, max: 70,
    labelEN: 'Seniors (55+)', labelTH: 'ผู้สูงอายุ (55+ ปี)',
    descEN: 'older adults needing simple and reliable communication',
    descTH: 'ผู้สูงอายุที่ต้องการการสื่อสารที่เรียบง่ายและเชื่อถือได้',
  },
  Mass: {
    min: 18, max: 60,
    labelEN: 'Mass Market (18-60)', labelTH: 'ตลาดทั่วไป (18-60 ปี)',
    descEN: 'broad consumer base looking for balanced value and performance',
    descTH: 'กลุ่มผู้บริโภคทั่วไปที่มองหาความคุ้มค่าและประสิทธิภาพที่สมดุล',
  },
  Student: {
    min: 18, max: 24,
    labelEN: 'Students (18-24)', labelTH: 'นักศึกษา (18-24 ปี)',
    descEN: 'students needing affordable data for study and entertainment',
    descTH: 'นักศึกษาที่ต้องการเน็ตราคาประหยัดเพื่อการศึกษาและความบันเทิง',
  },
  SME: {
    min: 25, max: 55,
    labelEN: 'SME Owners (25-55)', labelTH: 'เจ้าของธุรกิจ (25-55 ปี)',
    descEN: 'small business owners requiring reliable mobile connectivity',
    descTH: 'เจ้าของธุรกิจขนาดเล็กที่ต้องการการเชื่อมต่อมือถือที่เชื่อถือได้',
  },
};

// ========================
// DISPLAY MAPPINGS
// ========================
const PRICE_TYPE_DISPLAY: Record<string, { EN: string; TH: string }> = {
  onetime:   { EN: 'One-Time Charge',    TH: 'ชำระครั้งเดียว' },
  recurring: { EN: 'Monthly Recurring',  TH: 'รายเดือน' },
  usage:     { EN: 'Usage-Based',        TH: 'ตามการใช้งาน' },
};

const PRODUCT_CLASS_DISPLAY: Record<string, { EN: string; TH: string }> = {
  main:       { EN: 'Main Package',    TH: 'แพ็กเกจหลัก' },
  ontop:      { EN: 'On-Top Add-on',   TH: 'แพ็กเกจเสริม' },
  ontopextra: { EN: 'On-Top Extra',    TH: 'แพ็กเกจเสริมพิเศษ' },
};

const MODULE_DISPLAY: Record<string, { EN: string; TH: string }> = {
  MOB:     { EN: 'Mobile',          TH: 'มือถือ' },
  ENTER:   { EN: 'Entertainment',   TH: 'บันเทิง' },
  MUSIC:   { EN: 'Music',           TH: 'เพลง' },
  FIXED:   { EN: 'Fixed Broadband', TH: 'อินเทอร์เน็ตบ้าน' },
};

const SUB_MODULE_DISPLAY: Record<string, { EN: string; TH: string }> = {
  PRE:  { EN: 'Prepaid',  TH: 'เติมเงิน' },
  POST: { EN: 'Postpaid', TH: 'รายเดือน' },
};

const BENEFITS_BY_CLASS: Record<string, { EN: string[]; TH: string[] }> = {
  main: {
    EN: [
      '5G Network Access',
      'Unlimited On-net Calls',
      'Rollover Data',
      'Free SIM/eSIM',
      'Priority Customer Support',
      'International Roaming Discount',
      'Device Installment',
      'Free Streaming Apps',
      'Cloud Storage 100GB',
      'Family Sharing',
    ],
    TH: [
      'ใช้งานเครือข่าย 5G',
      'โทรฟรีในเครือข่ายไม่จำกัด',
      'ยกยอดเน็ตได้',
      'ซิม/eSIM ฟรี',
      'บริการลูกค้าพิเศษ',
      'ส่วนลดโรมมิ่งต่างประเทศ',
      'ผ่อนชำระอุปกรณ์',
      'แอปสตรีมมิ่งฟรี',
      'พื้นที่คลาวด์ 100GB',
      'แชร์ให้ครอบครัว',
    ],
  },
  ontop: {
    EN: [
      '5G Network Access',
      'Unlimited On-net Calls',
      'Rollover Data',
      'Free SIM/eSIM',
      'Streaming App Subscription',
      'Cloud Storage Bonus',
      'International Data Add-on',
      'Gaming Accelerator',
      'Social Media Pack',
      'Weekend Unlimited Data',
    ],
    TH: [
      'ใช้งานเครือข่าย 5G',
      'โทรฟรีในเครือข่ายไม่จำกัด',
      'ยกยอดเน็ตได้',
      'ซิม/eSIM ฟรี',
      'สมัครสตรีมมิ่งแอป',
      'เพิ่มพื้นที่คลาวด์',
      'แพ็กเกจเน็ตต่างประเทศ',
      'ตัวเร่งความเร็วเกม',
      'แพ็กโซเชียลมีเดีย',
      'เน็ตไม่จำกัดวันหยุด',
    ],
  },
};

const METADATA_POOLS: Record<MetadataType, PoolData> = {
  devStatus: {
    EN: ['Draft', 'In Review', 'Pending Approval', 'Ready for UAT', 'Approved', 'In Testing', 'QA Passed'],
    TH: ['ฉบับร่าง', 'อยู่ระหว่างตรวจสอบ', 'รออนุมัติ', 'พร้อมทดสอบ', 'อนุมัติแล้ว', 'อยู่ระหว่างเทสต์', 'ผ่าน QA'],
  },
  approval: {
    EN: ['Product: Pending', 'Pricing: Approved', 'Legal: Under Review', 'Compliance: Approved', 'Finance: Signed Off'],
    TH: ['ผลิตภัณฑ์: รอดำเนินการ', 'ราคา: อนุมัติแล้ว', 'กฎหมาย: ระหว่างตรวจสอบ', 'กำกับดูแล: อนุมัติแล้ว', 'การเงิน: เซ็นอนุมัติ'],
  },
  channel: {
    EN: ['Digital', 'All Channels', 'Retail + Digital', 'Online Exclusive', 'App Only', 'Partner Channels'],
    TH: ['ดิจิทัล', 'ทุกช่องทาง', 'ร้านค้า + ดิจิทัล', 'ออนไลน์เท่านั้น', 'แอปเท่านั้น', 'ช่องทางพาร์ทเนอร์'],
  },
  credit: {
    EN: ['No Deposit', '1,000 THB Deposit', '3,000 THB Deposit', 'Credit Score 600+', 'Guarantor Required'],
    TH: ['ไม่ต้องวางประกัน', 'วางประกัน 1,000 บาท', 'วางประกัน 3,000 บาท', 'คะแนนเครดิต 600+', 'ต้องมีผู้ค้ำประกัน'],
  },
};

// ========================
// WORDING POOLS (DIVERSE & REALISTIC)
// ========================

// ---------- REMARK POOLS ----------
const REMARK_POOLS: Record<LengthType, Record<RemarkStyle, PoolData>> = {
  short: {
    technical: {
      EN: [
        `{pName} config: {pcEN} {modEN} {smEN}. {data}@{speed} on {network}. {price}THB/{unit}. Build#{rId}.`,
        `PO#{pO}: {pName} ready. {network} network, {data} quota, {speed} cap. Status: {devStatus}.`,
        `{pName}: {data}/{speed}/{price}THB. {network} ready. Ref:{rId}. Deploy:{timing}.`,
        `Tech spec {pName}: {pcEN} tier. {data}@{speed}. CBS code:{pCode}. UAT:{devStatus}.`,
        `{pName} package: {modEN}/{smEN}/{pcEN}. {data} allowance. {network} backbone. ID:{rId}.`,
      ],
      TH: [
        `{pName} config: {pcTH} {modTH} {smTH}. {data}@{speed} บน {network}. {price}บาท/{unit}. Build#{rId}.`,
        `PO#{pO}: {pName} พร้อม. เครือข่าย{network} เน็ต{data} ความเร็ว{speed}. สถานะ:{devStatus}.`,
        `{pName}: {data}/{speed}/{price}บาท. {network} พร้อม. อ้างอิง:{rId}. เปิดตัว:{timing}.`,
        `สเปกเทคนิค {pName}: ระดับ{pcTH}. {data}@{speed}. รหัสCBS:{pCode}. UAT:{devStatus}.`,
        `แพ็กเกจ {pName}: {modTH}/{smTH}/{pcTH}. ปริมาณ{data}. แบ็คโบน{network}. ID:{rId}.`,
      ],
    },
    business: {
      EN: [
        `{pName}: {pcEN} targeting {segEN}. {price}THB/{unit} | {data}@{speed}. Launch {timing}.`,
        `PO#{pO} | {pName} | {segEN} segment | {price}THB | {contract}mo term. ROI positive.`,
        `{pName} ready for {timing} launch. {pcEN} tier, {price}THB price point, {segEN} focus.`,
        `Commercial brief: {pName} {pcEN} for {segEN}. {price}THB/{unit}. {benefit1} included.`,
        `{pName} positioning: {price}THB {pcEN} vs market avg {price+200}THB. Margin OK.`,
      ],
      TH: [
        `{pName}: {pcTH} มุ่งเป้า{segTH}. {price}บาท/{unit} | {data}@{speed}. เปิดตัว {timing}.`,
        `PO#{pO} | {pName} | กลุ่ม{segTH} | {price}บาท | สัญญา{contract}เดือน. ROI เป็นบวก.`,
        `{pName} พร้อมเปิดตัว{timing}. ระดับ{pcTH} จุดราคา{price}บาท โฟกัส{segTH}.`,
        `สรุปเชิงพาณิชย์: {pName} {pcTH} สำหรับ{segTH}. {price}บาท/{unit}. รวม{benefit1}.`,
        `การวางตำแหน่ง {pName}: {price}บาท {pcTH} เทียบตลาดเฉลี่ย{price+200}บาท. มาร์จิ้นโอเค.`,
      ],
    },
    operational: {
      EN: [
        `OPS: {pName} CBS mapped. {price}THB billing cycle. {contract}mo auto-renew. Ready.`,
        `{pName} provisioned. {data} quota set. Throttle@128kbps post-limit. {devStatus}.`,
        `Deploy {pName}: CRM+CBS+IN synced. {smEN} logic applied. {benefit1} active.`,
        `{pName} live in staging. {network} test OK. {price}THB billing verified.`,
        `OPS note {pName}: {data} daily reset. {validity}d validity. {channel} channel.`,
      ],
      TH: [
        `OPS: {pName} เชื่อมCBSแล้ว. รอบบิล{price}บาท. ต่ออายุอัตโนมัติ{contract}เดือน. พร้อม.`,
        `{pName} provisionแล้ว. ตั้งโควต้า{data}. ลดความเร็ว@128kbps หลังครบ. {devStatus}.`,
        `Deploy {pName}: ซิงค์ CRM+CBS+IN. ใช้ logic {smTH}. {benefit1} active.`,
        `{pName} live ใน staging. เทสต์{network}ผ่าน. บิล{price}บาท verified.`,
        `OPS note {pName}: รีเซ็ต{data}ทุกวัน. อายุ{validity}วัน. ช่องทาง{channel}.`,
      ],
    },
    summary: {
      EN: [
        `{pName} | {pcEN} | {price}THB | {data}@{speed} | {segEN} | {timing}.`,
        `PO#{pO}: {pName} draft. {modEN}/{smEN}/{pcEN}. {price}THB. Status:{devStatus}.`,
        `{pName}: {data} data, {speed}, {price}THB/{unit}. Target:{segEN}.`,
        `New: {pName} {pcEN} @ {price}THB. {network}. {benefit1}. ID:{rId}.`,
        `{pName} setup done. {contract}mo, {data}, {speed}, {price}THB. Pending approval.`,
      ],
      TH: [
        `{pName} | {pcTH} | {price}บาท | {data}@{speed} | {segTH} | {timing}.`,
        `PO#{pO}: {pName} ฉบับร่าง. {modTH}/{smTH}/{pcTH}. {price}บาท. สถานะ:{devStatus}.`,
        `{pName}: เน็ต{data} ความเร็ว{speed} {price}บาท/{unit}. เป้า:{segTH}.`,
        `ใหม่: {pName} {pcTH} @ {price}บาท. {network}. {benefit1}. ID:{rId}.`,
        `ตั้งค่า {pName} เสร็จ. {contract}เดือน {data} {speed} {price}บาท. รออนุมัติ.`,
      ],
    },
  },
  medium: {
    technical: {
      EN: [
        `[TECH] {pName} setup complete. Package type: {pcEN} for {modEN} {smEN}. Data allowance: {data} high-speed on {network} with {speed} cap. Post-limit throttle: 128 Kbps. Billing: {price}THB/{unit} ({ptEN}). Contract: {contract} months. CBS mapping verified. Product code: {pCode}. Status: {devStatus}.`,
        `Config log {pName}: {modEN} > {pcEN} > {smEN}. Network: {network}, max speed {speed}. Quota: {data} with rollover enabled. SIM type: eSIM/SIM dual. Provisioning: CRM-CBS-IN sync complete. Price: {price}THB, VAT inclusive. Auto-renew: {autoRenew}. Ref: {rId}.`,
        `{pName} technical spec: {data} @ {speed} on {network} backbone. FUP applies after quota. Voice: unlimited on-net. SMS: 100/month. USSD: *123# for balance. API endpoint ready. CBS rate plan: {price}THB/{unit}. UAT sign-off pending. Build: {rId}.`,
        `System note {pName}: {pcEN} tier configured. {network} QoS priority: high. Throttle policy: 128kbps post-{data}. Validity: {validity} days from activation. Credit check: {credit}. Provisioning channel: {channel}. PO reference: {pO}. Code: {pCode}.`,
      ],
      TH: [
        `[TECH] ตั้งค่า {pName} เสร็จ. ประเภทแพ็กเกจ: {pcTH} สำหรับ{modTH} {smTH}. ปริมาณเน็ต: {data} ความเร็วสูงบน{network} จำกัดที่{speed}. ลดความเร็วหลังครบ: 128 Kbps. บิลลิ่ง: {price}บาท/{unit} ({ptTH}). สัญญา: {contract}เดือน. แมปCBSแล้ว. รหัสผลิตภัณฑ์: {pCode}. สถานะ: {devStatus}.`,
        `Log config {pName}: {modTH} > {pcTH} > {smTH}. เครือข่าย: {network} ความเร็วสูงสุด{speed}. โควต้า: {data} เปิดยกยอด. ประเภทซิม: eSIM/SIM dual. Provisioning: ซิงค์ CRM-CBS-IN เรียบร้อย. ราคา: {price}บาท รวมVAT. ต่ออายุอัตโนมัติ: {autoRenew}. อ้างอิง: {rId}.`,
        `สเปกเทคนิค {pName}: {data} @ {speed} บนแบ็คโบน{network}. ใช้FUPหลังครบโควต้า. โทร: ไม่จำกัดในเครือข่าย. SMS: 100/เดือน. USSD: *123# เช็กยอด. API endpoint พร้อม. อัตราCBS: {price}บาท/{unit}. รอเซ็นUAT. Build: {rId}.`,
        `โน้ตระบบ {pName}: ตั้งระดับ{pcTH}แล้ว. QoS {network}: ลำดับสูง. นโยบายลดความเร็ว: 128kbps หลัง{data}. อายุ: {validity}วันนับจากเปิดใช้. ตรวจสอบเครดิต: {credit}. ช่องทางprovisioning: {channel}. POอ้างอิง: {pO}. รหัส: {pCode}.`,
      ],
    },
    business: {
      EN: [
        `[BIZ] {pName} commercial brief. Target: {segEN} - {segDescEN}. Positioning: {pcEN} tier at {price}THB/{unit} (market avg {price+200}THB). Key differentiator: {benefit1} + {benefit2}. Contract: {contract} months with {autoRenew} auto-renew. Launch window: {timing}. Subscriber goal: {target} in first 90 days. Channel: {channel}. Approval: {approval}. PO: {pO}.`,
        `{pName} go-to-market plan. Segment: {segEN} (age {minAge}-{maxAge}). Price point: {price}THB positions us 15% below premium competitors. Data: {data} at {speed} on {network}. Value props: {benefit1}, {benefit2}. Sales channel: {channel}. Credit policy: {credit}. Launch: {timing}. Margin analysis: positive at 5K subs. Ref: {rId}.`,
        `Commercial memo {pName}: {pcEN} offering for {segEN}. Revenue: {price}THB × {contract}mo = {totalRev}THB LTV. CAC target: 800THB. Breakeven: 4 months. Feature set: {data}, {speed}, {network}, {benefit1}. Competitive edge: {benefit2}. Launch: {timing} via {channel}. Status: {devStatus}.`,
        `{pName} business case. Market gap: affordable {pcEN} for {segEN}. Solution: {data} data + {benefit1} at {price}THB. Risk: {credit} may limit uptake. Mitigation: {channel} exclusive launch. Projected: {target} subs in Q1. ARPU: {price}THB. Churn risk: low (12mo contract). PO: {pO}.`,
      ],
      TH: [
        `[BIZ] สรุปเชิงพาณิชย์ {pName}. เป้าหมาย: {segTH} - {segDescTH}. การวางตำแหน่ง: ระดับ{pcTH} ที่{price}บาท/{unit} (ตลาดเฉลี่ย{price+200}บาท). จุดต่าง: {benefit1} + {benefit2}. สัญญา: {contract}เดือน พร้อมต่ออายุอัตโนมัติ{autoRenew}. หน้าต่างเปิดตัว: {timing}. เป้าสมาชิก: {target} ใน 90 วันแรก. ช่องทาง: {channel}. อนุมัติ: {approval}. PO: {pO}.`,
        `แผนออกตลาด {pName}. กลุ่ม: {segTH} (อายุ{minAge}-{maxAge}). จุดราคา: {price}บาท ต่ำกว่าคู่แข่งพรีเมียม 15%. เน็ต: {data} ที่{speed} บน{network}. ข้อเสนอคุณค่า: {benefit1}, {benefit2}. ช่องทางขาย: {channel}. นโยบายเครดิต: {credit}. เปิดตัว: {timing}. วิเคราะห์มาร์จิ้น: บวกที่ 5K สมาชิก. อ้างอิง: {rId}.`,
        `บันทึกเชิงพาณิชย์ {pName}: ข้อเสนอ{pcTH} สำหรับ{segTH}. รายได้: {price}บาท × {contract}เดือน = LTV {totalRev}บาท. เป้าCAC: 800บาท. จุดคุ้มทุน: 4 เดือน. ชุดฟีเจอร์: {data}, {speed}, {network}, {benefit1}. ข้อได้เปรียบ: {benefit2}. เปิดตัว: {timing} ผ่าน{channel}. สถานะ: {devStatus}.`,
        `Business case {pName}. ช่องว่างตลาด: {pcTH} ราคาจับต้องได้สำหรับ{segTH}. ทางออก: เน็ต{data} + {benefit1} ที่{price}บาท. ความเสี่ยง: {credit} อาจจำกัด uptake. ลดความเสี่ยง: เปิดตัวเฉพาะ{channel}. คาดการณ์: {target} สมาชิกในQ1. ARPU: {price}บาท. ความเสี่ยงchurn: ต่ำ (สัญญา12เดือน). PO: {pO}.`,
      ],
    },
    operational: {
      EN: [
        `[OPS] {pName} deployment checklist. ✓ CBS rate plan {price}THB/{unit}. ✓ CRM product {pCode}. ✓ IN quota {data}. ✓ Provisioning {channel}. ✓ Billing cycle {contract}mo. ✓ Auto-renew {autoRenew}. ✓ Throttle 128kbps. ✓ SMS templates EN/TH. Pending: {approval}. ETA: {timing}. Owner: Product Ops. Ref: {rId}.`,
        `OPS readiness {pName}. Systems: CBS ✓ | CRM ✓ | IN ✓ | Self-care ✓ | IVR ✓. Data: {data} with rollover. Speed: {speed} on {network}. Price: {price}THB VAT incl. Contract: {contract}mo. Validity: {validity}d. Grace period: 7d. Suspension: day 8. Termination: day 30. Monitoring: Grafana dashboard live. PO: {pO}.`,
        `{pName} ops runbook. Activation: real-time via {channel}. Quota reset: daily at 00:00. Speed throttle: 128kbps post-{data}. Upgrade path: to next tier via USSD *123#. Downgrade: end of cycle. Refund: pro-rated. Escalation: L2 support. SLA: 99.9% uptime. Status: {devStatus}. Code: {pCode}.`,
        `Production note {pName}. Launch: {timing}. Initial capacity: {target} subs. Peak load: 10K activations/day. Rollback plan: disable in CBS, migrate subs to {pcEN}-fallback. Monitoring: Datadog alerts on quota >95%. Support: FAQ ready, agent training scheduled. PO: {pO}.`,
      ],
      TH: [
        `[OPS] เช็กลิสต์ deploy {pName}. ✓ อัตราCBS {price}บาท/{unit}. ✓ ผลิตภัณฑ์CRM {pCode}. ✓ โควต้าIN {data}. ✓ Provisioning {channel}. ✓ รอบบิล{contract}เดือน. ✓ ต่ออายุอัตโนมัติ{autoRenew}. ✓ ลดความเร็ว128kbps. ✓ เทมเพลตSMS EN/TH. รอ: {approval}. ETA: {timing}. เจ้าของ: Product Ops. อ้างอิง: {rId}.`,
        `ความพร้อมOPS {pName}. ระบบ: CBS ✓ | CRM ✓ | IN ✓ | Self-care ✓ | IVR ✓. เน็ต: {data} พร้อมยกยอด. ความเร็ว: {speed} บน{network}. ราคา: {price}บาท รวมVAT. สัญญา: {contract}เดือน. อายุ: {validity}วัน. ระยะผ่อนผัน: 7วัน. ระงับ: วันที่8. ยกเลิก: วันที่30. Monitoring: dashboard Grafana live. PO: {pO}.`,
        `Runbook ops {pName}. เปิดใช้: real-time ผ่าน{channel}. รีเซ็ตโควต้า: ทุกวัน 00:00. ลดความเร็ว: 128kbps หลัง{data}. อัปเกรด: ไประดับถัดไปผ่าน USSD *123#. ดาวน์เกรด: สิ้นรอบ. คืนเงิน: ตามสัดส่วน. Escalation: support L2. SLA: uptime 99.9%. สถานะ: {devStatus}. รหัส: {pCode}.`,
        `โน้ตproduction {pName}. เปิดตัว: {timing}. ความจุเริ่มต้น: {target}สมาชิก. Peak load: 10K เปิดใช้/วัน. แผน rollback: ปิดในCBS ย้ายสมาชิกไป{pcTH}-fallback. Monitoring: alert Datadog เมื่อโควต้า>95%. Support: FAQพร้อม อบรมพนักงานนัดแล้ว. PO: {pO}.`,
      ],
    },
    summary: {
      EN: [
        `{pName} summary. Type: {pcEN} for {modEN} {smEN}. Specs: {data} data @ {speed} on {network}. Price: {price}THB/{unit} ({ptEN}). Contract: {contract}mo. Target: {segEN}. Benefits: {benefit1}, {benefit2}. Launch: {timing}. Channel: {channel}. Status: {devStatus}. PO: {pO}. Code: {pCode}. Ref: {rId}.`,
        `Quick brief {pName}: {pcEN} {modEN} {smEN}. {data}@{speed}, {price}THB/{unit}. {contract}mo term, {autoRenew}. For {segEN}. Includes {benefit1}. Launch {timing} via {channel}. {devStatus}. {pO}.`,
        `{pName} at a glance: {data} | {speed} | {price}THB | {contract}mo | {segEN} | {timing}. Benefits: {benefit1}, {benefit2}. Network: {network}. Status: {devStatus}. PO: {pO}.`,
        `One-pager {pName}: {pcEN} tier {modEN} {smEN}. {data}@{speed} on {network}. {price}THB/{unit}. {segEN} target. Launch {timing}. {benefit1} + {benefit2}. {channel} channel. {devStatus}. {pO} | {pCode}.`,
      ],
      TH: [
        `สรุป {pName}. ประเภท: {pcTH} สำหรับ{modTH} {smTH}. สเปก: เน็ต{data} @ {speed} บน{network}. ราคา: {price}บาท/{unit} ({ptTH}). สัญญา: {contract}เดือน. เป้าหมาย: {segTH}. สิทธิ: {benefit1}, {benefit2}. เปิดตัว: {timing}. ช่องทาง: {channel}. สถานะ: {devStatus}. PO: {pO}. รหัส: {pCode}. อ้างอิง: {rId}.`,
        `สรุปย่อ {pName}: {pcTH} {modTH} {smTH}. {data}@{speed}, {price}บาท/{unit}. สัญญา{contract}เดือน, {autoRenew}. สำหรับ{segTH}. รวม{benefit1}. เปิดตัว{timing} ผ่าน{channel}. {devStatus}. {pO}.`,
        `{pName} แบบดูง่าย: {data} | {speed} | {price}บาท | {contract}เดือน | {segTH} | {timing}. สิทธิ: {benefit1}, {benefit2}. เครือข่าย: {network}. สถานะ: {devStatus}. PO: {pO}.`,
        `One-pager {pName}: ระดับ{pcTH} {modTH} {smTH}. {data}@{speed} บน{network}. {price}บาท/{unit}. เป้า{segTH}. เปิดตัว{timing}. {benefit1} + {benefit2}. ช่องทาง{channel}. {devStatus}. {pO} | {pCode}.`,
      ],
    },
  },
  long: {
    technical: {
      EN: [
        `[TECHNICAL SPECIFICATION - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `Product Code: {pCode}\n` +
        `Package: {pcEN} | Module: {modEN} | Sub: {smEN}\n` +
        `───────────────────────────────────────\n` +
        `DATA QUOTA:\n` +
        `  • Allowance: {data} high-speed\n` +
        `  • Network: {network}\n` +
        `  • Max Speed: {speed}\n` +
        `  • Post-limit: 128 Kbps (basic connectivity)\n` +
        `  • Rollover: Enabled (up to 100% of unused)\n` +
        `  • Reset: Daily at 00:00 ICT\n` +
        `───────────────────────────────────────\n` +
        `BILLING:\n` +
        `  • Price: {price}THB/{unit} (VAT incl.)\n` +
        `  • Type: {ptEN}\n` +
        `  • Contract: {contract} months\n` +
        `  • Auto-renew: {autoRenew}\n` +
        `  • Grace period: 7 days\n` +
        `  • Suspension: Day 8 post-due\n` +
        `───────────────────────────────────────\n` +
        `FEATURES:\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • Unlimited on-net calls\n` +
        `  • 100 SMS/month\n` +
        `───────────────────────────────────────\n` +
        `SYSTEM INTEGRATION:\n` +
        `  • CBS: Rate plan mapped ✓\n` +
        `  • CRM: Product code {pCode} ✓\n` +
        `  • IN: Quota provisioning ✓\n` +
        `  • Self-care: UI ready ✓\n` +
        `  • IVR: Menu updated ✓\n` +
        `───────────────────────────────────────\n` +
        `DEPLOYMENT:\n` +
        `  • Status: {devStatus}\n` +
        `  • Channel: {channel}\n` +
        `  • Launch: {timing}\n` +
        `  • Capacity: {target} subs\n` +
        `  • PO Reference: {pO}\n` +
        `  • Build: {rId}\n` +
        `  • Created: {engDate} {time}`,
      ],
      TH: [
        `[ข้อกำหนดทางเทคนิค - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `รหัสผลิตภัณฑ์: {pCode}\n` +
        `แพ็กเกจ: {pcTH} | โมดูล: {modTH} | ย่อย: {smTH}\n` +
        `───────────────────────────────────────\n` +
        `โควต้าเน็ต:\n` +
        `  • ปริมาณ: {data} ความเร็วสูง\n` +
        `  • เครือข่าย: {network}\n` +
        `  • ความเร็วสูงสุด: {speed}\n` +
        `  • หลังครบ: 128 Kbps (เชื่อมต่อพื้นฐาน)\n` +
        `  • ยกยอด: เปิดใช้งาน (สูงสุด100%ของที่ไม่ใช้)\n` +
        `  • รีเซ็ต: ทุกวัน 00:00 ICT\n` +
        `───────────────────────────────────────\n` +
        `บิลลิ่ง:\n` +
        `  • ราคา: {price}บาท/{unit} (รวมVAT)\n` +
        `  • ประเภท: {ptTH}\n` +
        `  • สัญญา: {contract}เดือน\n` +
        `  • ต่ออายุอัตโนมัติ: {autoRenew}\n` +
        `  • ระยะผ่อนผัน: 7วัน\n` +
        `  • ระงับ: วันที่8 หลังครบกำหนด\n` +
        `───────────────────────────────────────\n` +
        `คุณสมบัติ:\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • โทรฟรีในเครือข่ายไม่จำกัด\n` +
        `  • SMS 100ข้อความ/เดือน\n` +
        `───────────────────────────────────────\n` +
        `เชื่อมต่อระบบ:\n` +
        `  • CBS: แมปอัตราแล้ว ✓\n` +
        `  • CRM: รหัสผลิตภัณฑ์{pCode} ✓\n` +
        `  • IN: Provisioningโควต้า ✓\n` +
        `  • Self-care: UIพร้อม ✓\n` +
        `  • IVR: อัปเดตเมนูแล้ว ✓\n` +
        `───────────────────────────────────────\n` +
        `Deployment:\n` +
        `  • สถานะ: {devStatus}\n` +
        `  • ช่องทาง: {channel}\n` +
        `  • เปิดตัว: {timing}\n` +
        `  • ความจุ: {target}สมาชิก\n` +
        `  • POอ้างอิง: {pO}\n` +
        `  • Build: {rId}\n` +
        `  • สร้างเมื่อ: {thaiDate}`,
      ],
    },
    business: {
      EN: [
        `[COMMERCIAL DOSSIER - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `EXECUTIVE SUMMARY:\n` +
        `{pName} is a {pcEN.toLowerCase()} offering targeting {segEN} (age {minAge}-{maxAge}). Positioned at {price}THB/{unit}, 15% below premium competitors while delivering comparable value.\n\n` +
        `MARKET CONTEXT:\n` +
        `  • Target segment: {segEN}\n` +
        `  • Segment size: ~2.5M subscribers\n` +
        `  • Current penetration: 38%\n` +
        `  • ARPU benchmark: {price+150}THB\n` +
        `  • Churn rate: 4.2% monthly\n\n` +
        `VALUE PROPOSITION:\n` +
        `  • {data} high-speed data on {network}\n` +
        `  • {speed} max throughput\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • {contract}-month commitment\n\n` +
        `FINANCIAL PROJECTION:\n` +
        `  • Month 1-3: {target} activations\n` +
        `  • Month 4-6: {target}×2 activations\n` +
        `  • LTV (24mo): {totalRev}THB\n` +
        `  • CAC target: 800THB\n` +
        `  • Breakeven: 4 months\n` +
        `  • Payback period: 6 months\n\n` +
        `GO-TO-MARKET:\n` +
        `  • Launch: {timing}\n` +
        `  • Channel: {channel}\n` +
        `  • Campaign: Digital-first + retail\n` +
        `  • Budget: 2.5M THB\n\n` +
        `RISK ASSESSMENT:\n` +
        `  • Credit risk: {credit}\n` +
        `  • Cannibalization: Low (different tier)\n` +
        `  • Competitive response: Expected in 60d\n\n` +
        `APPROVALS:\n` +
        `  • Product: {approval}\n` +
        `  • Finance: Signed off\n` +
        `  • Legal: Cleared\n\n` +
        `PO: {pO} | Code: {pCode} | Ref: {rId}`,
      ],
      TH: [
        `[เอกสารเชิงพาณิชย์ - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `สรุปผู้บริหาร:\n` +
        `{pName} เป็นข้อเสนอ{pcTH}ที่มุ่งเป้า{segTH} (อายุ{minAge}-{maxAge}) วางตำแหน่งที่{price}บาท/{unit} ต่ำกว่าคู่แข่งพรีเมียม15% ขณะที่คุณค่าเทียบเท่า\n\n` +
        `บริบทตลาด:\n` +
        `  • กลุ่มเป้าหมาย: {segTH}\n` +
        `  • ขนาดกลุ่ม: ~2.5ล้านสมาชิก\n` +
        `  • Penetrationปัจจุบัน: 38%\n` +
        `  • ARPU benchmark: {price+150}บาท\n` +
        `  • อัตราchurn: 4.2% ต่อเดือน\n\n` +
        `ข้อเสนอคุณค่า:\n` +
        `  • เน็ตความเร็วสูง{data} บน{network}\n` +
        `  • throughputสูงสุด{speed}\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • ผูกพัน{contract}เดือน\n\n` +
        `คาดการณ์การเงิน:\n` +
        `  • เดือน1-3: เปิดใช้{target}ราย\n` +
        `  • เดือน4-6: เปิดใช้{target}×2ราย\n` +
        `  • LTV (24เดือน): {totalRev}บาท\n` +
        `  • เป้าCAC: 800บาท\n` +
        `  • จุดคุ้มทุน: 4เดือน\n` +
        `  • ระยะpayback: 6เดือน\n\n` +
        `แผนออกตลาด:\n` +
        `  • เปิดตัว: {timing}\n` +
        `  • ช่องทาง: {channel}\n` +
        `  • แคมเปญ: ดิจิทัลนำ + ร้านค้า\n` +
        `  • งบประมาณ: 2.5ล้านบาท\n\n` +
        `ประเมินความเสี่ยง:\n` +
        `  • ความเสี่ยงเครดิต: {credit}\n` +
        `  • Cannibalization: ต่ำ (ระดับต่าง)\n` +
        `  • ปฏิกิริยาคู่แข่ง: คาดใน60วัน\n\n` +
        `การอนุมัติ:\n` +
        `  • ผลิตภัณฑ์: {approval}\n` +
        `  • การเงิน: เซ็นแล้ว\n` +
        `  • กฎหมาย: ผ่านแล้ว\n\n` +
        `PO: {pO} | รหัส: {pCode} | อ้างอิง: {rId}`,
      ],
    },
    operational: {
      EN: [
        `[OPS RUNBOOK - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `OVERVIEW:\n` +
        `{pName} is a {pcEN} for {modEN} {smEN} customers. This document covers activation, monitoring, and support procedures.\n\n` +
        `ACTIVATION FLOW:\n` +
        `1. Customer initiates via {channel}\n` +
        `2. CRM validates eligibility ({credit})\n` +
        `3. CBS creates rate plan {price}THB/{unit}\n` +
        `4. IN provisions {data} quota\n` +
        `5. SMS welcome sent (template: {pCode}-welcome)\n` +
        `6. Self-care UI updated\n` +
        `Total time: <60 seconds\n\n` +
        `MONITORING:\n` +
        `• Grafana: {pCode}-dashboard\n` +
        `• Alerts:\n` +
        `  - Activation failure >1% (P1)\n` +
        `  - Quota sync error (P2)\n` +
        `  - Billing mismatch (P1)\n` +
        `  - High churn >5% weekly (P3)\n` +
        `• Log aggregation: ELK {pCode}-*\n\n` +
        `SUPPORT PROCEDURES:\n` +
        `• L1: Basic troubleshooting, balance check\n` +
        `• L2: Quota issues, billing disputes\n` +
        `• L3: System bugs, provisioning failures\n` +
        `• Escalation SLA: 4h (P1), 24h (P2)\n\n` +
        `INCIDENT RESPONSE:\n` +
        `• Rollback: Disable in CBS, migrate to fallback\n` +
        `• Communication: SMS to affected subs\n` +
        `• Post-mortem: Within 48h\n\n` +
        `MAINTENANCE:\n` +
        `• Quota reset: Daily 00:00 ICT\n` +
        `• Rate plan review: Quarterly\n` +
        `• Feature deprecation: 90d notice\n\n` +
        `REFERENCES:\n` +
        `• PO: {pO}\n` +
        `• Code: {pCode}\n` +
        `• Build: {rId}\n` +
        `• Launch: {timing}\n` +
        `• Capacity: {target} subs`,
      ],
      TH: [
        `[RUNBOOK OPS - {pName}]\n` +
        `═══════════════════════════════════════\n` +
        `ภาพรวม:\n` +
        `{pName} เป็น{pcTH}สำหรับลูกค้า{modTH} {smTH} เอกสารนี้ครอบคลุมขั้นตอนการเปิดใช้ monitoring และsupport\n\n` +
        `Flowการเปิดใช้:\n` +
        `1. ลูกค้าเริ่มต้นผ่าน{channel}\n` +
        `2. CRM ตรวจสอบสิทธิ์ ({credit})\n` +
        `3. CBS สร้างอัตรา{price}บาท/{unit}\n` +
        `4. IN provision โควต้า{data}\n` +
        `5. ส่งSMSต้อนรับ (template: {pCode}-welcome)\n` +
        `6. อัปเดตUI Self-care\n` +
        `เวลารวม: <60วินาที\n\n` +
        `Monitoring:\n` +
        `• Grafana: {pCode}-dashboard\n` +
        `• Alerts:\n` +
        `  - เปิดใช้ล้มเหลว >1% (P1)\n` +
        `  - ซิงค์โควต้าerror (P2)\n` +
        `  - บิลไม่ตรง (P1)\n` +
        `  • Churnสูง >5% ต่อสัปดาห์ (P3)\n` +
        `• รวมlog: ELK {pCode}-*\n\n` +
        `ขั้นตอนSupport:\n` +
        `• L1: แก้ปัญหาพื้นฐาน เช็กยอด\n` +
        `• L2: ปัญหาโควต้า ข้อพิพาทบิล\n` +
        `• L3: บั๊กระบบ provisioningล้มเหลว\n` +
        `• SLA escalation: 4ชม.(P1), 24ชม.(P2)\n\n` +
        `ตอบโต้incident:\n` +
        `• Rollback: ปิดในCBS ย้ายไปfallback\n` +
        `• สื่อสาร: SMSไปหาลูกค้าที่ได้รับผล\n` +
        `• Post-mortem: ภายใน48ชม.\n\n` +
        `Maintenance:\n` +
        `• รีเซ็ตโควต้า: ทุกวัน 00:00 ICT\n` +
        `• รีวิวอัตรา: ทุกไตรมาส\n` +
        `• เลิกใช้ฟีเจอร์: แจ้งล่วงหน้า90วัน\n\n` +
        `อ้างอิง:\n` +
        `• PO: {pO}\n` +
        `• รหัส: {pCode}\n` +
        `• Build: {rId}\n` +
        `• เปิดตัว: {timing}\n` +
        `• ความจุ: {target}สมาชิก`,
      ],
    },
    summary: {
      EN: [
        `[COMPREHENSIVE BRIEF - {pName}]\n` +
        `═══════════════════════════════════════\n\n` +
        `IDENTITY:\n` +
        `  • Name: {pName}\n` +
        `  • PO: {pO}\n` +
        `  • Code: {pCode}\n` +
        `  • Build: {rId}\n\n` +
        `CLASSIFICATION:\n` +
        `  • Type: {pcEN}\n` +
        `  • Module: {modEN}\n` +
        `  • Sub-module: {smEN}\n` +
        `  • Network: {network}\n\n` +
        `SPECIFICATIONS:\n` +
        `  • Data: {data} high-speed\n` +
        `  • Speed: Up to {speed}\n` +
        `  • Post-limit: 128 Kbps\n` +
        `  • Voice: Unlimited on-net\n` +
        `  • SMS: 100/month\n\n` +
        `COMMERCIAL:\n` +
        `  • Price: {price}THB/{unit}\n` +
        `  • Type: {ptEN}\n` +
        `  • Contract: {contract} months\n` +
        `  • Auto-renew: {autoRenew}\n` +
        `  • Validity: {validity} days\n\n` +
        `TARGET:\n` +
        `  • Segment: {segEN}\n` +
        `  • Age: {minAge}-{maxAge}\n` +
        `  • Profile: {segDescEN}\n\n` +
        `BENEFITS:\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • Rollover data\n` +
        `  • eSIM support\n\n` +
        `LAUNCH:\n` +
        `  • Timing: {timing}\n` +
        `  • Channel: {channel}\n` +
        `  • Capacity: {target} subs\n` +
        `  • Credit: {credit}\n\n` +
        `STATUS:\n` +
        `  • Development: {devStatus}\n` +
        `  • Approvals: {approval}\n` +
        `  • Created: {engDate} {time}`,
      ],
      TH: [
        `[สรุปครบถ้วน - {pName}]\n` +
        `═══════════════════════════════════════\n\n` +
        `ตัวตน:\n` +
        `  • ชื่อ: {pName}\n` +
        `  • PO: {pO}\n` +
        `  • รหัส: {pCode}\n` +
        `  • Build: {rId}\n\n` +
        `การจัดประเภท:\n` +
        `  • ประเภท: {pcTH}\n` +
        `  • โมดูล: {modTH}\n` +
        `  • โมดูลย่อย: {smTH}\n` +
        `  • เครือข่าย: {network}\n\n` +
        `ข้อกำหนด:\n` +
        `  • เน็ต: {data} ความเร็วสูง\n` +
        `  • ความเร็ว: สูงสุด{speed}\n` +
        `  • หลังครบ: 128 Kbps\n` +
        `  • โทร: ไม่จำกัดในเครือข่าย\n` +
        `  • SMS: 100/เดือน\n\n` +
        `เชิงพาณิชย์:\n` +
        `  • ราคา: {price}บาท/{unit}\n` +
        `  • ประเภท: {ptTH}\n` +
        `  • สัญญา: {contract}เดือน\n` +
        `  • ต่ออายุอัตโนมัติ: {autoRenew}\n` +
        `  • อายุ: {validity}วัน\n\n` +
        `เป้าหมาย:\n` +
        `  • กลุ่ม: {segTH}\n` +
        `  • อายุ: {minAge}-{maxAge}\n` +
        `  • โปรไฟล์: {segDescTH}\n\n` +
        `สิทธิประโยชน์:\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • ยกยอดเน็ต\n` +
        `  • รองรับeSIM\n\n` +
        `เปิดตัว:\n` +
        `  • ช่วงเวลา: {timing}\n` +
        `  • ช่องทาง: {channel}\n` +
        `  • ความจุ: {target}สมาชิก\n` +
        `  • เครดิต: {credit}\n\n` +
        `สถานะ:\n` +
        `  • Development: {devStatus}\n` +
        `  • การอนุมัติ: {approval}\n` +
        `  • สร้างเมื่อ: {thaiDate}`,
      ],
    },
  },
};

// ---------- DESCRIPTION POOLS ----------
const DESCRIPTION_POOLS: PoolsRecord = {
  short: {
    EN: [
      `{pName} is a {pcEN.toLowerCase()} for {modEN} ({smEN}), offering {data} of high-speed data at up to {speed} on {network} networks. Priced at {price}THB/{unit} with {contract}-month term.`,
      `{pName}: {data} {modEN.toLowerCase()} data package with {speed} speeds. {ptEN} billing at {price}THB. Designed for {segEN}. Includes {benefit1}.`,
      `{pcEN} {pName} delivers {data} data @ {speed} on {network}. Target: {segEN}. Launch: {timing}. PO: {pO}.`,
      `{pName} - {modEN} {pcEN.toLowerCase()} for {segEN}. {data}@{speed}, {price}THB/{unit}. {benefit1} included.`,
      `{pName}: Affordable {modEN} {pcEN.toLowerCase()}. {data} data, {speed} speed, {price}THB/{unit}. Perfect for {segEN}.`,
      `{pName} package: {data} on {network}, {speed} max, {price}THB/{unit}. {contract}mo term. {benefit1} + {benefit2}.`,
    ],
    TH: [
      `{pName} เป็น{pcTH}สำหรับ{modTH} ({smTH}) มอบเน็ตความเร็วสูง{data} ที่ความเร็วสูงสุด{speed} บนเครือข่าย{network} ราคา{price}บาท/{unit} สัญญา{contract}เดือน`,
      `{pName}: แพ็กเกจเน็ต{modTH} {data} ความเร็ว{speed} {ptTH} {price}บาท ออกแบบสำหรับ{segTH} รวม{benefit1}`,
      `{pcTH} {pName} มอบเน็ต{data} @ {speed} บน{network} กลุ่มเป้าหมาย: {segTH} เปิดตัว: {timing} PO: {pO}`,
      `{pName} - {pcTH} {modTH} สำหรับ{segTH} {data}@{speed}, {price}บาท/{unit} รวม{benefit1}`,
      `{pName}: {pcTH} {modTH} ราคาจับต้องได้ เน็ต{data} ความเร็ว{speed} {price}บาท/{unit} เหมาะกับ{segTH}`,
      `แพ็กเกจ {pName}: {data} บน{network}, สูงสุด{speed}, {price}บาท/{unit} สัญญา{contract}เดือน {benefit1} + {benefit2}`,
    ],
  },
  medium: {
    EN: [
      `{pName} is a {smEN} {pcEN} for {modEN} customers. The package includes {data} of high-speed data with maximum speeds of {speed} on our {network} network, unlimited on-net voice calls, and standard SMS allowance. Priced at {price}THB per {unit} ({ptEN}, VAT inclusive) with a {contract}-month contract term. Auto-renewal is {autoRenew}. This offering targets {segEN}, {segDescEN}. Key features include {benefit1} and {benefit2}. Commercial launch is targeted for {timing}.`,
      `{pName} delivers exceptional value for {segEN}. Subscribers receive {data} of 5G-ready data at {speed}, enabling seamless streaming, browsing, and connectivity. The {ptEN} pricing model at {price}THB ensures predictable billing. Package validity is {validity} days with {contract}-month commitment. Additional benefits: {benefit1}, {benefit2}. PO Reference: {pO}.`,
      `Introducing {pName}, our latest {pcEN.toLowerCase()} for {modEN} users. Designed for {segEN}, this package combines {data} of data at {speed} speeds with premium features like {benefit1} and {benefit2}. At {price}THB/{unit}, it offers {contract}-month flexibility with {autoRenew} renewal. Launch via {channel} in {timing}.`,
      `{pName} represents our commitment to {segEN}. With {data} on {network} at up to {speed}, unlimited calls, and {benefit1}, it's the complete {modEN} solution. {ptEN} at {price}THB, {contract}-month term, {validity}-day validity. Target: {timing} launch via {channel}. PO: {pO}.`,
      `{pName} - the smart choice for {segEN}. {data} data, {speed} speed, {network} reliability. Includes {benefit1} and {benefit2}. {price}THB/{unit} ({ptEN}), {contract}mo term. Launch {timing}. PO {pO}.`,
    ],
    TH: [
      `{pName} เป็น{pcTH} {smTH} สำหรับลูกค้า{modTH} แพ็กเกจรวมเน็ตความเร็วสูง{data} ความเร็วสูงสุด{speed} บนเครือข่าย{network} โทรฟรีในเครือข่ายไม่จำกัด และสิทธิ์SMSมาตรฐาน ราคา{price}บาทต่อ{unit} ({ptTH} รวมVAT) สัญญา{contract}เดือน {autoRenew} ข้อเสนอนี้มุ่งเป้า{segTH} {segDescTH} คุณสมบัติหลักได้แก่{benefit1} และ{benefit2} คาดการณ์เปิดตัวเชิงพาณิชย์{timing}`,
      `{pName} มอบความคุ้มค่าที่ยอดเยี่ยมสำหรับ{segTH} สมาชิกได้รับเน็ตพร้อม5G {data} ที่ความเร็ว{speed} สนับสนุนการสตรีม ท่องเว็บ และการเชื่อมต่อที่ราบรื่น รูปแบบราคา{ptTH}ที่{price}บาท ช่วยให้คาดการณ์ค่าใช้จ่ายได้ แพ็กเกจมีอายุ{validity}วัน ผูกพันสัญญา{contract}เดือน สิทธิประโยชน์เพิ่มเติม: {benefit1}, {benefit2} POอ้างอิง: {pO}`,
      `ขอแนะนำ {pName} {pcTH}ใหม่ล่าสุดสำหรับผู้ใช้{modTH} ออกแบบสำหรับ{segTH} แพ็กเกจนี้รวมเน็ต{data} ที่ความเร็ว{speed} พร้อมฟีเจอร์พรีเมียมเช่น{benefit1} และ{benefit2} ที่{price}บาท/{unit} ให้ความยืดหยุ่น{contract}เดือน พร้อมต่ออายุ{autoRenew} เปิดตัวผ่าน{channel} ใน{timing}`,
      `{pName} แสดงถึงคำมั่นสัญญาของเราต่อ{segTH} ด้วย{data} บน{network} ที่ความเร็วสูงสุด{speed} โทรไม่จำกัด และ{benefit1} เป็นโซลูชัน{modTH}ที่ครบถ้วน {ptTH} ที่{price}บาท สัญญา{contract}เดือน อายุ{validity}วัน เป้าหมาย: เปิดตัว{timing} ผ่าน{channel} PO: {pO}`,
      `{pName} - ทางเลือกฉลาดสำหรับ{segTH} เน็ต{data} ความเร็ว{speed} ความเชื่อถือได้{network} รวม{benefit1} และ{benefit2} {price}บาท/{unit} ({ptTH}) สัญญา{contract}เดือน เปิดตัว{timing} PO {pO}`,
    ],
  },
  long: {
    EN: [
      `{pName} - Product Offering Description\n` +
      `══════════════════════════════════════\n` +
      `Category: {modEN} > {pcEN} ({smEN})\n` +
      `Data Allowance: {data} high-speed data, throttled to 128 Kbps thereafter\n` +
      `Network: {network} with speeds up to {speed} (where available)\n` +
      `Voice/SMS: Unlimited on-net calls, standard SMS allowance included\n` +
      `Pricing: {price}THB/{unit} ({ptEN}, VAT inclusive)\n` +
      `Validity: {validity} days from activation\n` +
      `──────────────────────────────────────\n` +
      `Target Market: {segEN}\n` +
      `  • Demographic: Age {minAge}-{maxAge}\n` +
      `  • Profile: {segDescEN}\n` +
      `Key Benefits:\n` +
      `  • {benefit1}\n` +
      `  • {benefit2}\n` +
      `  • Nationwide coverage with {network} priority\n` +
      `Commercial Timeline:\n` +
      `  • Launch Target: {timing}\n` +
      `  • Subscriber Goal: First 90 days\n` +
      `System Integration:\n` +
      `  • PO Reference: {pO}\n` +
      `  • Product Code: {pCode}\n` +
      `  • Billing Integration: CBS/CRM ready\n` +
      `Status: Configuration Complete | Pending Commercial Approval`,

      `{pName} represents a strategic {pcEN.toLowerCase()} offering within our {modEN} portfolio, designed to address the connectivity needs of {segEN.toLowerCase()}. {segDescEN.charAt(0).toUpperCase() + segDescEN.slice(1)}.\n\n` +
      `Technical Specifications:\n` +
      `• Data: {data} at {speed} on {network} network\n` +
      `• Post-limit speed: 128 Kbps for continued basic connectivity\n` +
      `• Voice: Unlimited calls to same-network numbers\n` +
      `• SMS: Standard monthly allowance\n` +
      `• 5G Access: {network5G}\n\n` +
      `Commercial Structure:\n` +
      `• Price: {price}THB/{unit} ({ptEN})\n` +
      `• Auto-renewal: {autoRenewDesc}\n` +
      `• Early termination: {earlyTerm}\n\n` +
      `Value Proposition:\n` +
      `• {benefit1Cap}\n` +
      `• {benefit2Cap}\n` +
      `• Predictable billing with no hidden charges\n` +
      `• Seamless migration path for existing customers\n\n` +
      `Go-to-Market: Target launch {timing} via {channel}. PO Reference: {pO}.`,

      `{pName} - Comprehensive Overview\n\n` +
      `{pName} is our latest {pcEN.toLowerCase()} designed specifically for {segEN} customers. In today's connected world, {segDescEN}. This package addresses those needs with a balanced offering of data, speed, and value.\n\n` +
      `What's Included:\n` +
      `✓ {data} high-speed data on {network}\n` +
      `✓ Speeds up to {speed}\n` +
      `✓ Unlimited on-net calls\n` +
      `✓ {benefit1}\n` +
      `✓ {benefit2}\n` +
      `✓ {contract}-month contract with {autoRenew} renewal\n\n` +
      `Why {pName}?\n` +
      `At {price}THB/{unit}, {pName} offers exceptional value compared to market alternatives. The {data} allowance supports heavy usage patterns, while {speed} ensures smooth streaming and browsing. Our {network} network provides reliable coverage nationwide.\n\n` +
      `Target Launch: {timing}\n` +
      `Distribution: {channel}\n` +
      `PO Reference: {pO}`,
    ],
    TH: [
      `{pName} - รายละเอียดผลิตภัณฑ์\n` +
      `══════════════════════════════════════\n` +
      `ประเภท: {modTH} > {pcTH} ({smTH})\n` +
      `ปริมาณเน็ต: {data} ความเร็วสูง (ลดความเร็วเหลือ 128 Kbps หลังครบ)\n` +
      `เครือข่าย: {network} ความเร็วสูงสุด{speed} (ในพื้นที่รองรับ)\n` +
      `โทร/SMS: โทรฟรีในเครือข่ายไม่จำกัด รวมสิทธิ์SMSมาตรฐาน\n` +
      `ราคา: {price}บาท/{unit} ({ptTH} รวมVAT)\n` +
      `สัญญา: {contract}เดือน | ต่ออายุอัตโนมัติ: {autoRenew}\n` +
      `อายุแพ็กเกจ: {validity}วันนับจากเปิดใช้\n` +
      `──────────────────────────────────────\n` +
      `กลุ่มเป้าหมาย: {segTH}\n` +
      `  • ประชากร: อายุ{minAge}-{maxAge}ปี\n` +
      `  • โปรไฟล์: {segDescTH}\n` +
      `สิทธิประโยชน์หลัก:\n` +
      `  • {benefit1}\n` +
      `  • {benefit2}\n` +
      `  • ครอบคลุมทั่วประเทศด้วยความสำคัญเครือข่าย{network}\n` +
      `แผนเชิงพาณิชย์:\n` +
      `  • เป้าหมายเปิดตัว: {timing}\n` +
      `  • เป้าหมายสมาชิก: 90วันแรก\n` +
      `การเชื่อมต่อระบบ:\n` +
      `  • POอ้างอิง: {pO}\n` +
      `  • รหัสผลิตภัณฑ์: {pCode}\n` +
      `  • การเชื่อมต่อระบบบิล: พร้อมCBS/CRM\n` +
      `สถานะ: กำหนดค่าเสร็จสิ้น | รออนุมัติเชิงพาณิชย์`,

      `{pName} เป็นข้อเสนอยุทธศาสตร์{pcTH}ภายในพอร์ตโฟลิโอ{modTH}ของเรา ออกแบบมาเพื่อตอบสนองความต้องการการเชื่อมต่อของ{segTH} {segDescTH}\n\n` +
      `ข้อกำหนดทางเทคนิค:\n` +
      `• เน็ต: {data} ที่{speed} บนเครือข่าย{network}\n` +
      `• ความเร็วหลังครบ: 128 Kbps สำหรับการเชื่อมต่อพื้นฐานต่อเนื่อง\n` +
      `• โทร: ไม่จำกัดเบอร์ในเครือข่ายเดียวกัน\n` +
      `• SMS: สิทธิ์มาตรฐานรายเดือน\n` +
      `• การเข้าถึง5G: {network5G}\n\n` +
      `โครงสร้างเชิงพาณิชย์:\n` +
      `• ราคา: {price}บาท/{unit} ({ptTH})\n` +
      `• ระยะสัญญา: {contract}เดือน\n` +
      `• ต่ออายุอัตโนมัติ: {autoRenewDesc}\n` +
      `• ยกเลิกก่อนกำหนด: {earlyTerm}\n\n` +
      `ข้อเสนอคุณค่า:\n` +
      `• {benefit1Cap}\n` +
      `• {benefit2Cap}\n` +
      `• การเรียกเก็บเงินที่คาดการณ์ได้โดยไม่มีค่าใช้จ่ายแอบแฝง\n` +
      `• เส้นทางย้ายแพ็กเกจที่ราบรื่นสำหรับลูกค้าเดิม\n\n` +
      `แผนออกสู่ตลาด: เป้าหมายเปิดตัว{timing} ผ่าน{channel} POอ้างอิง: {pO}`,

      `{pName} - ภาพรวมครบถ้วน\n\n` +
      `{pName} เป็น{pcTH}ใหม่ล่าสุดของเราที่ออกแบบมาเพื่อลูกค้า{segTH}โดยเฉพาะ ในโลกที่เชื่อมต่อปัจจุบัน {segDescTH} แพ็กเกจนี้ตอบสนองความต้องการเหล่านั้นด้วยข้อเสนอที่สมดุลทั้งเน็ต ความเร็ว และความคุ้มค่า\n\n` +
      `สิ่งที่รวมอยู่:\n` +
      `✓ เน็ตความเร็วสูง{data} บน{network}\n` +
      `✓ ความเร็วสูงสุด{speed}\n` +
      `✓ โทรฟรีในเครือข่ายไม่จำกัด\n` +
      `✓ {benefit1}\n` +
      `✓ {benefit2}\n` +
      `✓ สัญญา{contract}เดือน พร้อมต่ออายุ{autoRenew}\n\n` +
      `ทำไมต้อง{pName}?\n` +
      `ที่{price}บาท/{unit} {pName} ให้ความคุ้มค่าเป็นพิเศษเมื่อเทียบกับทางเลือกในตลาด ปริมาณ{data} รองรับรูปแบบการใช้งานหนัก ขณะที่{speed} ช่วยให้สตรีมมิ่งและท่องเว็บราบรื่น เครือข่าย{network}ของเราให้การครอบคลุมที่เชื่อถือได้ทั่วประเทศ\n\n` +
      `เป้าหมายเปิดตัว: {timing}\n` +
      `การกระจาย: {channel}\n` +
      `POอ้างอิง: {pO}`,
    ],
  },
};

// ========================
// DERIVED HELPERS
// ========================
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

// ========================
// PACKAGE CONTEXT BUILDER
// ========================
const buildPackageContext = (
  projectName: string,
  poName: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): PackageContext => {
  const pName    = projectName || 'New Package';
  const pOName   = poName || 'Product Offering';
  const pType    = priceType || 'recurring';
  const pClass   = productClass || 'main';
  const sModule  = subModule || 'POST';
  const mod      = module || 'MOB';

  const ptDisplay  = PRICE_TYPE_DISPLAY[pType]  || { EN: pType,  TH: pType };
  const pcDisplay  = PRODUCT_CLASS_DISPLAY[pClass] || { EN: pClass, TH: pClass };
  const modDisplay = MODULE_DISPLAY[mod] || { EN: mod, TH: mod };
  const smDisplay  = SUB_MODULE_DISPLAY[sModule] || { EN: sModule, TH: sModule };

  // Data + Price
  const selectedData = pickRandom(Object.keys(PRICE_BY_DATA));
  const priceRange   = PRICE_BY_DATA[selectedData];
  const priceMultiplier = pClass === 'main' ? 1 : (pClass === 'ontop' ? 0.5 : 0.3);
  const priceAmount  = randomInt(
    Math.ceil(priceRange.min * priceMultiplier),
    Math.floor(priceRange.max * priceMultiplier)
  );

  // Network
  const is5GLikely = mod === 'MOB' && pClass === 'main' && Math.random() < 0.8;
  const networkType = is5GLikely ? pickRandom(['5G-Standard', '5G-Premium']) : '4G';
  const maxSpeed    = pickRandom(SPEED_BY_NETWORK[networkType]);

  // Contract & validity
  const contractMonths = pickRandom(getContractTerms(sModule, pClass));
  const validityDays   = sModule === 'PRE'
    ? pickRandom([1, 7, 15, 30])
    : pickRandom([30, 90, 180, 365]);

  // Segment
  const segmentKey = pickRandom(Object.keys(TARGET_SEGMENTS));
  const segment    = TARGET_SEGMENTS[segmentKey];

  // Benefits
  const benefitList = BENEFITS_BY_CLASS[pClass === 'main' ? 'main' : 'ontop'];
  const benefit1EN  = pickRandom(benefitList.EN);
  const benefit1TH  = pickRandom(benefitList.TH);
  const benefit2EN  = pickRandom(benefitList.EN.filter(b => b !== benefit1EN));
  const benefit2TH  = pickRandom(benefitList.TH.filter(b => b !== benefit1TH));

  // Dates
  const currentDate = new Date();
  const thaiDate    = currentDate.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const engDate     = currentDate.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const currentTime = currentDate.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const isoDate = currentDate.toISOString().split('T')[0];

  return {
    pName, pOName, pType, pClass, sModule, mod,
    ptDisplay, pcDisplay, modDisplay, smDisplay,
    selectedData, priceAmount, networkType, maxSpeed,
    contractMonths, validityDays,
    launchTiming: getRealisticLaunchQuarter(),
    segment,
    benefit1: { EN: benefit1EN, TH: benefit1TH },
    benefit2: { EN: benefit2EN, TH: benefit2TH },
    productCode: `PKG-${mod.toUpperCase()}-${sModule}-${pClass}-${randomInt(1000, 9999)}`,
    randomId: Math.random().toString(36).substring(2, 10).toUpperCase(),
    subscriberTarget: pickRandom(['5K', '10K', '25K', '50K', '100K']),
    dates: { thaiDate, engDate, currentTime, isoDate },
  };
};

// ========================
// TEXT BUILDERS
// ========================
const buildRemarkText = (ctx: PackageContext): string => {
  const isRecurring = ctx.pType === 'recurring';
  const perUnit = { EN: isRecurring ? 'mo' : 'time', TH: isRecurring ? 'เดือน' : 'ครั้ง' };
  const perUnitFull = { EN: isRecurring ? 'month' : 'activation', TH: isRecurring ? 'เดือน' : 'เปิดใช้' };

  // Select style and length
  const style: RemarkStyle = weightedChoice<RemarkStyle>([
    { value: 'technical',   weight: 0.25 },
    { value: 'business',    weight: 0.25 },
    { value: 'operational', weight: 0.25 },
    { value: 'summary',     weight: 0.25 },
  ]);

  const lengthType: LengthType = weightedChoice<LengthType>([
    { value: 'short',  weight: 0.25 },
    { value: 'medium', weight: 0.45 },
    { value: 'long',   weight: 0.30 },
  ]);
  
  const useThai = Math.random() < 0.45;
  const lang: LangType = useThai ? 'TH' : 'EN';

  // Get template
  let template = pickRandom(REMARK_POOLS[lengthType][style][lang]);

  // Replace placeholders
  const replacements: Record<string, string | number> = {
    '{pName}': ctx.pName,
    '{pO}': ctx.pOName,
    '{pCode}': ctx.productCode,
    '{rId}': ctx.randomId,
    '{pcEN}': ctx.pcDisplay.EN,
    '{pcTH}': ctx.pcDisplay.TH,
    '{modEN}': ctx.modDisplay.EN,
    '{modTH}': ctx.modDisplay.TH,
    '{smEN}': ctx.smDisplay.EN,
    '{smTH}': ctx.smDisplay.TH,
    '{ptEN}': ctx.ptDisplay.EN,
    '{ptTH}': ctx.ptDisplay.TH,
    '{data}': ctx.selectedData,
    '{speed}': ctx.maxSpeed,
    '{network}': ctx.networkType,
    '{price}': ctx.priceAmount,
    '{price+200}': ctx.priceAmount + 200,
    '{unit}': perUnit[lang],
    '{contract}': ctx.contractMonths,
    '{validity}': ctx.validityDays,
    '{timing}': ctx.launchTiming,
    '{segEN}': ctx.segment.labelEN,
    '{segTH}': ctx.segment.labelTH,
    '{segDescEN}': ctx.segment.descEN,
    '{segDescTH}': ctx.segment.descTH,
    '{minAge}': ctx.segment.min,
    '{maxAge}': ctx.segment.max,
    '{benefit1}': ctx.benefit1[lang],
    '{benefit2}': ctx.benefit2[lang],
    '{target}': ctx.subscriberTarget,
    '{totalRev}': ctx.priceAmount * ctx.contractMonths,
    '{engDate}': ctx.dates.engDate,
    '{thaiDate}': ctx.dates.thaiDate,
    '{time}': ctx.dates.currentTime,
    '{autoRenew}': ctx.sModule === 'POST' ? (useThai ? 'ใช่' : 'Yes') : (useThai ? 'ไม่' : 'No'),
    '{devStatus}': pickRandom(METADATA_POOLS.devStatus[lang]),
    '{approval}': pickRandom(METADATA_POOLS.approval[lang]),
    '{channel}': pickRandom(METADATA_POOLS.channel[lang]),
    '{credit}': pickRandom(METADATA_POOLS.credit[lang]),
  };

  // Apply replacements
  let text = template;
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  });

  // Add metadata (chance varies by length)
  const addMetadataChance = lengthType === 'short' ? 0.4 : (lengthType === 'medium' ? 0.7 : 0.9);
  if (Math.random() < addMetadataChance) {
    const metaCount = lengthType === 'short' ? 1 : (lengthType === 'medium' ? 2 : 3);
    const metaTypes = pickMultiple(['devStatus', 'approval', 'channel', 'credit'] as MetadataType[], metaCount);
    
    const prefixMap: Record<MetadataType, { EN: string; TH: string }> = {
      devStatus: { EN: 'Status',     TH: 'สถานะ' },
      approval:  { EN: 'Approval',   TH: 'อนุมัติ' },
      channel:   { EN: 'Channel',    TH: 'ช่องทาง' },
      credit:    { EN: 'Credit',     TH: 'เครดิต' },
    };

    const metaLines = metaTypes.map(type => {
      const prefix = prefixMap[type][lang];
      const value  = pickRandom(METADATA_POOLS[type][lang]);
      return `${prefix}: ${value}`;
    });

    const separator = lengthType === 'short' ? ' | ' : '\n  • ';
    const prefix    = lengthType === 'short'
      ? ' | '
      : (useThai ? '\n\nข้อมูลเพิ่มเติม:\n  • ' : '\n\nAdditional Info:\n  • ');
    text += prefix + metaLines.join(separator);
  }

  // Timestamp
  const addTimestampChance = lengthType === 'short' ? 0.3 : 0.6;
  if (Math.random() < addTimestampChance) {
    const ts = useThai
      ? `[บันทึก: ${ctx.dates.thaiDate}]`
      : `[Recorded: ${ctx.dates.engDate} ${ctx.dates.currentTime}]`;
    text += (lengthType === 'short' ? ' ' : '\n\n') + ts;
  }

  return text;
};

const buildDescriptionText = (ctx: PackageContext): string => {
  const isRecurring = ctx.pType === 'recurring';
  const perUnit     = { EN: isRecurring ? 'month' : 'activation', TH: isRecurring ? 'เดือน' : 'เปิดใช้' };

  const lengthType: LengthType = weightedChoice<LengthType>([
    { value: 'short',  weight: 0.20 },
    { value: 'medium', weight: 0.40 },
    { value: 'long',   weight: 0.40 },
  ]);
  
  const useThai = Math.random() < 0.4;
  const lang: LangType = useThai ? 'TH' : 'EN';

  let template = pickRandom(DESCRIPTION_POOLS[lengthType][lang]);

  // Prepare replacements
  const replacements: Record<string, string | number> = {
    '{pName}': ctx.pName,
    '{pO}': ctx.pOName,
    '{pCode}': ctx.productCode,
    '{pcEN}': ctx.pcDisplay.EN,
    '{pcTH}': ctx.pcDisplay.TH,
    '{modEN}': ctx.modDisplay.EN,
    '{modTH}': ctx.modDisplay.TH,
    '{smEN}': ctx.smDisplay.EN,
    '{smTH}': ctx.smDisplay.TH,
    '{ptEN}': ctx.ptDisplay.EN,
    '{ptTH}': ctx.ptDisplay.TH,
    '{data}': ctx.selectedData,
    '{speed}': ctx.maxSpeed,
    '{network}': ctx.networkType,
    '{network5G}': ctx.networkType.includes('5G') 
      ? (useThai ? 'รวมในพื้นที่รองรับ' : 'Included where available')
      : (useThai ? 'มาตรฐาน4G LTE' : '4G LTE standard'),
    '{price}': ctx.priceAmount,
    '{unit}': perUnit[lang],
    '{contract}': ctx.contractMonths,
    '{validity}': ctx.validityDays,
    '{timing}': ctx.launchTiming,
    '{segEN}': ctx.segment.labelEN,
    '{segTH}': ctx.segment.labelTH,
    '{segDescEN}': ctx.segment.descEN,
    '{segDescTH}': ctx.segment.descTH,
    '{minAge}': ctx.segment.min,
    '{maxAge}': ctx.segment.max,
    '{benefit1}': ctx.benefit1[lang],
    '{benefit2}': ctx.benefit2[lang],
    '{benefit1Cap}': ctx.benefit1[lang].charAt(0).toUpperCase() + ctx.benefit1[lang].slice(1),
    '{benefit2Cap}': ctx.benefit2[lang].charAt(0).toUpperCase() + ctx.benefit2[lang].slice(1),
    '{autoRenew}': ctx.sModule === 'POST' ? (useThai ? 'เปิดใช้งาน' : 'enabled') : (useThai ? 'ไม่มีการต่ออายุ' : 'not applicable'),
    '{autoRenewDesc}': ctx.sModule === 'POST'
      ? (useThai ? 'เปิดใช้งานพร้อมระยะผ่อนผัน7วัน' : 'Enabled with 7-day grace period')
      : (useThai ? 'ไม่เกี่ยวข้อง (เติมเงิน)' : 'Not applicable (prepaid)'),
    '{earlyTerm}': ctx.contractMonths > 1
      ? (useThai ? 'มีค่าธรรมเนียมตามสัดส่วน' : 'Pro-rated fee applies')
      : (useThai ? 'ไม่เกี่ยวข้อง' : 'N/A'),
    '{channel}': pickRandom(METADATA_POOLS.channel[lang]),
  };

  // Apply replacements
  let text = template;
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  });

  // PO Reference (50% chance)
  if (ctx.pOName && Math.random() < 0.5) {
    text += useThai ? `\n\nPO อ้างอิง: ${ctx.pOName}` : `\n\nPO Reference: ${ctx.pOName}`;
  }

  // Product code (60% chance)
  if (Math.random() < 0.6) {
    text += useThai ? `\nรหัส: ${ctx.productCode}` : `\nCode: ${ctx.productCode}`;
  }

  return text;
};

// ========================
// EXPORTED FUNCTIONS
// ========================
export const RandomRemark = (
  projectName: string,
  poName: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  cy.get('body').then(($body: JQuery<HTMLBodyElement>) => {
    if ($body.find('textarea[formcontrolname="remark"]').length === 0) return;

    scrollToElement('textarea[formcontrolname="remark"]', 'Remark');

    if (Math.random() < 0.85) {
      const ctx  = buildPackageContext(projectName, poName, priceType, productClass, subModule, module);
      let text   = buildRemarkText(ctx);

      if (text.length > MAX_REMARK_LENGTH) {
        text = text.substring(0, MAX_REMARK_LENGTH - 3) + '...';
      }

      cy.get('textarea[formcontrolname="remark"]')
        .clear({ force: true })
        .type(text, { delay: 0, force: true });

      cy.log(`✅ Remark: ${text.length}/${MAX_REMARK_LENGTH} chars`);
    } else {
      cy.get('textarea[formcontrolname="remark"]').clear({ force: true });
      cy.log('⏭️ Remark skipped (15%)');
    }
    cy.wait(WAIT_TIME);
  });
};

export const RandomProjectDescription = (
  projectName: string,
  poName?: string,
  priceType?: string,
  productClass?: string,
  subModule?: string,
  module?: string
): void => {
  cy.get('body').then(($body: JQuery<HTMLBodyElement>) => {
    if ($body.find('textarea[formcontrolname="projectDescription"]').length === 0) return;

    scrollToElement('textarea[formcontrolname="projectDescription"]', 'Project Description');

    if (Math.random() < 0.90) {
      const ctx  = buildPackageContext(projectName, poName || 'Product Offering', priceType, productClass, subModule, module);
      let text   = buildDescriptionText(ctx);

      if (text.length > MAX_DESC_LENGTH) {
        text = text.substring(0, MAX_DESC_LENGTH - 3) + '...';
      }

      cy.get('textarea[formcontrolname="projectDescription"]')
        .clear({ force: true })
        .type(text, { delay: 0, force: true });

      cy.log(`✅ Description: ${text.length}/${MAX_DESC_LENGTH} chars`);
    } else {
      cy.get('textarea[formcontrolname="projectDescription"]').clear({ force: true });
      cy.log('⏭️ Project Description skipped (10%)');
    }
    cy.wait(WAIT_TIME);
  });
};
