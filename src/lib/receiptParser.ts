import { addDays, format } from 'date-fns';

export interface ParsedReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  expiryDays: number;
  selected: boolean;
}

export interface ParsedReceipt {
  store: string;
  date: string;
  total: number;
  items: ParsedReceiptItem[];
}

// Common store names to detect
const STORE_NAMES = [
  'walmart', 'costco', 'metro', 'iga', 'loblaws', 'sobeys',
  'whole foods', 'safeway', 'kroger', 'target', 'trader joe',
  'food lion', 'publix', 'albertsons', 'wegmans'
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
  for (const store of STORE_NAMES) {
    if (lowerText.includes(store)) {
      return store.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  return 'Unknown Store';
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

function parseItems(text: string): ParsedReceiptItem[] {
  const lines = text.split('\n');
  const items: ParsedReceiptItem[] = [];
  
  // Pattern to match lines with prices: anything followed by $XX.XX
  const pricePattern = /(.+?)\s*\$?\s*(\d+\.\d{2})\s*$/;
  
  // Words to skip (common receipt header/footer terms)
  const skipWords = [
    'total', 'subtotal', 'tax', 'change', 'cash', 'card', 'visa', 'mastercard',
    'debit', 'credit', 'balance', 'tender', 'payment', 'receipt', 'store',
    'thank', 'welcome', 'sale', 'saved', 'coupon', 'discount'
  ];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.length < 3) continue;
    
    // Skip lines with common receipt terms
    const lowerLine = trimmedLine.toLowerCase();
    if (skipWords.some(word => lowerLine.includes(word))) continue;
    
    // Try to match price pattern
    const match = trimmedLine.match(pricePattern);
    if (match) {
      const name = match[1].trim();
      const price = parseFloat(match[2]);
      
      // Skip if name is too short or price is too high (likely total)
      if (name.length < 2 || price > 100) continue;
      
      // Clean up item name (remove PLU codes, etc.)
      const cleanName = name.replace(/\d{4,}/g, '').trim();
      if (!cleanName) continue;
      
      const category = detectCategory(cleanName);
      
      items.push({
        id: Math.random().toString(36).substring(7),
        name: cleanName,
        price: price,
        quantity: 1,
        category: category,
        expiryDays: CATEGORY_EXPIRY[category] || 30,
        selected: true,
      });
    }
  }
  
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
  const store = detectStore(ocrText);
  const date = detectDate(ocrText);
  const items = parseItems(ocrText);
  const total = calculateTotal(ocrText);
  
  return {
    store,
    date,
    total,
    items,
  };
}
