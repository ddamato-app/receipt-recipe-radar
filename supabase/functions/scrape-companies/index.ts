import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, location, industry, maxResults = 20 } = await req.json();

    // Get user's Google Places API key from agency settings
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('google_places_api_key')
      .eq('user_id', user.id)
      .maybeSingle();

    const apiKey = settings?.google_places_api_key;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured. Add it in Agency Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create scrape job record
    const { data: job, error: jobError } = await supabase
      .from('scrape_jobs')
      .insert({
        user_id: user.id,
        query: query || industry,
        location,
        industry,
        status: 'running',
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Call Google Places Text Search API
    const searchQuery = [query || industry, location].filter(Boolean).join(' in ');
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;

    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      await supabase
        .from('scrape_jobs')
        .update({ status: 'failed', error_message: `Google API error: ${placesData.status}` })
        .eq('id', job.id);

      return new Response(
        JSON.stringify({ error: `Google Places API error: ${placesData.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const places = (placesData.results || []).slice(0, maxResults);
    const leads: Record<string, unknown>[] = [];

    // Fetch Place Details for contact info
    for (const place of places) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,website,formatted_address,url&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const d = detailsData.result || {};

        const addrParts = (d.formatted_address || place.formatted_address || '').split(',');
        const city = addrParts.length >= 2 ? addrParts[addrParts.length - 2]?.trim() : null;
        const stateZip = addrParts.length >= 1 ? addrParts[addrParts.length - 1]?.trim() : null;
        const state = stateZip ? stateZip.split(' ')[0] : null;

        leads.push({
          user_id: user.id,
          company_name: d.name || place.name,
          phone: d.formatted_phone_number || null,
          website: d.website || null,
          address: d.formatted_address || place.formatted_address || null,
          city,
          state,
          industry: industry || null,
          source: 'scraped',
          status: 'new',
        });
      } catch {
        // Skip failed place details
      }
    }

    // Insert leads into DB (ignore duplicates by company_name + user)
    let insertedCount = 0;
    if (leads.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert(leads)
        .select('id');

      if (!insertError) {
        insertedCount = inserted?.length ?? 0;
      }
    }

    // Update job as completed
    await supabase
      .from('scrape_jobs')
      .update({
        status: 'completed',
        results_count: insertedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id);

    return new Response(
      JSON.stringify({ jobId: job.id, results: insertedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
