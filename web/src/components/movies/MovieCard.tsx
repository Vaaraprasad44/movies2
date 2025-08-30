'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Star, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeleteMovieMutation, useToggleMovieFavoriteMutation } from '@/store/api';
import { toggleFavorite, selectIsFavorite } from '@/store/slices/favorites';
import type { Movie } from '@/store/api/enhanced/movies';
import type { RootState } from '@/store';

interface MovieCardProps {
  movie: Movie;
  onEdit?: (movie: Movie) => void;
  showActions?: boolean;
  className?: string;
}

export function MovieCard({ movie, onEdit, showActions = true, className }: MovieCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  
  const isFavorite = useSelector((state: RootState) => selectIsFavorite(state, movie.id));
  const [toggleFavoriteMutation] = useToggleMovieFavoriteMutation();
  const [deleteMovie] = useDeleteMovieMutation();

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this movie?')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await deleteMovie({ id: movie.id }).unwrap();
      toast.success('Movie deleted successfully');
    } catch {
      toast.error('Failed to delete movie');
      setIsDeleting(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(movie);
  };

  const handleCardClick = () => {
    router.push(`/movies/${movie.id}`);
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

  return (
    <Card 
      className={`movie-card cursor-pointer group relative bg-card/50 backdrop-blur border-2 border-transparent hover:border-primary/20 overflow-hidden h-full flex flex-col ${className}`}
      onClick={handleCardClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <CardHeader className="p-4 relative z-10">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1 group-hover:text-primary transition-colors duration-300">
            {movie.title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteToggle}
            className={`shrink-0 transform hover:scale-110 transition-all duration-200 ${
              isFavorite 
                ? 'text-red-500 hover:text-red-600 animate-pulse' 
                : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current animate-bounce-soft' : ''}`} />
          </Button>
        </div>
        
        {movie.overview && (
          <p className="text-sm text-muted-foreground line-clamp-3 group-hover:text-foreground/80 transition-colors duration-300">
            {movie.overview}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0 relative z-10 flex-1">
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
            <div className="flex items-center gap-1 hover:text-primary transition-colors duration-200">
              <Calendar className="h-3 w-3" />
              {formatYear(movie.release_date)}
            </div>
            <div className="flex items-center gap-1 hover:text-primary transition-colors duration-200">
              <Clock className="h-3 w-3" />
              {formatRuntime(movie.runtime)}
            </div>
            {movie.vote_average && (
              <div className="flex items-center gap-1 hover:text-yellow-500 transition-colors duration-200">
                <Star className="h-3 w-3 text-yellow-500 group-hover:animate-pulse" />
                {movie.vote_average.toFixed(1)}
              </div>
            )}
          </div>

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {movie.genres.slice(0, 3).map((genre, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs hover:bg-primary/20 hover:text-primary transition-all duration-200 transform hover:scale-105"
                >
                  {typeof genre === 'string' ? genre : (genre as { name: string }).name}
                </Badge>
              ))}
              {movie.genres.length > 3 && (
                <Badge 
                  variant="outline" 
                  className="text-xs hover:border-primary hover:text-primary transition-all duration-200 transform hover:scale-105"
                >
                  +{movie.genres.length - 3}
                </Badge>
              )}
            </div>
          )}

          {movie.personal_rating && (
            <div className="flex items-center gap-1 text-sm group-hover:scale-105 transition-transform duration-200">
              <Star className="h-3 w-3 text-blue-500 fill-current animate-float" />
              <span className="text-blue-600 font-medium">
                {movie.personal_rating}/10
              </span>
              <span className="text-muted-foreground">(Your rating)</span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="p-4 pt-0 relative z-10 mt-auto">
          <div className="flex justify-end gap-2 w-full">
            {!isFavorite && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                disabled={isDeleting}
                className="hover:scale-105 hover:bg-primary/10 hover:border-primary transition-all duration-200"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="hover:scale-105 transition-all duration-200 disabled:animate-pulse"
            >
              <Trash2 className={`h-3 w-3 mr-1 ${isDeleting ? 'animate-spin' : ''}`} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}