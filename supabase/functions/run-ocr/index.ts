import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function stripHeader(b64: string): string {
  return b64?.startsWith("data:") ? b64.split(",")[1] : b64;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, image } = await req.json();
    const inputImage = imageBase64 || image;
    
    if (!inputImage) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing imageBase64" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clean = stripHeader(inputImage);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (Deno.env.get('USE_GOOGLE_VISION') === 'true') {
      console.log('Using Google Vision OCR pipeline...');
      
      // Call vision-ocr function
      const visionUrl = `${supabaseUrl}/functions/v1/vision-ocr`;
      const vr = await fetch(visionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: clean })
      });
      
      const vjson = await vr.json();
      
      if (!vjson.ok) {
        return new Response(
          JSON.stringify(vjson), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let out = vjson;

      // Apply quality guardrails
      if (out.confidence < 0.55 || out.text.length < 120) {
        console.log(`Low quality detected: confidence=${out.confidence.toFixed(3)}, length=${out.text.length}`);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "LOW_QUALITY_IMAGE",
            message: "Image quality too low. Please ensure receipt is flat, fills frame, and has no background distractions."
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If confidence is low but acceptable, try tesseract fallback
      const tesseractUrl = Deno.env.get('SERVER_TESSERACT_URL');
      if (out.confidence < 0.75 && tesseractUrl) {
        console.log('Vision confidence < 0.75, trying Tesseract fallback...');
        try {
          const tr = await fetch(tesseractUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: clean })
          });
          const tjson = await tr.json();
          if (tjson.ok) {
            out = { ...tjson, engine: "tesseract-fallback" };
            console.log('Using Tesseract fallback result');
          }
        } catch (e) {
          console.log('Tesseract fallback failed, using Vision result:', e);
        }
      }

      return new Response(
        JSON.stringify(out), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      
    } else {
      console.log('Using Tesseract-only pipeline...');
      const tesseractUrl = Deno.env.get('SERVER_TESSERACT_URL') || `${supabaseUrl}/functions/v1/tesseract-ocr`;
      
      const tr = await fetch(tesseractUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: clean })
      });
      
      const tjson = await tr.json();

      // Apply quality guardrails
      if (tjson.ok && (tjson.confidence < 0.55 || tjson.text.length < 120)) {
        console.log(`Low quality detected: confidence=${tjson.confidence}, length=${tjson.text.length}`);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: "LOW_QUALITY_IMAGE",
            message: "Image quality too low. Please ensure receipt is flat, fills frame, and has no background distractions."
          }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(tjson), 
        { status: tr.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (e: any) {
    console.error('Upload OCR error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? "Upload OCR error" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
