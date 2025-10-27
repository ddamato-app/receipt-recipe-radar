import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import Tesseract for Deno
// Note: This is a placeholder - actual Tesseract.js import for Deno would need proper setup
// For now, we'll use a fetch-based approach or indicate it needs to be run elsewhere

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing imageBase64" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Strip data URL header if present
    const cleanBase64 = imageBase64.startsWith("data:") 
      ? imageBase64.split(",")[1] 
      : imageBase64;

    // Since Tesseract.js doesn't run well in Deno Edge runtime,
    // we'll return a mock response indicating it needs Node.js runtime
    // In a real implementation, this would be deployed separately or use a different approach
    
    console.log('Tesseract OCR called - Note: Full Tesseract.js requires Node.js runtime');
    
    // For now, return a fallback response
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: "Tesseract OCR requires Node.js runtime - not available in Edge functions. Please use Vision API." 
      }), 
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    // If this were in a Node.js environment, the code would be:
    /*
    const Tesseract = require('tesseract.js');
    const buf = Buffer.from(cleanBase64, 'base64');
    
    const { data } = await Tesseract.recognize(buf, 'eng+fra', {
      tessedit_pageseg_mode: 6,
      tessedit_ocr_engine_mode: 1
    });
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        engine: "tesseract", 
        text: data.text.trim(), 
        confidence: (data.confidence || 60) / 100 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    */

  } catch (error) {
    console.error('Tesseract OCR error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
