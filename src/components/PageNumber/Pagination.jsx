import React from 'react';
import styles from './Pagination.module.css';

export default function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null;

  const PAGE_GROUP_SIZE = 5;
  const currentGroup = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE);
  const startPage = currentGroup * PAGE_GROUP_SIZE + 1;
  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

  const pages = [];

  pages.push(
    <button
      key="arrow-prev"
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className={styles.arrowButton}
    >
      &lt;
    </button>
  );

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <button
        key={`page-${i}`}
        onClick={() => onPageChange(i)}
        className={
          i === currentPage
            ? `${styles.pageNumber} ${styles.activePage}`
            : styles.pageNumber
        }
      >
        {i}
      </button>
    );
  }

  pages.push(
    <button
      key="arrow-next"
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className={styles.arrowButton}
    >
      &gt;
    </button>
  );

  return <div className={styles.pagination}>{pages}</div>;
}
