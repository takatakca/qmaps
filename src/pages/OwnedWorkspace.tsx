import { directoryCandidateKey, directoryPreferenceKey } from "@/hooks/useRecommendedBusinesses";
import {
  PublisherModeration,
  PublicationTerms,
} from "@/components/account/PublisherModeration";
import { OwnedClosure, ClosureQueue } from "@/components/account/OwnedClosure";
import PhotoModeration from "@/components/account/PhotoModeration";
import OwnedGallery from "@/components/account/OwnedGallery";
import OwnedReviews from "@/components/account/OwnedReviews";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bookmark, Building2, Database, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import OwnedLogin from "@/components/account/OwnedLogin";
import { exampleListingTitle } from "@/lib/exampleListing";
import { wantsOwnedMerchantTab } from "@/lib/ownedRoutes";
import {
  ownedApi,
  QmapsRequestError,
  type QmapsUser,
  type QmapsPlace,
} from "@/lib/ownedApi";

function Console({ userId }: { userId: string }) {
  const status = useQuery({
    queryKey: ["qmaps-owner-console", userId],
    queryFn: () =>
      ownedApi<{
        places: number;
        accounts: number;
        media: number;
        database: string;
      }>("console"),
    retry: false,
  });
  const version = useQuery({
    queryKey: ["qmaps-owned-sha"],
    queryFn: async () => {
      const r = await fetch("/qmaps-release.json", { cache: "no-store" });
      if (!r.ok) throw Error();
      const data = await r.json();
      if (!/^[a-f0-9]{40}$/.test(data.sha)) throw Error();
      return data.sha as string;
    },
  });
  if (status.isPending) return <p>Vérification des accès…</p>;
  if (status.isError) return <p role="alert">{status.error.message}</p>;
  return (
    <section className="space-y-5">
      <h2 className="text-2xl font-bold">État de la plateforme</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          [Building2, "Commerces", status.data.places],
          [Users, "Comptes", status.data.accounts],
          [Database, "Médias", status.data.media],
        ].map(([Symbol, label, n]) => {
          const Icon = Symbol as typeof Building2;
          return (
            <Card key={String(label)} className="space-y-2 p-4">
              <Icon aria-hidden size={18} />
              <p className="text-sm">{String(label)}</p>
              <p className="text-3xl font-bold">{String(n)}</p>
            </Card>
          );
        })}
      </div>
      <p>Base de données · {status.data.database}</p>
      <PublisherModeration userId={userId} />
      <PhotoModeration userId={userId} />
      <ClosureQueue userId={userId} />
      {version.data && (
        <p>
          Version en ligne ·{" "}
          <a
            className="underline"
            href={"https://github.com/takatakca/qmaps/commit/" + version.data}
          >
            {version.data.slice(0, 12)}
          </a>
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void status.refetch()} variant="outline">
          Actualiser
        </Button>
        <Button asChild variant="outline">
          <Link to="/admin">Gestion des fiches et modération</Link>
        </Button>
      </div>
    </section>
  );
}

type MarketplaceTab = "catalogue" | "saved" | "merchant";

