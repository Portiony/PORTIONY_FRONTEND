import React, { useState } from 'react';
import styles from './SignupSurvey.module.css';
import back from '../../../assets/chevron-left.svg';
import required from '../../../assets/required.svg';
import DropDownSurvey from '../../../components/DropDown/DropDownSurvey';
import { useSignup } from './SignupContext';
import axios from 'axios'; // axios import 추가

function SignupSurvey({ onNext, onBack }) {
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

  const sendSignupRequest = async (finalPayload) => {
    try {
      setLoading(true);
      const res = await axios.post('https://port-0-portiony-backend-md4272k5c4648749.sel5.cloudtype.app/api/users/signup', finalPayload);

      console.log('회원가입 성공:', res.data);
      onNext(); // 완료 페이지로 이동
    } catch (err) {
      const message = err.response?.data?.message || '서버 오류';
      alert(`회원가입 실패: ${message}`);
      console.error('회원가입 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const mappedData = {
      mainCategory: categoryMap[category] || 0,
      purchaseReason: purposeMap[purpose] || 0,
      situation: situationMap[situation] || 0,
    };

    setSignupData(prev => ({
      ...prev,
      ...mappedData,
    }));

    const payload = {
      ...signupData,
      regionId: signupData.regionId ?? 22,
      subregionId: signupData.subregionId ?? 287,
      dongId: signupData.dongId ?? 7486,
      ...mappedData,
    };

    console.log('회원가입 요청 payload:', payload);
    await sendSignupRequest(payload);
  };

  const handleSkip = async () => {
    const payload = {
      ...signupData,
      regionId: signupData.regionId ?? 22,
      subregionId: signupData.subregionId ?? 287,
      dongId: signupData.dongId ?? 7486,
      mainCategory: 0,
      purchaseReason: 0,
      situation: 0,
    };

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
