import { Check } from "lucide-react";

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgressBar({ currentStep, totalSteps }: WizardProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => (
          <div key={stepNumber} className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                stepNumber < currentStep
                  ? "bg-primary text-primary-foreground"
                  : stepNumber === currentStep
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                stepNumber
              )}
            </div>
            {stepNumber < totalSteps && (
              <div
                className={`flex-1 h-1 mx-2 rounded transition-colors ${
                  stepNumber < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          Étape {currentStep} sur {totalSteps}
        </span>
      </div>
    </div>
  );
}
