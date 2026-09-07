import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../api/authApi";

export default function LoginPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState("Login to Portal");

  // MFA OTP State
  const [isOtpState, setIsOtpState] = useState(false);
  const [tempTokens, setTempTokens] = useState<{ access: string; refresh: string } | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // If user is already logged in, redirect them to dashboard
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpState) {
      handleOtpVerify();
      return;
    }

    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setIsLoading(true);
    setButtonText("Processing...");

    try {
      // Direct call to authApi.login to check credentials before showing OTP
      const res = await authApi.login(username, password);
      setTempTokens(res.data);
      
      // Transition to OTP verification state
      setIsOtpState(true);
      setIsLoading(false);
      setButtonText("Verify & Enter");
    } catch (err: any) {
      console.error("Login error", err);
      setError(
        err.response?.data?.detail || "Invalid credentials. Please verify your ID and password."
      );
      setIsLoading(false);
      setButtonText("Login to Portal");
    }
  };

  const handleOtpVerify = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setError("");
    setIsLoading(true);
    setButtonText("Authorizing...");

    // Simulate OTP authorization success check
    setTimeout(async () => {
      if (tempTokens) {
        localStorage.setItem("access_token", tempTokens.access);
        localStorage.setItem("refresh_token", tempTokens.refresh);
        try {
          await refreshUser();
          navigate("/");
        } catch (err) {
          setError("Failed to fetch profile. Please login again.");
          setIsLoading(false);
          setButtonText("Login to Portal");
          setIsOtpState(false);
        }
      } else {
        setError("Session expired. Please try again.");
        setIsLoading(false);
        setButtonText("Login to Portal");
        setIsOtpState(false);
      }
    }, 1200);
  };

  // OTP Inputs handling
  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  return (
    <div className="bg-gradient-to-tr from-[#f3fbf9] via-white to-[#edf6f4] min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Premium Glowing Circles (Minimal Animation Ambient Effect) */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-primary-container/10 rounded-full blur-[140px] pointer-events-none"></div>
      
      {/* Center Panel Container */}
      <div className="w-full max-w-[460px] relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Top Status Badge */}
        {/* <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-outline-variant/60 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-[11px] font-semibold text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>Clinical Node Online</span>
          </div>
        </div> */}

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-primary-container/10 p-8 shadow-[0_20px_50px_rgba(0,104,95,0.06)] relative overflow-hidden">
          
          {/* Card Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary-container via-primary to-primary-container"></div>
          
          {/* Brand Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-[#005c54] rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,104,95,0.2)]">
              <span className="material-symbols-outlined text-white text-[28px]">dentistry</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Dr. Chandrika Dental</h2>
            <p className="text-xs text-secondary mt-1 font-medium">Staff & Clinical Administration Portal</p>
          </div>

          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            
            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 bg-error-container/30 border border-error-container/40 text-error rounded-xl text-body-sm text-center font-medium animate-in shake duration-300">
                {error}
              </div>
            )}

            {/* Form Fields: Credentials or OTP */}
            {!isOtpState ? (
              <div className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-secondary/80 block uppercase ml-0.5" htmlFor="username">
                    Username or Email
                  </label>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 font-body-md text-body-md outline-none transition-all duration-200"
                      id="username"
                      name="username"
                      placeholder="e.g. dr_chandrika"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold tracking-widest text-secondary/80 block uppercase ml-0.5" htmlFor="password">
                      Password
                    </label>
                    <a className="text-[10px] font-bold text-primary hover:text-primary-container transition-colors" href="#">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white/50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 font-body-md text-body-md outline-none transition-all duration-200"
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

              </div>
            ) : (
              /* OTP Phase */
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 mb-2">
                  <p className="text-xs text-secondary text-center leading-relaxed">
                    A security code has been dispatched to your clinical mobile line ending in ****42.
                  </p>
                </div>
                <label className="text-[10px] font-bold tracking-widest text-secondary/80 block uppercase text-center">
                  Verification Code
                </label>
                <div className="flex justify-between gap-2.5 max-w-[320px] mx-auto">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputsRef.current[idx] = el; }}
                      className="w-11 h-12 text-center text-xl font-bold rounded-xl border border-outline-variant focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all bg-white"
                      maxLength={1}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <div className="text-center pt-1">
                  <button className="text-xs font-bold text-primary hover:text-primary-container transition-colors" type="button">
                    Resend Code (0:45)
                  </button>
                </div>
              </div>
            )}

            {/* Login Action Button */}
            <button
              className="w-full mt-2 bg-gradient-to-r from-primary to-[#005c54] text-white font-semibold py-3.5 rounded-xl hover:-translate-y-[1px] hover:shadow-[0_8px_16px_rgba(0,104,95,0.15)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              type="submit"
              disabled={isLoading}
            >
              <span className="text-body-md">{buttonText}</span>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/40"></div>
            </div>
            <span className="relative px-3 text-[10px] font-bold text-outline uppercase tracking-widest bg-white">Support</span>
          </div>

          {/* Footer Actions */}
          <div className="text-center">
            <p className="text-xs text-secondary">
              Emergency assistance? <a className="text-primary font-bold hover:underline" href="#">Contact IT Admin</a>
            </p>
          </div>

        </div>

        {/* System Version Footer */}
        <div className="mt-8 flex items-center justify-center gap-3 text-outline text-[11px] font-medium">
          <span>Dr. Chandrika Dental Care v2.4.1</span>
          <span className="text-outline-variant">•</span>
        </div>

      </div>
    </div>
  );
}
