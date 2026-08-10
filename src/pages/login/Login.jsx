import API from "../../api/axios";

// ---------------- LOGIN VALIDATION ----------------
export const validateLogin = (data) => {
  const errors = {};
  if (!data.id?.trim()) errors.id = "ID is required";
  if (!data.password) errors.password = "Password is required";
  return { isValid: Object.keys(errors).length === 0, errors };
};

// ---------------- LOGIN ----------------
export const loginUser = async (loginFn, credentials) => {
  try {
    const res = await loginFn(credentials);
    return { success: true, data: res };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Invalid credentials. Please try again.",
    };
  }
};

// ---------------- FORGOT PASSWORD LOGIC ----------------
const sendOtpCode = async (employeeCode, mobile) => {
  if (!mobile?.trim()) return { success: false, message: "Mobile number is required" };
  try {
    const res = await API.post("/api/auth/send-otp", { employeeCode, mobile });
    return { success: true, message: res.data?.message || "OTP sent successfully" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Failed to send OTP" };
  }
};

const verifyOtpCode = async (employeeCode, otp) => {
  if (!otp) return { success: false, message: "OTP is required" };
  try {
    const res = await API.post("/api/auth/verify-otp", { employeeCode, otp });
    return { success: true, message: res.data?.message || "OTP verified successfully" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Invalid or expired OTP" };
  }
};

const resetPasswordCode = async (employeeCode, otp, newPassword, confirmPassword) => {
  if (!newPassword || !confirmPassword) return { success: false, message: "Please fill all fields" };
  if (newPassword.length < 6) return { success: false, message: "Password too short" };
  if (newPassword !== confirmPassword) return { success: false, message: "Passwords do not match" };
  try {
    const res = await API.post("/api/auth/reset-password", { employeeCode, otp, newPassword });
    return { success: true, message: res.data?.message || "Password changed successfully" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error resetting password" };
  }
};


// ─────────────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Footer';
import loginLogo from '../../assets/Aditya University Gold Logo.png';
import './Login.css';

// ── Password Eye Icons ──
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
// ── Custom SVGs for OTP Signup Flow ──
const UserPlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="16" y1="11" x2="22" y2="11" />
  </svg>
);
const BankIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 22h18" />
    <path d="M6 18v-7" />
    <path d="M10 18v-7" />
    <path d="M14 18v-7" />
    <path d="M18 18v-7" />
    <path d="M4 11h16L12 3z" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const ShieldCheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 11 2 2 4-4" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const ReloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M16 3h5v5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 21H3v-5" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function Login({ defaultSignUp = false }) {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ── panel toggle ──
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [isForgot, setIsForgot] = useState(false);

  // Sync state with active route
  useEffect(() => {
    if (location.pathname === '/signup') {
      setIsSignUp(true);
      setIsForgot(false);
    } else {
      setIsSignUp(false);
      setIsForgot(false);
    }
    resetSignUpState();
  }, [location.pathname]);

  // ── signup state ──
  const [signupStep, setSignupStep] = useState(1);
  const [signupData, setSignupData] = useState({
    institutionId: '',
    email: '',
    password: '',
    confirmPassword: '',
    coreDepartment: ''
  });
  const [signupDetails, setSignupDetails] = useState({
    fullname: '',
    department: '',
    designation: '',
    phone: ''
  });
  const [signupMsg, setSignupMsg] = useState({ text: '', type: '' });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupOtp, setSignupOtp] = useState('');
  const [signupSignature, setSignupSignature] = useState('');
  const [signupExpiry, setSignupExpiry] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [departments, setDepartments] = useState([]);
  const [allPublicDepartments, setAllPublicDepartments] = useState([]);
  const [isServingDeptSelectOpen, setIsServingDeptSelectOpen] = useState(false);
  const servingDeptSelectRef = useRef(null);

  const resetSignUpState = () => {
    setSignupStep(1);
    setIsOtpVerified(false);
    setSignupData({
      institutionId: '',
      email: '',
      password: '',
      confirmPassword: '',
      coreDepartment: ''
    });
    setSignupDetails({
      fullname: '',
      department: '',
      designation: '',
      phone: ''
    });
    setSignupOtp('');
    setSignupSignature('');
    setSignupExpiry('');
    setOtpDigits(['', '', '', '', '', '']);
    setDepartments([]);
    setAllPublicDepartments([]);
    setIsServingDeptSelectOpen(false);
    setSignupMsg({ text: '', type: '' });
  };

  useEffect(() => {
    if (isOtpVerified) {
      API.get("/api/employees/public-departments")
        .then(res => {
          if (res.data?.success) {
            const allDepts = res.data.data || [];
            setAllPublicDepartments(allDepts);
            const fedDepts = allDepts.filter(dept => 
              /^(fed-1|fed-2|fed-3|fed-4|fed-5)$/i.test(dept.name.trim()) ||
              /^(fed-1|fed-2|fed-3|fed-4|fed-5)$/i.test(dept.code.trim())
            );
            setDepartments(fedDepts);
          }
        })
        .catch(err => {
          console.error("Error fetching departments:", err);
        });
    }
  }, [isOtpVerified]);

  // ── login state ──
  const [loginData, setLoginData] = useState({ id: '', password: '' });
  const [loginMsg, setLoginMsg] = useState({ text: '', type: '' });

  // Read empId from URL if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const empIdFromUrl = params.get('empId');
    if (empIdFromUrl) {
      setLoginData(prev => ({ ...prev, id: empIdFromUrl }));
    }
  }, [location.search]);

  // ── forgot password state ──
  const [fpStep, setFpStep] = useState(1);
  const [isIdValid, setIsIdValid] = useState(false);
  const [fpData, setFpData] = useState({
    id: '',
    mobile: '',
    otp: '',
    newPass: '',
    confirmPass: ''
  });
  const [fpMsg, setFpMsg] = useState({ text: '', type: '' }); // type: error or success
  const [idValidMsg, setIdValidMsg] = useState('');
  const [forgotAnimClass, setForgotAnimClass] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleRef = useRef(null);
  const [isDeptSelectOpen, setIsDeptSelectOpen] = useState(false);
  const deptSelectRef = useRef(null);

  // ── password visibility states ──
  const [showLogPass, setShowLogPass] = useState(false);
  const [showSignPass, setShowSignPass] = useState(false);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [showResetPass, setShowResetPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const animClasses = [
    'anim-slide-in-top', 'anim-slide-in-bottom', 'anim-slide-in-left', 'anim-slide-in-right',
    'anim-slide-in-tl', 'anim-slide-in-tr', 'anim-slide-in-bl', 'anim-slide-in-br'
  ];

  const resetForgotPasswordState = () => {
    setFpStep(1);
    setIsIdValid(false);
    setFpData({
      id: '',
      email: '',
      otp: '',
      newPass: '',
      confirmPass: ''
    });
    setFpMsg({ text: '', type: '' });
    setIdValidMsg('');
    setShowResetPass(false);
    setShowResetConfirm(false);
  };

  const handleForgotClick = (e) => {
    e.preventDefault();
    setIsSignUp(true);
    setIsForgot(true);
    resetForgotPasswordState();
  };

  // ── handle click outside for custom select dropdowns ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setIsRoleOpen(false);
      }
      if (deptSelectRef.current && !deptSelectRef.current.contains(e.target)) {
        setIsDeptSelectOpen(false);
      }
      if (servingDeptSelectRef.current && !servingDeptSelectRef.current.contains(e.target)) {
        setIsServingDeptSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleForgot = () => {
    setIsSignUp(false);
    setIsForgot(false);
    resetForgotPasswordState();
  };

  const handleOtpDigitChange = (index, value) => {
    if (value && isNaN(value)) return; // Allow only numbers
    const newDigits = [...otpDigits];
    newDigits[index] = value.substring(value.length - 1); // take only last character
    setOtpDigits(newDigits);
    setSignupOtp(newDigits.join('')); // sync with string state for backend submit

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newDigits = [...otpDigits];
          newDigits[index - 1] = '';
          setOtpDigits(newDigits);
          setSignupOtp(newDigits.join(''));
        }
      }
    }
  };

  // ── signup handlers ──
  const handleVerifySignUpId = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!signupData.institutionId.trim()) {
      setSignupMsg({ text: "Institution ID is required", type: "error" });
      return;
    }
    setSignupMsg({ text: '', type: '' });
    setSignupLoading(true);

    try {
      const res = await API.post("/api/employees/send-signup-otp", {
        institutionId: signupData.institutionId.trim()
      });

      const { signature, expiry, details } = res.data;

      setSignupSignature(signature);
      setSignupExpiry(expiry);
      setSignupDetails({
        fullname: details.fullname,
        department: details.department,
        designation: details.designation,
        phone: details.phone
      });
      setSignupMsg({ text: "OTP sent successfully to your registered mobile number", type: "success" });
    } catch (err) {
      console.error("Signup OTP Send Error:", err);
      setSignupMsg({
        text: err.response?.data?.message || "Failed to send OTP. Please check ID or try again.",
        type: "error"
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleVerifySignUpOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!signupOtp.trim()) {
      setSignupMsg({ text: "OTP is required", type: "error" });
      return;
    }
    setSignupMsg({ text: '', type: '' });
    setSignupLoading(true);

    try {
      const res = await API.post("/api/employees/verify-signup-otp", {
        institutionId: signupData.institutionId.trim(),
        phone: signupDetails.phone,
        otp: signupOtp.trim(),
        signature: signupSignature,
        expiry: signupExpiry
      });

      if (res.data?.success) {
        setSignupMsg({ text: '', type: '' });
        setIsOtpVerified(true);
      } else {
        setSignupMsg({ text: res.data?.message || "OTP verification failed", type: "error" });
      }
    } catch (err) {
      console.error("Signup OTP Verification Error:", err);
      setSignupMsg({
        text: err.response?.data?.message || "Invalid or expired OTP. Please try again.",
        type: "error"
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    
    if (!signupData.email.trim()) {
      setSignupMsg({ text: "Email ID is required", type: "error" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email.trim())) {
      setSignupMsg({ text: "Please enter a valid email address", type: "error" });
      return;
    }
    if (!signupDetails.department) {
      setSignupMsg({ text: "Serving Department is required", type: "error" });
      return;
    }
    if (!signupData.coreDepartment) {
      setSignupMsg({ text: "Parent Department is required", type: "error" });
      return;
    }
    if (!signupData.password) {
      setSignupMsg({ text: "Password is required", type: "error" });
      return;
    }
    if (signupData.password.length < 6) {
      setSignupMsg({ text: "Password must be at least 6 characters long", type: "error" });
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setSignupMsg({ text: "Passwords do not match", type: "error" });
      return;
    }

    setSignupMsg({ text: '', type: '' });
    setSignupLoading(true);

    try {
      await signup({
        fullname: signupDetails.fullname,
        id: signupData.institutionId.trim(),
        department: signupDetails.department,
        designation: signupDetails.designation,
        email: signupData.email.trim(),
        phone: signupDetails.phone,
        password: signupData.password,
        otp: signupOtp.trim(),
        signature: signupSignature,
        expiry: signupExpiry,
        coreDepartment: signupData.coreDepartment
      });
      resetSignUpState();
      setIsSignUp(false);
      navigate('/');
      setLoginMsg({
        text: "Sign up successful! Please log in using your credentials.",
        type: "success"
      });
    } catch (err) {
      console.error("Signup Submission Error:", err);
      setSignupMsg({
        text: err.response?.data?.message || "Registration failed. Please try again.",
        type: "error"
      });
    } finally {
      setSignupLoading(false);
    }
  };

  const handleBackToSignUpVerify = () => {
    setSignupStep(1);
    setSignupSignature('');
    setSignupOtp('');
    setSignupMsg({ text: '', type: '' });
  };

  const checkEmployeeId = async (employeeCode) => {
    try {
      const res = await API.post(
        "/api/auth/check-employee",
        { employeeCode }
      );
      return {
        success: true,
        message: res.data.message,
        mobile: res.data.mobile
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Error checking employee"
      };
    }
  };
  const handleCheckEmployeeId = async (e) => {
    e.preventDefault();
    const res = await checkEmployeeId(fpData.id);

    if (res.success) {
      setIsIdValid(true);
      setIdValidMsg(res.message);
      setFpMsg({ text: '', type: '' }); // Clear any previous errors
      if (res.mobile) {
        setFpData(prev => ({ ...prev, mobile: res.mobile }));
      }
    } else {
      setFpMsg({
        text: res.message,
        type: "error"
      });
      setIdValidMsg('');
    }
  };
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const res = await sendOtpCode(fpData.id, fpData.mobile);
    setFpMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setFpStep(2);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const res = await verifyOtpCode(fpData.id, fpData.otp);
    setFpMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) setFpStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const res = await resetPasswordCode(fpData.id, fpData.otp, fpData.newPass, fpData.confirmPass);
    setFpMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setTimeout(() => toggleForgot(), 2000);
    }
  };


  // ── login submit ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const v = validateLogin(loginData);
    if (!v.isValid) { setLoginMsg({ text: Object.values(v.errors)[0], type: 'error' }); return; }
    try {
      await login(loginData);
      navigate('/dashboard');
    } catch (err) {
      setLoginMsg({ text: err.response?.data?.message || err.message || 'Login failed', type: 'error' });
    }
  };

  const goSignIn = () => {
    navigate('/');
  };

  return (
    <div className={`auth-page${isSignUp ? ' signup-mode' : ''}`}>
      <div className="auth-panel signin-panel">
        <div className="auth-form-wrap">
          <h1 className="auth-heading">Sign In</h1>
          {loginMsg.text && (
            <p className="auth-error" style={{
              background: loginMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: loginMsg.type === 'success' ? '#22c55e' : '#ef4444',
              border: `1px solid ${loginMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              width: '100%',
              margin: '0 0 15px 0'
            }}>
              {loginMsg.text}
            </p>
          )}
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-field">
              <input id="login-id" type="text" placeholder=" "
                value={loginData.id}
                onChange={e => setLoginData({ ...loginData, id: e.target.value })} />
              <label className="auth-label" htmlFor="login-id">Employee ID</label>
            </div>
            <div className="auth-field">
              <input id="login-password" type={showLogPass ? 'text' : 'password'} placeholder=" "
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              <label className="auth-label" htmlFor="login-password">Password</label>
              <button type="button" className="password-toggle" onClick={() => setShowLogPass(!showLogPass)}>
                {showLogPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <button type="button" className="auth-forgot" onClick={handleForgotClick}>Forgot your password?</button>
            <div className="btn-wrapper-center" style={{ flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <button type="submit" className="btn-auth-primary">SIGN IN</button>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Sign Up</Link>
              </p>
            </div>
          </form>
        </div>
        <div className="footer-aliceblue"><Footer /></div>
      </div>

      {/* ══ RIGHT PANEL — shows SignUp or Reset Password ══ */}
      <div className={`auth-panel signup-panel ${isOtpVerified ? 'wide-panel' : ''}`}>
        <div className="auth-form-wrap">
          {isForgot ? (
            /* ══ RESET PASSWORD FORM ══ */
            <>
              <h1 className="auth-heading">Reset Password</h1>
              {fpMsg.text && (
                <p className="auth-error" style={{
                  background: fpMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: fpMsg.type === 'success' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${fpMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                  {fpMsg.text}
                </p>
              )}

              {fpStep === 1 && (
                <form
                  className="auth-form"
                  onSubmit={
                    isIdValid
                      ? handleSendOtp
                      : handleCheckEmployeeId
                  }
                >
                  <div className="auth-field" data-has-value={!!fpData.id}>
                    <input
                      id="fp-id"
                      type="text"
                      placeholder=" "
                      value={fpData.id}
                      onChange={e =>
                        setFpData({
                          ...fpData,
                          id: e.target.value
                        })
                      }
                    />
                    <label className="auth-label" htmlFor="fp-id">Employee ID</label>
                  </div>

                  {isIdValid && idValidMsg && (
                    <p style={{ fontSize: '0.9rem', color: '#0b5299', textAlign: 'center', marginBottom: '10px' }}>
                      {idValidMsg}
                    </p>
                  )}

                  <div className="btn-wrapper-center">
                    <button type="submit" className="btn-auth-primary">
                      {isIdValid ? "SEND OTP" : "CHECK ID"}
                    </button>
                  </div>

                  <button type="button" className="auth-forgot auth-forgot-center" onClick={toggleForgot}>
                    Back to Sign In
                  </button>
                </form>
              )}

              {fpStep === 2 && (
                <form className="auth-form" onSubmit={handleVerifyOtp}>
                  <div className="auth-field" data-has-value={!!fpData.otp}>
                    <input id="fp-otp" type="text" placeholder=" " value={fpData.otp} onChange={e => setFpData({ ...fpData, otp: e.target.value })} />
                    <label className="auth-label" htmlFor="fp-otp">Enter OTP</label>
                  </div>
                  <div className="btn-wrapper-center">
                    <button type="submit" className="btn-auth-primary">VERIFY OTP</button>
                  </div>
                  <button type="button" className="auth-forgot auth-forgot-center" onClick={toggleForgot}>Cancel</button>
                </form>
              )}

              {fpStep === 3 && (
                <form className="auth-form" onSubmit={handleResetPassword}>
                  <div className="auth-field" data-has-value={!!fpData.newPass}>
                    <input id="fp-new" type={showResetPass ? 'text' : 'password'} placeholder=" " value={fpData.newPass} onChange={e => setFpData({ ...fpData, newPass: e.target.value })} />
                    <label className="auth-label" htmlFor="fp-new">New Password</label>
                    <button type="button" className="password-toggle" onClick={() => setShowResetPass(!showResetPass)}>
                      {showResetPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div className="auth-field" data-has-value={!!fpData.confirmPass}>
                    <input id="fp-confirm" type={showResetConfirm ? 'text' : 'password'} placeholder=" " value={fpData.confirmPass} onChange={e => setFpData({ ...fpData, confirmPass: e.target.value })} />
                    <label className="auth-label" htmlFor="fp-confirm">Confirm Password</label>
                    <button type="button" className="password-toggle" onClick={() => setShowResetConfirm(!showResetConfirm)}>
                      {showResetConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <div className="btn-wrapper-center">
                    <button type="submit" className="btn-auth-primary">SET PASSWORD</button>
                  </div>
                  <button type="button" className="auth-forgot auth-forgot-center" onClick={toggleForgot}>Cancel</button>
                </form>
              )}
            </>
          ) : (
            /* ══ SIGN UP FORM ══ */
            <>
              {!signupSignature && (
                /* Step 1: Verify ID */
                <>
                  <div className="signup-header-icon">
                    <UserPlusIcon />
                  </div>
                  <h1 className="auth-heading">Employee Sign Up</h1>
                  <p className="signup-sub">Verify your ID to continue</p>
                  {signupMsg.text && (
                    <p className="auth-error" style={{
                      background: signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: signupMsg.type === 'success' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {signupMsg.text}
                    </p>
                  )}

                  <form className="auth-form" onSubmit={handleVerifySignUpId}>
                    <div className="auth-field" data-has-value={!!signupData.institutionId}>
                      <input
                        id="signup-id"
                        type="text"
                        placeholder=" "
                        value={signupData.institutionId}
                        onChange={e => setSignupData({ ...signupData, institutionId: e.target.value })}
                        disabled={signupLoading}
                      />
                      <label className="auth-label" htmlFor="signup-id">Institution ID</label>
                    </div>

                    <div className="btn-wrapper-center" style={{ flexDirection: 'column', gap: '15px', marginTop: '15px', alignItems: 'center' }}>
                      <button type="submit" className="btn-auth-primary" disabled={signupLoading}>
                        {signupLoading ? "VERIFYING..." : "VERIFY ID"}
                      </button>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'none' }}>Sign In</Link>
                      </p>
                    </div>
                  </form>
                </>
              )}

              {signupSignature && !isOtpVerified && (
                /* Step 1.5: Enter OTP (Reference Layout) */
                <>
                  <div className="signup-header-icon">
                    <UserPlusIcon />
                  </div>
                  <h1 className="auth-heading">Employee Sign Up</h1>
                  <p className="signup-sub">Verify your mobile number to continue</p>
                  
                  <div className="success-banner">
                    <CheckCircleIcon />
                    <span>OTP sent successfully to your registered mobile number</span>
                  </div>

                  {signupMsg.text && signupMsg.type === 'error' && (
                    <p className="auth-error" style={{
                      background: signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: signupMsg.type === 'success' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {signupMsg.text}
                    </p>
                  )}

                  <form className="auth-form" onSubmit={handleVerifySignUpOtp}>
                    <div className="signup-info-box">
                      <div className="signup-info-col">
                        <div className="signup-info-icon">
                          <BankIcon />
                        </div>
                        <div className="signup-info-col-details">
                          <span className="signup-info-label">Institution ID</span>
                          <span className="signup-info-val">{signupData.institutionId}</span>
                        </div>
                      </div>
                      <div className="signup-info-divider"></div>
                      <div className="signup-info-col">
                        <div className="signup-info-icon">
                          <PhoneIcon />
                        </div>
                        <div className="signup-info-col-details">
                          <span className="signup-info-label">OTP sent to</span>
                          <span className="signup-info-val">{signupDetails.phone ? `******${signupDetails.phone.slice(-4)}` : ''}</span>
                        </div>
                      </div>
                    </div>

                    <div className="otp-box-container">
                      <label className="otp-box-label">Enter OTP</label>
                      <div className="otp-box-inputs">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-input-${idx}`}
                            type="text"
                            maxLength="1"
                            className="otp-digit-input"
                            value={digit}
                            onChange={e => handleOtpDigitChange(idx, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                            disabled={signupLoading}
                            autoComplete="one-time-code"
                          />
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn-verify-otp" disabled={signupLoading}>
                      {signupLoading ? "VERIFYING..." : "VERIFY OTP"} <ArrowRightIcon />
                    </button>

                    <div className="or-divider">
                      <span>OR</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <button 
                        type="button" 
                        className="action-link" 
                        onClick={() => handleVerifySignUpId({ preventDefault: () => {} })} 
                        disabled={signupLoading}
                      >
                        <ReloadIcon /> Resend OTP
                      </button>
                      <button 
                        type="button" 
                        className="action-link" 
                        onClick={handleBackToSignUpVerify} 
                        disabled={signupLoading}
                      >
                        <BankIcon /> Change Institution ID
                      </button>
                    </div>

                    <div className="signup-footer-secure">
                      <ShieldCheckIcon /> Your information is secure and encrypted
                    </div>
                  </form>
                </>
              )}

              {isOtpVerified && (
                /* Step 2: Fill Details */
                <>
                  <div className="signup-header-icon">
                    <UserPlusIcon />
                  </div>
                  <h1 className="auth-heading">Employee Sign Up</h1>
                  <p className="signup-sub">Complete your profile setup</p>
                  {signupMsg.text && (
                    <p className="auth-error" style={{
                      background: signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: signupMsg.type === 'success' ? '#22c55e' : '#ef4444',
                      border: `1px solid ${signupMsg.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                    }}>
                      {signupMsg.text}
                    </p>
                  )}

                  <form className="auth-form signup-form" onSubmit={handleSignUpSubmit}>
                    <div className="auth-field" data-has-value={true}>
                      <input id="signup-name" type="text" placeholder=" " value={signupDetails.fullname} disabled title={signupDetails.fullname} />
                      <label className="auth-label" htmlFor="signup-name">Full Name</label>
                    </div>
                    <div className="auth-field" data-has-value={true}>
                      <input id="signup-phone" type="text" placeholder=" " value={signupDetails.phone} disabled title={signupDetails.phone} />
                      <label className="auth-label" htmlFor="signup-phone">Mobile No</label>
                    </div>
                    <div 
                      ref={servingDeptSelectRef}
                      className={`auth-select-wrap ${isServingDeptSelectOpen ? 'is-open' : ''}`} 
                      data-has-value={!!signupDetails.department}
                    >
                      <div 
                        className="custom-select-trigger"
                        onClick={() => !signupLoading && setIsServingDeptSelectOpen(!isServingDeptSelectOpen)}
                      >
                        <span>{signupDetails.department || "\u00a0"}</span>
                        <span className="custom-select-arrow"></span>
                      </div>
                      <label className="auth-label">Serving Department</label>
                      
                      {isServingDeptSelectOpen && (
                        <div className="custom-select-options">
                          {allPublicDepartments.map((dept) => (
                            <div
                              key={dept.code || dept.name}
                              className={`custom-option ${signupDetails.department === dept.name ? 'is-selected' : ''}`}
                              onClick={() => {
                                const newDept = dept.name;
                                setSignupDetails(prev => ({ ...prev, department: newDept }));
                                if (newDept.toLowerCase().trim() !== "freshman engineering") {
                                  setSignupData(prev => ({ ...prev, coreDepartment: '' }));
                                }
                                setIsServingDeptSelectOpen(false);
                              }}
                            >
                              {dept.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div 
                      ref={deptSelectRef}
                      className={`auth-select-wrap ${isDeptSelectOpen ? 'is-open' : ''}`} 
                      data-has-value={!!signupData.coreDepartment}
                    >
                      <div 
                        className="custom-select-trigger"
                        onClick={() => !signupLoading && setIsDeptSelectOpen(!isDeptSelectOpen)}
                      >
                        <span>{signupData.coreDepartment || "\u00a0"}</span>
                        <span className="custom-select-arrow"></span>
                      </div>
                      <label className="auth-label">Parent Department</label>
                      
                      {isDeptSelectOpen && (
                        <div className="custom-select-options">
                          {(
                            (signupDetails.department || "").toLowerCase().trim() === "freshman engineering"
                              ? departments
                              : allPublicDepartments
                          ).map((dept) => (
                            <div
                              key={dept.code || dept.name}
                              className={`custom-option ${signupData.coreDepartment === dept.name ? 'is-selected' : ''}`}
                              onClick={() => {
                                setSignupData({ ...signupData, coreDepartment: dept.name });
                                setIsDeptSelectOpen(false);
                              }}
                            >
                              {dept.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="auth-field" data-has-value={true}>
                      <input id="signup-desig" type="text" placeholder=" " value={signupDetails.designation} disabled title={signupDetails.designation} />
                      <label className="auth-label" htmlFor="signup-desig">Designation</label>
                    </div>
                    <div className="auth-field" data-has-value={!!signupData.email}>
                      <input
                        id="signup-email"
                        type="email"
                        placeholder=" "
                        value={signupData.email}
                        onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                        disabled={signupLoading}
                        autoComplete="off"
                      />
                      <label className="auth-label" htmlFor="signup-email">Email ID</label>
                    </div>
                    <div className="auth-field" data-has-value={!!signupData.password}>
                      <input
                        id="signup-pass"
                        type={showSignPass ? 'text' : 'password'}
                        placeholder=" "
                        value={signupData.password}
                        onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                        disabled={signupLoading}
                        autoComplete="new-password"
                      />
                      <label className="auth-label" htmlFor="signup-pass">Password</label>
                      <button type="button" className="password-toggle" onClick={() => setShowSignPass(!showSignPass)}>
                        {showSignPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <div className="auth-field" data-has-value={!!signupData.confirmPassword}>
                      <input
                        id="signup-confirm"
                        type={showSignConfirm ? 'text' : 'password'}
                        placeholder=" "
                        value={signupData.confirmPassword}
                        onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        disabled={signupLoading}
                        autoComplete="new-password"
                      />
                      <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
                      <button type="button" className="password-toggle" onClick={() => setShowSignConfirm(!showSignConfirm)}>
                        {showSignConfirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    <div className="btn-wrapper-center field-full" style={{ flexDirection: 'column', gap: '15px', marginTop: '20px', width: '100%', alignItems: 'center' }}>
                      <button type="submit" className="btn-auth-primary" disabled={signupLoading}>
                        {signupLoading ? "CREATING ACCOUNT..." : "REGISTER"}
                      </button>
                      <button type="button" className="auth-forgot auth-forgot-center" onClick={handleBackToSignUpVerify} disabled={signupLoading}>
                        Change Institution ID
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
        <div className="footer-aliceblue"><Footer /></div>
      </div>

      {/* ══ OVERLAY — blue panel that slides left/right ══ */}
      <div className="auth-overlay">
        {/* Left half — visible after sliding left */}
        <div className="overlay-side overlay-left">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          {isForgot ? (
            <>
              <h2 className="overlay-title">Reset Your Password</h2>
              <p className="overlay-sub">Remembered your password? Sign in to access your portal.</p>
            </>
          ) : (
            <>
              <h2 className="overlay-title">Join Digital Services</h2>
              <p className="overlay-sub">Already have an account? Sign in to access your portal.</p>
            </>
          )}
          <button className="btn-overlay" onClick={goSignIn}>BACK TO LOGIN</button>
        </div>
        {/* Right half — visible by default */}
        <div className="overlay-side overlay-right">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          <h2 className="overlay-title">Welcome to Digital Services</h2>
          <p className="overlay-sub">Access all your academic resources in one place.</p>
        </div>
      </div>
    </div>
  );
}