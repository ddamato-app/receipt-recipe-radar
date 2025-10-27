import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OCRToken {
  text: string;
  conf: number;
  box: number[]; // [x, y, width, height]
}

interface OCRResult {
  text: string;
  tokens?: OCRToken[];
  meanConfidence?: number;
  lineConfidences?: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    console.log('Starting OCR process...');
    
    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Run OCR with our advanced pipeline
    const result = await runOCR(buffer);
    
    console.log('OCR completed successfully');
    console.log('Mean confidence:', result.meanConfidence);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in OCR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Call Google Vision API for OCR
 */
async function runGoogleVisionOCR(imageBuffer: Uint8Array): Promise<OCRResult | null> {
  const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  if (!apiKey) {
    console.log('Google Vision API key not configured, skipping');
    return null;
  }

  try {
    console.log('Calling Google Vision API...');
    
    const base64Image = btoa(String.fromCharCode(...imageBuffer));
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Google Vision API error:', response.status);
      return null;
    }

    const data = await response.json();
    const annotation = data.responses?.[0]?.fullTextAnnotation;
    
    if (!annotation) {
      console.log('No text detected by Google Vision');
      return null;
    }

    // Extract text and calculate confidence
    const text = annotation.text || '';
    const pages = annotation.pages || [];
    
    // Calculate mean confidence from words
    let totalConf = 0;
    let wordCount = 0;
    
    pages.forEach((page: any) => {
      page.blocks?.forEach((block: any) => {
        block.paragraphs?.forEach((paragraph: any) => {
          paragraph.words?.forEach((word: any) => {
            if (word.confidence !== undefined) {
              totalConf += word.confidence;
              wordCount++;
            }
          });
        });
      });
    });

    const meanConfidence = wordCount > 0 ? totalConf / wordCount : 0;
    
    console.log('Google Vision confidence:', meanConfidence);
    
    return {
      text,
      meanConfidence,
      tokens: [], // Google Vision tokens could be extracted if needed
    };
  } catch (error) {
    console.error('Google Vision error:', error);
    return null;
  }
}

/**
 * Run OCR with Google Vision first, fallback to Tesseract if needed
 */
async function runOCR(imageBuffer: Uint8Array): Promise<OCRResult> {
  // Try Google Vision first
  const visionResult = await runGoogleVisionOCR(imageBuffer);
  
  if (visionResult && visionResult.meanConfidence && visionResult.meanConfidence >= 0.75) {
    console.log('Using Google Vision result (high confidence)');
    return visionResult;
  }
  
  if (visionResult) {
    console.log(`Google Vision confidence ${visionResult.meanConfidence} < 0.75, falling back to Tesseract`);
  }
  
  // Fallback to Tesseract with preprocessing
  console.log('Using Tesseract OCR...');
  
  // Convert buffer to base64 for Tesseract.js API
  const base64Image = btoa(String.fromCharCode(...imageBuffer));
  const imageDataUrl = `data:image/png;base64,${base64Image}`;
  
  console.log('Pass 1: Full page OCR with PSM 6 (uniform block)...');
  
  // Pass 1: Full page with PSM 6 (uniform block of text)
  const pass1Result = await runTesseractOCR(imageDataUrl, {
    lang: 'eng+fra',
    oem: 1, // LSTM only
    psm: 6, // Uniform block of text
  });
  
  console.log('Pass 1 confidence:', pass1Result.meanConfidence);
  
  // Detect if there are multiple columns
  const hasMultipleColumns = detectMultipleColumns(pass1Result.tokens || []);
  console.log('Multiple columns detected:', hasMultipleColumns);
  
  let bestResult = pass1Result;
  
  // If multiple columns detected, retry with PSM 4 (single column)
  if (hasMultipleColumns) {
    console.log('Pass 2: Retrying with PSM 4 (single column)...');
    
    const pass2Result = await runTesseractOCR(imageDataUrl, {
      lang: 'eng+fra',
      oem: 1,
      psm: 4, // Single column of text
    });
    
    console.log('Pass 2 confidence:', pass2Result.meanConfidence);
    
    // Take the result with higher mean confidence
    if (pass2Result.meanConfidence && pass1Result.meanConfidence) {
      bestResult = pass2Result.meanConfidence > pass1Result.meanConfidence 
        ? pass2Result 
        : pass1Result;
      
      console.log('Selected result with confidence:', bestResult.meanConfidence);
    }
  }
  
  // Pass 3: Region-based price detection
  console.log('Pass 3: Region-based price detection...');
  const priceTokens = await detectPricesInRegions(imageDataUrl, bestResult.tokens || []);
  
  // Merge price tokens with main result
  const enhancedTokens = mergePriceTokens(bestResult.tokens || [], priceTokens);
  
  // Calculate line confidences
  const lineConfidences = calculateLineConfidences(enhancedTokens);
  
  return {
    text: bestResult.text,
    tokens: enhancedTokens,
    meanConfidence: bestResult.meanConfidence,
    lineConfidences,
  };
}

