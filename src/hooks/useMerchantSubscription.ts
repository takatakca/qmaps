import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  type PlanKey,
  type SubscriptionStatus,
  isProOrBetter,
} from "@/lib/billing";

type SubscriptionRow = Tables<"merchant_subscriptions">;

export interface UseMerchantSubscriptionResult {
  subscription: SubscriptionRow | null;
  plan: PlanKey;
  status: SubscriptionStatus;
  isActive: boolean;
  isFree: boolean;
  isProOrBetter: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useMerchantSubscription(
  businessId: string | null | undefined
): UseMerchantSubscriptionResult {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(businessId));

  const fetchSubscription = useCallback(async () => {
    if (!businessId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("merchant_subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();
    if (!error) setSubscription(data ?? null);
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

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
    refresh: fetchSubscription,
  };
}
