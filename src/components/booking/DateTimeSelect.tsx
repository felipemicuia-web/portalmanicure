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

  const effectiveWorkingDays = professionalSchedule.workingDays ?? workSettings.working_days;

  const firstDay = new Date(viewYear, viewMonth, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (null | { date: Date; iso: string; isDisabled: boolean; isToday: boolean; isSelected: boolean })[] = [];
  for (let i = 0; i < startDow; i++) {
    cells.push(null);
  }

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(viewYear, viewMonth, dayNum);
    const iso = formatDateISO(d);
    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayOfWeek = d.getDay();
    const isNonWorkingDay = !effectiveWorkingDays.includes(dayOfWeek);
    const isBlockedDate = professionalSchedule.blockedDates.includes(iso);
    const isDisabled = dMid < todayMid || isNonWorkingDay || isBlockedDate;
    const isToday = dMid.getTime() === todayMid.getTime();
    const isSelected = selectedDate === iso;

    cells.push({ date: d, iso, isDisabled, isToday, isSelected });
  }

  const goToPrevMonth = () => setViewDate(new Date(viewYear, viewMonth - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(viewYear, viewMonth + 1, 1));

  return (
    <div className="glass-panel space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            Data e horário
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolha quando você quer ser atendida
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} size="sm" className="gap-1.5 hover:bg-muted/30 flex-shrink-0 h-9 px-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      {/* Calendar */}
      <div>
        <Label className="text-xs sm:text-sm font-semibold mb-3 block text-muted-foreground uppercase tracking-wider">Data</Label>
        <div className="border border-border/30 rounded-2xl p-4 sm:p-5 bg-card/20 relative overflow-hidden">
          {/* Calendar header */}
          <div className="relative flex items-center justify-between gap-2 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={goToPrevMonth}
              className="hover:bg-muted/30 w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
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
              className="hover:bg-muted/30 w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-[10px] sm:text-xs font-semibold text-muted-foreground/60 text-center uppercase">
            <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {cells.map((cell, idx) => (
              cell === null ? (
                <div key={idx} />
              ) : (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => !cell.isDisabled && onDateChange(cell.iso)}
                  className={cn(
                    "cal-day text-xs sm:text-sm font-medium py-2.5 sm:py-3",
                    cell.isDisabled && "cal-disabled",
                    cell.isToday && "cal-today",
                    cell.isSelected && "cal-selected"
                  )}
                >
                  {cell.date.getDate()}
                </button>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div>
        <Label className="text-xs sm:text-sm font-semibold mb-3 block flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
          <Clock className="w-4 h-4" />
          Horário
        </Label>
        
        {timesLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : availableTimes.length === 0 ? (
          <div className="p-5 rounded-2xl bg-destructive/8 border border-destructive/15 text-center">
            <p className="text-sm text-destructive">
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
                  "py-3 px-2 rounded-xl text-sm font-semibold transition-all duration-200",
                  selectedTime === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : "bg-muted/20 border border-border/30 text-foreground hover:bg-muted/40 hover:border-border/50 active:scale-95"
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
        <div className="p-4 rounded-2xl bg-primary/8 border border-primary/15">
          <p className="text-sm text-primary font-semibold text-center">
            ✨ <span className="font-bold">{selectedDate.split('-').reverse().join('/')}</span> às <span className="font-bold">{selectedTime}</span>
          </p>
        </div>
      )}

      <div className="pt-1">
        <Button 
          onClick={onNext}
          disabled={!selectedTime || !selectedDate}
          className="btn-glow w-full h-13 sm:h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
