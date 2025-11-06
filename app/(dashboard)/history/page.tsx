'use client';

import React from 'react';
import { ExportHistory } from '../../../types/index';
import { MOCK_EXPORT_HISTORY } from '../../../utils/constants';

const StatusBadge: React.FC<{ status: ExportHistory['status'] }> = ({ status }) => {
  const baseClasses = "px-3 py-1 text-xs font-medium rounded-full inline-block whitespace-nowrap";
  const statusClasses = {
    Completed: "bg-green-400/20 text-green-500",
    Processing: "bg-blue-400/20 text-blue-500",
    Failed: "bg-red-400/20 text-red-500",
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};


const HistoryPage: React.FC = () => {
    const historyData: ExportHistory[] = MOCK_EXPORT_HISTORY;

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md border border-border">
            <h1 className="text-3xl font-bold mb-6 text-card-foreground">Export History</h1>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-secondary">
                        <tr>
                            <th className="p-4 font-semibold text-muted-foreground">File Name</th>
                            <th className="p-4 font-semibold text-muted-foreground hidden md:table-cell">Export Date</th>
                            <th className="p-4 font-semibold text-muted-foreground hidden sm:table-cell">Records</th>
                            <th className="p-4 font-semibold text-muted-foreground">Status</th>
                            <th className="p-4 font-semibold text-muted-foreground"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyData.length > 0 ? (
                            historyData.map(item => (
                                <tr key={item.id} className="border-b border-border hover:bg-secondary">
                                    <td className="p-4 text-card-foreground font-medium">{item.fileName}</td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">{item.exportDate}</td>
                                    <td className="p-4 text-card-foreground hidden sm:table-cell">{item.records.toLocaleString()}</td>
                                    <td className="p-4">
                                        <StatusBadge status={item.status} />
                                    </td>
                                    <td className="p-4 text-right">
                                        {item.status === 'Completed' && (
                                            <a 
                                                href={item.downloadUrl}
                                                download
                                                className="text-primary-500 hover:underline font-medium whitespace-nowrap"
                                                onClick={(e) => {
                                                    // This is a mock, so we prevent default action
                                                    e.preventDefault();
                                                    alert(`Downloading ${item.fileName}...`);
                                                }}
                                            >
                                                Download
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-muted-foreground">
                                    No export history found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryPage;


