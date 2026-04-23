CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collections_name_check CHECK (char_length(trim(name)) BETWEEN 1 AND 80),
  CONSTRAINT collections_user_name_unique UNIQUE (user_id, name)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or public collections"
ON public.collections
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own collections"
ON public.collections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
ON public.collections
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
ON public.collections
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT collection_items_unique UNIQUE (collection_id, business_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible collection items"
ON public.collection_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = collection_items.collection_id
      AND (c.is_public = true OR c.user_id = auth.uid())
  )
);

CREATE POLICY "Owners can create collection items"
ON public.collection_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = collection_items.collection_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete collection items"
ON public.collection_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.collections c
    WHERE c.id = collection_items.collection_id
      AND c.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows"
ON public.follows
FOR SELECT
USING (true);

CREATE POLICY "Users can create own follows"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

CREATE TABLE IF NOT EXISTS public.review_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_reactions_unique UNIQUE (review_id, user_id, reaction_type),
  CONSTRAINT review_reactions_type_check CHECK (reaction_type IN ('useful', 'funny', 'cool'))
);

ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view review reactions"
ON public.review_reactions
FOR SELECT
USING (true);

CREATE POLICY "Users can create own review reactions"
ON public.review_reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review reactions"
ON public.review_reactions
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notifications_title_check CHECK (char_length(trim(title)) BETWEEN 1 AND 140),
  CONSTRAINT notifications_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 500)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.user_id = _user_id
  )
$$;

CREATE POLICY "Participants can view conversations"
ON public.conversations
FOR SELECT
USING (public.is_conversation_participant(id, auth.uid()));

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
USING (public.is_conversation_participant(id, auth.uid()))
WITH CHECK (public.is_conversation_participant(id, auth.uid()));

CREATE POLICY "Participants can view participant lists"
ON public.conversation_participants
FOR SELECT
USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can add participants to own conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave own conversations"
ON public.conversation_participants
FOR DELETE
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT messages_body_check CHECK (char_length(trim(body)) BETWEEN 1 AND 4000)
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
ON public.messages
FOR SELECT
USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND public.is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Participants can update read state on messages"
ON public.messages
FOR UPDATE
USING (public.is_conversation_participant(conversation_id, auth.uid()))
WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public_recent ON public.collections(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_business_id ON public.collection_items(business_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id ON public.review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id ON public.review_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_conversation_updated_at_on_message ON public.messages;
CREATE TRIGGER touch_conversation_updated_at_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_updated_at();

CREATE OR REPLACE FUNCTION public.update_updated_at_column_phase2()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_phase2();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column_phase2();