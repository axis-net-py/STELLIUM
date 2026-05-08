import { NextRequest, NextResponse } from 'next/server';
import { pdf } from '@react-pdf/renderer';
import { SifenInvoicePDF } from '@/components/pdf/SifenInvoicePDF';

// ─── Test Stress: Alinhamento Decimal ──────────────

export async function GET(request: NextRequest) {
  try {
    // Create test invoice with extensive decimal values
    const testInvoice = {
      id: 'stress-test-001',
      number: 'INV-2026-9999',
      documentNumber: '001-001-0009999',
      sifenCdc: '0180069560100100100100200201001001001001001001001001001001001001001',
      issuedAt: new Date(),
      type: 'SALE' as const,
      status: 'APPROVED',
      customer: {
        name: 'Teste de Stress - Alinhamento',
        document: '1234567-8',
      },
      items: [
        {
          product: {
            namePt: 'Produto Teste Decimal',
            nameEs: 'Producto de Prueba Decimal',
            sku: 'TEST-001',
          },
          quantity: 1000,
          unitPrice: 12345.6789,
          totalPrice: 12345678.9,
        },
        {
          product: {
            namePt: 'Produto B',
            nameEs: 'Producto B',
            sku: 'TEST-002',
          },
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
        },
        {
          product: {
            namePt: 'Produto C (Negativo)',
            nameEs: 'Producto C (Negativo)',
            sku: 'TEST-003',
          },
          quantity: 5,
          unitPrice: -500.50,
          totalPrice: -2502.50,
        },
      ],
      totalAmount: 12343286.4,
      totalUSD: 1755.23,
      exchangeRate: 7030.50,
    };

    // Generate PDF
    const doc = (
      <SifenInvoicePDF
        invoice={testInvoice}
        language="pt"
        tenantId="stress-test-tenant"
        userId="stress-test-user"
        checksum="abc123def456"
      />
    );

    const asStream = await pdf(doc).toStream();
    const chunks: Buffer[] = [];
    for await (const chunk of asStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="stress-test-alignment.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Stress test PDF error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate stress test PDF' },
      { status: 500 }
    );
  }
}
