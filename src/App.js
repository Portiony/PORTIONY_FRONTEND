import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

import Login from "./features/Auth/Login";
import SignUp from "./features/Auth/SignUp";
import Home from "./features/Main/Home";
import MyPage from "./features/MyPage/MyPage";
import Chat from "./features/Chats/Chat";
import GroupBuyNew from "./features/GroupBuy/GroupBuyNew";
import GroupBuyDetail from "./features/GroupBuy/GroupBuyDetail";
import GroupBuyEdit from "./features/GroupBuy/GroupBuyEdit";
import ChatTest from "./features/Chats/ChatTest";

import instance from "./lib/axios";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      setIsLoggedIn(false);
      setIsLoading(false);
      return;
    }

    try {
      await instance.get("/api/users/");
      setIsLoggedIn(true);
    } catch (error) {
      console.error("토큰 확인 실패:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  if (isLoading) return <div className="loading">로딩 중...</div>;

  return (
    <BrowserRouter>
      <AppShell isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
    </BrowserRouter>
  );
}

function AppShell({ isLoggedIn, setIsLoggedIn }) {
  const location = useLocation();

  const AUTH_PAGES = ["/login", "/signup"];
  const hideChrome = AUTH_PAGES.includes(location.pathname);

  return (
    <div className="web-wrapper">
      <div className="app-frame">

        {!hideChrome && <Header />}
        <main className={`app-content ${hideChrome ? "no-chrome" : ""}`}>
          <Routes>

            <Route
              path="/login"
              element={
                isLoggedIn ? (
                  <Navigate to="/" />
                ) : (
                  <Login setIsLoggedIn={setIsLoggedIn} />
                )
              }
            />
            <Route
              path="/signup"
              element={isLoggedIn ? <Navigate to="/" /> : <SignUp />}
            />

            <Route
              path="/"
              element={isLoggedIn ? <Home /> : <Navigate to="/login" />}
            />
            <Route
              path="/mypage"
              element={isLoggedIn ? <MyPage /> : <Navigate to="/login" />}
            />
            <Route
              path="/chat"
              element={isLoggedIn ? <Chat /> : <Navigate to="/login" />}
            />


            <Route
              path="/group-buy/new"
              element={isLoggedIn ? <GroupBuyNew /> : <Navigate to="/login" />}
            />
            <Route
              path="/group-buy/:id"
              element={isLoggedIn ? <GroupBuyDetail /> : <Navigate to="/login" />}
            />
            <Route
              path="/group-buy/:id/edit"
              element={isLoggedIn ? <GroupBuyEdit /> : <Navigate to="/login" />}
            />

            <Route
              path="/chat-test"
              element={isLoggedIn ? <ChatTest /> : <Navigate to="/login" />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        {!hideChrome && <Footer />}
      </div>
    </div>
  );
}

export default App;
