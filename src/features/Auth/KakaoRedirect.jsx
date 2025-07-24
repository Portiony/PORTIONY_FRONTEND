// src/features/Auth/KakaoRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function KakaoRedirect({ setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');

    const fetchTokens = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/api/users/login/oauth/kakao/success?code=${code}`
        );

        const { accesstoken, Refreshtoken } = response.data;

        localStorage.setItem('accessToken', accesstoken);
        localStorage.setItem('refreshToken', Refreshtoken);
        setIsLoggedIn(true);

        navigate('/');
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
