import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { SifenInvoicePDF } from '@/components/pdf/SifenInvoicePDF';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// ─── API: Generate SIFEN Invoice PDF ─────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const tenantId = session.user.tenantId;

    // Inline permission check
    const user = await prisma.user.findFirst({ where: { id: session.user.id, tenantId } });
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (user.role !== 'SOVEREIGN' && user.role !== 'ADMIN') {
      const hasPermission = await prisma.permission.findFirst({
        where: { tenantId, role: user.role, action: 'accounting:read' },
      });
      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Fetch invoice with all related data (scoped to tenant)
    const invoice = await prisma.commercialInvoice.findUnique({
      where: { id, tenantId },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Prepare data for PDF
    const invoiceData = {
      id: invoice.id,
      number: invoice.documentNumber || undefined,
      documentNumber: invoice.documentNumber || undefined,
      sifenCdc: invoice.sifenCdc,
      sifenXmlUrl: invoice.sifenXmlUrl,
      issuedAt: invoice.issuedAt,
      type: invoice.type,
      status: invoice.status,
      customer: {
        name: invoice.customer?.name || 'Consumidor Final',
        document: invoice.customer?.document || '00000000',
      },
      items: invoice.items.map((item) => ({
        product: {
          namePt: item.product.namePt,
          nameEs: item.product.nameEs,
          sku: item.product.sku,
        },
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalAmount: Number(invoice.totalAmount),
      totalUSD: invoice.totalUSD ? Number(invoice.totalUSD) : undefined,
      exchangeRate: invoice.exchangeRate ? Number(invoice.exchangeRate) : undefined,
    };

    // Generate PDF
    const doc = (
      <SifenInvoicePDF
        invoice={invoiceData}
        language="pt"
        tenantId={tenantId}
        userId={session.user.id}
        checksum={Buffer.from(JSON.stringify(invoiceData)).toString('base64')}
      />
    );

    const pdfBuffer = await renderToBuffer(doc);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.documentNumber || id}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
