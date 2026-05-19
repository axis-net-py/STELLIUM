"use client";

import React from "react";
import { Label50mm } from "@/components/thermal/Label50mm";
import { ThermalPrintHelper } from "@/components/thermal/ThermalPrintHelper";

// ─── Test Page: Thermal Label Scannability ────

export default function ThermalTestPage() {
  return (
    <div className="min-h-screen bg-[#171717] text-[#fafafa] p-8">
      <h1 className="text-xl font-semibold mb-6 flex items-center gap-2">
        Teste de Escaneabilidade Térmica
      </h1>

      <p className="text-sm text-[#fafafa]/40 mb-8">
        Gere uma etiqueta 50mm e teste a leitura do código de barras/SKU com um scanner ou celular.
        O código deve ser composto por pixels pretos puros (sem tons de cinza).
      </p>

      {/* Label Preview */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-white/60 mb-4">Pré-visualização (Escala 1:1)</h2>
        <div
          id="thermal-label-content"
          style={{
            width: '142pt',
            backgroundColor: '#FFFFFF',
            color: '#000000',
            padding: '8pt',
            fontFamily: 'Helvetica',
            fontSize: '7pt',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '6pt', borderBottom: '1pt solid #000', paddingBottom: '4pt' }}>
            <div style={{ fontFamily: 'Helvetica-Bold', fontSize: '9pt' }}>AXIS</div>
            <div style={{ fontSize: '5pt' }}>ETIQUETA DE PRODUTO</div>
          </div>

          <div style={{ marginTop: '6pt', marginBottom: '6pt', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Helvetica-Bold', fontSize: '9pt' }}>
              Produto Teste - SKU Scanner
            </div>
          </div>

          <div style={{ alignItems: 'center', marginTop: '8pt', marginBottom: '4pt', borderTop: '1pt solid #000', paddingTop: '6pt' }}>
            <div style={{ fontFamily: 'Courier', fontSize: '12pt', textAlign: 'center', letterSpacing: '2pt' }}>
              TEST-SCAN-001
            </div>
            <div style={{ fontSize: '5pt', marginTop: '2pt', opacity: 0.5 }}>SKU</div>
          </div>

          <div style={{ marginTop: '6pt', borderTop: '1pt solid #000', paddingTop: '3pt' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontFamily: 'Helvetica-Bold' }}>PYG: </span>
                <span style={{ fontFamily: 'Courier' }}>Gs. 1.000.000</span>
              </div>
              <div>
                <span style={{ fontSize: '6pt', opacity: 0.7 }}>USD: </span>
                <span style={{ fontFamily: 'Courier', fontSize: '6pt' }}>USD 142.86</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '5pt', marginTop: '6pt', borderTop: '1pt solid #000', paddingTop: '4pt' }}>
            AXIS ERP
          </div>
        </div>
      </div>

      {/* ThermalPrintHelper */}
      <ThermalPrintHelper
        thermalContentId="thermal-label-content"
        onPrintComplete={() => alert('Impressão térmica concluída!')}
        onPrintError={(err) => alert('Erro: ' + err.message)}
      />

      {/* Instructions */}
      <div className="mt-8 border border-[#3ecf8e]/30 bg-[#3ecf8e]/5 rounded-sm p-4">
        <h3 className="text-sm font-medium text-[#fafafa] mb-2">Instruções de Teste</h3>
        <ul className="text-xs text-[#fafafa]/60 space-y-1 list-disc list-inside">
          <li>Use um scanner de mão ou o celular para ler o SKU: TEST-SCAN-001</li>
          <li>O código deve ser 100% preto (sem anti-aliasing/cinza)</li>
          <li>Teste em impressoras térmicas de 50mm</li>
          <li>Verifique se não há pixels cinza (causam efeito pixelado)</li>
        </ul>
      </div>
    </div>
  );
}
