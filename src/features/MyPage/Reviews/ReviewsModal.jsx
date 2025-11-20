import React, { useState, useRef, useEffect } from 'react';
import styles from './ReviewsModal.module.css';
import x from '../../../assets/x.svg';
import arrowIcon from '../../../assets/chevron-down-outline.svg';
import clearIcon from '../../../assets/x.svg';
import starOn from '../../../assets/portiony-star-on.svg';
import starOff from '../../../assets/portiony-star-off.svg';

const options = [
  '연락이 빨라요',
  '친절하고 매너가 좋아요.',
  '상품 설명과 같아요',
  '약속 시간에 늦었어요.',
  '상품 설명과 달랐어요',
  '기타(직접 입력)',
];

export default function ReviewsModal({
  onClose,
  productName,
  chatRoomId,   
  reviewId,    
  onRegister,
  onDelete,
  savedReview,
  mode = 'write',
  received = false,
}) {
  const [internalMode, setInternalMode] = useState(mode);
  const [selectedReview, setSelectedReview] = useState('');
  const [customReview, setCustomReview] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    setInternalMode(mode);
  }, [mode]);

  useEffect(() => {
    console.log('ReviewsModal savedReview 변화:', savedReview, 'mode=', internalMode);

    if ((internalMode === 'edit' || internalMode === 'view') && savedReview) {
      const {
        review,
        rating: savedRating,
        star: savedStar,
        choice,
      } = savedReview;

      if (review && review.trim() !== '') {
        if (options.includes(review)) {

          setSelectedReview(review);
          setCustomReview('');
        } else {

          setSelectedReview('기타(직접 입력)');
          setCustomReview(review);
        }
      } else if (
        typeof choice === 'number' &&
        choice >= 0 &&
        choice < options.length - 1
      ) {

        setSelectedReview(options[choice]);
        setCustomReview('');
      } else {
        setSelectedReview('');
        setCustomReview('');
      }

      const finalStar =
        savedRating != null
          ? Number(savedRating)
          : savedStar != null
          ? Number(savedStar)
          : 0;

      console.log('⭐ savedRating / savedStar → finalStar:', {
        savedRating,
        savedStar,
        finalStar,
      });

      if (!Number.isNaN(finalStar)) {
        setRating(finalStar);
      } else {
        setRating(0);
      }
    }

    if (internalMode === 'write' && !savedReview) {
      setSelectedReview('');
      setCustomReview('');
      setRating(0);
    }
  }, [internalMode, savedReview]);

  const isOver = selectedReview === '기타(직접 입력)' && customReview.length > 200;
  const isDisabled =
    !selectedReview ||
    (selectedReview === '기타(직접 입력)' &&
      (customReview.trim().length === 0 || isOver)) ||
    rating === 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelectedReview(option);
    setDropdownOpen(false);
    if (option !== '기타(직접 입력)') setCustomReview('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedReview('');
    setCustomReview('');
    setDropdownOpen(false);
  };

  const handleRatingClick = (index) => {
    if (internalMode === 'view') return;

    const newRating = index + 1;
    if (rating === newRating) {
      setRating(newRating - 1);
    } else {
      setRating(newRating);
    }
  };

  const handleSubmit = () => {
    const isCustom = selectedReview === '기타(직접 입력)';
    const finalReview = isCustom ? customReview.trim() : selectedReview;

    let choiceCode = undefined;
    let content = undefined;

    if (isCustom) {

      content = finalReview;
    } else {

      const idx = options.indexOf(selectedReview);
      if (idx >= 0) {
        choiceCode = idx;
      }
    }

    console.log('handleSubmit chatRoomId vs productName:', {
      chatRoomId,
      productName,
      choiceCode,
      content,
      rating,
    });

    if (onRegister && chatRoomId != null) {
      onRegister(chatRoomId, {
        rating,
        choiceCode,
        content,
      });
    }
  };

  const handleDeleteClick = () => {
    console.log('🗑 handleDeleteClick reviewId:', reviewId);
    if (onDelete && reviewId != null) {
      onDelete(reviewId);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>거래 후기</span>
          <img src={x} alt="닫기" className={styles.closeIcon} onClick={onClose} />
        </div>

        <div className={styles.productName}>{productName}</div>

        <div className={styles.ratingBlock}>
          <div className={styles.ratingInner}>
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < rating ? starOn : starOff}
                alt={`포셔니 별점 ${i + 1}`}
                className={`${styles.starIcon} ${i < rating ? styles.active : ''}`}
                onClick={() => handleRatingClick(i)}
                style={internalMode === 'view' ? { cursor: 'default' } : {}}
              />
            ))}
            <span className={styles.ratingScore}>
              {Number(rating || 0).toFixed(1)}
            </span>
          </div>
          {rating === 0 && (
            <div className={styles.ratingGuide}>
              포셔니를 클릭해 별점을 남겨 주세요
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.dropdownContainer} ref={containerRef}>
            <button
              type="button"
              className={`${styles.dropdownButton} ${dropdownOpen ? styles.open : ''}`}
              onClick={() => {
                if (internalMode !== 'view') setDropdownOpen(!dropdownOpen);
              }}
              disabled={internalMode === 'view'}
              style={
                internalMode === 'view'
                  ? { background: '#f6f6f6', color: '#aaa', cursor: 'default' }
                  : {}
              }
            >
              <span className={!selectedReview ? styles.placeholder : ''}>
                {selectedReview || '후기를 선택해주세요'}
              </span>
              {selectedReview && internalMode !== 'view' ? (
                <img
                  src={clearIcon}
                  alt="clear"
                  className={styles.clearIcon}
                  onClick={handleClear}
                />
              ) : (
                <img
                  src={arrowIcon}
                  alt="arrow"
                  className={`${styles.arrow} ${dropdownOpen ? styles.rotated : ''}`}
                />
              )}
            </button>
            {dropdownOpen && internalMode !== 'view' && (
              <ul className={styles.dropdownMenu}>
                {options.map((opt, i) => (
                  <li
                    key={i}
                    className={styles.menuItem}
                    onClick={() => handleSelect(opt)}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedReview === '기타(직접 입력)' && (
            <div>
              <textarea
                className={`${styles.textarea} ${isOver ? styles.error : ''}`}
                placeholder="200자 이내 작성해주세요."
                value={customReview}
                maxLength={400}
                onChange={(e) => setCustomReview(e.target.value)}
                readOnly={internalMode === 'view'}
                style={
                  internalMode === 'view'
                    ? { background: '#f6f6f6', color: '#aaa', cursor: 'not-allowed' }
                    : {}
                }
              />
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '12px',
                  color: isOver ? '#ff4444' : '#999',
                }}
              >
                {customReview.length} / 200자
              </div>
            </div>
          )}
        </div>

        {!received && internalMode === 'write' && (
          <button
            className={styles.submitButton}
            disabled={isDisabled}
            onClick={handleSubmit}
          >
            거래 후기 등록하기
          </button>
        )}

        {!received && internalMode === 'view' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className={styles.submitButton}
              style={{ background: '#FECD24', color: '#000', flex: 1 }}
              onClick={() => setInternalMode('edit')}
            >
              수정
            </button>
            <button
              className={styles.submitButton}
              style={{
                background: '#fff',
                color: '#000',
                border: '1px solid #ff4444',
                flex: 1,
              }}
              onClick={handleDeleteClick}
            >
              삭제
            </button>
          </div>
        )}

        {!received && internalMode === 'edit' && (
          <button
            className={styles.submitButton}
            disabled={isDisabled}
            onClick={handleSubmit}
          >
            저장하기
          </button>
        )}
      </div>
    </div>
  );
}
