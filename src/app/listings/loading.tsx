export default function ListingsLoading() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Filter bar skeleton */}
      <div className="bg-white shadow-sm flex-shrink-0">
        <div className="px-4 pt-3 pb-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded" />
              <div className="mt-3 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-4 bg-gray-100 rounded w-48" />
                <div className="h-3 bg-gray-100 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
