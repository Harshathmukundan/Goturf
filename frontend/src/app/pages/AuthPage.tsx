import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ArrowLeft, Loader2, Phone, Mail, Zap, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";

const SPORTS_IMAGE =
  "https://images.unsplash.com/photo-1764863703740-2abbd49b14c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBhcmVuYSUyMHN0YWRpdW0lMjBtb2Rlcm58ZW58MXx8fHwxNzcyNDIyNDQ0fDA&ixlib=rb-4.1.0&q=80&w=1080";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, googleLogin, sendOtp, user } = useAuth() as any;
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"form" | "otp">("form");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    identifier: "", 
    password: "", 
    otp: "", 
  });

  const from = (location.state as any)?.from || "/turfs";

  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const data = await googleLogin(tokenResponse.access_token);
        toast.success("Welcome to GoTurf!");
        if (data.isNewUser) {
          navigate("/profile", { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Google login failed");
        setError(err.response?.data?.message || "Google login failed");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Google login failed")
  });

  // Login Returning User
  const standardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.identifier || !form.password) return setError("Enter credentials");
    try {
      setLoading(true);
      setError("");
      const result = await login(form.identifier, form.password);
      toast.success("Welcome back!");
      if (result.user?.role === 'turf_owner') {
        navigate("/owner-dashboard", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Register New User (Step 1)
  const beginRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.identifier || !form.password) return setError("All fields required");
    
    try {
      setLoading(true);
      setError("");
      // Send the OTP
      await sendOtp(method, form.identifier);
      toast.success(`Verification code sent to ${form.identifier}`);
      setStep("otp");
    } catch (err: any) {
      toast.error("Failed to send OTP. Is provider configured?");
      setError(err.response?.data?.message || err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Register New User (Step 2)
  const completeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.otp.length < 6) return setError("Enter 6-digit code");
    
    try {
      setLoading(true);
      setError("");
      
      const payload = {
        name: form.name,
        email: method === "email" ? form.identifier : "",
        phone: method === "phone" ? form.identifier : "",
        password: form.password,
        otpToken: form.otp,
        method: method
      };

      const data = await register(payload);
      toast.success("Account created successfully!");
      if (data.isNewUser) {
        navigate("/profile", { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP");
      setError(err.response?.data?.message || "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full font-inter">
      {/* Sidebar background visual */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/40 to-transparent z-10" />
        <img src={SPORTS_IMAGE} alt="Sports Arena" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
        <div className="relative z-20 flex flex-col justify-between p-12 h-full text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600">
              <Zap className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="font-poppins font-bold tracking-tight text-2xl">GoTurf</span>
          </Link>
          <div className="max-w-md">
            <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">Play Anytime, Anywhere.</h1>
            <p className="text-zinc-300 text-lg">Book premium sports venues instantly. Join thousands of players in your city today.</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2"><ArrowLeft className="w-5 h-5 text-slate-500" /></Link>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 ml-2" >
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-bold text-slate-900 font-poppins">Go<span className="text-emerald-500">Turf</span></span>
          </div>

          <motion.div className="bg-white rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-slate-100" layout>
            
            {step === "form" ? (
              <>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
                  {(["login", "signup"] as const).map((tab) => (
                    <button key={tab} className={`flex-1 py-2.5 rounded-lg text-sm transition-all ${mode === tab ? "bg-emerald-500 text-white font-semibold shadow-sm" : "text-slate-500"}`} onClick={() => { setMode(tab); setError(""); setMethod("email"); }}>
                      {tab === "login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-6">
                  <button onClick={() => setMethod("email")} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 transition-all ${method === "email" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <Mail className="w-4 h-4" /> Email
                  </button>
                  <button onClick={() => setMethod("phone")} className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 transition-all ${method === "phone" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    <Phone className="w-4 h-4" /> Phone
                  </button>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.form key={mode + method} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={mode === "login" ? standardLogin : beginRegistration} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
                    )}
                    
                    {mode === "signup" && (
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Full Name" className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all font-medium" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                    )}

                    <div className="relative">
                      {method === "phone" ? <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /> : <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />}
                      <input autoFocus type={method === "phone" ? "tel" : "email"} placeholder={method === "phone" ? "+91 9876543210" : "Email Address"} className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all font-medium" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
                    </div>

                    <div className="relative">
                      <input type="password" placeholder="Password" className="w-full px-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all font-medium" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold flex justify-center items-center gap-2 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === "login" ? "Sign In" : "Send Verification Code")}
                    </button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                      <div className="relative flex justify-center"><span className="px-4 bg-white text-xs text-slate-400">OR</span></div>
                    </div>

                    <button type="button" onClick={() => handleGoogleLogin()} className="w-full py-4 rounded-xl flex items-center justify-center gap-3 border border-slate-200 transition-all hover:shadow-md bg-white text-slate-800 font-medium">
                      <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      Continue with Google
                    </button>
                    
                    {mode === "login" && (
                    <div className="mt-3 p-3 rounded-xl text-xs bg-green-50 border border-green-100 text-green-800">
                      <p className="font-semibold">🔑 Demo Admin Login:</p>
                      <p>Email: admin@goturf.com · Password: admin123</p>
                    </div>
                  )}
                  </motion.form>
                </AnimatePresence>
              </>
            ) : (
              // OTP Verification Step during Registration
              <motion.form initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6" onSubmit={completeRegistration}>
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  {method === "phone" ? <Phone className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your {method === "phone" ? "Phone" : "Email"}</h2>
                <p className="text-slate-500 text-center mb-8">We sent a verification code to confirm your new account at <b className="text-slate-700">{form.identifier}</b></p>

                {error && <div className="mb-4 w-full p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-100">{error}</div>}

                <input autoFocus type="text" maxLength={6} placeholder="• • • • • •" className="w-full text-center tracking-[0.5em] text-3xl font-bold py-4 rounded-xl border-2 border-slate-200 outline-none focus:border-emerald-500 focus:bg-emerald-50 transition-all bg-slate-50" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '') })} />

                <button type="submit" disabled={form.otp.length < 6 || loading} className="w-full py-4 mt-8 rounded-xl bg-emerald-500 text-white font-semibold flex justify-center items-center gap-2 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                </button>
                <div className="mt-8">
                  <button type="button" onClick={() => { setStep("form"); setForm({...form, otp: ''}) }} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">Wrong {method === "phone" ? "number" : "email"}? Go back</button>
                </div>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
