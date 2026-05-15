import { Clock, Globe, Phone, MapPin, Pencil, Check, CalendarDays, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DAYS,
  DAY_LABELS_FR,
  dayKeyForDate,
  formatDayHours,
  formatSpecialHoursForDate,
  parseSpecialHours,
  parseWeeklyHours,
} from "@/lib/businessHours";
import { STATUS_LABELS, type BusinessStatus } from "@/lib/businessStatus";
import { attributesToDisplayLabels } from "@/lib/businessAttributes";

interface BusinessInfoTabProps {
  attributes?: unknown;
  hours: string | null;
  hoursJson?: unknown;
  specialHours?: unknown;
  isOpen: boolean;
  status?: BusinessStatus;
  website: string | null;
  phone: string | null;
  address: string;
  city: string;
  region: string | null;
  postalCode: string | null;
  amenities: string[] | null;
  paymentMethods?: string[] | null;
  languages?: string[] | null;
  accessibility?: string[] | null;
  latitude: number;
  longitude: number;
}

const Section = ({ title, items }: { title: string; items: string[] }) =>
  items.length === 0 ? null : (
    <div className="mt-5 border-t border-border pt-5">
      <h4 className="font-heading font-semibold text-foreground mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground">
            <Check size={12} /> {it}
          </span>
        ))}
      </div>
    </div>
  );

const STATUS_BANNER_TONE: Record<string, string> = {
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/30",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
};

const BusinessInfoTab = ({
  hours,
  hoursJson,
  specialHours,
  isOpen,
  status,
  website,
  phone,
  address,
  city,
  region,
  postalCode,
  amenities,
  attributes,
  paymentMethods,
  languages,
  accessibility,
  latitude,
  longitude,
}: BusinessInfoTabProps) => {
  const structuredAmenities = attributesToDisplayLabels({ attributes, amenities });
  const amenityItems = structuredAmenities.length > 0 ? structuredAmenities : amenities ?? [];
  const fullAddress = `${address}\n${city}${region ? `, ${region}` : ""}${postalCode ? ` ${postalCode}` : ""}`;
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  const week = parseWeeklyHours(hoursJson);
  const special = parseSpecialHours(specialHours);
  const now = new Date();
  const today = week ? dayKeyForDate(now) : null;
  const todaySpecial = formatSpecialHoursForDate(special, now);
  const todaySpecialNote =
    special && special[`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`]?.note;

  const statusMeta = status && status !== "open" && status !== "hidden" ? STATUS_LABELS[status] : null;
  const statusBannerClass = statusMeta ? STATUS_BANNER_TONE[statusMeta.tone] ?? "bg-muted text-foreground border-border" : "";

  return (
    <div className="space-y-0">
      <h3 className="font-heading text-lg font-bold text-foreground mb-4">Info</h3>

      {statusMeta && (
        <div className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-sm ${statusBannerClass}`} role="status">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p className="font-medium">{statusMeta.label}</p>
        </div>
      )}

      {/* Weekly hours (structured) or fallback */}
      <div id="business-hours" className="py-4 border-b border-border scroll-mt-16">
        {todaySpecial && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-primary/10 text-primary p-2 text-xs">
            <CalendarDays size={14} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Horaire spécial aujourd'hui</p>
              <p>{todaySpecial}{todaySpecialNote ? ` · ${todaySpecialNote}` : ""}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Horaires</p>
            <p className={`text-sm font-medium ${isOpen ? "text-success" : "text-destructive"}`}>
              {isOpen ? "Ouvert maintenant" : "Fermé maintenant"}
            </p>
            {week ? (
              <ul className="mt-2 space-y-1">
                {DAYS.map((d) => {
                  const isToday = d === today;
                  return (
                    <li
                      key={d}
                      className={`flex items-center justify-between text-sm ${
                        isToday ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <span>{DAY_LABELS_FR[d]}{isToday ? " (aujourd'hui)" : ""}</span>
                      <span>{formatDayHours(week[d])}</span>
                    </li>
                  );
                })}
              </ul>
            ) : hours ? (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{hours}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Heures non précisées</p>
            )}
          </div>
        </div>
      </div>

      {/* Website */}
      {website && (
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Globe size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Site web</p>
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate block max-w-[220px]">
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </div>
          <Globe size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Phone */}
      {phone && (
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-start gap-3">
            <Phone size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Appeler</p>
              <a href={`tel:${phone}`} className="text-sm text-foreground">{phone}</a>
            </div>
          </div>
          <Phone size={18} className="text-muted-foreground" />
        </div>
      )}

      {/* Map */}
      <div className="mt-4 rounded-xl overflow-hidden border border-border">
        <iframe
          src={mapUrl}
          className="w-full h-40"
          loading="lazy"
          title="Carte"
          style={{ border: 0 }}
        />
      </div>

      {/* Address */}
      <div className="py-4">
        <p className="text-sm text-foreground whitespace-pre-line">{fullAddress}</p>
      </div>

      {/* Get directions */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <span className="text-sm font-semibold text-foreground">Obtenir l'itinéraire</span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MapPin size={18} className="text-muted-foreground" />
        </a>
      </div>

      {/* Suggest edit */}
      <Button variant="outline" className="w-full rounded-full gap-2 mt-2">
        <Pencil size={14} /> Suggérer une modification
      </Button>

      <Section title="Commodités" items={amenities ?? []} />
      <Section title="Paiements" items={paymentMethods ?? []} />
      <Section title="Langues" items={languages ?? []} />
      <Section title="Accessibilité" items={accessibility ?? []} />
    </div>
  );
};

export default BusinessInfoTab;
