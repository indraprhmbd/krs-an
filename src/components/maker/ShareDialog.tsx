import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Share2, Copy, Check, X, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/${shareId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className="sm:max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl"
      >
        <DialogHeader className="p-0">
          <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-display font-black mb-1 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-500" />
                Share Plan
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs truncate max-w-[250px]">
                {planName}
              </DialogDescription>
            </div>
            <DialogClose className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 transition-colors z-[70]">
              <X size={20} className="text-white" />
            </DialogClose>
            <Share2 className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-500/10 -rotate-12" />
          </div>
        </DialogHeader>

        <div className="p-5 md:p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Shareable Link
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate">
                  {shareUrl}
                </div>
                <Button
                  size="icon"
                  onClick={handleCopy}
                  className={`shrink-0 rounded-xl w-10 h-10 transition-all ${
                    copied
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="rounded-xl h-11 text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-2"
                onClick={() => window.open(shareUrl, "_blank")}
              >
                <ExternalLink size={14} />
                Preview Link
              </Button>
              <Button
                className="rounded-xl h-11 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2"
                onClick={() => {
                  const text = `Check out my KRS plan: ${planName}\n${shareUrl}`;
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

          <p className="text-[10px] text-center text-slate-400 leading-relaxed italic border-t border-slate-50 pt-4">
            Anyone with this link can view and import this plan to their own
            archive.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
