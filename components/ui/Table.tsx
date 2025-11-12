'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '../icons/IconComponents';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  responsive?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, responsive = true, children, ...props }, ref) => {
    const table = (
      <table
        ref={ref}
        className={cn(
          'table w-full',
          !responsive && className
        )}
        {...props}
      >
        {children}
      </table>
    );
    
    if (responsive) {
      return (
        <div className={cn("table-responsive", className)}>
          {table}
        </div>
      );
    }
    
    return table;
  }
);

Table.displayName = 'Table';

export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={className}
      {...props}
    />
  )
);

TableHeader.displayName = 'TableHeader';

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={className}
      {...props}
    />
  )
);

TableBody.displayName = 'TableBody';

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hover?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, hover = true, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        hover && 'table-row-hover',
        className
      )}
      {...props}
    />
  )
);

TableRow.displayName = 'TableRow';

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        sortable && 'table-sortable',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="table-sort-icon flex items-center gap-2">
        {children}
        {sortable && (
          <span className="flex-shrink-0">
            {sortDirection === 'asc' ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : sortDirection === 'desc' ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronUpDownIcon className="w-4 h-4 opacity-50" />
            )}
          </span>
        )}
      </div>
    </th>
  )
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('text-sm text-foreground', className)}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

