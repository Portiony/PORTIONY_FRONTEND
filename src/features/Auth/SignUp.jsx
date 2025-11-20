import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../lib/axios";        
import axiosRaw from "axios";               
import styles from "./SignUp.module.css";
import back from "../../assets/chevron-left.svg";
import logo from "../../assets/logo.svg";
import searchIcon from "../../assets/search.svg";

const STEP_ORDER = ["account", "userInfo", "location", "done"];

const locationAxios = axiosRaw.create({
  baseURL: "https://port-0-portiony-be-md4272k5c4648749.sel5.cloudtype.app",
  timeout: 5000,
});

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
    selectedAddress: "",
    region: "",
    subregion: "",
    dong: "",
  });

  const [submitError, setSubmitError] = useState("");
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
    axios.get("/api/users/signup/check-id", {
      params: { id: userId },
    });

  const checkPhone = (phone) =>
    axios.get("/api/users/signup/check-phone", { params: { phone } });

  const handleSignup = async () => {
    try {
      setSubmitError("");

      const body = {
        email: form.userId,
        password: form.password,
        nickname: form.name,
        phone: form.phone,
        region: form.region,
        subregion: form.subregion,
        dong: form.dong,
      };

      await axios.post("/api/users/signup", body);

      setStep("done");
    } catch (error) {
      console.error("회원가입 실패:", error.response?.data || error.message);
      const msg =
        error.response?.data?.message ||
        "회원가입 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
      setSubmitError(msg);
    }
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

          {submitError && step !== "done" && (
            <p className={styles.submitError}>{submitError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

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
    if (!idRegex.test(form.userId.trim())) {
      setIdMsg("아이디는 5~20자의 영문 대소문자만 가능합니다.");
      setForm((p) => ({ ...p, userIdOk: false }));
      return;
    }

    try {
      const res = await checkUserId(form.userId.trim());
      console.log("check-id response:", res.data);

      const data = res.data || {};
      const values = Object.values(data);
      const exists = values.some((v) => v === true);

      if (exists) {
        setIdMsg("이미 사용 중인 아이디입니다.");
        setForm((p) => ({ ...p, userIdOk: false }));
      } else {
        setIdMsg("사용 가능한 아이디입니다.");
        setForm((p) => ({ ...p, userIdOk: true }));
      }
    } catch (error) {
      console.error("아이디 중복 확인 실패:", error.response?.data || error);
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
function LocationStep({ form, setForm, onNext, searchIcon }) {
  const [locationList, setLocationList] = useState([]);
  const [locationMsg, setLocationMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const dummyList = ["노원구 공릉동", "노원구 상계동", "도봉구 창동"];

  const handleSelectLocation = (loc) => {
    const address = loc.address;
    const parts = address.split(" "); 
    const region = parts[0] || "";
    const subregion = parts[1] || "";
    const dong = parts[2] || parts[parts.length - 1] || "";

    setForm((p) => ({
      ...p,
      selectedAddress: address,
      region,
      subregion,
      dong,
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMsg("브라우저에서 위치 정보를 지원하지 않아요.");
      return;
    }

    setLoading(true);
    setLocationMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const res = await locationAxios.get("/api/location/resolve", {
            params: {
              latitude,
              longitude,
              page: 1,
              size: 10,
            },
          });

          const data = res.data || {};
          const currentAddress = data.currentAddress || "";

          if (!currentAddress) {
            setLocationMsg(
              "현재 위치 정보를 가져오지 못했어요. 검색으로 동네를 선택해 주세요."
            );
            setLocationList([]);
            setLoading(false);
            return;
          }

          const parts = currentAddress.split(" ");
          const last = parts[parts.length - 1] || "";
          let dongKeyword = last.replace(/동$/, ""); 

          if (!dongKeyword) {
            setLocationMsg(
              "현재 위치 기준으로 찾을 수 있는 동네가 없어요. 검색으로 동네를 선택해 주세요."
            );
            setLocationList([]);
            setLoading(false);
            return;
          }

          try {
            const searchRes = await locationAxios.get("/api/location/search", {
              params: {
                keyword: dongKeyword,
                page: 1,
                size: 10,
              },
            });

            const searchList = searchRes.data || [];
            if (searchList.length > 0) {
              setLocationMsg(`현재 위치: ${currentAddress}`);
              setLocationList(searchList);
            } else {
              setLocationMsg(
                "현재 위치 기준으로 행정동 정보를 찾지 못했어요. 검색으로 동네를 선택해 주세요."
              );
              setLocationList([]);
            }
          } catch (e) {
            console.error(
              "현재 위치 기반 행정동 검색 실패:",
              e.response?.data || e
            );
            setLocationMsg(
              "현재 위치 기준 행정동 검색 중 오류가 발생했어요. 검색으로 동네를 선택해 주세요."
            );
            setLocationList([]);
          } finally {
            setLoading(false);
          }
        } catch (error) {
          console.error(
            "현재 위치 동네 조회 실패:",
            error.response?.data || error
          );
          setLocationMsg(
            "현재 위치를 불러오지 못했어요. 검색으로 동네를 선택해 주세요."
          );
          setLocationList([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error("geolocation error:", err);
        setLocationMsg(
          "위치 권한이 거부되었어요. 검색으로 동네를 선택해 주세요."
        );
        setLoading(false);
      }
    );
  };

  const handleSearch = async () => {
    if (!form.locationKeyword.trim()) {
      setLocationMsg("검색어를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setLocationMsg("");

      const res = await locationAxios.get("/api/location/search", {
        params: {
          keyword: form.locationKeyword.trim(),
          page: 1,
          size: 10,
        },
      });

      const list = res.data || [];
      if (list.length === 0) {
        setLocationMsg("검색 결과가 없어요. 다른 검색어를 시도해 주세요.");
      } else {
        setLocationMsg(`검색 결과 ${list.length}개를 불러왔어요.`);
      }
      setLocationList(list);
    } catch (error) {
      console.error("동네 검색 실패:", error.response?.data || error);
      setLocationMsg(
        "검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderedList =
    locationList.length > 0
      ? locationList
      : dummyList.map((address, idx) => ({
          address,
          dongId: idx,
          regionId: null,
          subregionId: null,
        }));

  const canComplete = !!form.selectedAddress;

  return (
    <>
      <div className={styles.descBox}>
        <p>현재 위치로 내 동네를 설정해보세요</p>
      </div>

      <div className={styles.locationTopRow}>
        <button
          className={styles.locationYellowBtn}
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loading}
        >
          {loading ? "불러오는 중..." : "현재 위치로 찾기"}
        </button>

        <div className={styles.searchBox}>
          <input
            className={styles.searchInput}
            placeholder="동(면, 읍)으로 검색 (ex. 서초동)"
            value={form.locationKeyword}
            onChange={(e) =>
              setForm((p) => ({ ...p, locationKeyword: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <img
            src={searchIcon}
            alt="검색"
            className={styles.searchIcon}
            onClick={handleSearch}
          />
        </div>
      </div>

      {locationMsg && (
        <p className={styles.infoText} style={{ marginTop: "8px" }}>
          {locationMsg}
        </p>
      )}

      <div className={styles.locationListBox}>
        {renderedList.map((loc) => (
          <div
            key={`${loc.address}-${loc.dongId}`}
            className={`${styles.locationItem} ${
              form.selectedAddress === loc.address
                ? styles.locationItemActive
                : ""
            }`}
            onClick={() => handleSelectLocation(loc)}
          >
            {loc.address}
          </div>
        ))}
      </div>

      {form.selectedAddress && (
        <div className={styles.locationConfirmBox}>
          <span className={styles.locationConfirmText}>
            {form.selectedAddress} 으로 시작하시겠어요?
          </span>
        </div>
      )}

      <button
        className={styles.bottomBtn}
        onClick={onNext}
        disabled={!canComplete}
      >
        완료하기
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
