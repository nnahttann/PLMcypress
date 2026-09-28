export const LANGS = ['ENG', 'THA', 'CHI', 'JPN', 'KOR', 'BUR', 'KHM', 'LAO'] as const;
export type Lang = typeof LANGS[number];
export type LangMap<T = string> = Record<Lang, T>;

// ─── Utility Functions ───────────────────────────────────────────
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

const stableHash = (value: string): number => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
};

const stablePick = <T>(items: T[], seed: string): T => {
    if (!items || items.length === 0) return '' as unknown as T;
    const index = stableHash(seed) % items.length;
    return items[index];
};

const stableNumber = (seed: string, min: number, max: number): number => {
    const range = max - min + 1;
    return min + (stableHash(seed) % range);
};

const stableBoolean = (seed: string): boolean => stableHash(seed) % 2 === 0;

const pickAllLangs = (pools: LangMap<string[]>, seedBase: string, key: string): LangMap => {
    return LANGS.reduce((acc, lang) => {
        acc[lang] = stablePick(pools[lang], `${seedBase}|${key}|${lang}`);
        return acc;
    }, {} as LangMap);
};

const buildAllLangs = (
    templates: LangMap<string[]>,
    seedBase: string,
    key: string,
    replaceFn: (template: string, lang: Lang) => string
): LangMap<string[]> => {
    return LANGS.reduce((acc, lang) => {
        acc[lang] = templates[lang].map((tpl) => replaceFn(tpl, lang));
        return acc;
    }, {} as LangMap<string[]>);
};

const withLegacyTextAliases = <T extends LangMap<string[]>>(value: T): T & { EN: string[]; TH: string[] } => {
    return Object.assign({}, value, {
        EN: value.ENG,
        TH: value.THA,
    }) as T & { EN: string[]; TH: string[] };
};

export const RandomProjectDescription = (
    projectName: string,
    poName?: string,
    Module: string = 'MOB',
    PriceType: string = 'recurring',
    subModule?: string
): void => {
    const pools = createPOWordingPools(projectName, poName || 'Project Offering', Module, PriceType, subModule);
    const text = pickRandom((pools.description.ENG ? Object.values(pools.description).flat() : []) as string[]);
    cy.get('body').then(($body) => {
        const selectors = [
            'textarea[formcontrolname="projectDescription"]',
            'textarea[formcontrolname="description"]',
            'textarea[formcontrolname="promotionDescription"]',
        ];
        const found = selectors.find((selector) => $body.find(selector).length > 0);
        if (!found) {
            cy.log('⚠️ RandomProjectDescription: project description field not found');
            return;
        }
        cy.get(found).clear({ force: true }).type(text, { force: true });
    });
};

export const RandomRemark = (
    projectName: string,
    poName: string,
    PriceType: string = 'recurring',
    ProductClass?: string,
    subModule?: string,
    Module: string = 'MOB'
): void => {
    const pools = createPOWordingPools(projectName, poName, Module, PriceType, subModule || 'POST');
    const text = pools.remarkText || `${projectName} ${poName}`;
    cy.get('body').then(($body) => {
        const selectors = [
            'textarea[formcontrolname="remark"]',
            'textarea[formcontrolname="remarkText"]',
            'textarea[formcontrolname="remarkDescription"]',
            'textarea[formcontrolname="poRemark"]',
            'textarea[formcontrolname="projectRemark"]',
        ];
        const found = selectors.find((selector) => $body.find(selector).length > 0);
        if (!found) {
            cy.log('⚠️ RandomRemark: remark field not found');
            return;
        }
        cy.get(found)
            .filter(':visible')
            .first()
            .clear({ force: true })
            .type(text, { force: true });
    });
};

// ─── Core Deterministic Data ─────────────────────────────────────
export const createDeterministicTestData = (
    projectName: string,
    poName: string,
    Module: string,
    PriceType: string,
    subModule?: string
) => {
    const p = projectName || `${Module} ${PriceType}`;
    const po = poName || 'Product Offering';
    const seedBase = `${p}|${po}|${Module}|${PriceType}|${subModule || 'POST'}`;

    const dataAmount = stablePick(DATA_AMOUNTS, `${seedBase}|dataAmount`);
    const speed = stablePick(SPEEDS, `${seedBase}|speed`);
    const price = stableNumber(`${seedBase}|price`, 59, 2999);
    const validity = stablePick(DURATIONS, `${seedBase}|validity`);
    const contractMonths = stablePick(CONTRACT_MONTHS_LIST, `${seedBase}|contractMonths`);
    const network = stablePick(NETWORK_TYPES, `${seedBase}|network`);

    const discountName = pickAllLangs(DISCOUNT_NAME_TEMPLATES, seedBase, 'discountName');
    Object.keys(discountName).forEach((l) => {
        discountName[l as Lang] = discountName[l as Lang].replace(/\{p\}/g, p);
    });

    const projectDescription = `${p} ${Module} ${PriceType} package with ${dataAmount} data at ${speed} on ${network} network. Valid for ${validity} days. Price ${price} THB.`;
    const remark = `${p} | PO ${po} | ${Module} | ${PriceType} | ${dataAmount} at ${speed} | ${network} | THB ${price} | ${contractMonths} months contract`;

    return {
        seedBase,
        dataAmount,
        speed,
        price,
        validity,
        contractMonths,
        network,
        discountName,
        projectDescription,
        remark,
        durationFrom: stableNumber(`${seedBase}|durationFrom`, 1, 30),
        durationTo: stableNumber(`${seedBase}|durationTo`, 31, 365),
    };
};

// ─── Package Name Pools (per language) ───────────────────────────
const PACKAGE_NAME_POOLS: { mobile: LangMap<string[]>; internet: LangMap<string[]>; entertainment: LangMap<string[]> } = {
    mobile: {
        ENG: [
            '5G Max Speed Unlimited', '5G NonStop 30GB', '4G Super Net 50GB', '5G Premium 100GB',
            'Max Total 70GB', 'Work From Home 50GB', 'Student Saver 15GB', 'Family Share 100GB',
            'Gamer Pro 30GB', 'Stream Max Unlimited', 'Turbo 5G 50GB', 'Business Pro 100GB',
            // NEW ADDITIONS
            '5G Ultra Saver 20GB', 'Unlimited Social 15GB', 'Work and Play 50GB', 'Night Owl Unlimited', 'Traveler Roaming 10GB'
        ],
        THA: [
            '5G แม็กซ์ สปีด อันลิมิต', '5G นอนสต็อป 30GB', '4G ซูเปอร์ เน็ต 50GB', '5G พรีเมียม 100GB',
            'แม็กซ์ โทเทิล 70GB', 'เวิร์ค ฟรอม โฮม 50GB', 'นักศึกษา เซฟเวอร์ 15GB', 'แฟมิลี่ แชร์ 100GB',
            'เกมเมอร์ โปร 30GB', 'สตรีม แม็กซ์ อันลิมิต', 'เทอร์โบ 5G 50GB', 'บิสซิเนส โปร 100GB',
            // NEW ADDITIONS
            '5G อัลตร้า เซฟเวอร์ 20GB', 'โซเชียลอันลิมิต 15GB', 'เวิร์ค แอนด์ เพลย์ 50GB', 'ไนท์ ออล อันลิมิต', 'นักเดินทาง โร밍 10GB'
        ],
        CHI: [
            '5G极速无限流量', '5G不间断30GB', '4G超级网络50GB', '5G尊享100GB',
            '总流量70GB', '居家办公50GB', '学生省钱15GB', '家庭共享100GB',
            '游戏专用30GB', '极速追剧无限', '涡轮5G 50GB', '商务尊享100GB',
            // NEW ADDITIONS
            '5G超值省钱20GB', '社交无限15GB', '工作娱乐50GB', '夜猫子无限', '旅行者漫游10GB'
        ],
        JPN: [
            '5Gマックススピード使い放題', '5Gノンストップ30GB', '4Gスーパーネット50GB', '5Gプレミアム100GB',
            'マックストータル70GB', 'ワークフロムホーム50GB', '学生セーバー15GB', 'ファミリーシェア100GB',
            'ゲーマープロ30GB', 'ストリームマックス使い放題', 'ターボ5G 50GB', 'ビジネスプロ100GB',
            // NEW ADDITIONS
            '5Gウルトラセーバー20GB', 'SNS使い放題15GB', 'ワーク＆プレイ50GB', '夜ふかし使い放題', 'トラベラーローミング10GB'
        ],
        KOR: [
            '5G 맥스 스피드 무제한', '5G 논스톱 30GB', '4G 슈퍼넷 50GB', '5G 프리미엄 100GB',
            '맥스 토탈 70GB', '워크 프롬 홈 50GB', '학생 세이버 15GB', '패밀리 쉐어 100GB',
            '게이머 프로 30GB', '스트림 맥스 무제한', '터보 5G 50GB', '비즈니스 프로 100GB',
            // NEW ADDITIONS
            '5G 울트라 세이버 20GB', '소셜 무제한 15GB', '워크 앤 플레이 50GB', '올빼미 무제한', '여행자 로밍 10GB'
        ],
        BUR: [
            '5G အမြန်ဆုံး အကန့်အသတ်မရှိ', '5G အဆက်မပြတ် 30GB', '4G ဆူပါနက် 50GB', '5G ပရီမီယံ 100GB',
            'မက်စ် စုစုပေါင်း 70GB', 'အိမ်မှအလုပ်လုပ် 50GB', 'ကျောင်းသား 15GB', 'မိသားစု မျှဝေ 100GB',
            'ဂိမ်းဘော် ပရို 30GB', 'စတရင်း မက်စ် အကန့်အသတ်မရှိ', 'တာဘို 5G 50GB', 'စီးပွားရေး ပရို 100GB',
            // NEW ADDITIONS
            '5G အလွန်ချွေတာ 20GB', 'လူမှုကွန်ရက် အကန့်အသတ်မရှိ 15GB', 'အလုပ်နှင့် ဖျော်ဖြေရေး 50GB', 'ညဘက် အကန့်အသတ်မရှိ', 'ခရီးသွား ရိုမင်း 10GB'
        ],
        KHM: [
            '5G ល្បឿនអតិបរមា មិនកំណត់', '5G មិនឈប់ 30GB', '4G ស៊ូភើណិត 50GB', '5G ព្រីមៀម 100GB',
            'ម៉ាក់ស៍ សរុប 70GB', 'ធ្វើការពីផ្ទះ 50GB', 'និស្សិត សន្សំ 15GB', 'គ្រួសារ ចែករំលែក 100GB',
            'ហ្គេមមឺរ ប្រូ 30GB', 'ស្ទ្រីម ម៉ាក់ស៍ មិនកំណត់', 'ទួរបូ 5G 50GB', 'អាជីវកម្ម ប្រូ 100GB',
            // NEW ADDITIONS
            '5G សន្សំសំចៃបំផុត 20GB', 'បណ្តាញសង្គមមិនកំណត់ 15GB', 'ការងារ និងកម្សាន្ត 50GB', 'សត្វស្លាបព្រាត់មិនកំណត់', 'អ្នកធ្វើដំណើរ រ៉ូមីង 10GB'
        ],
        LAO: [
            '5G ໄວສູງສຸດ ບໍ່ຈຳກັດ', '5G ບໍ່ຢຸດ 30GB', '4G ຊູເປີເນັດ 50GB', '5G ພຣີມຽມ 100GB',
            'ແມັກສ໌ລວມ 70GB', 'ເຮັດວຽກຢູ່ບ້ານ 50GB', 'ນັກສຶກສາປະຫຍັດ 15GB', 'ແບ່ງປັນຄອບຄົວ 100GB',
            'ນັກເກມໂປຣ 30GB', 'ສະຕຣີມແມັກສ໌ບໍ່ຈຳກັດ', 'ເທີໂບ 5G 50GB', 'ທຸລະກິດໂປຣ 100GB',
            // NEW ADDITIONS
            '5G ປະຢັດສູງສຸດ 20GB', 'ໂຊຊຽລບໍ່ຈຳກັດ 15GB', 'ເຮັດວຽກ ແລະ ຫຼິ້ນ 50GB', 'ນົກກາງຄືນບໍ່ຈຳກັດ', 'ນັກທ່ອງທ່ຽວ ໂຣມິ່ງ 10GB'
        ],
    },
    internet: {
        ENG: ['Home Fiber 200Mbps', 'Home Fiber 500Mbps', 'Home Fiber 1Gbps', 'Gamer Fiber 500Mbps', 'Office Connect 500Mbps',
            'Smart Home Fiber 1Gbps', 'WFH Pro 500Mbps', 'Ultra Gaming Fiber 2Gbps', 'SME Business Fiber 500Mbps'],
        THA: ['โฮม ไฟเบอร์ 200Mbps', 'โฮม ไฟเบอร์ 500Mbps', 'โฮม ไฟเบอร์ 1Gbps', 'เกมเมอร์ ไฟเบอร์ 500Mbps', 'ออฟฟิศ คอนเนค 500Mbps',
            'สมาร์ท โฮม ไฟเบอร์ 1Gbps', 'WFH โปร 500Mbps', 'อัลตร้า เกมมิ่ง ไฟเบอร์ 2Gbps', 'SME บิสซิเนส ไฟเบอร์ 500Mbps'],
        CHI: ['家庭光纤200Mbps', '家庭光纤500Mbps', '家庭光纤1Gbps', '游戏光纤500Mbps', '办公室连接500Mbps',
            '智能家居光纤1Gbps', '居家办公专业版500Mbps', '极致游戏光纤2Gbps', '中小企业商务光纤500Mbps'],
        JPN: ['ホームファイバー200Mbps', 'ホームファイバー500Mbps', 'ホームファイバー1Gbps', 'ゲーマーファイバー500Mbps', 'オフィス接続500Mbps',
            'スマートホームファイバー1Gbps', 'WFHプロ500Mbps', 'ウルトラゲーミングファイバー2Gbps', 'SMEビジネスファイバー500Mbps'],
        KOR: ['홈 파이버 200Mbps', '홈 파이버 500Mbps', '홈 파이버 1Gbps', '게이머 파이버 500Mbps', '오피스 커넥트 500Mbps',
            '스마트 홈 파이버 1Gbps', 'WFH 프로 500Mbps', '울트라 게이밍 파이버 2Gbps', 'SME 비즈니스 파이버 500Mbps'],
        BUR: ['အိမ်သုံးဖိုင်ဘာ 200Mbps', 'အိမ်သုံးဖိုင်ဘာ 500Mbps', 'အိမ်သုံးဖိုင်ဘာ 1Gbps', 'ဂိမ်းဖိုင်ဘာ 500Mbps', 'ရုံးချိတ်ဆက် 500Mbps',
            'စမတ်အိမ် ဖိုင်ဘာ 1Gbps', 'WFH ပရို 500Mbps', 'အလွန် ဂိမ်း ဖိုင်ဘာ 2Gbps', 'SME စီးပွားရေး ဖိုင်ဘာ 500Mbps'],
        KHM: ['ហ្វាយប័រផ្ទះ 200Mbps', 'ហ្វាយប័រផ្ទះ 500Mbps', 'ហ្វាយប័រផ្ទះ 1Gbps', 'ហ្គេមហ្វាយប័រ 500Mbps', 'ការិយាល័យ 500Mbps',
            'ហ្វាយប័រផ្ទះឆ្លាតវៃ 1Gbps', 'WFH ប្រូ 500Mbps', 'ហ្គេមហ្វាយប័រអ៊ុលត្រា 2Gbps', 'SME អាជីវកម្មហ្វាយប័រ 500Mbps'],
        LAO: ['ໄຟເບີບ້ານ 200Mbps', 'ໄຟເບີບ້ານ 500Mbps', 'ໄຟເບີບ້ານ 1Gbps', 'ໄຟເບີເກມ 500Mbps', 'ອອຟຟິດເຊື່ອມຕໍ່ 500Mbps',
            'ສະມາດໂຮມໄຟເບີ 1Gbps', 'WFH ໂປຣ 500Mbps', 'ອັນຕຣ້າເກມໄຟເບີ 2Gbps', 'SME ທຸລະກິດໄຟເບີ 500Mbps'],
    },
    entertainment: {
        ENG: ['Movie Lover Pack', 'Series Binge Pack', 'Music Stream Plus', 'Gaming Bundle', 'Sports Live Pack',
            'Global Streaming Max', 'Esports Champion Pack', 'KPop and Drama Unlimited', 'Family Entertainment Hub'],
        THA: ['มูฟวี่ เลิฟเวอร์ แพ็ค', 'ซีรี่ย์ บิงจ์ แพ็ค', 'มิวสิค สตรีม พลัส', 'เกมมิ่ง บันเดิล', 'สปอร์ต ไลฟ์ แพ็ค',
            'โกลบอล สตรีมมิ่ง แม็กซ์', 'อีสปอร์ต แชมเปี้ยน แพ็ค', 'เคป็อป แอนด์ ดราม่า อันลิมิต', 'แฟมิลี่ เอนเตอร์เทนเมนต์ ฮับ'],
        CHI: ['电影爱好者套餐', '剧集追剧套餐', '音乐串流加值', '游戏组合包', '体育直播套餐',
            '全球流媒体至尊', '电竞冠军套餐', '韩流与剧集无限', '家庭娱乐中心'],
        JPN: ['映画好きパック', 'ドラマ一気見パック', 'ミュージックストリームプラス', 'ゲーミングバンドル', 'スポーツライブパック',
            'グローバルストリーミングマックス', 'eスポーツチャンピオンパック', 'KPOPドラマ使い放題', 'ファミリーエンタメハブ'],
        KOR: ['영화 애호가 팩', '시리즈 정주행 팩', '뮤직 스트림 플러스', '게이밍 번들', '스포츠 라이브 팩',
            '글로벌 스트리밍 맥스', 'e스포츠 챔피언 팩', 'KPOP and 드라마 무제한', '패밀리 엔터테인먼트 허브'],
        BUR: ['ရုပ်ရှင်ချစ်သူ ပက်ကေ့ဂ်', 'ဒရာမာ ပက်ကေ့ဂ်', 'ဂီတ ပလပ်စ်', 'ဂိမ်း အစုအဝေး', 'အားကစား တိုက်ရိုက်',
            'ကမ္ဘာလုံးဆင်ရနည်း စတရင်းမင်း အမြင့်ဆုံး', 'အနည်းငယ် အလယခနယ ပက်ကေ့ဂ်', 'ကပေါ့ပ် နှင့် ဒရာမာ အကန့်အသတ်မရှိ', 'မသဘင်စဉ် ဖနတယခနယ ဟဘ'],
        KHM: ['កញ្ចប់ស្នេហ៍ភាពយន្ត', 'កញ្ចប់ស៊េរីស', 'តន្ត្រីស្ទ្រីមភ្លុស', 'កញ្ចប់ហ្គេម', 'កីឡាផ្សាយផ្ទាល់',
            'ស្ទ្រីមមីងពិភពលោកអតិបរមា', 'កញ្ចប់ជើងឯកអេស្ពត', 'កេប៉ុប និងស៊េរីមិនកំណត់', 'មជ្ឈមណ្ឌលកម្សាន្តគ្រួសារ'],
        LAO: ['ແພັກຄົນຮັກຮູບເງົາ', 'ແພັກຊີຣີສ໌', 'ສະຕຣີມເພງພລັສ', 'ຊຸດເກມ', 'ແພັກກິລາສົດ',
            'ໂກລໂບ້ລສະຕຣີມມິງແມັກສ໌', 'ແພັກຊັມປ້ຽນອີສະປອດ', 'ເຄ-ປ໊ອບ ແລະ ຊີຣີສ໌ບໍ່ຈຳກັດ', 'ສູນບັນເທີງຄອບຄົວ'],
    },
};

