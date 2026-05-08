import { getInvoiceById } from "@/app/actions/invoice";
import { SalesInvoicePDF } from "@/components/SalesInvoicePDF";
import { renderToStream } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return new NextResponse("Missing invoice ID", { status: 400 });
  }

  // Buscar fatura com detalhes
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  // Converter Decimal para number para o PDF
  const pdfInvoice = {
    ...invoice,
    totalAmount: Number(invoice.totalAmount),
    items: invoice.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      product: item.product,
    })),
  };

  // Renderizar PDF
  const stream = await renderToStream(
    <SalesInvoicePDF invoice={pdfInvoice as any} />
  );

  // Converter stream para buffer
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);

  // Retornar como PDF
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="fatura-${id.slice(-8)}.pdf"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
