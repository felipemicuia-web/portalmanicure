import { cn } from "@/lib/utils";

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
    <div className="glass-panel p-4 mb-2">
      <div className="flex items-center justify-between gap-3 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => step.number <= currentStep && onStepClick(step.number)}
              className={cn(
                "flex items-center gap-3 px-2 py-2 bg-transparent border-0 text-foreground cursor-pointer transition-all duration-300",
                step.number <= currentStep ? "opacity-100" : "opacity-40",
                step.number > currentStep && "cursor-not-allowed",
                step.number === currentStep && "scale-105"
              )}
            >
              <span
                className={cn(
                  "step-dot",
                  step.number === currentStep && "active",
                  step.number < currentStep && "bg-primary/30 border-primary/50"
                )}
              >
                {step.number < currentStep ? "✓" : step.number}
              </span>
              <span className={cn(
                "text-sm whitespace-nowrap hidden sm:inline font-medium transition-all",
                step.number === currentStep && "text-accent font-bold"
              )}>
                {step.label}
              </span>
            </button>
            
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 min-w-8 rounded-full transition-all duration-500",
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
