import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Phone } from "lucide-react";
import { z } from "zod";
import { isValidBrazilianPhone, normalizePhone, formatPhone } from "@/lib/validation";
import { useTenantPath } from "@/contexts/TenantScopeProvider";
import { useTenant } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres");
const nameSchema = z.string().min(2, "Nome deve ter pelo menos 2 caracteres");

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

type AuthMode = "login" | "signup" | "link-account";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const tp = useTenantPath();
  const { tenantId, tenantName } = useTenant();
  
  const redirectTo = new URLSearchParams(window.location.search).get("redirect") || tp("/");

  /**
   * After auth state changes, handle tenant profile logic:
   * - login mode: verify profile exists, block if not
   * - signup mode: profile was already created in handleAuth
   * - link-account mode: create profile then grant access
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user || !tenantId) return;
      if (event !== "SIGNED_IN") return;

      const userId = session.user.id;
      const normalizedEmail = session.user.email?.trim().toLowerCase() || null;

      logger.info("[Auth] SIGNED_IN received", {
        authEmail: normalizedEmail,
        tenantId,
        mode,
        userId,
      });

      const { data: hasProfile } = await supabase.rpc("user_has_profile_in_tenant", {
        _user_id: userId,
        _tenant_id: tenantId,
      });

      logger.info("[Auth] Tenant profile check", {
        authEmail: normalizedEmail,
        tenantId,
        hasProfile: !!hasProfile,
      });

      if (hasProfile) {
        navigate(redirectTo);
        return;
      }

      // For signup and link-account modes, create the profile
      if (mode === "signup" || mode === "link-account") {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: userId,
          tenant_id: tenantId,
          name: fullName || session.user.user_metadata?.first_name || null,
          phone: normalizePhone(phone) || session.user.user_metadata?.phone || null,
        });

        if (profileError && !profileError.message.includes("duplicate")) {
          console.error("Error creating tenant profile:", profileError);
          toast({
            title: "Erro",
            description: "Não foi possível criar seu perfil neste estabelecimento.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: mode === "signup" ? "Conta criada!" : "Conta vinculada!",
          description: mode === "signup"
            ? "Bem-vindo! Sua conta foi criada com sucesso."
            : `Sua conta foi vinculada a ${tenantName || "este estabelecimento"}.`,
        });
        navigate(redirectTo);
        return;
      }

      // Login mode — no profile in this tenant → block
      toast({
        title: "Conta não encontrada",
        description: `Sua conta não está registrada neste estabelecimento${tenantName ? ` (${tenantName})` : ""}. Cadastre-se primeiro.`,
        variant: "destructive",
      });
      await supabase.auth.signOut();
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, tenantId, tenantName, toast, mode, firstName, lastName, phone]);

  const handlePhoneChange = (value: string) => {
    const digits = normalizePhone(value);
    if (digits.length <= 11) {
      setPhone(formatPhone(digits));
    }
  };

  const isSignupLike = mode === "signup" || mode === "link-account";

  const validateForm = () => {
    const newErrors: FormErrors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;

    if (isSignupLike) {
      if (mode === "signup" && password !== confirmPassword) newErrors.confirmPassword = "As senhas não coincidem";
      const firstNameResult = nameSchema.safeParse(firstName.trim());
      if (!firstNameResult.success) newErrors.firstName = firstNameResult.error.errors[0].message;
      const lastNameResult = nameSchema.safeParse(lastName.trim());
      if (!lastNameResult.success) newErrors.lastName = lastNameResult.error.errors[0].message;
      if (!isValidBrazilianPhone(phone)) newErrors.phone = "Telefone inválido. Use DDD + número (ex: 11 99999-9999)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!tenantId) {
      toast({ title: "Erro", description: "Estabelecimento não encontrado", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({
            title: "Erro no login",
            description: error.message.includes("Invalid login credentials")
              ? "Email ou senha incorretos"
              : error.message,
            variant: "destructive",
          });
        }
        // onAuthStateChange handles the rest
      } else if (mode === "link-account") {
        // User has an existing auth account, login to link to this tenant
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({
            title: "Erro no login",
            description: error.message.includes("Invalid login credentials")
              ? "Email ou senha incorretos"
              : error.message,
            variant: "destructive",
          });
        }
        // onAuthStateChange will create the profile in link-account mode
      } else {
        // SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${tp("/")}`,
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: normalizePhone(phone),
              signup_tenant_id: tenantId,
            },
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            // Switch to link-account mode — user needs to login to link
            setMode("link-account");
            toast({
              title: "Email já cadastrado",
              description: "Este email já possui uma conta. Faça login com sua senha para vincular ao estabelecimento.",
            });
          } else {
            toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
          }
        } else if (data.user) {
          if (data.session) {
            // Auto-confirmed — onAuthStateChange will handle profile creation and navigation
          } else {
            toast({
              title: "Conta criada!",
              description: "Verifique seu email para confirmar o cadastro.",
            });
          }
        }
      }
    } catch (error) {
      toast({ title: "Erro", description: "Ocorreu um erro inesperado", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "login") return "Entrar na conta";
    if (mode === "link-account") return "Vincular conta";
    return "Criar conta";
  };

  const getDescription = () => {
    const tn = tenantName ? ` ${tenantName}` : "";
    if (mode === "login") return `Digite suas credenciais para acessar${tn}`;
    if (mode === "link-account") return `Faça login para vincular sua conta a${tn}`;
    return `Preencha os dados para se cadastrar em${tn}`;
  };

  const getSubmitLabel = () => {
    if (mode === "login") return "Entrar";
    if (mode === "link-account") return "Vincular e entrar";
    return "Cadastrar";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="galaxy-bg" />
      
      <Card className="w-full max-w-md relative overflow-hidden border-border/50 shadow-2xl shadow-primary/20 bg-card/80 backdrop-blur z-10">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <CardHeader className="space-y-3 pb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(tp("/"))} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
            <CardDescription className="text-muted-foreground">{getDescription()}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-11 ${errors.email ? "border-destructive" : ""}`}
                  required />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 h-11 ${errors.password ? "border-destructive" : ""}`}
                  required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {isSignupLike && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="firstName" type="text" placeholder="Maria"
                        value={firstName} onChange={(e) => setFirstName(e.target.value)}
                        className={`pl-10 h-11 ${errors.firstName ? "border-destructive" : ""}`}
                        required />
                    </div>
                    {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Sobrenome</Label>
                    <Input id="lastName" type="text" placeholder="Silva"
                      value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className={`h-11 ${errors.lastName ? "border-destructive" : ""}`}
                      required />
                    {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">WhatsApp (com DDD)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder="(11) 99999-9999"
                      value={phone} onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`pl-10 h-11 ${errors.phone ? "border-destructive" : ""}`}
                      required />
                  </div>
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 h-11 ${errors.confirmPassword ? "border-destructive" : ""}`}
                        required />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}
              </>
            )}

            {mode === "link-account" && (
              <div className="rounded-lg bg-muted/50 border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Este email já possui uma conta. Faça login com sua senha existente para vincular sua conta a este estabelecimento com um novo perfil.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 transition-all duration-200" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Carregando...</span>
                </div>
              ) : getSubmitLabel()}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? "Não tem uma conta?" : "Já tem uma conta neste estabelecimento?"}
              <button type="button" onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setErrors({});
                if (mode !== "login") { setFirstName(""); setLastName(""); setPhone(""); }
              }} className="ml-1 font-semibold text-primary hover:underline">
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
