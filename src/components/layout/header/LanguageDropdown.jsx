
import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import useOnClickOutside from '../../hooks/useOnClickOutside';

const options = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'he', label: 'עברית', flag: '🇮🇱' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
];

const LanguageDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const ref = useRef(null);

  useOnClickOutside(ref, () => setIsOpen(false));

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className="language-dropdown" ref={ref}>
      <style jsx>{`
        .language-dropdown {
          margin-right: 1rem;
          position: relative;
        }

        .language-dropdown__trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: 1px solid #ddd;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .language-dropdown__trigger:hover {
          border-color: #007bff;
        }

        .language-dropdown__flag {
          font-size: 1.2rem;
        }

        .language-dropdown__label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .language-dropdown__arrow {
          transition: transform 0.2s;
        }

        .language-dropdown__arrow.open {
          transform: rotate(180deg);
        }

        .language-dropdown__menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          min-width: 150px;
          z-index: 1001;
          margin-top: 0.25rem;
        }

        .language-dropdown__option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .language-dropdown__option:hover {
          background-color: #f8f9fa;
        }

        .language-dropdown__option.selected {
          background-color: #e3f2fd;
          color: #007bff;
        }

        @media (max-width: 768px) {
          .language-dropdown__label {
            display: none;
          }
        }
      `}</style>
      
      <button 
        className="language-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="language-dropdown__flag">{selected.flag}</span>
        <span className="language-dropdown__label">{selected.label}</span>
        <ChevronDown size={16} className={`language-dropdown__arrow ${isOpen ? 'open' : ''}`} />
      </button>
      {isOpen && (
        <div className="language-dropdown__menu">
          {options.map((option) => (
            <button
              key={option.value}
              className={`language-dropdown__option ${selected.value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option)}
            >
              <span className="language-dropdown__flag">{option.flag}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
