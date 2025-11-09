// src/components/Home/LocationModal.jsx
import React, { useState, useEffect } from "react";
import styles from "./LocationModal.module.css";
import locationIcon from "../../assets/location_on.svg";
import closeIcon from "../../assets/x.svg";
import { searchLocations, searchLocationsByCurrentPosition } from "../../api/postApi";

function LocationModal({ open, onClose, onSelectAddress }) {
  const [localSearchKeyword, setLocalSearchKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // 검색 실행
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await searchLocations(searchKeyword);
        setSearchResults(res);
      } catch (err) {
        console.error("검색 중 오류:", err);
      }
    };
    if (searchKeyword) fetch();
  }, [searchKeyword]);

  const handleCurrentLocationClick = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const fetch = async () => {
        try {
          const res = await searchLocationsByCurrentPosition(
            latitude,
            longitude
          );
          setSearchKeyword(res.currentAddress);
          setSearchResults(res.results);
        } catch (err) {
          console.error(err);
        }
      };
      fetch();
    });
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose}>
            <img src={closeIcon} alt="닫기" />
          </button>
          <span className={styles.title}>지역 변경</span>
        </div>

        <button
          className={styles.currentLocationBtn}
          onClick={handleCurrentLocationClick}
        >
          <img src={locationIcon} alt="위치" />
          현재 위치로 찾기
        </button>

        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            placeholder="동(면, 읍)으로 검색"
            value={localSearchKeyword}
            onChange={(e) => setLocalSearchKeyword(e.target.value)}
          />
          <button
            className={styles.searchBtn}
            onClick={() => setSearchKeyword(localSearchKeyword)}
          />
        </div>

        <div className={styles.resultList}>
          {searchKeyword && (
            <p className={styles.resultTitle}>
              '{searchKeyword}' 검색 결과
            </p>
          )}
          {searchResults.map((item) => (
            <div
              key={item.dongId}
              className={styles.resultItem}
              onClick={() => onSelectAddress(item.address, item.dongId)}
            >
              {item.address}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
