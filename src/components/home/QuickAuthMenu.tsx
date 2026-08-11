import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, Mail, Smartphone, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useLang } from "@/i18n/language";

/**
 * Header quick-auth popover: Google OAuth (managed), email sign-in and
 * phone/SMS verification entry point. No mock states — SMS verification lives in
 * the account area and requires an authenticated session (Twilio Verify).
 */
const QuickAuthMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t } = useLang();
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (result.error) {
      toast({ title: "Connexion Google impossible", description: "Réessayez ou utilisez votre courriel.", variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/profile");
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("signIn")}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft transition-shadow hover:shadow-glow"
      >
        <UserRound size={13} className="text-primary" />
        {user ? "Compte" : t("signIn")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        {user ? (
          <>
            <p className="px-2 py-1.5 text-[11px] text-muted-foreground">Connecté</p>
            <button onClick={() => navigate("/profile")} className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
              Mon profil
            </button>
            <button onClick={() => navigate("/merchant/onboarding")} className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
              Espace professionnel
            </button>
            <button
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-accent"
            >
              <LogOut size={14} /> Se déconnecter
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-foreground shadow-soft hover:border-primary/30 disabled:opacity-60"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
                <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.29 9.14 4.75 12 4.75Z" />
              </svg>
              Continuer avec Google
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="mt-1.5 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <Mail size={15} className="text-primary" /> Continuer par courriel
            </button>
            <button
              onClick={() => navigate("/auth?verify=sms")}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-accent"
            >
              <Smartphone size={15} className="text-primary" />
              <span>
                Connexion / vérification SMS
                <span className="block text-[11px] text-muted-foreground">Code Twilio après connexion</span>
              </span>
            </button>
            <button
              onClick={() => navigate("/auth?mode=signup")}
              className="mt-1.5 w-full rounded-lg bg-brand-gradient px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft"
            >
              Créer un compte
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default QuickAuthMenu;
