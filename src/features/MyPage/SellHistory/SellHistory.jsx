import React, { useState, useEffect } from 'react';
import styles from './SellHistory.module.css';
import Dropdown from '../../../components/DropDown/DropDown';
import ProductList from '../../../components/ProductList/productList';
import Pagination from '../../../components/PageNumber/Pagination';
import instance from '../../../lib/axios';

export default function SellHistory() {
  const [dateSort, setDateSort] = useState('정렬 기준');
  const [priceSort, setPriceSort] = useState('금액');
  const [statusSort, setStatusSort] = useState('공구 상태');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const productsPerPage = 12;

  const sortParam =
    dateSort === '오래된 순' ? 'oldest' : 'recent';
  const priceParam =
    priceSort === '금액 높은 순'
      ? 'desc'
      : priceSort === '금액 낮은 순'
      ? 'asc'
      : undefined;
  const statusParam =
    statusSort === '공구 중'
      ? 'ongoing'
      : statusSort === '공구 완료'
      ? 'completed'
      : undefined;

  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await instance.get(`/api/users/${userId}/sales`, {
          params: {
            sort: sortParam,
            price: priceParam,
            status: statusParam,
            page: currentPage,
            size: productsPerPage,
          },
        });

        const { total, post = [] } = res.data;

        const formatted = post.map((item) => {
          const createdDate = item.createdAt
            ? item.createdAt.split('T')[0]
            : '';

          const rawDetails = item.details || '';
          let statusLabel = '공구 중'; 
          const match = rawDetails.match(
            /공구인원\s*(\d+)명\s*·\s*거래완료\s*(\d+)명/
          );

          if (match) {
            const totalCount = parseInt(match[1], 10);
            const completedCount = parseInt(match[2], 10);

            if (
              Number.isFinite(totalCount) &&
              Number.isFinite(completedCount) &&
              totalCount > 0 &&
              totalCount === completedCount
            ) {
              statusLabel = '공구 마감';
            } else {
              statusLabel = '공구 중';
            }
          } else {
            if (item.status === 'completed' || item.status === '공구 마감') {
              statusLabel = '공구 마감';
            }
          }

          return {
            id: item.postId,
            name: item.title,
            price: `${Number(item.price).toLocaleString()} 원`,
            details: createdDate ? `등록일자 : ${createdDate}` : '',
            image: item.thumbnail,
            location: item.region,
            endDate: item.createdAt,
            status: statusLabel, 
          };
        });

        setProducts(formatted);
        setTotalPages(Math.max(1, Math.ceil(total / productsPerPage)));
      } catch (err) {
        console.error('판매 내역 불러오기 실패:', err);
      }
    };

    if (userId) fetchData();
  }, [dateSort, priceSort, statusSort, currentPage, userId, sortParam, priceParam, statusParam]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>판매 내역</h2>
      <div className={styles.dropdownWrapper}>
        <Dropdown
          options={['최신 순', '오래된 순']}
          selected={dateSort}
          setSelected={setDateSort}
          placeholder="정렬 기준"
        />
        <Dropdown
          options={['금액 높은 순', '금액 낮은 순']}
          selected={priceSort}
          setSelected={setPriceSort}
          placeholder="금액"
        />
        <Dropdown
          options={['공구 중', '공구 완료']}
          selected={statusSort}
          setSelected={setStatusSort}
          placeholder="공구 상태"
        />
      </div>
      <div className={styles.content}>
        {products.length > 0 ? (
          <ProductList products={products} />
        ) : (
          <p className={styles.empty}>판매 내역이 없습니다.</p>
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
