const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha1Hex(buffer: Uint8Array): Promise<string> {
  // Create a proper ArrayBuffer for crypto.subtle
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  view.set(buffer);
  
  const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function guessMimeType(buffer: Uint8Array): string {
  // Check magic bytes
  if (buffer.length < 4) return 'unknown';
  
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  
  // WebP: RIFF ... WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length >= 12 && 
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }
  
  // HEIC: ftyp ... heic/heix/mif1
  if (buffer.length >= 12 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    const brand = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
    if (brand === 'heic' || brand === 'heix' || brand === 'mif1') {
      return 'image/heic';
    }
  }
  
  return 'unknown';
}

function getImageDimensions(buffer: Uint8Array, mimeType: string): { width?: number; height?: number } {
  try {
    if (mimeType === 'image/png' && buffer.length >= 24) {
      // PNG IHDR chunk at bytes 16-23
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      return { width, height };
    }
    
    if (mimeType === 'image/jpeg' && buffer.length >= 2) {
      // Simple JPEG dimension parser (looks for SOF0/SOF2 markers)
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          // SOF0 (0xC0) or SOF2 (0xC2)
          if (marker === 0xC0 || marker === 0xC2) {
            const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
            const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
            return { width, height };
          }
          // Skip to next marker
          const segmentLength = (buffer[offset + 2] << 8) | buffer[offset + 3];
          offset += segmentLength + 2;
        } else {
          offset++;
        }
      }
    }
  } catch (e) {
    console.error('Error parsing dimensions:', e);
  }
  
  return {};
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing imageBase64' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if data URL prefix is present
    const hasDataPrefix = imageBase64.startsWith('data:');
    let cleanBase64 = imageBase64;
    
    if (hasDataPrefix) {
      const commaIndex = imageBase64.indexOf(',');
      if (commaIndex !== -1) {
        cleanBase64 = imageBase64.substring(commaIndex + 1);
      }
    }

    // Decode to buffer
    const buffer = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
    const bytes = buffer.length;
    
    // Compute SHA-1
    const sha1 = await sha1Hex(buffer);
    
    // Guess MIME type
    const mimeGuess = guessMimeType(buffer);
    
    // Get dimensions
    const { width, height } = getImageDimensions(buffer, mimeGuess);
    
    // Build response
    const response: any = {
      ok: true,
      bytes,
      sha1,
      mimeGuess,
      base64PrefixPresent: hasDataPrefix,
      base64Length: cleanBase64.length,
    };
    
    if (width && height) {
      response.dimensions = { width, height };
    }
    
    // Add warnings
    const warnings: string[] = [];
    if (bytes < 50000) {
      warnings.push('image probably a thumbnail (< 50KB)');
    }
    if (width && width < 800) {
      warnings.push('image probably a thumbnail (width < 800px)');
    }
    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    console.log('Image diagnostics:', response);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('OCR debug error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || 'Diagnostic error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
