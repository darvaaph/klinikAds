import type { KodeError } from "@/lib/respons";

/** Domain error with an API error code, like the `raise exception 'KODE'` in DB §5. */
export class GalatData extends Error {
  constructor(public readonly kode: KodeError) {
    super(kode);
    this.name = "GalatData";
  }
}
