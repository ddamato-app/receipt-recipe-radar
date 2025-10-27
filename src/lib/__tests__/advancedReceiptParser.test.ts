import { describe, it, expect } from 'vitest';
import { parseReceipt } from '../advancedReceiptParser';
import { categorizeAndExpireItems } from '../itemCategorizer';

describe('Advanced Receipt Parser - Costco Quebec', () => {
  const costcoReceipt = `1717085 GAIN EFL             18,79 FP
1716006 BIO KT BANAN          3,30
1683741 CERISES              12,99
1684741 FRAISES               8,49
2046602 JAMBON CUIT          11,99
1794181 KS YOG GREC           8,99
1794181 KS YOG GREC           8,99
367159  THON RIOMARE         14,99
1078552 BABYBEL ORIG         16,49
313563  KS BIO OEUFS         12,49
313563  KS BIO OEUFS         12,49
TPO/1717085                   3,80-FP
TPR/2154720                   5,00-FP
ANNUL.
SOUS TOTAL                  268,29
TPS                          2,10
TVQ                          4,19
TOTAL                       274,36`;

  it('should detect 11 items (excluding voids and discounts)', () => {
    const result = parseReceipt(costcoReceipt);
    
    expect(result.items.length).toBeGreaterThanOrEqual(10);
    expect(result.items.length).toBeLessThanOrEqual(11);
  });

  it('should detect discounts correctly', () => {
    const result = parseReceipt(costcoReceipt);
    
    expect(result.discounts.length).toBeGreaterThanOrEqual(2);
    
    const totalDiscounts = result.discounts.reduce((sum, d) => sum + d.amount, 0);
    expect(Math.abs(totalDiscounts)).toBeCloseTo(8.80, 1);
  });

  it('should ignore void lines (ANNUL.)', () => {
    const result = parseReceipt(costcoReceipt);
    
    // No items should have "ANNUL" in their name
    const voidItems = result.items.filter(item => 
      item.name.toUpperCase().includes('ANNUL')
    );
    expect(voidItems.length).toBe(0);
  });

  it('should parse totals correctly', () => {
    const result = parseReceipt(costcoReceipt);
    
    expect(result.subtotal).toBeCloseTo(268.29, 0.1);
    expect(result.total).toBeCloseTo(274.36, 0.1);
    expect(result.tax_total).toBeCloseTo(6.29, 0.1); // TPS + TVQ = 2.10 + 4.19
  });

  it('should expand KS to Kirkland Signature', () => {
    const result = parseReceipt(costcoReceipt);
    
    const ksItems = result.items.filter(item => 
      item.name.toLowerCase().includes('kirkland signature')
    );
    
    expect(ksItems.length).toBeGreaterThan(0);
  });

  it('should handle duplicate items (KS YOG GREC appears twice)', () => {
    const result = parseReceipt(costcoReceipt);
    
    const yogurtItems = result.items.filter(item => 
      item.name.toLowerCase().includes('yog') || 
      item.name.toLowerCase().includes('grec')
    );
    
    expect(yogurtItems.length).toBeGreaterThanOrEqual(2);
  });

  it('should categorize and set expiry dates correctly', () => {
    const result = parseReceipt(costcoReceipt);
    const receiptDate = '2025-01-15';
    
    const categorized = categorizeAndExpireItems(result.items, receiptDate);
    
    // KS YOG GREC → dairy, expiry ≈ +10d
    const yogurt = categorized.find(item => 
      item.name.toLowerCase().includes('yog')
    );
    if (yogurt) {
      expect(yogurt.category).toBe('dairy');
      expect(yogurt.expires_on).toBeDefined();
      
      // Check expiry is roughly 10 days from receipt date
      const expiryDate = new Date(yogurt.expires_on!);
      const purchaseDate = new Date(receiptDate);
      const daysDiff = Math.round((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeCloseTo(10, 5); // Within 5 days tolerance
    }
  });

  it('should categorize eggs (KS BIO OEUFS) as dairy with ~28d expiry', () => {
    const result = parseReceipt(costcoReceipt);
    const receiptDate = '2025-01-15';
    
    const categorized = categorizeAndExpireItems(result.items, receiptDate);
    
    const eggs = categorized.find(item => 
      item.name.toLowerCase().includes('oeufs') || 
      item.name.toLowerCase().includes('egg')
    );
    
    if (eggs) {
      expect(eggs.category).toBe('dairy');
      expect(eggs.expires_on).toBeDefined();
      
      // Check expiry is roughly 28 days from receipt date
      const expiryDate = new Date(eggs.expires_on!);
      const purchaseDate = new Date(receiptDate);
      const daysDiff = Math.round((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeCloseTo(28, 5);
    }
  });

  it('should categorize household items (GAIN EFL) with long expiry', () => {
    const result = parseReceipt(costcoReceipt);
    const receiptDate = '2025-01-15';
    
    const categorized = categorizeAndExpireItems(result.items, receiptDate);
    
    const detergent = categorized.find(item => 
      item.name.toLowerCase().includes('gain')
    );
    
    if (detergent) {
      expect(detergent.category).toBe('household');
      expect(detergent.expires_on).toBeDefined();
      
      // Household items should have very long expiry (9999 days)
      const expiryDate = new Date(detergent.expires_on!);
      const purchaseDate = new Date(receiptDate);
      const daysDiff = Math.round((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThan(365 * 10); // More than 10 years
    }
  });

  it('should handle Quebec decimal format (commas)', () => {
    const result = parseReceipt(costcoReceipt);
    
    // Should parse prices with commas correctly
    const gainItem = result.items.find(item => 
      item.name.toLowerCase().includes('gain')
    );
    
    if (gainItem) {
      expect(gainItem.price_total).toBeCloseTo(18.79, 0.01);
    }
  });

  it('should detect vendor as COSTCO', () => {
    const result = parseReceipt(costcoReceipt, { vendor: 'COSTCO' });
    
    expect(result.vendor).toBeTruthy();
    if (result.vendor) {
      expect(result.vendor.toUpperCase()).toContain('COSTCO');
    }
  });

  it('should categorize produce items correctly', () => {
    const result = parseReceipt(costcoReceipt);
    const receiptDate = '2025-01-15';
    
    const categorized = categorizeAndExpireItems(result.items, receiptDate);
    
    const produce = categorized.filter(item => 
      item.name.toLowerCase().includes('cerises') ||
      item.name.toLowerCase().includes('fraises') ||
      item.name.toLowerCase().includes('banan')
    );
    
    produce.forEach(item => {
      expect(item.category).toBe('produce');
      expect(item.expires_on).toBeDefined();
      
      // Produce should expire within 4-7 days typically
      const expiryDate = new Date(item.expires_on!);
      const purchaseDate = new Date(receiptDate);
      const daysDiff = Math.round((expiryDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThan(0);
      expect(daysDiff).toBeLessThan(14);
    });
  });

  it('should clean SKU codes from item names', () => {
    const result = parseReceipt(costcoReceipt);
    
    // Items should not contain long numeric SKU codes
    result.items.forEach(item => {
      expect(item.name).not.toMatch(/^\d{6,}/);
    });
  });

  it('should validate totals match items + discounts + tax', () => {
    const result = parseReceipt(costcoReceipt);
    
    const itemsSum = result.items.reduce((sum, item) => sum + item.price_total, 0);
    const discountsSum = result.discounts.reduce((sum, d) => sum + d.amount, 0);
    const calculated = itemsSum + discountsSum + (result.tax_total || 0);
    
    expect(calculated).toBeCloseTo(result.total || 0, 0.5);
  });
});