// ─── Segment and Benefit Pools (per language) ──────────────────────
const SEGMENTS: LangMap<string>[] = [
    { ENG: 'Mass Market', THA: 'ตลาดทั่วไป', CHI: '大众市场', JPN: 'マスマーケット', KOR: '매스마켓', BUR: 'အများပြည်သူ', KHM: 'ទីផ្សារទូទៅ', LAO: 'ຕະຫຼາດທົ່ວໄປ' },
    { ENG: 'Student', THA: 'นักศึกษา', CHI: '学生', JPN: '学生', KOR: '학생', BUR: 'ကျောင်းသား', KHM: 'និស្សិត', LAO: 'ນັກສຶກສາ' },
    { ENG: 'Young Professional', THA: 'วัยทำงาน', CHI: '年轻上班族', JPN: '若手社会人', KOR: '젊은 직장인', BUR: 'အလုပ်လုပ်သူငယ်', KHM: 'អ្នកធ្វើការវ័យក្មេង', LAO: 'ຄົນເຮັດວຽກໜຸ່ມ' },
    { ENG: 'Family', THA: 'ครอบครัว', CHI: '家庭', JPN: 'ファミリー', KOR: '가족', BUR: 'မိသားစု', KHM: 'គ្រួសារ', LAO: 'ຄອບຄົວ' },
    { ENG: 'Senior', THA: 'ผู้สูงอายุ', CHI: '银发族', JPN: 'シニア', KOR: '시니어', BUR: 'သက်ကြီးရွယ်အို', KHM: 'ចាស់ជរា', LAO: 'ຜູ້ສູງອາຍຸ' },
    { ENG: 'SME Owner', THA: 'เจ้าของธุรกิจ', CHI: '中小企业主', JPN: '中小企業経営者', KOR: '중소기업 사장', BUR: 'SME ပိုင်ရှင်', KHM: 'ម្ចាស់អាជីវកម្មតូច', LAO: 'ເຈົ້າຂອງທຸລະກິດ SME' },
    { ENG: 'Corporate', THA: 'องค์กร', CHI: '企业', JPN: '法人', KOR: '기업', BUR: 'ကော်ပိုရိတ်', KHM: 'សាជីវកម្ម', LAO: 'ອົງກອນ' },
    { ENG: 'Gamer', THA: 'เกมเมอร์', CHI: '游戏玩家', JPN: 'ゲーマー', KOR: '게이머', BUR: 'ဂိမ်းဘော်', KHM: 'ហ្គេមមឺរ', LAO: 'ນັກເກມ' },
    { ENG: 'Traveler', THA: 'นักเดินทาง', CHI: '旅行者', JPN: '旅行者', KOR: '여행자', BUR: 'ခရီးသွား', KHM: 'អ្នកធ្វើដំណើរ', LAO: 'ນັກທ່ອງທ່ຽວ' },
    { ENG: 'Digital Creator', THA: 'ครีเอเตอร์', CHI: '数字创作者', JPN: 'クリエイター', KOR: '크리에이터', BUR: 'ဒစ်ဂျစ်တယ် ဖန်တီးသူ', KHM: 'អ្នកបង្កើតឌីជីថល', LAO: 'ຄີເອເຕີດິຈິຕອນ' },
    // NEW ADDITIONS
    { ENG: 'Tourist', THA: 'นักท่องเที่ยว', CHI: '游客', JPN: '観光客', KOR: '관광객', BUR: 'ခရီးသွားဧည့်သည်', KHM: 'ទេសចរ', LAO: 'ນັກທ່ອງທ່ຽວ' },
    { ENG: 'Expat', THA: 'ชาวต่างชาติ', CHI: '外籍人士', JPN: '在住外国人', KOR: '외국인 거주자', BUR: 'နိုင်ငံခြားသား', KHM: 'ជនបរទេស', LAO: 'ຄົນຕ່າງປະເທດ' },
    { ENG: 'Freelancer', THA: 'ฟรีแลนซ์', CHI: '自由职业者', JPN: 'フリーランス', KOR: '프리랜서', BUR: 'လွတ်လပ်သောအလုပ်သမား', KHM: 'អ្នកធ្វើការដោយសេរី', LAO: 'ຟຣີແລນ' },
    { ENG: 'IoT Device', THA: 'อุปกรณ์ IoT', CHI: '物联网设备', JPN: 'IoTデバイス', KOR: 'IoT 기기', BUR: 'IoT စက်ပစ္စည်း', KHM: 'ឧបករណ៍ IoT', LAO: 'ອຸປະກອນ IoT' },
    { ENG: 'Content Creator', THA: 'ครีเอเตอร์คอนเทนต์', CHI: '内容创作者', JPN: 'コンテンツクリエイター', KOR: '콘텐츠 크리에이터', BUR: 'အကြောင်းအရာဖန်တီးသူ', KHM: 'អ្នកបង្កើតមាតិកា', LAO: 'ຜູ້ສ້າງເນື້ອຫາ' },
];

const BENEFITS: LangMap<string>[] = [
    { ENG: 'free YouTube Premium 3 months', THA: 'YouTube Premium ฟรี 3 เดือน', CHI: '免费YouTube Premium 3个月', JPN: 'YouTube Premium 3ヶ月無料', KOR: 'YouTube 프리미엄 3개월 무료', BUR: 'YouTube Premium ၃လအခမဲ့', KHM: 'YouTube Premium ឥតគិតថ្លៃ 3ខែ', LAO: 'YouTube Premium ຟຣີ 3 ເດືອນ' },
    { ENG: 'free cloud storage 100GB', THA: 'พื้นที่คลาวด์ 100GB ฟรี', CHI: '免费云存储100GB', JPN: 'クラウドストレージ100GB無料', KOR: '클라우드 저장공간 100GB 무료', BUR: 'cloud storage 100GB အခမဲ့', KHM: 'ទំហំផ្ទុកក្លោដ 100GB ឥតគិតថ្លៃ', LAO: 'ພື້ນທີ່ຄລາວດ໌ 100GB ຟຣີ' },
    { ENG: 'unlimited social media', THA: 'โซเชียลมีเดียไม่จำกัด', CHI: '社交媒体无限流量', JPN: 'SNS使い放題', KOR: '소셜미디어 무제한', BUR: 'social media အကန့်အသတ်မရှိ', KHM: 'បណ្តាញសង្គមគ្មានដែនកំណត់', LAO: 'ໂຊເຊຍມີເດຍບໍ່ຈຳກັດ' },
    { ENG: 'priority customer support', THA: 'บริการลูกค้าพิเศษ', CHI: '优先客户支持', JPN: '優先カスタマーサポート', KOR: '우선 고객 지원', BUR: 'ဦးစားပေး ဖောက်သည်ဝန်ဆောင်မှု', KHM: 'ការគាំទ្រអតិថិជនអាទិភាព', LAO: 'ການບໍລິການລູກຄ້າສຳຄັນ' },
    { ENG: 'family sharing up to 4 members', THA: 'แชร์ในครอบครัวได้ถึง 4 คน', CHI: '最多4人家庭共享', JPN: '最大4人までファミリーシェア', KOR: '최대 4인 가족 공유', BUR: 'မိသားစု ၄ဦးအထိ မျှဝေနိုင်', KHM: 'ចែករំលែកគ្រួសារដល់ 4នាក់', LAO: 'ແບ່ງປັນຄອບຄົວໄດ້ເຖິງ 4 ຄົນ' },
    { ENG: 'cashback 10 percent', THA: 'แคชแบ็ค 10 เปอร์เซ็นต์', CHI: '返现10%', JPN: 'キャッシュバック10%', KOR: '캐시백 10%', BUR: 'ငွေပြန်အမ်း ၁၀ရာခိုင်နှုန်း', KHM: 'សងប្រាក់វិញ 10ភាគរយ', LAO: 'ເງິນຄືນ 10 ເປີເຊັນ' },
    // NEW ADDITIONS
    { ENG: 'free Netflix 1 month', THA: 'Netflix ฟรี 1 เดือน', CHI: '免费Netflix 1个月', JPN: 'Netflix 1ヶ月無料', KOR: 'Netflix 1개월 무료', BUR: 'Netflix ၁လအခမဲ့', KHM: 'Netflix ឥតគិតថ្លៃ 1ខែ', LAO: 'Netflix ຟຣີ 1 ເດືອນ' },
    { ENG: 'free Spotify Premium', THA: 'Spotify Premium ฟรี', CHI: '免费Spotify Premium', JPN: 'Spotify Premium無料', KOR: 'Spotify Premium 무료', BUR: 'Spotify Premium အခမဲ့', KHM: 'Spotify Premium ឥតគិតថ្លៃ', LAO: 'Spotify Premium ຟຣີ' },
    { ENG: '5GB international roaming data', THA: 'ข้อมูลโร밍ต่างประเทศ 5GB', CHI: '5GB国际漫游流量', JPN: '国際ローミングデータ5GB', KOR: '국제 로밍 데이터 5GB', BUR: 'နိုင်ငံတကာ ရိုမင်း ဒေတာ 5GB', KHM: 'ទិន្នន័យរ៉ូមីងអន្តរជាតិ 5GB', LAO: 'ຂໍ້ມູນໂຣມິ່ງສາກົນ 5GB' },
    { ENG: 'device screen insurance', THA: 'ประกันหน้าจออุปกรณ์', CHI: '设备屏幕保险', JPN: 'デバイス画面保険', KOR: '기기 화면 보험', BUR: 'စက်ပစ္စည်း မျက်နှာပြင် အာမခံ', KHM: 'ការធានាអេក្រង់ឧបករណ៍', LAO: 'ປະກັນໜ້າຈໍອຸປະກອນ' },
    { ENG: 'double data on weekends', THA: 'เน็ตดับเบิ้ลในวันหยุดสุดสัปดาห์', CHI: '周末双倍流量', JPN: '週末データ2倍', KOR: '주말 데이터 2배', BUR: 'စနေတနင်္ဂနွေ ဒေတာနှစ်ဆ', KHM: 'ទិន្នន័យទ្វេដងនៅថ្ងៃចុងសប្តាហ៍', LAO: 'ຂໍ້ມູນເປັນສອງເທົ່າໃນວັນພັກ' },
];

