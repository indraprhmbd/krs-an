/**
 * One-shot generator: reads the real __iconNode data out of the installed
 * lucide-react package and emits src/components/ui/icon.tsx.
 *
 * Extracting rather than hand-copying means the path data cannot be a
 * transcription error. lucide-react is ISC, so vendoring the paths is fine
 * provided the licence is attributed in the output.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIST = path.resolve("node_modules/lucide-react/dist/esm/icons");

// local name -> lucide kebab file.
// Consolidations are deliberate: the four "AI magic" icons (Brain, Sparkles,
// Wand2, Zap) collapse to one, as do the Trash/Trash2, Plus/PlusCircle,
// Edit3/Pencil, RotateCcw/RefreshCw, Shield/ShieldCheck, Bookmark/BookmarkPlus
// and Check/CheckCircle2 pairs.
const MAP = {
  // structural
  check: "check",
  close: "x",
  "chevron-left": "chevron-left",
  "chevron-right": "chevron-right",
  "chevron-down": "chevron-down",
  "chevron-up": "chevron-up",
  search: "search",

  // actions
  plus: "plus",
  trash: "trash-2",
  pencil: "pencil",
  copy: "copy",
  share: "share-2",
  refresh: "refresh-cw",
  upload: "upload",
  printer: "printer",
  "external-link": "external-link",
  "log-out": "log-out",
  bookmark: "bookmark",

  // status
  spinner: "loader-circle",
  alert: "circle-alert",
  info: "info",
  help: "circle-help",

  // domain
  sparkles: "sparkles",
  history: "history",
  database: "database",
  user: "user",
  languages: "languages",
  shield: "shield",
  clock: "clock",
  list: "list",
  message: "message-square",
  coffee: "coffee",

  // brand marks
  github: "github",
  instagram: "instagram",
  mail: "mail",
  linkedin: "linkedin",
};

/**
 * Some lucide names are aliases that only re-export `default`
 * (circle-help -> circle-question-mark), so they carry no __iconNode.
 * Follow the re-export to the canonical module rather than hardcoding
 * canonical names, which would rot on the next lucide rename.
 */
async function loadIconNode(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`Alias cycle at ${file}`);
  seen.add(file);

  const mod = await import(pathToFileURL(path.join(DIST, `${file}.js`)).href);
  if (mod.__iconNode) return { node: mod.__iconNode, resolved: file };

  const src = fs.readFileSync(path.join(DIST, `${file}.js`), "utf8");
  const target = src.match(/from\s+'\.\/([\w-]+)\.js'/)?.[1];
  if (!target) throw new Error(`No __iconNode and no re-export in ${file}`);
  return loadIconNode(target, seen);
}

const nodes = {};
for (const [local, file] of Object.entries(MAP)) {
  const { node, resolved } = await loadIconNode(file);
  if (resolved !== file) console.log(`  alias: ${file} -> ${resolved}`);
  nodes[local] = node;
}

// Drop lucide's internal render keys; they are meaningless outside their runtime.
const clean = (n) =>
  n.map(([tag, attrs]) => {
    const { key, ...rest } = attrs;
    return [tag, rest];
  });

const body = Object.entries(nodes)
  .map(([local, node]) => `  "${local}": ${JSON.stringify(clean(node))},`)
  .join("\n");

const out = `/**
 * Local icon set.
 *
 * Path data is vendored from lucide-react v0.562.0, which is ISC licensed:
 *
 *   Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022
 *   as part of Feather (MIT). All other copyright (c) for Lucide are held
 *   by Lucide Contributors 2022. Licensed under the ISC license.
 *
 * Why local instead of the package: the package was 53 icons at lucide's
 * default 2px stroke, and that uniform heavy stroke was part of why the UI
 * read as generated. One component means one place to control weight, size
 * and optical alignment, and the typed IconName union makes adding a new icon
 * a deliberate act rather than an autocomplete accident.
 *
 * This file is generated. To add an icon, add it to MAP in the generator and
 * re-run, or paste the __iconNode from node_modules/lucide-react/dist/esm/icons.
 */
import { createElement } from "react";
import type { SVGProps } from "react";

type IconNode = ReadonlyArray<readonly [string, Record<string, string | number>]>;

const ICONS = {
${body}
} as const satisfies Record<string, IconNode>;

export type IconName = keyof typeof ICONS;

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  /** Pixel size for both axes. Defaults to 16, which suits the dense UI. */
  size?: number;
  /**
   * Accessible label. Omit for decorative icons sitting next to text: the
   * icon is then hidden from assistive tech rather than read out twice.
   */
  label?: string;
}

export function Icon({ name, size = 16, label, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...props}
    >
      {(ICONS[name] as IconNode).map(([tag, attrs], i) =>
        createElement(tag, { key: i, ...attrs }),
      )}
    </svg>
  );
}
`;

