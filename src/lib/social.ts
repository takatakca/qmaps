export type Visibility = "public" | "private";

export interface CollectionRecord {
  id: string;
  user_id: string;
  name: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CollectionItemRecord {
  id: string;
  collection_id: string;
  business_id: string;
  created_at: string;
}

export interface CollectionWithPreview extends CollectionRecord {
  items_count: number;
  preview_image: string | null;
  preview_business_name: string | null;
}

export interface ProfileSummary {
  id: string;
  display_name: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  image_url: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  participants: ProfileSummary[];
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityFeedItem {
  id: string;
  type: "review" | "photo" | "business";
  actor_id: string;
  actor_name: string;
  created_at: string;
  business_id: string;
  business_name: string;
  business_city: string | null;
  business_image_url: string | null;
  business_latitude?: number | null;
  business_longitude?: number | null;
  rating?: number | null;
  body?: string | null;
  media_url?: string | null;
  distance_meters?: number | null;
}

export const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} j`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} mois`;
  const years = Math.round(months / 12);
  return `${years} an${years > 1 ? "s" : ""}`;
};

export const initialsFromName = (name?: string | null) => {
  if (!name) return "Q";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "Q";
};
