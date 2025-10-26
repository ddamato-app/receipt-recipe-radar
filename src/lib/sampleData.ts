export type SampleItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDays: number;
  price: number;
};

export const SAMPLE_ITEMS: SampleItem[] = [
  {
    name: 'Milk',
    quantity: 1,
    unit: 'liter',
    category: 'Dairy',
    expiryDays: 2,
    price: 3.99,
  },
  {
    name: 'Strawberries',
    quantity: 1,
    unit: 'pcs',
    category: 'Fruits',
    expiryDays: 1,
    price: 5.49,
  },
  {
    name: 'Chicken Breast',
    quantity: 500,
    unit: 'g',
    category: 'Meat',
    expiryDays: 3,
    price: 8.99,
  },
  {
    name: 'Lettuce',
    quantity: 1,
    unit: 'pcs',
    category: 'Vegetables',
    expiryDays: 5,
    price: 2.49,
  },
  {
    name: 'Yogurt',
    quantity: 4,
    unit: 'pcs',
    category: 'Dairy',
    expiryDays: 4,
    price: 4.99,
  },
  {
    name: 'Bread',
    quantity: 1,
    unit: 'pcs',
    category: 'Bakery',
    expiryDays: 3,
    price: 2.99,
  },
];

export const initializeAnonymousSampleData = (): void => {
  const hasSeenSampleData = localStorage.getItem('hasSeenSampleData');
  
  if (!hasSeenSampleData) {
    const items = SAMPLE_ITEMS.map((item, index) => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + item.expiryDays);
      
      return {
        id: `sample-${Date.now()}-${index}`,
        ...item,
        expiry_date: expiryDate.toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        isSample: true,
      };
    });
    
    localStorage.setItem('anonymous_items', JSON.stringify(items));
    localStorage.setItem('anonymous_item_count', '6');
    localStorage.setItem('hasSeenSampleData', 'true');
  }
};

export const getAnonymousItems = () => {
  const stored = localStorage.getItem('anonymous_items');
  return stored ? JSON.parse(stored) : [];
};

export const clearAnonymousSampleData = (): void => {
  const items = getAnonymousItems();
  const nonSampleItems = items.filter((item: any) => !item.isSample);
  
  localStorage.setItem('anonymous_items', JSON.stringify(nonSampleItems));
  localStorage.setItem('anonymous_item_count', nonSampleItems.length.toString());
  localStorage.setItem('sampleDataDismissed', 'true');
};

export const addAnonymousItem = (item: any): void => {
  const items = getAnonymousItems();
  items.push({ ...item, id: `item-${Date.now()}`, created_at: new Date().toISOString() });
  localStorage.setItem('anonymous_items', JSON.stringify(items));
};

export const updateAnonymousItem = (id: string, updates: any): void => {
  const items = getAnonymousItems();
  const updatedItems = items.map((item: any) => 
    item.id === id ? { ...item, ...updates } : item
  );
  localStorage.setItem('anonymous_items', JSON.stringify(updatedItems));
};

export const deleteAnonymousItem = (id: string): void => {
  const items = getAnonymousItems();
  const filteredItems = items.filter((item: any) => item.id !== id);
  localStorage.setItem('anonymous_items', JSON.stringify(filteredItems));
};
