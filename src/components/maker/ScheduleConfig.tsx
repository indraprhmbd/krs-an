import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { HelpTooltip } from "../ui/HelpTooltip";
import { clearKRSSession } from "../../hooks/useLocalStorage";
import { RotateCcw } from "lucide-react";

interface ScheduleConfigProps {
  sessionProfile: {
    university: string;
    prodi: string;
    semester: number;
    maxSks: number;
    useMaster: boolean;
  };
  setSessionProfile: (profile: any) => void;
  onStart: () => void;
}

export function ScheduleConfig({
  sessionProfile,
  setSessionProfile,
  onStart,
}: ScheduleConfigProps) {
  const { t } = useLanguage();
  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-6">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Context & Identity */}
        <div className="lg:col-span-5 space-y-6 md:space-y-8 py-2 md:py-4">
          <div className="space-y-3 md:space-y-4">
            <Badge className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/15 border-blue-200/50 px-2 py-0.5 md:px-3 md:py-1 rounded-full font-mono text-[9px] md:text-[10px] tracking-widest uppercase truncate max-w-full">
              {t("config.academic_year")}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-slate-900 tracking-tight leading-tight break-words max-w-full">
              {t("config.title")} <br className="hidden md:block" />
              <span className="text-blue-700 block md:inline">
                {t("config.title_span")}
              </span>
            </h2>
            <p className="text-slate-600 max-w-sm leading-relaxed text-sm md:text-base">
              {t("config.sub_title")}
            </p>
          </div>

          <div className="relative overflow-hidden bg-slate-900 text-white py-2 rounded-2xl shadow-lg border border-slate-800 max-w-[90vw] md:max-w-full mx-auto">
            <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
              <div className="flex items-center gap-3 px-4">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                  {t("config.ai_engine_active")}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700 mx-2" />
                <span className="text-[10px] font-mono text-slate-400">
                  {t("config.ai_scrolling")}
                </span>
              </div>
              {/* Duplicate for seamless loop */}
              <div className="flex items-center gap-3 px-4">
                <Brain className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                  {t("config.ai_engine_active")}
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-700 mx-2" />
                <span className="text-[10px] font-mono text-slate-400">
                  {t("config.ai_scrolling")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: The "Configuration" Card */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 sm:p-8 rounded-[32px] border border-slate-200 shadow-2xl shadow-blue-100/20 space-y-1 transition-all hover:shadow-blue-100/30">
            <div className="space-y-0.5">
              <h1 className="text-xl font-display font-bold text-slate-900 uppercase tracking-widest">
                {t("config.card_title")}
              </h1>
              <div className="h-1 w-12 bg-blue-700 rounded-full" />
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                  {t("config.univ_label")}
                </Label>
                <Select
                  value={sessionProfile.university}
                  onValueChange={(val) =>
                    setSessionProfile({ ...sessionProfile, university: val })
                  }
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 font-display text-sm h-12 rounded-xl focus:ring-blue-700/20">
                    <SelectValue placeholder={t("config.univ_placeholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="UPN_VETERAN_YOGYAKARTA">
                      <div className="flex items-center gap-2">
                        <img
                          src="/assets/univ/upnyk.webp"
                          alt="Logo"
                          className="w-4 h-4 rounded-sm object-contain"
                        />
                        <span>UPN "Veteran" Yogyakarta</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="UNY" disabled>
                      Univ. Negeri Yogyakarta (Soon)
                    </SelectItem>
                    <SelectItem value="UGM" disabled>
                      Univ. Gadjah Mada (Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                  {t("config.prodi_label")}
                  <HelpTooltip
                    titleKey="help.master_data_title"
                    descKey="help.master_data_desc"
                  />
                </Label>
                <Select
                  value={sessionProfile.prodi}
                  onValueChange={(val) =>
                    setSessionProfile({ ...sessionProfile, prodi: val })
                  }
                >
                  <SelectTrigger className="bg-slate-50/50 border-slate-200 font-display text-sm h-12 rounded-xl focus:ring-blue-700/20">
                    <SelectValue placeholder={t("config.prodi_placeholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    <SelectItem value="INFORMATIKA">INFORMATIKA</SelectItem>
                    <SelectItem value="SISTEM INFORMASI">
                      SISTEM INFORMASI
                    </SelectItem>
                    <SelectItem value="TEKNIK INDUSTRI">
                      TEKNIK INDUSTRI
                    </SelectItem>
                    <SelectItem value="TEKNIK KIMIA">TEKNIK KIMIA</SelectItem>
                    <SelectItem value="TEKNIK PERTAMBANGAN">
                      TEKNIK PERTAMBANGAN
                    </SelectItem>
                    <SelectItem value="TEKNIK ELEKTRO" disabled>
                      TEKNIK ELEKTRO (Coming Soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                    {t("config.semester_label")}
                  </Label>
                  <Select
                    value={sessionProfile.semester.toString()}
                    onValueChange={(val) =>
                      setSessionProfile({
                        ...sessionProfile,
                        semester: parseInt(val),
                      })
                    }
                  >
                    <SelectTrigger className="bg-slate-50/50 border-slate-200 font-display text-sm h-12 rounded-xl focus:ring-blue-700/20">
                      <SelectValue placeholder="Sem" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          Semester {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                    {t("config.max_sks_label")}
                  </Label>
                  <Input
                    type="number"
                    value={sessionProfile.maxSks}
                    onChange={(e) =>
                      setSessionProfile({
                        ...sessionProfile,
                        maxSks: parseInt(e.target.value),
                      })
                    }
                    className="bg-slate-50/50 border-slate-200 font-mono text-sm h-12 rounded-xl focus:ring-blue-700/20"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={onStart}
              className="w-full mt-8 bg-blue-700 hover:bg-blue-800 text-white h-14 rounded-2xl font-display font-bold text-base shadow-xl shadow-blue-100 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {t("config.btn_init")}
            </Button>

            <Button
              onClick={() => {
                if (
                  confirm(
                    "Clear all saved session data? This will reset your configuration and selections.",
                  )
                ) {
                  clearKRSSession();
                  window.location.reload();
                }
              }}
              variant="ghost"
              className="w-full mt-2 text-slate-500 hover:text-slate-700 h-10 rounded-xl font-medium text-sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear Saved Session
            </Button>
          </div>
        </div>
      </div>
      <p className="text-center text-[9px] font-mono text-slate-400 uppercase tracking-[0.4em] pt-2">
        {t("config.footer")}
      </p>
    </div>
  );
}
