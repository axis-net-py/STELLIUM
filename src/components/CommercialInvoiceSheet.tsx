"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { createPurchaseInvoice, createSalesInvoice } from "@/app/actions/invoice";
import { getCustomers } from "@/app/actions/customer";
import { getProducts } from "@/app/actions/product";
import type { Customer, Product } from "@prisma/client";
import { useRouter } from "next/navigation";

export function CommercialInvoiceSheet({
  tenantId,
}: {
  tenantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"PURCHASE" | "SALES">("PURCHASE");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [items, setItems] = useState<{
    productId: string;
    quantity: number;
    unitPrice: number;
    taxType: "IVA_10" | "IVA_5" | "EXENTO";
  }[]>([{ productId: "", quantity: 1, unitPrice: 0, taxType: "IVA_10" }]);
  const router = useRouter();

  async function openSheet() {
    setOpen(true);
    const [custs, prods] = await Promise.all([getCustomers(), getProducts()]);
    setCustomers(custs as any);
    setProducts(prods as any);
  }

  function addItem() {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0, taxType: "IVA_10" }]);
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        newItems[index].unitPrice = Number(prod.price);
        newItems[index].taxType = (prod as any).taxType || "IVA_10";
      }
    }
    setItems(newItems);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || items.some((i) => !i.productId || i.quantity <= 0)) return;

    setLoading(true);
    try {
      const invoiceData = {
        type,
        customerId: selectedCustomer,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxType: i.taxType,
        })),
      };

      if (type === "PURCHASE") {
        await createPurchaseInvoice(invoiceData);
      } else {
        await createSalesInvoice(invoiceData);
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Erro ao criar fatura");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={openSheet}
          className="axis-btn-primary h-[32px] px-4 text-[13px]"
        >
          Nova Fatura
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] w-[95vw] glass-pop-up p-0 overflow-hidden">
        <DialogHeader className="text-left space-y-1 p-6 border-b border-border bg-muted/30">
          <DialogTitle className="text-[18px] font-bold tracking-tight text-foreground">
            {type === "PURCHASE" ? "Fatura de Compra" : "Fatura de Venda"}
          </DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground font-medium">
            {type === "PURCHASE"
              ? "Compra: incrementa estoque automaticamente"
              : "Venda: valida saldo e decrementa estoque"}
          </DialogDescription>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setType("PURCHASE")}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                type === "PURCHASE"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => setType("SALES")}
              className={`px-3 py-1 rounded-md text-xs font-semibold ${
                type === "SALES"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Venda
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">
                Cliente
              </Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer} required>
                <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px]">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[12px]">
                      {c.name} {c.document ? `(${c.document})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[11px] text-primary uppercase tracking-widest font-bold">
              Itens
            </Label>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-[1fr_80px_120px_100px_40px] gap-2 items-end">
                <Select
                  value={item.productId}
                  onValueChange={(v) => updateItem(index, "productId", v)}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px]">
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-[12px]">
                        {p.sku} - {p.namePt} (Est: {p.currentStock.toString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  required
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                  placeholder="Qtd"
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px]"
                />
                <Input
                  type="number"
                  required
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, "unitPrice", Number(e.target.value))
                  }
                  placeholder="Preço"
                  className="bg-background border-border text-[13px] h-[40px] rounded-[8px]"
                />
                <Select
                  value={item.taxType}
                  onValueChange={(v) => updateItem(index, "taxType", v)}
                  required
                >
                  <SelectTrigger className="bg-background border-border text-[13px] h-[40px] rounded-[8px]">
                    <SelectValue placeholder="IVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IVA_10">10%</SelectItem>
                    <SelectItem value="IVA_5">5%</SelectItem>
                    <SelectItem value="EXENTO">Exento</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700 text-xs mb-3"
                >
                  X
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="text-xs text-primary hover:underline"
            >
              + Adicionar Item
            </button>
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
              {loading ? "Criando..." : "Criar Fatura"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
