/**
 * SEO + consent kit: the ONE settings file per site.
 *
 * Rules:
 * - Only facts already present in this repo. Never invent an address, hours, phone, rating or review.
 * - Unknown values stay `undefined` with a `TODO(owner)` comment; the JSON-LD builder skips them.
 * - `url` is the real production domain (see foodhubca/private/hosting/MOCHAHOST_DOMAINS.md), never *.lovable.app.
 */

export type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "Restaurant"
  | "NGO"
  | "SportsOrganization"
  | "Event";

export type PostalAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string | undefined;
  addressCountry: string;
};

export type SiteConfig = {
  /** Public business name. */
  name: string;
  /** Legal name if different (TODO(owner) when unknown). */
  legalName?: string | undefined;
  /** Real production origin, no trailing slash. */
  url: string;
  /** <html lang>. French first (Québec). */
  lang: "fr-CA";
  /** Open Graph locale. */
  locale: "fr_CA";
  defaultTitle: string;
  defaultDescription: string;
  /** Default share image: path under /public or absolute URL. undefined = no og:image. */
  ogImage?: string | undefined;
  /** Logo: path under /public or absolute URL. */
  logo?: string | undefined;
  schemaType: SchemaType;
  email?: string | undefined;
  /** E.164, e.g. "+15145550000". */
  phone?: string | undefined;
  address?: PostalAddress | undefined;
  /** Real social profile URLs only (no "#", no generic facebook.com). */
  sameAs: string[];
  /** Privacy policy route, used by the cookie banner. undefined = no page yet (TODO(owner)). */
  privacyPath?: string | undefined;
  /** Law 25 privacy officer. */
  privacyOfficer: { name?: string | undefined; email?: string | undefined };
};

export const SITE: SiteConfig = {
  // Same name as og:site_name in src/components/Seo.tsx.
  name: "QMaps",
  // TODO(owner): confirm the legal name ("QMAPS Inc." appears in the Settings footer).
  legalName: undefined,
  url: "https://qmaps.ca",
  lang: "fr-CA",
  locale: "fr_CA",
  // Home page title/description already used by src/pages/Index.tsx.
  defaultTitle: "QMaps Québec — Commerces, services et pros locaux",
  defaultDescription: "Découvrez les meilleurs commerces, restaurants et professionnels du Québec avec QMaps.",
  // App icon from public/icons. TODO(owner): add a real 1200x630 share image and set it here.
  ogImage: "/icons/icon-512.png",
  logo: "/icons/icon-512.png",
  schemaType: "Organization",
  // TODO(owner): the app uses support@qmaps.app (other domain); set a confirmed public email here.
  email: undefined,
  phone: undefined,
  address: undefined,
  // TODO(owner): real social profile URLs, if any.
  sameAs: [],
  privacyPath: "/privacy",
  // TODO(owner): name + email of the person responsible for personal information (Law 25).
  // The privacy policy lists privacy@qmaps.app (qmaps.app domain, to confirm).
  privacyOfficer: { name: undefined, email: undefined },
};
