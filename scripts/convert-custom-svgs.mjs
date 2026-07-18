/**
 * Convert custom SVGs from assets/custom-icons/ to IconNode entries.
 * Strips styling attrs that <Icon> provides. Keeps structural attrs.
 *
 * Usage: node scripts/convert-custom-svgs.mjs
 * Output: formatted entries to paste into icon.tsx
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve("assets/custom-icons");

const STRIP_ATTRS = new Set([
  "fill", "stroke",
  "stroke-width", "stroke-linecap", "stroke-linejoin",
]);

const toCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Serialize attrs object to JS literal: {cx:12,cy:12,r:10} */
function fmtAttrs(attrs) {
  const kvs = Object.entries(attrs).map(([k, v]) =>
    typeof v === "number" ? `${k}:${v}` : `${k}:"${v}"`
  );
  return "{" + kvs.join(",") + "}";
}

function parseElements(svg) {
  const elements = [];
  const re = /<(\w+)([^>]*)\/?>/gs;
  let m;
  while ((m = re.exec(svg)) !== null) {
    const [, tag, rawAttrs] = m;
    if (tag === "svg") continue;

    const attrs = {};
    const attrRe = /(\w[\w-]*)=["']([^"']*)["']/gs;
    let a;
    while ((a = attrRe.exec(rawAttrs)) !== null) {
      const [, name, raw] = a;
      if (STRIP_ATTRS.has(name)) continue;
      attrs[toCamel(name)] = isNaN(Number(raw)) ? raw : Number(raw);
    }
    // Drop children with no meaningful attrs left (e.g. fill-only circle)
    if (Object.keys(attrs).length === 0) continue;
    elements.push([tag, attrs]);
  }
  return elements;
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith(".svg"));

for (const f of files) {
  const local = f.replace(/\.svg$/, "").replace(/-svgrepo-com$/, "");
  const svg = fs.readFileSync(path.join(SRC, f), "utf8");
  const elements = parseElements(svg);
  const body = elements.map(([tag, attrs]) => `["${tag}",${fmtAttrs(attrs)}]`).join(",");
  console.log(`  "${local}": [${body}],`);
}
