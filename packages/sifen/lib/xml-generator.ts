import { create as xmlBuilder } from "xmlbuilder";
import type { Decimal } from "decimal.js";

/**
 * SIFEN rDE XML Generator
 * Generates compliant XML for Paraguay SET/DNIT electronic documents.
 *
 * Based on SIFEN v150 schema for Documento Electrónico (DE).
 */

export interface SifenConfig {
  ruc: string;
  businessName: string;
  tradeName?: string;
  establishment: string;   // Establecimiento (001-999)
  emissionPoint: string;    // Punto de expedición (001-999)
  address: string;
  economicActivity: string;
}

export interface SifenInvoiceItem {
  quantity: number | string | Decimal;
  unitPrice: number | string | Decimal;
  totalPrice: number | string | Decimal;
  description: string;
  taxType: "IVA_10" | "IVA_5" | "EXENTO";
  taxAmount: number | string | Decimal;
  unit: string;
}

export interface SifenInvoice {
  documentType: "FACTURA" | "NOTA_CREDITO" | "NOTA_DEBITO" | "REMISION";
  documentNumber: string;     // Format: EEE-PPP-NNNNNNN (001-001-0000001)
  stamp: string;              // Timbrado number
  issueDate: Date | string;
  totalAmount: number | string | Decimal;
  totalIva10: number | string | Decimal;
  totalIva5: number | string | Decimal;
  totalExento: number | string | Decimal;
  currency: "PYG" | "USD" | "BRL";
  exchangeRate?: number | string | Decimal;
  items: SifenInvoiceItem[];
  // Customer info
  customerDocument: string;   // RUC or CI
  customerName: string;
  customerType: "FISICA" | "JURIDICA";
  customerDocType: "RUC" | "CEDULA" | "PASAPORTE" | "EXTRANJERO";
}

/**
 * Generate rDE XML compliant with SIFEN schema v150.
 * Reference: Manual Técnico SIFEN v150 - SET Paraguay
 */
