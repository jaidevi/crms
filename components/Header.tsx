import React from 'react';
import { BellIcon, SettingsIcon } from './Icons';
import { supabase } from '../supabaseClient';

interface HeaderProps {
  isGuest?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isGuest }) => {
  const handleSignOut = async () => {
    if (isGuest) {
      window.location.reload();
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) alert("Error signing out: " + error.message);
  };

  return (
    <header className="flex items-center justify-end h-16 bg-white border-b border-secondary-200 px-8">
      {/* Right side */}
      <div className="flex items-center space-x-6">
        <div className="flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-secondary-500 uppercase tracking-wider">
                {isGuest ? 'Guest Access' : 'Authenticated'}
            </span>
            <button 
              onClick={handleSignOut}
              className="text-xs font-semibold text-secondary-400 hover:text-danger-600 transition-colors"
            >
              Logout / Exit
            </button>
        </div>
        <button className="p-2 rounded-full hover:bg-secondary-100">
          <BellIcon className="w-5 h-5 text-secondary-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary-100">
          <SettingsIcon className="w-5 h-5 text-secondary-500" />
        </button>
        <div className="w-9 h-9 bg-secondary-300 rounded-full border border-secondary-200 overflow-hidden shadow-sm">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isGuest ? 'Guest' : 'Textile'}`} alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default Header;