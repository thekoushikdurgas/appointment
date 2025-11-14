'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  variant?: 'default' | 'glass' | 'glass-frosted';
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  variant = 'glass',
  align = 'left',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  const containerClassName = `dropdown-container${className ? ' ' + className : ''}`;
  const menuClassName = `dropdown-menu dropdown-menu--${variant} dropdown-menu--${align}`;
  
  return (
    <div ref={dropdownRef} className={containerClassName}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={menuClassName}
          role="menu"
          aria-orientation="vertical"
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              {item.divider ? (
                <div className="dropdown-divider" />
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`dropdown-item${item.danger ? ' dropdown-item--danger' : ''}${index === 0 ? ' dropdown-item--first' : ''}${index === items.length - 1 ? ' dropdown-item--last' : ''}`}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className="dropdown-item-icon">{item.icon}</span>
                  )}
                  <span className="dropdown-item-label">{item.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';

