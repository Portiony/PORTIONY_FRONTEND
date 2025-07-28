import React, { useState, useEffect } from 'react';
import back from '../../../assets/chevron-left.svg';
import location from '../../../assets/location.svg';
import styles from './SignupLocation.module.css';
import search from '../../../assets/search(gray).svg';
import { useSignup } from './SignupContext'; // ✅ Context import
import instance from '../../../lib/axios';

function SignupLocation({ onNext, onBack }) {
  const { setSignupData } = useSignup(); // ✅ 상태 저장용

  const [searchTerm, setSearchTerm] = useState('');
  const [lastSearch, setLastSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUI, setSelectedUI] = useState(''); // 검색 결과 중 UI 선택 상태
  const [selectedAddress, setSelectedAddress] = useState(''); // 실제 선택된 주소 (서버반환)
  const [resolved, setResolved] = useState(false); // regionId 정보 저장
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;


  // 현재 위치로찾기 버튼 클릭 시
  const handleCurrentLocation = () => {

    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        setLoading(true);

        const res = await instance.get('/api/location/resolve', {
          params: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
        });

        console.log('현재 위치 검색 결과:', res.data);
        const data = res.data;
        //  { regionId, subregionId, dongId, address } 이 부분
        setLastSearch(data.currentAddress);
        setResults(data.results)
        
      } catch (err) {
        console.error('주소 변환 실패:', err);
        alert('위치 정보를 가져오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    (err) => {
      console.error('Geolocation error:', err);
      alert('브라우저에서 위치 권한을 거부했거나 오류가 발생했습니다.');
    }
  );
}; 

  // 키워드 검색 시 
  const handleSearch = async (keyword = searchTerm, targetPage = 1) => {
    const k = keyword.trim();
    if (!k) return;

    try {
      setLoading(true);
      const res = await instance.get('/api/location/search', {
        params: { keyword: k, page: targetPage, size: pageSize },
      });

      setResults(res.data);
      setPage(targetPage);
      setLastSearch(k);
      if (targetPage === 1) { // 검색어 입력 시에만 초기화하도록
      setSearchTerm('');
    }
      setSelectedUI('');
    } catch (err) {
      console.error('검색 실패:', err)
      alert('검색에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = async () => {
    if (page === 1 || loading) return;
    await handleSearch(lastSearch, page - 1);
  };

  const handleNext = async () => {
    if (loading) return;
    if (results.length < pageSize) return;
    await handleSearch(lastSearch, page + 1);
  };

  const selectResult = (item) => {
    setSelectedUI(item.address);
    setSelectedAddress(item.address);

    setSignupData(prev => ({
      ...prev,
      regionId: item.regionId,
      subregionId: item.subregionId,
      dongId: item.dongId,
      address: item.address,
    }));

    setResolved(true);
  };

  return (
    <div className={styles.allContainer}>
      <div className={styles.backWrapper}>
        <img src={back} alt="뒤로가기" className={styles.backIcon} onClick={onBack} />
        <span className={styles.signupTitle}>회원가입</span>
      </div>

      <h2 className={styles.heading}>내 동네 둘러보기</h2>

      <div className={styles.searchFormWrapper}>
        <button className={styles.locationButton} onClick={handleCurrentLocation}>
          <img src={location} alt="위치" className={styles.locationIcon} />
          <span>현재 위치로 찾기</span>
        </button>

        <div className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="동명(읍, 면)으로 검색 (ex. 서초동)"
          />
          <img
            src={search}
            alt="검색"
            className={styles.searchIconInside}
            onClick={() => handleSearch()}
          />
        </div>
      </div>

      <div className={styles.resultBox}>
        <p className={styles.resultItemLabel}>‘{lastSearch}’ 검색 결과</p>
        <hr className={styles.resultBoxDivider} />

        {results.map((item, idx) => (
          <div
            key={idx}
            className={`${styles.resultItemText} ${selectedUI === item.address ? styles.selectedItem : ''}`}
            onClick={() => {
              selectResult(item)
            }}
          >
            {item.address}
          </div>
        ))}

        {results.length === 0 && lastSearch && !loading && (
          <p className={styles.noResultText}>검색 결과가 없습니다.</p>
        )}
      </div>

      <div className={styles.pagination}>
        <button
          type="button"
          disabled={page === 1 || loading}
          onClick={handlePrev}
          className={styles.pageButton}
        >
          이전
        </button>
        <span className={styles.pageInfo}>{page} 페이지</span>
        <button
          type="button"
          disabled={loading || results.length < pageSize}
          onClick={handleNext}
          className={styles.pageButton}
        >
          다음
        </button>
      </div>  

      {selectedAddress && (
        <div className={styles.confirmBox}>
          <p className={styles.selectedText}>{selectedAddress}로 시작하시겠어요?</p>
        </div>
      )}

      <button
        className={styles.nextButton}
        onClick={onNext}
        //테스트 중 다음단계 강제로 넘기고싶으면 아래 코드 주석처리하기
        disabled={!resolved || loading}
      >
        <span>{loading ? '위치 확인 중...' : '다음'}</span>
      </button>
    </div>
  );
}

export default SignupLocation;
