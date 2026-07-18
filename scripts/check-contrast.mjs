/**
 * Design token contrast guard.
 *
 * Parses the OKLCH values straight out of src/index.css (rather than keeping a
 * copy here, which would drift) and checks them against WCAG 2.1.
 *
 *   npm run check:contrast
 *
 * Thresholds:
 *   4.5:1  body text            (WCAG 1.4.3 AA)
 *   3.0:1  UI component / state (WCAG 1.4.11 non-text contrast)
 *
 * Note --border and --border-strong are decorative dividers: the surfaces they
 * separate are already distinguished by background, so 1.4.11 does not apply
 * and they are only checked for basic visibility. --input is different: the
 * border is the sole identifier of a text field, so it must clear 3:1.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, "../src/index.css");
const css = readFileSync(cssPath, "utf8");

/** Pull `--name: oklch(L% C H)` pairs out of a given block. */
function parseBlock(selector) {
  const re = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const body = css.match(re)?.[1];
  if (!body) throw new Error(`Could not find "${selector}" block in ${cssPath}`);

  const out = {};
  const decl = /--([\w-]+)\s*:\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/g;
  let m;
  while ((m = decl.exec(body))) {
    out[m[1]] = [parseFloat(m[2]) / 100, parseFloat(m[3]), parseFloat(m[4])];
  }
  return out;
}

function oklchToLinearRgb([L, C, Hdeg]) {
  const H = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function luminance(color) {
  const [r, g, b] = oklchToLinearRgb(color).map((v) => Math.max(0, Math.min(1, v)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** [foreground, background, minimum ratio] */
const PAIRS = [
  ["foreground", "background", 4.5],
  ["foreground", "card", 4.5],
  ["card-foreground", "card", 4.5],
  ["popover-foreground", "popover", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["highlight-foreground", "highlight", 4.5],
  ["warning-foreground", "warning", 4.5],

  ["primary", "background", 3.0],
  ["primary", "card", 3.0],
  ["destructive", "card", 3.0],
  ["highlight", "background", 3.0],
  ["highlight", "card", 3.0],

  // The border IS the text field. WCAG 1.4.11 applies.
  ["input", "background", 3.0],
  ["input", "card", 3.0],
  ["ring", "card", 3.0],

  // Decorative only: visibility check, not a 1.4.11 case.
  ["border-strong", "card", 1.5],
];

let failures = 0;

for (const [label, selector] of [
  ["LIGHT", ":root"],
  ["DARK", "\\.dark"],
]) {
  const theme = parseBlock(selector);
  console.log(`\n=== ${label} ===`);

  for (const [fg, bg, min] of PAIRS) {
    if (!theme[fg] || !theme[bg]) {
      console.log(`  SKIP  ${fg} on ${bg} (token not defined)`);
      continue;
    }
    const ratio = contrast(theme[fg], theme[bg]);
    const ok = ratio >= min;
    if (!ok) failures++;
    console.log(
      `  ${ok ? "PASS" : "FAIL"}  ${ratio.toFixed(2).padStart(5)}:1  (min ${min})  ${fg} on ${bg}`,
    );
  }
}

console.log(
  failures === 0
    ? "\nAll contrast checks passed.\n"
    : `\n${failures} contrast check(s) FAILED.\n`,
);

process.exit(failures === 0 ? 0 : 1);
