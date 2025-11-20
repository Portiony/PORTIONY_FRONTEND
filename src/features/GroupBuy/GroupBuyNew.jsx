// src/features/GroupBuy/GroupBuyNew.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import styles from './GroupBuyNew.module.css';

import backIcon from '../../assets/back-icon.svg';
import checkedIcon from '../../assets/checkbox-checked.svg';
import uncheckedIcon from '../../assets/checkbox-unchecked.svg';
import removeIcon from '../../assets/remove-icon.svg';

import Dropdown from '../../components/DropDown/DropDown';
import GroupBuyModal from '../../components/GroupBuy/GroupBuyModal';
import axios from '../../lib/axios';

const categoryOptions = [
  '생활용품',
  '반려동물',
  '의류',
  '문구류',
  '육아용품',
  '화장품/뷰티',
  '잡화/기타',
];

const unitOptions = ['g', 'kg', 'ml', 'L', '개', '박스', '직접 입력'];

const methodOptions = ['직거래', '택배 배송', '직거래 및 택배 배송'];

const categoryMap = {
  생활용품: 1,
  반려동물: 2,
  의류: 3,
  문구류: 4,
  육아용품: 5,
  '화장품/뷰티': 6,
  '잡화/기타': 7,
};

const deliveryMethodMap = {
  직거래: 'DIRECT',
  '택배 배송': 'DELIVERY',
  '직거래 및 택배 배송': 'ALL',
};

// 마감기한 min/max
const today = new Date();
const minDeadline = today.toISOString().split('T')[0];
const threeMonthsLater = new Date();
threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
const maxDeadline = threeMonthsLater.toISOString().split('T')[0];

