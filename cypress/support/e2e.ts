import './commands';
try {
    (Cypress as any).Commands?.overwrite?.('log', (orig: any, ...args: any[]) => {
        orig(...args);
        try {
            console.log(...args);
        }
        catch (e) {
        }
    });
}
catch (err) {
    console.warn('cLog wrapper: could not overwrite cy.log', err);
}

afterEach(() => {
    Cypress.env('formattedDateMain', undefined);
    Cypress.env('formattedDateOntop', undefined);
    Cypress.env('formattedDateOntopExtra', undefined);
    Cypress.env('formattedDateMainPONAME', undefined);
    Cypress.env('formattedDateOntopPONAME', undefined);
    Cypress.env('formattedDateOntopExtraPONAME', undefined);
});
