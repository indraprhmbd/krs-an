/**
 * i18n guard.
 *
 * `t()` falls back to returning the key itself when it is missing, so a typo or
 * a forgotten entry renders literal text like "selector.no_subjects" to the
 * user. That shipped. Nothing else catches it: it compiles, lints and builds
 * cleanly, because a string is a string.
 *
 * Asserts:
 *   1. every key used in src/ exists in BOTH language maps
 *   2. the two maps have identical key sets (no half-translated key)
 *   3. every {placeholder} in a translation is filled by its call sites
 *
 * Unused keys are reported but do not fail: a key can legitimately land before
 * its UI does.
 */
import fs from "node:fs";
import path from "node:path";

const CTX = "src/context/LanguageContext.tsx";
const ROOT = "src";

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

const ctx = fs.readFileSync(CTX, "utf8");
const idStart = ctx.indexOf("ID: {");
const enStart = ctx.indexOf("EN: {");
if (idStart === -1 || enStart === -1) {
  console.error(`FAIL  ${CTX}: could not locate the ID/EN translation maps.`);
  process.exit(1);
}

const keyRe = /"([a-z0-9_]+\.[a-z0-9_]+)":/gi;
const entriesOf = (block) => {
  const map = new Map();
  // Grab each "key": "value" pair so placeholders can be checked too.
  const pairRe = /"([a-z0-9_]+\.[a-z0-9_]+)":\s*(?:\n\s*)?("(?:[^"\\]|\\.)*")/gi;
  let m;
  while ((m = pairRe.exec(block)) !== null) map.set(m[1], m[2]);
  // Keys whose value spans lines oddly still register via the simpler regex.
  keyRe.lastIndex = 0;
  while ((m = keyRe.exec(block)) !== null)
    if (!map.has(m[1])) map.set(m[1], '""');
  return map;
};

const ID = entriesOf(ctx.slice(idStart, enStart));
const EN = entriesOf(ctx.slice(enStart));

const used = new Map();
const varsAt = new Map();
for (const file of walk(ROOT)) {
  if (path.resolve(file) === path.resolve(CTX)) continue;
  const src = fs.readFileSync(file, "utf8");
  const rel = path.relative(".", file).split(path.sep).join("/");

  // t("key") and t("key", { a: 1 })
  const tRe = /\bt\(\s*"([^"]+)"\s*(?:,\s*\{([^}]*)\})?\s*\)/g;
  let m;
  while ((m = tRe.exec(src)) !== null) {
    const line = src.slice(0, m.index).split("\n").length;
    if (!used.has(m[1])) used.set(m[1], []);
    used.get(m[1]).push(`${rel}:${line}`);
    // Both `{ count: n }` and the `{ count }` shorthand. Matching only the
    // former reported every shorthand call site as a missing placeholder.
    const body = m[2] || "";
    const names = new Set([
      ...[...body.matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map((x) => x[1]),
      ...[...body.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*(?=,|$)/g)].map(
        (x) => x[1],
      ),
    ]);
    varsAt.set(m[1], names);
  }
  // <HelpTooltip titleKey="..." descKey="..." />
  for (const mm of src.matchAll(/(?:titleKey|descKey)=\{?"([^"]+)"/g)) {
    const line = src.slice(0, mm.index).split("\n").length;
    if (!used.has(mm[1])) used.set(mm[1], []);
    used.get(mm[1]).push(`${rel}:${line}`);
  }
}

let failures = 0;

for (const [key, sites] of used) {
  const inID = ID.has(key);
  const inEN = EN.has(key);
  if (!inID || !inEN) {
    const where = !inID && !inEN ? "BOTH maps" : !inID ? "the ID map" : "the EN map";
    console.error(`FAIL  missing from ${where}: ${key}`);
    console.error(`      used at: ${sites.join(", ")}`);
    console.error(`      t() would render the raw key to the user.`);
    failures++;
  }
}

for (const key of ID.keys())
  if (!EN.has(key)) {
    console.error(`FAIL  in ID but not EN: ${key}`);
    failures++;
  }
for (const key of EN.keys())
  if (!ID.has(key)) {
    console.error(`FAIL  in EN but not ID: ${key}`);
    failures++;
  }

// Placeholders must be supplied, or the user sees a literal "{count}".
for (const [key, value] of [...ID, ...EN]) {
  if (!used.has(key)) continue;
  const needed = new Set(
    [...value.matchAll(/\{([A-Za-z_$][\w$]*)\}/g)].map((m) => m[1]),
  );
  if (!needed.size) continue;
  const supplied = varsAt.get(key) || new Set();
  for (const n of needed)
    if (!supplied.has(n)) {
      console.error(`FAIL  ${key}: placeholder {${n}} is never supplied.`);
      console.error(`      used at: ${(used.get(key) || []).join(", ")}`);
      failures++;
    }
}

const unused = [...ID.keys()].filter((k) => !used.has(k));
if (unused.length) {
  console.log(`note: ${unused.length} key(s) defined but unused: ${unused.join(", ")}`);
}

if (failures) {
  console.error(`\n${failures} i18n problem(s).`);
  process.exit(1);
}
console.log(`All i18n checks passed (${ID.size} keys, ${used.size} used).`);
