import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Check, X, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Professional {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export function AdminProfessionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      logger.error("Error fetching professionals:", error);
    } else {
      setProfessionals(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    const { error } = await supabase
      .from("professionals")
      .insert({ name: newName.trim() });

    if (error) {
      logger.error("Error adding professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o profissional.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Profissional adicionado!" });
      setNewName("");
      setIsAdding(false);
      fetchProfessionals();
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;

    const { error } = await supabase
      .from("professionals")
      .update({ name: editName.trim() })
      .eq("id", id);

    if (error) {
      logger.error("Error updating professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o profissional.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Profissional atualizado!" });
      setEditingId(null);
      fetchProfessionals();
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("professionals")
      .update({ active: !currentActive })
      .eq("id", id);

    if (error) {
      logger.error("Error toggling professional:", error);
    } else {
      fetchProfessionals();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("professionals")
      .delete()
      .eq("id", deleteId);

    if (error) {
      logger.error("Error deleting professional:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o profissional.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Profissional removido!" });
      fetchProfessionals();
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Profissionais</h2>
        </div>
        <Button onClick={() => setIsAdding(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 p-3 glass-panel">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do profissional"
            className="flex-1"
            autoFocus
          />
          <Button size="icon" onClick={handleAdd}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24 text-center">Ativo</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Nenhum profissional cadastrado
                </TableCell>
              </TableRow>
            ) : (
              professionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell>
                    {editingId === prof.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(prof.id)}>
                          <Check className="w-4 h-4 text-primary" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className={!prof.active ? "text-muted-foreground" : ""}>
                        {prof.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={prof.active}
                      onCheckedChange={() => handleToggleActive(prof.id, prof.active)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(prof.id);
                          setEditName(prof.name);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(prof.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este profissional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
