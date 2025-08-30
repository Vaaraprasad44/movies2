'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Toaster } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useGetMoviesQuery } from '@/store/api';
import { hydrateFavorites } from '@/store/slices/favorites';
import { useUrlSync, type MovieFilters } from '@/hooks/useUrlSync';
import { MovieFilters as MovieFiltersComponent } from '@/components/movies/MovieFilters';
import { MovieList } from '@/components/movies/MovieList';
import { Pagination } from '@/components/ui/pagination';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function HomePage() {
  const dispatch = useDispatch();
  const { updateUrl, getFiltersFromUrl } = useUrlSync();
  const [filters, setFilters] = useState<MovieFilters>({
    page: 1,
    size: 20,
  });

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = getFiltersFromUrl();
    if (Object.keys(urlFilters).length > 0) {
      setFilters({ page: 1, size: 20, ...urlFilters });
    }
  }, [getFiltersFromUrl]);

  // Hydrate favorites from localStorage on mount
  useEffect(() => {
    dispatch(hydrateFavorites());
  }, [dispatch]);

  // Build API query from filters
  const apiQuery = {
    page: filters.page || 1,
    size: filters.size || 20,
    ...(filters.search && { search: filters.search }),
    ...(filters.genres?.length && { genres: filters.genres }),
    ...(filters.yearFrom && { yearFrom: filters.yearFrom }),
    ...(filters.yearTo && { yearTo: filters.yearTo }),
    ...(filters.ratingFrom && { ratingFrom: filters.ratingFrom }),
    ...(filters.ratingTo && { ratingTo: filters.ratingTo }),
  };

  const { data: moviesResponse, isLoading, isError, refetch } = useGetMoviesQuery(apiQuery);

  const handleFiltersChange = useCallback((newFilters: MovieFilters) => {
    setFilters(newFilters);
    updateUrl(newFilters, true);
    // Auto-reload: RTK Query will automatically refetch due to changed parameters
  }, [updateUrl]);

  const handlePageChange = useCallback((page: number) => {
    setFilters(current => {
      const newFilters = { ...current, page };
      updateUrl(newFilters, true);
      return newFilters;
    });
  }, [updateUrl]);

  const handlePageSizeChange = useCallback((size: number) => {
    setFilters(current => {
      const newFilters = { ...current, size, page: 1 };
      updateUrl(newFilters, true);
      return newFilters;
    });
  }, [updateUrl]);

  // Sort movies client-side based on filters
  const sortedMovies = moviesResponse?.items ? [...moviesResponse.items].sort((a, b) => {
    // Always show favorites first if sorting isn't applied
    if (!filters.sortBy) {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.title.localeCompare(b.title);
    }
    
    let aValue: string | number, bValue: string | number;
    
    switch (filters.sortBy) {
      case 'title':
        aValue = a.title || '';
        bValue = b.title || '';
        break;
      case 'year':
        aValue = a.release_date ? new Date(a.release_date).getFullYear() : 0;
        bValue = b.release_date ? new Date(b.release_date).getFullYear() : 0;
        break;
      case 'rating':
        aValue = a.vote_average || 0;
        bValue = b.vote_average || 0;
        break;
      case 'popularity':
        aValue = a.popularity || 0;
        bValue = b.popularity || 0;
        break;
      default:
        return 0;
    }
    
    const sortOrder = filters.sortOrder || 'asc';
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const result = aValue.localeCompare(bValue);
      return sortOrder === 'desc' ? -result : result;
    }
    
    const result = (aValue as number) - (bValue as number);
    return sortOrder === 'desc' ? -result : result;
  }) : [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-all duration-500">
        <Toaster richColors position="top-right" />
        
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-teal-500/10 animate-gradient-x"></div>
          <div className="relative container mx-auto px-4 py-16">
            <div className="text-center mb-12 animate-fade-in">
              <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent animate-pulse">
                🎬 Movie Magic
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-slide-up">
                Discover, organize, and rate your favorite cinematic adventures
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground animate-fade-in-delayed">
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Ready to explore</span>
                </div>
                {moviesResponse?.total && (
                  <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                    <span>{moviesResponse.total.toLocaleString()} movies</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-blue-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm">
                    {isLoading ? 'Updating...' : 'Auto-sync active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 transform transition-all duration-300 hover:scale-[1.01]">
                <MovieFiltersComponent
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onRefresh={refetch}
                  isLoading={isLoading}
                  className="bg-card/50 backdrop-blur border shadow-lg rounded-xl"
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <div className="transform transition-all duration-300">
                <MovieList
                  movies={sortedMovies}
                  isLoading={isLoading}
                  isError={isError}
                  onRetry={refetch}
                  showCreateButton={true}
                />
              </div>

              {/* Pagination */}
              {moviesResponse && moviesResponse.pages > 1 && (
                <div className="flex justify-center transform transition-all duration-300 hover:scale-105">
                  <Pagination
                    currentPage={moviesResponse.page}
                    totalPages={moviesResponse.pages}
                    totalItems={moviesResponse.total}
                    pageSize={moviesResponse.size}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating Action Elements */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4">
          {/* Scroll to top button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center"
          >
            ↑
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default function PageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}