import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Loader2 } from "lucide-react";
import { loadGoogleMaps, isMapsConfigured } from "@/lib/googleMaps";

export interface ResolvedAddress {
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onResolved: (a: ResolvedAddress) => void;
  latitude: number | null;
  longitude: number | null;
}

const comp = (parts: any[], type: string, short = false) => {
  const found = parts?.find((p: any) => p.types?.includes(type));
  if (!found) return "";
  return short ? found.shortText ?? found.short_name ?? "" : found.longText ?? found.long_name ?? "";
};

const AddressAutocomplete = ({ value, onChange, onResolved, latitude, longitude }: Props) => {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!isMapsConfigured());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const sessionToken = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMapsConfigured()) return;
    let cancelled = false;
    loadGoogleMaps()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  // Fetch suggestions (Places API New — AutocompleteSuggestion)
  useEffect(() => {
    if (!ready || !open) return;
    const q = value.trim();
    if (q.length < 3) { setSuggestions([]); return; }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setSearching(true);
        const places: any = await (window as any).google.maps.importLibrary("places");
        if (!sessionToken.current) sessionToken.current = new places.AutocompleteSessionToken();
        const { suggestions: res } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: q,
          sessionToken: sessionToken.current,
          includedRegionCodes: ["ca"],
          language: "fr-CA",
        });
        setSuggestions(res ?? []);
      } catch {
        setFailed(true);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [value, ready, open]);

  const selectSuggestion = async (s: any) => {
    try {
      setOpen(false);
      setSuggestions([]);
      const place = s.placePrediction.toPlace();
      await place.fetchFields({
        fields: ["addressComponents", "location", "formattedAddress", "id"],
      });
      const parts = place.addressComponents ?? [];
      const streetNumber = comp(parts, "street_number");
      const route = comp(parts, "route");
      const resolved: ResolvedAddress = {
        address: [streetNumber, route].filter(Boolean).join(" ") || place.formattedAddress || "",
        city:
          comp(parts, "locality") ||
          comp(parts, "postal_town") ||
          comp(parts, "administrative_area_level_2"),
        region: comp(parts, "administrative_area_level_1", true),
        postalCode: comp(parts, "postal_code"),
        country: comp(parts, "country", true) || "CA",
        latitude: place.location?.lat() ?? null,
        longitude: place.location?.lng() ?? null,
        placeId: place.id ?? null,
      };
      sessionToken.current = null;
      onResolved(resolved);
    } catch {
      setFailed(true);
    }
  };

  // Map preview
  useEffect(() => {
    if (!ready || latitude == null || longitude == null || !mapRef.current) return;
    const g = (window as any).google;
    const pos = { lat: latitude, lng: longitude };
    if (!mapInstance.current) {
      mapInstance.current = new g.maps.Map(mapRef.current, {
        center: pos,
        zoom: 16,
        disableDefaultUI: true,
        zoomControl: true,
      });
      markerInstance.current = new g.maps.Marker({ position: pos, map: mapInstance.current });
    } else {
      mapInstance.current.setCenter(pos);
      markerInstance.current?.setPosition(pos);
    }
  }, [ready, latitude, longitude]);

  const hasCoords = latitude != null && longitude != null;

  return (
    <div className="space-y-2">
      <Label>Adresse *</Label>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="123 Rue Principale, Montréal"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 180)}
          className="pl-10 pr-9"
          autoComplete="off"
          required
        />
        {searching && (
          <Loader2 size={15} className="absolute right-3 top-3 animate-spin text-muted-foreground" />
        )}

        {open && suggestions.length > 0 && (
          <ul className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-popover shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => {
              const p = s.placePrediction;
              return (
                <li key={p?.placeId ?? i}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/60 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">
                      {p?.mainText?.text ?? p?.text?.text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{p?.secondaryText?.text}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {ready && !failed && (
        <p className="text-[11px] text-muted-foreground">
          Commencez à taper — les suggestions Google remplissent ville, province et code postal.
        </p>
      )}

      {/* Map preview / placeholder */}
      {ready && !failed && hasCoords ? (
        <div className="rounded-2xl overflow-hidden border border-border">
          <div ref={mapRef} className="h-44 w-full" aria-label="Aperçu de la carte" />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/40 to-transparent p-6 text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <MapPin size={20} className="text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {failed ? "Carte interactive bientôt disponible" : "Aperçu de la carte"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
            {failed
              ? "L'autocomplétion et la carte s'activeront dès que Google Maps sera pleinement configuré."
              : "Sélectionnez une adresse suggérée pour afficher la carte."}
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