const PRICE_TYPE_LABELS: Record<string, LangMap> = {
    onetime: { ENG: 'OneTime', THA: 'ชำระครั้งเดียว', CHI: '一次性付费', JPN: '一回払い', KOR: '일회성 결제', BUR: 'တစ်ကြိမ်ငွေချေ', KHM: 'បង់ម្តង', LAO: 'ຈ່າຍເທື່ອດຽວ' },
    recurring: { ENG: 'Recurring', THA: 'รายเดือน', CHI: '按月订阅', JPN: '月額', KOR: '월정액', BUR: 'လစဉ်', KHM: 'ប្រចាំខែ', LAO: 'ລາຍເດືອນ' },
    usage: { ENG: 'UsageBased', THA: 'ตามการใช้งาน', CHI: '按用量计费', JPN: '従量制', KOR: '사용량 기반', BUR: 'အသုံးပြုမှုအပေါ်မူတည်', KHM: 'អាស្រ័យលើការប្រើប្រាស់', LAO: 'ອີງຕາມການໃຊ້ງານ' },
};

const NETWORK_TYPES = ['4G LTE', '5G', '5G Advanced', '4G/5G'];
const DATA_AMOUNTS = ['1GB', '2GB', '3GB', '5GB', '10GB', '15GB', '20GB', '30GB', '50GB', '70GB', '100GB', '150GB', '200GB', '300GB', 'Unlimited'];
const SPEEDS = ['4 Mbps', '10 Mbps', '15 Mbps', '20 Mbps', '30 Mbps', '50 Mbps', '100 Mbps', '200 Mbps', '300 Mbps', '500 Mbps', '1 Gbps', 'Max Speed'];
const DURATIONS = [1, 3, 7, 15, 30, 60, 90, 180, 365];
const CONTRACT_MONTHS_LIST = [1, 3, 6, 12, 18, 24, 36];

const UNIT_WORDS = {
    recurring: { ENG: 'month', THA: 'เดือน', CHI: '月', JPN: 'ヶ月', KOR: '개월', BUR: 'လ', KHM: 'ខែ', LAO: 'ເດືອນ' } as LangMap,
    onetime: { ENG: 'time', THA: 'ครั้ง', CHI: '次', JPN: '回', KOR: '회', BUR: 'ကြိမ်', KHM: 'ដង', LAO: 'ເທື່ອ' } as LangMap,
};

// ─── Discount Name Templates (per language, {p} = project name) ──
const DISCOUNT_NAME_TEMPLATES: LangMap<string[]> = {
    ENG: ['{p} New Member Discount', '{p} Loyalty Reward', '{p} Activation Saving', '{p} Bundle Saving', '{p} Early Bird Special', '{p} Family Pack Discount',
        '{p} Student Special', '{p} App Exclusive', '{p} Birthday Treat', '{p} Upgrade Bonus'],
    THA: ['ส่วนลดสมาชิกใหม่ {p}', 'รางวัลความภักดี {p}', 'ส่วนลดเปิดใช้งาน {p}', 'ประหยัดจากบันเดิล {p}', 'สมัครเร็ว {p}', 'แพ็กครอบครัว {p}',
        'พิเศษสำหรับนักศึกษา {p}', 'พิเศษเฉพาะแอป {p}', 'ของขวัญวันเกิด {p}', 'โบนัสอัปเกรด {p}'],
    CHI: ['{p} 新会员折扣', '{p} 忠诚奖励', '{p} 开通优惠', '{p} 组合优惠', '{p} 早鸟优惠', '{p} 家庭套餐折扣',
        '{p} 学生特惠', '{p} App专属', '{p} 生日礼遇', '{p} 升级奖励'],
    JPN: ['{p} 新規会員割引', '{p} ロイヤルティ特典', '{p} 開通割引', '{p} バンドル割引', '{p} 早期割引', '{p} ファミリーパック割引',
        '{p} 学生スペシャル', '{p} アプリ限定', '{p} バースデートリート', '{p} アップグレードボーナス'],
    KOR: ['{p} 신규회원 할인', '{p} 로열티 리워드', '{p} 개통 할인', '{p} 번들 할인', '{p} 얼리버드 특가', '{p} 패밀리팩 할인',
        '{p} 학생 특별 할인', '{p} 앱 독점', '{p} 생일 선물', '{p} 업그레이드 보너스'],
    BUR: ['{p} အသင်းဝင်သစ် လျှော့ဈေး', '{p} သစ္စာရှိမှု ဆု', '{p} အသုံးပြုစတင် လျှော့ဈေး', '{p} ဘန်းဒယ် ချွေတာမှု', '{p} စောစီးစွာ အထူး', '{p} မိသားစု လျှော့ဈေး',
        '{p} ကျောင်းသား အထူး', '{p} အက်ပ် သီးသန့်', '{p} မွေးနေ့ လက်ဆောင်', '{p} အဆင့်မြှင့်တင်မှု ဘောနပ်စ်'],
    KHM: ['{p} បញ្ចុះតម្លៃសមាជិកថ្មី', 'រង្វាន់ភក្តីភាព {p}', 'បញ្ចុះតម្លៃដំណើរការ {p}', 'សន្សំបានពីកញ្ចប់ {p}', 'ពិសេសមកមុន {p}', 'បញ្ចុះតម្លៃកញ្ចប់គ្រួសារ {p}',
        '{p} ពិសេសសម្រាប់និស្សិត', '{p} ផ្តាច់មុខលើកម្មវិធី', '{p} អំណោយថ្ងៃខួបកំណើត', '{p} ប្រាក់រង្វាន់អាប់ហ្គ្រេដ'],
    LAO: ['ສ່ວນຫຼຸດສະມາຊິກໃໝ່ {p}', 'ລາງວັນຄວາມພັກດີ {p}', 'ສ່ວນຫຼຸດເປີດໃຊ້ {p}', 'ປະຫຍັດຈາກຊຸດ {p}', 'ພິເສດມາກ່ອນ {p}', 'ສ່ວນຫຼຸດແພັກຄອບຄົວ {p}',
        '{p} ພິເສດສຳລັບນັກສຶກສາ', '{p} ພິເສດສະເພາະແອັບ', '{p} ຂອງຂວັນວັນເກີດ', '{p} ໂບນັດອັບເກຣດ'],
};

