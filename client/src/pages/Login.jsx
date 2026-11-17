import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEMO_USERS = [
  { name: 'Alex Rivera', email: 'alex@taskflow.dev', role: 'Lead Architect (Admin)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { name: 'Sarah Chen', email: 'sarah@taskflow.dev', role: 'Frontend Engineer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { name: 'Marcus Johnson', email: 'marcus@taskflow.dev', role: 'Backend Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { name: 'Elena Rostova', email: 'elena@taskflow.dev', role: 'Product / UX Designer', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { name: 'David Kim', email: 'david@taskflow.dev', role: 'QA & DevOps Lead', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail) => {
    try {
      setLoading(true);
      setError('');
      setEmail(demoEmail);
      setPassword('password123');
      await login(demoEmail, 'password123');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login with demo credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center text-white shadow-glow mb-2">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome to TaskFlow
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          The collaborative project management platform for modern teams.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-6">
        <div className="bg-[#0c1220] border border-slate-800 py-8 px-6 sm:px-8 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Signing in...' : 'Sign in to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300">
                Create one now
              </Link>
            </p>
          </div>
        </div>

        {/* 1-Click Demo Accounts Box for Evaluators */}
        <div className="bg-[#0c1220]/70 border border-slate-800/80 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              1-Click Demo Logins
            </span>
            <span className="text-[10px] text-slate-400">Password: password123</span>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => handleQuickDemoLogin(demo.email)}
                disabled={loading}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={demo.avatar}
                    alt={demo.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 truncate">
                      {demo.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{demo.role}</p>
                  </div>
                </div>
                <span className="text-[10px] text-brand-400 font-medium px-2 py-0.5 rounded bg-brand-500/10 group-hover:bg-brand-500/20 shrink-0">
                  Log in →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
