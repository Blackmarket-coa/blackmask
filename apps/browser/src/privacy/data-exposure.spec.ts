import { BreachSummaryItem, summarizeBreaches } from "./data-exposure";

function breach(overrides: Partial<BreachSummaryItem> = {}): BreachSummaryItem {
  return {
    name: "Example",
    title: "Example",
    domain: "example.com",
    breachDate: "2015-01-01",
    pwnCount: 100,
    dataClasses: ["Emails"],
    ...overrides,
  };
}

describe("summarizeBreaches", () => {
  it("returns an empty summary for no breaches", () => {
    const result = summarizeBreaches([]);

    expect(result.breachCount).toBe(0);
    expect(result.totalPwned).toBe(0);
    expect(result.dataClasses).toEqual([]);
    expect(result.items).toEqual([]);
  });

  it("counts breaches and totals accounts pwned", () => {
    const result = summarizeBreaches([
      breach({ pwnCount: 100 }),
      breach({ name: "Other", pwnCount: 250 }),
    ]);

    expect(result.breachCount).toBe(2);
    expect(result.totalPwned).toBe(350);
  });

  it("collects unique data classes across breaches, sorted", () => {
    const result = summarizeBreaches([
      breach({ dataClasses: ["Passwords", "Emails"] }),
      breach({ name: "Other", dataClasses: ["Emails", "Names"] }),
    ]);

    expect(result.dataClasses).toEqual(["Emails", "Names", "Passwords"]);
  });

  it("ignores empty data classes and negative pwn counts", () => {
    const result = summarizeBreaches([breach({ dataClasses: ["", "Emails"], pwnCount: -5 })]);

    expect(result.dataClasses).toEqual(["Emails"]);
    expect(result.totalPwned).toBe(0);
  });

  it("sorts breaches by date, most recent first", () => {
    const result = summarizeBreaches([
      breach({ name: "Old", breachDate: "2012-05-01" }),
      breach({ name: "New", breachDate: "2021-09-01" }),
      breach({ name: "Mid", breachDate: "2017-03-01" }),
    ]);

    expect(result.items.map((item) => item.name)).toEqual(["New", "Mid", "Old"]);
  });
});
