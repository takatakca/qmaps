import { useState } from "react";
import { Button } from "@/components/ui/button";

const questions = [
  "Avez-vous une terrasse extérieure?",
  "Offrez-vous le Wi-Fi gratuit?",
  "Acceptez-vous les réservations?",
  "Avez-vous un stationnement?",
  "Êtes-vous accessible en fauteuil roulant?",
];

interface Props {
  onAnswer?: (question: string, answer: string) => void;
}

const QuickQuestionSection = ({ onAnswer }: Props) => {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  if (done || index >= questions.length) return null;

  const handleAnswer = (answer: string) => {
    onAnswer?.(questions[index], answer);
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-[11px] text-muted-foreground mb-1">{index + 1} sur {questions.length} questions</p>
      <p className="font-heading font-bold text-foreground mb-3">{questions[index]}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleAnswer("yes")}>Oui</Button>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleAnswer("no")}>Non</Button>
        <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => handleAnswer("skip")}>Passer</Button>
      </div>
    </div>
  );
};

export default QuickQuestionSection;
