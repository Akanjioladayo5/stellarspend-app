/// <reference types="cypress" />

// Augment the real Cypress.Chainable interface (namespace merge), not a
// standalone module — Cypress's own Chainable<Subject> is generic and lives
// in the `Cypress` namespace, so `declare module 'cypress'` creates an
// unrelated type instead of extending the real one.
declare global {
  namespace Cypress {
    interface Chainable {
      mockFreighter(): Chainable<void>;
      mockStellarAPI(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("mockFreighter", (): Cypress.Chainable<void> => {
  return cy.fixture("wallet").then((wallet) => {
    cy.window().then((win) => {
      (win as typeof win & { freighter: unknown }).freighter = {
        isConnected: () => Promise.resolve(wallet.isConnected),
        getPublicKey: () => Promise.resolve(wallet.publicKey),
        getNetwork: () => Promise.resolve(wallet.network),
        signTransaction: (xdr: string) => Promise.resolve({ signedXDR: xdr }),
      };
    });
  });
});

Cypress.Commands.add("mockStellarAPI", () => {
  return cy.fixture("transaction").then((transaction) => {
    cy.intercept("GET", "**/accounts/**", {
      statusCode: 200,
      body: {
        id: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
        balances: [{ asset_type: "native", balance: "10000.0000000" }],
      },
    }).as("getAccount");

    cy.intercept("GET", "**/transactions**", {
      statusCode: 200,
      body: { _embedded: { records: [transaction] } },
    }).as("getTransactions");

    cy.intercept("POST", "**/transactions", {
      statusCode: 200,
      body: { hash: "mock-tx-hash", successful: true },
    }).as("submitTransaction");
  });
});

// Required so `declare global` is scoped to this file as a module augmentation
// rather than clashing with other global declarations in the project.
export {};