import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Bookmark, Plus, LogIn, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import cafeImg from "@/assets/cafe-1.jpg";
import foodImg from "@/assets/food-1.jpg";
import restaurantImg from "@/assets/restaurant-1.jpg";
import { useCollections } from "@/hooks/useCollections";
import RecommendedSection from "@/components/recommendations/RecommendedSection";
import { useRecommendedBusinesses } from "@/hooks/useRecommendedBusinesses";
import Seo from "@/components/Seo";

const featuredCollections = [
  { id: "f1", title: "Sélection hebdo Montréal", desc: "Les 10 meilleurs restaurants de Montréal cette semaine", image: foodImg, count: 10 },
  { id: "f2", title: "Incontournables Montréal", desc: "Découvrez les spots préférés des locaux", image: restaurantImg, count: 8 },
  { id: "f3", title: "Cafés cozy", desc: "Parfaits pour travailler ou relaxer", image: cafeImg, count: 6 },
];

const Collections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, bookmarkCount, bookmarkPreview, defaultCollection, customCollections, publicCollections, createCollection } = useCollections();
  const { becauseYouLiked, recommended, loading: recLoading } = useRecommendedBusinesses({ limit: 4 });
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPublic, setDraftPublic] = useState(false);
  const showRecs = !!user && bookmarkCount > 0;
  const recItems = (becauseYouLiked.length > 0 ? becauseYouLiked : recommended).slice(0, 4);

  const handleCreate = async () => {
    const name = draftName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createCollection(name, draftPublic);
      setDraftName("");
      setDraftPublic(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title="Collections de commerces — listes thématiques de Montréal | QMAPS"
        description="Parcourez les collections QMAPS : sélections hebdomadaires, incontournables locaux, cafés cozy et listes personnalisées de commerces à Montréal."
        canonicalPath="/collections"
      />
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <h1 className="font-heading text-xl font-bold text-foreground">Collections</h1>
        {user && <button onClick={() => void handleCreate()} disabled={creating || !draftName.trim()} className="text-sm font-semibold text-primary disabled:text-muted-foreground">CRÉER</button>}
      </div>

      <div className="px-4 pt-4">
        <button className="flex items-center gap-1 text-sm text-foreground font-medium mb-3">
          En vedette à <span className="font-bold">Montréal</span> <ChevronDown size={14} />
        </button>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
          {featuredCollections.map(col => (
            <div key={col.id} className="min-w-[220px] flex-shrink-0">
              <div className="relative">
                <img src={col.image} alt={col.title} className="w-full h-36 rounded-xl object-cover" />
                <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                  <Bookmark size={12} className="fill-current" /> {col.count}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-2">{col.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{col.desc}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Par QMAPS</p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-2 bg-muted" />

      {user && (
        <div className="px-4 py-4 border-b border-border space-y-3 bg-card">
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Créer une collection"
          />
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Collection publique</p>
              <p className="text-xs text-muted-foreground">Permettre aux autres utilisateurs de la découvrir</p>
            </div>
            <Switch checked={draftPublic} onCheckedChange={setDraftPublic} />
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Mes collections</h2>
          {(bookmarkCount > 0 || customCollections.length > 0) && <button className="text-sm font-semibold text-primary">Voir tout</button>}
        </div>

        {!user ? (
          <div className="text-center py-10">
            <Bookmark size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Connectez-vous pour voir vos collections</p>
            <Button onClick={() => navigate("/auth")} className="rounded-full gap-2"><LogIn size={16} /> Se connecter</Button>
          </div>
        ) : loading ? (
          <p className="text-center text-muted-foreground py-8">Chargement...</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-3">
            {defaultCollection && (
              <div className="min-w-[160px] flex-shrink-0">
                <div className="relative">
                  <img src={bookmarkPreview || defaultCollection.preview_image || "/placeholder.svg"} alt="Want to go" className="w-full h-36 rounded-xl object-cover" />
                  <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Bookmark size={12} className="fill-current" /> {bookmarkCount}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-2">Want to go</h3>
                <p className="text-xs text-muted-foreground">Privé</p>
              </div>
            )}

            {customCollections.map((collection) => (
              <div key={collection.id} className="min-w-[160px] flex-shrink-0">
                <div className="relative">
                  <img src={collection.preview_image || "/placeholder.svg"} alt={collection.name} className="w-full h-36 rounded-xl object-cover" />
                  <span className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm text-foreground text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <Bookmark size={12} className="fill-current" /> {collection.items_count}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-2 truncate">{collection.name}</h3>
                <p className="text-xs text-muted-foreground">{collection.is_public ? "Public" : "Privé"}</p>
              </div>
            ))}

            <button disabled={creating || !draftName.trim()} onClick={() => void handleCreate()} className="min-w-[160px] flex-shrink-0 flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border disabled:opacity-50">
              <Plus size={32} className="text-muted-foreground mb-1" />
              <span className="text-sm font-semibold text-foreground">Créer</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-2 bg-muted" />

      <div className="px-4 pt-4 pb-6">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Collections suivies</h2>
        {publicCollections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Vous ne suivez aucune collection.</p>
            <p className="text-xs text-muted-foreground mt-1">Découvrez les collections en vedette ci-dessus!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publicCollections.map((collection) => (
              <div key={collection.id} className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card">
                <img src={collection.preview_image || "/placeholder.svg"} alt={collection.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{collection.name}</p>
                  <p className="text-xs text-muted-foreground">{collection.items_count} adresses enregistrées</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRecs && recItems.length > 0 && (
        <div className="px-4 pb-6">
          <RecommendedSection
            title="Vous pourriez aussi aimer"
            subtitle="Inspiré de vos commerces enregistrés"
            source="collections_because_you_saved"
            items={recItems.map((r) => ({ business: r.business, reasonCodes: r.reasonCodes }))}
            loading={recLoading}
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Collections;
