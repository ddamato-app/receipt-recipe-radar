import type { ParsedReceipt, ReceiptItem, ReceiptDiscount, Money } from '@/types/receipt';

// Normalization helper for money values
const normMoney = (s: string): Money => {
  // Remove spaces, replace dots (thousands separator), then comma to decimal
  return parseFloat(s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'));
};

// Regex patterns (Quebec format: comma as decimal, with/without - for discounts)
const PRICE = /(?:\$)?\d{1,4}[.,]\d{2}(?!\w)/g;
const COUPON = /\b(?:TPR|TPO|COUPON|RABAIS|REDUC|PROMO)[^0-9]*([\-+]?\d+[.,]\d{2})[\-]?\s*F?P?\b/i;
const DISCOUNT_TRAILING_MINUS = /(\d+[.,]\d{2})[\-]\s*F?P?\b/; // e.g., 3,80-FP
const VOID = /\bANNUL\.?\b/i;
const TOTALS = {
  subtotal: /\b(?:SOUS[- ]?TOTAL|SUBTOTAL)\b.*?(\d{1,4}[.,]\d{2})/i,
  tax: /\b(?:TAXE|TPS|TVQ|TAX)\b.*?(\d{1,4}[.,]\d{2})/i,
  total: /\bTOTAL\b.*?(\d{1,4}[.,]\d{2})/i,
};

// SKU and code patterns to strip
const SKU_PATTERNS = [
  /#?\d{4,}/,           // #12345 or 12345
  /\bPLU\s*\d+/i,       // PLU 123
  /\bTP[RO]\/\d+/i,     // TPR/123, TPO/123
  /\bFP$/,              // Trailing FP
];

// Quantity patterns
const QTY_PATTERNS = [
  { regex: /(\d+)\s*@\s*(\d+[.,]\d{2})/, group: 1, priceGroup: 2, hasUnitPrice: true }, // 3 @ 9.99 (qty @ unit_price)
  { regex: /(\d+)\s*[xX×]/, group: 1 },                    // 2x
  { regex: /[xX×]\s*(\d+)/, group: 1 },                    // x2
  { regex: /@\s*(\d+[.,]\d{2})/, group: 1, isPrice: true }, // @2.99 (unit price only)
  { regex: /(\d+(?:[.,]\d+)?)\s*(kg|lb|g|ml|l)\b/i, group: 1, hasUnit: true }, // 1.5kg, 500g
];

// OCR correction mapping
const OCR_CORRECTIONS: { [key: string]: string } = {
  'O': '0',
  'I': '1',
  'l': '1',
  'S': '5',
  'B': '8',
  'VV': 'W',
};

/**
 * Parse receipt text into structured data
 */
export function parseReceipt(
  ocrText: string,
  hints?: { vendor?: string }
): ParsedReceipt {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
  
  const items: ReceiptItem[] = [];
  const discounts: ReceiptDiscount[] = [];
  const reviewReasons: string[] = [];
  let needsReview = false;
  
  console.log('=== ADVANCED PARSING START ===');
  console.log('Total lines:', lines.length);
  
  // Extract totals
  const subtotal = extractTotal(ocrText, TOTALS.subtotal);
  const taxTotal = extractTotal(ocrText, TOTALS.tax);
  const total = extractTotal(ocrText, TOTALS.total);
  
  console.log('Extracted totals - Subtotal:', subtotal, 'Tax:', taxTotal, 'Total:', total);
  
  // Detect vendor from text if not provided
  const vendor = hints?.vendor || detectVendor(ocrText);
  console.log('Detected vendor:', vendor);
  
  // Detect date
  const date = detectDate(ocrText);
  console.log('Detected date:', date);
  
  // Parse each line, tracking void blocks
  const voidIndices = new Set<number>();
  
  // First pass: identify ANNUL lines and mark adjacent lines as voided
  lines.forEach((line, idx) => {
    if (VOID.test(line)) {
      voidIndices.add(idx);
      // Mark previous line as voided (ANNUL typically voids the line above)
      if (idx > 0) voidIndices.add(idx - 1);
      console.log('⊗ ANNUL detected at line', idx, '- voiding lines:', idx - 1, idx);
    }
  });
  
  // Second pass: parse non-voided lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip voided lines
    if (voidIndices.has(i)) {
      console.log('⊗ Skipping voided line:', line);
      continue;
    }
    
    // Check for discount/coupon lines (match both formats: -3,80 FP and 3,80-FP)
    const couponMatch = line.match(COUPON);
    const trailingMinusMatch = line.match(DISCOUNT_TRAILING_MINUS);
    
    if (couponMatch || trailingMinusMatch) {
      const matched = couponMatch || trailingMinusMatch;
      const amountStr = matched![1];
      const amount = -Math.abs(normMoney(amountStr)); // Always negative
      const label = line.replace(matched![0], '').trim() || 'Discount';
      
      discounts.push({
        label: cleanName(label),
        amount,
      });
      
      console.log('💰 Found discount:', label, amount);
      continue;
    }
    
    // Check for item lines (contain prices)
    const prices = Array.from(line.matchAll(PRICE));
    
    if (prices.length > 0) {
      // Take rightmost price as item total
      const priceMatch = prices[prices.length - 1];
      const priceTotal = normMoney(priceMatch[0]);
      
      // Extract name (text before first price)
      const firstPriceIndex = line.indexOf(prices[0][0]);
      let name = line.substring(0, firstPriceIndex).trim();
      
      // Clean the name
      name = cleanName(name);
      name = expandAbbreviations(name);
      name = fixOCRErrors(name);
      
      // Extract quantity and unit (only if explicitly shown like "2 x 12,49")
      // Duplicate items on separate lines should NOT be combined
      const qtyInfo = extractQuantity(line);
      
      // Calculate unit price if we have explicit quantity
      let unitPrice: Money | undefined;
      if (qtyInfo.qty > 1 && qtyInfo.explicit) {
        unitPrice = priceTotal / qtyInfo.qty;
      } else if (qtyInfo.unitPrice) {
        unitPrice = qtyInfo.unitPrice;
      }
      
      // Validation
      let itemNeedsReview = false;
      if (!name || name.length < 2) {
        itemNeedsReview = true;
        needsReview = true;
        reviewReasons.push(`Item with unclear name: "${line}"`);
      }
      
      if (priceTotal <= 0) {
        itemNeedsReview = true;
        needsReview = true;
        reviewReasons.push(`Item with invalid price: ${priceTotal}`);
      }
      
      const item: ReceiptItem = {
        name,
        qty: qtyInfo.qty,
        price_total: priceTotal,
        unit_price: unitPrice,
        unit: qtyInfo.unit,
        needs_review: itemNeedsReview,
        category: categorizeItem(name),
      };
      
      items.push(item);
      
      console.log(`✓ Item: ${name} - $${priceTotal} (${qtyInfo.qty}${qtyInfo.unit || ''}${itemNeedsReview ? ' [REVIEW]' : ''})`);
    }
  }
  
  // Validate totals
  const sumItems = items.reduce((sum, item) => sum + item.price_total, 0);
  const sumDiscounts = discounts.reduce((sum, disc) => sum + disc.amount, 0);
  
  let calculatedTotal = sumItems + sumDiscounts;
  if (taxTotal) {
    calculatedTotal += taxTotal;
  }
  
  console.log('=== VALIDATION ===');
  console.log('Sum of items:', sumItems.toFixed(2));
  console.log('Sum of discounts:', sumDiscounts.toFixed(2));
  console.log('Tax:', taxTotal?.toFixed(2) || 'N/A');
  console.log('Calculated total:', calculatedTotal.toFixed(2));
  console.log('Receipt total:', total?.toFixed(2) || 'N/A');
  
  // Check if total matches (within 1% tolerance)
  if (total && Math.abs(calculatedTotal - total) > total * 0.01) {
    needsReview = true;
    const diff = (calculatedTotal - total).toFixed(2);
    reviewReasons.push(
      `Total mismatch: calculated $${calculatedTotal.toFixed(2)} vs receipt $${total.toFixed(2)} (diff: $${diff})`
    );
    console.log('⚠️ Total validation failed');
  } else {
    console.log('✓ Total validation passed');
  }
  
  // Validate subtotal if present
  if (subtotal && Math.abs(sumItems + sumDiscounts - subtotal) > subtotal * 0.01) {
    needsReview = true;
    reviewReasons.push(
      `Subtotal mismatch: calculated $${(sumItems + sumDiscounts).toFixed(2)} vs receipt $${subtotal.toFixed(2)}`
    );
    console.log('⚠️ Subtotal validation failed');
  }
  
  console.log('=== PARSING COMPLETE ===');
  console.log('Items:', items.length);
  console.log('Discounts:', discounts.length);
  console.log('Needs review:', needsReview);
  console.log('Review reasons:', reviewReasons);
  
  return {
    vendor,
    date,
    currency: 'CAD',
    items,
    discounts,
    subtotal,
    tax_total: taxTotal,
    total,
    raw_text: ocrText,
    needs_review: needsReview,
    review_reasons: reviewReasons,
  };
}

