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
    const { image } = await req.json();
    
    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Process the image
    const processedBuffer = await preprocessReceiptImage(buffer);
    
    // Convert back to base64
    const processedBase64 = btoa(String.fromCharCode(...processedBuffer));
    
    return new Response(
      JSON.stringify({ 
        processedImage: `data:image/png;base64,${processedBase64}`,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error preprocessing receipt:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Preprocesses receipt image with advanced CV operations
 * Returns cleaned PNG buffer optimized for OCR
 */
async function preprocessReceiptImage(inputBuffer: Uint8Array): Promise<Uint8Array> {
  // Decode image to get raw pixel data
  // For Deno, we'll work with the raw pixel buffer
  // This is a simplified approach - in production you'd use an image library
  
  // For now, create a mock structure (you'd decode the actual image here)
  // Using a placeholder - in real implementation, use an image decoder library
  const { data, width, height } = await decodeImage(inputBuffer);
  
  // 1. Convert to grayscale
  grayscale(data);
  
  // 2. Bilateral filter (edge-preserving smoothing)
  const filtered = bilateralFilter(data, width, height, 9, 75, 75);
  
  // 3. Adaptive threshold (Gaussian)
  const thresholded = adaptiveThresholdGaussian(filtered, width, height, 35, 2);
  
  // 4. Deskew image
  const deskewed = deskewImage(thresholded, width, height);
  
  // 5. Crop borders
  const cropped = cropBorders(deskewed.data, deskewed.width, deskewed.height);
  
  // 6. Remove background (set to solid gray)
  removeBackground(cropped.data, 240); // Light gray background
  
  // 7. Apply unsharp mask (sharpening)
  const sharpened = unsharpMask(cropped.data, cropped.width, cropped.height, 0.5, 1.5);
  
  // Encode to PNG
  const pngBuffer = await encodeToPNG(sharpened, cropped.width, cropped.height);
  
  return pngBuffer;
}

// Helper to decode image (simplified - would use actual decoder in production)
async function decodeImage(buffer: Uint8Array): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  // This is a placeholder - in production, use an image decoding library
  // For now, return mock data structure
  const width = 800;
  const height = 1200;
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Fill with white background
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = 255;
  }
  
  return { data, width, height };
}

// Helper to encode to PNG (simplified - would use actual encoder in production)
async function encodeToPNG(data: Uint8ClampedArray, width: number, height: number): Promise<Uint8Array> {
  // This is a placeholder - in production, use a PNG encoding library
  // For now, return the raw data wrapped
  return new Uint8Array(data);
}

function grayscale(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
}

function bilateralFilter(
  data: Uint8ClampedArray, 
  width: number, 
  height: number,
  d: number = 9,
  sigmaColor: number = 75,
  sigmaSpace: number = 75
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = Math.floor(d / 2);
  
  // Precompute spatial Gaussian weights
  const spatialWeights: number[][] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    spatialWeights[dy + radius] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      spatialWeights[dy + radius][dx + radius] = Math.exp(-(dist * dist) / (2 * sigmaSpace * sigmaSpace));
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const centerIntensity = data[idx];
      
      let sum = 0;
      let weightSum = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const nIdx = (ny * width + nx) * 4;
          
          const intensity = data[nIdx];
          const colorDiff = Math.abs(intensity - centerIntensity);
          
          const colorWeight = Math.exp(-(colorDiff * colorDiff) / (2 * sigmaColor * sigmaColor));
          const spatialWeight = spatialWeights[dy + radius][dx + radius];
          const weight = colorWeight * spatialWeight;
          
          sum += intensity * weight;
          weightSum += weight;
        }
      }
      
      const filtered = sum / weightSum;
      output[idx] = output[idx + 1] = output[idx + 2] = filtered;
      output[idx + 3] = 255;
    }
  }
  
  return output;
}

function adaptiveThresholdGaussian(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  blockSize: number = 35,
  C: number = 2
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = Math.floor(blockSize / 2);
  
  // Compute Gaussian kernel
  const sigma = blockSize / 6;
  const kernel: number[][] = [];
  let kernelSum = 0;
  
  for (let dy = -radius; dy <= radius; dy++) {
    kernel[dy + radius] = [];
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const weight = Math.exp(-(dist * dist) / (2 * sigma * sigma));
      kernel[dy + radius][dx + radius] = weight;
      kernelSum += weight;
    }
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    for (let j = 0; j < kernel[i].length; j++) {
      kernel[i][j] /= kernelSum;
    }
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pixelValue = data[idx];
      
      // Compute local weighted mean
      let weightedSum = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          const nIdx = (ny * width + nx) * 4;
          
          weightedSum += data[nIdx] * kernel[dy + radius][dx + radius];
        }
      }
      
      const threshold = weightedSum - C;
      const value = pixelValue > threshold ? 255 : 0;
      
      output[idx] = output[idx + 1] = output[idx + 2] = value;
      output[idx + 3] = 255;
    }
  }
  
  return output;
}

