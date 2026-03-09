import { useState } from "react";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessAskTabProps {
  businessName: string;
  isClaimed: boolean;
}

const suggestions = [
  "Comment est le stationnement?",
  "Quel est l'ambiance?",
  "Que dois-je savoir sur cet endroit?",
  "Comment est le service?",
];

const BusinessAskTab = ({ businessName, isClaimed }: BusinessAskTabProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const handleAsk = (q: string) => {
    setQuestion(q);
    setAnswer(`D'après les avis sur ${businessName}, les clients apprécient particulièrement l'ambiance chaleureuse et le service attentionné. C'est un endroit populaire auprès des locaux.`);
  };

  return (
    <div className="space-y-5">
      {/* Assistant header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={20} className="text-primary" />
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">Demander à QMaps</h3>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={`Posez une question sur "${businessName}"`}
          className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => question && handleAsk(question)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
        >
          <ArrowRight size={16} className="text-primary-foreground" />
        </button>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => handleAsk(s)}
            className="px-3 py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full hover:bg-secondary/80 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Answer */}
      {answer && (
        <div className="p-4 bg-card rounded-xl border border-border animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-semibold text-primary">QMaps Assistant</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{answer}</p>
        </div>
      )}

      {/* Claim CTA */}
      {!isClaimed && (
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Vous travaillez ici?</p>
            <p className="text-xs text-muted-foreground">Revendiquez ce commerce</p>
          </div>
          <CheckCircle size={24} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default BusinessAskTab;
