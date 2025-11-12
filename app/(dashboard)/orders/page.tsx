'use client';

import React, { useState } from 'react';
import { Order } from '../../../types/index';
import { MOCK_ORDERS } from '../../../utils/constants';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { OrdersIcon, UsersIcon, TagIcon, CalendarIcon, DollarIcon, CheckIcon, ClockIcon, XIcon } from '../../../components/icons/IconComponents';
import { cn } from '../../../utils/cn';

const StatusBadge: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const statusConfig = {
    Completed: {
      className: "bg-success/20 text-success border-success/30",
      icon: <CheckIcon className="w-3 h-3" />,
    },
    Processing: {
      className: "bg-info/20 text-info border-info/30",
      icon: <ClockIcon className="w-3 h-3" />,
    },
    Cancelled: {
      className: "bg-error/20 text-error border-error/30",
      icon: <XIcon className="w-3 h-3" />,
    },
  };
  
  const config = statusConfig[status];
  
  const badgeClasses = {
    Completed: "badge badge-success",
    Processing: "badge badge-primary",
    Cancelled: "badge badge-error",
  };
  
  return (
    <span className={cn("badge inline-flex items-center gap-1.5 border", badgeClasses[status])}>
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
        <div className="flex flex-col gap-6 w-full max-w-full">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <OrdersIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Orders</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage and track all your orders</p>
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
                                    <div className="flex items-center gap-2">
                                        <TagIcon className="w-4 h-4" />
                                        Order ID
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'customerName' ? sortDirection : null}
                                    onSort={() => handleSort('customerName')}
                                >
                                    <div className="flex items-center gap-2">
                                        <UsersIcon className="w-4 h-4" />
                                        Customer
                                    </div>
                                </TableHead>
                                <TableHead className="hidden lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        <TagIcon className="w-4 h-4" />
                                        Product
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'orderDate' ? sortDirection : null}
                                    onSort={() => handleSort('orderDate')}
                                    className="hidden md:table-cell"
                                >
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4" />
                                        Date
                                    </div>
                                </TableHead>
                                <TableHead 
                                    sortable 
                                    sortDirection={sortField === 'amount' ? sortDirection : null}
                                    onSort={() => handleSort('amount')}
                                    className="hidden sm:table-cell"
                                >
                                    <div className="flex items-center gap-2">
                                        <DollarIcon className="w-4 h-4" />
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
                                            <span className="font-mono text-sm text-primary font-medium">
                                                {order.id}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <UsersIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">{order.customerName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <TagIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{order.productName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{order.orderDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <DollarIcon className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-semibold">${order.amount.toFixed(2)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={order.status} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <div className="flex flex-col items-center gap-3">
                                            <OrdersIcon className="w-12 h-12 text-muted-foreground/50" />
                                            <p className="text-muted-foreground font-medium">No orders found</p>
                                            <p className="text-sm text-muted-foreground/80">Orders will appear here when available</p>
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


