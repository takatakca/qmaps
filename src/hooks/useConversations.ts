import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ConversationSummary, MessageRecord, ProfileSummary } from "@/lib/social";

const unique = <T,>(items: T[]) => Array.from(new Set(items));

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: participantRows } = await supabase
      .from("conversation_participants" as any)
      .select("conversation_id")
      .eq("user_id", user.id);

    const conversationIds = (((participantRows || []) as unknown) as Array<{ conversation_id: string }>).map((row) => row.conversation_id);
    if (!conversationIds.length) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const [{ data: conversationsData }, { data: participantsData }, { data: messagesData }] = await Promise.all([
      supabase.from("conversations" as any).select("*").in("id", conversationIds).order("updated_at", { ascending: false }),
      supabase.from("conversation_participants" as any).select("conversation_id, user_id").in("conversation_id", conversationIds),
      supabase.from("messages" as any).select("*").in("conversation_id", conversationIds).order("created_at", { ascending: false }),
    ]);

    const participantUserIds = unique(((participantsData || []) as any[]).map((row) => row.user_id));
    const { data: profilesData } = participantUserIds.length
      ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", participantUserIds)
      : { data: [] };

    const profilesMap = new Map<string, ProfileSummary>();
    for (const profile of (profilesData || []) as ProfileSummary[]) profilesMap.set(profile.id, profile);

    const messagesByConversation = new Map<string, MessageRecord[]>();
    for (const message of ((messagesData || []) as unknown) as MessageRecord[]) {
      const list = messagesByConversation.get(message.conversation_id) || [];
      list.push(message);
      messagesByConversation.set(message.conversation_id, list);
    }

    const participantsByConversation = new Map<string, ProfileSummary[]>();
    for (const participant of (participantsData || []) as any[]) {
      const list = participantsByConversation.get(participant.conversation_id) || [];
      const profile = profilesMap.get(participant.user_id) || { id: participant.user_id, display_name: "Utilisateur" };
      list.push(profile);
      participantsByConversation.set(participant.conversation_id, list);
    }

    const next = ((conversationsData || []) as any[]).map((conversation) => {
      const messages = messagesByConversation.get(conversation.id) || [];
      const participants = (participantsByConversation.get(conversation.id) || []).filter((profile) => profile.id !== user.id);
      const unreadCount = messages.filter((message) => !message.is_read && message.sender_id !== user.id).length;

      return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message: messages[0]?.body || null,
        last_message_at: messages[0]?.created_at || null,
        unread_count: unreadCount,
        participants,
      } satisfies ConversationSummary;
    });

    setConversations(next);
    setLoading(false);
  }, [user]);

  const createConversation = useCallback(async (participantId: string) => {
    if (!user) throw new Error("not-authenticated");

    const { data: ownParticipation } = await supabase
      .from("conversation_participants" as any)
      .select("conversation_id")
      .eq("user_id", user.id);

    const existingConversationIds = (((ownParticipation || []) as unknown) as Array<{ conversation_id: string }>).map((row) => row.conversation_id);
    if (existingConversationIds.length) {
      const { data: existingOther } = await supabase
        .from("conversation_participants" as any)
        .select("conversation_id, user_id")
        .in("conversation_id", existingConversationIds)
        .eq("user_id", participantId);

      const existingRows = ((existingOther || []) as unknown) as Array<{ conversation_id: string; user_id: string }>;
      if (existingRows[0]?.conversation_id) return existingRows[0].conversation_id;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations" as any)
      .insert({ created_by: user.id })
      .select("id")
      .single();

    const insertedConversation = (conversation as unknown) as { id: string } | null;
    if (conversationError || !insertedConversation) throw conversationError || new Error("conversation-create-failed");

    const { error: participantsError } = await supabase
      .from("conversation_participants" as any)
      .insert([
        { conversation_id: insertedConversation.id, user_id: user.id },
        { conversation_id: insertedConversation.id, user_id: participantId },
      ]);

    if (participantsError) throw participantsError;
    await refresh();
    return insertedConversation.id;
  }, [refresh, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, loading, refresh, createConversation };
};

export const useConversationThread = (conversationId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [participants, setParticipants] = useState<ProfileSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user || !conversationId) {
      setMessages([]);
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [{ data: messagesData }, { data: participantsData }] = await Promise.all([
      supabase.from("messages" as any).select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }),
      supabase.from("conversation_participants" as any).select("user_id").eq("conversation_id", conversationId),
    ]);

    const participantIds = ((participantsData || []) as any[]).map((row) => row.user_id);
    const { data: profilesData } = participantIds.length
      ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", participantIds)
      : { data: [] };

    setMessages(((messagesData || []) as unknown) as MessageRecord[]);
    setParticipants((profilesData || []) as ProfileSummary[]);

    await supabase
      .from("messages" as any)
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    setLoading(false);
  }, [conversationId, user]);

  const sendMessage = useCallback(async (body: string) => {
    if (!user || !conversationId) throw new Error("not-ready");
    const trimmed = body.trim();
    if (!trimmed) return;

    const { error } = await supabase
      .from("messages" as any)
      .insert({ conversation_id: conversationId, sender_id: user.id, body: trimmed });

    if (error) throw error;
    await refresh();
  }, [conversationId, refresh, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { messages, participants, loading, refresh, sendMessage };
};
