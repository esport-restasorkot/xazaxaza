import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface PaginationProps {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  paginate: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ itemsPerPage, totalItems, currentPage, paginate }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (totalPages <= 1) {
      return null;
  }

  const handlePrev = () => {
      if (currentPage > 1) {
          paginate(currentPage - 1);
      }
  };

  const handleNext = () => {
      if (currentPage < totalPages) {
          paginate(currentPage + 1);
      }
  };

  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Table navigation">
      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
        Menampilkan <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
      </span>
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-dark-800 dark:border-dark-700 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeftIcon />
          </button>
        </li>
        {pageNumbers.map(number => (
          <li key={number}>
            <button
              onClick={() => paginate(number)}
              className={`px-3 py-2 leading-tight border ${
                currentPage === number
                  ? 'text-white bg-primary border-primary'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-dark-800 dark:border-dark-700 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white'
              }`}
            >
              {number}
            </button>
          </li>
        ))}
        <li>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-dark-800 dark:border-dark-700 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;