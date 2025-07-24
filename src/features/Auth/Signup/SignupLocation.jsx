import React, { useState, useEffect } from 'react';
import back from '../../../assets/chevron-left.svg';
import location from '../../../assets/location.svg';
import styles from './SignupLocation.module.css';
import search from '../../../assets/search(gray).svg';
import { useSignup } from './SignupContext'; // ✅ Context import

function SignupLocation({ onNext, onBack }) {
  const { setSignupData } = useSignup(); // ✅ 상태 저장용

  const [searchTerm, setSearchTerm] = useState('중앙동');
  const [lastSearch, setLastSearch] = useState('중앙동');
  const [results, setResults] = useState([]);
  const [selectedUI, setSelectedUI] = useState(''); // 검색 결과 중 UI 선택 상태
  const [selectedAddress, setSelectedAddress] = useState(''); // 실제 선택된 주소
  const [resolved, setResolved] = useState(null); // regionId 정보 저장
  const [loading, setLoading] = useState(false);

  // Kakao API로 위도/경도 → 주소 문자열
  const fetchAddressFromCoords = async (lat, lon) => {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lon}&y=${lat}`,
      {
        headers: {
          Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_REST_API_KEY}`,
        },
      }
    );

    const data = await res.json();
    const region = data.documents?.[0];
    if (!region) throw new Error('주소 정보 없음');

    return `${region.region_1depth_name} ${region.region_2depth_name} ${region.region_3depth_name}`;
  };

  // 주소 문자열 → regionId 매핑 요청
  /*const resolveRegion = async (address) => {
    setLoading(true);
    try {
      const res = await fetch('/api/location/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) throw new Error('주소 매핑 실패');
      const data = await res.json(); // { regionId, subregionId, dongId }

      // Context에 저장
      setSignupData(prev => ({
        ...prev,
        regionId: data.regionId,
        subregionId: data.subregionId,
        dongId: data.dongId,
      }));

      setResolved(data); // 다음 단계 가능
    } catch (err) {
      alert('주소 매핑 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  */

  // 현재 위치 버튼 클릭 시
  const handleCurrentLocation = () => {
    // 임시 위치 처리
    // 나중에 아래 코드는 다시 활성화
    /*
    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const address = await fetchAddressFromCoords(latitude, longitude);
        setSelectedAddress(address);
        setSelectedUI(address);

        setSignupData(prev => ({
          ...prev,
          regionId: 22,
          subregionId: 287,
          dongId: 7486,
        }));

        setResolved(true);

        // await resolveRegion(address);
      } catch (err) {
        console.error('주소 변환 실패:', err);
        alert('위치 정보를 가져오는 데 실패했습니다.');
      }
    });
    */

    // 지금은 그냥 ID 3개 바로 저장
    setSignupData(prev => ({
      ...prev,
      regionId: 22,
      subregionId: 287,
      dongId: 7486,
    }));
    setResolved(true);
  };

  // 더미 검색 결과
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    const results = [
      '경기도 평택시 중앙동',
      '경기도 용인시 처인구 중앙동',
      '충남 천안시 동남구 중앙동',
      '경기도 안산시 단원구 중앙동'
    ];

    setResults(results);
    setLastSearch(searchTerm);
    setSearchTerm('');
  };

  useEffect(() => {
    handleSearch();
  }, []);

  useEffect(() => {
    setSelectedUI('');
  }, [searchTerm]);

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
            onClick={handleSearch}
          />
        </div>
      </div>

      <div className={styles.resultBox}>
        <p className={styles.resultItemLabel}>‘{lastSearch}’ 검색 결과</p>
        <hr className={styles.resultBoxDivider} />

        {results.map((item, idx) => (
          <div
            key={idx}
            className={`${styles.resultItemText} ${selectedUI === item ? styles.selectedItem : ''}`}
            onClick={() => {
              setSelectedUI(item);
              alert('검색된 지역은 현재 사용할 수 없습니다.\n"현재 위치로 찾기"를 이용해주세요.');
            }}
          >
            {item}
          </div>
        ))}

        {results.length === 0 && searchTerm && (
          <p className={styles.noResultText}>검색 결과가 없습니다.</p>
        )}
      </div>

      {selectedAddress && (
        <div className={styles.confirmBox}>
          <p className={styles.selectedText}>{selectedAddress}로 시작하시겠어요?</p>
        </div>
      )}

      <button
        className={styles.nextButton}
        onClick={onNext}
        disabled={!resolved || loading}
      >
        <span>{loading ? '위치 확인 중...' : '다음'}</span>
      </button>
    </div>
  );
}

export default SignupLocation;
