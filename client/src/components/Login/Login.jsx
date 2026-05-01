import { useState } from 'react';
import { auth } from '../../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const signIn = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
          console.error(err);
      setError('Incorrect Email or Password!');
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err) {
          console.error(err);
      setError('Unable to create account, Please try again!');
    }
  };

  const signInWithGoogle = async (e) => {
    e.preventDefault();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
          console.error(err);
      setError('Google sign-in failed. Please try again.');
    }
  };

  return (
    <div className="bg-[#f3f3f3] min-h-screen flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <a href="/" className="text-[#131921] text-4xl font-bold tracking-tighter mb-6">
        Twistora
      </a>

      {/* Form Box */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm">

        <h1 className="text-xl font-semibold text-gray-800 mb-4">Sign In</h1>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        <form>
          {/* Email */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="apni@email.com"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-[#f3a847] focus:ring-1 focus:ring-[#f3a847]"
            />
          </div>

          {/* Sign In Button */}
          <button
            onClick={signIn}
            className="w-full bg-[#f3a847] hover:bg-[#e8a020] text-black font-semibold py-2 rounded-md transition-colors mb-3"
          >
            Sign In
          </button>

          <p className="text-xs text-gray-500 text-center mb-4">
            By signing in you agree to our terms and conditions.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border-t border-gray-200"/>
            <span className="text-xs text-gray-400">New to Twistora?</span>
            <div className="flex-1 border-t border-gray-200"/>
          </div>

          {/* Register Button */}
          <button
            onClick={register}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 rounded-md transition-colors border border-gray-300 mb-3"
          >
            Create Account
          </button>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 border-t border-gray-200"/>
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200"/>
          </div>

          {/* Google Button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-md transition-colors border border-gray-300"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-4 h-4"
            />
            Continue with Google
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;