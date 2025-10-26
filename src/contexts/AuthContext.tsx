import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

type UserTier = 'anonymous' | 'free' | 'pro';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  tier: UserTier;
  itemCount: number;
  recipeCountToday: number;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  incrementItemCount: () => void;
  decrementItemCount: () => void;
  incrementRecipeCount: () => void;
  canAddItem: () => boolean;
  canGenerateRecipe: () => boolean;
  resetRecipeCount: () => void;
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check user tier from profile or metadata
          // For now, default to 'free' for logged-in users
          setTier('free');
        } else {
          setTier('anonymous');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTier('free');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
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
