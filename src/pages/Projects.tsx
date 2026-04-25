import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Truck, Droplets, Zap, Wrench, Car, HardHat, Sparkles, MoreHorizontal, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjectRequests } from "@/hooks/useProjectRequests";
import { useProjectCategories } from "@/hooks/useProjectCategories";
import StartProjectSheet from "@/components/projects/StartProjectSheet";
import ProjectRequestCard from "@/components/projects/ProjectRequestCard";
import cafeImg from "@/assets/cafe-1.jpg";
import restaurantImg from "@/assets/restaurant-1.jpg";
import cleaningImg from "@/assets/cleaning.jpg";
import salonImg from "@/assets/salon.jpg";

// Map service category slugs to icons + display labels.
const serviceCategories: { slug: string; icon: typeof Truck; label: string }[] = [
  { slug: "movers", icon: Truck, label: "Déménageurs" },
  { slug: "cleaning", icon: Sparkles, label: "Nettoyage" },
  { slug: "plumbers", icon: Droplets, label: "Plombiers" },
  { slug: "auto-repair", icon: Wrench, label: "Réparation" },
  { slug: "electricians", icon: Zap, label: "Électriciens" },
  { slug: "auto-repair", icon: Car, label: "Auto" },
  { slug: "contractors", icon: HardHat, label: "Entrepreneurs" },
  { slug: "__more__", icon: MoreHorizontal, label: "Plus" },
];

const projectItems = [
  { icon: Sparkles, name: "Nettoyage résidentiel" },
  { icon: Wrench, name: "Homme à tout faire" },
  { icon: HardHat, name: "Entrepreneurs généraux" },
];

const curatedSections = [
  {
    title: "Transformez votre intérieur",
    items: [
      { img: cafeImg, title: "Rénovez votre cuisine", cta: "Trouver des pros" },
      { img: restaurantImg, title: "Embellissez l'espace", cta: "Trouver des pros" },
    ],
  },
  {
    title: "Créez un espace extérieur",
    items: [
      { img: salonImg, title: "Profitez du plein air", cta: "Trouver des pros" },
      { img: cleaningImg, title: "Coin détente", cta: "Trouver des pros" },
    ],
  },
  {
    title: "Entretien extérieur",
    items: [
      { img: cleaningImg, title: "Devancez les fuites", cta: "Trouver des couvreurs" },
      { img: cafeImg, title: "Gardez la forme", cta: "Trouver des pros" },
    ],
  },
  {
    title: "Rafraîchissez votre intérieur",
    items: [
      { img: restaurantImg, title: "Chaleur ou fraîcheur", cta: "Trouver HVAC" },
      { img: salonImg, title: "Rénovez le décor", cta: "Trouver des peintres" },
    ],
  },
];

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requests } = useProjectRequests();
  const { categories } = useProjectCategories();
  const [startOpen, setStartOpen] = useState(false);
  const [presetCategoryId, setPresetCategoryId] = useState<string | null>(null);

  const openWithSlug = (slug: string) => {
    if (slug === "__more__") {
      setPresetCategoryId(null);
    } else {
      const match = categories.find(c => c.slug === slug);
      setPresetCategoryId(match?.id ?? null);
    }
    setStartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <Seo
        title="Projets QMaps — Trouvez des pros locaux à Montréal"
        description="Décrivez votre projet et recevez des devis de professionnels locaux vérifiés à Montréal."
        canonicalPath="/projects"
      />
      <div className="px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Projets QMAPS</h1>
            <p className="text-muted-foreground text-sm mt-1">Engagez un professionnel local</p>
          </div>
          <Button onClick={() => { setPresetCategoryId(null); setStartOpen(true); }} size="sm" className="rounded-full gap-1 shrink-0">
            <Plus size={14} /> Démarrer
          </Button>
        </div>

        {/* Service Categories */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {serviceCategories.map(cat => (
            <button key={cat.label} onClick={() => openWithSlug(cat.slug)} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-accent transition-colors">
                <cat.icon size={24} className="text-primary" />
              </div>
              <span className="text-[10px] text-foreground font-medium text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* My recent project requests */}
        {user && requests.length > 0 && (
          <div className="mt-7">
            <h2 className="font-heading text-lg font-bold text-foreground mb-3">Mes projets</h2>
            <div className="space-y-2">
              {requests.slice(0, 5).map(r => (
                <ProjectRequestCard key={r.id} request={r} to={`/projects/${r.id}`} />
              ))}
            </div>
          </div>
        )}
        <h2 className="font-heading text-lg font-bold text-foreground mt-8 mb-4">Quoi de neuf sur votre liste?</h2>
        <div className="space-y-4">
          {projectItems.map(item => (
            <div key={item.name} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <item.icon size={24} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full text-xs h-8" onClick={() => setStartOpen(true)}>Commencer</Button>
                <Button size="sm" variant="outline" className="rounded-full text-xs h-8" onClick={() => setStartOpen(true)}>Ajouter au plan</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Curated sections */}
        {curatedSections.map(section => (
          <div key={section.title} className="mt-8">
            <h2 className="font-heading text-lg font-bold text-foreground mb-3">{section.title}</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {section.items.map((item, i) => (
                <div key={i} className="min-w-[180px] flex-shrink-0">
                  <img src={item.img} alt={item.title} className="w-full h-28 rounded-xl object-cover" />
                  <p className="text-sm font-semibold text-foreground mt-2">{item.title}</p>
                  <Button variant="outline" size="sm" className="rounded-full text-xs mt-1.5 h-8">{item.cta}</Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav />
      <StartProjectSheet open={startOpen} onOpenChange={setStartOpen} defaultCategoryId={presetCategoryId} />
    </div>
  );
};

export default Projects;
