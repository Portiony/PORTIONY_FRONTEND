import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import styles from "./SignUp.module.css";
import back from "../../assets/chevron-left.svg";
import logo from "../../assets/logo.svg";
import searchIcon from "../../assets/search.svg";

const STEP_ORDER = ["account", "userInfo", "location", "done"];

export default function Signup() {
  const [step, setStep] = useState("account");
  const [form, setForm] = useState({
    userId: "",
    userIdOk: false,
    password: "",
    passwordCheck: "",
    name: "",
    phone: "",
    phoneOk: false,
    locationKeyword: "",
    selectedDong: "",
  });

  const navigate = useNavigate();

  const goNext = () => {
    const next = STEP_ORDER[STEP_ORDER.indexOf(step) + 1];
    if (next) setStep(next);
  };

  const goPrev = () => {
    const prev = STEP_ORDER[STEP_ORDER.indexOf(step) - 1];
    if (prev) setStep(prev);
  };

  const checkUserId = (userId) =>
    axios.get("/api/users/signup/check-id", { params: { userId } });

  const checkPhone = (phone) =>
    axios.get("/api/users/signup/check-phone", { params: { phone } });

  const handleSignup = () => {
    setStep("done");
  };

  return (
    <div className={styles.screen}>
      <div className={styles.phone}>
        {step !== "done" && (
          <div className={styles.topBar}>
            <img
              src={back}
              alt="뒤로가기"
              className={styles.backIcon}
              onClick={() => {
                if (step === "account") navigate(-1);
                else goPrev();
              }}
            />
            <span className={styles.topTitle}>회원가입</span>
          </div>
        )}

        <div className={styles.inner}>
          {step === "account" && (
            <AccountStep
              form={form}
              setForm={setForm}
              onNext={goNext}
              checkUserId={checkUserId}
            />
          )}

          {step === "userInfo" && (
            <UserInfoStep
              form={form}
              setForm={setForm}
              onNext={goNext}
              checkPhone={checkPhone}
            />
          )}

          {step === "location" && (
            <LocationStep
              form={form}
              setForm={setForm}
              onNext={handleSignup}
              searchIcon={searchIcon}
            />
          )}

          {step === "done" && <DoneStep onGoHome={() => navigate("/")} />}
        </div>
      </div>
    </div>
  );
}

function AccountStep({ form, setForm, onNext, checkUserId }) {
  const [idMsg, setIdMsg] = useState("");

  const handleIdCheck = async () => {
    if (!form.userId.trim()) {
      setIdMsg("아이디를 입력해주세요.");
      return;
    }
    try {
      const res = await checkUserId(form.userId.trim());
      if (res.data.exists) {
        setIdMsg("이미 사용 중인 아이디입니다.");
        setForm((p) => ({ ...p, userIdOk: false }));
      } else {
        setIdMsg("사용 가능한 아이디입니다.");
        setForm((p) => ({ ...p, userIdOk: true }));
      }
    } catch (e) {
      setIdMsg("지금은 확인이 어려워요. 계속 진행할 수 있어요.");
      setForm((p) => ({ ...p, userIdOk: true }));
    }
  };

  const canNext =
    form.userId.trim() !== "" &&
    form.password.length >= 8 &&
    form.password === form.passwordCheck;

  return (
    <>
      <div className={styles.descBox}>
        <p>Portiony에서 소식을 만나보세요.</p>
        <p>여정을 위한 첫걸음이에요.</p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>아이디</label>
        <div className={styles.inputWithBtn}>
          <input
            className={styles.input}
            placeholder="아이디"
            value={form.userId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                userId: e.target.value,
                userIdOk: false,
              }))
            }
          />
          <button className={styles.smallYellowBtn} onClick={handleIdCheck}>
            중복 확인
          </button>
        </div>
        {idMsg && <p className={styles.infoText}>{idMsg}</p>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>비밀번호</label>
        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호"
          value={form.password}
          onChange={(e) =>
            setForm((p) => ({ ...p, password: e.target.value }))
          }
        />
        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호 확인"
          value={form.passwordCheck}
          onChange={(e) =>
            setForm((p) => ({ ...p, passwordCheck: e.target.value }))
          }
        />
      </div>

      <button
        className={styles.bottomBtn}
        onClick={onNext}
        disabled={!canNext}
      >
        다음으로
      </button>
    </>
  );
}

