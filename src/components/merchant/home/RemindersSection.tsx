import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, BarChart3, X } from "lucide-react";

interface Reminder {
  id: string;
  icon: React.ElementType;
  message: string;
  action: string;
  route: string;
}

const defaultReminders: Reminder[] = [
  {
    id: "page-setup",
    icon: FileText,
    message: "Complétez les détails de votre page pour apparaître dans plus de résultats.",
    action: "Terminer la configuration",
    route: "/merchant/marketplace",
  },
  {
    id: "check-summary",
    icon: BarChart3,
    message: "Vérifiez votre résumé. Assurez-vous que vos clients voient les bonnes informations.",
    action: "Vérifier le résumé",
    route: "/merchant/marketplace",
  },
];

const RemindersSection = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = defaultReminders.filter((r) => !dismissed.includes(r.id));
  if (visible.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading font-bold text-foreground mb-2">Rappels</h2>
      <div className="space-y-2">
        {visible.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <r.icon size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{r.message}</p>
              <button onClick={() => navigate(r.route)} className="text-xs text-primary font-semibold mt-1">
                {r.action}
              </button>
            </div>
            <button onClick={() => setDismissed((p) => [...p, r.id])} className="shrink-0 p-1 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RemindersSection;
