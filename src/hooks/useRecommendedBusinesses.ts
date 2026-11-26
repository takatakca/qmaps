import { useQuery } from "@tanstack/react-query";
import { useDirectoryAccount } from "@/hooks/useDirectoryAccount";
import { topPlaces } from "@/lib/ownedDirectory";
import { ownedApi, type QmapsPlace } from "@/lib/ownedApi";
import { normalizeCity, rankRecommendations } from "@/lib/recommendations";

type Preference = { id: string; city: string | null; dismissed: boolean; category_ids: string[] };

export const directoryPreferenceKey = ["qmaps-directory-preferences"] as const;

function mostFrequent(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([value]) => value);
}

export function useRecommendedBusinesses({ city, category, limit = 8 }: {
  city?: string | null;
  category?: string;
  limit?: number;
} = {}) {
  const account = useDirectoryAccount();
  const candidates = useQuery({
    queryKey: ["qmaps-recommendation-candidates", city || "", category || ""],
    queryFn: ({ signal }) => {
      const filters = new URLSearchParams();
      if (city) filters.set("city", city);
      if (category) filters.set("category", category);
      return topPlaces(filters, 80, signal);
    },
    staleTime: 60000,
    retry: false,
  });
  const preferences = useQuery({
    queryKey: [...directoryPreferenceKey, account.data],
    queryFn: () => ownedApi<Preference[]>("me/directory-preferences?account=" + account.data),
    enabled: !!account.data,
    retry: false,
  });
  const bookmarks = useQuery({
    queryKey: ["qmaps-public-bookmarks", account.data],
    queryFn: () => ownedApi<QmapsPlace[]>("me/bookmarks"),
    enabled: !!account.data,
    retry: false,
    staleTime: 15000,
  });

  const history = preferences.data ?? [];
  const viewed = history.filter(item => !item.dismissed);
  const dismissed = new Set(history.filter(item => item.dismissed).map(item => item.id));
  const businesses = (candidates.data ?? []).filter(item => !dismissed.has(item.id)).map(item => ({
    ...item, category_ids: item.business_categories.map(link => link.categories.id),
  }));
  const bookmarkedBusinessIds = (bookmarks.data ?? []).map(item => item.id);
  const saved = businesses.filter(item => bookmarkedBusinessIds.includes(item.id));
  const topCategoryIds = mostFrequent([
    ...viewed.flatMap(item => item.category_ids), ...saved.flatMap(item => item.category_ids),
  ], 5);
  const context = {
    topCategoryIds,
    topCities: mostFrequent([...viewed, ...saved].map(item => normalizeCity(item.city)).filter(Boolean), 3),
    recentBusinessIds: viewed.map(item => item.id),
    bookmarkedBusinessIds,
  };
  return {
    recommended: rankRecommendations(businesses, context, limit),
    becauseYouLiked: rankRecommendations(
      businesses.filter(item => item.category_ids.some(id => topCategoryIds.includes(id))), context, limit),
    trending: businesses.filter(item => item.reviews_count >= 5)
      .sort((a, b) => b.reviews_count - a.reviews_count).slice(0, limit),
    loading: candidates.isPending || account.isPending || (!!account.data && preferences.isPending),
  };
}
