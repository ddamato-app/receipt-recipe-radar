import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Money normalization (Quebec format support)
const normMoney = (s: string): number => {
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
  total: /\bTOTAL\b.*?(\d{1,4}[.,]\d{2})/i
};

// Vendor detection
const VENDORS = [
  'COSTCO', 'WALMART', 'METRO', 'IGA', 'LOBLAWS', 'PROVIGO', 
  'SUPER C', 'MAXI', 'CARREFOUR', 'AVRIL'
];

function detectVendor(text: string): string | undefined {
  const upperText = text.toUpperCase();
  for (const vendor of VENDORS) {
    if (upperText.includes(vendor)) {
      return vendor;
    }
  }
  return undefined;
}

// Date detection
function detectDate(text: string): string | undefined {
  const datePatterns = [
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // YYYY-MM-DD or YYYY/MM/DD
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // DD-MM-YYYY or MM/DD/YYYY
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1].length === 4) {
        // YYYY-MM-DD
        return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
      } else {
        // Assume MM/DD/YYYY format
        return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
      }
    }
  }
  return undefined;
}

// Clean item name
function cleanName(name: string): string {
  // Remove SKU patterns
  name = name.replace(/#?\d{4,}/g, '');
  name = name.replace(/\bPLU\s*\d+/gi, '');
  name = name.replace(/\bTP[RO]\/\d+/gi, '');
  name = name.replace(/\bFP\s*$/i, '');
  
  // Expand abbreviations
  name = name.replace(/\bKS\b/gi, 'Kirkland Signature');
  
  return name.trim();
}

// Category keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: ['cerises', 'fraises', 'bananes', 'bananas', 'pommes', 'tomates', 'brocoli', 'avocat', 'salade', 'épinards', 'epinards'],
  dairy: ['yogourt', 'yogurt', 'babybel', 'fromage', 'lait', 'œufs', 'oeufs', 'beurre'],
  meat: ['poulet', 'boeuf', 'porc', 'jambon', 'cuit', 'chicken', 'beef', 'pork', 'ham'],
  pantry: ['thon', 'rio mare', 'haricots', 'pâtes', 'pates', 'riz', 'huile', 'céréales'],
  household: ['gain', 'détergent', 'detergent', 'essuie', 'papier'],
  frozen: ['frozen', 'congelé', 'congele', 'glace'],
  snacks: ['chips', 'cookie', 'biscuit', 'candy', 'chocolat'],
};

// Shelf life rules
const SHELF_LIFE_RULES: Array<{ pattern: RegExp; days: number }> = [
  { pattern: /\b(poulet|chicken|poultry|volaille)\b/i, days: 2 },
  { pattern: /\b(ground|hach[eé]|boeuf hach[eé])\b/i, days: 2 },
  { pattern: /\b(jambon|ham|deli)\b/i, days: 5 },
  { pattern: /\b(boeuf|beef|steak|porc|pork)\b/i, days: 3 },
  { pattern: /\b(yogourt|yogurt|yog)\b/i, days: 10 },
  { pattern: /\b(babybel)\b/i, days: 25 },
  { pattern: /\b(œufs|oeufs|eggs?)\b/i, days: 28 },
  { pattern: /\b(lait|milk)\b/i, days: 7 },
  { pattern: /\b(cerises|cherr|fraises|strawberr|berries|baies)\b/i, days: 4 },
  { pattern: /\b(bananes?|bananas?)\b/i, days: 5 },
  { pattern: /\b(brocoli|broccoli)\b/i, days: 5 },
  { pattern: /\b(tomates?|tomatoes?)\b/i, days: 5 },
  { pattern: /\b(salade|lettuce|épinards|epinards|spinach)\b/i, days: 5 },
  { pattern: /\b(pain|bread)\b/i, days: 5 },
  { pattern: /\b(thon|tuna|conserve|can)\b/i, days: 365 },
  { pattern: /\b(frozen|congelé|congele)\b/i, days: 90 },
  { pattern: /\b(gain|détergent|detergent|nettoyant|cleaner)\b/i, days: 9999 },
];

const CATEGORY_DEFAULT_SHELF_LIFE: Record<string, number> = {
  produce: 7,
  dairy: 10,
  meat: 3,
  frozen: 90,
  pantry: 365,
  snacks: 60,
  household: 9999,
};

function categorizeItem(name: string): string {
  const nameLower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => nameLower.includes(kw))) {
      return category;
    }
  }
  return 'pantry';
}

