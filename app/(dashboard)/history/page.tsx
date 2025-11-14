'use client';

import React, { useState } from 'react';
import { ExportHistory } from '../../../types/index';
import { MOCK_EXPORT_HISTORY } from '../../../utils/constants';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { HistoryIcon, TableIcon, CalendarIcon, DownloadIcon, CheckIcon, ClockIcon, ErrorIcon } from '../../../components/icons/IconComponents';

const StatusBadge: React.FC<{ status: ExportHistory['status'] }> = ({ status }) => {
  const statusConfig = {
    Completed: {
      icon: <CheckIcon />,
    },
    Processing: {
      icon: <ClockIcon />,
    },
    Failed: {
      icon: <ErrorIcon />,
    },
  };
  
  const config = statusConfig[status];
  
  const badgeClasses = {
    Completed: "badge badge-success",
    Processing: "badge badge-primary",
    Failed: "badge badge-error",
  };
  
  return (
    <span className={`badge ${badgeClasses[status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '1px solid' }}>
      {config.icon}
      {status}
    </span>
  );
};

const HistoryPage: React.FC = () => {
    const [historyData] = useState<ExportHistory[]>(MOCK_EXPORT_HISTORY);
    const [sortField, setSortField] = useState<keyof ExportHistory | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

    const handleSort = (field: keyof ExportHistory) => {
        if (sortField === field) {
            if (sortDirection === 'asc') {
                setSortDirection('desc');
            } else if (sortDirection === 'desc') {
                setSortField(null);
                setSortDirection(null);
            } else {
                setSortDirection('asc');
            }
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedHistory = [...historyData].sort((a, b) => {
        if (!sortField || !sortDirection) return 0;
        
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' 
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
    });

    const handleDownload = (fileName: string, downloadUrl: string) => {
        // This is a mock, so we prevent default action
        alert(`Downloading ${fileName}...`);
    };

    return (
        <div className="history-page">
            <div className="history-page-header">
                <div className="history-page-icon-wrapper">
                    <HistoryIcon className="history-page-icon" />
                </div>
                <div>
                    <h1 className="history-page-title">Export History</h1>
                    <p className="history-page-description">View and download your exported files</p>
                </div>
            </div>

            <Card>
                <CardContent className="card-padding-none">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'fileName' ? sortDirection : null}
                                    onSort={() => handleSort('fileName')}
                                >
                                    <div className="history-table-header-content">
                                        <TableIcon className="history-table-header-icon" />
                                        File Name
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'exportDate' ? sortDirection : null}
                                    onSort={() => handleSort('exportDate')}
                                    className="history-table-head--hidden-md"
                                >
                                    <div className="history-table-head-content">
                                        <CalendarIcon />
                                        Export Date
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'records' ? sortDirection : null}
                                    onSort={() => handleSort('records')}
                                    className="history-table-head--hidden-sm"
                                >
                                    <div className="history-table-head-content">
                                        <TableIcon />
                                        Records
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'status' ? sortDirection : null}
                                    onSort={() => handleSort('status')}
                                >
                                    Status
                                </TableHead>
                                <TableHead className="history-table-head--action">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="history-table-cell-content">
                                                <TableIcon className="history-table-cell-icon" />
                                                <span className="history-table-cell-text">{item.fileName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="history-table-cell--hidden-md">
                                            <div className="history-table-cell-content">
                                                <CalendarIcon className="history-table-cell-icon" />
                                                <span className="history-table-cell-text history-table-cell-text--muted">{item.exportDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="history-table-cell--hidden-sm">
                                            <span className="history-table-cell-text history-table-cell-text--bold">{item.records.toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell className="history-table-cell--action">
                                            {item.status === 'Completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    leftIcon={<DownloadIcon />}
                                                    onClick={() => handleDownload(item.fileName, item.downloadUrl)}
                                                >
                                                    Download
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="history-table-empty">
                                        <div className="history-empty-state">
                                            <HistoryIcon className="history-empty-icon" />
                                            <p className="history-empty-title">No export history found</p>
                                            <p className="history-empty-description">Your export history will appear here</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default HistoryPage;


