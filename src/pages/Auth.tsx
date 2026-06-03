import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Building2, Search, Info } from "lucide-react";
import { lovable } from "@/integrations/lovable";

type AuthMode = "login" | "signup" | "forgot";
type AuthRole = "client" | "merchant";

const Auth = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMerchantRoute = location.pathname.startsWith("/merchant") || searchParams.get("role") === "merchant";

  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<AuthRole>(isMerchantRoute ? "merchant" : "client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upgradeHint, setUpgradeHint] = useState(false);
  const { signIn, signUp, user, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, redirect intelligently
  useEffect(() => {
    if (!user) return;
    // Don't auto-redirect if we're in the middle of a role upgrade flow
    if (upgradeHint) return;
  }, [user, upgradeHint]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setBusinessName("");
    setShowPassword(false);
    setUpgradeHint(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  // After login, handle role-based redirect
  const handlePostLogin = async (targetRole: AuthRole) => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;

    await refreshRoles();

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
    const hasMerchant = roles?.some(r => r.role === "merchant" || r.role === "admin");
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_user_id", u.id).limit(1);
    const hasBusiness = biz && biz.length > 0;

    if (targetRole === "merchant") {
      if (hasMerchant && hasBusiness) {
        toast({ title: "Bienvenue!", description: "Connexion professionnelle réussie." });
        navigate("/merchant");
      } else if (hasMerchant || hasBusiness) {
        if (!hasMerchant) {
          await supabase.from("user_roles").upsert({ user_id: u.id, role: "merchant" as any });
          await refreshRoles();
        }
        toast({ title: "Bienvenue!", description: "Connexion professionnelle réussie." });
        navigate("/merchant");
      } else {
        // User exists but has no merchant role — offer onboarding
        await supabase.from("user_roles").upsert({ user_id: u.id, role: "merchant" as any });
        await refreshRoles();
        toast({ title: "Bienvenue!", description: "Complétez votre profil professionnel." });
        navigate("/merchant/onboarding");
      }
    } else {
      toast({ title: "Bienvenue!", description: "Connexion réussie." });
      navigate("/");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      let msg = error.message;
      if (msg.includes("Invalid login")) msg = "Courriel ou mot de passe incorrect.";
      toast({ title: "Erreur de connexion", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }
    await handlePostLogin(role);
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Mot de passe: minimum 6 caractères.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const name = role === "merchant" ? (displayName || businessName) : displayName;
    const { error } = await signUp(email, password, name);

    if (error) {
      // KEY FIX: If email already registered and user wants merchant, switch to login mode
      if (error.message?.includes("already registered") && role === "merchant") {
        setUpgradeHint(true);
        setMode("login");
        toast({
          title: "Compte existant détecté",
          description: "Ce courriel a déjà un compte. Connectez-vous pour ajouter votre profil professionnel.",
        });
        setLoading(false);
        return;
      }
      let msg = error.message;
      if (msg.includes("already registered")) msg = "Ce courriel est déjà utilisé. Connectez-vous plutôt.";
      toast({ title: "Erreur d'inscription", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }

    // New account created — assign role and redirect
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u && role === "merchant") {
      await supabase.from("user_roles").upsert({ user_id: u.id, role: "merchant" as any });
      await refreshRoles();
      toast({ title: "Compte pro créé!", description: "Complétez votre profil professionnel." });
      navigate("/merchant/onboarding");
    } else {
      toast({ title: "Compte créé!", description: "Bienvenue sur QMAPS." });
      navigate("/");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erreur", description: "Entrez votre courriel.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Courriel envoyé", description: "Vérifiez votre boîte de réception." });
      setMode("login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="px-6 pt-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Q<span className="text-primary">Maps</span>
        </h1>

        {/* Role toggle */}
        <div className="mt-5 flex rounded-full bg-secondary p-1">
          <button
            onClick={() => { setRole("client"); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all ${
              role === "client" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Search size={15} />
            Client
          </button>
          <button
            onClick={() => { setRole("merchant"); resetForm(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-all ${
              role === "merchant" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Building2 size={15} />
            Professionnel
          </button>
        </div>

        <p className="text-muted-foreground mt-4 text-sm">
          {mode === "forgot" && "Réinitialisez votre mot de passe"}
          {mode === "login" && role === "client" && "Connectez-vous pour découvrir des commerces"}
          {mode === "login" && role === "merchant" && !upgradeHint && "Accédez à votre espace professionnel"}
          {mode === "login" && role === "merchant" && upgradeHint && "Connectez-vous pour activer votre profil professionnel"}
          {mode === "signup" && role === "client" && "Créez votre compte QMAPS"}
          {mode === "signup" && role === "merchant" && "Inscrivez votre entreprise sur QMAPS"}
        </p>

        {/* Upgrade hint banner */}
        {upgradeHint && mode === "login" && (
          <div className="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-xl p-3">
            <Info size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground">
              Votre compte client existe déjà. Connectez-vous avec votre mot de passe habituel pour ajouter un profil professionnel.
            </p>
          </div>
        )}

        {/* Social login — Google (managed by Lovable Cloud) */}
        {mode !== "forgot" && (
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full gap-2"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                const result = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (result.error) {
                  toast({
                    title: "Connexion Google indisponible",
                    description: result.error.message || "Veuillez utiliser le courriel et le mot de passe.",
                    variant: "destructive",
                  });
                  setLoading(false);
                }
                // If redirected: browser is leaving — keep loading state.
                // If tokens returned: AuthProvider will pick up the session.
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.52 1 10.21 1 12s.43 3.48 1.18 4.96l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continuer avec Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> ou par courriel <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        {/* Login form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Courriel{role === "merchant" ? " professionnel" : ""}</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="email" type="email" placeholder={role === "merchant" ? "pro@entreprise.com" : "vous@exemple.com"} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-primary font-medium">Mot de passe oublié?</button>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Connexion..." : upgradeHint ? "Se connecter et devenir pro" : role === "merchant" ? "Connexion professionnelle" : "Se connecter"}
            </Button>
          </form>
        )}

        {/* Signup form */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            {role === "merchant" && (
              <div className="space-y-2">
                <Label>Nom de l'entreprise</Label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input placeholder="Ex: Café Montréal" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="pl-10" />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{role === "merchant" ? "Nom du propriétaire" : "Nom d'affichage"}</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input placeholder="Votre nom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Courriel</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="signup-email" type="email" placeholder={role === "merchant" ? "pro@entreprise.com" : "vous@exemple.com"} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Mot de passe</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Min. 6 caractères" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Inscription..." : role === "merchant" ? "Créer mon compte pro" : "S'inscrire"}
            </Button>
          </form>
        )}

        {/* Forgot password */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Courriel</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="forgot-email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}

        {/* Switch links */}
        <div className="mt-6 text-center space-y-2">
          {mode === "login" && !upgradeHint && (
            <button onClick={() => switchMode("signup")} className="text-sm text-primary font-medium block mx-auto">
              {role === "merchant" ? "Pas encore de compte pro? S'inscrire" : "Pas de compte? S'inscrire"}
            </button>
          )}
          {mode === "signup" && (
            <button onClick={() => switchMode("login")} className="text-sm text-primary font-medium block mx-auto">
              Déjà un compte? Se connecter
            </button>
          )}
          {mode === "forgot" && (
            <button onClick={() => switchMode("login")} className="text-sm text-primary font-medium block mx-auto">
              Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
