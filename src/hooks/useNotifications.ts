import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { NotificationRecord } from "@/lib/social";

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("notifications" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(((data || []) as unknown) as NotificationRecord[]);
    setLoading(false);
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
    await supabase
      .from("notifications" as any)
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notifications, loading, refresh, markAsRead };
};
