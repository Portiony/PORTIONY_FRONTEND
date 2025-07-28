import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignupSurvey.module.css';
import back from '../../../assets/chevron-left.svg';
import required from '../../../assets/required.svg';
import DropDownSurvey from '../../../components/DropDown/DropDownSurvey';
import { useSignup } from './SignupContext';
import instance from '../../../lib/axios';

function SignupSurvey({ onNext, onBack }) {
  const navigate = useNavigate();
  const { signupData, setSignupData } = useSignup();

  const [category, setCategory] = useState('');
  const [purpose, setPurpose] = useState('');
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);

  const isNextValid = category && purpose && situation;

  const categoryMap = {
    '의류': 1,
    '반려동물': 2,
    '문구류': 3,
    '육아용품': 4,
    '화장품/뷰티': 5,
    '잡화/기타': 6,
  };

  const purposeMap = {
    '가격 절약': 1,
    '혼자서 구매 어려움': 2,
    '이웃들과 공유': 3,
  };

  const situationMap = {
    '프리랜서': 1,
    '전업주부': 2,
    '직장인': 3,
    '학생': 4,
    '기타': 5,
  };

  const uploadProfileImage = async (file) => {
    if(!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    await instance.patch('/api/users/me', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
  };

  const buildPayload = (overrides = {}) => {
    const mappedData = {
      mainCategory: categoryMap[category] || 0,
      purchaseReason: purposeMap[purpose] || 0,
      situation: situationMap[situation] || 0,
      ...overrides,
    };

    return {
      ...signupData,
      ...mappedData,
    };
  };

  const sendSignupRequest = async (payload) => {
    try {
      setLoading(true);

      // 카카오 신규회원 여부?
      const isKakao = signupData?.isSocial === true;
      const file = signupData?.profileImage;

      if (isKakao) {
        // 카카오 신규회원 가입 완료
        const res = await instance.post('/api/users/login/oauth/kakao/signup', payload);
        const { accessToken, refreshToken, userId } = res.data ?? {};
        if (accessToken && refreshToken) {
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user_id', String(userId));
          window.dispatchEvent(new Event('auth-change'));
        }
        onNext?.(); // done 페이지로 이동
      } else { // 일반 회원가입 완료
          const res = await instance.post('/api/users/signup', payload);
          await uploadProfileImage(file);
          onNext?.(); // done 페이지로 이동
        }
      } catch (err) {
        console.error('회원가입 실패:', err); 
        if (err.response) {
          console.error('서버 응답:', err.response); 
        }
        const message = err.response?.data?.message || '서버 오류';
        alert(`회원가입 실패: ${message}`);
      } finally {
        setLoading(false);
      }
    };

  const handleNext = async () => {
    const payload = buildPayload(); 
    setSignupData(payload);
    console.log('회원가입 요청 payload:', payload);
    await sendSignupRequest(payload);
  };

  const handleSkip = async () => {
    const payload =  {
      ...signupData,
      mainCategory: 0,
      purchaseReason: 0,
      situation: 0,
    };

    setSignupData(payload);
    console.log('회원가입 요청 payload (건너뛰기):', payload);
    await sendSignupRequest(payload);
  };

  const questions = [
    {
      label: '어떤 종류의 상품을 주로 찾아보시나요?',
      value: category,
      setValue: setCategory,
      placeholder: '상품 분야를 선택해주세요.',
      options: ['의류', '반려동물', '문구류', '육아용품', '화장품/뷰티', '잡화/기타'],
    },
    {
      label: '주로 어떤 이유로 상품을 구매하시나요?',
      value: purpose,
      setValue: setPurpose,
      placeholder: '구매 목적을 선택해주세요.',
      options: ['가격 절약', '혼자서 구매 어려움', '이웃들과 공유'],
    },
    {
      label: '어떤 상황에 가장 가까우신가요?',
      value: situation,
      setValue: setSituation,
      placeholder: '나의 생활 상황을 골라주세요.',
      options: ['프리랜서', '전업주부', '직장인', '학생', '기타'],
    },
  ];

  return (
    <div className={styles.allContainer}>
      <div className={styles.backWrapper}>
        <img src={back} alt="뒤로가기" className={styles.backIcon} onClick={onBack} />
        <span className={styles.signupTitle}>회원가입</span>
      </div>

      <div className={styles.dropdownWrapper}>
        <h2 className={styles.heading}>환영합니다, 어떤 상품이 필요하세요?</h2>

        {questions.map((q, index) => (
          <div className={styles.surveyFormWrapper} key={index}>
            <label className={styles.surveyLabel}>
              {q.label}
              <img src={required} className={styles.requiredIcon} alt="필수" />
            </label>

            <div className={styles.selectWrapper}>
              <DropDownSurvey
                value={q.value}
                setValue={q.setValue}
                placeholder={q.placeholder}
                options={q.options}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={styles.startButton}
        onClick={handleNext}
        disabled={!isNextValid || loading}
      >
        <span>{loading ? '가입 중...' : 'PORTIONY 시작하기'}</span>
      </button>

      <p className={styles.skipText} onClick={handleSkip}>
        AI 추천 없이 시작하기
      </p>
    </div>
  );
}

export default SignupSurvey;
