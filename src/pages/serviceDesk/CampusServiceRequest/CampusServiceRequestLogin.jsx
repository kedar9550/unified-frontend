import React, { useState, useEffect } from "react";
import { Box, Typography, Button, TextField, Card, CardContent, CircularProgress } from "@mui/material";
import axios from "axios";
import { toast } from "sonner";
import ThemeToggle from "../../../components/common/Themetoggle";

export default function CampusServiceRequestLogin({ isDarkMode, onLoginSuccess, backendUrl }) {
  // Login flow states
  const [step, setStep] = useState(1); // 1 = Enter Roll No, 2 = Enter OTP
  const [rollNoInput, setRollNoInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpStatus, setOtpStatus] = useState("idle");
  const [maskedMobile, setMaskedMobile] = useState("");
  const [studentNamePreview, setStudentNamePreview] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanRoll = rollNoInput.trim().toUpperCase();

    if (!cleanRoll) {
      toast.error("Please enter your Student Roll Number");
      return;
    }

    try {
      setOtpSending(true);
      const res = await axios.post(`${backendUrl}/api/campus-service-request/auth/send-otp`, {
        rollno: cleanRoll
      });

      if (res.data.success) {
        setMaskedMobile(res.data.data.maskedMobile);
        setStudentNamePreview(res.data.data.studentname);
        setStep(2);
        setResendTimer(60);
        if (res.data.data.devOtp) {
          setOtpInput(res.data.data.devOtp);
          toast.success(`OTP sent to ${res.data.data.maskedMobile}! (Dev Code: ${res.data.data.devOtp})`, { duration: 6000 });
        } else {
          toast.success(res.data.message || "OTP sent successfully");
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to verify roll number. Please check university records.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanRoll = rollNoInput.trim().toUpperCase();
    const cleanOtp = otpInput.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    try {
      setOtpVerifying(true);
      setOtpStatus("idle");
      const res = await axios.post(`${backendUrl}/api/campus-service-request/auth/verify-otp`, {
        rollno: cleanRoll,
        otp: cleanOtp
      });

      if (res.data.success && res.data.token) {
        setOtpStatus("success");
        const receivedToken = res.data.token;
        const receivedStudent = res.data.student;

        // Briefly show success state before proceeding
        setTimeout(() => {
          localStorage.setItem("campus_student_token", receivedToken);
          localStorage.setItem("campus_student_profile", JSON.stringify(receivedStudent));
          onLoginSuccess(receivedStudent, receivedToken);
          toast.success(`Welcome, ${receivedStudent.studentname}!`);
        }, 800);
      }
    } catch (err) {
      setOtpStatus("error");
      setTimeout(() => {
        setOtpInput("");
        setOtpStatus("idle");
        document.getElementById(`otp-input-0`)?.focus();
      }, 500);
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpVerifying(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: isDarkMode ? "#0f172a" : "#e6f3ffff",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Top Right Theme Toggle */}
      <Box sx={{ position: "absolute", top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, zIndex: 10 }}>
        <ThemeToggle />
      </Box>

      {/* Left Side: 70% */}
      <Box
        sx={{
          flex: { xs: "1", md: "0 0 70%" },
          width: { xs: "100%", md: "70%" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 2, sm: 4 },
          color: "var(--text-primary, #1e293b)",
          position: "relative",
          zIndex: 2
        }}
      >
        <Box sx={{
          width: "100%",
          maxWidth: 440,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: isDarkMode ? "#1e293b" : "#ffffff",
          borderRadius: "24px",
          p: { xs: 3, sm: 4 },
        }}>
          {/* Header Branding */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", mb: 0.5 }}>
            <Box
              component="img"
              src="/site-logo.svg"
              alt="Aditya University Logo"
              sx={{ height: 64, mb: .8 }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textAlign: "center" }}>
              Campus Service Request
            </Typography>
          </Box>

          {/* Auth Card */}
          <Card
            sx={{
              width: "100%",
              maxWidth: 440,
              borderRadius: "20px",
              bgcolor: isDarkMode ? "#0f172a" : "#e9f4ffff",
              backgroundImage: "none",
              color: "var(--text-primary, #1e293b)",
              border: "none",
              boxShadow: "none",
              overflow: "hidden"
            }}
          >
            <Box sx={{ px: 3, pt: 1, pb: 1, bgcolor: "transparent", borderBottom: "none", textAlign: "center" }}>
              {step !== 1 && (
                <Typography variant="h6" sx={{ fontWeight: 700, background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Enter Verification Code
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: "var(--text-secondary, #64748b)", mt: 0.5 }}>
                {step === 1
                  ? "Enter your University Roll Number to continue."
                  : `OTP sent to ${maskedMobile}`}
              </Typography>
            </Box>

            <CardContent sx={{ px: 3, pt: 1, pb: 3 }}>
              {step === 1 ? (
                <Box component="form" onSubmit={handleSendOtp} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="Student Roll Number"
                    value={rollNoInput}
                    onChange={(e) => setRollNoInput(e.target.value.toUpperCase())}
                    autoFocus
                    required
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "50px",
                      },
                      "& .MuiInputLabel-root": {
                        ml: 2
                      },
                      "& .MuiOutlinedInput-root legend": {
                        ml: 2
                      }
                    }}
                    helperText="Only active regular students can raise campus service requests."
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={otpSending || !rollNoInput.trim()}
                    sx={{
                      py: 1.5,
                      px: 6,
                      alignSelf: "center",
                      borderRadius: "50px",
                      fontWeight: 400,
                      bgcolor: "var(--gradient-primary)",
                      "&:hover": { bgcolor: "var(--gradient-primary-hover)" }
                    }}
                  >
                    {otpSending ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Send OTP"}
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleVerifyOtp} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <style>
                    {`
                    @keyframes shake {
                      10%, 90% { transform: translate3d(-1px, 0, 0); }
                      20%, 80% { transform: translate3d(2px, 0, 0); }
                      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                      40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                  `}
                  </style>
                  <Box sx={{ display: "flex", gap: { xs: 1, sm: 1.5 }, justifyContent: "center", mb: 2 }}>
                    {[...Array(6)].map((_, index) => (
                      <TextField
                        key={index}
                        id={`otp-input-${index}`}
                        autoFocus={index === 0}
                        value={otpInput[index] || ""}
                        inputProps={{
                          maxLength: 1,
                        }}
                        sx={{
                          width: { xs: 45, sm: 55 },
                          animation: otpStatus === "error" ? "shake 0.5s cubic-bezier(.36,.07,.19,.97) both" : "none",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#fff",
                            "& fieldset": {
                              borderColor: otpStatus === "success" ? "#16a34a !important" : otpStatus === "error" ? "#dc2626 !important" : undefined,
                              borderWidth: otpStatus !== "idle" ? "2px" : undefined
                            }
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            p: 1.5,
                            color: otpStatus === "success" ? "#16a34a" : otpStatus === "error" ? "#dc2626" : "inherit"
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val) {
                            const newOtp = otpInput.split("");
                            newOtp[index] = val;
                            setOtpInput(newOtp.join("").slice(0, 6));
                            if (index < 5) {
                              document.getElementById(`otp-input-${index + 1}`).focus();
                            }
                          } else {
                            const newOtp = otpInput.split("");
                            newOtp[index] = "";
                            setOtpInput(newOtp.join(""));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !otpInput[index] && index > 0) {
                            document.getElementById(`otp-input-${index - 1}`).focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
                          if (pastedData) {
                            setOtpInput(pastedData);
                            const nextIndex = Math.min(pastedData.length, 5);
                            document.getElementById(`otp-input-${nextIndex}`)?.focus();
                          }
                        }}
                      />
                    ))}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={otpVerifying || otpInput.length < 6}
                    sx={{
                      py: 1.5,
                      px: 6,
                      alignSelf: "center",
                      borderRadius: "50px",
                      fontWeight: 700,
                      bgcolor: "#16a34a",
                      "&:hover": { bgcolor: "#15803d" }
                    }}
                  >
                    {otpVerifying ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Verify"}
                  </Button>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setStep(1);
                        setOtpInput("");
                      }}
                      sx={{ color: "var(--text-secondary, #64748b)", textTransform: "none" }}
                    >
                      Change Roll Number
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      disabled={resendTimer > 0 || otpSending}
                      onClick={handleSendOtp}
                      sx={{ color: resendTimer > 0 ? "var(--text-secondary, #94a3b8)" : "#f97316", fontWeight: 600, textTransform: "none" }}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Right Side: 30% */}
      <Box
        sx={{
          flex: { xs: "none", md: "0 0 30%" },
          width: { xs: "100%", md: "30%" },
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          position: "relative"
        }}
      >
        <Box
          component="img"
          src={isDarkMode ? "/Circle_Gold.svg" : "/Circle_Orange.svg"}
          alt="University Graphic"
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            width: { xs: "400px", md: "800px", lg: "1250px" },
            height: "auto",
            filter: isDarkMode ? "drop-shadow(0 0 40px rgba(190,147,55,0.2))" : "drop-shadow(0 0 40px rgba(249,115,22,0.2))",
            animation: "spinAndStay 60s linear infinite",
            "@keyframes spinAndStay": {
              "0%": { transform: "translate(51%, -50%) rotate(0deg)" },
              "100%": { transform: "translate(51%, -50%) rotate(360deg)" }
            }
          }}
        />
      </Box>

      {/* Footer Note */}
      <Box sx={{ position: "absolute", bottom: 16, left: 0, width: "100%", zIndex: 10 }}>
        <Typography variant="caption" sx={{ color: isDarkMode ? "#94a3b8" : "#64748b", textAlign: "center", display: "block" }}>
          Campus Service Request System &bull; <Box component="span" sx={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>Aditya University</Box>
        </Typography>
        <Typography variant="caption" sx={{ color: isDarkMode ? "#64748b" : "#94a3b8", mt: 0.5, textAlign: "center", display: "block" }}>
          Designed and Developed by <Box component="span" sx={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 700 }}>IT Application</Box>
        </Typography>
      </Box>
    </Box>
  );
}
