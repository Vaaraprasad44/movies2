'use client';

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { MovieList } from '@/components/movies/MovieList';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { hydrateFavorites, selectFavoritesArray } from '@/store/slices/favorites';
import type { RootState } from '@/store';

export default function FavoritesPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const favoriteMovies = useSelector((state: RootState) => selectFavoritesArray(state));

  // Hydrate favorites from localStorage on mount
  useEffect(() => {
    dispatch(hydrateFavorites());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              <h1 className="text-4xl font-bold">Your Favorites</h1>
            </div>
            
            <p className="text-muted-foreground">
              {favoriteMovies.length === 0 
                ? "You haven't added any movies to your favorites yet."
                : `${favoriteMovies.length} movie${favoriteMovies.length === 1 ? '' : 's'} in your favorites collection.`
              }
            </p>
          </div>

          {/* Empty State */}
          {favoriteMovies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Heart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No favorite movies yet</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Start building your collection by clicking the heart icon on movies you love. 
                Your favorites will appear here and are saved locally on your device.
              </p>
              <Button onClick={() => router.push('/')}>
                Browse Movies
              </Button>
            </div>
          )}

          {/* Favorites List */}
          {favoriteMovies.length > 0 && (
            <MovieList
              movies={favoriteMovies}
              showCreateButton={false}
              isLoading={false}
              isError={false}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}