function calculateExpiry(name: string, category: string, receiptDate: string): string {
  const nameLower = name.toLowerCase();
  
  // Check specific rules
  let days = CATEGORY_DEFAULT_SHELF_LIFE[category] || 30;
  for (const rule of SHELF_LIFE_RULES) {
    if (rule.pattern.test(nameLower)) {
      days = rule.days;
      break;
    }
  }
  
  // Calculate expiry date
  const date = new Date(receiptDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Parse receipt text
function parseReceipt(ocrText: string, hints?: { vendor?: string }) {
  const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Detect vendor and date
  const vendor = hints?.vendor || detectVendor(ocrText);
  const date = detectDate(ocrText);
  
  // Extract totals
  const subtotalMatch = ocrText.match(TOTALS.subtotal);
  const taxMatch = ocrText.match(TOTALS.tax);
  const totalMatch = ocrText.match(TOTALS.total);
  
  const subtotal = subtotalMatch ? normMoney(subtotalMatch[1]) : undefined;
  const tax_total = taxMatch ? normMoney(taxMatch[1]) : undefined;
  const total = totalMatch ? normMoney(totalMatch[1]) : undefined;
  
  // Parse items and discounts, tracking void blocks
  const items: any[] = [];
  const discounts: any[] = [];
  
  const voidIndices = new Set<number>();
  
  // First pass: identify ANNUL lines and mark adjacent lines as voided
  lines.forEach((line, idx) => {
    if (VOID.test(line)) {
      voidIndices.add(idx);
      // Mark previous line as voided (ANNUL typically voids the line above)
      if (idx > 0) voidIndices.add(idx - 1);
    }
  });
  
  // Second pass: parse non-voided lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip voided lines
    if (voidIndices.has(i)) continue;
    
    // Check for coupons/discounts (match both formats: -3,80 FP and 3,80-FP)
    const couponMatch = line.match(COUPON);
    const trailingMinusMatch = line.match(DISCOUNT_TRAILING_MINUS);
    
    if (couponMatch || trailingMinusMatch) {
      const matched = couponMatch || trailingMinusMatch;
      const amountStr = matched![1];
      const amount = -Math.abs(normMoney(amountStr)); // Always negative
      const label = line.split(amountStr)[0].trim() || 'Discount';
      
      discounts.push({
        label: cleanName(label),
        amount,
      });
      continue;
    }
    
    // Check for items (lines with prices)
    const prices = line.match(PRICE);
    if (prices && prices.length > 0) {
      const price = prices[prices.length - 1]; // Rightmost price
      const priceIndex = line.lastIndexOf(price);
      let name = line.substring(0, priceIndex).trim();
      
      if (!name || name.length < 2) continue;
      
      name = cleanName(name);
      const price_total = normMoney(price);
      
      // Extract quantity and unit price (e.g., "3 @ 9.99" or "2 x 12,49")
      // Duplicate items on separate lines remain separate
      let qty = 1;
      let unit_price: number | undefined;
      
      // Check for "X @ Y" pattern (quantity @ unit_price)
      const atPriceMatch = line.match(/(\d+)\s*@\s*(\d+[.,]\d{2})/);
      if (atPriceMatch) {
        qty = parseInt(atPriceMatch[1]);
        unit_price = normMoney(atPriceMatch[2]);
        
        // Validate that price_total matches qty * unit_price (within 1% tolerance)
        const expectedTotal = qty * unit_price;
        if (Math.abs(price_total - expectedTotal) > expectedTotal * 0.01) {
          console.log(`⚠️ Price mismatch for "${name}": ${qty} × ${unit_price} = ${expectedTotal}, but receipt shows ${price_total}`);
          // Use the receipt's total price as the source of truth
        }
      } else {
        // Check for "X x Y" pattern
        const qtyMatch = name.match(/(\d+)\s*[xX×]/);
        if (qtyMatch) {
          qty = parseInt(qtyMatch[1]);
          unit_price = price_total / qty;
        }
      }
      
      items.push({
        name,
        qty,
        price_total,
        unit_price,
        needs_review: false,
      });
    }
  }
  
  // Validation
  const sum_items = items.reduce((sum, item) => sum + item.price_total, 0);
  const sum_discounts = discounts.reduce((sum, d) => sum + d.amount, 0);
  const calculated = sum_items + sum_discounts + (tax_total || 0);
  
  const review_reasons: string[] = [];
  let needs_review = false;
  
  if (total && Math.abs(calculated - total) > total * 0.01) {
    needs_review = true;
    review_reasons.push(`Total mismatch: calculated ${calculated.toFixed(2)} vs ${total.toFixed(2)}`);
  }
  
  if (items.length === 0) {
    needs_review = true;
    review_reasons.push('No items found');
  }
  
  // Categorize and add expiry dates
  const receiptDateStr = date || new Date().toISOString().split('T')[0];
  const categorizedItems = items.map(item => {
    const category = categorizeItem(item.name);
    const expires_on = calculateExpiry(item.name, category, receiptDateStr);
    
    return {
      ...item,
      category,
      expires_on,
      ocr_confidence: 0.85,
    };
  });
  
  return {
    vendor,
    date: date || undefined,
    currency: 'CAD' as const,
    items: categorizedItems,
    discounts,
    subtotal,
    tax_total,
    total,
    raw_text: ocrText,
    needs_review,
    review_reasons,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Try to get user from Authorization header (optional)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      if (!userError && user) {
        userId = user.id;
      }
    }


    // Parse request body
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Missing image data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting OCR processing...');

    // Call run-ocr function
    const { data: ocrData, error: ocrError } = await supabase.functions.invoke('run-ocr', {
      body: { image },
    });

    if (ocrError) {
      console.error('OCR error:', ocrError);
      return new Response(
        JSON.stringify({ error: 'OCR processing failed', details: ocrError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ocrText = ocrData.text;
    console.log('OCR completed, parsing receipt...');

    // Parse receipt
    const parsed = parseReceipt(ocrText);
    console.log('Receipt parsed:', { itemCount: parsed.items.length, total: parsed.total });

    if (userId) {
      // Save to database when authenticated
      const { data: savedReceipt, error: dbError } = await supabase
        .from('receipt_parses')
        .insert({
          user_id: userId,
          vendor: parsed.vendor,
          date: parsed.date,
          currency: parsed.currency,
          items: parsed.items,
          discounts: parsed.discounts,
          subtotal: parsed.subtotal,
          tax_total: parsed.tax_total,
          total: parsed.total,
          raw_text: parsed.raw_text,
          needs_review: parsed.needs_review,
          review_reasons: parsed.review_reasons,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to save receipt', details: dbError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Receipt saved successfully:', savedReceipt.id);

      return new Response(
        JSON.stringify(savedReceipt),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Unauthenticated: return parsed result directly (no DB write)
      return new Response(
        JSON.stringify({ id: null, ...parsed }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
