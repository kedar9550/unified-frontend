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

// ---------------- SIGNUP VALIDATION ----------------
const validateSignup = (data) => {
  const errors = {};

  if (!data.id?.trim()) errors.id = "ID is required";
  if (!data.fullname?.trim()) errors.fullname = "Full name is required";
  if (!data.department) errors.department = "Department is required";

  if (!data.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Invalid email format";
  }

  if (!data.phone) {
    errors.phone = "Phone number required";
  } else if (!/^[6-9]\d{9}$/.test(data.phone)) {
    errors.phone = "Enter valid Indian mobile number";
  }

  if (!data.designation) errors.designation = "Designation is required";

  if (!data.password || data.password.length < 6)
    errors.password = "Password must be at least 6 characters";

  if (data.password !== data.confirmPassword)
    errors.confirmPassword = "Passwords do not match";

  return { isValid: Object.keys(errors).length === 0, errors };
};

// ---------------- ERP FETCH ----------------
const fetchERPData = async (id, role) => {
  try {
    const res = await API.post("/api/users/ecap-data", { institutionId: id, role });
    const data = res.data;
    if (!data || data.error) return null;

    if (role === "Employee") {
      return {
        fullname: data?.employeename?.trim() || "",
        department: data?.departmentname || "",
        designation: data?.designation || "",
        phone: data?.mobileno || "",
      };
    } else {
      return {
        fullname: data?.studentname?.trim() || "",
        department: data?.branch || "",
        designation: "Student",
        phone: data?.mobilenumber || "",
        email: data?.emailid || "",
      };
    }
  } catch (err) {
    console.error("ERP fetch error:", err);
    return null;
  }
};

