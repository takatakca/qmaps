import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ownedApi } from "@/lib/ownedApi";

type Mode = "login" | "register" | "recover";
export default function OwnedLogin({ onReady }: { onReady: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (next: Mode) => {
    setMode(next);
    setError("");
    setCode("");
    setPassword("");
  };
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await ownedApi<{ recovery_code?: string }>(
        "accounts/" + mode,
        "POST",
        {
          handle,
          password,
          ...(mode === "recover" ? { recovery_code: code } : {}),
        },
      );
      setPassword("");
      setCode("");
      if (r.recovery_code) setIssued(r.recovery_code);
      else onReady();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible");
    } finally {
      setBusy(false);
    }
  }
  if (issued)
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold">
          Conservez votre code de récupération
        </h2>
        <p>
          Ce code vous permet de remplacer votre mot de passe. Gardez-le dans un
          endroit privé.
        </p>
        <output className="block select-all break-all rounded-md border p-3 font-mono">
          {issued}
        </output>
        <Button
          onClick={() => {
            setIssued("");
            onReady();
          }}
        >
          J’ai enregistré mon code
        </Button>
      </section>
    );
  return (
    <form className="space-y-4" onSubmit={submit}>
      <h2 className="text-xl font-bold">
        {mode === "register"
          ? "Créer mon compte"
          : mode === "recover"
            ? "Récupérer mon compte"
            : "Connexion par identifiant"}
      </h2>
      <div>
        <Label htmlFor="q-handle">Identifiant QMAPS</Label>
        <Input
          id="q-handle"
          required
          minLength={3}
          maxLength={40}
          autoComplete="username"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      </div>
      {mode === "recover" && (
        <div>
          <Label htmlFor="q-recovery">Code de récupération</Label>
          <Input
            id="q-recovery"
            required
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
      )}
      <div>
        <Label htmlFor="q-pass">
          {mode === "recover" ? "Nouveau mot de passe" : "Mot de passe"}
        </Label>
        <Input
          id="q-pass"
          type="password"
          required
          minLength={12}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode !== "login" && (
          <p className="text-sm text-muted-foreground">
            12 caractères minimum.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button disabled={busy} type="submit">
        {busy
          ? "Patientez…"
          : mode === "register"
            ? "Créer mon compte"
            : mode === "recover"
              ? "Remplacer le mot de passe"
              : "Se connecter"}
      </Button>
      <div className="flex flex-wrap gap-3 text-sm">
        {mode !== "login" && (
          <button
            type="button"
            className="underline"
            onClick={() => change("login")}
          >
            Se connecter
          </button>
        )}
        {mode !== "register" && (
          <button
            type="button"
            className="underline"
            onClick={() => change("register")}
          >
            Créer un compte
          </button>
        )}
        {mode !== "recover" && (
          <button
            type="button"
            className="underline"
            onClick={() => change("recover")}
          >
            Mot de passe oublié
          </button>
        )}
      </div>
    </form>
  );
}
