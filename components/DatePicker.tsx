
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from './Icons';

// Helper to check if two dates are on the same day
const isSameDay = (date1: Date, date2: Date) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();

// Helper hook for click outside
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


interface DatePickerProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (date: string) => void;
  onClose: () => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClose }) => {
    const datepickerRef = useRef<HTMLDivElement>(null);
    useClickOutside(datepickerRef, onClose);

    const initialDate = useMemo(() => {
        // Use RegEx to validate format to avoid invalid date errors
        return value && /^\d{4}-\d{2}-\d{2}$/.test(value) 
            ? new Date(value + 'T00:00:00') 
            : new Date();
    }, [value]);
    
    const [viewDate, setViewDate] = useState(initialDate);
    const selectedDate = useMemo(() => value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : null, [value]);
    const today = useMemo(() => new Date(), []);

    const calendarGrid = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        const firstDayOfMonth = new Date(year, month, 1);
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday

        const grid: Date[] = [];
        
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDayOfWeek);

        for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            grid.push(date);
        }

        return grid;
    }, [viewDate]);
    
    const changeMonth = (delta: number) => {
        setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
    };

    const handleDateSelect = (date: Date) => {
        // Format to YYYY-MM-DD safely, avoiding timezone shifts from toISOString()
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const isoDate = `${year}-${month}-${day}`;
        onChange(isoDate);
        onClose();
    };

    const handleClear = () => {
        onChange('');
        onClose();
    };
    
    const handleToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        onChange(todayStr);
        onClose();
    };

    const dayClasses = (date: Date) => {
        let classes = 'w-8 h-8 flex items-center justify-center rounded-full text-sm ';
        const isCurrentMonth = date.getMonth() === viewDate.getMonth();
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        const isToday = isSameDay(date, today);

        if (!isCurrentMonth) {
            classes += 'text-gray-300';
        } else {
            classes += 'cursor-pointer hover:bg-gray-100 ';
            if (isSelected) {
                classes += 'bg-blue-600 text-white hover:bg-blue-700';
            } else if (isToday) {
                classes += 'border border-blue-500 text-blue-600 font-semibold';
            } else {
                classes += 'text-gray-700';
            }
        }
        return classes;
    };

    return (
        <div ref={datepickerRef} className="absolute top-full mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50 animate-fade-in-down p-3">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="font-semibold text-gray-800 text-sm">
                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Previous month">
                        <ChevronUpIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Next month">
                        <ChevronDownIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-gray-500 mb-2">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {calendarGrid.map((date, index) => (
                    <div key={index} className="flex justify-center">
                       <button 
                            onClick={() => handleDateSelect(date)}
                            className={dayClasses(date)}
                        >
                            {date.getDate()}
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <button onClick={handleClear} className="text-sm text-blue-600 hover:underline px-2 py-1 rounded">Clear</button>
                <button onClick={handleToday} className="text-sm text-blue-600 hover:underline px-2 py-1 rounded">Today</button>
            </div>
        </div>
    );
};

export default DatePicker;