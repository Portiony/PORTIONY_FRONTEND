import React, { useState, useRef, useEffect } from 'react';
import styles from './MyPageHeader.module.css';
import profileDefault from '../../assets/Ellipse 23.png';
import questionIcon from '../../assets/question-icon.svg';
import ProfileEditModal from './ProfileEditModal';
import axios from '../../lib/axios';

function MyPageHeader() {
  const [nickname, setNickname] = useState(''); 
  const [email, setEmail] = useState('');
  const [profileImg, setProfileImg] = useState(null); 
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [potionyPercent, setPotionyPercent] = useState(0);

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef();
  const [modalOpen, setModalOpen] = useState(false);

  const gradientStyle = {
    background: `conic-gradient(from 180deg, #fff ${potionyPercent}%, #000 ${potionyPercent}% 100%)`
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await axios.get('/api/users/', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = response.data;
        setNickname(data.nickname || '');
        setEmail(data.email || '');

        if (!data.profileImage || data.profileImage === 'string') {
          setProfileImg(null); 
        } else {
          setProfileImg(data.profileImage); 
        }

        setPurchasesCount(data.purchaseCount || 0);
        setSalesCount(data.salesCount || 0);
        setPotionyPercent(data.potionyPercent || 0);

      } catch (error) {
        console.error('❌ 유저 정보 불러오기 실패:', error);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  const handleSaveProfile = ({ nickname, email, profileImg }) => {
    setNickname(nickname);
    setEmail(email);
    if (profileImg) setProfileImg(profileImg);
    localStorage.setItem('nickname', nickname);
    localStorage.setItem('email', email);
    if (profileImg) localStorage.setItem('profileImg', profileImg);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.leftBox}>
          <img
            src={profileImg ? profileImg : undefined}
            className={styles.profile}
          />
          <div className={styles.infoBox}>
            <p className={styles.name}>{nickname}</p>
            <p className={styles.history}>
              누적 거래 횟수 : {purchasesCount + salesCount}회 (구매 {purchasesCount}회 / 판매 {salesCount}회)
            </p>
            <div className={styles.potionyWrapper} style={{ position: "relative" }}>
              <div className={styles.potionyBox}>
                <span>나의 포셔니는</span>
                <div className={styles.progressCircle} style={gradientStyle} />
                <span className={styles.percent}>{potionyPercent}%</span>
              </div>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={questionIcon}
                  alt="도움말"
                  className={styles.tooltipImg}
                  onClick={() => setShowTooltip(prev => !prev)}
                  style={{ zIndex: 2 }}
                />
                {showTooltip && (
                  <div ref={tooltipRef} className={styles.tooltipBubble}>
                    이 지표는 내가 받은 거래 후기 중<br />
                    ‘좋았어요’ 평가의 비율을 %로 보여줘요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <button className={styles.editBtn} onClick={() => setModalOpen(true)}>
          프로필 편집
        </button>
      </div>
      <ProfileEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentProfile={{
          nickname,
          email,
          profileImg
        }}
        onSave={handleSaveProfile}
      />
    </>
  );
}

export default MyPageHeader;
