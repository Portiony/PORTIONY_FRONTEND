import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./Footer.module.css";

function Footer() {
  const location = useLocation();
  const tabs = [
    { to: "/", label: "홈", match: (p) => p === "/" },
    { to: "/chat", label: "채팅", match: (p) => p.startsWith("/chat") },
    { to: "/community", label: "커뮤니티", match: (p) => p.startsWith("/community") },
    { to: "/mypage", label: "마이페이지", match: (p) => p.startsWith("/mypage") },
  ];

  return (
    <nav className={styles.tabbar}>
      {tabs.map((tab) => {
        const active = tab.match(location.pathname);
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`${styles.tabItem} ${active ? styles.active : ""}`}
          >
            {active && <span className={styles.activeIndicator} />}
            <span className={styles.label}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default Footer;
