-- Create a shared product catalog that learns from all users
CREATE TABLE public.product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  confirmed_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_name, brand, category)
);

-- Index for fast lookups
CREATE INDEX idx_product_catalog_search ON public.product_catalog(product_name, brand);
CREATE INDEX idx_product_catalog_brand ON public.product_catalog(brand);

-- Enable RLS but allow all authenticated users to read
ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read the catalog (it's shared knowledge)
CREATE POLICY "Anyone can read product catalog"
  ON public.product_catalog
  FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can contribute to the catalog
CREATE POLICY "Anyone can insert to product catalog"
  ON public.product_catalog
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anyone authenticated can update confirmation counts
CREATE POLICY "Anyone can update product catalog"
  ON public.product_catalog
  FOR UPDATE
  TO authenticated
  USING (true);

-- Trigger to update timestamp
CREATE TRIGGER update_product_catalog_updated_at
  BEFORE UPDATE ON public.product_catalog
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();