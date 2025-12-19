
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { InvoiceIcon, SpinnerIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from './Icons';

interface LoginProps {
  onGuestMode: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot_password';

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className="ml-2 p-1 text-primary-600 hover:bg-primary-100 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <CheckIcon className="w-4 h-4 text-success-600" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>}
    </button>
  );
};

export const Login: React.FC<LoginProps> = ({ onGuestMode }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  const supabaseUrl = "https://zmsyiofxqjchljljtfwe.supabase.co";
  const callbackUrl = `${supabaseUrl}/auth/v1/callback`;
  const redirectUrl = window.location.origin;

  useEffect(() => {
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
      setSuccessMsg(null);
      
      if (isIframe) {
        setErrorMsg("GitHub login is restricted inside frames. You MUST use 'Launch in New Tab' above.");
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Auth Error:', error);
      setErrorMsg(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (authMode !== 'forgot_password' && !password) return;
    
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (authMode === 'signup') {
        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user?.identities?.length === 0) {
          setErrorMsg("User already exists. Please sign in instead.");
        } else {
          setSuccessMsg("Account created! Please check your email for verification.");
          setAuthMode('signin');
        }
      } else if (authMode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg("Reset link sent! Please check your inbox.");
        setAuthMode('signin');
      }
    } catch (error: any) {
      setErrorMsg(error.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const modeTitles = {
      signin: 'Secure Sign In',
      signup: 'Create Account',
      forgot_password: 'Reset Password'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-900 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-down">
        
        {isIframe && (
          <div className="bg-primary-600 p-6 text-white text-center">
            <div className="flex flex-col items-center space-y-3">
              <InfoIcon className="w-10 h-10" />
              <h3 className="font-bold text-lg">Action Required</h3>
              <p className="text-sm opacity-90">Authentication requires a direct browser window.</p>
              <button 
                onClick={handleLaunchNewTab}
                className="w-full bg-white text-primary-600 px-4 py-3 rounded-xl font-bold hover:bg-primary-50 transition-all shadow-lg active:scale-95 text-base"
              >
                Open in New Tab & Connect
              </button>
            </div>
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <InvoiceIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-secondary-900 tracking-tight">Textile ERP</h1>
            <p className="text-secondary-500 mt-1 text-center font-medium opacity-70 italic">Enterprise Management System</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-danger-50 border-l-4 border-danger-500 text-danger-700 rounded-r-lg animate-fade-in-down">
              <p className="text-xs font-bold uppercase mb-1">Error</p>
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-success-50 border-l-4 border-success-600 text-success-800 rounded-r-lg animate-fade-in-down">
              <p className="text-xs font-bold uppercase mb-1">Success</p>
              <p className="text-sm">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-bold text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
            
            {authMode !== 'forgot_password' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <label className="block text-[10px] font-bold text-secondary-500 uppercase tracking-widest">Password</label>
                    {authMode === 'signin' && (
                        <button 
                            type="button"
                            onClick={() => setAuthMode('forgot_password')}
                            className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest"
                        >
                            Forgot?
                        </button>
                    )}
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary-50 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 shadow-md transform active:scale-95 transition-all disabled:bg-primary-400"
            >
              {loading ? <SpinnerIcon className="w-5 h-5 mx-auto" /> : modeTitles[authMode]}
            </button>
          </form>

          <div className="text-center mb-8">
            {authMode === 'signin' ? (
                <p className="text-sm text-secondary-600">
                    Don't have an account?{' '}
                    <button onClick={() => setAuthMode('signup')} className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2">Create one</button>
                </p>
            ) : (
                <button onClick={() => setAuthMode('signin')} className="text-sm font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2">Back to Sign In</button>
            )}
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-secondary-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-secondary-400 font-bold uppercase tracking-widest">Alternative Access</span></div>
          </div>

          <div className="space-y-3">
            {authMode === 'signin' && (
                <button
                onClick={handleGitHubLogin}
                disabled={loading}
                className={`w-full flex items-center justify-center px-4 py-3.5 border-2 rounded-xl text-sm font-bold transition-all ${isIframe ? 'border-secondary-100 text-secondary-300 bg-secondary-50 cursor-not-allowed' : 'border-secondary-200 text-secondary-800 bg-white hover:bg-secondary-50 hover:border-secondary-300 active:scale-[0.98]'}`}
                >
                <svg className={`w-5 h-5 mr-3 ${isIframe ? 'text-secondary-300' : 'text-secondary-900'}`} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                {isIframe ? 'Login (Open in New Tab first)' : 'Sign in with GitHub'}
                </button>
            )}
            
            <button
              onClick={onGuestMode}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3.5 bg-secondary-100 text-secondary-800 rounded-xl text-sm font-bold hover:bg-secondary-200 transition-colors"
            >
              Continue as Guest (Demo)
            </button>
          </div>

          <div className="mt-8 border-t border-secondary-100 pt-6">
            <button 
              onClick={() => setShowTroubleshooting(!showTroubleshooting)}
              className="w-full flex items-center justify-between text-secondary-400 font-bold text-[10px] uppercase tracking-widest hover:text-secondary-600 transition-colors"
            >
              <span className="flex items-center">
                <InfoIcon className="w-3.5 h-3.5 mr-2" />
                Integration Instructions
              </span>
              {showTroubleshooting ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
            </button>
            {showTroubleshooting && (
              <div className="mt-4 p-4 bg-primary-50/50 rounded-xl border border-primary-100 space-y-4 animate-fade-in-down">
                <div className="space-y-2 border-b border-primary-100 pb-3">
                    <p className="text-[10px] font-bold text-primary-900 uppercase tracking-tighter">1. GitHub OAuth App</p>
                    <div className="text-[11px] text-primary-700 leading-relaxed">
                        Authorization callback URL:
                        <div className="flex items-center mt-1">
                            <code className="flex-1 p-2 bg-white rounded border border-primary-200 break-all font-mono text-secondary-800 text-[9px]">
                                {callbackUrl}
                            </code>
                            <CopyButton text={callbackUrl} />
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-primary-900 uppercase tracking-tighter">2. Supabase Redirect Whitelist</p>
                    <div className="text-[11px] text-primary-700 leading-relaxed">
                        Site URL & Redirect URLs:
                        <div className="flex items-center mt-1">
                            <code className="flex-1 p-2 bg-white rounded border border-primary-200 break-all font-mono text-secondary-800 text-[9px]">
                                {redirectUrl}
                            </code>
                            <CopyButton text={redirectUrl} />
                        </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-secondary-50 px-8 py-4 border-t border-secondary-100 text-center">
           <p className="text-[9px] text-secondary-400 font-mono break-all leading-tight tracking-tighter opacity-60">
             INSTANCE: zmsyiofxqjchljljtfwe
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
