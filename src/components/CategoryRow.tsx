import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const CategoryRow = () => {
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigate(`/search?category=${cat.slug}`)}
          className="flex flex-col items-center gap-1.5 min-w-[68px] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-2xl shadow-soft group-hover:shadow-glow group-hover:border-primary/40 group-hover:-translate-y-0.5 transition-all duration-200">
            {cat.icon}
          </div>
          <span className="text-xs text-foreground font-medium whitespace-nowrap group-hover:text-primary transition-colors">
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryRow;
