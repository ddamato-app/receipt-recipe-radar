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
        JSON.stringify({ ok: false, error: "MISSING_IMAGE_BASE64" }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "GOOGLE_VISION_API_KEY_NOT_CONFIGURED" }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calling Google Vision API with image length: ${imageBase64.length}`);

    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              imageContext: { languageHints: ["en", "fr"] }
            }
          ]
        })
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Vision API error:', visionResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: "VISION_API_ERROR", 
          status: visionResponse.status,
          details: errorText 
        }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const visionData = await visionResponse.json();
    const text = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
    
    // Compute confidence from symbol-level confidences if available
    let confidence = 0.9; // default
    const pages = visionData.responses?.[0]?.fullTextAnnotation?.pages || [];
    if (pages.length > 0) {
      const confidences: number[] = [];
      for (const page of pages) {
        for (const block of page.blocks || []) {
          for (const paragraph of block.paragraphs || []) {
            for (const word of paragraph.words || []) {
              for (const symbol of word.symbols || []) {
                if (symbol.confidence) confidences.push(symbol.confidence);
              }
            }
          }
        }
      }
      if (confidences.length > 0) {
        confidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      }
    }

    console.log(`Vision OCR completed: ${text.length} chars, confidence: ${confidence.toFixed(3)}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        engine: "vision", 
        text, 
        confidence 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Vision OCR error:', error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: "VISION_OCR_EXCEPTION",
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
