import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Heart,
  MessageSquare,
  Info,
  Coffee,
  Github,
  Instagram,
  Mail,
  HelpCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="py-12 border-t bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />

      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand section */}
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
              <img
                src="/assets/logo.webp"
                alt="KRSan"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto md:mx-0">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex flex-wrap justify-center gap-6">
              <AboutDialog />
              <HowToUseDialog />
              <DonateDialog />
              <a
                href="mailto:indraprhmbd@gmail.com"
                className="group flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all border border-slate-100">
                  <MessageSquare size={18} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {t("footer.feedback")}
                </span>
              </a>
            </div>
          </div>

          {/* Connect section */}
          <div className="text-center md:text-right space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Connect with Author
            </h4>
            <div className="flex justify-center md:justify-end gap-3">
              <SocialIcon
                icon={<Instagram size={16} />}
                href="https://instagram.com/indraprhmbd_"
                color="hover:text-pink-600 hover:bg-pink-50"
              />
              <SocialIcon
                icon={<Github size={16} />}
                href="https://github.com/indraprhmbd"
                color="hover:text-slate-900 hover:bg-slate-100"
              />
              <SocialIcon
                icon={<Mail size={16} />}
                href="mailto:indraprhmbd@gmail.com"
                color="hover:text-blue-600 hover:bg-blue-50"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
            ELEGANT PLANNING • AI DRIVEN • ACADEMIC TOOL
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono tracking-widest uppercase">
            <span>© 2026 KRSan Production</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span>Built by Indra</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function HowToUseDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="group flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all border border-slate-100">
            <HelpCircle size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("footer.howtouse")}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        hideClose
        className="w-[92%] sm:max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl [&_svg]:text-white max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="p-0">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden text-left">
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-display font-black mb-2">
                {t("howtouse.title")}
              </DialogTitle>
              <div className="h-1 w-12 bg-blue-600 rounded-full" />
              <DialogDescription className="hidden">
                Guide on how to use KRSan application.
              </DialogDescription>
            </div>
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors z-[70]">
              <X size={20} className="text-white" />
            </DialogClose>
            <HelpCircle className="absolute -bottom-8 -right-8 w-40 h-40 text-blue-500/10 rotate-12" />
          </div>
        </DialogHeader>
        <div className="p-8 grid md:grid-cols-2 gap-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">
                  01
                </span>
                {t("howtouse.step1_title")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("howtouse.step1_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">
                  02
                </span>
                {t("howtouse.step2_title")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("howtouse.step2_desc")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <span className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]">
                  03
                </span>
                {t("howtouse.step3_title")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("howtouse.step3_desc")}
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 self-start">
            <div className="flex items-center gap-2 text-blue-700">
              <Heart className="w-4 h-4 fill-blue-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider">
                {t("howtouse.premium_title")}
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("howtouse.premium_desc")}
            </p>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-[10px] text-slate-400 italic">
                Pro tip: Lock matkul favoritmu sebelum generate untuk hasil yang
                lebih spesifik!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialIcon({
  icon,
  href,
  color,
}: {
  icon: React.ReactNode;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 transition-all border border-slate-100 ${color}`}
    >
      {icon}
    </a>
  );
}

export function AboutDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="group flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all border border-slate-100">
            <Info size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("footer.about")}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        hideClose
        className="w-[92%] sm:max-w-2xl bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl [&_svg]:text-white max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="p-0">
          <div className="bg-blue-600 p-8 text-white relative overflow-hidden text-left">
            <div className="relative z-10">
              <DialogTitle className="text-3xl font-display font-black mb-2">
                {t("about.title")}
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-sm font-medium italic opacity-80">
                "Simplicity in Complexity"
              </DialogDescription>
            </div>
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors z-[70]">
              <X size={20} className="text-white" />
            </DialogClose>
            <Info className="absolute -bottom-8 -right-8 w-40 h-40 text-blue-500/30 rotate-12" />
          </div>
        </DialogHeader>
        <div className="p-8 space-y-6 text-slate-600 leading-relaxed text-sm bg-white">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                01
              </span>
              {t("about.background_title")}
            </h3>
            <p>{t("about.background_desc")}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                02
              </span>
              {t("about.mission_title")}
            </h3>
            <p>{t("about.mission_desc")}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </div>
            <p className="text-xs italic text-slate-500">{t("about.quote")}</p>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {t("about.legal_title")}
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {t("about.legal_desc")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DonateDialog() {
  const { t } = useLanguage();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="group flex flex-col items-center gap-2 text-slate-400 hover:text-blue-600 transition-all">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all border border-slate-100">
            <Coffee size={18} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {t("footer.donate")}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent
        hideClose
        className="w-[92%] sm:max-w-md bg-white rounded-3xl overflow-hidden p-0 border-none shadow-2xl [&_svg]:text-white max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader className="p-0">
          <div className="bg-emerald-600 p-8 text-white relative overflow-hidden text-left">
            <div className="relative z-10">
              <DialogTitle className="text-2xl font-display font-black mb-1">
                Support Author
              </DialogTitle>
              <DialogDescription className="text-emerald-100 text-xs text-left">
                Dukung pengembangan KRSan agar tetap gratis & tanpa iklan!
              </DialogDescription>
            </div>
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full hover:bg-white/10 transition-colors z-[70]">
              <X size={20} className="text-white" />
            </DialogClose>
            <Coffee className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-500/30 -rotate-12" />
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-white">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm mb-2">
              <img
                src="https://cdn.brandfetch.io/idZQucmeCy/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1764515058001"
                alt="SeaBank"
                className="h-4"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-[10px] font-bold text-slate-500">
                SEABANK
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-3xl font-mono font-black text-slate-900 tracking-wider">
                9010 8876 8893
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                A/N ARSYADI INDRA{" "}
              </p>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText("901491151294");
                alert("Nomor rekening berhasil disalin!");
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 text-xs font-bold transition-all shadow-lg shadow-emerald-100"
            >
              Copy Account Number
            </Button>
          </div>

          <p className="text-[10px] text-center text-slate-400 leading-relaxed italic">
            Donasi Anda akan digunakan untuk biaya server & API LangChain/Groq
            agar AI scheduler tetap bisa diakses gratis oleh semua mahasiswa.
            Terima kasih!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
