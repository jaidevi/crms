import React from 'react';
import { ClockIcon, SearchIcon, ChevronDownIcon, PlusIcon, BellIcon, SettingsIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-8">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-gray-100">
          <ClockIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-80 pl-10 pr-4 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900">
          <span>Textile Corp</span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <PlusIcon className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <BellIcon className="w-5 h-5 text-gray-500" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <SettingsIcon className="w-5 h-5 text-gray-500" />
        </button>
        <div className="w-9 h-9 bg-gray-300 rounded-full">
            <img src="https://picsum.photos/36/36" alt="User Avatar" className="rounded-full" />
        </div>
      </div>
    </header>
  );
};

export default Header;