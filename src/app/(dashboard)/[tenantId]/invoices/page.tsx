import { getInvoices } from "@/app/actions/invoice";
import { CommercialInvoiceSheet } from "@/components/CommercialInvoiceSheet";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR, es } from "date-fns/locale";

export default async function InvoicesPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) redirect("/login");
  const tenantId = session.user.tenantId;

  const { tenantId: paramTenantId } = await params;
  const resolvedTenantId = paramTenantId || tenantId;
  const invoices = await getInvoices();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
          <p className="text-muted-foreground text-sm">
            Faturas de Compra e Venda
          </p>
        </div>
        <CommercialInvoiceSheet tenantId={tenantId} />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhuma fatura criada. Clique em "Nova Fatura" para começar.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Badge variant={inv.direction === "PURCHASE" ? "default" : "secondary"}>
                      {inv.direction === "PURCHASE" ? "Compra" : "Venda"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {inv.customer?.name ?? "N/A"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.issuedAt), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "APPROVED"
                          ? "default"
                          : inv.status === "CANCELLED"
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {inv.status === "APPROVED"
                        ? "Aprovada"
                        : inv.status === "CANCELLED"
                        ? "Cancelada"
                        : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(inv.totalAmount))}
                  </TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      className="text-primary hover:underline text-xs"
                    >
                      PDF
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
