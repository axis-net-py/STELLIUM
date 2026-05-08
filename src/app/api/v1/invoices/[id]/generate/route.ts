import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { SifenInvoicePDF } from '@/components/pdf/SifenInvoicePDF';
import { prismaWithTenant } from '@axis/core/prisma/client';
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
    const prisma = prismaWithTenant(tenantId);

    // Fetch invoice with all related data
    const invoice = await prisma.commercialInvoice.findUnique({
      where: { id },
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

    // Check permission
    const { checkPermission } = await import('@axis/core/lib/auth/guard');
    const hasPermission = await checkPermission(
      session.user.id,
      'accounting:read',
      tenantId
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare data for PDF
    const invoiceData = {
      id: invoice.id,
      number: invoice.documentNumber,
      documentNumber: invoice.documentNumber,
      sifenCdc: invoice.sifenCdc,
      sifenXmlUrl: invoice.sifenXmlUrl,
      issuedAt: invoice.issuedAt,
      type: invoice.type,
      status: invoice.status,
      customer: {
        name: invoice.customer.name,
        document: invoice.customer.document,
      },
      items: invoice.items.map((item) => ({
        product: {
          namePt: item.product.namePt,
          nameEs: item.product.nameEs,
          sku: item.product.sku,
        },
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      totalAmount: Number(invoice.totalAmount),
      totalUSD: invoice.totalUSD ? Number(invoice.totalUSD) : undefined,
      exchangeRate: invoice.exchangeRate
        ? Number(invoice.exchangeRate)
        : undefined,
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

    const asStream = await pdf(doc).toStream();
    const chunks: Buffer[] = [];
    for await (const chunk of asStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Return PDF
    return new NextResponse(pdfBuffer, {
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
