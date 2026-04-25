import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProjectQuote {
  id: string;
  project_request_id: string;
  business_id: string;
  sender_user_id: string;
  message: string | null;
  quoted_price_min: number | null;
  quoted_price_max: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectQuoteMessage {
  id: string;
  quote_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
}

export interface CreateQuoteInput {
  project_request_id: string;
  business_id: string;
  message?: string | null;
  quoted_price_min?: number | null;
  quoted_price_max?: number | null;
}

const REFRESH_EVENT = "qmaps:project-quotes-updated";

/**
 * Reads/writes quotes attached to a single project request.
 * Pass a project_request_id to load all quotes for that request.
 */
export const useProjectQuotes = (projectRequestId?: string) => {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<ProjectQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!projectRequestId) {
      setQuotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("project_quotes" as any)
      .select("*")
      .eq("project_request_id", projectRequestId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setQuotes([]);
    } else {
      setQuotes((data ?? []) as unknown as ProjectQuote[]);
      setError(null);
    }
    setLoading(false);
  }, [projectRequestId]);

  useEffect(() => {
    fetchQuotes();
    const handler = () => fetchQuotes();
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [fetchQuotes]);

  const createQuote = useCallback(
    async (input: CreateQuoteInput) => {
      if (!user) return { error: "Not authenticated" as const, data: null };
      const payload = { ...input, sender_user_id: user.id };
      const { data, error } = await supabase
        .from("project_quotes" as any)
        .insert(payload)
        .select()
        .single();
      if (!error) {
        window.dispatchEvent(new Event(REFRESH_EVENT));
        try {
          const { trackBusinessEvent } = await import("@/lib/analytics");
          trackBusinessEvent(input.business_id, "quote_sent", { source: "project_quote" });
        } catch { /* silent */ }
      }
      return { data: (data as unknown) as ProjectQuote | null, error: error?.message ?? null };
    },
    [user],
  );

  const updateQuoteStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase
      .from("project_quotes" as any)
      .update({ status })
      .eq("id", id);
    if (!error) window.dispatchEvent(new Event(REFRESH_EVENT));
    return { error: error?.message ?? null };
  }, []);

  const fetchQuoteMessages = useCallback(async (quoteId: string) => {
    const { data, error } = await supabase
      .from("project_quote_messages" as any)
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });
    return {
      data: ((data ?? []) as unknown) as ProjectQuoteMessage[],
      error: error?.message ?? null,
    };
  }, []);

  const sendQuoteMessage = useCallback(
    async (quoteId: string, body: string) => {
      if (!user) return { error: "Not authenticated" as const, data: null };
      const { data, error } = await supabase
        .from("project_quote_messages" as any)
        .insert({ quote_id: quoteId, sender_user_id: user.id, body })
        .select()
        .single();
      return {
        data: (data as unknown) as ProjectQuoteMessage | null,
        error: error?.message ?? null,
      };
    },
    [user],
  );

  return {
    quotes,
    loading,
    error,
    refresh: fetchQuotes,
    createQuote,
    updateQuoteStatus,
    fetchQuoteMessages,
    sendQuoteMessage,
  };
};
