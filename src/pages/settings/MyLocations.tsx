import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crosshair, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";

const MyLocations = () => {
  const navigate = useNavigate();
  const [primaryLocation, setPrimaryLocation] = useState("Montréal, QC");
  const [talkLocation, setTalkLocation] = useState("Montréal, QC");

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Paramètres</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Primary Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Emplacement principal</label>
            <button className="w-10 h-10 border border-border rounded-lg flex items-center justify-center">
              <Crosshair size={18} className="text-muted-foreground" />
            </button>
          </div>
          <Input
            value={primaryLocation}
            onChange={e => setPrimaryLocation(e.target.value)}
            className="border-0 border-b border-primary rounded-none px-0 focus-visible:ring-0"
          />
        </div>

        {/* Talk Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Emplacement discussions</label>
            <button className="w-10 h-10 border border-border rounded-lg flex items-center justify-center">
              <Crosshair size={18} className="text-muted-foreground" />
            </button>
          </div>
          <Input
            value={talkLocation}
            onChange={e => setTalkLocation(e.target.value)}
            className="border-0 border-b border-primary rounded-none px-0 focus-visible:ring-0"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MyLocations;
