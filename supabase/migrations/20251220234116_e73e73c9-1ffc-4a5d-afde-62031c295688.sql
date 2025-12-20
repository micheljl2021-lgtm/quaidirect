-- Ajouter DELETE policy sur profiles (sans IF NOT EXISTS)
DO $$
BEGIN
  -- Vérifier si la policy existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can delete their own profile'
  ) THEN
    CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);
  END IF;
END $$;