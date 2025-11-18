'use client';

import React, { useState } from 'react';
import { Order } from '@/types/index';
import { MOCK_ORDERS } from '@utils/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@components/ui/Table';
import { OrdersIcon, UsersIcon, TagIcon, CalendarIcon, DollarIcon, CheckIcon, ClockIcon, XIcon } from '@components/icons';

const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const statusConfig = {
    Completed: {
      icon: <CheckIcon />,
    },
    Processing: {
      icon: <ClockIcon />,
    },
    Cancelled: {
      icon: <XIcon />,
    },
  };
  
  const config = statusConfig[status];
  
  const badgeClasses = {
    Completed: "badge badge-success",
    Processing: "badge badge-primary",
    Cancelled: "badge badge-error",
  };
  
  return (
    <span className={`badge ${badgeClasses[status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', border: '1px solid' }}>
      {config.icon}
      {status}
    </span>
  );
};

const OrdersPage: React.FC = () => {
    const [ordersData] = useState<Order[]>(MOCK_ORDERS);
    const [sortField, setSortField] = useState<keyof Order | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

    const handleSort = (field: keyof Order) => {
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

    const sortedOrders = [...ordersData].sort((a, b) => {
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

    return (
        <div className="orders-page">
            <div className="orders-page-header">
                <div className="orders-page-icon-wrapper">
                    <OrdersIcon className="orders-page-icon" />
                </div>
                <div>
                    <h1 className="orders-page-title">Orders</h1>
                    <p className="orders-page-description">Manage and track all your orders</p>
                </div>
            </div>

            <Card>
                <CardContent className="card-padding-none">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'id' ? sortDirection : null}
                                    onSort={() => handleSort('id')}
                                >
                                    <div className="orders-table-header-content">
                                        <TagIcon className="orders-table-header-icon" />
                                        Order ID
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'customerName' ? sortDirection : null}
                                    onSort={() => handleSort('customerName')}
                                >
                                    <div className="orders-table-header-content">
                                        <UsersIcon className="orders-table-header-icon" />
                                        Customer
                                    </div>
                                </TableHead>
                                <TableHead className="orders-table-head--hidden-lg">
                                    <div className="orders-table-header-content">
                                        <TagIcon className="orders-table-header-icon" />
                                        Product
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'orderDate' ? sortDirection : null}
                                    onSort={() => handleSort('orderDate')}
                                    className="orders-table-head--hidden-md"
                                >
                                    <div className="orders-table-header-content">
                                        <CalendarIcon className="orders-table-header-icon" />
                                        Date
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'amount' ? sortDirection : null}
                                    onSort={() => handleSort('amount')}
                                    className="orders-table-head--hidden-sm"
                                >
                                    <div className="orders-table-header-content">
                                        <DollarIcon className="orders-table-header-icon" />
                                        Amount
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'status' ? sortDirection : null}
                                    onSort={() => handleSort('status')}
                                >
                                    Status
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedOrders.length > 0 ? (
                                sortedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <span className="orders-table-order-id">
                                                {order.id}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="orders-table-cell-content">
                                                <UsersIcon className="orders-table-cell-icon" />
                                                <span className="orders-table-cell-text">{order.customerName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="orders-table-cell--hidden-lg">
                                            <div className="orders-table-cell-content">
                                                <TagIcon className="orders-table-cell-icon" />
                                                <span className="orders-table-cell-text orders-table-cell-text--muted">{order.productName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="orders-table-cell--hidden-md">
                                            <div className="orders-table-cell-content">
                                                <CalendarIcon className="orders-table-cell-icon" />
                                                <span className="orders-table-cell-text orders-table-cell-text--muted">{order.orderDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="orders-table-cell--hidden-sm">
                                            <div className="orders-table-cell-content">
                                                <DollarIcon className="orders-table-cell-icon" />
                                                <span className="orders-table-cell-text orders-table-cell-text--bold">${order.amount.toFixed(2)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={order.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="orders-table-empty">
                                        <div className="orders-empty-state">
                                            <OrdersIcon className="orders-empty-icon" />
                                            <p className="orders-empty-title">No orders found</p>
                                            <p className="orders-empty-description">Orders will appear here when available</p>
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

export default OrdersPage;


