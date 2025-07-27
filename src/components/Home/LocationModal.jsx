import React, { useState, useEffect } from 'react';
import styles from './LocationModal.module.css';
import typography from './Typography.module.css';

import locationIcon from '../../assets/location_on.svg';
import closeIcon from '../../assets/x.svg';
import { searchLocations } from '../../api/postApi';

function LocationModal({ open, onClose, onSelectAddress }) {
  const [localSearchKeyword, setLocalSearchKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 검색어 입력 핸들러
  const handleInputChange = (e) => {
    setLocalSearchKeyword(e.target.value);
  };
  const handleSearchClick = (e) => {
    setSearchKeyword(localSearchKeyword);
  };

  // 검색어가 변경될 때마다 로직 실행
  useEffect(() => {
    const fetch = async () => {
      try{
        setSearchResults(await searchLocations(searchKeyword));
      } catch (err) {
        console.error('검색 중 오류 발생:', err);
      } finally {
      
      }
    }
    if (searchKeyword) fetch();
  }, [searchKeyword]);

  // 검색 결과 선택 핸들러
  const handleResultClick = (location, locationId) => {
    onSelectAddress(location, locationId);
  };

  if (!open) return null;

  return (
    <div className={`${styles.overlay} ${typography.body1}`} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>
            <span className={typography.title2}>지역 변경</span>
            <img
              src={closeIcon}
              alt="닫기"
              className={styles.closeBtn}
              onClick={onClose}
            />
          </div>
          <button className={styles.currentLocationBtn}>
            <img src={locationIcon} alt="위치아이콘" className={styles.locationIcon} />
            <span>현재 위치로 찾기</span>
          </button>

          <div className={styles.searchBox}>
            <input 
              className={styles.searchInput} 
              placeholder="검색어를 입력하세요"
              value={localSearchKeyword}
              onChange={handleInputChange}/>
            <button 
              className={styles.searchBtn}
              onClick={handleSearchClick}/>
          </div>
        </div>

        <div className={styles.searchResult}>
          <span>'{searchKeyword}' 검색 결과</span>
          <hr className={styles.hr}/>
          <div className={styles.resultList}>
            {searchResults.map((result, index) => {
              return (
                <span
                  key={result.dongId}
                  className={styles.resultItem}
                  onClick={() => handleResultClick(result.address, result.dongId)}>
                {result.address}
                </span>
              );    
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default LocationModal;
