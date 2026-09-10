import { describe, it, expect } from "vitest";
import { calculateAge, isOfMinimumAge, assertOfMinimumAge, UnderageError } from "../lib/age";

describe("age validation (18+ enforcement)", () => {
  const fixedNow = new Date("2026-09-10T00:00:00Z");

  it("calculates age correctly when birthday has passed this year", () => {
    expect(calculateAge(new Date("2000-01-01"), fixedNow)).toBe(26);
  });

  it("calculates age correctly when birthday has not yet occurred this year", () => {
    expect(calculateAge(new Date("2000-12-31"), fixedNow)).toBe(25);
  });

  it("treats someone turning 18 today as of minimum age", () => {
    expect(isOfMinimumAge(new Date("2008-09-10"), fixedNow)).toBe(true);
  });

  it("rejects someone who turns 18 tomorrow", () => {
    expect(isOfMinimumAge(new Date("2008-09-11"), fixedNow)).toBe(false);
  });

  it("throws UnderageError for a 17-year-old", () => {
    expect(() => assertOfMinimumAge(new Date("2009-01-01"))).toThrow(UnderageError);
  });

  it("does not throw for a clearly-adult date of birth", () => {
    expect(() => assertOfMinimumAge(new Date("1995-06-15"))).not.toThrow();
  });
});
