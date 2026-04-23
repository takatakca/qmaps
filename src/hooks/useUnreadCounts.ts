import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useUnreadCounts = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(0);
  const [messages, setMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications(0);
      setMessages(0);
      return;
    }

    const load = async () => {
      const [{ count: notifCount }, { data: participants }] = await Promise.all([
        supabase
          .from("notifications" as any)
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
        supabase
          .from("conversation_participants" as any)
          .select("conversation_id")
          .eq("user_id", user.id),
      ]);

      setNotifications(notifCount || 0);

      const conversationIds = (participants || []).map((item: any) => item.conversation_id);
      if (!conversationIds.length) {
        setMessages(0);
        return;
      }

      const { count: unreadMessages } = await supabase
        .from("messages" as any)
        .select("id", { count: "exact", head: true })
        .in("conversation_id", conversationIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);

      setMessages(unreadMessages || 0);
    };

    void load();
  }, [user]);

  return { unreadNotifications: notifications, unreadMessages: messages };
};
