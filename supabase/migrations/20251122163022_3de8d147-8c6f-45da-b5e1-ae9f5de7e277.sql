-- Créer le bucket pour les photos des pêcheurs
INSERT INTO storage.buckets (id, name, public)
VALUES ('fishermen-photos', 'fishermen-photos', true);

-- Politique : tout le monde peut voir les photos
CREATE POLICY "Photos des pêcheurs publiquement visibles"
ON storage.objects FOR SELECT
USING (bucket_id = 'fishermen-photos');

-- Politique : utilisateurs authentifiés peuvent uploader leurs photos
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fishermen-photos');

-- Politique : utilisateurs peuvent mettre à jour leurs propres photos
CREATE POLICY "Utilisateurs peuvent mettre à jour leurs photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'fishermen-photos' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'fishermen-photos');

-- Politique : utilisateurs peuvent supprimer leurs propres photos
CREATE POLICY "Utilisateurs peuvent supprimer leurs photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'fishermen-photos' AND auth.uid()::text = (storage.foldername(name))[1]);