import React from 'react';
import styles from './Complete.module.css';
import modalIcon from '../../../assets/modal-icon.svg';

function CompleteModal({ onConfirm, onCancel }) {
  const handleOverlayClick = () => {
    onCancel?.();
  };

  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.backdrop} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={stopPropagation}>
        <img src={modalIcon} alt="거래 완료 아이콘" className={styles.icon} />

        <p className={styles.title}>정말 거래를 완료할까요?</p>
        <p className={styles.subtitle}>
          거래 완료 후에는 채팅에서 상태를 되돌릴 수 없어요.
        </p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.button} ${styles.secondary}`}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={onConfirm}
          >
            거래완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompleteModal;
