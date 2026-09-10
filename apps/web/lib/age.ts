import { MIN_AGE } from "../../packages/shared/constants";

/**
 * Calculates age in whole years from a date of birth, as of "now".
 * This MUST be the only source of truth for age — never trust an
 * "I am 18+" checkbox alone, always recompute server-side from DOB
 * at both registration time and at any point profile visibility matters.
 */
export function calculateAge(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}

export function isOfMinimumAge(dob: Date, now: Date = new Date()): boolean {
  return calculateAge(dob, now) >= MIN_AGE;
}

export class UnderageError extends Error {
  constructor() {
    super(`Users must be at least ${MIN_AGE} years old.`);
    this.name = "UnderageError";
  }
}

/** Throws if the DOB indicates the person is under the minimum age. Call this
 *  at registration AND at profile submission — never rely on client input. */
export function assertOfMinimumAge(dob: Date): void {
  if (!isOfMinimumAge(dob)) {
    throw new UnderageError();
  }
}