// ---------------- SIGNUP SUBMIT ----------------
const signupUser = async (signupFn, formData) => {
  const payload = {
    fullname: formData.fullname,
    id: formData.id,
    department: formData.department,
    designation: formData.designation,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
    userType: formData.role,
  };
  return await signupFn(payload);
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

  // ── signup state ──
  const [signupData, setSignupData] = useState({
    id: '', fullname: '', department: '', designation: '',
    email: '', phone: '', password: 'Aditya@123', confirmPassword: 'Aditya@123', role: 'Employee',
  });
  const [signupError, setSignupError] = useState('');
  const [disabledFields, setDisabledFields] = useState({});
  const [isEcapVerified, setIsEcapVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // ── forgot password state ──
  const [isForgot, setIsForgot] = useState(false);
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
    const randomAnim = animClasses[Math.floor(Math.random() * animClasses.length)];
    setForgotAnimClass(randomAnim);
    setIsForgot(true);
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
    setIsClosing(true);
    // After animation completes, hide the panel and reset immediately
    setTimeout(() => {
      setIsForgot(false);
      setIsClosing(false);
      setFpData({ id: '', otp: '', newPass: 'Aditya@123', confirmPass: 'Aditya@123' });
      setFpMsg({ text: '', type: '' });
    }, 500); // Reduced to 500ms — animation is 0.85s but panel becomes invisible quickly
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

  // ── ECAP verify on ID blur ──
  const handleIdBlur = async () => {
    if (!signupData.id.trim()) { setDisabledFields({}); setIsEcapVerified(false); return; }
    setIsVerifying(true); setSignupError('');
    try {
      const data = await fetchERPData(signupData.id.trim(), signupData.role);
      if (data) {
        setSignupData(prev => ({ ...prev, ...data }));
        const dis = {};
        Object.keys(data).forEach(k => { if (data[k]) dis[k] = true; });
        setDisabledFields(dis);
        setIsEcapVerified(true);
      } else {
        setDisabledFields({}); setIsEcapVerified(false);
        setSignupData(prev => ({
          ...prev, fullname: '', department: '',
          designation: signupData.role === 'Student' ? 'Student' : '',
          phone: '', email: '',
        }));
        setSignupError(`User not found in ECAP for ${signupData.role}. Registration not allowed.`);
      }
    } catch {
      setDisabledFields({}); setIsEcapVerified(false);
      setSignupError('Error verifying user against ECAP.');
    } finally { setIsVerifying(false); }
  };

  // ── role change ──
  const handleRoleChange = (val) => {
    setSignupData({
      id: '', fullname: '', department: '', designation: val === 'Student' ? 'Student' : '',
      email: '', phone: '', password: '', confirmPassword: '', role: val
    });
    setDisabledFields({}); setIsEcapVerified(false); setSignupError('');
    setIsRoleOpen(false);
  };

  // ── signup submit ──
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!isEcapVerified) { setSignupError('Please provide a valid ID that exists in ECAP.'); return; }
    const v = validateSignup(signupData);
    if (!v.isValid) { setSignupError(Object.values(v.errors)[0]); return; }
    try {
      await signupUser(signup, signupData);
      navigate('/dashboard');
    } catch (err) {
      setSignupError(err.response?.data?.message || err.message || 'Signup failed');
    }
  };

  const goSignUp = () => { setIsSignUp(true); setLoginError(''); };
  const goSignIn = () => { setIsSignUp(false); setSignupError(''); };

  return (
    <div className={`auth-page${isSignUp ? ' signup-mode' : ''}`}>
      <div className="auth-panel signin-panel">
        <div className="auth-form-wrap">
          {!isForgot && (
            <>
              <h1 className="auth-heading">Sign In</h1>
              {loginError && <p className="auth-error">{loginError}</p>}
            </>
          )}
          {!isForgot && (
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
          )}
        </div>
        {!isForgot && <div className="footer-aliceblue"><Footer /></div>}

        {isForgot && (
          <div className={`reset-form${isClosing ? ' anim-slide-out-left' : ''}`}>
            <div className="reset-form-content">
              <div className={isClosing ? '' : forgotAnimClass} style={{ width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 className="auth-heading">Reset Password</h1>
                {fpMsg.text && (
                  <p className="auth-error" style={{ background: fpMsg.type === 'success' ? '#e8f5e9' : '#fdecea', color: fpMsg.type === 'success' ? '#2e7d32' : '#c62828' }}>
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
            </div>
            <div className="footer-aliceblue"><Footer /></div>
          </div>
        )}
      </div>

      {/* ══ SIGN-UP FORM — always on the right ══ */}
      <div className="auth-panel signup-panel">
        <div className="auth-form-wrap signup-scroll">
          <h1 className="auth-heading">Create Account</h1>
          {signupError && <p className="auth-error">{signupError}</p>}
          <form className="auth-form signup-form" onSubmit={handleSignupSubmit}>
            {/* Role — custom neat dropdown */}
            <div className={`auth-field auth-select-wrap field-full${isRoleOpen ? ' is-open' : ''}`}
              ref={roleRef} data-has-value={!!signupData.role}>
              <div className="custom-select-trigger" onClick={() => setIsRoleOpen(!isRoleOpen)}>
                {signupData.role}
                <span className="custom-select-arrow" />
              </div>
              <label className="auth-label">Select Role</label>

              {isRoleOpen && (
                <div className="custom-select-options">
                  <div className={`custom-option${signupData.role === 'Student' ? ' is-selected' : ''}`}
                    onClick={() => handleRoleChange('Student')}>
                    Student
                  </div>
                  <div className={`custom-option${signupData.role === 'Employee' ? ' is-selected' : ''}`}
                    onClick={() => handleRoleChange('Employee')}>
                    Employee
                  </div>
                </div>
              )}
            </div>

            {/* ID  |  Full Name */}
            <div className="auth-field">
              <input id="signup-id" type="text" placeholder=" "
                value={signupData.id}
                onChange={e => setSignupData({ ...signupData, id: e.target.value })}
                onBlur={handleIdBlur} />
              <label className="auth-label" htmlFor="signup-id">ID (auto-fills from ECAP)</label>
            </div>
            <div className="auth-field">
              <input id="signup-name" type="text" placeholder=" "
                value={signupData.fullname} disabled={!!disabledFields.fullname}
                onChange={e => setSignupData({ ...signupData, fullname: e.target.value })} />
              <label className="auth-label" htmlFor="signup-name">Full Name</label>
            </div>

            {/* Email  |  Phone */}
            <div className="auth-field">
              <input id="signup-email" type="email" placeholder=" "
                value={signupData.email} disabled={!!disabledFields.email}
                onChange={e => setSignupData({ ...signupData, email: e.target.value })} />
              <label className="auth-label" htmlFor="signup-email">Email</label>
            </div>
            <div className="auth-field">
              <input id="signup-phone" type="text" placeholder=" "
                value={signupData.phone} disabled={!!disabledFields.phone}
                onChange={e => setSignupData({ ...signupData, phone: e.target.value })} />
              <label className="auth-label" htmlFor="signup-phone">Phone</label>
            </div>

            {/* Department  |  Designation */}
            <div className="auth-field">
              <input id="signup-dept" type="text" placeholder=" "
                value={signupData.department} disabled={!!disabledFields.department}
                onChange={e => setSignupData({ ...signupData, department: e.target.value })} />
              <label className="auth-label" htmlFor="signup-dept">Department</label>
            </div>
            <div className="auth-field">
              <input id="signup-desig" type="text" placeholder=" "
                value={signupData.designation} disabled={!!disabledFields.designation}
                onChange={e => setSignupData({ ...signupData, designation: e.target.value })} />
              <label className="auth-label" htmlFor="signup-desig">Designation</label>
            </div>

            {/* Password  |  Confirm Password */}
            <div className="auth-field">
              <input id="signup-pass" type={showSignPass ? 'text' : 'password'} placeholder=" "
                value={signupData.password}
                onChange={e => setSignupData({ ...signupData, password: e.target.value })} />
              <label className="auth-label" htmlFor="signup-pass">Password</label>
              <button type="button" className="password-toggle" onClick={() => setShowSignPass(!showSignPass)}>
                {showSignPass ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div className="auth-field">
              <input id="signup-confirm" type={showSignConfirm ? 'text' : 'password'} placeholder=" "
                value={signupData.confirmPassword}
                onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} />
              <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
              <button type="button" className="password-toggle" onClick={() => setShowSignConfirm(!showSignConfirm)}>
                {showSignConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* REGISTER — centered wrapper instead of field-full */}
            <div className="btn-wrapper-center">
              <button type="submit" className="btn-auth-primary"
                disabled={!isEcapVerified || isVerifying}>
                {isVerifying ? 'Verifying…' : 'REGISTER'}
              </button>
            </div>
          </form>
        </div>
        <div className="footer-aliceblue"><Footer /></div>
      </div>

      {/* ══ OVERLAY — blue panel that slides left/right ══ */}
      <div className="auth-overlay">
        {/* Left half — visible after sliding left (signup mode) */}
        <div className="overlay-side overlay-left">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          <h2 className="overlay-title">Welcome to Unified Portal</h2>
          <p className="overlay-sub">Already have an account? Sign in to continue.</p>
          <button className="btn-overlay" onClick={goSignIn}>SIGN IN</button>
        </div>
        {/* Right half — visible by default (login mode) */}
        <div className="overlay-side overlay-right">
          <img src={loginLogo} alt="Aditya University" className="overlay-logo" />
          <h2 className="overlay-title">Welcome to Unified Portal</h2>
          <p className="overlay-sub">You don't have an account? Sign up to continue.</p>
          <button className="btn-overlay" onClick={goSignUp}>SIGN UP</button>
        </div>
      </div>

    </div>
  );
}