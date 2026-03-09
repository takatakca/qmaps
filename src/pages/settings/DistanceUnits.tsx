import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";

const DistanceUnits = () => {
  const navigate = useNavigate();
  const [unit, setUnit] = useState("auto");

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="sticky top-0 z-20 bg-card border-b border-border flex items-center gap-3 px-4 py-3">
        <button onClick={() => navigate(-1)}><ArrowLeft size={22} className="text-foreground" /></button>
        <h1 className="font-heading text-lg font-bold text-foreground">Unités de distance</h1>
      </div>

      <div className="px-4 py-6">
        <RadioGroup value={unit} onValueChange={setUnit} className="space-y-4">
          {[
            { value: "auto", label: "Automatique" },
            { value: "km", label: "Kilomètres" },
            { value: "mi", label: "Miles" },
          ].map(opt => (
            <div key={opt.value} className="flex items-center gap-3 py-2">
              <RadioGroupItem value={opt.value} id={opt.value} />
              <Label htmlFor={opt.value} className="text-sm text-foreground cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <BottomNav />
    </div>
  );
};

export default DistanceUnits;
