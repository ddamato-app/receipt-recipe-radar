import { addDays, parse, format } from 'date-fns';
import type { ReceiptItem } from '@/types/receipt';

// Category keyword mappings (French/English)
const CATEGORY_KEYWORDS = {
  produce: [
    'cerises', 'fraises', 'bananes', 'bananas', 'pommes', 'tomates', 
    'brocoli', 'avocat', 'salade', 'épinards', 'epinards', 'apple',
    'orange', 'lettuce', 'spinach', 'carrot', 'pepper', 'cucumber',
    'berries', 'strawberr', 'cherr'
  ],
  dairy: [
    'yogourt', 'yogurt', 'babybel', 'fromage', 'lait', 'œufs', 'oeufs',
    'beurre', 'milk', 'cheese', 'butter', 'cream', 'egg', 'yog'
  ],
  meat: [
    'poulet', 'boeuf', 'porc', 'jambon', 'cuit', 'chicken', 'beef',
    'pork', 'ham', 'turkey', 'bacon', 'sausage', 'ground', 'steak'
  ],
  pantry: [
    'thon', 'rio mare', 'haricots', 'pâtes', 'pates', 'riz', 'huile',
    'céréales', 'tuna', 'beans', 'pasta', 'rice', 'oil', 'cereal',
    'bread', 'pain', 'flour', 'sugar', 'sauce', 'can', 'conserve'
  ],
  household: [
    'gain', 'détergent', 'detergent', 'essuie', 'papier', 'soap',
    'cleaner', 'towel', 'tissue', 'trash', 'bag', 'nettoyant'
  ],
  frozen: [
    'frozen', 'congelé', 'congele', 'ice cream', 'glace', 'pizza'
  ],
  snacks: [
    'chips', 'cookie', 'biscuit', 'candy', 'chocolate', 'chocolat',
    'snack', 'grignotine'
  ],
};

// Specific product patterns with shelf-life
interface ShelfLifeRule {
  pattern: RegExp;
  days: number;
  label: string;
}

const SHELF_LIFE_RULES: ShelfLifeRule[] = [
  // Meat - shortest shelf life
  { pattern: /\b(poulet|chicken|poultry|volaille)\b/i, days: 2, label: 'poultry' },
  { pattern: /\b(ground|hach[eé]|boeuf hach[eé])\b/i, days: 2, label: 'ground-meat' },
  { pattern: /\b(jambon|ham|deli)\b/i, days: 5, label: 'deli-ham' },
  { pattern: /\b(boeuf|beef|steak|porc|pork)\b/i, days: 3, label: 'fresh-meat' },
  
  // Dairy
  { pattern: /\b(yogourt|yogurt|yog)\b/i, days: 10, label: 'yogurt' },
  { pattern: /\b(babybel)\b/i, days: 25, label: 'babybel' },
  { pattern: /\b(œufs|oeufs|eggs?)\b/i, days: 28, label: 'eggs' },
  { pattern: /\b(lait|milk)\b/i, days: 7, label: 'milk' },
  { pattern: /\b(fromage|cheese)\b/i, days: 14, label: 'cheese' },
  { pattern: /\b(beurre|butter)\b/i, days: 30, label: 'butter' },
  
  // Produce
  { pattern: /\b(cerises|cherr|fraises|strawberr|berries|baies)\b/i, days: 4, label: 'berries' },
  { pattern: /\b(bananes?|bananas?)\b/i, days: 5, label: 'bananas' },
  { pattern: /\b(brocoli|broccoli)\b/i, days: 5, label: 'broccoli' },
  { pattern: /\b(tomates?|tomatoes?)\b/i, days: 5, label: 'tomatoes' },
  { pattern: /\b(salade|lettuce|épinards|epinards|spinach)\b/i, days: 5, label: 'leafy-greens' },
  { pattern: /\b(avocat|avocado)\b/i, days: 4, label: 'avocado' },
  { pattern: /\b(pommes?|apples?)\b/i, days: 14, label: 'apples' },
  { pattern: /\b(carott|orange)\b/i, days: 10, label: 'hardy-produce' },
  
  // Pantry - long shelf life
  { pattern: /\b(pain|bread)\b/i, days: 5, label: 'bread' },
  { pattern: /\b(thon|tuna|conserve|can)\b/i, days: 365, label: 'canned' },
  { pattern: /\b(pâtes|pates|pasta|riz|rice|céréales|cereal)\b/i, days: 365, label: 'dry-goods' },
  
  // Frozen
  { pattern: /\b(frozen|congelé|congele|ice cream|glace)\b/i, days: 90, label: 'frozen' },
  
  // Household
  { pattern: /\b(gain|détergent|detergent|nettoyant|cleaner|savon|soap)\b/i, days: 9999, label: 'household' },
  { pattern: /\b(essuie|papier|towel|tissue)\b/i, days: 9999, label: 'paper-goods' },
];

// Default shelf life by category (fallback)
const CATEGORY_DEFAULT_SHELF_LIFE: Record<string, number> = {
  produce: 7,
  dairy: 10,
  meat: 3,
  frozen: 90,
  pantry: 365,
  snacks: 60,
  household: 9999,
};

