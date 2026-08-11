import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, PhoneCall, MessageSquare, Check, Loader2, ShieldCheck } from "lucide-react";

interface Props {
  initialPhone?: string;
  verified: boolean;
  onVerified: (phone: string) => void;
}

type Stage = "idle" | "sent";

const PhoneOtpVerification = ({ initialPhone = "", verified, onVerified }: Props) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<{ smsEnabled: boolean; voiceEnabled: boolean } | null>(null);
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("send-otp", { method: "GET" });
        if (!cancelled && !error) setConfig(data as any);
        else if (!cancelled) setConfig({ smsEnabled: false, voiceEnabled: false });
      } catch {
        if (!cancelled) setConfig({ smsEnabled: false, voiceEnabled: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [cooldown]);

  const send = async (channel: "sms" | "call") => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast({ title: "Numéro invalide", description: "Entrez un numéro à 10 chiffres.", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-otp", { body: { phone, channel } });
    setSending(false);

    const payload: any = data ?? {};
    if (error || payload?.error) {
      toast({
        title: "Envoi impossible",
        description: payload?.error ?? "Réessayez dans un instant.",
        variant: "destructive",
      });
      if (payload?.retryAfter) setCooldown(payload.retryAfter);
      return;
    }
    setStage("sent");
    setCooldown(payload.cooldown ?? 45);
    toast({
      title: channel === "sms" ? "Code envoyé par SMS" : "Appel en cours",
      description: channel === "sms" ? "Vérifiez vos messages." : "Répondez pour entendre votre code.",
    });
  };

  const verify = async () => {
    if (code.replace(/\D/g, "").length < 4) return;
    setChecking(true);
    const { data, error } = await supabase.functions.invoke("verify-otp", { body: { phone, code } });
    setChecking(false);
    const payload: any = data ?? {};
    if (error || payload?.error || !payload?.verified) {
      toast({
        title: "Vérification échouée",
        description: payload?.error ?? "Code invalide.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Téléphone vérifié", description: "Merci, votre numéro est confirmé." });
    setStage("idle");
    setCode("");
    onVerified(payload.phone ?? phone);
  };

  if (verified) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
          <Check size={18} className="text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Téléphone vérifié</p>
          <p className="text-xs text-muted-foreground truncate">{phone}</p>
        </div>
      </div>
    );
  }

  if (config === null) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={15} className="animate-spin" /> Vérification des options de sécurité...
      </div>
    );
  }

  if (!config.smsEnabled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground flex items-start gap-2">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>
          Votre courriel est vérifié. La vérification par SMS sera activée prochainement.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-primary" />
        <p className="text-sm font-semibold text-foreground">Vérifier votre téléphone</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Numéro mobile</Label>
        <div className="relative">
          <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <Input
            type="tel"
            inputMode="tel"
            placeholder="(514) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="pl-10"
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => send("sms")}
          disabled={sending || cooldown > 0}
          className="flex-1 rounded-full gap-2"
          size="sm"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          {cooldown > 0 ? `Renvoyer (${cooldown}s)` : stage === "sent" ? "Renvoyer le code" : "Recevoir un code"}
        </Button>
        {config.voiceEnabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => send("call")}
            disabled={sending || cooldown > 0}
            className="rounded-full gap-2"
          >
            <PhoneCall size={14} /> Appel
          </Button>
        )}
      </div>

      {stage === "sent" && (
        <div className="space-y-2 pt-1 border-t border-border">
          <Label className="text-xs">Code reçu</Label>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              className="tracking-[0.3em] text-center font-semibold"
            />
            <Button type="button" onClick={verify} disabled={checking || code.length < 4} className="rounded-full" size="sm">
              {checking ? <Loader2 size={14} className="animate-spin" /> : "Vérifier"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Le code expire après 10 minutes. Étape optionnelle mais recommandée.
          </p>
        </div>
      )}
    </div>
  );
};

export default PhoneOtpVerification;
