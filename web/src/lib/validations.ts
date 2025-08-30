import { z } from 'zod';

// Base movie schema matching the API
export const MovieSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required'),
  overview: z.string().nullable().optional(),
  genres: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
  })).default([]),
  keywords: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
  })).default([]),
  tagline: z.string().nullable().optional(),
  cast: z.array(z.object({
    cast_id: z.number().optional(),
    character: z.string().optional(),
    credit_id: z.string().optional(),
    gender: z.number().optional(),
    id: z.number().optional(),
    name: z.string(),
    order: z.number().optional(),
  })).default([]),
  crew: z.array(z.object({
    credit_id: z.string().optional(),
    department: z.string().optional(),
    gender: z.number().optional(),
    id: z.number().optional(),
    job: z.string().optional(),
    name: z.string(),
  })).default([]),
  production_companies: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
  })).default([]),
  production_countries: z.array(z.object({
    iso_3166_1: z.string().optional(),
    name: z.string(),
  })).default([]),
  spoken_languages: z.array(z.object({
    iso_639_1: z.string().optional(),
    name: z.string(),
  })).default([]),
  original_language: z.string().nullable().optional(),
  original_title: z.string().nullable().optional(),
  release_date: z.string().nullable().optional(),
  runtime: z.number().nullable().optional(),
  vote_average: z.number().nullable().optional(),
  vote_count: z.number().nullable().optional(),
  popularity: z.number().nullable().optional(),
  is_favorite: z.boolean().default(false),
  personal_rating: z.number().min(1).max(10).nullable().optional(),
  personal_notes: z.string().nullable().optional(),
});

// Create movie command schema
export const CreateMovieSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  overview: z.string().optional(),
  genres: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
  })).default([]),
  keywords: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
  })).default([]),
  tagline: z.string().optional(),
  cast: z.array(z.object({
    name: z.string(),
    character: z.string().optional(),
  })).default([]),
  crew: z.array(z.object({
    name: z.string(),
    job: z.string().optional(),
    department: z.string().optional(),
  })).default([]),
  production_companies: z.array(z.object({
    name: z.string(),
  })).default([]),
  production_countries: z.array(z.object({
    name: z.string(),
  })).default([]),
  spoken_languages: z.array(z.object({
    name: z.string(),
  })).default([]),
  original_language: z.string().optional(),
  original_title: z.string().optional(),
  release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  runtime: z.number().min(1, 'Runtime must be positive').optional(),
  vote_average: z.number().min(0).max(10).optional(),
  vote_count: z.number().min(0).optional(),
  popularity: z.number().min(0).optional(),
});

// Update movie command schema
export const UpdateMovieSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  overview: z.string().optional(),
  is_favorite: z.boolean().optional(),
  personal_rating: z.number().min(1, 'Rating must be between 1-10').max(10, 'Rating must be between 1-10').optional(),
  personal_notes: z.string().max(1000, 'Notes too long').optional(),
});

// Movie filters schema
export const MovieFiltersSchema = z.object({
  search: z.string().optional(),
  genres: z.array(z.string()).optional(),
  year_from: z.number().min(1900).max(2030).optional(),
  year_to: z.number().min(1900).max(2030).optional(),
  rating_from: z.number().min(0).max(10).optional(),
  rating_to: z.number().min(0).max(10).optional(),
  runtime_from: z.number().min(1).optional(),
  runtime_to: z.number().min(1).optional(),
  language: z.string().optional(),
  is_favorite: z.boolean().optional(),
  personal_rating_from: z.number().min(1).max(10).optional(),
  personal_rating_to: z.number().min(1).max(10).optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  size: z.number().min(1).max(100).default(20),
});

// Paginated movie response schema
export const PaginatedMovieResponseSchema = z.object({
  items: z.array(MovieSchema),
  total: z.number(),
  page: z.number(),
  size: z.number(),
  pages: z.number(),
});

// Export types
export type Movie = z.infer<typeof MovieSchema>;
export type CreateMovie = z.infer<typeof CreateMovieSchema>;
export type UpdateMovie = z.infer<typeof UpdateMovieSchema>;
export type MovieFilters = z.infer<typeof MovieFiltersSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PaginatedMovieResponse = z.infer<typeof PaginatedMovieResponseSchema>;

// Validation helpers
export const validateMovie = (data: unknown): Movie => MovieSchema.parse(data);
export const validateCreateMovie = (data: unknown): CreateMovie => CreateMovieSchema.parse(data);
export const validateUpdateMovie = (data: unknown): UpdateMovie => UpdateMovieSchema.parse(data);
export const validateMovieFilters = (data: unknown): MovieFilters => MovieFiltersSchema.parse(data);
export const validatePagination = (data: unknown): Pagination => PaginationSchema.parse(data);

// Form validation helpers with error handling
export const safeValidateCreateMovie = (data: unknown): { success: true; data: CreateMovie } | { success: false; error: string } => {
  try {
    const validData = CreateMovieSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Invalid data' };
  }
};

export const safeValidateUpdateMovie = (data: unknown): { success: true; data: UpdateMovie } | { success: false; error: string } => {
  try {
    const validData = UpdateMovieSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Invalid data' };
  }
};

export const safeValidateMovieFilters = (data: unknown): { success: true; data: MovieFilters } | { success: false; error: string } => {
  try {
    const validData = MovieFiltersSchema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') };
    }
    return { success: false, error: 'Invalid data' };
  }
};