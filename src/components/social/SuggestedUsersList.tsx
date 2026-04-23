import { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { initialsFromName } from "@/lib/social";

interface SuggestedProfile {
  id: string;
  display_name: string | null;
}

type FollowRow = { following_id: string };

const SuggestedUsersList = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<SuggestedProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const availableProfiles = useMemo(
    () => profiles.filter((profile) => !followingIds.includes(profile.id)).slice(0, 6),
    [followingIds, profiles],
  );

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [{ data: follows }, { data: profileRows }] = await Promise.all([
        supabase.from("follows" as any).select("following_id").eq("follower_id", user.id),
        supabase.from("profiles").select("id, display_name").neq("id", user.id).limit(6),
      ]);

      setFollowingIds(((follows || []) as FollowRow[]).map((row) => row.following_id));
      setProfiles((profileRows || []) as SuggestedProfile[]);
    };

    void load();
  }, [user]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingIds.includes(targetId);
    const previous = followingIds;
    setPendingId(targetId);

    setFollowingIds((current) => isFollowing ? current.filter((id) => id !== targetId) : [...current, targetId]);

    const { error } = isFollowing
      ? await supabase.from("follows" as any).delete().eq("follower_id", user.id).eq("following_id", targetId)
      : await supabase.from("follows" as any).insert({ follower_id: user.id, following_id: targetId });

    if (error) {
      setFollowingIds(previous);
    } else {
      window.dispatchEvent(new CustomEvent("qmaps:follows-updated"));
    }

    setPendingId(null);
  };

  if (!user || availableProfiles.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Utilisateurs suggérés</p>
      </div>
      <div className="space-y-2">
        {availableProfiles.map((profile) => {
          const following = followingIds.includes(profile.id);
          return (
            <div key={profile.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initialsFromName(profile.display_name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{profile.display_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">Découvrir ses avis et photos</p>
                </div>
              </div>
              <Button variant={following ? "outline" : "default"} size="sm" className="rounded-full" disabled={pendingId === profile.id} onClick={() => void toggleFollow(profile.id)}>
                {following ? "Suivi" : "Suivre"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedUsersList;
