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
    Master.ProjectBasicInformationComplete('onetime', 'main', { 
      ProductClass1: 'Main', 
      Module: 'POST',
      subModule: 'POST',
      autoSetDuration: true 
    });
    Master.InternetRandom('main', 'post', 'post');
    Master.backBacicInfo();
    Master.addFile();
    
    // เรียกหลังจากทุกอย่างใน test นี้เสร็จ
    Master.afterMKTMAINPOST();
  });
});
