// ─── Thermal Printer Styles - High-Contrast 1-bit Mode ─────────
// For 80mm (receipt) and 50mm (label) thermal printers
// Avoid gray tones - use only #000000 or #FFFFFF

export const THERMAL_WIDTHS = {
  RECEIPT_80MM: 227, // 80mm in points
  LABEL_50MM: 142, // 50mm in points
};

export const thermalColors = {
  black: '#000000',
  white: '#FFFFFF',
  // No gray tones - causes pixelation in thermal printers
};

// ─── 80mm Receipt Styles ───────────────────────────────
export const receipt80mmStyles = {
  page: {
    width: THERMAL_WIDTHS.RECEIPT_80MM,
    padding: 10,
    backgroundColor: thermalColors.white,
    color: thermalColors.black,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: thermalColors.black,
    paddingBottom: 6,
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 7,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  section: {
    marginVertical: 6,
  },
  row: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 2,
  },
  totalRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    borderTopWidth: 1,
    borderTopColor: thermalColors.black,
    paddingTop: 4,
    marginTop: 4,
    fontFamily: 'Helvetica-Bold',
  },
  barcodeContainer: {
    alignItems: 'center' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  barcodeText: {
    fontFamily: 'Courier',
    fontSize: 10,
    textAlign: 'center' as const,
    letterSpacing: 1,
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: thermalColors.black,
    paddingTop: 4,
  },
};

// ─── 50mm Label Styles ─────────────────────────────────
export const label50mmStyles = {
  page: {
    width: THERMAL_WIDTHS.LABEL_50MM,
    padding: 8,
    backgroundColor: thermalColors.white,
    color: thermalColors.black,
    fontFamily: 'Helvetica',
    fontSize: 7,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: thermalColors.black,
    paddingBottom: 4,
  },
  productName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  skuContainer: {
    alignItems: 'center' as const,
    marginVertical: 6,
  },
  skuBarcode: {
    fontFamily: 'Courier',
    fontSize: 12,
    textAlign: 'center' as const,
    letterSpacing: 2,
  },
  priceSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: thermalColors.black,
    paddingTop: 3,
  },
  pricePYG: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  priceUSD: {
    fontFamily: 'Helvetica',
    fontSize: 6,
    opacity: 0.8,
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: 5,
    marginTop: 6,
  },
};
