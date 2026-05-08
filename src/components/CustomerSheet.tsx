"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createCustomer, updateCustomer } from "@/app/actions/customer";
import type { Customer } from "@prisma/client";

export function CustomerSheet({
  tenantId,
  customer,
  onSuccess,
}: {
  tenantId: string;
  customer?: Customer;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!customer;

  const [name, setName] = useState(customer?.name ?? "");
  const [document, setDocument] = useState(customer?.document ?? "");
  const [documentType, setDocumentType] = useState(customer?.documentType ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [city, setCity] = useState(customer?.city ?? "");
  const [country, setCountry] = useState(customer?.country ?? "PY");
  const [category, setCategory] = useState(customer?.category ?? "retail");
  const [isActive, setIsActive] = useState(customer?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      if (isEdit && customer) {
        await updateCustomer(customer.id, {
          name,
          document,
          documentType,
          email,
          phone,
          address,
          city,
          country,
          category,
          isActive,
        });
      } else {
        await createCustomer({
          name,
          document,
          documentType,
          email,
          phone,
          address,
          city,
          country,
          category,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar cliente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary h-[32px] px-4 text-[13px]">
          {isEdit ? "Editar" : "Novo Cliente"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[66vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize os dados do cliente" : "Cadastre um novo cliente no sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome</Label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Juan Pérez"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Documento (RUC/CI)</Label>
              <Input
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Ex: 123456-8"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Tipo de Documento</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="RUC" className="text-[12px]">RUC</SelectItem>
                  <SelectItem value="CI" className="text-[12px]">CI</SelectItem>
                  <SelectItem value="CPF" className="text-[12px]">CPF</SelectItem>
                  <SelectItem value="CNPJ" className="text-[12px]">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="retail" className="text-[12px]">Varejo (Retail)</SelectItem>
                  <SelectItem value="wholesale" className="text-[12px]">Atacado (Wholesale)</SelectItem>
                  <SelectItem value="vip" className="text-[12px]">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@exemplo.com"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Telefone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+595 991 234 567"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Endereço</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle Principal 123"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Cidade</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Asunción"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">País</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px] focus:ring-primary/20">
                  <SelectValue placeholder="Selecione país" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground">
                  <SelectItem value="PY" className="text-[12px]">Paraguai (PY)</SelectItem>
                  <SelectItem value="BR" className="text-[12px]">Brasil (BR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label className="text-[13px]">Ativo</Label>
            </div>
          </div>

          <div className="mt-4 pt-6 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 h-[40px] rounded-[8px] text-[14px] font-semibold text-muted-foreground hover:bg-muted transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 h-[40px] rounded-[8px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-[14px] font-bold disabled:opacity-50 shadow-md active:scale-95"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
              {loading ? "Salvando..." : isEdit ? "Atualizar" : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
