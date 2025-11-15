import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
            content: `You are an expert at reading grocery receipts in both French and English. Extract ALL items from the receipt, including:
- Detect the language of the receipt (French or English)
- Product names (expand abbreviations to full names in the detected language, e.g., "MLKY" -> "Milk"/"Lait", "STRWBRY" -> "Strawberries"/"Fraises")
- Quantities (if listed, otherwise default to 1)
- Units (pcs, kg, g, liters, ml, etc.)
- Categories (Dairy, Fruits, Vegetables, Meat, Beverages, Snacks, etc.)
- Approximate expiration dates based on product type
- Prices (extract the individual item price if visible, otherwise set to 0)

Return ONLY valid JSON with this structure:
{
  "language": "en|fr",
  "items": [
    {
      "name": "Full product name in the detected language",
      "quantity": number,
      "unit": "pcs|kg|g|liters|ml",
      "category": "Dairy|Fruits|Vegetables|Meat|Beverages|Snacks|Other",
      "estimatedDaysToExpiry": number,
      "price": number
    }
  ]
}`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please detect if this receipt is in French or English, then extract all items from this grocery receipt. Expand any abbreviated product names to their full names in the detected language. Extract prices for each item if visible."
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
