import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// TODO (production SEO): move to an edge-function-rendered sitemap that returns
// Content-Type: application/xml. Crawlers may execute JS but a server-rendered
// XML route is more reliable for indexing at scale.

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const Sitemap = () => {
  const [xml, setXml] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const origin = window.location.origin;
      const [{ data: biz }, { data: cats }, { data: cities }] = await Promise.all([
        supabase
          .from("businesses")
          .select("id,updated_at,city")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(1000),
        supabase.from("categories").select("slug"),
        supabase.from("businesses").select("city").eq("is_active", true).limit(1000),
      ]);

      const citySlugs = Array.from(
        new Set(
          (cities || [])
            .map((c) =>
              (c.city || "")
                .toString()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .trim()
                .replace(/\s+/g, "-")
            )
            .filter(Boolean)
        )
      );

      const urls: string[] = [];
      urls.push(`${origin}/`);
      urls.push(`${origin}/projects`);
      urls.push(`${origin}/privacy`);
      urls.push(`${origin}/terms`);
      urls.push(`${origin}/cookies`);
      urls.push(`${origin}/account-deletion-policy`);
      urls.push(`${origin}/support-policy`);
      urls.push(`${origin}/release-notes`);
      (cats || []).forEach((c) => urls.push(`${origin}/c/${c.slug}`));
      citySlugs.forEach((s) => urls.push(`${origin}/city/${s}`));
      (biz || []).forEach((b) => urls.push(`${origin}/business/${b.id}`));

      const body = urls
        .map(
          (u) =>
            `  <url>\n    <loc>${escapeXml(u)}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`
        )
        .join("\n");
      const out = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
      setXml(out);
    })();
  }, []);

  return (
    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", padding: 16 }}>
      {xml || "Generating sitemap..."}
    </pre>
  );
};

export default Sitemap;
