import { useState, type FormEvent } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ownedApi } from "@/lib/ownedApi";

type Photo = {
  id: string;
  merchant_photo: boolean;
  mine: boolean;
  cover: boolean;
};
type Page = { photos: Photo[]; next: number | null };

export default function OwnedGallery({
  place,
  viewer,
  readOnly = false,
}: {
  place: string;
  viewer: string;
  readOnly?: boolean;
}) {
  const path = "places/" + place + "/photos";
  const gallery = useInfiniteQuery({
    queryKey: ["qmaps-gallery", place, viewer],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => ownedApi<Page>(path + "?offset=" + pageParam),
    getNextPageParam: (last) => last.next ?? undefined,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [removal, setRemoval] = useState<string | null>(null);
  async function run(task: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await task();
      await gallery.refetch();
      setRemoval(null);
      setMessage(success);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }
  function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("photo");
    if (!(file instanceof File) || !file.size || file.size > 3 * 1024 * 1024) {
      setMessage("Choisissez une photo de 3 Mio ou moins.");
      return;
    }
    void run(async () => {
      await ownedApi(path, "POST", file);
      form.reset();
    }, "Photo publiée");
  }
  const photos = gallery.data?.pages.flatMap((p) => p.photos) ?? [];
  return (
    <section className="space-y-3">
      <h3 className="text-xl font-semibold">Photos</h3>
      {!readOnly && <form className="space-y-2" onSubmit={upload}>
        <label className="block">
          Ajouter une photo au format JPEG ou PNG (3 Mio maximum)
          <input
            className="mt-1 block w-full"
            name="photo"
            type="file"
            required
            accept="image/jpeg,image/png"
          />
        </label>
        <Button disabled={busy} variant="outline">
          Publier la photo
        </Button>
      </form>}
      {gallery.isPending ? (
        <p>Chargement des photos…</p>
      ) : gallery.isError ? (
        <p role="alert">{gallery.error.message}</p>
      ) : !photos.length ? (
        <p>Aucune photo publiée.</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {photos.map((photo) => (
          <figure className="space-y-2 rounded border p-2" key={photo.id}>
            <img
              src={"/api/v1/photos/" + photo.id}
              alt={
                photo.merchant_photo
                  ? "Photo du commerce"
                  : "Photo d’un visiteur"
              }
              loading="lazy"
              className="aspect-video w-full rounded object-cover"
            />
            <figcaption>
              {photo.merchant_photo ? "Commerce" : "Visiteur"}
              {photo.cover ? " · Couverture" : ""}
            </figcaption>
            {!readOnly && photo.mine && photo.merchant_photo && !photo.cover && (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  void run(
                    () => ownedApi("photos/" + photo.id + "/cover", "PUT"),
                    "Couverture modifiée",
                  )
                }
              >
                Choisir comme couverture
              </Button>
            )}
            {!readOnly && (photo.mine ? (
              removal === photo.id ? (
                <div className="flex gap-2">
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(
                        () => ownedApi("photos/" + photo.id, "DELETE"),
                        "Photo retirée",
                      )
                    }
                  >
                    Confirmer le retrait
                  </Button>
                  <Button variant="outline" onClick={() => setRemoval(null)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  disabled={busy}
                  variant="outline"
                  onClick={() => setRemoval(photo.id)}
                >
                  Retirer ma photo
                </Button>
              )
            ) : (
              <Button
                disabled={busy}
                variant="outline"
                onClick={() =>
                  void run(
                    () => ownedApi("photos/" + photo.id + "/report", "POST"),
                    "Signalement enregistré",
                  )
                }
              >
                Signaler
              </Button>
            ))}
          </figure>
        ))}
      </div>
      {gallery.hasNextPage && (
        <Button
          variant="outline"
          disabled={gallery.isFetchingNextPage}
          onClick={() => void gallery.fetchNextPage()}
        >
          Voir plus de photos
        </Button>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
