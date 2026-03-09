import { Shield, Megaphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { AdFormData } from "@/pages/MerchantAds";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  formData: AdFormData;
  update: (p: Partial<AdFormData>) => void;
  business: Tables<"businesses">;
}

const AdStepPayment = ({ formData, update, business }: Props) => {
  const daily = formData.customBudget || formData.budgetPreset;
  const upgradeCost = formData.upgradePackage ? 4 : 0;
  const total = daily + upgradeCost;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Shield size={14} /> Paiement sécurisé
      </div>

      {/* Order summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex justify-between mb-4">
          <h3 className="font-heading font-bold text-foreground">Résumé de la commande</h3>
          <button className="text-sm text-primary font-medium">Modifier</button>
        </div>
        <div className="space-y-3 border-b border-border pb-3 mb-3">
          <div className="flex items-start gap-3">
            <Megaphone size={18} className="text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Budget publicitaire QMAPS</p>
              <p className="text-xs text-muted-foreground">Environ {Math.round(daily * 38.5)} clics par mois</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{daily} CA$/jour</p>
          </div>
          {formData.upgradePackage && (
            <div className="flex items-start gap-3">
              <Megaphone size={18} className="text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Package Upgrade</p>
                <p className="text-xs text-muted-foreground">Suppression concurrents, CTA, mise en avant, logo, diaporama, QMAPS Connect</p>
              </div>
              <p className="text-sm font-semibold text-foreground">4 CA$/jour</p>
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-foreground">Total</p>
          <p className="font-bold text-foreground">{total} CA$/jour moyenne</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Les dépenses quotidiennes peuvent varier, mais vous ne serez jamais facturé plus de {total * 30},00 CA$/mois max.
        </p>
      </div>

      <div className="bg-muted/50 rounded-xl p-3">
        <p className="text-xs text-muted-foreground">
          Toutes les moyennes quotidiennes sont basées sur un mois de 30 jours. Vous serez facturé mensuellement ou lorsque vous atteindrez votre seuil de facturation. Annulable en tout temps.
        </p>
      </div>

      {/* Payment form */}
      <div>
        <h3 className="font-heading font-bold text-foreground mb-4">Informations de paiement</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nom sur la carte</Label>
            <Input value={formData.cardName} onChange={e => update({ cardName: e.target.value })} className="rounded-lg" />
          </div>
          <div>
            <Label className="text-xs">Numéro de carte</Label>
            <Input value={formData.cardNumber} onChange={e => update({ cardNumber: e.target.value })} placeholder="•••• •••• •••• ••••" className="rounded-lg" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs">Date d'expiration</Label>
              <div className="flex gap-2">
                <Input value={formData.expMonth} onChange={e => update({ expMonth: e.target.value })} placeholder="MM" className="rounded-lg" />
                <Input value={formData.expYear} onChange={e => update({ expYear: e.target.value })} placeholder="AA" className="rounded-lg" />
              </div>
            </div>
            <div className="w-24">
              <Label className="text-xs">CVV</Label>
              <Input value={formData.cvv} onChange={e => update({ cvv: e.target.value })} className="rounded-lg" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Code postal</Label>
            <Input value={formData.postalCode} onChange={e => update({ postalCode: e.target.value })} className="rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox />
            <span className="text-xs text-muted-foreground">J'ai un code promo QMAPS</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            En procédant, j'accepte les <button className="text-primary underline">Conditions de publicité</button> de QMAPS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdStepPayment;
