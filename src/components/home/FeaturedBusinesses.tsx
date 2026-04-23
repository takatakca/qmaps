import BusinessCard from "@/components/BusinessCard";
import { mapBusinessToCard, type BusinessWithDistance } from "@/lib/business";

interface FeaturedBusinessesProps {
  businesses: BusinessWithDistance[];
}

const FeaturedBusinesses = ({ businesses }: FeaturedBusinessesProps) => {
  if (businesses.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-lg font-bold text-foreground">En ce moment à Montréal</h2>
        <p className="text-xs text-muted-foreground">Les fiches les mieux notées du moment</p>
      </div>
      <div className="space-y-4">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={mapBusinessToCard(business)} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedBusinesses;