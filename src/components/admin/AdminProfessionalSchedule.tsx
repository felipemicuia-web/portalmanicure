import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  Save, 
  Loader2, 
  User, 
  Trash2,
  Plus 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Professional {
  id: string;
  name: string;
  working_days: number[] | null;
}

interface BlockedDate {
  id: string;
  professional_id: string;
  blocked_date: string;
  reason: string | null;
}

const WEEKDAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

export function AdminProfessionalSchedule() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("");
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useCustomDays, setUseCustomDays] = useState(false);
  const [customWorkingDays, setCustomWorkingDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [blockReason, setBlockReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    if (selectedProfessionalId) {
      fetchBlockedDates();
      const prof = professionals.find(p => p.id === selectedProfessionalId);
      if (prof) {
        setUseCustomDays(prof.working_days !== null);
        setCustomWorkingDays(prof.working_days || [1, 2, 3, 4, 5, 6]);
      }
    }
  }, [selectedProfessionalId, professionals]);

  async function fetchProfessionals() {
    setLoading(true);
    const { data, error } = await supabase
      .from("professionals")
      .select("id, name, working_days")
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Error fetching professionals:", error);
    } else if (data) {
      setProfessionals(data);
      if (data.length > 0 && !selectedProfessionalId) {
        setSelectedProfessionalId(data[0].id);
      }
    }
    setLoading(false);
  }

  async function fetchBlockedDates() {
    if (!selectedProfessionalId) return;
    
    const { data, error } = await supabase
      .from("professional_blocked_dates")
      .select("*")
      .eq("professional_id", selectedProfessionalId)
      .gte("blocked_date", new Date().toISOString().split("T")[0])
      .order("blocked_date");

    if (error) {
      console.error("Error fetching blocked dates:", error);
    } else {
      setBlockedDates(data || []);
    }
  }

  async function handleSaveWorkingDays() {
    if (!selectedProfessionalId) return;

    setSaving(true);

    const { error } = await supabase
      .from("professionals")
      .update({ 
        working_days: useCustomDays ? customWorkingDays : null 
      })
      .eq("id", selectedProfessionalId);

    setSaving(false);

    if (error) {
      console.error("Error saving working days:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dias de trabalho.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Salvo!",
        description: "Dias de trabalho atualizados com sucesso.",
      });
      fetchProfessionals();
    }
  }

  async function handleAddBlockedDate() {
    if (!selectedProfessionalId || !selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    const { error } = await supabase
      .from("professional_blocked_dates")
      .insert({
        professional_id: selectedProfessionalId,
        blocked_date: dateStr,
        reason: blockReason || null,
      });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Data já bloqueada",
          description: "Esta data já está marcada como folga.",
          variant: "destructive",
        });
      } else {
        console.error("Error adding blocked date:", error);
        toast({
          title: "Erro",
          description: "Não foi possível adicionar a data.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Folga adicionada!",
        description: `${format(selectedDate, "dd/MM/yyyy")} marcado como folga.`,
      });
      setSelectedDate(undefined);
      setBlockReason("");
      fetchBlockedDates();
    }
  }

  async function handleRemoveBlockedDate(id: string) {
    const { error } = await supabase
      .from("professional_blocked_dates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error removing blocked date:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a data.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removido!",
        description: "Data removida da lista de folgas.",
      });
      fetchBlockedDates();
    }
  }

  function toggleDay(day: number) {
    const newDays = customWorkingDays.includes(day)
      ? customWorkingDays.filter((d) => d !== day)
      : [...customWorkingDays, day].sort((a, b) => a - b);
    setCustomWorkingDays(newDays);
  }

  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-muted-foreground">Nenhum profissional ativo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de Profissional */}
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Agenda do Profissional</h2>
            <p className="text-sm text-muted-foreground">
              Configure os dias de trabalho e folgas específicas
            </p>
          </div>
        </div>

        <Select value={selectedProfessionalId} onValueChange={setSelectedProfessionalId}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Selecione um profissional" />
          </SelectTrigger>
          <SelectContent>
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProfessionalId && (
        <>
          {/* Dias de Trabalho Personalizados */}
          <div className="glass-panel p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base">Dias de Trabalho Personalizados</Label>
                  <p className="text-xs text-muted-foreground">
                    Sobrescreve a configuração global para este profissional
                  </p>
                </div>
              </div>
              <Switch
                checked={useCustomDays}
                onCheckedChange={setUseCustomDays}
              />
            </div>

            {useCustomDays && (
              <div className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {WEEKDAYS.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        customWorkingDays.includes(day.value)
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-background hover:border-primary/50"
                      }`}
                    >
                      <Checkbox
                        checked={customWorkingDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <span className="text-sm font-medium">{day.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end mt-4">
                  <Button onClick={handleSaveWorkingDays} disabled={saving} className="gap-2">
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Dias
                  </Button>
                </div>
              </div>
            )}

            {!useCustomDays && (
              <p className="text-sm text-muted-foreground mt-2">
                ✓ Usando configuração global de dias de funcionamento
              </p>
            )}
          </div>

          {/* Datas Bloqueadas (Folgas) */}
          <div className="glass-panel p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Folgas e Datas Bloqueadas</Label>
                <p className="text-xs text-muted-foreground">
                  Marque datas específicas em que {selectedProfessional?.name} não irá trabalhar
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Adicionar nova data */}
              <div className="space-y-4">
                <Label>Adicionar folga</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border bg-background"
                />
                
                {selectedDate && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="reason">Motivo (opcional)</Label>
                      <Input
                        id="reason"
                        placeholder="Ex: Férias, consulta médica..."
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={handleAddBlockedDate} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar {format(selectedDate, "dd/MM/yyyy")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Lista de datas bloqueadas */}
              <div className="space-y-3">
                <Label>Folgas programadas</Label>
                {blockedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    Nenhuma folga programada.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {blockedDates.map((bd) => (
                      <div
                        key={bd.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background"
                      >
                        <div>
                          <p className="font-medium">
                            {format(parseISO(bd.blocked_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          {bd.reason && (
                            <p className="text-sm text-muted-foreground">{bd.reason}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveBlockedDate(bd.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