interface TesseractConfig {
  lang: string;
  oem: number;
  psm: number;
  whitelist?: string;
}

/**
 * Run Tesseract OCR with specified configuration
 * Note: This is a mock implementation. In production, you'd use actual Tesseract
 */
async function runTesseractOCR(
  imageDataUrl: string, 
  config: TesseractConfig
): Promise<OCRResult> {
  // This is a placeholder for actual Tesseract.js integration
  // In production, you would:
  // 1. Import Tesseract.js worker
  // 2. Create worker with specified config
  // 3. Run recognition
  // 4. Parse results
  
  console.log('Running Tesseract with config:', config);
  
  // Mock implementation - would be replaced with actual Tesseract.js
  const mockText = `METRO
Date: 2024-10-27
Receipt #12345

PRODUCE
Bananas              2.99
Apples 1kg           4.50
Lettuce              2.25

DAIRY
Milk 2L              3.99
Cheese               5.75

SUBTOTAL            19.48
TAX (GST+QST)        2.92
TOTAL               22.40

Thank you!`;

  const mockTokens: OCRToken[] = [
    { text: 'METRO', conf: 0.95, box: [100, 50, 150, 40] },
    { text: 'Date:', conf: 0.92, box: [100, 100, 80, 30] },
    { text: '2024-10-27', conf: 0.94, box: [190, 100, 150, 30] },
    { text: 'Bananas', conf: 0.91, box: [100, 200, 120, 30] },
    { text: '2.99', conf: 0.96, box: [400, 200, 80, 30] },
    { text: 'Apples', conf: 0.89, box: [100, 240, 100, 30] },
    { text: '1kg', conf: 0.90, box: [210, 240, 60, 30] },
    { text: '4.50', conf: 0.97, box: [400, 240, 80, 30] },
    { text: 'TOTAL', conf: 0.93, box: [100, 600, 100, 40] },
    { text: '22.40', conf: 0.98, box: [400, 600, 80, 40] },
  ];

  const meanConf = mockTokens.reduce((sum, t) => sum + t.conf, 0) / mockTokens.length;

  return {
    text: mockText,
    tokens: mockTokens,
    meanConfidence: meanConf,
  };
}

/**
 * Detect if text has multiple columns based on token positions
 */
function detectMultipleColumns(tokens: OCRToken[]): boolean {
  if (tokens.length < 10) return false;
  
  // Group tokens by Y position (with some tolerance)
  const lineGroups: { [key: number]: OCRToken[] } = {};
  const yTolerance = 15;
  
  tokens.forEach(token => {
    const y = token.box[1];
    const lineKey = Math.floor(y / yTolerance);
    
    if (!lineGroups[lineKey]) {
      lineGroups[lineKey] = [];
    }
    lineGroups[lineKey].push(token);
  });
  
  // Check if any line has tokens significantly separated horizontally
  let multiColumnLines = 0;
  
  Object.values(lineGroups).forEach(lineTokens => {
    if (lineTokens.length < 2) return;
    
    // Sort by X position
    const sorted = [...lineTokens].sort((a, b) => a.box[0] - b.box[0]);
    
    // Check for large gaps
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].box[0] - (sorted[i-1].box[0] + sorted[i-1].box[2]);
      
      // If gap is larger than 3x average token width, likely multiple columns
      const avgWidth = sorted.reduce((sum, t) => sum + t.box[2], 0) / sorted.length;
      if (gap > avgWidth * 3) {
        multiColumnLines++;
        break;
      }
    }
  });
  
  // If more than 30% of lines have column gaps, assume multiple columns
  return multiColumnLines / Object.keys(lineGroups).length > 0.3;
}

/**
 * Detect prices in specific regions with digit whitelist
 */
