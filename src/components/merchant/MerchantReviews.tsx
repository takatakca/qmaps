import StarRating from "@/components/StarRating";

interface Props {
  reviews: any[];
}

const MerchantReviews = ({ reviews }: Props) => (
  <div className="space-y-3">
    {reviews.length === 0 && (
      <p className="text-center text-muted-foreground text-sm py-8">Aucun avis pour le moment</p>
    )}
    {reviews.map((r: any) => (
      <div key={r.id} className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {r.profiles?.display_name || "Utilisateur"}
          </p>
          <StarRating rating={r.rating} size={12} />
        </div>
        <p className="text-sm text-foreground mt-2">{r.body}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(r.created_at).toLocaleDateString("fr-CA")}
        </p>
      </div>
    ))}
  </div>
);

export default MerchantReviews;
