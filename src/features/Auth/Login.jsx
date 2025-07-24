import React, { useState } from 'react';
import character from '../../assets/logoportiony.png';
import back from '../../assets/chevron-left.svg';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Login({ setIsLoggedIn }) {
  const [status, setStatus] = useState('init'); 
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');

  const handleLoginClick = () => {
    setStatus('form'); // 로그인 폼 보여주기
  };

  const handleKakaoLogin = () => {
    const REST_API_KEY = '1905cc0f6daf870b0f4eb756b47ac06f';
    const REDIRECT_URI = 'http://localhost:3000/login/oauth/kakao';
    const kakaoAuthURL = 'https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code';

    window.location.href = kakaoAuthURL;
  };


  const handleFinalLogin = async () => {
    try {
      const response = await axios.post('http://localhost:8080/api/users/login', {
        email: userEmail,
        password: userPassword,
      });

      const { accessToken, refreshToken } = response?.data ?? {};
      if (!accessToken || !refreshToken) {
        throw new Error("토큰이 응답되지 않았습니다.");
      }

      // 토큰 저장
      const saveTokens = (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      };
      saveTokens(accessToken, refreshToken);

      // 로그인 완료 화면으로
      setStatus('done');
    } catch (error) {
      console.error('로그인 실패:', error.response?.data || error.message);
      alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const goToMain = () => {
    // 메인 홈으로 이동
    setIsLoggedIn(true);
    navigate('/');
  };

  return (
    <div className={styles.container}>
      {status === 'init' && (
        <>
          <img src={character} alt="캐릭터 로고" className={styles.character} />
          <p className={styles.slogan}>함께 사서, 함께 나누는 새로운 소비 문화</p>
          <button className={styles.kakaoButton} onClick={handleKakaoLogin}>
            카카오 로그인
          </button>
          <button className={styles.loginButton} onClick={handleLoginClick}>
              로그인
          </button>
          <p className={styles.signupText}>
            첫 방문이신가요? <Link to="/signup" className={styles.signupLink}>회원가입</Link>
          </p>
        </>
      )}

      {status === 'form' && (
        <>
          <div className={styles.backWrapper}>
            <img
              src={back}
              alt="뒤로가기"
              className={styles.backIcon}
              onClick={() => setStatus('init')}
            />
            <span className={styles.loginTitle}>로그인</span>
          </div>
          <img src={character} alt="캐릭터 로고" className={styles.logoTop}/>

          <div className={styles.formGroup}>
            <input type="email" placeholder="이메일을 입력해주세요." 
              className={styles.input} onChange={(e) => setUserEmail(e.target.value)}/>

            <input type="password" placeholder="비밀번호를 입력해주세요." 
              className={styles.input} onChange={(e) => setUserPassword(e.target.value)}/>
          </div>

          <button 
            type='button'
            className={styles.loginButton} 
            onClick={handleFinalLogin}
            disabled={!userEmail || !userPassword}>
            로그인
          </button>
          <p className={styles.signupText}>
            첫 방문이신가요? <a href="/signup" className={styles.signupLink}>회원가입</a>
          </p>
        </>
      )}

      {status === 'done' && (
        <>
          <img src={character} alt="캐릭터 로고" className={styles.character}/>
          <p className={styles.slogan_dif}>함께 사서, 함께 나누는 새로운 소비 문화</p>
          <p className={styles.loginText}>로그인 완료되었습니다!</p>
          <button className={styles.loginCompleteButton} onClick={goToMain}>메인 홈으로 가기</button>
        </>
      )}
    </div>
  );
}

export default Login;