// ─── SMS Wording Templates ──────
const SMS_TEMPLATES = {
    shortPromotionName: {
        ENG: ['{pkg} {data} {speed}', '{pkg} {data}', '{pkg} {network} {data}', 'Special {pkg} {data}', 'New {pkg} {data} {speed}'],
        THA: ['{pkg} {data} {speed}', '{pkg} เน็ต {data}', '{pkg} {network} {data}', '{pkg} พิเศษ {data}', '{pkg} ใหม่ {data} {speed}'],
        CHI: ['{pkg} {data} {speed}', '{pkg} 流量{data}', '{pkg} {network} {data}', '特别 {pkg} {data}', '全新 {pkg} {data} {speed}'],
        JPN: ['{pkg} {data} {speed}', '{pkg} データ{data}', '{pkg} {network} {data}', '特別 {pkg} {data}', '新 {pkg} {data} {speed}'],
        KOR: ['{pkg} {data} {speed}', '{pkg} 데이터 {data}', '{pkg} {network} {data}', '스페셜 {pkg} {data}', '신규 {pkg} {data} {speed}'],
        BUR: ['{pkg} {data} {speed}', '{pkg} ဒေတာ {data}', '{pkg} {network} {data}', 'အထူး {pkg} {data}', 'အသစ် {pkg} {data} {speed}'],
        KHM: ['{pkg} {data} {speed}', '{pkg} ទិន្នន័យ {data}', '{pkg} {network} {data}', 'ពិសេស {pkg} {data}', 'ថ្មី {pkg} {data} {speed}'],
        LAO: ['{pkg} {data} {speed}', '{pkg} ອິນເຕີເນັດ {data}', '{pkg} {network} {data}', '{pkg} ພິເສດ {data}', '{pkg} ໃໝ່ {data} {speed}'],
    } as LangMap<string[]>,
    cmsDisplay: {
        ENG: ['{pkg} {data} data at {speed}. Valid {validity} days.', '{pkg} {data} {network} data. {price} THB/{unit}.', 'Get {pkg}{data} at {speed} for {price} THB/{unit}.'],
        THA: ['{pkg} เน็ต {data} ความเร็ว {speed} ใช้ได้ {validity} วัน', '{pkg} เน็ต {network} {data} ราคา {price} บาท/{unit}', 'รับ {pkg} เน็ต {data} ความเร็ว {speed} ราคา {price} บาท/{unit}'],
        CHI: ['{pkg} {data}流量，速度{speed}，有效期{validity}天。', '{pkg} {network} {data}流量。{price}泰铢/{unit}。', '获取{pkg}{data}流量，速度{speed}，仅需{price}泰铢/{unit}。'],
        JPN: ['{pkg} {data}データ、速度{speed}。{validity}日間有効。', '{pkg} {network} {data}データ。{price}THB/{unit}。', '{pkg}を取得：{data}データ（速度{speed}）、{price}THB/{unit}。'],
        KOR: ['{pkg} {data} 데이터, 속도 {speed}. {validity}일 유효.', '{pkg} {network} {data} 데이터. {price} THB/{unit}.', '{pkg} 가입: {data} 데이터, 속도 {speed}, {price} THB/{unit}.'],
        BUR: ['{pkg} ဒေတာ {data} အမြန်နှုန်း {speed}။ {validity}ရက် အသုံးပြုနိုင်သည်။', '{pkg} {network} ဒေတာ {data}။ {price} THB/{unit}။', '{pkg} ရယူပါ: {data} ဒေတာ {speed}၊ {price} THB/{unit}။'],
        KHM: ['{pkg} ទិន្នន័យ {data} ល្បឿន {speed}។ សុពលភាព {validity}ថ្ងៃ។', '{pkg} {network} ទិន្នន័យ {data}។ {price} THB/{unit}។', 'ទទួលបាន {pkg}: ទិន្នន័យ {data} ល្បឿន {speed} តម្លៃ {price} THB/{unit}។'],
        LAO: ['{pkg} ອິນເຕີເນັດ {data} ຄວາມໄວ {speed}. ໃຊ້ໄດ້ {validity} ວັນ.', '{pkg} {network} {data}. {price} THB/{unit}.', 'ຮັບ {pkg}: ອິນເຕີເນັດ {data} ຄວາມໄວ {speed} ລາຄາ {price} THB/{unit}.'],
    } as LangMap<string[]>,
    promotionDescription: {
        ENG: [
            'Apply for {pkg} and receive {data} highspeed data at up to {speed} on {network}. Valid for {validity} days. Price {price} THB ({unit}). Cannot be combined with other promotions.',
            '{pkg} package includes {data} data at {speed} speed. Unlimited calls within network. Price {price} THB per {unit}. Contract {contract} months.',
            'Upgrade to {pkg} today! Enjoy {data} of highspeed internet at {speed} on the {network} network. Only {price} THB/{unit}. TandC apply.',
            'Get the ultimate {pkg} experience: {data} data, {speed} speed, and {benefit}. Valid for {validity} days. Subscribe now for {price} THB.'
        ],
        THA: [
            'สมัคร {pkg} รับเน็ตความเร็วสูง {data} ความเร็วสูงสุด {speed} บนเครือข่าย {network} ใช้ได้ {validity} วัน ราคา {price} บาท ({unit}) ไม่ร่วมกับโปรโมชันอื่น',
            'แพ็กเกจ {pkg} รวมเน็ต {data} ความเร็ว {speed} โทรฟรีในเครือข่าย ราคา {price} บาทต่อ{unit} สัญญา {contract} เดือน',
            'อัปเกรดเป็น {pkg} วันนี้! เพลิดเพลินกับเน็ตความเร็วสูง {data} ที่ความเร็ว {speed} บนเครือข่าย {network} เพียง {price} บาท/{unit} เป็นไปตามเงื่อนไข',
            'สัมผัสประสบการณ์ {pkg} ที่เหนือกว่า: เน็ต {data} ความเร็ว {speed} และ {benefit} ใช้ได้ {validity} วัน สมัครเลยในราคา {price} บาท'
        ],
        CHI: [
            '申请{pkg}即可获得{data}高速流量，{network}网络下最高速度{speed}。有效期{validity}天。价格{price}泰铢（{unit}）。不可与其他优惠同时使用。',
            '{pkg}套餐包含{data}流量，速度{speed}。网内通话免费。价格{price}泰铢/{unit}。合约{contract}个月。',
            '今天升级至{pkg}！在{network}网络上享受{speed}的{data}高速流量。仅需{price}泰铢/{unit}。受条款约束。',
            '获得终极{pkg}体验：{data}流量，{speed}速度，以及{benefit}。有效期{validity}天。立即订阅，仅需{price}泰铢。'
        ],
        JPN: [
            '{pkg}に申し込むと{data}の高速データが利用可能（{network}で最大{speed}）。有効期間{validity}日。料金{price}THB{unit}）。他のプロモーションとの併用不可。',
            '{pkg}パッケージには{data}のデータ（速度{speed}）が含まれます。網内通話無料。料金{price}THB/{unit}。契約{contract}ヶ月。',
            '今日{pkg}にアップグレード！{network}ネットワークで{speed}の{data}高速データをお楽しみください。わずか{price}THB/{unit}。利用規約が適用されます。',
            '究極の{pkg}体験を得る：{data}データ、{speed}速度、そして{benefit}。有効期間{validity}日。今すぐ{price}THBで購読。'
        ],
        KOR: [
            '{pkg}에 가입하시면 {network}에서 최대 {speed} 속도로 {data} 고속 데이터를 받으실 수 있습니다. {validity}일간 유효. 가격 {price} THB({unit}). 다른 프로모션과 중복 불가.',
            '{pkg} 패키지에는 {speed} 속도의 {data} 데이터가 포함됩니다. 망내 무료통화. 가격 {price} THB/{unit}. 계약 {contract}개월.',
            '오늘 {pkg}로 업그레이드하세요! {network} 네트워크에서 {speed} 속도의 {data} 고속 데이터를 즐기세요. 단 {price} THB/{unit}. 약관이 적용됩니다.',
            '궁극의 {pkg} 경험을 얻으세요: {data} 데이터, {speed} 속도, 그리고 {benefit}. {validity}일 유효. 지금 {price} THB로 구독하세요.'
        ],
        BUR: [
            '{pkg} ကို လျှောက်ထားပြီး {network} ပေါ်တွင် {speed} အထိ {data} အမြန်နှုန်းမြင့် ဒေတာ ရယူပါ။ {validity}ရက် သက်တမ်းရှိသည်။ ဈေးနှုန်း {price} THB ({unit})။ အခြားပရိုမိုးရှင်းများနှင့် ပေါင်းစပ်၍မရပါ။',
            '{pkg} ပက်ကေ့ဂျ်တွင် {speed} အမြန်နှုန်းဖြင့် {data} ဒေတာ ပါဝင်သည်။ ကွန်ရက်တွင်း ဖုန်းအခမဲ့။ ဈေးနှုန်း {price} THB/{unit}။ စာချုပ် {contract}လ။',
            'ယနေ့ {pkg} သို့ အဆင့်မြှင့်တင်ပါ! {network} ကွန်ရက်ပေါ်တွင် {speed} ဖြင့် {data} အမြန်နှုန်းမြင့် အင်တာနက်ကို ခံစားပါ။ {price} THB/{unit} သာ။ စည်းကမ်းသတ်မှတ်ချက်များ ကျင့်သုံးသည်။',
            '{pkg} ၏ အကောင်းဆုံးအတွေ့အကြုံကို ရယူပါ {data} ဒေတာ၊ {speed} အမြန်နှုန်း နှင့် {benefit}။ {validity}ရက် သက်တမ်းရှိသည်။ ယခုပင် {price} THB ဖြင့် စာရင်းသွင်းပါ။'
        ],
        KHM: [
            'ដាក់ពាក្យសុំ {pkg} ដើម្បីទទួលបានទិន្នន័យល្បឿនលឿន {data} រហូតដល់ {speed} លើបណ្តាញ {network}។ សុពលភាព {validity}ថ្ងៃ។ តម្លៃ {price} THB ({unit})។ មិនអាចរួមបញ្ចូលជាមួយប្រម៉ូសិនផ្សេងទៀតបានទេ។',
            'កញ្ចប់ {pkg} រួមមានទិន្នន័យ {data} ល្បឿន {speed}។ ហៅទូរស័ព្ទក្នុងបណ្តាញឥតគិតថ្លៃ។ តម្លៃ {price} THB/{unit}។ កិច្ចសន្យា {contract}ខែ។',
            'អាប់ហ្គ្រេដទៅ {pkg} ថ្ងៃនេះ! រីករាយជាមួយអ៊ីនធឺណិតល្បឿនលឿន {data} នៅល្បឿន {speed} លើបណ្តាញ {network}។ គ្រាន់តែ {price} THB/{unit}។ លក្ខខណ្ឌអនុវត្ត។',
            'ទទួលបានបទពិសោធន៍ {pkg} ដ៏អស្ចារ្យ៖ ទិន្នន័យ {data} ល្បឿន {speed} និង {benefit}។ សុពលភាព {validity}ថ្ងៃ។ ជាវឥឡូវនេះក្នុងតម្លៃ {price} THB។'
        ],
        LAO: [
            'ສະໝັກ {pkg} ຮັບອິນເຕີເນັດຄວາມໄວສູງ {data} ໄວເຖິງ {speed} ເທິງເຄືອຂ່າຍ {network}. ໃຊ້ໄດ້ {validity} ວັນ. ລາຄາ {price} THB ({unit}). ບໍ່ສາມາດໃຊ້ຮ່ວມກັບໂປຣໂມຊັນອື່ນ.',
            'ແພັກເກັດ {pkg} ລວມອິນເຕີເນັດ {data} ຄວາມໄວ {speed}. ໂທຟຣີໃນເຄືອຂ່າຍ. ລາຄາ {price} THB/{unit}. ສັນຍາ {contract} ເດືອນ.',
            'ອັບເກຣດເປັນ {pkg} ມື້ນີ້! ມ່ວນຊື່ນກັບອິນເຕີເນັດຄວາມໄວສູງ {data} ທີ່ຄວາມໄວ {speed} ເທິງເຄືອຂ່າຍ {network}. ພຽງ {price} THB/{unit}. ເປັນໄປຕາມເງື່ອນໄຂ.',
            'ສຳຜັດປະສົບການ {pkg} ທີ່ດີເລີດ: ອິນເຕີເນັດ {data} ຄວາມໄວ {speed} ແລະ {benefit}. ໃຊ້ໄດ້ {validity} ວັນ. ສະໝັກດຽວນີ້ໃນລາຄາ {price} THB.'
        ],
    } as LangMap<string[]>,
    smsGreeting: {
        ENG: ['Welcome to {pkg}. Your package is now active. Enjoy {data} data at {speed}.', 'Thank you for subscribing to {pkg}. {data} data at {speed} ready. Valid until {endDate}.', 'Activation successful! {pkg} is ready with {data} data at {speed}.'],
        THA: ['ยินดีต้อนรับสู่ {pkg} แพ็กเกจเปิดใช้งานแล้ว เพลิดเพลินกับเน็ต {data} ความเร็ว {speed}', 'ขอบคุณที่สมัคร {pkg} เน็ต {data} ความเร็ว {speed} พร้อมใช้ ใช้ได้ถึง {endDate}', 'เปิดใช้งานสำเร็จ! {pkg} พร้อมเน็ต {data} ความเร็ว {speed} แล้ว'],
        CHI: ['欢迎使用{pkg}。您的套餐已生效。享受{data}流量，速度{speed}。', '感谢您订阅{pkg}。{data}流量（{speed}）已就绪，有效期至{endDate}。', '激活成功！{pkg}已就绪，包含{data}流量，速度{speed}。'],
        JPN: ['{pkg}へようこそ。パッケージが有効になりました。{speed}で{data}のデータをお楽しみください。', '{pkg}のご契約ありがとうございます。{data}データ（{speed}）準備完了。{endDate}まで有効。', 'アクティベーション成功！{pkg}は{speed}で{data}のデータで準備完了です。'],
        KOR: ['{pkg}에 오신 것을 환영합니다. 패키지가 활성화되었습니다. {speed} 속도로 {data} 데이터를 이용하세요.', '{pkg} 가입해 주셔서 감사합니다. {data} 데이터({speed}) 준비 완료. {endDate}까지 유효.', '활성화 성공! {pkg}가 {speed} 속도의 {data} 데이터로 준비되었습니다.'],
        BUR: ['{pkg} မှ ကြိုဆိုပါသည်။ သင့်ပက်ကေ့ဂျ် အသက်ဝင်ပါပြီ။ {speed} ဖြင့် {data} ဒေတာကို ခံစားပါ။', '{pkg} ကို စာရင်းသွင်းပေးသည့်အတွက် ကျေးဇူးတင်ပါသည်။ {data} ဒေတာ ({speed}) အသင့်ဖြစ်ပါပြီ။ {endDate} အထိ သက်တမ်းရှိသည်။', 'အသက်သွင်းမှု အောင်မြင်ပါသည်! {pkg} သည် {speed} ဖြင့် {data} ဒေတာဖြင့် အသင့်ဖြစ်ပါပြီ။'],
        KHM: ['សូមស្វាគមន៍មកកាន់ {pkg}។ កញ្ចប់របស់អ្នកបានដំណើរការហើយ។ រីករាយជាមួយទិន្នន័យ {data} ល្បឿន {speed}។', 'អរគុណសម្រាប់ការជាវ {pkg}។ ទិន្នន័យ {data} ({speed}) រួចរាល់ហើយ។ សុពលភាពដល់ {endDate}។', 'ការធ្វើឱ្យសកម្មជោគជ័យ! {pkg} រួចរាល់ជាមួយទិន្នន័យ {data} ល្បឿន {speed}។'],
        LAO: ['ຍິນດີຕ້ອນຮັບສູ່ {pkg}. ແພັກເກັດຂອງທ່ານເປີດໃຊ້ແລ້ວ. ມ່ວນຊື່ນກັບອິນເຕີເນັດ {data} ຄວາມໄວ {speed}.', 'ຂອບໃຈທີ່ສະໝັກ {pkg}. ອິນເຕີເນັດ {data} ({speed}) ພ້ອມໃຊ້ແລ້ວ. ໃຊ້ໄດ້ເຖິງ {endDate}.', 'ເປີດໃຊ້ງານສຳເລັດ! {pkg} ພ້ອມແລ້ວດ້ວຍອິນເຕີເນັດ {data} ຄວາມໄວ {speed}.'],
    } as LangMap<string[]>,
    smsDelete: {
        ENG: ['Your {pkg} package has been cancelled. Thank you for using our service.', '{pkg} has been removed from your number. Remaining benefits expire on {endDate}.', 'Cancellation confirmed: {pkg} is no longer active. Thank you.'],
        THA: ['แพ็กเกจ {pkg} ของคุณถูกยกเลิกแล้ว ขอบคุณที่ใช้บริการ', '{pkg} ถูกลบออกจากเบอร์คุณแล้ว สิทธิคงเหลือจะหมดอายุ {endDate}', 'ยืนยันการยกเลิก: {pkg} ไม่สามารถใช้งานได้แล้ว ขอบคุณครับ'],
        CHI: ['您的{pkg}套餐已取消。感谢您的使用。', '{pkg}已从您的号码中移除。剩余权益将于{endDate}到期。', '取消确认：{pkg}已失效。感谢您的使用。'],
        JPN: ['{pkg}パッケージはキャンセルされました。ご利用ありがとうございました。', '{pkg}は解除されました。残りの特典は{endDate}に失効します。', 'キャンセル確認：{pkg}は有効ではなくなりました。ご利用ありがとうございました。'],
        KOR: ['{pkg} 패키지가 취소되었습니다. 이용해 주셔서 감사합니다.', '{pkg}가 번호에서 제거되었습니다. 남은 혜택은 {endDate}에 만료됩니다.', '취소 확인됨: {pkg}가 더 이상 활성화되지 않습니다. 감사합니다.'],
        BUR: ['သင်၏ {pkg} ပက်ကေ့ဂျ်ကို ပယ်ဖျက်ပြီးပါပြီ။ ဝန်ဆောင်မှုအသုံးပြုသည့်အတွက် ကျေးဇူးတင်ပါသည်။', '{pkg} ကို သင့်နံပါတ်မှ ဖယ်ရှားလိုက်ပါပြီ။ ကျန်ရှိနေသော အကျိုးခံစားခွင့်များသည် {endDate} တွင် သက်တမ်းကုန်ဆုံးမည်။', 'ပယ်ဖျက်မှု အတည်ပြုပြီး: {pkg} သည် အသက်မဝင်တော့ပါ။ ကျေးဇူးတင်ပါသည်။'],
        KHM: ['កញ្ចប់ {pkg} របស់អ្នកត្រូវបានលុបចោលហើយ។ អរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្មរបស់យើង។', '{pkg} ត្រូវបានលុបចេញពីលេខរបស់អ្នកហើយ។ អត្ថប្រយោជន៍នៅសល់នឹងផុតកំណត់នៅ {endDate}។', 'បានបញ្ជាក់ការលុបចោល: {pkg} លែងសកម្មទៀតហើយ។ អរគុណ។'],
        LAO: ['ແພັກເກັດ {pkg} ຂອງທ່ານຖືກຍົກເລີກແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.', '{pkg} ຖືກລຶບອອກຈາກເບີຂອງທ່ານແລ້ວ. ສິດປະໂຫຍດທີ່ເຫຼືອຈະໝົດອາຍຸ {endDate}.', 'ຢືນຢັນການຍົກເລີກ: {pkg} ບໍ່ສາມາດໃຊ້ງານໄດ້ອີກຕໍ່ໄປ. ຂອບໃຈ.'],
    } as LangMap<string[]>,
    lastMinuteAlert: {
        ENG: ['Your {pkg} data quota is almost used up. Only {remaining} remaining.', 'Alert: {pkg} quota nearly depleted. {remaining} left.', 'Urgent: Your {pkg} data is running low. Only {remaining} left. Top up now to stay connected.', 'Heads up! {pkg} quota is almost gone ({remaining} left). Avoid extra charges by topping up.'],
        THA: ['เน็ต {pkg} ของคุณใกล้หมดแล้ว เหลือเพียง {remaining}', 'แจ้งเตือน: โควต้า {pkg} ใกล้หมด เหลือ {remaining}', 'ด่วน: เน็ต {pkg} ของคุณใกล้หมดแล้ว เหลือเพียง {remaining} เติมเงินเดี๋ยวนี้เพื่อเชื่อมต่อไม่สะดุด', 'แจ้งเตือน! โควต้า {pkg} ใกล้หมดแล้ว (เหลือ {remaining}) หลีกเลี่ยงค่าใช้จ่ายเพิ่มเติมโดยการเติมเงิน'],
        CHI: ['您的{pkg}流量即将用完。仅剩{remaining}。', '提醒：{pkg}额度即将耗尽，剩余{remaining}。', '紧急：您的{pkg}流量不足。仅剩{remaining}。立即充值以保持连接。', '注意！{pkg}额度即将耗尽（剩余{remaining}）。请充值以避免额外费用。'],
        JPN: ['{pkg}のデータがまもなく使い切りです。残り{remaining}。', '注意：{pkg}の残量が少なくなっています。残り{remaining}。', '緊急：{pkg}のデータが残りわずかです。{remaining}のみ残っています。接続を維持するために今すぐチャージしてください。', '注意！{pkg}の残量がもうすぐなくなります（残り{remaining}）。追加料金を避けるためにチャージしてください。'],
        KOR: ['{pkg} 데이터가 거의 소진되었습니다. {remaining} 남음.', '알림: {pkg} 데이터가 거의 소진되었습니다. {remaining} 남음.', '긴급: {pkg} 데이터가 부족합니다. {remaining}만 남았습니다. 연결을 유지하려면 지금 충전하세요.', '주의! {pkg} 데이터가 거의 소진되었습니다 ({remaining} 남음). 추가 요금을 피하려면 충전하세요.'],
        BUR: ['သင်၏ {pkg} ဒေတာ ကုန်ခန်းတော့မည်။ {remaining} သာ ကျန်ပါသည်။', 'သတိပေးချက်: {pkg} ကုန်ခန်းတော့မည်။ {remaining} ကျန်ပါသည်။', 'အရေးပေါ်- သင်၏ {pkg} ဒေတာ နည်းပါးနေပါပြီ။ {remaining} သာ ကျန်ပါသည်။ ချိတ်ဆက်မှုမပြတ်စေရန် ယခုပင် ဖြည့်ပါ။', 'သတိပေးချက်! {pkg} ကုန်ခန်းတော့မည် ({remaining} သာ ကျန်)။ ပိုမိုကျသင့်ငွေကို ရှောင်ရှားရန် ဖြည့်ပါ။'],
        KHM: ['ទិន្នន័យ {pkg} របស់អ្នកជិតអស់ហើយ។ នៅសល់តែ {remaining}។', 'ការជូនដំណឹង៖ កូតា {pkg} ជិតអស់។ នៅសល់ {remaining}។', 'បន្ទាន់៖ ទិន្នន័យ {pkg} របស់អ្នកជិតអស់ហើយ។ នៅសល់តែ {remaining}។ សូមបញ្ចូលទឹកប្រាក់ឥឡូវនេះដើម្បីរក្សាការតភ្ជាប់។', 'ប្រយ័ត្ន! កូតា {pkg} ជិតអស់ហើយ (នៅសល់ {remaining})។ ជៀសវាងថ្លៃសេវាបន្ថែមដោយការបញ្ចូលទឹកប្រាក់។'],
        LAO: ['ອິນເຕີເນັດ {pkg} ຂອງທ່ານໃກ້ໝົດແລ້ວ. ເຫຼືອພຽງ {remaining}.', 'ແຈ້ງເຕືອນ: ໂຄຕ້າ {pkg} ໃກ້ໝົດ. ເຫຼືອ {remaining}.', 'ດ່ວນ: ອິນເຕີເນັດ {pkg} ຂອງທ່ານໃກ້ໝົດແລ້ວ. ເຫຼືອພຽງ {remaining}. ເຕີມເງິນດຽວນີ້ເພື່ອຮັກສາການເຊື່ອມຕໍ່.', 'ແຈ້ງເຕືອນ! ໂຄຕ້າ {pkg} ໃກ້ໝົດແລ້ວ (ເຫຼືອ {remaining}). ຫຼີກເວັ້ນຄ່າໃຊ້ຈ່າຍເພີ່ມເຕີມໂດຍການເຕີມເງິນ.'],
    } as LangMap<string[]>,
    beforeFeeDeduction: {
        ENG: ['Reminder: {pkg} fee of {price} THB will be deducted on {deductDate}.', 'Your {pkg} will auto-renew on {deductDate} for {price} THB.', 'Upcoming charge: {price} THB for {pkg} on {deductDate}. Ensure sufficient balance.'],
        THA: ['แจ้งเตือน: ค่าบริการ {pkg} จำนวน {price} บาท จะถูกหัก {deductDate}', '{pkg} ของคุณจะต่ออายุอัตโนมัติ {deductDate} จำนวน {price} บาท', 'เตรียมหักเงิน: ค่าบริการ {pkg} จำนวน {price} บาท ในวันที่ {deductDate} กรุณาตรวจสอบยอดเงิน'],
        CHI: ['提醒：{pkg}费用{price}泰铢将于{deductDate}扣除。', '您的{pkg}将于{deductDate}自动续订，费用{price}泰铢。', '即将扣费：{deductDate}将扣除{pkg}费用{price}泰铢。请确保余额充足。'],
        JPN: ['お知らせ：{pkg}の料金{price}THBは{deductDate}に引き落とされます。', '{pkg}は{deductDate}に自動更新されます（{price}THB）。', 'まもなく引き落とし：{deductDate}に{pkg}の料金{price}THBが引き落とされます。残高をご確認ください。'],
        KOR: ['알림: {pkg} 요금 {price} THB가 {deductDate}에 차감됩니다.', '{pkg}는 {deductDate}에 {price} THB로 자동 갱신됩니다.', '예정된 요금 청구: {deductDate}에 {pkg} 요금 {price} THB가 차감됩니다. 잔액을 확인하세요.'],
        BUR: ['သတိပေးချက်: {pkg} ကြေး {price} THB ကို {deductDate} တွင် နုတ်ယူပါမည်။', 'သင်၏ {pkg} သည် {deductDate} တွင် {price} THB ဖြင့် အလိုအလျောက် သက်တမ်းတိုးပါမည်။', 'မကြာမီ ငွေထုတ်ယူမည်- {deductDate} တွင် {pkg} အတွက် {price} THB ကို နုတ်ယူပါမည်။ လက်ကျန်ငွေ လုံလောက်မှုရှိစေရန် သေချာပါစေ။'],
        KHM: ['ការរំលឹក៖ ថ្លៃសេវា {pkg} ចំនួន {price} THB នឹងត្រូវកាត់នៅ {deductDate}។', '{pkg} របស់អ្នកនឹងបន្តដោយស្វ័យប្រវត្តិនៅ {deductDate} ក្នុងតម្លៃ {price} THB។', 'ការកាត់ប្រាក់ខាងមុខ៖ {price} THB សម្រាប់ {pkg} នៅ {deductDate}។ សូមធានាថាមានសមតុល្យគ្រប់គ្រាន់។'],
        LAO: ['ແຈ້ງເຕືອນ: ຄ່າບໍລິການ {pkg} ຈຳນວນ {price} THB ຈະຖືກຫັກ {deductDate}.', '{pkg} ຂອງທ່ານຈະຕໍ່ອາຍຸອັດຕະໂນມັດ {deductDate} ຈຳນວນ {price} THB.', 'ກຽມຫັກເງິນ: ຄ່າບໍລິການ {pkg} ຈຳນວນ {price} THB ໃນວັນທີ {deductDate}. ກະລຸນາກວດສອບຍອດເງິນ.'],
    } as LangMap<string[]>,
    recurringSuccess: {
        ENG: ['Success: {pkg} renewed. Payment {price} THB completed. {data} data added.', 'Your {pkg} has been auto-renewed. {data} data at {speed} refreshed.', 'Great news! Your {pkg} has been successfully renewed. {data} data at {speed} is now available. Balance deducted: {price} THB.', 'Renewal complete! {pkg} is active. Enjoy {data} data and {benefit} for the next {validity} days.'],
        THA: ['สำเร็จ: {pkg} ต่ออายุแล้ว ชำระ {price} บาท เน็ต {data} เพิ่มให้แล้ว', '{pkg} ต่ออายุอัตโนมัติสำเร็จ เน็ต {data} ความเร็ว {speed} รีเฟรชแล้ว', 'ข่าวดี! {pkg} ของคุณต่ออายุสำเร็จแล้ว เน็ต {data} ความเร็ว {speed} พร้อมใช้งาน ยอดหัก: {price} บาท', 'ต่ออายุสำเร็จ! {pkg} ใช้งานได้แล้ว เพลิดเพลินกับเน็ต {data} และ {benefit} ในอีก {validity} วันข้างหน้า'],
        CHI: ['成功：{pkg}已续订。付款{price}泰铢已完成。已增加{data}流量。', '您的{pkg}已自动续订。{data}流量（{speed}）已刷新。', '好消息！您的{pkg}已成功续订。{data}流量（{speed}）现已可用。已扣除余额：{price}泰铢。', '续订完成！{pkg}已激活。在接下来的{validity}天内享受{data}流量和{benefit}。'],
        JPN: ['成功：{pkg}が更新されました。{price}THBの支払いが完了しました。{data}データが追加されました。', '{pkg}は自動更新されました。{data}データ（{speed}）が更新されました。', '良いお知らせです！{pkg}の更新が正常に完了しました。{speed}の{data}データが現在利用可能です。引き落とし額：{price}THB。', '更新完了！{pkg}が有効になりました。次の{validity}日間、{data}データと{benefit}をお楽しみください。'],
        KOR: ['성공: {pkg} 갱신 완료. {price} THB 결제 완료. {data} 데이터 추가.', '{pkg}가 자동 갱신되었습니다. {data} 데이터({speed})가 새로 고침되었습니다.', '좋은 소식입니다! {pkg}가 성공적으로 갱신되었습니다. {speed} 속도의 {data} 데이터를 지금 이용할 수 있습니다. 차감된 금액: {price} THB.', '갱신 완료! {pkg}가 활성화되었습니다. 다음 {validity}일 동안 {data} 데이터와 {benefit}를 즐기세요.'],
        BUR: ['အောင်မြင်ပါသည်: {pkg} သက်တမ်းတိုးပြီးပါပြီ။ {price} THB ငွေပေးချေမှု ပြီးစီးပါပြီ။ {data} ဒေတာ ထပ်ပေါင်းထည့်ပြီးပါပြီ။', 'သင်၏ {pkg} အလိုအလျောက် သက်တမ်းတိုးပြီးပါပြီ။ {data} ဒေတာ ({speed}) ပြန်လည်ဖြည့်တင်းပြီးပါပြီ။', 'သတင်းကောင်း! သင်၏ {pkg} ကို အောင်မြင်စွာ သက်တမ်းတိုးပြီးပါပြီ။ {speed} ဖြင့် {data} ဒေတာကို ယခု အသုံးပြုနိုင်ပါပြီ။ နုတ်ယူသွားသော ငွေပမာဏ- {price} THB။', 'သက်တမ်းတိုးခြင်း ပြီးစီးပါပြီ! {pkg} အသက်ဝင်ပါပြီ။ ရှေ့လာမည့် {validity}ရက်အတွက် {data} ဒေတာ နှင့် {benefit} ကို ခံစားပါ။'],
        KHM: ['ជោគជ័យ៖ {pkg} បានបន្តហើយ។ ការទូទាត់ {price} THB បានបញ្ចប់។ បានបន្ថែមទិន្នន័យ {data}។', '{pkg} របស់អ្នកបានបន្តដោយស្វ័យប្រវត្តិ។ ទិន្នន័យ {data} ({speed}) ត្រូវបានធ្វើឱ្យស្រស់។', 'ដំណឹងល្អ! {pkg} របស់អ្នកត្រូវបានបន្តដោយជោគជ័យ។ ទិន្នន័យ {data} ល្បឿន {speed} ឥឡូវនេះអាចប្រើប្រាស់បាន។ ទឹកប្រាក់ដែលបានកាត់៖ {price} THB។', 'ការបន្តបានបញ្ចប់! {pkg} កំពុងដំណើរការ។ រីករាយជាមួយទិន្នន័យ {data} និង {benefit} សម្រាប់ {validity}ថ្ងៃខាងមុខ។'],
        LAO: ['ສຳເລັດ: {pkg} ຕໍ່ອາຍຸແລ້ວ. ຊຳລະ {price} THB ສຳເລັດ. ເພີ່ມອິນເຕີເນັດ {data}.', '{pkg} ຂອງທ່ານຕໍ່ອາຍຸອັດຕະໂນມັດແລ້ວ. ອິນເຕີເນັດ {data} ({speed}) ໄດ້ຮັບການຣີເຟຣຊແລ້ວ.', 'ຂ່າວດີ! {pkg} ຂອງທ່ານຕໍ່ອາຍຸສຳເລັດແລ້ວ. ອິນເຕີເນັດ {data} ຄວາມໄວ {speed} ພ້ອມໃຊ້ງານ. ຍອດຫັກ: {price} THB.', 'ຕໍ່ອາຍຸສຳເລັດ! {pkg} ເປີດໃຊ້ແລ້ວ. ມ່ວນຊື່ນກັບອິນເຕີເນັດ {data} ແລະ {benefit} ໃນອີກ {validity} ວັນຂ້າງໜ້າ.'],
    } as LangMap<string[]>,
    recurringFail: {
        ENG: ['Failed: {pkg} renewal unsuccessful due to insufficient balance. Top up {price} THB and retry.', 'Payment failed for {pkg}. Top up {price} THB to continue service.', 'Action required: {pkg} renewal failed due to low balance. Please top up {price} THB to avoid service interruption.', 'Payment alert: We could not process your {pkg} renewal. Add {price} THB to your account to reactivate.'],
        THA: ['ไม่สำเร็จ: ต่ออายุ {pkg} ไม่สำเร็จเนื่องจากยอดเงินไม่พอ กรุณาเติม {price} บาท', 'ชำระ {pkg} ไม่สำเร็จ ยอดเงินไม่พอ เติม {price} บาท เพื่อใช้บริการต่อ', 'ต้องดำเนินการ: ต่ออายุ {pkg} ไม่สำเร็จเนื่องจากยอดเงินไม่เพียงพอ กรุณาเติมเงิน {price} บาทเพื่อหลีกเลี่ยงการหยุดให้บริการ', 'แจ้งเตือนการชำระเงิน: เราไม่สามารถดำเนินการต่ออายุ {pkg} ของคุณได้ กรุณาเติมเงิน {price} บาทเพื่อเปิดใช้งานใหม่'],
        CHI: ['失败：由于余额不足，{pkg}续订未成功。请充值{price}泰铢后重试。', '{pkg}扣费失败。请充值{price}泰铢以继续使用服务。', '需要操作：由于余额不足，{pkg}续订失败。请充值{price}泰铢以避免服务中断。', '付款提醒：我们无法处理您的{pkg}续订。请向您的账户添加{price}泰铢以重新激活。'],
        JPN: ['失敗：残高不足のため{pkg}の更新に失敗しました。{price}THBをチャージして再試行してください。', '{pkg}の支払いに失敗しました。サービスを継続するには{price}THBをチャージしてください。', '対応が必要です：残高不足のため{pkg}の更新に失敗しました。サービス中断を避けるために{price}THBをチャージしてください。', '支払いアラート：{pkg}の更新を処理できませんでした。再有効化するためにアカウントに{price}THBを追加してください。'],
        KOR: ['실패: 잔액 부족으로 {pkg} 갱신에 실패했습니다. {price} THB를 충전 후 다시 시도하세요.', '{pkg} 결제에 실패했습니다. 서비스를 계속하려면 {price} THB를 충전하세요.', '조치 필요: 잔액 부족으로 {pkg} 갱신에 실패했습니다. 서비스 중단을 피하려면 {price} THB를 충전하세요.', '결제 알림: {pkg} 갱신을 처리할 수 없습니다. 다시 활성화하려면 계정에 {price} THB를 추가하세요.'],
        BUR: ['မအောင်မြင်ပါ: လက်ကျန်ငွေ မလုံလောက်၍ {pkg} သက်တမ်းတိုးခြင်း မအောင်မြင်ပါ။ {price} THB ဖြည့်ပြီး ပြန်လည်ကြိုးစားပါ။', '{pkg} ငွေပေးချေမှု မအောင်မြင်ပါ။ ဝန်ဆောင်မှု ဆက်လက်အသုံးပြုရန် {price} THB ဖြည့်ပါ။', 'လုပ်ဆောင်ရန်လိုအပ်သည်- လက်ကျန်ငွေနည်းပါးသောကြောင့် {pkg} သက်တမ်းတိုးခြင်း မအောင်မြင်ပါ။ ဝန်ဆောင်မှုရပ်ဆိုင်းမှုကို ရှောင်ရှားရန် {price} THB ဖြည့်ပါ။', 'ငွေပေးချေမှု သတိပေးချက်- သင်၏ {pkg} သက်တမ်းတိုးခြင်းကို ကျွန်ုပ်တို့ ဆောင်ရွက်နိုင်ခြင်း မရှိပါ။ ပြန်လည်အသက်သွင်းရန် သင့်အကောင့်သို့ {price} THB ထည့်ပါ။'],
        KHM: ['បរាជ័យ៖ ការបន្ត {pkg} មិនជោគជ័យដោយសារសមតុល្យមិនគ្រប់គ្រាន់។ សូមបញ្ចូលទឹកប្រាក់ {price} THB ហើយសាកល្បងម្តងទៀត។', 'ការទូទាត់ {pkg} បរាជ័យ។ សូមបញ្ចូលទឹកប្រាក់ {price} THB ដើម្បីបន្តប្រើប្រាស់សេវាកម្ម។', 'ត្រូវការសកម្មភាព៖ ការបន្ត {pkg} បានបរាជ័យដោយសារសមតុល្យទាប។ សូមបញ្ចូលទឹកប្រាក់ {price} THB ដើម្បីជៀសវាងការរអាក់រអួលសេវាកម្ម។', 'ការជូនដំណឹងការទូទាត់៖ យើងមិនអាចដំណើរការការបន្ត {pkg} របស់អ្នកបានទេ។ បន្ថែម {price} THB ទៅគណនីរបស់អ្នកដើម្បីបើកដំណើរការឡើងវិញ។'],
        LAO: ['ລົ້ມເຫຼວ: ຕໍ່ອາຍຸ {pkg} ບໍ່ສຳເລັດເນື່ອງຈາກຍອດເງິນບໍ່ພໍ. ກະລຸນາເຕີມ {price} THB ແລ້ວລອງໃໝ່.', 'ຊຳລະ {pkg} ບໍ່ສຳເລັດ. ເຕີມ {price} THB ເພື່ອໃຊ້ບໍລິການຕໍ່.', 'ຕ້ອງດຳເນີນການ: ຕໍ່ອາຍຸ {pkg} ລົ້ມເຫຼວເນື່ອງຈາກຍອດເງິນຕ່ຳ. ກະລຸນາເຕີມ {price} THB ເພື່ອຫຼີກເວັ້ນການຢຸດໃຫ້ບໍລິການ.', 'ແຈ້ງເຕືອນການຊຳລະ: ພວກເຮົາບໍ່ສາມາດດຳເນີນການຕໍ່ອາຍຸ {pkg} ຂອງທ່ານໄດ້. ເຕີມ {price} THB ໃສ່ບັນຊີຂອງທ່ານເພື່ອເປີດໃຊ້ງານໃໝ່.'],
    } as LangMap<string[]>,
    beforePromoExpired: {
        ENG: ['Your {pkg} will expire in {daysLeft} days. Find a new package that suits you.', 'Reminder: {pkg} expires on {expiryDate}.', 'Time is running out! {pkg} expires in {daysLeft} days. Renew now to keep your benefits.'],
        THA: ['{pkg} ของคุณจะหมดอายุใน {daysLeft} วัน หาแพ็กเกจใหม่ที่เหมาะกับคุณ', 'แจ้งเตือน: {pkg} จะหมดอายุ {expiryDate}', 'เวลาใกล้หมดแล้ว! {pkg} จะหมดอายุใน {daysLeft} วัน ต่ออายุเลยเพื่อรักษาสิทธิประโยชน์ของคุณ'],
        CHI: ['您的{pkg}将在{daysLeft}天后到期。请选择适合您的新套餐。', '提醒：{pkg}将于{expiryDate}到期。', '时间不多了！{pkg}将在{daysLeft}天后到期。立即续订以保留您的权益。'],
        JPN: ['{pkg}はあと{daysLeft}日で期限切れです。お客様に合った新しいパッケージをお探しください。', 'お知らせ：{pkg}は{expiryDate}に期限切れとなります。', '時間がありません！{pkg}はあと{daysLeft}日で期限切れです。特典を維持するために今すぐ更新してください。'],
        KOR: ['{pkg}가 {daysLeft}일 후 만료됩니다. 알맞은 새 패키지를 찾아보세요.', '알림: {pkg}는 {expiryDate}에 만료됩니다.', '시간이 얼마 남지 않았습니다! {pkg}가 {daysLeft}일 후 만료됩니다. 혜택을 유지하려면 지금 갱신하세요.'],
        BUR: ['သင်၏ {pkg} သည် {daysLeft}ရက်အတွင်း သက်တမ်းကုန်ဆုံးပါမည်။ သင့်လျော်သော ပက်ကေ့ဂျ်အသစ်ကို ရှာဖွေပါ။', 'သတိပေးချက်: {pkg} သည် {expiryDate} တွင် သက်တမ်းကုန်ဆုံးမည်။', 'အချိန်ကုန်ဆုံးတော့မည်! {pkg} သည် {daysLeft}ရက်အတွင်း သက်တမ်းကုန်ဆုံးမည်။ သင်၏အကျိုးခံစားခွင့်များကို ထိန်းသိမ်းရန် ယခုပင် သက်တမ်းတိုးပါ။'],
        KHM: ['{pkg} របស់អ្នកនឹងផុតកំណត់ក្នុងរយៈពេល {daysLeft}ថ្ងៃ។ សូមស្វែងរកកញ្ចប់ថ្មីដែលសមស្រប។', 'ការរំលឹក៖ {pkg} ផុតកំណត់នៅ {expiryDate}។', 'ពេលវេលាកំពុងអស់! {pkg} នឹងផុតកំណត់ក្នុងរយៈពេល {daysLeft}ថ្ងៃ។ បន្តឥឡូវនេះដើម្បីរក្សាអត្ថប្រយោជន៍របស់អ្នក។'],
        LAO: ['{pkg} ຂອງທ່ານຈະໝົດອາຍຸໃນ {daysLeft} ວັນ. ຊອກຫາແພັກເກັດໃໝ່ທີ່ເໝາະສົມ.', 'ແຈ້ງເຕືອນ: {pkg} ຈະໝົດອາຍຸ {expiryDate}.', 'ເວລາກຳລັງໝົດລົງ! {pkg} ຈະໝົດອາຍຸໃນ {daysLeft} ວັນ. ຕໍ່ອາຍຸດຽວນີ້ເພື່ອຮັກສາສິດປະໂຫຍດຂອງທ່ານ.'],
    } as LangMap<string[]>,
    promoExpired: {
        ENG: ['Your {pkg} has expired. Thank you for using our service.', '{pkg} has ended. Please apply for a new package to continue.', 'Service ended: {pkg} is no longer active. Subscribe to a new plan today.'],
        THA: ['{pkg} ของคุณหมดอายุแล้ว ขอบคุณที่ใช้บริการ', '{pkg} สิ้นสุดแล้ว กรุณาสมัครแพ็กเกจใหม่เพื่อใช้บริการต่อ', 'บริการสิ้นสุด: {pkg} ไม่สามารถใช้งานได้แล้ว สมัครแพ็กเกจใหม่ได้เลยวันนี้'],
        CHI: ['您的{pkg}已到期。感谢您的使用。', '{pkg}已结束。请申请新套餐以继续使用。', '服务已结束：{pkg}已失效。请立即订阅新套餐。'],
        JPN: ['{pkg}の期限が切れました。ご利用ありがとうございました。', '{pkg}は終了しました。継続するには新しいパッケージにお申し込みください。', 'サービス終了：{pkg}は有効ではなくなりました。今日新しいプランに購読してください。'],
        KOR: ['{pkg}가 만료되었습니다. 이용해 주셔서 감사합니다.', '{pkg}가 종료되었습니다. 계속하려면 새 패키지를 신청하세요.', '서비스 종료: {pkg}가 더 이상 활성화되지 않습니다. 오늘 새 요금제에 가입하세요.'],
        BUR: ['သင်၏ {pkg} သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ဝန်ဆောင်မှုအသုံးပြုသည့်အတွက် ကျေးဇူးတင်ပါသည်။', '{pkg} ပြီးဆုံးသွားပါပြီ။ ဆက်လက်အသုံးပြုရန် ပက်ကေ့ဂျ်အသစ် လျှောက်ထားပါ။', 'ဝန်ဆောင်မှု ပြီးဆုံး: {pkg} သည် အသက်မဝင်တော့ပါ။ ယနေ့ပင် အစီအစဉ်အသစ်သို့ စာရင်းသွင်းပါ။'],
        KHM: ['{pkg} របស់អ្នកបានផុតកំណត់ហើយ។ អរគុណសម្រាប់ការប្រើប្រាស់សេវាកម្មរបស់យើង។', '{pkg} បានបញ្ចប់ហើយ។ សូមដាក់ពាក្យសុំកញ្ចប់ថ្មីដើម្បីបន្ត។', 'សេវាកម្មបានបញ្ចប់: {pkg} លែងសកម្មទៀតហើយ។ ជាវគម្រោងថ្មីនៅថ្ងៃនេះ។'],
        LAO: ['{pkg} ຂອງທ່ານໝົດອາຍຸແລ້ວ. ຂອບໃຈທີ່ໃຊ້ບໍລິການ.', '{pkg} ສິ້ນສຸດແລ້ວ. ກະລຸນາສະໝັກແພັກເກັດໃໝ່ເພື່ອໃຊ້ຕໍ່.', 'ບໍລິການສິ້ນສຸດ: {pkg} ບໍ່ສາມາດໃຊ້ງານໄດ້ອີກຕໍ່ໄປ. ສະໝັກແພັກເກັດໃໝ່ໄດ້ເລີຍມື້ນີ້.'],
    } as LangMap<string[]>,
    smsPromotePack: {
        ENG: ['Special offer Get {pkg} with {data} data at only {price} THB. Apply now.', 'Exclusive: {pkg} {data} at {speed} for only {price} THB.', 'Flash Sale Get {pkg} with {data} data at {speed} for just {price} THB. Limited time offer, apply now.', 'Dont miss out. {pkg} gives you {data} data {benefit}. Only {price} THB. Reply YES to subscribe.'],
        THA: ['ข้อเสนอพิเศษรับ {pkg} เน็ต {data} เพียง {price} บาท สมัครเลย', 'ดีลสุดคุ้ม: {pkg} เน็ต {data} ความเร็ว {speed} เพียง {price} บาท', 'แฟลช เซล รับ {pkg} เน็ต {data} ความเร็ว {speed} เพียง {price} บาท ข้อเสนอเวลาจำกัด สมัครเลย', 'อย่าพลาด {pkg} มอบเน็ต {data} {benefit} เพียง {price} บาท ตอบกลับ YES เพื่อสมัคร'],
        CHI: ['特别优惠：立即获得{pkg}，{data}流量仅需{price}泰铢。', '独家：{pkg} {data}流量（{speed}）仅需{price}泰铢。', '闪购获取{pkg}，享受{data}流量（{speed}），仅需{price}泰铢。限时优惠，立即申请。', '别错过。{pkg}为您提供{data}流量 {benefit}。仅需{price}泰铢。回复YES订阅。'],
        JPN: ['特別オファー：{pkg}を{data}データ付きでわずか{price}THBで。今すぐ申し込み。', '限定：{pkg} {data}データ（{speed}）がわずか{price}THB。', 'フラッシュセール。{pkg}を{data}データ（{speed}）付きでわずか{price}THBで。期間限定オファー、今すぐ申し込み。', 'お見逃しなく。{pkg}は{data}データ {benefit}を提供します。わずか{price}THB。YESと返信して購読。'],
        KOR: ['특별 혜택: {pkg}를 {data} 데이터와 함께 {price} THB에. 지금 신청하세요.', '독점: {pkg} {data} 데이터({speed})가 단 {price} THB.', '플래시 세일. {pkg}를 {data} 데이터({speed})와 함께 단 {price} THB에. 기간 한정 혜택, 지금 신청하세요.', '놓치지 마세요. {pkg}는 {data} 데이터 {benefit}를 제공합니다. 단 {price} THB. 구독하려면 YES로 답장하세요.'],
        BUR: ['အထူးကမ်းလှမ်းချက်: {pkg} ကို {data} ဒေတာဖြင့် {price} THB သာဖြင့် ရယူပါ။ ယခုပင် လျှောက်ထားပါ။', 'အထူး: {pkg} {data} ({speed}) {price} THB သာ။', 'Flash Sale {pkg} ကို {data} ဒေတာ ({speed}) ဖြင့် {price} THB သာဖြင့် ရယူပါ။ အချိန်ကန့်သတ် ကမ်းလှမ်းချက်၊ ယခုပင် လျှောက်ထားပါ။', 'လက်မလွှတ်ခံပါနဲ့။ {pkg} သည် {data} ဒေတာ {benefit} ကို ပေးပါသည်။ {price} THB သာ။ စာရင်းသွင်းရန် YES ဟု ပြန်လည်ဖြေကြားပါ။'],
        KHM: ['ការផ្តល់ជូនពិសេស៖ ទទួលបាន {pkg} ជាមួយទិន្នន័យ {data} គ្រាន់តែ {price} THB។ ដាក់ពាក្យឥឡូវនេះ។', 'ផ្តាច់មុខ៖ {pkg} {data} ({speed}) គ្រាន់តែ {price} THB។', 'Flash Sale ទទួលបាន {pkg} ជាមួយទិន្នន័យ {data} ល្បឿន {speed} គ្រាន់តែ {price} THB។ ការផ្តល់ជូនមានកំណត់ ដាក់ពាក្យឥឡូវនេះ។', 'កុំភ្លេច {pkg} ផ្តល់ជូនអ្នកនូវទិន្នន័យ {data} {benefit}។ គ្រាន់តែ {price} THB។ ឆ្លើយតប YES ដើម្បីជាវ។'],
        LAO: ['ຂໍ້ສະເໜີພິເສດ: ຮັບ {pkg} ອິນເຕີເນັດ {data} ພຽງ {price} THB. ສະໝັກດຽວນີ້.', 'ພິເສດສະເພາະ: {pkg} {data} ({speed}) ພຽງ {price} THB.', 'ແຟຣຊເຊລ ຮັບ {pkg} ອິນເຕີເນັດ {data} ຄວາມໄວ {speed} ພຽງ {price} THB. ຂໍ້ສະເໜີຈຳກັດເວລາ, ສະໝັກດຽວນີ້.', 'ຢ່າພາດ {pkg} ມອບອິນເຕີເນັດ {data} {benefit}. ພຽງ {price} THB. ຕອບກັບ YES ເພື່ອສະໝັກ.'],
    } as LangMap<string[]>,
    smsCheckCurrent: {
        ENG: ['Check current package: {pkg} {data} remaining. Speed {speed}. Expires {expiryDate}.', 'Your current plan: {pkg}. Valid until {expiryDate}.', 'Status update: {pkg} active. {data} left at {speed}. Check app for details.'],
        THA: ['เช็คแพ็กเกจปัจจุบัน: {pkg} เน็ตคงเหลือ {data} ความเร็ว {speed} หมดอายุ {expiryDate}', 'แผนปัจจุบันของคุณ: {pkg} ใช้ได้ถึง {expiryDate}', 'อัปเดตสถานะ: {pkg} ใช้งานอยู่ เหลือ {data} ที่ความเร็ว {speed} เช็คแอปเพื่อดูรายละเอียด'],
        CHI: ['查看当前套餐：{pkg} 剩余{data}流量。速度{speed}。到期日{expiryDate}。', '您当前的套餐：{pkg}。有效期至{expiryDate}。', '状态更新：{pkg}使用中。剩余{data}流量，速度{speed}。请查看App了解详情。'],
        JPN: ['現在のパッケージ確認：{pkg} 残り{data}。速度{speed}。期限{expiryDate}。', '現在のプラン：{pkg}。{expiryDate}まで有効。', 'ステータス更新：{pkg}有効。残り{data}、速度{speed}。詳細はアプリでご確認ください。'],
        KOR: ['현재 패키지 확인: {pkg} {data} 남음. 속도 {speed}. 만료일 {expiryDate}.', '현재 요금제: {pkg}. {expiryDate}까지 유효.', '상태 업데이트: {pkg} 활성화됨. {speed} 속도로 {data} 남음. 자세한 내용은 앱을 확인하세요.'],
        BUR: ['လက်ရှိပက်ကေ့ဂျ်စစ်ဆေးရန်: {pkg} {data} ကျန်ရှိသည်။ အမြန်နှုန်း {speed}။ သက်တမ်းကုန် {expiryDate}။', 'သင်၏လက်ရှိအစီအစဉ်: {pkg}။ {expiryDate} အထိ သက်တမ်းရှိသည်။', 'အခြေအနေ အပ်ဒိတ်: {pkg} အသက်ဝင်နေသည်။ {speed} ဖြင့် {data} ကျန်သည်။ အသေးစိတ်ကို အက်ပ်တွင် ကြည့်ပါ။'],
        KHM: ['ពិនិត្យកញ្ចប់បច្ចុប្បន្ន៖ {pkg} នៅសល់ {data}។ ល្បឿន {speed}។ ផុតកំណត់ {expiryDate}។', 'គម្រោងបច្ចុប្បន្នរបស់អ្នក៖ {pkg}។ សុពលភាពដល់ {expiryDate}។', 'ការធ្វើឱ្យទាន់សម័យស្ថានភាព៖ {pkg} កំពុងដំណើរការ។ នៅសល់ {data} ល្បឿន {speed}។ ពិនិត្យកម្មវិធីសម្រាប់ព័ត៌មានលម្អិត។'],
        LAO: ['ກວດແພັກເກັດປັດຈຸບັນ: {pkg} ເຫຼືອ {data}. ຄວາມໄວ {speed}. ໝົດອາຍຸ {expiryDate}.', 'ແພັກປັດຈຸບັນຂອງທ່ານ: {pkg}. ໃຊ້ໄດ້ເຖິງ {expiryDate}.', 'ອັບເດດສະຖານະ: {pkg} ກຳລັງໃຊ້ງານ. ເຫຼືອ {data} ທີ່ຄວາມໄວ {speed}. ກວດສອບແອັບເພື່ອເບິ່ງລາຍລະອຽດ.'],
    } as LangMap<string[]>,
};

