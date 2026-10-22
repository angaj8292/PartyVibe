import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mic, User, Mail, Lock, Sparkles } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState(21);
  const [gender, setGender] = useState('Secret');
  const [bio, setBio] = useState('Excited to join PartyVibe voice parties! 🎤');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    try {
      setLoading(true);
      setError('');
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        age: Number(age),
        gender,
        bio,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center px-5 py-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-vibe-accent via-vibe-purple to-vibe-cyan p-0.5 shadow-xl shadow-pink-500/20 mb-2">
          <div className="w-full h-full bg-vibe-bg rounded-[14px] flex items-center justify-center">
            <Mic className="w-7 h-7 text-vibe-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Join PartyVibe
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Create your voice party account</p>
      </div>

      <div className="glass-panel rounded-3xl p-6 shadow-2xl">
        <h2 className="text-base font-extrabold text-white mb-4">Create Account</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose username (e.g. vibe_master)"
                minLength={3}
                maxLength={30}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@partyvibe.app"
                className="w-full bg-vibe-bg border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-vibe-accent"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={13}
                max={99}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-vibe-bg border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Secret">Secret</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gradient-to-r from-vibe-accent to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-pink-500/25 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Complete & Start Party'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-vibe-accent font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
