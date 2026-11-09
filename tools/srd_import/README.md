# SRD import pipeline

These scripts import and verify external source data for the modular SRD compendium. They produced the source-data audit and the P1/P2 data in `database/`. Run them with Python 3.12 (`py -I`). PyMuPDF is required for the PDF helpers.

The inputs are local files and are not in this repository:
- `HeroForge Anew 3.5 v7.4.0.1.xlsm`
- `HeroForge-Anew-master/data/*.csv`
- the user's rulebook PDFs

See `HEROFORGE_GAP_AUDIT_REPORT.md` and `HEROFORGE_VERIFICATION_TABLE.md` for the findings.

| Step | Script | What it does |
| :--- | :--- | :--- |
| Audit | `xlsm_dump.py` | Dumps every worksheet in the `.xlsm` to JSON (shared strings resolved). |
| Audit | `analyze.py` | Extracts the HeroForge catalogs and diffs them against `database/*.json` and the Foundry packs. |
| Books | `pdfq.py`, `pdfimg.py` | Searches or prints a PDF text layer, and renders scanned pages to PNG for visual checks. |
| P1 | `p1_apply.py` | Applies the book-verified class save and fighter bonus feat fixes. |
| P2 | `eqparse.py`, `eqjoin.py` | Parses the crystalkeep 3.5 Equipment Index and joins it with HeroForge `WeaponInfo.csv`. |
| P2 | `p2_gear.py` | Builds the weapon and armor records. Weapons are kept only when both sources agree, or when the dispute was settled from the book. Armor values come from the book tables. |
| P2 | `p2_options.py` | Builds the UA traits, the Weak Will flaw, and the Complete Scoundrel skill tricks. |
| P2 | `p2_assemble.py` | Writes the lazy chunks (`srd_equipment_splat.json`, `srd_feats_splat.json`), adds Weak Will and Boulder Roll, and registers the chunks in `srd_index.json`. |

After any change, run `node tools/verify_and_sync.js` (or the Docker command in `CLAUDE.md`). It fills the index rows, counts, and hashes, and runs the regression suites.

Benefit text is paraphrased. No verbatim rulebook text is stored.
