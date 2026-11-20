import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { CapabilitiesGuard } from "./capabilities.guard";

// Unit test sin DB: el pool se crea de forma perezosa, así que basta con apuntar
// a un puerto cerrado. El fallo de conexión es inmediato y el guard lo traga
// (audit(...).catch), sin colgar el runner.
process.env.DATABASE_URL ??= "postgres://test:test@localhost:59999/test";

function mockReflector(required: string | undefined): Reflector {
  return { getAllAndOverride: () => required } as unknown as Reflector;
}

function mockContext(capabilities?: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: "u1", capabilities }, url: "/x" }),
    }),
  } as unknown as ExecutionContext;
}

describe("CapabilitiesGuard", () => {
  it("permite si no hay capability requerida", async () => {
    const guard = new CapabilitiesGuard(mockReflector(undefined));
    assert.equal(await guard.canActivate(mockContext([])), true);
  });

  it("permite si el usuario tiene la capability", async () => {
    const guard = new CapabilitiesGuard(mockReflector("progress:write"));
    assert.equal(await guard.canActivate(mockContext(["progress:read", "progress:write"])), true);
  });

  it("deniega con 403 si falta la capability (audita sin reventar)", async () => {
    const guard = new CapabilitiesGuard(mockReflector("audit:read"));
    await assert.rejects(
      guard.canActivate(mockContext(["lessons:read"])),
      (e) => e instanceof ForbiddenException && /missing capability audit:read/.test(e.message),
    );
  });
});
