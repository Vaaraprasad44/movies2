'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateMovieSchema, UpdateMovieSchema, type CreateMovie, type UpdateMovie } from '@/lib/validations';
import type { Movie } from '@/store/api/enhanced/movies';
import { useCreateMovieMutation, useUpdateMovieMutation } from '@/store/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MovieFormProps {
  movie?: Movie;
  onSuccess?: (movie: Movie) => void;
  onCancel?: () => void;
  className?: string;
}

export function MovieForm({ movie, onSuccess, onCancel, className }: MovieFormProps) {
  const isEditing = !!movie;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [createMovie] = useCreateMovieMutation();
  const [updateMovie] = useUpdateMovieMutation();
  
  const schema = isEditing ? UpdateMovieSchema : CreateMovieSchema;
  const defaultValues = isEditing
    ? {
        title: movie.title,
        overview: movie.overview || '',
        personal_rating: movie.personal_rating || undefined,
        personal_notes: movie.personal_notes || '',
      }
    : {
        title: '',
        overview: '',
        runtime: undefined,
        vote_average: undefined,
      };

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<CreateMovie | UpdateMovie>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: CreateMovie | UpdateMovie) => {
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isEditing && movie) {
        // Optimistic update
        const optimisticMovie = { ...movie, ...data };
        onSuccess?.(optimisticMovie);
        
        result = await updateMovie({
          id: movie.id,
          updateMovieCommand: data as UpdateMovie,
        }).unwrap();
        
        toast.success('Movie updated successfully!');
      } else {
        result = await createMovie({
          createMovieCommand: data as CreateMovie,
        }).unwrap();
        
        toast.success('Movie created successfully!');
        reset();
      }
      
      if (result && typeof result === 'object' && 'id' in result) {
        onSuccess?.(result as Movie);
      }
    } catch (error) {
      console.error('Failed to save movie:', error);
      toast.error(isEditing ? 'Failed to update movie' : 'Failed to create movie');
      
      // Revert optimistic update on error
      if (isEditing && movie) {
        onSuccess?.(movie);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenreChange = (genres: string) => {
    try {
      const genreArray = genres.split(',').map(g => ({ name: g.trim() })).filter(g => g.name);
      setValue('genres', genreArray, { shouldDirty: true });
    } catch {
      setValue('genres', [], { shouldDirty: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter movie title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="overview">Overview</Label>
          <Textarea
            id="overview"
            {...register('overview')}
            placeholder="Enter movie overview"
            rows={3}
            className={errors.overview ? 'border-red-500' : ''}
          />
          {errors.overview && (
            <p className="text-sm text-red-500 mt-1">{errors.overview.message}</p>
          )}
        </div>

        {!isEditing && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="runtime">Runtime (minutes)</Label>
                <Input
                  id="runtime"
                  type="number"
                  {...register('runtime', { valueAsNumber: true })}
                  placeholder="120"
                  className={'runtime' in errors && errors.runtime ? 'border-red-500' : ''}
                />
                {'runtime' in errors && errors.runtime && (
                  <p className="text-sm text-red-500 mt-1">{errors.runtime.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="vote_average">Rating (0-10)</Label>
                <Input
                  id="vote_average"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  {...register('vote_average', { valueAsNumber: true })}
                  placeholder="7.5"
                  className={'vote_average' in errors && errors.vote_average ? 'border-red-500' : ''}
                />
                {'vote_average' in errors && errors.vote_average && (
                  <p className="text-sm text-red-500 mt-1">{errors.vote_average.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="genres">Genres (comma-separated)</Label>
              <Input
                id="genres"
                placeholder="Action, Drama, Comedy"
                onChange={(e) => handleGenreChange(e.target.value)}
              />
            </div>
          </>
        )}

        {isEditing && (
          <>
            <div>
              <Label htmlFor="personal_rating">Personal Rating (1-10)</Label>
              <Input
                id="personal_rating"
                type="number"
                min="1"
                max="10"
                {...register('personal_rating', { valueAsNumber: true })}
                placeholder="8"
                className={'personal_rating' in errors && errors.personal_rating ? 'border-red-500' : ''}
              />
              {'personal_rating' in errors && errors.personal_rating && (
                <p className="text-sm text-red-500 mt-1">{errors.personal_rating.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="personal_notes">Personal Notes</Label>
              <Textarea
                id="personal_notes"
                {...register('personal_notes')}
                placeholder="Your thoughts about this movie..."
                rows={3}
                className={'personal_notes' in errors && errors.personal_notes ? 'border-red-500' : ''}
              />
              {'personal_notes' in errors && errors.personal_notes && (
                <p className="text-sm text-red-500 mt-1">{errors.personal_notes.message}</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end space-x-2 mt-6">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || (!isDirty && isEditing)}
          className="min-w-[100px]"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}