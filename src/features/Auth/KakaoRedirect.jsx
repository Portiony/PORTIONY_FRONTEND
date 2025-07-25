// src/features/Auth/KakaoRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../lib/axios';

function KakaoRedirect({ setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');
    console.log('현재 redirect URI:', window.location.href);

    const fetchTokens = async () => {
      try {
        const response = await axios.get(
          `api/users/login/oauth/kakao/success?code=${code}`
        );

        const data = response.data;

        if ('accessToken' in data) {
          // 기존 회원 -> 로그인 처리
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          setIsLoggedIn(true);
          navigate('/');
        } else if ('nickname' in data || 'email' in data) {
          // 신규 회원 -> 회원가입 페이지로 이동
          navigate('/signup/kakao', { state: data }); 
        } else {
          throw new Error('응답 데이터 형식 오류입니다.');
        }
      } catch (err) {
        console.error('카카오 로그인 실패:', err);
        alert('카카오 로그인에 실패했습니다.');
        navigate('/login');
      }
    };

    if (code) fetchTokens();
  }, [navigate, setIsLoggedIn]);

  return <p>카카오 로그인 처리 중입니다...</p>;
}

export default KakaoRedirect;
