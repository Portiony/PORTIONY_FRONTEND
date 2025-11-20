// src/components/Home/HomeBody.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomeBody.module.css";

import searchIcon from "../../assets/search.svg";
import { fetchPosts } from "../../api/postApi";

import ProductList from "../ProductList/productList";
import ProductSkeleton from "../ProductList/ProductSkeleton";
import Pagination from "../../components/PageNumber/Pagination";

const ALL_CATEGORIES = [
  "전체",
  "생활용품",
  "반려동물",
  "의류",
  "문구류",
  "육아용품",
  "화장품/뷰티",
  "잡화/기타",
];

function HomeBody({
  onOpenLocation,
  selectedAddress,    // ex) "서울특별시 동대문구 이문2동" 또는 "전국"
  selectedAddressId,  // 현재는 안 쓰지만, 일단 유지
  searchKeyword,
  onSearchKeywordChange,
}) {
  const navigate = useNavigate();

  const [selectedCategories, setSelectedCategories] = useState(["전체"]);
  const [sort, setSort] = useState("latest");
  const [includeClosed, setIncludeClosed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempCategories, setTempCategories] = useState(["전체"]);

  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState({
    posts: [],
    total: 0,
    isAI: false,
  });

  // 화면에 보여줄 주소 텍스트
  const displayAddress = (() => {
    if (!selectedAddress || !selectedAddress.trim()) {
      return "전국";
    }
    const trimmed = selectedAddress.trim();
    if (trimmed === "전국") return "전국";

    const parts = trimmed.split(" ").filter(Boolean);
    return parts[parts.length - 1]; // 마지막 덩어리만 (ex. 이문2동)
  })();

  // /api/posts 쿼리에서 사용할 address 값
  // 예: "서울특별시 동대문구 이문2동" → "동대문구 이문2동"
  const addressQuery = (() => {
    if (!selectedAddress || !selectedAddress.trim()) return undefined;

    const trimmed = selectedAddress.trim();
    if (trimmed === "전국") return undefined;

    const parts = trimmed.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];       // 이문2동
      const secondLast = parts[parts.length - 2]; // 동대문구
      return `${secondLast} ${last}`;             // "동대문구 이문2동"
    }
    return trimmed;
  })();

  // 실제 API 호출
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const categoryParam = selectedCategories.includes("전체")
          ? ""
          : selectedCategories[0];

        const data = await fetchPosts({
          selectedCategory: categoryParam,
          page: currentPage,
          sort,
          keyword: searchKeyword,
          includeClosed,
          address: addressQuery,  // ✅ 여기서 주소 필터 전달
        });

        const refined = (data.posts || []).map((post) => ({
          id: post.id,
          name: post.title,
          price: `${post.price.toLocaleString()}원 / ${post.capacity}${post.unit}`,
          image: post.thumbnail,
          endDate: post.deadline,
          details: `공구 인원 ${post.capacity}명 · 거래 완료 ${post.completedCount}명`,
          location:
            selectedAddress?.trim()?.split(" ").filter(Boolean).at(-1) ?? "",
        }));

        setProducts({
          posts: refined,
          total: data.total ?? refined.length,
          isAI: data.isAI ?? false,
        });
      } catch (err) {
        console.error("[상품 불러오기 실패]", err);
        setProducts({ posts: [], total: 0, isAI: false });
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [
    selectedCategories,
    currentPage,
    includeClosed,
    selectedAddress,
    searchKeyword,
    sort,
    addressQuery, // 주소가 바뀌면 다시 불러오기
  ]);

  const productsPerPage = 12;
  const totalPages = Math.ceil(products.total / productsPerPage) || 1;

  const handleOpenFilter = () => {
    setTempCategories(selectedCategories);
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    const finalCats =
      tempCategories.length === 0 ? ["전체"] : [...tempCategories];
    setSelectedCategories(finalCats);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const toggleTempCategory = (cat) => {
    if (cat === "전체") {
      setTempCategories(["전체"]);
      return;
    }
    if (tempCategories.includes("전체")) {
      setTempCategories([cat]);
      return;
    }
    if (tempCategories.includes(cat)) {
      const next = tempCategories.filter((c) => c !== cat);
      setTempCategories(next.length ? next : ["전체"]);
    } else {
      setTempCategories([...tempCategories, cat]);
    }
  };

  const activeFilterCount = selectedCategories.includes("전체")
    ? 0
    : selectedCategories.length;

  return (
    <div className={styles.screen}>
      {/* 상단 */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroText}>
            <p className={styles.subTitle}>현재 지역</p>
            <p className={styles.locationName}>{displayAddress}</p>
          </div>

          <button
            className={styles.roundIconBtn}
            type="button"
            onClick={handleOpenFilter}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-label="필터"
            >
              <path
                d="M4 6h16M7 12h10M10 18h4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            {activeFilterCount > 0 && (
              <span className={styles.filterBadge}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* 검색 카드 */}
        <div className={styles.searchCard}>
          <div className={styles.searchBox}>
            <img src={searchIcon} alt="" className={styles.searchIcon} />
            <input
              value={searchKeyword}
              onChange={(e) => onSearchKeywordChange(e.target.value)}
              className={styles.searchInput}
              placeholder="어떤 상품을 찾으시나요?"
            />
          {!!searchKeyword && (
              <button
                className={styles.clearBtn}
                onClick={() => onSearchKeywordChange("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.controlRow}>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>

            <label className={styles.includeLabel}>
              <input
                type="checkbox"
                checked={includeClosed}
                onChange={(e) => {
                  setIncludeClosed(e.target.checked);
                  setCurrentPage(1);
                }}
              />
              마감된 공구 포함
            </label>
          </div>
        </div>
      </div>

      {/* 리스트 */}
      <div className={styles.contentArea}>
        {loading && <ProductSkeleton />}

        {!loading && products.total === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyIcon}>🔍</p>
            <p className={styles.emptyText}>등록된 상품이 없어요</p>
          </div>
        )}

        {!loading && products.total > 0 && (
          <>
            <div className={styles.list}>
              <ProductList products={products.posts} context="home" />
            </div>

            <div className={styles.pagination}>
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* 플로팅 버튼 */}
      <button
        className={styles.fab}
        onClick={() => navigate("/group-buy/new")}
      >
        + 판매 등록
      </button>

      {/* 필터 모달 */}
      {showFilterModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowFilterModal(false)}
        >
          <div
            className={styles.filterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>필터</h3>
              <button onClick={() => setShowFilterModal(false)}>✕</button>
            </div>

            {/* 필터 모달 안, 지역 선택 부분 */}
            <div className={styles.filterSection}>
              <h4>지역</h4>
              <div
                className={styles.locationSelectBox}
                onClick={() => {
                  setShowFilterModal(false);
                  onOpenLocation();
                }}
              >
                <div>
                  <p className={styles.locationSelectLabel}>현재 선택된 지역</p>
                  <p className={styles.locationSelectValue}>{displayAddress}</p>
                </div>
                <span className={styles.locationSelectRight}>변경</span>
              </div>
            </div>

            <div className={styles.filterSection}>
              <h4>카테고리</h4>
              <div className={styles.filterGrid}>
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`${styles.filterOption} ${
                      tempCategories.includes(cat)
                        ? styles.filterOptionActive
                        : ""
                    }`}
                    onClick={() => toggleTempCategory(cat)}
                    type="button"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.resetBtn}
                onClick={() => setTempCategories(["전체"])}
              >
                초기화
              </button>
              <button className={styles.applyBtn} onClick={handleApplyFilter}>
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeBody;
