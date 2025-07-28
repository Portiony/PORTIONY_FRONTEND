import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from './GroupBuyDetail.module.css';

import HomeHeader from '../../components/Home/HomeHeader';
import LocationModal from '../../components/Home/LocationModal';
import GroupBuyModal from '../../components/GroupBuy/GroupBuyModal';
import Pagination from '../../components/PageNumber/Pagination';
import sellerProfile from "../../assets/seller-profile.svg";
import clockIcon from "../../assets/clock-icon.svg";
import chevronLeft from "../../assets/chevron-left.svg";
import backIcon from "../../assets/back-icon-white.svg";
import axios from '../../lib/axios';

// 댓글 날짜 포맷 함수
function formatKoreanDatetime(datetimeStr) {
  const date = new Date(datetimeStr);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const isAM = hours < 12;
  const ampm = isAM ? "오전" : "오후";

  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return `${yyyy}-${mm}-${dd} ${ampm} ${hours}:${minutes}`;
}

function GroupBuyDetail() {
  // 판매자이면 true, 구매자이면 false
  const [isSeller, setIsSeller] = useState(null);

  // 공구완료면 true, 공구중이면 false
  const [isCompleted, setIsCompleted] = useState(false);

  // URL 파라미터에서 상품 ID 추출
  const { id } = useParams(); // URL에서 postId 추출
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 지역 선택 모달 상태 (Header 관련)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('서울특별시 중랑구 망우본동');

  const handleSelectDong = (address) => {
    setSelectedAddress(address);
    setIsLocationModalOpen(false);
  };

  const categoryMap = {
      "1": '생활용품',
      "2": '반려동물',
      "3": '의류',
      "4": '문구류',
      "5": '육아용품',
      "6": '화장품/뷰티',
      "7": '잡화/기타'
    };

    const deliveryMethodMap = {
      DIRECT: "직거래",
      DELIVERY: "택배 배송",
      ALL: "직거래 및 택배 배송",
    };

    const postStatusMap = {
      PROGRESS: '공구 중',
      DONE: '공구 완료',
      CANCELLED: '취소됨'
    };


  useEffect(() => {
    if (product?.status === 'DONE') {
      setIsCompleted(true);
    }
  }, [product]);

  useEffect(() => {
    const currentUserId = localStorage.getItem("user_id");

    if (product && currentUserId) {
      setIsSeller(String(product.sellerId) === String(currentUserId));
    }
  }, [product]);

  useEffect(() => {
    const fetchProductAndComments = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);
        console.log("응답 확인:", res.data);

        setProduct(res.data.post);

        // 🔥 핵심 수정 포인트
        const commentList = res.data.comments?.items?.content;
        setComments(Array.isArray(commentList) ? commentList : []);

        setCommentMeta({
          totalCount: res.data.comments?.totalCount ?? 0,
          totalPages: res.data.comments?.totalPages ?? 1,
          currentPage: res.data.comments?.currentPage ?? 1
        });

        setLikeCount(res.data.post.likes ?? 0);
        setLiked(res.data.post.likedByMe ?? false);
      } catch (err) {
        console.error("게시글 상세 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndComments();
  }, [id]);

  // 모달 종류 (예: 좋아요, 삭제, 공유 등 다양한 모달 구분)
  const [modalType, setModalType] = useState(null);

  // 좋아요 상태
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 모달 열림 상태
  const [isGroupBuyModalOpen, setIsGroupBuyModalOpen] = useState(false);

  // 이미지 슬라이드 현재 인덱스
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 이미지 클릭된 상태
  const [selectedImage, setSelectedImage] = useState(null);
  const handleImageClick = (url) => {
    setSelectedImage(url);
  };
  const handleCloseImgModal = () => {
    setSelectedImage(null);
  };
  const hasImages = Array.isArray(product?.images) && product.images.length > 0;

  const [comments, setComments] = useState([]);
  const [commentMeta, setCommentMeta] = useState({ totalCount: 0, totalPages: 0, currentPage: 0 });


  // 댓글 페이지네이션 관련 상태 및 변수
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 10;                          // 페이지당 댓글 개수
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  // 현재 페이지에 보여줄 댓글 범위 계산
  const indexOfLast = currentPage * commentsPerPage;
  const indexOfFirst = indexOfLast - commentsPerPage;
  //const currentComments = comments.slice(indexOfFirst, indexOfLast);

  const handlePageChange = async (page) => {
    try {
      const res = await axios.get(`/api/posts/${id}/comments`, {
        params: {
          page,
          size: 10,
          sort: 'createdAt',
          direction: 'DESC'
        }
      });

      const content = res.data.items?.content || [];

      setComments(content);  // 목록 재세팅
      setCommentMeta({
        totalCount: res.data.totalCount ?? 0,
        totalPages: res.data.items?.totalPages ?? 1,
        currentPage: res.data.items?.number + 1 ?? page,
      });
      setCurrentPage(page);  // 상태 일치

    } catch (err) {
      console.error("댓글 페이지네이션 실패", err);
    }
  };


  // 댓글 입력창 상태
  const [input, setInput] = useState("");

  // 라우터 네비게이션 훅
  const navigate = useNavigate();

  // 이미지 슬라이드에서 특정 인덱스 클릭시 현재 이미지 인덱스 변경
  const handleDotClick = (index) => {
    setCurrentImageIndex(index);
  };

  // 마감일 기준 D-day 계산 함수
  const getDDay = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    // 날짜만 비교하기 위해 시간 초기화
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `D-${diff}` : "마감";
  };

  // 좋아요 버튼 클릭 처리 함수
  const handleLikeClick = async () => {
    try {
      if (liked) {
        await axios.delete(`/api/posts/${id}/like`, {
          data: { liked: false } // DELETE일 때도 body 넣어야 하면 data 키로 전달
        });
        setLikeCount((prev) => prev - 1);
      } else {
        await axios.post(`/api/posts/${id}/like`);
        setLikeCount((prev) => prev + 1);
      }

      setLiked((prev) => !prev);
    } catch (err) {
      console.error("찜 처리 실패", err);
    }
  };

  const [commentsKey, setCommentsKey] = useState(0);

  //채팅하기 버튼
  const handleChatStart = async () => {
    try {
      const { data } = await axios.post(`/api/chats/${product.id}/room`);
      navigate('/chat',{
        state: {
          chatRoomId: data.chatRoomId
        }
      });
    } catch (err) {
      console.error("채팅방 생성 실패:", err);
      alert("채팅을 시작할 수 없습니다.");
    }
  };


  const handleSubmit = async () => {
    if (!input.trim()) return;

    try {
      const res = await axios.post(`/api/posts/${id}/comments`, { content: input });
      console.log("댓글 응답 데이터:", res.data); // 🔍 여기에 commentUser 있나 확인

      const newComment = res.data;

      // 현재 로그인한 댓글 쓴 유저 정보 가져오기
      const currentUser = {
        nickname: localStorage.getItem("nickname") || "알 수 없음",
        profileImage: localStorage.getItem("profileImage") || sellerProfile
      };

      newComment.commentUser = currentUser;

      setInput("");

      setComments(prev => [newComment, ...prev]);

      setCommentMeta(prev => ({
        ...prev,
        totalCount: prev.totalCount + 1,
      }));

      setCurrentPage(1);

    } catch (err) {
      console.error("댓글 등록 실패:", err.response?.data || err.message);
      alert("댓글 등록에 실패했습니다.");
    }
  };



  // 에러 메시지 렌더링
  if (loading) {
    return <div className={styles['group-buy-detail-page']}>로딩 중...</div>;
  }
  if (!product) {
    return <div className={styles['group-buy-detail-page']}>상품 정보를 불러오는 중입니다...</div>;
  }
  const images = Array.isArray(product?.images) ? product.images : [];

  return (
    <div className={styles['group-buy-detail-page']}>
      <HomeHeader
        onLocationClick={() => setIsLocationModalOpen(true)}
        selectedAddress={selectedAddress}
      />

      <LocationModal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectAddress={handleSelectDong}
      />

      <div className={styles['page-background']}>
        <div className={`${styles['white-box']} ${styles['first-box']}`}>
          <div className={styles['product-wrapper']}>

            <div className={styles['product-image']}>
              {images.length > 0 ? (
                <>
                  <button
                    className={styles['arrow-button']}
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? product.images.length - 1 : prev - 1
                      )
                    }
                    aria-label="이전 이미지"
                  >
                    <img src={backIcon} alt="이전" />
                  </button>

                  <img
                    src={images[currentImageIndex]}
                    alt={`상품 이미지 ${currentImageIndex + 1}`}
                    onClick={() => handleImageClick(product.images[currentImageIndex])}
                  />

                  <button
                    className={`${styles['arrow-button']} ${styles['right-arrow']}`}
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === product.images.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="다음 이미지"
                  >
                    <img src={backIcon} alt="다음" />
                  </button>

                  <div className={styles['image-dots']}>
                    {Array.isArray(product?.images) && product.images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`${styles.dot} ${
                          idx === currentImageIndex ? styles.active : ''
                        }`}
                        onClick={() => handleDotClick(idx)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles['no-image']}>이미지가 없습니다.</p>
              )}
            </div>

            <div className={styles['product-info']}>
              <div className={`${styles['status']} ${isCompleted ? styles['completed'] : ''}`}>
                {!isCompleted && <img src={clockIcon} alt="상태 아이콘" className={styles['status-icon']} />}
                {isCompleted ? "공구완료" : `마감 ${getDDay(product.deadline)}`}
              </div>
              <h1 className={styles['product-title']}>{product.title}</h1>
              <div className={styles['price']}>{Number(product.price).toLocaleString()}원</div>
              <dl className={styles['detail-list']}>
                <div className={styles['detail-row']}>
                  <dt>카테고리</dt>
                  <dd>{categoryMap[Number(product.categoryId)] || '알 수 없음'}</dd>
                </div>
                <div className={styles['detail-row']}>
                  <dt>1인당 소분량</dt>
                  <dd>{product.unitAmount} {product.unit}</dd>
                </div>
                <div className={styles['detail-row']}>
                  <dt>모집 · 거래 완료</dt>
                  <dd>{product.capacity}명 · 1명</dd> {/* TODO: 참여인원 필드 추가 시 교체 */}
                </div>
                <div className={styles['detail-row']}>
                  <dt>거래 방법</dt>
                  <dd>{deliveryMethodMap[product.deliveryMethod] || '알 수 없음'}</dd>
                </div>
                <div className={styles['detail-row']}>
                  <dt>거래 위치</dt>
                  <dd>{product.location}</dd>
                </div>
                <div className={styles['detail-row']}>
                  <dt>마감일</dt>
                  <dd>{product.deadline?.substring(0, 10)}</dd>
                </div>
                <div className={styles['detail-row']}>
                  <dt>작성일</dt>
                  <dd>{product.createdAt?.substring(0, 10)}</dd>
                </div>
              </dl>
              <div className={styles['seller-section']}>
                <p className={styles['section-title']}>판매자 정보</p>
                <hr className={styles['divider']} />
                <div className={styles['seller-box']}>
                  <img
                    src={product.seller?.profileImage || sellerProfile}
                    alt={product.seller?.nickname || '판매자'}
                  />
                  <div className={styles['seller-info']}>
                    <p className={styles['name']}>
                      {product.seller?.nickname || "알 수 없음"}
                    </p>
                    <p className={styles['stats']}>
                      누적 거래 횟수: {(product.seller?.saleCount ?? 0) + (product.seller?.purchaseCount ?? 0)}회
                      (구매 {product.seller?.purchaseCount ?? 0}회 / 판매 {product.seller?.saleCount ?? 0}회)
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles['gbd-buttons']}>
                {isSeller ? (
                  isCompleted ? (
                    <>
                      <button className={styles['gbd-btn-delete']} onClick={() => { setModalType("delete"); setIsGroupBuyModalOpen(true); }}>삭제하기</button>
                      <button className={styles['gbd-btn-reopen']} onClick={() => { setModalType("reopen"); setIsGroupBuyModalOpen(true); }}>재개시하기</button>
                    </>
                  ) : (
                    <>
                      <button className={styles['gbd-btn-edit']} onClick={() => { setModalType("edit"); setIsGroupBuyModalOpen(true); }}>수정하기</button>
                      <button className={styles['gbd-btn-delete']} onClick={() => { setModalType("delete"); setIsGroupBuyModalOpen(true); }}>삭제하기</button>
                      <button className={styles['gbd-btn-complete']} onClick={() => { setModalType("complete"); setIsGroupBuyModalOpen(true); }}>공구완료</button>
                    </>
                  )
                ) : (
                  // 구매자 버튼
                  !isCompleted && (
                    <>
                      <button
                        className={`${styles['gbd-btn-like']} ${liked ? styles.liked : ''}`}
                        onClick={handleLikeClick}
                      >
                        {liked ? (
                          <>
                            <span className={styles['heart-icon']}>❤ </span> {likeCount}
                          </>
                        ) : (
                          "❤ 찜하기"
                        )}
                      </button>
                      <button className={styles['gbd-btn-chat']} onClick={handleChatStart}>채팅하기</button>
                    </>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 상품 정보(설명) */}
          <div className={styles['description-section']}>
            <p className={styles['section-title']}>상품 정보</p>
            <hr className={styles['divider']} />
            <p>
              {product.description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </p>
          </div>
        </div>

        {/* 모달창 */}
        {isGroupBuyModalOpen && (
          <GroupBuyModal
            message={
              modalType === 'delete'
                ? '글을 삭제하시겠습니까?'
                : modalType === 'complete'
                ? '글을 공구완료 처리하시겠습니까?'
                : modalType === 'reopen'
                ? '공구를 재개시하시겠습니까?'
                : modalType === 'edit'
                ? '글을 수정하시겠습니까?'
                : ''
            }
            confirmText={
              modalType === 'delete'
                ? '삭제하기'
                : modalType === 'complete'
                ? '완료하기'
                : modalType === 'reopen'
                ? '재개시'
                : modalType === 'edit'
                ? '수정하기'
                : ''
            }
            cancelText="취소"
            onConfirm={async () => {
              try {
                if (modalType === 'delete') {
                  await axios.delete(`/api/posts/${id}`);
                  navigate('/');
                } else if (modalType === 'complete') {
                  await axios.patch(`/api/posts/${id}/status`, {
                    status: 'DONE'
                  });
                  setIsCompleted(true);
                } else if (modalType === 'reopen') {
                  await axios.patch(`/api/posts/${id}/status`, {
                    status: 'PROGRESS'
                  });
                  setIsCompleted(false);
                } else if (modalType === 'edit') {
                  navigate(`/group-buy/${id}/edit`);
                }
              } catch (err) {
                console.error("모달 처리 중 오류", err);
              } finally {
                setIsGroupBuyModalOpen(false);
              }
            }}
            onCancel={() => setIsGroupBuyModalOpen(false)}
          />
        )}


        {selectedImage && (
          <div className={styles['image-modal-overlay']} onClick={handleCloseImgModal}>
            <div
              className={styles['image-modal']}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles['close-button']}
                onClick={handleCloseImgModal}
              >
                ✕
              </button>
              <img src={selectedImage} alt="확대 이미지" />
            </div>
          </div>
        )}

        {/* 댓글 영역 */}
        <div className={`${styles['white-box']} ${styles['second-box']}`}>
          <div className={styles['comment-section']}>
            <h2 className={styles['comment-title']}>
              댓글 <span className={styles['comment-count']}>{commentMeta.totalCount}</span>
            </h2>

            <div className={styles['comment-input-wrapper']}>
              <input
                type="text"
                placeholder="댓글을 작성해주세요."
                className={styles['comment-input']}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button className={styles['comment-submit']} onClick={handleSubmit}>
                등록
              </button>
            </div>

            <ul className={styles['comment-list']}>
              {Array.isArray(comments) && comments.map((comment) => (
                <li key={comment.commentId || comment.id} className={styles['comment-item']}>
                  {comment.commentUser ? (
                    <img
                      src={comment.commentUser.profileImage}
                      alt={comment.commentUser.nickname}
                      className={styles['comment-profile']}
                    />
                  ) : (
                    <img
                      src={sellerProfile}
                      alt="알 수 없음"
                      className={styles['comment-profile']}
                    />
                  )}
                  <div className={styles['comment-content']}>
                    <div className={styles['comment-header']}>
                      <span className={styles['comment-nickname']}>
                        {comment.commentUser?.nickname || "알 수 없음"}
                      </span>
                      <span className={styles['comment-datetime']}>
                        {formatKoreanDatetime(comment.createdAt)}
                      </span>
                    </div>
                    <p className={styles['comment-text']}>{comment.content}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Pagination
              totalPages={commentMeta.totalPages}
              currentPage={commentMeta.currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default GroupBuyDetail;