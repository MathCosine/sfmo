# Legal documents

`sfmo-2027-waiver-v1.json` is the liability waiver parents and guardians sign
at `/waiver`. The signing page shows this file, and the `send-confirmation`
Edge Function reads the same file to build the signed PDF, so the two can
never disagree.

**Never edit a published version.** Each signature stores the document's id
and a SHA-256 fingerprint of this exact file; the PDF checks it. To change
the wording, copy it to a new id (e.g. `sfmo-2027-waiver-v2.json`), edit the
copy, and update `waiverDoc.id` in `src/lib/config.ts`. Earlier signatures
stay valid against the version they signed.


`fonts/` holds Noto Sans (SIL Open Font License, see `fonts/OFL.txt`),
subset with pyftsubset (kerning only: other layout features break pdf-lib's
subsetting of the italic),
subset to Latin, Greek, Cyrillic and Vietnamese, so names in those scripts
print correctly in the PDF.
