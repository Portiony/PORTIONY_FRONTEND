import React, { createContext, useContext, useState } from 'react';

// 초기 데이터 구조
const initialSignupData = {
  email: '',
  password: '',
  nickname: '',
  profileImage: '',
  agreementIds: [],
  regionId: 0,
  subregionId: 0,
  dongId: 0,
  mainCategory: 0,
  purchaseReason: 0,
  situation: 0,
};

const SignupContext = createContext(null);

export const SignupProvider = ({ children }) => {
  const [signupData, setSignupData] = useState(initialSignupData);

  return (
    <SignupContext.Provider value={{ signupData, setSignupData }}>
      {children}
    </SignupContext.Provider>
  );
};

// 사용할 때 이걸 import해서 쓰면 됨
export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
};
