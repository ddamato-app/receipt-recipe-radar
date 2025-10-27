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

// Category keywords for auto-categorization
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
  'Meat': ['chicken', 'beef', 'pork', 'turkey', 'meat', 'steak', 'bacon', 'sausage'],
  'Fruits': ['apple', 'banana', 'orange', 'grape', 'berry', 'melon', 'fruit'],
  'Vegetables': ['lettuce', 'tomato', 'carrot', 'broccoli', 'onion', 'pepper', 'veggie', 'vegetable'],
  'Bakery': ['bread', 'roll', 'bagel', 'muffin', 'cake', 'pastry'],
  'Beverages': ['juice', 'soda', 'water', 'coffee', 'tea', 'drink'],
  'Snacks': ['chip', 'cookie', 'cracker', 'candy', 'snack'],
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

function parseItems(text: string, store: string): ParsedReceiptItem[] {
  const lines = text.split('\n');
  const items: ParsedReceiptItem[] = [];
  
  // Store-specific price patterns
  const pricePatterns = [
    /(.+?)\s*\$\s*(\d+\.\d{2})\s*$/,           // Standard: Item $XX.XX
    /(.+?)\s+(\d+\.\d{2})\s*$/,                // No dollar sign: Item XX.XX
    /(.+?)\s+\$?\s*(\d+\.\d{2})\s*[A-Z]*$/,   // With suffix codes
  ];
  
  // Words to skip (common receipt header/footer terms)
  const skipWords = [
    'total', 'subtotal', 'tax', 'tps', 'tvq', 'hst', 'gst', 'pst',
    'change', 'cash', 'card', 'visa', 'mastercard', 'amex',
    'debit', 'credit', 'balance', 'tender', 'payment', 'receipt',
    'store', 'thank', 'welcome', 'sale', 'saved', 'coupon', 'discount',
    'phone', 'address', 'member', 'cashier', 'transaction', 'date'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 3) continue;
    
    // Skip lines with common receipt terms
    const lowerLine = trimmedLine.toLowerCase();
    if (skipWords.some(word => lowerLine.includes(word))) continue;
    
    // Try each price pattern
    let matched = false;
    for (const pattern of pricePatterns) {
      const match = trimmedLine.match(pattern);
      if (match) {
        const rawName = match[1].trim();
        const price = parseFloat(match[2]);
        
        // Skip if name is too short or price is unreasonable
        if (rawName.length < 2) continue;
        if (price < 0.25 || price > 150) continue; // Reasonable grocery item range
        
        // Clean up item name
        const cleanName = cleanItemName(rawName);
        if (!cleanName || cleanName.length < 2) continue;
        
        // Detect category
        const category = detectCategory(cleanName);
        
        // Calculate confidence
        const confidence = calculateConfidence(cleanName, rawName, price, category);
        
        items.push({
          id: Math.random().toString(36).substring(7),
          name: cleanName,
          rawName: rawName,
          price: price,
          quantity: 1,
          category: category,
          expiryDays: CATEGORY_EXPIRY[category] || 30,
          selected: true,
          confidence: confidence,
        });
        
        matched = true;
        break;
      }
    }
  }
  
  // Sort by confidence (high first) for better user experience
  return items.sort((a, b) => {
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
