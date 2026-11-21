import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ownedApi } from "@/lib/ownedApi";

type Review = {id: string; rating: number; body: string; author: string; owner_reply: string | null; mine: boolean};
export default function OwnedReviews({ place, owner, viewer }: {place: string; owner: boolean; viewer: string}) {
  const path = "places/" + place + "/reviews";
  const reviews = useQuery({queryKey:["qmaps-owned-reviews",place,viewer],queryFn:()=>ownedApi<Review[]>(path)});
  const [message,setMessage] = useState("");
  const [busy,setBusy] = useState(false);
  const mine = reviews.data?.find(review=>review.mine);
  async function save(action:()=>Promise<unknown>, success:string) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      await reviews.refetch();
      setMessage(success);
    } catch (error) {setMessage(error instanceof Error ? error.message : "Action impossible");}
    finally {setBusy(false);}
  }
  function values(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return new FormData(event.currentTarget);
  }
  return <section className="space-y-4">
    <h3 className="text-xl font-semibold">Avis de la communauté</h3>
    {reviews.isPending ? <p>Chargement des avis…</p> : reviews.isError ? <p role="alert">{reviews.error.message}</p> : <>
      {!reviews.data.length && <p>Aucun avis publié.</p>}
      {reviews.data.map(review=><article key={review.id} className="space-y-2 rounded-lg border p-4">
        <p className="font-semibold">{review.author} · {review.rating}/5</p>
        <p className="whitespace-pre-wrap">{review.body}</p>
        {review.owner_reply && <p className="border-l-2 pl-3">Réponse du commerce · {review.owner_reply}</p>}
        {owner && <form className="space-y-2" onSubmit={e=>{const data=values(e);void save(()=>ownedApi(path+"/"+review.id+"/reply","PUT",{body:data.get("reply")}),"Réponse publiée");}}>
          <label className="block">Votre réponse<textarea name="reply" defaultValue={review.owner_reply ?? ""} required maxLength={2000} className="block w-full rounded border p-2" /></label>
          <Button disabled={busy} variant="outline">Publier la réponse</Button>
        </form>}
      </article>)}
      {!owner && <form key={mine?.id??"new"} className="space-y-2" onSubmit={e=>{const data=values(e);void save(()=>ownedApi(path,"PUT",{rating:Number(data.get("rating")),body:data.get("review")}),"Avis enregistré");}}>
        <h4 className="font-semibold">{mine ? "Modifier mon avis" : "Écrire un avis"}</h4>
        <label className="block">Note sur cinq <select name="rating" required defaultValue={mine?.rating??""} className="rounded border p-1"><option value="" disabled>Choisir</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label>
        <label className="block">Votre expérience<textarea name="review" defaultValue={mine?.body??""} required maxLength={4000} className="block w-full rounded border p-2" /></label>
        <Button disabled={busy}>Enregistrer mon avis</Button>
        {mine && <Button disabled={busy} type="button" variant="outline" onClick={()=>void save(()=>ownedApi(path,"DELETE"),"Avis retiré")}>Retirer mon avis</Button>}
      </form>}
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
