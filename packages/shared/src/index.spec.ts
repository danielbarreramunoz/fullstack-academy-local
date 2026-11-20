import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CAPABILITIES,
  ROLE_CAPABILITIES,
  loginSchema,
  updateProgressSchema,
} from "./index.js";

describe("loginSchema", () => {
  it("acepta credenciales válidas", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "12345678" });
    assert.equal(r.success, true);
  });

  it("rechaza email inválido y password corta", () => {
    assert.equal(loginSchema.safeParse({ email: "no-mail", password: "12345678" }).success, false);
    assert.equal(loginSchema.safeParse({ email: "a@b.com", password: "corta" }).success, false);
  });

  it("rechaza campos extra (strict, anti mass-assignment)", () => {
    const r = loginSchema.safeParse({ email: "a@b.com", password: "12345678", role: "admin" });
    assert.equal(r.success, false);
  });
});

describe("updateProgressSchema", () => {
  it("acepta status o notas", () => {
    assert.equal(updateProgressSchema.safeParse({ status: "completed" }).success, true);
    assert.equal(updateProgressSchema.safeParse({ notes_md: "nota" }).success, true);
  });

  it("rechaza objeto vacío y status inválido", () => {
    assert.equal(updateProgressSchema.safeParse({}).success, false);
    assert.equal(updateProgressSchema.safeParse({ status: "done" }).success, false);
  });

  it("rechaza campos extra como userId (anti mass-assignment)", () => {
    const r = updateProgressSchema.safeParse({ status: "completed", userId: "otro" });
    assert.equal(r.success, false);
  });
});

describe("ROLE_CAPABILITIES", () => {
  it("matriz esperada por rol", () => {
    assert.deepEqual(ROLE_CAPABILITIES.student, ["lessons:read", "progress:read", "progress:write"]);
    assert.deepEqual(ROLE_CAPABILITIES.mentor, ["lessons:read", "progress:read", "audit:read"]);
    assert.deepEqual(ROLE_CAPABILITIES.admin, [
      "lessons:read",
      "progress:read",
      "progress:write",
      "curriculum:edit",
      "audit:read",
    ]);
  });

  it("toda capability existe en CAPABILITIES y cumple el formato", () => {
    for (const caps of Object.values(ROLE_CAPABILITIES)) {
      for (const cap of caps) {
        assert.ok((CAPABILITIES as readonly string[]).includes(cap), `desconocida: ${cap}`);
        assert.match(cap, /^[a-z_]+:[a-z]+$/);
      }
    }
  });
});