// ─── Generate SMS Wording (mimics Generate button, all languages) ─
export const generateSmsWording = (
    projectName: string,
    poName: string,
    module: string,
    priceType: string,
    subModule?: string
) => {
    const seedBase = `${projectName}|${poName}|${module}|${priceType}|${subModule || 'POST'}`;

    const dataAmount = stablePick(DATA_AMOUNTS, `${seedBase}|data`);
    const speed = stablePick(SPEEDS, `${seedBase}|speed`);
    const network = stablePick(NETWORK_TYPES, `${seedBase}|network`);
    const price = stableNumber(`${seedBase}|price`, 59, 2999);
    const validity = stablePick(DURATIONS, `${seedBase}|validity`);
    const contractMonths = stablePick(CONTRACT_MONTHS_LIST, `${seedBase}|contract`);
    const segment = stablePick(SEGMENTS, `${seedBase}|segment`);
    const benefit = stablePick(BENEFITS, `${seedBase}|benefit`);
    const priceLabel = PRICE_TYPE_LABELS[priceType] || (LANGS.reduce((a, l) => ({ ...a, [l]: priceType }), {} as LangMap));

    const pkg = pickAllLangs(PACKAGE_NAME_POOLS.mobile, seedBase, 'pkg');

    const isRecurring = priceType === 'recurring';
    const unit = isRecurring ? UNIT_WORDS.recurring : UNIT_WORDS.onetime;

    const today = new Date();
    const endDate = new Date(today.getTime() + validity * 24 * 60 * 60 * 1000);
    const endDateStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const renewDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const renewDateStr = renewDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const daysLeft = stableNumber(`${seedBase}|daysLeft`, 1, 7);
    const remainingPool = ['500MB', '1GB', '2GB', '3GB', '5GB'];
    const remaining = stablePick(remainingPool, `${seedBase}|remaining`);

    const replaceVars = (template: string, lang: Lang): string => {
        return template
            .replace(/\{pkg\}/g, pkg[lang])
            .replace(/\{data\}/g, dataAmount)
            .replace(/\{speed\}/g, speed)
            .replace(/\{network\}/g, network)
            .replace(/\{price\}/g, String(price))
            .replace(/\{validity\}/g, String(validity))
            .replace(/\{contract\}/g, String(contractMonths))
            .replace(/\{segment\}/g, segment[lang])
            .replace(/\{benefit\}/g, benefit[lang])
            .replace(/\{unit\}/g, unit[lang])
            .replace(/\{endDate\}/g, endDateStr)
            .replace(/\{renewDate\}/g, renewDateStr)
            .replace(/\{deductDate\}/g, renewDateStr)
            .replace(/\{expiryDate\}/g, endDateStr)
            .replace(/\{daysLeft\}/g, String(daysLeft))
            .replace(/\{remaining\}/g, remaining);
    };

    const buildField = (key: keyof typeof SMS_TEMPLATES): LangMap<string[]> =>
        buildAllLangs(SMS_TEMPLATES[key], seedBase, key, replaceVars);

    return {
        seedBase,
        packageName: pkg,
        dataAmount,
        speed,
        network,
        price,
        validity,
        contractMonths,
        segment,
        priceTypeLabel: priceLabel,

        shortPromotionName: buildField('shortPromotionName'),
        cmsDisplay: buildField('cmsDisplay'),
        promotionDescription: buildField('promotionDescription'),
        smsGreeting: buildField('smsGreeting'),
        smsDelete: buildField('smsDelete'),
        lastMinuteAlert: buildField('lastMinuteAlert'),
        beforeFeeDeduction: buildField('beforeFeeDeduction'),
        recurringSuccess: buildField('recurringSuccess'),
        recurringFail: buildField('recurringFail'),
        beforePromoExpired: buildField('beforePromoExpired'),
        promoExpired: buildField('promoExpired'),
        smsPromotePack: buildField('smsPromotePack'),
        smsCheckCurrent: buildField('smsCheckCurrent'),

        smsGreetingSendFlag: stablePick(['Send', 'Send', 'Send', "Don't Send"], `${seedBase}|greetFlag`),
        smsDeleteSendFlag: stablePick(['Send', 'Send', "Don't Send"], `${seedBase}|delFlag`),
        lastMinuteAlertFlag: stablePick(['Send', 'Send', 'Send', "Don't Send"], `${seedBase}|lmFlag`),
        beforeFeeDeductFlag: stablePick(['Send', "Don't Send"], `${seedBase}|bfFlag`),
        recSuccessFlag: stablePick(['Send', 'Send', "Don't Send"], `${seedBase}|rsFlag`),
        recFailFlag: stablePick(['Send', 'Send', 'Send', "Don't Send"], `${seedBase}|rfFlag`),
        beforeExpFlag: stablePick(['Send', 'Send', "Don't Send"], `${seedBase}|beFlag`),
        promoExpFlag: stablePick(['Send', 'Send', "Don't Send"], `${seedBase}|exFlag`),
        smsPromoteFlag: stablePick(['Send', "Don't Send", "Don't Send"], `${seedBase}|promFlag`),

        lastMinuteDefaultWording: stablePick(['Yes', 'Yes', 'No'], `${seedBase}|lmDef`),
        recSuccessDefaultWording: stablePick(['Yes', 'Yes', 'No'], `${seedBase}|rsDef`),
        recFailDefaultWording: stablePick(['Yes', 'Yes', 'No'], `${seedBase}|rfDef`),
        beforeExpDefaultWording: stablePick(['Yes', 'Yes', 'No'], `${seedBase}|beDef`),
    };
};

