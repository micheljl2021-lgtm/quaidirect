-- Create test user roles for testing
-- Note: Users must first sign up through the UI, then their roles will be assigned

-- Insert roles for test users (they need to sign up first with these emails)
-- test@pecheur.fr with password: pecheur123
-- test@premium.fr with password: premium123  
-- test@admin.fr with password: admin123

-- This function will check if a user exists and add their role
CREATE OR REPLACE FUNCTION public.add_test_user_role(user_email TEXT, user_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  -- If user exists, insert their role (if not already exists)
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_test_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_test_user_role TO service_role;

COMMENT ON FUNCTION public.add_test_user_role IS 'Helper function to assign roles to test users after they sign up';