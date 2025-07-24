import React, { useState, useEffect } from 'react';
import styles from './Likes.module.css';
import Dropdown from '../../../components/DropDown/DropDown';
import ProductList from '../../../components/ProductList/productList';
import Pagination from '../../../components/PageNumber/Pagination';
import instance from '../../../lib/axios';

export default function LikesHistory() {
  const [sortOption, setSortOption] = useState('정렬 기준');
  const [statusOption, setStatusOption] = useState('공구 상태');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 12;

  const getSortValue = (option) => {
    switch (option) {
      case '마감 임박순':
        return 'deadline_asc';
      case '마감 여유순':
        return 'deadline_desc';
      case '최근 찜순':
        return 'wishlist_recent';
      case '오래된 찜순':
        return 'wishlist_oldest';
      default:
        return 'deadline_asc';
    }
  };

  const getStatusValue = (option) => {
    switch (option) {
      case '공구 중':
        return 'ongoing';
      case '공구 완료':
        return 'completed';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sort = getSortValue(sortOption);
        const status = getStatusValue(statusOption);

        const res = await instance.get('/api/users/me/wishlist', {
          params: {
            sort,
            status,
            page: currentPage,
            size: productsPerPage,
          },
        });

        const { total, page, post } = res.data;
        setProducts(
          post.map(item => ({
            id: item.id,
            name: item.title,
            price: `${Number(item.price).toLocaleString()} 원`,
            details: `등록 일자 : ${item.createdAt}`,
            image: item.thumbnail,
            location: item.region,
            endDate: item.deadline,
            status: item.status,
          }))
        );
        setTotalPages(Math.ceil(total / productsPerPage));
      } catch (error) {
        console.error('찜 내역 불러오기 실패:', error);
        setProducts([]);
        setTotalPages(1);
      }
    };

    fetchData();
  }, [sortOption, statusOption, currentPage]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>찜 내역</h2>
      <div className={styles.dropdownWrapper}>
        <Dropdown
          options={['마감 임박순', '마감 여유순', '최근 찜순', '오래된 찜순']}
          selected={sortOption}
          setSelected={setSortOption}
          placeholder="정렬 기준"
        />
        <Dropdown
          options={['공구 중', '공구 완료']}
          selected={statusOption}
          setSelected={setStatusOption}
          placeholder="공구 상태"
        />
      </div>
      <div className={styles.content}>
        {products.length > 0 ? (
          <ProductList products={products} />
        ) : (
          <p className={styles.empty}>찜 내역이 없습니다.</p>
        )}
      </div>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}