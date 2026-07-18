import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string | null;
  planName: string;
}

export function ShareDialog({
  isOpen,
  onClose,
  shareId,
  planName,
}: ShareDialogProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success(t("toast.link_copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        size="md"
        padded={false}
      >
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex items-center gap-2 text-headline">
                <Icon name="share" size={18} />
                Bagikan Jadwal
              </DialogTitle>
              <DialogDescription className="max-w-[250px] truncate text-caption text-muted-foreground">
                {planName}
              </DialogDescription>
            </div>
            <DialogClose className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent">
              <Icon name="close" size={16} />
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="p-3 md:p-4 space-y-4 bg-card">
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-control border border-border space-y-3">
              <p className="text-caps text-muted-foreground uppercase">
                Tautan
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-card border border-border rounded-control px-3 py-2 text-caption font-mono text-muted-foreground truncate">
                  {shareUrl}
                </div>
                <Button
                  size="icon"
                  aria-label={copied ? "Link copied" : "Copy link"}
                  onClick={handleCopy}
                  className={cn(
                    "h-10 w-10 shrink-0",
                    copied && "bg-emerald-600 hover:bg-emerald-600",
                  )}
                >
                  <Icon name={copied ? "check" : "copy"} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-11 text-caption font-bold"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <Icon name="external-link" size={14} />
                  Buka Tautan
              </Button>
              <Button
                className="h-11 text-caption font-bold"
                onClick={() => {
                  const text = `Jadwal KRS - ${planName}\n${shareUrl}`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(text)}`,
                    "_blank",
                  );
                }}
              >
                WhatsApp
              </Button>
            </div>
          </div>

          <p className="text-caption text-center text-muted-foreground italic border-t border-border pt-4">
            Siapa pun yang punya tautan ini bisa lihat dan impor jadwal ke arsip mereka.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
