import { addDays, format } from 'date-fns';

export interface ParsedReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  expiryDays: number;
  selected: boolean;
  confidence: 'high' | 'medium' | 'low';
  rawName?: string; // Original OCR text for reference
  needsReview: boolean;
  reviewReason?: string;
  itemType: 'product' | 'coupon' | 'void' | 'fee';
  originalPrice?: number; // Before any discounts
}

export interface ParsedReceipt {
  store: string;
  date: string;
  total: number;
  items: ParsedReceiptItem[];
  warnings?: string[];
  subtotal?: number;
  tax?: number;
  totalValidated: boolean;
  totalMismatch?: number;
  needsReview: boolean;
}

// Store-specific detection patterns
interface StorePattern {
  name: string;
  keywords: string[];
  confidence: number;
}

const STORE_PATTERNS: StorePattern[] = [
  {
    name: 'Walmart',
    keywords: ['walmart', 'save money', 'supercenter', 'wal-mart'],
    confidence: 1.0
  },
  {
    name: 'Costco',
    keywords: ['costco', 'wholesale', 'member'],
    confidence: 1.0
  },
  {
    name: 'Metro',
    keywords: ['metro', 'mon épicier', 'mon epicier'],
    confidence: 1.0
  },
  {
    name: 'IGA',
    keywords: ['iga', 'extra', 'marche', 'marché'],
    confidence: 1.0
  },
  {
    name: 'Whole Foods',
    keywords: ['whole foods', 'wholefds', 'wfm'],
    confidence: 1.0
  },
  {
    name: 'Loblaws',
    keywords: ['loblaws', 'loblaw'],
    confidence: 0.9
  },
  {
    name: 'Sobeys',
    keywords: ['sobeys', 'sobey'],
    confidence: 0.9
  },
  {
    name: 'Safeway',
    keywords: ['safeway'],
    confidence: 0.9
  },
];

// Category keywords for auto-categorization (English + French)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy', 'lait', 'fromage', 'beurre', 'babybel', 'ricot', 'greek', 'grec'],
  'Meat': ['chicken', 'beef', 'pork', 'turkey', 'meat', 'steak', 'bacon', 'sausage', 'poulet', 'boeuf', 'viande', 'jambon', 'ham'],
  'Fruits': ['apple', 'banana', 'orange', 'grape', 'berry', 'melon', 'fruit', 'pomme', 'banan', 'fraise', 'cerise', 'cherr'],
  'Vegetables': ['lettuce', 'tomato', 'carrot', 'broccoli', 'onion', 'pepper', 'veggie', 'vegetable', 'tomate', 'epinard', 'spinach', 'salade'],
  'Bakery': ['bread', 'roll', 'bagel', 'muffin', 'cake', 'pastry', 'pain'],
  'Beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'drink', 'jus', 'eau'],
  'Snacks': ['chip', 'cookie', 'cracker', 'candy', 'snack'],
  'Eggs': ['egg', 'oeuf', 'oeufs'],
};

// Default expiry days by category
const CATEGORY_EXPIRY: Record<string, number> = {
  'Dairy': 7,
  'Meat': 3,
  'Fruits': 5,
  'Vegetables': 7,
  'Bakery': 5,
  'Beverages': 14,
  'Snacks': 30,
  'Eggs': 14,
  'Other': 30,
};

function detectStore(text: string): string {
  const lowerText = text.toLowerCase();
  
  // Check for store-specific keywords
  for (const pattern of STORE_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (lowerText.includes(keyword)) {
        return pattern.name;
      }
    }
  }
  
  return 'Unknown Store';
}

function cleanItemName(rawName: string): string {
  let name = rawName;
  
  // Remove item codes (5+ consecutive digits at start)
  name = name.replace(/^\d{5,}\s*/, '');
  
  // Remove transaction codes
  name = name.replace(/TP[A-Z]?\/\d+/g, '');
  name = name.replace(/TRN\/\d+/g, '');
  
  // Remove common noise
  name = name.replace(/\s*-?FP\s*$/i, ''); // Remove FP flag
  
  // Clean whitespace
  name = name.replace(/\s+/g, ' ').trim();
  
  // Capitalize first letter of each word
  name = name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return name;
}

function calculateConfidence(
  name: string,
  price: number,
  category: string
): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Check name quality
  if (name.length >= 5 && /^[A-Za-z\s]+$/.test(name)) {
    score += 3;
  } else if (name.length >= 3) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Check if price is reasonable
  if (price > 0.50 && price < 50) {
    score += 2;
  } else if (price > 0 && price < 200) {
    score += 1;
  }
  
  // Check if category was detected
  if (category !== 'Other') {
    score += 2;
  }
  
  if (score >= 6) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

function detectDate(text: string): string {
  // Try various date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,  // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,    // YYYY/MM/DD
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return format(new Date(), 'MMM dd, yyyy'); // Return today's date for now
    }
  }
  
  return format(new Date(), 'MMM dd, yyyy');
}

function detectCategory(itemName: string): string {
  const lowerName = itemName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Other';
}

