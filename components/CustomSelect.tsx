import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './Icons';

interface CustomSelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const CustomSelect: React.FC<CustomSelectProps> = ({ label, options, value, onChange, required, error, placeholder = 'Select an option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  useClickOutside(selectRef, () => setIsOpen(false));

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={selectRef}>
      <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal ${error ? 'border-red-500' : 'border-gray-300'}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default CustomSelect;
