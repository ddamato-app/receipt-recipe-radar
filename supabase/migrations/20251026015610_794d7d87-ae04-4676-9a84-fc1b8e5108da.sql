-- Add is_sample column to track sample data
ALTER TABLE public.fridge_items 
ADD COLUMN is_sample boolean DEFAULT false;