function deskewImage(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { data: Uint8ClampedArray; width: number; height: number } {
  // Detect skew angle using projection profile method
  const angle = detectSkewAngle(data, width, height);
  
  if (Math.abs(angle) < 0.5) {
    // No significant skew, return as is
    return { data, width, height };
  }
  
  // Rotate image
  return rotateImage(data, width, height, -angle);
}

function detectSkewAngle(data: Uint8ClampedArray, width: number, height: number): number {
  const maxAngle = 15;
  const angleStep = 0.5;
  let bestAngle = 0;
  let maxScore = 0;
  
  for (let angle = -maxAngle; angle <= maxAngle; angle += angleStep) {
    const score = calculateProjectionScore(data, width, height, angle);
    if (score > maxScore) {
      maxScore = score;
      bestAngle = angle;
    }
  }
  
  return bestAngle;
}

function calculateProjectionScore(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  angle: number
): number {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const projection: number[] = new Array(height).fill(0);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] === 0) { // Black pixel
        const projY = Math.floor(y * cos - x * sin + height / 2);
        if (projY >= 0 && projY < height) {
          projection[projY]++;
        }
      }
    }
  }
  
  // Calculate variance (higher variance = better alignment)
  const mean = projection.reduce((a, b) => a + b, 0) / projection.length;
  const variance = projection.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / projection.length;
  
  return variance;
}

function rotateImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  angle: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  
  const output = new Uint8ClampedArray(data.length);
  output.fill(255); // White background
  
  const cx = width / 2;
  const cy = height / 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      
      const srcX = Math.round(dx * cos - dy * sin + cx);
      const srcY = Math.round(dx * sin + dy * cos + cy);
      
      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * width + x) * 4;
        
        output[dstIdx] = data[srcIdx];
        output[dstIdx + 1] = data[srcIdx + 1];
        output[dstIdx + 2] = data[srcIdx + 2];
        output[dstIdx + 3] = 255;
      }
    }
  }
  
  return { data: output, width, height };
}

function cropBorders(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { data: Uint8ClampedArray; width: number; height: number } {
  // Find content bounds
  let minX = width, maxX = 0, minY = height, maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx] < 200) { // Not white/background
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  // Add small padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  
  const newWidth = maxX - minX + 1;
  const newHeight = maxY - minY + 1;
  const output = new Uint8ClampedArray(newWidth * newHeight * 4);
  
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcIdx = ((y + minY) * width + (x + minX)) * 4;
      const dstIdx = (y * newWidth + x) * 4;
      
      output[dstIdx] = data[srcIdx];
      output[dstIdx + 1] = data[srcIdx + 1];
      output[dstIdx + 2] = data[srcIdx + 2];
      output[dstIdx + 3] = 255;
    }
  }
  
  return { data: output, width: newWidth, height: newHeight };
}

function removeBackground(data: Uint8ClampedArray, grayValue: number = 240): void {
  // Replace white/near-white pixels with solid gray
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 200) {
      data[i] = data[i + 1] = data[i + 2] = grayValue;
    }
  }
}

function unsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number = 0.5,
  radius: number = 1.5
): Uint8ClampedArray {
  // 1. Create blurred version (Gaussian blur)
  const blurred = gaussianBlur(data, width, height, radius);
  
  // 2. Subtract blurred from original and add back
  const output = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    const sharpened = data[i] + amount * (data[i] - blurred[i]);
    const value = Math.max(0, Math.min(255, sharpened));
    
    output[i] = output[i + 1] = output[i + 2] = value;
    output[i + 3] = 255;
  }
  
  return output;
}

function gaussianBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sigma: number
): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  const radius = Math.ceil(sigma * 3);
  
  // Create Gaussian kernel
  const kernel: number[] = [];
  let kernelSum = 0;
  
  for (let i = -radius; i <= radius; i++) {
    const weight = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(weight);
    kernelSum += weight;
  }
  
  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= kernelSum;
  }
  
  // Horizontal pass
  const temp = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const nx = Math.min(Math.max(x + i, 0), width - 1);
        const idx = (y * width + nx) * 4;
        sum += data[idx] * kernel[i + radius];
      }
      
      const idx = (y * width + x) * 4;
      temp[idx] = temp[idx + 1] = temp[idx + 2] = sum;
      temp[idx + 3] = 255;
    }
  }
  
  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      
      for (let i = -radius; i <= radius; i++) {
        const ny = Math.min(Math.max(y + i, 0), height - 1);
        const idx = (ny * width + x) * 4;
        sum += temp[idx] * kernel[i + radius];
      }
      
      const idx = (y * width + x) * 4;
      output[idx] = output[idx + 1] = output[idx + 2] = sum;
      output[idx + 3] = 255;
    }
  }
  
  return output;
}
