import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getAnonymousItems } from '@/lib/sampleData';

type UserTier = 'anonymous' | 'free' | 'pro';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  tier: UserTier;
  itemCount: number;
  recipeCountToday: number;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, addSampleData?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  migrateAnonymousData: () => Promise<number>;
  incrementItemCount: () => void;
  decrementItemCount: () => void;
  incrementRecipeCount: () => void;
  checkProgressMilestone: () => 'none' | '10-items' | '2-recipes';
  canAddItem: () => boolean;
  canGenerateRecipe: () => boolean;
  resetRecipeCount: () => void;
  // Dev tools methods
  devSetTier: (newTier: UserTier) => void;
  devResetItemCount: () => void;
  devResetRecipeCount: () => void;
  devResetAllLimits: () => void;
  devClearAllData: () => void;
  devSimulateUsage: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ITEM_LIMIT_ANONYMOUS = 15;
const RECIPE_LIMIT_ANONYMOUS = 3;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tier, setTier] = useState<UserTier>('anonymous');
  const [itemCount, setItemCount] = useState(0);
  const [recipeCountToday, setRecipeCountToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load anonymous user data from localStorage
    const storedItemCount = localStorage.getItem('anonymous_item_count');
    const storedRecipeCount = localStorage.getItem('anonymous_recipe_count');
    const storedRecipeDate = localStorage.getItem('anonymous_recipe_date');
    
    if (storedItemCount) setItemCount(parseInt(storedItemCount));
    
    // Reset recipe count if it's a new day
    const today = new Date().toDateString();
    if (storedRecipeDate !== today) {
      setRecipeCountToday(0);
      localStorage.setItem('anonymous_recipe_date', today);
      localStorage.removeItem('anonymous_recipe_count');
    } else if (storedRecipeCount) {
      setRecipeCountToday(parseInt(storedRecipeCount));
    }

    // Check and reset recipe count at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const midnightTimer = setTimeout(() => {
      setRecipeCountToday(0);
      localStorage.setItem('anonymous_recipe_date', new Date().toDateString());
      localStorage.removeItem('anonymous_recipe_count');
    }, msUntilMidnight);

    // Helper function to fetch and set user tier
    const fetchUserTier = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, tier_expires_at')
        .eq('id', userId)
        .single();
      
      if (profile) {
        // Check if tier has expired
        if (profile.tier_expires_at && new Date(profile.tier_expires_at) < new Date()) {
          setTier('free');
        } else {
          setTier(profile.tier as UserTier);
        }
      } else {
        setTier('free');
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserTier(session.user.id);
        } else {
          setTier('anonymous');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserTier(session.user.id);
      }
      setIsLoading(false);
    });

    return () => {
      clearTimeout(midnightTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, addSampleData = false) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          addSampleData
        }
      }
    });
    
    return { error };
  };

  const migrateAnonymousData = async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const anonymousItems = getAnonymousItems();
    if (anonymousItems.length === 0) return 0;

    try {
      const itemsToInsert = anonymousItems.map((item: any) => ({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiry_date,
        price: item.price || 0,
        status: 'active',
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      // Clear localStorage after successful migration
      localStorage.removeItem('anonymous_items');
      localStorage.removeItem('anonymous_item_count');
      localStorage.removeItem('hasSeenSampleData');
      localStorage.removeItem('sampleDataDismissed');

      return anonymousItems.length;
    } catch (error) {
      console.error('Error migrating data:', error);
      return 0;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTier('anonymous');
    setUser(null);
    setSession(null);
  };

  const incrementItemCount = () => {
    const newCount = itemCount + 1;
    setItemCount(newCount);
    if (tier === 'anonymous') {
      localStorage.setItem('anonymous_item_count', newCount.toString());
    }
  };

  const decrementItemCount = () => {
    const newCount = Math.max(0, itemCount - 1);
    setItemCount(newCount);
    if (tier === 'anonymous') {
      localStorage.setItem('anonymous_item_count', newCount.toString());
    }
  };

  const incrementRecipeCount = () => {
    const newCount = recipeCountToday + 1;
    setRecipeCountToday(newCount);
    if (tier === 'anonymous') {
      localStorage.setItem('anonymous_recipe_count', newCount.toString());
    }
  };

  const resetRecipeCount = () => {
    setRecipeCountToday(0);
    if (tier === 'anonymous') {
      localStorage.removeItem('anonymous_recipe_count');
    }
  };

  const canAddItem = () => {
    if (tier === 'anonymous') {
      return itemCount < ITEM_LIMIT_ANONYMOUS;
    }
    return true;
  };

  const canGenerateRecipe = () => {
    if (tier === 'anonymous') {
      return recipeCountToday < RECIPE_LIMIT_ANONYMOUS;
    }
    return true;
  };

  const checkProgressMilestone = (): 'none' | '10-items' | '2-recipes' => {
    if (tier !== 'anonymous') return 'none';
    
    // Check if we just hit 10 items
    const hasShown10Items = localStorage.getItem('shown_10_items_milestone');
    if (itemCount === 10 && !hasShown10Items) {
      localStorage.setItem('shown_10_items_milestone', 'true');
      return '10-items';
    }
    
    // Check if we just used 2nd recipe
    const hasShown2Recipes = localStorage.getItem('shown_2_recipes_milestone');
    if (recipeCountToday === 2 && !hasShown2Recipes) {
      localStorage.setItem('shown_2_recipes_milestone', 'true');
      return '2-recipes';
    }
    
    return 'none';
  };

  // Developer tools methods
  const devSetTier = (newTier: UserTier) => {
    setTier(newTier);
  };

  const devResetItemCount = () => {
    setItemCount(0);
    localStorage.setItem('anonymous_item_count', '0');
  };

  const devResetRecipeCount = () => {
    setRecipeCountToday(0);
    localStorage.removeItem('anonymous_recipe_count');
    localStorage.setItem('anonymous_recipe_date', new Date().toDateString());
  };

  const devResetAllLimits = () => {
    devResetItemCount();
    devResetRecipeCount();
    localStorage.removeItem('shown_10_items_milestone');
    localStorage.removeItem('shown_2_recipes_milestone');
  };

  const devClearAllData = () => {
    localStorage.clear();
    setItemCount(0);
    setRecipeCountToday(0);
  };

  const devSimulateUsage = () => {
    // Simulate 30 days of usage
    setItemCount(47);
    setRecipeCountToday(2);
    localStorage.setItem('anonymous_item_count', '47');
    localStorage.setItem('anonymous_recipe_count', '2');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        tier,
        itemCount,
        recipeCountToday,
        isLoading,
        signIn,
        signUp,
        signOut,
        incrementItemCount,
        decrementItemCount,
        incrementRecipeCount,
        canAddItem,
        canGenerateRecipe,
        resetRecipeCount,
        migrateAnonymousData,
        checkProgressMilestone,
        devSetTier,
        devResetItemCount,
        devResetRecipeCount,
        devResetAllLimits,
        devClearAllData,
        devSimulateUsage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
