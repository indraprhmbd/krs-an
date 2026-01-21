import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  History,
  LogOut,
  Shield,
  Sparkles,
  Database,
  Languages,
  Info,
  HelpCircle,
  Coffee,
  MessageSquare,
  User,
} from "lucide-react";
import { ContactDialog } from "../maker/ContactDialog";
import { useLanguage } from "../../context/LanguageContext";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AboutDialog, HowToUseDialog, DonateDialog } from "./Footer";

interface NavbarProps {
  userData?: {
    isAdmin?: boolean;
    credits?: number;
  };
  step: "config" | "select" | "view" | "archive";
  setStep: (step: "config" | "select" | "view" | "archive") => void;
  onRestoreArchitect?: () => void;
}

export function Navbar({
  userData,
  step,
  setStep,
  onRestoreArchitect,
}: NavbarProps) {
  const { isSignedIn, user } = useUser();
  const { lang, setLang, t } = useLanguage();
  const isArchitect = step === "config" || step === "select" || step === "view";
  const isArchive = step === "archive";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container flex h-14 max-w-6xl mx-auto items-center justify-between px-4">
        {/* Logo & Admin Link */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <div className="h-9 w-24 overflow-hidden flex items-center justify-center">
              <img
                src="/assets/logo.webp"
                alt="KRSan Logo"
                width="96"
                height="36"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          {userData?.isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span className="text-[9px] font-mono uppercase tracking-widest pt-0.5">
                {t("nav.admin")}
              </span>
            </Link>
          )}
        </div>

        {/* Global Toggle (Athetic & Slim) */}
        <div className="absolute left-1/2 -translate-x-1/2 bg-slate-100/50 p-0.5 rounded-xl flex gap-0.5 border border-slate-200/60 shadow-inner scale-90 sm:scale-100 transition-transform">
          <Button
            variant={isArchitect ? "secondary" : "ghost"}
            size="sm"
            onClick={() =>
              onRestoreArchitect ? onRestoreArchitect() : setStep("config")
            }
            className={`h-8 rounded-[10px] font-display font-medium px-4 text-xs transition-all ${
              isArchitect
                ? "bg-white shadow-sm ring-1 ring-slate-200 text-blue-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden xs:inline">{t("nav.architect")}</span>
          </Button>
          <Button
            variant={isArchive ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setStep("archive")}
            className={`h-8 rounded-[10px] font-display font-medium px-4 text-xs transition-all ${
              isArchive
                ? "bg-white shadow-sm ring-1 ring-slate-200 text-blue-700"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            }`}
          >
            <History className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden xs:inline">{t("nav.archive")}</span>
          </Button>
        </div>

        {/* User Stats & Profile */}
        {/* User Profile Popover */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-blue-700 text-xs h-8 px-4 rounded-lg"
              >
                Sign In
              </Button>
            </SignInButton>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative group cursor-pointer bg-transparent border-0 p-0 outline-none"
                  type="button"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt pointer-events-none"></div>
                  <img
                    src={user?.imageUrl}
                    width="32"
                    height="32"
                    className="relative w-8 h-8 rounded-full border-2 border-white object-cover"
                    alt="Profile"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-0 mr-4 mt-2 bg-white"
                align="end"
              >
                <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.imageUrl}
                      className="w-10 h-10 rounded-full border border-slate-200"
                      alt={user?.fullName || "User"}
                    />
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-slate-900 leading-none">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate max-w-[170px]">
                        {user?.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-5">
                  {/* Language Strategy Slider */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        <Languages size={14} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">
                          {t("nav.language")}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono leading-none">
                          {lang === "ID" ? "Bahasa Indonesia" : "English US"}
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setLang(lang === "ID" ? "EN" : "ID")}
                      className="relative w-[72px] h-[30px] bg-slate-100 rounded-full p-1 cursor-pointer border border-slate-200 shadow-inner group transition-all"
                    >
                      {/* Sliding Knob */}
                      <div
                        className={`absolute w-[32px] h-[22px] bg-white rounded-full shadow-md border border-slate-100 transition-all duration-300 ease-out flex items-center justify-center ${
                          lang === "EN" ? "translate-x-[30px]" : "translate-x-0"
                        }`}
                      >
                        <div className="w-1 h-1 rounded-full bg-blue-600/30" />
                      </div>

                      {/* Labels */}
                      <div className="flex justify-between items-center h-full px-2 text-[9px] font-black pointer-events-none">
                        <span
                          className={`transition-colors duration-300 ${
                            lang === "ID"
                              ? "text-blue-700 opacity-100"
                              : "text-slate-400 opacity-40"
                          }`}
                        >
                          ID
                        </span>
                        <span
                          className={`transition-colors duration-300 ${
                            lang === "EN"
                              ? "text-blue-700 opacity-100"
                              : "text-slate-400 opacity-40"
                          }`}
                        >
                          EN
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-600" />
                        {t("nav.tokens")}
                        <HelpTooltip
                          titleKey="help.tokens_title"
                          descKey="help.tokens_desc"
                        />
                      </span>
                      <span className="font-mono text-slate-500">
                        {userData?.credits ?? 0}/5 {t("nav.tokens_used")}
                      </span>
                    </div>
                    <div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            (userData?.credits ?? 0) <= 1
                              ? "bg-red-500"
                              : (userData?.credits ?? 0) >= 5
                                ? "bg-emerald-500"
                                : "bg-blue-600"
                          }`}
                          style={{
                            width: `${Math.max(0, Math.min(((userData?.credits ?? 0) / 5) * 100, 100))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        {t("nav.tokens_reset")}
                      </p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Supplemental Utilities (formerly Footer) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          onRestoreArchitect?.(); // Ensure we are on main view
                          // The actual trigger will be passed down, but for now we might need a context or prop.
                          // Wait, the tutorial state is in ScheduleMaker (parent).
                          // Passing a straight prop callback is best.
                          window.dispatchEvent(
                            new CustomEvent("trigger-tutorial"),
                          ); // Cleaner for deeply nested components without prop drilling
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center border border-violet-100/50 group-hover:bg-violet-100 transition-colors">
                          <Sparkles size={12} className="text-violet-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                          {t("nav.tutorial")}
                        </span>
                      </button>
                      <AboutDialog
                        trigger={
                          <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                              <Info size={12} className="text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              {t("footer.about")}
                            </span>
                          </button>
                        }
                      />
                      <HowToUseDialog
                        trigger={
                          <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                              <HelpCircle size={12} className="text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              {t("footer.howtouse")}
                            </span>
                          </button>
                        }
                      />
                      <DonateDialog
                        trigger={
                          <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors">
                              <Coffee size={12} className="text-emerald-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              {t("footer.donate")}
                            </span>
                          </button>
                        }
                      />
                      <a
                        href="mailto:indraprhmbd@gmail.com"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100/50 group-hover:bg-blue-100 transition-colors">
                          <MessageSquare size={12} className="text-blue-600" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                          {t("footer.feedback")}
                        </span>
                      </a>
                      <ContactDialog
                        trigger={
                          <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                            <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center border border-pink-100/50 group-hover:bg-pink-100 transition-colors">
                              <User size={12} className="text-pink-600" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                              {t("nav.contact")}
                            </span>
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                  <SignOutButton>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t("nav.signout")}
                    </Button>
                  </SignOutButton>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
}
