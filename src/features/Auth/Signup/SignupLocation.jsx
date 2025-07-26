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
  const [selectedAddress, setSelectedAddress] = useState(''); // 실제 선택된 주소 (서버반환)
  const [resolved, setResolved] = useState(false); // regionId 정보 저장
  const [loading, setLoading] = useState(false);


  // 현재 위치 버튼 클릭 시
  const handleCurrentLocation = () => {
    
    if (!navigator.geolocation) {
      alert('브라우저가 위치 정보를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        setLoading(true);

        // 서버에 위경도 전달 -> address 스트링 반환
        const res = await fetch('/api/location/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({latitude, longitude}),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('resolve error:', res.status, errText);
          throw new Error(`주소 매핑 실패(${res.status})`);
        }

        const data = await res.json();
        //  { regionId, subregionId, dongId, address } 이 부분

        setSelectedAddress(data.address);
        setSelectedUI(data.address);

        // context 저장
        setSignupData(prev => ({
          ...prev,
          regionId: data.regionId,
          subregionId: data.subregionId,
          dongId: data.dongId,
          address: data.address,
        }));

        setResolved(true);

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
        //테스트 중 다음단계 강제로 넘기고싶으면 아래 코드 주석처리하기
        disabled={!resolved || loading}
      >
        <span>{loading ? '위치 확인 중...' : '다음'}</span>
      </button>
    </div>
  );
}

export default SignupLocation;
