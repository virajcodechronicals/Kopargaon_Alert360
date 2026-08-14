import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { store } from '../store';
import { Eye, EyeOff } from 'lucide-react';
import { safeFetchJson } from '../utils/api';

export function decodeJwtPayload(token: string): any {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let base64Url = parts[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    const binaryStr = window.atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const decodedText = new TextDecoder('utf-8').decode(bytes);
    return JSON.parse(decodedText);
  } catch (e) {
    try {
      const basic = atob(token.split('.')[1] || '');
      return JSON.parse(basic);
    } catch {
      return null;
    }
  }
}

export const AuthContext = React.createContext<{
  user: any;
  login: (token: string) => void;
  logout: () => void;
  guest: boolean;
  continueAsGuest: () => void;
}>({
  user: null, login: () => {}, logout: () => {}, guest: false, continueAsGuest: () => {}
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.getToken().then(token => {
      if (token) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          setUser(payload);
        } else {
          store.removeToken();
        }
      }
      setLoading(false);
    });
  }, []);

  const login = (token: string) => {
    if (!token) return;
    store.setToken(token);
    const payload = decodeJwtPayload(token);
    if (payload) {
      setUser(payload);
    } else {
      setUser({ id: 'authenticated-user', role: 'citizen', name: 'User' });
    }
    setGuest(false);
  };

  const logout = () => {
    store.removeToken();
    setUser(null);
    setGuest(false);
  };

  if (loading) return null;

  if (!user && !guest) {
    return <AuthScreen login={login} onGuest={() => setGuest(true)} />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, guest, continueAsGuest: () => setGuest(true) }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthScreen = ({ login, onGuest }: { login: (t: string) => void, onGuest: () => void }) => {
  const [isColdStart, setIsColdStart] = useState(() => !sessionStorage.getItem('splashShown'));
  const [showSplash, setShowSplash] = useState(isColdStart);
  const [mode, setMode] = useState<'citizen' | 'authority'>('citizen');

  useEffect(() => {
    if (isColdStart) {
      sessionStorage.setItem('splashShown', 'true');
      const timer = setTimeout(() => setShowSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isColdStart]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col isolate">
      {/* Splash Layer */}
      <div 
        className={`absolute inset-0 flex items-center justify-center bg-white z-20 transition-opacity duration-700 ease-[cubic-bezier(0.2,0.0,0,1.0)] ${showSplash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <Logo size={120} showText={true} />
      </div>

      {/* Login Screen Layer */}
      <div 
        className={`absolute inset-0 overflow-y-auto bg-slate-50 flex flex-col z-10 transition-all duration-700 ease-[cubic-bezier(0.2,0.0,0,1.0)] ${showSplash ? 'translate-y-4 opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'}`}
      >
        <div className="flex-1 flex flex-col max-w-md w-full mx-auto p-6 pt-12">
          <Logo size={56} showText={false} className="mb-8" />
          
          {mode === 'citizen' ? (
            <CitizenAuth login={login} onGuest={onGuest} />
          ) : (
            <AuthorityAuth login={login} onBack={() => setMode('citizen')} />
          )}

          {mode === 'citizen' && (
            <div className="mt-8 text-center">
              <button onClick={() => setMode('authority')} className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-4">
                Authority Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CitizenAuth = ({ login, onGuest }: { login: (t: string) => void, onGuest: () => void }) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    if (tab === 'signup') {
      if (!name.trim()) return setError('Name is required');
      if (username.length < 3 || username.length > 25 || !/^[a-zA-Z0-9._-]+$/.test(username)) {
        return setError('Username must be 3-25 characters (letters, numbers, ., _, -)');
      }
      if (password.length < 6) return setError('Password must be at least 6 characters');
    } else {
      if (!username || !password) return setError('Please enter username and password');
    }

    setLoading(true);
    try {
      const endpoint = tab === 'signup' ? '/api/v1/auth/citizen/signup' : '/api/v1/auth/citizen/login';
      const body = tab === 'signup' ? { name: name.trim(), username: username.trim(), password } : { username: username.trim(), password };
      
      const result = await safeFetchJson(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      if (!result.ok) {
        throw new Error(result.error || 'Authentication failed');
      }

      if (!result.data?.token) {
        throw new Error('No authentication token received from server');
      }

      login(result.data.token);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to login service');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setUsername('citizen');
    setPassword('citizen123');
    setError('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => { setTab('login'); setError(''); }}
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'login' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Citizen Login
        </button>
        <button 
          onClick={() => { setTab('signup'); setError(''); }}
          className={`flex-1 py-4 text-sm font-semibold transition-colors ${tab === 'signup' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Create Account
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        {tab === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Rahul Patil"
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Username</label>
            {tab === 'login' && (
              <button 
                type="button" 
                onClick={handleDemoFill}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Auto-fill demo
              </button>
            )}
          </div>
          <input 
            type="text" 
            placeholder={tab === 'signup' ? "e.g. rahul_patil" : "Enter username (or 'citizen')"}
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-4 pr-12 py-3 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {tab === 'signup' && <p className="text-xs text-slate-500">Must be at least 6 characters</p>}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 font-bold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 mt-1"
        >
          {loading ? 'Authenticating...' : (tab === 'login' ? 'Log in to Portal' : 'Create Citizen Account')}
        </button>

        <div className="mt-2 text-center">
          <button type="button" onClick={onGuest} className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100">
            Continue as Guest (Read-Only) &rarr;
          </button>
        </div>
      </form>
    </div>
  );
};

const AuthorityAuth = ({ login, onBack }: { login: (t: string) => void, onBack: () => void }) => {
  const [email, setEmail] = useState('virajchitte7116@gmail.com');
  const [password, setPassword] = useState('8080846924');
  const [mfa, setMfa] = useState('BOB');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !mfa) return setError('Please enter official email, password, and MFA code');
    setLoading(true);
    try {
      const result = await safeFetchJson('/api/v1/auth/authority/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password: password.trim(), mfaCode: mfa.trim() })
      });
      
      if (!result.ok) throw new Error(result.error || 'Official authentication failed');
      if (!result.data?.token) throw new Error('No authentication token received from server');
      login(result.data.token);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate official credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('virajchitte7116@gmail.com');
    setPassword('8080846924');
    setMfa('BOB');
    setError('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Authority & SDM HQ Access</h2>
            <p className="text-xs text-slate-300 mt-0.5">Kopargaon Taluka Disaster Response Control</p>
          </div>
          <span className="material-symbols-outlined text-amber-400 text-2xl">verified_user</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Official Sub-Divisional Officer Credentials</span>
          <button 
            type="button" 
            onClick={handleQuickFill}
            className="text-xs text-sky-600 hover:text-sky-800 font-semibold underline"
          >
            Auto-fill credentials
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Official Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="virajchitte7116@gmail.com"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none" 
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">MFA Hardware / TOTP Token</label>
            <span className="text-[11px] text-slate-400 font-mono">Code: BOB</span>
          </div>
          <input 
            type="text" 
            value={mfa} 
            onChange={e => setMfa(e.target.value)} 
            placeholder="BOB" 
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:border-sky-600 focus:bg-white focus:ring-1 focus:ring-sky-600 outline-none tracking-widest font-mono uppercase" 
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50 mt-1"
        >
          {loading ? 'Verifying Credentials...' : 'Access Authority Command HQ'}
        </button>

        <div className="mt-2 text-center">
          <button type="button" onClick={onBack} className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100">
            &larr; Return to Citizen Login
          </button>
        </div>
      </form>
    </div>
  );
};
