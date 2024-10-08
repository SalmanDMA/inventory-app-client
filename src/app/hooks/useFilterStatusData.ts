import { useState, useRef } from 'react';

export const useFilterStatusData = () => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const filterRef = useRef<HTMLDivElement>(null);

  const handleFilterStatus = (status: string) => {
    setFilterStatus(status);
    setIsFilterOpen(false);
  };

  return {
    filterStatus,
    isFilterOpen,
    filterRef,
    handleFilterStatus,
    setIsFilterOpen,
  };
};
