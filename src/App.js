import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Login from './features/Auth/Login';
import KakaoRedirect from './features/Auth/KakaoRedirect';
import SignUp from './features/Auth/SignUp';
import Home from './features/Main/Home';
import MyPage from './features/MyPage/MyPage';
import Chat from './features/Chats/Chat';
import GroupBuyNew from './features/GroupBuy/GroupBuyNew';
import GroupBuyDetail from './features/GroupBuy/GroupBuyDetail';
import GroupBuyEdit from './features/GroupBuy/GroupBuyEdit';
import Community from './features/Community/Community';
import ChatTest from './features/Chats/ChatTest';

import instance from './lib/axios'; 
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 토큰 기반 인증 상태 확인
  const checkAuth = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    try {
      await instance.get('/api/users/'); 
      setIsLoggedIn(true);
    } catch (error) {
      console.error('토큰 확인 실패:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  if (isLoading) return <div className="loading">로딩 중...</div>;

  return (
    <div className="web-wrapper">
      <div className="web-container">
        <BrowserRouter>
          <Header isLoggedIn={isLoggedIn} />
          <div className="scrollable-content">
            <Routes>
              {/* 비회원용 */}
              <Route path="/signup" element={isLoggedIn ? <Navigate to="/" /> : <SignUp />} />
              <Route path="/login" element={isLoggedIn ? <Navigate to="/" /> : <Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/login/oauth/kakao" element={<KakaoRedirect setIsLoggedIn={setIsLoggedIn} />} />

              {/* 로그인 필수 */}
              <Route path="/" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
              <Route path="/mypage" element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />} />
              <Route path="/chat" element={isLoggedIn ? <Chat /> : <Navigate to="/login" />} />
              <Route path="/community" element={isLoggedIn ? <Community /> : <Navigate to="/login" />} />

              {/* 공구 상세/생성/수정 (로그인 여부 무관) */}
              <Route path="/group-buy/new" element={<GroupBuyNew />} />
              <Route path="/group-buy/:id" element={<GroupBuyDetail />} />
              <Route path="/group-buy/:id/edit" element={<GroupBuyEdit />} />

              {/* 테스트용 채팅 */}
              <Route path="/chat-test" element={<ChatTest />} />

              {/* 그 외 잘못된 경로 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <Footer />
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
