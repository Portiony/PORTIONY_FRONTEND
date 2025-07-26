import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomeBody.module.css';
import typography from './Typography.module.css';

import banner1 from '../../assets/banner1.png';
import banner2 from '../../assets/banner2.png';
import banner3 from '../../assets/banner3.png';

import ProductList from '../ProductList/productList';
import Pagination from '../../components/PageNumber/Pagination';
import Dropdown from '../../components/DropDown/DropDown';
import dummyTransactions from '../../data/dummyTransaction';

import {fetchPosts} from '../../api/postApi';
import ProductSkeleton from '../ProductList/ProductSkeleton';


const images = [
    banner1,
    banner2,
    banner3
];

function HomeBody({ selectedAddress, selectedCategory, searchKeyword }) {
  
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dateSort, setDateSort] = useState("날짜");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // 페이지당 상품 개수
  const [showClosed, setShowClosed] = useState(false); //공구 마감된 상품 보기 여부
  const [products, setProducts] = useState({
    post: [],
    total: 0,
    page:1
  }); // 상품 데이터
  const [loading, setLoading] = useState(false);



  // 슬라이더 이미지 변경을 위한 타이머 설정
  useEffect(() => {
    const timer = setInterval(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, 6000); // 6초 간격

  return () => clearInterval(timer);
  }, [currentIndex]);

  
  // 구매 완료 집계
  const transactions = {};

  dummyTransactions.forEach(tx => {
    const productId = tx.productId;

    if (transactions[productId]) {
      // 이미 등장한 productId면 카운트 증가
      transactions[productId] += 1;
    } else {
      // 처음 등장한 productId면 카운트 1로 초기화
      transactions[productId] = 1;
    }
  });


  // 상품 데이터 - 화면 바뀌거나 렌더링 될 때마다 API 호출
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await fetchPosts({
          category: selectedCategory === '전체'? '' : selectedCategory,
          page: currentPage,
          status: showClosed? 'DONE' : 'PROGRESS',
          regionId: selectedAddress?.sido,
          subregionId: selectedAddress?.sigungu,
          dongId: selectedAddress?.dong,
          sort: dateSort === '최신 순' ? 'latest' : 'oldest',
          keyword: searchKeyword,
        });
        const refinedPosts = data.posts.map(post => ({
          id: post.id,
          name: post.title,
          price: `${post.price.toLocaleString()}원 / ${post.capacity}${post.unit}`,
          image: post.thumbnail,
          endDate: post.deadline,
          details: `공구 인원 ${post.capacity}명 · 거래 완료 ${post.completedCount}명`,
          location: selectedAddress?.dong
        }));
        setProducts({ total: data.total, posts: refinedPosts });
      } catch (err) {
        console.error('[상품 불러오기 실패]', err);
      } finally{
        setLoading(false);
      }
    };
    fetch();
  }, [selectedCategory, currentPage, showClosed, selectedAddress, searchKeyword, dateSort]);


  const totalPages = (products.total + productsPerPage) / productsPerPage;

  return(
    <div className={styles.container}>
      {/* 배너 슬라이더 */}
      <div className={styles.bannerWrapper}>
        <div
          className={styles.slider}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, i) => (
            <img key={i} src={src} alt={`slide-${i}`} className={styles.slideImage} />
          ))}
        </div>
        <div className={styles.dots}>
          {images.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === currentIndex ? styles.active : ''}`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      </div>

      {/* 상품 목록 */}
      <div className={styles.content}>
        <div className={styles.controlBar}>
          <div className={styles.filterSection}>
            <Dropdown
              options={['최신 순', '오래된 순']}
              selected={dateSort}
              setSelected={setDateSort}
              placeholder="날짜"
            />
            <div className={styles.checkbox}>
              <label className={styles.customCheckbox}>
                <input 
                  type="checkbox"
                  checked={showClosed}
                  onChange={(e)=>{
                    const checked = e.target.checked;
                    setShowClosed(checked)}
                  }
                />
                <span className={styles.customBox}></span>
              </label>
              <span className={typography.body1}>
                  공구 마감된 상품 보기
              </span>
            </div>
          </div>
          <div className={styles.actionSection}>
              <span className={typography.body1}>함께 구매하고, 더 좋은 나눔을 해요!</span>
              <button 
                className={`${styles.writeBtn} ${typography.body1}`}
                onClick={() => navigate('/group-buy/new')}
              >판매 등록</button>
          </div>
        </div>
        {loading ? (
          <ProductSkeleton />
        ) : (
        <div className={products.total === 0 ? styles.emptyContainer : ''}>
          {products.total > 0 ?(
            <ProductList products={products.posts} context="home" />
          ) : (
            <p className={styles.empty}>등록된 상품이 없습니다.</p>
          )}
        </div>
      )}
      </div>
      <Pagination
        totalPages={Math.ceil(products.total / productsPerPage)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default HomeBody;