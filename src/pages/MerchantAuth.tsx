import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Building2 } from "lucide-react";

const MerchantAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Check if user has merchant role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isMerchant = roles?.some(r => r.role === "merchant" || r.role === "admin");

    if (isMerchant) {
      toast({ title: "Bienvenue!", description: "Connexion professionnelle réussie." });
      navigate("/merchant");
    } else {
      // Check if they have a business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);

      if (biz && biz.length > 0) {
        // Grant merchant role
        await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
        toast({ title: "Bienvenue!", description: "Connexion professionnelle réussie." });
        navigate("/merchant");
      } else {
        toast({ title: "Accès refusé", description: "Ce compte n'a pas de profil professionnel. Inscrivez-vous d'abord.", variant: "destructive" });
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Erreur", description: "Mot de passe: minimum 6 caractères.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      let msg = error.message;
      if (msg.includes("already registered")) msg = "Ce courriel est déjà utilisé.";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Wait for session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Assign merchant role
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "merchant" as any });
    }
    toast({ title: "Compte créé!", description: "Complétez votre profil professionnel." });
    navigate("/merchant/onboarding");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="px-6 pt-8">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={28} className="text-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            QMAPS <span className="text-primary">Professional</span>
          </h1>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {isLogin ? "Connectez-vous à votre espace professionnel" : "Créez votre compte professionnel"}
        </p>

        <form onSubmit={isLogin ? handleLogin : handleRegister} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Courriel professionnel</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input id="email" type="email" placeholder="pro@entreprise.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
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
            {loading ? "Chargement..." : isLogin ? "Connexion professionnelle" : "Créer mon compte pro"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary font-medium block mx-auto">
            {isLogin ? "Pas encore de compte pro? S'inscrire" : "Déjà un compte? Se connecter"}
          </button>
          <button onClick={() => navigate("/auth")} className="text-xs text-muted-foreground block mx-auto">
            Connexion client →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantAuth;
