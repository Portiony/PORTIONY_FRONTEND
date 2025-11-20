import React, { useState, useEffect } from 'react';
import styles from './MyPageHeader.module.css';
import ProfileEditModal from './ProfileEditModal';
import axios from '../../lib/axios';

function MyPageHeader() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get('/api/users/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        setNickname(data.nickname || '');
        setEmail(data.email || '');
        setPurchasesCount(data.purchaseCount || 0);
        setSalesCount(data.salesCount || 0);
      } catch (error) {
        console.error('❌ 유저 정보 불러오기 실패:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = ({ nickname, email }) => {
    setNickname(nickname);
    setEmail(email);
    localStorage.setItem('nickname', nickname);
    localStorage.setItem('email', email);
  };

  return (
    <>
      <div className={styles.wrapper}>
        {/* 상단 프로필 영역 (이미지 없이 텍스트만) */}
        <div className={styles.topRow}>
          <div className={styles.profileArea}>
            <div className={styles.infoBox}>
              <p className={styles.name}>{nickname}</p>
              <p className={styles.email}>{email}</p>
              {/* 누적 거래 문구 제거됨 */}
            </div>
          </div>
          <button className={styles.editBtn} onClick={() => setModalOpen(true)}>
            프로필 편집
          </button>
        </div>

        {/* 하단 지표 카드 영역 (구매 / 판매만) */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>구매</span>
            <span className={styles.statValue}>{purchasesCount}회</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>판매</span>
            <span className={styles.statValue}>{salesCount}회</span>
          </div>
        </div>
      </div>

      <ProfileEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentProfile={{
          nickname,
          email,
        }}
        onSave={handleSaveProfile}
      />
    </>
  );
}

export default MyPageHeader;