fs.mkdirSync("src/components/ui", { recursive: true });
fs.writeFileSync("src/components/ui/icon.tsx", out);
console.log(`Wrote src/components/ui/icon.tsx with ${Object.keys(nodes).length} icons`);
console.log("names:", Object.keys(nodes).join(", "));

/**
 * Second, unrelated set: multicolor spot art for large decorative surfaces
 * (empty states, feature cards, onboarding), vendored from flat-color-icons
 * (icons8, MIT). <Icon> stays mono/currentColor so it themes correctly and
 * stays legible at 14-16px; a fixed-palette multicolor icon cannot do either,
 * so it gets a separate primitive used only at large sizes.
 */
const SPOT_DIST = path.resolve("node_modules/flat-color-icons/svg");

// local name -> flat-color-icons file (without .svg).
const SPOT_MAP = {
  idea: "idea",
  puzzle: "puzzle",
  planner: "planner",
  "todo-list": "todo_list",
  "empty-filter": "empty_filter",
  checkmark: "checkmark",
  share: "share",
  synchronize: "synchronize",
  search: "search",
  calendar: "calendar",
  document: "document",
  "graduation-cap": "graduation_cap",
  collaboration: "collaboration",
  database: "database",
};

const spotEntries = Object.entries(SPOT_MAP).map(([local, file]) => {
  const svg = fs.readFileSync(path.join(SPOT_DIST, `${file}.svg`), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 48 48";
  // Keep everything between the opening and closing <svg> tags as-is: these
  // are static, vendored at generation time (not user input), so embedding
  // via dangerouslySetInnerHTML at render time carries no injection risk.
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return { local, viewBox, inner };
});

const spotBody = spotEntries
  .map(
    ({ local, viewBox, inner }) =>
      `  "${local}": { viewBox: ${JSON.stringify(viewBox)}, inner: ${JSON.stringify(inner)} },`,
  )
  .join("\n");

const spotOut = `/**
 * Multicolor spot icon set.
 *
 * Markup is vendored from flat-color-icons (icons8), MIT licensed:
 *
 *   Copyright (c) Icons8 LLC. Licensed under the MIT License.
 *   https://github.com/icons8/flat-color-icons
 *
 * This is deliberately a second, separate primitive from <Icon>. <Icon> is
 * mono/currentColor so it themes correctly and stays legible at 14-16px;
 * these have fixed multicolor fills that cannot adapt to dark mode and turn
 * muddy at small sizes. Use <SpotIcon> only for large decorative art --
 * empty states, feature callouts, onboarding -- never for UI controls.
 *
 * This file is generated. To add an icon, add it to SPOT_MAP in the
 * generator and re-run; the svg file must exist in
 * node_modules/flat-color-icons/svg.
 */
import type { SVGProps } from "react";

const SPOT_ICONS = {
${spotBody}
} as const satisfies Record<string, { viewBox: string; inner: string }>;

export type SpotIconName = keyof typeof SPOT_ICONS;

export interface SpotIconProps
  extends Omit<SVGProps<SVGSVGElement>, "name" | "dangerouslySetInnerHTML"> {
  name: SpotIconName;
  /** Pixel size for both axes. Defaults to 64: this primitive is for large
   * decorative art, not UI chrome -- use <Icon> below ~24px. */
  size?: number;
  /** Accessible label. Omit when the icon is purely decorative next to text
   * that already says the same thing (the common case for spot art). */
  label?: string;
}

export function SpotIcon({ name, size = 64, label, ...props }: SpotIconProps) {
  const { viewBox, inner } = SPOT_ICONS[name];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
      {...props}
    />
  );
}
`;

fs.writeFileSync("src/components/ui/spot-icon.tsx", spotOut);
console.log(
  `Wrote src/components/ui/spot-icon.tsx with ${spotEntries.length} spot icons`,
);
console.log("spot names:", spotEntries.map((e) => e.local).join(", "));
