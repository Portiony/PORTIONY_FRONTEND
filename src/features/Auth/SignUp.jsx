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

  const handleSignup = () => setStep("done");

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

/* ============== 1단계 ============== */
function AccountStep({ form, setForm, onNext, checkUserId }) {
  const [idMsg, setIdMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwTouched, setPwTouched] = useState(false);
  const [pwCheckTouched, setPwCheckTouched] = useState(false);

  const idRegex = /^[a-zA-Z]{5,20}$/;
  const pwRegex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*?_])[A-Za-z\d!@#$%^&*?_]{8,20}$/;

  const handleIdCheck = async () => {
    if (!form.userId.trim()) {
      setIdMsg("아이디를 입력해주세요.");
      return;
    }
    if (!idRegex.test(form.userId)) {
      setIdMsg("아이디는 5~20자의 영문 대소문자만 가능합니다.");
      setForm((p) => ({ ...p, userIdOk: false }));
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
    } catch {
      setIdMsg("지금은 확인이 어려워요. 계속 진행할 수 있어요.");
      setForm((p) => ({ ...p, userIdOk: true }));
    }
  };

  const handlePasswordChange = (value) => {
    setPwTouched(true);
    setForm((p) => ({ ...p, password: value }));
    if (!pwRegex.test(value)) {
      setPwMsg("비밀번호는 8~20자, 대소문자·숫자·특수문자 조합이어야 합니다.");
    } else {
      setPwMsg("");
    }
  };

  const handlePasswordCheckChange = (value) => {
    setPwCheckTouched(true);
    setForm((p) => ({ ...p, passwordCheck: value }));
  };

  const passwordsMatch =
    form.password &&
    form.passwordCheck &&
    form.password === form.passwordCheck;

  // 🔥 여기만 느슨하게 바꿨어!
  // 아이디에 뭐가 있고, 비번 두 칸이 다 차면 다음으로 가능하게
  const canNext =
    form.userId.trim() !== "" &&
    form.password.trim() !== "" &&
    form.passwordCheck.trim() !== "";

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
            placeholder="아이디 (영문 5~20자)"
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
          onChange={(e) => handlePasswordChange(e.target.value)}
        />
        <input
          type="password"
          className={styles.input}
          placeholder="비밀번호 확인"
          value={form.passwordCheck}
          onChange={(e) => handlePasswordCheckChange(e.target.value)}
        />

        {pwCheckTouched && !passwordsMatch && (
          <p className={styles.errorText}>비밀번호가 일치하지 않습니다.</p>
        )}

        {!pwCheckTouched && pwTouched && pwMsg && (
          <p className={styles.infoText}>{pwMsg}</p>
        )}
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
      return;
    }
    try {
      const res = await checkPhone(form.phone.trim());
      if (res.data.exists) {
        setPhoneMsg("이미 가입된 번호입니다.");
      } else {
        setPhoneMsg("사용 가능한 번호입니다.");
      }
    } catch {
      setPhoneMsg("지금은 확인이 어려워요. 계속 진행할 수 있어요.");
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
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>전화번호</label>
        <div className={styles.inputWithBtn}>
          <input
            className={styles.input}
            placeholder="전화번호"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
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

/* ============== 3단계 ============== */
function LocationStep({ form, setForm, onNext, searchIcon }) {
  const dummyList = form.locationKeyword
    ? [`${form.locationKeyword} 1동`, `${form.locationKeyword} 2동`]
    : ["노원구 공릉동", "노원구 상계동", "도봉구 창동"];

  const handleSelectDong = (dong) =>
    setForm((p) => ({ ...p, selectedDong: dong }));

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

/* ============== 4단계 ============== */
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
