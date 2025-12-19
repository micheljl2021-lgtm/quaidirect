// Collection de photos de pêche variées pour les arrivages sans photo
// Chaque arrivage sans photo utilisera une image différente basée sur son ID

export const FALLBACK_FISHING_PHOTOS = [
  // Poissons frais
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", // Poisson frais sur glace
  "https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=800&q=80", // Filet de poisson
  "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80", // Pêche du jour
  "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800&q=80", // Poisson ligne
  
  // Fruits de mer
  "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80", // Crustacés
  "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&q=80", // Crevettes fraîches
  "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&q=80", // Huîtres
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80", // Moules
  
  // Marché/Port
  "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&q=80", // Marché poisson
  "https://images.unsplash.com/photo-1540914124281-342587941389?w=800&q=80", // Poissonnerie
  "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&q=80", // Étal poisson
  "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&q=80", // Port de pêche
  
  // Préparation/Fraîcheur
  "https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=800&q=80", // Poisson frais préparé
  "https://images.unsplash.com/photo-1599458252573-56ae36120de1?w=800&q=80", // Saumon frais
  "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=800&q=80", // Poissons variés
  "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=800&q=80", // Thon frais
  
  // Pêche artisanale
  "https://images.unsplash.com/photo-1545816250-9c7f7d4a8f1a?w=800&q=80", // Filet de pêche
  "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=800&q=80", // Pêche traditionnelle
  "https://images.unsplash.com/photo-1516535794938-6063878f08cc?w=800&q=80", // Bateau pêche
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", // Port matin
];

/**
 * Génère un hash simple à partir d'une chaîne
 * Utilisé pour sélectionner une photo différente pour chaque arrivage
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en entier 32 bits
  }
  return Math.abs(hash);
}

/**
 * Retourne une photo de fallback différente basée sur l'ID de l'arrivage
 * Garantit que le même arrivage aura toujours la même photo
 */
export function getFallbackPhotoByDropId(dropId: string): string {
  const index = simpleHash(dropId) % FALLBACK_FISHING_PHOTOS.length;
  return FALLBACK_FISHING_PHOTOS[index];
}

/**
 * Vérifie si une URL est une photo de fallback
 */
export function isFallbackPhoto(url: string): boolean {
  return FALLBACK_FISHING_PHOTOS.includes(url);
}
