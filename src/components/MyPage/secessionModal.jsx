import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './secessionModal.module.css';
import warningIcon from '../../assets/alert-triangle.svg';
import instance from '../../lib/axios';

export default function WithdrawModal({ open, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const handleWithdraw = async () => {
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const response = await instance.delete('/api/users/me', {
        data: { password },
      });

      alert(response.data.message); 
      localStorage.clear();
      navigate('/login');
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 400) {
        setError('비밀번호가 일치하지 않습니다.');
      } else {
        setError('탈퇴 요청 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.headerArea}>
          <img
            src={warningIcon}
            alt="경고"
            className={styles.icon}
          />
          <div className={styles.title}>정말 탈퇴하시겠습니까?</div>
          <div className={styles.desc}>
            탈퇴 시 1개월간 재가입이 불가능합니다.
          </div>
        </div>

        <input
          className={styles.input}
          type="password"
          placeholder="비밀번호를 입력해주세요"
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError('');
          }}
        />
        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.buttonRow}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            type="button"
            disabled={loading}
          >
            취소하기
          </button>
          <button
            className={styles.continueBtn}
            onClick={handleWithdraw}
            type="button"
            disabled={loading}
          >
            탈퇴하기
          </button>
        </div>
      </div>
    </div>
  );
}
