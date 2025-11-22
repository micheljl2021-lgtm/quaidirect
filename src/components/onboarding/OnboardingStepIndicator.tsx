import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Société" },
  { number: 2, label: "Liens" },
  { number: 3, label: "Zones & Méthodes" },
  { number: 4, label: "Espèces" },
  { number: 5, label: "Photos & Description" },
];

export function OnboardingStepIndicator({ currentStep }: OnboardingStepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {/* Ligne de connexion */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-10">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center">
              {/* Cercle d'étape */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border-2",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20",
                  isPending && "bg-background border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Label */}
              <div
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px] transition-colors duration-300",
                  (isCompleted || isCurrent) && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}