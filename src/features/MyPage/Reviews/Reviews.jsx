import React, { useState, useEffect } from 'react';
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

  const [modalInfo, setModalInfo] = useState({
    open: false,
    productName: '',
    mode: 'write',
    received: false,
    chatRoomId: null,
    reviewId: null,
    savedReview: null,
  });

  const [refreshKey, setRefreshKey] = useState(0); 

  const perPage = 9;
  const userId = Number(localStorage.getItem('user_id'));


  useEffect(() => {
    if (!viewType) return;
    setCurrentPage(1);
    setTransactionType('거래 유형');
    setDateSort('거래 일자');
    setWriteStatus('작성 상태');
    setRatingSort('별점');
  }, [viewType]);

  useEffect(() => {
    if (!viewType || !userId) return;

    const fetchReviews = async () => {
      const params = {
        page: currentPage,
        size: perPage,
      };

      if (transactionType === '구매 후기') {
        params.type = 'purchase';
      } else if (transactionType === '판매 후기') {
        params.type = 'sales';
      }

      if (dateSort === '최신 순') {
        params.sort = 'recent';
      } else if (dateSort === '오래된 순') {
        params.sort = 'oldest';
      }

      if (viewType === '내가 남긴 후기') {
        if (writeStatus === '작성됨') {
          params.status = 'written';
        } else if (writeStatus === '미작성') {
          params.status = 'not_written';
        }
      }

      if (viewType === '받은 후기') {
        if (ratingSort === '별점 높은 순') {
          params.starSort = 'high';
        } else if (ratingSort === '별점 낮은 순') {
          params.starSort = 'low';
        }
      }

      try {
        let response;
        if (viewType === '내가 남긴 후기') {
          response = await instance.get('/api/users/me/reviews', { params });
        } else {
          response = await instance.get(`/api/users/reviews/${userId}`, { params });
        }

        console.log('리뷰 리스트 응답:', response.data);

        const { total = 0, post, reviews } = response.data;
        const list = post || reviews || [];

        setReviewData(list);
        setTotalCount(total || list.length);
      } catch (error) {
        console.error('리뷰 불러오기 실패:', error);
      }
    };

    fetchReviews();
  }, [
    viewType,
    transactionType,
    dateSort,
    writeStatus,
    ratingSort,
    currentPage,
    userId,
    refreshKey,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  const handleRegisterReview = async (chatRoomId, { rating, choiceCode, content }) => {
    try {
      console.log('handleRegisterReview 인자:', chatRoomId, typeof chatRoomId, {
        rating,
        choiceCode,
        content,
      });

      if (chatRoomId == null) {
        console.error('chatRoomId가 없습니다.', chatRoomId);
        return;
      }

      const parsedChatRoomId =
        typeof chatRoomId === 'string' ? Number(chatRoomId) : chatRoomId;

      if (Number.isNaN(parsedChatRoomId)) {
        console.error('chatRoomId가 숫자가 아닙니다:', chatRoomId);
        return;
      }

      const body = { star: rating };

      if (typeof choiceCode === 'number') {
        body.choice = choiceCode; 
      }

      if (content && content.trim() !== '') {
        body.content = content.trim();
      }

      console.log('후기 등록 요청:', parsedChatRoomId, body);

      const res = await instance.post(
        `/api/users/me/reviews/${parsedChatRoomId}`,
        body,
      );

      console.log('후기 등록 성공:', res.data);

      setModalInfo({
        open: false,
        productName: '',
        mode: 'write',
        received: false,
        chatRoomId: null,
        reviewId: null,
        savedReview: null,
      });
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('후기 등록 실패:', error?.response?.data || error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      console.log('후기 삭제 요청 reviewId:', reviewId);

      if (reviewId == null) {
        console.error('reviewId가 없습니다.', reviewId);
        return;
      }

      const parsedReviewId =
        typeof reviewId === 'string' ? Number(reviewId) : reviewId;

      if (Number.isNaN(parsedReviewId)) {
        console.error('reviewId가 숫자가 아닙니다:', reviewId);
        return;
      }

      await instance.delete(`/api/users/me/reviews/${parsedReviewId}`);

      console.log('후기 삭제 성공');

      setModalInfo({
        open: false,
        productName: '',
        mode: 'write',
        received: false,
        chatRoomId: null,
        reviewId: null,
        savedReview: null,
      });
      setRefreshKey(k => k + 1);
    } catch (error) {
      console.error('후기 삭제 실패:', error?.response?.data || error);
    }
  };

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
                        {Array.from({ length: Math.round(item.star || 0) }).map((_, idx) => (
                          <span key={idx} className={styles.star}>★</span>
                        ))}
                      </td>
                    )}

                    <td>
                      {viewType === '내가 남긴 후기' ? (
                        item.isWritten ? (
                          <button
                            className={styles.reviewButton}
                            onClick={() => {
                              console.log('💬 보기 버튼 row item:', item);
                              setModalInfo({
                                open: true,
                                productName: item.title,
                                mode: 'view',
                                received: false,
                                chatRoomId: item.chatRoomId, 
                                reviewId: item.reviewId,   
                                savedReview: {
                                  review: item.content,
                                  rating: item.star,
                                  star: item.star,
                                  choice: item.choice,
                                },
                              });
                            }}
                          >
                            후기 보기
                          </button>
                        ) : (
                          <button
                            className={styles.reviewButton}
                            onClick={() => {
                              console.log('✏️ 작성 버튼 row item:', item);
                              setModalInfo({
                                open: true,
                                productName: item.title,
                                mode: 'write',
                                received: false,
                                chatRoomId: item.chatRoomId, 
                                reviewId: null,
                                savedReview: null,
                              });
                            }}
                          >
                            후기 작성
                          </button>
                        )
                      ) : (
                        <button
                          className={styles.reviewButton}
                          onClick={() => {
                            console.log('⭐ 받은 후기 row item:', item);
                            setModalInfo({
                              open: true,
                              productName: item.title,
                              mode: 'view',
                              received: true,        
                              chatRoomId: item.chatRoomId,
                              reviewId: item.reviewId,
                              savedReview: {
                                review: item.content,
                                rating: item.star,
                                star: item.star,
                                choice: item.choice,
                              },
                            });
                          }}
                        >
                          후기 보기
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={styles.arrowButton}
            >
              <img src={arrowIcon} alt="이전" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={
                  currentPage === i + 1
                    ? `${styles.pageNumber} ${styles.activePage}`
                    : styles.pageNumber
                }
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`${styles.arrowButton} ${styles.nextArrow}`}
            >
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
          onClose={() =>
            setModalInfo({
              open: false,
              productName: '',
              mode: 'write',
              received: false,
              chatRoomId: null,
              reviewId: null,
              savedReview: null,
            })
          }
          productName={modalInfo.productName}
          mode={modalInfo.mode}
          received={modalInfo.received}
          chatRoomId={modalInfo.chatRoomId}   
          reviewId={modalInfo.reviewId}      
          savedReview={modalInfo.savedReview}
          onRegister={handleRegisterReview}
          onDelete={handleDeleteReview}
        />
      )}
    </div>
  );
}
