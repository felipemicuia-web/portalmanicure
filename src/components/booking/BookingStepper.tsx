import { cn } from "@/lib/utils";

interface BookingStepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

const steps = [
  { number: 1, label: "Profissional", shortLabel: "Prof." },
  { number: 2, label: "Serviços", shortLabel: "Serv." },
  { number: 3, label: "Horário", shortLabel: "Hora" },
  { number: 4, label: "Confirmar", shortLabel: "Ok" },
];

export function BookingStepper({ currentStep, onStepClick }: BookingStepperProps) {
  return (
    <div className="glass-panel p-3 sm:p-4 mb-2">
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-1 sm:gap-3 flex-1">
            <button
              type="button"
              onClick={() => step.number <= currentStep && onStepClick(step.number)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-3 px-1 sm:px-2 py-1.5 sm:py-2 bg-transparent border-0 text-foreground cursor-pointer transition-all duration-300 min-w-0",
                step.number <= currentStep ? "opacity-100" : "opacity-40",
                step.number > currentStep && "cursor-not-allowed",
                step.number === currentStep && "scale-105"
              )}
            >
              <span
                className={cn(
                  "step-dot w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm flex-shrink-0",
                  step.number === currentStep && "active",
                  step.number < currentStep && "bg-primary/30 border-primary/50"
                )}
              >
                {step.number < currentStep ? "✓" : step.number}
              </span>
              <span className={cn(
                "text-[10px] sm:text-sm whitespace-nowrap font-medium transition-all hidden xs:inline",
                step.number === currentStep && "text-accent font-bold"
              )}>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </span>
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-2 sm:min-w-8 rounded-full transition-all duration-500",
                step.number < currentStep 
                  ? "bg-gradient-to-r from-primary to-primary/50" 
                  : "bg-border/30"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
