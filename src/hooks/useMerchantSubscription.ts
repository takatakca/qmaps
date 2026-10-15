import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  type PlanKey,
  type SubscriptionStatus,
  isProOrBetter,
} from "@/lib/billing";

type SubscriptionRow = Tables<"merchant_subscriptions">;

interface SubscriptionFetchState {
  businessId: string | null;
  subscription: SubscriptionRow | null;
  loading: boolean;
  error: string | null;
}

export interface UseMerchantSubscriptionResult {
  subscription: SubscriptionRow | null;
  plan: PlanKey;
  status: SubscriptionStatus;
  isActive: boolean;
  isFree: boolean;
  isProOrBetter: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * A subscription belongs to exactly one business. In-flight reads for an older
 * selection must never be shown as the new business's plan or paid entitlement.
 */
export function useMerchantSubscription(
  businessId: string | null | undefined,
): UseMerchantSubscriptionResult {
  const selectedId = businessId ?? null;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const requestVersion = useRef(0);
  const [state, setState] = useState<SubscriptionFetchState>({
    businessId: null, subscription: null, loading: false, error: null,
  });

  const fetchSubscription = useCallback(async () => {
    const id = businessId ?? null;
    const version = ++requestVersion.current;

    if (!id) {
      setState({ businessId: null, subscription: null, loading: false, error: null });
      return;
    }

    setState({ businessId: id, subscription: null, loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select("*")
        .eq("business_id", id)
        .maybeSingle();

      if (version !== requestVersion.current || selectedIdRef.current !== id) return;
      if (error) {
        setState({ businessId: id, subscription: null, loading: false, error: error.message });
      } else {
        setState({ businessId: id, subscription: data ?? null, loading: false, error: null });
      }
    } catch (error) {
      if (version !== requestVersion.current || selectedIdRef.current !== id) return;
      setState({
        businessId: id, subscription: null, loading: false,
        error: error instanceof Error ? error.message : "Erreur de lecture de l'abonnement",
      });
    }
  }, [businessId]);

  useEffect(() => {
    void fetchSubscription();
    return () => { requestVersion.current += 1; };
  }, [fetchSubscription]);

  // Synchronous render-time guard: a selection change cannot briefly inherit
  // another company's subscription before the useEffect above runs.
  const matches = state.businessId === selectedId;
  const subscription = matches ? state.subscription : null;
  const loading = Boolean(selectedId) && (!matches || state.loading);
  const error = matches ? state.error : null;

  const plan = (subscription?.plan as PlanKey) ?? "free";
  const status = (subscription?.status as SubscriptionStatus) ?? "free";
  const isActive = status === "active" || status === "trialing";
  const isFree = !subscription || plan === "free";

  return {
    subscription,
    plan,
    status,
    isActive,
    isFree,
    isProOrBetter: isProOrBetter(plan),
    loading,
    error,
    refresh: fetchSubscription,
  };
}
