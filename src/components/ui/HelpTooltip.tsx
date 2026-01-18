import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface HelpTooltipProps {
  titleKey: string;
  descKey: string;
}

export function HelpTooltip({ titleKey, descKey }: HelpTooltipProps) {
  const { t } = useLanguage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="text-slate-400 hover:text-blue-600 transition-colors inline-flex items-center align-middle ml-1 cursor-pointer outline-none"
        >
          <HelpCircle size={12} />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 rounded-2xl border-slate-100 shadow-xl bg-white">
        <div className="space-y-2">
          <h4 className="font-bold text-xs text-slate-900 border-b border-slate-50 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            {t(titleKey)}
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            {t(descKey)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
