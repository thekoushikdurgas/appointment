'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@components/icons';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  responsive?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, responsive = true, children, ...props }, ref) => {
    const tableClassName = `table${!responsive && className ? ' ' + className : ''}`;
    const table = (
      <table
        ref={ref}
        className={tableClassName}
        {...props}
      >
        {children}
      </table>
    );
    
    if (responsive) {
      return (
        <div className={`table-responsive${className ? ' ' + className : ''}`}>
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
      className={`${hover ? 'table-row-hover' : ''}${className ? ' ' + className : ''}`}
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
  ({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
    const thClassName = `${sortable ? 'table-sortable' : ''}${className ? ' ' + className : ''}`;
    return (
      <th
        ref={ref}
        className={thClassName}
        onClick={sortable ? onSort : undefined}
        {...props}
      >
        <div className="table-sort-icon">
          {children}
          {sortable && (
            <span className="table-sort-icon__indicator">
              {sortDirection === 'asc' ? (
                <ChevronUpIcon />
              ) : sortDirection === 'desc' ? (
                <ChevronDownIcon />
              ) : (
                <ChevronUpDownIcon />
              )}
            </span>
          )}
        </div>
      </th>
    );
  }
);

TableHead.displayName = 'TableHead';

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={`table-cell${className ? ' ' + className : ''}`}
      {...props}
    />
  )
);

TableCell.displayName = 'TableCell';

