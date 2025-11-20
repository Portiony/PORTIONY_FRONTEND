import React from 'react';
import styles from './GroupBuyModal.module.css';
import modalIcon from '../../assets/modal-icon.svg';

function GroupBuyModal({ message, confirmText, cancelText, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <img src={modalIcon} alt="알림" className={styles.icon} />
        <p className={styles.message}>{message}</p>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={`${styles.button} ${styles.cancel}`}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.button} ${styles.confirm}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroupBuyModal;
