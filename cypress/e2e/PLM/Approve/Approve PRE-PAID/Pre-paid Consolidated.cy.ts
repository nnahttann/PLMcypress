import * as Master from '../../../PLM/Master';

beforeEach(() => {
  cy.clearLocalStorage();
  cy.clearCookies();
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
  cy.visit(Master.urlsit);
  cy.viewport(1920, 1080);
});

// Helper function เพื่อลด duplication
const runPrepaidTest = (
  billingType: 'onetime' | 'recurring' | 'usage',
  productClass: 'main' | 'ontop' | 'ontopextra',
  afterHook: string,
  productClass1?: string
) => {
  const testConfig: any = {
    Module: 'PRE',
    subModule: 'PRE',
    autoSetDuration: true,
  };

  if (productClass1) {
    testConfig.ProductClass1 = productClass1;
  }

  Master.ProjectBasicInformationComplete(billingType, productClass, testConfig);

  const hookFunction = (Master as any)[afterHook];
  if (typeof hookFunction === 'function') {
    hookFunction();
  } else {
    cy.log(`⚠️ Warning: Hook function '${afterHook}' not found.`);
  }
};

// ========================================
// ⭐ MAIN ONETIME
// ========================================
describe('Main Onetime', () => {
  it.only('PRE', () => {
    runPrepaidTest('onetime', 'main', 'afterMKTMainPRE_FullSpadFlow', 'Main');
  });
});

// ========================================
// ⭐ MAIN RECURRING
// ========================================
describe('Main Recurring', () => {
  it('PRE', () => {
    runPrepaidTest('recurring', 'main', 'afterMKTMainPRE_FullSpadFlow', 'Main');
  });
});

// ========================================
// ⭐ MAIN USAGE
// ========================================
describe('Main Usage', () => {
  it('PRE', () => {
    runPrepaidTest('usage', 'main', 'afterMKTMainPRE_FullSpadFlow', 'Main');
  });
});

// ========================================
// ⭐ ONTOP ONETIME
// ========================================
describe('Ontop Onetime', () => {
  it.only('PRE', () => {
    runPrepaidTest('onetime', 'ontop', 'afterMKTontopPRE');
  });

  it('ENTER', () => {
    runPrepaidTest('onetime', 'ontop', 'afterMKTontopPREENTER');
  });

  it('MUSIC', () => {
    runPrepaidTest('onetime', 'ontop', 'afterMKTontopPREMUSIC');
  });
});

// ========================================
// ⭐ ONTOP RECURRING
// ========================================
describe('Ontop Recurring', () => {
  it('PRE', () => {
    runPrepaidTest('recurring', 'ontop', 'afterMKTontopPRE');
  });

  it('ENTER', () => {
    runPrepaidTest('recurring', 'ontop', 'afterMKTontopPREENTER');
  });

  it('MUSIC', () => {
    runPrepaidTest('recurring', 'ontop', 'afterMKTontopPREMUSIC');
  });
});

// ========================================
// ⭐ ONTOP USAGE
// ========================================
describe('Ontop Usage', () => {
  it('PRE', () => {
    runPrepaidTest('usage', 'ontop', 'afterMKTontopPREUsage');
  });

  it('ENTER', () => {
    runPrepaidTest('usage', 'ontop', 'afterMKTontopPREUsageEnter');
  });

  it('MUSIC', () => {
    runPrepaidTest('usage', 'ontop', 'afterMKTontopPREUsageMusic');
  });
});

// ========================================
// ⭐ ONTOPEX ONETIME
// ========================================
describe('OntopEx Onetime', () => {
  it('PRE', () => {
    runPrepaidTest('onetime', 'ontopextra', 'afterMKTontopPRE');
  });

  it('ENTER', () => {
    runPrepaidTest('onetime', 'ontopextra', 'afterMKTontopPREENTER');
  });

  it('MUSIC', () => {
    runPrepaidTest('onetime', 'ontopextra', 'afterMKTontopPREMUSIC');
  });
});

// ========================================
// ⭐ ONTOPEX RECURRING
// ========================================
describe('OntopEx Recurring', () => {
  it('PRE', () => {
    runPrepaidTest('recurring', 'ontopextra', 'afterMKTontopPRE');
  });

  it('ENTER', () => {
    runPrepaidTest('recurring', 'ontopextra', 'afterMKTontopPREENTER');
  });

  it('MUSIC', () => {
    runPrepaidTest('recurring', 'ontopextra', 'afterMKTontopPREMUSIC');
  });
});

// ========================================
// ⭐ ONTOPEX USAGE
// ========================================
describe('OntopEx Usage', () => {
  it('PRE', () => {
    runPrepaidTest('usage', 'ontopextra', 'afterMKTontopPREUsage');
  });

  it('ENTER', () => {
    runPrepaidTest('usage', 'ontopextra', 'afterMKTontopPREUsageEnter');
  });

  it('MUSIC', () => {
    runPrepaidTest('usage', 'ontopextra', 'afterMKTontopPREUsageMusic');
  });
});