import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("hashes a password to a bcrypt hash distinct from the plaintext", async () => {
    const hash = await hashPassword("Password123!");
    expect(hash).not.toBe("Password123!");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("CorrectHorseBattery");
    await expect(verifyPassword("CorrectHorseBattery", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("CorrectHorseBattery");
    await expect(verifyPassword("WrongPassword", hash)).resolves.toBe(false);
  });

  it("produces a different hash for the same password on each call (random salt)", async () => {
    const hashA = await hashPassword("SamePassword");
    const hashB = await hashPassword("SamePassword");
    expect(hashA).not.toBe(hashB);
  });
});
