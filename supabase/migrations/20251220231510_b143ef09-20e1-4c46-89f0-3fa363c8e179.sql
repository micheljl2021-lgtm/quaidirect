-- Add RLS policy to allow premium and admin users to view sale points
CREATE POLICY "Premium users can view sale points" 
ON public.fisherman_sale_points
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'premium'::app_role) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);