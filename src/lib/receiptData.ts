export type ReceiptStatus = 'processing' | 'ready' | 'added' | 'failed';

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  estimatedExpiration: number; // days
  selected: boolean;
}

export interface Receipt {
  id: string;
  storeName: string;
  date: Date;
  totalAmount: number;
  status: ReceiptStatus;
  items: ReceiptItem[];
  processedAt?: Date;
}

const STORES = ['Walmart', 'Costco', 'Metro', 'IGA', 'Loblaws', 'Whole Foods', 'Sobeys', 'Food Basics'];

const SAMPLE_ITEMS = [
  { name: 'Organic Milk', price: 4.99, category: 'Dairy', expiration: 7, quantity: 1 },
  { name: 'Strawberries', price: 3.49, category: 'Fruits', expiration: 3, quantity: 1 },
  { name: 'Chicken Breast', price: 8.99, category: 'Meat', expiration: 3, quantity: 1 },
  { name: 'Romaine Lettuce', price: 2.99, category: 'Veggies', expiration: 5, quantity: 1 },
  { name: 'Bananas', price: 1.99, category: 'Fruits', expiration: 4, quantity: 1 },
  { name: 'Ground Beef', price: 6.99, category: 'Meat', expiration: 2, quantity: 1 },
  { name: 'Whole Wheat Bread', price: 3.49, category: 'Pantry', expiration: 7, quantity: 1 },
  { name: 'Greek Yogurt', price: 4.49, category: 'Dairy', expiration: 14, quantity: 1 },
  { name: 'Broccoli', price: 2.99, category: 'Veggies', expiration: 5, quantity: 1 },
  { name: 'Apples', price: 4.99, category: 'Fruits', expiration: 10, quantity: 1 },
  { name: 'Cheddar Cheese', price: 5.99, category: 'Dairy', expiration: 21, quantity: 1 },
  { name: 'Carrots', price: 2.49, category: 'Veggies', expiration: 14, quantity: 1 },
  { name: 'Eggs', price: 4.99, category: 'Dairy', expiration: 21, quantity: 12 },
  { name: 'Bell Peppers', price: 3.99, category: 'Veggies', expiration: 7, quantity: 1 },
  { name: 'Salmon Fillet', price: 12.99, category: 'Meat', expiration: 2, quantity: 1 },
];

export function generateMockReceipt(): Receipt {
  const itemCount = Math.floor(Math.random() * 10) + 5; // 5-15 items
  const selectedItems = [...SAMPLE_ITEMS]
    .sort(() => Math.random() - 0.5)
    .slice(0, itemCount)
    .map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category: item.category,
      estimatedExpiration: item.expiration,
      selected: true,
    }));

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return {
    id: `receipt-${Date.now()}`,
    storeName: STORES[Math.floor(Math.random() * STORES.length)],
    date: new Date(),
    totalAmount: Math.round(totalAmount * 100) / 100,
    status: 'ready',
    items: selectedItems,
  };
}

export function getStoredReceipts(): Receipt[] {
  const stored = localStorage.getItem('receipts');
  if (!stored) return [];
  
  const receipts = JSON.parse(stored);
  return receipts.map((r: any) => ({
    ...r,
    date: new Date(r.date),
    processedAt: r.processedAt ? new Date(r.processedAt) : undefined,
  }));
}

export function saveReceipts(receipts: Receipt[]) {
  localStorage.setItem('receipts', JSON.stringify(receipts));
}

export function addReceipt(receipt: Receipt) {
  const receipts = getStoredReceipts();
  receipts.unshift(receipt);
  saveReceipts(receipts);
}

export function updateReceipt(id: string, updates: Partial<Receipt>) {
  const receipts = getStoredReceipts();
  const index = receipts.findIndex(r => r.id === id);
  if (index !== -1) {
    receipts[index] = { ...receipts[index], ...updates };
    saveReceipts(receipts);
  }
}
