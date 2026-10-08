import { describe, expect, it } from "vitest";
import { AppError } from "./AppError";

describe("AppError factories", () => {
  it("badRequest defaults to 400 with a BAD_REQUEST code", () => {
    const err = AppError.badRequest("Invalid input");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.message).toBe("Invalid input");
    expect(err).toBeInstanceOf(Error);
  });

  it("unauthorized defaults to 401 with a sensible message", () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("forbidden defaults to 403", () => {
    const err = AppError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("notFound defaults to 404", () => {
    const err = AppError.notFound("Vehicle not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toBe("Vehicle not found");
  });

  it("conflict defaults to 409 and carries optional details", () => {
    const err = AppError.conflict("Vehicle already booked for this period", "BOOKING_CONFLICT", { vehicleId: "abc" });
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("BOOKING_CONFLICT");
    expect(err.details).toEqual({ vehicleId: "abc" });
  });

  it("unprocessable defaults to 422 with a VALIDATION_ERROR code", () => {
    const err = AppError.unprocessable("Driver license has expired");
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("internal defaults to 500", () => {
    const err = AppError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
  });

  it("captures a stack trace and preserves the custom name", () => {
    const err = AppError.badRequest("x");
    expect(err.name).toBe("AppError");
    expect(err.stack).toBeDefined();
  });
});