function GroupBuyNew() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  const [form, setForm] = useState({
    // STEP 1
    category: '',
    productName: '',
    totalAmount: '',
    unit: '',
    unitCustom: '',
    expirationDate: '',
    notes: '',
    // STEP 2
    title: '',
    description: '',
    capacity: '',
    unitAmount: '',
    price: '',
    deadline: '',
    method: '',
    containerAdvice: '',
  });

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [isChecked, setIsChecked] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 공구 인원 (1~99)
    if (name === 'capacity') {
      if (value === '') {
        setForm((prev) => ({ ...prev, capacity: '' }));
        return;
      }
      const num = parseInt(value, 10);
      if (Number.isNaN(num) || num < 1 || num > 99) return;
      setForm((prev) => ({ ...prev, capacity: num.toString() }));
      return;
    }

    // 총량 / 1인당 소분량 숫자
    if (name === 'totalAmount' || name === 'unitAmount') {
      if (value === '') {
        setForm((prev) => ({ ...prev, [name]: '' }));
        return;
      }
      const num = Number(value);
      if (Number.isNaN(num) || num < 0) return;
      setForm((prev) => ({ ...prev, [name]: value }));
      return;
    }

    // 가격 숫자만
    if (name === 'price') {
      const numericStr = value.replace(/[^0-9]/g, '');
      setForm((prev) => ({ ...prev, price: numericStr }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = () => setIsChecked((prev) => !prev);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const total = images.length + files.length;
    if (total > 10) {
      alert('이미지는 최대 10장까지 등록할 수 있습니다.');
      return;
    }

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ file, url: reader.result });
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((results) => {
      setImages((prev) => [...prev, ...results.map((r) => r.file)]);
      setPreviewUrls((prev) => [...prev, ...results.map((r) => r.url)]);
    });
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewClick = (url) => setSelectedImage(url);
  const handleCloseImgModal = () => setSelectedImage(null);

  // STEP1 완료 조건 (직접 입력이면 unitCustom 필수)
  const isStep1Complete = () => {
    if (!form.category || !form.productName || !form.totalAmount || !form.unit)
      return false;
    if (form.unit === '직접 입력' && !form.unitCustom.trim()) return false;
    return true;
  };

  const isStep2Complete = () => {
    return (
      form.title &&
      form.description &&
      form.capacity &&
      form.unitAmount &&
      (form.unit || form.unitCustom) &&
      form.price &&
      form.deadline &&
      form.method &&
      isChecked
    );
  };

  const handleNextStep = async () => {
    if (!isStep1Complete()) {
      setWarningMessage('필수 항목을 모두 입력해 주세요.');
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    setWarningMessage('');
    setAiError('');

    const unitForAi =
      form.unit === '직접 입력' ? form.unitCustom || '개' : form.unit;

    const aiRequestBody = {
      productName: form.productName,
      category: form.category,
      totalAmount: Number(form.totalAmount),
      unit: unitForAi,
      notes: form.notes || '',
    };

    try {
      setAiLoading(true);

      // ✅ AI 호출: /api/posts/ai
      const { data } = await axios.post('/api/posts/ai', aiRequestBody, {
        timeout: 15000,
      });

      setForm((prev) => ({
        ...prev,
        title: data.aiTitle || prev.title || prev.productName,
        description: data.aiDescription || prev.description,
        capacity:
          data.recommendedPeople != null
            ? String(data.recommendedPeople)
            : prev.capacity,
        unitAmount:
          data.unitAmount != null ? String(data.unitAmount) : prev.unitAmount,
        unit: data.unit || prev.unit,
        containerAdvice: data.containerAdvice || '',
      }));
    } catch (err) {
      console.error('AI 추천 호출 실패:', err.response?.data || err.message);
      setAiError('AI 추천 정보를 불러오지 못했어요. 직접 입력해 주세요.');
    } finally {
      setAiLoading(false);
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isStep2Complete()) {
      setWarningMessage('입력하지 않은 항목이 있어요.');
      setShowWarning(true);
      return;
    }

    if (images.length === 0) {
      setWarningMessage('이미지는 최소 1장 이상 첨부해 주세요.');
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    setWarningMessage('');

    const unitForPost =
      form.unit === '직접 입력' ? form.unitCustom || '개' : form.unit;

    // deadline: YYYY-MM-DDT00:00:00 형태로 맞춰줌
    const deadlineIso = `${form.deadline}T00:00:00`;

    // 백엔드 DTO에 대응되는 JSON (이미지 URL 대신, 여기서는 서버가 파일을 직접 받음)
    const postData = {
      categoryId: categoryMap[form.category],
      title: form.title,
      description: form.description,
      capacity: Number(form.capacity),
      price: Number(form.price),
      unitAmount: Number(form.unitAmount),
      unit: unitForPost,
      deadline: deadlineIso,
      deliveryMethod: deliveryMethodMap[form.method],
      isAgree: isChecked,
      // images는 여기선 안 보냄 (파일 파트로 따로 전송)
    };

    try {
      const formData = new FormData();

      // ✅ post 부분: JSON을 Blob으로 감싸서 application/json 으로 보내기
      const postBlob = new Blob([JSON.stringify(postData)], {
        type: 'application/json',
      });
      formData.append('post', postBlob);

      // ✅ images 부분: 실제 파일들
      images.forEach((file) => {
        formData.append('images', file);
      });

      const resPost = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const newId = resPost.data?.id;
      if (!newId) {
        alert('게시글 ID를 받아오지 못했습니다.');
        return;
      }

      navigate(`/group-buy/${newId}`);
    } catch (error) {
      console.error('게시글 처리 중 오류:');
      if (error.response) {
        console.log('status:', error.response.status);
        console.log('data:', error.response.data);
        alert(
          `서버 응답 오류:\n${JSON.stringify(
            error.response.data,
            null,
            2,
          )}`,
        );
      } else {
        console.error('네트워크 또는 기타 오류:', error);
        alert('요청 실패: 서버에 연결할 수 없습니다.');
      }
    }
  };

  const handleCancelClick = () => setShowCancelModal(true);
  const handleCloseModal = () => setShowCancelModal(false);
  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    navigate(-1);
  };

  return (
    <div className={styles.screen} data-step={currentStep}>
      {/* 헤더 */}
      <div className={styles.headerRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          <img src={backIcon} alt="뒤로가기" />
        </button>
        <h1 className={styles.headerTitle}>판매 등록</h1>
      </div>

      {/* 단계 탭 */}
      <div className={styles.stepTabs}>
        <div
          className={`${styles.stepTab} ${
            currentStep === 1 ? styles.activeStep : ''
          }`}
        >
          기본 정보
        </div>
        <div
          className={`${styles.stepTab} ${
            currentStep === 2 ? styles.activeStep : ''
          }`}
        >
          공구 정보
        </div>
      </div>

      {/* 가운데 카드 */}
      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {/* STEP 1 */}
          {currentStep === 1 && (
            <>
              {/* 카테고리 */}
              <div className={styles.formGroup}>
                <label>카테고리</label>
                <Dropdown
                  options={categoryOptions}
                  selected={form.category || '카테고리를 선택해주세요.'}
                  setSelected={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      category:
                        val === '카테고리를 선택해주세요.' ? '' : val,
                    }))
                  }
                  placeholder="카테고리를 선택해주세요."
                  variant="minimal"
                />
              </div>

              {/* 제품명 */}
              <div className={styles.formGroup}>
                <label>제품명</label>
                <input
                  type="text"
                  name="productName"
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="제품명을 입력해주세요."
                />
              </div>

              {/* 제품 총량 + 단위 (한 줄 반반) */}
              <div className={styles.formGroup}>
                <label>제품 총량</label>
                <div className={styles.amountRow}>
                  <input
                    type="number"
                    name="totalAmount"
                    value={form.totalAmount}
                    onChange={handleChange}
                    placeholder="예: 2000 (숫자만)"
                  />
                  <div className={styles.amountUnitSelect}>
                    <Dropdown
                      options={unitOptions}
                      selected={form.unit || '단위를 선택해주세요.'}
                      setSelected={(val) =>
                        setForm((prev) => ({
                          ...prev,
                          unit: val === '단위를 선택해주세요.' ? '' : val,
                        }))
                      }
                      placeholder="단위를 선택해주세요."
                      variant="minimal"
                    />
                  </div>
                </div>

                {/* '직접 입력'일 때만 커스텀 단위 인풋 노출 */}
                {form.unit === '직접 입력' && (
                  <input
                    type="text"
                    name="unitCustom"
                    value={form.unitCustom}
                    onChange={handleChange}
                    placeholder="단위를 직접 입력해주세요. (예: 봉지, 세트 등)"
                    className={styles.unitCustom}
                  />
                )}
              </div>

              {/* 유통기한 */}
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label>유통기한</label>
                  <span className={styles.dateInfoText}>
                    유통기한이 있는 경우 반드시 작성해 주세요.
                  </span>
                </div>
                <input
                  type="date"
                  name="expirationDate"
                  value={form.expirationDate}
                  onChange={handleChange}
                  className={`${styles.dateInput} ${
                    form.expirationDate ? styles.hasValue : ''
                  }`}
                />
              </div>

              {/* 추가 설명 */}
              <div className={styles.formGroup}>
                <label>추가 설명 (선택)</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="공동구매 설계에 참고되었으면 하는 내용을 적어주세요."
                />
              </div>

              {showWarning && (
                <p className={styles.warningText}>{warningMessage}</p>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={`${styles.formButton} ${styles.cancel}`}
                  onClick={handleCancelClick}
                >
                  작성 취소
                </button>
                <button
                  type="button"
                  className={`${styles.formButton} ${styles.submit}`}
                  onClick={handleNextStep}
                >
                  다음 단계
                </button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <>
              {/* AI 카드 */}
              <div className={styles.aiCard}>
                <div className={styles.aiHeaderRow}>
                  <span className={styles.aiTag}>AI 추천 결과</span>
                  {aiLoading && (
                    <span className={styles.aiSmall}>계산 중이에요...</span>
                  )}
                  {aiError && (
                    <span className={styles.aiErrorText}>{aiError}</span>
                  )}
                </div>

                {form.title && (
                  <p className={styles.aiTitle}>{form.title}</p>
                )}
                {form.description && (
                  <p className={styles.aiDescription}>
                    {form.description}
                  </p>
                )}

                <div className={styles.aiSummaryGrid}>
                  {form.capacity && (
                    <div className={styles.aiItem}>
                      <span className={styles.aiLabel}>추천 인원</span>
                      <span className={styles.aiValue}>
                        {form.capacity}명
                      </span>
                    </div>
                  )}
                  {form.unitAmount && (
                    <div className={styles.aiItem}>
                      <span className={styles.aiLabel}>1인당 소분량</span>
                      <span className={styles.aiValue}>
                        {form.unitAmount}
                        {form.unit === '직접 입력'
                          ? form.unitCustom
                          : form.unit}
                      </span>
                    </div>
                  )}
                  {form.containerAdvice && (
                    <div
                      className={styles.aiItem}
                      style={{ gridColumn: '1 / 3' }}
                    >
                      <span className={styles.aiLabel}>
                        보관 / 용기 안내
                      </span>
                      <span className={styles.aiValue}>
                        {form.containerAdvice}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 공구 제목 */}
              <div className={styles.formGroup}>
                <label>공구 제목</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="공구 제목을 입력해주세요."
                />
              </div>

              {/* 설명 */}
              <div className={styles.formGroup}>
                <label>상품 설명</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="공구 상품에 대한 설명을 입력해주세요."
                />
              </div>

              {/* 공구 인원 / 1인당 소분량 */}
              <div className={styles.formGroup}>
                <label>공구 인원 / 1인당 소분량</label>
                <div className={styles.horizontalInputs}>
                  <input
                    type="number"
                    name="capacity"
                    placeholder="공구 인원을 입력해주세요."
                    value={form.capacity}
                    onChange={handleChange}
                  />
                  <input
                    type="number"
                    name="unitAmount"
                    placeholder="1인당 소분량을 입력해주세요."
                    value={form.unitAmount}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* 가격 */}
              <div className={styles.formGroup}>
                <label>소분당 가격</label>
                <input
                  type="text"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="소분당 가격을 입력해주세요. (숫자만)"
                />
              </div>

              {/* 마감 기한 */}
              <div className={styles.formGroup}>
                <label>마감 기한</label>
                <input
                  type="date"
                  name="deadline"
                  className={`${styles.dateInput} ${
                    form.deadline ? styles.hasValue : ''
                  }`}
                  value={form.deadline}
                  onChange={handleChange}
                  min={minDeadline}
                  max={maxDeadline}
                />
              </div>

              {/* 거래 방법 */}
              <div className={styles.formGroup}>
                <label>거래 방법</label>
                <Dropdown
                  options={methodOptions}
                  selected={form.method || '거래 방법을 선택해주세요.'}
                  setSelected={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      method:
                        val === '거래 방법을 선택해주세요.' ? '' : val,
                    }))
                  }
                  placeholder="거래 방법을 선택해주세요."
                  variant="minimal"
                />
              </div>

              {/* 이미지 첨부 */}
              <div className={styles.formGroup}>
                <label>이미지 첨부 (최대 10장)</label>
                <div className={styles.imageUploadBox}>
                  <label
                    htmlFor="image-upload"
                    className={styles.uploadLabel}
                  >
                    이미지 선택
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    className={styles.hiddenFileInput}
                    onChange={handleImageChange}
                    multiple
                    accept="image/*"
                  />
                  {previewUrls.length > 0 && (
                    <div className={styles.imagePreviewGrid}>
                      {previewUrls.map((url, index) => (
                        <div
                          key={index}
                          className={styles.imageThumbnail}
                          onClick={() => handlePreviewClick(url)}
                        >
                          <img src={url} alt={`미리보기${index}`} />
                          <button
                            type="button"
                            className={styles.removeButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(index);
                            }}
                          >
                            <img src={removeIcon} alt="삭제" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 안내 + 체크 */}
              <div className={styles.noticeBox}>
                식품 등 관련 법령에 따라 인허가 또는 신고가 필요한 상품을
                판매하는 경우, 해당 법적 책임은 전적으로 판매자에게 있으며,
                플랫폼은 이에 대한 책임을 지지 않습니다.
                <div
                  className={styles.agreeRow}
                  onClick={handleCheckChange}
                >
                  <span>위 내용을 확인했어요.</span>
                  <img
                    src={isChecked ? checkedIcon : uncheckedIcon}
                    alt={isChecked ? '체크됨' : '체크 안됨'}
                  />
                </div>
              </div>

              {showWarning && (
                <p className={styles.warningText}>{warningMessage}</p>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={`${styles.formButton} ${styles.cancel}`}
                  onClick={() => setCurrentStep(1)}
                >
                  이전 단계
                </button>
                <button
                  type="submit"
                  className={`${styles.formButton} ${styles.submit}`}
                >
                  등록하기
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* 작성 취소 모달 */}
      {showCancelModal && (
        <GroupBuyModal
          message="글 작성을 취소하시겠습니까?"
          confirmText="작성 취소"
          cancelText="계속 작성"
          onCancel={handleCloseModal}
          onConfirm={handleConfirmCancel}
        />
      )}

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div
          className={styles.imageModalOverlay}
          onClick={handleCloseImgModal}
        >
          <div
            className={styles.imageModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseImgModal}
            >
              ✕
            </button>
            <img src={selectedImage} alt="확대 이미지" />
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupBuyNew;
