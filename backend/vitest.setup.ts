/**
 * Test environment bootstrap. Runs before any test file is loaded so that
 * src/config/env.ts (imported transitively by lib/jwt.ts, lib/password.ts,
 * etc.) sees a valid, self-contained configuration without requiring a real
 * .env file or a live database connection. dotenv/config (used inside
 * env.ts) never overwrites variables that are already set, so these values
 * take precedence.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/car_rental_test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret-key-not-for-production";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "test-jwt-refresh-secret-key-not-for-prod";
process.env.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d";
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS ?? "4"; // low cost factor: fast tests