async function detectPricesInRegions(
  imageDataUrl: string,
  tokens: OCRToken[]
): Promise<OCRToken[]> {
  console.log('Detecting price regions...');
  
  // Identify potential price regions (right side of receipt, aligned numbers)
  const priceRegions = identifyPriceRegions(tokens);
  
  if (priceRegions.length === 0) {
    console.log('No price regions detected');
    return [];
  }
  
  console.log(`Found ${priceRegions.length} price regions`);
  
  // Run OCR on each region with digit whitelist
  const priceTokens: OCRToken[] = [];
  
  for (const region of priceRegions) {
    const regionResult = await runTesseractOCR(imageDataUrl, {
      lang: 'eng',
      oem: 1,
      psm: 7, // Single text line
      whitelist: '0123456789.,$€£xX@/',
    });
    
    if (regionResult.tokens) {
      // Filter and adjust tokens to region coordinates
      const adjustedTokens = regionResult.tokens.map(token => ({
        ...token,
        box: [
          token.box[0] + region.x,
          token.box[1] + region.y,
          token.box[2],
          token.box[3],
        ],
      }));
      
      priceTokens.push(...adjustedTokens);
    }
  }
  
  return priceTokens;
}

interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Identify regions likely to contain prices
 */
function identifyPriceRegions(tokens: OCRToken[]): Region[] {
  const regions: Region[] = [];
  
  // Find tokens that look like prices (contain digits and decimal points)
  const priceTokens = tokens.filter(token => 
    /\d+[.,]\d{2}/.test(token.text) || /^\d+$/.test(token.text)
  );
  
  if (priceTokens.length === 0) return regions;
  
  // Find the rightmost X position (price column)
  const maxX = Math.max(...priceTokens.map(t => t.box[0]));
  const xTolerance = 50;
  
  // Group tokens by Y position
  const lineGroups: { [key: number]: OCRToken[] } = {};
  const yTolerance = 20;
  
  priceTokens.forEach(token => {
    // Only consider tokens in the rightmost column area
    if (Math.abs(token.box[0] - maxX) <= xTolerance) {
      const lineKey = Math.floor(token.box[1] / yTolerance);
      
      if (!lineGroups[lineKey]) {
        lineGroups[lineKey] = [];
      }
      lineGroups[lineKey].push(token);
    }
  });
  
  // Create regions for each line group
  Object.values(lineGroups).forEach(lineTokens => {
    if (lineTokens.length === 0) return;
    
    const minX = Math.min(...lineTokens.map(t => t.box[0]));
    const minY = Math.min(...lineTokens.map(t => t.box[1]));
    const maxX = Math.max(...lineTokens.map(t => t.box[0] + t.box[2]));
    const maxY = Math.max(...lineTokens.map(t => t.box[1] + t.box[3]));
    
    regions.push({
      x: minX - 10,
      y: minY - 5,
      width: maxX - minX + 20,
      height: maxY - minY + 10,
    });
  });
  
  return regions;
}

/**
 * Merge price tokens with main tokens, preferring higher confidence
 */
function mergePriceTokens(mainTokens: OCRToken[], priceTokens: OCRToken[]): OCRToken[] {
  const merged = [...mainTokens];
  
  priceTokens.forEach(priceToken => {
    // Check if there's an overlapping token in main results
    const overlapIndex = merged.findIndex(mainToken => 
      tokensOverlap(mainToken, priceToken)
    );
    
    if (overlapIndex >= 0) {
      // Replace if price token has higher confidence
      if (priceToken.conf > merged[overlapIndex].conf) {
        merged[overlapIndex] = priceToken;
      }
    } else {
      // Add new token
      merged.push(priceToken);
    }
  });
  
  // Sort by position (top to bottom, left to right)
  return merged.sort((a, b) => {
    const yDiff = a.box[1] - b.box[1];
    if (Math.abs(yDiff) > 10) return yDiff;
    return a.box[0] - b.box[0];
  });
}

/**
 * Check if two tokens overlap spatially
 */
function tokensOverlap(token1: OCRToken, token2: OCRToken): boolean {
  const [x1, y1, w1, h1] = token1.box;
  const [x2, y2, w2, h2] = token2.box;
  
  return !(
    x1 + w1 < x2 ||
    x2 + w2 < x1 ||
    y1 + h1 < y2 ||
    y2 + h2 < y1
  );
}

/**
 * Calculate mean confidence for each line
 */
function calculateLineConfidences(tokens: OCRToken[]): number[] {
  const lineGroups: { [key: number]: OCRToken[] } = {};
  const yTolerance = 20;
  
  tokens.forEach(token => {
    const lineKey = Math.floor(token.box[1] / yTolerance);
    
    if (!lineGroups[lineKey]) {
      lineGroups[lineKey] = [];
    }
    lineGroups[lineKey].push(token);
  });
  
  return Object.keys(lineGroups)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(key => {
      const lineTokens = lineGroups[parseInt(key)];
      const meanConf = lineTokens.reduce((sum, t) => sum + t.conf, 0) / lineTokens.length;
      return meanConf;
    });
}
