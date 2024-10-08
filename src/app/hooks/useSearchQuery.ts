import { useState } from 'react';

export const useSearchQuery = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSearchQuery = (query: string) => {
    setSearchQuery(query);
  };

  return {
    searchQuery,
    setSearchQuery,
    handleSearchQuery,
  };
};