/**
 * Extract total amount using regex
 */
function extractTotal(text: string, regex: RegExp): Money | undefined {
  const match = text.match(regex);
  if (match && match[1]) {
    return normMoney(match[1]);
  }
  return undefined;
}

/**
 * Detect vendor from text
 */
function detectVendor(text: string): string | undefined {
  const vendors = [
    { pattern: /\bMETRO\b/i, name: 'Metro' },
    { pattern: /\bCOSTCO\b/i, name: 'Costco' },
    { pattern: /\bIGA\b/i, name: 'IGA' },
    { pattern: /\bMAXI\b/i, name: 'Maxi' },
    { pattern: /\bPROVIGO\b/i, name: 'Provigo' },
    { pattern: /\bLOBLAWS?\b/i, name: 'Loblaws' },
    { pattern: /\bWALMART\b/i, name: 'Walmart' },
    { pattern: /\bSOBEYS\b/i, name: 'Sobeys' },
  ];
  
  for (const { pattern, name } of vendors) {
    if (pattern.test(text)) {
      return name;
    }
  }
  
  return undefined;
}

/**
 * Detect date from text
 */
function detectDate(text: string): string | undefined {
  // Common date patterns
  const patterns = [
    /(\d{4})[/-](\d{2})[/-](\d{2})/,       // 2024-10-27, 2024/10/27
    /(\d{2})[/-](\d{2})[/-](\d{4})/,       // 27-10-2024, 27/10/2024
    /(\d{2})[/-](\d{2})[/-](\d{2})/,       // 27-10-24, 27/10/24
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Try to parse and format as YYYY-MM-DD
      if (match[1].length === 4) {
        // Format: YYYY-MM-DD
        return `${match[1]}-${match[2]}-${match[3]}`;
      } else if (match[3].length === 4) {
        // Format: DD-MM-YYYY
        return `${match[3]}-${match[2]}-${match[1]}`;
      } else {
        // Format: DD-MM-YY, assume 20YY
        return `20${match[3]}-${match[2]}-${match[1]}`;
      }
    }
  }
  
  return undefined;
}

