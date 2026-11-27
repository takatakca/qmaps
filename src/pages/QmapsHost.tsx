import { Link } from "react-router-dom";
import MerchantPageHeader from "@/components/merchant/layout/MerchantPageHeader";
import { Button } from "@/components/ui/button";

export default function QmapsHost() {
  return (
    <main className="min-h-screen max-w-lg mx-auto bg-background">
      <MerchantPageHeader title="Accueil téléphonique" back="/merchant/more" />
      <section className="p-5 space-y-4">
        <h1 className="font-heading text-xl font-semibold">
          Accueil des clients
        </h1>
        <p>
          Les demandes de réservation et la liste d’attente sont gérées depuis
          votre portail.
        </p>
        <Button asChild>
          <Link to="/merchant/guest-manager">Gérer les demandes</Link>
        </Button>
        <h2 className="font-semibold">Accueil par téléphone</h2>
        <p>
          Le service vocal est en préparation. Pour en discuter avec l’équipe
          QMAPS, vous pouvez préparer un courriel.
        </p>
        <Button asChild variant="outline">
          <a href="mailto:business@qmaps.ca?subject=Accueil%20t%C3%A9l%C3%A9phonique%20QMAPS">
            Préparer un courriel
          </a>
        </Button>
      </section>
    </main>
  );
}
