import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import styles from './Reviews.module.css';
import Dropdown from '../../../components/DropDown/DropDown';
import ReviewsModal from './ReviewsModal';
import arrowIcon from '../../../assets/chevron-left.svg';
import instance from '../../../lib/axios';

export default function ReviewsHistory() {
  const [viewType, setViewType] = useState('');
  const [transactionType, setTransactionType] = useState('거래 유형');
  const [dateSort, setDateSort] = useState('거래 일자');
  const [writeStatus, setWriteStatus] = useState('작성 상태');
  const [ratingSort, setRatingSort] = useState('별점');
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewData, setReviewData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [modalInfo, setModalInfo] = useState({ open: false, productName: '', mode: 'write', received: false });
  const perPage = 9;

  const userId = Number(localStorage.getItem('userId'));

  useEffect(() => {
    if (!viewType) return;
    setCurrentPage(1);
    setTransactionType('거래 유형');
    setDateSort('거래 일자');
    setWriteStatus('작성 상태');
    setRatingSort('별점');
  }, [viewType]);

  useEffect(() => {
    console.log('🟡 useEffect 진입!');
    console.log('viewType:', viewType);
    console.log('userId:', userId);

    if (!viewType || !userId) {
      console.log('⛔️ 조건 불충족으로 요청 생략');
      return;
    }

    console.log('✅ 조건 충족, 요청 시작!');

    const fetchReviews = async () => {
      const params = {
        type: transactionType === '판매 후기' ? 'sales' : 'purchase',
        sort: dateSort === '오래된 순' ? 'oldest' : 'recent',
        status: writeStatus === '작성됨' ? 'written' : 'not_written',
        page: currentPage,
        size: perPage,
      };

      console.log('📦 요청 params:', params);

      try {
        let response;
        if (viewType === '내가 남긴 후기') {
          response = await instance.get('/api/users/me/reviews', { params });
        } else {
          if (ratingSort !== '별점') {
            params.starSort = ratingSort === '별점 높은 순' ? 'high' : 'low';
          }
          response = await instance.get(`/api/users/reviews/${userId}`, { params });
        }

        console.log('✅ 응답 data:', response.data);
        setReviewData(response.data.reviews || []);
        setTotalCount(response.data.total);
      } catch (error) {
        console.error('❌ 리뷰 불러오기 실패:', error);
      }
    };

    fetchReviews();
  }, [viewType, transactionType, dateSort, writeStatus, ratingSort, currentPage, userId]);

  const totalPages = Math.ceil(totalCount / perPage);
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>거래 후기 내역</h2>
      <div className={styles.toggleButtons}>
        {['내가 남긴 후기', '받은 후기'].map(type => (
          <button
            key={type}
            className={viewType === type ? styles.active : ''}
            onClick={() => setViewType(v => (v === type ? '' : type))}
          >
            {type}
          </button>
        ))}
      </div>

      {viewType && (
        <div className={styles.dropdownWrapper}>
          <Dropdown
            options={['구매 후기', '판매 후기']}
            selected={transactionType}
            setSelected={setTransactionType}
            placeholder="거래 유형"
          />
          <Dropdown
            options={['최신 순', '오래된 순']}
            selected={dateSort}
            setSelected={setDateSort}
            placeholder="거래 일자"
          />
          {viewType === '내가 남긴 후기' && (
            <Dropdown
              options={['미작성', '작성됨']}
              selected={writeStatus}
              setSelected={setWriteStatus}
              placeholder="작성 상태"
            />
          )}
          {viewType === '받은 후기' && (
            <Dropdown
              options={['별점 높은 순', '별점 낮은 순']}
              selected={ratingSort}
              setSelected={setRatingSort}
              placeholder="별점"
            />
          )}
        </div>
      )}

      {viewType ? (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>거래 유형</th>
                  <th>거래 일자</th>
                  {viewType === '내가 남긴 후기' ? <th>작성 상태</th> : <th>별점</th>}
                  <th>후기 상태</th>
                </tr>
              </thead>
              <tbody>
                {(reviewData || []).map((item, i) => (
                  <tr key={item.reviewId || i}>
                    <td>{item.title}</td>
                    <td>{item.type}</td>
                    <td>{item.transactionDate}</td>
                    {viewType === '내가 남긴 후기' ? (
                      <td>{item.isWritten ? '작성됨' : '미작성'}</td>
                    ) : (
                      <td className={styles.starCell}>
                        {Array.from({ length: Math.round(item.star) }).map((_, i) => (
                          <span key={i} className={styles.star}>★</span>
                        ))}
                      </td>
                    )}
                    <td>
                      {viewType === '내가 남긴 후기' ? (
                        item.isWritten ? (
                          <button
                            className={styles.reviewButton}
                            onClick={() => setModalInfo({ open: true, productName: item.title, mode: 'view', received: false })}
                          >후기 보기</button>
                        ) : (
                          <button
                            className={styles.reviewButton}
                            onClick={() => setModalInfo({ open: true, productName: item.title, mode: 'write', received: false })}
                          >후기 작성</button>
                        )
                      ) : (
                        <button
                          className={styles.reviewButton}
                          onClick={() => setModalInfo({ open: true, productName: item.title, mode: 'view', received: true })}
                        >후기 보기</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <button onClick={prevPage} disabled={currentPage === 1} className={styles.arrowButton}>
              <img src={arrowIcon} alt="이전" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={
                  currentPage === i + 1 ? `${styles.pageNumber} ${styles.activePage}` : styles.pageNumber
                }
              >
                {i + 1}
              </button>
            ))}
            <button onClick={nextPage} disabled={currentPage === totalPages} className={`${styles.arrowButton} ${styles.nextArrow}`}>
              <img src={arrowIcon} alt="다음" />
            </button>
          </div>
        </>
      ) : (
        <div className={styles.content}>
          <p className={styles.empty}>“내가 남긴 후기” 또는 “받은 후기”를 선택해주세요.</p>
        </div>
      )}

      {modalInfo.open && (
        <ReviewsModal
          onClose={() => setModalInfo({ open: false, productName: '', mode: 'write', received: false })}
          productName={modalInfo.productName}
          mode={modalInfo.mode}
          received={modalInfo.received}
          savedReview={null}
          onRegister={() => setModalInfo({ open: false, productName: '', mode: 'write', received: false })}
          onDelete={() => setModalInfo({ open: false, productName: '', mode: 'write', received: false })}
        />
      )}
    </div>
  );
}
