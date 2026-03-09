import { X, Copy, MessageCircle, Facebook, Mail, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  url: string;
}

const ShareSheet = ({ open, onClose, title, text, url }: ShareSheetProps) => {
  const { toast } = useToast();

  if (!open) return null;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié!" });
    onClose();
  };

  const shareActions = [
    { icon: Copy, label: "Copier", action: copyLink },
    { icon: MessageCircle, label: "WhatsApp", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`) },
    { icon: MessageCircle, label: "Messenger", action: () => window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}`) },
    { icon: Facebook, label: "Facebook", action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`) },
    { icon: Mail, label: "Email", action: () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n" + url)}`) },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-foreground/40 z-50 animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl animate-fade-in max-w-lg mx-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>
        <h3 className="font-heading font-bold text-foreground text-center py-2">{title}</h3>
        <div className="border-t border-border mx-4" />

        {/* Share text preview */}
        <div className="mx-4 my-3 p-3 bg-muted rounded-xl flex items-center gap-3">
          <Share2 size={20} className="text-muted-foreground shrink-0" />
          <p className="text-sm text-foreground truncate">{text}</p>
          <button onClick={copyLink} className="shrink-0"><Copy size={18} className="text-muted-foreground" /></button>
        </div>

        {/* Share buttons */}
        <div className="flex gap-5 px-6 py-4 overflow-x-auto scrollbar-hide">
          {shareActions.map(action => (
            <button key={action.label} onClick={action.action} className="flex flex-col items-center gap-2 min-w-[56px]">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <action.icon size={20} className="text-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>

        <div className="pb-8 px-4">
          <button onClick={onClose} className="w-full py-3 text-sm font-medium text-muted-foreground">Annuler</button>
        </div>
      </div>
    </>
  );
};

export default ShareSheet;
