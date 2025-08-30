import { moviesApi } from '../generated/movies';
import type { Movie, CreateMovieCommand, UpdateMovieCommand } from '../generated/movies';

// Enhanced API endpoints with additional functionality
export const moviesEnhancedApi = moviesApi.injectEndpoints({
  endpoints: (build) => ({
    // Toggle favorite status
    toggleMovieFavorite: build.mutation<void, { id: number; isFavorite: boolean }>({
      query: ({ id, isFavorite }) => ({
        url: `/api/Movies/${id}`,
        method: 'PUT',
        body: { is_favorite: isFavorite },
      }),
      // Optimistic update
      async onQueryStarted({ id, isFavorite }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          moviesApi.util.updateQueryData('getMovie', { id }, (draft) => {
            draft.is_favorite = isFavorite;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Rate a movie
    rateMovie: build.mutation<void, { id: number; rating: number; notes?: string }>({
      query: ({ id, rating, notes }) => ({
        url: `/api/Movies/${id}`,
        method: 'PUT',
        body: { 
          personal_rating: rating,
          ...(notes !== undefined && { personal_notes: notes })
        },
      }),
      // Optimistic update
      async onQueryStarted({ id, rating, notes }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          moviesApi.util.updateQueryData('getMovie', { id }, (draft) => {
            draft.personal_rating = rating;
            if (notes !== undefined) {
              draft.personal_notes = notes;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
  overrideExisting: false,
});

// Export all hooks
export const {
  // Original hooks from generated API
  useGetMoviesQuery,
  useCreateMovieMutation,
  useSearchMoviesQuery,
  useGetFavoriteMoviesQuery,
  useGetMovieQuery,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
  // Enhanced hooks
  useToggleMovieFavoriteMutation,
  useRateMovieMutation,
} = moviesEnhancedApi;

// Export types
export type { Movie, CreateMovieCommand, UpdateMovieCommand };