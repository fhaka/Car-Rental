import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { hashToken, newTokenId, parseExpiryToDate, signAccessToken, signRefreshToken, verifyRefreshToken } from "./jwt";

describe("access tokens", () => {
  it("signs a token that decodes back to the original claims", () => {
    const claims = { sub: "user-1", role: "ADMIN" as const, email: "admin@example.com" };
    const token = signAccessToken(claims);
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.sub).toBe(claims.sub);
    expect(decoded.role).toBe(claims.role);
    expect(decoded.email).toBe(claims.email);
    expect(decoded.exp).toBeDefined();
  });
});

describe("refresh tokens", () => {
  it("signs and verifies a refresh token round-trip", () => {
    const claims = { sub: "user-1", jti: newTokenId() };
    const token = signRefreshToken(claims);
    const verified = verifyRefreshToken(token);
    expect(verified.sub).toBe(claims.sub);
    expect(verified.jti).toBe(claims.jti);
  });

  it("rejects a refresh token signed with a different secret", () => {
    const forged = jwt.sign({ sub: "attacker", jti: "fake" }, "not-the-real-secret");
    expect(() => verifyRefreshToken(forged)).toThrow();
  });

  it("rejects a tampered/garbage token", () => {
    expect(() => verifyRefreshToken("not.a.jwt")).toThrow();
  });
});

describe("hashToken", () => {
  it("produces a deterministic SHA-256 hex digest", () => {
    const hash1 = hashToken("some-refresh-token-value");
    const hash2 = hashToken("some-refresh-token-value");
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });
});

describe("newTokenId", () => {
  it("generates a unique UUID on each call", () => {
    const ids = new Set(Array.from({ length: 20 }, () => newTokenId()));
    expect(ids.size).toBe(20);
  });
});

describe("parseExpiryToDate", () => {
  it("parses minutes correctly", () => {
    const before = Date.now();
    const result = parseExpiryToDate("15m");
    expect(result.getTime()).toBeGreaterThanOrEqual(before + 15 * 60_000 - 1000);
    expect(result.getTime()).toBeLessThanOrEqual(before + 15 * 60_000 + 1000);
  });

  it("parses days correctly", () => {
    const before = Date.now();
    const result = parseExpiryToDate("30d");
    const expected = before + 30 * 86_400_000;
    expect(Math.abs(result.getTime() - expected)).toBeLessThan(2000);
  });

  it("parses seconds and hours correctly", () => {
    const secResult = parseExpiryToDate("45s");
    expect(Math.abs(secResult.getTime() - (Date.now() + 45_000))).toBeLessThan(1000);

    const hourResult = parseExpiryToDate("2h");
    expect(Math.abs(hourResult.getTime() - (Date.now() + 2 * 3_600_000))).toBeLessThan(1000);
  });

  it("falls back to a 15-minute default for an unparseable value", () => {
    const before = Date.now();
    const result = parseExpiryToDate("garbage");
    expect(Math.abs(result.getTime() - (before + 15 * 60_000))).toBeLessThan(1000);
  });
});
