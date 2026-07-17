import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@/components/ui/icon";
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
          aria-label={t(titleKey)}
          className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center align-middle ml-1 cursor-pointer outline-none"
        >
          <Icon name="help" size={12} />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 rounded-card border-border shadow-overlay bg-popover">
        <div className="space-y-2">
          <h4 className="font-bold text-caption text-foreground border-b border-border pb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {t(titleKey)}
          </h4>
          <p className="text-caption text-muted-foreground font-sans">
            {t(descKey)}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
