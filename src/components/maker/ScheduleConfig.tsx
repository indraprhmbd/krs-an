import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLanguage } from "../../context/LanguageContext";
import { HelpTooltip } from "../ui/HelpTooltip";
import { clearKRSSession } from "../../hooks/useLocalStorage";
import { coerceSemester, validSemesters, periodLabel } from "@/lib/period";
import { MakerShell, type MakerRailStep } from "./MakerShell";

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
  rail: MakerRailStep[];
}

export function ScheduleConfig({
  sessionProfile,
  setSessionProfile,
  onStart,
  rail,
}: ScheduleConfigProps) {
  const { t, lang } = useLanguage();

  return (
    <MakerShell
      rail={rail}
      eyebrow={periodLabel(lang)}
      title={
        <>
          {t("config.title")}{" "}
          <span className="text-primary">{t("config.title_span")}</span>
        </>
      }
    >
      <div className="mx-auto max-w-4xl pb-6">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_1.15fr]">
          {/* Hero column: the brand mark, not a repeat of the shell title. */}
          <div className="flex flex-col items-center gap-4 text-center lg:sticky lg:top-0 lg:items-start lg:text-left">
            <img
              src="/assets/hero-config.svg"
              alt=""
              className="w-full max-w-md"
            />
            <p className="max-w-xs text-body text-muted-foreground">
              {t("config.sub_title")}
            </p>
          </div>

          {/* Form column */}
          <div className="space-y-5">
            <div className="rounded-card border border-border bg-card p-4 shadow-card">
              <div className="space-y-3">
                <p className="text-caps font-mono uppercase text-muted-foreground">
                  {t("config.section_institution")}
                </p>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">
                    {t("config.univ_label")}
                  </Label>
                  <Select
                    value={sessionProfile.university}
                    onValueChange={(val) =>
                      setSessionProfile({ ...sessionProfile, university: val })
                    }
                  >
                    <SelectTrigger className="h-12 rounded-control border-border bg-muted/50 focus:ring-ring">
                      <SelectValue placeholder={t("config.univ_placeholder")} />
                    </SelectTrigger>
                    <SelectContent className="rounded-control border-border">
                      <SelectItem value="UPN_VETERAN_YOGYAKARTA">
                        <div className="flex items-center gap-2">
                          <img
                            src="/assets/univ/upnyk.webp"
                            alt="Logo"
                            className="h-4 w-4 rounded-sm object-contain"
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

                <div className="space-y-1.5">
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
                    <SelectTrigger className="h-12 rounded-control border-border bg-muted/50 focus:ring-ring">
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
                      <SelectItem value="TEKNIK KIMIA">
                        TEKNIK KIMIA
                      </SelectItem>
                      <SelectItem value="TEKNIK PERTAMBANGAN">
                        TEKNIK PERTAMBANGAN
                      </SelectItem>
                      <SelectItem value="TEKNIK ELEKTRO" disabled>
                        TEKNIK ELEKTRO (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="my-4 h-px bg-border" />

              <div className="space-y-3">
                <p className="text-caps font-mono uppercase text-muted-foreground">
                  {t("config.section_target")}
                </p>
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
                      <SelectTrigger className="h-12 rounded-control border-border bg-muted/50 focus:ring-ring">
                        <SelectValue placeholder="Sem" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Only the semesters this term actually runs.
                            Offering all of 1-8 let a student pick one with no
                            schedule behind it and get an empty result with no
                            reason. */}
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
                      className="h-12 rounded-control border-border bg-muted/50 font-mono text-body focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={onStart}
              className="h-14 w-full rounded-control text-body font-bold shadow-card transition-all hover:scale-[1.01] active:scale-[0.99]"
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
              className="h-10 w-full rounded-control font-medium text-body text-muted-foreground hover:text-foreground"
            >
              <Icon name="refresh" className="mr-2" />
              {t("config.clear_session")}
            </Button>
          </div>
        </div>
      </div>
    </MakerShell>
  );
}