// ─── Remark & Description Builder (per language) ─────────────────
const REMARK_TEMPLATES: LangMap<string[]> = {
    ENG: [
        '{p} {pc} {mod} {sm}. {data} at {speed} on {network}. {price} THB/{unit}. Contract {contract}mo. Target: {segment}.',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price} THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price} THB | Target: {segment} | Status: {devStatus}',
        '{p} ({mod}) {sm} plan. Includes {data} at {speed}. Price: {price} THB/{unit}. Channel: {channel}. Approval: {approval}.'
    ],
    THA: [
        '{p} {pc} {mod} {sm} เน็ต {data} ความเร็ว {speed} บน {network} ราคา {price} บาท/{unit} สัญญา {contract} เดือน เป้า: {segment}',
        'PO: {po} | {p} | {pc} | เน็ต {data} ความเร็ว {speed} | {price} บาท | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | เน็ต {data} @ {speed} | {price} บาท | เป้า: {segment} | สถานะ: {devStatus}',
        '{p} ({mod}) แพ็กเกจ {sm} รวมเน็ต {data} ความเร็ว {speed} ราคา {price} บาท/{unit} ช่องทาง: {channel} อนุมัติ: {approval}'
    ],
    CHI: [
        '{p} {pc} {mod} {sm}。{network}下{data}流量，速度{speed}。{price}泰铢/{unit}。合约{contract}个月。目标群体：{segment}。',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price}泰铢 | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price}泰铢 | 目标: {segment} | 状态: {devStatus}',
        '{p} ({mod}) {sm}套餐。包含{data}流量，速度{speed}。价格：{price}泰铢/{unit}。渠道：{channel}。审批：{approval}。'
    ],
    JPN: [
        '{p} {pc} {mod} {sm}。{network}で{data}、速度{speed}。{price}THB/{unit}。契約{contract}ヶ月。ターゲット：{segment}。',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price}THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price}THB | ターゲット: {segment} | ステータス: {devStatus}',
        '{p} ({mod}) {sm}プラン。{data}データ（速度{speed}）を含む。料金：{price}THB/{unit}。チャネル：{channel}。承認：{approval}。'
    ],
    KOR: [
        '{p} {pc} {mod} {sm}. {network}에서 {data}, 속도 {speed}. {price} THB/{unit}. 계약 {contract}개월. 대상: {segment}.',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price} THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price} THB | 대상: {segment} | 상태: {devStatus}',
        '{p} ({mod}) {sm} 요금제. {data} 데이터({speed}) 포함. 가격: {price} THB/{unit}. 채널: {channel}. 승인: {approval}.'
    ],
    BUR: [
        '{p} {pc} {mod} {sm}။ {network} ပေါ်တွင် {data} အမြန်နှုန်း {speed}။ {price} THB/{unit}။ စာချုပ် {contract}လ။ ပစ်မှတ်: {segment}။',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price} THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price} THB | ပစ်မှတ်: {segment} | အခြေအနေ: {devStatus}',
        '{p} ({mod}) {sm} အစီအစဉ်။ {data} ({speed}) ပါဝင်သည်။ ဈေးနှုန်း: {price} THB/{unit}။ လမ်းကြောင်း: {channel}။ အတည်ပြုချက်: {approval}။'
    ],
    KHM: [
        '{p} {pc} {mod} {sm}។ {data} ល្បឿន {speed} លើ {network}។ {price} THB/{unit}។ កិច្ចសន្យា {contract}ខែ។ គោលដៅ៖ {segment}។',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price} THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price} THB | គោលដៅ: {segment} | ស្ថានភាព: {devStatus}',
        '{p} ({mod}) គម្រោង {sm}។ រួមបញ្ចូលទិន្នន័យ {data} ល្បឿន {speed}។ តម្លៃ: {price} THB/{unit}។ ឆានែល: {channel}។ ការអនុម័ត: {approval}។'
    ],
    LAO: [
        '{p} {pc} {mod} {sm}. {data} ຄວາມໄວ {speed} ເທິງ {network}. {price} THB/{unit}. ສັນຍາ {contract}ເດືອນ. ເປົ້າໝາຍ: {segment}.',
        'PO: {po} | {p} | {pc} | {data} {speed} | {price} THB | {segment} | {devStatus}',
        '{p} | {pc} | {sm} | {data} @ {speed} | {price} THB | ເປົ້າໝາຍ: {segment} | ສະຖານະ: {devStatus}',
        '{p} ({mod}) ແຜນ {sm}. ລວມ {data} ຄວາມໄວ {speed}. ລາຄາ: {price} THB/{unit}. ຊ່ອງທາງ: {channel}. ການອະນຸມັດ: {approval}.'
    ],
};

