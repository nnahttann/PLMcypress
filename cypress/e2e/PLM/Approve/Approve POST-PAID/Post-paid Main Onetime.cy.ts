import * as Master from '../../Master';
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('Mobile', () => {
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'main', { ProductClass1: 'Main', Module: 'POST', autoSetDuration: true });
    //targetgroup
    Master.selectTargetGroup('random');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    Master.PriceExcluding();

    //*Target group
    Master.targetgroup();

    //ProductSpec
    const optionsToSelectProductSpec = [
      // "AI IP Camera",
      "AIS Secure Net",
      // "Apple Care",
      // "Cloud Game",
      // "Cloud PC",
      // "Content VDO",
      // "Flowaccount",
      // "Internet",
      // "MMS",
      // "Mobile Care",
      // "SMS",
      // "Vertical App",
      // "Voice",
      // "WiFi",
      // "Youtube Premium"
    ];

    optionsToSelectProductSpec.forEach(option => {
      cy.get('select[formcontrolname="availableListBox"]')
        .contains(option)
        .then($option => {
          cy.wrap($option).dblclick();
        });
    });
    Master.InternetRandom('notrecurring');
    Master.dropdownPromotionGroup();

    Master.smsWording();

    Master.backBacicInfo();

    Master.addFile();
  });
  Master.afterMKTMAINPOST();
});

