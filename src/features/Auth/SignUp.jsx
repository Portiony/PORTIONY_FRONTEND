import React, { useState, useEffect } from 'react'; 
import SignupTerms from './Signup/SignupTerms';
import SignupForms from './Signup/SignupForms';
import SignupLocation from './Signup/SignupLocation';
import SignupSurvey from './Signup/SignupSurvey';
import SignupDone from './Signup/SignupDone';
import { SignupProvider, useSignup } from './Signup/SignupContext.js';
import { useLocation } from 'react-router-dom';


const SignUp = ({ initialStep = 1 }) => {

  return (
    <SignupProvider>
      <SignUpInner initialStep={initialStep} />
    </SignupProvider>
  );
};

const SignUpInner = ({ initialStep }) => {
  const [step, setStep] = useState(initialStep);
  const location = useLocation();
  const { setSignupData } = useSignup();

  useEffect(() => {
    if (initialStep === 3 && location.state) {
      const { email, nickname, profileImage } = location.state;
      setSignupData(prev => ({
        ...prev,
        email,
        nickname,
        profileImage,
      }));
    }
  }, [initialStep, location.state, setSignupData]);


  const goToNextStep = () => setStep((s) => s + 1);
  const goToBeforeStep = () => setStep((s) => s - 1);

  return (
      <SignupProvider>
        <div>
          {step === 1 && <SignupTerms onNext={goToNextStep} />}
          {step === 2 && <SignupForms onNext={goToNextStep} onBack={goToBeforeStep} />}
          {step === 3 && <SignupLocation onNext={goToNextStep} onBack={goToBeforeStep} />}
          {step === 4 && <SignupSurvey onNext={goToNextStep} onBack={goToBeforeStep} />}
          {step === 5 && <SignupDone />}
        </div>
      </SignupProvider>
    );
};

export default SignUp;
