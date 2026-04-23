import BusinessCard from "@/components/BusinessCard";
import { mapBusinessToCard, type BusinessWithDistance } from "@/lib/business";

interface NearbySectionProps {
  title: string;
  businesses: BusinessWithDistance[];
}

const NearbySection = ({ title, businesses }: NearbySectionProps) => {
  if (businesses.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">Repérés autour de vous maintenant</p>
      </div>
      <div className="space-y-4">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={mapBusinessToCard(business)} />
        ))}
      </div>
    </section>
  );
};

export default NearbySection;