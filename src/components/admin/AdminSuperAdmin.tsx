import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Globe, Users, Database, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminSuperAdmin() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Superadmin
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ferramentas exclusivas de administração global da plataforma.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/platform")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              Console da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gerencie tenants, dashboards globais e configurações da plataforma.
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Gerenciar Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve — adicionar e remover superadmins da plataforma.
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              Logs & Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve — visualize logs de ações administrativas.
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              Configurações Globais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Em breve — configurações que afetam todos os tenants.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
