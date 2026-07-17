import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // text-base below md is deliberate and must stay: iOS Safari zooms the
          // page when a focused field's text is under 16px. Desktop drops to the
          // body role.
          "flex h-9 w-full rounded-control border border-input bg-transparent px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-label file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 md:text-body",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
