import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface BusinessMediaUploaderProps {
  businessId: string;
  userId: string;
  kind: "review" | "business";
  reviewId?: string;
  onUploaded?: (urls: string[]) => void;
}

const BusinessMediaUploader = ({ businessId, userId, kind, reviewId, onUploaded }: BusinessMediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const folder = kind === "review" ? "review-photos" : "business-user-media";
        const path = `${folder}/${businessId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);

        if (kind === "review" && reviewId) {
          const { error } = await supabase.from("review_photos").insert({
            review_id: reviewId,
            user_id: userId,
            url: data.publicUrl,
            media_type: file.type.startsWith("video/") ? "video" : "photo",
          });
          if (error) throw error;
        }

        if (kind === "business") {
          const { error } = await supabase.from("business_photos").insert({
            business_id: businessId,
            user_id: userId,
            url: data.publicUrl,
            media_type: file.type.startsWith("video/") ? "video" : "photo",
          });
          if (error) throw error;
        }
      }

      onUploaded?.(uploadedUrls);
      toast({ title: kind === "review" ? "Photos ajoutées" : "Photo publiée" });
    } catch (error) {
      toast({
        title: "Erreur d'envoi",
        description: error instanceof Error ? error.message : "Impossible de téléverser le média.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <Button variant="outline" size="sm" className="relative rounded-full">
      {uploading ? <Loader2 className="mr-1 animate-spin" /> : <Upload className="mr-1" />}
      Ajouter média
      <input type="file" multiple accept="image/*,video/*" onChange={handleUpload} disabled={uploading} className="absolute inset-0 cursor-pointer opacity-0" />
    </Button>
  );
};

export default BusinessMediaUploader;