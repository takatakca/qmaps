import { useEffect } from "react";
import { buildCanonicalUrl, SITE_ORIGIN } from "@/lib/seo";

const SITE_NAME = "QMaps";
const DEFAULT_ORIGIN = SITE_ORIGIN;
export const DEFAULT_OG_IMAGE =
  `${SITE_ORIGIN}/icons/icon-512.svg`;

const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
};

const upsertCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>("link[rel='canonical']");
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
};

const upsertJsonLd = (id: string, data: unknown) => {
  let el = document.head.querySelector<HTMLScriptElement>(`script[data-seo='${id}']`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-seo", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
  return el;
};

export interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  jsonLdId?: string;
  noindex?: boolean;
}

const Seo = ({
  title,
  description,
  canonicalPath,
  image,
  type = "website",
  jsonLd,
  jsonLdId = "page",
  noindex = false,
}: SeoProps) => {
  useEffect(() => {
    const fullTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
    document.title = fullTitle;

    if (description) {
      const desc = description.length > 160 ? description.slice(0, 157) + "..." : description;
      upsertMeta("meta[name='description']", "name", "description", desc);
      upsertMeta("meta[property='og:description']", "property", "og:description", desc);
      upsertMeta("meta[name='twitter:description']", "name", "twitter:description", desc);
    }

    upsertMeta("meta[property='og:title']", "property", "og:title", fullTitle);
    upsertMeta("meta[name='twitter:title']", "name", "twitter:title", fullTitle);
    upsertMeta("meta[property='og:type']", "property", "og:type", type);
    upsertMeta("meta[property='og:site_name']", "property", "og:site_name", SITE_NAME);

    const ogImage = image || DEFAULT_OG_IMAGE;
    upsertMeta("meta[property='og:image']", "property", "og:image", ogImage);
    upsertMeta("meta[name='twitter:image']", "name", "twitter:image", ogImage);

    if (canonicalPath) {
      const url = buildCanonicalUrl(canonicalPath, DEFAULT_ORIGIN);
      upsertCanonical(url);
      upsertMeta("meta[property='og:url']", "property", "og:url", url);
    }

    upsertMeta(
      "meta[name='robots']",
      "name",
      "robots",
      noindex ? "noindex,follow" : "index,follow"
    );

    if (jsonLd) {
      upsertJsonLd(jsonLdId, jsonLd);
    }

    return () => {
      if (jsonLd) {
        const el = document.head.querySelector(`script[data-seo='${jsonLdId}']`);
        el?.remove();
      }
    };
  }, [title, description, canonicalPath, image, type, jsonLd, jsonLdId, noindex]);

  return null;
};

export default Seo;
