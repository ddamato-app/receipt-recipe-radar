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
    const { items } = await req.json();
    
    if (!items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Items array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    console.log(`Updating catalog with ${items.length} items...`);

    // Process each item
    for (const item of items) {
      const { name, brand, category } = item;
      
      if (!name || !category) continue;

      // Try to find existing entry
      const { data: existing } = await supabaseClient
        .from('product_catalog')
        .select('id, confirmed_count')
        .eq('product_name', name)
        .eq('brand', brand || '')
        .eq('category', category)
        .maybeSingle();

      if (existing) {
        // Update existing entry - increment confirmation count
        await supabaseClient
          .from('product_catalog')
          .update({ 
            confirmed_count: existing.confirmed_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        console.log(`Updated: ${brand || 'Unknown'} ${name} (count: ${existing.confirmed_count + 1})`);
      } else {
        // Insert new entry
        await supabaseClient
          .from('product_catalog')
          .insert({
            product_name: name,
            brand: brand || null,
            category: category,
            confirmed_count: 1
          });
        
        console.log(`Added new: ${brand || 'Unknown'} ${name}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated: items.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating catalog:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to update catalog'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
