-- Add SEO enrichment columns to fishermen table
ALTER TABLE fishermen
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_meta_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT[],
ADD COLUMN IF NOT EXISTS seo_long_content TEXT,
ADD COLUMN IF NOT EXISTS seo_how_to_order JSONB,
ADD COLUMN IF NOT EXISTS seo_hours_location TEXT,
ADD COLUMN IF NOT EXISTS seo_enriched_at TIMESTAMP WITH TIME ZONE;

-- Add comment
COMMENT ON COLUMN fishermen.seo_title IS 'Titre SEO optimisé pour la page boutique';
COMMENT ON COLUMN fishermen.seo_meta_description IS 'Meta description pour référencement';
COMMENT ON COLUMN fishermen.seo_keywords IS 'Mots-clés SEO pour le profil';
COMMENT ON COLUMN fishermen.seo_long_content IS 'Contenu long enrichi généré par IA';
COMMENT ON COLUMN fishermen.seo_how_to_order IS 'Étapes pour commander (JSON avec steps array)';
COMMENT ON COLUMN fishermen.seo_hours_location IS 'Informations horaires et localisation';
COMMENT ON COLUMN fishermen.seo_enriched_at IS 'Date du dernier enrichissement SEO';