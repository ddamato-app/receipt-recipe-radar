-- Add status column to fridge_items table to track if items were used or wasted
ALTER TABLE public.fridge_items 
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'used', 'wasted'));

-- Add index for better query performance
CREATE INDEX idx_fridge_items_status ON public.fridge_items(status);

-- Add completed_at column to track when items were marked as used/wasted
ALTER TABLE public.fridge_items 
ADD COLUMN completed_at timestamp with time zone;