export function generateRDEXML(
  config: SifenConfig,
  invoice: SifenInvoice
): string {
  const issueDate = new Date(invoice.issueDate);
  const fecha = formatDate(issueDate);
  const hora = formatTime(issueDate);

  // Parse document number: EEE-PPP-NNNNNNN
  const docParts = invoice.documentNumber.split("-");
  const establecimiento = docParts[0] || config.establishment;
  const puntoExpedicion = docParts[1] || config.emissionPoint;
  const numeroDocumento = docParts[2] || invoice.documentNumber;

  const root = xmlBuilder({
    rDE: {
      "@xmlns": "http://setschema.set.gov.py/sifem/cmd/DE_v150.xsd",
      "@xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@xsi:schemaLocation": "http://setschema.set.gov.py/sifem/cmd/DE_v150.xsd",
      "@version": "150",
      "gOpeDE": {
        "iTipDE": getDocumentTypeCode(invoice.documentType),
        "dDesTipDE": getDocumentTypeDesc(invoice.documentType),
        "dCodAut": invoice.stamp,
      },
      "gDatGralOpe": {
        "dFeEmiDE": fecha,
        "dHorEmi": hora,
        "gOpeCom": {
          "iTipTra": "1", // Venta de mercadería
          "dDesTipTra": "Venta de mercadería",
          "iTImp": "1", // IVA
          "dDesTImp": "IVA",
          "cMoneOpe": invoice.currency,
          "dDesMoneOpe": getCurrencyDesc(invoice.currency),
          ...(invoice.currency !== "PYG" && invoice.exchangeRate
            ? {
                "dCondTipCam": "1",
                "dTiCam": String(invoice.exchangeRate),
              }
            : {}),
        },
      },
      "gDatEm": {
        "dRucEm": config.ruc.replace(/\D/g, ""),
        "dNomEm": config.businessName,
        ...(config.tradeName ? { "dNomFanEm": config.tradeName } : {}),
        "dEstEm": establecimiento,
        "dPunExpEm": puntoExpedicion,
        "dDirEm": config.address,
        "dNumPatEm": numeroDocumento,
        "gActEco": {
          "cActEco": config.economicActivity,
          "dDesActEco": config.economicActivity,
        },
      },
      "gDatRec": {
        "iNatRec": invoice.customerType === "JURIDICA" ? "1" : "2",
        "dDesNatRec": invoice.customerType === "JURIDICA" ? "Jurídica" : "Física",
        "dRucRec": invoice.customerDocument.replace(/\D/g, ""),
        "dNomRec": invoice.customerName,
        "iTiRec": getDocTypeCode(invoice.customerDocType),
        "dDesTiRec": invoice.customerDocType,
      },
      "gCamDE": {
        "iTipMov": "1", // Venta
        "dDesTipMov": "Venta",
      },
      "gCamItem": invoice.items.map((item, index) => ({
        "nroLinDet": String(index + 1),
        "gCamItem": {
          "dCodItem": String(index + 1),
          "dDesItem": item.description.substring(0, 200),
          "gCamCant": {
            "dCantProSer": String(item.quantity),
            "gUnMed": {
              "cUniMed": getUnitCode(item.unit),
              "dDesUniMed": item.unit,
            },
          },
          "gCamPreUni": {
            "dPreUniProSer": String(item.unitPrice),
          },
          "gCamTotSub": {
            "dTotBruOpeItem": String(item.totalPrice),
            "gCamIVA": {
              "iAfecIVA": getTaxTypeCode(item.taxType),
              "dDesAfecIVA": getTaxTypeDesc(item.taxType),
              ...(item.taxType !== "EXENTO"
                ? {
                    "dPropIVA": item.taxType === "IVA_10" ? "10" : "5",
                    "dTasaIVA": item.taxType === "IVA_10" ? "10" : "5",
                    "dLiqIVAItem": String(item.taxAmount),
                  }
                : {}),
            },
          },
        },
      })),
      "gTotSub": {
        "dTotOpe": String(invoice.totalAmount),
        "dTotGrav10": invoice.totalIva10 ? String(invoice.totalIva10) : "0",
        "dTotGrav5": invoice.totalIva5 ? String(invoice.totalIva5) : "0",
        "dTotExento": invoice.totalExento ? String(invoice.totalExento) : "0",
        "dTotIVA": String(Number(invoice.totalIva10) + Number(invoice.totalIva5)),
        "dTotGenOp": String(invoice.totalAmount),
      },
    },
  });

  return root.end({ pretty: true, indent: "  " });
}

// Helper functions

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getDocumentTypeCode(type: string): string {
  switch (type) {
    case "FACTURA": return "1";
    case "NOTA_CREDITO": return "2";
    case "NOTA_DEBITO": return "3";
    case "REMISION": return "4";
    default: return "1";
  }
}

function getDocumentTypeDesc(type: string): string {
  switch (type) {
    case "FACTURA": return "Factura Electrónica";
    case "NOTA_CREDITO": return "Nota de Crédito Electrónica";
    case "NOTA_DEBITO": return "Nota de Débito Electrónica";
    case "REMISION": return "Remisión Electrónica";
    default: return "Factura Electrónica";
  }
}

function getCurrencyDesc(currency: string): string {
  switch (currency) {
    case "PYG": return "Guarani";
    case "USD": return "Dólar Americano";
    case "BRL": return "Real Brasileño";
    default: return "Guarani";
  }
}

function getDocTypeCode(docType: string): string {
  switch (docType) {
    case "RUC": return "1";
    case "CEDULA": return "2";
    case "PASAPORTE": return "3";
    case "EXTRANJERO": return "4";
    default: return "1";
  }
}

function getTaxTypeCode(taxType: string): string {
  switch (taxType) {
    case "IVA_10": return "1";
    case "IVA_5": return "2";
    case "EXENTO": return "3";
    default: return "1";
  }
}

function getTaxTypeDesc(taxType: string): string {
  switch (taxType) {
    case "IVA_10": return "Gravado IVA 10%";
    case "IVA_5": return "Gravado IVA 5%";
    case "EXENTO": return "Exento";
    default: return "Gravado IVA 10%";
  }
}

function getUnitCode(unit: string): string {
  const unitMap: Record<string, string> = {
    "un": "77",
    "kg": "71",
    "g": "70",
    "l": "75",
    "m": "73",
    "ton": "74",
  };
  return unitMap[unit.toLowerCase()] || "77";
}

export default generateRDEXML;
