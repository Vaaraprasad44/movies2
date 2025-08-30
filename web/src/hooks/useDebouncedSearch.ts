import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';

export const useDebouncedSearch = (
  initialValue = '',
  delay = 300,
  onSearchChange?: (value: string) => void
) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm] = useDebounce(searchTerm, delay);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearchChange]);

  const updateSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    updateSearchTerm,
    clearSearch,
    isSearching: searchTerm !== debouncedSearchTerm,
  };
};