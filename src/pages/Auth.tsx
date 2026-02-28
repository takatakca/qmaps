import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Inscription réussie!", description: "Vérifiez votre courriel pour confirmer votre compte." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      </div>

      <div className="px-6 pt-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Q<span className="text-primary">Maps</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte QMaps"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nom d'affichage</Label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input id="name" placeholder="Votre nom" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Courriel</Label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input id="email" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary font-medium">
            {isLogin ? "Pas de compte? S'inscrire" : "Déjà un compte? Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
