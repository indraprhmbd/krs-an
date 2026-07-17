/**
 * Typography guard.
 *
 * The type roles in src/index.css only hold if call sites stop improvising.
 * Before the scale existed there were 14 distinct sizes, 183 of them arbitrary
 * sub-12px values, and one uppercase-mono-tracking treatment on every role at
 * once. Nothing in the build caught any of it: arbitrary sizes compile fine.
 *
 * So this asserts the rules the tokens depend on. Exits non-zero on violation.
 * Run via `npm run check:typography`.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "src");

// Files allowed to break a rule, with the reason. Anything else is a failure.
const ALLOW = {
  // Inputs must render at >=16px on mobile or iOS Safari zooms the page on
  // focus. text-base is the deliberate exception; the md: half uses a role.
  "components/ui/input.tsx": ["text-base"],
  "components/ui/textarea.tsx": ["text-base"],
  "components/ui/select.tsx": ["text-base"],
};

const RULES = [
  {
    name: "arbitrary font size",
    re: /className="[^"]*\btext-\[\d+px\]/g,
    why: "Use a role token (text-body, text-caption, text-caps, ...) from index.css.",
  },
  {
    name: "font-display",
    re: /className="[^"]*\bfont-display\b/g,
    why: "One family serves everything now. Heading roles carry the weight.",
  },
  {
    name: "font-black / font-extrabold",
    re: /className="[^"]*\bfont-(?:black|extrabold)\b/g,
    why: "Plus Jakarta Sans Variable stops at 800; 900 clamps and reads lighter, not heavier.",
  },
  {
    name: "stock t-shirt text size",
    re: /className="[^"]*\b(?:sm:|md:|lg:|xl:|xs:)?text-(?:xs|sm|lg|xl|2xl|3xl|4xl|5xl|6xl)\b/g,
    why: "Use a role token instead; the stock scale carries no leading/weight/tracking.",
  },
  {
    name: "loose tracking outside the caps role",
    re: /className="(?![^"]*\btext-caps\b)[^"]*\btracking-(?:widest|wider|\[0\.[1-9])/g,
    why: "Wide tracking belongs to text-caps (short uppercase strings) and nowhere else.",
  },
];

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

let failures = 0;
let checked = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf8");
  checked++;

  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(src)) !== null) {
      const hit = m[0].slice(m[0].lastIndexOf(" ") + 1);
      if ((ALLOW[rel] || []).some((a) => hit.includes(a))) continue;

      const line = src.slice(0, m.index).split("\n").length;
      console.error(`FAIL  ${rel}:${line}  ${rule.name}: ${hit}`);
      console.error(`      ${rule.why}`);
      failures++;
    }
  }
}

if (failures) {
  console.error(`\n${failures} typography violation(s) across ${checked} files.`);
  process.exit(1);
}
console.log(`All typography checks passed (${checked} files).`);
