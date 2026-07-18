import type { CSSProperties } from "react"
import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      className="toaster group !z-[100]"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-overlay group-[.toaster]:rounded-card",
          title: "group-[.toast]:text-body group-[.toast]:font-semibold",
          description:
            "group-[.toast]:text-body-sm group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          // Sonner's own variant colors don't map to our tokens, so each is
          // pinned to the token that already carries that meaning elsewhere
          // (destructive for errors, highlight for warnings) rather than
          // sonner's default red/amber. Success and info reuse the base
          // toast styling above, which is already primary-neutral.
          error:
            "group-[.toaster]:border-destructive/40 group-[.toaster]:[&_svg]:text-destructive",
          warning:
            "group-[.toaster]:border-highlight/40 group-[.toaster]:[&_svg]:text-highlight",
          success:
            "group-[.toaster]:border-primary/40 group-[.toaster]:[&_svg]:text-primary",
        },
      }}
      style={{ bottom: "72px" } as CSSProperties}
    />
  )
}

export { Toaster }