const DEV_STATUSES: LangMap<string[]> = {
    ENG: ['Draft', 'In Review', 'Pending Approval', 'Approved', 'Deployed', 'Pending QA', 'Ready for Launch', 'Archived'],
    THA: ['ฉบับร่าง', 'อยู่ระหว่างตรวจสอบ', 'รออนุมัติ', 'อนุมัติแล้ว', 'Deploy แล้ว', 'รอทดสอบ QA', 'พร้อมเปิดตัว', 'เก็บถาวร'],
    CHI: ['草稿', '审核中', '待批准', '已批准', '已部署', '待QA测试', '准备发布', '已归档'],
    JPN: ['下書き', 'レビュー中', '承認待ち', '承認済み', 'デプロイ済み', 'QA待ち', 'リリース準備完了', 'アーカイブ済み'],
    KOR: ['초안', '검토 중', '승인 대기', '승인됨', '배포됨', 'QA 대기 중', '출시 준비 완료', '보관됨'],
    BUR: ['မူကြမ်း', 'စစ်ဆေးဆဲ', 'အတည်ပြုရန်စောင့်ဆိုင်းနေသည်', 'အတည်ပြုပြီး', 'ဖြန့်ချိပြီး', 'QA စစ်ဆေးရန်စောင့်ဆိုင်းနေသည်', 'ဖြန့်ချိရန်အသင့်', 'မှတ်တမ်းတင်ထားသည်'],
    KHM: ['សេចក្តីព្រាង', 'កំពុងពិនិត្យ', 'រង់ចាំការអនុម័ត', 'បានអនុម័ត', 'បានដាក់ឱ្យប្រើប្រាស់', 'កំពុងរង់ចាំ QA', 'ត្រៀមដាក់ឱ្យប្រើប្រាស់', 'បានរក្សាទុក'],
    LAO: ['ຮ່າງ', 'ກຳລັງກວດສອບ', 'ລໍຖ້າອະນຸມັດ', 'ອະນຸມັດແລ້ວ', 'ນຳໃຊ້ແລ້ວ', 'ລໍຖ້າກວດສອບ QA', 'ພ້ອມເປີດຕົວ', 'ຖືກເກັບຖາວອນ'],
};

