import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../../lib/axios";
import styles from "./Login.module.css";
import character from "../../assets/logo.svg";

function Login({ setIsLoggedIn }) {
  const [userId, setUserId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleFinalLogin = async () => {
    try {
      setErrorMessage("");
      const response = await axios.post("/api/users/login", {
        username: userId,
        password: userPassword,
      });

      const { accessToken, refreshToken, userId: serverUserId } =
        response?.data ?? {};

      if (!accessToken || !refreshToken) {
        throw new Error("토큰이 응답되지 않았습니다.");
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user_id", String(serverUserId ?? userId));

      if (typeof setIsLoggedIn === "function") {
        setIsLoggedIn(true);
      }
      navigate("/");
    } catch (error) {
      console.error("로그인 실패:", error.response?.data || error.message);
      setErrorMessage("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.phone}>
        <div className={styles.hero}>
          <img src={character} alt="Portiony" className={styles.logo} />
          <p className={styles.slogan}>함께 사서, 함께 나누는 새로운 소비 문화</p>
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (userId && userPassword) handleFinalLogin();
          }}
        >
          <input
            type="text"
            className={styles.input}
            placeholder="아이디"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
          <input
            type="password"
            className={styles.input}
            placeholder="비밀번호"
            value={userPassword}
            onChange={(e) => setUserPassword(e.target.value)}
            required
          />

          {errorMessage && <p className={styles.error}>{errorMessage}</p>}

          <button
            type="submit"
            className={styles.loginButton}
            disabled={!userId || !userPassword}
          >
            로그인
          </button>
        </form>

        <p className={styles.bottomText}>
          아직 회원이 아니신가요?{" "}
          <Link to="/signup" className={styles.link}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
