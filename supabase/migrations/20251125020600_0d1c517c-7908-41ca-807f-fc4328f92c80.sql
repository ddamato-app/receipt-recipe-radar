-- Add tier columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS tier_expires_at timestamp with time zone;

-- Update d.damato@gmail.com to pro lifetime (NULL expiration means lifetime)
UPDATE public.profiles
SET tier = 'pro', tier_expires_at = NULL
WHERE email = 'd.damato@gmail.com';