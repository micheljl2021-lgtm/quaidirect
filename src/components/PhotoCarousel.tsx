import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PhotoItem {
  url: string;
  arrivageId: string;
  speciesName: string;
}

interface PhotoCarouselProps {
  photos: PhotoItem[];
  autoPlayInterval?: number;
  onPhotoClick?: (arrivageId: string) => void;
}

const PhotoCarousel = ({ 
  photos, 
  autoPlayInterval = 3000,
  onPhotoClick
}: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [photos.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePhotoClick = (arrivageId: string) => {
    if (onPhotoClick) {
      onPhotoClick(arrivageId);
    }
  };

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-xl">
      {/* Photos */}
      <div className="relative w-full h-full">
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => handlePhotoClick(photo.arrivageId)}
            className={cn(
              'absolute inset-0 transition-opacity duration-500 cursor-pointer',
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <img
              src={photo.url}
              alt={photo.speciesName}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
              <p className="text-white text-xl font-bold">{photo.speciesName}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Dots indicator */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;