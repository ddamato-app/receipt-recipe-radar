// Location detection service for PWA

export interface Store {
  name: string;
  chains: string[];
  radius: number; // meters
}

export const GROCERY_STORES: Store[] = [
  {
    name: "Walmart",
    chains: ["Walmart Supercenter", "Walmart Neighborhood Market", "Walmart"],
    radius: 200,
  },
  {
    name: "Costco",
    chains: ["Costco Wholesale", "Costco"],
    radius: 300,
  },
  {
    name: "Metro",
    chains: ["Metro", "Metro Plus"],
    radius: 150,
  },
  {
    name: "IGA",
    chains: ["IGA", "IGA Extra"],
    radius: 150,
  },
  {
    name: "Whole Foods",
    chains: ["Whole Foods Market", "Whole Foods"],
    radius: 150,
  },
  {
    name: "Loblaws",
    chains: ["Loblaws", "Real Canadian Superstore", "No Frills"],
    radius: 200,
  },
  {
    name: "Sobeys",
    chains: ["Sobeys", "Safeway", "FreshCo"],
    radius: 150,
  },
  {
    name: "Food Basics",
    chains: ["Food Basics"],
    radius: 150,
  },
];

export interface LocationResult {
  isNearStore: boolean;
  storeName?: string;
  distance?: number;
}

// Check if user is near a grocery store
export const checkNearbyStores = async (): Promise<LocationResult> => {
  try {
    // Check if geolocation is supported
    if (!("geolocation" in navigator)) {
      return { isNearStore: false };
    }

    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 60000 // Cache for 1 minute
      });
    });

    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    // Store last known position
    localStorage.setItem('lastKnownLocation', JSON.stringify({
      lat: userLat,
      lng: userLng,
      timestamp: Date.now()
    }));

    // Use Google Places API (if available) or fall back to simple detection
    // For MVP, we'll use a simplified check based on user's area
    // In production, you'd integrate Google Places API
    
    // Check if we can use Places API
    if ('google' in window && (window as any).google?.maps) {
      return await checkWithGooglePlaces(userLat, userLng);
    }

    // Fallback: Return false for now, in production you'd implement Places API
    return { isNearStore: false };
  } catch (error) {
    console.error('Location check failed:', error);
    return { isNearStore: false };
  }
};

// Simplified distance calculation (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check stores using Google Places API (requires API key)
const checkWithGooglePlaces = async (lat: number, lng: number): Promise<LocationResult> => {
  // This would use Google Places API in production
  // For now, return a mock result for testing
  // You can implement this with actual API calls once you have a Google Maps API key
  
  return { isNearStore: false };
};

// Request location permission
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    if (!("geolocation" in navigator)) {
      return false;
    }

    const result = await new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      );
    });

    return result;
  } catch {
    return false;
  }
};

// Check if location services are available
export const isLocationAvailable = (): boolean => {
  return "geolocation" in navigator;
};

// Get last check timestamp to avoid checking too frequently
export const getLastLocationCheck = (): number => {
  const lastCheck = localStorage.getItem('lastLocationCheck');
  return lastCheck ? parseInt(lastCheck, 10) : 0;
};

export const setLastLocationCheck = (): void => {
  localStorage.setItem('lastLocationCheck', Date.now().toString());
};

// Check if we should check location (avoid battery drain)
export const shouldCheckLocation = (): boolean => {
  const lastCheck = getLastLocationCheck();
  const twoMinutes = 2 * 60 * 1000;
  return Date.now() - lastCheck > twoMinutes;
};
