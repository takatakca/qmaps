import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Pause, Send, Info, TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useSponsoredCampaigns,
  useSponsoredCampaignMetrics,
  type SponsoredMetricsRange,
} from "@/hooks/useSponsoredCampaigns";
import {
  SPONSORED_PLACEMENT_LABELS,
  SPONSORED_RANGE_LABELS,
  SPONSORED_STATUS_LABELS,
  formatCtr,
  type SponsoredPlacement,
  type SponsoredStatus,
} from "@/lib/sponsored";
import MerchantBottomNav from "@/components/MerchantBottomNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const dayLabelFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
});

const formatDayLabel = (isoDay: string): string => {
  // isoDay = "YYYY-MM-DD"; build a local-noon date to avoid TZ off-by-one.
  const [y, m, d] = isoDay.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return isoDay;
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  return dayLabelFormatter.format(dt);
};

const csvEscape = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename: string, rows: string[][]): void => {
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const STATUS_VARIANTS: Record<SponsoredStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  paused: "bg-muted text-muted-foreground",
  rejected: "bg-destructive/15 text-destructive",
  ended: "bg-muted text-muted-foreground",
};

const MerchantSponsored = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Tables<"businesses">[]>([]);
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    headline: "",
    description: "",
    placement: "all" as SponsoredPlacement,
    target_city: "",
    daily_budget_cents: "",
  });

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoadingBiz(true);
      const { data } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_user_id", user.id);
      setBusinesses(data || []);
      if (data && data.length > 0) setActiveBusinessId(data[0].id);
      setLoadingBiz(false);
    })();
  }, [user]);

  const {
    campaigns,
    loading,
    createDraft,
    submitForReview,
    pauseCampaign,
  } = useSponsoredCampaigns(activeBusinessId);

  const handleCreate = async () => {
    if (!activeBusinessId) return;
    setSubmitting(true);
    try {
      await createDraft({
        business_id: activeBusinessId,
        placement: form.placement,
        headline: form.headline || undefined,
        description: form.description || undefined,
        target_city: form.target_city || null,
        daily_budget_cents: form.daily_budget_cents
          ? Math.round(parseFloat(form.daily_budget_cents) * 100)
          : null,
      });
      setForm({
        headline: "",
        description: "",
        placement: "all",
        target_city: "",
        daily_budget_cents: "",
      });
      setOpen(false);
      toast({ title: "Brouillon créé" });
    } catch {
      toast({ title: "Impossible de créer la campagne", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <header className="sticky top-0 z-20 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/merchant/more")}>
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <Sparkles size={18} className="text-primary" />
        <h1 className="font-heading text-lg font-bold text-foreground">
          Visibilité sponsorisée
        </h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {loadingBiz ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : businesses.length === 0 ? (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Vous devez d'abord revendiquer une entreprise pour créer une campagne.
            </p>
          </div>
        ) : (
          <>
            {businesses.length > 1 && (
              <div>
                <Label className="text-xs">Entreprise</Label>
                <Select
                  value={activeBusinessId || ""}
                  onValueChange={setActiveBusinessId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base">Mes campagnes</h2>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!activeBusinessId}>
                    <Plus size={14} className="mr-1" /> Nouvelle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouvelle campagne</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="headline">Titre</Label>
                      <Input
                        id="headline"
                        value={form.headline}
                        onChange={(e) =>
                          setForm({ ...form, headline: e.target.value })
                        }
                        placeholder="Ex: Promo printemps -20%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="desc">Description</Label>
                      <Textarea
                        id="desc"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Emplacement</Label>
                      <Select
                        value={form.placement}
                        onValueChange={(v) =>
                          setForm({ ...form, placement: v as SponsoredPlacement })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(SPONSORED_PLACEMENT_LABELS) as SponsoredPlacement[]).map(
                            (p) => (
                              <SelectItem key={p} value={p}>
                                {SPONSORED_PLACEMENT_LABELS[p]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">Ville cible (optionnel)</Label>
                      <Input
                        id="city"
                        value={form.target_city}
                        onChange={(e) =>
                          setForm({ ...form, target_city: e.target.value })
                        }
                        placeholder="Ex: Montréal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="budget">Budget quotidien CAD (optionnel)</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        value={form.daily_budget_cents}
                        onChange={(e) =>
                          setForm({ ...form, daily_budget_cents: e.target.value })
                        }
                        placeholder="0.00"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Indicatif. Aucun prélèvement automatique pour le moment.
                      </p>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreate}
                      disabled={submitting}
                    >
                      {submitting ? "Création..." : "Créer le brouillon"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : campaigns.length === 0 ? (
              <div className="bg-muted/50 rounded-xl p-8 text-center">
                <Sparkles size={28} className="mx-auto text-primary mb-3" />
                <p className="font-heading font-bold text-sm mb-1">
                  Aucune campagne pour le moment
                </p>
                <p className="text-xs text-muted-foreground">
                  Créez un brouillon, soumettez-le pour révision, et notre équipe
                  l'examinera sous 1-2 jours ouvrables.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onSubmit={() => submitForReview(c.id)}
                    onPause={() => pauseCampaign(c.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <MerchantBottomNav />
    </div>
  );
};

const CampaignCard = ({
  campaign,
  onSubmit,
  onPause,
}: {
  campaign: any;
  onSubmit: () => Promise<void>;
  onPause: () => Promise<void>;
}) => {
  const [range, setRange] = useState<SponsoredMetricsRange>("all");
  const metrics = useSponsoredCampaignMetrics(campaign.id, range);
  const [acting, setActing] = useState(false);
  const status = campaign.status as SponsoredStatus;
  const isRejected = status === "rejected";

  const wrap = (fn: () => Promise<void>) => async () => {
    setActing(true);
    try {
      await fn();
    } finally {
      setActing(false);
    }
  };

  const RANGES: { key: SponsoredMetricsRange; label: string }[] = [
    { key: "7d", label: "7 j" },
    { key: "30d", label: "30 j" },
    { key: "all", label: "Tout" },
  ];

  const trendPct = (current: number, previous?: number): number | null => {
    if (previous === undefined || previous === null) return null;
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExport = () => {
    const safeTitle = (campaign.headline || "campagne")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "campagne";
    const rows: string[][] = [
      ["Campagne", campaign.headline || ""],
      ["Période", SPONSORED_RANGE_LABELS[range]],
      ["Statut", SPONSORED_STATUS_LABELS[status]],
      [],
      ["Métrique", "Valeur"],
      ["Impressions", String(metrics.impressions)],
      ["Clics", String(metrics.clicks)],
      ["CTR", formatCtr(metrics.impressions, metrics.clicks)],
      [],
      ["Emplacement", "Impressions", "Clics", "CTR"],
      ...metrics.byPlacement.map((p) => [
        SPONSORED_PLACEMENT_LABELS[p.placement as SponsoredPlacement] ?? p.placement,
        String(p.impressions),
        String(p.clicks),
        formatCtr(p.impressions, p.clicks),
      ]),
      [],
      ["Date", "Impressions", "Clics"],
      ...metrics.byDay.map((d) => [d.day, String(d.impressions), String(d.clicks)]),
    ];
    downloadCsv(`sponsored-${safeTitle}-${range}.csv`, rows);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading font-bold text-sm truncate">
            {campaign.headline || "Campagne sans titre"}
          </p>
          <p className="text-xs text-muted-foreground">
            {SPONSORED_PLACEMENT_LABELS[campaign.placement as SponsoredPlacement]}
            {campaign.target_city ? ` · ${campaign.target_city}` : ""}
          </p>
        </div>
        <Badge variant="secondary" className={STATUS_VARIANTS[status]}>
          {SPONSORED_STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex gap-1" role="tablist" aria-label="Période">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`text-[11px] px-2 py-0.5 rounded-full border ${
                range === r.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {SPONSORED_RANGE_LABELS[range]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2 text-center">
        <Metric
          label="Impressions"
          value={metrics.impressions}
          trend={trendPct(metrics.impressions, metrics.previous?.impressions)}
        />
        <Metric
          label="Clics"
          value={metrics.clicks}
          trend={trendPct(metrics.clicks, metrics.previous?.clicks)}
        />
        <Metric
          label="CTR"
          value={formatCtr(metrics.impressions, metrics.clicks)}
          tooltip="CTR = clics ÷ impressions. Indique le pourcentage d'utilisateurs qui ont cliqué après avoir vu votre annonce."
        />
      </div>

      <div className="flex justify-end mt-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] text-muted-foreground"
          onClick={handleExport}
          disabled={metrics.impressions === 0 && metrics.clicks === 0}
        >
          <Download size={12} className="mr-1" /> Exporter CSV
        </Button>
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
          Par emplacement
        </p>
        {metrics.byPlacement.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5">
            Aucun événement sur cette période.
          </p>
        ) : (
          <div className="space-y-1">
            {metrics.byPlacement.map((p) => (
              <div
                key={p.placement}
                className="flex items-center justify-between text-xs bg-muted/40 rounded px-2 py-1"
              >
                <span className="truncate">
                  {SPONSORED_PLACEMENT_LABELS[
                    p.placement as SponsoredPlacement
                  ] ?? p.placement}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {p.impressions} imp · {p.clicks} clic ·{" "}
                  {formatCtr(p.impressions, p.clicks)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
          Activité par jour
        </p>
        {metrics.byDay.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5">
            Aucune activité sur cette période.
          </p>
        ) : (
          <DayActivityBars data={metrics.byDay} />
        )}
      </div>

      {isRejected && campaign.admin_note && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-bold text-destructive mb-1">
            Campagne rejetée
          </p>
          <p className="text-xs text-destructive/90">{campaign.admin_note}</p>
        </div>
      )}
      {!isRejected && campaign.admin_note && (
        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded p-2">
          Note admin: {campaign.admin_note}
        </p>
      )}

      <div className="flex gap-2 mt-3">
        {status === "draft" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={wrap(onSubmit)}
            disabled={acting}
          >
            <Send size={14} className="mr-1" /> Soumettre
          </Button>
        )}
        {status === "pending_review" && (
          <Button size="sm" variant="outline" className="flex-1" disabled>
            En attente de révision
          </Button>
        )}
        {status === "approved" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={wrap(onPause)}
            disabled={acting}
          >
            <Pause size={14} className="mr-1" /> Mettre en pause
          </Button>
        )}
        {status === "paused" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={wrap(onSubmit)}
            disabled={acting}
          >
            <Send size={14} className="mr-1" /> Resoumettre
          </Button>
        )}
      </div>
    </div>
  );
};

const Metric = ({
  label,
  value,
  trend,
  tooltip,
}: {
  label: string;
  value: number | string;
  trend?: number | null;
  tooltip?: string;
}) => {
  const TrendIcon =
    trend === null || trend === undefined
      ? null
      : trend > 0
        ? TrendingUp
        : trend < 0
          ? TrendingDown
          : Minus;
  const trendClass =
    trend === null || trend === undefined
      ? "text-muted-foreground"
      : trend > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : trend < 0
          ? "text-destructive"
          : "text-muted-foreground";
  return (
    <div>
      <p className="font-heading text-base font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center justify-center gap-1">
        {label}
        {tooltip && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`À propos de ${label}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info size={10} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </p>
      {TrendIcon && (
        <p
          className={`text-[10px] mt-0.5 flex items-center justify-center gap-0.5 tabular-nums ${trendClass}`}
        >
          <TrendIcon size={10} />
          {trend! > 0 ? "+" : ""}
          {trend!.toFixed(0)}%
        </p>
      )}
    </div>
  );
};

const DayActivityBars = ({
  data,
}: {
  data: Array<{ day: string; impressions: number; clicks: number }>;
}) => {
  const max = Math.max(1, ...data.map((d) => d.impressions));
  return (
    <div className="space-y-1">
      {data.map((d) => {
        const pct = (d.impressions / max) * 100;
        return (
          <div key={d.day} className="flex items-center gap-2 text-[11px]">
            <span className="w-14 shrink-0 text-muted-foreground tabular-nums">
              {d.day.slice(5)}
            </span>
            <div className="flex-1 h-2 rounded bg-muted overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${pct}%` }}
                aria-hidden
              />
            </div>
            <span className="w-20 shrink-0 text-right text-muted-foreground tabular-nums">
              {d.impressions} / {d.clicks}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default MerchantSponsored;
