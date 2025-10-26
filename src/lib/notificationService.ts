// Notification service for PWA

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window;
};

export const isNotificationEnabled = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export const showNotification = async (options: NotificationOptions): Promise<void> => {
  if (!isNotificationEnabled()) {
    console.log('Notifications not enabled');
    return;
  }

  // Check if this notification was shown recently
  const notificationKey = `notification_${options.tag || 'default'}`;
  const lastShown = localStorage.getItem(notificationKey);
  
  if (lastShown) {
    const twoHours = 2 * 60 * 60 * 1000;
    const timeSince = Date.now() - parseInt(lastShown, 10);
    if (timeSince < twoHours) {
      console.log('Notification shown recently, skipping');
      return;
    }
  }

  // Store notification timestamp
  localStorage.setItem(notificationKey, Date.now().toString());

  // Show notification
  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-192x192.png',
    tag: options.tag,
    data: options.data,
    requireInteraction: options.requireInteraction || false,
  });

  // Handle click
  notification.onclick = (event) => {
    event.preventDefault();
    window.focus();
    
    if (options.data?.url) {
      window.location.href = options.data.url;
    }
    
    notification.close();
  };
};

export const showStoreDetectedNotification = async (storeName: string): Promise<void> => {
  await showNotification({
    title: `🛒 You're at ${storeName}!`,
    body: 'Need help with your shopping?',
    tag: `store_${storeName.toLowerCase()}`,
    data: {
      url: '/shopping-mode',
      store: storeName,
    },
    requireInteraction: true,
  });
};

export const showShoppingReminderNotification = async (itemCount: number): Promise<void> => {
  await showNotification({
    title: '📝 Don\'t forget your shopping list!',
    body: `You have ${itemCount} items waiting to be purchased`,
    tag: 'shopping_reminder',
    data: {
      url: '/shopping-mode',
    },
  });
};

// Check if user should receive shopping reminder
export const shouldShowShoppingReminder = (): boolean => {
  const lastShopping = localStorage.getItem('lastShoppingSession');
  if (!lastShopping) return true;

  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  const timeSince = Date.now() - parseInt(lastShopping, 10);
  
  return timeSince > fiveDays;
};

// Mark shopping session as completed
export const markShoppingSessionComplete = (): void => {
  localStorage.setItem('lastShoppingSession', Date.now().toString());
};
