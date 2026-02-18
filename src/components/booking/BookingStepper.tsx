import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface BookingStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, label: "Profissional" },
  { number: 2, label: "Serviços" },
  { number: 3, label: "Horário" },
  { number: 4, label: "Confirmar" },
];

export function BookingStepper({ currentStep, onStepClick }: BookingStepperProps) {
  return (
    <div className="glass-panel p-4 sm:p-5 mb-3">
      <div className="flex items-center w-full">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <button
              type="button"
              onClick={() => step.number <= currentStep && onStepClick(step.number)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300 group",
                step.number <= currentStep ? "cursor-pointer" : "cursor-not-allowed",
              )}
            >
              <span
                className={cn(
                  "step-dot w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm flex-shrink-0",
                  step.number === currentStep && "active",
                  step.number < currentStep && "completed",
                )}
              >
                {step.number < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.number
                )}
              </span>
              <span className={cn(
                "text-[10px] sm:text-xs font-medium transition-colors leading-tight text-center",
                step.number === currentStep
                  ? "text-primary font-semibold"
                  : step.number < currentStep
                    ? "text-foreground/70"
                    : "text-muted-foreground/50"
              )}>
                {step.label}
              </span>
            </button>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 sm:mx-3 h-[2px] rounded-full relative overflow-hidden mt-[-1rem]">
                <div className="absolute inset-0 bg-border/30 rounded-full" />
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
                    step.number < currentStep
                      ? "w-full bg-gradient-to-r from-primary to-primary/60"
                      : step.number === currentStep
                        ? "w-1/2 bg-gradient-to-r from-primary to-transparent"
                        : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
