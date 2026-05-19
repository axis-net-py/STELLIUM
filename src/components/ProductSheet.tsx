"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { createProduct, updateProduct } from "@/app/actions/product";
import type { Product } from "@prisma/client";

export function ProductSheet({
  tenantId,
  product,
  onSuccess,
}: {
  tenantId: string;
  product?: Product;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!product;

  const [sku, setSku] = useState(product?.sku ?? "");
  const [namePt, setNamePt] = useState(product?.namePt ?? "");
  const [nameEs, setNameEs] = useState(product?.nameEs ?? "");
  const [price, setPrice] = useState(product?.price ? Number(product.price) : 0);
  const [cost, setCost] = useState(product?.cost ? Number(product.cost) : 0);
  const [unit, setUnit] = useState(product?.unit ?? "un");
  const [minStock, setMinStock] = useState(product?.minStock ? Number(product.minStock) : 0);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sku || !namePt) return;

    setLoading(true);
    try {
      if (isEdit && product) {
        await updateProduct(product.id, {
          sku,
          namePt,
          nameEs,
          price,
          cost,
          unit,
          minStock,
          isActive,
        });
      } else {
        await createProduct({
          sku,
          namePt,
          nameEs,
          price,
          cost,
          unit,
          minStock,
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (err: any) {
      alert(err.message || "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="axis-btn-primary h-[32px] px-4 text-[13px]">
          {isEdit ? "Editar" : "Novo Produto"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[66vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {isEdit ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {isEdit ? "Atualize os dados do produto" : "Cadastre um novo produto no sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">SKU</Label>
              <Input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ex: PROD-001"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Unidade</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: un, kg, lt"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome (PT)</Label>
              <Input
                required
                value={namePt}
                onChange={(e) => setNamePt(e.target.value)}
                placeholder="Ex: Produto A"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Nome (ES)</Label>
              <Input
                required
                value={nameEs}
                onChange={(e) => setNameEs(e.target.value)}
                placeholder="Ex: Producto A"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Preço (PYG)</Label>
              <Input
                type="number"
                required
                min={0}
                step="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="Ex: 50000"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Custo (PYG)</Label>
              <Input
                type="number"
                required
                min={0}
                step="1"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                placeholder="Ex: 35000"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">Estoque Mínimo</Label>
              <Input
                type="number"
                min={0}
                step="1"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                placeholder="Ex: 10"
                className="bg-background border-border text-[13px] h-[40px] rounded-[8px] font-medium shadow-sm focus:ring-primary/20"
              />
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
              {loading ? "Salvando..." : isEdit ? "Atualizar" : "Registrar Produto"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
