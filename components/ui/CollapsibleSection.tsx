'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@components/icons';

export interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'glass-frosted';
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  children,
  defaultOpen = false,
  icon,
  variant = 'glass-frosted',
  className,
  headerClassName,
  contentClassName,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const variantClassMap = {
    default: 'collapsible-section--default',
    glass: 'collapsible-section--glass',
    'glass-frosted': 'collapsible-section--glass-frosted',
  };

  const containerClassName = `collapsible-section${variantClassMap[variant] ? ' ' + variantClassMap[variant] : ''}${className ? ' ' + className : ''}`;
  const triggerClassName = `collapsible-section__trigger${headerClassName ? ' ' + headerClassName : ''}`;
  const chevronClassName = `collapsible-section__chevron${isOpen ? ' collapsible-section__chevron--open' : ''}`;
  const contentWrapperClassName = `collapsible-section__content-wrapper`;
  const contentClassName2 = `collapsible-section__content${contentClassName ? ' ' + contentClassName : ''}`;
  
  return (
    <div className={containerClassName}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className={triggerClassName}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="collapsible-section__header">
          {icon && (
            <div className="collapsible-section__icon">
              {icon}
            </div>
          )}
          <div className="collapsible-section__header-text">
            <h3 className="collapsible-section__title">
              {title}
            </h3>
            {description && (
              <p className="collapsible-section__description">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Chevron Icon with Rotation Animation */}
        <div className={chevronClassName}>
          <ChevronDownIcon />
        </div>
      </button>

      {/* Content with Smooth Height Animation */}
      <div
        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        ref={contentRef}
        className={contentWrapperClassName}
        style={{
          height: height !== undefined ? `${height}px` : 'auto',
        }}
      >
        <div className={contentClassName2}>
          {children}
        </div>
      </div>
    </div>
  );
};

CollapsibleSection.displayName = 'CollapsibleSection';

// Accordion Wrapper for Multiple Collapsible Sections
export interface AccordionProps {
  children: React.ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  children,
  allowMultiple = false,
  className,
}) => {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set());

  const handleToggle = (index: number, isOpen: boolean) => {
    if (allowMultiple) {
      setOpenSections(prev => {
        const newSet = new Set(prev);
        if (isOpen) {
          newSet.add(index);
        } else {
          newSet.delete(index);
        }
        return newSet;
      });
    } else {
      setOpenSections(isOpen ? new Set([index]) : new Set());
    }
  };

  return (
    <div className={`accordion${className ? ' ' + className : ''}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && child.type === CollapsibleSection) {
          return React.cloneElement(child as React.ReactElement<CollapsibleSectionProps>, {
            defaultOpen: openSections.has(index),
            onToggle: (isOpen: boolean) => handleToggle(index, isOpen),
          });
        }
        return child;
      })}
    </div>
  );
};

Accordion.displayName = 'Accordion';

