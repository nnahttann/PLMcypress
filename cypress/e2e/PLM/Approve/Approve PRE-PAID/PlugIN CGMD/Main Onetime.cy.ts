import * as Master from '../../../Master';
beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

describe('Mobile', () => {
  it('MKT PREPAID role', () => {
    Master.ProjectBasicInformationComplete('onetime', 'main', { ProductClass1: 'Main', Module: 'PRE', autoSetDuration: true });

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
    cy.scrollTo('top');

    Master.dropdownPromotionGroup();

    Master.InternetRandom();

    Master.smsWordingpre();

    Master.backBacicInfo();

    Master.addFile();
  });
  Master.afterMKTMainPRE_PluginCGMD();
});

