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
}

export interface ParsedReceipt {
  store: string;
  date: string;
  total: number;
  items: ParsedReceiptItem[];
  warnings?: string[];
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

function cleanOCRErrors(text: string): string {
  // Fix common OCR mistakes in receipts
  const fixes: Record<string, string> = {
    'FRAT5ES': 'FRAISES',
    'FRATSEE': 'FRAISES',
    'FRATS': 'FRAIS',
    'CUTT': 'CUIT',
    'K5': 'KS',
    'NOG': 'YOG',
    'GREE': 'GREC',
    'GIJANTAK': 'QUANTUP',
    'GLANTUY': 'QUANTUP',
    'GALF': 'GALA',
    'EPINARLS': 'EPINARDS',
    'BARYBEL': 'BABYBEL',
    'BLD': 'BIO',
    'BANAN': 'BANANAS',
    'CERISE5': 'CERISES',
  };
  
  let cleaned = text;
  for (const [wrong, right] of Object.entries(fixes)) {
    cleaned = cleaned.replace(new RegExp(wrong, 'gi'), right);
  }
  
  // Remove common noise patterns
  cleaned = cleaned.replace(/\s*TRN\/\d+/gi, ''); // Remove TRN codes
  cleaned = cleaned.replace(/\s*TP[NO]\/\d+/gi, ''); // Remove TP codes
  cleaned = cleaned.trim();
  
  return cleaned;
}

function cleanCostcoName(rawName: string): string {
  let cleaned = rawName;
  
  // First clean OCR errors
  cleaned = cleanOCRErrors(cleaned);
  
  // Remove Costco item codes at start (7 digits followed by letters)
  cleaned = cleaned.replace(/^\d{7}[A-Z]*\s*/i, '');
  
  // Remove quantity codes at end (numbers + 1-2 letters like "110Z", "24CT")
  cleaned = cleaned.replace(/\s*\d+[A-Z]{1,2}$/i, '');
  
  // Remove trailing flags (FP, -FP)
  cleaned = cleaned.replace(/\s*-?FP$/i, '');
  
  // Expand Costco abbreviations
  cleaned = cleaned.replace(/^KS\s/i, 'Kirkland ');
  cleaned = cleaned.replace(/\sYOG\s/i, ' Yogurt ');
  cleaned = cleaned.replace(/\sGREC\s/i, ' Greek ');
  cleaned = cleaned.replace(/\sBIO\s/i, ' Organic ');
  
  // Clean up whitespace
  cleaned = cleaned.trim().replace(/\s+/g, ' ');
  
  // Capitalize properly
  cleaned = cleaned.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleaned;
}

function cleanItemName(rawName: string): string {
  let cleaned = rawName;
  
  // Remove common patterns
  cleaned = cleaned
    // Remove SKU/PLU codes (4+ consecutive digits)
    .replace(/\b\d{4,}\b/g, '')
    // Remove department codes (pattern: 00123)
    .replace(/\b0+\d{1,3}\b/g, '')
    // Remove single letters/numbers at start
    .replace(/^[A-Z0-9]\s+/g, '')
    // Remove measurement units (save for later use)
    .replace(/\s+(EA|LB|KG|OZ|ML|G)\b/gi, '')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize properly
  cleaned = cleaned.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return cleaned;
}

function calculateConfidence(
  name: string,
  rawName: string,
  price: number,
  category: string
): 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Check name quality
  if (name.length >= 5 && /^[A-Za-z\s]+$/.test(name)) {
    score += 3; // Clean, alphabetic name
  } else if (name.length >= 3) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Check if price is reasonable
  if (price > 0.50 && price < 50) {
    score += 2;
  } else if (price > 0 && price < 100) {
    score += 1;
  }
  
  // Check if category was detected (not "Other")
  if (category !== 'Other') {
    score += 2;
  }
  
  // Check if cleaning removed a lot (indicates messy data)
  const cleaningRatio = name.length / rawName.length;
  if (cleaningRatio > 0.7) {
    score += 1;
  }
  
