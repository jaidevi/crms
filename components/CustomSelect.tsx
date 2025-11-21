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
      <label className="flex items-center text-sm font-medium text-secondary-700 mb-1">
        <span>{label}</span>
        {required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal ${error ? 'border-danger-500' : 'border-secondary-300'}`}
      >
        <span className={selectedOption ? 'text-secondary-900' : 'text-secondary-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-secondary-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-secondary-300 rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-secondary-100 ${value === option.value ? 'bg-primary-50 text-primary-600' : 'text-secondary-700'}`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
};

export default CustomSelect;