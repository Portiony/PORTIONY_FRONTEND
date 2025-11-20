import React, { useState, useEffect } from 'react';
import styles from './ProfileEditModal.module.css';

import closeIcon from '../../assets/x.svg';
import WithdrawModal from './secessionModal';
import instance from '../../lib/axios';

export default function ProfileEditModal({ open, onClose, currentProfile, onSave }) {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('');

  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [isNicknameAvailable, setIsNicknameAvailable] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchUserInfo = async () => {
        try {
          const res = await instance.get('/api/users/me');
          const data = res.data;

          setNickname(data.nickname || '');
          setEmail(data.email || '');
        } catch (err) {
          console.error('사용자 정보 조회 실패:', err);
        }
      };

      fetchUserInfo();

      setOldPasswordInput('');
      setPassword('');
      setPasswordConfirm('');
      setErrorMsg('');
      setErrorType('');
      setDuplicateChecked(false);
      setIsNicknameAvailable(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();

    const wantsPasswordChange = password || passwordConfirm;

    if (wantsPasswordChange) {
      if (!oldPasswordInput) {
        setErrorMsg('현재 비밀번호를 입력하세요.');
        setErrorType('old');
        return;
      }
      if (password !== passwordConfirm) {
        setErrorMsg('비밀번호가 일치하지 않습니다.');
        setErrorType('confirm');
        return;
      }
    }

    const requestBody = {
      nickname,
    };

    if (wantsPasswordChange) {
      requestBody.currentPassword = oldPasswordInput;
      requestBody.newPassword = password;
    }

    try {
      const res = await instance.patch('/api/users/me', requestBody);
      alert(res.data.message || '프로필이 수정되었습니다.');
      if (password) localStorage.setItem('password', password);
      onSave({ nickname, email });
      onClose();
    } catch (err) {
      const message = err.response?.data?.message;
      const status = err.response?.status;
      if (status === 400) {
        setErrorMsg(message || '현재 비밀번호 오류');
        setErrorType('old');
      } else if (status === 409) {
        alert('이미 사용 중인 닉네임입니다.');
      } else {
        alert('프로필 수정 중 오류 발생');
      }
    }
  };

  const handleCheckNickname = async () => {
    try {
      const response = await instance.get('/api/users/signup/check-nickname', {
        params: { nickname },
      });
      const exists = response.data.exists;
      setDuplicateChecked(true);
      setIsNicknameAvailable(!exists);
    } catch (error) {
      console.error('닉네임 중복 확인 실패:', error);
      alert('닉네임 중복 확인 중 오류 발생');
    }
  };

  const isNicknameChanged =
    nickname !== currentProfile.nickname && nickname.length > 0;

  const getInputClass = field =>
    `${styles.input} ${errorType === field ? styles.errorInput : ''}`;

  const ErrorMsg = ({ field }) =>
    errorType === field && errorMsg ? (
      <div className={styles.errorMsg}>{errorMsg}</div>
    ) : null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.headerRow}>
          <div className={styles.title}>프로필 편집</div>
          <img
            src={closeIcon}
            alt="닫기"
            className={styles.close}
            onClick={onClose}
          />
        </div>

        {/* 프로필 이미지 영역 제거 */}

        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          <label className={styles.label}>
            닉네임
            <div className={styles.nicknameRow}>
              <input
                className={styles.input}
                type="text"
                value={nickname}
                onChange={e => {
                  setNickname(e.target.value);
                  setErrorType('');
                  setErrorMsg('');
                  setDuplicateChecked(false);
                  setIsNicknameAvailable(null);
                }}
                required
              />
              <button
                type="button"
                className={styles.duplicateBtn}
                style={{
                  background: isNicknameChanged ? '#FECD24' : '#F6F6F6',
                  color: isNicknameChanged ? '#000' : '#C0C0C0',
                  border: isNicknameChanged
                    ? '1px solid #FECD24'
                    : '1px solid #ECECEC',
                  cursor: isNicknameChanged ? 'pointer' : 'not-allowed',
                }}
                disabled={!isNicknameChanged}
                onClick={handleCheckNickname}
              >
                중복 확인
              </button>
            </div>
            {duplicateChecked && isNicknameAvailable === true && (
              <div className={styles.successMsg}>사용 가능한 닉네임입니다.</div>
            )}
            {duplicateChecked && isNicknameAvailable === false && (
              <div className={styles.errorMsg}>이미 사용 중인 닉네임입니다.</div>
            )}
          </label>

          <label className={styles.label}>
            아이디
            <input
              className={`${styles.input} ${styles.disabledInput}`}
              type="email"
              value={email}
              readOnly
              tabIndex={-1}
            />
          </label>

          <label className={styles.label}>
            현재 비밀번호
            <input
              className={getInputClass('old')}
              type="password"
              value={oldPasswordInput}
              onChange={e => {
                setOldPasswordInput(e.target.value);
                setErrorType('');
                setErrorMsg('');
              }}
              placeholder="비밀번호 변경 시 입력"
              autoComplete="current-password"
            />
            <ErrorMsg field="old" />
          </label>

          <label className={styles.label}>
            새 비밀번호
            <input
              className={getInputClass('new')}
              type="password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setErrorType('');
                setErrorMsg('');
              }}
              placeholder="비밀번호 변경 안 할 시 비워두기"
              autoComplete="new-password"
            />
            <ErrorMsg field="new" />
          </label>

          <label className={styles.label}>
            새 비밀번호 확인
            <input
              className={getInputClass('confirm')}
              type="password"
              value={passwordConfirm}
              onChange={e => {
                setPasswordConfirm(e.target.value);
                setErrorType('');
                setErrorMsg('');
              }}
              placeholder="비밀번호 다시 입력"
              autoComplete="new-password"
            />
            <ErrorMsg field="confirm" />
          </label>

          <div
            className={styles.withdraw}
            onClick={() => setShowWithdrawModal(true)}
          >
            탈퇴하기
          </div>

          <WithdrawModal
            open={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
          />

          <div className={styles.buttonRow}>
            <button type="submit" className={styles.saveBtn}>
              프로필 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
