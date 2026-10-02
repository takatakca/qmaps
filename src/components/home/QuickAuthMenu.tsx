import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound, Mail, Smartphone, LogOut, Briefcase, FolderKanban, Bookmark, Store, ShieldCheck, ChevronRight,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/language";
import { headerTriggerClass } from "@/components/home/LanguageSwitcher";

/**
 * TAKATAK Auth-style account popover. Only shows providers that work today:
 * Google (managed OAuth), email, and SMS verification (Twilio, after sign-in).
 */
const QuickAuthMenu = ({ tone = "light" }: { tone?: "light" | "dark" }) => {
  const navigate = useNavigate();
  const { user, signOut, isMerchant, isAdmin } = useAuth();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
    if (result.error) {
      toast({ title: "Connexion Google impossible", description: "Réessayez ou utilisez votre courriel.", variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    go("/profile");
  };

  const Item = ({ icon: Icon, label, sub, onClick }: { icon: typeof Mail; label: string; sub?: string; onClick: () => void }) => (
    <button onClick={onClick} className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-foreground hover:bg-accent">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{label}</span>
        {sub && <span className="block text-[11px] text-muted-foreground">{sub}</span>}
      </span>
      <ChevronRight size={14} className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );

  const roleLabel = isAdmin ? t("roleAdmin") : isMerchant ? t("roleMerchant") : t("roleClient");
  const initial = (user?.email ?? "?")[0].toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger aria-label={t("signIn")} className={headerTriggerClass(tone)}>
        {user ? (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{initial}</span>
        ) : (
          <UserRound size={13} />
        )}
        {user ? t("account") : t("signIn")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 overflow-hidden p-0">
        <div className="bg-gradient-to-br from-primary to-[hsl(222_60%_12%)] px-4 py-3 text-primary-foreground">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-75">{t("qmapsAccount")}</p>
          {user ? (
            <>
              <p className="mt-0.5 truncate text-sm font-semibold">{user.email}</p>
              <span className="mt-1.5 inline-flex rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold">{roleLabel}</span>
            </>
          ) : (
            <p className="mt-0.5 text-sm font-semibold">{t("accountPitch")}</p>
          )}
        </div>

        <div className="p-2">
          {user ? (
            <>
              <Item icon={UserRound} label={t("publicProfile")} onClick={() => go("/profile")} />
              <Item icon={FolderKanban} label={t("myProjects")} onClick={() => go("/projects")} />
              <Item icon={Bookmark} label={t("collections")} onClick={() => go("/collections")} />
              <div className="my-1.5 h-px bg-border" />
              {isMerchant ? (
                <Item icon={Store} label={t("merchantPortal")} sub={t("merchantPortalSub")} onClick={() => go("/merchant/home")} />
              ) : (
                <Item icon={Briefcase} label={t("becomePro")} sub={t("becomeProSub")} onClick={() => go("/merchant/onboarding")} />
              )}
              {isAdmin && <Item icon={ShieldCheck} label={t("admin")} onClick={() => go("/admin")} />}
              <button
                onClick={() => { setOpen(false); void signOut(); }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut size={14} /> {t("signOut")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground shadow-soft hover:border-primary/40 disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75Z" />
                </svg>
                {loading ? t("connecting") : t("continueGoogle")}
              </button>
              <div className="mt-1.5">
                <Item icon={Mail} label={t("continueEmail")} onClick={() => go("/auth")} />
                <Item icon={Smartphone} label={t("smsVerify")} sub={t("smsVerifySub")} onClick={() => go("/auth?verify=sms")} />
                <Item icon={Briefcase} label={t("proSpace")} sub={t("proSpaceSub")} onClick={() => go("/auth?role=merchant")} />
              </div>
              <button
                onClick={() => go("/auth?mode=signup")}
                className="mt-2 w-full rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95"
              >
                {t("createAccount")}
              </button>
            </>
          )}
        </div>
        <p className="border-t border-border bg-muted/40 px-4 py-2 text-center text-[10px] text-muted-foreground">
          {t("ecosystem")}
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default QuickAuthMenu;
