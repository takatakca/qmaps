import { categories } from "@/data/mockData";

const CategoryRow = () => {
  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className="flex flex-col items-center gap-1.5 min-w-[64px] group"
        >
          <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-2xl shadow-sm group-hover:border-primary/30 transition-colors">
            {cat.icon}
          </div>
          <span className="text-xs text-foreground font-medium whitespace-nowrap">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryRow;