function Marketplace({ user, initialPlace = null, initialTab = "catalogue" }: {
  user: QmapsUser;
  initialPlace?: QmapsPlace | null;
  initialTab?: MarketplaceTab;
}) {
  const [tab, setTab] = useState<MarketplaceTab>(initialTab);
  const [term, setTerm] = useState(""),
    [city, setCity] = useState(""),
    [search, setSearch] = useState({ q: "", city: "" }),
    [selected, setSelected] = useState<QmapsPlace | null>(initialPlace);
  const [note, setNote] = useState(""),
    [busy, setBusy] = useState(false);
  const list = useQuery({
    queryKey: ["qmaps-owned-places", user.id, tab, search],
    queryFn: () =>
      ownedApi<QmapsPlace[]>(
        tab === "merchant"
          ? "me/places"
          : tab === "saved"
            ? "me/bookmarks"
            : "places?" + new URLSearchParams(search).toString(),
      ),
    retry: false,
  });
  const features = useQuery({
    queryKey: ["qmaps-owned-features", selected?.id],
    enabled: !!selected,
    queryFn: () =>
      ownedApi<{ waitlist: boolean }>(
        "places/" + selected!.id + "/guest-settings",
      ),
  });
  const posts = useQuery({
    queryKey: ["qmaps-owned-posts", selected?.id],
    enabled: !!selected,
    queryFn: () =>
      ownedApi<{ id: string; title: string; body: string }[]>(
        "places/" + selected!.id + "/posts",
      ),
  });
  const go = (next: typeof tab) => {
    setTab(next);
    setSelected(null);
    setNote("");
  };
  async function act(task: () => Promise<unknown>, message: string) {
    setBusy(true);
    setNote("");
    try {
      await task();
      setNote(message);
      await list.refetch();
      if (selected) await posts.refetch();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }
  const form = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    return new FormData(event.currentTarget);
  };
  const selectedExampleTitle = selected && exampleListingTitle(selected);
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-2" aria-label="Espace QMAPS">
        {(
          [
            ["catalogue", "Découvrir"],
            ["saved", "Favoris"],
            ["merchant", "Mon commerce"],
          ] as const
        ).map(([value, text]) => (
          <Button
            key={value}
            variant={tab === value ? "default" : "outline"}
            aria-pressed={tab === value}
            onClick={() => go(value)}
          >
            {text}
          </Button>
        ))}
      </nav>
      {note && <p role="status">{note}</p>}
      {selected ? (
        <section className="space-y-4">
          <button
            className="inline-flex items-center gap-1 text-sm underline"
            onClick={() => setSelected(null)}
          >
            <ArrowLeft size={16} />
            Retour aux fiches
          </button>
          <h2 className="text-2xl font-bold">{selectedExampleTitle || selected.name}</h2>
          {selectedExampleTitle && <p className="text-sm text-muted-foreground">Fiche d’exemple</p>}
          <p>
            {selected.city}
            {selected.address ? " · " + selected.address : ""}
          </p>
          {selected.description && <p>{selected.description}</p>}
          <OwnedGallery
            key={"photos-" + selected.id}
            place={selected.id}
            viewer={user.id}
          />
          <OwnedReviews
            key={selected.id}
            place={selected.id}
            owner={tab === "merchant"}
            viewer={user.id}
          />
          {tab !== "merchant" && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void act(
                  () =>
                    ownedApi(
                      "places/" + selected.id + "/bookmark",
                      tab === "saved" ? "DELETE" : "PUT",
                    ),
                  tab === "saved" ? "Favori retiré" : "Fiche enregistrée",
                )
              }
            >
              <Bookmark size={16} />
              {tab === "saved" ? "Retirer des favoris" : "Enregistrer la fiche"}
            </Button>
          )}
          {tab !== "merchant" && features.data?.waitlist && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                const d = form(e);
                void act(
                  () =>
                    ownedApi("places/" + selected.id + "/waitlist", "POST", {
                      name: d.get("name"),
                      party_size: Number(d.get("people")),
                    }),
                  "Demande envoyée",
                );
              }}
            >
              <h3 className="font-semibold">Liste d’attente</h3>
              <Label htmlFor="wait-name">Nom pour l’accueil</Label>
              <Input id="wait-name" name="name" required maxLength={80} />
              <Label htmlFor="wait-size">Personnes</Label>
              <Input
                id="wait-size"
                type="number"
                name="people"
                defaultValue={2}
                min={1}
                max={30}
                required
              />
              <Button disabled={busy}>Joindre la liste d’attente</Button>
            </form>
          )}
          {tab === "merchant" && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                const d = form(e);
                void act(
                  () =>
                    ownedApi("places/" + selected.id + "/posts", "POST", {
                      title: d.get("title"),
                      body: d.get("body"),
                    }),
                  "Actualité publiée",
                );
              }}
            >
              <h3 className="font-semibold">Nouvelle actualité</h3>
              <Label htmlFor="post-title">Titre</Label>
              <Input id="post-title" name="title" maxLength={100} required />
              <Label htmlFor="post-body">Texte</Label>
              <textarea
                id="post-body"
                name="body"
                className="w-full rounded-md border p-2"
                rows={3}
                maxLength={2000}
                required
              />
              <Button disabled={busy}>Publier</Button>
            </form>
          )}
          {posts.data?.map((p) => (
            <Card key={p.id} className="p-4">
              <h3 className="font-bold">{p.title}</h3>
              <p>{p.body}</p>
            </Card>
          ))}
        </section>
      ) : (
        <>
          {tab === "catalogue" && (
            <form
              className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch({ q: term.trim(), city: city.trim() });
              }}
            >
              <Input
                aria-label="Rechercher un commerce"
                placeholder="Nom du commerce"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              />
              <Input
                aria-label="Ville"
                placeholder="Ville"
                autoComplete="address-level2"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <Button>Rechercher</Button>
            </form>
          )}
          {tab === "merchant" && (
            <details className="rounded-lg border p-4">
              <summary className="cursor-pointer font-semibold">
                Créer ma fiche
              </summary>
              <form
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  const el = e.currentTarget;
                  const d = form(e);
                  void act(async () => {
                    await ownedApi("places", "POST", {
                      name: d.get("name"),
                      city: d.get("city"),
                      address: d.get("address"),
                    });
                    el.reset();
                  }, "Fiche créée");
                }}
              >
                {[
                  ["name", "Nom du commerce"],
                  ["city", "Ville"],
                  ["address", "Adresse"],
                ].map(([key, title]) => (
                  <div key={key}>
                    <Label htmlFor={"place-" + key}>{title}</Label>
                    <Input
                      name={key}
                      id={"place-" + key}
                      required
                      maxLength={key === "address" ? 250 : 100}
                    />
                  </div>
                ))}
                <Button disabled={busy}>Créer ma fiche</Button>
              </form>
            </details>
          )}
          {list.isPending ? (
            <p>Chargement…</p>
          ) : list.isError ? (
            <p role="alert">{list.error.message}</p>
          ) : list.data.length === 0 ? (
            <p>Aucune fiche dans cette liste.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {list.data.map((p) => {
                const exampleTitle = exampleListingTitle(p);
                return (
                  <button
                    className="rounded-lg border bg-card p-4 text-left hover:border-primary focus-visible:ring-2"
                    key={p.id}
                    onClick={() => {
                      setSelected(p);
                      setNote("");
                    }}
                  >
                    <span className="block font-semibold">{exampleTitle ?? p.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {p.city}{exampleTitle ? " · Fiche d’exemple" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
function LinkedMarketplace({ user, placeId }: { user: QmapsUser; placeId: string }) {
  const place = useQuery({
    queryKey: ["qmaps-linked-place", user.id, placeId],
    queryFn: () => ownedApi<QmapsPlace>("places/" + placeId),
    retry: false,
  });
  if (place.isPending) return <p>Chargement de la fiche…</p>;
  if (place.isError) return (
    <div role="alert" className="space-y-2">
      <p>{place.error.message}</p>
      <Button variant="outline" onClick={() => void place.refetch()}>Réessayer</Button>{" "}
      <Link className="underline" to="/compte">Retour au catalogue</Link>
    </div>
  );
  return <Marketplace user={user} initialPlace={place.data} />;
}

export default function OwnedWorkspace() {
  const cache = useQueryClient();
  const { pathname, search } = useLocation();
  const params = new URLSearchParams(search);
  const linked = params.get("fiche");
  const placeId = linked && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(linked) ? linked : null;
  const merchantEntry = pathname === "/compte" && !placeId && wantsOwnedMerchantTab(params);
  const initialTab = merchantEntry ? "merchant" : "catalogue";
  const consolePage = pathname === "/console";
  const closurePage = pathname === "/compte/fermeture";
  const [user, setUser] = useState<QmapsUser | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  async function refresh() {
    setReady(false);
    setError("");
    try {
      const current = await ownedApi<QmapsUser>("me");
      cache.setQueryData(["qmaps-bookmark-account"], current.id);
      setUser(current);
    } catch (e) {
      setUser(null);
      if (e instanceof QmapsRequestError && e.status === 401) cache.setQueryData(["qmaps-bookmark-account"], null);
      if (!(e instanceof QmapsRequestError && e.status === 401))
        setError(e instanceof Error ? e.message : "Service indisponible");
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function signOut() {
    try {
      await ownedApi("accounts/logout", "POST");
      cache.setQueryData(["qmaps-bookmark-account"], null);
      cache.removeQueries({ queryKey: ["qmaps-public-bookmarks"] });
      cache.removeQueries({ queryKey: directoryPreferenceKey });
      cache.removeQueries({ queryKey: directoryCandidateKey });
      setUser(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Déconnexion impossible");
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="font-heading text-xl font-bold">
            QMAPS
          </Link>
          <nav className="flex gap-3 text-sm">
            {!closurePage && (
              <Link className="underline" to="/compte/fermeture">
                Fermeture du compte
              </Link>
            )}
            {closurePage && (
              <Link className="underline" to="/compte">
                Mon compte
              </Link>
            )}
            {user?.roles.includes("admin") && (
              <Link
                className="underline"
                to={consolePage ? "/compte" : "/console"}
              >
                {consolePage ? "Mon compte" : "Console"}
              </Link>
            )}
            {user && (
              <button onClick={() => void signOut()}>Se déconnecter</button>
            )}
          </nav>
        </div>
      </header>
      <div
        className={
          "mx-auto space-y-6 p-5 sm:p-8 " + (user ? "max-w-4xl" : "max-w-lg")
        }
      >
        <h1 className="font-heading text-3xl font-bold">
          {closurePage
            ? "Supprimer mon compte QMAPS"
            : consolePage
              ? "Console QMAPS"
              : "Mon espace QMAPS"}
        </h1>
        {closurePage && (
          <p>
            Connectez-vous avec l’identifiant de l’application QMAPS pour
            demander la fermeture de votre compte et la suppression de vos
            données personnelles. Vous pouvez annuler votre demande avant sa
            prise en charge.{" "}
            <Link className="underline" to="/account-deletion-policy">
              Données concernées et délais
            </Link>
            .
          </p>
        )}
        {!ready ? (
          <p>Vérification de la session…</p>
        ) : error ? (
          <div role="alert">
            {error}{" "}
            <button className="underline" onClick={() => void refresh()}>
              Réessayer
            </button>
          </div>
        ) : !user ? (
          <>
            {merchantEntry && <p>Connectez-vous ou créez un compte QMAPS pour ajouter votre entreprise à l’annuaire.</p>}
            <OwnedLogin onReady={() => void refresh()} />
          </>
        ) : closurePage ? (
          <OwnedClosure key={user.id} userId={user.id} />
        ) : consolePage ? (
          user.roles.includes("admin") ? (
            <Console userId={user.id} />
          ) : (
            <p role="alert">Accès propriétaire requis.</p>
          )
        ) : (
          <>
            <PublicationTerms key={user.id} userId={user.id} />
            {placeId
              ? <LinkedMarketplace key={user.id + placeId} user={user} placeId={placeId} />
              : <Marketplace key={user.id + "-" + initialTab} user={user} initialTab={initialTab} />}
          </>
        )}
      </div>
    </main>
  );
}
