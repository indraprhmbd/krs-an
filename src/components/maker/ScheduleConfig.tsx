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
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "../../context/LanguageContext";
import { HelpTooltip } from "../ui/HelpTooltip";
import { clearKRSSession } from "../../hooks/useLocalStorage";
import { coerceSemester, validSemesters, periodLabel } from "@/lib/period";

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
  const { t, lang } = useLanguage();
  return (
    <div className="max-w-6xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-6">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Context & Identity */}
        <div className="lg:col-span-5 space-y-4 md:space-y-4 py-2 md:py-4">
          <div className="space-y-3 md:space-y-4">
            <Badge
              variant="secondary"
              className="max-w-full truncate rounded-full font-mono"
            >
              {t("config.academic_year")} {periodLabel(lang)}
            </Badge>
            <h2 className="text-display break-words text-foreground">
              {t("config.title")} <br className="hidden md:block" />
              <span className="block text-primary md:inline">
                {t("config.title_span")}
              </span>
            </h2>
            <p className="max-w-sm text-body text-muted-foreground">
              {t("config.sub_title")}
            </p>
          </div>

          {/*
            A scrolling "AI ENGINE ACTIVE" ticker used to sit here. It was
            decorative motion asserting that the app was working, its text was
            white on a near-white surface (so invisible), and it duplicated its
            own markup to fake a seamless loop. Smart Generate says what it does
            at the point of use; a marquee is not information.
          */}
          <div className="flex items-center gap-2 rounded-card border border-border bg-muted px-3 py-2">
            <Icon name="sparkles" size={14} className="shrink-0 text-primary" />
            <span className="text-body-sm text-muted-foreground">
              {t("config.ai_scrolling")}
            </span>
          </div>
        </div>

        {/* Right Column: The "Configuration" Card */}
        <div className="lg:col-span-7">
          <div className="bg-card p-4 sm:p-4 rounded-card border border-border shadow-card space-y-1 transition-all hover:shadow-card">
            <div className="space-y-0.5">
              <h1 className="text-title text-foreground">
                {t("config.card_title")}
              </h1>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-muted-foreground">
                  {t("config.univ_label")}
                </Label>
                <Select
                  value={sessionProfile.university}
                  onValueChange={(val) =>
                    setSessionProfile({ ...sessionProfile, university: val })
                  }
                >
                  <SelectTrigger className="bg-muted/50 border-border h-12 rounded-control focus:ring-ring">
                    <SelectValue placeholder={t("config.univ_placeholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-control border-border">
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
                <Label className="text-muted-foreground">
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
                  <SelectTrigger className="bg-muted/50 border-border h-12 rounded-control focus:ring-ring">
                    <SelectValue placeholder={t("config.prodi_placeholder")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-control border-border">
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
                  <Label className="text-muted-foreground">
                    {t("config.semester_label")}
                  </Label>
                  <Select
                    value={coerceSemester(sessionProfile.semester).toString()}
                    onValueChange={(val) =>
                      setSessionProfile({
                        ...sessionProfile,
                        semester: parseInt(val),
                      })
                    }
                  >
                    <SelectTrigger className="h-12 bg-muted/50">
                      <SelectValue placeholder="Sem" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Only the semesters this term actually runs. Offering
                          all of 1-8 let a student pick one with no schedule
                          behind it and get an empty result with no reason. */}
                      {validSemesters().map((s) => (
                        <SelectItem key={s} value={s.toString()}>
                          Semester {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">
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
                    className="bg-muted/50 border-border font-mono text-body h-12 rounded-control focus:ring-ring"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={onStart}
              className="w-full mt-8 bg-primary hover:bg-primary text-primary-foreground h-14 rounded-control font-bold text-body shadow-card transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              {t("config.btn_init")}
            </Button>

            <Button
              onClick={() => {
                if (confirm(t("config.clear_confirm"))) {
                  clearKRSSession();
                  window.location.reload();
                }
              }}
              variant="ghost"
              className="w-full mt-2 text-muted-foreground hover:text-foreground h-10 rounded-control font-medium text-body"
            >
              <Icon name="refresh" className="mr-2" />
              {t("config.clear_session")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
