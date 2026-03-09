import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, ScanLine, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const QRCode = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const displayName = user?.email?.split("@")[0] || "Utilisateur";
  const initial = displayName.charAt(0).toUpperCase();
  const profileUrl = `${window.location.origin}/profile`;

  // Generate a simple SVG-based QR placeholder
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
      </div>

      <div className="flex flex-col items-center px-8 pt-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">{displayName}</h1>

        <div className="bg-card rounded-2xl shadow-lg p-6 relative">
          {/* QR Code placeholder using pattern */}
          <div className="w-64 h-64 bg-foreground rounded-xl relative flex items-center justify-center"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='264' height='264'%3E%3Crect width='264' height='264' fill='white'/%3E%3Cg fill='black'%3E${Array.from({ length: 400 }, (_, i) => {
                const x = (i % 20) * 13 + 2;
                const y = Math.floor(i / 20) * 13 + 2;
                const show = Math.random() > 0.45;
                return show ? `%3Crect x='${x}' y='${y}' width='11' height='11'/%3E` : '';
              }).join('')}%3C/g%3E%3C/svg%3E")`,
              backgroundSize: 'cover',
            }}
          >
            {/* Avatar overlay in center */}
            <div className="absolute w-14 h-14 rounded-full bg-muted border-4 border-card flex items-center justify-center z-10">
              <User size={24} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex gap-8 mt-10">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `Profil ${displayName}`, url: profileUrl });
              } else {
                navigator.clipboard.writeText(profileUrl);
              }
            }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Share2 size={22} className="text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Partager</span>
          </button>
          <button className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <ScanLine size={22} className="text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Scanner</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCode;
