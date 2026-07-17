import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Mirrors Input. Both lean on --input rather than --border: the field's
        // edge is the only thing identifying it, so it needs 3:1 (WCAG 1.4.11).
        // text-base below md prevents iOS focus zoom, same as Input.
        "flex min-h-[80px] w-full rounded-control border border-input bg-transparent px-3 py-2 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-body",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
