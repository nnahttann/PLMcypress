# Skills Documentation - Mass Mobile PLM Test Automation

## Overview
เอกสารนี้รวบรวมทักษะและฟังก์ชันทั้งหมดที่ใช้ในการทดสอบระบบ **Mass Mobile PLM (Product Lifecycle Management)** โดยอ้างอิงจากไฟล์ `Master.ts` และเอกสาร High-Level Design (HLD) ของระบบ

---

## Table of Contents
1. [Environment Configuration](#1-environment-configuration)
2. [Project Management System](#2-project-management-system)
3. [Authentication Functions](#3-authentication-functions)
4. [Helper Functions](#4-helper-functions)
5. [Project Claim & Approval Workflow](#5-project-claim--approval-workflow)
6. [Role-Based Approval Functions](#6-role-based-approval-functions)
7. [Product Configuration Functions](#7-product-configuration-functions)
8. [PO (Product Offering) Enhancement](#8-po-product-offering-enhancement)
9. [SMS Wording & Communication](#9-sms-wording--communication)
10. [Internet & Data Services](#10-internet--data-services)
11. [Vertical Application Services](#11-vertical-application-services)
12. [Content & Entertainment Services](#12-content--entertainment-services)
13. [Rating & Billing Functions](#13-rating--billing-functions)
14. [Target Group & Market Segment](#14-target-group--market-segment)
15. [Human Touch Point Management](#15-human-touch-point-management)
16. [Retry Pattern & Balance Management](#16-retry-pattern--balance-management)
17. [SIM Management](#17-sim-management)
18. [Bulk Modification Functions](#18-bulk-modification-functions)

---

## 1. Environment Configuration

### 1.1 Environment Variables Extraction
```typescript
export const {
  urlsit,
  MKTpre, MKTpre1,        // Marketing Pre-paid credentials
  MKTpost, MKTpost1,      // Marketing Post-paid credentials
  cks, ckspass,           // CKS (Check System) credentials
  cgcirb, cgcirbpass,     // CGC IRB credentials
  cgccbs, cgccbspass,     // CGC CBS credentials
  cgtcbs, cgtcbspass,     // CGT CBS credentials
  cgtirb, cgtirbpass,     // CGT IRB credentials
  actm, actmpass,         // ACTM credentials
  oper, operpass,         // Operator credentials
  spadsup, spadsuppass,   // SPAD Supervisor credentials
  spaddoer, spaddoerpass, // SPAD Doer credentials
  spadtest, spadtestpass, // SPAD Tester credentials
  spaddp, spaddppass,     // SPAD Deploy credentials
  apo, apopass,           // APO credentials
  enter, enterpass,       // Enterprise credentials
  music, musicpass,       // Music credentials
  tscenter, tscenterpass, // TS Center credentials
  aafsp, aafsppass,       // AAFSP credentials
  csisp, csisppass,       // CSISP credentials
  e2etest, e2etestpass,   // E2E Test credentials
  aafdp, aafdppass,       // AAFDP credentials
  csidp, csidppass,       // CSIDP credentials
  e2edp, e2edppass,       // E2EDP credentials
  sasff, sasffpass        // SASFF credentials
} = env as Record<string, string>;
```

**Purpose:** ดึงค่า environment variables จาก Cypress configuration สำหรับใช้งานในระบบทดสอบ

### 1.2 Date & Time Utilities
```typescript
export const now = new Date();
export let formattedDateMain = '';
export let formattedDateOntop = '';
```

**Functions:**
- **getTimeSuffix()**: สร้าง timestamp format `DDMM HHmm` สำหรับใช้เป็นส่วนท้ายของชื่อโปรเจกต์
- **getTruncatedName()**: ตัดชื่อให้มีความยาวไม่เกินกำหนด โดยคง suffix ไว้

---

## 2. Project Management System

### 2.1 ProjectManager Class
Singleton pattern สำหรับจัดการชื่อโปรเจกต์ทั้งหมดใน session

**Methods:**
| Method | Description |
|--------|-------------|
| `register(name, index?)` | ลงทะเบียนชื่อโปรเจกต์ใหม่ |
| `get(index)` | ดึงชื่อโปรเจกต์ตาม index |
| `getAll()` | ดึงรายชื่อโปรเจกต์ทั้งหมด |
| `getStandardFallback()` | ดึงชื่อโปรเจกต์มาตรฐานจาก environment |
| `setCurrentIndex(index)` | ตั้งค่า index ปัจจุบัน |
| `getCurrentIndex()` | ดึง index ปัจจุบัน |
| `clear()` | ลบข้อมูลโปรเจกต์ทั้งหมด |
| `runForAll(callback)` | รัน callback สำหรับทุกโปรเจกต์ |

### 2.2 Project Registration Functions
```typescript
export const registerProjectName = (name: string, index: number = 0): void
export const getProjectNameByIndex = (index: number = 0): string
export const runForAllProjects = (callback: (projectName: string) => void): void
export const getStandardProjectName = (): string
export const getOntopProjectName = (): string
```

---

## 3. Authentication Functions

### 3.1 Login Functions
```typescript
export const login = (username: string, password: string): void
export const loginAndWaitReady = (username: string, password: string): void
```

**Features:**
- ตรวจสอบการปรากฏตัวของ login form
- พิมพ์ username/password ด้วย delay 150ms
- Intercept API call `/plm-error-code/getAll` เพื่อรอจนกว่าจะ login สำเร็จ
- รองรับ timeout สูงสุด 30 วินาที

### 3.2 Credential Helper
```typescript
export const getCredentials = (module: Module): { user: string, pass: string }
```
**Modules Supported:** POST, PRE, ENTER, MUSIC

---

## 4. Helper Functions

### 4.1 UI Interaction Helpers
| Function | Description |
|----------|-------------|
| `selectRandomOption(labelName)` | เลือก option แบบสุ่มจาก mat-select |
| `scrollAndWait(ms)` | Scroll ไปด้านล่างและรอ |
| `clickYesIfExists(timeout, position)` | คลิกปุ่ม Yes ถ้ามีอยู่ |
| `clickButtonIfExists(buttonText, timeout)` | คลิกปุ่มตามข้อความถ้ามีอยู่ |
| `handleAddToUSMP()` | จัดการปุ่ม "Add to USMP" และปิด modal |
| `getRandomPhone()` | สร้างเบอร์โทรศัพท์สุ่ม (08xxxxxxxxx) |

### 4.2 Pagination Helper
```typescript
const searchInTableWithPagination(
  sectionHeader: string,
  searchText: string,
  rowCallback: ($row: JQuery, index: number) => void,
  options?: { waitAfterNext?: number; filterCallback?: Function }
): void
```
**Features:**
- ค้นหาข้อความในตารางที่มีการแบ่งหน้า
- รองรับการ filter ด้วย callback function
- Auto navigate ไปหน้าถัดไปจนกว่าจะพบหรือหมดหน้า

---

## 5. Project Claim & Approval Workflow

### 5.1 Claim Project Function
```typescript
export const ClaimProject = (
  projectName: string, 
  options?: { claimBy?: 'project' | 'po' }
): void
```

**Modes:**
- **claimBy = 'project'**: Claim โปรเจกต์ครั้งเดียว
- **claimBy = 'po'**: Claim ทีละ PO ตามจำนวนที่กำหนด

**Process Flow:**
1. รอให้ "Unassigned Task" พร้อมใช้งาน
2. ค้นหาโปรเจกต์/PO ในตาราง (สูงสุด 3 หน้า)
3. คลิกปุ่ม claim
4. ยืนยันว่าโปรเจกต์ย้ายไปอยู่ใน "To Do List"

### 5.2 Approve Project Base Function
```typescript
export const approveProject = (projectName: string): void
```
**Steps:**
1. Claim โปรเจกต์
2. รอให้โหลด To Do List
3. คลิก approve
4. ตรวจสอบสถานะ

### 5.3 Approval Flow Creators
| Function | Description |
|----------|-------------|
| `createFullPageApprovalFlow()` | สร้าง flow การอนุมัติแบบเต็มหน้า |
| `createSimplePageApprovalFlow()` | สร้าง flow การอนุมัติแบบง่าย |

---

## 6. Role-Based Approval Functions

### 6.1 SPAD (Service Product Approval Department) Roles

#### SPAD Supervisor
```typescript
export const approveProjectSPADSup = (projectName: string): void
export const approveProjectSPADSupCGMDPlugin = (projectName: string): void
export const approveProjectSPAD = (projectName: string, isComplex = true): void
```

#### SPAD Doer
```typescript
export const approveProjectSPADDOER = (projectName: string): void
export const approveProjectSPADDOERMain = (projectName: string): void
```

#### SPAD Tester
```typescript
export const approveProjectSPADTester = (projectName: string): void
export const approveProjectSPADTesterMain = (projectName: string): void
```

#### SPAD Deploy
```typescript
export const approveProjectSPADdeploy = (projectName: string): void
```
**Features:**
- Poll จนกว่า SPAD Deploy จะพร้อม (สูงสุด 24 attempts, interval 5 วินาที)
- ตรวจสอบสถานะ deployment

### 6.2 CGMD (Configuration Management) Roles
```typescript
export const approveProjectCGMD = (projectName: string): void
export const approveProjectCGMDPRE = (projectName: string): void
export const approveProjectCGMDPREMainNotComplex = (projectName: string): void
export const approveProjectCGMDPREPlugin = (projectName: string): void
export const approveProjectCGMDPREMain = (projectName: string): void
export const approveProjectCGMDtester = (projectName: string): void
export const approveProjectCGMDtesterPRE = (projectName: string): void
export const approveProjectCGMDtesterPREPlugin = (projectName: string): void
```

### 6.3 Other Roles
| Function | Role |
|----------|------|
| `approveProjectACTM(projectName)` | ACTM Approver |
| `approveProjectOPER(projectName)` | Operator |
| `approveProjectTSCenter(projectName)` | TS Center |
| `approveProjectAPO(projectName)` | APO Approver |

### 6.4 Role Execution Framework
```typescript
const performApprovalRole(
  role: string,
  username: string,
  password: string,
  projectName: string,
  approvalFn: (name: string) => void,
  postApprovalFn?: () => void
): void

const performRoleTaskWithAssignment(
  role: string,
  username: string,
  password: string,
  projectName: string,
  assignee: string,
  billingSystem?: string
): void

const performSimpleApprovalRole(
  role: string,
  username: string,
  password: string,
  projectName: string,
  approvalFn: (name: string) => void
): void
```

### 6.5 Task Assignment
```typescript
const assignTaskViaTracking = (
  projectName: string, 
  assignee: string, 
  billingSystem?: string
): void
```

---

## 7. Product Configuration Functions

### 7.1 Project Basic Information
```typescript
export const ProjectBasicInformationComplete = (
  options: ProjectBasicOptions
): void

export const ProjectBasicInformationCompleteOtherPOSub = (
  Module: Module,
  subModule?: 'POST' | 'PRE',
  Plugin?: string
): void
```

**Parameters:**
- `Module`: POST | PRE | ENTER | MUSIC
- `subModule`: POST | PRE (optional)
- `autoSetDuration`: boolean (optional)
- `Plugin`: string (optional)

### 7.2 Tariff & Pricing
```typescript
export const Tariff = (): void
export const PriceExcluding = (): void
```

### 7.3 Target Group Selection
```typescript
export const selectTargetGroup = (type: string): void
export const dropdownPromotionGroup = (): void
export const targetgroup = (): void
```

### 7.4 Retry Pattern
```typescript
export const RetryPattern = (): void
```
**Configures:**
- Retry count
- Retry interval
- Retry conditions

### 7.5 Basic Info Navigation
```typescript
export const backBacicInfo = (): void
export const addFile = (): void
```

---

## 8. PO (Product Offering) Enhancement

### 8.1 PO Enhancement Logic (จาก HLD)
**Split PO Mass to PO Mass Enh:**
เมื่อ Submit Project จาก MKT Checker ไปที่ CKS Doer ระบบจะ Generate:
- PO ENH
- PO FEE ENH
- PO Cash Back ENH
- Split PO ENH

### 8.2 Default Values After Split
#### Internet
- Internet Alert Threshold
- Internet Throttling Speed Priority
- Internet Exceed Rate Priority
- Internet Quota Priority
- Internet Fixed Speed Priority

**Priority Calculation:**
```
PS_NAME = "Internet"
USAGE_TYPE = InternetUsageType
PRICE_TYPE_PATTERN = priceTypePattern ของ internetQuota ที่เลือก
PACKAGE_TYPE = "Free" (ถ้า chargeExcVat = 0 ทุก Row) หรือ "Charge"
SPEED_KBPS = convert จาก MASS_INTERNET_SPEED_CONFIG
STATUS = "Active"
```

### 8.3 CKS PO Enhancement Functions
```typescript
const enhanceSinglePO = (
  Module: Module,
  PriceType: PriceType,
  ProductClass: ProductClass,
  projectName: string,
  poName: string,
  subModule?: string
): void

const standardCksPoEnhancementFlow = (
  Module: Module,
  PriceType: PriceType,
  ProductClass: ProductClass,
  options?: { skipEnhancement?: boolean }
): void
```

### 8.4 PO Field Fillers
| Function | Description |
|----------|-------------|
| `fillServicePOFields()` | กรอกข้อมูล Service PO |
| `fillCashBackPOFields()` | กรอกข้อมูล Cash Back PO |
| `fillStandardPOFields()` | กรอกข้อมูล Standard PO |
| `fillCashBackDiscountConfig()` | กำหนดค่า Cash Back Discount |
| `setPriceVAT()` | ตั้งค่าราคาและ VAT |

### 8.5 Before/After Approval Hooks
```typescript
export const beforeapproveCKS = (): void
export const beforeapproveCKSontop = (): void
export const beforeapproveMKT = (): void

export const afterCKSPOST = (Module?: string): void
export const afterCKSCommon = (Module: string): void
export const afterCKSCommonPRE = (Module: string): void
export const afterCKSPREPlugin = (Module: string): void

export const afterMKTontopPOST = (): void
export const afterMKTontopENTER = (): void
export const afterMKTontopMUSIC = (): void
export const afterMKTMAINPOST = (): void
export const afterMKTMainUsagePOST = (): void
export const afterMKTOntop_NotComplex = (): void
export const afterMKTMainPRE_FullSpadFlow = (): void
export const afterMKTMainPRE_NotComplex = (): void
```

---

## 9. SMS Wording & Communication

### 9.1 SMS Wording Functions
```typescript
export const smsWording = (): void          // POST
export const smsWordingpre = (): void       // PRE
export const smsCKSPRE = (): void
export const smsCKSPOST = (): void
```

**HLD Requirements:**
- **Post-paid**: Copy remark มาไว้ที่ remarkMkt
- **Pre-paid**: 
  - Copy Short Promotion Name En → Feature Description
  - Copy Commercial Launch Date → Effective Start Date

### 9.2 SMS Wording Detail Fields
- SMS Header
- SMS Content (Thai/English)
- SMS Trigger Condition
- Customer Segment

---

## 10. Internet & Data Services

### 10.1 Internet Configuration
```typescript
export const InternetRandom = (
  ProductClass: string, 
  subModule?: string, 
  Module?: string
): void
```

**Configuration Options:**
| Type | Description |
|------|-------------|
| Limited Data | กำหนด quota จำกัด |
| Pay Per Use | คิดเงินตามการใช้งานจริง |
| Unlimited Fixed Speed | ไม่จำกัดความเร็วคงที่ |
| Unlimited Throttling | ไม่จำกัดแต่ลดความเร็วหลังใช้เกิน |

### 10.2 Internet Speed Configurations
```typescript
const INTERNET_SPEEDS = [...]
const THROTTLING_SPEEDS = [...]
```

### 10.3 Priority Management
```typescript
export const checkAndUpdatePriority = (): void
const updatePriorityInPanel = (): void
```

**Priority Types:**
- Alert Threshold Priority
- Throttling Speed Priority
- Exceed Rate Priority
- Quota Priority
- Fixed Speed Priority

**Calculation Logic:**
```typescript
randomPriority = String(Math.floor(Math.random() * 99) + 1)
```

### 10.4 Internet Component Handler
```typescript
const INTERNET_COMPONENT = 'app-mass-enh-internet'
const ALL_PRIORITY_QUOTA_TYPES = [...]
const getInternetDetailPanelBody = ($component: JQuery): JQuery
```

---

## 11. Vertical Application Services

### 11.1 Vertical App Configuration
```typescript
export const VerticalApp = (): void
const checkAndFillContentType = (): void
export const checkAndUpdateVerticalAppPriority = (): void
```

**Component:** `app-mass-enh-vertical-app`

### 11.2 Content Type Handling
- Arcade Games
- TV Plus
- YouTube Premium
- Music Streaming
- AI IP Camera
- Karaoke

---

## 12. Content & Entertainment Services

### 12.1 Voice Services
```typescript
export const Voice = (fillRating = true): void
```
**Sub-services:**
- Voice Free Resource
- Voice Free Resource on Shelf
- Voice FN (Fixed Network)
- Voice B Number
- Voice Rating
- VDO Call Rating
- Landline Rating

### 12.2 SMS/MMS Services
```typescript
export const Sms = (fillRating = true): void
export const Mms = (fillRating = true): void
```

### 12.3 WiFi Services
```typescript
export const WiFi = (): void
```

### 12.4 Entertainment Partnership
```typescript
export const EntertainmentPartnership = (
  platforms: Array<'Arcade' | 'TV Plus' | 'Youtube Premium'>
): void
```

### 12.5 Specialized Content
| Function | Service Type |
|----------|-------------|
| `CloudGame()` | Cloud Gaming |
| `AIIPCamera()` | AI IP Camera |
| `Karaoke()` | Karaoke Service |
| `MusicStreaming()` | Music Streaming |
| `VRBT()` | Video Ring Back Tone |

---

## 13. Rating & Billing Functions

### 13.1 Rating Configuration
**Supported Rating Types:**
- Voice Rating
- VDO Call Rating
- Landline Rating
- SMS Rating
- MMS Rating
- Internet Rating
- WiFi Rating

### 13.2 Bill Presentment (จาก HLD)
- Discount Carry Forward
- Actual Usage Voice
- Bill Presentment Configuration

### 13.3 Revenue Allocation
```typescript
// Mass Enh Revenue Allocate
// Field on Screen + Script Validation + Mapping to DB
```

### 13.4 Change Promotion Fee
```typescript
// Mass Enh Change Promotion Fee
// Field on Screen + Script Validation + Mapping to DB
```

---

## 14. Target Group & Market Segment

### 14.1 Target Group Configuration
```typescript
export const selectTargetGroup = (type: string): void
export const targetgroup = (): void
```

**Types:**
- All
- Post-paid Only
- Pre-paid Only
- Enterprise
- Music

### 14.2 Market Segment
```typescript
// Mass Enh Market Segment
// Field on Screen + Script Validation + Mapping to DB
```

### 14.3 Human Touch Point
```typescript
export const RandomHumanTouchPoint = (subModule: string): void
```

**HLD Logic:**
- ถ้า humanTouchPoint ประกอบด้วย "SPD Promotion Catalog (SOSD)"
- Default ค่า sosdRegister เป็น "Special"

---

## 15. Human Touch Point Management

### 15.1 Touch Point Types
```typescript
// Mass Enh Human Touch Point
// Mass Enh Non Human Touch Point
// Mass Enh Application Channel
```

### 15.2 One-Time vs Recurring Logic
**Pre-paid:**
- priceType = "One-Time" → "Check On-top on *777 (On-top OneTime, Recurring & MaoMao Feature)"
- priceType = "Recurring" → เพิ่ม "และ Cancel On-top on *777 (On-top Recurring Only)"

---

## 16. Retry Pattern & Balance Management

### 16.1 Retry Pattern Configuration
```typescript
export const RetryPattern = (): void
```

**Fields:**
- Retry Count
- Retry Interval (seconds)
- Retry Delay Pattern
- Maximum Retry Attempts

### 16.2 Balance Warning
```typescript
// Mass Enh Balance Warning
// Field on Screen + Script Validation + Mapping to DB
```

### 16.3 Balance Transfer
```typescript
// Mass Enh Transfer
// Field on Screen + Script Validation + Mapping to DB
```

---

## 17. SIM Management

### 17.1 SIM Management Functions
```typescript
// Mass Enh Manage SIM
// Mass Enh Manage New SIM
// Mass Enh Manage Existing SIM
```

**Features:**
- SIM Registration
- SIM Activation
- SIM Replacement
- SIM Status Update

---

## 18. Bulk Modification Functions

### 18.1 Bulk Cashback Modification
```typescript
// Mass Modify Bulk Cashback
// Field on Screen + Script Validation
```

### 18.2 Bulk Application Channel
```typescript
// Mass Modify Bulk Application Channel
// Field on Screen + Script Validation
```

### 18.3 Modify History
```typescript
// Modify History
// Mapping to DB
```

---

## Appendix A: Dropdown & Selection Helpers

### A.1 CKS Dropdown Functions
```typescript
export const dropdownRecurringCKS = (): void
export const dropdownRecurringCKSMain = (): void
export const dropdownRecurringPreMainCKS = (): void
export const Randomdropdown = (): void
```

### A.2 Auto 5G & DIY Flag
```typescript
export const addauto5gCKS = (): void
export const diyflagCKS = (): void
```

### A.3 Unregister Function
```typescript
export const unregister = (): void
```

---

## Appendix B: Music Module Functions

### B.1 Music Roles
```typescript
export const performMusicRoles = (): void
```

**Process:**
1. Login ด้วย music credentials
2. Claim โปรเจกต์
3. Perform approval tasks
4. Logout

---

## Appendix C: Copy & Deduct Fail Handling

```typescript
export const CopyDeductFail = (pageType: 'mass-market' | 'enhancement'): void
```

**Purpose:** จัดการกรณี copy deduct fail ในหน้า mass-market หรือ enhancement

---

## Appendix D: Project Name Generation

### D.1 Unique ID Generation
```typescript
const generateUniqueId = (): string
const buildUniqueName = (baseName: string, identifier: string, maxLength: number): string
const generateProjectNames = (baseName: string, count: number): string[]
```

### D.2 Text Cleaning
```typescript
const cleanEnglishText = (str: string): string
const cleanThaiText = (str: string): string
const limit = (str: string, maxLen: number): string
const limitAndCleanEN = (str: string, maxLen: number): string
const limitAndCleanTH = (str: string, maxLen: number): string
```

### D.3 Abbreviation Helper
```typescript
const ABBREVIATIONS: Record<string, string> = { ... }
const getAbbreviation = (word: string | undefined): string
```

---

## Appendix E: Test Declaration Framework

### E.1 Test Entry Structure
```typescript
interface TestEntry {
  name: string;
  fn: () => void;
  module?: Module;
  productClass?: ProductClass;
  priceType?: PriceType;
}
```

### E.2 Test Declaration Functions
```typescript
const declareTest = (name: string, fn: () => void): void
const declareRoleTests = (tests: TestEntry[]): void
const declarePluginTests = (tests: TestEntry[]): void
```

### E.3 Sorting Functions
```typescript
const sortSpad = (arr: TestEntry[]): TestEntry[]
const sortCgmd = (arr: TestEntry[]): TestEntry[]
```

**Order:**
- SPAD: Spadsup → Spaddoer → Spadtester → Spaddeploy
- CGMD: Config → Tester

---

## Appendix F: Success Modal Handling

```typescript
const closeSuccessModal = (): void
```
**Purpose:** ปิด modal แจ้งเตือนความสำเร็จหลังจาก submit

---

## Appendix G: Intercept Registration

```typescript
const registerCksInitialIntercepts = (): void
const registerProjectPageIntercepts = (): void
const registerPoEnhancementIntercepts = (): void
```

**Purpose:** Register API intercepts สำหรับรอ response จาก backend

---

## Appendix H: Tomorrow Date Calculation

```typescript
const getTomorrowDateString = (): string
```
**Format:** DD/MM/YYYY (สำหรับ Commercial Launch Date)

---

## Summary

เอกสารนี้ครอบคลุมฟังก์ชันทั้งหมดในระบบทดสอบ Mass Mobile PLM ซึ่งประกอบด้วย:

1. **Authentication & Authorization** - 18+ roles
2. **Project Management** - Complete lifecycle management
3. **Product Configuration** - 20+ product types
4. **Approval Workflows** - Multi-level approval process
5. **PO Enhancement** - Advanced PO splitting and default values
6. **Rating & Billing** - Comprehensive rating configurations
7. **Content Services** - Voice, SMS, MMS, Internet, WiFi, Vertical Apps
8. **Utilities** - Date/time, text cleaning, unique ID generation

ทั้งหมดนี้ถูกออกแบบมาเพื่อรองรับการทดสอบระบบ PLM อย่างครอบคลุมทั้ง Pre-paid, Post-paid, Enterprise และ Music modules
