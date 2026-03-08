/// <reference types="cypress" />

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mockFreighter(): Chainable<void>;
      mockStellarAPI(): Chainable<void>;
    }
  }

  interface Window {
    freighter: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<string>;
      signTransaction: (xdr: string) => Promise<{ signedXDR: string }>;
    };
  }
}

Cypress.Commands.add("mockFreighter", (): Cypress.Chainable<void> => {
  return cy.fixture("wallet").then((wallet) => {
    cy.window().then((win) => {
      win.freighter = {
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
