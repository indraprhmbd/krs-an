import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. The custom tokens defined
 * in src/index.css are invisible to it, so without this it would keep both
 * `rounded-panel` and `rounded-3xl` instead of letting the later one win, and
 * conflicting classes would silently resolve by CSS source order.
 *
 * Any new custom token in the @theme block that shares a property with a stock
 * utility needs registering here too.
 *
 * `font-size` is not optional and is the nastiest of the three. tailwind-merge
 * validates that group against an anchored t-shirt regex (xs|sm|md|lg|xl), so a
 * role name like `text-body` fails it and falls through to the `text-color`
 * group, whose validator accepts literally anything. The token is then treated
 * as a colour and dropped by the next colour class:
 *
 *   cn("text-body", "text-muted-foreground")  ->  "text-muted-foreground"
 *
 * Silent. Build and lint both pass; the type role simply never applies. Every
 * primitive merges a className, so this would read as "the type tokens randomly
 * do not work". Literal registrations are matched ahead of validators, so
 * listing the roles here makes font-size win over text-color as intended.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["control", "card", "panel"] }],
      shadow: [{ shadow: ["card", "overlay"] }],
      "font-size": [
        {
          text: [
            "display",
            "headline",
            "title",
            "body",
            "body-sm",
            "label",
            "caption",
            "caps",
            "data",
            "data-sm",
            "grid",
            "grid-meta",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
