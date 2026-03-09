import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Plus, MoreVertical, MessageSquare } from "lucide-react";
import BottomNav from "@/components/BottomNav";

type Tab = "all" | "my";

const mockTopics = [
  { id: "1", author: "Marie C.", time: "1 mois", title: "Conduire à Montréal", body: "Bonjour. Est-ce facile de conduire à Montréal?", category: "QUESTIONS LOCALES", replies: 2, lastReply: "21j" },
  { id: "2", author: "Paul D.", time: "1 mois", title: "Bon restaurant", body: "Salut la communauté", category: "RELATIONS", replies: 9, lastReply: "1 mois" },
  { id: "3", author: "Amber H.", time: "4 mois", title: "Bonnes fêtes", body: "Salut tout le monde...", category: "AUTRE", replies: 1, lastReply: "1 mois" },
  { id: "4", author: "Doug G.", time: "1 an", title: "Perdu en traduction", body: "Salut les QMAPSers. La page de support semble...", category: "QUESTIONS DU SITE", replies: 3, lastReply: "5 mois" },
  { id: "5", author: "Sheila F.", time: "6 mois", title: "Quelle journée!", body: "Quelle journée excitante! J'avais tellement faim...", category: "SHOPPING & PRODUITS", replies: 0, lastReply: "6 mois" },
];

const Talk = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("all");

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
            <h1 className="font-heading text-lg font-bold text-foreground">Discussions</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2"><RefreshCw size={20} className="text-foreground" /></button>
            <button className="p-2"><Plus size={20} className="text-foreground" /></button>
            <button className="p-2"><MoreVertical size={20} className="text-foreground" /></button>
          </div>
        </div>
        <div className="flex">
          {(["all", "my"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                tab === t ? "text-foreground border-b-2 border-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "all" ? "TOUTES" : "MES DISCUSSIONS"}
            </button>
          ))}
        </div>
      </div>

      {tab === "all" ? (
        <div>
          <div className="px-4 py-2 bg-muted text-xs text-muted-foreground">Montréal, QC</div>
          <div className="divide-y divide-border">
            {mockTopics.map(t => (
              <button key={t.id} className="w-full text-left px-4 py-3 hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">{t.author.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t.author}</span>
                  <span className="text-xs text-muted-foreground">· {t.time}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{t.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{t.body}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase">{t.category}</span>
                  <span className="text-[10px] text-primary font-medium">{t.replies} réponses</span>
                  <span className="text-[10px] text-muted-foreground">{t.lastReply}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-8">
          <MessageSquare size={48} className="text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">Vous n'avez pas encore de discussions.</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Talk;