function normalizeQuebecDecimal(priceStr: string): number {
  // Quebec receipts often use comma as decimal separator
  // Examples: "12,99" or "12.99"
  const cleaned = priceStr.replace(/[^\d,.]/g, '');
  
  // If has comma, treat as decimal separator
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.'));
  }
  
  return parseFloat(cleaned);
}

function detectItemType(line: string, name: string): 'product' | 'coupon' | 'void' | 'fee' {
  const lowerLine = line.toLowerCase();
  const lowerName = name.toLowerCase();
  
  // Detect coupons
  if (lowerLine.includes('coupon') || lowerLine.includes('rabais') || 
      lowerName.includes('coupon') || lowerName.includes('rabais')) {
    return 'coupon';
  }
  
  // Detect voided items
  if (lowerLine.includes('void') || lowerLine.includes('annul') || 
      lowerLine.includes('cancel')) {
    return 'void';
  }
  
  // Detect fees
  if (lowerName.includes('fee') || lowerName.includes('frais') || 
      lowerName.includes('deposit') || lowerName.includes('consigne')) {
    return 'fee';
  }
  
  return 'product';
}

function validateItemQuality(name: string, price: number): { needsReview: boolean; reason?: string } {
  // Check for suspicious patterns
  if (name.length < 3) {
    return { needsReview: true, reason: 'Name too short' };
  }
  
  if (/^[\d\s]+$/.test(name)) {
    return { needsReview: true, reason: 'Name contains only numbers' };
  }
  
  if (name.split(' ').length > 10) {
    return { needsReview: true, reason: 'Name too long or malformed' };
  }
  
  if (price < 0.50) {
    return { needsReview: true, reason: 'Price suspiciously low' };
  }
  
  if (price > 150) {
    return { needsReview: true, reason: 'Price suspiciously high' };
  }
  
  // Check for excessive special characters
  const specialChars = (name.match(/[^a-zA-Z0-9\s\-']/g) || []).length;
  if (specialChars > 3) {
    return { needsReview: true, reason: 'Too many special characters' };
  }
  
  return { needsReview: false };
}

function parseItems(text: string, store: string): ParsedReceiptItem[] {
  console.log('=== ROBUST PARSING START ===');
  
  const lines = text.split(/\r?\n/);
  console.log('Total lines to process:', lines.length);
  
  const items: ParsedReceiptItem[] = [];
  
  // Enhanced skip words
  const skipWords = [
    'TOTAL', 'TAX', 'TAXE', 'TPS', 'TVQ', 'HST', 'GST', 'PST',
    'MEMBER', 'APPROVED', 'THANK', 'WAREHOUSE',
    'MASTER', 'NOMBRE', 'SOUS', 'PAYMENT', 'CASH', 'CARD',
    'VISA', 'DEBIT', 'CREDIT', 'CHANGE', 'TENDER', 'BALANCE'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.length < 5) continue;
    
    // Skip footer/header lines
    if (skipWords.some(word => line.toUpperCase().includes(word))) {
      continue;
    }
    
    // Enhanced price pattern: supports both comma and dot decimals
    const priceRegex = /(\d{1,3})[,\.](\d{2})/g;
    const priceMatches = [...line.matchAll(priceRegex)];
    
    if (priceMatches.length === 0) continue;
    
    // Use the last price match (typically the actual price, not a code)
    const priceMatch = priceMatches[priceMatches.length - 1];
    const price = normalizeQuebecDecimal(priceMatch[0]);
    
    // Validate price range
    if (price < 0.50 || price > 200) {
      console.log(`Skipping unreasonable price: $${price}`);
      continue;
    }
    
    // Extract name
    const priceIndex = line.lastIndexOf(priceMatch[0]);
    let rawName = line.substring(0, priceIndex).trim();
    const name = cleanItemName(rawName);
    
    if (name.length < 3 || /^\d+$/.test(name)) {
      console.log(`Skipping invalid name: "${name}"`);
      continue;
    }
    
    // Detect item type
    const itemType = detectItemType(line, name);
    
    // Skip void items (they're canceled)
    if (itemType === 'void') {
      console.log(`Skipping void item: "${name}"`);
      continue;
    }
    
    // Detect category
    const category = detectCategory(name);
    
    // Validate item quality
    const qualityCheck = validateItemQuality(name, price);
    
    // Calculate confidence
    const confidence = calculateConfidence(name, price, category);
    
    const item: ParsedReceiptItem = {
      id: Math.random().toString(36).substring(7),
      name: name,
      rawName: rawName,
      price: itemType === 'coupon' ? -Math.abs(price) : price,
      quantity: 1,
      category: category,
      expiryDays: CATEGORY_EXPIRY[category] || 30,
      selected: itemType === 'product', // Auto-select products only
      confidence: confidence,
      needsReview: qualityCheck.needsReview,
      reviewReason: qualityCheck.reason,
      itemType: itemType,
    };
    
    items.push(item);
    console.log(`✓ Extracted: "${name}" - $${price} (${itemType}, ${category}, ${confidence} confidence)${qualityCheck.needsReview ? ' [NEEDS REVIEW]' : ''}`);
  }
  
  console.log('=== PARSING COMPLETE ===');
  console.log('Total items extracted:', items.length);
  console.log('Items needing review:', items.filter(i => i.needsReview).length);
  
  return items;
}

function extractFinancials(text: string): { total: number; subtotal?: number; tax?: number } {
  const lines = text.split(/\r?\n/);
  let total = 0;
  let subtotal: number | undefined;
  let tax: number | undefined;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Match total (with various patterns)
    if (/total/i.test(line) && !/sous.*total|sub.*total/i.test(line)) {
      const match = line.match(/(\d{1,4})[,\.](\d{2})/);
      if (match) {
        total = normalizeQuebecDecimal(match[0]);
      }
    }
    
    // Match subtotal
    if (/sous.*total|sub.*total/i.test(line)) {
      const match = line.match(/(\d{1,4})[,\.](\d{2})/);
      if (match) {
        subtotal = normalizeQuebecDecimal(match[0]);
      }
    }
    
    // Match tax (TPS, TVQ, HST, GST, PST, TAX)
    if (/\b(tps|tvq|hst|gst|pst|tax)\b/i.test(line) && !/total/i.test(line)) {
      const match = line.match(/(\d{1,3})[,\.](\d{2})/);
      if (match) {
        const taxAmount = normalizeQuebecDecimal(match[0]);
        tax = (tax || 0) + taxAmount;
      }
    }
  }
  
  return { total, subtotal, tax };
}

function validateTotal(items: ParsedReceiptItem[], total: number, subtotal?: number): { valid: boolean; mismatch?: number } {
  // Calculate sum of all products (excluding coupons, fees)
  const productSum = items
    .filter(item => item.itemType === 'product')
    .reduce((sum, item) => sum + item.price, 0);
  
  // If we have a subtotal, compare against it
  const compareValue = subtotal || total;
  const calculatedTotal = productSum;
  
  const mismatch = Math.abs(calculatedTotal - compareValue);
  
  // Allow 5% tolerance or $2 difference (whichever is larger)
  const tolerance = Math.max(compareValue * 0.05, 2.0);
  
  const valid = mismatch <= tolerance;
  
  console.log('=== TOTAL VALIDATION ===');
  console.log('Receipt total:', total);
  console.log('Receipt subtotal:', subtotal);
  console.log('Calculated product sum:', productSum.toFixed(2));
  console.log('Mismatch:', mismatch.toFixed(2));
  console.log('Valid:', valid);
  
  return { valid, mismatch: valid ? undefined : mismatch };
}

export function parseReceiptText(ocrText: string): ParsedReceipt {
  console.log('=== ENHANCED OCR PARSING ===');
  console.log('Raw text (first 200 chars):', ocrText.substring(0, 200));
  console.log('Total text length:', ocrText.length);
  console.log('Total lines:', ocrText.split('\n').length);
  
  // Test if basic patterns exist
  const hasPrices = /\d+[,\.]\d{2}/.test(ocrText);
  const hasItemCodes = /\d{7}/.test(ocrText);
  const hasCommonWords = /GAIN|FRAISE|JAMBON|POMME|CERISE|TOMATE|BANAN|YOGURT|YOG|MILK|LAIT|CHEESE|FROMAGE/i.test(ocrText);
  
  console.log('Has prices:', hasPrices);
  console.log('Has item codes (7 digits):', hasItemCodes);
  console.log('Has food words:', hasCommonWords);
  
  // Find ALL prices
  const allPrices = [...ocrText.matchAll(/\d+[,\.]\d{2}/g)];
  console.log('All prices found:', allPrices.length);
  console.log('Prices:', allPrices.slice(0, 10).map(m => m[0]));
  
  // Find ALL item codes
  const allCodes = [...ocrText.matchAll(/\d{7}/g)];
  console.log('All 7-digit codes found:', allCodes.length);
  console.log('Codes:', allCodes.slice(0, 10).map(m => m[0]));
  
  const store = detectStore(ocrText);
  const date = detectDate(ocrText);
  const items = parseItems(ocrText, store);
  const financials = extractFinancials(ocrText);
  const validation = validateTotal(items, financials.total, financials.subtotal);
  
  const needsReview = !validation.valid || items.some(item => item.needsReview);
  
  console.log('=== PARSING RESULTS ===');
  console.log('Store detected:', store);
  console.log('Items extracted:', items.length);
  console.log('Total validated:', validation.valid);
  console.log('Needs review:', needsReview);
  
  items.forEach((item, i) => {
    console.log(`Item ${i + 1}:`, {
      name: item.name,
      price: item.price,
      category: item.category,
      confidence: item.confidence,
      itemType: item.itemType,
      needsReview: item.needsReview,
      reviewReason: item.reviewReason
    });
  });
  console.log('=== END DEBUG ===');
  
  return {
    store,
    date,
    total: financials.total,
    subtotal: financials.subtotal,
    tax: financials.tax,
    items,
    totalValidated: validation.valid,
    totalMismatch: validation.mismatch,
    needsReview,
  };
}
