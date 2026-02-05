import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkSettings } from "@/hooks/useWorkSettings";
import { useProfessionalSchedule } from "@/hooks/useProfessionalSchedule";

interface DateTimeSelectProps {
  selectedDate: string;
  selectedTime: string;
  availableTimes: string[];
  timesLoading: boolean;
  professionalId: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const shortMonthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function DateTimeSelect({
  selectedDate,
  selectedTime,
  availableTimes,
  timesLoading,
  professionalId,
  onDateChange,
  onTimeChange,
  onPrev,
  onNext,
}: DateTimeSelectProps) {
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(todayMid.getFullYear(), todayMid.getMonth(), 1);
  });

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const { settings: workSettings } = useWorkSettings();
  const { schedule: professionalSchedule } = useProfessionalSchedule(professionalId);

  // Usa os dias de trabalho do profissional se configurado, senão usa o global
  const effectiveWorkingDays = professionalSchedule.workingDays ?? workSettings.working_days;

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; iso: string; isOut: boolean; isDisabled: boolean; isToday: boolean; isSelected: boolean }[] = [];
  
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;
    let d: Date;
    let isOut = false;

    if (dayNum < 1) {
      isOut = true;
      d = new Date(viewYear, viewMonth - 1, prevMonthDays + dayNum);
    } else if (dayNum > daysInMonth) {
      isOut = true;
      d = new Date(viewYear, viewMonth + 1, dayNum - daysInMonth);
    } else {
      d = new Date(viewYear, viewMonth, dayNum);
    }

    const iso = formatDateISO(d);
    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayOfWeek = d.getDay();
    const isNonWorkingDay = !effectiveWorkingDays.includes(dayOfWeek);
    const isBlockedDate = professionalSchedule.blockedDates.includes(iso);
    const isDisabled = dMid < todayMid || isOut || isNonWorkingDay || isBlockedDate;
    const isToday = dMid.getTime() === todayMid.getTime();
    const isSelected = selectedDate === iso;

    cells.push({ date: d, iso, isOut, isDisabled, isToday, isSelected });
  }

  const goToPrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Data e horário
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Escolha quando você quer ser atendida.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} size="sm" className="gap-1 hover:bg-white/10 flex-shrink-0 h-9 px-2 sm:px-3">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Voltar</span>
        </Button>
      </div>

      {/* Calendar - optimized for mobile */}
      <div>
        <Label className="text-xs sm:text-sm font-medium mb-2 block">Data</Label>
        <div className="border border-border/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/2 w-32 sm:w-40 h-16 sm:h-20 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          
          {/* Calendar header */}
          <div className="relative flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPrevMonth}
              className="hover:bg-white/10 w-9 h-9 sm:w-10 sm:h-10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="text-center flex-1">
              <div className="font-bold text-base sm:text-lg">
                <span className="hidden xs:inline">{monthNames[viewMonth]}</span>
                <span className="xs:hidden">{shortMonthNames[viewMonth]}</span>
                {' '}{viewYear}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToNextMonth}
              className="hover:bg-white/10 w-9 h-9 sm:w-10 sm:h-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Weekday header - abbreviated on mobile */}
          <div className="grid grid-cols-7 gap-1 mb-2 sm:mb-3 text-[10px] sm:text-xs font-medium text-muted-foreground text-center">
            <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
          </div>

          {/* Days grid - compact on mobile */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                disabled={cell.isDisabled}
                onClick={() => !cell.isDisabled && onDateChange(cell.iso)}
                className={cn(
                  "cal-day text-xs sm:text-sm font-medium py-2 sm:py-2.5",
                  cell.isDisabled && "cal-disabled",
                  cell.isToday && "cal-today",
                  cell.isSelected && "cal-selected"
                )}
              >
                {cell.date.getDate()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Time slots - grid instead of select for mobile */}
      <div>
        <Label className="text-xs sm:text-sm font-medium mb-2 block flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Horário
        </Label>
        
        {timesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : availableTimes.length === 0 ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">
              Não há horários disponíveis para esta data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {availableTimes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTimeChange(t)}
                className={cn(
                  "py-2.5 sm:py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200",
                  selectedTime === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted/50 border border-border/50 text-foreground hover:bg-muted hover:border-border active:scale-95"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selection summary */}
      {selectedTime && selectedDate && (
        <div className="p-3 sm:p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary font-medium text-center">
            ✨ <span className="font-bold">{selectedDate.split('-').reverse().join('/')}</span> às <span className="font-bold">{selectedTime}</span>
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2 sm:pt-3">
        <Button 
          onClick={onNext}
          disabled={!selectedTime || !selectedDate}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-5 sm:px-6 h-11 sm:h-12 font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
