import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, ImageIcon, Megaphone, Quote, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QmapsConnect = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: "", phone: "", email: "" });
  const [submitted, setSubmitted] = useState(false);

  const features = [
    { icon: Send, title: "Racontez votre histoire à votre façon", desc: "Les publications sont faciles à créer et vous donnent la possibilité d'annoncer de nouveaux plats, partager des offres et montrer votre savoir-faire. Gardez vos clients informés et intéressés par votre entreprise." },
    { icon: Sparkles, title: "Publications illimitées", desc: "Personnalisez votre page avec un fil d'actualités dédié et racontez votre histoire en partageant des nouvelles et offres qui montrent pourquoi votre entreprise est unique." },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"><MessageSquare className="text-primary" size={28} /></div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Demande envoyée!</h2>
        <p className="text-sm text-muted-foreground mb-6">Un spécialiste QMAPS Connect vous contactera bientôt.</p>
        <Button onClick={() => navigate("/merchant")} className="rounded-full">Retour au Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant")}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-base font-bold text-foreground">QMAPS Connect</h1>
      </div>

      {/* Hero */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h2 className="font-heading text-xl font-bold text-foreground mb-2">QMAPS Connect</h2>
        <p className="text-sm text-muted-foreground mb-5">Partagez des mises à jour avec les clients intéressés par votre entreprise.</p>
        <Button onClick={() => setShowDemo(true)} className="rounded-full w-full bg-primary text-primary-foreground font-bold">
          Obtenir QMAPS Connect
        </Button>
      </div>

      {/* Value prop */}
      <div className="bg-muted/40 px-6 py-8 text-center">
        <h3 className="font-heading text-lg font-bold text-foreground mb-2">Transformez votre page en un outil puissant pour raconter votre histoire aux utilisateurs à forte intention de QMAPS.</h3>
        {/* Mock preview card */}
        <div className="bg-card rounded-xl border border-border p-4 mt-5 mx-auto max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/20" />
            <span className="text-xs font-semibold text-foreground">Votre Entreprise</span>
          </div>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 h-16 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Venez découvrir nos nouveautés!</p>
        </div>
      </div>

      {/* Testimonial */}
      <div className="px-6 py-8 text-center">
        <Quote className="text-primary mx-auto mb-3" size={28} />
        <p className="text-sm italic text-muted-foreground mb-4">"QMAPS Connect est un autre moyen pour vous de vous mettre en avant et de présenter votre entreprise comme vous le souhaitez."</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Propriétaire satisfait</p>
            <p className="text-xs text-muted-foreground">Restaurant local</p>
          </div>
        </div>
      </div>

      {/* Post example */}
      <div className="px-6 pb-8 text-center">
        <h3 className="font-heading text-lg font-bold text-foreground mb-2">Créez des publications qui apparaissent sur votre page QMAPS</h3>
        <p className="text-sm text-muted-foreground mb-5">Partagez des promotions, mettez en avant les pépites cachées de votre menu, faites la promotion d'événements, et plus encore.</p>
        <div className="bg-card rounded-xl border border-border p-4 max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20" />
              <span className="text-xs font-semibold text-foreground">Votre Entreprise</span>
            </div>
          </div>
          <div className="h-32 bg-muted rounded-lg flex items-center justify-center mb-2">
            <Megaphone size={24} className="text-muted-foreground" />
          </div>
          <p className="text-xs font-semibold text-foreground text-left">Venez dîner ce soir!</p>
          <p className="text-xs text-muted-foreground text-left">Le dîner est toujours meilleur quand vous n'avez pas à cuisiner.</p>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 pb-8">
        <h3 className="font-heading text-lg font-bold text-foreground text-center mb-2">Affichez votre contenu devant les clients locaux</h3>
        <div className="space-y-6 mt-6">
          {features.map((f, i) => (
            <div key={i} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <f.icon className="text-primary" size={22} />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">{f.title}</h4>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo request / CTA */}
      <div className="px-6 pb-8 text-center">
        <h3 className="font-heading text-lg font-bold text-foreground mb-2">Envie d'en savoir plus?</h3>
        <p className="text-sm text-muted-foreground mb-4">Préparez-vous au succès. Demandez à un spécialiste QMAPS Connect de vous appeler.</p>

        {showDemo ? (
          <div className="bg-card rounded-xl border border-border p-4 space-y-3 text-left">
            <Input placeholder="Nom complet" value={demoForm.name} onChange={e => setDemoForm(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Téléphone" type="tel" value={demoForm.phone} onChange={e => setDemoForm(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" type="email" value={demoForm.email} onChange={e => setDemoForm(p => ({ ...p, email: e.target.value }))} />
            <Button onClick={() => setSubmitted(true)} className="w-full rounded-full" disabled={!demoForm.name || !demoForm.email}>
              Demander une démo
            </Button>
          </div>
        ) : (
          <>
            <Button variant="outline" onClick={() => setShowDemo(true)} className="rounded-full mb-3 w-full">Demander une démo</Button>
            <Button onClick={() => setShowDemo(true)} className="rounded-full w-full bg-primary text-primary-foreground font-bold">
              Obtenir QMAPS Connect
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default QmapsConnect;
