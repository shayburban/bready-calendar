
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";

const CustomTimeInput = ({
  value,
  options = [],
  onChange,
  placeholder = "HH:MM",
  validationRule,
  hasError
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const dropdownRef = useRef(null);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h);
      setMinute(m);
    } else {
      setHour('');
      setMinute('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus to minutes field when hour is complete (2 digits)
  useEffect(() => {
    if (hour && hour.length === 2 && minuteRef.current) {
      minuteRef.current.focus();
    }
  }, [hour]);

  const handleSetTime = () => {
    const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    if (time.match(/^\d{2}:\d{2}$/)) {
      onChange(time);
    }
    setIsOpen(false);
  };

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleHourChange = (e) => {
    let inputValue = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (inputValue.length > 2) {
      inputValue = inputValue.slice(0, 2); // Limit to 2 digits
    }

    // Validate hour input
    if (inputValue.length > 0) {
      const firstDigit = inputValue[0];
      if (!['0', '1', '2'].includes(firstDigit)) {
        inputValue = inputValue.slice(1); // Remove invalid first digit
      }

      if (inputValue.length === 2) {
        const hourValue = parseInt(inputValue, 10);
        if (hourValue > 23) {
          inputValue = inputValue[0]; // Keep only first digit if hour > 23
        }

        // Smart validation for second digit based on first digit
        const first = inputValue[0];
        const second = inputValue[1];
        if (first === '2' && parseInt(second) > 3) {
          inputValue = first; // Remove second digit if it makes hour > 23
        }
      }
    }

    setHour(inputValue);
  };

  const handleMinuteChange = (e) => {
    let inputValue = e.target.value.replace(/\D/g, ''); // Remove non-digits

    if (inputValue.length > 2) {
      inputValue = inputValue.slice(0, 2); // Limit to 2 digits
    }

    // Validate minute input
    if (inputValue.length > 0) {
      const firstDigit = inputValue[0];
      if (parseInt(firstDigit) > 5) {
        inputValue = ''; // Remove invalid first digit
      }

      if (inputValue.length === 2) {
        const minuteValue = parseInt(inputValue, 10);
        if (minuteValue > 59) {
          inputValue = inputValue[0]; // Keep only first digit if minute > 59
        }
      }
    }

    setMinute(inputValue);
  };

  const handleHourKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    e.keyCode === 65 && e.ctrlKey === true ||
    e.keyCode === 67 && e.ctrlKey === true ||
    e.keyCode === 86 && e.ctrlKey === true ||
    e.keyCode === 88 && e.ctrlKey === true) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleMinuteKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    e.keyCode === 65 && e.ctrlKey === true ||
    e.keyCode === 67 && e.ctrlKey === true ||
    e.keyCode === 86 && e.ctrlKey === true ||
    e.keyCode === 88 && e.ctrlKey === true) {
      return;
    }

    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline" className="bg-background text-gray-50 px-3 py-2 text-sm font-medium inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground w-full justify-between h-10 bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}>

        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <span className="ml-2">▼</span>
      </Button>

      {isOpen &&
      <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Custom Time Input Section */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <input
              ref={hourRef}
              type="text"
              value={hour}
              onChange={handleHourChange}
              onKeyDown={handleHourKeyDown}
              placeholder="HH"
              className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              maxLength="2" />

              <span className="text-gray-500">:</span>
              <input
              ref={minuteRef}
              type="text"
              value={minute}
              onChange={handleMinuteChange}
              onKeyDown={handleMinuteKeyDown}
              placeholder="MM"
              className="w-12 px-2 py-1 text-center border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              maxLength="2" />

              <Button
              type="button"
              size="sm"
              onClick={handleSetTime}
              className="ml-2 px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900">

                Set
              </Button>
            </div>
          </div>

          {/* Dropdown Options */}
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) =>
          <div
            key={`time-${option.value}`}
            data-time={option.value}
            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm ${
            option.disabled ? 'text-gray-400 cursor-pointer bg-gray-50' : ''}`
            }
            onClick={() => !option.disabled && handleOptionClick(option.value)}>

                {option.label}
              </div>
          )}
          </div>
        </div>
      }
    </div>);

};

export default CustomTimeInput;
