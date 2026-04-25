import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Lightweight client-side sitemap. Browsers and basic crawlers can read it.
// For real-world SEO an edge-function-rendered XML is preferable; this is a
// safe additive baseline that works with the static SPA.
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
            .map((c) => (c.city || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, "-"))
            .filter(Boolean)
        )
      );

      const urls: string[] = [];
      urls.push(`${origin}/`);
      urls.push(`${origin}/projects`);
      (cats || []).forEach((c) => urls.push(`${origin}/c/${c.slug}`));
      citySlugs.forEach((s) => urls.push(`${origin}/city/${s}`));
      (biz || []).forEach((b) => urls.push(`${origin}/business/${b.id}`));

      const body = urls
        .map(
          (u) =>
            `  <url><loc>${u.replace(/&/g, "&amp;")}</loc><changefreq>weekly</changefreq></url>`
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
