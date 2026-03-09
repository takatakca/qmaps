import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Building2, Search } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot";
type AuthRole = "client" | "merchant";

const Auth = () => {
  const location = useLocation();
  const isMerchantRoute = location.pathname.startsWith("/merchant");
  
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<AuthRole>(isMerchantRoute ? "merchant" : "client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(role === "merchant" ? "/merchant" : "/");
    }
  }, [user]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setBusinessName("");
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
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

    if (role === "merchant") {
      // Verify merchant role
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        const hasMerchant = roles?.some(r => r.role === "merchant" || r.role === "admin");
        const { data: biz } = await supabase.from("businesses").select("id").eq("owner_user_id", u.id).limit(1);

        if (hasMerchant || (biz && biz.length > 0)) {
          if (!hasMerchant) {
            await supabase.from("user_roles").upsert({ user_id: u.id, role: "merchant" as any });
          }
          toast({ title: "Bienvenue!", description: "Connexion professionnelle réussie." });
          navigate("/merchant");
        } else {
          toast({ title: "Aucun profil professionnel", description: "Inscrivez-vous d'abord comme professionnel.", variant: "destructive" });
          await supabase.auth.signOut();
        }
      }
    } else {
      toast({ title: "Bienvenue!", description: "Connexion réussie." });
      navigate("/");
    }
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
      let msg = error.message;
      if (msg.includes("already registered")) msg = "Ce courriel est déjà utilisé.";
      toast({ title: "Erreur d'inscription", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (role === "merchant") {
      // Wait for session then assign merchant role and redirect to onboarding
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        await supabase.from("user_roles").upsert({ user_id: u.id, role: "merchant" as any });
      }
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
        {/* Brand */}
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
          {mode === "login" && role === "merchant" && "Accédez à votre espace professionnel"}
          {mode === "signup" && role === "client" && "Créez votre compte QMAPS"}
          {mode === "signup" && role === "merchant" && "Inscrivez votre entreprise sur QMAPS"}
        </p>

        {/* Login form */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
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
              {loading ? "Connexion..." : role === "merchant" ? "Connexion professionnelle" : "Se connecter"}
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
              <Label htmlFor="email">Courriel</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="email" type="email" placeholder={role === "merchant" ? "pro@entreprise.com" : "vous@exemple.com"} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 caractères" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" required minLength={6} />
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
              <Label htmlFor="email">Courriel</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}

        {/* Switch links */}
        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
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
