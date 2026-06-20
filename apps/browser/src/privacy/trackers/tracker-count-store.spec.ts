import { TrackerCountStore } from "./tracker-count-store";

describe("TrackerCountStore", () => {
  let store: TrackerCountStore;

  beforeEach(() => {
    store = new TrackerCountStore();
  });

  it("defaults to zero for an unseen tab", () => {
    expect(store.get(1)).toBe(0);
  });

  it("increments per tab independently", () => {
    expect(store.record(1)).toBe(1);
    expect(store.record(1)).toBe(2);
    expect(store.record(2)).toBe(1);
    expect(store.get(1)).toBe(2);
    expect(store.get(2)).toBe(1);
  });

  it("resets a tab to zero", () => {
    store.record(1);
    store.reset(1);
    expect(store.get(1)).toBe(0);
  });

  it("removes a tab entirely", () => {
    store.record(1);
    store.remove(1);
    expect(store.get(1)).toBe(0);
    expect(store.snapshot()).toEqual({});
  });

  it("snapshots counts keyed by tab id", () => {
    store.record(1);
    store.record(1);
    store.record(3);
    expect(store.snapshot()).toEqual({ 1: 2, 3: 1 });
  });
});
