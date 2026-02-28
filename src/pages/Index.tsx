import SearchBar from "@/components/SearchBar";
import CategoryRow from "@/components/CategoryRow";
import BusinessCard from "@/components/BusinessCard";
import BottomNav from "@/components/BottomNav";
import { businesses } from "@/data/mockData";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
            Q<span className="text-primary">Maps</span>
          </h1>
          <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">
            📍 Montréal
          </span>
        </div>

        <SearchBar />
      </div>

      {/* Categories */}
      <div className="px-4 mt-3">
        <CategoryRow />
      </div>

      {/* Feed */}
      <div className="px-4 mt-4 space-y-4">
        {businesses.map((business) => (
          <BusinessCard key={business.id} business={business} />
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Index;
