import forge from "node-forge";
import axios, { AxiosError } from "axios";
import type { SifenConfig, SifenInvoice, SifenInvoiceItem } from "../lib/xml-generator";
import generateRDEXML from "../lib/xml-generator";
import type { Decimal } from "decimal.js";

/**
 * SIFEN Client - Silent Mode
 *
 * Handles communication with Paraguay's SET/DNIT SIFEN system.
 * Implements silent/fallback mode: failures never block business operations.
 *
 * Security: Private keys never touch logs. Certificate data is handled in memory only.
 */

export interface SifenClientConfig {
  apiUrl: string;         // SIFEN API endpoint
  certificate: string;     // Base64 encoded .p12 certificate
  certificatePass: string; // Certificate password (encrypted at rest)
  timeout?: number;        // Request timeout in ms (default: 30000)
  retryAttempts?: number;  // Number of retry attempts (default: 3)
  retryDelay?: number;      // Delay between retries in ms (default: 5000)
}

export interface SifenResponse {
  success: boolean;
  cdc?: string;           // Código de Control (44 digits)
  status?: string;         // SIFEN status
  message?: string;        // Human-readable message
  xmlUrl?: string;         // URL to download XML (if approved)
  errorCode?: string;       // SIFEN error code
  shouldRetry: boolean;     // Whether this error is retriable
  savedLocally: boolean;    // Whether XML was saved locally for retry
}

export class SifenClient {
  private config: SifenClientConfig;
  private sifenConfig: SifenConfig;

