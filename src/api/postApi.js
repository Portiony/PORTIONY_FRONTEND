// src/api/postApi.js
import axios from "../lib/axios"; // 프로젝트에 이미 쓰고 있는 axios 인스턴스

// 카테고리 이름 → 백엔드 categoryId 매핑 (임시 값, 실제 값에 맞게 수정 필요)
const CATEGORY_ID_MAP = {
  "전체": null,
  "생활용품": 1,
  "반려동물": 2,
  "의류": 3,
  "문구류": 4,
  "육아용품": 5,
  "화장품/뷰티": 6,
  "잡화/기타": 7,
};

/**
 * 홈 목록 조회
 * GET /api/posts
 *
 * @param {Object} params
 * @param {string} params.selectedCategory
 * @param {number} params.page
 * @param {string} params.sort
 * @param {string} params.keyword
 * @param {boolean} params.includeClosed
 * @param {string|undefined} params.address - 예: "동대문구 이문2동"
 */
export async function fetchPosts({
  selectedCategory,
  page = 1,
  sort = "latest",
  keyword = "",
  includeClosed = false,
  address,
}) {
  const params = {
    page,
    size: 12,
    sort,
  };

  if (keyword && keyword.trim()) {
    params.keyword = keyword.trim();
  }

  // 카테고리 → categoryIds
  if (selectedCategory) {
    const categoryId = CATEGORY_ID_MAP[selectedCategory];
    if (categoryId) {
      params.categoryIds = [categoryId];
    }
  }

  // 주소 필터 → address 배열
  if (address) {
    params.address = [address]; // Swagger: array[string]
  }

  // includeClosed는 나중에 status 쿼리 붙일 때 사용 가능
  // if (!includeClosed) {
  //   params.status = "PROGRESS";
  // }

  const response = await axios.get("/api/posts", { params });
  const data = response.data;

  // ① 백엔드가 배열만 주는 경우: [ {id, title, ...}, ... ]
  if (Array.isArray(data)) {
    return {
      total: data.length,
      page,
      posts: data,
      isAI: false,
    };
  }

  // ② 백엔드가 객체로 감싸는 경우:
  // { total, page, posts: [ ... ], isAI? }
  return {
    total: data.total ?? (data.posts ? data.posts.length : 0),
    page: data.page ?? page,
    posts: data.posts ?? [],
    isAI: data.isAI ?? false,
  };
}