const CHANNELS: LangMap<string[]> = {
    ENG: ['Digital', 'All Channels', 'Retail and Digital', 'Online Exclusive', 'AIS Shop', 'Partner App', 'Call Center', 'B2B Direct Sales'],
    THA: ['ดิจิทัล', 'ทุกช่องทาง', 'ร้านค้าและดิจิทัล', 'ออนไลน์เท่านั้น', 'AIS Shop', 'แอปพาร์ทเนอร์', 'คอลเซ็นเตอร์', 'ขายตรง B2B'],
    CHI: ['数字渠道', '全渠道', '零售及数字渠道', '仅限线上', 'AIS 门店', '合作伙伴App', '呼叫中心', 'B2B直销'],
    JPN: ['デジタル', '全チャネル', '店舗＆デジタル', 'オンライン限定', 'AISショップ', 'パートナーアプリ', 'コールセンター', 'B2B直接販売'],
    KOR: ['디지털', '전체 채널', '리테일 및 디지털', '온라인 전용', 'AIS 매장', '파트너 앱', '콜센터', 'B2B 직접 판매'],
    BUR: ['ဒစ်ဂျစ်တယ်', 'လမ်းကြောင်းအားလုံး', 'လက်လီနှင့် ဒစ်ဂျစ်တယ်', 'အွန်လိုင်းသာ', 'AIS ဆိုင်', 'မိတ်ဖက် အက်ပ်', 'ကောလ်စင်တာ', 'B2B တိုက်ရိုက်ရောင်းချမှု'],
    KHM: ['ឌីជីថល', 'គ្រប់ឆានែល', 'លក់រាយនិងឌីជីថល', 'តែអនឡាញ', 'ហាង AIS', 'កម្មវិធីដៃគូ', 'មជ្ឈមណ្ឌលទូរស័ព្ទ', 'ការលក់ផ្ទាល់ B2B'],
    LAO: ['ດິຈິຕອນ', 'ທຸກຊ່ອງທາງ', 'ຮ້ານຄ້າແລະດິຈິຕອນ', 'ອອນລາຍເທົ່ານັ້ນ', 'ຮ້ານ AIS', 'ແອັບພາກສ່ວນ', 'ສູນບໍລິການລູກຄ້າ', 'ຂາຍໂດຍກົງ B2B'],
};

const APPROVALS: LangMap<string[]> = {
    ENG: ['Product: Approved', 'Pricing: Approved', 'Legal: Under Review', 'Finance: Signed Off', 'Marketing: Approved', 'Tech: Pending', 'Compliance: Cleared'],
    THA: ['ผลิตภัณฑ์: อนุมัติ', 'ราคา: อนุมัติ', 'กฎหมาย: ตรวจสอบ', 'การเงิน: เซ็นแล้ว', 'การตลาด: อนุมัติ', 'เทคนิค: รอดำเนินการ', 'ความสอดคล้อง: อนุมัติ'],
    CHI: ['产品：已批准', '定价：已批准', '法务：审核中', '财务：已签核', '市场：已批准', '技术：待处理', '合规：已清除'],
    JPN: ['製品：承認済み', '価格：承認済み', '法務：審査中', '財務：承認済み', 'マーケティング：承認済み', '技術：保留中', 'コンプライアンス：クリア'],
    KOR: ['제품: 승인됨', '가격: 승인됨', '법무: 검토 중', '재무: 승인됨', '마케팅: 승인됨', '기술: 보류 중', '규정 준수: 완료'],
    BUR: ['ကုန်ပစ္စည်း: အတည်ပြုပြီး', 'ဈေးနှုန်း: အတည်ပြုပြီး', 'ဥပဒေရေးရာ: စစ်ဆေးဆဲ', 'ငွေရေးကြေးရေး: လက်မှတ်ရေးထိုးပြီး', 'စျေးကွက်: အတည်ပြုပြီး', 'နည်းပညာ: ရွှေ့ဆိုင်းထား', 'လိုက်နာမှု: ရှင်းလင်းပြီး'],
    KHM: ['ផលិតផល៖ បានអនុម័ត', 'តម្លៃ៖ បានអនុម័ត', 'ច្បាប់៖ កំពុងពិនិត្យ', 'ហិរញ្ញវត្ថុ៖ បានចុះហត្ថលេខា', 'ទីផ្សារ៖ បានអនុម័ត', 'បច្ចេកទេស៖ កំពុងព្យួរ', 'ការអនុលោម៖ បានសម្អាត'],
    LAO: ['ຜະລິດຕະພັນ: ອະນຸມັດແລ້ວ', 'ລາຄາ: ອະນຸມັດແລ້ວ', 'ກົດໝາຍ: ກຳລັງກວດສອບ', 'ການເງິນ: ເຊັນແລ້ວ', 'ການຕະຫຼາດ: ອະນຸມັດແລ້ວ', 'ເຕັກນິກ: ຄ້າງດຳເນີນການ', 'ການປະຕິບັດຕາມກົດລະບຽບ: ຜ່ານແລ້ວ'],
};

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
    const seedBase = `${p}|${po}|${mod}|${PriceType}|${sm}`;

    const dataAmount = stablePick(DATA_AMOUNTS, `${seedBase}|data`);
    const speed = stablePick(SPEEDS, `${seedBase}|speed`);
    const network = stablePick(NETWORK_TYPES, `${seedBase}|network`);
    const price = stableNumber(`${seedBase}|price`, 59, 2999);
    const validity = stablePick(DURATIONS, `${seedBase}|validity`);
    const contractMonths = stablePick(CONTRACT_MONTHS_LIST, `${seedBase}|contract`);
    const segment = stablePick(SEGMENTS, `${seedBase}|segment`);
    const benefit = stablePick(BENEFITS, `${seedBase}|benefit`);
    const devStatus = pickAllLangs(DEV_STATUSES, seedBase, 'devStatus');
    const channel = pickAllLangs(CHANNELS, seedBase, 'channel');
    const approval = pickAllLangs(APPROVALS, seedBase, 'approval');
    const launchTiming = stablePick(['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'Q1 2027'], `${seedBase}|launch`);
    const target = stablePick(['5K', '10K', '25K', '50K', '100K'], `${seedBase}|target`);
    const pCode = `PKG${mod}${sm}${stableNumber(`${seedBase}|code`, 1000, 9999)}`;

    const isRecurring = PriceType === 'recurring';
    const unit = isRecurring ? UNIT_WORDS.recurring : UNIT_WORDS.onetime;
    const ptType = PRICE_TYPE_LABELS[PriceType] || (LANGS.reduce((a, l) => ({ ...a, [l]: PriceType }), {} as LangMap));

    const PC_POOL: LangMap<string[]> = {
        ENG: ['Main Package', 'OnTop Addon', 'On-Top Extra', 'Starter Pack', 'Pro Bundle', 'Enterprise Suite'],
        THA: ['แพ็กเกจหลัก', 'แพ็กเกจเสริม', 'แพ็กเกจเสริมพิเศษ', 'แพ็กเริ่มต้น', 'โปร บันเดิล', 'เอ็นเทอร์ไพรส์ สวีท'],
        CHI: ['主套餐', '附加套餐', '额外附加套餐', '入门套餐', '专业组合', '企业套件'],
        JPN: ['メインパッケージ', 'オントップアドオン', 'オントップエクストラ', 'スターターパック', 'プロバンドル', 'エンタープライズスイート'],
        KOR: ['메인 패키지', '온탑 애드온', '온탑 엑스트라', '스타터 팩', '프로 번들', '엔터프라이즈 스위트'],
        BUR: ['အဓိကပက်ကေ့ဂျ်', 'ထပ်ဆောင်း', 'ထပ်ဆောင်းအပို', 'စတင်သူ ပက်ကေ့ဂျ်', 'ပရို ဘန်းဒယ်', 'လုပ်ငန်းသုံး အစုအဝေး'],
        KHM: ['កញ្ចប់មេ', 'កញ្ចប់បន្ថែម', 'កញ្ចប់បន្ថែមពិសេស', 'កញ្ចប់ចាប់ផ្តើម', 'កញ្ចប់ប្រូ', 'ឈុតសាជីវកម្ម'],
        LAO: ['ແພັກເກັດຫຼັກ', 'ແພັກເສີມ', 'ແພັກເສີມພິເສດ', 'ແພັກເລີ່ມຕົ້ນ', 'ຊຸດໂປຣ', 'ຊຸດວິສາຫະກິດ'],
    };
    const MOD_POOL: LangMap<string[]> = {
        ENG: ['Mobile', 'Entertainment', 'Fiber', 'Fixed Line', 'IoT', 'Cloud Services', 'Security'],
        THA: ['มือถือ', 'บันเทิง', 'ไฟเบอร์', 'โทรศัพท์บ้าน', 'IoT', 'บริการคลาวด์', 'ความปลอดภัย'],
        CHI: ['移动', '娱乐', '光纤', '固定电话', '物联网', '云服务', '安全'],
        JPN: ['モバイル', 'エンタメ', 'ファイバー', '固定電話', 'IoT', 'クラウドサービス', 'セキュリティ'],
        KOR: ['모바일', '엔터테인먼트', '파이버', '유선전화', 'IoT', '클라우드 서비스', '보안'],
        BUR: ['မိုဘိုင်း', 'ဖျော်ဖြေရေး', 'ဖိုင်ဘာ', 'ကြေးနန်းလိုင်း', 'IoT', 'တိမ်တိုက် ဝန်ဆောင်မှုများ', 'လုံခြုံရေး'],
        KHM: ['ទូរស័ព្ទចល័ត', 'កម្សាន្ត', 'ហ្វាយប័រ', 'ខ្សែទូរស័ព្ទថេរ', 'IoT', 'សេវាកម្មក្លោដ', 'សន្តិសុខ'],
        LAO: ['ມືຖື', 'ບັນເທີງ', 'ໄຟເບີ', 'ໂທລະສັບບ້ານ', 'IoT', 'ບໍລິການຄລາວດ໌', 'ຄວາມປອດໄພ'],
    };

    const pcMap = pickAllLangs(PC_POOL, seedBase, 'pc');
    const modMap = pickAllLangs(MOD_POOL, seedBase, 'modName');

    const SM_LABELS: LangMap<{ PRE: string; POST: string }> = {
        ENG: { PRE: 'Prepaid', POST: 'Postpaid' },
        THA: { PRE: 'เติมเงิน', POST: 'รายเดือน' },
        CHI: { PRE: '预付费', POST: '后付费' },
        JPN: { PRE: 'プリペイド', POST: 'ポストペイド' },
        KOR: { PRE: '선불', POST: '후불' },
        BUR: { PRE: 'ကြိုတင်ငွေဖြည့်', POST: 'လစဉ်ငွေပေးချေ' },
        KHM: { PRE: 'បង់ប្រាក់មុន', POST: 'បង់ប្រាក់ក្រោយ' },
        LAO: { PRE: 'ເຕີມເງິນ', POST: 'ລາຍເດືອນ' },
    };
    const smMap = LANGS.reduce((acc, l) => {
        acc[l] = SM_LABELS[l][sm === 'PRE' ? 'PRE' : 'POST'];
        return acc;
    }, {} as LangMap);

    const autoRenewMap: LangMap = {
        ENG: sm === 'POST' ? 'Yes' : 'No', THA: sm === 'POST' ? 'ใช่' : 'ไม่',
        CHI: sm === 'POST' ? '是' : '否', JPN: sm === 'POST' ? 'はい' : 'いいえ',
        KOR: sm === 'POST' ? '예' : '아니오', BUR: sm === 'POST' ? 'ဟုတ်' : 'မဟုတ်',
        KHM: sm === 'POST' ? 'បាទ/ចាស' : 'ទេ', LAO: sm === 'POST' ? 'ແມ່ນ' : 'ບໍ່',
    };

    const remarkLangIndex = stableHash(`${seedBase}|remarkLang`) % LANGS.length;
    const remarkLang = LANGS[remarkLangIndex];
    const remarkTemplate = stablePick(REMARK_TEMPLATES[remarkLang], `${seedBase}|remarkTpl`);

    const remarkText = remarkTemplate
        .replace(/\{p\}/g, p)
        .replace(/\{po\}/g, po)
        .replace(/\{pc\}/g, pcMap[remarkLang])
        .replace(/\{mod\}/g, modMap[remarkLang])
        .replace(/\{sm\}/g, smMap[remarkLang])
        .replace(/\{data\}/g, dataAmount)
        .replace(/\{speed\}/g, speed)
        .replace(/\{network\}/g, network)
        .replace(/\{price\}/g, String(price))
        .replace(/\{unit\}/g, unit[remarkLang])
        .replace(/\{contract\}/g, String(contractMonths))
        .replace(/\{segment\}/g, segment[remarkLang])
        .replace(/\{devStatus\}/g, devStatus[remarkLang])
        .replace(/\{channel\}/g, channel[remarkLang])
        .replace(/\{approval\}/g, approval[remarkLang]);

    const smsWording = generateSmsWording(p, po, mod, PriceType, sm);
    const discountNamePool = (() => {
        const d = pickAllLangs(DISCOUNT_NAME_TEMPLATES, seedBase, 'discountName');
        LANGS.forEach((l) => { d[l] = d[l].replace(/\{p\}/g, p); });
        return LANGS.reduce((acc, lang) => {
            acc[lang] = [d[lang]];
            return acc;
        }, {} as LangMap<string[]>);
    })();

    const legacy = <T extends LangMap<string[]>>(value: T): T & { EN: string[]; TH: string[] } => withLegacyTextAliases(value);

    return {
        seedBase,
        packageName: LANGS.reduce((a, l) => ({ ...a, [l]: p }), {} as LangMap),
        dataAmount,
        speed,
        network,
        price,
        validity,
        contractMonths,
        segment,
        benefit,
        devStatus,
        channel,
        approval,
        launchTiming,
        target,
        productCode: pCode,
        remarkText,
        remarkLang,

        shortPromotionName: legacy(smsWording.shortPromotionName),
        cmsDisplay: legacy(smsWording.cmsDisplay),
        description: legacy(smsWording.promotionDescription),
        promotionDescription: legacy(smsWording.promotionDescription),
        wordingInStatement: legacy(smsWording.cmsDisplay),
        smsGreeting: legacy(smsWording.smsGreeting),
        greetingLetter: legacy(smsWording.smsGreeting),
        yourPackageName: legacy(smsWording.shortPromotionName),
        otherCondition: legacy(smsWording.promotionDescription),
        memoDescription: legacy(smsWording.promotionDescription),
        smsDelete: legacy(smsWording.smsDelete),
        recurringSuccess: legacy(smsWording.recurringSuccess),
        recurringFail: legacy(smsWording.recurringFail),
        beforePromoExpired: legacy(smsWording.beforePromoExpired),
        promoExpired: legacy(smsWording.promoExpired),
        smsPromotePack: legacy(smsWording.smsPromotePack),
        smsCheckCurrent: legacy(smsWording.smsCheckCurrent),
        lastMinuteAlert: legacy(smsWording.lastMinuteAlert),
        beforeFeeDeduction: legacy(smsWording.beforeFeeDeduction),

        discountName: legacy(discountNamePool),
    };
};