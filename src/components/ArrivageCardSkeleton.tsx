import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ArrivageCardSkeletonProps {
  variant?: 'compact' | 'full';
}

/**
 * Skeleton loader for ArrivageCard - matches exact layout for seamless loading
 */
const ArrivageCardSkeleton = ({ variant = 'compact' }: ArrivageCardSkeletonProps) => {
  return (
    <Card className="overflow-hidden">
      {/* Image placeholder */}
      <Skeleton className="aspect-video w-full" />

      <CardContent className={variant === 'full' ? "p-5 space-y-4" : "p-4 space-y-3"}>
        {/* Species title */}
        <div>
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-3 w-1/2" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Stock bar (full variant) */}
        {variant === 'full' && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Fisherman info */}
        <div className="pt-2 border-t border-border">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-2 w-48" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Grid of skeleton cards for loading states
 */
export const ArrivageCardSkeletonGrid = ({ 
  count = 3, 
  variant = 'compact' 
}: { 
  count?: number; 
  variant?: 'compact' | 'full';
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArrivageCardSkeleton key={i} variant={variant} />
      ))}
    </div>
  );
};

export default ArrivageCardSkeleton;
