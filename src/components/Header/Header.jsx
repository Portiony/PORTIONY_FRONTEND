import React from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.css";
import logo from "../../assets/logo.svg";

function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logoArea}>
        <img src={logo} alt="Portiony" className={styles.logoImg} />
      </Link>
    </header>
  );
}

export default Header;
