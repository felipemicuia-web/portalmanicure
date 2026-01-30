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
    <div className="flex items-center gap-2.5 py-3 overflow-x-auto">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => step.number <= currentStep && onStepClick(step.number)}
            className={cn(
              "flex items-center gap-2 px-1.5 py-1.5 bg-transparent border-0 text-foreground cursor-pointer transition-opacity",
              step.number <= currentStep ? "opacity-100" : "opacity-50",
              step.number > currentStep && "cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "step-dot",
                step.number === currentStep && "active"
              )}
            >
              {step.number}
            </span>
            <span className="text-xs whitespace-nowrap hidden sm:inline">
              {step.label}
            </span>
          </button>
          
          {index < steps.length - 1 && (
            <div className="flex-1 h-0.5 min-w-8 bg-border/50 rounded-sm" />
          )}
        </div>
      ))}
    </div>
  );
}