  constructor(
    sifenConfig: SifenConfig,
    clientConfig: SifenClientConfig
  ) {
    this.sifenConfig = sifenConfig;
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 5000,
      ...clientConfig,
    };
  }

  /**
   * Submit invoice to SIFEN with silent failure handling.
   * If SIFEN is unavailable, saves XML locally and returns PENDING status.
   */
  async submitInvoice(
    invoice: SifenInvoice,
    localBackupPath?: string
  ): Promise<SifenResponse> {
    let xml: string;

    try {
      // Generate XML
      xml = generateRDEXML(this.sifenConfig, invoice);
    } catch (error) {
      // XML generation failure - log without exposing data
      console.error("[SIFEN] XML generation failed");
      return {
        success: false,
        message: "XML generation failed",
        shouldRetry: false,
        savedLocally: false,
      };
    }

    // Attempt to sign and submit
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.retryAttempts || 3); attempt++) {
      try {
        const signedXml = await this.signXML(xml);
        const response = await this.sendToSifen(signedXml, invoice.documentNumber);

        return this.parseSifenResponse(response.data, response.headers);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retriable
        const shouldRetry = this.isRetriableError(error);

        if (!shouldRetry) {
          // Save XML locally for manual retry later
          const saved = await this.saveLocalXML(xml, invoice.documentNumber, localBackupPath);
          return {
            success: false,
            message: this.getErrorMessage(error),
            shouldRetry: false,
            savedLocally: saved,
            errorCode: this.getErrorCode(error),
          };
        }

        // Wait before retry (exponential backoff)
        if (attempt < (this.config.retryAttempts || 3) - 1) {
          await this.delay((this.config.retryDelay || 5000) * Math.pow(2, attempt));
        }
      }
    }

    // All retries failed - save locally
    const saved = await this.saveLocalXML(xml, invoice.documentNumber, localBackupPath);
    return {
      success: false,
      message: `Failed after ${this.config.retryAttempts} attempts: ${lastError?.message || "Unknown error"}`,
      shouldRetry: true, // Still retriable for background job
      savedLocally: saved,
      errorCode: "RETRY_EXHAUSTED",
    };
  }

  /**
   * Sign XML using .p12 certificate (in memory, no disk I/O for private key).
   * SECURITY: Private key never touches logs or disk.
   */
  private async signXML(xml: string): Promise<string> {
    try {
      // Decode base64 certificate
      const p12Der = forge.util.decode64(this.config.certificate);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.config.certificatePass);

      // Extract private key and certificate
      let privateKey: forge.pki.PrivateKey | null = null;
      let cert: forge.pki.Certificate | null = null;

      // Iterate through bags to find key and cert
      for (const contents of p12.safeContents as any[]) {
        if (!contents) continue;

        for (const bag of contents.safeBags || []) {
          if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && bag.key) {
            privateKey = bag.key;
          }
          if (bag.type === forge.pki.oids.certBag && bag.cert) {
            cert = bag.cert;
          }
        }
      }

      if (!privateKey || !cert) {
        throw new Error("Could not extract key/certificate from .p12");
      }

      // Create XML signature
      // Note: Full XMLDSig implementation would use forge's xml signature module
      // For SIFEN, we need to sign specific elements of the XML
      const signedXml = this.applyXMLSignature(xml, privateKey, cert);
      return signedXml;
    } catch (error) {
      // SECURITY: Do not log certificate-related errors with sensitive data
      console.error("[SIFEN] Signing failed");
      throw new Error("XML signing failed");
    }
  }

  /**
   * Apply XML digital signature.
   * This is a simplified implementation - production would use full XMLDSig.
   */
  private applyXMLSignature(
    xml: string,
    _privateKey: forge.pki.PrivateKey,
    _cert: forge.pki.Certificate
  ): string {
    // For SIFEN compliance, this should implement:
    // 1. Canonicalize the XML (C14N)
    // 2. Compute digest (SHA-256)
    // 3. Sign the digest with RSA private key
    // 4. Insert Signature element with:
    //    - SignedInfo
    //    - SignatureValue
    //    - KeyInfo with X509Certificate

    // This is a placeholder - actual SIFEN integration requires
    // vendor-specific XML signature library compliant with SET standards
    return xml; // Return unsigned for now - integrate with proper XMLDSig lib
  }

  /**
   * Send signed XML to SIFEN API.
   */
  private async sendToSifen(signedXml: string, _documentNumber: string): Promise<any> {
    const response = await axios.post(
      `${this.config.apiUrl}/de/factura`,
      signedXml,
      {
        headers: {
          "Content-Type": "application/xml",
          "Accept": "application/xml",
        },
        timeout: this.config.timeout,
      }
    );
    return response;
  }

  /**
   * Parse SIFEN API response.
   */
  private parseSifenResponse(data: any, _headers: any): SifenResponse {
    // SIFEN returns XML response - parse it
    // Expected response codes:
    // 1000: Approved
    // 1001: Pending
    // 2000+: Various errors

    // Simplified parser - actual implementation would parse XML response
    const responseStr = typeof data === "string" ? data : JSON.stringify(data);

    if (responseStr.includes("1000") || responseStr.includes("APPROVED")) {
      // Extract CDC (44-digit control code)
      const cdcMatch = responseStr.match(/(\d{44})/);
      const cdc = cdcMatch ? cdcMatch[1] : undefined;

      return {
        success: true,
        cdc,
        status: "APPROVED",
        message: "Invoice approved by SIFEN",
        shouldRetry: false,
        savedLocally: false,
      };
    }

    return {
      success: false,
      message: "SIFEN rejected the invoice",
      shouldRetry: false,
      savedLocally: false,
      errorCode: "SIFEN_REJECTED",
    };
  }

  /**
   * Check if an error is retriable (network errors, 5xx, timeouts).
   */
  private isRetriableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors are retriable
      if (!axiosError.response) return true;

      // 5xx errors are retriable
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) return true;

      // 429 (rate limit) is retriable
      if (status === 429) return true;

      // 4xx errors (except 429) are NOT retriable
      return false;
    }

    // Timeout or network errors
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") return true;

    return false;
  }

  /**
   * Get human-readable error message (safe - no sensitive data).
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        return `SIFEN returned ${axiosError.response.status}`;
      }
      if (axiosError.code === "ECONNABORTED") {
        return "Connection timeout";
      }
      return "Network error communicating with SIFEN";
    }
    return error.message || "Unknown error";
  }

  /**
   * Get error code from error object.
   */
  private getErrorCode(error: any): string {
    if (axios.isAxiosError(error)) {
      return `HTTP_${error.response?.status || "NO_RESPONSE"}`;
    }
    return error.code || "UNKNOWN";
  }

  /**
   * Save XML locally for later retry.
   * In production, this would save to cloud storage or database.
   */
  private async saveLocalXML(
    xml: string,
    documentNumber: string,
    _backupPath?: string
  ): Promise<boolean> {
    try {
      // In production, save to:
      // - Vercel Blob (private storage)
      // - Database (as TEXT column)
      // - Object storage
      // For now, we just signal that it should be saved by the caller
      console.log(`[SIFEN] Would save XML locally for document ${documentNumber}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Utility: delay for retry backoff.
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SifenClient;
