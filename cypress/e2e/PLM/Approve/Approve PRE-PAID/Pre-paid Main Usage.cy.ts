import * as Master from '../../Master';
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
  it('MKT POSTPAID role', () => {
    Master.ProjectBasicInformationComplete('usage', 'main', { ProductClass1: 'Main', Module: 'PRE', autoSetDuration: true });

    //targetgroup
    Master.selectTargetGroup('random');

    //Remark 
    cy.get('textarea[formcontrolname="remark"]').type('This is a new remark.');

    Master.PriceExcluding();

    //*Target group
    Master.targetgroup();
    Master.RandomProductSpecification();
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
    //allowMvpn
    // cy.get('input[formcontrolname="allowMvpn"]').eq(1).check({ force: true });
    // Auto Add Service 5G Select the second option ('Auto Add')
    // cy.get('#service-options').select(1);
    Master.dropdownPromotionGroup();
    Master.InternetRandom();

    Master.smsWordingpre();

    Master.backBacicInfo();

    Master.addFile();
  });
  Master.afterMKTMainPRE_FullSpadFlow();
});

