"use client";

import { useRef, useCallback } from "react";

// Thermal Print Helper - "Toque de Mestre"
// Clean iframe after use to prevent memory leaks in browser
// Uses high-contrast CSS injection for thermal printers

interface ThermalPrintProps {
  thermalContentId: string;
  iframeId?: string;
  onPrintComplete?: () => void;
  onPrintError?: (error: Error) => void;
}

export function ThermalPrintHelper({
  thermalContentId,
  iframeId = 'iframeThermalPrint',
  onPrintComplete,
  onPrintError,
}: ThermalPrintProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const printThermal = useCallback(() => {
    try {
      // Get thermal content
      const content = document.getElementById(thermalContentId);
      if (!content) {
        throw new Error(`Element with id "${thermalContentId}" not found`);
      }

      // Get or create iframe
      let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }

      const pri = iframe.contentWindow;
      if (!pri) {
        throw new Error('Failed to access iframe contentWindow');
      }

      // Write content to iframe
      const doc = pri.document;
      doc.open();
      doc.write(content.innerHTML);

      // Inject dynamic high-contrast CSS for thermal printers
      // NO gray tones - only #000000 or #FFFFFF (1-bit color)
      doc.write(`
        <style>
          body { margin: 0; padding: 0; background: white; }
          * { color: black !important; }
          @media print {
            margin: 0;
            padding: 0;
          }
        </style>
      `);

      doc.close();
      pri.focus();

      // Print
      pri.print();

      // "Toque de Mestre": Cleanup after print
      // Remove iframe to prevent memory leak in browser
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
          iframeRef.current = null;
        }
        onPrintComplete?.();
      }, 1000);

    } catch (error: any) {
      console.error('Thermal print error:', error);
      onPrintError?.(error as Error);
    }
  }, [thermalContentId, iframeId, onPrintComplete, onPrintError]);

  return (
    <button
      onClick={printThermal}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px 20px',
        backgroundColor: '#171717',
        color: '#fafafa',
        border: '1px solid #3ecf8e',
        borderRadius: '9999px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'Nunito, sans-serif',
        zIndex: 9999,
      }}
    >
      Print Thermal
    </button>
  );
}

// Unified Print Function
// Call this from client components

export function printDocument(
  type: "thermal" | "laser",
  documentId: string,
  thermalContentId?: string
) {
  if (type === "laser") {
    // Open PDF in new tab via API
    window.open(`/api/v1/invoices/${documentId}/generate`, "_blank");
    return { success: true };
  } else {
    // For thermal: use the master touch approach
    if (!thermalContentId) {
      return { success: false, error: 'thermalContentId is required for thermal printing' };
    }

    const content = document.getElementById(thermalContentId);
    const pri = (document.getElementById('iframeThermalPrint') as HTMLIFrameElement)?.contentWindow;

    if (content && pri) {
      pri.document.open();
      pri.document.write(content.innerHTML);
      // Inject dynamic high-contrast CSS
      pri.document.write(`
        <style>
          body { margin: 0; padding: 0; background: white; }
          * { color: black !important; }
        </style>
      `);
      pri.document.close();
      pri.focus();
      pri.print();

      // Cleanup after print
      setTimeout(() => {
        const iframe = document.getElementById('iframeThermalPrint');
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }

    return { success: true, type: "thermal" };
  }
}
