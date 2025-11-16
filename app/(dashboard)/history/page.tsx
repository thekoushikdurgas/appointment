'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ExportHistory } from '@/types/index';
import { listExports, downloadExport, ExportListItem } from '@services/export';
import { Card, CardContent } from '@components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { Button } from '@components/ui/Button';
import { HistoryIcon, TableIcon, CalendarIcon, DownloadIcon, CheckIcon, ClockIcon, ErrorIcon, LoadingSpinner, RefreshIcon, ContactsIcon, BuildingIcon, SearchIcon } from '@components/icons/IconComponents';
import { Toast, ToastContainer, ToastProps } from '@components/ui/Toast';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';

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

// Map API status to UI status
const mapStatus = (apiStatus: string): ExportHistory['status'] => {
  switch (apiStatus.toLowerCase()) {
    case 'completed':
      return 'Completed';
    case 'processing':
    case 'pending':
      return 'Processing';
    case 'failed':
      return 'Failed';
    default:
      return 'Processing';
  }
};

// Map ExportListItem to ExportHistory
const mapExportToHistory = (exportItem: ExportListItem): ExportHistory & { exportType: 'contacts' | 'companies' } => {
  // Generate file name from export_id or use file_name if available
  const fileName = exportItem.file_name || `export_${exportItem.export_id}.csv`;
  
  // Format date
  const exportDate = new Date(exportItem.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  // Get record count based on export type
  const records = exportItem.export_type === 'contacts' 
    ? exportItem.contact_count 
    : exportItem.company_count;
  
  // Map status
  const status = mapStatus(exportItem.status);
  
  // Get download URL (may be null if expired or not completed)
  const downloadUrl = exportItem.download_url || '';
  
  return {
    id: parseInt(exportItem.export_id.replace(/-/g, '').substring(0, 10), 16) || 0, // Convert UUID to number for compatibility
    fileName,
    exportDate,
    records,
    status,
    downloadUrl,
    expiresAt: exportItem.expires_at || null,
    exportId: exportItem.export_id,
    exportType: exportItem.export_type,
  };
};

const HistoryPage: React.FC = () => {
    const [historyData, setHistoryData] = useState<(ExportHistory & { exportType?: 'contacts' | 'companies' })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<keyof ExportHistory | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [toasts, setToasts] = useState<ToastProps[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'contacts' | 'companies'>('all');
    const [refreshing, setRefreshing] = useState(false);

    // Fetch exports on mount
    useEffect(() => {
        loadExports();
    }, []);

    // Auto-refresh for processing exports
    useEffect(() => {
        const hasProcessing = historyData.some(item => item.status === 'Processing');
        if (hasProcessing) {
            const interval = setInterval(() => {
                loadExports(true);
            }, 5000); // Refresh every 5 seconds if there are processing exports
            
            return () => clearInterval(interval);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [historyData]);

    const loadExports = async (showRefreshing = false) => {
        if (showRefreshing) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        
        try {
            const result = await listExports();
            
            if (result.success && result.data) {
                const mappedExports = result.data.exports.map(mapExportToHistory);
                setHistoryData(mappedExports);
            } else {
                setError(result.message || 'Failed to load export history');
                setHistoryData([]);
            }
        } catch (err) {
            console.error('Error loading exports:', err);
            setError('An unexpected error occurred while loading export history');
            setHistoryData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const showToast = (title: string, description?: string, variant: ToastProps['variant'] = 'default') => {
        const id = `toast-${Date.now()}`;
        const newToast: ToastProps = {
            id,
            title,
            description,
            variant,
            duration: variant === 'error' ? 7000 : 5000,
            onClose: (toastId) => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
            },
        };
        setToasts(prev => [...prev, newToast]);
    };

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

    // Filter and sort history
    const filteredAndSortedHistory = useMemo(() => {
        let filtered = [...historyData];
        
        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(item => item.exportType === filterType);
        }
        
        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                item.fileName.toLowerCase().includes(searchLower) ||
                item.exportDate.toLowerCase().includes(searchLower) ||
                (item.exportId && item.exportId.toLowerCase().includes(searchLower))
            );
        }
        
        // Apply sorting
        if (sortField && sortDirection) {
            filtered.sort((a, b) => {
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
        }
        
        return filtered;
    }, [historyData, filterType, searchTerm, sortField, sortDirection]);
    
    // Calculate summary stats
    const summaryStats = useMemo(() => {
        const total = historyData.length;
        const contacts = historyData.filter(item => item.exportType === 'contacts').length;
        const companies = historyData.filter(item => item.exportType === 'companies').length;
        const completed = historyData.filter(item => item.status === 'Completed').length;
        const totalRecords = historyData.reduce((sum, item) => sum + item.records, 0);
        
        return { total, contacts, companies, completed, totalRecords };
    }, [historyData]);

    const handleDownload = async (exportItem: ExportHistory) => {
        if (isExportExpired(exportItem)) {
            showToast('Download Unavailable', 'This export has expired and is no longer available for download', 'error');
            return;
        }

        if (!exportItem.downloadUrl) {
            showToast('Download Unavailable', 'This export is no longer available for download', 'error');
            return;
        }

        setDownloadingId(exportItem.fileName);

        try {
            // Parse the download URL to extract export_id and token
            const downloadUrl = new URL(exportItem.downloadUrl);
            // Extract export_id from pathname: /api/v2/exports/{export_id}/download
            const pathParts = downloadUrl.pathname.split('/').filter(part => part);
            const downloadIndex = pathParts.indexOf('download');
            const exportId = downloadIndex > 0 ? pathParts[downloadIndex - 1] : '';
            const token = downloadUrl.searchParams.get('token') || '';

            if (!exportId || !token) {
                throw new Error('Invalid download URL');
            }

            const result = await downloadExport(exportId, token);

            if (result.success && result.data) {
                // Create download link
                const blobUrl = URL.createObjectURL(result.data);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = exportItem.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);

                showToast('Download Complete', 'Export downloaded successfully', 'success');
            } else {
                showToast('Download Failed', result.message || 'Failed to download export', 'error');
            }
        } catch (error: any) {
            console.error('Download error:', error);
            const errorMessage = error.message || 'An unexpected error occurred while downloading the export';
            showToast('Download Failed', errorMessage, 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    const isExportExpired = (exportItem: ExportHistory): boolean => {
        // Check if downloadUrl is null/empty (indicates expired or not available)
        if (!exportItem.downloadUrl || exportItem.downloadUrl === '') {
            return true;
        }
        
        // Check expires_at if available
        if (exportItem.expiresAt) {
            const expiresAt = new Date(exportItem.expiresAt);
            const now = new Date();
            return now > expiresAt;
        }
        
        return false;
    };

    return (
        <>
            <ToastContainer toasts={toasts} position="top-right" />
            <div className="history-page">
                <div className="history-page-header">
                    <div className="history-page-icon-wrapper">
                        <HistoryIcon className="history-page-icon" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h1 className="history-page-title">Export History</h1>
                        <p className="history-page-description">View and download your exported files</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadExports(true)}
                        disabled={refreshing}
                        leftIcon={refreshing ? <LoadingSpinner size="sm" /> : <RefreshIcon />}
                    >
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                </div>

                {/* Summary Stats */}
                {!loading && historyData.length > 0 && (
                    <div className="history-summary" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                        gap: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <Card>
                            <CardContent style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Total Exports</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-semibold)' }}>{summaryStats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Contacts</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-semibold)' }}>{summaryStats.contacts}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Companies</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-semibold)' }}>{summaryStats.companies}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent style={{ padding: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.25rem' }}>Total Records</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--font-weight-semibold)' }}>{summaryStats.totalRecords.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                {!loading && historyData.length > 0 && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        marginBottom: '1.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                    }}>
                        <Input
                            placeholder="Search exports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<SearchIcon />}
                            style={{ flex: '1', minWidth: '200px' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button
                                variant={filterType === 'all' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilterType('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filterType === 'contacts' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilterType('contacts')}
                                leftIcon={<ContactsIcon />}
                            >
                                Contacts
                            </Button>
                            <Button
                                variant={filterType === 'companies' ? 'primary' : 'outline'}
                                size="sm"
                                onClick={() => setFilterType('companies')}
                                leftIcon={<BuildingIcon />}
                            >
                                Companies
                            </Button>
                        </div>
                    </div>
                )}

                <Card>
                    <CardContent className="card-padding-none">
                        {loading ? (
                            <div className="history-loading">
                                <LoadingSpinner size="lg" />
                                <p>Loading export history...</p>
                            </div>
                        ) : error ? (
                            <div className="history-error">
                                <ErrorIcon />
                                <p className="history-error-message">{error}</p>
                                <Button variant="primary" onClick={() => loadExports()}>
                                    Try Again
                                </Button>
                            </div>
                        ) : (
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
                                        <TableHead>
                                            <div className="history-table-head-content">
                                                Type
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
                                    {filteredAndSortedHistory.length > 0 ? (
                                        filteredAndSortedHistory.map(item => {
                                            const expired = isExportExpired(item);
                                            const isDownloading = downloadingId === item.fileName;
                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="history-table-cell-content">
                                                            <TableIcon className="history-table-cell-icon" />
                                                            <span className="history-table-cell-text">{item.fileName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.exportType === 'contacts' ? (
                                                            <Badge variant="glass-primary" size="sm">
                                                                <ContactsIcon className="history-badge-icon" />
                                                                Contacts
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="glass" size="sm">
                                                                <BuildingIcon className="history-badge-icon" />
                                                                Companies
                                                            </Badge>
                                                        )}
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
                                                        {item.status === 'Completed' && !expired && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                leftIcon={isDownloading ? <LoadingSpinner size="sm" /> : <DownloadIcon />}
                                                                onClick={() => handleDownload(item)}
                                                                disabled={isDownloading}
                                                            >
                                                                {isDownloading ? 'Downloading...' : 'Download'}
                                                            </Button>
                                                        )}
                                                        {expired && item.status === 'Completed' && (
                                                            <span className="history-expired-text">Expired</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="history-table-empty">
                                                <div className="history-empty-state">
                                                    <HistoryIcon className="history-empty-icon" />
                                                    <p className="history-empty-title">
                                                        {searchTerm || filterType !== 'all' 
                                                            ? 'No exports match your filters' 
                                                            : 'No export history found'}
                                                    </p>
                                                    <p className="history-empty-description">
                                                        {searchTerm || filterType !== 'all'
                                                            ? 'Try adjusting your search or filters'
                                                            : 'Your export history will appear here'}
                                                    </p>
                                                    {(searchTerm || filterType !== 'all') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setFilterType('all');
                                                            }}
                                                            style={{ marginTop: '1rem' }}
                                                        >
                                                            Clear Filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default HistoryPage;
