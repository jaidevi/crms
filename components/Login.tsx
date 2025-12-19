import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { InvoiceIcon, SpinnerIcon } from './Icons';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      alert(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fade-in-down">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <InvoiceIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-secondary-900">Textile ERP</h1>
            <p className="text-secondary-500 mt-2 text-center font-medium">Manage your production and accounts with ease</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-secondary-300 rounded-xl shadow-sm text-base font-semibold text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <SpinnerIcon className="w-5 h-5 mr-3 text-secondary-400" />
              ) : (
                <svg className="w-6 h-6 mr-3 text-secondary-900" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              )}
              {loading ? "Connecting..." : "Sign in with GitHub"}
            </button>
            
            <p className="text-xs text-center text-secondary-400 mt-6 px-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
        <div className="bg-secondary-50 px-8 py-4 border-t border-secondary-100">
           <p className="text-xs text-secondary-500 text-center">
             Textile ERP System v1.2.0 • Secured by Supabase
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;