import React from 'react';
import { BellIcon, SettingsIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-end h-16 bg-white border-b border-secondary-200 px-8">
      {/* Right side */}
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-secondary-100">
          <BellIcon className="w-5 h-5 text-secondary-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary-100">
          <SettingsIcon className="w-5 h-5 text-secondary-500" />
        </button>
        <div className="w-9 h-9 bg-secondary-300 rounded-full">
            <img src="https://picsum.photos/36/36" alt="User Avatar" className="rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;