import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ParticipantRow = { conversation_id: string };

export const useUnreadCounts = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  const load = useCallback(async () => {
    if (!user) {
      setNotifications(0);
      setMessages(0);
      return;
    }

    const [{ count: notifCount }, { data: participants }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
      supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id),
    ]);

    setNotifications(notifCount || 0);

    const conversationIds = (((participants || []) as unknown) as ParticipantRow[]).map((item) => item.conversation_id);
    if (!conversationIds.length) {
      setMessages(0);
      return;
    }

    const { count: unreadMessages } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    setMessages(unreadMessages || 0);

  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleRefresh = () => {
      void load();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("qmaps:notifications-updated", handleRefresh);
    window.addEventListener("qmaps:messages-updated", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("qmaps:notifications-updated", handleRefresh);
      window.removeEventListener("qmaps:messages-updated", handleRefresh);
    };
  }, [load]);

  return { unreadNotifications: notifications, unreadMessages: messages };
};
