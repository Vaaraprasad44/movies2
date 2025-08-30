import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface MovieFilters {
  search?: string;
  genres?: string[];
  yearFrom?: number;
  yearTo?: number;
  ratingFrom?: number;
  ratingTo?: number;
  sortBy?: 'title' | 'year' | 'rating' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export const useUrlSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getFiltersFromUrl = useCallback((): MovieFilters => {
    const filters: MovieFilters = {};
    
    const search = searchParams.get('search');
    if (search) filters.search = search;
    
    const genres = searchParams.get('genres');
    if (genres) filters.genres = genres.split(',');
    
    const yearFrom = searchParams.get('yearFrom');
    if (yearFrom) filters.yearFrom = parseInt(yearFrom);
    
    const yearTo = searchParams.get('yearTo');
    if (yearTo) filters.yearTo = parseInt(yearTo);
    
    const ratingFrom = searchParams.get('ratingFrom');
    if (ratingFrom) filters.ratingFrom = parseFloat(ratingFrom);
    
    const ratingTo = searchParams.get('ratingTo');
    if (ratingTo) filters.ratingTo = parseFloat(ratingTo);
    
    const sortBy = searchParams.get('sortBy') as MovieFilters['sortBy'];
    if (sortBy) filters.sortBy = sortBy;
    
    const sortOrder = searchParams.get('sortOrder') as MovieFilters['sortOrder'];
    if (sortOrder) filters.sortOrder = sortOrder;
    
    const page = searchParams.get('page');
    if (page) filters.page = parseInt(page);
    
    const size = searchParams.get('size');
    if (size) filters.size = parseInt(size);
    
    return filters;
  }, [searchParams]);

  const updateUrl = useCallback((filters: MovieFilters, replace = false) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.genres?.length) params.set('genres', filters.genres.join(','));
    if (filters.yearFrom) params.set('yearFrom', filters.yearFrom.toString());
    if (filters.yearTo) params.set('yearTo', filters.yearTo.toString());
    if (filters.ratingFrom) params.set('ratingFrom', filters.ratingFrom.toString());
    if (filters.ratingTo) params.set('ratingTo', filters.ratingTo.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    if (filters.size && filters.size !== 20) params.set('size', filters.size.toString());
    
    const url = params.toString() ? `?${params.toString()}` : '/';
    
    if (replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

  return {
    getFiltersFromUrl,
    updateUrl,
  };
};