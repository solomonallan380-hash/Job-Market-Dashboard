// Some upstream job APIs (RemoteOK in particular) occasionally serve fields
// that were mis-decoded as Latin-1 and re-encoded as UTF-8 before being sent
// to us, producing mojibake like "CataluÃ±a" instead of "Cataluña". This is
// baked into the bytes the API sends — confirmed by fetching RemoteOK's raw
// response directly — not something introduced by our own JSON parsing.
//
// Reversing that single mis-decode (treat the JS string's UTF-16 code units
// as Latin-1 byte values, then decode those bytes as UTF-8) repairs it.
// Correctly-encoded strings are left untouched: reinterpreting a genuine
// accented character (a lone Latin-1-range code point) as a UTF-8 lead byte
// almost always yields an invalid byte sequence, which we detect via the
// U+FFFD replacement character and reject, falling back to the original.
const MOJIBAKE_HINT = /[Â-ÅØ-ßà-ÿ]/;

export function fixMojibake(value: string): string {
  if (!value || !MOJIBAKE_HINT.test(value)) return value;

  const repaired = Buffer.from(value, "latin1").toString("utf8");
  if (repaired === value || repaired.includes("�")) return value;

  return repaired;
}

export function fixJobTextEncoding<
  T extends { title: string; company: string; location: string; description: string }
>(job: T): T {
  return {
    ...job,
    title: fixMojibake(job.title),
    company: fixMojibake(job.company),
    location: fixMojibake(job.location),
    description: fixMojibake(job.description),
  };
}
