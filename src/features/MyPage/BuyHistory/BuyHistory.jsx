import React, { useState, useEffect } from 'react';
import styles from './BuyHistory.module.css';
import Dropdown from '../../../components/DropDown/DropDown';
import ProductList from '../../../components/ProductList/productList';
import Pagination from '../../../components/PageNumber/Pagination';
import instance from '../../../lib/axios';
import defaultImage from '../../../assets/LOGOMAIN.png'; // 기본 이미지

// 🔥 예시 데이터 (구매 내역이 없을 때 화면 확인용)
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: '스타벅스 라떼 10잔 공구',
    price: '18,000 원',
    details: '공구상태: 진행중 / 노원구 공릉동 픽업',
    image: defaultImage,
    location: '서울 노원구 공릉동',
    endDate: '2025-11-30',
  },
  {
    id: 2,
    name: '코스트코 고구마 말랭이 반띵',
    price: '7,500 원',
    details: '공구상태: 완료 / 직거래 완료',
    image: defaultImage,
    location: '서울 동대문구 이문동',
    endDate: '2025-11-10',
  },
  {
    id: 3,
    name: '생수 2L x 12병 나눔',
    price: '5,000 원',
    details: '공구상태: 진행중 / 택배 가능',
    image: defaultImage,
    location: '서울 노원구 중계동',
    endDate: '2025-11-25',
  },
];

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

        console.log('📦 API 응답:', res.data);

        const { post = [], total = 0 } = res.data;

        const mappedProducts = post.map(item => ({
          id: item.postId,
          name: item.title,
          price: `${item.price.toLocaleString()} 원`,
          details: `공구상태: ${item.status} / ${item.details}`,
          image:
            item.thumbnail && item.thumbnail.trim() !== ''
              ? item.thumbnail
              : defaultImage,
          location: item.region || '지역 정보 없음',
          endDate: item.purchasedAt,
        }));

        console.log('✅ 구매 내역:', mappedProducts);

        // 🔥 백엔드에서 아직 데이터가 없으면 예시 데이터로 보여주기
        if (mappedProducts.length === 0) {
          setProducts(SAMPLE_PRODUCTS);
          setTotalPages(1);
        } else {
          setProducts(mappedProducts);
          setTotalPages(Math.max(1, Math.ceil(total / size)));
        }
      } catch (err) {
        console.error('❌ 구매 내역 불러오기 실패:', err);
        // 🔥 오류가 나도 예시 데이터 보여주기
        setProducts(SAMPLE_PRODUCTS);
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
