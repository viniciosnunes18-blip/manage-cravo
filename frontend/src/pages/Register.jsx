import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

function formatCPF(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    cpf: "",
    birth_date: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    branch_id: "",
    how_found_us: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches-register"],
    queryFn: () => base44.entities.Branch.filter({ is_active: true }),
    initialData: [],
  });

  const handleChange = (field, value) => {
    if (field === "cpf") value = formatCPF(value);
    if (field === "phone") value = formatPhone(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const branch = branches.find((b) => b.id === form.branch_id);

    await base44.entities.Reseller.create({
      ...form,
      branch_name: branch?.name || "",
      status: "approved",
      cpf_check_status: "clean",
      commission_level: "bronze",
      total_sold_period: 0,
    });

    setResult("approved");
    setSubmitting(false);
  };

  if (result === "approved") {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center py-16"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-foreground mb-4">
            Parabéns, {form.full_name.split(" ")[0]}! 🎉
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Seu cadastro foi aprovado com sucesso! Em breve, a equipe da sua filial 
            entrará em contato via WhatsApp para dar início à sua jornada como 
            revendedora Cravo Dourado.
          </p>
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
            <Sparkles size={24} className="text-primary mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">
              Bem-vinda à família Cravo Dourado!
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Você receberá uma mensagem no WhatsApp com os próximos passos.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Header */}
      <section className="py-16 bg-foreground">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase">
              Cadastro
            </span>
            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-background mt-4">
              Torne-se uma{" "}
              <span className="text-primary italic">revendedora</span>
            </h1>
            <p className="text-background/60 mt-4">
              Preencha seus dados abaixo e comece sua jornada de sucesso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6 lg:px-8">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nome Completo *</Label>
              <Input
                required
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Seu nome completo"
                className="h-12 rounded-xl border-border/50 focus:border-primary"
              />
            </div>

            {/* CPF and Birth Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CPF *</Label>
                <Input
                  required
                  value={form.cpf}
                  onChange={(e) => handleChange("cpf", e.target.value)}
                  placeholder="000.000.000-00"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data de Nascimento *</Label>
                <Input
                  required
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => handleChange("birth_date", e.target.value)}
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="seu@email.com"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">WhatsApp *</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Endereço</Label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Rua, número, bairro"
                className="h-12 rounded-xl border-border/50 focus:border-primary"
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cidade *</Label>
                <Input
                  required
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Sua cidade"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado *</Label>
                <Input
                  required
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="UF"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium">CEP</Label>
                <Input
                  value={form.zip_code}
                  onChange={(e) => handleChange("zip_code", e.target.value)}
                  placeholder="00000-000"
                  className="h-12 rounded-xl border-border/50 focus:border-primary"
                />
              </div>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Filial mais próxima *</Label>
              <Select
                required
                value={form.branch_id}
                onValueChange={(val) => handleChange("branch_id", val)}
              >
                <SelectTrigger className="h-12 rounded-xl border-border/50">
                  <SelectValue placeholder="Selecione a filial" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {b.city}/{b.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* How found us */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Como conheceu a Cravo Dourado?</Label>
              <Textarea
                value={form.how_found_us}
                onChange={(e) => handleChange("how_found_us", e.target.value)}
                placeholder="Instagram, indicação de amiga, evento..."
                className="rounded-xl border-border/50 focus:border-primary min-h-[80px]"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/20"
            >
              {submitting ? (
                <>
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                "Enviar meu cadastro"
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Ao se cadastrar, você concorda com os termos de uso e política de privacidade da Cravo Dourado.
            </p>
          </motion.form>
        </div>
      </section>
    </div>
  );
}