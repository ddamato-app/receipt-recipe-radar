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

function parseItems(text: string, store: string): ParsedReceiptItem[] {
  console.log('=== SIMPLIFIED PARSING START ===');
  
  // Split into lines
  const lines = text.split(/\r?\n/);
  console.log('Total lines to process:', lines.length);
  
  const items: ParsedReceiptItem[] = [];
  
  // Words to skip (common receipt header/footer terms)
  const skipWords = [
    'TOTAL', 'TAX', 'TAXE', 'TPS', 'TVQ', 'HST', 'GST', 'PST',
    'MEMBER', 'APPROVED', 'ANNUL', 'THANK', 'WAREHOUSE',
    'MASTER', 'NOMBRE', 'SOUS', 'PAYMENT', 'CASH', 'CARD',
    'VISA', 'DEBIT', 'CREDIT', 'CHANGE', 'TENDER'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty or very short lines
    if (line.length < 5) continue;
    
    // Skip lines with exclusion words
    if (skipWords.some(word => line.toUpperCase().includes(word))) {
      continue;
    }
    
    // Look for price pattern: X.XX or X,XX (1-3 digits before decimal)
    const priceRegex = /(\d{1,3})[,\.](\d{2})/;
    const priceMatch = line.match(priceRegex);
    
    if (!priceMatch) continue;
    
    // Parse price (convert comma to dot)
    const price = parseFloat(priceMatch[1] + '.' + priceMatch[2]);
    
    // Price must be reasonable for grocery item
    if (price < 0.50 || price > 200) {
      console.log(`Skipping unreasonable price: $${price}`);
      continue;
    }
    
    // Extract name (everything before the price)
    const priceIndex = line.indexOf(priceMatch[0]);
    let rawName = line.substring(0, priceIndex).trim();
    
    // Clean the name
    const name = cleanItemName(rawName);
    
    // Name must be decent
    if (name.length < 3) {
      console.log(`Skipping short name: "${name}"`);
      continue;
    }
    
    // Skip if only numbers
    if (/^\d+$/.test(name)) {
      console.log(`Skipping numeric name: "${name}"`);
      continue;
    }
    
    // Detect category
    const category = detectCategory(name);
    
    // Calculate confidence
    const confidence = calculateConfidence(name, price, category);
    
    // Success! Add item
    const item: ParsedReceiptItem = {
      id: Math.random().toString(36).substring(7),
      name: name,
      rawName: rawName,
      price: price,
      quantity: 1,
      category: category,
      expiryDays: CATEGORY_EXPIRY[category] || 30,
      selected: true,
      confidence: confidence,
    };
    
    items.push(item);
    console.log(`✓ Extracted: "${name}" - $${price} (${category}, ${confidence} confidence)`);
  }
  
  console.log('=== PARSING COMPLETE ===');
  console.log('Total items extracted:', items.length);
  
  return items;
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
  console.log('=== OCR PARSING DEBUG ===');
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
  console.log('Prices:', allPrices.slice(0, 10).map(m => m[0])); // First 10
  
  // Find ALL item codes
  const allCodes = [...ocrText.matchAll(/\d{7}/g)];
  console.log('All 7-digit codes found:', allCodes.length);
  console.log('Codes:', allCodes.slice(0, 10).map(m => m[0])); // First 10
  
  const store = detectStore(ocrText);
  const date = detectDate(ocrText);
  const items = parseItems(ocrText, store);
  const total = calculateTotal(ocrText);
  
  console.log('=== PARSING RESULTS ===');
  console.log('Store detected:', store);
  console.log('Items extracted:', items.length);
  items.forEach((item, i) => {
    console.log(`Item ${i + 1}:`, {
      name: item.name,
      price: item.price,
      category: item.category,
      confidence: item.confidence,
      quantity: item.quantity
    });
  });
  console.log('=== END DEBUG ===');
  
  return {
    store,
    date,
    total,
    items,
  };
}
