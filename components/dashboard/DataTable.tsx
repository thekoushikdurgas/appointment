'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { SortIndicator } from '../icons/IconComponents';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  variant?: 'default' | 'glass';
  striped?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  variant = 'glass',
  striped = false,
  hoverable = true,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const cardClassName = `data-table-wrapper${className ? ' ' + className : ''}`;
  
  return (
    <Card
      variant={variant === 'glass' ? 'glass' : 'default'}
      padding="none"
      className={cardClassName}
    >
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr className="data-table__header-row">
              {columns.map((column) => {
                const thClassName = `data-table__header-cell${column.sortable ? ' data-table__header-cell--sortable' : ''}`;
                return (
                <th
                  key={column.key}
                  className={thClassName}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="data-table__header-content">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="data-table__sort-icon">
                        <SortIndicator
                          direction={
                            sortColumn === column.key
                              ? sortDirection
                              : 'none'
                          }
                        />
                      </span>
                    )}
                  </div>
                </th>
              );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="data-table__loading-cell">
                  <div className="data-table__loading-content">
                    <div className="data-table__spinner" />
                    <p className="data-table__loading-text">Loading data...</p>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="data-table__empty-cell">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIndex) => {
                const trClassName = `data-table__body-row${striped && rowIndex % 2 === 1 ? ' data-table__body-row--striped' : ''}${hoverable ? ' data-table__body-row--hoverable' : ''}${onRowClick ? ' data-table__body-row--clickable' : ''}`;
                return (
                <tr
                  key={rowIndex}
                  className={trClassName}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="data-table__cell">
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

DataTable.displayName = 'DataTable';

