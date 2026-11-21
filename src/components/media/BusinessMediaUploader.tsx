import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};

interface BusinessMediaUploaderProps {
  businessId: string;
  userId: string;
  kind: "review" | "business";
  reviewId?: string;
  caption?: string;
  onUploaded?: (urls: string[]) => void;
}

const BusinessMediaUploader = ({ businessId, userId, kind, reviewId, caption, onUploaded }: BusinessMediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const ext = extensions[file.type];
        if (!ext) throw new Error("Format de média non pris en charge.");
        if (kind === "review" && !reviewId) throw new Error("Choisissez d’abord votre avis.");
        const folder = kind === "review" ? `review-photos/${reviewId}` : `customer-media/${userId}/${businessId}`;
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("photos").getPublicUrl(path);

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
            caption: caption?.trim() || null,
            business_id: businessId,
            user_id: userId,
            url: data.publicUrl,
            media_type: file.type.startsWith("video/") ? "video" : "photo",
          });
          if (error) throw error;
        }
        uploadedUrls.push(data.publicUrl);
      }

      onUploaded?.(uploadedUrls);
      toast({ title: kind === "review" ? "Photos ajoutées" : "Photo publiée" });
    } catch (error) {
      toast({
        title: uploadedUrls.length ? `${uploadedUrls.length} média(s) publié(s) avant l’interruption` : "Erreur d’envoi",
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
      <input type="file" multiple accept={Object.keys(extensions).join(",")} onChange={handleUpload} disabled={uploading} className="absolute inset-0 cursor-pointer opacity-0" />
    </Button>
  );
};

export default BusinessMediaUploader;