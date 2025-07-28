import React, { useState, useRef } from 'react';
import styles from './SignupForms.module.css';
import { useNavigate } from 'react-router-dom';
import { useSignup } from './SignupContext'; // Context import
import axios from 'axios';

import defaultProfileImage from '../../../assets/profile-image.svg';
import back from '../../../assets/chevron-left.svg';
import requiredIcon from '../../../assets/required.svg';
import close from '../../../assets/x.svg';
import DropDownForm from '../../../components/DropDown/DropDownForm';

const domainOptions = ['직접 입력', 'gmail.com', 'naver.com', 'daum.net', 'hanmail.net','test.com(이메일중복문구 확인용 테스트도메인)'];

function SignupForms({ onNext, onBack }) {
  const { setSignupData } = useSignup(); // Context setter 불러오기
  const fileInputRef = useRef(null);

  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [domainType, setDomainType] = useState('직접 입력');
  const [emailValid, setEmailValid] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordCheckMessage, setPasswordCheckMessage] = useState('');
  const [passwordCheckError, setPasswordCheckError] = useState(false);

  const [nickname, setNickname] = useState('');
  const [nicknameValid, setNicknameValid] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [nicknameError, setNicknameError] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const fullEmail = `${emailId}@${domainType === '직접 입력' ? emailDomain : domainType}`;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    setSelectedFile(null);
  };

  const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailCheck = async () => {
    const email = `${emailId}@${domainType === '직접 입력' ? emailDomain : domainType}`;

    if (!isValidEmailFormat(email)) {
        setEmailValid(false);
        setEmailMessage('이메일 형식이 올바르지 않습니다.');
        setEmailError(true);
        return;
    }

    try {
        const res = await axios.get(`/api/users/signup/check-email`, {
          params: { email }
        });

        if (res.data.exists) {
          setEmailValid(false);
          setEmailMessage('이미 사용 중인 이메일입니다.');
          setEmailError(true);
        } else {
          setEmailValid(true);
          setEmailMessage('사용 가능한 이메일입니다.');
          setEmailError(false);
        }
    } catch (err) {
        console.error('중복 확인 에러:', err); //
        setEmailValid(false);
        setEmailMessage('이메일 중복 확인에 실패했습니다.');
        setEmailError(true);
    }

  };

  const handleNicknameCheck = async () => {
    try {
      const res = await axios.get(`/api/users/signup/check-nickname`, {
        params: { nickname }
      });

      if (res.data.exists) {
        setNicknameValid(false);
        setNicknameMessage('이미 사용 중인 닉네임입니다.');
        setNicknameError(true);
      } else {
        setNicknameValid(true);
        setNicknameMessage('사용 가능한 닉네임입니다.');
        setNicknameError(false);
      }
    } catch (err) {
      console.error('[닉네임 중복 확인 실패]', err);
      setNicknameValid(false);
      setNicknameMessage('닉네임 중복 확인에 실패했습니다.');
      setNicknameError(true);
    }
  };


  const validatePassword = (pw) => {
    const hasLetter = /[a-zA-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const isValid = pw.length >= 8 && hasLetter && hasNumber;

    if (!pw) {
      setPasswordMessage('');
      setPasswordError(false);
      return false;
    }

    if (!isValid) {
      setPasswordMessage('비밀번호는 영문과 숫자를 포함한 8자 이상이어야 합니다.');
      setPasswordError(true);
      return false;
    }

    setPasswordMessage('사용 가능한 비밀번호입니다.');
    setPasswordError(false);
    return true;
  };

  const isNextValid = () => {
    return (
      emailId &&
      (domainType !== '직접 입력' || emailDomain) &&
      emailValid &&
      password &&
      !passwordError &&
      password === passwordCheck &&
      !passwordCheckError &&
      nickname &&
      nicknameValid
    );
  };

  const handleNext = () => {
    setSignupData(prev => ({
      ...prev,
      email: fullEmail,
      password,
      nickname,
      profileImage: selectedFile
    }));

    onNext(); // 다음 단계로 이동
  };

  return (
    <>
      <div className={styles.allContainer}>
        <div className={styles.backWrapper}>
          <img src={back} onClick={onBack} className={styles.backIcon} alt="뒤로가기" />
          <span className={styles.signupTitle}>회원가입</span>
        </div>

        {/* 프로필 사진 */}
        <div className={styles.profileImageWrapper}>
          <div className={styles.imageWrapper}>
            <img src={profileImage || defaultProfileImage} alt="프로필" className={styles.profileImage} />
            {profileImage && (
              <img src={close} alt="삭제" className={styles.xIcon} onClick={removeProfileImage} />
            )}
          </div>
          <div className={styles.uploadButton} onClick={() => fileInputRef.current.click()}>
            프로필 사진 등록
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>

      <div className={styles.inputFormWrapper}>
        <div className={styles.formGroup}>
          {/* 이메일 */}
          <label className={styles.formLabel}>이메일<img src={requiredIcon} className={styles.requiredIcon}/> </label>

          <div className={styles.emailRow}>
            <input
              className={`${styles.inputForm}  ${styles.domainInputForm} ${emailError ? styles.errorBorder : ''}`}
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              placeholder="이메일을 입력해주세요."/>

              <span>@</span>

              {domainType === '직접 입력' ? (
                <input
                    className={`${styles.inputForm} ${styles.domainInputForm} ${emailError ? styles.errorBorder : ''}`}
                    value={emailDomain}
                    onChange={(e) => setEmailDomain(e.target.value)}
                    placeholder="도메인을 입력해주세요."/>
                ) : (
                <input
                  className={`${styles.inputForm} ${styles.domainInputForm} ${emailError ? styles.errorBorder : ''}`}
                  value={domainType} readOnly/>
                )
              }

              <DropDownForm
                value={domainType}
                onChange={setDomainType}
                options={domainOptions}
              />

              <button className={styles.validButton} onClick={handleEmailCheck}> <span>중복 확인</span> </button>
            </div>

            {emailMessage && (
              <span className={emailError ? styles.errorText : styles.successText}>
                {emailMessage}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            {/* 비밀번호 */}
            <label className={styles.formLabel}>비밀번호<img src={requiredIcon} className={styles.requiredIcon}/> </label>

            <div className={styles.passwordRow}>
              <input
                className={`${styles.inputForm} ${passwordError ? styles.errorBorder : ''}`}
                type="password"
                value={password}
                placeholder="영문, 숫자 포함 8자 이상 입력해주세요."
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  validatePassword(value);
                }}/>

              {passwordMessage && (
              <span className={passwordError ? styles.errorText : styles.successText}>
                {passwordMessage}
              </span>
            )}

              <input
                className={`${styles.inputForm} ${passwordCheckError ? styles.errorBorder : ''}`}
                type="password"
                value={passwordCheck}
                placeholder="비밀번호를 다시 입력해주세요."
                onChange={(e) => {
                  const value = e.target.value;
                  setPasswordCheck(value);

                  if (password && value !== password) {
                    setPasswordCheckMessage('비밀번호가 다릅니다.');
                    setPasswordCheckError(true);
                  } else {
                    setPasswordCheckMessage('사용 가능한 비밀번호입니다.');
                    setPasswordCheckError(false);
                  }
                }}/>
            </div>

            {passwordCheckMessage && (
              <span className={passwordCheckError ? styles.errorText : styles.successText}>
                {passwordCheckMessage}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            {/* 닉네임 */}
            <label className={styles.formLabel}>닉네임<img src={requiredIcon} className={styles.requiredIcon}/></label>

            <div className={styles.nicknameRow}>
              <input
                className={`${styles.inputForm} ${nicknameError ? styles.errorBorder : ''}`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력해주세요."/>

              <button className={styles.validButton} onClick={handleNicknameCheck}><span>중복 확인</span></button>
            </div>

            {nicknameMessage && (
              <span className={nicknameError ? styles.errorText : styles.successText}>
                {nicknameMessage}
              </span>
            )}
          </div>
        </div>

        {/* 다음 버튼 */}
        <button type="button" className={styles.nextButton} onClick={handleNext} disabled={!isNextValid()}>
            <span>다음</span>
        </button>
      </div>
    </>
  );
};

export default SignupForms;
