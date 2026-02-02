import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Bell, Check, Trash2, RefreshCw, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

interface Notification {
  id: string;
  type: string;
  booking_id: string | null;
  user_id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingAll, setClearingAll] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching notifications:", error);
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("admin_notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          toast.info("Nova notificação recebida!");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "booking_updated":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "booking_cancelled":
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <Bell className="w-4 h-4 text-primary" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "booking_updated":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Alteração</Badge>;
      case "booking_cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cancelamento</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{type}</Badge>;
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      logger.error("Error marking notification as read:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("Error deleting notification:", error);
      toast.error("Erro ao excluir notificação");
      return;
    }

    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = async () => {
    setClearingAll(true);
    const { error } = await supabase
      .from("admin_notifications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (error) {
      logger.error("Error clearing notifications:", error);
      toast.error("Erro ao limpar notificações");
    } else {
      setNotifications([]);
      toast.success("Todas as notificações foram removidas");
    }
    setClearingAll(false);
    setShowClearDialog(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Notificações</h2>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-xs"
            >
              Limpar Tudo
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma notificação</p>
          <p className="text-sm mt-1">
            Você receberá notificações quando clientes alterarem ou cancelarem agendamentos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`glass-panel p-4 transition-all ${
                !notification.read ? "border-l-4 border-l-primary" : "opacity-75"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getTypeIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getTypeBadge(notification.type)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{notification.message}</p>
                </div>
                <div className="flex gap-1">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                      className="h-8 w-8"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notification.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar Notificações</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover todas as {notifications.length} notificações?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllNotifications}
              disabled={clearingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearingAll ? "Limpando..." : "Limpar Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