  // Score mapping
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

function preprocessCostcoText(rawText: string): string[] {
  // For Costco receipts with messy OCR, try to extract items using pattern matching
  const lines: string[] = [];
  
  // Pattern: [7 digits] [TEXT] [PRICE with comma or dot] optional(-FP or FP)
  const itemPattern = /(\d{7}[A-Z]*)\s+([A-Z0-9\s\/\-]+?)\s+(\d+[,\.]\d{2})\s*-?FP?/gi;
  const matches = [...rawText.matchAll(itemPattern)];
  
  for (const match of matches) {
    const code = match[1];
    const name = match[2].trim();
    const price = match[3];
    
    // Skip if name is too short or looks like garbage
    if (name.length < 2) continue;
    
    // Reconstruct the line in a clean format
    lines.push(`${code} ${name} ${price} FP`);
  }
  
  // If pattern matching found items, return those
  if (lines.length > 0) {
    return lines;
  }
  
  // Otherwise fall back to line-by-line splitting
  return rawText.split('\n').filter(line => line.trim().length > 0);
}

function parseItems(text: string, store: string): ParsedReceiptItem[] {
  const itemMap = new Map<string, { item: ParsedReceiptItem; count: number }>();
  
  // Check if this is a Costco receipt for special handling
  const isCostco = store.toLowerCase().includes('costco');
  
  // Preprocess Costco receipts to handle messy OCR
  const lines = isCostco ? preprocessCostcoText(text) : text.split('\n');
  
  // Store-specific price patterns (handle both comma and dot as decimal separator)
  const pricePatterns = isCostco 
    ? [
        /(.+?)\s+(\d+)[,\.](\d{2})\s*-?FP?$/i,   // Costco: Item XX,XX FP or XX.XX-FP
        /(.+?)\s+(\d+)[,\.](\d{2})\s*$/,         // Costco: Item XX,XX or XX.XX
      ]
    : [
        /(.+?)\s*\$\s*(\d+\.\d{2})\s*$/,         // Standard: Item $XX.XX
        /(.+?)\s+(\d+\.\d{2})\s*$/,              // No dollar sign: Item XX.XX
        /(.+?)\s+\$?\s*(\d+\.\d{2})\s*[A-Z]*$/,  // With suffix codes
      ];
  
  // Words to skip (common receipt header/footer terms) - bilingual
  const skipWords = [
    'total', 'subtotal', 'tax', 'tps', 'tvq', 'hst', 'gst', 'pst',
    'change', 'cash', 'card', 'visa', 'mastercard', 'amex',
    'debit', 'credit', 'balance', 'tender', 'payment', 'receipt',
    'store', 'thank', 'welcome', 'sale', 'saved', 'coupon', 'discount',
    'phone', 'address', 'member', 'cashier', 'transaction', 'date',
    'sous total', 'montant', 'quantup', 'member', 'no de', 'warehouse',
    'approved', 'master', 'nombre', 'taxe', 'annul'
  ];
  
  // Track if we're in an ANNUL (canceled items) section for Costco
  let inAnnulSection = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 3) continue;
    
    // Costco-specific: Handle ANNUL sections
    if (isCostco) {
      if (/annul/i.test(trimmedLine)) {
        inAnnulSection = true;
        continue;
      }
      if (/sous total|^total/i.test(trimmedLine)) {
        inAnnulSection = false;
        break; // Stop at totals section
      }
      if (inAnnulSection) continue; // Skip canceled items
    }
    
    // Skip lines with common receipt terms
    const lowerLine = trimmedLine.toLowerCase();
    if (skipWords.some(word => lowerLine.includes(word))) continue;
    
    // Try each price pattern
    let matched = false;
    for (const pattern of pricePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const rawName = match[1].trim();
        
        // For Costco patterns with comma/dot separator, combine the digits
        const price = isCostco && match[3] 
          ? parseFloat(match[2] + '.' + match[3])
          : parseFloat(match[2]);
        
        // Skip if name is too short or price is unreasonable
        if (rawName.length < 2) continue;
        if (price < 0.25 || price > 500) continue; // Extended range for Costco bulk
        
        // Clean up item name (use Costco-specific cleaning if applicable)
        const cleanName = isCostco ? cleanCostcoName(rawName) : cleanItemName(rawName);
        if (!cleanName || cleanName.length < 2) continue;
        
        // Skip if cleaned name is only numbers or looks like garbage
        if (/^\d+$/.test(cleanName)) continue;
        
        // Detect category
        const category = detectCategory(cleanName);
        
        // Calculate confidence
        const confidence = calculateConfidence(cleanName, rawName, price, category);
        
        // Check for duplicates (same name, combine them)
        const lowerCleanName = cleanName.toLowerCase();
        if (itemMap.has(lowerCleanName)) {
          const existing = itemMap.get(lowerCleanName)!;
          existing.count += 1;
          existing.item.quantity = existing.count;
          existing.item.price += price;
        } else {
          const newItem: ParsedReceiptItem = {
            id: Math.random().toString(36).substring(7),
            name: cleanName,
            rawName: rawName,
            price: price,
            quantity: 1,
            category: category,
            expiryDays: CATEGORY_EXPIRY[category] || 30,
            selected: true,
            confidence: confidence,
          };
          itemMap.set(lowerCleanName, { item: newItem, count: 1 });
        }
        
        matched = true;
        break;
      }
    }
  }
  
  // Convert map to array
  const uniqueItems = Array.from(itemMap.values()).map(({ item }) => item);
  
  // Sort by confidence (high first) for better user experience
  return uniqueItems.sort((a, b) => {
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    return confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
  });
}

function calculateTotal(text: string): number {
  // Look for total line
  const totalPattern = /total\s*\$?\s*(\d+\.\d{2})/i;
  const match = text.match(totalPattern);
  
  if (match) {
    return parseFloat(match[1]);
  }
  
  return 0;
}

export function parseReceiptText(ocrText: string): ParsedReceipt {
  const store = detectStore(ocrText);
  const date = detectDate(ocrText);
  const items = parseItems(ocrText, store);
  const total = calculateTotal(ocrText);
  
  return {
    store,
    date,
    total,
    items,
  };
}
