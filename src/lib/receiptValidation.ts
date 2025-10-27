export interface ValidationIssue {
  type: 'error' | 'warning';
  code: string;
  message: string;
  suggestion: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  detectedLanguage?: string;
  storeCount?: number;
}

/**
 * Detects if image text is too short (likely blur or bad quality)
 */
export function detectLowQuality(text: string): ValidationIssue | null {
  if (!text || text.trim().length < 20) {
    return {
      type: 'error',
      code: 'LOW_QUALITY',
      message: 'Image is too blurry or unclear',
      suggestion: 'Please retake the photo with better lighting and ensure the receipt is in focus',
    };
  }
  return null;
}

/**
 * Detects if receipt appears incomplete (missing header or footer)
 */
export function detectPartialReceipt(text: string): ValidationIssue | null {
  const lowerText = text.toLowerCase();
  
  // Check for typical receipt header indicators
  const hasHeader = lowerText.includes('store') || 
                    lowerText.includes('market') ||
                    lowerText.includes('receipt') ||
                    /\d{3}[-\s]\d{3}[-\s]\d{4}/.test(text); // Phone number pattern
  
  // Check for typical footer indicators
  const hasFooter = lowerText.includes('total') ||
                    lowerText.includes('thank') ||
                    lowerText.includes('balance') ||
                    lowerText.includes('change');
  
  if (!hasHeader && !hasFooter) {
    return {
      type: 'warning',
      code: 'PARTIAL_RECEIPT',
      message: 'Receipt appears incomplete',
      suggestion: 'Make sure the entire receipt is visible in the photo, including top and bottom',
    };
  }
  
  return null;
}

/**
 * Detects if no prices were found in the text
 */
export function detectNoPrices(text: string): ValidationIssue | null {
  // Look for price patterns: $X.XX or X.XX
  const pricePattern = /\$?\d+\.\d{2}/g;
  const prices = text.match(pricePattern);
  
  if (!prices || prices.length < 2) {
    return {
      type: 'error',
      code: 'NO_PRICES',
      message: "Couldn't find prices in the receipt",
      suggestion: 'Please check image quality and ensure all text is visible',
    };
  }
  
  return null;
}

/**
 * Detects language of receipt text (English or French)
 */
export function detectLanguage(text: string): string {
  const lowerText = text.toLowerCase();
  
  // French indicators
  const frenchKeywords = [
    'épicerie', 'épicier', 'marché', 'prix', 'sous-total',
    'tps', 'tvq', 'merci', 'bonjour', 'montant'
  ];
  
  // English indicators
  const englishKeywords = [
    'grocery', 'store', 'market', 'price', 'subtotal',
    'tax', 'total', 'thank', 'change', 'amount'
  ];
  
  const frenchCount = frenchKeywords.filter(word => lowerText.includes(word)).length;
  const englishCount = englishKeywords.filter(word => lowerText.includes(word)).length;
  
  if (frenchCount > englishCount && frenchCount > 2) {
    return 'fra'; // French
  }
  
  return 'eng'; // Default to English
}

/**
 * Detects if multiple receipts are present in the image
 */
export function detectMultipleReceipts(text: string): ValidationIssue | null {
  const lowerText = text.toLowerCase();
  
  // Count store headers or receipt numbers
  const storeHeaderPattern = /(walmart|costco|metro|iga|loblaws|sobeys|whole foods)/gi;
  const matches = text.match(storeHeaderPattern);
  
  // Count "total" occurrences as indicator
  const totalPattern = /\btotal\b/gi;
  const totalMatches = text.match(totalPattern);
  
  if ((matches && matches.length > 1) || (totalMatches && totalMatches.length > 2)) {
    return {
      type: 'warning',
      code: 'MULTIPLE_RECEIPTS',
      message: 'Multiple receipts detected in image',
      suggestion: 'Please photograph one receipt at a time for best results',
    };
  }
  
  return null;
}

/**
 * Detects if this appears to be a non-grocery receipt
 */
export function detectNonGroceryReceipt(text: string): ValidationIssue | null {
  const lowerText = text.toLowerCase();
  
  // Restaurant indicators
  const restaurantKeywords = ['server', 'table', 'tip', 'gratuity', 'party'];
  const hasRestaurantIndicators = restaurantKeywords.some(word => lowerText.includes(word));
  
  // Gas station indicators
  const gasKeywords = ['gallon', 'gal', 'pump', 'fuel', 'diesel', 'octane'];
  const hasGasIndicators = gasKeywords.some(word => lowerText.includes(word));
  
  if (hasRestaurantIndicators) {
    return {
      type: 'error',
      code: 'NON_GROCERY',
      message: 'This appears to be a restaurant receipt',
      suggestion: 'This app is designed for grocery receipts. Restaurants and prepared meals are not supported',
    };
  }
  
  if (hasGasIndicators) {
    return {
      type: 'error',
      code: 'NON_GROCERY',
      message: 'This appears to be a gas station receipt',
      suggestion: 'This app is designed for grocery store receipts. Gas stations are not supported',
    };
  }
  
  return null;
}

/**
 * Main validation function that runs all checks
 */
export function validateReceiptText(text: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Run all validation checks
  const qualityIssue = detectLowQuality(text);
  if (qualityIssue) issues.push(qualityIssue);
  
  const partialIssue = detectPartialReceipt(text);
  if (partialIssue) issues.push(partialIssue);
  
  const priceIssue = detectNoPrices(text);
  if (priceIssue) issues.push(priceIssue);
  
  const multipleIssue = detectMultipleReceipts(text);
  if (multipleIssue) issues.push(multipleIssue);
  
  const nonGroceryIssue = detectNonGroceryReceipt(text);
  if (nonGroceryIssue) issues.push(nonGroceryIssue);
  
  // Detect language
  const detectedLanguage = detectLanguage(text);
  
  // Count errors (not warnings)
  const hasErrors = issues.some(issue => issue.type === 'error');
  
  return {
    isValid: !hasErrors,
    issues,
    detectedLanguage,
  };
}
