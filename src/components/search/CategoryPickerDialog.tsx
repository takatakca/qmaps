import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LayoutGrid, Search as SearchIcon } from "lucide-react";
import { useAllCategories, searchCategories } from "@/hooks/useAllCategories";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect?: (slug: string) => void;
}

/**
 * Searchable dialog over ALL active categories (1,000+),
 * grouped by parent category when no query is entered.
 */
const CategoryPickerDialog = ({ open, onOpenChange, onSelect }: Props) => {
  const { categories, loading } = useAllCategories();
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const grouped = useMemo(() => {
    if (q.trim()) return null;
    const byId = new Map(categories.map((c) => [c.id, c]));
    const groups = new Map<string, { parent: string; items: typeof categories }>();
    for (const c of categories) {
      if (!c.parent_id) continue; // show only children grouped under parent
      const parent = byId.get(c.parent_id);
      if (!parent) continue;
      const key = parent.id;
      if (!groups.has(key)) groups.set(key, { parent: parent.name, items: [] });
      groups.get(key)!.items.push(c);
    }
    // Also include top-level cats that have no children
    const topLevelOnly = categories.filter(
      (c) => !c.parent_id && !categories.some((x) => x.parent_id === c.id),
    );
    return { groups: Array.from(groups.values()), topLevelOnly };
  }, [categories, q]);

  const matches = useMemo(
    () => (q.trim() ? searchCategories(categories, q, 60) : []),
    [categories, q],
  );

  const handlePick = (slug: string) => {
    onOpenChange(false);
    setQ("");
    if (onSelect) onSelect(slug);
    else navigate(`/search?category=${encodeURIComponent(slug)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-heading">
            <LayoutGrid size={18} className="text-primary" />
            Toutes les catégories
          </DialogTitle>
          <div className="relative mt-3">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex: auto, nettoyage, plombier, comptable…"
              className="pl-9 rounded-full"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <p className="text-sm text-muted-foreground text-center py-10">
              Chargement des catégories…
            </p>
          )}

          {!loading && q.trim() && matches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">
              Aucune catégorie trouvée pour « {q} ».
            </p>
          )}

          {!loading && q.trim() && matches.length > 0 && (
            <ul className="space-y-1">
              {matches.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => handlePick(c.slug)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <span className="text-lg leading-none">{c.icon ?? "📁"}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-foreground truncate">
                        {c.name}
                      </span>
                      {c.parent_name && (
                        <span className="block text-[11px] text-muted-foreground truncate">
                          dans {c.parent_name}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && !q.trim() && grouped && (
            <div className="space-y-5">
              {grouped.topLevelOnly.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Catégories principales
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {grouped.topLevelOnly.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handlePick(c.slug)}
                        className="text-left px-3 py-2 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-accent transition-colors text-sm font-medium"
                      >
                        <span className="mr-1.5">{c.icon ?? "📁"}</span>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {grouped.groups.map((g) => (
                <section key={g.parent}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {g.parent}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {g.items.slice(0, 30).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handlePick(c.slug)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-card text-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {c.icon ? `${c.icon} ` : ""}
                        {c.name}
                      </button>
                    ))}
                    {g.items.length > 30 && (
                      <span className="px-3 py-1.5 text-xs text-muted-foreground">
                        +{g.items.length - 30}
                      </span>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryPickerDialog;
