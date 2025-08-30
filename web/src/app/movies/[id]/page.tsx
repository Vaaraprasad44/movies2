'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Heart, Edit, Trash2, Star, Calendar, Clock, Users, Globe } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { ErrorBoundary, DefaultErrorFallback } from '@/components/ui/error-boundary';
import { MovieForm } from '@/components/forms/MovieForm';
import {
  useGetMovieQuery,
  useDeleteMovieMutation,
  useToggleMovieFavoriteMutation,
} from '@/store/api';
import { toggleFavorite, selectIsFavorite } from '@/store/slices/favorites';
import type { RootState } from '@/store';

export default function MovieDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const movieId = parseInt(params.id as string);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: movie, isLoading, isError, refetch } = useGetMovieQuery({ id: movieId });
  const isFavorite = useSelector((state: RootState) => 
    movie ? selectIsFavorite(state, movie.id) : false
  );
  
  const [toggleFavoriteMutation] = useToggleMovieFavoriteMutation();
  const [deleteMovie] = useDeleteMovieMutation();

  useEffect(() => {
    if (isNaN(movieId)) {
      router.push('/');
    }
  }, [movieId, router]);

  const handleFavoriteToggle = async () => {
    if (!movie) return;
    
    // Optimistic update
    dispatch(toggleFavorite(movie));
    
    try {
      await toggleFavoriteMutation({
        id: movie.id,
        isFavorite: !isFavorite,
      }).unwrap();
      
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    } catch {
      // Revert optimistic update
      dispatch(toggleFavorite(movie));
      toast.error('Failed to update favorites');
    }
  };

  const handleDelete = async () => {
    if (!movie) return;
    
    if (!confirm(`Are you sure you want to delete "${movie.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await deleteMovie({ id: movie.id }).unwrap();
      toast.success('Movie deleted successfully');
      router.push('/');
    } catch {
      toast.error('Failed to delete movie');
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
    toast.success('Movie updated successfully!');
    refetch();
  };

  const formatYear = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  const formatRuntime = (runtime?: number | null) => {
    if (!runtime) return 'N/A';
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return `${hours}h ${minutes}m`;
  };

  const formatCastAndCrew = (people?: object[]) => {
    if (!people || people.length === 0) return 'N/A';
    return people
      .slice(0, 5)
      .map(person => {
        if (typeof person === 'string') return person;
        return (person as { name?: string }).name || 'Unknown';
      })
      .join(', ') + (people.length > 5 ? ` +${people.length - 5} more` : '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-20 mb-4" />
            <Skeleton className="h-12 w-96 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <DefaultErrorFallback 
            error={new Error('Movie not found')} 
            retry={refetch}
          />
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Movie
            </Button>
            <h1 className="text-3xl font-bold">Edit Movie</h1>
          </div>
          
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>Edit &ldquo;{movie.title}&rdquo;</CardTitle>
            </CardHeader>
            <CardContent>
              <MovieForm
                movie={movie}
                onSuccess={handleEditSuccess}
                onCancel={() => setIsEditing(false)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                {movie.original_title && movie.original_title !== movie.title && (
                  <p className="text-lg text-muted-foreground mb-2">
                    Original: {movie.original_title}
                  </p>
                )}
                {movie.tagline && (
                  <p className="text-lg italic text-muted-foreground">
&ldquo;{movie.tagline}&rdquo;
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleFavoriteToggle}
                  className={isFavorite ? 'border-red-500 text-red-500' : ''}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favorited' : 'Add to Favorites'}
                </Button>
                
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              {movie.overview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {movie.overview}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Personal Notes */}
              {movie.personal_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {movie.personal_notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Cast & Crew */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {movie.cast && movie.cast.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Cast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {formatCastAndCrew(movie.cast)}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {movie.crew && movie.crew.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Crew
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {formatCastAndCrew(movie.crew)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Movie Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Release Year:</span>
                    <span>{formatYear(movie.release_date)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Runtime:</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                  
                  {movie.original_language && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Language:</span>
                      <span>{movie.original_language.toUpperCase()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle>Ratings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {movie.vote_average && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">IMDb Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold">
                          {movie.vote_average.toFixed(1)}/10
                        </span>
                        {movie.vote_count && (
                          <span className="text-xs text-muted-foreground">
                            ({movie.vote_count.toLocaleString()} votes)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {movie.personal_rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-blue-500 fill-current" />
                        <span className="font-bold text-blue-600">
                          {movie.personal_rating}/10
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {movie.popularity && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Popularity:</span>
                      <span className="font-medium">
                        {movie.popularity.toFixed(1)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Genres */}
              {movie.genres && movie.genres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Genres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">
                          {typeof genre === 'string' ? genre : (genre as { name: string }).name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              {movie.keywords && movie.keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Keywords</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {movie.keywords.slice(0, 10).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {typeof keyword === 'string' ? keyword : (keyword as { name: string }).name}
                        </Badge>
                      ))}
                      {movie.keywords.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{movie.keywords.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}