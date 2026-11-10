# SRD import pipeline

These scripts import and verify external source data for the modular SRD compendium. They produced the source-data audit and the P1/P2 data in `database/`. Run them with Python 3.12 (`py -I`). PyMuPDF is required for the PDF helpers.

The inputs are local files and are not in this repository:
- the builder workbook (`.xlsm`, v7.4.0.1)
- the workbook companion CSVs (`data/*.csv`)
- the user's rulebook PDFs

See `SRD_IMPORT_GAP_AUDIT_REPORT.md` and `SRD_IMPORT_VERIFICATION_TABLE.md` for the findings.

| Step | Script | What it does |
| :--- | :--- | :--- |
| Audit | `xlsm_dump.py` | Dumps every worksheet in the `.xlsm` to JSON (shared strings resolved). |
| Audit | `analyze.py` | Extracts the builder workbook catalogs and diffs them against `database/*.json` and the Foundry packs. |
| Books | `pdfq.py`, `pdfimg.py` | Searches or prints a PDF text layer, and renders scanned pages to PNG for visual checks. |
| P1 | `p1_apply.py` | Applies the book-verified class save and fighter bonus feat fixes. |
| P1 | `featidx_parse.py`, `p1_feat_pages.py` | Parses the 3.5 feat index. Adds feat pages only where it agrees with the workbook, with prerequisite guards for same-name feats. |
| P1 | `class_pages_from_book.py`, `classidx_pages.py`, `p1_class_pages.py` | Finds class pages in text-layer books and indexes. Applies class pages from book contents pages and the missing PrC requirements. |
| P2 | `eqparse.py`, `eqjoin.py` | Parses the crystalkeep 3.5 Equipment Index and joins it with builder workbook `WeaponInfo.csv`. |
| P2 | `p2_gear.py` | Builds the weapon and armor records. Weapons are kept only when both sources agree, or when the dispute was settled from the book. Armor values come from the book tables. |
| P2 | `p2_options.py` | Builds the UA traits, the Weak Will flaw, and the Complete Scoundrel skill tricks. |
| P2 | `p2_assemble.py` | Writes the lazy chunks (`srd_equipment_splat.json`, `srd_feats_splat.json`), adds Weak Will and Boulder Roll, and registers the chunks in `srd_index.json`. |

| P3 | `p3_feats.py` | Builds the splatbook feats from the workbook. Splits them by edition and level band; drops Dragon Magazine, placeholder, and header rows; separates same-name feats. |
| P3 | `p3_assemble.py` | Writes `srd_feats_splat.json` (3.5), `srd_feats_epic.json`, and `srd_feats_legacy.json` (3.0 and licensed, `optIn`), and registers them in the index. |
| P4 | `p4_classidx.py` | Parses the crystalkeep Prestige / Base class index PDFs (word positions) into `clsidx.json`. |
| P4 | `p4_classes.py` | Builds the base and prestige class chassis from the workbook. Prestige classes are kept only when the class index agrees (or the book settled it); same-name classes get a book-qualified name. |
| P4 | `p4_assemble.py` | Writes `srd_classes_splat.json` (3.5) and `srd_classes_legacy.json` (3.0 and licensed, `optIn`), checks ids and names are unique across class chunks, and registers them in the index. |

After any change, run `node tools/verify_and_sync.js` (or the Docker command in `CLAUDE.md`). It fills the index rows, counts, and hashes, and runs the regression suites.

Benefit text is paraphrased. No verbatim rulebook text is stored.
