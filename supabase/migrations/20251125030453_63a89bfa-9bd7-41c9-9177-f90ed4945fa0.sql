-- Add RLS policy for admins to update user profiles
CREATE POLICY "Admins can update user profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));