import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Seo from "@/components/Seo";
import OwnedGallery from "@/components/account/OwnedGallery";
import OwnedReviews from "@/components/account/OwnedReviews";
import { Button } from "@/components/ui/button";
import { loadPublicPlace, QmapsRequestError } from "@/lib/ownedApi";
import { exampleListingTitle } from "@/lib/exampleListing";

type Result = Awaited<ReturnType<typeof loadPublicPlace>> | { missing: boolean };

export default function PublicOwnedListing({ id, legacyUnavailable, retryLegacy }: {
  id: string;
  legacyUnavailable: boolean;
  retryLegacy: () => Promise<void>;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const preview = useId();
  useEffect(() => {
    const request = new AbortController();
    setResult(null);
    loadPublicPlace(id, request.signal)
      .then(detail => { if (!request.signal.aborted) setResult(detail); })
      .catch(error => {
        if (!request.signal.aborted) setResult({ missing: error instanceof QmapsRequestError && error.status === 404 });
      });
    return () => request.abort();
  }, [id, attempt]);
  if (!result) return <main className="mx-auto max-w-lg p-5" aria-busy="true">Chargement de la fiche…</main>;
  if ("missing" in result) {
    const unavailable = legacyUnavailable || !result.missing;
    return <main className="mx-auto max-w-lg space-y-3 p-5">
      <h1 className="text-xl font-bold">{unavailable ? "Impossible de charger la fiche" : "Commerce introuvable"}</h1>
      {unavailable && <Button onClick={() => {
        setAttempt(value => value + 1);
        if (legacyUnavailable) void retryLegacy();
      }}>Réessayer</Button>}
      <Link className="block underline" to="/search">Retour à la recherche</Link>
      <BottomNav />
    </main>;
  }
  const place = result.place;
  const exampleTitle = exampleListingTitle(place);
  const name = exampleTitle ?? place.name;
  return <main className="mx-auto max-w-2xl space-y-6 px-5 py-6 pb-24">
    <Seo title={name + " · " + place.city + " | QMAPS"} description={place.description || name + " à " + place.city} canonicalPath={"/business/" + id} />
    <Link className="text-sm underline" to={"/search?" + new URLSearchParams({ city: place.city })}>Retour à la recherche</Link>
    <header className="space-y-2">
      <h1 className="font-heading text-3xl font-bold">{name}</h1>
      {exampleTitle && <p className="text-sm text-muted-foreground">Fiche d’exemple</p>}
      <p>{[place.address, place.city].filter(Boolean).join(" · ")}</p>
      {place.description && <p>{place.description}</p>}
    </header>
    <Button asChild><Link to={"/compte?fiche=" + id}>Ouvrir cette fiche dans mon compte</Link></Button>
    <OwnedGallery place={id} viewer={preview} publicCredentials={result.credentials} readOnly />
    <OwnedReviews place={id} viewer={preview} publicCredentials={result.credentials} owner={false} readOnly />
    <BottomNav />
  </main>;
}
