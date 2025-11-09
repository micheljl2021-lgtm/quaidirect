-- Reset test account passwords for easier testing
-- These are test accounts and passwords are intentionally simple for demo purposes

-- Update test@pecheur.fr password
UPDATE auth.users 
SET encrypted_password = crypt('pecheur123', gen_salt('bf'))
WHERE email = 'test@pecheur.fr';

-- Update test@premium.fr password
UPDATE auth.users 
SET encrypted_password = crypt('premium123', gen_salt('bf'))
WHERE email = 'test@premium.fr';

-- Update test@admin.fr password
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'test@admin.fr';