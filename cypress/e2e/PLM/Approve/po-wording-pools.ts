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

    const dataAmount = pickRandom(['10GB', '30GB', '50GB', '100GB', '200GB', 'Unlimited']);
    const speed = pickRandom(['100 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', '5G Max']);
    const price = randomInt(199, 1999);
    const validity = pickRandom([1, 7, 30, 90, 365]);
    const contractMonths = pickRandom([1, 6, 12, 24]);
    const benefit1 = pickRandom(['5G Access', 'Unlimited Calls', 'Free Streaming', 'Rollover Data', 'Family Sharing']);
    const benefit1TH = pickRandom(['เข้าใช้ 5G', 'โทรฟรีไม่อั้น', 'สตรีมมิ่งฟรี', 'ยกยอดเน็ต', 'แชร์ครอบครัว']);
    const benefit2 = pickRandom(['No Contract', 'Free SIM', 'eSIM Ready', 'Priority Support', 'Device Discount']);
    const benefit2TH = pickRandom(['ไม่มีสัญญา', 'ซิมฟรี', 'พร้อม eSIM', 'บริการพิเศษ', 'ส่วนลดเครื่อง']);

    return {
        shortPromotionName: {
            EN: [
                `${p} Value Pack`, `${p} Smart Deal`, `${p} Power Plan`, `${p} Daily Deal`,
                `${p} Big Save`, `${p} Speed Pack`, `${p} Data King`, `${p} Net Plus`,
                `${p} Always On`, `${p} Full Power`, `${p} Next Level`, `${p} Super Plan`,
            ],
            TH: [
                `${p} แพ็กคุ้ม`, `${p} ดีลฉลาด`, `${p} พลานพาวเวอร์`, `${p} ดีลรายวัน`,
                `${p} ประหยัดสุด`, `${p} แพ็กความเร็ว`, `${p} ดาต้าคิง`, `${p} เน็ตพลัส`,
                `${p} ออนตลอด`, `${p} พลังเต็ม`, `${p} ขั้นต่อไป`, `${p} ซูเปอร์แพลน`,
            ],
        },
        promotionDescription: {
            EN: [
                `Sign up for ${p} and get ${dataAmount} of data at ${speed} plus unlimited calls for just ${price} THB per month`,
                `${p} is the ${modName.EN} package that gives you ${dataAmount} data ${speed} speeds and ${benefit1} all in one`,
                `Get more done every day with ${p} featuring ${dataAmount} data at ${speed} and ${benefit2} included`,
                `Try ${p} and enjoy ${dataAmount} high speed data plus ${benefit1} and ${benefit2} for only ${price} THB monthly`,
                `Choose ${p} for ${dataAmount} data ${speed} connectivity and top features at just ${price} THB a month`,
                `Stay connected with ${p} and enjoy ${dataAmount} data ${benefit1} and unlimited domestic calls all day`,
                `${p} combines great speed and generous data giving you ${dataAmount} at ${speed} every single month`,
                `Subscribe to ${p} and unlock ${dataAmount} data at ${speed} plus exclusive benefits for ${price} THB`,
                `With ${p} you get ${dataAmount} of high speed data at ${speed} and the freedom to do more`,
                `${p} packs in ${dataAmount} data ${speed} speeds unlimited calls and ${benefit1} at just ${price} THB per month`,
            ],
            TH: [
                `สมัคร ${p} รับเน็ต ${dataAmount} ความเร็ว ${speed} พร้อมโทรฟรีไม่จำกัดในราคาเพียง ${price} บาทต่อเดือน`,
                `${p} คือแพ็กเกจ${modName.TH}ที่มอบเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit1TH}ครบในที่เดียว`,
                `ทำได้มากขึ้นทุกวันด้วย ${p} ที่มีเน็ต ${dataAmount} ความเร็ว ${speed} และ${benefit2TH}รวมไว้แล้ว`,
                `ลอง ${p} และเพลิดเพลินกับเน็ตความเร็วสูง ${dataAmount} พร้อม${benefit1TH}และ${benefit2TH}เพียง ${price} บาทต่อเดือน`,
                `เลือก ${p} สำหรับเน็ต ${dataAmount} การเชื่อมต่อ ${speed} และฟีเจอร์ชั้นยอดในราคาเพียง ${price} บาทต่อเดือน`,
                `เชื่อมต่อกับ ${p} และเพลิดเพลินกับเน็ต ${dataAmount} ${benefit1TH} และโทรฟรีไม่จำกัดตลอดวัน`,
                `${p} ผสานความเร็วสูงและเน็ตปริมาณมากมอบ ${dataAmount} ที่ ${speed} ทุกเดือน`,
                `สมัคร ${p} ปลดล็อกเน็ต ${dataAmount} ที่ความเร็ว ${speed} พร้อมสิทธิพิเศษในราคา ${price} บาท`,
                `กับ ${p} คุณได้เน็ตความเร็วสูง ${dataAmount} ที่ ${speed} และอิสระในการทำสิ่งต่างๆ มากขึ้น`,
                `${p} อัดแน่นด้วยเน็ต ${dataAmount} ความเร็ว ${speed} โทรฟรีไม่จำกัด และ${benefit1TH}ในราคาเพียง ${price} บาทต่อเดือน`,
            ],
        },
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
            ],
        },
        yourPackageName: {
            EN: [
                `Your plan: ${p}`, `Currently on: ${p}`, `Active subscription: ${p}`,
                `Subscribed plan: ${p}`, `Running package: ${p}`, `Now on: ${p}`,
                `Package in use: ${p}`, `My plan: ${p}`, `Signed up for: ${p}`,
                `Live package: ${p}`, `Enrolled plan: ${p}`, `Chosen package: ${p}`,
            ],
            TH: [
                `แผนของคุณ: ${p}`, `ใช้งานอยู่: ${p}`, `การสมัครที่ใช้งาน: ${p}`,
                `แผนที่สมัคร: ${p}`, `แพ็กเกจที่รัน: ${p}`, `ตอนนี้ใช้: ${p}`,
                `แพ็กเกจที่ใช้: ${p}`, `แผนของฉัน: ${p}`, `สมัครอยู่กับ: ${p}`,
                `แพ็กเกจที่มีผล: ${p}`, `แผนที่ลงทะเบียน: ${p}`, `แพ็กเกจที่เลือก: ${p}`,
            ],
        },
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
            ],
        },
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
            ],
        },
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
            ],
        },
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
            ],
        },
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
                `Minimum contract period of ${contractMonths} months applies`,
                `Data speed may be reduced after reaching ${dataAmount} limit`,
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
                `มีระยะสัญญาขั้นต่ำ ${contractMonths} เดือน`,
                `ความเร็วอินเทอร์เน็ตอาจลดลงหลังใช้ครบ ${dataAmount}`,
            ],
        },
        memoDescription: {
            EN: [
                `${p} internal configuration notes for reference`,
                `${p} ${modName.EN} ${ptName.EN} setup memo PO ${po}`,
                `Product parameters: ${dataAmount} data at ${speed} price ${price} THB`,
                `${p} package details for internal use`,
                `Internal reference: ${p} ${ptName.EN} ${modName.EN} PO ${po}`,
                `${p} setup record: data ${dataAmount} speed ${speed} monthly ${price} THB`,
                `Validation memo for ${p} ${modName.EN} package configuration`,
                `${p} created and verified for deployment PO ${po}`,
            ],
            TH: [
                `บันทึกการกำหนดค่าภายในสำหรับ ${p}`,
                `บันทึกการตั้งค่า ${p} ${modName.TH} ${ptName.TH} PO ${po}`,
                `พารามิเตอร์ผลิตภัณฑ์: เน็ต ${dataAmount} ที่ ${speed} ราคา ${price} บาท`,
                `รายละเอียดแพ็กเกจ ${p} สำหรับใช้ภายใน`,
                `อ้างอิงภายใน: ${p} ${ptName.TH} ${modName.TH} PO ${po}`,
                `บันทึกการตั้งค่า ${p}: เน็ต ${dataAmount} ความเร็ว ${speed} รายเดือน ${price} บาท`,
                `บันทึกการตรวจสอบสำหรับการกำหนดค่าแพ็กเกจ ${p} ${modName.TH}`,
                `${p} สร้างและตรวจสอบพร้อมสำหรับการใช้งาน PO ${po}`,
            ],
        },
        discountName: {
            EN: [
                `${p} New Member Discount`, `${p} Loyalty Reward`,
                `${p} Activation Saving`, `${p} Seasonal Offer`,
                `${p} Bundle Saving`, `${p} Data Bonus`,
                `${p} Speed Upgrade`, `${p} Referral Reward`,
                `${p} Renewal Discount`, `${p} First Month Saving`,
            ],
            TH: [
                `ส่วนลดสมาชิกใหม่ ${p}`, `รางวัลความภักดี ${p}`,
                `ส่วนลดเปิดใช้งาน ${p}`, `ข้อเสนอตามฤดูกาล ${p}`,
                `ประหยัดจากบันเดิล ${p}`, `โบนัสเน็ต ${p}`,
                `อัปเกรดความเร็ว ${p}`, `รางวัลแนะนำเพื่อน ${p}`,
                `ส่วนลดต่ออายุ ${p}`, `ประหยัดเดือนแรก ${p}`,
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
const WAIT_TIME = 400;
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
      '5G Network Access', 'Unlimited On-net Calls', 'Rollover Data',
      'Free SIM/eSIM', 'Priority Customer Support', 'International Roaming Discount',
      'Device Installment', 'Free Streaming Apps', 'Cloud Storage 100GB', 'Family Sharing',
    ],
    TH: [
      'ใช้งานเครือข่าย 5G', 'โทรฟรีในเครือข่ายไม่จำกัด', 'ยกยอดเน็ตได้',
      'ซิม/eSIM ฟรี', 'บริการลูกค้าพิเศษ', 'ส่วนลดโรมมิ่งต่างประเทศ',
      'ผ่อนชำระอุปกรณ์', 'แอปสตรีมมิ่งฟรี', 'พื้นที่คลาวด์ 100GB', 'แชร์ให้ครอบครัว',
    ],
  },
  ontop: {
    EN: [
      '5G Network Access', 'Unlimited On-net Calls', 'Rollover Data',
      'Free SIM/eSIM', 'Streaming App Subscription', 'Cloud Storage Bonus',
      'International Data Add-on', 'Gaming Accelerator', 'Social Media Pack', 'Weekend Unlimited Data',
    ],
    TH: [
      'ใช้งานเครือข่าย 5G', 'โทรฟรีในเครือข่ายไม่จำกัด', 'ยกยอดเน็ตได้',
      'ซิม/eSIM ฟรี', 'สมัครสตรีมมิ่งแอป', 'เพิ่มพื้นที่คลาวด์',
      'แพ็กเกจเน็ตต่างประเทศ', 'ตัวเร่งความเร็วเกม', 'แพ็กโซเชียลมีเดีย', 'เน็ตไม่จำกัดวันหยุด',
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
// WORDING POOLS
// ========================

const REMARK_POOLS: Record<LengthType, Record<RemarkStyle, PoolData>> = {
  short: {
    technical: {
      EN: [
        `{pName} config: {pcEN} {modEN} {smEN}. {data}@{speed} on {network}. {price}THB/{unit}. Build#{rId}.`,
        `PO#{pO}: {pName} ready. {network} network, {data} quota, {speed} cap. Status: {devStatus}.`,
        `{pName}: {data}/{speed}/{price}THB. {network} ready. Ref:{rId}. Deploy:{timing}.`,
      ],
      TH: [
        `config {pName}: {pcTH} {modTH} {smTH}. เน็ต{data}@{speed} บน{network}. {price}บาท/{unit}. Build#{rId}.`,
        `PO#{pO}: {pName} พร้อม. เครือข่าย{network} เน็ต{data} ความเร็ว{speed}. สถานะ:{devStatus}.`,
        `{pName}: {data}/{speed}/{price}บาท. {network} พร้อม. อ้างอิง:{rId}. เปิดตัว:{timing}.`,
      ],
    },
    business: {
      EN: [
        `{pName}: {pcEN} targeting {segEN}. {price}THB/{unit} | {data}@{speed}. Launch {timing}.`,
        `PO#{pO} | {pName} | {segEN} segment | {price}THB | {contract}mo term.`,
        `{pName} ready for {timing} launch. {pcEN} tier, {price}THB price point.`,
      ],
      TH: [
        `{pName}: {pcTH} มุ่งเป้า{segTH}. {price}บาท/{unit} | {data}@{speed}. เปิดตัว {timing}.`,
        `PO#{pO} | {pName} | กลุ่ม{segTH} | {price}บาท | สัญญา{contract}เดือน.`,
        `{pName} พร้อมเปิดตัว{timing}. ระดับ{pcTH} จุดราคา{price}บาท โฟกัส{segTH}.`,
      ],
    },
    operational: {
      EN: [
        `OPS: {pName} CBS mapped. {price}THB billing cycle. {contract}mo auto-renew. Ready.`,
        `{pName} provisioned. {data} quota set. Throttle@128kbps post-limit. {devStatus}.`,
        `Deploy {pName}: CRM+CBS+IN synced. {smEN} logic applied. {benefit1} active.`,
      ],
      TH: [
        `OPS: {pName} เชื่อมCBSแล้ว. รอบบิล{price}บาท. ต่ออายุอัตโนมัติ{contract}เดือน. พร้อม.`,
        `{pName} provisionแล้ว. ตั้งโควต้า{data}. ลดความเร็ว@128kbps หลังครบ. {devStatus}.`,
        `Deploy {pName}: ซิงค์ CRM+CBS+IN. ใช้ logic {smTH}. {benefit1} active.`,
      ],
    },
    summary: {
      EN: [
        `{pName} | {pcEN} | {price}THB | {data}@{speed} | {segEN} | {timing}.`,
        `PO#{pO}: {pName} draft. {modEN}/{smEN}/{pcEN}. {price}THB. Status:{devStatus}.`,
        `{pName}: {data} data, {speed}, {price}THB/{unit}. Target:{segEN}.`,
      ],
      TH: [
        `{pName} | {pcTH} | {price}บาท | {data}@{speed} | {segTH} | {timing}.`,
        `PO#{pO}: {pName} ฉบับร่าง. {modTH}/{smTH}/{pcTH}. {price}บาท. สถานะ:{devStatus}.`,
        `{pName}: เน็ต{data} ความเร็ว{speed} {price}บาท/{unit}. เป้า:{segTH}.`,
      ],
    },
  },
  medium: {
    technical: {
      EN: [
        `[TECH] {pName} setup complete. Package: {pcEN} for {modEN} {smEN}. Data: {data} high-speed on {network} with {speed} cap. Post-limit: 128 Kbps. Billing: {price}THB/{unit} ({ptEN}). Contract: {contract} months. CBS mapping verified. Code: {pCode}. Status: {devStatus}.`,
        `Config {pName}: {modEN} > {pcEN} > {smEN}. Network: {network}, max speed {speed}. Quota: {data}. SIM: eSIM/SIM dual. Provisioning: CRM-CBS-IN sync complete. Price: {price}THB VAT incl. Auto-renew: {autoRenew}. Ref: {rId}.`,
        `Spec {pName}: {data} @ {speed} on {network}. FUP applies after quota. Voice: unlimited on-net. SMS: 100/month. USSD: *123# for balance. CBS rate plan: {price}THB/{unit}. UAT sign-off pending. Build: {rId}.`,
      ],
      TH: [
        `[TECH] ตั้งค่า {pName} เสร็จ. แพ็กเกจ: {pcTH} สำหรับ{modTH} {smTH}. เน็ต: {data} ความเร็วสูงบน{network} จำกัดที่{speed}. หลังครบ: 128 Kbps. บิลลิ่ง: {price}บาท/{unit} ({ptTH}). สัญญา: {contract}เดือน. แมปCBSแล้ว. รหัส: {pCode}. สถานะ: {devStatus}.`,
        `Config {pName}: {modTH} > {pcTH} > {smTH}. เครือข่าย: {network} ความเร็วสูงสุด{speed}. โควต้า: {data}. ซิม: eSIM/SIM dual. Provisioning: ซิงค์ CRM-CBS-IN เรียบร้อย. ราคา: {price}บาท รวมVAT. ต่ออายุอัตโนมัติ: {autoRenew}. อ้างอิง: {rId}.`,
        `สเปก {pName}: {data} @ {speed} บน{network}. ใช้FUPหลังครบโควต้า. โทร: ไม่จำกัดในเครือข่าย. SMS: 100/เดือน. USSD: *123# เช็กยอด. อัตราCBS: {price}บาท/{unit}. รอเซ็นUAT. Build: {rId}.`,
      ],
    },
    business: {
      EN: [
        `[BIZ] {pName} brief. Target: {segEN}. Positioning: {pcEN} tier at {price}THB/{unit}. Key differentiator: {benefit1} + {benefit2}. Contract: {contract} months with {autoRenew} auto-renew. Launch window: {timing}. Channel: {channel}. Status: {devStatus}.`,
        `{pName} GTM plan. Segment: {segEN} (age {minAge}-{maxAge}). Price: {price}THB. Data: {data} at {speed} on {network}. Value props: {benefit1}, {benefit2}. Sales channel: {channel}. Launch: {timing}. Ref: {rId}.`,
      ],
      TH: [
        `[BIZ] สรุป {pName}. เป้าหมาย: {segTH}. การวางตำแหน่ง: ระดับ{pcTH} ที่{price}บาท/{unit}. จุดต่าง: {benefit1} + {benefit2}. สัญญา: {contract}เดือน พร้อมต่ออายุอัตโนมัติ{autoRenew}. หน้าต่างเปิดตัว: {timing}. ช่องทาง: {channel}. สถานะ: {devStatus}.`,
        `แผนออกตลาด {pName}. กลุ่ม: {segTH} (อายุ{minAge}-{maxAge}). ราคา: {price}บาท. เน็ต: {data} ที่{speed} บน{network}. ข้อเสนอคุณค่า: {benefit1}, {benefit2}. ช่องทางขาย: {channel}. เปิดตัว: {timing}. อ้างอิง: {rId}.`,
      ],
    },
    operational: {
      EN: [
        `[OPS] {pName} deployment. CBS rate plan {price}THB/{unit} mapped. CRM product {pCode} ready. IN quota {data} provisioned. Billing cycle {contract}mo. Auto-renew {autoRenew}. Throttle 128kbps post-limit. SMS templates EN/TH ready. Pending: {approval}. ETA: {timing}.`,
        `OPS {pName}: CBS, CRM, IN, Self-care, IVR synced. Data: {data} with rollover. Speed: {speed} on {network}. Price: {price}THB VAT incl. Contract: {contract}mo. Validity: {validity}d. Grace period: 7d. Monitoring active. PO: {pO}.`,
      ],
      TH: [
        `[OPS] deploy {pName}. อัตราCBS {price}บาท/{unit} แมปแล้ว. ผลิตภัณฑ์CRM {pCode} พร้อม. โควต้าIN {data} provisionแล้ว. รอบบิล{contract}เดือน. ต่ออายุอัตโนมัติ{autoRenew}. ลดความเร็ว128kbps หลังครบ. เทมเพลตSMS EN/THพร้อม. รอ: {approval}. ETA: {timing}.`,
        `OPS {pName}: ซิงค์ CBS, CRM, IN, Self-care, IVR แล้ว. เน็ต: {data} พร้อมยกยอด. ความเร็ว: {speed} บน{network}. ราคา: {price}บาท รวมVAT. สัญญา: {contract}เดือน. อายุ: {validity}วัน. ระยะผ่อนผัน: 7วัน. Monitoring active. PO: {pO}.`,
      ],
    },
    summary: {
      EN: [
        `{pName} summary. Type: {pcEN} for {modEN} {smEN}. Specs: {data} @ {speed} on {network}. Price: {price}THB/{unit} ({ptEN}). Contract: {contract}mo. Target: {segEN}. Benefits: {benefit1}, {benefit2}. Launch: {timing}. Status: {devStatus}. PO: {pO}.`,
        `Quick brief {pName}: {pcEN} {modEN} {smEN}. {data}@{speed}, {price}THB/{unit}. {contract}mo, {autoRenew}. For {segEN}. Includes {benefit1}. Launch {timing} via {channel}. {devStatus}. {pO}.`,
      ],
      TH: [
        `สรุป {pName}. ประเภท: {pcTH} สำหรับ{modTH} {smTH}. สเปก: เน็ต{data} @ {speed} บน{network}. ราคา: {price}บาท/{unit} ({ptTH}). สัญญา: {contract}เดือน. เป้าหมาย: {segTH}. สิทธิ: {benefit1}, {benefit2}. เปิดตัว: {timing}. สถานะ: {devStatus}. PO: {pO}.`,
        `สรุปย่อ {pName}: {pcTH} {modTH} {smTH}. {data}@{speed}, {price}บาท/{unit}. สัญญา{contract}เดือน, {autoRenew}. สำหรับ{segTH}. รวม{benefit1}. เปิดตัว{timing} ผ่าน{channel}. {devStatus}. {pO}.`,
      ],
    },
  },
  long: {
    technical: {
      EN: [
        `[TECHNICAL SPEC - {pName}]\n` +
        `Product Code: {pCode}\n` +
        `Package: {pcEN} | Module: {modEN} | Sub: {smEN}\n` +
        `DATA: {data} high-speed on {network} (max {speed}). Post-limit 128 Kbps.\n` +
        `BILLING: {price}THB/{unit} ({ptEN}). Contract {contract}mo, auto-renew {autoRenew}.\n` +
        `FEATURES: {benefit1}, {benefit2}, unlimited on-net calls, 100 SMS/mo.\n` +
        `INTEGRATION: CBS mapped, CRM ready, IN provisioned, Self-care UI ready.\n` +
        `DEPLOY: {channel} channel, target {timing}, capacity {target} subs.\n` +
        `Status: {devStatus} | PO: {pO} | Build: {rId}`,
      ],
      TH: [
        `[สเปกเทคนิค - {pName}]\n` +
        `รหัสผลิตภัณฑ์: {pCode}\n` +
        `แพ็กเกจ: {pcTH} | โมดูล: {modTH} | ย่อย: {smTH}\n` +
        `เน็ต: {data} ความเร็วสูงบน{network} (สูงสุด{speed}) หลังครบ 128 Kbps\n` +
        `บิลลิ่ง: {price}บาท/{unit} ({ptTH}) สัญญา{contract}เดือน ต่ออายุอัตโนมัติ{autoRenew}\n` +
        `ฟีเจอร์: {benefit1}, {benefit2}, โทรฟรีในเครือข่ายไม่จำกัด, SMS 100/เดือน\n` +
        `เชื่อมต่อ: แมปCBSแล้ว, CRMพร้อม, IN provisionแล้ว, UI Self-careพร้อม\n` +
        `Deploy: ช่องทาง{channel} เป้า{timing} ความจุ{target}สมาชิก\n` +
        `สถานะ: {devStatus} | PO: {pO} | Build: {rId}`,
      ],
    },
    business: {
      EN: [
        `[COMMERCIAL BRIEF - {pName}]\n` +
        `{pName} is a {pcENLower} targeting {segEN} (age {minAge}-{maxAge}) at {price}THB/{unit}.\n\n` +
        `MARKET:\n` +
        `  Target: {segEN}\n` +
        `  Network: {network}\n\n` +
        `VALUE PROP:\n` +
        `  • {data} data at {speed}\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • {contract}-month commitment\n\n` +
        `GO-TO-MARKET:\n` +
        `  Launch: {timing} via {channel}\n` +
        `  Capacity: {target} subs in first 90 days\n\n` +
        `APPROVALS:\n` +
        `  Product: {approval}\n` +
        `  PO: {pO} | Code: {pCode}`,
      ],
      TH: [
        `[สรุปเชิงพาณิชย์ - {pName}]\n` +
        `{pName} เป็น{pcTHLower}มุ่งเป้า{segTH} (อายุ{minAge}-{maxAge}) ที่{price}บาท/{unit}\n\n` +
        `ตลาด:\n` +
        `  กลุ่มเป้าหมาย: {segTH}\n` +
        `  เครือข่าย: {network}\n\n` +
        `ข้อเสนอคุณค่า:\n` +
        `  • เน็ต{data} ที่ความเร็ว{speed}\n` +
        `  • {benefit1}\n` +
        `  • {benefit2}\n` +
        `  • สัญญา{contract}เดือน\n\n` +
        `แผนออกตลาด:\n` +
        `  เปิดตัว: {timing} ผ่าน{channel}\n` +
        `  ความจุ: {target}สมาชิกใน 90วันแรก\n\n` +
        `การอนุมัติ:\n` +
        `  ผลิตภัณฑ์: {approval}\n` +
        `  PO: {pO} | รหัส: {pCode}`,
      ],
    },
    operational: {
      EN: [
        `[OPS RUNBOOK - {pName}]\n` +
        `{pName} is a {pcEN} for {modEN} {smEN} customers.\n\n` +
        `ACTIVATION:\n` +
        `  1. Customer initiates via {channel}\n` +
        `  2. CRM validates eligibility ({credit})\n` +
        `  3. CBS creates rate plan {price}THB/{unit}\n` +
        `  4. IN provisions {data} quota\n` +
        `  5. SMS welcome sent\n\n` +
        `SUPPORT:\n` +
        `  L1: Basic troubleshooting\n` +
        `  L2: Quota/billing issues\n` +
        `  L3: System bugs\n` +
        `  SLA: 4h (P1), 24h (P2)\n\n` +
        `MAINTENANCE:\n` +
        `  Quota reset: Daily 00:00 ICT\n` +
        `  Rate plan review: Quarterly\n\n` +
        `PO: {pO} | Code: {pCode} | Launch: {timing}`,
      ],
      TH: [
        `[RUNBOOK OPS - {pName}]\n` +
        `{pName} เป็น{pcTH}สำหรับลูกค้า{modTH} {smTH}\n\n` +
        `การเปิดใช้:\n` +
        `  1. ลูกค้าเริ่มต้นผ่าน{channel}\n` +
        `  2. CRM ตรวจสอบสิทธิ์ ({credit})\n` +
        `  3. CBS สร้างอัตรา{price}บาท/{unit}\n` +
        `  4. IN provision โควต้า{data}\n` +
        `  5. ส่งSMSต้อนรับ\n\n` +
        `Support:\n` +
        `  L1: แก้ปัญหาพื้นฐาน\n` +
        `  L2: ปัญหาโควต้า/บิล\n` +
        `  L3: บั๊กระบบ\n` +
        `  SLA: 4ชม.(P1), 24ชม.(P2)\n\n` +
        `Maintenance:\n` +
        `  รีเซ็ตโควต้า: ทุกวัน 00:00 ICT\n` +
        `  รีวิวอัตรา: ทุกไตรมาส\n\n` +
        `PO: {pO} | รหัส: {pCode} | เปิดตัว: {timing}`,
      ],
    },
    summary: {
      EN: [
        `[BRIEF - {pName}]\n` +
        `Name: {pName} | PO: {pO} | Code: {pCode}\n` +
        `Type: {pcEN} | Module: {modEN} | Sub: {smEN}\n` +
        `Specs: {data} data @ {speed} on {network}. Post-limit 128 Kbps.\n` +
        `Voice: Unlimited on-net. SMS: 100/mo.\n` +
        `Price: {price}THB/{unit} ({ptEN}) | Contract: {contract}mo | Auto-renew: {autoRenew}\n` +
        `Target: {segEN} (age {minAge}-{maxAge})\n` +
        `Benefits: {benefit1}, {benefit2}\n` +
        `Launch: {timing} via {channel} | Capacity: {target} subs\n` +
        `Status: {devStatus} | Approvals: {approval}`,
      ],
      TH: [
        `[สรุป - {pName}]\n` +
        `ชื่อ: {pName} | PO: {pO} | รหัส: {pCode}\n` +
        `ประเภท: {pcTH} | โมดูล: {modTH} | ย่อย: {smTH}\n` +
        `สเปก: เน็ต{data} @ {speed} บน{network} หลังครบ 128 Kbps\n` +
        `โทร: ไม่จำกัดในเครือข่าย SMS: 100/เดือน\n` +
        `ราคา: {price}บาท/{unit} ({ptTH}) | สัญญา: {contract}เดือน | ต่ออายุอัตโนมัติ: {autoRenew}\n` +
        `เป้าหมาย: {segTH} (อายุ{minAge}-{maxAge})\n` +
        `สิทธิ: {benefit1}, {benefit2}\n` +
        `เปิดตัว: {timing} ผ่าน{channel} | ความจุ: {target}สมาชิก\n` +
        `สถานะ: {devStatus} | อนุมัติ: {approval}`,
      ],
    },
  },
};

const DESCRIPTION_POOLS: PoolsRecord = {
  short: {
    EN: [
      `{pName} is a {pcENLower} for {modEN} ({smEN}), offering {data} of high-speed data at up to {speed} on {network} networks. Priced at {price}THB/{unit} with {contract}-month term.`,
      `{pName}: {data} {modENLower} data package with {speed} speeds. {ptEN} billing at {price}THB. Designed for {segEN}. Includes {benefit1}.`,
      `{pcEN} {pName} delivers {data} data @ {speed} on {network}. Target: {segEN}. Launch: {timing}. PO: {pO}.`,
      `{pName} - {modEN} {pcENLower} for {segEN}. {data}@{speed}, {price}THB/{unit}. {benefit1} included.`,
    ],
    TH: [
      `{pName} เป็น{pcTHLower}สำหรับ{modTH} ({smTH}) มอบเน็ตความเร็วสูง{data} ที่ความเร็วสูงสุด{speed} บนเครือข่าย{network} ราคา{price}บาท/{unit} สัญญา{contract}เดือน`,
      `{pName}: แพ็กเกจเน็ต{modTH} {data} ความเร็ว{speed} {ptTH} {price}บาท ออกแบบสำหรับ{segTH} รวม{benefit1}`,
      `{pcTH} {pName} มอบเน็ต{data} @ {speed} บน{network} กลุ่มเป้าหมาย: {segTH} เปิดตัว: {timing} PO: {pO}`,
      `{pName} - {pcTH} {modTH} สำหรับ{segTH} {data}@{speed}, {price}บาท/{unit} รวม{benefit1}`,
    ],
  },
  medium: {
    EN: [
      `{pName} is a {smEN} {pcEN} for {modEN} customers. The package includes {data} of high-speed data with maximum speeds of {speed} on our {network} network, unlimited on-net voice calls, and standard SMS allowance. Priced at {price}THB per {unit} ({ptEN}, VAT inclusive) with a {contract}-month contract term. Auto-renewal is {autoRenew}. This offering targets {segEN}, {segDescEN}. Key features include {benefit1} and {benefit2}.`,
      `{pName} delivers exceptional value for {segEN}. Subscribers receive {data} of 5G-ready data at {speed}, enabling seamless streaming, browsing, and connectivity. The {ptEN} pricing model at {price}THB ensures predictable billing. Package validity is {validity} days with {contract}-month commitment. Additional benefits: {benefit1}, {benefit2}. PO Reference: {pO}.`,
      `Introducing {pName}, our latest {pcENLower} for {modEN} users. Designed for {segEN}, this package combines {data} of data at {speed} speeds with premium features like {benefit1} and {benefit2}. At {price}THB/{unit}, it offers {contract}-month flexibility with {autoRenew} renewal. Launch via {channel} in {timing}.`,
    ],
    TH: [
      `{pName} เป็น{pcTH} {smTH} สำหรับลูกค้า{modTH} แพ็กเกจรวมเน็ตความเร็วสูง{data} ความเร็วสูงสุด{speed} บนเครือข่าย{network} โทรฟรีในเครือข่ายไม่จำกัด และสิทธิ์SMSมาตรฐาน ราคา{price}บาทต่อ{unit} ({ptTH} รวมVAT) สัญญา{contract}เดือน {autoRenew} ข้อเสนอนี้มุ่งเป้า{segTH} {segDescTH} คุณสมบัติหลักได้แก่{benefit1} และ{benefit2}`,
      `{pName} มอบความคุ้มค่าที่ยอดเยี่ยมสำหรับ{segTH} สมาชิกได้รับเน็ตพร้อม5G {data} ที่ความเร็ว{speed} สนับสนุนการสตรีม ท่องเว็บ และการเชื่อมต่อที่ราบรื่น รูปแบบราคา{ptTH}ที่{price}บาท ช่วยให้คาดการณ์ค่าใช้จ่ายได้ แพ็กเกจมีอายุ{validity}วัน ผูกพันสัญญา{contract}เดือน สิทธิประโยชน์เพิ่มเติม: {benefit1}, {benefit2} POอ้างอิง: {pO}`,
      `ขอแนะนำ {pName} {pcTHLower}ใหม่ล่าสุดสำหรับผู้ใช้{modTH} ออกแบบสำหรับ{segTH} แพ็กเกจนี้รวมเน็ต{data} ที่ความเร็ว{speed} พร้อมฟีเจอร์พรีเมียมเช่น{benefit1} และ{benefit2} ที่{price}บาท/{unit} ให้ความยืดหยุ่น{contract}เดือน พร้อมต่ออายุ{autoRenew} เปิดตัวผ่าน{channel} ใน{timing}`,
    ],
  },
  long: {
    EN: [
      `{pName} - Product Offering Description\n\n` +
      `Category: {modEN} > {pcEN} ({smEN})\n` +
      `Data: {data} high-speed data, throttled to 128 Kbps thereafter\n` +
      `Network: {network} with speeds up to {speed} (where available)\n` +
      `Voice/SMS: Unlimited on-net calls, standard SMS allowance\n` +
      `Pricing: {price}THB/{unit} ({ptEN}, VAT inclusive)\n` +
      `Validity: {validity} days from activation\n\n` +
      `Target: {segEN} (age {minAge}-{maxAge}) - {segDescEN}\n\n` +
      `Key Benefits:\n` +
      `  - {benefit1}\n` +
      `  - {benefit2}\n` +
      `  - Nationwide coverage with {network} priority\n\n` +
      `Launch Target: {timing} via {channel}\n` +
      `PO Reference: {pO} | Product Code: {pCode}`,

      `{pName} represents a strategic {pcENLower} offering within our {modEN} portfolio, designed to address the connectivity needs of {segENLower}. {segDescENCap}.\n\n` +
      `Technical Specifications:\n` +
      `  - Data: {data} at {speed} on {network} network\n` +
      `  - Post-limit speed: 128 Kbps for continued basic connectivity\n` +
      `  - Voice: Unlimited calls to same-network numbers\n` +
      `  - SMS: Standard monthly allowance\n` +
      `  - 5G Access: {network5G}\n\n` +
      `Commercial Structure:\n` +
      `  - Price: {price}THB/{unit} ({ptEN})\n` +
      `  - Auto-renewal: {autoRenewDesc}\n` +
      `  - Early termination: {earlyTerm}\n\n` +
      `Value Proposition:\n` +
      `  - {benefit1Cap}\n` +
      `  - {benefit2Cap}\n` +
      `  - Predictable billing with no hidden charges\n\n` +
      `Go-to-Market: Target launch {timing} via {channel}. PO: {pO}.`,

      `{pName} - Comprehensive Overview\n\n` +
      `{pName} is our latest {pcENLower} designed specifically for {segEN} customers. In today's connected world, {segDescEN}.\n\n` +
      `What's Included:\n` +
      `  - {data} high-speed data on {network}\n` +
      `  - Speeds up to {speed}\n` +
      `  - Unlimited on-net calls\n` +
      `  - {benefit1}\n` +
      `  - {benefit2}\n` +
      `  - {contract}-month contract with {autoRenew} renewal\n\n` +
      `Why {pName}? At {price}THB/{unit}, {pName} offers exceptional value. The {data} allowance supports heavy usage patterns, while {speed} ensures smooth streaming and browsing. Our {network} network provides reliable coverage.\n\n` +
      `Target Launch: {timing}\n` +
      `Distribution: {channel}\n` +
      `PO Reference: {pO}`,
    ],
    TH: [
      `{pName} - รายละเอียดผลิตภัณฑ์\n\n` +
      `ประเภท: {modTH} > {pcTH} ({smTH})\n` +
      `ปริมาณเน็ต: {data} ความเร็วสูง (ลดความเร็วเหลือ 128 Kbps หลังครบ)\n` +
      `เครือข่าย: {network} ความเร็วสูงสุด{speed} (ในพื้นที่รองรับ)\n` +
      `โทร/SMS: โทรฟรีในเครือข่ายไม่จำกัด รวมสิทธิ์SMSมาตรฐาน\n` +
      `ราคา: {price}บาท/{unit} ({ptTH} รวมVAT)\n` +
      `สัญญา: {contract}เดือน | ต่ออายุอัตโนมัติ: {autoRenew}\n` +
      `อายุแพ็กเกจ: {validity}วันนับจากเปิดใช้\n\n` +
      `กลุ่มเป้าหมาย: {segTH} (อายุ{minAge}-{maxAge}ปี) - {segDescTH}\n\n` +
      `สิทธิประโยชน์หลัก:\n` +
      `  - {benefit1}\n` +
      `  - {benefit2}\n` +
      `  - ครอบคลุมทั่วประเทศด้วยความสำคัญเครือข่าย{network}\n\n` +
      `แผนเชิงพาณิชย์: เปิดตัว{timing} ผ่าน{channel}\n` +
      `POอ้างอิง: {pO} | รหัสผลิตภัณฑ์: {pCode}`,

      `{pName} เป็นข้อเสนอยุทธศาสตร์{pcTHLower}ภายในพอร์ตโฟลิโอ{modTH}ของเรา ออกแบบมาเพื่อตอบสนองความต้องการการเชื่อมต่อของ{segTH} {segDescTHCap}\n\n` +
      `ข้อกำหนดทางเทคนิค:\n` +
      `  - เน็ต: {data} ที่{speed} บนเครือข่าย{network}\n` +
      `  - ความเร็วหลังครบ: 128 Kbps สำหรับการเชื่อมต่อพื้นฐานต่อเนื่อง\n` +
      `  - โทร: ไม่จำกัดเบอร์ในเครือข่ายเดียวกัน\n` +
      `  - SMS: สิทธิ์มาตรฐานรายเดือน\n` +
      `  - การเข้าถึง5G: {network5G}\n\n` +
      `โครงสร้างเชิงพาณิชย์:\n` +
      `  - ราคา: {price}บาท/{unit} ({ptTH})\n` +
      `  - ระยะสัญญา: {contract}เดือน\n` +
      `  - ต่ออายุอัตโนมัติ: {autoRenewDesc}\n` +
      `  - ยกเลิกก่อนกำหนด: {earlyTerm}\n\n` +
      `ข้อเสนอคุณค่า:\n` +
      `  - {benefit1Cap}\n` +
      `  - {benefit2Cap}\n` +
      `  - การเรียกเก็บเงินที่คาดการณ์ได้โดยไม่มีค่าใช้จ่ายแอบแฝง\n\n` +
      `แผนออกสู่ตลาด: เป้าหมายเปิดตัว{timing} ผ่าน{channel} POอ้างอิง: {pO}`,

      `{pName} - ภาพรวมครบถ้วน\n\n` +
      `{pName} เป็น{pcTHLower}ใหม่ล่าสุดของเราที่ออกแบบมาเพื่อลูกค้า{segTH}โดยเฉพาะ ในโลกที่เชื่อมต่อปัจจุบัน {segDescTH}\n\n` +
      `สิ่งที่รวมอยู่:\n` +
      `  - เน็ตความเร็วสูง{data} บน{network}\n` +
      `  - ความเร็วสูงสุด{speed}\n` +
      `  - โทรฟรีในเครือข่ายไม่จำกัด\n` +
      `  - {benefit1}\n` +
      `  - {benefit2}\n` +
      `  - สัญญา{contract}เดือน พร้อมต่ออายุ{autoRenew}\n\n` +
      `ทำไมต้อง{pName}? ที่{price}บาท/{unit} {pName} ให้ความคุ้มค่าเป็นพิเศษ ปริมาณ{data}รองรับรูปแบบการใช้งานหนัก ขณะที่{speed}ช่วยให้สตรีมมิ่งและท่องเว็บราบรื่น เครือข่าย{network}ของเราให้การครอบคลุมที่เชื่อถือได้\n\n` +
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

  const selectedData = pickRandom(Object.keys(PRICE_BY_DATA));
  const priceRange   = PRICE_BY_DATA[selectedData];
  const priceMultiplier = pClass === 'main' ? 1 : (pClass === 'ontop' ? 0.5 : 0.3);
  const priceAmount  = randomInt(
    Math.ceil(priceRange.min * priceMultiplier),
    Math.floor(priceRange.max * priceMultiplier)
  );

  const is5GLikely = mod === 'MOB' && pClass === 'main' && Math.random() < 0.8;
  const networkType = is5GLikely ? pickRandom(['5G-Standard', '5G-Premium']) : '4G';
  const maxSpeed    = pickRandom(SPEED_BY_NETWORK[networkType]);

  const contractMonths = pickRandom(getContractTerms(sModule, pClass));
  const validityDays   = sModule === 'PRE'
    ? pickRandom([1, 7, 15, 30])
    : pickRandom([30, 90, 180, 365]);

  const segmentKey = pickRandom(Object.keys(TARGET_SEGMENTS));
  const segment    = TARGET_SEGMENTS[segmentKey];

  const benefitList = BENEFITS_BY_CLASS[pClass === 'main' ? 'main' : 'ontop'];
  const benefit1EN  = pickRandom(benefitList.EN);
  const benefit1TH  = pickRandom(benefitList.TH);
  const benefit2EN  = pickRandom(benefitList.EN.filter(b => b !== benefit1EN));
  const benefit2TH  = pickRandom(benefitList.TH.filter(b => b !== benefit1TH));

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

  let template = pickRandom(REMARK_POOLS[lengthType][style][lang]);

  // ✅ Pre-compute all derived values here to avoid Cypress parsing expressions in templates
  const replacements: Record<string, string | number> = {
    '{pName}': ctx.pName,
    '{pO}': ctx.pOName,
    '{pCode}': ctx.productCode,
    '{rId}': ctx.randomId,
    '{pcEN}': ctx.pcDisplay.EN,
    '{pcTH}': ctx.pcDisplay.TH,
    '{pcENLower}': ctx.pcDisplay.EN.toLowerCase(),
    '{pcTHLower}': ctx.pcDisplay.TH.toLowerCase(),
    '{modEN}': ctx.modDisplay.EN,
    '{modTH}': ctx.modDisplay.TH,
    '{modENLower}': ctx.modDisplay.EN.toLowerCase(),
    '{modTHLower}': ctx.modDisplay.TH.toLowerCase(),
    '{smEN}': ctx.smDisplay.EN,
    '{smTH}': ctx.smDisplay.TH,
    '{ptEN}': ctx.ptDisplay.EN,
    '{ptTH}': ctx.ptDisplay.TH,
    '{data}': ctx.selectedData,
    '{speed}': ctx.maxSpeed,
    '{network}': ctx.networkType,
    '{price}': ctx.priceAmount,
    '{unit}': perUnit[lang],
    '{contract}': ctx.contractMonths,
    '{validity}': ctx.validityDays,
    '{timing}': ctx.launchTiming,
    '{segEN}': ctx.segment.labelEN,
    '{segTH}': ctx.segment.labelTH,
    '{segENLower}': ctx.segment.labelEN.toLowerCase(),
    '{segTHLower}': ctx.segment.labelTH.toLowerCase(),
    '{segDescEN}': ctx.segment.descEN,
    '{segDescTH}': ctx.segment.descTH,
    '{segDescENCap}': ctx.segment.descEN.charAt(0).toUpperCase() + ctx.segment.descEN.slice(1),
    '{segDescTHCap}': ctx.segment.descTH.charAt(0).toUpperCase() + ctx.segment.descTH.slice(1),
    '{minAge}': ctx.segment.min,
    '{maxAge}': ctx.segment.max,
    '{benefit1}': ctx.benefit1[lang],
    '{benefit2}': ctx.benefit2[lang],
    '{target}': ctx.subscriberTarget,
    '{engDate}': ctx.dates.engDate,
    '{thaiDate}': ctx.dates.thaiDate,
    '{time}': ctx.dates.currentTime,
    '{autoRenew}': ctx.sModule === 'POST' ? (useThai ? 'ใช่' : 'Yes') : (useThai ? 'ไม่' : 'No'),
    '{devStatus}': pickRandom(METADATA_POOLS.devStatus[lang]),
    '{approval}': pickRandom(METADATA_POOLS.approval[lang]),
    '{channel}': pickRandom(METADATA_POOLS.channel[lang]),
    '{credit}': pickRandom(METADATA_POOLS.credit[lang]),
  };

  let text = template;
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  });

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

  // ✅ Pre-compute all derived values to prevent Cypress parse errors
  const replacements: Record<string, string | number> = {
    '{pName}': ctx.pName,
    '{pO}': ctx.pOName,
    '{pCode}': ctx.productCode,
    '{pcEN}': ctx.pcDisplay.EN,
    '{pcTH}': ctx.pcDisplay.TH,
    '{pcENLower}': ctx.pcDisplay.EN.toLowerCase(),
    '{pcTHLower}': ctx.pcDisplay.TH.toLowerCase(),
    '{modEN}': ctx.modDisplay.EN,
    '{modTH}': ctx.modDisplay.TH,
    '{modENLower}': ctx.modDisplay.EN.toLowerCase(),
    '{modTHLower}': ctx.modDisplay.TH.toLowerCase(),
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
    '{segENLower}': ctx.segment.labelEN.toLowerCase(),
    '{segTHLower}': ctx.segment.labelTH.toLowerCase(),
    '{segDescEN}': ctx.segment.descEN,
    '{segDescTH}': ctx.segment.descTH,
    '{segDescENCap}': ctx.segment.descEN.charAt(0).toUpperCase() + ctx.segment.descEN.slice(1),
    '{segDescTHCap}': ctx.segment.descTH.charAt(0).toUpperCase() + ctx.segment.descTH.slice(1),
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

  let text = template;
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), String(value));
  });

  if (ctx.pOName && Math.random() < 0.5) {
    text += useThai ? `\n\nPO อ้างอิง: ${ctx.pOName}` : `\n\nPO Reference: ${ctx.pOName}`;
  }

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