import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onClose: () => void;
  business: Tables<"businesses">;
  onSaved: () => void;
}

export default function EditHistoryModal({ open, ...props }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) props.onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Historique du commerce</DialogTitle>
        </DialogHeader>
        {open && <HistoryForm key={props.business.id} {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function HistoryForm({ business, onClose, onSaved }: Omit<Props, "open">) {
  const { user } = useAuth();
  const [year, setYear] = useState(business.founding_year?.toString() ?? "");
  const [history, setHistory] = useState(business.business_history ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user || saving) return;
        setSaving(true);
        setError(false);
        try {
          const { error } = await supabase
            .from("businesses")
            .update({
              founding_year: year ? Number(year) : null,
              business_history: history.trim() || null,
            })
            .eq("id", business.id)
            .eq("owner_user_id", user.id)
            .select("id")
            .single();
          if (error) throw error;
          onSaved();
          onClose();
        } catch {
          setError(true);
        } finally {
          setSaving(false);
        }
      }}
    >
      <label>
        Année de fondation
        <Input
          type="number"
          min="1000"
          max={new Date().getFullYear()}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </label>
      <label>
        Histoire du commerce
        <Textarea
          maxLength={2000}
          value={history}
          onChange={(e) => setHistory(e.target.value)}
        />
      </label>
      {error && <p role="alert">Impossible d’enregistrer l’historique.</p>}
      <Button disabled={saving}>Enregistrer</Button>
    </form>
  );
}
