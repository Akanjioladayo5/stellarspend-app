/// <reference types="cypress" />

describe("User Journey: Landing → Wallet → Budget → Transaction", () => {
  beforeEach(() => {
    cy.mockStellarAPI();
  });

  it("should display landing page with CTAs", () => {
    cy.visit("/");

    cy.contains("Take").should("be.visible");
    cy.contains("full control").should("be.visible");
    cy.contains("of your money").should("be.visible");

    cy.contains("a", "Get started").click();
    cy.url().should("include", "/sign-in");

    cy.go("back");

    cy.contains("Read the docs")
      .should("be.visible")
      .and("have.attr", "href", "/docs");

    cy.contains("0.01¢").should("be.visible");
    cy.contains("No KYC").should("be.visible");
  });

  it("should mock wallet connection", () => {
    cy.visit("/");
    cy.mockFreighter();

    cy.window().then((win) => {
      const { freighter } = win;
      expect(freighter).to.exist;
    });

    cy.window()
      .then((win) => win.freighter.getPublicKey())
      .should(
        "equal",
        "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
      );

    cy.window()
      .then((win) => win.freighter.isConnected())
      .should("equal", true);
  });

  it("should create a budget", () => {
    cy.visit("/test-forms");

    cy.get("input#name").type("Groceries");
    cy.get("input#amount").type("500");
    cy.get("select#category").select("food");
    cy.get('input[type="radio"][value="monthly"]').check();

    cy.contains("button", "Save Budget").should("not.be.disabled").click();

    cy.on("window:alert", (text) => {
      expect(text).to.contains("Budget saved successfully");
    });
  });

  it("should view mocked transaction", () => {
    cy.visit("/");
    cy.mockFreighter();

    cy.fixture("transaction").then(
      (transaction: { amount: string; type: string }) => {
        expect(transaction.amount).to.equal("100.0000000");
        expect(transaction.type).to.equal("payment");
      },
    );
  });

  it("should navigate CTAs correctly", () => {
    cy.visit("/");

    cy.contains("a", "Get started").click();
    cy.url().should("include", "/sign-in");

    cy.go("back");

    cy.contains("a", "Read the docs").click();
    cy.url().should("include", "/docs");
  });
});
