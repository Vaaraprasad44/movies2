import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Movie } from '../api/enhanced/movies';

interface FavoritesState {
  favoriteIds: number[];
  favoriteMovies: Record<number, Movie>;
}

const initialState: FavoritesState = {
  favoriteIds: [],
  favoriteMovies: {},
};

// Load favorites from localStorage on initialization
const loadFavoritesFromStorage = (): FavoritesState => {
  if (typeof window === 'undefined') return initialState;
  
  try {
    const stored = localStorage.getItem('movieFavorites');
    return stored ? JSON.parse(stored) : initialState;
  } catch {
    return initialState;
  }
};

// Save favorites to localStorage
const saveFavoritesToStorage = (state: FavoritesState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('movieFavorites', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save favorites to localStorage:', error);
  }
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: loadFavoritesFromStorage(),
  reducers: {
    addToFavorites: (state, action: PayloadAction<Movie>) => {
      const movie = action.payload;
      if (!state.favoriteIds.includes(movie.id)) {
        state.favoriteIds.push(movie.id);
        state.favoriteMovies[movie.id] = movie;
        saveFavoritesToStorage(state);
      }
    },
    removeFromFavorites: (state, action: PayloadAction<number>) => {
      const movieId = action.payload;
      state.favoriteIds = state.favoriteIds.filter(id => id !== movieId);
      delete state.favoriteMovies[movieId];
      saveFavoritesToStorage(state);
    },
    toggleFavorite: (state, action: PayloadAction<Movie>) => {
      const movie = action.payload;
      const isCurrentlyFavorite = state.favoriteIds.includes(movie.id);
      
      if (isCurrentlyFavorite) {
        state.favoriteIds = state.favoriteIds.filter(id => id !== movie.id);
        delete state.favoriteMovies[movie.id];
      } else {
        state.favoriteIds.push(movie.id);
        state.favoriteMovies[movie.id] = movie;
      }
      saveFavoritesToStorage(state);
    },
    updateFavoriteMovie: (state, action: PayloadAction<Movie>) => {
      const movie = action.payload;
      if (state.favoriteIds.includes(movie.id)) {
        state.favoriteMovies[movie.id] = movie;
        saveFavoritesToStorage(state);
      }
    },
    hydrateFavorites: (state) => {
      const stored = loadFavoritesFromStorage();
      state.favoriteIds = stored.favoriteIds;
      state.favoriteMovies = stored.favoriteMovies;
    },
  },
});

export const {
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  updateFavoriteMovie,
  hydrateFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;

// Selectors
export const selectFavoriteIds = (state: { favorites: FavoritesState }) => state.favorites.favoriteIds;
export const selectFavoriteMovies = (state: { favorites: FavoritesState }) => state.favorites.favoriteMovies;
export const selectIsFavorite = (state: { favorites: FavoritesState }, movieId: number) => 
  state.favorites.favoriteIds.includes(movieId);
export const selectFavoritesArray = (state: { favorites: FavoritesState }) =>
  state.favorites.favoriteIds.map(id => state.favorites.favoriteMovies[id]).filter(Boolean);