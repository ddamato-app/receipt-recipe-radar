import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get authorization header for Supabase queries
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    console.log('Fetching product catalog for better recognition...');
    
    // Query the shared product catalog to improve AI recognition
    const { data: catalogData } = await supabaseClient
      .from('product_catalog')
      .select('product_name, brand, category')
      .order('confirmed_count', { ascending: false })
      .limit(500);

    // Build a knowledge base from the catalog
    let knownProducts = '';
    if (catalogData && catalogData.length > 0) {
      const brandMap = new Map<string, Set<string>>();
      catalogData.forEach(item => {
        if (item.brand) {
          if (!brandMap.has(item.brand)) {
            brandMap.set(item.brand, new Set());
          }
          brandMap.get(item.brand)!.add(item.product_name);
        }
      });
      
      const topBrands = Array.from(brandMap.entries())
        .sort((a, b) => b[1].size - a[1].size)
        .slice(0, 50);
      
      knownProducts = '\n\nKnown brands and products from our database:\n' + 
        topBrands.map(([brand, products]) => 
          `${brand}: ${Array.from(products).slice(0, 10).join(', ')}`
        ).join('\n');
    }

    console.log('Processing receipt with AI vision...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at reading grocery receipts in both French and English. For each item on the receipt, you must:

1. Detect the language of the receipt (French or English)
2. Identify the EXACT item name (e.g., "Yogurt"/"Yogourt", "Milk"/"Lait", "Bread"/"Pain")
3. Extract the BRAND separately (e.g., "Danone", "Oikos", "President", "Nestle")
4. Assign the item to the CORRECT category based on what it is
5. Extract quantity and unit (if listed, otherwise default to 1 pcs)
6. Estimate expiration based on the product type
7. CRITICAL: For price extraction:
   - If you see patterns like "3 @ 9.99" or "5 x 2.49", the FIRST number is quantity, SECOND is unit price
   - The rightmost price on the line is the TOTAL price (quantity × unit price)
   - Extract the TOTAL price (the rightmost price), NOT the unit price
   - Example: "3 @ 9.99    29.97" → quantity=3, price=29.97 (NOT 9.99)

Categories to use:
- Dairy: milk, cheese, yogurt, butter, cream, eggs
- Fruits: all fresh fruits
- Vegetables: all fresh vegetables
- Meat: beef, pork, chicken, fish, seafood, deli meats
- Beverages: juice, soda, water, coffee, tea (non-dairy)
- Snacks: chips, cookies, candy, chocolate
- Bakery: bread, pastries, cakes
- Frozen: frozen meals, ice cream, frozen vegetables
- Pantry: pasta, rice, canned goods, condiments, spices
- Household: cleaning products, paper products, toiletries
- Other: anything that doesn't fit above

${knownProducts}

IMPORTANT: 
1. Use the known brands and products above to help identify items more accurately. If you see text that matches a known brand, use that exact brand name.
2. Always extract the TOTAL price (rightmost price), not the unit price, especially when quantity > 1.

Return ONLY valid JSON with this structure:
{
  "language": "en|fr",
  "items": [
    {
      "name": "Exact item name only (no brand)",
      "brand": "Brand name or empty string if not identifiable",
      "quantity": number,
      "unit": "pcs|kg|g|liters|ml",
      "category": "Dairy|Fruits|Vegetables|Meat|Beverages|Snacks|Bakery|Frozen|Pantry|Household|Other",
      "estimatedDaysToExpiry": number,
      "price": number (MUST be the total price, NOT unit price)
    }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this grocery receipt. For each item: 1) Detect if French or English, 2) Identify the exact item name (not the brand), 3) Extract the brand separately, 4) Assign to the correct category, 5) Extract quantity and unit, 6) CRITICAL: Extract the TOTAL PRICE (rightmost price on each line), NOT the unit price. If you see '3 @ 9.99    29.97', extract quantity=3 and price=29.97 (the total), NOT 9.99. Expand abbreviations to full product names in the detected language."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', content);

    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    }
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const parsedData = JSON.parse(jsonContent);
    
    // Calculate expiry dates
    const today = new Date();
    const itemsWithDates = parsedData.items.map((item: any) => {
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + (item.estimatedDaysToExpiry || 7));
      
      return {
        ...item,
        expiryDate: expiryDate.toISOString().split('T')[0],
        daysLeft: item.estimatedDaysToExpiry || 7
      };
    });

    console.log('Successfully extracted items:', itemsWithDates.length);

    return new Response(
      JSON.stringify({ items: itemsWithDates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scan-receipt function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process receipt',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
