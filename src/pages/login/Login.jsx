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
const sendOtpCode = async (institutionId) => {
  if (!institutionId?.trim()) return { success: false, message: "ID is required" };
  try {
    const res = await API.post("/api/auth/forgot-password", { institutionId });
    return { success: true, message: res.data?.message || "OTP sent successfully" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "ID not found" };
  }
};

const verifyOtpCode = async (institutionId, otp) => {
  if (!otp) return { success: false, message: "OTP is required" };
  try {
    const res = await API.post("/api/auth/verify-otp", { institutionId, otp });
    return { success: true, message: res.data?.message || "OTP verified successfully" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Invalid or expired OTP" };
  }
};

const resetPasswordCode = async (institutionId, otp, newPassword, confirmPassword) => {
  if (!newPassword || !confirmPassword) return { success: false, message: "Please fill all fields" };
  if (newPassword.length < 6) return { success: false, message: "Too short" };
  if (newPassword !== confirmPassword) return { success: false, message: "Mismatch" };
  try {
    const res = await API.post("/api/auth/reset-password", { institutionId, otp, newPassword });
    return { success: true, message: res.data?.message || "Password changed" };
  } catch (err) {
    return { success: false, message: err.response?.data?.message || "Error resetting" };
  }
};


// ─────────────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Footer';
import loginLogo from '../../assets/loginlogo.png';
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

export default function Login() {
  // ── panel toggle ──
  const [isSignUp, setIsSignUp] = useState(false);

  // ── login state ──
  const [loginData, setLoginData] = useState({ id: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // ── forgot password state ──
  const [fpStep, setFpStep] = useState(1);
  const [fpData, setFpData] = useState({ id: '', otp: '', newPass: 'Aditya@123', confirmPass: 'Aditya@123' });
  const [fpMsg, setFpMsg] = useState({ text: '', type: '' }); // type: error or success
  const [forgotAnimClass, setForgotAnimClass] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const roleRef = useRef(null);

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

  const handleForgotClick = (e) => {
    e.preventDefault();
    setIsSignUp(true);
    setFpStep(1);
    setFpMsg({ text: '', type: '' });
  };

  // ── handle click outside for custom role select ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) {
        setIsRoleOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleForgot = () => {
    setIsSignUp(false);
    setFpData({ id: '', otp: '', newPass: 'Aditya@123', confirmPass: 'Aditya@123' });
    setFpMsg({ text: '', type: '' });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const res = await sendOtpCode(fpData.id);
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


  const { login, signup } = useAuth();
  const navigate = useNavigate();

  // ── login submit ──
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const v = validateLogin(loginData);
    if (!v.isValid) { setLoginError(Object.values(v.errors)[0]); return; }
    try {
      await login(loginData);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const goSignIn = () => { 
    setIsSignUp(false); 
    setFpStep(1);
    setFpMsg({ text: '', type: '' });
  };

  return (
    <div className={`auth-page${isSignUp ? ' signup-mode' : ''}`}>
      <div className="auth-panel signin-panel">
        <div className="auth-form-wrap">
          <h1 className="auth-heading">Sign In</h1>
          {loginError && <p className="auth-error">{loginError}</p>}
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-field">
              <input id="login-id" type="text" placeholder=" "
                value={loginData.id}
                onChange={e => setLoginData({ ...loginData, id: e.target.value })} />
              <label className="auth-label" htmlFor="login-id">Employee / Student ID</label>
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
            <div className="btn-wrapper-center">
              <button type="submit" className="btn-auth-primary">SIGN IN</button>
            </div>
          </form>
        </div>
        <div className="footer-aliceblue"><Footer /></div>
      </div>

      {/* ══ FORGOT PASSWORD FORM — always on the right ══ */}
      <div className="auth-panel signup-panel">
        <div className="auth-form-wrap">
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
            <form className="auth-form" onSubmit={handleSendOtp}>
              <div className="auth-field">
                <input id="fp-id" type="text" placeholder=" " value={fpData.id} onChange={e => setFpData({ ...fpData, id: e.target.value })} />
                <label className="auth-label" htmlFor="fp-id">Employee / Student ID</label>
              </div>
              <div className="btn-wrapper-center">
                <button type="submit" className="btn-auth-primary">SEND OTP</button>
              </div>
              <button type="button" className="auth-forgot auth-forgot-center" onClick={toggleForgot}>Back to Sign In</button>
            </form>
          )}

          {fpStep === 2 && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="auth-field">
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
              <div className="auth-field">
                <input id="fp-new" type={showResetPass ? 'text' : 'password'} placeholder=" " value={fpData.newPass} onChange={e => setFpData({ ...fpData, newPass: e.target.value })} />
                <label className="auth-label" htmlFor="fp-new">New Password</label>
                <button type="button" className="password-toggle" onClick={() => setShowResetPass(!showResetPass)}>
                  {showResetPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <div className="auth-field">
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
        </div>
        <div className="footer-aliceblue"><Footer /></div>
      </div>

      {/* ══ OVERLAY — blue panel that slides left/right ══ */}
      <div className="auth-overlay">
        {/* Left half — visible after sliding left */}
        <div className="overlay-side overlay-left">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          <h2 className="overlay-title">Reset Your Password</h2>
          <p className="overlay-sub">Remembered your password? Sign in to access your portal.</p>
          <button className="btn-overlay" onClick={goSignIn}>BACK TO LOGIN</button>
        </div>
        {/* Right half — visible by default */}
        <div className="overlay-side overlay-right">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          <h2 className="overlay-title">Welcome to Unified Portal</h2>
          <p className="overlay-sub">Access all your academic resources in one place.</p>
        </div>
      </div>
    </div>
  );
}