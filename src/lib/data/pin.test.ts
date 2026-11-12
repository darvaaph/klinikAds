import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";
import { cekPin, DURASI_KUNCI_MS } from "./pin";

const HASH = bcrypt.hashSync("246810", 4);

describe("cekPin", () => {
  it("accepts the right PIN", async () => {
    expect(await cekPin("t1", "246810", HASH)).toBe("ok");
  });

  it("locks after 5 wrong PINs for 5 minutes, even for the right PIN", async () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 4; i++) expect(await cekPin("t2", "000000", HASH, t0)).toBe("salah");
    const kunci = await cekPin("t2", "000000", HASH, t0);
    expect(kunci).toEqual(new Date(t0 + DURASI_KUNCI_MS));
    expect(await cekPin("t2", "246810", HASH, t0 + 60_000)).toBeInstanceOf(Date);
    expect(await cekPin("t2", "246810", HASH, t0 + DURASI_KUNCI_MS + 1)).toBe("ok");
  });

  it("counts attempts per key", async () => {
    for (let i = 0; i < 5; i++) await cekPin("t3", "000000", HASH);
    expect(await cekPin("t4", "246810", HASH)).toBe("ok");
  });
});