/**
 * Clean item name by removing SKUs and codes
 */
function cleanName(name: string): string {
  let cleaned = name;
  
  // Remove SKU patterns
  for (const pattern of SKU_PATTERNS) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Expand common abbreviations
 */
function expandAbbreviations(name: string): string {
  return name
    .replace(/\bKS\b/g, 'Kirkland Signature')
    .replace(/\bORG\b/gi, 'Organic')
    .replace(/\bNAT\b/gi, 'Natural');
}

/**
 * Fix common OCR errors in price-like contexts
 */
function fixOCRErrors(text: string): string {
  let fixed = text;
  
  // Apply corrections for digit-like characters near numbers
  for (const [wrong, correct] of Object.entries(OCR_CORRECTIONS)) {
    // Only correct when followed by digits (price context)
    const pricePattern = new RegExp(`${wrong}(?=[\\d.,])`, 'g');
    fixed = fixed.replace(pricePattern, correct);
  }
  
  return fixed;
}

/**
 * Extract quantity and unit information
 * Returns explicit=true only when quantity is explicitly shown (e.g., "2 x" or "2x")
 */
function extractQuantity(line: string): {
  qty: number;
  unit?: string;
  unitPrice?: Money;
  explicit?: boolean;
} {
  let qty = 1;
  let unit: string | undefined;
  let unitPrice: Money | undefined;
  let explicit = false;
  
  for (const pattern of QTY_PATTERNS) {
    const { regex, group, isPrice, hasUnit, hasUnitPrice, priceGroup } = pattern as any;
    const match = line.match(regex);
    if (match && match[group]) {
      if (isPrice) {
        unitPrice = normMoney(match[group]);
      } else if (hasUnitPrice && priceGroup && match[priceGroup]) {
        // Pattern like "3 @ 9.99" - extract both qty and unit price
        qty = parseFloat(match[group].replace(',', '.'));
        unitPrice = normMoney(match[priceGroup]);
        explicit = true;
      } else {
        qty = parseFloat(match[group].replace(',', '.'));
        explicit = true; // Quantity was explicitly shown
        
        if (hasUnit && match[group + 1]) {
          unit = match[group + 1].toLowerCase();
        }
      }
      break;
    }
  }
  
  return { qty, unit, unitPrice, explicit };
}

/**
 * Categorize item based on name
 */
function categorizeItem(name: string): string | undefined {
  const categories = [
    {
      category: 'produce',
      keywords: ['banana', 'apple', 'orange', 'lettuce', 'tomato', 'potato', 'onion', 'carrot', 'fruit', 'veggie', 'vegetable'],
    },
    {
      category: 'dairy',
      keywords: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
    },
    {
      category: 'meat',
      keywords: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'meat', 'steak'],
    },
    {
      category: 'frozen',
      keywords: ['frozen', 'ice cream', 'pizza'],
    },
    {
      category: 'pantry',
      keywords: ['bread', 'pasta', 'rice', 'cereal', 'flour', 'sugar', 'oil', 'sauce'],
    },
    {
      category: 'snacks',
      keywords: ['chips', 'cookie', 'candy', 'chocolate', 'snack'],
    },
    {
      category: 'household',
      keywords: ['soap', 'detergent', 'paper', 'towel', 'cleaner', 'trash', 'bag'],
    },
  ];
  
  const lowerName = name.toLowerCase();
  
  for (const { category, keywords } of categories) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return undefined;
}
