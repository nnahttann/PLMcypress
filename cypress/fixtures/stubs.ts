// cypress/support/stubs.ts
// Generated from HAR analysis — covers all 128 API endpoints
// ⚡ ลด network time จาก ~500s → ~0s ต่อ test run

export function registerStubs() {
  cy.log('📌 registerStubs called');

  // ─────────────────────────────────────────────
  // External / Static Resources
  // ─────────────────────────────────────────────

  cy.intercept('GET', 'https://fonts.googleapis.com/**', {
    statusCode: 200, body: '', headers: { 'Content-Type': 'text/css' },
  });

  cy.intercept('GET', '**/icon?family=Material+Icons*', {
    statusCode: 200, body: '', headers: { 'Content-Type': 'text/css' },
  });

  cy.intercept('GET', 'https://cdnjs.cloudflare.com/**', {
    statusCode: 200, body: '', headers: { 'Content-Type': 'application/javascript' },
  });

  cy.intercept('GET', '**/assets/dist/css/**', {
    statusCode: 200, body: '', headers: { 'Content-Type': 'text/css' },
  });

  cy.intercept('GET', '**/bower_components/**/*.css', {
    statusCode: 200, body: '', headers: { 'Content-Type': 'text/css' },
  });

  // ─────────────────────────────────────────────
  // 🔴 TOP OFFENDERS (HAR: >10,000ms total)
  // ─────────────────────────────────────────────

  // 54x POST — รวม ~97s — ตัวร้ายที่สุด
  cy.intercept(
    'POST',
    '**/api/flw-cfg-lov/getFlwCfgLovByFlwCfgLovParam',
    { statusCode: 200, body: [] }
  ).as('flwCfgLov');

  // 27x GET — รวม ~94s
  cy.intercept(
    'GET',
    '**/api/plm-error-code/getAll',
    { statusCode: 200, body: [] }
  ).as('errorCodes');

  // 24x GET — รวม ~86s — polling heartbeat
  cy.intercept(
    'GET',
    '**/newApi/CheckTask/setUserOnline',
    { statusCode: 200, body: {} }
  ).as('setOnline');

  // 38x POST — รวม ~10s — ไม่มี debounce ใน UI
  cy.intercept(
    'POST',
    '**/api/plm-po/getCountByPoName/**',
    { statusCode: 200, body: { count: 0 } }
  ).as('countPoName');

  // ─────────────────────────────────────────────
  // CheckTask / Admin APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/newApi/CheckTask/deleteData/**',
    { statusCode: 200, body: {} }
  ).as('deleteData');

  cy.intercept(
    'GET',
    '**/newApi/Admin/checkUserforId/**',
    { statusCode: 200, body: {} }
  ).as('checkUserId');

  // ─────────────────────────────────────────────
  // Activiti APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api-activiti/getTaskByUser',
    { statusCode: 200, body: [] }
  ).as('tasksByUser');

  cy.intercept(
    'GET',
    '**/api-activiti/getTaskByGroup/**',
    { statusCode: 200, body: [] }
  ).as('tasksByGroup');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — Broadcast / Subgroup / FLW
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndlovType/FLW_BROADCAST/FLW_BROADCAST',
    { statusCode: 200, body: [] }
  ).as('flwBroadcast');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/gettypesubgroupnewproject/**',
    { statusCode: 200, body: [] }
  ).as('typeSubgroup');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getActiveFlagFlwApi/**',
    { statusCode: 200, body: [] }
  ).as('activeFlagFlw');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getByGroupTypeAndActiveFlagOrderByOrderbyAsc
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovActive');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getByGroupTypeAndLovTypeContains*
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeContainsAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByGroupLovType');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeContainsAndLovVal2ContainsAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovVal2');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeContainsAndLovVal3ContainsOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovVal3');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeContainsAndLovVal4ContainsAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovVal4');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getByGroupTypeAndParRowId*
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndParRowIdConcatContainsAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByParActive');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndParRowIdConcatContainOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByParRowId');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndParRowIdConcatContainsAndLovVal2ContainsAndActiveFlagOrderByOrderbyAsc/**',
    { statusCode: 200, body: [] }
  ).as('lovByParLovVal2');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getByParRowIdConcatContains*
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByParRowIdConcatContainsAndLovVal4Contains/**',
    { statusCode: 200, body: [] }
  ).as('lovByParLovVal4');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getByGroupTypeAndLovTypeAnd*
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeAndLovVal1AndActiveFlag/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovVal1');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeAndParRowIdConcat/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovTypeParRowId');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — getFlwCfgLovByGroupType*
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndlovType/**',
    { statusCode: 200, body: [] }
  ).as('lovByGroupLovTypeExact');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndlovTypeOBJECTIVE/**',
    { statusCode: 200, body: [] }
  ).as('lovObjective');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupType/**',
    { statusCode: 200, body: [] }
  ).as('lovByGroupType');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndActiveFlag/**',
    { statusCode: 200, body: [] }
  ).as('lovByGroupTypeActive');

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getFlwCfgLovByGroupTypeAndLovDisplay/**',
    { statusCode: 200, body: [] }
  ).as('lovByGroupLovDisplay');

  // ─────────────────────────────────────────────
  // flw-cfg-lov — อื่นๆ
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-cfg-lov/getcustomerTypesinLov/**',
    { statusCode: 200, body: [] }
  ).as('lovCustomerTypes');

  cy.intercept(
    'POST',
    '**/api/flw-cfg-lov/findByGroupTypeAndLovVal1ContainsAndActiveFlag/**',
    { statusCode: 200, body: [] }
  ).as('lovFindByVal1');

  cy.intercept(
    'POST',
    '**/api/flw-cfg-lov/getByGroupTypeAndLovTypeAndLovVal1AndActiveFlag/**',
    { statusCode: 200, body: [] }
  ).as('lovByLovVal1Post');

  // ─────────────────────────────────────────────
  // Mass APIs — getByReferenceRowId (wildcard ครอบทุก mass-*)
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    /\/api\/mass-.*\/getByReferenceRowId\/.*/,
    { statusCode: 200, body: {} }
  ).as('massTabData');

  cy.intercept(
    'GET',
    '**/api/mass-po-detail/getByPoRowId/**',
    { statusCode: 200, body: {} }
  ).as('massPoDetail');

  cy.intercept(
    'POST',
    '**/api/mass-po-detail/addUpdate/**',
    { statusCode: 200, body: {} }
  ).as('massPoDetailUpdate');

  cy.intercept(
    'GET',
    '**/api/mass-business-internet/getAll',
    { statusCode: 200, body: [] }
  ).as('massBusinessInternet');

  cy.intercept(
    'GET',
    '**/api/mass-business-wifi/getAll',
    { statusCode: 200, body: [] }
  ).as('massBusinessWifi');

  // ─────────────────────────────────────────────
  // PLM PO APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/plm-po/getPoListByProjectId/**',
    { statusCode: 200, body: [] }
  ).as('poListByProject');

  cy.intercept(
    'GET',
    '**/api/plm-po/getPoListByProjectIdForMobile/**',
    { statusCode: 200, body: [] }
  ).as('poListByProjectMobile');

  cy.intercept(
    'GET',
    '**/api/plm-po/getPoByRowId/**',
    { statusCode: 200, body: {} }
  ).as('poByRowId');

  cy.intercept(
    'POST',
    '**/api/plm-po/getCountPlmPoAndModPlmPoByPoName/**',
    { statusCode: 200, body: { count: 0 } }
  ).as('countPlmPoByPoName');

  cy.intercept(
    'POST',
    '**/api/plm-po/addUpdate/**',
    { statusCode: 200, body: {} }
  ).as('poAddUpdate');

  cy.intercept(
    'GET',
    '**/api/plm-po-enh/getValidityPackage',
    { statusCode: 200, body: [] }
  ).as('poValidityPackage');

  // ─────────────────────────────────────────────
  // Project / Flow APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/flw-project/getProjectByProjectId/**',
    { statusCode: 200, body: {} }
  ).as('projectById');

  cy.intercept(
    'GET',
    '**/api/flw-project/po-group/by-userIddisplay/**',
    { statusCode: 200, body: [] }
  ).as('poGroupByUser');

  cy.intercept(
    'GET',
    '**/api/flw-project/**',
    { statusCode: 200, body: {} }
  ).as('flwProject');

  cy.intercept(
    'POST',
    '**/api/flw-project/addupdate',
    { statusCode: 200, body: {} }
  ).as('flwProjectAddUpdate');

  cy.intercept(
    'GET',
    '**/api/flw-common/getProjectByProjectId/**',
    { statusCode: 200, body: {} }
  ).as('flwCommonProject');

  cy.intercept(
    'GET',
    '**/api/flw-common/attachmentPodetail/**',
    { statusCode: 200, body: {} }
  ).as('flwCommonAttachment');

  cy.intercept(
    'GET',
    '**/api/flw-common/noteAndPodetail/**',
    { statusCode: 200, body: {} }
  ).as('flwCommonNote');

  cy.intercept(
    'GET',
    '**/api/flw-common/checkAnswerForMore/**',
    { statusCode: 200, body: {} }
  ).as('flwCommonCheckAnswer');

  // ─────────────────────────────────────────────
  // Auth APIs
  // ─────────────────────────────────────────────

  // ⚠️ authenticate ต้องเป็น real backend call เท่านั้น — ไม่ stub
  // (stub ทำให้ login flow ได้ token ปลอม → Angular ปฏิเสธ → แสดง error alert)

  cy.intercept(
    'GET',
    '**/api/signin',
    { statusCode: 200, body: {} }
  ).as('signin');

  // ─────────────────────────────────────────────
  // SFF / Product APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/sff-product/check-sff-product/**',
    { statusCode: 200, body: {} }
  ).as('sffProduct');

  cy.intercept(
    'GET',
    '**/api-generate-sff/checkSffTemplateProductSpec/**',
    { statusCode: 200, body: {} }
  ).as('sffTemplate');

  cy.intercept(
    'GET',
    '**/api/mapping-data-sff-product-ir/**',
    { statusCode: 200, body: {} }
  ).as('sffProductIr');

  cy.intercept(
    'POST',
    '**/api/plm-productSpecification/getPSListByLifeCycleStatusAndSectorTypeInAndPsGroup',
    { statusCode: 200, body: [] }
  ).as('psListByLifeCycle');

  // ─────────────────────────────────────────────
  // Corp / Price Plan APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/corp-price-plan-product/getAll',
    { statusCode: 200, body: [] }
  ).as('corpPricePlanProduct');

  cy.intercept(
    'GET',
    '**/api/ir-free-resource-name/getAll',
    { statusCode: 200, body: [] }
  ).as('irFreeResourceName');

  // ─────────────────────────────────────────────
  // Master APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/master/sale-channel/**',
    { statusCode: 200, body: [] }
  ).as('masterSaleChannel');

  cy.intercept(
    'GET',
    '**/api/master/mass-internet-speed-config/**',
    { statusCode: 200, body: [] }
  ).as('masterInternetSpeed');

  cy.intercept(
    'GET',
    '**/api/master/mass-internet-exceed-rate-config/**',
    { statusCode: 200, body: [] }
  ).as('masterInternetExceedRate');

  cy.intercept(
    'GET',
    '**/api/master/mass-internet-alert-config/getAll',
    { statusCode: 200, body: [] }
  ).as('masterInternetAlert');

  cy.intercept(
    'GET',
    '**/api/master/mass-topup-plan-config/getAll',
    { statusCode: 200, body: [] }
  ).as('masterTopupPlan');

  cy.intercept(
    'GET',
    '**/api/market-segment/getListMarketSegment',
    { statusCode: 200, body: [] }
  ).as('marketSegment');

  cy.intercept(
    'GET',
    '**/api/content_type_config/**',
    { statusCode: 200, body: [] }
  ).as('contentTypeConfig');

  // ─────────────────────────────────────────────
  // Promotion APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/PromotionGroupConfig/getPromotionGroupListByStatus',
    { statusCode: 200, body: [] }
  ).as('promotionGroupList');

  cy.intercept(
    'GET',
    '**/api/PromotionSubGroupConfig/getPromotionSucGroupListByPromotionGroupRowId/**',
    { statusCode: 200, body: [] }
  ).as('promotionSubGroupList');

  // ─────────────────────────────────────────────
  // Cashback / Reward APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/getPoMatchingCashbackRowIdList/**',
    { statusCode: 200, body: [] }
  ).as('cashbackRowIdList');

  cy.intercept(
    'POST',
    '**/api/po-detail-overview-view/getPoRelationTopUpReward',
    { statusCode: 200, body: {} }
  ).as('poRelationTopUpReward');

  // ─────────────────────────────────────────────
  // Check / Validate APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/recheckrow',
    { statusCode: 200, body: {} }
  ).as('recheckRow');

  cy.intercept(
    'GET',
    '**/api/checkProductDetial/RowID/**',
    { statusCode: 200, body: {} }
  ).as('checkProductDetail');

  cy.intercept(
    'GET',
    '**/api/check-generate-cgmd-by-po/**',
    { statusCode: 200, body: {} }
  ).as('checkGenerateCgmd');

  cy.intercept(
    'GET',
    '**/api/deleteGroupPackageOfferingByPoRowId/**',
    { statusCode: 200, body: {} }
  ).as('deleteGroupPackageOffering');

  cy.intercept(
    'GET',
    '**/api/getmodifyplmpo/**',
    { statusCode: 200, body: {} }
  ).as('getModifyPlmPo');

  cy.intercept(
    'POST',
    '**/api/plw-project/checkProjectNameMKT',
    { statusCode: 200, body: { isDuplicate: false } }
  ).as('checkProjectNameMkt');

  cy.intercept(
    'GET',
    '**/newApi/flw-mkt/checkProjectCodeInDatabase/**',
    { statusCode: 200, body: { exists: false } }
  ).as('checkProjectCode');

  cy.intercept(
    'GET',
    '**/api/edsOfferingController/getExistPackage/**',
    { statusCode: 200, body: {} }
  ).as('getExistPackage');

  // ─────────────────────────────────────────────
  // DC Package APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/api/dcPackageGroup/getAll',
    { statusCode: 200, body: [] }
  ).as('dcPackageGroup');

  cy.intercept(
    'GET',
    '**/api/dcPackageGroupOffering/findByPoRowIdAndNote/**',
    { statusCode: 200, body: [] }
  ).as('dcPackageGroupOffering');

  // ─────────────────────────────────────────────
  // CKS / Project Code APIs
  // ─────────────────────────────────────────────

  cy.intercept(
    'POST',
    '**/newApi/cksnew/getOnprdtcks',
    { statusCode: 200, body: {} }
  ).as('cksOnprdt');

  cy.intercept(
    'GET',
    '**/newApi/cksnew/addUpdateDateFromCKS_v2/**',
    { statusCode: 200, body: {} }
  ).as('cksAddUpdateDate');

  cy.intercept(
    'GET',
    '**/api/project-code/new',
    { statusCode: 200, body: { projectCode: 'PLM-STUB-0001' } }
  ).as('newProjectCode');

  // ─────────────────────────────────────────────
  // MKT Flow
  // ─────────────────────────────────────────────

  cy.intercept(
    'POST',
    '**/api-mkt/startProcessFlow',
    { statusCode: 200, body: {} }
  ).as('mktStartFlow');

  // ─────────────────────────────────────────────
  // Act Radius
  // ─────────────────────────────────────────────

  cy.intercept(
    'GET',
    '**/act-radius/detail-radius/**',
    { statusCode: 200, body: {} }
  ).as('actRadius');
}