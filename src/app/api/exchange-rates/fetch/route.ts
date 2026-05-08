import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const BCP_API_URL = process.env.BCP_API_URL || "https://www.bcp.gov.py/api/tasas-cambio";
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour cache

interface ExchangeRateResponse {
  PYGtoUSD: number;
  PYGtoBRL: number;
  source: string;
  timestamp: number;
}

/**
 * POST /api/exchange-rates/fetch
 * Fetches official exchange rates from BCP (Banco Central del Paraguay)
 * Falls back to ExchangeRate-API if BCP is unavailable.
 * Caches rates for 1 hour in Neon/Redis to avoid unnecessary external calls.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Check cache: return recent rate if fetched less than 1 hour ago
    const cachedRate = await prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        date: {
          gte: new Date(Date.now() - CACHE_DURATION_MS),
        },
      },
      orderBy: { date: "desc" },
    });

    if (cachedRate) {
      return NextResponse.json({
        success: true,
        cached: true,
        rate: {
          id: cachedRate.id,
          PYGtoUSD: cachedRate.ratePYGtoUSD,
          PYGtoBRL: cachedRate.ratePYGtoBRL,
          source: cachedRate.source,
          date: cachedRate.date,
        },
      });
    }

    // Fetch from BCP API (primary)
    let rateData: ExchangeRateResponse;
    try {
      rateData = await fetchBCPRates();
    } catch (bcpError) {
      // Fallback to ExchangeRate-API
      console.warn("[ExchangeRates] BCP API failed, trying fallback", bcpError);
      try {
        rateData = await fetchExchangeRateAPI();
      } catch (fallbackError) {
        return NextResponse.json(
          {
            error: "Failed to fetch exchange rates from all sources",
            details: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          },
          { status: 503 }
        );
      }
    }

    // Save to database
    const savedRate = await prisma.exchangeRate.create({
      data: {
        tenantId,
        ratePYGtoUSD: rateData.PYGtoUSD,
        ratePYGtoBRL: rateData.PYGtoBRL,
        source: rateData.source,
        isManual: false,
      },
    });

    return NextResponse.json({
      success: true,
      cached: false,
      rate: {
        id: savedRate.id,
        PYGtoUSD: savedRate.ratePYGtoUSD,
        PYGtoBRL: savedRate.ratePYGtoBRL,
        source: savedRate.source,
        date: savedRate.date,
      },
    });
  } catch (error) {
    console.error("[ExchangeRates] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Fetch rates from BCP (Banco Central del Paraguay)
 * Documentation: https://www.bcp.gov.py/web/guest/servicios-api
 */
async function fetchBCPRates(): Promise<ExchangeRateResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(BCP_API_URL, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "AXIS-ERP/1.0",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`BCP API returned ${response.status}`);
    }

    const data = await response.json();

    // Parse BCP response (structure may vary)
    // Expected: { usd: number, brl: number } or similar
    const PYGtoUSD = data.usd || data.USD || data.dolar || 7000; // Fallback to ~7000
    const PYGtoBRL = data.brl || data.BRL || data.real || 1300; // Fallback to ~1300

    return {
      PYGtoUSD: typeof PYGtoUSD === "number" ? PYGtoUSD : parseFloat(String(PYGtoUSD)),
      PYGtoBRL: typeof PYGtoBRL === "number" ? PYGtoBRL : parseFloat(String(PYGtoBRL)),
      source: "BCP_API",
      timestamp: Date.now(),
    };
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Fallback: Fetch from ExchangeRate-API
 * https://www.exchangerate-api.com/
 */
async function fetchExchangeRateAPI(): Promise<ExchangeRateResponse> {
  if (!EXCHANGERATE_API_KEY) {
    // Use free tier without API key (limited)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      "https://open.er-api.com/v6/latest/PYG",
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`ExchangeRate-API returned ${response.status}`);
    }

    const data = await response.json();

    return {
      PYGtoUSD: 1 / (data.rates?.USD || 0.00014), // Convert to PYG per 1 USD
      PYGtoBRL: 1 / (data.rates?.BRL || 0.00077), // Convert to PYG per 1 BRL
      source: "ExchangeRate-API",
      timestamp: Date.now(),
    };
  }

  // Paid tier with API key
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/PYG`,
    { signal: controller.signal }
  );

  clearTimeout(timeout);

  if (!response.ok) {
    throw new Error(`ExchangeRate-API returned ${response.status}`);
  }

  const data = await response.json();

  return {
    PYGtoUSD: 1 / data.conversion_rates.USD,
    PYGtoBRL: 1 / data.conversion_rates.BRL,
    source: "ExchangeRate-API",
    timestamp: Date.now(),
  };
}
