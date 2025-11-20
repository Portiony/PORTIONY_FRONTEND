import React, { useState } from "react";
import styles from "./LocationModal.module.css";
import locationIcon from "../../assets/location_on.svg";
import closeIcon from "../../assets/x.svg";
import searchIcon from "../../assets/search.svg";
import axiosRaw from "axios";

const locationAxios = axiosRaw.create({
  baseURL: "https://port-0-portiony-be-md4272k5c4648749.sel5.cloudtype.app",
  timeout: 5000,
});

function LocationModal({ open, onClose, onSelectAddress }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSelectLocation = (loc) => {
    onSelectAddress(loc.address, loc.dongId);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("브라우저에서 위치 정보를 지원하지 않아요.");
      return;
    }

    setLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await locationAxios.get("/api/location/resolve", {
            params: {
              latitude,
              longitude,
              page: 1,
              size: 10,
            },
          });

          const data = res.data || {};
          const currentAddress = data.currentAddress || "";

          if (!currentAddress) {
            setMessage(
              "현재 위치 정보를 가져오지 못했어요. 검색으로 동네를 선택해 주세요."
            );
            setResults([]);
            setLoading(false);
            return;
          }

          const parts = currentAddress.split(" ");
          const last = parts[parts.length - 1] || "";
          let dongKeyword = last.replace(/동$/, "");

          if (!dongKeyword) {
            setMessage(
              "현재 위치 기준으로 찾을 수 있는 동네가 없어요. 검색으로 동네를 선택해 주세요."
            );
            setResults([]);
            setLoading(false);
            return;
          }

          try {
            const searchRes = await locationAxios.get("/api/location/search", {
              params: {
                keyword: dongKeyword,
                page: 1,
                size: 10,
              },
            });

            const list = searchRes.data || [];
            if (list.length > 0) {
              setMessage(`현재 위치 기준으로 찾은 동네 목록이에요.`);
              setResults(list);
            } else {
              setMessage(
                "현재 위치 기준으로 행정동 정보를 찾지 못했어요. 검색으로 동네를 선택해 주세요."
              );
              setResults([]);
            }
          } catch (e) {
            console.error(
              "현재 위치 기반 행정동 검색 실패:",
              e.response?.data || e
            );
            setMessage(
              "현재 위치 기준 행정동 검색 중 오류가 발생했어요. 검색으로 동네를 선택해 주세요."
            );
            setResults([]);
          } finally {
            setLoading(false);
          }
        } catch (error) {
          console.error(
            "현재 위치 동네 조회 실패:",
            error.response?.data || error
          );
          setMessage(
            "현재 위치를 불러오지 못했어요. 검색으로 동네를 선택해 주세요."
          );
          setResults([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error("geolocation error:", err);
        setMessage("위치 권한이 거부되었어요. 검색으로 동네를 선택해 주세요.");
        setLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMessage("검색어를 입력해주세요.");
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await locationAxios.get("/api/location/search", {
        params: {
          keyword: keyword.trim(),
          page: 1,
          size: 10,
        },
      });

      const list = res.data || [];
      if (list.length === 0) {
        setMessage("검색 결과가 없어요. 다른 검색어를 시도해 주세요.");
      } else {
        setMessage(`검색 결과 ${list.length}개를 불러왔어요.`);
      }
      setResults(list);
    } catch (error) {
      console.error("동네 검색 실패:", error.response?.data || error);
      setMessage("검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.topBar}>
          <button className={styles.closeBtn} onClick={onClose}>
            <img src={closeIcon} alt="닫기" />
          </button>
          <span className={styles.title}>지역 변경</span>
        </div>
        <button
          className={styles.currentLocationBtn}
          onClick={handleUseCurrentLocation}
          type="button"
          disabled={loading}
        >
          <img src={locationIcon} alt="위치" />
          {loading ? "현재 위치 불러오는 중..." : "현재 위치로 찾기"}
        </button>

        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            placeholder="동(면, 읍)으로 검색 (ex. 이문동)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <button className={styles.searchBtn} onClick={handleSearch}>
            <img src={searchIcon} alt="검색" />
          </button>
        </div>

        {message && <p className={styles.message}>{message}</p>}
        
        <div className={styles.resultList}>
          {results.map((item) => (
            <button
              type="button"
              key={item.dongId}
              className={styles.resultItem}
              onClick={() => handleSelectLocation(item)}
            >
              <span className={styles.resultDong}>{item.address}</span>
            </button>
          ))}

          {!loading && !results.length && !message && (
            <p className={styles.placeholderText}>
              동(면, 읍) 이름으로 검색해서 동네를 선택해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationModal;
