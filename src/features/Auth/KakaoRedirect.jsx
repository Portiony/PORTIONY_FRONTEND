// src/features/Auth/KakaoRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '../../lib/axios';

function KakaoRedirect({ setIsLoggedIn }) {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');
    if (!code) {
      alert('잘못된 접근입니다.');
      navigate('/login');
      return;
    }

    const run = async () => {
      try {
        const { data } = await instance.get(`/api/users/login/oauth/kakao/success?code=${code}`);

        // accessToken 이 있으면 기존 회원
        if (data && data.accessToken) {
          localStorage.setItem('access_token', data.accessToken);
          localStorage.setItem('refresh_token', data.refreshToken);
          localStorage.setItem('user_id', String(data.userId));
          setIsLoggedIn(true);
          window.dispatchEvent(new Event('auth-change'));
          navigate('/');
          return;
        }

        // 신규 회원 (KakaoSignupRequestDto 형식 맞춤)
        if (data && (data.email || data.nickname)) {
          navigate('/signup/kakao', {
            state: {
              ...data,
              isSocial: true,
              socialProvider: 'KAKAO',
              initialStep: 2,
            },
          });
          return;
        }

        throw new Error('서버 응답 형식이 올바르지 않습니다.');
      } catch (e) {
        console.error('카카오 로그인 실패:', e);
        alert('카카오 로그인에 실패했습니다.');
        navigate('/login');
      }
    };

    run();
  }, [navigate, setIsLoggedIn]);

  return <p>카카오 로그인 처리 중입니다...</p>;
}

export default KakaoRedirect;
