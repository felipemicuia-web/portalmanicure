import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Phone, MapPin, Building2, User, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type LeadStatus = "pending" | "concluded";

interface TrialLead {
  id: string;
  company_name: string;
  full_name: string;
  city: string;
  state: string;
  whatsapp: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export function PlatformLeads() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["trial-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trial_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrialLead[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("trial_leads")
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-leads"] });
      toast({ title: "Status atualizado!" });
    },
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("trial_leads")
        .update({ notes, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-leads"] });
      setEditingNotes(null);
      toast({ title: "Observação salva!" });
    },
  });

  const filtered = filter === "all" ? leads : leads.filter((l) => l.status === filter);
  const pendingCount = leads.filter((l) => l.status === "pending").length;
  const concludedCount = leads.filter((l) => l.status === "concluded").length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("all")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{leads.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("pending")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilter("concluded")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{concludedCount}</p>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter badges */}
      <div className="flex gap-2">
        {(["all", "pending", "concluded"] as const).map((f) => (
          <Badge
            key={f}
            variant={filter === f ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : "Concluídos"}
          </Badge>
        ))}
      </div>

      {/* Lead list */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card key={lead.id} className={lead.status === "concluded" ? "opacity-70" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">{lead.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{lead.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{lead.city} - {lead.state}</span>
                    </div>
                    <a
                      href={`https://wa.me/55${lead.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-500 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {lead.whatsapp}
                    </a>
                  </div>
                  <Badge variant={lead.status === "pending" ? "secondary" : "default"} className="shrink-0">
                    {lead.status === "pending" ? (
                      <><Clock className="w-3 h-3 mr-1" /> Pendente</>
                    ) : (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</>
                    )}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Solicitado em {format(new Date(lead.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>

                {/* Notes */}
                {editingNotes === lead.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Adicionar observação..."
                      className="text-sm"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveNotes.mutate({ id: lead.id, notes: notesValue })}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes || ""); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {lead.notes ? lead.notes : "Adicionar observação"}
                  </button>
                )}

                {/* Action */}
                <div className="flex justify-end">
                  {lead.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-green-600 border-green-600/30 hover:bg-green-600/10"
                      onClick={() => updateStatus.mutate({ id: lead.id, status: "concluded" })}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar Concluído
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground"
                      onClick={() => updateStatus.mutate({ id: lead.id, status: "pending" })}
                    >
                      <Clock className="w-4 h-4" /> Reabrir
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
