import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { InvoiceIcon, SpinnerIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon, EditIcon } from './Icons';

interface LoginProps {
  onGuestMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onGuestMode }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // Detect if we are running inside an iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true);
    }
  }, []);

  const handleLaunchNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      if (isIframe) {
        setErrorMsg("GitHub cannot open inside a preview window. Please use the 'Launch in New Tab' button above.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Auth Error:', error);
      if (error.message?.toLowerCase().includes('provider is not enabled')) {
        setErrorMsg("GitHub Authentication is not enabled in your Supabase project.");
        setShowTroubleshooting(true);
      } else {
        setErrorMsg(error.message || "An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    try {
      setLoading(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-900 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-down">
        
        {isIframe && (
          <div className="bg-primary-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <InfoIcon className="w-5 h-5" />
                <span className="text-sm font-semibold">Running in Preview Mode</span>
              </div>
              <button 
                onClick={handleLaunchNewTab}
                className="bg-white text-primary-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-primary-50 transition-colors shadow-sm"
              >
                Launch in New Tab
              </button>
            </div>
            <p className="text-[11px] mt-2 opacity-90 leading-tight">
              GitHub Login will fail in this window because of browser security rules. Use "Launch in New Tab" to log in properly.
            </p>
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <InvoiceIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-secondary-900 tracking-tight">Textile ERP</h1>
            <p className="text-secondary-500 mt-2 text-center font-medium">Enterprise Resource Planning System</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-danger-50 border-l-4 border-danger-500 text-danger-700 rounded-r-lg">
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          {showTroubleshooting && (
            <div className="mb-6 border border-primary-200 rounded-xl bg-primary-50 overflow-hidden">
              <button 
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="w-full px-4 py-3 flex items-center justify-between text-primary-800 font-semibold text-sm hover:bg-primary-100 transition-colors"
              >
                <div className="flex items-center">
                  <InfoIcon className="w-4 h-4 mr-2" />
                  Provider Setup Required
                </div>
                {showTroubleshooting ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              <div className="px-4 pb-4 space-y-3">
                <ol className="text-xs text-primary-700 list-decimal list-inside space-y-2">
                  <li>Go to <b>Supabase Dashboard</b> &gt; Authentication &gt; Providers.</li>
                  <li>Enable <b>GitHub</b>.</li>
                  <li>Enter your GitHub OAuth <b>Client ID</b> and <b>Secret</b>.</li>
                  <li>Add this URL to your GitHub App's "Callback URLs":
                    <div className="mt-1 p-2 bg-white rounded border border-primary-200 font-mono break-all select-all">
                      {window.location.origin}/auth/v1/callback
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Admin Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none transition-all"
                placeholder="admin@textile-erp.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-md transform active:scale-95 transition-all disabled:bg-primary-400"
            >
              {loading ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : "Secure Sign In"}
            </button>
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-secondary-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-secondary-400 font-bold uppercase tracking-widest">Or connect via</span></div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-3.5 border-2 rounded-xl text-base font-bold transition-all disabled:opacity-50 ${isIframe ? 'border-secondary-100 text-secondary-300 bg-secondary-50 cursor-not-allowed' : 'border-secondary-200 text-secondary-800 bg-white hover:bg-secondary-50 hover:border-secondary-300'}`}
              title={isIframe ? "Login disabled in preview mode" : ""}
            >
              <svg className={`w-5 h-5 mr-3 ${isIframe ? 'text-secondary-300' : 'text-secondary-900'}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub Developer Access
            </button>
            
            <button
              onClick={onGuestMode}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3.5 bg-secondary-100 text-secondary-800 rounded-xl font-bold hover:bg-secondary-200 transition-colors"
            >
              Continue to Demo (Read-Only)
            </button>
          </div>
        </div>
        <div className="bg-secondary-50 px-8 py-4 border-t border-secondary-100 flex flex-col items-center">
           <p className="text-[10px] text-secondary-400 font-mono break-all text-center px-4">
             Instance: {supabase.auth.getSession ? "https://zmsyiofxqjchljljtfwe.supabase.co" : "Checking Connection..."}
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;