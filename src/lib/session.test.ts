import { beforeAll, describe, expect, it } from "vitest";
import { bacaSesiAdmin, bacaSesiRemote, buatSesiAdmin, buatSesiRemote } from "./session";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(32);
});

describe("session", () => {
  it("round-trips a remote session", async () => {
    const token = await buatSesiRemote({ klinikId: "k1", slug: "palsigunung-2" });
    expect(await bacaSesiRemote(token)).toEqual({ klinikId: "k1", slug: "palsigunung-2" });
  });

  it("rejects a tampered or missing token", async () => {
    const token = await buatSesiRemote({ klinikId: "k1", slug: "palsigunung-2" });
    expect(await bacaSesiRemote(token.slice(0, -2) + "xx")).toBeNull();
    expect(await bacaSesiRemote(undefined)).toBeNull();
  });

  it("does not accept a remote token as admin", async () => {
    const token = await buatSesiRemote({ klinikId: "k1", slug: "palsigunung-2" });
    expect(await bacaSesiAdmin(token)).toBeNull();
    expect(await bacaSesiAdmin(await buatSesiAdmin())).toEqual({ peran: "admin_pusat" });
  });
});
