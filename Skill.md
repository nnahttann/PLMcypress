# Mass Mobile PLM - Skill Document (CKS Role)

**หมายเหตุสำคัญ**: เอกสารนี้อ้างอิงจาก HLD Version ENH และ Database Tables ใช้ชื่อ `ENH` 
แต่ในทางปฏิบัติ **CKS = ENH** (หมายถึงระบบเดียวกัน)

## สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [User Credentials & Authentication](#user-credentials--authentication)
3. [Project Management System](#project-management-system)
4. [Product Offering Management](#product-offering-management)
5. [Mass ENH Product Offering Definition](#mass-enh-product-offering-definition)
6. [Voice Services](#voice-services)
7. [SMS Services](#sms-services)
8. [Internet Services](#internet-services)
9. [Content VDO](#content-vdo)
10. [Revenue Sharing](#revenue-sharing)
11. [Human Touch Point](#human-touch-point)
12. [Application Channel](#application-channel)
13. [SMS Wording](#sms-wording)
14. [Approval Workflow Functions](#approval-workflow-functions)
15. [Service Configuration Functions](#service-configuration-functions)
16. [Script Validation Rules](#script-validation-rules)
17. [Database Mapping](#database-mapping)
18. [Type Definitions](#type-definitions)

---

## ภาพรวมระบบ

ระบบ Mass Mobile PLM เป็นระบบบริหารจัดการ Product Offering สำหรับธุรกิจโทรคมนาคม รองรับทั้ง Pre-paid และ Post-paid customers

**หมายเหตุ**: ระบบนี้รู้จักในชื่อ **CKS Role** ในทางปฏิบัติ แต่เอกสาร HLD และ Database ใช้ชื่อ **ENH (Enhanced)** ซึ่งหมายถึงระบบเดียวกัน

### Version History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 0.01 | 02/07/2019 | Nattawat | Initial Document |
| 1.0 | 04/09/2020 | Nattawat | Production Ready |
| 2.01 | 07/03/2022 | wiwat | Update Modify Mobile |
| 3.20 | 18/03/2025 | Suchanan | Latest Version (ENH/CKS) |

---

## User Credentials & Authentication

### Environment Variables (จาก Master.ts)

```typescript
const env = Cypress.env();
export const {
  urlsit,                          // URL ระบบ SIT
  MKTpre, MKTpre1,                 // Marketing Pre-paid User/Password
  MKTpost, MKTpost1,               // Marketing Post-paid User/Password
  cks, ckspass,                    // ENH (CKS) User/Password
  cgcirb, cgcirbpass,              // CGC IRB User/Password
  cgccbs, cgccbspass,              // CGC CBS User/Password
  cgtcbs, cgtcbspass,              // CGT CBS User/Password
  cgtirb, cgtirbpass,              // CGT IRB User/Password
  actm, actmpass,                  // ACTM User/Password
  oper, operpass,                  // OPER User/Password
  spadsup, spadsuppass,            // SPAD Supervisor User/Password
  spaddoer, spaddoerpass,          // SPAD DOER User/Password
  spadtest, spadtestpass,          // SPAD Tester User/Password
  spaddp, spaddppass,              // SPAD Deploy User/Password
  apo, apopass,                    // APO User/Password
  enter, enterpass,                // Enterprise User/Password
  music, musicpass,                // Music User/Password
  tscenter, tscenterpass,          // TS Center User/Password
  aafsp, aafsppass,                // AAFSP User/Password
  csisp, csisppass,                // CSISP User/Password
  e2etest, e2etestpass,            // E2E Test User/Password
  aafdp, aafdppass,                // AAFDP User/Password
  csidp, csidppass,                // CSIDP User/Password
  e2edp, e2edppass,                // E2EDP User/Password
  sasff, sasffpass                 // SASFF User/Password
} = env as Record<string, string>;
```

### Login Functions

#### `login(username: string, password: string): void`
ฟังก์ชันเข้าสู่ระบบพร้อม validation
- ตรวจสอบ app-login component
- กรอก userId และ pwd
- Intercept API call เพื่อรอ response
- Timeout: 3,000,000ms สำหรับ login page

#### `loginAndWaitReady(username: string, password: string): void`
ฟังก์ชันเข้าสู่ระบบและรอจนระบบพร้อมใช้งาน
- เรียก login()
- รอ API `/api/plm-error-code/getAll` สำเร็จ

#### `getCredentials(module: Module): { user: string, pass: string }`
ดึง credentials ตาม module
- **POST**: MKTpost / MKTpost1
- **PRE**: MKTpre / MKTpre1
- **ENTER**: enter / enterpass
- **MUSIC**: music / musicpass

---

## Project Management System

### ProjectManager Class

Singleton class สำหรับจัดการ project names ระหว่าง test runs

#### Properties
- `projects: Map<number, string>` - เก็บ project names ตาม index
- `currentIndex: number` - index ปัจจุบัน

#### Methods

**`register(name: string, index?: number): void`**
- ลงทะเบียน project name ใหม่
- ถ้าไม่ระบุ index จะใช้ขนาดปัจจุบันของ map

**`get(index: number = 0): string`**
- ดึง project name ตาม index
- Fallback: getStandardFallback() ถ้าไม่พบ

**`getAll(): string[]`**
- ดึง project names ทั้งหมด

**`getStandardFallback(): string`**
ลำดับ fallback:
1. formattedDateMain
2. formattedDateOntop
3. Cypress.env('formattedDateMain')
4. Cypress.env('formattedDate')
5. Cypress.env('projectName')
6. Cypress.env('formattedDateMainPONAME')
7. Cypress.env('formattedDateOntopPONAME')
8. Cypress.env('poName')

**`setCurrentIndex(index: number): void`**
- ตั้งค่า current index

**`getCurrentIndex(): number`**
- ดึง current index

**`clear(): void`**
- ลบข้อมูลทั้งหมด

**`runForAll(callback: (name: string, index: number) => void): void`**
- รัน callback สำหรับทุก project

### Project Name Functions

#### `registerProjectName(name: string, index: number = 0): void`
ลงทะเบียน project name

#### `getProjectNameByIndex(index: number = 0): string`
ดึง project name ตาม index

#### `runForAllProjects(callback: (projectName: string) => void): void`
รัน callback สำหรับทุก project

#### `getStandardProjectName(): string`
ดึง standard project name (fallback)

#### `getOntopProjectName(): string`
ดึง ontop project name (formattedDateOntop)

### Date/Time Utilities

#### `getTimeSuffix(): string`
รูปแบบ: `DDMM HHmm` (วันเดือน ชั่วโมงนาที)

#### `getTruncatedName(baseName: string, suffix: string, maxLength: number): string`
ตัดชื่อให้ไม่เกิน maxLength โดยคง suffix ไว้

---

## Product Offering Management

### Search Product Offering

**Search Section Fields:**

| Field Name | Type | Label | Max Length | Logic/Validation |
|------------|------|-------|------------|------------------|
| poGroup | Invisible | - | - | Default Value: poGroup จากหน้า Project Basic Information |
| downstreamSystemCode | TextBox | Downstream System Code | 50 | - |
| projectName | TextBox | Project Name | 255 | - |
| poName | TextBox | PO Name | 255 | - |
| poSubGroup | Drop Down List | PO Sub Group | - | ดูรายละเอียดด้านล่าง |
| productSpecification | Shuttle | Product Specification | - | Visible เมื่อ poSubGroup = "Product Offering" |
| projectOwner | TextBox | Project Owner | 50 | - |
| commercialLaunchDateFrom | Date | Commercial Launch Date: From | - | - |
| commercialLaunchDateTo | Date | Commercial Launch Date: To | - | อยู่บรรทัดเดียวกับ From |

**poSubGroup List of Value:**

ถ้า PO Group เป็น "Mass" หรือ "CRM":
- Product Offering, Account Fee, Order Fee, Cash Back, Service, Group PO Fee

ถ้า PO Group เป็น "FBB":
- Product Offering, Account Fee, Order Fee, Discount, Installation, Penalty

---

## Mass ENH Product Offering Definition (ENH)

**หมายเหตุ**: ในเอกสาร HLD ใช้ชื่อ "ENH" แต่ในโค้ดและระบบจริงใช้ "CKS" ซึ่งหมายถึงระบบเดียวกัน

### Field on Screen

| Field Name | Type | Label | Max Length | Validation |
|------------|------|-------|------------|------------|
| poName | Text Box | *PO Name | 255 (IR = 100) | ห้ามมี "=" |
| integrationName | Text Box | *Integration Name | 100 | ต้องตรงกับ poName ในบางกรณี |
| commercialNameEn | Text Box | *Commercial Name EN | 255 | Mandatory |
| commercialNameTh | Text Box | *Commercial Name TH | 255 | Mandatory |
| customerType | Drop Down List | Customer Type | - | Post-paid, Pre-paid, Hybrid Post, All |
| priceType | Drop Down List | Price Type | - | One-Time, Recurring |
| productClass | Drop Down List | Product Class | - | Main, On-Top, On-Top Extra |

### Script Validation

1. **PO Name Validation:**
   - Max Length: 40 ตัวอักษร (IR = 100)
   - ห้ามมีเครื่องหมาย "="
   - ห้ามมี Special Characters บางตัว

2. **Integration Name Validation:**
   - Max Length: 100 ตัวอักษร (IR Hybrid Post = 40)
   - ต้องมีค่าเดียวกันกับ poName ในบางกรณี

3. **Commercial Name Validation:**
   - Max Length: 255 ตัวอักษร (ทั้ง EN และ TH)
   - ต้องกรอกข้อมูล

### Mapping to DB

| UI Field | Database Table | Database Column |
|----------|---------------|-----------------|
| poName | PLM_PO_ENH | PO_NAME |
| integrationName | PLM_PO_ENH | INTEGRATION_NAME |
| commercialNameEn | MASS_ENH_PRODUCT_OFFERING | COMMERCIAL_NAME_EN |
| customerType | PLM_PO_ENH | CUSTOMER_TYPE |

---

## Voice Services

### Mass ENH Voice Free Resource

| Field | Type | Logic |
|-------|------|-------|
| commuFreeResource | Checkbox | Commu Free Resource flag |
| rewardVia | Drop Down List | Reward Via configuration |
| usageLocalizedFlag | Checkbox | Usage Localized flag |

**Validation:** Validate Free Call ใส่ขั้นต่ำ 0.01

**Table:** MASS_ENH_VOICE_FREE_RESOURCE

### Mass ENH Voice Rating

| Field | Type | Logic |
|-------|------|-------|
| voiceRate | Number | Voice Rate |
| stepUnit | Drop Down List | Step Unit |
| peakTimeFlag | Checkbox | Peak Time flag |
| deductType | Drop Down List | Deduct Type (สำหรับ Pre-paid) |

**Validation:** Validate Voice Rate (รองรับทศนิยม 3 ตำแหน่ง)

**Table:** MASS_ENH_VOICE_RATING

---

## SMS Services

### Mass ENH SMS Rating

| Field | Type | Logic |
|-------|------|-------|
| smsRate | Number | SMS Rate |
| stepUnit | Drop Down List | Step Unit |

**Validation:** Validate SMS Rate ตาม กสทช.

**Table:** MASS_ENH_SMS_RATING

---

## Internet Services

### Mass ENH Internet

| Field | Type | Logic |
|-------|------|-------|
| internetAlertThreshold | Number | Internet Alert Threshold |
| internetThrottlingSpeedPriority | Drop Down List | Internet Throttling Speed Priority |
| internetExceedRatePriority | Drop Down List | Internet Exceed Rate Priority |
| commuSpeed | Drop Down List | Commu Speed |
| commuThrottlingSpeed | Drop Down List | Commu Throttling Speed |
| maxRollOver | Number | Max Roll Over |

**Validation:** กรณี Prepaid Main Promotion จะต้องระบุ Internet Exceed Rate เสมอ

**Table:** MASS_ENH_INTERNET

---

## Content VDO

### Mass ENH Content VDO

| Field | Type | Logic |
|-------|------|-------|
| vdoBundleType | Drop Down List | VDO Bundle Type |
| vdoTargetGroup | Drop Down List | VDO Target Group |
| vdoPlatform | Drop Down List | VDO Platform |
| revenueAllocateExcVat | Text Box | Revenue Allocate (Excluding VAT) |
| revenueAllocateIncVat | Text Box | Revenue Allocate (Including VAT) |

**Validation:** Validate Content VDO ให้สอดคล้องกับ PS

**Table:** MASS_ENH_CONTENT_VDO

---

## Revenue Sharing

### Mass ENH Revenue Sharing

| Field | Type | Logic |
|-------|------|-------|
| effectiveStartDate | Date | Effective Start Date |
| effectiveEndDate | Date | Effective End Date |
| stepUnit | Drop Down List | Step Unit |
| shareAmountUnit | Drop Down List | Share Amount Unit |
| attachmentFile | File Upload | Attachment file |

**Validation:** Validate Share Amount, Validate Effective Start/End Date

**Table:** MASS_ENH_REVENUE_SHARING

---

## Human Touch Point

### Mass ENH Human Touch Point

| Field | Type | Logic |
|-------|------|-------|
| romId | Text Box | ROM ID (เมื่อเลือก ROM) |
| inSameProject | Checkbox | In Same Project (เมื่อเลือก ROM) |
| subscribeAccessNumber | Text Box | Subscribe Access Number (สำหรับ Prepaid) |
| unsubscribeAccessNumber | Text Box | Unsubscribe Access Number (สำหรับ Prepaid) |
| activeFlag | Checkbox | Active Flag (สำหรับ Call Center) |

**Validation:** Validate Subscribe Access Number

**Table:** MASS_ENH_HUMAN_TOUCH_POINT

---

## Application Channel

### Mass ENH Application Channel

| Field | Type | Logic |
|-------|------|-------|
| category | Text Box | Category |
| subCategory | Text Box | Sub Category |
| menu | Drop Down List | Menu |
| effectiveStartDate | Date | Effective Start Date |
| effectiveEndDate | Date | Effective End Date |

**Validation:** 
- Validate Category / Sub Category
- ห้ามใส่ Double Space และ Space หน้าหลัง เมื่อสร้าง Category ใหม่
- Check Unique ของ Category

**Table:** MASS_ENH_APPLICATION_CHANNEL

---

## SMS Wording

### Mass ENH SMS Wording Detail

| Field | Type | Logic |
|-------|------|-------|
| marketingName | Text Box | Marketing Name |
| smsGreeting | Text Area | SMS Greeting (Mandatory, 400 ตัวอักษร) |
| smsDelete | Text Area | SMS Delete (Mandatory) |
| shortPromotionNameTha | Text Box | Short Promotion Name THA (Count Byte) |
| messageCodeExpired | Text Box | Message Code Expired |
| billingDescription | Text Area | Billing Description (Your Package Name) |

**Validation:** 
- Validate SMS Greeting & Delete Section (Mandatory)
- Validate Short Promotion Name (ห้ามมี Special Characters, Count Byte)

**Table:** MASS_ENH_SMS_WORDING_DETAIL

---

## Script Validation Rules (Summary)

### General Validation Rules

1. **PO Name:**
   - Max Length: 40 ตัวอักษร (IR = 100)
   - ห้ามมี "="
   - ห้ามมี Special Characters

2. **Integration Name:**
   - Max Length: 100 ตัวอักษร (IR Hybrid Post = 40)
   - ต้องตรงกับ PO Name ในบางกรณี

3. **Commercial Name:**
   - Max Length: 255 ตัวอักษร (ทั้ง EN และ TH)
   - Mandatory Field

4. **Date Fields:**
   - End Date >= Start Date
   - รูปแบบวันที่ต้องถูกต้อง

5. **Numeric Fields:**
   - ใส่ได้เฉพาะตัวเลขและจุดทศนิยม
   - จำนวนทศนิยมตามที่กำหนด (ปกติ 2-3 ตำแหน่ง)

6. **Revenue Code:**
   - ต้องมีสำหรับ Postpaid
   - ต้องไม่ซ้ำกัน

7. **Partner App ID:**
   - ต้องไม่ซ้ำกัน
   - Mandatory สำหรับ Music Streaming

---

## Database Mapping (Summary)

**หมายเหตุ**: ตารางฐานข้อมูลใช้ชื่อ `ENH` ตามเอกสาร HLD แต่ในโค้ดอาจเรียกเป็น CKS ซึ่งหมายถึงระบบเดียวกัน

### Main Tables

| Table Name | Description |
|------------|-------------|
| PLM_PO_ENH | Main Product Offering ENH (ENH) |
| PLM_PO_DETAIL_ENH | Product Offering Detail ENH (ENH) |
| MASS_ENH_PRODUCT_OFFERING | Mass ENH Product Offering (ENH) |
| MASS_ENH_VOICE_FREE_RESOURCE | Voice Free Resource (ENH) |
| MASS_ENH_VOICE_RATING | Voice Rating (ENH) |
| MASS_ENH_SMS_RATING | SMS Rating (ENH) |
| MASS_ENH_INTERNET | Internet Configuration (ENH) |
| MASS_ENH_CONTENT_VDO | Content VDO (ENH) |
| MASS_ENH_REVENUE_SHARING | Revenue Sharing (ENH) |
| MASS_ENH_HUMAN_TOUCH_POINT | Human Touch Point (ENH) |
| MASS_ENH_APPLICATION_CHANNEL | Application Channel (ENH) |
| MASS_ENH_SMS_WORDING_DETAIL | SMS Wording Detail (ENH) |

### Reference Tables

| Table Name | Description |
|------------|-------------|
| FLW_CFG_LOV | List of Values configuration |
| MASS_PRIORITY_CONFIG | Priority configuration |
| MASS_INTERNET_SPEED_CONFIG | Internet speed configuration |
| PLM_PRODUCT_SPECIFICATION | Product Specification |

---

## Appendix

### List of Values (LOV)

#### Customer Type
- Post-paid
- Pre-paid
- Hybrid Post
- All

#### Product Class
- Main
- On-Top
- On-Top Extra

#### Price Type
- One-Time
- Recurring

---

## Approval Workflow Functions

### Claim Project Functions

#### `ClaimProject(projectName: string, options?: { claimBy?: 'project' | 'po' }): void`
_claim project จาก Unassigned Task_

**Parameters:**
- `projectName`: ชื่อ project
- `options.claimBy`: 
  - `'project'`: claim ครั้งเดียว
  - `'po'`: claim ตามจำนวน PO (default)

**Logic:**
- ค้นหาใน Unassigned Task table พร้อม pagination (สูงสุด 3 หน้า)
- กดปุ่ม claim-top เมื่อพบ
- ยืนยันว่าย้ายไป To Do List แล้ว

### Approve Project Functions

#### `approveProject(projectName: string): void`
_approve project หลัก_

#### `assignTeamTask(header: TaskListHeader, projectName: string, action: FinalAction): void`
_assign task ให้ team member_

**Parameters:**
- `header`: 'To Do List' หรือ 'Unassigned Task'
- `projectName`: ชื่อ project
- `action`: 
  - 'AlertAndLogout': แจ้งเตือนและ logout
  - 'ComplexLogout': complex logout
  - 'StopAfterCore': หยุดหลัง core tasks

### SPAD Approval Functions

| Function | Description |
|----------|-------------|
| `approveProjectSPADSup(projectName)` | SPAD Supervisor approve (complex) |
| `approveProjectSPADSupCGMDPlugin(projectName)` | SPAD Supervisor approve (CGMD plugin) |
| `approveProjectSPAD(projectName, isComplex)` | SPAD approve (configurable) |
| `approveProjectSPADDOER(projectName)` | SPAD DOER approve |
| `approveProjectSPADDOERMain(projectName)` | SPAD DOER approve (main flow) |
| `approveProjectSPADTester(projectName)` | SPAD Tester approve |
| `approveProjectSPADTesterMain(projectName)` | SPAD Tester approve (main flow) |
| `approveProjectSPADdeploy(projectName)` | SPAD Deploy approve |

### CGMD Approval Functions

| Function | Description |
|----------|-------------|
| `approveProjectCGMD(projectName)` | CGMD Config approve (POST) |
| `approveProjectCGMDPRE(projectName)` | CGMD Config approve (PRE) |
| `approveProjectCGMDPREMainNotComplex(projectName)` | CGMD PRE main (not complex) |
| `approveProjectCGMDPREPlugin(projectName)` | CGMD PRE plugin |
| `approveProjectCGMDPREMain(projectName)` | CGMD PRE main |
| `approveProjectCGMDtester(projectName)` | CGMD Tester approve (POST) |
| `approveProjectCGMDtesterPRE(projectName)` | CGMD Tester approve (PRE) |
| `approveProjectCGMDtesterPREPlugin(projectName)` | CGMD Tester PRE plugin |

### Other Role Approval Functions

| Function | Description |
|----------|-------------|
| `approveProjectACTM(projectName)` | ACTM approve |
| `approveProjectOPER(projectName)` | OPER approve |
| `approveProjectTSCenter(projectName)` | TS Center approve |
| `approveProjectAPO(projectName)` | APO approve |
| `performMusicRoles()` | Music roles workflow |

### Before/After Approval Functions

#### Before Approve
- `beforeapproveENH()`: ENH before approve
- `beforeapproveENHontop()`: ENH ontop before approve
- `beforeapproveMKT()`: MKT before approve

#### After Approve (POST)
- `afterENHPOST(Module?)`: ENH after approve (POST)
- `afterMKTontopPOST()`: MKT ontop after approve (POST)
- `afterMKTontopENTER()`: MKT ontop after approve (ENTER)
- `afterMKTontopMUSIC()`: MKT ontop after approve (MUSIC)
- `afterMKTothersubgroup(PoSubGroup, Module)`: Other subgroup after approve
- `afterMKTMAINPOST()`: MKT main after approve (POST)
- `afterMKTMainUsagePOST`: Alias ของ afterMKTMAINPOST

#### After Approve (PRE)
- `afterENHCommonPRE(Module)`: ENH common after approve (PRE)
- `afterENHPREPlugin(Module)`: ENH PRE plugin
- `afterMKTMainPRE_FullSpadFlow()`: MKT main PRE (full SPAD flow)
- `afterMKTMainPRE_NotComplex()`: MKT main PRE (not complex)
- `afterMKTOntop_NotComplex()`: MKT ontop (not complex)
- `afterMKTontopPRE()`: MKT ontop PRE
- `afterMKTontopPREENTER()`: MKT ontop PRE ENTER
- `afterMKTontopPREENTERPlugin()`: MKT ontop PRE ENTER plugin
- `afterMKTontopPREMusicPlugin()`: MKT ontop PRE Music plugin
- `afterMKTontopPREMUSIC()`: MKT ontop PRE MUSIC
- `afterMKTontopPREUsage()`: MKT ontop PRE Usage
- `afterMKTontopPREUsageEnter()`: MKT ontop PRE Usage Enter
- `afterMKTontopPREUsageMusic()`: MKT ontop PRE Usage Music

---

## Service Configuration Functions

### Dropdown & Selection Functions

#### `Randomdropdown(): void`
สุ่มเลือก dropdown option

#### `selectRandomOption(labelName: string): void`
สุ่มเลือก option จาก mat-select

#### `dropdownRecurringENH(): void`
ตั้งค่า recurring dropdown (ENH)

#### `dropdownRecurringENHMain(): void`
ตั้งค่า recurring dropdown (ENH Main)

#### `dropdownRecurringPreMainENH(): void`
ตั้งค่า recurring dropdown (PRE Main ENH)

#### `dropdownPromotionGroup(): void`
ตั้งค่า promotion group dropdown

#### `selectTargetGroup(type: ...): void`
เลือก target group

#### `targetgroup(): void`
ตั้งค่า target group

### Project Basic Information

#### `ProjectBasicInformationComplete(options: ProjectBasicOptions): void`
กรอกข้อมูล Project Basic Information ครบถ้วน

**Options:**
- `Module`: 'POST' | 'PRE' | 'ENTER' | 'MUSIC'
- `subModule`: 'POST' | 'PRE' (optional)
- `autoSetDuration`: boolean (optional)
- `Plugin`: string (optional)

#### `ProjectBasicInformationCompleteOtherPOSub(...): void`
กรอกข้อมูลสำหรับ Other PO Sub Group

### Tariff & Pricing

#### `Tariff(): void`
ตั้งค่า tariff

#### `PriceExcluding(): void`
ตั้งค่า price excluding VAT

### Retry & File Upload

#### `RetryPattern(): void`
ตั้งค่า retry pattern

#### `addFile(): void`
เพิ่ม attachment file

### SMS Wording Functions

| Function | Description |
|----------|-------------|
| `smsWording()` | SMS wording (POST) |
| `smsWordingpre()` | SMS wording (PRE) |
| `smsENHPRE()` | SMS ENH (PRE) |
| `smsENHPOST()` | SMS ENH (POST) |

### Product Specification

#### `RandomProductSpecification(...): void`
สุ่มเลือก product specification

### Voice Services

#### `Voice(fillRating?: boolean): void`
ตั้งค่า voice services
- **fillRating**: ถ้า true จะกรอก rating data ด้วย

### MMS/SMS Services

| Function | Description |
|----------|-------------|
| `Mms(fillRating?)` | MMS configuration |
| `Sms(fillRating?)` | SMS configuration |

### WiFi Services

#### `WiFi(): void`
ตั้งค่า WiFi services

### Vertical App & Content

| Function | Description |
|----------|-------------|
| `VerticalApp()` | Vertical app configuration |
| `CloudGame()` | Cloud game configuration |
| `EntertainmentPartnership(platforms)` | Entertainment partnership |
| `AIIPCamera()` | AI IP Camera configuration |
| `Karaoke()` | Karaoke configuration |
| `MusicStreaming()` | Music streaming configuration |
| `VRBT()` | VRBT configuration |

### Internet Services

#### `InternetRandom(ProductClass, subModule?, Module?): void`
ตั้งค่า internet services แบบสุ่ม

**Parameters:**
- `ProductClass`: 'main' | 'ontop' | 'ontopextra'
- `subModule`: 'POST' | 'PRE' (optional)
- `Module`: 'POST' | 'PRE' | 'ENTER' | 'MUSIC' (optional)

#### `checkAndUpdatePriority(): void`
ตรวจสอบและอัปเดต priority

### Human Touch Point

#### `RandomHumanTouchPoint(subModule: string): void`
ตั้งค่า human touch point แบบสุ่ม

### Utility Functions

| Function | Description |
|----------|-------------|
| `handleAddToUSMP()` | Handle Add to USMP button |
| `scrollAndWait(ms?)` | Scroll to bottom และรอ |
| `clickYesIfExists(timeout, position)` | คลิก Yes ถ้ามี |
| `clickButtonIfExists(buttonText, timeout)` | คลิก button ถ้ามี |
| `getRandomPhone()` | สร้าง random phone number |
| `backBacicInfo()` | กลับไป Basic Info |
| `CopyDeductFail(pageType)` | Copy deduct fail configuration |

### ENH Special Functions

| Function | Description |
|----------|-------------|
| `unregister()` | Unregister configuration |
| `addauto5gENH()` | Add auto 5G (ENH) |
| `diyflagENH()` | DIY flag (ENH) |

---

## Script Validation Rules

### General Validation Rules

1. **PO Name:**
   - Max Length: 40 ตัวอักษร (IR = 100)
   - ห้ามมี "="
   - ห้ามมี Special Characters

2. **Integration Name:**
   - Max Length: 100 ตัวอักษร (IR Hybrid Post = 40)
   - ต้องตรงกับ PO Name ในบางกรณี

3. **Commercial Name:**
   - Max Length: 255 ตัวอักษร (ทั้ง EN และ TH)
   - Mandatory Field

4. **Date Fields:**
   - End Date >= Start Date
   - รูปแบบวันที่ต้องถูกต้อง

5. **Numeric Fields:**
   - ใส่ได้เฉพาะตัวเลขและจุดทศนิยม
   - จำนวนทศนิยมตามที่กำหนด (ปกติ 2-3 ตำแหน่ง)

6. **Revenue Code:**
   - ต้องมีสำหรับ Postpaid
   - ต้องไม่ซ้ำกัน

7. **Partner App ID:**
   - ต้องไม่ซ้ำกัน
   - Mandatory สำหรับ Music Streaming

### Helper Functions

#### `selectDropdownOption<T>(controlName, label, options, value?)`
เลือก dropdown option พร้อม validation

#### `selectMatOption(matSelect, optionValue, optionLabel?)`
เลือก Angular Material option

#### `selectMatOptionWithValidation(controlName, optionValue, expectedLabel?)`
เลือก option พร้อม validate label

#### `isPreModule(productClass, subModule?): boolean`
ตรวจสอบว่าเป็น PRE module หรือไม่

#### `handleLimitedData(productClass, subModule?)`
จัดการ limited data configuration

#### `handlePayPerUse()`
จัดการ pay per use configuration

#### `handleUnlimitedFixedSpeed(productClass, subModule?)`
จัดการ unlimited fixed speed

#### `handleUnlimitedThrottling(productClass, subModule?)`
จัดการ unlimited throttling

---

## Database Mapping

### Main Tables

| Table Name | Description |
|------------|-------------|
| PLM_PO_ENH | Main Product Offering ENH (CKS) |
| PLM_PO_DETAIL_ENH | Product Offering Detail ENH (CKS) |
| MASS_ENH_PRODUCT_OFFERING | Mass ENH Product Offering |
| MASS_ENH_VOICE_FREE_RESOURCE | Voice Free Resource |
| MASS_ENH_VOICE_RATING | Voice Rating |
| MASS_ENH_SMS_RATING | SMS Rating |
| MASS_ENH_INTERNET | Internet Configuration |
| MASS_ENH_CONTENT_VDO | Content VDO |
| MASS_ENH_REVENUE_SHARING | Revenue Sharing |
| MASS_ENH_HUMAN_TOUCH_POINT | Human Touch Point |
| MASS_ENH_APPLICATION_CHANNEL | Application Channel |
| MASS_ENH_SMS_WORDING_DETAIL | SMS Wording Detail |

### Reference Tables

| Table Name | Description |
|------------|-------------|
| FLW_CFG_LOV | List of Values configuration |
| MASS_PRIORITY_CONFIG | Priority configuration |
| MASS_INTERNET_SPEED_CONFIG | Internet speed configuration |
| PLM_PRODUCT_SPECIFICATION | Product Specification |

---

## Type Definitions

### Module Types
```typescript
type Module = 'POST' | 'PRE' | 'ENTER' | 'MUSIC';
```

### Price Types
```typescript
type PriceType = 'onetime' | 'recurring' | 'usage';
```

### Product Classes
```typescript
type ProductClass = 'main' | 'ontop' | 'ontopextra';
```

### Task List Headers
```typescript
type TaskListHeader = 'To Do List' | 'Unassigned Task';
```

### Final Actions
```typescript
type FinalAction = 'AlertAndLogout' | 'ComplexLogout' | 'StopAfterCore';
```

### Callback Types
```typescript
type CoreTaskCallback = () => void;
type ApproveFunction = (projectName: string) => void;
type GetProjectNameFn = () => string;
```

### Interface: ProjectBasicOptions
```typescript
interface ProjectBasicOptions {
  Module: Module;
  subModule?: 'POST' | 'PRE';
  autoSetDuration?: boolean;
  Plugin?: string;
}
```

### Internet Quota Types
```typescript
type InternetQuotaType =
  | 'Limited Data'
  | 'Pay Per Use'
  | 'Unlimited Fixed Speed'
  | 'Unlimited Throttling';
```

### Flow Patterns
```typescript
type FlowPattern = 
  | 'CGMD_FIRST'
  | 'SPAD_FIRST'
  | 'INTERLEAVED'
  | 'CGMD_SPAD_ALTERNATE_C'
  | 'CGMD_SPAD_ALTERNATE_S'
  | 'RANDOM';
```

### Test Entry
```typescript
type TestEntry = { 
  name: string; 
  group: 'CGMD' | 'SPAD' | 'OTHER'; 
  fn: () => void 
};
```

---

## Constants & Configuration

### Internet Speeds
```typescript
const INTERNET_SPEEDS = [
  '4Mbps', '8Mbps', '16Mbps', '32Mbps', '50Mbps',
  '100Mbps', '200Mbps', '500Mbps', '1Gbps'
];
```

### Throttling Speeds
```typescript
const THROTTLING_SPEEDS = [
  '64Kbps', '128Kbps', '256Kbps', '384Kbps',
  '512Kbps', '1Mbps', '2Mbps', '4Mbps'
];
```

### Priority Quota Types
```typescript
const ALL_PRIORITY_QUOTA_TYPES = [
  'QCI1', 'QCI2', 'QCI3', 'QCI4', 'QCI5',
  'QCI6', 'QCI7', 'QCI8', 'QCI9'
];
```

### Abbreviations Mapping
```typescript
const ABBREVIATIONS: Record<string, string> = {
  'MAIN': 'MN',
  'ONTOP': 'OT',
  'ONTOP_EXTRA': 'OE',
  // ... และอื่นๆ
};
```

### SPAD Order
```typescript
const SPAD_ORDER = ['Spadsup', 'Spaddoer', 'Spadtester', 'Spaddeploy'];
```

### CGMD Order
```typescript
const CGMD_ORDER = ['Config', 'Tester'];
```

---

**Document Version:** 3.20  
**Last Updated:** 18/03/2025  
**Author:** Suchanan  
**Based on:** 
- Mass Mobile PLM HLD V.3.23_ENH.docx
- Master.ts (Cypress Test Framework)
