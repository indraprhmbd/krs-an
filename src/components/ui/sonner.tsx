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
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      style={{ bottom: "56px" } as CSSProperties}
    />
  )
}

export { Toaster }