function UserInfoStep({ form, setForm, onNext, checkPhone }) {
  const [phoneMsg, setPhoneMsg] = useState("");

  const handlePhoneCheck = async () => {
    if (!form.phone.trim()) {
      setPhoneMsg("전화번호를 입력해주세요.");
      setForm((p) => ({ ...p, phoneOk: false }));
      return;
    }
    try {
      const res = await checkPhone(form.phone.trim());
      if (res.data.exists) {
        setPhoneMsg("이미 가입된 번호입니다.");
        setForm((p) => ({ ...p, phoneOk: false }));
      } else {
        setPhoneMsg("사용 가능한 번호입니다.");
        setForm((p) => ({ ...p, phoneOk: true }));
      }
    } catch (e) {
      setPhoneMsg("지금은 확인이 어려워요. 계속 진행할 수 있어요.");
      setForm((p) => ({ ...p, phoneOk: true }));
    }
  };

  const canNext = form.name.trim() && form.phone.trim();

  return (
    <>
      <div className={styles.descBox}>
        <p>사용자 식별을 위한 기본 정보를 입력해주세요.</p>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>이름</label>
        <input
          className={styles.input}
          placeholder="이름"
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value }))
          }
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>전화번호</label>
        <div className={styles.inputWithBtn}>
          <input
            className={styles.input}
            placeholder="전화번호"
            value={form.phone}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                phone: e.target.value,
              }))
            }
          />
          <button className={styles.smallYellowBtn} onClick={handlePhoneCheck}>
            중복 확인
          </button>
        </div>
        {phoneMsg && <p className={styles.infoText}>{phoneMsg}</p>}
      </div>

      <button
        className={styles.bottomBtn}
        onClick={onNext}
        disabled={!canNext}
      >
        다음으로
      </button>
    </>
  );
}

function LocationStep({ form, setForm, onNext, searchIcon }) {
  const dummyList = form.locationKeyword
    ? [`${form.locationKeyword} 1동`, `${form.locationKeyword} 2동`]
    : ["노원구 공릉동", "노원구 상계동", "도봉구 창동"];

  const handleSelectDong = (dong) => {
    setForm((p) => ({ ...p, selectedDong: dong }));
  };

  return (
    <>
      <div className={styles.descBox}>
        <p>현재 위치로 내 동네를 설정해보세요</p>
      </div>

      <div className={styles.locationTopRow}>
        <button className={styles.locationYellowBtn}>현재 위치로 찾기</button>
        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            placeholder="동(면, 읍)으로 검색 (ex. 서초동)"
            value={form.locationKeyword}
            onChange={(e) =>
              setForm((p) => ({ ...p, locationKeyword: e.target.value }))
            }
          />
          <img src={searchIcon} alt="검색" className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.locationListBox}>
        {dummyList.map((dong) => (
          <div
            key={dong}
            className={`${styles.locationItem} ${
              form.selectedDong === dong ? styles.locationItemActive : ""
            }`}
            onClick={() => handleSelectDong(dong)}
          >
            {dong}
          </div>
        ))}
      </div>

      {form.selectedDong && (
        <div className={styles.locationConfirmBox}>
          <span className={styles.locationConfirmText}>
            {form.selectedDong} 으로 시작하시겠어요?
          </span>
        </div>
      )}

      <button
        className={styles.bottomBtn}
        onClick={onNext}
        disabled={!form.selectedDong}
      >
        다음으로
      </button>
    </>
  );
}

function DoneStep({ onGoHome }) {
  return (
    <div className={styles.doneWrapper}>
      <div className={styles.doneCenter}>
        <img src={logo} alt="Portiony" className={styles.doneLogo} />
        <p className={styles.doneMain}>회원가입이 완료되었습니다.</p>
      </div>

      <div className={styles.doneBottom}>
        <p className={styles.doneSub}>Portiony에 오신 걸 환영해요.</p>
        <button className={styles.bottomBtn} onClick={onGoHome}>
          시작하기
        </button>
      </div>
    </div>
  );
}
