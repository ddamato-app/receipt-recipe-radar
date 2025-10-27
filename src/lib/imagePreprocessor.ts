/**
 * Image preprocessing utilities for receipt scanning
 * Enhances image quality before OCR to improve text recognition
 */

export interface PreprocessedImage {
  dataUrl: string;
  width: number;
  height: number;
  wasRotated: boolean;
  adjustments: string[];
}

/**
 * Preprocess an image file for optimal OCR results
 */
export async function preprocessReceiptImage(file: File): Promise<PreprocessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const processed = enhanceImage(img);
          resolve(processed);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Enhance image for better OCR recognition
 */
function enhanceImage(img: HTMLImageElement): PreprocessedImage {
  const adjustments: string[] = [];
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set optimal size (max 2000px on longest side)
  const maxSize = 2000;
  let width = img.width;
  let height = img.height;

  if (width > maxSize || height > maxSize) {
    if (width > height) {
      height = (height / width) * maxSize;
      width = maxSize;
    } else {
      width = (width / height) * maxSize;
      height = maxSize;
    }
    adjustments.push('Resized');
  }

  canvas.width = width;
  canvas.height = height;

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 1. Convert to grayscale and enhance contrast
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale conversion
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Enhance contrast (increase difference from middle gray)
    const contrast = 1.3;
    let enhanced = ((avg - 128) * contrast) + 128;
    
    // Clip values
    enhanced = Math.max(0, Math.min(255, enhanced));
    
    data[i] = enhanced;     // R
    data[i + 1] = enhanced; // G
    data[i + 2] = enhanced; // B
  }
  adjustments.push('Grayscale + Contrast');

  // 2. Sharpen (simple edge enhancement)
  const sharpenedData = sharpenImage(data, width, height);
  for (let i = 0; i < data.length; i++) {
    data[i] = sharpenedData[i];
  }
  adjustments.push('Sharpened');

  // 3. Adaptive thresholding (make text darker, background lighter)
  const threshold = calculateOtsuThreshold(data);
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }
  adjustments.push('Thresholded');

  // Put processed data back
  ctx.putImageData(imageData, 0, 0);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width,
    height,
    wasRotated: false,
    adjustments,
  };
}

/**
 * Simple sharpening filter
 */
function sharpenImage(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const output = new Uint8ClampedArray(data.length);
  
  // Sharpen kernel
  const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          sum += data[idx] * kernel[kernelIdx];
        }
      }
      
      const idx = (y * width + x) * 4;
      const value = Math.max(0, Math.min(255, sum));
      output[idx] = value;
      output[idx + 1] = value;
      output[idx + 2] = value;
      output[idx + 3] = 255;
    }
  }

  return output;
}

/**
 * Calculate optimal threshold using Otsu's method
 */
function calculateOtsuThreshold(data: Uint8ClampedArray): number {
  // Build histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
  }

  const total = data.length / 4;

  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let wF = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];

    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold;
}
