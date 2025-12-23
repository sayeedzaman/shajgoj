export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square bg-gray-200" />

      {/* Content Skeleton */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
      </div>
    </div>
  );
}
