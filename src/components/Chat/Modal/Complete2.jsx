// components/Chat/Modal/Complete2.jsx
import React from 'react';
import styles from './Complete2.module.css';
import doneIcon from '../../../assets/complete.svg';

function Complete2Modal({ onClose, onReview, onHome }) {
  const handleOverlayClick = () => {
    onClose?.();
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleReview = () => {
    onReview?.();
  };

  const handleHome = () => {
    onHome?.();
  };

  return (
    <div className={styles.backdrop} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={stopPropagation}>
        <img src={doneIcon} alt="거래 완료" className={styles.icon} />

        <p className={styles.title}>거래가 완료되었어요! 🎉</p>
        <p className={styles.subtitle}>
          후기를 남기고, 이웃과의 다음 공구도 준비해 볼까요?
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={handleReview}
          >
            후기 작성하기
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleHome}
          >
            홈으로 가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default Complete2Modal;
