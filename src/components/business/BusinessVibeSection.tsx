interface BusinessVibeSectionProps {
  photos: string[];
  amenities: string[] | null;
}

const vibeLabels: Record<string, string> = {
  "Wi-Fi": "📶",
  "Terrasse": "☀️",
  "Stationnement": "🅿️",
  "Livraison": "🚚",
  "Réservation": "📋",
  "Accessible": "♿",
};

const BusinessVibeSection = ({ photos, amenities }: BusinessVibeSectionProps) => {
  if (photos.length === 0 && (!amenities || amenities.length === 0)) return null;

  return (
    <div className="px-4 py-5 border-t border-border bg-secondary/30">
      {photos.length > 0 && (
        <>
          <h3 className="font-heading text-lg font-bold text-foreground mb-3">L'ambiance</h3>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {photos.slice(0, 4).map((photo, i) => (
              <div key={i} className="shrink-0 w-40">
                <img src={photo} alt={`Photo ${i + 1}`} className="w-40 h-28 object-cover rounded-xl" />
                <p className="text-sm font-medium text-foreground mt-1.5">
                  {i === 0 ? "Intérieur" : i === 1 ? "Extérieur" : `Photo ${i + 1}`}
                </p>
                <p className="text-xs text-muted-foreground">{Math.floor(Math.random() * 10 + 2)} photos</p>
              </div>
            ))}
          </div>
        </>
      )}

      {amenities && amenities.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${photos.length > 0 ? "mt-4" : ""}`}>
          {amenities.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-xs font-medium text-foreground rounded-full">
              {vibeLabels[a] || "✓"} {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessVibeSection;
