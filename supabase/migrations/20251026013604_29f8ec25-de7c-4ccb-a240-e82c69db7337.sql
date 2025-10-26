-- Add price column to fridge_items table
ALTER TABLE public.fridge_items
ADD COLUMN price numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.fridge_items.price IS 'Price of the item in the local currency';