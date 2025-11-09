import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./HomeBody.module.css";

import searchIcon from "../../assets/search.svg";
// import { fetchPosts } from "../../api/postApi"; // 실제 API 쓰면 주석 해제

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

// 데모용 더미 데이터 (8개)
const DUMMY_POSTS = [
  {
    id: 1,
    name: "키친타올 12롤 나눔",
    price: "9,900원 / 12롤",
    image: "",
    endDate: "2025-11-30",
    details: "공구 인원 12명 · 거래 완료 3명",
    location: "이문2동",
  },
  {
    id: 2,
    name: "강아지 간식 대용량",
    price: "6,500원 / 1봉",
    image: "",
    endDate: "2025-12-01",
    details: "공구 인원 8명 · 거래 완료 5명",
    location: "이문2동",
  },
  {
    id: 3,
    name: "A4 복사용지 3팩 공동구매",
    price: "14,000원 / 3팩",
    image: "",
    endDate: "2025-12-05",
    details: "공구 인원 10명 · 거래 완료 1명",
    location: "이문2동",
  },
  {
    id: 4,
    name: "건조기 시트 160매",
    price: "11,000원 / 160매",
    image: "",
    endDate: "2025-12-10",
    details: "공구 인원 6명 · 거래 완료 2명",
    location: "이문2동",
  },
  {
    id: 5,
    name: "유아 물티슈 10팩 대용량",
    price: "7,900원 / 10팩",
    image: "",
    endDate: "2025-12-03",
    details: "공구 인원 15명 · 거래 완료 4명",
    location: "이문2동",
  },
  {
    id: 6,
    name: "겨울 니트 장갑 3컬러 세트",
    price: "5,500원 / 1세트",
    image: "",
    endDate: "2025-12-08",
    details: "공구 인원 9명 · 거래 완료 2명",
    location: "이문2동",
  },
  {
    id: 7,
    name: "반려묘 캣타워 소형",
    price: "29,000원 / 1개",
    image: "",
    endDate: "2025-12-12",
    details: "공구 인원 5명 · 거래 완료 1명",
    location: "이문2동",
  },
  {
    id: 8,
    name: "생활세제 리필 4개입",
    price: "12,500원 / 4개",
    image: "",
    endDate: "2025-12-15",
    details: "공구 인원 11명 · 거래 완료 6명",
    location: "이문2동",
  },
];


function HomeBody({
  onOpenLocation,
  selectedAddress,
  selectedAddressId,
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

  // 밖에 보여줄 주소 (전국 -> 이문2동)
  const displayAddress = (() => {
    if (
      !selectedAddress ||
      !selectedAddress.trim() ||
      selectedAddress.trim() === "전국"
    ) {
      return "이문2동";
    }
    const parts = selectedAddress.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return parts.slice(-2).join(" ");
    return parts.slice(-2).join(" ");
  })();

  // 데이터 불러오기 (지금은 더미)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setProducts({
        posts: DUMMY_POSTS,
        total: DUMMY_POSTS.length,
        isAI: false,
      });
      setLoading(false);
    }, 250);

    // 실제 API 쓰려면 위를 지우고 이걸 복구하면 됨
    /*
    const fetch = async () => {
      setLoading(true);
      try {
        const categoryParam = selectedCategories.includes("전체")
          ? ""
          : selectedCategories[0];

        const data = await fetchPosts({
          selectedCategory: categoryParam,
          page: currentPage,
          status: includeClosed ? "" : "PROGRESS",
          dongId: selectedAddressId,
          sort,
          keyword: searchKeyword,
        });

        const refined = data.posts.map((post) => ({
          id: post.id,
          name: post.title,
          price: `${post.price.toLocaleString()}원 / ${post.capacity}${post.unit}`,
          image: post.thumbnail,
          endDate: post.deadline,
          details: `공구 인원 ${post.capacity}명 · 거래 완료 ${post.completedCount}명`,
          location: selectedAddress?.trim()?.split(" ").at(-1),
        }));

        setProducts({
          posts: refined,
          total: data.total,
          isAI: data.isAI,
        });
      } catch (err) {
        console.error("[상품 불러오기 실패]", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    */
  }, [
    selectedCategories,
    currentPage,
    includeClosed,
    selectedAddress,
    searchKeyword,
    sort,
    selectedAddressId,
  ]);

  const productsPerPage = 12;
  const totalPages = Math.ceil(products.total / productsPerPage);

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
          <div className={styles.list}>
            <ProductList products={products.posts} context="home" />
          </div>
        )}

        {!loading && products.total > 0 && (
          <div className={styles.pagination}>
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* 플로팅 버튼 (조금 위로) */}
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

            <div className={styles.filterSection}>
              <h4>지역</h4>
              <div
                className={styles.locationSelectBox}
                onClick={onOpenLocation}
              >
                <div>
                  <p className={styles.locationSelectLabel}>현재 선택된 지역</p>
                  <p className={styles.locationSelectValue}>
                    {selectedAddress || "이문2동"}
                  </p>
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
