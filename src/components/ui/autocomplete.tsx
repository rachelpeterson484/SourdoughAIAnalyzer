import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  className?: string;
}

export function Autocomplete({ 
  value, 
  onChange, 
  options, 
  placeholder = "Type to search...",
  className 
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options.slice(0, 8)); // Show first 8 options when empty
    }
  }, [value, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.label);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionClick(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
