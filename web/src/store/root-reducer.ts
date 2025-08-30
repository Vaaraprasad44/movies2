import { combineReducers } from '@reduxjs/toolkit';

import { reducer as apiReducer, reducerPath } from './api';
import favoritesReducer from './slices/favorites';

export const rootReducer = combineReducers({
  [reducerPath]: apiReducer,
  favorites: favoritesReducer,
});