/**
 * Categorize item and calculate expiry date based on keywords and shelf-life rules
 */
export function categorizeAndExpire(
  item: ReceiptItem,
  receiptDate: string
): ReceiptItem {
  const itemNameLower = item.name.toLowerCase();
  
  // Step 1: Determine category
  let category = item.category;
  
  if (!category) {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => itemNameLower.includes(keyword))) {
        category = cat;
        break;
      }
    }
  }
  
  // Default to pantry if no category found
  if (!category) {
    category = 'pantry';
  }
  
  // Step 2: Determine shelf life
  let shelfLifeDays = CATEGORY_DEFAULT_SHELF_LIFE[category] || 30;
  let shelfLifeLabel = category;
  
  // Check specific product rules (more precise)
  for (const rule of SHELF_LIFE_RULES) {
    if (rule.pattern.test(itemNameLower)) {
      shelfLifeDays = rule.days;
      shelfLifeLabel = rule.label;
      console.log(`✓ Matched rule "${rule.label}" for "${item.name}" → ${shelfLifeDays} days`);
      break;
    }
  }
  
  // Step 3: Calculate expiry date
  let expiresOn: string | undefined;
  
  if (receiptDate) {
    try {
      // Parse the receipt date (assumes YYYY-MM-DD format)
      let parsedDate: Date;
      
      if (receiptDate.includes('-')) {
        // YYYY-MM-DD format
        parsedDate = parse(receiptDate, 'yyyy-MM-dd', new Date());
      } else if (receiptDate.includes('/')) {
        // Try MM/DD/YYYY format
        parsedDate = parse(receiptDate, 'MM/dd/yyyy', new Date());
      } else {
        // Default to today if parsing fails
        parsedDate = new Date();
      }
      
      // Add shelf life days
      const expiryDate = addDays(parsedDate, shelfLifeDays);
      
      // Format as YYYY-MM-DD
      expiresOn = format(expiryDate, 'yyyy-MM-dd');
      
      console.log(`📅 Expiry: "${item.name}" → ${receiptDate} + ${shelfLifeDays}d = ${expiresOn}`);
    } catch (error) {
      console.error('Error calculating expiry date:', error);
      // Fallback: use current date + shelf life
      const expiryDate = addDays(new Date(), shelfLifeDays);
      expiresOn = format(expiryDate, 'yyyy-MM-dd');
    }
  } else {
    // No receipt date provided, use current date
    const expiryDate = addDays(new Date(), shelfLifeDays);
    expiresOn = format(expiryDate, 'yyyy-MM-dd');
  }
  
  // Step 4: Add OCR confidence estimate
  const ocrConfidence = estimateOCRConfidence(item.name);
  
  return {
    ...item,
    category,
    expires_on: expiresOn,
    ocr_confidence: ocrConfidence,
  };
}

/**
 * Estimate OCR confidence based on name quality
 */
function estimateOCRConfidence(name: string): number {
  let confidence = 0.9; // Start with high confidence
  
  // Reduce confidence for short names
  if (name.length < 3) {
    confidence -= 0.3;
  }
  
  // Reduce confidence for excessive special characters
  const specialCharCount = (name.match(/[^a-zA-Z0-9\s\-']/g) || []).length;
  if (specialCharCount > 2) {
    confidence -= 0.1 * specialCharCount;
  }
  
  // Reduce confidence for numbers in name (might be codes)
  const digitCount = (name.match(/\d/g) || []).length;
  if (digitCount > 3) {
    confidence -= 0.1;
  }
  
  // Reduce confidence if name has many consecutive capitals (OCR errors)
  if (/[A-Z]{4,}/.test(name)) {
    confidence -= 0.2;
  }
  
  // Increase confidence for recognized words
  const recognizedWords = [
    ...CATEGORY_KEYWORDS.produce,
    ...CATEGORY_KEYWORDS.dairy,
    ...CATEGORY_KEYWORDS.meat,
    ...CATEGORY_KEYWORDS.pantry,
  ];
  
  const nameLower = name.toLowerCase();
  if (recognizedWords.some(word => nameLower.includes(word))) {
    confidence += 0.05;
  }
  
  // Clamp between 0 and 1
  return Math.max(0.1, Math.min(1.0, confidence));
}

/**
 * Batch categorize and expire multiple items
 */
export function categorizeAndExpireItems(
  items: ReceiptItem[],
  receiptDate: string
): ReceiptItem[] {
  console.log('=== CATEGORIZING & EXPIRING ITEMS ===');
  console.log('Receipt date:', receiptDate);
  console.log('Items to process:', items.length);
  
  const processed = items.map(item => categorizeAndExpire(item, receiptDate));
  
  // Log summary
  const categoryCount = processed.reduce((acc, item) => {
    const cat = item.category || 'unknown';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Category distribution:', categoryCount);
  console.log('=== CATEGORIZATION COMPLETE ===');
  
  return processed;
}
