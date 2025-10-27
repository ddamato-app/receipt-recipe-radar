import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function stripHeader(b64: string): string {
  return b64?.startsWith("data:") ? b64.split(",")[1] : b64;
}

async function postJSON(url: string, body: any): Promise<{ status: number; ok: boolean; json: any }> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let json;
  try { 
    json = JSON.parse(text); 
  } catch { 
    json = { raw: text }; 
  }
  return { status: r.status, ok: r.ok, json };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const diag: any = { step: "start" };
  try {
    const ct = req.headers.get("content-type") || "";
    diag.contentType = ct;

    const body = ct.includes("application/json") ? await req.json() : {};
    const imageBase64Raw = body.imageBase64 || body.image;
    if (!imageBase64Raw) {
      return new Response(JSON.stringify({
        ok: false,
        error: "MISSING_IMAGE_BASE64",
        diag
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const imageBase64 = stripHeader(imageBase64Raw);
    diag.imageLen = imageBase64.length;

    const useVision = Deno.env.get('USE_GOOGLE_VISION') === "true";
    diag.useVision = useVision;

    // Endpoints from secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const visionUrl = Deno.env.get('VISION_EDGE_URL') || `${supabaseUrl}/functions/v1/vision-ocr`;
    const serverTesseractUrl = Deno.env.get('SERVER_TESSERACT_URL') || `${supabaseUrl}/functions/v1/tesseract-ocr`;
    diag.visionUrl = !!visionUrl;
    diag.serverTesseractUrl = !!serverTesseractUrl;

    let result: any = { ok: false, engine: "", confidence: 0, text: "" };

    if (useVision) {
      if (!visionUrl) {
        return new Response(JSON.stringify({
          ok: false, error: "MISSING_VISION_EDGE_URL", diag
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      diag.step = "vision";
      const vr = await postJSON(visionUrl, { imageBase64 });
      diag.visionStatus = vr.status;
      if (!vr.ok) {
        return new Response(JSON.stringify({
          ok: false,
          error: "VISION_NON_2XX",
          upstream: vr.json,
          diag
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      result = vr.json;

      // Low confidence → try server fallback if configured
      if (result.ok && typeof result.confidence === "number" && result.confidence < 0.75) {
        if (!serverTesseractUrl) {
          result.needs_review = true;
          result.review_reason = "LOW_CONFIDENCE_NO_FALLBACK";
          return new Response(JSON.stringify({ ...result, diag }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        diag.step = "tesseract_fallback";
        const tr = await postJSON(serverTesseractUrl, { imageBase64 });
        diag.tesseractStatus = tr.status;
        if (tr.ok && tr.json?.ok) {
          result = { ...tr.json, engine: "tesseract-fallback" };
        } else {
          result.needs_review = true;
          result.review_reason = "LOW_CONFIDENCE_FALLBACK_FAILED";
          result.upstream = tr.json;
        }
        return new Response(JSON.stringify({ ...result, diag }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      return new Response(JSON.stringify({ ...result, diag }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Vision disabled → must have server OCR
    if (!serverTesseractUrl) {
      return new Response(JSON.stringify({
        ok: false, error: "MISSING_SERVER_TESSERACT_URL", diag
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    diag.step = "tesseract_only";
    const tr = await postJSON(serverTesseractUrl, { imageBase64 });
    diag.tesseractStatus = tr.status;
    return new Response(JSON.stringify({ ...tr.json, diag }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    console.error("EDGE_UNCAUGHT", e);
    return new Response(JSON.stringify({
      ok: false, 
      error: "EDGE_UNCAUGHT", 
      message: e?.message ?? String(e), 
      diag
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
