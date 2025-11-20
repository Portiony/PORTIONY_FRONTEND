import React, { useState, useEffect } from 'react';
import styles from './BuyHistory.module.css';
import Dropdown from '../../../components/DropDown/DropDown';
import ProductList from '../../../components/ProductList/productList';
import Pagination from '../../../components/PageNumber/Pagination';
import instance from '../../../lib/axios';
import defaultImage from '../../../assets/LOGOMAIN.png'; 

export default function BuyHistory() {
  const [dateSort, setDateSort] = useState('날짜');
  const [priceSort, setPriceSort] = useState('금액');
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const size = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sortParam = dateSort === '최신 순' ? 'recent' : 'oldest';
        const priceParam =
          priceSort === '금액 높은 순'
            ? 'desc'
            : priceSort === '금액 낮은 순'
            ? 'asc'
            : null;

        const params = {
          sort: sortParam,
          page: currentPage,
          size,
        };

        if (priceParam) params.price = priceParam;

        const res = await instance.get('/api/users/me/purchases', { params });

        console.log('API 응답:', res.data);

        const { post = [], total = 0 } = res.data;

        const mappedProducts = post.map(item => ({
          id: item.postId,
          name: item.title,
          price: `${item.price.toLocaleString()} 원`,
          details: '',
          image:
            item.thumbnail && item.thumbnail.trim() !== ''
              ? item.thumbnail
              : defaultImage,
          location: item.region || '지역 정보 없음',
          endDate: item.purchasedAt,
        }));

        console.log('구매 내역:', mappedProducts);

        setProducts(mappedProducts);
        setTotalPages(Math.max(1, Math.ceil(total / size)));
      } catch (err) {
        console.error('구매 내역 불러오기 실패:', err);
        setProducts([]);
        setTotalPages(1);
      }
    };

    fetchData();
  }, [dateSort, priceSort, currentPage]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>구매 내역</h2>
      <div className={styles.dropdownWrapper}>
        <Dropdown
          options={['최신 순', '오래된 순']}
          selected={dateSort}
          setSelected={setDateSort}
          placeholder="날짜"
        />
        <Dropdown
          options={['금액 높은 순', '금액 낮은 순']}
          selected={priceSort}
          setSelected={setPriceSort}
          placeholder="금액"
        />
      </div>
      <div className={styles.content}>
        {products.length > 0 ? (
          <ProductList products={products} />
        ) : (
          <p className={styles.empty}>구매 내역이 없습니다.</p>
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
