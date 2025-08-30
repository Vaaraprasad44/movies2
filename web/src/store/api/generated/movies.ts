/* eslint-disable -- Auto Generated File */
import { emptySplitApi as api } from "../empty-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMovies: build.query<GetMoviesApiResponse, GetMoviesApiArg>({
      query: (queryArg) => ({
        url: `/api/Movies`,
        params: {
          page: queryArg.page,
          size: queryArg.size,
          search: queryArg.search,
          genres: queryArg.genres,
          year_from: queryArg.yearFrom,
          year_to: queryArg.yearTo,
          rating_from: queryArg.ratingFrom,
          rating_to: queryArg.ratingTo,
          runtime_from: queryArg.runtimeFrom,
          runtime_to: queryArg.runtimeTo,
          language: queryArg.language,
          is_favorite: queryArg.isFavorite,
          personal_rating_from: queryArg.personalRatingFrom,
          personal_rating_to: queryArg.personalRatingTo,
        },
      }),
    }),
    createMovie: build.mutation<CreateMovieApiResponse, CreateMovieApiArg>({
      query: (queryArg) => ({
        url: `/api/Movies`,
        method: "POST",
        body: queryArg.createMovieCommand,
      }),
    }),
    searchMovies: build.query<SearchMoviesApiResponse, SearchMoviesApiArg>({
      query: (queryArg) => ({
        url: `/api/Movies/search`,
        params: {
          q: queryArg.q,
          page: queryArg.page,
          size: queryArg.size,
        },
      }),
    }),
    getFavoriteMovies: build.query<
      GetFavoriteMoviesApiResponse,
      GetFavoriteMoviesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/Movies/favorites`,
        params: {
          page: queryArg.page,
          size: queryArg.size,
        },
      }),
    }),
    getMovie: build.query<GetMovieApiResponse, GetMovieApiArg>({
      query: (queryArg) => ({ url: `/api/Movies/${queryArg.id}` }),
    }),
    updateMovie: build.mutation<UpdateMovieApiResponse, UpdateMovieApiArg>({
      query: (queryArg) => ({
        url: `/api/Movies/${queryArg.id}`,
        method: "PUT",
        body: queryArg.updateMovieCommand,
      }),
    }),
    deleteMovie: build.mutation<DeleteMovieApiResponse, DeleteMovieApiArg>({
      query: (queryArg) => ({
        url: `/api/Movies/${queryArg.id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as moviesApi };
export type GetMoviesApiResponse =
  /** status 200 Successful Response */ PaginatedMovieResponse;
export type GetMoviesApiArg = {
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
  /** Search in title, overview, cast, crew */
  search?: string | null;
  /** Filter by genre names */
  genres?: string[] | null;
  /** Minimum release year */
  yearFrom?: number | null;
  /** Maximum release year */
  yearTo?: number | null;
  /** Minimum vote average */
  ratingFrom?: number | null;
  /** Maximum vote average */
  ratingTo?: number | null;
  /** Minimum runtime */
  runtimeFrom?: number | null;
  /** Maximum runtime */
  runtimeTo?: number | null;
  /** Original language */
  language?: string | null;
  /** Filter favorites */
  isFavorite?: boolean | null;
  /** Minimum personal rating */
  personalRatingFrom?: number | null;
  /** Maximum personal rating */
  personalRatingTo?: number | null;
};
export type CreateMovieApiResponse =
  /** status 200 Successful Response */ number;
export type CreateMovieApiArg = {
  createMovieCommand: CreateMovieCommand;
};
export type SearchMoviesApiResponse =
  /** status 200 Successful Response */ PaginatedMovieResponse;
export type SearchMoviesApiArg = {
  /** Search query */
  q: string;
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetFavoriteMoviesApiResponse =
  /** status 200 Successful Response */ PaginatedMovieResponse;
export type GetFavoriteMoviesApiArg = {
  /** Page number */
  page?: number;
  /** Page size */
  size?: number;
};
export type GetMovieApiResponse = /** status 200 Successful Response */ Movie;
export type GetMovieApiArg = {
  id: number;
};
export type UpdateMovieApiResponse = /** status 200 Successful Response */ any;
export type UpdateMovieApiArg = {
  id: number;
  updateMovieCommand: UpdateMovieCommand;
};
export type DeleteMovieApiResponse = /** status 200 Successful Response */ any;
export type DeleteMovieApiArg = {
  id: number;
};
export type Movie = {
  id: number;
  /** Movie title */
  title: string;
  /** Movie overview/plot */
  overview?: string | null;
  /** List of genre objects */
  genres?: object[];
  /** List of keyword objects */
  keywords?: object[];
  /** Movie tagline */
  tagline?: string | null;
  /** List of cast members */
  cast?: object[];
  /** List of crew members */
  crew?: object[];
  /** Production companies */
  production_companies?: object[];
  /** Production countries */
  production_countries?: object[];
  /** Spoken languages */
  spoken_languages?: object[];
  /** Original language code */
  original_language?: string | null;
  /** Original title */
  original_title?: string | null;
  /** Release date */
  release_date?: string | null;
  /** Runtime in minutes */
  runtime?: number | null;
  /** Average vote score */
  vote_average?: number | null;
  /** Number of votes */
  vote_count?: number | null;
  /** Popularity score */
  popularity?: number | null;
  /** User favorite flag */
  is_favorite?: boolean;
  /** Personal rating (1-10) */
  personal_rating?: number | null;
  /** Personal notes */
  personal_notes?: string | null;
};
export type PaginatedMovieResponse = {
  items: Movie[];
  total: number;
  page: number;
  size: number;
  pages: number;
};
export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};
export type HttpValidationError = {
  detail?: ValidationError[];
};
export type CreateMovieCommand = {
  /** Movie title */
  title: string;
  overview?: string | null;
  genres?: object[];
  keywords?: object[];
  tagline?: string | null;
  cast?: object[];
  crew?: object[];
  production_companies?: object[];
  production_countries?: object[];
  spoken_languages?: object[];
  original_language?: string | null;
  original_title?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
};
export type UpdateMovieCommand = {
  title?: string | null;
  overview?: string | null;
  is_favorite?: boolean | null;
  /** Personal rating (1-10) */
  personal_rating?: number | null;
  personal_notes?: string | null;
};
export const {
  useGetMoviesQuery,
  useCreateMovieMutation,
  useSearchMoviesQuery,
  useGetFavoriteMoviesQuery,
  useGetMovieQuery,
  useUpdateMovieMutation,
  useDeleteMovieMutation,
} = injectedRtkApi;
