-- Create receipt_parses table
CREATE TABLE public.receipt_parses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor TEXT,
  store_id TEXT,
  date DATE,
  currency TEXT NOT NULL DEFAULT 'CAD',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  discounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2),
  tax_total NUMERIC(10, 2),
  total NUMERIC(10, 2),
  raw_text TEXT,
  needs_review BOOLEAN NOT NULL DEFAULT false,
  review_reasons TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.receipt_parses ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own receipt parses"
ON public.receipt_parses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receipt parses"
ON public.receipt_parses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipt parses"
ON public.receipt_parses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipt parses"
ON public.receipt_parses
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_receipt_parses_updated_at
BEFORE UPDATE ON public.receipt_parses
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add index for faster queries
CREATE INDEX idx_receipt_parses_user_id ON public.receipt_parses(user_id);
CREATE INDEX idx_receipt_parses_date ON public.receipt_parses(date);
CREATE INDEX idx_receipt_parses_vendor ON public.receipt_parses(vendor);