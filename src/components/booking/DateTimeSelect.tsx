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
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold mb-1">Selecione data e horário</h2>
          <p className="text-muted-foreground text-sm">
            Escolha uma data e um horário disponível.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calendar */}
        <div>
          <Label className="text-sm opacity-90 mb-1.5 block">Data</Label>
          <div className="border border-border/60 rounded-xl p-3 bg-card/60 backdrop-blur">
            {/* Calendar header */}
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center flex-1">
                <div className="font-bold">{monthNames[viewMonth]} {viewYear}</div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {selectedDate ? `Selecionado: ${selectedDate}` : "Selecione uma data"}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-xs text-muted-foreground text-center">
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
                    "cal-day text-sm",
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
          <Label htmlFor="time" className="text-sm opacity-90 mb-1.5 block">
            Horário
          </Label>
          <Select value={selectedTime} onValueChange={onTimeChange}>
            <SelectTrigger id="time" className="w-full bg-input border-border">
              <SelectValue placeholder={
                timesLoading 
                  ? "Carregando..." 
                  : availableTimes.length === 0 
                    ? "Sem horários disponíveis"
                    : "Selecione um horário"
              } />
            </SelectTrigger>
            <SelectContent>
              {availableTimes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {availableTimes.length === 0 && !timesLoading && selectedDate && (
            <p className="text-sm text-muted-foreground mt-2">
              Não há horários disponíveis para esta data. Tente outra data.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
          Continuar
        </Button>
      </div>
    </div>
  );
}
