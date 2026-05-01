import { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, Sparkles } from 'lucide-react';

const ADMIN_EMAIL = 'zaheerfarooq456@gmail.com';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (email !== ADMIN_EMAIL) {
      setError('You are not an admin!');
      setLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid Email or Password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#faf8f5] via-white to-[#f5f0e8]">

      {/* Decorative floating shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-72 h-72 bg-[#f3a847]/5 -top-20 -left-20 animate-gentle-float"
          style={{ animationDelay: '0s', animationDuration: '6s' }}
        />
        <div
          className="absolute w-96 h-96 bg-[#131921]/3 bottom-0 right-0 translate-x-1/3 translate-y-1/3 animate-gentle-float"
          style={{ animationDelay: '2s', animationDuration: '8s' }}
        />
        <div
          className="absolute w-48 h-48 border border-[#f3a847]/10 top-1/4 right-[15%] animate-gentle-float"
          style={{ animationDelay: '1s', animationDuration: '7s' }}
        />
        <div
          className="absolute w-32 h-32 border border-[#131921]/5 bottom-[20%] left-[10%] animate-gentle-float"
          style={{ animationDelay: '3s', animationDuration: '5s' }}
        />
      </div>

      {/* Main Card */}
      <div
        className={`relative z-10 w-full max-w-md mx-4 transition-all duration-1000 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Top accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#f3a847] via-[#e8a020] to-[#f3a847]" />

        <div className="bg-white border border-gray-100 shadow-xl p-8 md:p-10">

          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 bg-[#131921] mb-5 transition-all duration-700 delay-200 ${
                mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
              }`}
            >
              <Shield size={28} className="text-[#f3a847]" />
            </div>
            <h1
              className={`text-2xl font-bold text-[#131921] tracking-wide mb-2 transition-all duration-700 delay-300 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Admin Access
            </h1>
            <p
              className={`text-gray-400 text-xs tracking-[0.2em] uppercase transition-all duration-700 delay-400 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              Twistora Management Panel
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-2 border-red-400 text-red-600 text-sm px-4 py-3 mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div
              className={`mb-5 transition-all duration-700 delay-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  className="w-full border border-gray-200 pl-11 pr-4 py-3 text-sm text-[#131921] outline-none focus:border-[#f3a847] transition-colors bg-gray-50/50 placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div
              className={`mb-8 transition-all duration-700 delay-600 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full border border-gray-200 pl-11 pr-4 py-3 text-sm text-[#131921] outline-none focus:border-[#f3a847] transition-colors bg-gray-50/50 placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Submit */}
            <div
              className={`transition-all duration-700 delay-700 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <button
                type="submit"
                disabled={loading}
                className="group w-full bg-[#131921] hover:bg-[#232f3e] disabled:bg-gray-300 text-white font-bold py-3.5 transition-all duration-300 text-xs tracking-[0.3em] uppercase flex items-center justify-center gap-3"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating
                  </span>
                ) : (
                  <>
                    Secure Login
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Bottom decorative text */}
          <div
            className={`mt-8 text-center transition-all duration-700 delay-700 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span className="inline-flex items-center gap-2 text-[10px] text-gray-300 tracking-[0.2em] uppercase">
              <Sparkles size={10} />
              Authorized Personnel Only
              <Sparkles size={10} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;