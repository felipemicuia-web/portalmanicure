import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimeSelectProps {
  selectedDate: string;
  selectedTime: string;
  availableTimes: string[];
  timesLoading: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function getTodayISO(): string {
  return formatDateISO(new Date());
}

export function DateTimeSelect({
  selectedDate,
  selectedTime,
  availableTimes,
  timesLoading,
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
    const isDisabled = dMid < todayMid || isOut;
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
    <div className="glass-panel p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Selecione data e horário
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolha uma data e um horário disponível.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} className="gap-1.5 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Calendar */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Data</Label>
          <div className="border border-border/40 rounded-2xl p-4 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute top-0 left-1/2 w-40 h-20 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            
            {/* Calendar header */}
            <div className="relative flex items-center justify-between gap-2.5 mb-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToPrevMonth}
                className="hover:bg-white/10 w-10 h-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center flex-1">
                <div className="font-bold text-lg">{monthNames[viewMonth]} {viewYear}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {selectedDate ? `Selecionado: ${selectedDate}` : "Selecione uma data"}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={goToNextMonth}
                className="hover:bg-white/10 w-10 h-10"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1.5 mb-3 text-xs font-medium text-muted-foreground text-center">
              <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((cell, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={cell.isDisabled}
                  onClick={() => !cell.isDisabled && onDateChange(cell.iso)}
                  className={cn(
                    "cal-day text-sm font-medium",
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

        {/* Time select */}
        <div>
          <Label htmlFor="time" className="text-sm font-medium mb-2 block">
            Horário
          </Label>
          <div className="glow-ring rounded-lg">
            <Select value={selectedTime} onValueChange={onTimeChange}>
              <SelectTrigger 
                id="time" 
                className="w-full bg-input/80 border-border/60 h-12 text-base hover:border-border transition-all duration-200"
              >
                <SelectValue placeholder={
                  timesLoading 
                    ? "Carregando..." 
                    : availableTimes.length === 0 
                      ? "Sem horários disponíveis"
                      : "Selecione um horário"
                } />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50 max-h-[280px]">
                {availableTimes.map((t) => (
                  <SelectItem 
                    key={t} 
                    value={t}
                    className="hover:bg-primary/20 focus:bg-primary/20 cursor-pointer transition-colors text-base py-3"
                  >
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableTimes.length === 0 && !timesLoading && selectedDate && (
            <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Não há horários disponíveis para esta data. Tente outra data.
              </p>
            </div>
          )}

          {selectedTime && (
            <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                ✨ Horário selecionado: <span className="font-bold">{selectedTime}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-3">
        <Button 
          onClick={onNext} 
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-6 h-12 font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
