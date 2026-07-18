/**
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
  "idea": { viewBox: "0 0 48 48", inner: "\n    <circle fill=\"#FFF59D\" cx=\"24\" cy=\"22\" r=\"20\"/>\n    <path fill=\"#FBC02D\" d=\"M37,22c0-7.7-6.6-13.8-14.5-12.9c-6,0.7-10.8,5.5-11.4,11.5c-0.5,4.6,1.4,8.7,4.6,11.3 c1.4,1.2,2.3,2.9,2.3,4.8V37h12v-0.1c0-1.8,0.8-3.6,2.2-4.8C35.1,29.7,37,26.1,37,22z\"/>\n    <path fill=\"#FFF59D\" d=\"M30.6,20.2l-3-2c-0.3-0.2-0.8-0.2-1.1,0L24,19.8l-2.4-1.6c-0.3-0.2-0.8-0.2-1.1,0l-3,2 c-0.2,0.2-0.4,0.4-0.4,0.7s0,0.6,0.2,0.8l3.8,4.7V37h2V26c0-0.2-0.1-0.4-0.2-0.6l-3.3-4.1l1.5-1l2.4,1.6c0.3,0.2,0.8,0.2,1.1,0 l2.4-1.6l1.5,1l-3.3,4.1C25.1,25.6,25,25.8,25,26v11h2V26.4l3.8-4.7c0.2-0.2,0.3-0.5,0.2-0.8S30.8,20.3,30.6,20.2z\"/>\n    <circle fill=\"#5C6BC0\" cx=\"24\" cy=\"44\" r=\"3\"/>\n    <path fill=\"#9FA8DA\" d=\"M26,45h-4c-2.2,0-4-1.8-4-4v-5h12v5C30,43.2,28.2,45,26,45z\"/>\n    <g fill=\"#5C6BC0\">\n        <path d=\"M30,41l-11.6,1.6c0.3,0.7,0.9,1.4,1.6,1.8l9.4-1.3C29.8,42.5,30,41.8,30,41z\"/>\n        <polygon points=\"18,38.7 18,40.7 30,39 30,37\"/>\n    </g>\n" },
  "puzzle": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#8BC34A\" d=\"M39,15c0-2.2-1.8-4-4-4h-6c-0.7,0-1.1-0.8-0.7-1.4c0.6-1,0.9-2.2,0.6-3.5c-0.4-2-1.9-3.6-3.8-4 C21.8,1.4,19,3.9,19,7c0,1,0.3,1.8,0.7,2.6c0.4,0.6,0,1.4-0.8,1.4h-6c-2.2,0-4,1.8-4,4v7c0,0.7,0.8,1.1,1.4,0.7 c1-0.6,2.2-0.9,3.5-0.6c2,0.4,3.6,1.9,4,3.8c0.7,3.2-1.8,6.1-4.9,6.1c-1,0-1.8-0.3-2.6-0.7C9.8,30.9,9,31.3,9,32v6c0,2.2,1.8,4,4,4 h22c2.2,0,4-1.8,4-4V15z\"/>\n" },
  "planner": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#CFD8DC\" d=\"M5,38V14h38v24c0,2.2-1.8,4-4,4H9C6.8,42,5,40.2,5,38z\"/>\n    <path fill=\"#F44336\" d=\"M43,10v6H5v-6c0-2.2,1.8-4,4-4h30C41.2,6,43,7.8,43,10z\"/>\n    <g fill=\"#B71C1C\">\n        <circle cx=\"33\" cy=\"10\" r=\"3\"/>\n        <circle cx=\"15\" cy=\"10\" r=\"3\"/>\n    </g>\n    <g fill=\"#B0BEC5\">\n        <path d=\"M33,3c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2s2-0.9,2-2V5C35,3.9,34.1,3,33,3z\"/>\n        <path d=\"M15,3c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2s2-0.9,2-2V5C17,3.9,16.1,3,15,3z\"/>\n    </g>\n    <g fill=\"#B0BEC5\">\n        <rect x=\"13\" y=\"21\" width=\"6\" height=\"6\"/>\n        <rect x=\"21\" y=\"21\" width=\"6\" height=\"6\"/>\n        <rect x=\"29\" y=\"21\" width=\"6\" height=\"6\"/>\n        <rect x=\"13\" y=\"29\" width=\"6\" height=\"6\"/>\n        <rect x=\"21\" y=\"29\" width=\"6\" height=\"6\"/>\n    </g>\n    <rect x=\"29\" y=\"29\" fill=\"#F44336\" width=\"6\" height=\"6\"/>\n" },
  "todo-list": { viewBox: "0 0 48 48", inner: "\n    <g fill=\"#3F51B5\">\n        <polygon points=\"17.8,18.1 10.4,25.4 6.2,21.3 4,23.5 10.4,29.9 20,20.3\"/>\n        <polygon points=\"17.8,5.1 10.4,12.4 6.2,8.3 4,10.5 10.4,16.9 20,7.3\"/>\n        <polygon points=\"17.8,31.1 10.4,38.4 6.2,34.3 4,36.5 10.4,42.9 20,33.3\"/>\n    </g>\n    <g fill=\"#90CAF9\">\n        <rect x=\"24\" y=\"22\" width=\"20\" height=\"4\"/>\n        <rect x=\"24\" y=\"9\" width=\"20\" height=\"4\"/>\n        <rect x=\"24\" y=\"35\" width=\"20\" height=\"4\"/>\n    </g>\n" },
  "empty-filter": { viewBox: "0 0 48 48", inner: "\n    <g fill=\"#FFCC80\">\n        <polygon points=\"29,23 19,23 7,9 41,9\"/>\n        <polygon points=\"29,38 19,44 19,23 29,23\"/>\n        <path d=\"M41.5,9h-35C5.7,9,5,8.3,5,7.5v0C5,6.7,5.7,6,6.5,6h35C42.3,6,43,6.7,43,7.5v0C43,8.3,42.3,9,41.5,9z\"/>\n    </g>\n" },
  "checkmark": { viewBox: "0 0 48 48", inner: "\n    <polygon fill=\"#43A047\" points=\"40.6,12.1 17,35.7 7.4,26.1 4.6,29 17,41.3 43.4,14.9\"/>\n" },
  "share": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#1976D2\" d=\"M38.1,31.2L19.4,24l18.7-7.2c1.5-0.6,2.3-2.3,1.7-3.9c-0.6-1.5-2.3-2.3-3.9-1.7l-26,10C8.8,21.6,8,22.8,8,24 s0.8,2.4,1.9,2.8l26,10c0.4,0.1,0.7,0.2,1.1,0.2c1.2,0,2.3-0.7,2.8-1.9C40.4,33.5,39.6,31.8,38.1,31.2z\"/>\n    <g fill=\"#1E88E5\">\n        <circle cx=\"11\" cy=\"24\" r=\"7\"/>\n        <circle cx=\"37\" cy=\"14\" r=\"7\"/>\n        <circle cx=\"37\" cy=\"34\" r=\"7\"/>\n    </g>\n" },
  "synchronize": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#FF6F00\" d=\"M38.7,11.9l-3.1,2.5c2.2,2.7,3.4,6.1,3.4,9.5c0,8.3-6.7,15-15,15c-0.9,0-1.9-0.1-2.8-0.3l-0.7,3.9 c1.2,0.2,2.4,0.3,3.5,0.3c10.5,0,19-8.5,19-19C43,19.6,41.5,15.3,38.7,11.9z\"/>\n    <polygon fill=\"#FF6F02\" points=\"31,8 42.9,9.6 33.1,19.4\"/>\n    <path fill=\"#FF6F00\" d=\"M24,5C13.5,5,5,13.5,5,24c0,4.6,1.6,9,4.6,12.4l3-2.6C10.3,31.1,9,27.6,9,24c0-8.3,6.7-15,15-15 c0.9,0,1.9,0.1,2.8,0.3l0.7-3.9C26.4,5.1,25.2,5,24,5z\"/>\n    <polygon fill=\"#FF6F02\" points=\"17,40 5.1,38.4 14.9,28.6\"/>\n" },
  "search": { viewBox: "0 0 48 48", inner: "\n    <g fill=\"#616161\">\n        <rect x=\"34.6\" y=\"28.1\" transform=\"matrix(.707 -.707 .707 .707 -15.154 36.586)\" width=\"4\" height=\"17\"/>\n        <circle cx=\"20\" cy=\"20\" r=\"16\"/>\n    </g>\n    <rect x=\"36.2\" y=\"32.1\" transform=\"matrix(.707 -.707 .707 .707 -15.839 38.239)\" fill=\"#37474F\" width=\"4\" height=\"12.3\"/>\n    <circle fill=\"#64B5F6\" cx=\"20\" cy=\"20\" r=\"13\"/>\n    <path fill=\"#BBDEFB\" d=\"M26.9,14.2c-1.7-2-4.2-3.2-6.9-3.2s-5.2,1.2-6.9,3.2c-0.4,0.4-0.3,1.1,0.1,1.4c0.4,0.4,1.1,0.3,1.4-0.1 C16,13.9,17.9,13,20,13s4,0.9,5.4,2.5c0.2,0.2,0.5,0.4,0.8,0.4c0.2,0,0.5-0.1,0.6-0.2C27.2,15.3,27.2,14.6,26.9,14.2z\"/>\n" },
  "calendar": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#CFD8DC\" d=\"M5,38V14h38v24c0,2.2-1.8,4-4,4H9C6.8,42,5,40.2,5,38z\"/>\n    <path fill=\"#F44336\" d=\"M43,10v6H5v-6c0-2.2,1.8-4,4-4h30C41.2,6,43,7.8,43,10z\"/>\n    <g fill=\"#B71C1C\">\n        <circle cx=\"33\" cy=\"10\" r=\"3\"/>\n        <circle cx=\"15\" cy=\"10\" r=\"3\"/>\n    </g>\n    <g fill=\"#B0BEC5\">\n        <path d=\"M33,3c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2s2-0.9,2-2V5C35,3.9,34.1,3,33,3z\"/>\n        <path d=\"M15,3c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2s2-0.9,2-2V5C17,3.9,16.1,3,15,3z\"/>\n    </g>\n    <g fill=\"#90A4AE\">\n        <rect x=\"13\" y=\"20\" width=\"4\" height=\"4\"/>\n        <rect x=\"19\" y=\"20\" width=\"4\" height=\"4\"/>\n        <rect x=\"25\" y=\"20\" width=\"4\" height=\"4\"/>\n        <rect x=\"31\" y=\"20\" width=\"4\" height=\"4\"/>\n        <rect x=\"13\" y=\"26\" width=\"4\" height=\"4\"/>\n        <rect x=\"19\" y=\"26\" width=\"4\" height=\"4\"/>\n        <rect x=\"25\" y=\"26\" width=\"4\" height=\"4\"/>\n        <rect x=\"31\" y=\"26\" width=\"4\" height=\"4\"/>\n        <rect x=\"13\" y=\"32\" width=\"4\" height=\"4\"/>\n        <rect x=\"19\" y=\"32\" width=\"4\" height=\"4\"/>\n        <rect x=\"25\" y=\"32\" width=\"4\" height=\"4\"/>\n        <rect x=\"31\" y=\"32\" width=\"4\" height=\"4\"/>\n    </g>\n" },
  "document": { viewBox: "0 0 48 48", inner: "\n    <polygon fill=\"#90CAF9\" points=\"40,45 8,45 8,3 30,3 40,13\"/>\n    <polygon fill=\"#E1F5FE\" points=\"38.5,14 29,14 29,4.5\"/>\n    <g fill=\"#1976D2\">\n        <rect x=\"16\" y=\"21\" width=\"17\" height=\"2\"/>\n        <rect x=\"16\" y=\"25\" width=\"13\" height=\"2\"/>\n        <rect x=\"16\" y=\"29\" width=\"17\" height=\"2\"/>\n        <rect x=\"16\" y=\"33\" width=\"13\" height=\"2\"/>\n    </g>\n" },
  "graduation-cap": { viewBox: "0 0 48 48", inner: "\n    <g fill=\"#37474F\">\n        <rect x=\"9\" y=\"20\" width=\"30\" height=\"13\"/>\n        <ellipse cx=\"24\" cy=\"33\" rx=\"15\" ry=\"6\"/>\n    </g>\n    <path fill=\"#78909C\" d=\"M23.1,8.2L0.6,18.1c-0.8,0.4-0.8,1.5,0,1.9l22.5,9.9c0.6,0.2,1.2,0.2,1.8,0l22.5-9.9c0.8-0.4,0.8-1.5,0-1.9 L24.9,8.2C24.3,7.9,23.7,7.9,23.1,8.2z\"/>\n    <g fill=\"#37474F\">\n        <path d=\"M43.2,20.4l-20-3.4c-0.5-0.1-1.1,0.3-1.2,0.8c-0.1,0.5,0.3,1.1,0.8,1.2L42,22.2V37c0,0.6,0.4,1,1,1 s1-0.4,1-1V21.4C44,20.9,43.6,20.5,43.2,20.4z\"/>\n        <circle cx=\"43\" cy=\"37\" r=\"2\"/>\n        <path d=\"M46,40c0,1.7-3,6-3,6s-3-4.3-3-6s1.3-3,3-3S46,38.3,46,40z\"/>\n    </g>\n" },
  "collaboration": { viewBox: "0 0 48 48", inner: "\n    <path fill=\"#1565C0\" d=\"M25,22h13l6,6V11c0-2.2-1.8-4-4-4H25c-2.2,0-4,1.8-4,4v7C21,20.2,22.8,22,25,22z\"/>\n    <path fill=\"#2196F3\" d=\"M23,19H10l-6,6V8c0-2.2,1.8-4,4-4h15c2.2,0,4,1.8,4,4v7C27,17.2,25.2,19,23,19z\"/>\n    <g fill=\"#FFA726\">\n        <circle cx=\"12\" cy=\"31\" r=\"5\"/>\n        <circle cx=\"36\" cy=\"31\" r=\"5\"/>\n    </g>\n    <g fill=\"#607D8B\">\n        <path d=\"M20,42c0,0-2.2-4-8-4s-8,4-8,4v2h16V42z\"/>\n        <path d=\"M44,42c0,0-2.2-4-8-4s-8,4-8,4v2h16V42z\"/>\n    </g>\n" },
  "database": { viewBox: "0 0 48 48", inner: "\n    <g fill=\"#D1C4E9\">\n        <path d=\"M38,7H10C8.9,7,8,7.9,8,9v6c0,1.1,0.9,2,2,2h28c1.1,0,2-0.9,2-2V9C40,7.9,39.1,7,38,7z\"/>\n        <path d=\"M38,19H10c-1.1,0-2,0.9-2,2v6c0,1.1,0.9,2,2,2h28c1.1,0,2-0.9,2-2v-6C40,19.9,39.1,19,38,19z\"/>\n        <path d=\"M38,31H10c-1.1,0-2,0.9-2,2v6c0,1.1,0.9,2,2,2h28c1.1,0,2-0.9,2-2v-6C40,31.9,39.1,31,38,31z\"/>\n    </g>\n" },
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
