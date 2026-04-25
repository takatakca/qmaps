/**
 * Phase 10A — Offline banner.
 *
 * Listens to browser online/offline events and shows a small fixed banner
 * when the user is offline. Pure presentational; no caching, no SW.
 */
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { offlineMessage, shouldShowOfflineBanner } from "@/lib/network";

const OfflineBanner = () => {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!shouldShowOfflineBanner(online)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[60] pt-safe bg-destructive text-destructive-foreground"
    >
      <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2 text-xs font-medium">
        <WifiOff size={14} />
        <span>{offlineMessage(false)}</span>
      </div>
    </div>
  );
};

export default OfflineBanner;
