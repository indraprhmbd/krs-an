# UGM format importer

## Why this exists

The existing "Intelligence Scraper" (`src/components/admin/dialogs/IntelligenceScraperDialog.tsx`,
Manual Core mode) only understands **one course per tab-separated line**: 6-8 columns,
`Prodi\tKode\tNama\tKelas\tSKS\tJumlah\tJadwal\tRuang`, with an optional following non-tab line
as a lecturer name. That's the shape our home institution's portal exports.

UGM's course table export is structurally different: **one course per multi-line block**, no
prodi column at all (prodi is implied by which report was exported), lecturers numbered
`1.`/`2.`/... that can span several lines, and the day/time trailing whichever line happens to
hold the last lecturer (or absent entirely for non-scheduled items like Kerja Praktek). This
can't be handled by adding another column-count branch to the existing parser -- it needs a
block-grouped parse, not a per-line one.

## Format reference

Single lecturer, schedule on the same line as the lecturer:

```
5	TKF210058  Penerapan Mikroprosesor
  Kelas: FA	2	0		1. Prof. Nazrul Effendy, S.T., MT.,Ph.D.	Rabu, 13:00-14:40
```

Multiple lecturers, schedule trailing the last one:

```
25	TKF211201  Persamaan Diferensial
  Kelas: FA	3	2		1. Ir. Ester Wijayanti, M.T.
2. Prof. Dr. Ir. Andang Widi Harto, MT.	Rabu, 09:30-12:00
```

No lecturer, no schedule (Kerja Praktek, Tugas Akhir, and a handful of course-class rows the
export leaves blank):

```
20	TKF213148  Kerja Praktek
  Kelas: FA	2	0
```

Lecturer present but no schedule (also occurs -- do not assume a lecturer implies a schedule):

```
14	TKF210073  Rekayasa Pengkondisian Udara
  Kelas: FA	2	0		1. Dr.Eng. Mohammad Kholid Ridwan, S.T., M.Sc.
```

## Parser

`src/lib/parsers/ugmBlockParser.ts`, `parseUgmBlockFormat(rawText, prodi)`. Pure function, no
React/Convex imports, so it's testable and reusable in isolation.

- Lines are trimmed and empty ones dropped.
- A header line (`/^\d+\t(\S+)\s{2,}(.+)$/`) starts a new course block: index is discarded,
  group 1 is `code`, group 2 is `name`.
- A `Kelas:` line (`/^Kelas:\s*(\S+)\t(\d+)\t\d+\t*(.*)$/`) sets `class` (group 1) and `sks`
  (group 2) on the open block. The third numeric column in this format (values like `0`, `2`,
  `4`, `6`, `7` seen in the sample) has no field in `master_courses`'s schema and is
  deliberately dropped, the same way the existing scraper already drops any input column it
  has no home for.
- Any other non-empty line while a block is open is a continuation line and is appended to
  that block's accumulated "remainder" text (more numbered lecturers, or the trailing
  schedule).
- When a block closes (next header line, or end of input), its remainder text is scanned for:
  - **Lecturers**: every `/\d+\.\s*([^\t\n]+)/g` match, joined with `", "`. `"-"` if none.
  - **Schedule**: `/(Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu),\s*(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/`.
    Note the comma after the day name -- this format differs from
    `IntelligenceScraperDialog.tsx`'s existing schedule regex (space-separated, no comma), so
    this is a parallel implementation, not a shared one. `[]` if no match (Kerja Praktek etc.).
  - **Room**: always `"-"` -- UGM's export doesn't include a room column.
- `prodi` is stamped onto every parsed record from the function's second argument -- one
  prodi per import, same assumption `CurriculumImportDialog.tsx`'s `importProdi` field
  already makes.

Verified against the real sample (`_temp/UGM-teknik-fisika.txt`, UGM Teknik Fisika): 147
records out (matches the source's own row numbering), with correct output on all four cases
above (`TKF210058`, `TKF211201`, `TKF213148`, `TKF210073`).

Output shape (`ParsedMasterCourse`) matches exactly what the existing manual-mode parser
already builds (`code`, `name`, `sks`, `prodi`, `class`, `lecturer`, `room`, `schedule`), so it
is handed straight to `api.admin.bulkImportMaster` with no schema or mutation changes.

## Dialog

`src/components/admin/dialogs/UgmFormatImportDialog.tsx`, wired into `AdminDashboard.tsx`
alongside `IntelligenceScraperDialog`/`CurriculumImportDialog`, triggered by a "UGM Format"
button in `MasterDataTab.tsx` next to the existing "AI Scraper" button.

- **Target Prodi** is a free-text `Input` (not a `Select`), backed by a native `<datalist>` of
  existing `prodi_options` names for autocomplete, because the whole point is supporting a
  prodi that doesn't exist yet (e.g. UGM's prodi list is entirely separate from the home
  institution's). On import, if the normalized name isn't already in `prodi_options`, the
  dialog calls `api.admin.addProdiOption` first to ingest it -- no separate trip to the Prodi
  tab required. An "already exists" race from that call is swallowed; the import still
  proceeds.
- This intentionally shipped as its **own dialog** rather than a third mode bolted onto
  `IntelligenceScraperDialog` (which already has "Manual Core" and "AI Architect" modes
  sharing one column-count-based parser). Keeping the block parser in its own file and the
  dialog as a thin shell around it means the next university with its own one-off export
  shape can get its own `<university>BlockParser.ts` + a dialog copied from this one, without
  the column-count branches in `IntelligenceScraperDialog.tsx` growing another special case
  they don't share logic with.

## University-level filtering (added after initial ship)

`ScheduleConfig.tsx` already had a University select (`sessionProfile.university`), but it was
hardcoded to three options and the Prodi dropdown below it was never filtered by the choice --
UGM was previously always `disabled` ("Soon"). Since prodi collisions across universities are
possible in principle (two schools naming a prodi the same thing) and the config screen needed
an actual filter, `prodi_options` gained one field:

```ts
university: v.optional(v.string()); // undefined = home institution (UPN)
```

- `addProdiOption` (`convex/admin.ts`) accepts an optional `university` and stores it verbatim
  (uppercased/trimmed), same normalization style as `name`.
- `ProdiTab.tsx` has a University select next to Nama Prodi (`__default__` = home institution,
  or `"UGM"`), and groups the listed rows by university instead of one flat list.
- `UgmFormatImportDialog.tsx`'s auto-ingest path (see below) always tags newly-created prodi
  with `university: "UGM"` -- this dialog only ever handles UGM's format, so there's no reason
  to ask the admin to pick a university each import.
- `ScheduleConfig.tsx` filters the Prodi `Select`'s options against the chosen University
  (`!p.university` for the default UPN option, `p.university === val` otherwise), and clears
  the current prodi selection when the university changes if it no longer matches -- a prodi
  chosen under the old university is meaningless once the list underneath it changes.

This still doesn't touch `master_courses` -- prodi names stay globally unique in that table
regardless of which university they came from, and nothing groups course data by university
beyond the `prodi_options` tag used purely to drive this one dropdown filter.

## What this does NOT do

- No changes to `bulkImportMaster` or `master_courses`'s schema -- the university concept lives
  entirely in `prodi_options`, one small tag used only to filter the Prodi dropdown by
  University on the config screen and to group the admin's Prodi list.
