import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import BottomNav from "@/components/BottomNav";

const emailUpdates = [
  "Demandes d'amis",
  "Nouveaux abonnés",
  "Compliments et messages directs",
  "Contenu partagé par vos amis",
  "Messages de propriétaires de commerces",
  "Statut de vos modifications d'info",
  "Contributions",
];

const alsoNotify = [
  "Commerces qui pourraient vous plaire",
  "Astuces et conseils QMAPS",
  "Commerces suggérés à évaluer",
  "Rabais et promotions",
  "Le QMAPS local de votre région",
  "Actualités restaurants",
  "Nouvelles questions auxquelles répondre",
  "Sondages",
  "Quartiers",
  "Retours sur les commerces contactés",
];

const EmailNotifications = () => {
  const navigate = useNavigate();
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [updates, setUpdates] = useState<Record<string, boolean>>(
    Object.fromEntries([...emailUpdates, ...alsoNotify].map(k => [k, true]))
  );

  const toggle = (key: string) => setUpdates(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Notifications email</h1>
      </div>

      <div className="bg-muted px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Gérez vos préférences email pour ce compte. Ces préférences s'appliquent uniquement à votre compte QMAPS.
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-medium text-foreground">Recevoir des emails de QMAPS</span>
          <Switch checked={receiveEmails} onCheckedChange={setReceiveEmails} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Note : vous continuerez de recevoir certains emails légaux, transactionnels ou administratifs.
        </p>
      </div>

      <div className="px-4 py-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Recevoir des mises à jour sur :</h3>
        <div className="divide-y divide-border">
          {emailUpdates.map(item => (
            <div key={item} className="flex items-center justify-between py-3">
              <span className="text-sm text-foreground">{item}</span>
              <Switch checked={updates[item]} onCheckedChange={() => toggle(item)} />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border">
        <h3 className="text-sm font-bold text-foreground mb-3">Nous vous informerons aussi sur :</h3>
        <div className="divide-y divide-border">
          {alsoNotify.map(item => (
            <div key={item} className="flex items-center justify-between py-3">
              <span className="text-sm text-foreground">{item}</span>
              <Switch checked={updates[item]} onCheckedChange={() => toggle(item)} />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default EmailNotifications;
