// src/features/GroupBuy/GroupBuyDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GroupBuyDetail.module.css";

import GroupBuyModal from "../../components/GroupBuy/GroupBuyModal";
import Pagination from "../../components/PageNumber/Pagination";
import clockIcon from "../../assets/clock-icon.svg";
import axios from "../../lib/axios";

// 댓글 날짜 포맷 함수
function formatKoreanDatetime(datetimeStr) {
  if (!datetimeStr) return "";
  const date = new Date(datetimeStr);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
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
  const { id } = useParams();
  const navigate = useNavigate();

  const [isSeller, setIsSeller] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalType, setModalType] = useState(null);
  const [isGroupBuyModalOpen, setIsGroupBuyModalOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const [comments, setComments] = useState([]);
  const [commentMeta, setCommentMeta] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [input, setInput] = useState("");

  const commentsPerPage = 10;

  const categoryMap = {
    1: "생활용품",
    2: "반려동물",
    3: "의류",
    4: "문구류",
    5: "육아용품",
    6: "화장품/뷰티",
    7: "잡화/기타",
  };

  const deliveryMethodMap = {
    DIRECT: "직거래",
    DELIVERY: "택배 배송",
    ALL: "직거래 + 택배",
  };

  // 초기 상품 + 댓글 가져오기
  useEffect(() => {
    const fetchProductAndComments = async () => {
      try {
        const res = await axios.get(`/api/posts/${id}`);

        setProduct(res.data.post);

        const commentList = res.data.comments?.items?.content;
        setComments(Array.isArray(commentList) ? commentList : []);

        setCommentMeta({
          totalCount: res.data.comments?.totalCount ?? 0,
          totalPages: res.data.comments?.totalPages ?? 1,
          currentPage: res.data.comments?.currentPage ?? 1,
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

  // 공구 상태 반영
  useEffect(() => {
    if (product?.status === "DONE") {
      setIsCompleted(true);
    }
  }, [product]);

  // 내가 판매자인지
  useEffect(() => {
    const currentUserId = localStorage.getItem("user_id");
    if (product && currentUserId) {
      setIsSeller(String(product.sellerId) === String(currentUserId));
    }
  }, [product]);

  // 이미지 모달
  const handleImageClick = (url) => setSelectedImage(url);
  const handleCloseImgModal = () => setSelectedImage(null);

  // 댓글 페이지네이션 + 재조회 공통 함수
const handlePageChange = async (page) => {
  try {
    // ✅ 프론트는 1,2,3... / 서버는 0,1,2... 이라고 가정하고 변환
    const zeroBasedPage = page - 1 < 0 ? 0 : page - 1;

    const res = await axios.get(`/api/posts/${id}/comments`, {
      params: {
        page: zeroBasedPage,
        size: commentsPerPage,
        sort: "createdAt",
        direction: "DESC",
      },
    });

    // 백엔드 응답 형태 대비: items 안에 있거나, 바로 최상단에 있거나 둘 다 커버
    const pageData = res.data.items ?? res.data;
    const content = pageData.content || [];

    setComments(content);

    setCommentMeta({
      totalCount:
        res.data.totalCount ??
        pageData.totalElements ??
        content.length,
      totalPages: pageData.totalPages ?? 1,
      currentPage: (pageData.number ?? zeroBasedPage) + 1, // 다시 1-based로
    });

    setCurrentPage((pageData.number ?? zeroBasedPage) + 1);
  } catch (err) {
    console.error("댓글 페이지네이션 실패", err);
  }
};


  // 댓글 등록: 서버에만 저장 → 이후 1페이지 다시 조회
  const handleSubmit = async () => {
    if (!input.trim()) return;

    try {
      await axios.post(`/api/posts/${id}/comments`, {
        content: input,
      });

      setInput("");
      await handlePageChange(1); // 최신 댓글 포함된 1페이지 다시 불러오기
    } catch (err) {
      console.error("댓글 등록 실패:", err.response?.data || err.message);
      alert("댓글 등록에 실패했습니다.");
    }
  };

  // 마감일 기준 D-day
  const getDDay = (deadline) => {
    if (!deadline) return "";
    const now = new Date();
    const end = new Date(deadline);
    end.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "마감됨";
    if (diff === 0) return "오늘 마감";
    return `D-${diff}`;
  };

  const handleLikeClick = async () => {
    try {
      console.log("현재 liked 상태:", liked);
  
      if (liked) {
        // 찜 해제: body 없이 DELETE만
        await axios.delete(`/api/posts/${id}/like`);
        setLikeCount((prev) => Math.max(prev - 1, 0));
      } else {
        // 찜 하기
        await axios.post(`/api/posts/${id}/like`);
        setLikeCount((prev) => prev + 1);
      }
  
      setLiked((prev) => !prev);
    } catch (err) {
      console.error(
        "찜 처리 실패 ===> ",
        err.response?.status,
        err.response?.data || err.message
      );
      alert("찜 처리 중 오류가 발생했습니다.");
    }
  };
  

  // 채팅하기
  const handleChatStart = async () => {
    try {
      const { data } = await axios.post(`/api/chats/${product.id}/room`);
      navigate("/chat", {
        state: {
          chatRoomId: data.chatRoomId,
        },
      });
    } catch (err) {
      console.error("채팅방 생성 실패:", err);
      alert("채팅을 시작할 수 없습니다.");
    }
  };

  // 로딩/없음 처리
  if (loading) {
    return <div className={styles.page}>로딩 중...</div>;
  }
  if (!product) {
    return <div className={styles.page}>상품 정보를 불러오는 중입니다...</div>;
  }

  const images = Array.isArray(product?.images) ? product.images : [];
  const categoryLabel = categoryMap[Number(product.categoryId)];
  const deliveryLabel = deliveryMethodMap[product.deliveryMethod];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* 상단 뒤로가기 + 타이틀 */}
        <div className={styles.topBar}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <span className={styles.backArrow}>‹</span>
          </button>
          <span className={styles.topTitle}>공동구매 상세</span>
        </div>

        {/* Hero: 이미지 + 상태 뱃지 */}
        <section className={styles.heroSection}>
          <div className={styles.heroImageWrapper}>
            <div className={styles.productImage}>
              {/* 상태 뱃지 (이미지 우상단) */}
              <div
                className={`${styles.statusChip} ${
                  isCompleted ? styles.statusCompleted : ""
                }`}
              >
                {!isCompleted && (
                  <img
                    src={clockIcon}
                    alt="마감"
                    className={styles.statusIcon}
                  />
                )}
                <span>
                  {isCompleted ? "공구 완료" : getDDay(product.deadline)}
                </span>
              </div>

              {images.length > 0 ? (
                <>
                  <button
                    className={styles.arrowButton}
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                      )
                    }
                    aria-label="이전 이미지"
                  >
                    ‹
                  </button>

                  <img
                    src={images[currentImageIndex]}
                    alt={`상품 이미지 ${currentImageIndex + 1}`}
                    onClick={() =>
                      handleImageClick(images[currentImageIndex])
                    }
                  />

                  <button
                    className={`${styles.arrowButton} ${styles.rightArrow}`}
                    onClick={() =>
                      setCurrentImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                      )
                    }
                    aria-label="다음 이미지"
                  >
                    ›
                  </button>

                  <div className={styles.imageDots}>
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`${styles.dot} ${
                          idx === currentImageIndex ? styles.activeDot : ""
                        }`}
                        onClick={() => setCurrentImageIndex(idx)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.noImage}>등록된 이미지가 없어요</p>
              )}
            </div>
          </div>
        </section>

        {/* 메인 정보 */}
        <section className={styles.mainInfoSection}>
          <div className={styles.titleBlock}>
            <h1 className={styles.productTitle}>{product.title}</h1>
            <p className={styles.price}>
              {Number(product.price).toLocaleString()}원
            </p>
          </div>

          <div className={styles.metaChipsRow}>
            {categoryLabel && (
              <span className={styles.metaChip}>{categoryLabel}</span>
            )}
            {deliveryLabel && (
              <span className={styles.metaChip}>{deliveryLabel}</span>
            )}
            {product.deadline && (
              <span className={styles.metaChipSecondary}>
                {product.deadline.substring(0, 10)} 마감
              </span>
            )}
          </div>

          <dl className={styles.infoList}>
            <div className={styles.infoRow}>
              <dt>거래 위치</dt>
              <dd>{product.location}</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>1인당 소분량</dt>
              <dd>
                {product.unitAmount} {product.unit}
              </dd>
            </div>
            <div className={styles.infoRow}>
              <dt>모집 / 완료</dt>
              <dd>{product.capacity}명 · 1명</dd>
            </div>
            <div className={styles.infoRow}>
              <dt>작성일</dt>
              <dd>{product.createdAt?.substring(0, 10)}</dd>
            </div>
          </dl>
        </section>

        {/* 판매자 */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderRow}>
            <p className={styles.sectionTitle}>판매자 정보</p>
          </div>
          <div className={styles.sellerRow}>
            <div className={styles.initialBadge}>
              {product.seller?.nickname?.[0] || "익"}
            </div>
            <div className={styles.sellerTextBox}>
              <p className={styles.sellerName}>
                {product.seller?.nickname || "알 수 없음"}
              </p>
              <p className={styles.sellerStats}>
                누적 거래{" "}
                {(
                  (product.seller?.saleCount ?? 0) +
                  (product.seller?.purchaseCount ?? 0)
                ).toLocaleString()}
                회 · 구매 {product.seller?.purchaseCount ?? 0}회 · 판매{" "}
                {product.seller?.saleCount ?? 0}회
              </p>
            </div>
          </div>
        </section>

        {/* 상품 설명 */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderRow}>
            <p className={styles.sectionTitle}>상품 설명</p>
          </div>
          <p className={styles.descriptionText}>{product.description}</p>
        </section>

        {/* 액션 영역 : 상품 설명 아래에 위치 */}
        {(isSeller || !isCompleted) && (
          <section className={`${styles.sectionCard} ${styles.actionSection}`}>
            {isSeller ? (
              isCompleted ? (
                <div className={styles.sellerButtonRow}>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      setModalType("reopen");
                      setIsGroupBuyModalOpen(true);
                    }}
                  >
                    공구 재개하기
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setModalType("delete");
                      setIsGroupBuyModalOpen(true);
                    }}
                  >
                    삭제
                  </button>
                </div>
              ) : (
                <div className={styles.sellerButtonRow}>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setModalType("edit");
                      setIsGroupBuyModalOpen(true);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setModalType("delete");
                      setIsGroupBuyModalOpen(true);
                    }}
                  >
                    삭제
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={() => {
                      setModalType("complete");
                      setIsGroupBuyModalOpen(true);
                    }}
                  >
                    공구 완료 처리
                  </button>
                </div>
              )
            ) : (
              !isCompleted && (
                <div className={styles.buyerButtonRow}>
                  <button
                    className={`${styles.likeCircle} ${
                      liked ? styles.likeCircleActive : ""
                    }`}
                    onClick={handleLikeClick}
                  >
                    <span className={styles.likeHeart}>❤</span>
                    {likeCount > 0 && (
                      <span className={styles.likeCount}>{likeCount}</span>
                    )}
                  </button>
                  <button
                    className={styles.primaryButton}
                    onClick={handleChatStart}
                  >
                    판매자와 채팅하기
                  </button>
                </div>
              )
            )}
          </section>
        )}

        {/* 댓글 */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeaderRow}>
            <p className={styles.sectionTitle}>
              댓글{" "}
              <span className={styles.commentCount}>
                {commentMeta.totalCount}
              </span>
            </p>
          </div>

          <div className={styles.commentInputWrapper}>
            <input
              type="text"
              placeholder="댓글을 남겨보세요."
              className={styles.commentInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button className={styles.commentSubmit} onClick={handleSubmit}>
              등록
            </button>
          </div>

          <ul className={styles.commentList}>
            {Array.isArray(comments) &&
              comments.map((comment) => (
                <li
                  key={comment.commentId || comment.id}
                  className={styles.commentItem}
                >
                  <div className={styles.commentHeader}>
                    <span className={styles.commentNickname}>
                      {comment.commentUser?.nickname || "알 수 없음"}
                    </span>
                    <span className={styles.commentDatetime}>
                      {formatKoreanDatetime(comment.createdAt)}
                    </span>
                  </div>
                  <p className={styles.commentText}>{comment.content}</p>
                </li>
              ))}
          </ul>

          <Pagination
            totalPages={commentMeta.totalPages}
            currentPage={commentMeta.currentPage}
            onPageChange={handlePageChange}
          />
        </section>
      </div>

      {/* 모달 */}
      {isGroupBuyModalOpen && (
        <GroupBuyModal
          message={
            modalType === "delete"
              ? "글을 삭제하시겠습니까?"
              : modalType === "complete"
              ? "글을 공구완료 처리하시겠습니까?"
              : modalType === "reopen"
              ? "공구를 재개시하시겠습니까?"
              : modalType === "edit"
              ? "글을 수정하시겠습니까?"
              : ""
          }
          confirmText={
            modalType === "delete"
              ? "삭제하기"
              : modalType === "complete"
              ? "완료하기"
              : modalType === "reopen"
              ? "재개시"
              : modalType === "edit"
              ? "수정하기"
              : ""
          }
          cancelText="취소"
          onConfirm={async () => {
            try {
              if (modalType === "delete") {
                await axios.delete(`/api/posts/${id}`);
                navigate("/");
              } else if (modalType === "complete") {
                await axios.patch(`/api/posts/${id}/status`, {
                  status: "DONE",
                });
                setIsCompleted(true);
              } else if (modalType === "reopen") {
                await axios.patch(`/api/posts/${id}/status`, {
                  status: "PROGRESS",
                });
                setIsCompleted(false);
              } else if (modalType === "edit") {
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

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className={styles.imageModalOverlay}
          onClick={handleCloseImgModal}
        >
          <div
            className={styles.imageModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={handleCloseImgModal}
            >
              ✕
            </button>
            <img src={selectedImage} alt="확대 이미지" />
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupBuyDetail;
