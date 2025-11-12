'use client';

import React, { useState } from 'react';
import { ExportHistory } from '../../../types/index';
import { MOCK_EXPORT_HISTORY } from '../../../utils/constants';
import { Card, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { HistoryIcon, TableIcon, CalendarIcon, DownloadIcon, CheckIcon, ClockIcon, ErrorIcon } from '../../../components/icons/IconComponents';
import { cn } from '../../../utils/cn';

const StatusBadge: React.FC<{ status: ExportHistory['status'] }> = ({ status }) => {
  const statusConfig = {
    Completed: {
      className: "bg-success/20 text-success border-success/30",
      icon: <CheckIcon className="w-3 h-3" />,
    },
    Processing: {
      className: "bg-info/20 text-info border-info/30",
      icon: <ClockIcon className="w-3 h-3" />,
    },
    Failed: {
      className: "bg-error/20 text-error border-error/30",
      icon: <ErrorIcon className="w-3 h-3" />,
    },
  };
  
  const config = statusConfig[status];
  
  const badgeClasses = {
    Completed: "badge badge-success",
    Processing: "badge badge-primary",
    Failed: "badge badge-error",
  };
  
  return (
    <span className={cn("badge inline-flex items-center gap-1.5 border", badgeClasses[status])}>
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
        <div className="flex flex-col gap-6 w-full max-w-full">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <HistoryIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Export History</h1>
                    <p className="text-sm text-muted-foreground mt-1">View and download your exported files</p>
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
                                    <div className="flex items-center gap-2">
                                        <TableIcon className="w-4 h-4" />
                                        File Name
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'exportDate' ? sortDirection : null}
                                    onSort={() => handleSort('exportDate')}
                                    className="hidden md:table-cell"
                                >
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        Export Date
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'records' ? sortDirection : null}
                                    onSort={() => handleSort('records')}
                                    className="hidden sm:table-cell"
                                >
                                    <div className="flex items-center gap-2">
                                        <TableIcon className="w-4 h-4" />
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
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedHistory.length > 0 ? (
                                sortedHistory.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <TableIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{item.fileName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{item.exportDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <span className="font-semibold">{item.records.toLocaleString()}</span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={item.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.status === 'Completed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    leftIcon={<DownloadIcon className="w-4 h-4" />}
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
                                    <TableCell colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <HistoryIcon className="w-12 h-12 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">No export history found</p>
                                            <p className="text-sm text-muted-foreground/80">Your export history will appear here</p>
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


