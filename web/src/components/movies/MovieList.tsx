'use client';

import { useState, useMemo } from 'react';
import { MovieCard } from './MovieCard';
import { MovieListSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { MovieForm } from '@/components/forms/MovieForm';
import { Button } from '@/components/ui/button';
import { Plus, Grid, List } from 'lucide-react';
import { toast } from 'sonner';
import type { Movie } from '@/store/api/enhanced/movies';

interface MovieListProps {
  movies: Movie[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  showCreateButton?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export function MovieList({ 
  movies, 
  isLoading, 
  isError, 
  onRetry,
  showCreateButton = true,
  className 
}: MovieListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      // Prioritize favorited movies
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      
      // Then sort by title
      return a.title.localeCompare(b.title);
    });
  }, [movies]);

  const handleEditSuccess = () => {
    setEditingMovie(null);
    toast.success('Movie updated successfully!');
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    toast.success('Movie created successfully!');
  };

  if (isLoading) {
    return <MovieListSkeleton count={6} />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4 animate-bounce-soft">⚠️</div>
        <h3 className="text-xl font-semibold mb-2 text-destructive">Failed to Load Movies</h3>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Could not connect to the movie API. Please make sure the backend is running.
        </p>
        <div className="bg-card/50 backdrop-blur border rounded-lg p-4 mb-6 text-left">
          <p className="text-sm font-medium mb-2">To start the backend API:</p>
          <code className="text-sm text-primary">cd PythonApi && python run_app.py</code>
          <p className="text-xs text-muted-foreground mt-2">
            The API should be available at http://localhost:8000
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="hover:scale-105 transition-all">
            🔄 Try Again
          </Button>
        )}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full animate-float opacity-30"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-full animate-bounce-soft opacity-40" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-r from-teal-400/20 to-purple-400/20 rounded-full animate-float opacity-20" style={{animationDelay: '2s'}}></div>
        </div>
        
        {/* Main content */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mb-8 animate-fade-in">
            <div className="text-8xl mb-4 animate-bounce-soft">🎬</div>
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Movie Journey Starts Here!
            </h2>
            <p className="text-lg text-muted-foreground mb-6 animate-slide-up">
              No movies in your collection yet? Let&apos;s fix that! 🍿
            </p>
          </div>
          
          <div className="space-y-4 animate-fade-in-delayed">
            <p className="text-sm text-muted-foreground">
              To get started, make sure you have set up the movie dataset and started the backend:
            </p>
            <div className="bg-card/50 backdrop-blur border rounded-lg p-4 text-left space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">1. Setup Dataset:</p>
                <code className="text-sm text-primary">./setup-dataset.sh</code>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">2. Start Backend API:</p>
                <code className="text-sm text-primary">cd PythonApi && python run_app.py</code>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">3. Start Frontend (in another terminal):</p>
                <code className="text-sm text-primary">cd web && pnpm dev</code>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                The backend API must be running for movies to load
              </p>
            </div>
            
            {showCreateButton && (
              <div className="pt-4">
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  size="lg"
                >
                  <Plus className="mr-2 h-5 w-5 animate-pulse" />
                  Add Your First Movie
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {showCreateForm && (
          <div className="mt-12 w-full max-w-2xl animate-fade-in">
            <div className="bg-card/80 backdrop-blur border rounded-xl p-8 shadow-2xl">
              <h3 className="text-xl font-semibold mb-6 text-center">✨ Create Your First Movie Entry</h3>
              <MovieForm
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={className}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              Movies ({movies.length})
            </h2>
            
            {/* View Mode Toggle */}
            <div className="flex border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showCreateButton && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Movie
            </Button>
          )}
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="mb-8 bg-background border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Movie</h3>
            <MovieForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Edit Form Modal */}
        {editingMovie && (
          <div className="mb-8 bg-background border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Movie</h3>
            <MovieForm
              movie={editingMovie}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingMovie(null)}
            />
          </div>
        )}

        {/* Movie Grid/List */}
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6'
            : 'space-y-4'
        }>
          {sortedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onEdit={setEditingMovie}
              className={viewMode === 'list' ? 'flex flex-row' : ''}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}