export type StoreType = 'walmart' | 'costco' | 'metro' | 'iga' | 'wholeFoods' | 'loblaws';
export type ReceiptType = 'weekly' | 'quick' | 'bigHaul' | 'healthy';

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  category: string;
  expiryDays: number;
}

export interface GeneratedReceipt {
  store: string;
  date: Date;
  time: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

const ITEM_DATABASE = {
  produce: [
    { name: 'Bananas', price: 1.29, unit: 'lb', expiryDays: 5 },
    { name: 'Strawberries', price: 3.99, unit: 'container', expiryDays: 4 },
    { name: 'Lettuce', price: 2.49, unit: 'head', expiryDays: 7 },
    { name: 'Tomatoes', price: 2.99, unit: 'lb', expiryDays: 5 },
    { name: 'Broccoli', price: 2.49, unit: 'bunch', expiryDays: 7 },
    { name: 'Apples', price: 1.99, unit: 'lb', expiryDays: 14 },
    { name: 'Carrots', price: 1.49, unit: 'bag', expiryDays: 14 },
    { name: 'Spinach', price: 2.99, unit: 'bag', expiryDays: 5 },
    { name: 'Cucumbers', price: 1.99, unit: 'each', expiryDays: 7 },
    { name: 'Bell Peppers', price: 1.49, unit: 'each', expiryDays: 7 },
    { name: 'Onions', price: 0.99, unit: 'lb', expiryDays: 30 },
    { name: 'Potatoes', price: 4.99, unit: 'bag', expiryDays: 30 },
  ],
  protein: [
    { name: 'Chicken Breast', price: 5.99, unit: 'lb', expiryDays: 3 },
    { name: 'Ground Beef', price: 4.99, unit: 'lb', expiryDays: 3 },
    { name: 'Salmon', price: 9.99, unit: 'lb', expiryDays: 2 },
    { name: 'Eggs', price: 3.49, unit: 'dozen', expiryDays: 21 },
    { name: 'Bacon', price: 6.99, unit: 'pack', expiryDays: 14 },
    { name: 'Ground Turkey', price: 5.49, unit: 'lb', expiryDays: 3 },
    { name: 'Pork Chops', price: 4.99, unit: 'lb', expiryDays: 3 },
    { name: 'Shrimp', price: 12.99, unit: 'lb', expiryDays: 2 },
  ],
  dairy: [
    { name: 'Milk', price: 3.99, unit: 'gallon', expiryDays: 7 },
    { name: 'Yogurt', price: 4.49, unit: '6-pack', expiryDays: 14 },
    { name: 'Cheese', price: 5.99, unit: 'block', expiryDays: 30 },
    { name: 'Butter', price: 4.49, unit: 'lb', expiryDays: 60 },
    { name: 'Cream Cheese', price: 2.99, unit: 'package', expiryDays: 21 },
    { name: 'Sour Cream', price: 2.49, unit: 'container', expiryDays: 14 },
    { name: 'Greek Yogurt', price: 5.99, unit: '4-pack', expiryDays: 14 },
  ],
  pantry: [
    { name: 'Pasta', price: 1.99, unit: 'box', expiryDays: 730 },
    { name: 'Rice', price: 8.99, unit: '5lb bag', expiryDays: 730 },
    { name: 'Bread', price: 2.49, unit: 'loaf', expiryDays: 7 },
    { name: 'Peanut Butter', price: 4.99, unit: 'jar', expiryDays: 180 },
    { name: 'Cereal', price: 3.99, unit: 'box', expiryDays: 180 },
    { name: 'Canned Beans', price: 1.29, unit: 'can', expiryDays: 730 },
    { name: 'Canned Tomatoes', price: 1.49, unit: 'can', expiryDays: 730 },
    { name: 'Olive Oil', price: 7.99, unit: 'bottle', expiryDays: 365 },
    { name: 'Flour', price: 3.99, unit: 'bag', expiryDays: 365 },
    { name: 'Sugar', price: 2.99, unit: 'bag', expiryDays: 730 },
  ],
  snacks: [
    { name: 'Potato Chips', price: 3.49, unit: 'bag', expiryDays: 60 },
    { name: 'Cookies', price: 3.99, unit: 'package', expiryDays: 90 },
    { name: 'Crackers', price: 2.99, unit: 'box', expiryDays: 90 },
    { name: 'Granola Bars', price: 4.49, unit: 'box', expiryDays: 180 },
    { name: 'Nuts', price: 6.99, unit: 'bag', expiryDays: 180 },
    { name: 'Popcorn', price: 2.49, unit: 'bag', expiryDays: 120 },
  ],
  beverages: [
    { name: 'Orange Juice', price: 3.99, unit: 'carton', expiryDays: 7 },
    { name: 'Apple Juice', price: 3.49, unit: 'bottle', expiryDays: 14 },
    { name: 'Soda', price: 5.99, unit: '12-pack', expiryDays: 180 },
    { name: 'Coffee', price: 8.99, unit: 'bag', expiryDays: 365 },
    { name: 'Tea', price: 4.99, unit: 'box', expiryDays: 365 },
    { name: 'Sparkling Water', price: 4.99, unit: '8-pack', expiryDays: 180 },
  ],
};

const STORE_NAMES = {
  walmart: 'Walmart',
  costco: 'Costco',
  metro: 'Metro',
  iga: 'IGA',
  wholeFoods: 'Whole Foods',
  loblaws: 'Loblaws',
};

const CATEGORY_WEIGHTS = {
  weekly: {
    produce: 0.30,
    protein: 0.20,
    dairy: 0.15,
    pantry: 0.15,
    snacks: 0.10,
    beverages: 0.10,
  },
  quick: {
    produce: 0.30,
    protein: 0.20,
    dairy: 0.40,
    pantry: 0.10,
    snacks: 0.0,
    beverages: 0.0,
  },
  bigHaul: {
    produce: 0.20,
    protein: 0.15,
    dairy: 0.15,
    pantry: 0.35,
    snacks: 0.10,
    beverages: 0.05,
  },
  healthy: {
    produce: 0.50,
    protein: 0.25,
    dairy: 0.15,
    pantry: 0.10,
    snacks: 0.0,
    beverages: 0.0,
  },
};

function getRandomTime(): string {
  const hour = Math.floor(Math.random() * 12) + 8; // 8 AM - 8 PM
  const minute = Math.floor(Math.random() * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function selectItemsFromCategory(category: keyof typeof ITEM_DATABASE, count: number): ReceiptItem[] {
  const items = ITEM_DATABASE[category];
  const selected: ReceiptItem[] = [];
  const availableItems = [...items];
  
  for (let i = 0; i < count && availableItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    const item = availableItems.splice(randomIndex, 1)[0];
    
    // Determine quantity based on item and unit
    let quantity = 1;
    if (item.unit === 'lb') {
      quantity = Math.round((Math.random() * 2 + 0.5) * 100) / 100; // 0.5 - 2.5 lbs
    } else if (item.unit === 'bag' || item.unit === 'box') {
      quantity = Math.floor(Math.random() * 2) + 1; // 1-2 items
    }
    
    selected.push({
      name: item.name,
      quantity,
      unit: item.unit,
      price: item.price * quantity,
      category,
      expiryDays: item.expiryDays,
    });
  }
  
  return selected;
}

export function generateReceipt(
  store: StoreType,
  itemCount: number,
  receiptType: ReceiptType
): GeneratedReceipt {
  const weights = CATEGORY_WEIGHTS[receiptType];
  const items: ReceiptItem[] = [];
  
  // Calculate items per category
  Object.entries(weights).forEach(([category, weight]) => {
    const count = Math.round(itemCount * weight);
    if (count > 0) {
      items.push(...selectItemsFromCategory(category as keyof typeof ITEM_DATABASE, count));
    }
  });
  
  // Fill remaining slots if needed
  while (items.length < itemCount) {
    const categories = Object.keys(ITEM_DATABASE) as (keyof typeof ITEM_DATABASE)[];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    items.push(...selectItemsFromCategory(randomCategory, 1));
  }
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.13; // 13% tax (typical in Canada)
  const total = subtotal + tax;
  
  return {
    store: STORE_NAMES[store],
    date: new Date(),
    time: getRandomTime(),
    items: items.slice(0, itemCount), // Ensure exact count
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
