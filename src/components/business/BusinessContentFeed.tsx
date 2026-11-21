import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publicContentUrl } from "@/lib/businessContent";
import { Button } from "@/components/ui/button";

const pageSize = 5;

export default function BusinessContentFeed({
  businessId,
}: {
  businessId: string;
}) {
  const visible = () =>
    supabase
      .from("business_content")
      .select("id,title,body,link_url,created_at")
      .eq("business_id", businessId)
      .eq("is_published", true);
  const action = useQuery({
    queryKey: ["public-content", businessId, "action"],
    queryFn: async () => {
      const { data, error } = await visible()
        .eq("kind", "action")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const posts = useInfiniteQuery({
    queryKey: ["public-content", businessId, "posts"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await visible()
        .eq("kind", "post")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(pageParam, pageParam + pageSize);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, _pages, offset) =>
      last.length > pageSize ? offset + pageSize : undefined,
  });
  const more =
    posts.data?.pages.flatMap((page) => page.slice(0, pageSize)) ?? [];
  const actionUrl = publicContentUrl(action.data?.link_url);
  if (!actionUrl && !more.length && !action.isError && !posts.isError)
    return null;
  return (
    <section
      className="px-4 py-3 space-y-4"
      aria-label="Actualités du commerce"
    >
      {action.data && actionUrl && (
        <div className="space-y-2">
          {action.data.body && (
            <p className="whitespace-pre-line text-sm">{action.data.body}</p>
          )}
          <Button asChild>
            <a href={actionUrl} target="_blank" rel="noopener noreferrer">
              {action.data.title}
            </a>
          </Button>
        </div>
      )}
      {more.length > 0 && (
        <h2 className="font-heading text-lg font-semibold">
          Nouvelles du commerce
        </h2>
      )}
      {more.map((post) => (
        <article className="rounded-xl border p-4 space-y-2" key={post.id}>
          <time
            className="text-xs text-muted-foreground"
            dateTime={post.created_at}
          >
            {new Date(post.created_at).toLocaleDateString("fr-CA")}
          </time>
          <h3 className="font-semibold">{post.title}</h3>
          {post.body && (
            <p className="whitespace-pre-line break-words text-sm">
              {post.body}
            </p>
          )}
          {publicContentUrl(post.link_url) && (
            <a
              className="text-primary underline"
              href={publicContentUrl(post.link_url)}
              target="_blank"
              rel="noopener noreferrer"
            >
              En savoir plus
            </a>
          )}
        </article>
      ))}
      {posts.hasNextPage && (
        <Button
          variant="outline"
          disabled={posts.isFetchingNextPage}
          onClick={() => posts.fetchNextPage()}
        >
          Voir plus de publications
        </Button>
      )}
      {(action.isError || posts.isError) && (
        <p className="text-sm">
          Les nouvelles du commerce sont indisponibles.{" "}
          <Button
            variant="link"
            onClick={() => {
              void action.refetch();
              void posts.refetch();
            }}
          >
            Réessayer
          </Button>
        </p>
      )}
    </section>
  );
}
